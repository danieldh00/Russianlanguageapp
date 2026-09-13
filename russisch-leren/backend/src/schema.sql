CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS grammar_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  example TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'A1',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  russian TEXT NOT NULL,
  transliteration TEXT,
  translation_nl TEXT NOT NULL,
  gender TEXT,
  notes TEXT,
  grammar_rule_id INTEGER REFERENCES grammar_rules(id),
  accented TEXT
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  word_id INTEGER REFERENCES words(id),
  grammar_rule_id INTEGER REFERENCES grammar_rules(id),
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options TEXT,
  explanation TEXT NOT NULL,
  context TEXT
);

-- Level exams (A1..C2): one row per sitting, plus the per-question answers so
-- the review screen can explain every mistake afterwards.
CREATE TABLE IF NOT EXISTS exam_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  level TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exam_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_attempt_id INTEGER NOT NULL REFERENCES exam_attempts(id),
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  given_answer TEXT,
  is_correct INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS level_certifications (
  user_id INTEGER NOT NULL REFERENCES users(id),
  level TEXT NOT NULL,
  exam_attempt_id INTEGER NOT NULL REFERENCES exam_attempts(id),
  passed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, level)
);

CREATE TABLE IF NOT EXISTS user_word_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  word_id INTEGER NOT NULL REFERENCES words(id),
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  next_review_at TEXT,
  last_reviewed_at TEXT,
  UNIQUE(user_id, word_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  given_answer TEXT,
  is_correct INTEGER NOT NULL,
  client_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS study_days (
  user_id INTEGER NOT NULL REFERENCES users(id),
  study_date TEXT NOT NULL,
  PRIMARY KEY (user_id, study_date)
);

CREATE INDEX IF NOT EXISTS idx_words_category ON words(category_id);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category_id);
CREATE INDEX IF NOT EXISTS idx_exercises_word ON exercises(word_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt ON exam_answers(exam_attempt_id);
CREATE INDEX IF NOT EXISTS idx_uwp_user ON user_word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exercise ON attempts(exercise_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_client_id ON attempts(user_id, client_id) WHERE client_id IS NOT NULL;
