const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const USERNAME = 'exam_' + Date.now();
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

  // level pills + sections
  const pills = await page.locator('.level-pill').allTextContents();
  if (pills.join(',') === 'A1,A2,B1,B2,C1,C2') ok('level jump pills A1..C2');
  else fail('level pills', pills);

  // content bundle, for finding exercises of each new type
  const content = await page.evaluate(async () => (await fetch('/api/content')).json());
  const byType = {};
  for (const e of content.exercises) byType[e.type] = (byType[e.type] || 0) + 1;
  ok('content types: ' + JSON.stringify(byType));
  const answerOf = new Map(content.exercises.map((e) => [e.id, e]));

  // ---- locks: only the first lesson is open on a fresh account ----
  const lockedNodes = await page.locator('.path-node.locked').count();
  const openNodes = await page.locator('.path-node:not(.locked)').count();
  if (lockedNodes > 100 && openNodes === 2) ok(`fresh account: 1 open lesson + A1 exam, ${lockedNodes} locked nodes`);
  else fail('lock counts', { lockedNodes, openNodes });
  const lockedSections = await page.locator('.level-section.locked').count();
  if (lockedSections === 5) ok('levels A2..C2 shown as locked'); else fail('locked sections', lockedSections);
  // clicking a locked card does nothing
  await page.locator('.path-node.locked .lesson-card').first().click({ force: true });
  await page.waitForTimeout(300);
  if (page.url().endsWith('#/dashboard') || !page.url().includes('#/lesson/')) ok('clicking a locked lesson stays on dashboard'); else fail('locked click navigated', page.url());
  // direct navigation is refused
  await page.goto(BASE + '/#/lesson/greetings');
  await page.waitForSelector('text=vergrendeld', { timeout: 10000 });
  ok('direct navigation to a locked lesson is refused with a reason');
  await page.goto(BASE + '/#/exam/B1');
  await page.waitForSelector('text=vergrendeld', { timeout: 10000 });
  ok('locked level exam is refused');

  // ---- unlock everything up to B2 by practising every word of A1, A2 and B1 (via the server) ----
  const unlockLevels = new Set(['A1', 'A2', 'B1']);
  const catLevel = Object.fromEntries(content.categories.map((c) => [c.slug, c.level]));
  const seenWord = new Set();
  const attempts = [];
  for (const e of content.exercises) {
    if (e.wordId == null || !unlockLevels.has(catLevel[e.category]) || seenWord.has(e.wordId)) continue;
    seenWord.add(e.wordId);
    attempts.push({ clientId: 'unlock-' + e.id, exerciseId: e.id, givenAnswer: e.correctAnswer, clientTimestamp: new Date().toISOString() });
  }
  for (let i = 0; i < attempts.length; i += 200) {
    const res = await page.evaluate(async (batch) => {
      const r = await fetch('/api/sync/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempts: batch }) });
      return r.status;
    }, attempts.slice(i, i + 200));
    if (res !== 200) fail('sync batch status', res);
  }
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.level-section', { timeout: 10000 });
  await page.waitForTimeout(2500); // let the app pull the server progress
  await page.reload();
  await page.waitForSelector('.level-section', { timeout: 10000 });
  const lockedAfter = await page.locator('.level-section.locked').count();
  const doneNodes = await page.locator('.path-node.done').count();
  if (lockedAfter === 2 && doneNodes > 50) ok(`after practising every A1-B1 word: B2 unlocked (${doneNodes} lessons done, ${lockedAfter} levels still locked)`);
  else fail('unlock after progress', { lockedAfter, doneNodes });

  // a "done" lesson can be redone right away (no "everything is scheduled" dead end)
  await page.goto(BASE + '/#/lesson/greetings');
  await page.waitForSelector('.option-btn, .typing-form, .chip', { timeout: 10000 });
  const redoProgress = await page.locator('.exercise-progress').textContent();
  if (/van 10/.test(redoProgress)) ok('a finished lesson can be redone as a full 10-question session'); else fail('redo lesson', redoProgress);

  // ---- lesson with reading exercise ----
  const readingEx = content.exercises.find((e) => e.type === 'reading');
  await page.goto(BASE + '/#/lesson/' + readingEx.category);
  await page.waitForSelector('#feedback, .option-btn, .typing-form', { timeout: 10000 });
  // walk through until a reading question appears (max 25 steps)
  let sawReading = false, sawTyping = false, sawListen = false;
  for (let i = 0; i < 25; i++) {
    if (await page.locator('.reading-passage').count()) sawReading = true;
    if (await page.locator('.listen-box').count()) sawListen = true;
    if (await page.locator('.typing-form').count()) {
      sawTyping = true;
      await page.fill('.typing-answer', 'ошибка');
      await page.click('.typing-form button[type=submit]');
    } else if (await page.locator('.chip-pool .chip').count()) {
      while (await page.locator('.chip-pool .chip').count()) await page.locator('.chip-pool .chip').first().click();
      await page.locator('button.primary', { hasText: 'Controleren' }).click();
    } else if (await page.locator('.option-btn').count()) {
      await page.locator('.option-btn').first().click();
    } else break;
    await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
    if (sawReading && sawListen && sawTyping) break;
    const btn = page.locator('#feedback button.primary');
    const txt = await btn.textContent();
    await btn.click();
    if (/Klaar/.test(txt)) break;
  }
  if (sawReading) ok('reading passage rendered inside a lesson'); else fail('no reading passage seen in ' + readingEx.category);

  // typing + listen in a B1 vocab lesson / practical sentences
  const listenEx = content.exercises.find((e) => e.type === 'listen');
  const typingEx = content.exercises.find((e) => e.type === 'typing');
  for (const [slug, cls, flagName] of [[listenEx.category, '.listen-box', 'listen'], [typingEx.category, '.typing-form', 'typing']]) {
    await page.goto(BASE + '/#/lesson/' + slug);
    await page.waitForSelector('.option-btn, .typing-form, .chip', { timeout: 10000 });
    let seen = false;
    for (let i = 0; i < 40 && !seen; i++) {
      if (await page.locator(cls).count()) { seen = true; break; }
      if (await page.locator('.typing-form').count()) {
        await page.fill('.typing-answer', 'x'); await page.click('.typing-form button[type=submit]');
      } else if (await page.locator('.chip-pool .chip').count()) {
        while (await page.locator('.chip-pool .chip').count()) await page.locator('.chip-pool .chip').first().click();
        await page.locator('button.primary', { hasText: 'Controleren' }).click();
      } else if (await page.locator('.option-btn').count()) {
        await page.locator('.option-btn').first().click();
      } else break;
      await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
      const btn = page.locator('#feedback button.primary');
      const txt = await btn.textContent();
      await btn.click();
      if (/Klaar/.test(txt)) break;
    }
    if (seen) ok(flagName + ' exercise rendered in ' + slug); else fail(flagName + ' not seen in ' + slug);
  }
  await page.screenshot({ path: 'exam-lesson-typing.png' });

  // ---- exam intro ----
  await page.goto(BASE + '/#/exam/A1');
  await page.waitForSelector('.exam-intro', { timeout: 10000 });
  const facts = await page.locator('.exam-facts li').count();
  if (facts >= 4) ok('exam intro shows facts (' + facts + ')'); else fail('exam facts', facts);
  await page.screenshot({ path: 'exam-intro.png' });

  // ---- run the exam: answer all correctly except the first two ----
  await page.click('#start-exam');
  await page.waitForSelector('.exam-question', { timeout: 10000 });
  for (let i = 0; i < 30; i++) {
    await page.waitForSelector('.exam-question', { timeout: 10000 });
    const progress = await page.locator('.exercise-progress span').first().textContent();
    if (!progress.includes('vraag ' + (i + 1) + ' van 30')) fail('progress text', { i, progress });
    // find which exercise this is: prompt text -> match in content
    const prompt = await page.locator('.prompt-row h2').textContent();
    const candidates = content.exercises.filter((e) => e.prompt === prompt);
    // 37 prompts belong to more than one exercise -- "Luister naar de zin en
    // kies de juiste betekenis." alone covers 71 of them -- so the rendered
    // options are what actually identifies the question. Picking the first
    // candidate answered those at random and made this test flaky.
    let rendered = await page.locator('#options .option-btn').evaluateAll((els) => els.map((e) => e.dataset.value));
    if (!rendered.length) rendered = await page.locator('.chip-pool .chip').allInnerTexts();
    const sameSet = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
    const ex = (rendered.length
      ? candidates.find((c) => Array.isArray(c.options) && sameSet(c.options, rendered.map((r) => r.trim())))
      : null) || candidates[0];
    if (!ex) { fail('could not identify question', { prompt }); break; }
    if (candidates.length > 1 && rendered.length && ex === candidates[0] && !sameSet(candidates[0].options || [], rendered.map((r) => r.trim()))) {
      fail('ambiguous question could not be resolved', { prompt: prompt.slice(0, 50), candidates: candidates.length });
    }
    const wrong = i < 2;
    if (await page.locator('.typing-form').count()) {
      await page.fill('.typing-answer', wrong ? 'неправильно' : ex.correctAnswer);
      await page.click('.typing-form button[type=submit]');
    } else if (await page.locator('.chip-pool .chip').count()) {
      const tokens = wrong ? ex.options : ex.correctAnswer.split(' ');
      for (const t of tokens) {
        const chip = page.locator('.chip-pool .chip', { hasText: new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first();
        if (await chip.count()) await chip.click(); else await page.locator('.chip-pool .chip').first().click();
      }
      while (await page.locator('.chip-pool .chip').count()) await page.locator('.chip-pool .chip').first().click();
      await page.locator('button.primary', { hasText: 'Antwoord vastleggen' }).click();
    } else {
      const opts = page.locator('.option-btn');
      const n = await opts.count();
      let target = null;
      for (let k = 0; k < n; k++) {
        const v = await opts.nth(k).getAttribute('data-value');
        if (wrong ? v !== ex.correctAnswer : v === ex.correctAnswer) { target = opts.nth(k); break; }
      }
      await (target || opts.first()).click();
      if (i === 3) {
        const selected = await page.locator('.option-btn.selected').count();
        if (selected === 1) ok('mc selection highlighted, changeable before Volgende'); else fail('selected class', selected);
      }
    }
    if (i === 5) await page.screenshot({ path: 'exam-question.png' });
    const next = page.locator('#actions button.primary, .exam-question > #actions button, .exam-question button.primary', { hasText: /Volgende|Toets inleveren/ }).last();
    await next.click();
  }
  await page.waitForSelector('.exam-result', { timeout: 20000 });
  const pctText = await page.locator('.exam-score-ring').textContent();
  const passed = await page.locator('.exam-result.passed').count();
  ok('exam result rendered: ' + pctText.trim() + (passed ? ' (passed)' : ' (failed)'));
  if (passed) ok('28/30 passes the 80% threshold'); else fail('expected pass');
  const reviewWrong = await page.locator('.review-item.incorrect').count();
  if (reviewWrong === 2) ok('review lists exactly the 2 wrong answers with explanations'); else fail('review wrong count', reviewWrong);
  const explanations = await page.locator('.review-item.incorrect .explanation').allTextContents();
  if (explanations.every((t) => t.trim().length > 10)) ok('each wrong answer carries an explanation'); else fail('explanations', explanations);
  const breakdownRows = await page.locator('.breakdown-row').count();
  if (breakdownRows > 0) ok('per-category breakdown rows: ' + breakdownRows); else fail('breakdown');
  await page.screenshot({ path: 'exam-result.png', fullPage: true });

  await page.locator('#show-all').click();
  const reviewAll = await page.locator('.review-item').count();
  if (reviewAll === 30) ok('show-all reveals all 30 review items'); else fail('review all', reviewAll);

  // ---- progress: certification tile + top bar badge ----
  await page.goto(BASE + '/#/progress');
  await page.waitForSelector('.cert-grid', { timeout: 10000 });
  const certTiles = await page.locator('.cert-tile').count();
  const passedTiles = await page.locator('.cert-tile.passed').count();
  if (certTiles === 6 && passedTiles === 1) ok('cert grid: 6 tiles, A1 passed'); else fail('cert grid', { certTiles, passedTiles });
  const gamCert = await page.locator('.gam-cert').textContent().catch(() => null);
  if (gamCert && gamCert.includes('A1')) ok('top bar shows certification badge: ' + gamCert.trim()); else fail('gam-cert', gamCert);
  const xp = await page.locator('.gam-xp').textContent();
  ok('xp badge: ' + xp.trim());
  await page.screenshot({ path: 'exam-progress.png', fullPage: true });

  // dashboard exam node shows passed
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.level-section', { timeout: 10000 });
  const passedExam = await page.locator('.path-node.exam.complete').count();
  const passedPill = await page.locator('.level-pill.passed').count();
  if (passedExam === 1 && passedPill === 1) ok('dashboard marks A1 exam + pill as passed'); else fail('dashboard passed', { passedExam, passedPill });
  await page.screenshot({ path: 'exam-dashboard.png' });

  // leaderboard column
  await page.goto(BASE + '/#/leaderboard');
  await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
  const headers = await page.locator('.leaderboard-table th').allTextContents();
  if (headers.some((h) => /Toets/i.test(h))) ok('leaderboard has Toets column'); else fail('leaderboard headers', headers);
  const meRow = await page.locator('tr.leaderboard-me').textContent();
  if (/A1/.test(meRow)) ok('leaderboard row shows A1'); else fail('leaderboard me row', meRow);

  if (pageErrors.length) fail('uncaught page errors', pageErrors); else ok('no uncaught JS errors');
  await browser.close();
  console.log('\nExam flow checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
