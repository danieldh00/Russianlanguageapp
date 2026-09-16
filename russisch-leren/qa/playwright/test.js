const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const USERNAME = 'e2e_' + Date.now();
const PASSWORD = 'secret123';

function log(msg) { console.log('  ' + msg); }
function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }

async function answerOneQuestion(page) {
  // pick the first (correct) option shown, or the option matching the last known correct answer if we later check feedback
  const optionButtons = page.locator('.option-btn');
  await optionButtons.first().waitFor({ state: 'visible', timeout: 5000 });
  const count = await optionButtons.count();
  // click a random option; we just need SOME answer recorded, correctness doesn't matter for sync testing
  await optionButtons.nth(0).click();
  await page.locator('#feedback button.primary').waitFor({ state: 'visible', timeout: 5000 });
}

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });

  // ---- Device 1 (iPhone) ----
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  page1.on('pageerror', (e) => fail('page error (device 1)', e.message));

  await page1.goto(BASE + '/#/register');
  await page1.fill('#username', USERNAME);
  await page1.fill('#password', PASSWORD);
  await page1.click('#register-form button[type=submit]');
  await page1.waitForSelector('.lesson-card', { timeout: 10000 });
  ok('register + dashboard renders with lesson cards (device 1, online)');

  // open the "greetings" lesson and answer two questions while online
  const greetingsCard = page1.locator('.lesson-card', { hasText: 'Begroetingen' });
  await greetingsCard.click();
  await page1.waitForSelector('.option-btn', { timeout: 10000 });
  await answerOneQuestion(page1);
  await page1.click('#feedback button.primary'); // next
  await answerOneQuestion(page1);
  ok('answered 2 questions online (device 1)');

  // give the fire-and-forget syncAll() a moment, then check outbox drained
  await page1.waitForTimeout(1500);
  let outboxLen = await page1.evaluate((u) => Storage.loadOutbox(u).length, USERNAME);
  if (outboxLen === 0) ok('outbox flushed to server while online (device 1)');
  else fail('outbox did not flush while online', { outboxLen });

  // ---- go offline on device 1 ----
  await ctx1.setOffline(true);
  await page1.goto(BASE + '/#/dashboard');
  await page1.waitForSelector('.lesson-card', { timeout: 10000 });
  ok('dashboard still renders while offline (served from local content, device 1)');

  const badgeText = await page1.locator('.sync-badge').textContent();
  if (/Offline/.test(badgeText)) ok('nav shows "Offline" badge');
  else fail('nav did not show offline badge', { badgeText });

  const numbersCard = page1.locator('.lesson-card', { hasText: 'Getallen 1-10' });
  await numbersCard.click();
  await page1.waitForSelector('.option-btn', { timeout: 10000 });
  await answerOneQuestion(page1);
  ok('answered a question fully offline (graded + explanation shown, no network)');

  const outboxAfterOffline = await page1.evaluate((u) => Storage.loadOutbox(u).length, USERNAME);
  if (outboxAfterOffline > 0) ok('offline answer queued in local outbox (' + outboxAfterOffline + ' pending)');
  else fail('offline answer was not queued in outbox');

  const wordProgressAfterOffline = await page1.evaluate((u) => Storage.loadWordProgress(u), USERNAME);
  if (Object.keys(wordProgressAfterOffline).length > 0) ok('local word-progress mirror updated instantly while offline');
  else fail('local word-progress mirror not updated while offline');

  // ---- back online: outbox should flush ----
  await ctx1.setOffline(false);
  await page1.evaluate(() => syncAll());
  await page1.waitForTimeout(1500);
  const outboxAfterReconnect = await page1.evaluate((u) => Storage.loadOutbox(u).length, USERNAME);
  if (outboxAfterReconnect === 0) ok('outbox flushed after reconnecting');
  else fail('outbox still pending after reconnect', { outboxAfterReconnect });

  // verify server actually has the offline-made attempt via the API (same session cookies)
  const serverWords = await page1.evaluate(async () => (await fetch('/api/progress/words', { credentials: 'include' })).json());
  const totalServerAttempts = serverWords.words.reduce((sum, w) => sum + w.correctCount + w.incorrectCount, 0);
  if (totalServerAttempts >= 3) ok('server reflects all 3 answers (2 online + 1 offline), total=' + totalServerAttempts);
  else fail('server attempt count lower than expected', { totalServerAttempts, serverWords });

  // ---- Device 2 (iPad): fresh browser context, same account, no local data ----
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  page2.on('pageerror', (e) => fail('page error (device 2)', e.message));

  await page2.goto(BASE + '/#/login');
  await page2.fill('#username', USERNAME);
  await page2.fill('#password', PASSWORD);
  await page2.click('#login-form button[type=submit]');
  await page2.waitForSelector('.lesson-card', { timeout: 10000 });
  ok('logged in on device 2 (iPad) with same account');

  const device2WordProgress = await page2.evaluate((u) => Storage.loadWordProgress(u), USERNAME);
  if (Object.keys(device2WordProgress).length >= 3) {
    ok('device 2 pulled down progress made on device 1 (' + Object.keys(device2WordProgress).length + ' words)');
  } else {
    fail('device 2 did not receive device 1 progress', { device2WordProgress });
  }

  // sanity: device 2 dashboard reflects non-zero progress on the categories we studied
  const greetingsText = await page2.locator('.lesson-card', { hasText: 'Begroetingen' }).locator('p.muted').nth(0).textContent();
  log('device 2 greetings card progress line: ' + greetingsText);

  await browser.close();
  console.log('\nAll checks completed.');
})().catch((e) => {
  console.error('TEST CRASHED:', e);
  process.exitCode = 1;
});
