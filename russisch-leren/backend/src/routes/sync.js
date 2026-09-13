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

// POST /api/sync/activities -> XP-earning activities that aren't exercise
// answers (keyboard round, dictation answer, dialogue turn). The server
// assigns the XP; the day counts as a study day so streaks keep going.
// Body: { events: [{ clientId, kind, detail, clientTimestamp }, ...] }
const { activityXp } = require('../xp');
router.post('/activities', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const items = (req.body && req.body.events) || [];
  if (!Array.isArray(items)) return res.status(400).json({ error: "'events' moet een array zijn." });
  const insert = db.prepare('INSERT OR IGNORE INTO activity_events (user_id, kind, xp, detail, client_id, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const studyDay = db.prepare('INSERT OR IGNORE INTO study_days (user_id, study_date) VALUES (?, ?)');
  const accepted = [], skipped = [], failed = [];
  let xpGained = 0;
  for (const item of items) {
    if (!item || !item.clientId || typeof item.kind !== 'string') { failed.push({ clientId: item && item.clientId, error: 'clientId en kind zijn verplicht.' }); continue; }
    const xp = activityXp(item.kind, item.detail);
    if (xp == null) { failed.push({ clientId: item.clientId, error: 'Onbekende activiteit.' }); continue; }
    const ts = item.clientTimestamp && !Number.isNaN(Date.parse(item.clientTimestamp)) ? new Date(item.clientTimestamp) : new Date();
    const r = insert.run(userId, item.kind, xp, item.detail ? JSON.stringify(item.detail).slice(0, 500) : null, String(item.clientId), ts.toISOString().slice(0, 19).replace('T', ' '));
    if (r.changes) { accepted.push(item.clientId); xpGained += xp; studyDay.run(userId, ts.toISOString().slice(0, 10)); }
    else skipped.push(item.clientId);
  }
  res.json({ accepted, skipped, failed, xpGained });
});

module.exports = router;
