const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const USERNAME = 'v14_' + Date.now();
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

  const content = await page.evaluate(async () => (await fetch('/api/content')).json());
  const byType = {};
  for (const e of content.exercises) byType[e.type] = (byType[e.type] || 0) + 1;
  if (byType.cloze > 1000 && byType.typing > 1200) ok('content has cloze + typing from A1: ' + JSON.stringify(byType)); else fail('types', byType);
  const a1typing = content.exercises.filter((e) => e.type === 'typing' && e.category === 'greetings').length;
  if (a1typing > 0) ok('A1 lesson has typing exercises (' + a1typing + ')'); else fail('no A1 typing');

  // ---- dashboard tool cards ----
  const tools = await page.locator('.tool-card').count();
  if (tools === 6) ok('dashboard shows 6 tool cards on a fresh account'); else fail('tool cards', tools);
  await page.screenshot({ path: 'v14-dashboard.png' });

  // ---- make progress + due words: practise every alphabet + greetings word via server with old timestamps? ----
  // Answer via the app to create word progress; then backdate nextReviewAt locally to make them due.
  await page.goto(BASE + '/#/lesson/alphabet');
  await page.waitForSelector('.option-btn, .typing-form', { timeout: 10000 });
  let sawCloze = false, sawTyping = false, micSeen = false;
  for (let i = 0; i < 10; i++) {
    const prompt = await page.locator('.prompt-row h2').textContent();
    const ex = content.exercises.find((e) => e.prompt === prompt);
    if (await page.locator('.typing-form').count()) {
      if (ex && ex.type === 'cloze') sawCloze = true;
      if (ex && ex.type === 'typing') sawTyping = true;
      if (await page.locator('.typing-form .mic-btn').count()) micSeen = true;
      await page.fill('.typing-answer', ex ? ex.correctAnswer : 'x');
      await page.click('.typing-form button[type=submit]');
    } else if (await page.locator('.chip-pool .chip').count()) {
      while (await page.locator('.chip-pool .chip').count()) await page.locator('.chip-pool .chip').first().click();
      await page.locator('button.primary', { hasText: 'Controleren' }).click();
    } else {
      const opts = page.locator('.option-btn'); const n = await opts.count();
      let done = false;
      for (let k = 0; k < n; k++) { const v = await opts.nth(k).getAttribute('data-value'); if (ex && v === ex.correctAnswer) { await opts.nth(k).click(); done = true; break; } }
      if (!done) await opts.first().click();
    }
    await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
    if (i === 0) {
      const tools = await page.locator('.after-tools .tool-btn').allTextContents();
      ok('after-answer tools: ' + JSON.stringify(tools));
      if (tools.some((t) => /Vormen/.test(t))) {
        await page.locator('.after-tools .tool-btn', { hasText: 'Vormen' }).click();
        await page.waitForSelector('.forms-box, .forms-slot .muted', { timeout: 10000 });
        const formsOk = await page.locator('.forms-box').count();
        ok(formsOk ? 'forms table rendered: ' + (await page.locator('.forms-box .reading-label').textContent()) : 'forms: no data for this word (letters have none) — ' + (await page.locator('.forms-slot .muted').textContent()));
      }
    }
    const btn = page.locator('#feedback button.primary');
    const t = await btn.textContent();
    await btn.click();
    if (/Klaar/.test(t)) break;
  }
  ok(`alphabet session done (typing seen: ${sawTyping}, cloze seen: ${sawCloze}, mic button: ${micSeen})`);

  // greetings unlock needs alphabet done -> push all alphabet words via server, then a greetings lesson with cloze
  const catLevel = Object.fromEntries(content.categories.map((c) => [c.slug, c.level]));
  const seen = new Set(); const attempts = [];
  for (const e of content.exercises) {
    if (e.wordId == null || catLevel[e.category] !== 'A1' || seen.has(e.wordId)) continue;
    seen.add(e.wordId);
    attempts.push({ clientId: 'unlock-' + e.id, exerciseId: e.id, givenAnswer: e.correctAnswer, clientTimestamp: new Date().toISOString() });
  }
  await page.evaluate(async (batch) => fetch('/api/sync/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempts: batch }) }), attempts);
  await page.goto(BASE + '/#/dashboard'); await page.waitForTimeout(2500); await page.reload(); await page.waitForSelector('.level-section');

  // forms table for a real noun: use the API directly
  const water = Object.entries(content.words).find(([, w]) => w.ru.replace(/́/g, '') === 'вода');
  const forms = await page.evaluate(async (id) => (await fetch('/api/words/' + id + '/forms')).json(), water[0]);
  if (forms.pos === 'noun' && forms.forms.sg_acc) ok('forms API: вода → ' + forms.forms.sg_acc + ' (acc), gender ' + forms.gender); else fail('forms api', forms);

  // ---- greetings lesson: typing / cloze UI with mic button ----
  for (let round = 0; round < 4 && !(sawCloze && sawTyping); round++) {
  await page.goto(BASE + '/#/dashboard'); await page.waitForSelector('.level-section', { timeout: 10000 });
  await page.goto(BASE + '/#/lesson/greetings');
  await page.waitForSelector('.option-btn, .typing-form', { timeout: 10000 });
  for (let i = 0; i < 10 && !(sawCloze && sawTyping); i++) {
    const prompt = await page.locator('.prompt-row h2').textContent();
    const ex = content.exercises.find((e) => e.prompt === prompt);
    if (await page.locator('.typing-form').count()) {
      if (ex && ex.type === 'cloze') { sawCloze = true; ok('cloze prompt: ' + prompt); }
      if (ex && ex.type === 'typing') sawTyping = true;
      if (await page.locator('.typing-form .mic-btn').count()) micSeen = true;
      await page.fill('.typing-answer', ex ? ex.correctAnswer : 'x');
      await page.click('.typing-form button[type=submit]');
    } else {
      const opts = page.locator('.option-btn'); const n = await opts.count();
      let done = false;
      for (let k = 0; k < n; k++) { const v = await opts.nth(k).getAttribute('data-value'); if (ex && v === ex.correctAnswer) { await opts.nth(k).click(); done = true; break; } }
      if (!done) await opts.first().click();
    }
    await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
    if (sawCloze && await page.locator('.feedback .example-box').count()) { await page.screenshot({ path: 'v14-cloze.png', fullPage: true }); }
    const btn = page.locator('#feedback button.primary');
    const t = await btn.textContent();
    await btn.click();
    if (/Klaar/.test(t)) break;
  }
  }
  if (sawTyping && sawCloze) ok('greetings lesson served both typing and cloze exercises'); else fail('typing/cloze in greetings', { sawTyping, sawCloze });
  if (micSeen) ok('microphone button present on the typing form'); else fail('no mic button');

  // ---- daily review: backdate next_review_at on the server for this user ----
  const dueBefore = await page.locator('.tool-card.review-card .level-badge').count();
  {
    const Database = require('../../backend/node_modules/better-sqlite3');
    const db = new Database(require('path').join(process.env.DATA_DIR || '/tmp/russisch-leren-test', 'russian.sqlite'));
    const uid = db.prepare('SELECT id FROM users WHERE username = ?').get(USERNAME).id;
    const info = db.prepare("UPDATE user_word_progress SET next_review_at = datetime('now', '-1 hour') WHERE user_id = ?").run(uid);
    ok('backdated ' + info.changes + ' word reviews on the server');
    db.close();
  }
  await page.goto(BASE + '/#/dashboard'); await page.waitForTimeout(2500); await page.reload();
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.level-section', { timeout: 10000 });
  const dueBadge = await page.locator('.tool-card.review-card .level-badge').textContent().catch(() => null);
  if (dueBadge && Number(dueBadge) > 100) ok('review card shows due words across all lessons: ' + dueBadge + ' (before: ' + dueBefore + ' badge)'); else fail('review badge', dueBadge);
  await page.locator('.tool-card.review-card').click();
  await page.waitForSelector('.exercise-progress', { timeout: 10000 });
  const rp = await page.locator('.exercise-progress').textContent();
  if (/Herhaling van vandaag/.test(rp) && /van 20/.test(rp)) ok('review session: ' + rp.trim()); else fail('review session header', rp);

  // ---- exam quota: >= 40% production ----
  const exam = await page.evaluate(async () => (await fetch('/api/exams/A1')).json());
  const prod = exam.questions.filter((q) => ['typing', 'cloze', 'sentence_build'].includes(q.type)).length;
  if (prod >= 12) ok(`A1 exam has ${prod}/${exam.questions.length} production questions`); else fail('exam production share', { prod, total: exam.questions.length });

  // ---- keyboard trainer ----
  await page.goto(BASE + '/#/keyboard');
  await page.waitForSelector('#kb-input', { timeout: 10000 });
  const keys = await page.locator('.kb-key').count();
  if (keys === 34) ok('keyboard layout renders 33 keys + space'); else fail('keys', keys);
  const target = await page.locator('#kb-target').textContent();
  const nextKey = await page.locator('.kb-key.next .ru').textContent();
  if (target[0].toLowerCase() === nextKey || (target[0] === 'ё' && nextKey === 'е')) ok(`next key highlighted: '${nextKey}' for target '${target}'`); else fail('highlight', { target, nextKey });
  await page.type('#kb-input', target);
  await page.waitForTimeout(200);
  const prog = await page.locator('#kb-progress').textContent();
  if (/Oefening 2 van/.test(prog)) ok('typing the word advances the drill: ' + prog); else fail('drill advance', prog);
  await page.screenshot({ path: 'v14-keyboard.png' });

  // ---- dialogue list (no API key on this server) ----
  await page.goto(BASE + '/#/dialogue');
  await page.waitForSelector('.scenario-card', { timeout: 10000 });
  const scen = await page.locator('.scenario-card').count();
  const disabled = await page.locator('.scenario-card:disabled').count();
  if (scen === 12 && disabled === 12) ok('12 scenarios listed, disabled without API key, with explanation'); else fail('scenarios', { scen, disabled });
  const dlg = await page.evaluate(async () => { const r = await fetch('/api/ai/dialogue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: 'apotheek', level: 'A1', messages: [] }) }); return r.status; });
  if (dlg === 503) ok('dialogue endpoint returns 503 without key'); else fail('dialogue status', dlg);
  await page.screenshot({ path: 'v14-dialogue.png' });

  if (pageErrors.length) fail('uncaught page errors', pageErrors); else ok('no uncaught JS errors');
  await browser.close();
  console.log('\nv1.4 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
