const db = require('../src/db');
const categories = require('./data/categories');
const grammarRules = require('./data/grammarRules');
const words = require('./data/words');
const grammarExercises = require('./data/grammarExercises');
const practicalSentences = require('./data/practicalSentences');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(pool, excludeValue, count) {
  const candidates = shuffle(pool.filter((v) => v !== excludeValue));
  return candidates.slice(0, count);
}

function seedDatabase() {
  const run = db.transaction(() => {
    // Wipe existing seeded content (safe to re-run)
    db.exec(`
      DELETE FROM attempts;
      DELETE FROM user_word_progress;
      DELETE FROM exercises;
      DELETE FROM words;
      DELETE FROM categories;
      DELETE FROM grammar_rules;
    `);

    const insertRule = db.prepare(
      'INSERT INTO grammar_rules (code, title, explanation, example) VALUES (@code, @title, @explanation, @example)'
    );
    const ruleIdByCode = {};
    for (const rule of grammarRules) {
      const info = insertRule.run(rule);
      ruleIdByCode[rule.code] = info.lastInsertRowid;
    }

    const insertCategory = db.prepare(
      'INSERT INTO categories (slug, name, description, level, sort_order) VALUES (@slug, @name, @description, @level, @sort_order)'
    );
    const categoryIdBySlug = {};
    for (const cat of categories) {
      const info = insertCategory.run(cat);
      categoryIdBySlug[cat.slug] = info.lastInsertRowid;
    }

    const insertWord = db.prepare(`
      INSERT INTO words (category_id, russian, transliteration, translation_nl, gender, notes, grammar_rule_id)
      VALUES (@category_id, @russian, @transliteration, @translation_nl, @gender, @notes, @grammar_rule_id)
    `);

    // Group inserted words by category for distractor generation
    const wordsByCategory = {};
    const insertedWords = [];
    for (const w of words) {
      const category_id = categoryIdBySlug[w.category];
      if (!category_id) throw new Error(`Unknown category slug: ${w.category}`);
      const grammar_rule_id = w.grammarRule ? ruleIdByCode[w.grammarRule] : null;
      const info = insertWord.run({
        category_id,
        russian: w.russian,
        transliteration: w.transliteration || null,
        translation_nl: w.translation_nl,
        gender: w.gender || null,
        notes: w.notes || null,
        grammar_rule_id
      });
      const record = { id: info.lastInsertRowid, category_id, ...w };
      insertedWords.push(record);
      wordsByCategory[w.category] = wordsByCategory[w.category] || [];
      wordsByCategory[w.category].push(record);
    }

    const insertExercise = db.prepare(`
      INSERT INTO exercises (category_id, word_id, grammar_rule_id, type, prompt, correct_answer, options, explanation)
      VALUES (@category_id, @word_id, @grammar_rule_id, @type, @prompt, @correct_answer, @options, @explanation)
    `);

    // Auto-generate vocab exercises (RU->NL and NL->RU multiple choice) for every word
    for (const w of insertedWords) {
      const siblings = wordsByCategory[w.category].filter((s) => s.id !== w.id);
      if (siblings.length < 2) continue; // need enough distractors in this category

      const nlDistractors = pickDistractors(siblings.map((s) => s.translation_nl), w.translation_nl, 3);
      const ruDistractors = pickDistractors(siblings.map((s) => s.russian), w.russian, 3);
      if (nlDistractors.length >= 2) {
        const options = shuffle([w.translation_nl, ...nlDistractors]);
        insertExercise.run({
          category_id: w.category_id,
          word_id: w.id,
          grammar_rule_id: w.grammarRule ? ruleIdByCode[w.grammarRule] : null,
          type: 'mc_ru_nl',
          prompt: `Wat betekent '${w.russian}'${w.transliteration ? ` (${w.transliteration})` : ''}?`,
          correct_answer: w.translation_nl,
          options: JSON.stringify(options),
          explanation:
            `'${w.russian}'${w.transliteration ? ` (${w.transliteration})` : ''} betekent '${w.translation_nl}'.` +
            (w.notes ? ` ${w.notes}` : '')
        });
      }
      if (ruDistractors.length >= 2) {
        const options = shuffle([w.russian, ...ruDistractors]);
        insertExercise.run({
          category_id: w.category_id,
          word_id: w.id,
          grammar_rule_id: w.grammarRule ? ruleIdByCode[w.grammarRule] : null,
          type: 'mc_nl_ru',
          prompt: `Hoe zeg je '${w.translation_nl}' in het Russisch?`,
          correct_answer: w.russian,
          options: JSON.stringify(options),
          explanation:
            `'${w.translation_nl}' is in het Russisch '${w.russian}'${w.transliteration ? ` (${w.transliteration})` : ''}.` +
            (w.notes ? ` ${w.notes}` : '')
        });
      }
    }

    // Hand-crafted grammar exercises
    for (const ex of grammarExercises) {
      const category_id = categoryIdBySlug[ex.category];
      const grammar_rule_id = ruleIdByCode[ex.grammarRule];
      if (!category_id || !grammar_rule_id) throw new Error(`Bad grammar exercise reference: ${JSON.stringify(ex)}`);
      insertExercise.run({
        category_id,
        word_id: null,
        grammar_rule_id,
        type: ex.type,
        prompt: ex.prompt,
        correct_answer: ex.correctAnswer,
        options: JSON.stringify(ex.options),
        explanation: ex.explanation
      });
    }

    // Practical sentence-building exercises
    const practicalCategoryId = categoryIdBySlug['praktische-zinnen'];
    if (!practicalCategoryId) throw new Error("Missing category 'praktische-zinnen' for practical sentences");
    for (const sentence of practicalSentences) {
      insertExercise.run({
        category_id: practicalCategoryId,
        word_id: null,
        grammar_rule_id: null,
        type: 'sentence_build',
        prompt: sentence.prompt,
        correct_answer: sentence.tokens.join(' '),
        options: JSON.stringify(shuffle(sentence.tokens)),
        explanation: sentence.explanation
      });
    }
  });

  run();

  return {
    categories: db.prepare('SELECT COUNT(*) c FROM categories').get().c,
    words: db.prepare('SELECT COUNT(*) c FROM words').get().c,
    exercises: db.prepare('SELECT COUNT(*) c FROM exercises').get().c,
    grammar_rules: db.prepare('SELECT COUNT(*) c FROM grammar_rules').get().c
  };
}

if (require.main === module) {
  console.log('Seed complete:', seedDatabase());
}

module.exports = { seedDatabase };
