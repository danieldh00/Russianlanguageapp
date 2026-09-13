#!/usr/bin/env node
// Dev-time build script (not run at app boot). Reads the Open Russian
// dictionary CSV dump (CC-BY-SA 4.0, https://github.com/Badestrand/russian-dictionary)
// plus the OpenSubtitles-derived frequency list (MIT,
// https://github.com/hermitdave/FrequencyWords) and writes a compact JSON
// with stress-marked forms + morphology for every word the app uses, so the
// seed can show stress marks and generate conjugation/declension drills.
//
// Usage:
//   node seed/import/build-openrussian.js --dict <dir-with-csvs> --freq <ru_50k.txt> [--candidates <out-dir>]
//
// With --candidates it also writes per-level candidate word lists (by
// frequency rank, excluding words the app already has) that a human then
// translates into Dutch -- the dictionary only carries EN/DE glosses.

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}
const DICT_DIR = arg('--dict');
const FREQ_FILE = arg('--freq');
const CANDIDATES_DIR = arg('--candidates', null);
if (!DICT_DIR || !FREQ_FILE) {
  console.error('Usage: build-openrussian.js --dict <dir> --freq <ru_50k.txt> [--candidates <dir>]');
  process.exit(1);
}

const OUT_FILE = path.join(__dirname, '..', 'data', 'generated', 'openrussian-forms.json');

function readTsv(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const head = lines[0].split('\t').map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const cells = l.split('\t');
    const row = {};
    head.forEach((h, i) => (row[h] = (cells[i] || '').trim()));
    return row;
  });
}

// Open Russian marks stress with an apostrophe after the vowel ("челове'к");
// convert to the combining acute accent so it renders as челове́к.
function toCombiningStress(s) {
  return s ? s.replace(/'/g, '́') : s;
}

const nouns = readTsv(path.join(DICT_DIR, 'nouns.csv'));
const verbs = readTsv(path.join(DICT_DIR, 'verbs.csv'));
const adjectives = readTsv(path.join(DICT_DIR, 'adjectives.csv'));
const others = readTsv(path.join(DICT_DIR, 'others.csv'));

const freqRank = new Map();
fs.readFileSync(FREQ_FILE, 'utf8')
  .split('\n')
  .forEach((line, i) => {
    const [w] = line.split(' ');
    if (w && !freqRank.has(w)) freqRank.set(w, i + 1);
  });

// index by bare form; first occurrence wins (the dump lists common senses first)
const byBare = new Map();
function add(pos, row, extract) {
  if (!row.bare || byBare.has(row.bare)) return;
  byBare.set(row.bare, { pos, accented: toCombiningStress(row.accented || row.bare), en: row.translations_en, de: row.translations_de, ...extract(row) });
}
nouns.forEach((r) =>
  add('noun', r, (row) => ({
    gender: row.gender || null,
    animate: row.animate === '1',
    indeclinable: row.indeclinable === '1',
    forms: {
      sg_nom: row.sg_nom, sg_gen: row.sg_gen, sg_dat: row.sg_dat, sg_acc: row.sg_acc, sg_inst: row.sg_inst, sg_prep: row.sg_prep,
      pl_nom: row.pl_nom, pl_gen: row.pl_gen, pl_dat: row.pl_dat, pl_acc: row.pl_acc, pl_inst: row.pl_inst, pl_prep: row.pl_prep
    }
  }))
);
verbs.forEach((r) =>
  add('verb', r, (row) => ({
    aspect: row.aspect || null,
    partner: row.partner ? row.partner.split(';')[0] : null,
    forms: {
      imperative_sg: row.imperative_sg, imperative_pl: row.imperative_pl,
      past_m: row.past_m, past_f: row.past_f, past_n: row.past_n, past_pl: row.past_pl,
      presfut_sg1: row.presfut_sg1, presfut_sg2: row.presfut_sg2, presfut_sg3: row.presfut_sg3,
      presfut_pl1: row.presfut_pl1, presfut_pl2: row.presfut_pl2, presfut_pl3: row.presfut_pl3
    }
  }))
);
adjectives.forEach((r) =>
  add('adjective', r, (row) => ({
    comparative: row.comparative || null,
    superlative: row.superlative || null,
    forms: {
      m_nom: row.decl_m_nom, f_nom: row.decl_f_nom, n_nom: row.decl_n_nom, pl_nom: row.decl_pl_nom,
      m_gen: row.decl_m_gen, f_gen: row.decl_f_gen, m_dat: row.decl_m_dat, m_inst: row.decl_m_inst, m_prep: row.decl_m_prep,
      short_m: row.short_m, short_f: row.short_f, short_n: row.short_n, short_pl: row.short_pl
    }
  }))
);
others.forEach((r) => add('other', r, () => ({})));

// strip stress marks from form cells too (they use the same apostrophe convention)
for (const entry of byBare.values()) {
  if (!entry.forms) continue;
  for (const k of Object.keys(entry.forms)) entry.forms[k] = toCombiningStress(entry.forms[k]) || null;
  if (entry.comparative) entry.comparative = toCombiningStress(entry.comparative);
  if (entry.superlative) entry.superlative = toCombiningStress(entry.superlative);
}

// ---- words the app uses: everything in the seed data, matched on bare form ----
// all levels (base A1/A2 files + levels/*.js + vocab packs), via the aggregator
const seedWords = require('../data').words;
const appBare = new Set(seedWords.map((w) => w.russian.trim().toLowerCase()));

const out = {};
let matched = 0;
for (const bare of appBare) {
  const entry = byBare.get(bare);
  if (!entry) continue;
  matched++;
  out[bare] = { ...entry, rank: freqRank.get(bare) || null };
}
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(out));
console.log(`openrussian-forms.json: ${matched}/${appBare.size} app words matched, ${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KB`);

// ---- optional: candidate lists for human translation, by frequency band ----
if (CANDIDATES_DIR) {
  const bands = { b1: [1500, 4000], b2: [4000, 8000], c1: [8000, 15000], c2: [15000, 30000] };
  const quota = { b1: { noun: 110, verb: 60, adjective: 30 }, b2: { noun: 110, verb: 60, adjective: 30 }, c1: { noun: 80, verb: 50, adjective: 30 }, c2: { noun: 60, verb: 40, adjective: 30 } };
  fs.mkdirSync(CANDIDATES_DIR, { recursive: true });
  for (const [level, [lo, hi]] of Object.entries(bands)) {
    const picked = { noun: [], verb: [], adjective: [] };
    const ranked = [...byBare.entries()]
      .map(([bare, e]) => ({ bare, rank: freqRank.get(bare) || Infinity, ...e }))
      .filter((e) => e.rank > lo && e.rank <= hi && !appBare.has(e.bare) && picked[e.pos])
      .filter((e) => /^[а-яё-]+$/.test(e.bare)) // skip names, abbreviations, multi-word
      .sort((a, b) => a.rank - b.rank);
    for (const e of ranked) {
      if (picked[e.pos].length < quota[level][e.pos]) picked[e.pos].push(e);
    }
    const lines = [];
    for (const pos of ['noun', 'verb', 'adjective']) {
      for (const e of picked[pos]) {
        const extra = pos === 'noun' ? e.gender : pos === 'verb' ? `${e.aspect}${e.partner ? ' / ' + e.partner : ''}` : '';
        lines.push(`${e.bare}\t${e.accented}\t${pos}\t${extra}\t${e.rank}\t${e.en}\t${e.de}`);
      }
    }
    fs.writeFileSync(path.join(CANDIDATES_DIR, `candidates-${level}.tsv`), lines.join('\n'));
    console.log(`candidates-${level}.tsv: ${lines.length} words`);
  }
}
