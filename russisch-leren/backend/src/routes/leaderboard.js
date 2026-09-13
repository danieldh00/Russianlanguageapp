const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { XP_PER_CORRECT, XP_PER_CERTIFICATION, levelForXp, computeStreak } = require('../gamification');
const { certificationsFor } = require('./exams');
const { levelRank } = require('../levels');

const router = express.Router();

// GET /api/leaderboard -> all users ranked by XP, for friendly competition.
router.get('/', requireAuth, (req, res) => {
  const users = db.prepare('SELECT id, username FROM users').all();

  const leaderboard = users.map((u) => {
    const correctCount = db
      .prepare('SELECT COUNT(*) c FROM attempts WHERE user_id = ? AND is_correct = 1')
      .get(u.id).c;
    const certifications = certificationsFor(u.id);
    const highestLevel = certifications.map((c) => c.level).sort((a, b) => levelRank(b) - levelRank(a))[0] || null;
    const xp = correctCount * XP_PER_CORRECT + certifications.length * XP_PER_CERTIFICATION;
    const level = levelForXp(xp);

    const studyDates = db
      .prepare('SELECT study_date FROM study_days WHERE user_id = ?')
      .all(u.id)
      .map((r) => r.study_date);
    const { currentStreak } = computeStreak(studyDates);

    const wordsMastered = db
      .prepare('SELECT COUNT(*) c FROM user_word_progress WHERE user_id = ? AND interval_days >= 6')
      .get(u.id).c;

    return {
      userId: u.id,
      username: u.username,
      xp,
      level: level.level,
      levelTitle: level.title,
      currentStreak,
      wordsMastered,
      highestLevel,
      certifications: certifications.length
    };
  });

  leaderboard.sort((a, b) => b.xp - a.xp || levelRank(b.highestLevel) - levelRank(a.highestLevel) || b.wordsMastered - a.wordsMastered);
  leaderboard.forEach((entry, i) => {
    entry.rank = i + 1;
  });

  const me = leaderboard.find((entry) => entry.userId === req.session.userId) || null;

  res.json({ leaderboard, me });
});

module.exports = router;
