const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// DATA_DIR override lets this run as a Home Assistant Add-on, where Supervisor
// always provides persistent per-app storage at /data (set via config.yaml's
// `environment`); the plain-Docker/local-dev default is unchanged.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'russian.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrateLegacyColumns() {
  const attemptsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='attempts'").get();
  if (!attemptsTable) return; // fresh database: schema.sql below creates the table with all columns already

  const columns = db.prepare('PRAGMA table_info(attempts)').all().map((c) => c.name);
  if (!columns.includes('client_id')) {
    db.exec('ALTER TABLE attempts ADD COLUMN client_id TEXT');
  }
}

migrateLegacyColumns();

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
