const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { forms } = require('../../seed/data');

const router = express.Router();

// GET /api/words/:id/forms -> the full inflection table of a word (from the
// Open Russian dictionary, see seed/data/SOURCES.md): cases for nouns and
// adjectives, persons/tenses/imperative for verbs, plus aspect partner and
// comparative where known. Fetched on demand (it's ~600 KB for all words,
// too much to keep in the offline bundle), so this is online-only.
router.get('/:id/forms', requireAuth, (req, res) => {
  const word = db.prepare('SELECT id, russian, translation_nl FROM words WHERE id = ?').get(req.params.id);
  if (!word) return res.status(404).json({ error: 'Woord niet gevonden.' });
  const morph = forms[word.russian.trim().toLowerCase()];
  if (!morph || !morph.forms) return res.status(404).json({ error: 'Voor dit woord zijn geen vormen bekend.' });
  res.json({
    id: word.id,
    russian: word.russian,
    translation: word.translation_nl,
    pos: morph.pos,
    accented: morph.accented || null,
    gender: morph.gender || null,
    animate: morph.animate,
    aspect: morph.aspect || null,
    partner: morph.partner || null,
    comparative: morph.comparative || null,
    superlative: morph.superlative || null,
    forms: morph.forms
  });
});

module.exports = router;
