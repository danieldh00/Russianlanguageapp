// Web Push: daily study reminders.
//
// The VAPID key pair identifies this server to the browsers' push services.
// It's generated once and kept in DATA_DIR (persistent add-on storage), so
// subscriptions survive restarts and updates -- regenerating the keys would
// silently invalidate every existing subscription.
const path = require('path');
const fs = require('fs');
const webpush = require('web-push');
const db = require('./db');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const KEY_FILE = path.join(DATA_DIR, 'vapid.json');
const VAPID_SUBJECT = 'https://github.com/danieldh00/Russianlanguageapp';

function loadOrCreateKeys() {
  if (fs.existsSync(KEY_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
      if (parsed.publicKey && parsed.privateKey) return parsed;
    } catch (err) {
      console.warn('vapid.json onleesbaar, nieuwe sleutels worden aangemaakt:', err.message);
    }
  }
  const keys = webpush.generateVAPIDKeys();
  fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2), { mode: 0o600 });
  return keys;
}

const keys = loadOrCreateKeys();
webpush.setVapidDetails(VAPID_SUBJECT, keys.publicKey, keys.privateKey);

const { localNow } = require('./localtime');
const ha = require('./ha');

function dueWordCount(userId) {
  return db
    .prepare("SELECT COUNT(*) c FROM user_word_progress WHERE user_id = ? AND next_review_at IS NOT NULL AND next_review_at <= datetime('now')")
    .get(userId).c;
}

function reminderPayload(userId, username) {
  const due = dueWordCount(userId);
  const body = due
    ? `${due} ${due === 1 ? 'woord wacht' : 'woorden wachten'} op herhaling. Tien minuten is genoeg om je reeks vast te houden.`
    : 'Nog niet geoefend vandaag. Een korte les houdt je reeks in leven.';
  return { title: `Russisch Leren — tijd voor ${username}`, body, url: '/#/dashboard' };
}

async function sendTo(row, payload) {
  try {
    await webpush.sendNotification(JSON.parse(row.subscription), JSON.stringify(payload), { TTL: 6 * 60 * 60 });
    return true;
  } catch (err) {
    // 404/410: the browser dropped the subscription (user revoked permission,
    // reinstalled the PWA, ...). Forget it so we stop trying.
    if (err.statusCode === 404 || err.statusCode === 410) {
      db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(row.id);
    } else {
      console.warn(`Pushmelding naar abonnement ${row.id} mislukt:`, err.statusCode || err.message);
    }
    return false;
  }
}

// Runs once a minute. For every enabled subscription whose local clock has
// passed its reminder time today: send one reminder, unless the user has
// already studied today. Comparing with >= (not ==) means a missed tick or
// a restart can't skip a day.
async function sendDueReminders() {
  const rows = db
    .prepare('SELECT s.*, u.username FROM push_subscriptions s JOIN users u ON u.id = s.user_id WHERE s.enabled = 1')
    .all();
  const markSent = db.prepare('UPDATE push_subscriptions SET last_sent_date = ? WHERE id = ?');
  for (const row of rows) {
    const { date, time } = localNow(row.time_zone);
    if (row.last_sent_date === date || time < row.reminder_time) continue;
    const studied = db.prepare('SELECT 1 FROM study_days WHERE user_id = ? AND study_date = ?').get(row.user_id, date);
    markSent.run(date, row.id); // one attempt per day, sent or not
    if (studied) continue;
    await sendTo(row, reminderPayload(row.user_id, row.username));
  }
}

let timer = null;
let sensorTimer = null;
function startScheduler() {
  if (timer) return;
  timer = setInterval(() => {
    sendDueReminders().catch((err) => console.warn('Herinneringen versturen mislukt:', err.message));
    ha.sendDueReminders().catch((err) => console.warn('HA-herinneringen versturen mislukt:', err.message));
  }, 60 * 1000);
  timer.unref();
  if (ha.available()) {
    console.log('Home Assistant API bereikbaar: sensoren en meldingen ingeschakeld.');
    const tick = () => ha.updateSensors().catch((err) => console.warn('HA-sensoren bijwerken mislukt:', err.message));
    setTimeout(tick, 5000);
    sensorTimer = setInterval(tick, 5 * 60 * 1000);
    sensorTimer.unref();
  }
}

module.exports = { publicKey: keys.publicKey, localNow, sendTo, reminderPayload, sendDueReminders, startScheduler };
