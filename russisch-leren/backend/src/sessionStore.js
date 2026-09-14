// Session store on the add-on's own SQLite database.
//
// express-session's default MemoryStore keeps every session in the Node
// process: it warns on boot, it leaks (nothing ever evicts an expired
// session), and every add-on restart logs everyone out. Sessions are the one
// thing that decides who may read someone else's progress, so they belong in
// the same durable place as the rest of the data.
const session = require('express-session');
const db = require('./db');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`);

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function expiryOf(sess) {
  const cookie = sess && sess.cookie;
  if (cookie && cookie.expires) return new Date(cookie.expires).getTime();
  const maxAge = cookie && cookie.originalMaxAge;
  return Date.now() + (Number.isFinite(maxAge) ? maxAge : DEFAULT_TTL_MS);
}

class SqliteSessionStore extends session.Store {
  constructor() {
    super();
    this.selectStmt = db.prepare('SELECT data, expires_at FROM sessions WHERE sid = ?');
    this.upsertStmt = db.prepare(
      'INSERT INTO sessions (sid, expires_at, data) VALUES (?, ?, ?) ' +
      'ON CONFLICT(sid) DO UPDATE SET expires_at = excluded.expires_at, data = excluded.data'
    );
    this.touchStmt = db.prepare('UPDATE sessions SET expires_at = ? WHERE sid = ?');
    this.deleteStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
    this.purgeStmt = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
    this.countStmt = db.prepare('SELECT COUNT(*) c FROM sessions WHERE expires_at > ?');
    this.purge();
  }

  // Expired rows are deleted rather than merely ignored, so a long-running
  // instance does not accumulate them.
  purge() {
    try { return this.purgeStmt.run(Date.now()).changes; } catch (e) { return 0; }
  }

  get(sid, cb) {
    try {
      const row = this.selectStmt.get(sid);
      if (!row) return cb(null, null);
      if (row.expires_at <= Date.now()) {
        this.deleteStmt.run(sid);
        return cb(null, null);
      }
      return cb(null, JSON.parse(row.data));
    } catch (err) {
      return cb(err);
    }
  }

  set(sid, sess, cb) {
    try {
      this.upsertStmt.run(sid, expiryOf(sess), JSON.stringify(sess));
      return cb(null);
    } catch (err) {
      return cb(err);
    }
  }

  touch(sid, sess, cb) {
    try {
      this.touchStmt.run(expiryOf(sess), sid);
      return cb(null);
    } catch (err) {
      return cb(err);
    }
  }

  destroy(sid, cb) {
    try {
      this.deleteStmt.run(sid);
      return cb(null);
    } catch (err) {
      return cb(err);
    }
  }

  length(cb) {
    try {
      return cb(null, this.countStmt.get(Date.now()).c);
    } catch (err) {
      return cb(err);
    }
  }
}

module.exports = { SqliteSessionStore };
