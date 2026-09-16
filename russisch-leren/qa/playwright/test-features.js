const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const USERNAME = 'feat_' + Date.now();
const PASSWORD = 'secret123';

function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(BASE + '/#/register');
  await page.fill('#username', USERNAME);
  await page.fill('#password', PASSWORD);
  await page.click('#register-form button[type=submit]');
  await page.waitForSelector('.lesson-path', { timeout: 10000 });
  ok('dashboard renders as a lesson-path');

  const nodes = page.locator('.path-node');
  const nodeCount = await nodes.count();
  const examNodes = await page.locator('.path-node.exam').count();
  const sections = await page.locator('.level-section').count();
  if (nodeCount === 126 + 6 && examNodes === 6 && sections === 6) ok('path has 126 lessons + 6 exam nodes in 6 level sections');
  else fail('unexpected node/section count', { nodeCount, examNodes, sections });

  const firstNodeClass = await nodes.first().getAttribute('class');
  if (firstNodeClass.includes('current')) ok('first category (alphabet) is the "current" node for a brand-new account');
  else fail('first node is not "current"', { firstNodeClass });

  // ---- answer a normal mc question, check speak button + XP ----
  await nodes.first().locator('.lesson-card').click();
  await page.waitForSelector('.option-btn', { timeout: 10000 });
  const speakBtnCount = await page.locator('.speak-btn').count();
  if (speakBtnCount > 0) {
    ok('speak (TTS) button is present on a word-based exercise');
    await page.locator('.speak-btn').first().click(); // just verify it doesn't throw
  } else {
    fail('no speak button found on first alphabet exercise');
  }
  await page.locator('.option-btn').first().click();
  await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
  ok('answered first exercise, feedback rendered');

  await page.waitForTimeout(1500); // let the background syncAll() after answering settle
  const stats1 = await page.evaluate((u) => Storage.loadStats(u), USERNAME);
  if (stats1 && stats1.xp >= 0 && typeof stats1.currentStreak === 'number') {
    ok('gamification stats synced to device (xp=' + stats1.xp + ', streak=' + stats1.currentStreak + ')');
  } else {
    fail('no gamification stats snapshot after sync', { stats1 });
  }

  // ---- unlock A2 (practical sentences) by practising every A1 word via the server ----
  const content = await page.evaluate(async () => (await fetch('/api/content')).json());
  const catLevel = Object.fromEntries(content.categories.map((c) => [c.slug, c.level]));
  const seen = new Set(); const attempts = [];
  for (const e of content.exercises) {
    if (e.wordId == null || !['A1', 'A2'].includes(catLevel[e.category]) || seen.has(e.wordId)) continue;
    seen.add(e.wordId);
    attempts.push({ clientId: 'unlock-' + e.id, exerciseId: e.id, givenAnswer: e.correctAnswer, clientTimestamp: new Date().toISOString() });
  }
  await page.evaluate(async (batch) => fetch('/api/sync/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempts: batch }) }), attempts);
  await page.goto(BASE + '/#/dashboard'); await page.waitForTimeout(2500); await page.reload(); await page.waitForSelector('.level-section');

  // ---- go to the practical sentences lesson and use the chip UI ----
  await page.goto(BASE + '/#/lesson/praktische-zinnen');
  await page.waitForSelector('.chip-pool .chip, .option-btn', { timeout: 10000 });
  for (let i = 0; i < 10 && !(await page.locator('.chip-pool .chip').count()); i++) {
    await page.locator('.option-btn').first().click();
    await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
    await page.locator('#feedback button.primary').click();
    await page.waitForSelector('.chip-pool .chip, .option-btn', { timeout: 10000 });
  }
  if (await page.locator('.chip-pool .chip').count()) ok('sentence_build exercise renders chip UI');
  else fail('no chip exercise within 10 questions');

  // tap every available pool chip in the order they appear (may or may not be correct -- both cases are worth testing)
  let poolCount = await page.locator('.chip-pool .chip').count();
  while (poolCount > 0) {
    await page.locator('.chip-pool .chip').first().click();
    poolCount = await page.locator('.chip-pool .chip').count();
  }
  const answerChips = await page.locator('.chip-answer .chip').count();
  ok('tapped all chips into the answer row (' + answerChips + ' chips)');

  await page.locator('button.primary', { hasText: 'Controleren' }).click();
  await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
  ok('sentence_build submission produced feedback');

  const verdict = await page.locator('.feedback strong').first().textContent();
  const wasIncorrect = /niet/i.test(verdict);

  // ---- AI explain button: only shown on a wrong answer, and no ANTHROPIC_API_KEY is configured server-side ----
  const aiBtnCount = await page.locator('.ai-btn').count();
  if (wasIncorrect) {
    if (aiBtnCount === 1) {
      ok('AI explain button shown for a wrong answer');
      await page.locator('.ai-btn').click();
      await page.waitForSelector('.error-message', { timeout: 10000 });
      const msg = await page.locator('.error-message').last().textContent();
      if (/AI-uitleg is niet geconfigureerd/.test(msg)) ok('AI button gracefully reports "not configured" (no ANTHROPIC_API_KEY set)');
      else fail('unexpected AI error message', { msg });
    } else {
      fail('expected exactly one AI button on a wrong answer', { aiBtnCount });
    }
  } else {
    ok('sentence_build answer happened to be correct -- no AI button expected (correct-only path), got ' + aiBtnCount);
  }

  // ---- progress page: level/streak card + achievement badges ----
  await page.goto(BASE + '/#/progress');
  await page.waitForSelector('.badge-grid', { timeout: 10000 });
  const badgeCount = await page.locator('.badge').count();
  const unlockedCount = await page.locator('.badge.unlocked').count();
  if (badgeCount === 11) ok('all 11 achievement badges render');
  else fail('unexpected badge count', { badgeCount });
  if (unlockedCount >= 1) ok('"eerste_stap" (or similar) achievement is unlocked after answering questions (' + unlockedCount + ' unlocked)');
  else fail('expected at least 1 unlocked achievement');

  const streakText = await page.locator('.streak-value').textContent();
  ok('streak display shows: ' + streakText.trim());

  if (pageErrors.length) fail('uncaught page errors occurred', pageErrors);
  else ok('no uncaught JS errors during the whole flow');

  await browser.close();
  console.log('\nAll feature checks completed.');
})().catch((e) => {
  console.error('TEST CRASHED:', e);
  process.exitCode = 1;
});
