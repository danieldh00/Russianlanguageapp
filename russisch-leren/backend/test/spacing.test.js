'use strict';

// Pure-function unit test, no server needed: the spacing rule that keeps two
// questions about the same word from landing back to back (see spacing.js
// and CLAUDE.md's "Valkuilen" section -- the frontend has an equivalent
// implementation in app.js that must stay in sync with this one).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MIN_RELATED_GAP, spreadRelated } = require('../src/spacing');

function gapsFor(items, key) {
  const positions = [];
  items.forEach((it, i) => {
    if (it.word_id === key) positions.push(i);
  });
  const gaps = [];
  for (let i = 1; i < positions.length; i++) gaps.push(positions[i] - positions[i - 1]);
  return gaps;
}

test('spreadRelated keeps questions about the same word at least MIN_RELATED_GAP apart', () => {
  const items = [
    { id: 1, word_id: 'zh', correct_answer: 'a', prompt: '' },
    { id: 2, word_id: 'zh', correct_answer: 'b', prompt: '' },
    { id: 3, word_id: 'other1', correct_answer: 'c', prompt: '' },
    { id: 4, word_id: 'other2', correct_answer: 'd', prompt: '' },
    { id: 5, word_id: 'other3', correct_answer: 'e', prompt: '' }
  ];
  const out = spreadRelated(items);
  assert.equal(out.length, items.length);
  for (const gap of gapsFor(out, 'zh')) assert.ok(gap >= MIN_RELATED_GAP, `gap ${gap} < ${MIN_RELATED_GAP}`);
});

test('spreadRelated treats a shared correct_answer as related too', () => {
  const items = [
    { id: 1, word_id: 'w1', correct_answer: 'вода' },
    { id: 2, word_id: 'w2', correct_answer: 'вода' },
    { id: 3, word_id: 'w3', correct_answer: 'x' },
    { id: 4, word_id: 'w4', correct_answer: 'y' }
  ];
  const out = spreadRelated(items);
  const positions = out.map((it, i) => (it.correct_answer === 'вода' ? i : -1)).filter((i) => i >= 0);
  assert.equal(positions.length, 2);
  assert.ok(positions[1] - positions[0] >= Math.min(MIN_RELATED_GAP, items.length - 1));
});

test('spreadRelated leaves fewer than 3 items untouched', () => {
  const items = [{ id: 1, word_id: 'a' }, { id: 2, word_id: 'a' }];
  assert.deepEqual(spreadRelated(items), items);
});
