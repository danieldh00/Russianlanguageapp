const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { schedule } = require('../srs');

const router = express.Router();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatExercise(ex) {
  return {
    id: ex.id,
    type: ex.type,
    prompt: ex.prompt,
    options: ex.options ? JSON.parse(ex.options) : null
  };
}

// GET /api/exercises/:slug  -> a batch of exercises for a lesson (category)
router.get('/:slug', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);

  const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
  if (!category) return res.status(404).json({ error: 'Les niet gevonden.' });

  const dueWordExercises = db
    .prepare(
      `SELECT e.* FROM exercises e
       JOIN user_word_progress uwp ON uwp.word_id = e.word_id AND uwp.user_id = ?
       WHERE e.category_id = ? AND e.word_id IS NOT NULL AND uwp.next_review_at <= datetime('now')
       ORDER BY uwp.next_review_at ASC`
    )
    .all(userId, category.id);

  const newWordExercises = db
    .prepare(
      `SELECT e.* FROM exercises e
       WHERE e.category_id = ? AND e.word_id IS NOT NULL
       AND e.word_id NOT IN (SELECT word_id FROM user_word_progress WHERE user_id = ?)`
    )
    .all(category.id, userId);

  const grammarExercises = db
    .prepare('SELECT * FROM exercises WHERE category_id = ? AND word_id IS NULL')
    .all(category.id);

  const pool = [...dueWordExercises, ...shuffle(newWordExercises), ...shuffle(grammarExercises)];
  const seen = new Set();
  const batch = [];
  for (const ex of pool) {
    if (seen.has(ex.id)) continue;
    seen.add(ex.id);
    batch.push(ex);
    if (batch.length >= limit) break;
  }

  res.json({ category: { slug: category.slug, name: category.name, level: category.level }, exercises: batch.map(formatExercise) });
});

// POST /api/exercises/:id/answer -> submit an answer, get correctness + explanation
router.post('/:id/answer', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!exercise) return res.status(404).json({ error: 'Oefening niet gevonden.' });

  const given = ((req.body && req.body.answer) || '').toString();
  const isCorrect = given.trim().toLowerCase() === exercise.correct_answer.trim().toLowerCase() ? 1 : 0;

  db.prepare('INSERT INTO attempts (user_id, exercise_id, given_answer, is_correct) VALUES (?, ?, ?, ?)').run(
    userId,
    exercise.id,
    given,
    isCorrect
  );

  let srsInfo = null;
  if (exercise.word_id) {
    let progress = db
      .prepare('SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?')
      .get(userId, exercise.word_id);
    if (!progress) {
      db.prepare('INSERT INTO user_word_progress (user_id, word_id) VALUES (?, ?)').run(userId, exercise.word_id);
      progress = db.prepare('SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?').get(userId, exercise.word_id);
    }
    const updated = schedule(progress, !!isCorrect);
    db.prepare(
      `UPDATE user_word_progress
       SET ease_factor = ?, interval_days = ?, repetitions = ?,
           correct_count = correct_count + ?, incorrect_count = incorrect_count + ?,
           next_review_at = ?, last_reviewed_at = datetime('now')
       WHERE id = ?`
    ).run(
      updated.ease_factor,
      updated.interval_days,
      updated.repetitions,
      isCorrect,
      isCorrect ? 0 : 1,
      updated.next_review_at,
      progress.id
    );
    srsInfo = updated;
  }

  let grammarRule = null;
  if (exercise.grammar_rule_id) {
    grammarRule = db
      .prepare('SELECT code, title, explanation, example FROM grammar_rules WHERE id = ?')
      .get(exercise.grammar_rule_id);
  }

  res.json({
    correct: !!isCorrect,
    correctAnswer: exercise.correct_answer,
    explanation: exercise.explanation,
    grammarRule,
    srs: srsInfo
  });
});

module.exports = router;
