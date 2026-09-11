const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();

  const result = categories.map((cat) => {
    const totalWords = db.prepare('SELECT COUNT(*) c FROM words WHERE category_id = ?').get(cat.id).c;
    const masteredWords = db
      .prepare(
        `SELECT COUNT(*) c FROM user_word_progress uwp
         JOIN words w ON w.id = uwp.word_id
         WHERE uwp.user_id = ? AND w.category_id = ? AND uwp.interval_days >= 6`
      )
      .get(userId, cat.id).c;
    const dueWords = db
      .prepare(
        `SELECT COUNT(*) c FROM user_word_progress uwp
         JOIN words w ON w.id = uwp.word_id
         WHERE uwp.user_id = ? AND w.category_id = ? AND uwp.next_review_at <= datetime('now')`
      )
      .get(userId, cat.id).c;
    const totalExercises = db.prepare('SELECT COUNT(*) c FROM exercises WHERE category_id = ?').get(cat.id).c;

    return {
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      level: cat.level,
      totalWords,
      masteredWords,
      dueWords,
      totalExercises
    };
  });

  res.json({ categories: result });
});

module.exports = router;
