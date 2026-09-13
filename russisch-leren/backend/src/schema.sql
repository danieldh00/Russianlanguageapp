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
  accented TEXT,
  example_ru TEXT,
  example_nl TEXT
);

-- Web Push subscriptions for the daily study reminder. One row per
-- device/browser (endpoint); the reminder fires at `reminder_time` in the
-- device's own time zone, and only on days the user hasn't studied yet.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  endpoint TEXT UNIQUE NOT NULL,
  subscription TEXT NOT NULL,
  reminder_time TEXT NOT NULL DEFAULT '19:00',
  time_zone TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  enabled INTEGER NOT NULL DEFAULT 1,
  last_sent_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
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

-- Home Assistant integration: which HA notify target (a Companion-app
-- device, or the HA dashboard notification) belongs to this learner, when
-- to remind, and whether to publish a sensor with their review backlog.
CREATE TABLE IF NOT EXISTS ha_notifications (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  target TEXT NOT NULL DEFAULT 'persistent_notification',
  enabled INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT NOT NULL DEFAULT '19:00',
  time_zone TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  sensor_enabled INTEGER NOT NULL DEFAULT 1,
  last_sent_date TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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

-- XP for activities that aren't exercise answers: keyboard rounds, number
-- dictation, dialogue turns. The server decides the XP per kind; the
-- client only reports what happened (idempotent per client_id).
CREATE TABLE IF NOT EXISTS activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  xp INTEGER NOT NULL,
  detail TEXT,
  client_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_client ON activity_events(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_events(user_id);

CREATE TABLE IF NOT EXISTS study_days (
  user_id INTEGER NOT NULL REFERENCES users(id),
  study_date TEXT NOT NULL,
  PRIMARY KEY (user_id, study_date)
);

-- Per-account learning goal and the streak freezes they hold. Kept on the
-- server (not in localStorage) so the goal and the freeze balance follow the
-- learner to every device they log in on.
CREATE TABLE IF NOT EXISTS user_prefs (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  weekly_goal_xp INTEGER NOT NULL DEFAULT 500,
  weekly_goal_days INTEGER NOT NULL DEFAULT 5,
  freezes INTEGER NOT NULL DEFAULT 0,
  last_freeze_streak INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A spent streak freeze: the learner missed this day, and a freeze they had
-- saved up covered it, so the streak survives. Recorded rather than computed
-- on the fly, so the same day can never be covered twice and the streak stays
-- reproducible.
CREATE TABLE IF NOT EXISTS streak_freezes (
  user_id INTEGER NOT NULL REFERENCES users(id),
  freeze_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, freeze_date)
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
