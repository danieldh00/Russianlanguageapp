'use strict';

// Keeping near-identical questions apart.
//
// A word usually has several exercises: for the letter Ж the alphabet lesson
// asks "Hoe klinkt de letter 'Ж ж'?" and "Welke letter klinkt als 'zj'?".
// Asking those back to back is not practice -- the first question hands you
// the answer to the second. The client applies the same rule to lessons,
// the daily review and the mistakes session (frontend/js/app.js); this is
// the copy the level exams use.

const MIN_RELATED_GAP = 3;

// ́ is the combining stress mark: it sits between the letters of an
// accented word, so without it 'де́вять' would match only 'де'.
const CYRILLIC_RUN = /[Ѐ-ӿ][Ѐ-ӿ́\s.,!?'"()-]*[Ѐ-ӿ́]|[Ѐ-ӿ]/;

// Same forgiving comparison as grading.js: stress marks, ё/е, case and
// surrounding punctuation never make two spellings count as different.
function normalize(value) {
  return (value == null ? '' : String(value))
    .normalize('NFC')
    .replace(/́/g, '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s ]+/g, ' ')
    .replace(/^[\s.,!?;:«»"'()-]+|[\s.,!?;:«»"'()-]+$/g, '')
    .trim();
}

const QUOTED_CYRILLIC = /'([^']*[\u0400-\u04ff][^']*)'/;

// What a question is "about", as a set of keys. Two questions sharing any key
// are near-identical: the same word, the same answer, or the same Russian
// subject the question quotes.
function relatedKeys(row) {
  const keys = new Set();
  const wordId = row.word_id != null ? row.word_id : row.wordId;
  if (wordId != null) keys.add(`w:${wordId}`);
  const answer = normalize(row.correct_answer != null ? row.correct_answer : row.correctAnswer);
  if (answer) keys.add(`a:${answer}`);
  // The Russian the question quotes, which is the word it is about. Only what
  // is between quotes counts: the Russian in a cloze sentence or a reading
  // text is the material, not the subject.
  const quoted = String(row.prompt || '').match(QUOTED_CYRILLIC);
  const run = quoted && quoted[1].match(CYRILLIC_RUN);
  if (run) {
    const subject = normalize(run[0]);
    if (subject && subject.length <= 20 && subject.split(' ').length <= 2) keys.add(`a:${subject}`);
  }
  return [...keys];
}

// Reorders a picked set so questions about the same thing end up apart. Each
// step takes a question whose subject has been away at least `minGap` places
// (or, if none has, the one away the longest), and among those the one with
// the most questions still waiting on the same subject -- otherwise the
// duplicates all sink to the end and cluster there instead. Ties keep the
// given order, so a due-first or exam ordering survives untouched when
// nothing conflicts. Ten questions about five words come out as five, then
// the other five, rather than in pairs.
function spreadRelated(items, minGap = MIN_RELATED_GAP) {
  if (items.length < 3) return [...items];
  const remaining = items.map((item) => ({ item, keys: relatedKeys(item) }));
  const left = new Map();
  remaining.forEach((r) => r.keys.forEach((key) => left.set(key, (left.get(key) || 0) + 1)));
  const lastSeen = new Map();
  const out = [];
  while (remaining.length) {
    let chosen = 0, bestGap = -1, bestGroup = -1;
    for (let i = 0; i < remaining.length; i++) {
      let gap = minGap, group = 1;
      for (const key of remaining[i].keys) {
        if (lastSeen.has(key)) gap = Math.min(gap, out.length - lastSeen.get(key));
        group = Math.max(group, left.get(key) || 1);
      }
      if (gap > bestGap || (gap === bestGap && group > bestGroup)) { bestGap = gap; bestGroup = group; chosen = i; }
    }
    const [taken] = remaining.splice(chosen, 1);
    taken.keys.forEach((key) => { lastSeen.set(key, out.length); left.set(key, (left.get(key) || 1) - 1); });
    out.push(taken.item);
  }
  return out;
}

module.exports = { MIN_RELATED_GAP, relatedKeys, spreadRelated };
