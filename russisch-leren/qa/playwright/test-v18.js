const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const USERNAME = 'v18_' + Date.now();
const PASSWORD = 'secret123';

function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(BASE + '/#/register');
  await page.fill('#username', USERNAME);
  await page.fill('#password', PASSWORD);
  await page.click('#register-form button[type=submit]');
  await page.waitForSelector('.level-section', { timeout: 15000 });

  const statsBefore = await page.evaluate(async () => (await fetch('/api/progress/stats')).json());
  if (statsBefore.xp === 0 && statsBefore.currentStreak === 0) ok('fresh account: 0 XP, streak 0'); else fail('start stats', statsBefore);

  // ---- keyboard round: type all 10 drill items ----
  await page.goto(BASE + '/#/keyboard');
  await page.waitForSelector('#kb-input', { timeout: 10000 });
  for (let i = 0; i < 10; i++) {
    const target = await page.locator('#kb-target').textContent();
    await page.type('#kb-input', target);
    await page.waitForTimeout(80);
    if (await page.locator('#kb-again').count()) break;
  }
  await page.waitForSelector('#kb-again', { timeout: 5000 });
  const done = await page.locator('.keyboard-trainer .card h2').textContent();
  if (/\+\d+ XP/.test(done)) ok('keyboard round finished with XP badge: ' + done.trim()); else fail('xp badge', done);
  await page.waitForTimeout(2000);
  const s1 = await page.evaluate(async () => (await fetch('/api/progress/stats')).json());
  if (s1.xp >= 20 && s1.activityXp >= 20 && s1.currentStreak === 1) ok(`server credited keyboard round: xp=${s1.xp} (activity ${s1.activityXp}), streak ${s1.currentStreak}`); else fail('keyboard xp', s1);
  const queued = await page.evaluate((u) => Storage.loadActivities(u).length, USERNAME);
  if (queued === 0) ok('activity queue flushed'); else fail('queue', queued);

  // ---- dictation: one correct answer via the revealed answer trick (answer wrong first, then read 'show') ----
  await page.goto(BASE + '/#/dictation');
  await page.waitForSelector('#dict-input', { timeout: 10000 });
  await page.locator('.pb-tabs .level-pill', { hasText: 'Getallen' }).click();
  // we can't hear the audio; grab the number from the ruNumber of a known value by forcing mode item via wrong answer + reading feedback, then next -> new item. Instead, exercise the API directly for the XP rule:
  const api1 = await page.evaluate(async () => {
    const r = await fetch('/api/sync/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: [
      { clientId: 'd1', kind: 'dictation_correct', detail: { mode: 'prijs' }, clientTimestamp: new Date().toISOString() },
      { clientId: 'd1', kind: 'dictation_correct', detail: { mode: 'prijs' }, clientTimestamp: new Date().toISOString() },
      { clientId: 'x1', kind: 'bogus', detail: {}, clientTimestamp: new Date().toISOString() },
      { clientId: 'k2', kind: 'keyboard_round', detail: { cpm: 150, accuracy: 100 }, clientTimestamp: new Date().toISOString() }
    ] }) });
    return r.json();
  });
  if (api1.accepted.length === 2 && api1.skipped.length === 1 && api1.failed.length === 1 && api1.xpGained === 45) ok('activities API: idempotent, rejects unknown kinds, XP 5 + 40 (with both bonuses) = ' + api1.xpGained); else fail('activities api', api1);

  // ---- leaderboard includes activity XP ----
  const lb = await page.evaluate(async () => (await fetch('/api/leaderboard')).json());
  const s2 = await page.evaluate(async () => (await fetch('/api/progress/stats')).json());
  if (lb.me && lb.me.xp === s2.xp && s2.xp === s1.xp + 45) ok(`leaderboard XP matches stats: ${lb.me.xp}`); else fail('leaderboard xp', { me: lb.me && lb.me.xp, stats: s2.xp, expected: s1.xp + 45 });

  // ---- offline queueing: block the sync endpoint, do an activity, unblock, sync ----
  await page.route('**/api/sync/activities', (route) => route.abort());
  await page.evaluate(() => recordActivity('dictation_correct', { mode: 'tijd' }));
  await page.waitForTimeout(1500);
  const q2 = await page.evaluate((u) => Storage.loadActivities(u).length, USERNAME);
  if (q2 === 1) ok('activity stays queued while the server is unreachable'); else fail('offline queue', q2);
  await page.unroute('**/api/sync/activities');
  await page.evaluate(() => syncAll());
  await page.waitForTimeout(2500);
  const q3 = await page.evaluate((u) => Storage.loadActivities(u).length, USERNAME);
  const s3 = await page.evaluate(async () => (await fetch('/api/progress/stats')).json());
  if (q3 === 0 && s3.xp === s2.xp + 5) ok('queued activity delivered on next sync: xp=' + s3.xp); else fail('queue delivery', { q3, xp: s3.xp, expected: s2.xp + 5 });

  if (pageErrors.length) fail('uncaught page errors', pageErrors); else ok('no uncaught JS errors');
  await browser.close();
  console.log('\nv1.7.2 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
