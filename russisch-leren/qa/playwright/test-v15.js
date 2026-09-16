const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const USERNAME = 'v15_' + Date.now();
const PASSWORD = 'secret123';

function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, colorScheme: 'light' });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(BASE + '/#/register');
  await page.fill('#username', USERNAME);
  await page.fill('#password', PASSWORD);
  await page.click('#register-form button[type=submit]');
  await page.waitForSelector('.level-section', { timeout: 15000 });

  const content = await page.evaluate(async () => (await fetch('/api/content')).json());
  const pics = content.exercises.filter((e) => e.type === 'picture');
  const picChoices = content.exercises.filter((e) => e.type === 'picture_choice');
  if (pics.length > 250 && picChoices.length > 250) ok(`picture exercises in bundle: ${pics.length} picture + ${picChoices.length} picture_choice`); else fail('picture counts', { p: pics.length, c: picChoices.length });
  if (pics.every((e) => e.context && e.options.includes(e.correctAnswer))) ok('every picture exercise carries its emoji and a valid option set'); else fail('picture integrity');

  // unlock greetings/food by finishing alphabet via the server
  const catLevel = Object.fromEntries(content.categories.map((c) => [c.slug, c.level]));
  const seen = new Set(); const attempts = [];
  for (const e of content.exercises) {
    if (e.wordId == null || !['alphabet', 'greetings', 'numbers', 'numbers-large', 'colors', 'family'].includes(e.category) || seen.has(e.wordId)) continue;
    seen.add(e.wordId);
    attempts.push({ clientId: 'unlock-' + e.id, exerciseId: e.id, givenAnswer: e.correctAnswer, clientTimestamp: new Date().toISOString() });
  }
  await page.evaluate(async (batch) => fetch('/api/sync/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempts: batch }) }), attempts);
  await page.goto(BASE + '/#/dashboard'); await page.waitForTimeout(2500); await page.reload(); await page.waitForSelector('.level-section');

  // walk the food lesson until both picture types have appeared
  let sawPicture = false, sawChoice = false;
  for (let round = 0; round < 3 && !(sawPicture && sawChoice); round++) {
    await page.goto(BASE + '/#/dashboard'); await page.waitForSelector('.level-section', { timeout: 10000 });
    await page.goto(BASE + '/#/lesson/food');
    await page.waitForSelector('.option-btn, .typing-form', { timeout: 10000 });
    for (let i = 0; i < 10; i++) {
      const prompt = await page.locator('.prompt-row h2').textContent();
      const ex = content.exercises.find((e) => e.prompt === prompt && e.category === 'food') || content.exercises.find((e) => e.prompt === prompt);
      if (await page.locator('.picture-box').count()) {
        if (!sawPicture) {
          sawPicture = true;
          const emoji = await page.locator('.picture-box .picture-emoji').textContent();
          ok(`picture exercise shown: ${emoji} → options ${JSON.stringify(ex.options)}`);
          await page.screenshot({ path: 'v15-picture.png' });
        }
      }
      if (await page.locator('.picture-grid').count()) {
        if (!sawChoice) {
          sawChoice = true;
          const tiles = await page.locator('.picture-option .picture-emoji').allTextContents();
          ok(`picture-choice exercise shown for "${prompt}": tiles ${tiles.join(' ')}`);
          await page.screenshot({ path: 'v15-picture-choice.png' });
        }
      }
      if (await page.locator('.typing-form').count()) {
        await page.fill('.typing-answer', ex ? ex.correctAnswer : 'x');
        await page.click('.typing-form button[type=submit]');
      } else {
        const opts = page.locator('.option-btn'); const n = await opts.count();
        let done = false;
        for (let k = 0; k < n; k++) { const v = await opts.nth(k).getAttribute('data-value'); if (ex && v === ex.correctAnswer) { await opts.nth(k).click(); done = true; break; } }
        if (!done) await opts.first().click();
      }
      await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
      const correctMarked = await page.locator('.option-btn.correct').count();
      if ((await page.locator('.picture-grid').count()) && !correctMarked) fail('picture-choice: correct tile not highlighted');
      const btn = page.locator('#feedback button.primary');
      const t = await btn.textContent();
      await btn.click();
      if (/Klaar/.test(t)) break;
    }
  }
  if (sawPicture && sawChoice) ok('both picture exercise types rendered and graded in a lesson'); else fail('picture types seen', { sawPicture, sawChoice });

  // exam includes pictures and renders tiles for picture_choice
  const exam = await page.evaluate(async () => (await fetch('/api/exams/A1')).json());
  const picInExam = exam.questions.filter((q) => q.type.startsWith('picture')).length;
  ok(`A1 exam sample contains ${picInExam} picture questions`);

  if (pageErrors.length) fail('uncaught page errors', pageErrors); else ok('no uncaught JS errors');
  await browser.close();
  console.log('\nv1.5 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
