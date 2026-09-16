const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const USERNAME = 'v16_' + Date.now();
const PASSWORD = 'secret123';

function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(BASE + '/#/register');
  await page.fill('#username', USERNAME);
  await page.fill('#password', PASSWORD);
  await page.click('#register-form button[type=submit]');
  await page.waitForSelector('.level-section', { timeout: 15000 });

  // ---- bottom nav: settings tab instead of logout ----
  const tabs = await page.locator('.bottom-nav-item .bottom-nav-label').allTextContents();
  if (tabs.join(',') === 'Lessen,Oefenen,Voortgang,Ranglijst,Instellingen') ok('bottom nav: ' + tabs.join(' · ')); else fail('nav tabs', tabs);

  // ---- settings page ----
  await page.click('.bottom-nav-item[href="#/settings"]');
  await page.waitForSelector('#rate', { timeout: 10000 });
  ok('settings page renders speech controls');
  const hasReminder = await page.locator('.reminder-card').count();
  const hasLogout = await page.locator('#logout-btn').count();
  if (hasReminder && hasLogout) ok('settings page has reminder card and logout'); else fail('settings sections', { hasReminder, hasLogout });
  await page.fill('#rate', '0.7');
  await page.locator('#rate').dispatchEvent('input');
  await page.fill('#slow-rate', '0.4');
  await page.locator('#slow-rate').dispatchEvent('input');
  const saved = await page.evaluate(() => Storage.loadSettings().speech);
  if (saved && saved.rate === 0.7 && saved.slowRate === 0.4) ok('speech rates persisted: ' + JSON.stringify(saved)); else fail('speech settings', saved);
  await page.screenshot({ path: 'v16-settings.png', fullPage: true });

  // ---- lesson order: klemtoon is lesson 2 ----
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.level-section', { timeout: 10000 });
  const names = await page.locator('#level-A1 .lesson-card h2').allTextContents();
  if (names[0] === 'Alfabet & uitspraak' && names[1] === 'Klemtoon') ok('A1 order: ' + names.slice(0, 3).join(' → ')); else fail('order', names.slice(0, 3));

  // speak group with slow button on an exercise
  await page.goto(BASE + '/#/lesson/alphabet');
  await page.waitForSelector('.option-btn', { timeout: 10000 });
  // Since 1.11.1 a question only gets a listen control when there is Russian
  // in the prompt to read out; walk on until one turns up.
  let sawSpeak = false;
  for (let i = 0; i < 8 && !sawSpeak; i++) {
    if (await page.locator('.prompt-row .speak-group').count()) {
      const slow = await page.locator('.prompt-row .speak-group .speak-slow').count();
      if (slow) { ok('listen control has a 🐢 slow button'); sawSpeak = true; }
      else fail('speak group without slow button');
      break;
    }
    const opt = page.locator('#options .option-btn').first();
    if (!(await opt.count())) break;
    await opt.click();
    await page.waitForSelector('#feedback .feedback', { timeout: 5000 });
    const next = page.locator('#feedback button.primary');
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(200);
  }
  if (!sawSpeak) console.log('INFO - geen vraag met luisterknop in deze ronde');

  // unlock klemtoon (word-less lesson opens with alphabet done)
  const content = await page.evaluate(async () => (await fetch('/api/content')).json());
  const seen = new Set(); const attempts = [];
  for (const e of content.exercises) {
    if (e.wordId == null || e.category !== 'alphabet' || seen.has(e.wordId)) continue;
    seen.add(e.wordId);
    attempts.push({ clientId: 'unlock-' + e.id, exerciseId: e.id, givenAnswer: e.correctAnswer, clientTimestamp: new Date().toISOString() });
  }
  await page.evaluate(async (batch) => fetch('/api/sync/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempts: batch }) }), attempts);
  await page.goto(BASE + '/#/dashboard'); await page.waitForTimeout(2500); await page.reload(); await page.waitForSelector('.level-section');

  // ---- klemtoon lesson: stress exercise, exact grading ----
  const stressCount = content.exercises.filter((e) => e.type === 'stress').length;
  if (stressCount > 1000) ok('content has ' + stressCount + ' stress exercises'); else fail('stress count', stressCount);
  await page.goto(BASE + '/#/lesson/klemtoon');
  await page.waitForSelector('.option-btn', { timeout: 10000 });
  let sawStress = false, wrongGraded = false, rightGraded = false;
  for (let i = 0; i < 10; i++) {
    const prompt = await page.locator('.prompt-row h2').textContent();
    const ex = content.exercises.find((e) => e.prompt === prompt && e.category === 'klemtoon');
    const opts = page.locator('.option-btn'); const n = await opts.count();
    if (ex && ex.type === 'stress') {
      sawStress = true;
      // first stress question: answer wrongly on purpose; later ones correctly
      const wantWrong = !wrongGraded;
      for (let k = 0; k < n; k++) {
        const v = await opts.nth(k).getAttribute('data-value');
        const isRight = v.normalize('NFC') === ex.correctAnswer.normalize('NFC');
        if (wantWrong ? !isRight : isRight) { await opts.nth(k).click(); break; }
      }
      await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
      const verdict = await page.locator('.feedback strong').first().textContent();
      if (wantWrong) { wrongGraded = /niet/i.test(verdict); if (!wrongGraded) fail('wrong stress answer graded as correct', { prompt, verdict }); else { ok('stress: wrong accent position graded as wrong (' + prompt + ')'); await page.screenshot({ path: 'v16-stress.png', fullPage: true }); } }
      else { rightGraded = rightGraded || /goed/i.test(verdict); }
    } else {
      let done = false;
      for (let k = 0; k < n; k++) { const v = await opts.nth(k).getAttribute('data-value'); if (ex && v === ex.correctAnswer) { await opts.nth(k).click(); done = true; break; } }
      if (!done) await opts.first().click();
      await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
    }
    const btn = page.locator('#feedback button.primary');
    const t = await btn.textContent();
    await btn.click();
    if (/Klaar/.test(t)) break;
  }
  if (sawStress && wrongGraded) ok('stress exercises served in the klemtoon lesson with exact grading'); else fail('stress lesson', { sawStress, wrongGraded, rightGraded });

  // grammar rule visible in feedback of a stress question (server bundle)
  const rule = content.grammarRules['STRESS-PLACEMENT'];
  if (rule && /ё/.test(rule.explanation)) ok('STRESS-PLACEMENT rule present: ' + rule.title); else fail('rule missing');

  if (pageErrors.length) fail('uncaught page errors', pageErrors); else ok('no uncaught JS errors');
  await browser.close();
  console.log('\nv1.6 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
