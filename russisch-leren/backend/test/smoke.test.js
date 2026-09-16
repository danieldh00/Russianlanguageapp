'use strict';

// End-to-end smoke test against the real server process (own temp DATA_DIR,
// own port), so it exercises the actual boot path -- seed sync, sessions,
// auth, the content bundle -- instead of mocking pieces of it.
//
// This is deliberately not a replacement for the historical Playwright UI
// suites (test-v16..v24, test-exam.js): those lived in a session-specific
// scratchpad and are not recoverable here. This suite covers the backend
// contract so at least *something* runs in CI on every push; a full browser
// suite is a separate, larger effort.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const ROOT = path.join(__dirname, '..');
const PORT = 3901;
const BASE = `http://127.0.0.1:${PORT}`;
const BOOT_TIMEOUT_MS = 60000;

let serverProcess;
let dataDir;

function waitForBoot(proc, timeoutMs) {
  return new Promise((resolve, reject) => {
    let out = '';
    const timer = setTimeout(() => {
      reject(new Error(`Server niet gestart binnen ${timeoutMs}ms. Output tot nu toe:\n${out}`));
    }, timeoutMs);
    const onData = (chunk) => {
      out += chunk.toString();
      if (out.includes('draait op http://localhost')) {
        clearTimeout(timer);
        proc.stdout.off('data', onData);
        resolve();
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', (chunk) => { out += chunk.toString(); });
    proc.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Server stopte tijdens het opstarten (exit ${code}). Output:\n${out}`));
    });
  });
}

function firstCookie(res) {
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return set.length ? set[0].split(';')[0] : null;
}

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'russisch-leren-test-'));
  serverProcess = spawn(process.execPath, ['src/server.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      DATA_DIR: dataDir,
      SESSION_SECRET: 'test-secret-for-ci',
      PORT: String(PORT),
      ANTHROPIC_API_KEY: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await waitForBoot(serverProcess, BOOT_TIMEOUT_MS);
});

after(() => {
  if (serverProcess) serverProcess.kill();
  if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
});

test('GET /api/health reports ok', async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
});

test('protected routes require a session', async () => {
  const res = await fetch(`${BASE}/api/content`);
  assert.equal(res.status, 401);
});

test('register -> me -> logout round-trip', async () => {
  const username = `test_${Date.now()}`;
  const registerRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: 'hunter22' })
  });
  assert.equal(registerRes.status, 201);
  const cookie = firstCookie(registerRes);
  assert.ok(cookie, 'register should set a session cookie');

  const meRes = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(meRes.status, 200);
  const me = await meRes.json();
  assert.equal(me.user.username, username);

  const contentRes = await fetch(`${BASE}/api/content`, { headers: { Cookie: cookie } });
  assert.equal(contentRes.status, 200);
  const content = await contentRes.json();
  assert.ok(Array.isArray(content.categories) && content.categories.length > 0, 'seeded content should be non-empty');

  const logoutRes = await fetch(`${BASE}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
  assert.equal(logoutRes.status, 200);

  const afterLogout = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(afterLogout.status, 401);
});

test('registration rejects a too-short password', async () => {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `short_${Date.now()}`, password: '123' })
  });
  assert.equal(res.status, 400);
});

test('the AI cost guard blocks a burst of calls before it ever reaches Anthropic', async () => {
  const username = `ai_${Date.now()}`;
  const registerRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: 'hunter22' })
  });
  const cookie = firstCookie(registerRes);

  let sawTooManyRequests = false;
  for (let i = 0; i < 25; i++) {
    const res = await fetch(`${BASE}/api/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ exerciseId: 1, givenAnswer: 'x' })
    });
    // Without an ANTHROPIC_API_KEY every allowed call answers 503 ("niet
    // geconfigureerd"); the guard itself must eventually answer 429 first.
    if (res.status === 429) { sawTooManyRequests = true; break; }
    assert.equal(res.status, 503);
  }
  assert.ok(sawTooManyRequests, 'expected the burst limiter to trip within 25 calls');
});
