const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const USERNAME = 'v13_' + Date.now();
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
  if (content.schemaVersion === 3 && content.words && Object.keys(content.words).length > 1400) ok('content bundle v3 carries a words map (' + Object.keys(content.words).length + ')');
  else fail('content words map', { v: content.schemaVersion, n: content.words && Object.keys(content.words).length });
  const withExample = Object.values(content.words).filter((w) => w.example && w.example.ru).length;
  if (withExample >= 1400) ok('words with example sentence: ' + withExample); else fail('examples in bundle', withExample);
  if (!(await page.locator('.practice-card').count())) ok('no "oefen je fouten" card on a fresh account'); else fail('practice card shown too early');

  // ---- answer two alphabet questions wrongly: example block must appear in feedback ----
  await page.goto(BASE + '/#/lesson/alphabet');
  await page.waitForSelector('.option-btn', { timeout: 10000 });
  let sawExample = false, wrongCount = 0;
  for (let i = 0; i < 4; i++) {
    const prompt = await page.locator('.prompt-row h2').textContent();
    const ex = content.exercises.find((e) => e.prompt === prompt);
    const opts = page.locator('.option-btn'); const n = await opts.count();
    let clicked = false;
    for (let k = 0; k < n; k++) {
      const v = await opts.nth(k).getAttribute('data-value');
      if (ex && v !== ex.correctAnswer) { await opts.nth(k).click(); clicked = true; wrongCount++; break; }
    }
    if (!clicked) await opts.first().click();
    await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
    if (await page.locator('.feedback .example-box .example-ru').count()) {
      sawExample = true;
      const ru = await page.locator('.feedback .example-ru').textContent();
      const nl = await page.locator('.feedback .example-nl').textContent();
      if (i === 0 || !sawExample) ok('example block: ' + ru + ' — ' + nl);
    }
    if (i === 1) await page.screenshot({ path: 'v13-feedback.png', fullPage: true });
    await page.locator('#feedback button.primary').click();
  }
  // alphabet letters have no example sentence by design; check a word lesson too
  await page.evaluate(async (batch) => fetch('/api/sync/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempts: batch }) }),
    content.exercises.filter((e) => e.category === 'alphabet' && e.wordId != null).reduce((acc, e) => { if (!acc.some((a) => a.wid === e.wordId)) acc.push({ wid: e.wordId, clientId: 'u' + e.id, exerciseId: e.id, givenAnswer: e.correctAnswer, clientTimestamp: new Date().toISOString() }); return acc; }, []));
  await page.goto(BASE + '/#/dashboard'); await page.waitForTimeout(2500); await page.reload(); await page.waitForSelector('.level-section');
  await page.goto(BASE + '/#/lesson/greetings');
  await page.waitForSelector('.option-btn', { timeout: 10000 });
  {
    const prompt = await page.locator('.prompt-row h2').textContent();
    const ex = content.exercises.find((e) => e.prompt === prompt);
    const opts = page.locator('.option-btn'); const n = await opts.count();
    for (let k = 0; k < n; k++) { const v = await opts.nth(k).getAttribute('data-value'); if (v !== ex.correctAnswer) { await opts.nth(k).click(); wrongCount++; break; } }
    await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
    const exBox = await page.locator('.feedback .example-box .example-ru').count();
    if (exBox) ok('example sentence shown after answering a greetings word: ' + (await page.locator('.feedback .example-ru').textContent())); else fail('no example box in greetings feedback');
    const speak = await page.locator('.feedback .example-box .speak-btn').count();
    if (speak) ok('example has its own listen button'); else fail('no speak button in example box');
    await page.screenshot({ path: 'v13-feedback.png', fullPage: true });
  }

  // ---- mistakes practice ----
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.level-section', { timeout: 10000 });
  const practiceCard = await page.locator('.practice-card').count();
  if (practiceCard === 1) ok('dashboard shows "oefen je fouten" card after ' + wrongCount + ' wrong answers'); else fail('practice card', practiceCard);
  const badge = await page.locator('.practice-card .level-badge').textContent();
  if (Number(badge) === wrongCount) ok('card counts ' + badge + ' open mistakes'); else fail('practice count', { badge, wrongCount });
  await page.locator('.practice-card').click();
  await page.waitForSelector('.exercise-progress', { timeout: 10000 });
  const prog = await page.locator('.exercise-progress').textContent();
  if (/Oefen je fouten/.test(prog) && new RegExp('van ' + wrongCount).test(prog)) ok('practice session: ' + prog.trim()); else fail('practice session header', prog);
  // answer all correctly -> list empties
  for (let i = 0; i < wrongCount; i++) {
    const prompt = await page.locator('.prompt-row h2').textContent();
    const ex = content.exercises.find((e) => e.prompt === prompt);
    const opts = page.locator('.option-btn'); const n = await opts.count();
    for (let k = 0; k < n; k++) { const v = await opts.nth(k).getAttribute('data-value'); if (v === ex.correctAnswer) { await opts.nth(k).click(); break; } }
    await page.waitForSelector('#feedback button.primary', { timeout: 5000 });
    await page.locator('#feedback button.primary').click();
  }
  await page.waitForSelector('text=Foutenronde afgerond', { timeout: 5000 });
  ok('practice round completes with its own summary');
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.level-section', { timeout: 10000 });
  if (!(await page.locator('.practice-card').count())) ok('card disappears once every mistake was answered correctly'); else fail('practice card still shown');
  await page.goto(BASE + '/#/practice');
  await page.waitForSelector('text=Geen openstaande fouten', { timeout: 5000 });
  ok('#/practice with nothing open shows the empty state');

  // ---- reminder card on progress page (chromium headless has PushManager) ----
  await page.goto(BASE + '/#/progress');
  await page.waitForSelector('.reminder-card', { timeout: 10000 });
  await page.waitForSelector('#reminder-toggle', { timeout: 10000 });
  ok('reminder card renders with toggle');
  await page.screenshot({ path: 'v13-progress.png', fullPage: true });

  // push API smoke test through the page's session (fake subscription: push service will reject the test send)
  const pushApi = await page.evaluate(async () => {
    const out = {};
    out.key = (await (await fetch('/api/push/vapid-public-key')).json()).publicKey;
    const sub = { endpoint: 'https://example.invalid/push/abc', keys: { p256dh: 'BKU1Gxv2qqSC2xl7wwK1U6fA_Vfw2oF43BYTSWBErIk770RCOmkrqMrDnblBnSJIclSVuPoBPWfSoYJwlFykBvA', auth: 'W8SKUnpwzBq_wugIvjhRlA' } };
    out.subscribe = await (await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub, reminderTime: '19:30', timeZone: 'Europe/Amsterdam' }) })).json();
    out.status = await (await fetch('/api/push/status?endpoint=' + encodeURIComponent(sub.endpoint))).json();
    const t = await fetch('/api/push/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
    out.testStatus = t.status;
    out.unsub = await (await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })).json();
    out.after = await (await fetch('/api/push/status?endpoint=' + encodeURIComponent(sub.endpoint))).json();
    return out;
  });
  if (pushApi.key && pushApi.key.length > 60) ok('VAPID public key served'); else fail('vapid key', pushApi.key);
  if (pushApi.subscribe.ok && pushApi.status.subscribed && pushApi.status.settings.reminderTime === '19:30') ok('subscribe + status round-trip (19:30 Europe/Amsterdam)'); else fail('subscribe/status', pushApi);
  if (pushApi.testStatus === 502) ok('test push to an unreachable endpoint reports 502 cleanly'); else fail('test push status', pushApi.testStatus);
  if (pushApi.unsub.ok && !pushApi.after.subscribed) ok('unsubscribe removes the row'); else fail('unsubscribe', pushApi);

  if (pageErrors.length) fail('uncaught page errors', pageErrors); else ok('no uncaught JS errors');
  await browser.close();
  console.log('\nv1.3 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
