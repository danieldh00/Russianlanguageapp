'use strict';

// Unit test for the AI cost guard added alongside this suite (see
// src/rateLimit.js): every Anthropic call is billed, so a per-account budget
// has to actually block once exceeded, and must not leak between accounts.

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const rateLimit = require('../src/rateLimit');

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  res.setHeader = () => {};
  return res;
}

beforeEach(() => {
  rateLimit._buckets.clear();
});

test('aiGuard lets requests through under the burst budget, then blocks', () => {
  const req = { session: { userId: 42 } };
  let calls = 0;
  for (let i = 0; i < 20; i++) {
    const res = mockRes();
    rateLimit.aiGuard(req, res, () => { calls++; });
    assert.equal(res.statusCode, null, `call ${i + 1} should not be blocked`);
  }
  assert.equal(calls, 20);

  const blocked = mockRes();
  rateLimit.aiGuard(req, blocked, () => { calls++; });
  assert.equal(blocked.statusCode, 429);
  assert.equal(calls, 20, 'the 21st call must not reach the route handler');
});

test('aiGuard tracks each account separately', () => {
  const resA = mockRes();
  rateLimit.aiGuard({ session: { userId: 1 } }, resA, () => {});
  const resB = mockRes();
  rateLimit.aiGuard({ session: { userId: 2 } }, resB, () => {});
  assert.equal(resA.statusCode, null);
  assert.equal(resB.statusCode, null, "account 2's budget must be untouched by account 1's calls");
});

test('loginGuard blocks after LOGIN_MAX failures from the same IP', () => {
  const req = { ip: '203.0.113.5', body: { username: 'daniel' } };
  for (let i = 0; i < 10; i++) {
    const res = mockRes();
    rateLimit.loginGuard(req, res, () => {});
    assert.equal(res.statusCode, null);
    rateLimit.noteLoginFailure(req);
  }
  const blocked = mockRes();
  rateLimit.loginGuard(req, blocked, () => {});
  assert.equal(blocked.statusCode, 429);
});

test('clearLoginFailures resets the budget after a successful login', () => {
  const req = { ip: '203.0.113.9', body: { username: 'someone' } };
  for (let i = 0; i < 10; i++) rateLimit.noteLoginFailure(req);
  rateLimit.clearLoginFailures(req);
  const res = mockRes();
  rateLimit.loginGuard(req, res, () => {});
  assert.equal(res.statusCode, null);
});
