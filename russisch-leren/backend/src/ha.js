// Home Assistant integration. Inside the add-on, Supervisor hands us a
// token (SUPERVISOR_TOKEN) and proxies the Core REST API at
// http://supervisor/core/api -- enabled by `homeassistant_api: true` in
// config.yaml. Outside Home Assistant (plain Docker, local dev) there is no
// token and everything here reports "not available" instead of failing.
//
// Two things use it:
//  - the daily reminder, delivered to a notify target the learner picked in
//    Instellingen: a Companion-app device (notify.mobile_app_*) or the
//    Home Assistant dashboard notification. That choice is the link between
//    an app account and a Home Assistant user/phone.
//  - a sensor per learner (sensor.russisch_leren_<naam>) with the number of
//    words due for review, plus streak/XP attributes, for dashboards and
//    automations.
const db = require('./db');
const { localNow } = require('./localtime');
const { XP_PER_CORRECT, XP_PER_CERTIFICATION, levelForXp, computeStreak } = require('./gamification');

const SUPERVISOR = process.env.SUPERVISOR_URL || 'http://supervisor';
const TOKEN = process.env.SUPERVISOR_TOKEN || '';

function available() {
  return !!TOKEN;
}

function publicUrl() {
  return process.env.PUBLIC_URL || '';
}

async function haFetch(path, { method = 'GET', body } = {}) {
  if (!TOKEN) throw new Error('Geen Supervisor-token: draait niet als Home Assistant add-on.');
  const res = await fetch(`${SUPERVISOR}/core/api${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`Home Assistant API ${res.status} bij ${path}`);
  const text = await res.text();
  try { return JSON.parse(text); } catch (err) { return text; }
}

// Everything Home Assistant can notify: the dashboard bell, and every
// notify.* service (each Companion-app phone/tablet registers one).
async function listNotifyTargets() {
  const services = await haFetch('/services');
  const notify = (services || []).find((s) => s.domain === 'notify');
  const names = notify ? Object.keys(notify.services || {}) : [];
  const targets = [{ id: 'persistent_notification', label: '🔔 Home Assistant-melding (dashboard, zichtbaar voor elke HA-gebruiker)' }];
  for (const n of names.sort()) {
    if (['notify', 'send_message', 'persistent_notification'].includes(n)) continue;
    const pretty = n.startsWith('mobile_app_') ? `📱 ${n.slice('mobile_app_'.length).replace(/_/g, ' ')}` : n;
    targets.push({ id: n, label: pretty });
  }
  return targets;
}

async function sendNotification(target, username, { title, message }) {
  const url = publicUrl() ? `${publicUrl()}/#/review` : null;
  if (target === 'persistent_notification') {
    return haFetch('/services/persistent_notification/create', {
      method: 'POST',
      body: {
        notification_id: `russisch_leren_${slug(username)}`,
        title,
        message: url ? `${message}\n\n[Open de app](${url})` : message
      }
    });
  }
  const body = { title, message };
  if (url) body.data = { url, clickAction: url };
  return haFetch(`/services/notify/${target}`, { method: 'POST', body });
}

function slug(username) {
  return String(username).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'gebruiker';
}

function learnerStats(userId) {
  const due = db
    .prepare("SELECT COUNT(*) c FROM user_word_progress WHERE user_id = ? AND next_review_at IS NOT NULL AND next_review_at <= datetime('now')")
    .get(userId).c;
  const correct = db.prepare('SELECT COUNT(*) c FROM attempts WHERE user_id = ? AND is_correct = 1').get(userId).c;
  const certs = db.prepare('SELECT COUNT(*) c FROM level_certifications WHERE user_id = ?').get(userId).c;
  const xp = correct * XP_PER_CORRECT + certs * XP_PER_CERTIFICATION;
  const studyDates = db.prepare('SELECT study_date FROM study_days WHERE user_id = ?').all(userId).map((r) => r.study_date);
  const { currentStreak, longestStreak } = computeStreak(studyDates);
  const mastered = db.prepare('SELECT COUNT(*) c FROM user_word_progress WHERE user_id = ? AND interval_days >= 6').get(userId).c;
  const today = new Date().toISOString().slice(0, 10);
  return { due, xp, level: levelForXp(xp), currentStreak, longestStreak, mastered, studiedToday: studyDates.includes(today), lastStudied: studyDates.sort().pop() || null };
}

function reminderText(username, s) {
  const body = s.due
    ? `${s.due} ${s.due === 1 ? 'woord wacht' : 'woorden wachten'} op herhaling. Tien minuten houdt je reeks van ${s.currentStreak} ${s.currentStreak === 1 ? 'dag' : 'dagen'} in leven.`
    : 'Nog niet geoefend vandaag. Een korte les houdt je reeks in leven.';
  return { title: `Russisch Leren — ${username}`, message: body };
}

// Once a minute (called from the push scheduler): every enabled learner
// whose local clock has passed the reminder time gets one notification per
// day, unless they already studied today.
async function sendDueReminders() {
  if (!available()) return;
  const rows = db.prepare('SELECT h.*, u.username FROM ha_notifications h JOIN users u ON u.id = h.user_id WHERE h.enabled = 1').all();
  const markSent = db.prepare('UPDATE ha_notifications SET last_sent_date = ? WHERE user_id = ?');
  for (const row of rows) {
    const { date, time } = localNow(row.time_zone);
    if (row.last_sent_date === date || time < row.reminder_time) continue;
    markSent.run(date, row.user_id);
    const s = learnerStats(row.user_id);
    if (s.studiedToday) continue;
    try {
      await sendNotification(row.target, row.username, reminderText(row.username, s));
    } catch (err) {
      console.warn(`HA-melding voor ${row.username} mislukt:`, err.message);
    }
  }
}

// Every few minutes: publish/refresh one sensor per learner who wants it.
async function updateSensors() {
  if (!available()) return;
  const rows = db.prepare('SELECT h.user_id, u.username FROM ha_notifications h JOIN users u ON u.id = h.user_id WHERE h.sensor_enabled = 1').all();
  for (const row of rows) {
    const s = learnerStats(row.user_id);
    try {
      await haFetch(`/states/sensor.russisch_leren_${slug(row.username)}`, {
        method: 'POST',
        body: {
          state: String(s.due),
          attributes: {
            friendly_name: `Russisch Leren – ${row.username}: te herhalen`,
            unit_of_measurement: 'woorden',
            icon: 'mdi:alphabet-cyrillic',
            streak: s.currentStreak,
            longest_streak: s.longestStreak,
            xp: s.xp,
            level: s.level.level,
            level_title: s.level.title,
            words_mastered: s.mastered,
            studied_today: s.studiedToday,
            last_studied: s.lastStudied,
            updated: new Date().toISOString()
          }
        }
      });
    } catch (err) {
      console.warn(`HA-sensor voor ${row.username} bijwerken mislukt:`, err.message);
    }
  }
}

function sensorEntityId(username) {
  return `sensor.russisch_leren_${slug(username)}`;
}

module.exports = { available, publicUrl, listNotifyTargets, sendNotification, sendDueReminders, updateSensors, learnerStats, reminderText, sensorEntityId };
