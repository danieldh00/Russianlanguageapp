const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { isCorrectAnswer } = require('../grading');
const { LEVELS, LEVEL_TITLES, LEVEL_DESCRIPTIONS } = require('../levels');

const router = express.Router();

// A level exam samples questions from every category at that level, so a
// pass means the whole level -- vocabulary, grammar, sentences, reading --
// not just the lessons someone happened to like. Grading is server-side:
// the questions go out without answers or explanations, and the full review
// (what was wrong, why, which rule) only comes back after submitting.
const QUESTIONS_PER_EXAM = 30;
const PASS_PCT = 80;
const PRODUCTION_TYPES = new Set(['typing', 'cloze', 'sentence_build']);
const PRODUCTION_SHARE = 0.4;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assertLevel(level, res) {
  if (!LEVELS.includes(level)) {
    res.status(404).json({ error: 'Onbekend niveau.' });
    return false;
  }
  return true;
}

function certificationsFor(userId) {
  return db
    .prepare(
      `SELECT lc.level, lc.passed_at, ea.score, ea.total
       FROM level_certifications lc JOIN exam_attempts ea ON ea.id = lc.exam_attempt_id
       WHERE lc.user_id = ?`
    )
    .all(userId)
    .map((r) => ({ level: r.level, passedAt: r.passed_at, score: r.score, total: r.total }));
}

// GET /api/exams -> every level with its exam status for this user
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const certs = Object.fromEntries(certificationsFor(userId).map((c) => [c.level, c]));
  const levels = LEVELS.map((level) => {
    const counts = db
      .prepare(
        `SELECT COUNT(DISTINCT c.id) categories, COUNT(e.id) exercises
         FROM categories c LEFT JOIN exercises e ON e.category_id = c.id WHERE c.level = ?`
      )
      .get(level);
    const attempts = db
      .prepare('SELECT COUNT(*) n, MAX(CAST(score AS REAL) / total) best FROM exam_attempts WHERE user_id = ? AND level = ?')
      .get(userId, level);
    return {
      level,
      title: LEVEL_TITLES[level],
      description: LEVEL_DESCRIPTIONS[level],
      categories: counts.categories,
      exercises: counts.exercises,
      questionCount: Math.min(QUESTIONS_PER_EXAM, counts.exercises),
      passPct: PASS_PCT,
      attempts: attempts.n,
      bestScorePct: attempts.best != null ? Math.round(attempts.best * 100) : null,
      passed: !!certs[level],
      passedAt: certs[level] ? certs[level].passedAt : null
    };
  });
  res.json({ levels, questionCount: QUESTIONS_PER_EXAM, passPct: PASS_PCT });
});

// GET /api/exams/history -> recent sittings, newest first
router.get('/history', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT id, level, score, total, passed, created_at FROM exam_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 30')
    .all(req.session.userId);
  res.json({
    attempts: rows.map((r) => ({
      id: r.id, level: r.level, score: r.score, total: r.total,
      pct: Math.round((r.score / r.total) * 100), passed: !!r.passed, at: r.created_at
    }))
  });
});

// GET /api/exams/:level -> a fresh exam: stratified over the level's categories
router.get('/:level', requireAuth, (req, res) => {
  const level = req.params.level.toUpperCase();
  if (!assertLevel(level, res)) return;

  const rows = db
    .prepare(
      `SELECT e.id, e.type, e.prompt, e.options, e.context, c.slug AS category_slug, c.name AS category_name
       FROM exercises e JOIN categories c ON c.id = e.category_id
       WHERE c.level = ?`
    )
    .all(level);
  if (!rows.length) return res.status(404).json({ error: 'Geen oefeningen voor dit niveau.' });

  // round-robin over shuffled per-category buckets, so every lesson at the
  // level is represented before any lesson contributes a second question
  function roundRobin(pool, count, exclude) {
    const buckets = new Map();
    for (const row of shuffle(pool)) {
      if (exclude.has(row.id)) continue;
      if (!buckets.has(row.category_slug)) buckets.set(row.category_slug, []);
      buckets.get(row.category_slug).push(row);
    }
    const order = shuffle([...buckets.keys()]);
    const out = [];
    let round = 0;
    while (out.length < count) {
      let added = false;
      for (const slug of order) {
        const bucket = buckets.get(slug);
        if (round < bucket.length) {
          out.push(bucket[round]);
          added = true;
          if (out.length >= count) break;
        }
      }
      if (!added) break;
      round++;
    }
    return out;
  }

  // At least PRODUCTION_SHARE of the exam must be produced, not recognised:
  // typing, cloze and sentence building. Multiple choice alone lets you pass
  // a level you can read but not use.
  const target = Math.min(QUESTIONS_PER_EXAM, rows.length);
  const production = rows.filter((r) => PRODUCTION_TYPES.has(r.type));
  const productionTarget = Math.min(production.length, Math.ceil(target * PRODUCTION_SHARE));
  const picked = roundRobin(production, productionTarget, new Set());
  const taken = new Set(picked.map((r) => r.id));
  picked.push(...roundRobin(rows.filter((r) => !taken.has(r.id)), target - picked.length, taken));

  res.json({
    level,
    title: LEVEL_TITLES[level],
    questionCount: picked.length,
    passPct: PASS_PCT,
    questions: shuffle(picked).map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options ? JSON.parse(q.options) : null,
      context: q.context || null,
      category: { slug: q.category_slug, name: q.category_name }
    }))
  });
});

// POST /api/exams/:level/submit  { answers: [{ exerciseId, answer }] }
router.post('/:level/submit', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const level = req.params.level.toUpperCase();
  if (!assertLevel(level, res)) return;

  const answers = (req.body && req.body.answers) || [];
  if (!Array.isArray(answers) || !answers.length) {
    return res.status(400).json({ error: "'answers' moet een niet-lege lijst zijn." });
  }

  const getExercise = db.prepare(
    `SELECT e.*, c.slug AS category_slug, c.name AS category_name, c.level AS category_level,
            gr.code AS rule_code, gr.title AS rule_title, gr.explanation AS rule_explanation, gr.example AS rule_example,
            w.example_ru, w.example_nl
     FROM exercises e JOIN categories c ON c.id = e.category_id
     LEFT JOIN grammar_rules gr ON gr.id = e.grammar_rule_id
     LEFT JOIN words w ON w.id = e.word_id
     WHERE e.id = ?`
  );

  const review = [];
  const seen = new Set();
  for (const item of answers) {
    const exercise = item && getExercise.get(item.exerciseId);
    if (!exercise || exercise.category_level !== level || seen.has(exercise.id)) continue;
    seen.add(exercise.id);
    const given = item.answer == null ? '' : String(item.answer);
    const isCorrect = given !== '' && isCorrectAnswer(exercise, given);
    review.push({
      exerciseId: exercise.id,
      type: exercise.type,
      prompt: exercise.prompt,
      context: exercise.context || null,
      options: exercise.options ? JSON.parse(exercise.options) : null,
      given,
      correctAnswer: exercise.correct_answer,
      isCorrect,
      explanation: exercise.explanation,
      example: exercise.example_ru ? { ru: exercise.example_ru, nl: exercise.example_nl } : null,
      grammarRule: exercise.rule_code
        ? { code: exercise.rule_code, title: exercise.rule_title, explanation: exercise.rule_explanation, example: exercise.rule_example }
        : null,
      category: { slug: exercise.category_slug, name: exercise.category_name }
    });
  }
  if (!review.length) return res.status(400).json({ error: 'Geen geldige antwoorden voor dit niveau.' });

  const score = review.filter((r) => r.isCorrect).length;
  const total = review.length;
  const pct = Math.round((score / total) * 100);
  const passed = pct >= PASS_PCT;

  const alreadyCertified = !!db.prepare('SELECT 1 FROM level_certifications WHERE user_id = ? AND level = ?').get(userId, level);
  let attemptId;
  db.transaction(() => {
    attemptId = db
      .prepare('INSERT INTO exam_attempts (user_id, level, score, total, passed) VALUES (?, ?, ?, ?, ?)')
      .run(userId, level, score, total, passed ? 1 : 0).lastInsertRowid;
    const insertAnswer = db.prepare('INSERT INTO exam_answers (exam_attempt_id, exercise_id, given_answer, is_correct) VALUES (?, ?, ?, ?)');
    for (const r of review) insertAnswer.run(attemptId, r.exerciseId, r.given, r.isCorrect ? 1 : 0);
    if (passed && !alreadyCertified) {
      db.prepare('INSERT INTO level_certifications (user_id, level, exam_attempt_id) VALUES (?, ?, ?)').run(userId, level, attemptId);
    }
    db.prepare('INSERT OR IGNORE INTO study_days (user_id, study_date) VALUES (?, date(\'now\'))').run(userId);
  })();

  const perCategoryMap = new Map();
  for (const r of review) {
    const entry = perCategoryMap.get(r.category.slug) || { slug: r.category.slug, name: r.category.name, correct: 0, total: 0 };
    entry.total++;
    if (r.isCorrect) entry.correct++;
    perCategoryMap.set(r.category.slug, entry);
  }
  const perCategory = [...perCategoryMap.values()].sort((a, b) => a.correct / a.total - b.correct / b.total);

  res.json({
    attemptId,
    level,
    title: LEVEL_TITLES[level],
    score,
    total,
    pct,
    passPct: PASS_PCT,
    passed,
    newlyCertified: passed && !alreadyCertified,
    perCategory,
    review
  });
});

module.exports = { router, certificationsFor };
