const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const USERNAME = 'v17_' + Date.now();
const PASSWORD = 'secret123';
const SUPLOG = __dirname + '/fake-supervisor.log';

function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }
const supRequests = () => fs.readFileSync(SUPLOG, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

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
  if (content.schemaVersion >= 4 && content.phrasebook && content.phrasebook.length >= 12) ok('bundle v' + content.schemaVersion + ' with phrasebook (' + content.phrasebook.length + ' situations, ' + content.phrasebook.reduce((a, s) => a + s.phrases.length, 0) + ' phrases)'); else fail('phrasebook in bundle', content.schemaVersion);
  const tools = await page.locator('.tool-card').count();
  if (tools === 8) ok('dashboard shows 8 tool cards on a fresh account'); else fail('tool cards', tools);

  // ---- Russian numerals ----
  const nums = await page.evaluate(() => [ruNumber(345), ruNumber(21, 'f'), ruNumber(1000), ruNumber(2500), ruNumber(11), ruPlural(21, ['рубль', 'рубля', 'рублей']), ruPlural(5, ['рубль', 'рубля', 'рублей']), ruPlural(3, ['минута', 'минуты', 'минут']), ruOrdinalDay(31), ruOrdinalDay(9)]);
  const expect = ['триста сорок пять', 'двадцать одна', 'одна тысяча', 'две тысячи пятьсот', 'одиннадцать', 'рубль', 'рублей', 'минуты', 'тридцать первое', 'девятое'];
  if (JSON.stringify(nums) === JSON.stringify(expect)) ok('Russian numerals: ' + nums.slice(0, 4).join(' | ')); else fail('numerals', { nums, expect });

  // ---- dictation UI ----
  await page.goto(BASE + '/#/dictation');
  await page.waitForSelector('#dict-input', { timeout: 10000 });
  await page.locator('.pb-tabs .level-pill', { hasText: 'Tijden' }).click();
  await page.fill('#dict-input', '99:99');
  await page.click('#dict-form button[type=submit]');
  await page.waitForSelector('#dict-feedback .feedback', { timeout: 5000 });
  const dictFb = await page.locator('#dict-feedback .explanation').textContent();
  if (/=\s*\d\d:\d\d/.test(dictFb)) ok('dictation (tijden) grades and reveals: ' + dictFb.trim().slice(0, 80)); else fail('dictation feedback', dictFb);
  await page.screenshot({ path: 'v17-dictation.png' });

  // ---- phrasebook ----
  await page.goto(BASE + '/#/phrasebook');
  await page.waitForSelector('.pb-row', { timeout: 10000 });
  const rows = await page.locator('.pb-row').count();
  await page.locator('.pb-tabs .level-pill', { hasText: 'Apotheek' }).click();
  const apo = await page.locator('.pb-ru').first().textContent();
  await page.fill('#pb-search', 'taxi');
  await page.waitForTimeout(200);
  const found = await page.locator('.pb-row').count();
  if (rows > 5 && /обезболивающее|головной/.test(apo) && found >= 1) ok(`phrasebook: ${rows} rows in first tab, apotheek tab ok, search 'taxi' → ${found}`); else fail('phrasebook', { rows, apo, found });
  await page.screenshot({ path: 'v17-phrasebook.png' });

  // ---- match game ----
  await page.goto(BASE + '/#/match');
  await page.waitForSelector('.match-tile', { timeout: 10000 });
  const ruTiles = await page.locator('.match-tile.ru').allTextContents();
  const nlTiles = await page.locator('.match-tile.nl').allTextContents();
  if (ruTiles.length === 5 && nlTiles.length === 5) ok('match game: 5 + 5 tiles'); else fail('match tiles', { ruTiles, nlTiles });
  const nlOf = {};
  for (const w of Object.values(content.words)) nlOf[w.ru] = w.nl;
  // one deliberate mistake, then all correct
  await page.locator('.match-tile.ru').nth(0).click();
  const wrongNl = nlTiles.find((t) => t !== nlOf[ruTiles[0]]);
  await page.locator('.match-tile.nl', { hasText: wrongNl }).first().click();
  for (const ru of ruTiles) {
    await page.locator('.match-tile.ru', { hasText: ru }).first().click();
    await page.locator('.match-tile.nl', { hasText: nlOf[ru] }).first().click();
  }
  await page.waitForSelector('#match-done .feedback', { timeout: 5000 });
  const doneTxt = await page.locator('#match-done strong').textContent();
  if (/1 fout/.test(doneTxt)) ok('match game finished: ' + doneTxt); else fail('match finish', doneTxt);
  await page.waitForTimeout(1500);
  const log = await page.evaluate((u) => Storage.loadAttemptsLog(u), USERNAME);
  if (log.length === 6 && log.filter((a) => a.isCorrect).length === 5) ok('match game recorded 5 correct + 1 wrong attempt for SRS'); else fail('match attempts', { n: log.length, correct: log.filter((a) => a.isCorrect).length });

  // ---- progress: only started lessons ----
  await page.goto(BASE + '/#/progress');
  await page.waitForSelector('.badge-grid', { timeout: 10000 });
  const progRows = await page.locator('#cat-body tr').count();
  const untouched = await page.locator('text=nog niet gestart').count();
  if (progRows >= 1 && progRows <= 3 && untouched) ok(`progress table shows only ${progRows} started lesson(s) + note about the rest`); else fail('progress rows', { progRows, untouched });

  // ---- Home Assistant card (fake supervisor) ----
  await page.goto(BASE + '/#/settings');
  await page.waitForSelector('#ha-target', { timeout: 10000 });
  const targets = await page.locator('#ha-target option').allTextContents();
  if (targets.length === 3 && targets.some((t) => /iphone van daniel/.test(t))) ok('HA targets listed: ' + targets.join(' | ')); else fail('ha targets', targets);
  await page.selectOption('#ha-target', 'mobile_app_iphone_van_daniel');
  await page.fill('#ha-time', '20:15');
  await page.check('#ha-enabled');
  await page.click('#ha-save');
  await page.waitForSelector('text=Opgeslagen', { timeout: 5000 });
  await page.click('#ha-test');
  await page.waitForSelector('text=Verstuurd via Home Assistant', { timeout: 5000 });
  await page.waitForTimeout(500);
  const reqs = supRequests();
  const notif = reqs.find((r) => r.url === '/core/api/services/notify/mobile_app_iphone_van_daniel');
  const sensor = reqs.find((r) => r.url === '/core/api/states/sensor.russisch_leren_' + USERNAME.toLowerCase());
  if (notif && notif.auth === 'Bearer faketoken' && /Russisch Leren/.test(notif.body.title) && notif.body.data.url === 'https://russisch.example.test/#/review') ok('HA test notification went to the chosen mobile_app target with app link'); else fail('ha notify', notif);
  if (sensor && sensor.body.attributes.unit_of_measurement === 'woorden') ok('HA sensor published: ' + sensor.url.split('/').pop() + ' = ' + sensor.body.state + ' (' + sensor.body.attributes.friendly_name + ')'); else fail('ha sensor', sensor);
  const st = await page.evaluate(async () => (await fetch('/api/ha/status')).json());
  if (st.settings && st.settings.target === 'mobile_app_iphone_van_daniel' && st.settings.enabled && st.settings.reminderTime === '20:15') ok('HA settings persisted per learner'); else fail('ha settings', st.settings);
  await page.screenshot({ path: 'v17-settings-ha.png', fullPage: true });

  if (pageErrors.length) fail('uncaught page errors', pageErrors); else ok('no uncaught JS errors');
  await browser.close();
  console.log('\nv1.7 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
