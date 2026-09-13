const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { LEVELS, LEVEL_TITLES, LEVEL_DESCRIPTIONS } = require('../levels');
const phrasebook = require('../../seed/data/phrasebook');
const stories = require('../../seed/data/stories');

const router = express.Router();

// GET /api/content -> the full lesson content bundle, for offline caching on the client.
// Includes correct answers and explanations inline (needed so quizzes can be
// graded fully offline) -- unlike /api/exercises/:slug, which withholds them
// until an answer is submitted. Grammar rules are sent once, as a map by
// code, rather than repeated inside every exercise that references them:
// with thousands of exercises that duplication would dominate the payload
// the phone has to keep in localStorage.
router.get('/', requireAuth, (req, res) => {
  const categories = db.prepare('SELECT slug, name, description, level, sort_order FROM categories ORDER BY sort_order').all();

  const grammarRules = {};
  for (const r of db.prepare('SELECT code, title, explanation, example FROM grammar_rules').all()) {
    grammarRules[r.code] = { code: r.code, title: r.title, explanation: r.explanation, example: r.example };
  }

  // One entry per word (looked up by exercise.wordId on the client): the
  // headword with stress, its translation and an example sentence. Sent once
  // per word rather than repeated inside its two or three exercises.
  const words = {};
  for (const w of db.prepare('SELECT id, russian, accented, translation_nl, example_ru, example_nl FROM words').all()) {
    const entry = { ru: w.accented || w.russian, nl: w.translation_nl };
    if (w.example_ru) entry.example = { ru: w.example_ru, nl: w.example_nl || '' };
    words[w.id] = entry;
  }

  const exercises = db
    .prepare(
      `SELECT e.id, e.type, e.prompt, e.correct_answer, e.options, e.explanation, e.context,
              e.word_id, c.slug AS category, gr.code AS rule_code
       FROM exercises e
       JOIN categories c ON c.id = e.category_id
       LEFT JOIN grammar_rules gr ON gr.id = e.grammar_rule_id
       ORDER BY e.id`
    )
    .all()
    .map((row) => {
      const ex = {
        id: row.id,
        category: row.category,
        wordId: row.word_id,
        type: row.type,
        prompt: row.prompt,
        options: row.options ? JSON.parse(row.options) : null,
        correctAnswer: row.correct_answer,
        explanation: row.explanation
      };
      if (row.context) ex.context = row.context;
      if (row.rule_code) ex.ruleCode = row.rule_code;
      return ex;
    });

  res.json({
    // bumped whenever the shape of this bundle changes, so a device holding
    // an older cached copy refetches instead of trusting the 24h staleness window
    schemaVersion: 5,
    levels: LEVELS.map((l) => ({ level: l, title: LEVEL_TITLES[l], description: LEVEL_DESCRIPTIONS[l] })),
    categories,
    grammarRules,
    words,
    // survival phrasebook (static content, no exercises): offline reference
    phrasebook,
    // graded readers A1..C2 with their comprehension questions, graded on the
    // client like every other exercise so reading works offline too
    stories,
    exercises,
    generatedAt: new Date().toISOString()
  });
});

module.exports = router;
