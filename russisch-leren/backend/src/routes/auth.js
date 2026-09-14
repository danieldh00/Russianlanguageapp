const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { loginGuard, noteLoginFailure, clearLoginFailures, registerGuard } = require('../rateLimit');

const router = express.Router();

// A fresh session id the moment someone authenticates: whatever id the
// browser was carrying before login (possibly set by someone else) is thrown
// away, so a planted cookie cannot become a logged-in one.
function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

function publicUser(row) {
  return { id: row.id, username: row.username, email: row.email, created_at: row.created_at };
}

router.post('/register', registerGuard, async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !password || username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: 'Gebruikersnaam (min. 3 tekens) en wachtwoord (min. 6 tekens) zijn verplicht.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Deze gebruikersnaam bestaat al.' });

  const password_hash = await bcrypt.hash(password, 10);
  const info = db
    .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email || null, password_hash);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  await startSession(req, user.id);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', loginGuard, async (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '');
  // Hash a throwaway value for an unknown user too, so the response time does
  // not tell an attacker which usernames exist.
  const hash = user ? user.password_hash : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
  const ok = await bcrypt.compare(password || '', hash);
  if (!user || !ok) {
    noteLoginFailure(req);
    return res.status(401).json({ error: 'Ongeldige gebruikersnaam of wachtwoord.' });
  }

  clearLoginFailures(req);
  await startSession(req, user.id);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('russisch.sid');
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Niet ingelogd.' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'Niet ingelogd.' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
