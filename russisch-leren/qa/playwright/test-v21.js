const { chromium } = require('playwright');
const BASE = 'http://localhost:3000';
const USERNAME = 'v21_' + Date.now();

function ok(l) { console.log('OK   - ' + l); }
function fail(l, x) { console.log('FAIL - ' + l + (x !== undefined ? ' :: ' + JSON.stringify(x) : '')); process.exitCode = 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto(BASE + '/#/register');
  await page.fill('#username', USERNAME);
  await page.fill('#password', 'secret123');
  await page.click('#register-form button[type=submit]');
  await page.waitForSelector('.level-section', { timeout: 20000 });

  // ---- the lesson path is reachable without scrolling ----
  const tilesOnDashboard = await page.locator('.tool-card').count();
  if (tilesOnDashboard === 0) ok('geen oefentegels meer op het lessenscherm');
  else fail('tiles still on dashboard', tilesOnDashboard);

  const firstCard = await page.locator('.lesson-path .lesson-card').first().boundingBox();
  const viewport = page.viewportSize();
  if (firstCard && firstCard.y < viewport.height) ok(`eerste les staat op ${Math.round(firstCard.y)} px, binnen het scherm van ${viewport.height} px`);
  else fail('first lesson below the fold', { y: firstCard && firstCard.y, viewport: viewport.height });

  const strip = await page.locator('.daily-strip .daily-chip').allInnerTexts();
  if (strip.length === 1 && strip[0].includes('Oefenen')) ok('vers account toont één chip: ' + strip[0].trim());
  else fail('daily strip on a fresh account', strip);

  // ---- the fifth tab ----
  const tabs = await page.locator('.bottom-nav-item .bottom-nav-label').allInnerTexts();
  if (tabs.join(',') === 'Lessen,Oefenen,Voortgang,Ranglijst,Instellingen') ok('vijf tabs onderin: ' + tabs.join(' · '));
  else fail('nav items', tabs);
  const navBox = await page.locator('.bottom-nav').boundingBox();
  if (navBox && navBox.width <= viewport.width) ok(`tabbalk past op het scherm: ${Math.round(navBox.width)} van ${viewport.width} px`);
  else fail('nav overflows', navBox && navBox.width);

  // ---- the Oefenen screen ----
  await page.locator('.daily-strip .daily-chip', { hasText: 'Oefenen' }).click();
  await page.waitForSelector('.tool-group', { timeout: 10000 });
  const groups = await page.locator('.tool-group > h2').allInnerTexts();
  if (groups.length === 4) ok('oefenmenu heeft vier groepen: ' + groups.join(' · '));
  else fail('tool groups', groups);
  const toolCount = await page.locator('.tool-card').count();
  if (toolCount === 9) ok(`negen oefenvormen in het menu (twee dagelijkse + zeven tegels)`);
  else fail('tool count', toolCount);

  const active = await page.locator('.bottom-nav-item.active .bottom-nav-label').innerText();
  if (active === 'Oefenen') ok('de tab "Oefenen" is gemarkeerd als actief');
  else fail('active tab on tools screen', active);

  // a screen opened from here keeps the Oefenen tab highlighted
  await page.locator('.tool-card', { hasText: 'Zakboekje' }).click();
  await page.waitForSelector('.phrasebook', { timeout: 10000 });
  const activeDeep = await page.locator('.bottom-nav-item.active .bottom-nav-label').innerText();
  if (activeDeep === 'Oefenen') ok('het zakboekje valt ook onder de tab Oefenen');
  else fail('active tab on phrasebook', activeDeep);

  // a lesson keeps the Lessen tab highlighted
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.lesson-card', { timeout: 10000 });
  await page.locator('.lesson-path .lesson-card').first().click();
  await page.waitForSelector('.exercise-progress', { timeout: 10000 });
  const activeLesson = await page.locator('.bottom-nav-item.active .bottom-nav-label').innerText();
  if (activeLesson === 'Lessen') ok('een les valt nog steeds onder de tab Lessen');
  else fail('active tab in lesson', activeLesson);

  // ---- hiding a tool removes it from the menu, not from the dashboard ----
  await page.goto(BASE + '/#/settings');
  await page.waitForFunction(() => document.querySelectorAll('#tools-list input').length > 0, null, { timeout: 10000 });
  await page.locator('#tools-list .part-row', { hasText: 'Zakboekje' }).locator('input').uncheck();
  await page.goto(BASE + '/#/tools');
  await page.waitForSelector('.tool-group', { timeout: 10000 });
  const afterHide = await page.locator('.tool-card').count();
  const hasPhrasebook = (await page.locator('.tool-card h2').allInnerTexts()).some((t) => t.includes('Zakboekje'));
  if (afterHide === 8 && !hasPhrasebook) ok('een verborgen tegel verdwijnt uit het oefenmenu: 9 → 8');
  else fail('hide in tools menu', { afterHide, hasPhrasebook });

  // ---- the daily chips appear once there is something to do ----
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.lesson-card', { timeout: 10000 });
  await page.locator('.lesson-path .lesson-card').first().click();
  await page.waitForSelector('#options', { timeout: 10000 });
  // answer one question wrong so "Je fouten" has something to show
  const wrong = page.locator('#options .option-btn').last();
  if (await wrong.count()) {
    await wrong.click();
    await page.waitForSelector('#feedback .feedback', { timeout: 5000 });
  }
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.daily-strip', { timeout: 10000 });
  const strip2 = await page.locator('.daily-strip .daily-chip').allInnerTexts();
  const hasMistakes = strip2.some((t) => t.includes('Je fouten'));
  if (hasMistakes) ok('na een fout antwoord verschijnt de chip: ' + strip2.join(' | ').replace(/\n/g, ' '));
  else console.log('INFO - het antwoord was toevallig goed, geen foutenchip');

  if (errs.length) fail('uncaught page errors', errs); else ok('geen onafgevangen JS-fouten');
  await browser.close();
  console.log('\nv1.9.1 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
