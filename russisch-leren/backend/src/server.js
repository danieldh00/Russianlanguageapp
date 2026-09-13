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

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
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
app.use('/api/ai', aiRoutes);

const FRONTEND_DIR = path.join(__dirname, '..', '..', 'frontend');

// Hashing the app-shell files at boot gives the service worker an automatic,
// content-derived cache-busting version -- so a deploy that changes the app
// always forces installed PWAs to fetch fresh assets, without depending on
// remembering to bump a version string in sw.js by hand (the bug that left
// users stuck seeing an old version until they manually cleared their cache).
const APP_SHELL_FILES = ['index.html', 'css/style.css', 'js/app.js', 'js/storage.js', 'js/srs.js', 'manifest.webmanifest'];
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
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Er is een serverfout opgetreden.' });
});

app.listen(PORT, () => {
  console.log(`Russian learning app draait op http://localhost:${PORT}`);
});
