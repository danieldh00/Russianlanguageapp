const db = require('../src/db');
const data = require('./data');
const { transliterate, stripStress } = require('./data/translit');

const { categories, grammarRules, words, grammarExercises, practicalSentences, readings, forms, examples, pictures } = data;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(pool, excludeValue, count) {
  const candidates = shuffle([...new Set(pool.filter((v) => v && v !== excludeValue))]);
  return candidates.slice(0, count);
}

// Finds the word inside its example sentence -- usually in a declined or
// conjugated form (вода -> воду, читать -> читаю) -- and blanks it out.
// Match on the longest shared prefix with the headword, which is how
// Russian inflection works (the stem stays, the ending changes). Returns
// null when no token is convincingly the same word.
function buildCloze(word, sentence) {
  const bare = (s) => stripStress(s).toLowerCase().replace(/ё/g, 'е');
  const target = bare(word);
  if (target.length < 3) return null;
  const tokens = sentence.split(/(\s+)/); // keep separators so we can rebuild the sentence
  let best = null;
  tokens.forEach((raw, i) => {
    if (/^\s*$/.test(raw)) return;
    const core = raw.replace(/^[«"'(\[—–-]+|[»"'),.!?;:\]…—–-]+$/g, '');
    if (!core) return;
    const t = bare(core);
    let common = 0;
    while (common < t.length && common < target.length && t[common] === target[common]) common++;
    const needed = Math.max(3, Math.min(t.length, target.length) - 3);
    if (t === target || common >= needed) {
      const score = t === target ? 1000 : common;
      if (!best || score > best.score) best = { i, core, score };
    }
  });
  if (!best) return null;
  const rebuilt = tokens.map((raw, i) => (i === best.i ? raw.replace(best.core, '___') : raw)).join('');
  return { token: best.core, blanked: rebuilt };
}

// "Where is the stress?" -- the word with the acute placed on each vowel in
// turn; the real accented form is the answer. Russian stress is free and
// unmarked in normal text, so it has to be learned per word; this drills
// exactly that, and the feedback plays the word so you hear it.
const VOWELS = 'аеёиоуыэюя';
function buildStress(accented) {
  const nfc = accented.normalize('NFC');
  if ((nfc.match(/́/g) || []).length !== 1 || /[\s,\/]/.test(nfc)) return null;
  const bare = nfc.replace(/́/g, '');
  const chars = [...bare];
  const vowelIdx = chars.map((c, i) => (VOWELS.includes(c.toLowerCase()) ? i : -1)).filter((i) => i >= 0);
  if (vowelIdx.length < 2) return null;
  const variants = vowelIdx.map((i) => chars.slice(0, i + 1).join('') + '́' + chars.slice(i + 1).join(''));
  const correctIdx = variants.indexOf(nfc);
  if (correctIdx === -1) return null;
  // at most 4 options: the answer plus its nearest neighbours
  const keep = variants.map((v, i) => ({ v, d: Math.abs(i - correctIdx) })).sort((a, b) => a.d - b.d).slice(0, 4).map((x) => x.v);
  return { bare, correct: nfc, options: shuffle(keep), syllable: correctIdx + 1, syllables: vowelIdx.length, hasYo: bare.includes('ё'), unstressedO: chars.some((c, i) => c === 'о' && i !== vowelIdx[correctIdx]) };
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
    for (const rule of grammarRules) upsertRule.run({ example: null, ...rule });
    const ruleIdByCode = {};
    for (const row of db.prepare('SELECT id, code FROM grammar_rules').all()) {
      ruleIdByCode[row.code] = row.id;
    }
    const ruleId = (code, ctx) => {
      if (!code) return null;
      if (!ruleIdByCode[code]) throw new Error(`Unknown grammar rule code '${code}' in ${ctx}`);
      return ruleIdByCode[code];
    };

    const upsertCategory = db.prepare(`
      INSERT INTO categories (slug, name, description, level, sort_order)
      VALUES (@slug, @name, @description, @level, @sort_order)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name, description = excluded.description,
        level = excluded.level, sort_order = excluded.sort_order
    `);
    for (const cat of categories) upsertCategory.run({ description: null, ...cat });
    const categoryIdBySlug = {};
    const categoryLevelBySlug = {};
    for (const row of db.prepare('SELECT id, slug, level FROM categories').all()) {
      categoryIdBySlug[row.slug] = row.id;
      categoryLevelBySlug[row.slug] = row.level;
    }
    const categoryId = (slug, ctx) => {
      if (!categoryIdBySlug[slug]) throw new Error(`Unknown category slug '${slug}' in ${ctx}`);
      return categoryIdBySlug[slug];
    };

    const findWord = db.prepare('SELECT id FROM words WHERE category_id = ? AND russian = ?');
    const insertWord = db.prepare(`
      INSERT INTO words (category_id, russian, transliteration, translation_nl, gender, notes, grammar_rule_id, accented, example_ru, example_nl)
      VALUES (@category_id, @russian, @transliteration, @translation_nl, @gender, @notes, @grammar_rule_id, @accented, @example_ru, @example_nl)
    `);
    const updateWord = db.prepare(`
      UPDATE words SET transliteration = @transliteration, translation_nl = @translation_nl,
        gender = @gender, notes = @notes, grammar_rule_id = @grammar_rule_id, accented = @accented,
        example_ru = @example_ru, example_nl = @example_nl
      WHERE id = @id
    `);

    // Group resolved words by category for distractor generation, keyed by
    // their real (possibly pre-existing) database id.
    const wordsByCategory = {};
    const resolvedWords = [];
    for (const w of words) {
      const category_id = categoryId(w.category, `word '${w.russian}'`);
      const level = categoryLevelBySlug[w.category];
      const morph = forms[w.russian.trim().toLowerCase()] || null;
      const accented = w.accented || (morph && morph.accented && morph.accented !== w.russian ? morph.accented : null);
      // example sentence: inline on the word entry, or from the per-level
      // examples files keyed by the Russian word (see data/examples/)
      const example = w.example || examples[w.russian] || null;
      const params = {
        example_ru: example ? example[0] : null,
        example_nl: example ? example[1] : null,
        category_id,
        russian: w.russian,
        transliteration: w.transliteration || transliterate(w.russian),
        translation_nl: w.translation_nl,
        gender: w.gender || (morph && morph.pos === 'noun' && morph.gender ? morph.gender : null),
        notes: w.notes || null,
        grammar_rule_id: ruleId(w.grammarRule, `word '${w.russian}'`),
        accented
      };
      const existing = findWord.get(category_id, w.russian);
      const id = existing
        ? (updateWord.run({ ...params, id: existing.id }), existing.id)
        : insertWord.run(params).lastInsertRowid;
      const record = { id, level, morph, ...params, category: w.category, grammarRule: w.grammarRule || null, picture: pictures[w.russian] || null };
      resolvedWords.push(record);
      wordsByCategory[w.category] = wordsByCategory[w.category] || [];
      wordsByCategory[w.category].push(record);
    }

    // Word-linked exercises (mc_ru_nl/mc_nl_ru/typing) are deduped per (word_id, type):
    // the same word in two different categories (e.g. a word repeated for a
    // grammar lesson) must get its own exercise for each, or one category's
    // lesson silently loses that flashcard. Exercises with no word_id
    // (hand-crafted grammar exercises, sentence_build, reading, listening,
    // generated drills) have no such natural key, so they're deduped on their
    // (unique) prompt text + answer.
    const findWordExercise = db.prepare(
      'SELECT id, grammar_rule_id, prompt, correct_answer, options, explanation, context FROM exercises WHERE word_id = ? AND type = ?'
    );
    const findTextExercise = db.prepare('SELECT id FROM exercises WHERE word_id IS NULL AND type = ? AND prompt = ? AND correct_answer = ?');
    const insertExercise = db.prepare(`
      INSERT INTO exercises (category_id, word_id, grammar_rule_id, type, prompt, correct_answer, options, explanation, context)
      VALUES (@category_id, @word_id, @grammar_rule_id, @type, @prompt, @correct_answer, @options, @explanation, @context)
    `);
    const updateExercise = db.prepare(`
      UPDATE exercises SET grammar_rule_id = @grammar_rule_id, prompt = @prompt, correct_answer = @correct_answer,
        options = @options, explanation = @explanation, context = @context
      WHERE id = @id
    `);
    const sortedOptions = (json) => (json ? JSON.stringify([...JSON.parse(json)].sort()) : null);
    function addExerciseIfNew(ex) {
      const full = { word_id: null, grammar_rule_id: null, options: null, context: null, ...ex };
      if (full.word_id == null) {
        if (findTextExercise.get(full.type, full.prompt, full.correct_answer)) return false;
        insertExercise.run(full);
        return true;
      }
      // Word-linked exercises keep their id (attempts reference it) but their
      // wording follows the seed data: when a word's translation/notes or the
      // prompt template changes, the live exercise is rewritten in place
      // instead of staying frozen at whatever the first seed produced.
      // Options are compared order-insensitively so the per-run shuffle
      // doesn't count as a change.
      const existing = findWordExercise.get(full.word_id, full.type);
      if (!existing) {
        insertExercise.run(full);
        return true;
      }
      const changed =
        existing.prompt !== full.prompt ||
        existing.correct_answer !== full.correct_answer ||
        existing.explanation !== full.explanation ||
        existing.grammar_rule_id !== full.grammar_rule_id ||
        (existing.context || null) !== (full.context || null) ||
        sortedOptions(existing.options) !== sortedOptions(full.options);
      if (changed) updateExercise.run({ ...full, id: existing.id });
      return false;
    }

    // Alphabet entries look like "В в": one letter, upper + lower case. They
    // get their own prompt wording, and never show the transliteration in
    // the question -- for a letter the transliteration *is* the answer.
    const isLetter = (w) => /^\S \S$/u.test(w.russian.trim());

    // Auto-generate vocab exercises (RU->NL and NL->RU multiple choice, plus a
    // typed NL->RU exercise from B1 up) for every word. Existing words already
    // have theirs (matched per word), so this only adds exercises for words
    // that are new this run.
    for (const w of resolvedWords) {
      // multiple choice needs distractors from the same lesson; typing and
      // cloze don't, so a two-word lesson still gets its production exercises
      const siblings = wordsByCategory[w.category].filter((s) => s.id !== w.id);

      const letter = isLetter(w);
      const shown = letter
        ? w.russian
        : `${w.accented || w.russian}${w.transliteration ? ` (${w.transliteration})` : ''}`;
      const nlDistractors = pickDistractors(siblings.map((s) => s.translation_nl), w.translation_nl, 3);
      const ruDistractors = pickDistractors(siblings.map((s) => s.russian), w.russian, 3);
      const grammar_rule_id = ruleId(w.grammarRule, `word '${w.russian}'`);
      const notes = w.notes ? ` ${w.notes}` : '';

      if (nlDistractors.length >= 2) {
        addExerciseIfNew({
          category_id: w.category_id,
          word_id: w.id,
          grammar_rule_id,
          type: 'mc_ru_nl',
          prompt: letter ? `Hoe klinkt de letter '${shown}'?` : `Wat betekent '${shown}'?`,
          correct_answer: w.translation_nl,
          options: JSON.stringify(shuffle([w.translation_nl, ...nlDistractors])),
          explanation: (letter ? `'${shown}' klinkt ${w.translation_nl}.` : `'${shown}' betekent '${w.translation_nl}'.`) + notes
        });
      }
      if (ruDistractors.length >= 2) {
        addExerciseIfNew({
          category_id: w.category_id,
          word_id: w.id,
          grammar_rule_id,
          type: 'mc_nl_ru',
          prompt: letter ? `Welke letter klinkt ${w.translation_nl}?` : `Hoe zeg je '${w.translation_nl}' in het Russisch?`,
          correct_answer: w.russian,
          options: JSON.stringify(shuffle([w.russian, ...ruDistractors])),
          explanation: (letter ? `De letter '${shown}' klinkt ${w.translation_nl}.` : `'${w.translation_nl}' is in het Russisch '${shown}'.`) + notes
        });
      }
      // Production, from A1 up: type the word yourself, and fill it into its
      // example sentence in the form the sentence needs (cloze). Recognising
      // a word among four options is far easier than producing it; these two
      // are what make the vocabulary stick.
      const singleWord = !letter && !/\s/.test(w.russian.trim());
      if (singleWord) {
        addExerciseIfNew({
          category_id: w.category_id,
          word_id: w.id,
          grammar_rule_id,
          type: 'typing',
          prompt: `Typ in het Russisch: '${w.translation_nl}'`,
          correct_answer: w.russian,
          options: null,
          explanation: `'${w.translation_nl}' schrijf je als '${shown}'.` + (w.notes ? ` ${w.notes}` : '')
        });
      }
      // Picture exercises (Duolingo-style): the emoji is stored in `context`
      // and shown large above the prompt; the options are Russian words
      // (or, reversed, pictures). Distractors come from the other pictured
      // words in the same lesson, topped up from all pictured words.
      if (w.picture) {
        const sameLesson = siblings.filter((s) => s.picture && s.picture !== w.picture);
        const anyPictured = resolvedWords.filter((s) => s.id !== w.id && s.picture && s.picture !== w.picture && s.category !== w.category);
        const pool = sameLesson.length >= 3 ? sameLesson : [...sameLesson, ...shuffle(anyPictured).slice(0, 3 - sameLesson.length)];
        const wordDistractors = pickDistractors(pool.map((s) => s.russian), w.russian, 3);
        const seenPics = new Set();
        const picDistractors = pool.map((s) => s.picture).filter((p) => (seenPics.has(p) ? false : (seenPics.add(p), true))).slice(0, 3);
        if (wordDistractors.length >= 2) {
          addExerciseIfNew({
            category_id: w.category_id,
            word_id: w.id,
            grammar_rule_id,
            type: 'picture',
            prompt: 'Welk woord hoort bij het plaatje?',
            correct_answer: w.russian,
            options: JSON.stringify(shuffle([w.russian, ...wordDistractors])),
            explanation: `${w.picture} = '${shown}' (${w.translation_nl}).` + notes,
            context: w.picture
          });
        }
        if (picDistractors.length >= 2) {
          addExerciseIfNew({
            category_id: w.category_id,
            word_id: w.id,
            grammar_rule_id,
            type: 'picture_choice',
            prompt: `Welk plaatje hoort bij '${shown}'?`,
            correct_answer: w.picture,
            options: JSON.stringify(shuffle([w.picture, ...picDistractors])),
            explanation: `'${shown}' betekent '${w.translation_nl}': ${w.picture}.` + notes
          });
        }
      }

      const stress = singleWord && w.accented ? buildStress(w.accented) : null;
      if (stress && stress.options.length >= 2) {
        addExerciseIfNew({
          category_id: w.category_id,
          word_id: w.id,
          grammar_rule_id: ruleId('STRESS-PLACEMENT', `stress '${w.russian}'`),
          type: 'stress',
          prompt: `Waar ligt de klemtoon in '${stress.bare}' (${w.translation_nl})?`,
          correct_answer: stress.correct,
          options: JSON.stringify(stress.options),
          explanation:
            `${stress.correct}: klemtoon op lettergreep ${stress.syllable} van ${stress.syllables}.` +
            (stress.hasYo ? ' Onthoud: ё is altijd beklemtoond.' : '') +
            (stress.unstressedO ? " De onbeklemtoonde о klinkt als een korte 'a'." : '') +
            ' Luister en zeg het na: alleen de beklemtoonde lettergreep spreek je vol uit.'
        });
      }

      const example = w.example_ru ? [w.example_ru, w.example_nl || ''] : null;
      const cloze = singleWord && example ? buildCloze(w.russian, example[0]) : null;
      if (cloze) {
        addExerciseIfNew({
          category_id: w.category_id,
          word_id: w.id,
          grammar_rule_id,
          type: 'cloze',
          prompt: `Vul het ontbrekende woord in (${w.translation_nl}): ${cloze.blanked}`,
          correct_answer: cloze.token,
          options: null,
          explanation:
            `${example[0]} — ${example[1]}` +
            (cloze.token.toLowerCase() === w.russian.toLowerCase()
              ? ''
              : ` Hier staat '${cloze.token}': een vorm van '${w.russian}' die de zin vereist.`)
        });
      }
    }

    // Hand-crafted grammar exercises
    for (const ex of grammarExercises) {
      addExerciseIfNew({
        category_id: categoryId(ex.category, `grammar exercise '${ex.prompt}'`),
        word_id: null,
        grammar_rule_id: ruleId(ex.grammarRule, `grammar exercise '${ex.prompt}'`),
        type: ex.type,
        prompt: ex.prompt,
        correct_answer: ex.correctAnswer,
        options: ex.options ? JSON.stringify(ex.options) : null,
        explanation: ex.explanation,
        context: ex.context || null
      });
    }

    // Practical sentence-building exercises, plus a listening exercise per
    // sentence (the sentence is spoken aloud; pick its meaning).
    const sentencesByLevel = {};
    for (const sentence of practicalSentences) {
      const slug = sentence.category || 'praktische-zinnen';
      const level = categoryLevelBySlug[slug] || 'A2';
      sentencesByLevel[level] = sentencesByLevel[level] || [];
      sentencesByLevel[level].push({ ...sentence, slug });
    }
    for (const list of Object.values(sentencesByLevel)) {
      for (const sentence of list) {
        const category_id = categoryId(sentence.slug, `practical sentence '${sentence.prompt}'`);
        const russian = sentence.tokens.join(' ');
        addExerciseIfNew({
          category_id,
          type: 'sentence_build',
          prompt: sentence.prompt,
          correct_answer: russian,
          options: JSON.stringify(shuffle(sentence.tokens)),
          explanation: sentence.explanation,
          grammar_rule_id: ruleId(sentence.grammarRule, `practical sentence '${sentence.prompt}'`)
        });
        const distractors = pickDistractors(list.map((s) => s.prompt), sentence.prompt, 3);
        if (distractors.length >= 2) {
          addExerciseIfNew({
            category_id,
            type: 'listen',
            prompt: 'Luister naar de zin en kies de juiste betekenis.',
            correct_answer: sentence.prompt,
            options: JSON.stringify(shuffle([sentence.prompt, ...distractors])),
            explanation: `Je hoorde: '${russian}' — ${sentence.prompt} ${sentence.explanation}`,
            context: russian
          });
        }
      }
    }

    // Reading comprehension: a passage with one or more questions.
    for (const reading of readings) {
      const category_id = categoryId(reading.category, `reading '${reading.title}'`);
      for (const q of reading.questions) {
        addExerciseIfNew({
          category_id,
          type: 'reading',
          prompt: `[${reading.title}] ${q.prompt}`,
          correct_answer: q.correctAnswer,
          options: JSON.stringify(shuffle(q.options)),
          explanation: q.explanation,
          context: reading.passage,
          grammar_rule_id: ruleId(q.grammarRule, `reading '${reading.title}'`)
        });
      }
    }

    // Form drills generated from the Open Russian morphology tables, for the
    // levels that declare drill categories (see levels/<level>.js `drills`).
    generateDrills({ resolvedWords, categoryIdBySlug, categoryLevelBySlug, ruleId, addExerciseIfNew });
  });

  run();

  return {
    categories: db.prepare('SELECT COUNT(*) c FROM categories').get().c,
    words: db.prepare('SELECT COUNT(*) c FROM words').get().c,
    exercises: db.prepare('SELECT COUNT(*) c FROM exercises').get().c,
    grammar_rules: db.prepare('SELECT COUNT(*) c FROM grammar_rules').get().c
  };
}

const PERSONS = [
  ['presfut_sg1', 'я'], ['presfut_sg2', 'ты'], ['presfut_sg3', 'он/она'],
  ['presfut_pl1', 'мы'], ['presfut_pl2', 'вы'], ['presfut_pl3', 'они']
];
const CASES = [
  ['sg_gen', 'genitief (enkelvoud)'], ['sg_dat', 'datief (enkelvoud)'], ['sg_acc', 'accusatief (enkelvoud)'],
  ['sg_inst', 'instrumentalis (enkelvoud)'], ['sg_prep', 'prepositief (enkelvoud)'],
  ['pl_nom', 'nominatief meervoud'], ['pl_gen', 'genitief meervoud'], ['pl_inst', 'instrumentalis meervoud']
];
const ASPECT_NL = { imperfective: 'onvoltooid', perfective: 'voltooid', both: 'beide aspecten' };

function generateDrills({ resolvedWords, categoryIdBySlug, categoryLevelBySlug, ruleId, addExerciseIfNew }) {
  const drillConfigs = data.drills || [];
  for (const cfg of drillConfigs) {
    const level = cfg.level;
    const levelWords = resolvedWords
      .filter((w) => w.level === level && w.morph && w.morph.forms)
      .sort((a, b) => (a.morph.rank || 1e9) - (b.morph.rank || 1e9) || a.russian.localeCompare(b.russian));
    const verbs = levelWords.filter((w) => w.morph.pos === 'verb' && !/\s/.test(w.russian));
    const nouns = levelWords.filter((w) => w.morph.pos === 'noun' && !/\s/.test(w.russian) && !w.morph.indeclinable);
    const adjectives = levelWords.filter((w) => w.morph.pos === 'adjective' && !/\s/.test(w.russian));
    const shown = (w) => `${w.accented || w.russian}`;

    if (cfg.conjugation && categoryIdBySlug[cfg.conjugation.category]) {
      const category_id = categoryIdBySlug[cfg.conjugation.category];
      const grammar_rule_id = ruleId(cfg.conjugation.rule, `drill config ${level}`);
      for (const w of verbs.slice(0, cfg.conjugation.maxVerbs || 25)) {
        const f = w.morph.forms;
        const allForms = PERSONS.map(([k]) => f[k]).filter(Boolean);
        if (allForms.length < 4) continue;
        // two persons per verb, spread deterministically across the list
        const picks = [PERSONS[w.id % 6], PERSONS[(w.id + 3) % 6]];
        for (const [key, pronoun] of picks) {
          const correct = f[key];
          if (!correct) continue;
          const distractors = pickDistractors(allForms, correct, 3);
          if (distractors.length < 2) continue;
          addExerciseIfNew({
            category_id, grammar_rule_id, type: 'mc',
            prompt: `Vervoeg '${shown(w)}' (${w.translation_nl}) voor '${pronoun}':`,
            correct_answer: stripStress(correct),
            options: JSON.stringify(shuffle([correct, ...distractors].map(stripStress))),
            explanation: `'${w.russian}' (${w.translation_nl}) wordt bij '${pronoun}' '${correct}'. Volledig: ${PERSONS.map(([k, p]) => `${p} ${f[k] || '—'}`).join(', ')}.` +
              (w.morph.aspect ? ` Aspect: ${ASPECT_NL[w.morph.aspect] || w.morph.aspect}${w.morph.partner ? `, partner: ${w.morph.partner}` : ''}.` : '')
          });
        }
      }
    }

    if (cfg.past && categoryIdBySlug[cfg.past.category]) {
      const category_id = categoryIdBySlug[cfg.past.category];
      const grammar_rule_id = ruleId(cfg.past.rule, `drill config ${level}`);
      for (const w of verbs.slice(0, cfg.past.maxVerbs || 15)) {
        const f = w.morph.forms;
        const pastForms = [f.past_m, f.past_f, f.past_n, f.past_pl].filter(Boolean);
        if (pastForms.length < 3) continue;
        const subject = [['past_f', 'она'], ['past_pl', 'они'], ['past_m', 'он']][w.id % 3];
        const correct = f[subject[0]];
        if (!correct) continue;
        addExerciseIfNew({
          category_id, grammar_rule_id, type: 'mc',
          prompt: `Verleden tijd van '${shown(w)}' (${w.translation_nl}) bij '${subject[1]}':`,
          correct_answer: stripStress(correct),
          options: JSON.stringify(shuffle([correct, ...pickDistractors(pastForms, correct, 3)].map(stripStress))),
          explanation: `In de verleden tijd richt de uitgang zich naar het onderwerp: он ${f.past_m}, она ${f.past_f}, оно ${f.past_n}, они ${f.past_pl}.`
        });
      }
    }

    if (cfg.imperative && categoryIdBySlug[cfg.imperative.category]) {
      const category_id = categoryIdBySlug[cfg.imperative.category];
      const grammar_rule_id = ruleId(cfg.imperative.rule, `drill config ${level}`);
      for (const w of verbs.slice(0, cfg.imperative.maxVerbs || 15)) {
        const f = w.morph.forms;
        if (!f.imperative_pl || !f.imperative_sg) continue;
        const distractors = pickDistractors([f.imperative_sg, f.presfut_pl2, f.past_pl, f.presfut_sg3], f.imperative_pl, 3);
        if (distractors.length < 2) continue;
        addExerciseIfNew({
          category_id, grammar_rule_id, type: 'mc',
          prompt: `Beleefde gebiedende wijs (u/jullie) van '${shown(w)}' (${w.translation_nl}):`,
          correct_answer: stripStress(f.imperative_pl),
          options: JSON.stringify(shuffle([f.imperative_pl, ...distractors].map(stripStress))),
          explanation: `Gebiedende wijs van '${w.russian}': informeel '${f.imperative_sg}', beleefd/meervoud '${f.imperative_pl}' (uitgang -те).`
        });
      }
    }

    if (cfg.aspect && categoryIdBySlug[cfg.aspect.category]) {
      const category_id = categoryIdBySlug[cfg.aspect.category];
      const grammar_rule_id = ruleId(cfg.aspect.rule, `drill config ${level}`);
      const withPartner = verbs.filter((w) => w.morph.partner && /^[а-яё]+$/i.test(w.morph.partner) && w.morph.aspect !== 'both');
      const partnerPool = withPartner.map((w) => w.morph.partner);
      for (const w of withPartner.slice(0, cfg.aspect.maxVerbs || 20)) {
        const distractors = pickDistractors(partnerPool, w.morph.partner, 3);
        if (distractors.length < 2) continue;
        addExerciseIfNew({
          category_id, grammar_rule_id, type: 'mc',
          prompt: `'${shown(w)}' (${w.translation_nl}) is ${ASPECT_NL[w.morph.aspect]}. Wat is de aspectpartner?`,
          correct_answer: w.morph.partner,
          options: JSON.stringify(shuffle([w.morph.partner, ...distractors])),
          explanation: `'${w.russian}' (${ASPECT_NL[w.morph.aspect]}) hoort bij '${w.morph.partner}' (${w.morph.aspect === 'imperfective' ? 'voltooid' : 'onvoltooid'}). Het onvoltooide aspect beschrijft een proces of herhaling, het voltooide een afgeronde handeling met resultaat.`
        });
      }
    }

    if (cfg.cases && categoryIdBySlug[cfg.cases.category]) {
      const category_id = categoryIdBySlug[cfg.cases.category];
      const grammar_rule_id = ruleId(cfg.cases.rule, `drill config ${level}`);
      for (const w of nouns.slice(0, cfg.cases.maxNouns || 25)) {
        const f = w.morph.forms;
        const allForms = [...new Set(Object.values(f).filter(Boolean))];
        if (allForms.length < 4) continue;
        const picks = [CASES[w.id % CASES.length], CASES[(w.id + 4) % CASES.length]];
        for (const [key, label] of picks) {
          const correct = f[key];
          if (!correct || stripStress(correct) === stripStress(f.sg_nom || w.russian)) continue;
          const distractors = pickDistractors(allForms, correct, 3);
          if (distractors.length < 2) continue;
          addExerciseIfNew({
            category_id, grammar_rule_id, type: 'mc',
            prompt: `Wat is de ${label} van '${shown(w)}' (${w.translation_nl})?`,
            correct_answer: stripStress(correct),
            options: JSON.stringify(shuffle([correct, ...distractors].map(stripStress))),
            explanation: `'${w.russian}' (${w.gender ? { m: 'mannelijk', f: 'vrouwelijk', n: 'onzijdig' }[w.gender] || w.gender : '?'}): ${CASES.map(([k, l]) => `${l}: ${f[k] || '—'}`).join('; ')}.`
          });
        }
      }
    }

    if (cfg.comparative && categoryIdBySlug[cfg.comparative.category]) {
      const category_id = categoryIdBySlug[cfg.comparative.category];
      const grammar_rule_id = ruleId(cfg.comparative.rule, `drill config ${level}`);
      const withComp = adjectives.filter((w) => w.morph.comparative && !/[ ,/]/.test(w.morph.comparative));
      const pool = withComp.map((w) => w.morph.comparative);
      for (const w of withComp.slice(0, cfg.comparative.maxAdjectives || 15)) {
        const distractors = pickDistractors(pool, w.morph.comparative, 3);
        if (distractors.length < 2) continue;
        addExerciseIfNew({
          category_id, grammar_rule_id, type: 'mc',
          prompt: `Vergrotende trap van '${shown(w)}' (${w.translation_nl}):`,
          correct_answer: stripStress(w.morph.comparative),
          options: JSON.stringify(shuffle([w.morph.comparative, ...distractors].map(stripStress))),
          explanation: `'${w.russian}' → '${w.morph.comparative}'.` + (w.morph.superlative ? ` Overtreffende trap: '${w.morph.superlative}'.` : '')
        });
      }
    }
  }
}

if (require.main === module) {
  console.log('Seed complete:', seedDatabase());
}

module.exports = { seedDatabase, buildCloze };
