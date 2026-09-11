const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

// GET /api/content -> the full lesson content bundle, for offline caching on the client.
// Includes correct answers and explanations inline (needed so quizzes can be
// graded fully offline) -- unlike /api/exercises/:slug, which withholds them
// until an answer is submitted.
router.get('/', requireAuth, (req, res) => {
  const categories = db.prepare('SELECT slug, name, description, level, sort_order FROM categories ORDER BY sort_order').all();

  const exercises = db
    .prepare(
      `SELECT e.id, e.type, e.prompt, e.correct_answer, e.options, e.explanation,
              e.word_id, c.slug AS category,
              gr.code AS rule_code, gr.title AS rule_title, gr.explanation AS rule_explanation, gr.example AS rule_example
       FROM exercises e
       JOIN categories c ON c.id = e.category_id
       LEFT JOIN grammar_rules gr ON gr.id = e.grammar_rule_id
       ORDER BY e.id`
    )
    .all()
    .map((row) => ({
      id: row.id,
      category: row.category,
      wordId: row.word_id,
      type: row.type,
      prompt: row.prompt,
      options: row.options ? JSON.parse(row.options) : null,
      correctAnswer: row.correct_answer,
      explanation: row.explanation,
      grammarRule: row.rule_code
        ? { code: row.rule_code, title: row.rule_title, explanation: row.rule_explanation, example: row.rule_example }
        : null
    }));

  res.json({ categories, exercises, generatedAt: new Date().toISOString() });
});

module.exports = router;
