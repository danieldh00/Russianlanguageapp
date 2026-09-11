const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { recordAttempt } = require('../recordAttempt');

const router = express.Router();

// POST /api/sync/attempts -> flush a device's offline answer queue.
// Body: { attempts: [{ clientId, exerciseId, givenAnswer, clientTimestamp }, ...] }
// Idempotent: replaying the same clientId is a no-op, so a device can safely
// retry a batch that only partially made it to the server.
router.post('/attempts', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const items = (req.body && req.body.attempts) || [];
  if (!Array.isArray(items)) return res.status(400).json({ error: "'attempts' moet een array zijn." });

  const accepted = [];
  const skipped = [];
  const failed = [];

  for (const item of items) {
    if (!item || !item.clientId || !item.exerciseId) {
      failed.push({ clientId: item && item.clientId, error: 'clientId en exerciseId zijn verplicht.' });
      continue;
    }
    const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(item.exerciseId);
    if (!exercise) {
      failed.push({ clientId: item.clientId, error: 'Oefening niet gevonden.' });
      continue;
    }
    const result = recordAttempt(userId, exercise, item.givenAnswer, {
      clientId: item.clientId,
      clientTimestamp: item.clientTimestamp || null
    });
    if (result.duplicate) skipped.push(item.clientId);
    else accepted.push(item.clientId);
  }

  res.json({ accepted, skipped, failed });
});

module.exports = router;
