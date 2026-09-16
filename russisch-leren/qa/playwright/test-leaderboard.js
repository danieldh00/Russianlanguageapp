const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const U1 = 'lb_a_' + Date.now();
const U2 = 'lb_b_' + Date.now();
const PASSWORD = 'secret123';

function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });

  // user 1: registers, answers one question correctly to earn XP
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  const errors1 = [];
  page1.on('pageerror', (e) => errors1.push(e.message));

  await page1.goto(BASE + '/#/register');
  await page1.fill('#username', U1);
  await page1.fill('#password', PASSWORD);
  await page1.click('#register-form button[type=submit]');
  await page1.waitForSelector('.lesson-path', { timeout: 10000 });
  ok('user1 registered and reached dashboard');

  await page1.locator('.path-node').first().locator('.lesson-card').click();
  await page1.waitForSelector('.option-btn', { timeout: 10000 });
  // click the correct option if identifiable, else just click first then move on -- XP amount doesn't matter, only "some XP" does
  await page1.locator('.option-btn').first().click();
  await page1.waitForSelector('.feedback', { timeout: 10000 });
  ok('user1 answered a question');

  // give the background sync a moment to push the attempt to the server
  await page1.waitForTimeout(1500);

  // user 2: registers, no answers
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto(BASE + '/#/register');
  await page2.fill('#username', U2);
  await page2.fill('#password', PASSWORD);
  await page2.click('#register-form button[type=submit]');
  await page2.waitForSelector('.lesson-path', { timeout: 10000 });
  ok('user2 registered and reached dashboard');

  // nav link present for both
  const navLink1 = await page1.locator('.bottom-nav-item[href="#/leaderboard"]').count();
  if (navLink1 > 0) ok('leaderboard nav link present');
  else fail('leaderboard nav link missing');

  // user1 visits leaderboard
  await page1.click('.bottom-nav-item[href="#/leaderboard"]');
  await page1.waitForSelector('.leaderboard-table', { timeout: 10000 });
  const rows1 = await page1.locator('.leaderboard-table tbody tr').count();
  if (rows1 >= 2) ok('leaderboard shows at least both registered users', { rows1 });
  else fail('leaderboard missing rows', { rows1 });

  const meRow = page1.locator('tr.leaderboard-me');
  const meCount = await meRow.count();
  if (meCount === 1) ok('current user row is highlighted');
  else fail('current user row not uniquely highlighted', { meCount });

  const meText = await meRow.textContent();
  if (meText.includes(U1) && meText.includes('(jij)')) ok('highlighted row is user1 and labeled (jij)');
  else fail('highlighted row content unexpected', { meText });

  // user1 should rank above or equal user2 (has XP, user2 has none)
  const firstRowText = await page1.locator('.leaderboard-table tbody tr').first().textContent();
  if (firstRowText.includes(U1)) ok('user1 (with XP) ranks first');
  else fail('ranking order unexpected', { firstRowText });

  // user2 visits leaderboard too, sanity check their own highlight
  await page2.click('.bottom-nav-item[href="#/leaderboard"]');
  await page2.waitForSelector('.leaderboard-table', { timeout: 10000 });
  const meRow2 = page2.locator('tr.leaderboard-me');
  const meText2 = await meRow2.textContent();
  if (meText2.includes(U2) && meText2.includes('(jij)')) ok('user2 sees their own row highlighted');
  else fail('user2 highlight unexpected', { meText2 });

  if (errors1.length) fail('page errors occurred during test', errors1);
  else ok('no uncaught page errors');

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
