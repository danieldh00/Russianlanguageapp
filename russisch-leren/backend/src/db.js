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

// Columns added after a table's first release. schema.sql creates fresh
// tables with all columns already; this only patches databases that predate
// a column (ALTER TABLE ADD COLUMN is the one schema change SQLite supports
// in place, and it never touches existing rows).
function migrateLegacyColumns() {
  const hasTable = (name) => !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  const addColumnIfMissing = (table, column, ddl) => {
    if (!hasTable(table)) return;
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
    if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  };
  addColumnIfMissing('attempts', 'client_id', 'TEXT');
  addColumnIfMissing('exercises', 'context', 'TEXT'); // reading passage / text spoken aloud for listening
  addColumnIfMissing('words', 'accented', 'TEXT'); // stress-marked form, e.g. молоко́
}

migrateLegacyColumns();

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
