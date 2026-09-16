const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { levelForXp, computeStreak } = require('../gamification');
const { computeXpForAllUsers } = require('../xp');
const { levelRank } = require('../levels');

const router = express.Router();

// GET /api/leaderboard -> all users ranked by XP, for friendly competition.
//
// Everyone with an account sees everyone else's username and progress here --
// fine for a household, not for an add-on reachable by strangers. The
// leaderboard_enabled add-on option lets an install turn this off entirely.
router.get('/', requireAuth, (req, res) => {
  if (process.env.LEADERBOARD_ENABLED === 'false') {
    return res.status(404).json({ error: 'De ranglijst is uitgeschakeld op deze server.' });
  }

  const users = db.prepare('SELECT id, username FROM users').all();

  // Three queries total for every user, not three per user: computeXpForAllUsers
  // and the two grouped queries below replace what used to be a handful of
  // per-user round trips each.
  const xpFor = computeXpForAllUsers();
  const masteredByUser = new Map(
    db.prepare('SELECT user_id, COUNT(*) c FROM user_word_progress WHERE interval_days >= 6 GROUP BY user_id').all().map((r) => [r.user_id, r.c])
  );
  const datesByUser = new Map();
  for (const r of db.prepare('SELECT user_id, study_date FROM study_days').all()) {
    if (!datesByUser.has(r.user_id)) datesByUser.set(r.user_id, []);
    datesByUser.get(r.user_id).push(r.study_date);
  }

  const leaderboard = users.map((u) => {
    const { xp, certLevels } = xpFor(u.id);
    const highestLevel = [...certLevels].sort((a, b) => levelRank(b) - levelRank(a))[0] || null;
    const level = levelForXp(xp);
    const { currentStreak } = computeStreak(datesByUser.get(u.id) || []);
    const wordsMastered = masteredByUser.get(u.id) || 0;

    return {
      userId: u.id,
      username: u.username,
      xp,
      level: level.level,
      levelTitle: level.title,
      currentStreak,
      wordsMastered,
      highestLevel,
      certifications: certLevels.length
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
