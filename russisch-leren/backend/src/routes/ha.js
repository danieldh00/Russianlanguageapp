const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const ha = require('../ha');

const router = express.Router();
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function usernameOf(userId) {
  const row = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
  return row ? row.username : 'gebruiker';
}

function settingsFor(userId) {
  const row = db.prepare('SELECT * FROM ha_notifications WHERE user_id = ?').get(userId);
  return row
    ? { target: row.target, enabled: !!row.enabled, reminderTime: row.reminder_time, timeZone: row.time_zone, sensorEnabled: !!row.sensor_enabled, lastSentDate: row.last_sent_date }
    : null;
}

// GET /api/ha/status -> is HA reachable, which notify targets exist, and this learner's settings
router.get('/status', requireAuth, async (req, res) => {
  const base = { available: ha.available(), publicUrl: ha.publicUrl(), sensorEntityId: ha.sensorEntityId(usernameOf(req.session.userId)), settings: settingsFor(req.session.userId), targets: [] };
  if (!ha.available()) return res.json(base);
  try {
    base.targets = await ha.listNotifyTargets();
  } catch (err) {
    base.error = err.message;
  }
  res.json(base);
});

// POST /api/ha/settings { target, enabled, reminderTime, timeZone, sensorEnabled }
router.post('/settings', requireAuth, async (req, res) => {
  const { target, enabled, reminderTime, timeZone, sensorEnabled } = req.body || {};
  const userId = req.session.userId;
  const time = TIME_RE.test(reminderTime || '') ? reminderTime : '19:00';
  const tz = typeof timeZone === 'string' && timeZone.length <= 64 ? timeZone : 'Europe/Amsterdam';
  const tgt = typeof target === 'string' && /^[a-z0-9_]+$/.test(target) ? target : 'persistent_notification';
  db.prepare(
    `INSERT INTO ha_notifications (user_id, target, enabled, reminder_time, time_zone, sensor_enabled, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET target = excluded.target, enabled = excluded.enabled, reminder_time = excluded.reminder_time,
       time_zone = excluded.time_zone, sensor_enabled = excluded.sensor_enabled, updated_at = excluded.updated_at`
  ).run(userId, tgt, enabled ? 1 : 0, time, tz, sensorEnabled === false ? 0 : 1);
  if (ha.available()) ha.updateSensors().catch(() => {});
  res.json({ ok: true, settings: settingsFor(userId) });
});

// POST /api/ha/test -> send the reminder right now to the chosen target
router.post('/test', requireAuth, async (req, res) => {
  if (!ha.available()) return res.status(503).json({ error: 'Home Assistant is niet bereikbaar (draait de app als add-on?).' });
  const s = settingsFor(req.session.userId);
  if (!s) return res.status(404).json({ error: 'Nog geen Home Assistant-melding ingesteld.' });
  try {
    const username = usernameOf(req.session.userId);
    const stats = ha.learnerStats(req.session.userId);
    const text = ha.reminderText(username, stats);
    await ha.sendNotification(s.target, username, { title: text.title + ' (test)', message: text.message });
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: `Versturen mislukt: ${err.message}` });
  }
});

module.exports = router;
