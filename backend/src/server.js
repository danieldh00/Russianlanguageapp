const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const lessonRoutes = require('./routes/lessons');
const exerciseRoutes = require('./routes/exercises');
const progressRoutes = require('./routes/progress');
const contentRoutes = require('./routes/content');
const syncRoutes = require('./routes/sync');

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

const FRONTEND_DIR = path.join(__dirname, '..', '..', 'frontend');
app.use(
  express.static(FRONTEND_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.webmanifest')) res.setHeader('Content-Type', 'application/manifest+json');
      if (filePath.endsWith('sw.js')) res.setHeader('Service-Worker-Allowed', '/');
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
