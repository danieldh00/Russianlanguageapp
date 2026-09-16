const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const USERNAME = 'nav_' + Date.now();
const PASSWORD = 'secret123';

function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // iPhone 12/13/14 width
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(BASE + '/#/register');
  await page.fill('#username', USERNAME);
  await page.fill('#password', PASSWORD);
  await page.click('#register-form button[type=submit]');
  await page.waitForSelector('.lesson-path', { timeout: 10000 });
  ok('registered and dashboard rendered');

  // top bar must not overflow the viewport width (the original bug report)
  const topbarOverflow = await page.evaluate(() => {
    const el = document.querySelector('.topbar-inner');
    return el.scrollWidth > el.clientWidth + 1;
  });
  if (!topbarOverflow) ok('top bar does not overflow horizontally');
  else fail('top bar still overflows');

  const bodyOverflowsX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (!bodyOverflowsX) ok('page has no horizontal scroll');
  else fail('page has horizontal scroll');

  const bottomNavCount = await page.locator('.bottom-nav .bottom-nav-item').count();
  if (bottomNavCount === 4) ok('bottom nav has 4 tabs (Lessen, Voortgang, Ranglijst, Uitloggen)');
  else fail('unexpected bottom nav tab count', { bottomNavCount });

  const activeTab = await page.locator('.bottom-nav-item.active').textContent();
  if (activeTab && activeTab.includes('Lessen')) ok('Lessen tab active on dashboard');
  else fail('wrong active tab on dashboard', { activeTab });

  await page.click('.bottom-nav-item[href="#/progress"]');
  await page.waitForSelector('.stats-row', { timeout: 10000 });
  const activeTab2 = await page.locator('.bottom-nav-item.active').textContent();
  if (activeTab2 && activeTab2.includes('Voortgang')) ok('Voortgang tab becomes active after navigating');
  else fail('active tab did not update', { activeTab2 });

  await page.click('.bottom-nav-item[href="#/leaderboard"]');
  await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
  ok('leaderboard reachable via bottom nav');

  // going into a lesson should keep "Lessen" highlighted
  await page.click('.bottom-nav-item[href="#/dashboard"]');
  await page.waitForSelector('.lesson-path', { timeout: 10000 });
  await page.locator('.path-node').first().locator('.lesson-card').click();
  await page.waitForSelector('.option-btn', { timeout: 10000 });
  const activeTab3 = await page.locator('.bottom-nav-item.active').textContent();
  if (activeTab3 && activeTab3.includes('Lessen')) ok('Lessen tab stays active while inside a lesson');
  else fail('Lessen tab not active during lesson', { activeTab3 });

  // content isn't hidden behind the floating bottom nav
  const lastCardBottom = await page.evaluate(() => {
    const cards = document.querySelectorAll('#app .card, #app .option-btn');
    const last = cards[cards.length - 1];
    return last ? last.getBoundingClientRect().bottom : null;
  });
  const navTop = await page.evaluate(() => document.querySelector('.bottom-nav').getBoundingClientRect().top);
  ok(`last content bottom=${lastCardBottom}, bottom-nav top=${navTop} (informational)`);

  if (pageErrors.length) fail('uncaught page errors', pageErrors);
  else ok('no uncaught JS errors');

  await ctx.close();
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
