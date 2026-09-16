const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('./loadAddonOptions').loadAddonOptions();
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const session = require('express-session');
const db = require('./db');
const { seedDatabase } = require('../seed/seed');

// Load/refresh the lesson content on every boot: on a fresh database this
// is the first-boot seed, and on an already-provisioned one it's how new
// content added to the seed data files (new categories/words/grammar
// rules/exercises) reaches a live install. It never touches `attempts` or
// `user_word_progress`, so real accounts and progress are never at risk.
console.log('Lesinhoud synchroniseren...');
console.log('Sync voltooid:', seedDatabase());

const authRoutes = require('./routes/auth');
const lessonRoutes = require('./routes/lessons');
const exerciseRoutes = require('./routes/exercises');
const progressRoutes = require('./routes/progress');
const contentRoutes = require('./routes/content');
const syncRoutes = require('./routes/sync');
const aiRoutes = require('./routes/ai');
const leaderboardRoutes = require('./routes/leaderboard');
const { router: examRoutes } = require('./routes/exams');
const pushRoutes = require('./routes/push');
const wordRoutes = require('./routes/words');
const haRoutes = require('./routes/ha');
const { startScheduler: startReminderScheduler } = require('./push');
const { SqliteSessionStore } = require('./sessionStore');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

// Home Assistant's Ingress and a Cloudflare Tunnel both put a reverse proxy in
// front of this server. Trusting one hop lets req.ip report the real client
// (so the login limiter counts the right thing) and lets the session cookie
// know whether the browser is really on HTTPS.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Everything this app loads comes from itself, apart from the two Google Fonts
// hosts. Saying so closes off injected scripts and framing by other sites;
// 'self' as a frame-ancestor is what keeps the Ingress iframe working, since
// Ingress serves the add-on from the Home Assistant origin.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join('; ');

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
  // The app asks for the microphone itself (speech recognition); nothing else
  // is ever needed, so the rest is switched off at the browser level.
  res.setHeader('Permissions-Policy', 'microphone=(self), camera=(), geolocation=(), payment=(), usb=()');
  // Only meaningful -- and only sent -- when the browser is already on HTTPS.
  // A month, so a mistake here cannot lock anyone out for long.
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=2592000');
  next();
});

app.use(express.json({ limit: '256kb' }));
app.use(
  session({
    name: 'russisch.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new SqliteSessionStore(),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      // 'auto' marks the cookie Secure on an HTTPS request and leaves it
      // unmarked on plain HTTP, so the tunnel gets a secure cookie without
      // breaking http://<pi>:3000 on the home network.
      secure: 'auto'
    }
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/ha', haRoutes);
app.use('/api/ai', aiRoutes);

// Unauthenticated on purpose: an external uptime check (Uptime Kuma, HA's
// own REST binary_sensor, ...) needs to reach this without a session cookie.
// It only proves the process is up and the database is readable, nothing
// user-specific.
app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', version: APP_VERSION });
  } catch (err) {
    res.status(503).json({ status: 'error', error: err.message });
  }
});

const FRONTEND_DIR = path.join(__dirname, '..', '..', 'frontend');

// Hashing the app-shell files at boot gives the service worker an automatic,
// content-derived cache-busting version -- so a deploy that changes the app
// always forces installed PWAs to fetch fresh assets, without depending on
// remembering to bump a version string in sw.js by hand (the bug that left
// users stuck seeing an old version until they manually cleared their cache).
const APP_SHELL_FILES = [
  'index.html', 'css/style.css',
  'js/app.js', 'js/core.js', 'js/storage.js', 'js/srs.js',
  'js/sync.js', 'js/nav.js', 'js/auth-views.js', 'js/dashboard.js', 'js/tools-menu.js',
  'js/speech-input.js', 'js/dialogue.js', 'js/keyboard-trainer.js', 'js/phrasebook.js',
  'js/dictation.js', 'js/match-game.js', 'js/stories.js', 'js/handwriting.js',
  'js/review-mistakes.js', 'js/exam.js', 'js/progress.js', 'js/goals.js', 'js/settings.js', 'js/leaderboard.js',
  'manifest.webmanifest'
];
function computeAppVersion() {
  const hash = crypto.createHash('sha256');
  for (const file of APP_SHELL_FILES) hash.update(fs.readFileSync(path.join(FRONTEND_DIR, file)));
  return hash.digest('hex').slice(0, 12);
}
const APP_VERSION = computeAppVersion();

// Served dynamically (ahead of express.static below) so the cache name inside
// can be substituted per-deploy, and so the script itself is never cached by
// the browser's HTTP cache -- both are required for the browser to reliably
// notice a new version and swap it in.
app.get('/sw.js', (req, res) => {
  const template = fs.readFileSync(path.join(FRONTEND_DIR, 'sw.js'), 'utf8');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Service-Worker-Allowed', '/');
  res.send(template.replaceAll('__CACHE_VERSION__', APP_VERSION));
});

app.use(
  express.static(FRONTEND_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.webmanifest')) res.setHeader('Content-Type', 'application/manifest+json');
    }
  })
);
// The app shell references its CSS, JS and icons relatively so that it also
// works under Ingress, where it is served from /api/hassio_ingress/<token>/.
// That means index.html may only be answered on a path ending in a slash --
// from anywhere else the browser would resolve "js/app.js" against the wrong
// directory. Deep links are bounced to the root; routing happens on the hash.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (req.path.endsWith('/')) return res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  res.redirect(302, '/');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Er is een serverfout opgetreden.' });
});

app.listen(PORT, () => {
  console.log(`Russian learning app draait op http://localhost:${PORT}`);
  startReminderScheduler();
});
