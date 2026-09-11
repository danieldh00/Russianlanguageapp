const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { XP_PER_CORRECT, levelForXp, computeStreak, computeAchievements } = require('../gamification');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;

  const totals = db.prepare('SELECT COUNT(*) total, SUM(is_correct) correct FROM attempts WHERE user_id = ?').get(userId);
  const totalAttempts = totals.total || 0;
  const correctAttempts = totals.correct || 0;
  const accuracyPct = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 1000) / 10 : 0;

  const wordsStarted = db.prepare('SELECT COUNT(*) c FROM user_word_progress WHERE user_id = ?').get(userId).c;
  const wordsMastered = db
    .prepare('SELECT COUNT(*) c FROM user_word_progress WHERE user_id = ? AND interval_days >= 6')
    .get(userId).c;
  const totalWords = db.prepare('SELECT COUNT(*) c FROM words').get().c;

  const perCategory = db
    .prepare(
      `SELECT c.slug, c.name,
         COUNT(DISTINCT w.id) as totalWords,
         COUNT(DISTINCT CASE WHEN uwp.interval_days >= 6 THEN w.id END) as masteredWords,
         COUNT(DISTINCT CASE WHEN uwp.word_id IS NOT NULL THEN w.id END) as startedWords
       FROM categories c
       LEFT JOIN words w ON w.category_id = c.id
       LEFT JOIN user_word_progress uwp ON uwp.word_id = w.id AND uwp.user_id = ?
       GROUP BY c.id
       ORDER BY c.sort_order`
    )
    .all(userId);

  res.json({ totalAttempts, correctAttempts, accuracyPct, wordsStarted, wordsMastered, totalWords, perCategory });
});

// GET /api/progress/words -> full per-word SRS state, used to seed/reconcile
// a device's local progress mirror (e.g. first login on a new iPad after
// studying on the iPhone).
router.get('/words', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const rows = db
    .prepare(
      `SELECT word_id as wordId, ease_factor as easeFactor, interval_days as intervalDays, repetitions,
              correct_count as correctCount, incorrect_count as incorrectCount,
              next_review_at as nextReviewAt, last_reviewed_at as lastReviewedAt
       FROM user_word_progress WHERE user_id = ?`
    )
    .all(userId);
  res.json({ words: rows });
});

// GET /api/progress/stats -> gamification: XP, level, study streak, achievements
router.get('/stats', requireAuth, (req, res) => {
  const userId = req.session.userId;

  const correctCount = db.prepare("SELECT COUNT(*) c FROM attempts WHERE user_id = ? AND is_correct = 1").get(userId).c;
  const totalAttempts = db.prepare('SELECT COUNT(*) c FROM attempts WHERE user_id = ?').get(userId).c;
  const xp = correctCount * XP_PER_CORRECT;
  const level = levelForXp(xp);

  const studyDates = db.prepare('SELECT study_date FROM study_days WHERE user_id = ?').all(userId).map((r) => r.study_date);
  const { currentStreak, longestStreak } = computeStreak(studyDates);

  const wordsMastered = db
    .prepare('SELECT COUNT(*) c FROM user_word_progress WHERE user_id = ? AND interval_days >= 6')
    .get(userId).c;

  const perCategory = db
    .prepare(
      `SELECT c.slug,
         COUNT(DISTINCT w.id) as totalWords,
         COUNT(DISTINCT CASE WHEN uwp.interval_days >= 6 THEN w.id END) as masteredWords
       FROM categories c
       LEFT JOIN words w ON w.category_id = c.id
       LEFT JOIN user_word_progress uwp ON uwp.word_id = w.id AND uwp.user_id = ?
       GROUP BY c.id`
    )
    .all(userId);

  const grammarCategories = perCategory.filter((c) => c.slug.startsWith('grammar-') && c.totalWords > 0);
  const allGrammarMastered = grammarCategories.length > 0 && grammarCategories.every((c) => c.masteredWords === c.totalWords);
  const greetings = perCategory.find((c) => c.slug === 'greetings');
  const greetingsMastered = !!greetings && greetings.totalWords > 0 && greetings.masteredWords === greetings.totalWords;

  const achievements = computeAchievements({
    totalAttempts,
    wordsMastered,
    currentStreak,
    longestStreak,
    xp,
    allGrammarMastered,
    greetingsMastered
  });

  res.json({ xp, ...level, currentStreak, longestStreak, achievements });
});

router.get('/mistakes', requireAuth, (req, res) => {
  const userId = req.session.userId;

  const recentMistakes = db
    .prepare(
      `SELECT a.id, a.given_answer, a.created_at, e.prompt, e.correct_answer, e.explanation, gr.title as grammar_title
       FROM attempts a
       JOIN exercises e ON e.id = a.exercise_id
       LEFT JOIN grammar_rules gr ON gr.id = e.grammar_rule_id
       WHERE a.user_id = ? AND a.is_correct = 0
       ORDER BY a.created_at DESC
       LIMIT 20`
    )
    .all(userId);

  const topMissed = db
    .prepare(
      `SELECT e.prompt, e.correct_answer, e.explanation, COUNT(*) as missCount
       FROM attempts a
       JOIN exercises e ON e.id = a.exercise_id
       WHERE a.user_id = ? AND a.is_correct = 0
       GROUP BY a.exercise_id
       ORDER BY missCount DESC
       LIMIT 10`
    )
    .all(userId);

  res.json({ recentMistakes, topMissed });
});

module.exports = router;
