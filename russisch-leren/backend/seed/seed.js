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

// Adds lesson content (categories, words, grammar rules, exercises) that
// doesn't exist yet, and refreshes the text of rows that do -- without ever
// touching `attempts` or `user_word_progress`. That makes it safe to run on
// every boot, including against a database that already has real accounts
// and real progress in it: existing categories/words/grammar rules keep
// their ids (matched by their natural key: slug, (category, russian word),
// and code respectively), so progress rows that reference those ids by
// foreign key stay valid. This is also how new content added to the seed
// data files reaches an already-provisioned install -- there's no separate
// migration step.
function seedDatabase() {
  const run = db.transaction(() => {
    const upsertRule = db.prepare(`
      INSERT INTO grammar_rules (code, title, explanation, example)
      VALUES (@code, @title, @explanation, @example)
      ON CONFLICT(code) DO UPDATE SET
        title = excluded.title, explanation = excluded.explanation, example = excluded.example
    `);
    for (const rule of grammarRules) upsertRule.run(rule);
    const ruleIdByCode = {};
    for (const row of db.prepare('SELECT id, code FROM grammar_rules').all()) {
      ruleIdByCode[row.code] = row.id;
    }

    const upsertCategory = db.prepare(`
      INSERT INTO categories (slug, name, description, level, sort_order)
      VALUES (@slug, @name, @description, @level, @sort_order)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name, description = excluded.description,
        level = excluded.level, sort_order = excluded.sort_order
    `);
    for (const cat of categories) upsertCategory.run(cat);
    const categoryIdBySlug = {};
    for (const row of db.prepare('SELECT id, slug FROM categories').all()) {
      categoryIdBySlug[row.slug] = row.id;
    }

    const findWord = db.prepare('SELECT id FROM words WHERE category_id = ? AND russian = ?');
    const insertWord = db.prepare(`
      INSERT INTO words (category_id, russian, transliteration, translation_nl, gender, notes, grammar_rule_id)
      VALUES (@category_id, @russian, @transliteration, @translation_nl, @gender, @notes, @grammar_rule_id)
    `);
    const updateWord = db.prepare(`
      UPDATE words SET transliteration = @transliteration, translation_nl = @translation_nl,
        gender = @gender, notes = @notes, grammar_rule_id = @grammar_rule_id
      WHERE id = @id
    `);

    // Group resolved words by category for distractor generation, keyed by
    // their real (possibly pre-existing) database id.
    const wordsByCategory = {};
    const resolvedWords = [];
    for (const w of words) {
      const category_id = categoryIdBySlug[w.category];
      if (!category_id) throw new Error(`Unknown category slug: ${w.category}`);
      const grammar_rule_id = w.grammarRule ? ruleIdByCode[w.grammarRule] : null;
      const params = {
        category_id,
        russian: w.russian,
        transliteration: w.transliteration || null,
        translation_nl: w.translation_nl,
        gender: w.gender || null,
        notes: w.notes || null,
        grammar_rule_id
      };
      const existing = findWord.get(category_id, w.russian);
      const id = existing
        ? (updateWord.run({ ...params, id: existing.id }), existing.id)
        : insertWord.run(params).lastInsertRowid;
      const record = { id, category_id, ...w };
      resolvedWords.push(record);
      wordsByCategory[w.category] = wordsByCategory[w.category] || [];
      wordsByCategory[w.category].push(record);
    }

    // Word-linked exercises (mc_ru_nl/mc_nl_ru) are deduped per (word_id, type):
    // the same word in two different categories (e.g. a word repeated for a
    // grammar lesson) must get its own exercise for each, or one category's
    // lesson silently loses that flashcard. Exercises with no word_id
    // (hand-crafted grammar exercises, sentence_build) have no such natural
    // key, so they're deduped on their (unique, hand-authored) prompt text.
    const findWordExercise = db.prepare('SELECT id FROM exercises WHERE word_id = ? AND type = ?');
    const findTextExercise = db.prepare('SELECT id FROM exercises WHERE word_id IS NULL AND type = ? AND prompt = ? AND correct_answer = ?');
    const insertExercise = db.prepare(`
      INSERT INTO exercises (category_id, word_id, grammar_rule_id, type, prompt, correct_answer, options, explanation)
      VALUES (@category_id, @word_id, @grammar_rule_id, @type, @prompt, @correct_answer, @options, @explanation)
    `);
    function addExerciseIfNew(ex) {
      const exists = ex.word_id != null
        ? findWordExercise.get(ex.word_id, ex.type)
        : findTextExercise.get(ex.type, ex.prompt, ex.correct_answer);
      if (exists) return;
      insertExercise.run(ex);
    }

    // Auto-generate vocab exercises (RU->NL and NL->RU multiple choice) for
    // every word. Existing words already have theirs (matched by prompt),
    // so this only adds exercises for words that are new this run.
    for (const w of resolvedWords) {
      const siblings = wordsByCategory[w.category].filter((s) => s.id !== w.id);
      if (siblings.length < 2) continue; // need enough distractors in this category

      const nlDistractors = pickDistractors(siblings.map((s) => s.translation_nl), w.translation_nl, 3);
      const ruDistractors = pickDistractors(siblings.map((s) => s.russian), w.russian, 3);
      const grammar_rule_id = w.grammarRule ? ruleIdByCode[w.grammarRule] : null;

      if (nlDistractors.length >= 2) {
        const options = shuffle([w.translation_nl, ...nlDistractors]);
        addExerciseIfNew({
          category_id: w.category_id,
          word_id: w.id,
          grammar_rule_id,
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
        addExerciseIfNew({
          category_id: w.category_id,
          word_id: w.id,
          grammar_rule_id,
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
      addExerciseIfNew({
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
      addExerciseIfNew({
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
