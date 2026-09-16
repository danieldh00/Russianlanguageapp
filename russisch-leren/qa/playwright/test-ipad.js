const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const OUT = process.env.OUT_DIR || __dirname;
const PASSWORD = 'secret123';

// iPad Pro 12.9" (6th gen): CSS viewport 1024x1366 portrait, 1366x1024 landscape, dpr 2
const VIEWPORTS = [
  { name: 'portrait', width: 1024, height: 1366 },
  { name: 'landscape', width: 1366, height: 1024 }
];

function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });

  for (const vp of VIEWPORTS) {
    for (const scheme of ['light', 'dark']) {
      const username = `ipad_${vp.name}_${scheme}_${Date.now()}`;
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, colorScheme: scheme, hasTouch: true, isMobile: false });
      const page = await ctx.newPage();
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));

      await page.goto(BASE + '/#/register');
      await page.fill('#username', username);
      await page.fill('#password', PASSWORD);
      await page.click('#register-form button[type=submit]');
      await page.waitForSelector('.lesson-path', { timeout: 10000 });
      await page.waitForTimeout(300);

      const label = `${vp.name}-${scheme}`;

      const bodyOverflowsX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (!bodyOverflowsX) ok(`[${label}] no horizontal scroll on dashboard`);
      else fail(`[${label}] horizontal scroll on dashboard`);

      const navBox = await page.evaluate(() => {
        const el = document.querySelector('.bottom-nav');
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, width: r.width, viewportWidth: window.innerWidth };
      });
      ok(`[${label}] bottom-nav box: left=${navBox.left.toFixed(0)} right=${navBox.right.toFixed(0)} width=${navBox.width.toFixed(0)} viewport=${navBox.viewportWidth}`);
      const centered = Math.abs((navBox.left + navBox.right) / 2 - navBox.viewportWidth / 2) < 2;
      if (centered) ok(`[${label}] bottom-nav is horizontally centered`);
      else fail(`[${label}] bottom-nav not centered`, navBox);

      await page.screenshot({ path: `${OUT}/ipad-dashboard-${label}.png` });

      await page.click('.bottom-nav-item[href="#/leaderboard"]');
      await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${OUT}/ipad-leaderboard-${label}.png` });

      await page.click('.bottom-nav-item[href="#/progress"]');
      await page.waitForSelector('.stats-row', { timeout: 10000 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${OUT}/ipad-progress-${label}.png` });

      await page.click('.bottom-nav-item[href="#/dashboard"]');
      await page.waitForSelector('.lesson-path', { timeout: 10000 });
      await page.locator('.path-node').first().locator('.lesson-card').click();
      await page.waitForSelector('.option-btn', { timeout: 10000 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${OUT}/ipad-exercise-${label}.png` });

      if (pageErrors.length) fail(`[${label}] uncaught JS errors`, pageErrors);
      else ok(`[${label}] no uncaught JS errors`);

      await ctx.close();
    }
  }

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
