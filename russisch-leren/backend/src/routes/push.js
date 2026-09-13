const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const push = require('../push');

const router = express.Router();

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function rowFor(userId, endpoint) {
  return db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').get(userId, endpoint);
}

function publicView(row) {
  return { enabled: !!row.enabled, reminderTime: row.reminder_time, timeZone: row.time_zone, lastSentDate: row.last_sent_date };
}

// GET /api/push/vapid-public-key -> the key the browser needs to subscribe
router.get('/vapid-public-key', requireAuth, (req, res) => {
  res.json({ publicKey: push.publicKey });
});

// GET /api/push/status?endpoint=... -> this device's reminder settings, if subscribed
router.get('/status', requireAuth, (req, res) => {
  const endpoint = String(req.query.endpoint || '');
  const row = endpoint && rowFor(req.session.userId, endpoint);
  res.json({ subscribed: !!row, settings: row ? publicView(row) : null });
});

// POST /api/push/subscribe { subscription, reminderTime: "19:00", timeZone }
router.post('/subscribe', requireAuth, (req, res) => {
  const { subscription, reminderTime, timeZone } = req.body || {};
  if (!subscription || typeof subscription.endpoint !== 'string' || !subscription.keys) {
    return res.status(400).json({ error: 'Ongeldig push-abonnement.' });
  }
  const time = TIME_RE.test(reminderTime || '') ? reminderTime : '19:00';
  const tz = typeof timeZone === 'string' && timeZone.length <= 64 ? timeZone : 'Europe/Amsterdam';
  const userId = req.session.userId;

  // Don't fire immediately for a time that has already passed today: the
  // user is clearly in the app right now.
  const { date, time: nowTime } = push.localNow(tz);
  const lastSent = nowTime >= time ? date : null;

  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, subscription, reminder_time, time_zone, enabled, last_sent_date)
     VALUES (?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       user_id = excluded.user_id, subscription = excluded.subscription, reminder_time = excluded.reminder_time,
       time_zone = excluded.time_zone, enabled = 1, last_sent_date = excluded.last_sent_date`
  ).run(userId, subscription.endpoint, JSON.stringify(subscription), time, tz, lastSent);

  res.json({ ok: true, settings: publicView(rowFor(userId, subscription.endpoint)) });
});

// POST /api/push/unsubscribe { endpoint }
router.post('/unsubscribe', requireAuth, (req, res) => {
  const endpoint = req.body && req.body.endpoint;
  if (typeof endpoint !== 'string') return res.status(400).json({ error: 'endpoint ontbreekt.' });
  db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').run(req.session.userId, endpoint);
  res.json({ ok: true });
});

// POST /api/push/test { endpoint } -> sends a notification right now, so the
// user can see the whole chain works before trusting the daily one.
router.post('/test', requireAuth, async (req, res) => {
  const endpoint = req.body && req.body.endpoint;
  const row = typeof endpoint === 'string' && rowFor(req.session.userId, endpoint);
  if (!row) return res.status(404).json({ error: 'Dit toestel heeft geen herinnering ingesteld.' });
  const ok = await push.sendTo(row, {
    title: 'Russisch Leren — testmelding',
    body: `Dit is hoe je dagelijkse herinnering om ${row.reminder_time} eruitziet. Работает! (Het werkt!)`,
    url: '/#/dashboard'
  });
  if (!ok) return res.status(502).json({ error: 'De pushdienst van je browser accepteerde de melding niet. Zet de herinnering uit en weer aan.' });
  res.json({ ok: true });
});

module.exports = router;
