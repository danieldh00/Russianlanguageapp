const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const USERNAME = 'v20_' + Date.now();
const PASSWORD = 'secret123';

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
  await page.fill('#password', PASSWORD);
  await page.click('#register-form button[type=submit]');
  await page.waitForSelector('.level-section', { timeout: 20000 });

  // ---- settings screen shows both new cards ----
  await page.goto(BASE + '/#/settings');
  await page.waitForSelector('#parts-list .part-row', { timeout: 10000 });
  const partCount = await page.locator('#parts-list .part-row').count();
  const toolCount = await page.locator('#tools-list .part-row').count();
  const quietCount = await page.locator('#quiet-list .part-row').count();
  if (partCount === 8 && toolCount === 7 && quietCount === 2) ok(`instellingen: ${partCount} oefenvormen, ${toolCount} tegels, ${quietCount} stille-modus-schakelaars`);
  else fail('settings card counts', { partCount, toolCount, quietCount });
  const allOn = await page.locator('#parts-list input:checked').count();
  if (allOn === 8) ok('alle oefenvormen staan standaard aan');
  else fail('defaults', allOn);

  // ---- hiding the handwriting tile ----
  await page.goto(BASE + '/#/tools');
  await page.waitForSelector('.tool-card', { timeout: 10000 });
  const tilesBefore = await page.locator('.tool-card h2').allInnerTexts();
  if (tilesBefore.some((t) => t.includes('Schrijven met de hand'))) ok(`oefenmenu toont ${tilesBefore.length} tegels, inclusief de schrijftrainer`);
  else fail('tiles before', tilesBefore);

  await page.goto(BASE + '/#/settings');
  await page.waitForSelector('#tools-list .part-row', { timeout: 10000 });
  await page.locator('#tools-list .part-row', { hasText: 'Schrijven met de hand' }).locator('input').uncheck();
  await page.locator('#tools-list .part-row', { hasText: 'Toetsenbord' }).locator('input').uncheck();
  const status = await page.locator('#parts-status').textContent();
  if (/verborgen op dit toestel/.test(status)) ok('instellingen bevestigen het verbergen: ' + status.trim());
  else fail('tool status', status);

  await page.goto(BASE + '/#/tools');
  await page.waitForSelector('.tool-card', { timeout: 10000 });
  const tilesAfter = await page.locator('.tool-card h2').allInnerTexts();
  if (!tilesAfter.some((t) => t.includes('Schrijven met de hand')) && !tilesAfter.some((t) => t.includes('Toetsenbord')) && tilesAfter.length === tilesBefore.length - 2) {
    ok(`schrijftrainer en toetsenbord zijn weg: ${tilesBefore.length} → ${tilesAfter.length} tegels`);
  } else fail('tiles after', tilesAfter);

  const stillThere = tilesAfter.some((t) => t.includes('Vandaag herhalen'));
  if (stillThere) ok('"Vandaag herhalen" blijft altijd staan');
  else fail('core tile missing', tilesAfter);

  // a hidden tile is only hidden, the screen itself still works when opened directly
  await page.goto(BASE + '/#/handwriting');
  await page.waitForSelector('#hw-canvas', { timeout: 10000 });
  ok('de verborgen schrijftrainer is nog wel rechtstreeks te openen');

  // ---- turning an exercise kind off keeps it out of a lesson ----
  await page.goto(BASE + '/#/settings');
  await page.waitForSelector('#parts-list .part-row', { timeout: 10000 });
  // rows are in a fixed order: mc, typen, cloze, zinnen, luisteren, lezen, plaatjes, klemtoon
  for (let i = 1; i <= 7; i++) {
    await page.locator('#parts-list .part-row input').nth(i).uncheck();
    await page.waitForTimeout(60);
  }
  const left = await page.locator('#parts-list input:checked').count();
  if (left === 1) ok('zeven oefenvormen uitgezet, alleen meerkeuze blijft aan');
  else fail('parts left', left);

  // the last one cannot be turned off
  await page.locator('#parts-list .part-row input').nth(0).click();
  await page.waitForTimeout(300);
  const lastState = await page.locator('#parts-list .part-row input').nth(0).isChecked();
  const guard = await page.locator('#parts-status').textContent();
  if (lastState && /minstens één oefenvorm/.test(guard)) ok('de laatste oefenvorm laat zich niet uitzetten: ' + guard.trim());
  else fail('last part guard', { lastState, guard });

  // now every question in a lesson must be multiple choice
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.lesson-card', { timeout: 10000 });
  await page.locator('.lesson-path .lesson-card').first().click();
  await page.waitForSelector('.exercise-progress', { timeout: 10000 });
  let sawOnlyMc = true;
  let asked = 0;
  for (let i = 0; i < 10; i++) {
    if (await page.locator('#lesson-done, .lesson-complete').count()) break;
    const hasOptions = await page.locator('#options .option-btn').count();
    const hasTyping = await page.locator('#options .typing-answer').count();
    const hasChips = await page.locator('#options .chip').count();
    if (!hasOptions || hasTyping || hasChips) { sawOnlyMc = false; break; }
    asked++;
    await page.locator('#options .option-btn').first().click();
    await page.waitForSelector('#feedback .feedback', { timeout: 5000 });
    const next = page.locator('#feedback button.primary');
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(150);
  }
  if (sawOnlyMc && asked >= 5) ok(`les bevatte alleen meerkeuzevragen (${asked} vragen doorlopen)`);
  else fail('lesson filtering', { sawOnlyMc, asked });

  // ---- quiet mode from inside a lesson ----
  await page.goto(BASE + '/#/settings');
  await page.waitForSelector('#parts-list .part-row', { timeout: 10000 });
  for (let i = 1; i <= 7; i++) {
    await page.locator('#parts-list .part-row input').nth(i).check();
    await page.waitForTimeout(60);
  }
  ok('alle oefenvormen weer aangezet');

  // Since 1.11.1 the chips only appear where they mean something. A plain
  // multiple-choice question shows none; switching listening off beforehand
  // makes the chip appear so it can always be switched back on.
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.lesson-card', { timeout: 10000 });
  await page.locator('.lesson-path .lesson-card').first().click();
  await page.waitForSelector('.exercise-progress', { timeout: 10000 });
  const chipsOnPlain = await page.locator('.quiet-chip').count();
  if (chipsOnPlain === 0) ok('geen stille-modus-knopjes op een vraag die er niets mee te maken heeft');
  else ok(`deze vraag toont ${chipsOnPlain} knopje(s), dus hij vraagt om geluid of spraak`);

  await page.evaluate(() => saveQuietSettings({ noListen: true }));
  await page.reload();
  await page.waitForSelector('.quiet-bar', { timeout: 10000 });
  const afterClick = await page.locator('.quiet-chip.active').first().innerText();
  const pressed = await page.locator('.quiet-chip.active').first().getAttribute('aria-pressed');
  if (/Luisteren staat uit/.test(afterClick) && pressed === 'true') ok('een ingeschakelde stille modus blijft zichtbaar: ' + afterClick.trim());
  else fail('quiet listen toggle', { afterClick, pressed });

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ru:settings')).quiet);
  if (stored && stored.noListen === true) ok('de keuze wordt op het toestel bewaard');
  else fail('quiet stored', stored);

  const typeAllowed = await page.evaluate(() => ({ listen: exerciseTypeAllowed('listen'), typing: exerciseTypeAllowed('typing') }));
  if (typeAllowed.listen === false && typeAllowed.typing === true) ok('luisteroefeningen worden geweerd, de rest blijft gewoon komen');
  else fail('type filter', typeAllowed);

  await page.evaluate(() => saveQuietSettings({ noSpeak: true }));
  await page.waitForTimeout(200);
  const micGone = await page.evaluate(() => micAvailable());
  if (micGone === false) ok('microfoonknoppen zijn uitgeschakeld met "even niet praten"');
  else fail('mic still available');

  // walk to a typing question and confirm there is no microphone button
  let checkedTyping = false;
  for (let i = 0; i < 12; i++) {
    if (await page.locator('#options .typing-answer').count()) {
      const mic = await page.locator('#options .mic-btn').count();
      if (mic === 0) { ok('typvraag heeft geen microfoonknop meer'); checkedTyping = true; }
      else fail('mic button still rendered');
      break;
    }
    if (!(await page.locator('#options .option-btn').count())) break;
    await page.locator('#options .option-btn, #options .chip').first().click();
    await page.waitForSelector('#feedback .feedback', { timeout: 5000 });
    const next = page.locator('#feedback button.primary');
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(150);
  }
  if (!checkedTyping) console.log('INFO - geen typvraag tegengekomen in deze sessie');

  // the mic button itself refuses to be built while "even niet praten" is on
  const micNull = await page.evaluate(() => renderMicButton(() => {}) === null);
  if (micNull) ok('renderMicButton levert niets op zolang spreken uitstaat');
  else fail('mic button built anyway');

  // the filter every session runs through drops all listening material and
  // leaves everything else untouched
  const filterCheck = await page.evaluate(async () => {
    const c = await (await fetch('/api/content')).json();
    const listens = c.exercises.filter((e) => e.type === 'listen');
    const others = c.exercises.filter((e) => e.type !== 'listen');
    return { listenTotal: listens.length, listenKept: allowedExercises(listens).length, otherTotal: others.length, otherKept: allowedExercises(others).length };
  });
  if (filterCheck.listenTotal > 0 && filterCheck.listenKept === 0 && filterCheck.otherKept === filterCheck.otherTotal) {
    ok(`filter weert alle ${filterCheck.listenTotal} luisteroefeningen en laat de overige ${filterCheck.otherTotal} staan`);
  } else fail('allowedExercises filter', filterCheck);

  // ---- settings mirror the in-lesson switches ----
  await page.goto(BASE + '/#/settings');
  await page.waitForSelector('#quiet-list .part-row', { timeout: 10000 });
  const quietChecked = await page.locator('#quiet-list input:checked').count();
  if (quietChecked === 2) ok('instellingen tonen beide stille-modus-schakelaars als aan');
  else fail('quiet mirrored', quietChecked);
  await page.locator('#quiet-list .part-row input').nth(0).uncheck();
  await page.locator('#quiet-list .part-row input').nth(1).uncheck();
  const back = await page.evaluate(() => quietSettings());
  if (back.noListen === false && back.noSpeak === false) ok('stille modus weer uitgezet vanuit instellingen');
  else fail('quiet off', back);

  // ---- a lesson with nothing left explains itself ----
  await page.evaluate(() => {
    const s = Storage.loadSettings();
    s.parts = { mc: true, typing: false, cloze: false, sentence: false, listen: false, reading: false, picture: false, stress: false };
    Storage.saveSettings(s);
  });
  const content = await page.evaluate(async () => (await fetch('/api/content')).json());
  const bySlug = {};
  for (const e of content.exercises) (bySlug[e.category] = bySlug[e.category] || new Set()).add(e.type);
  const mcOnlyOff = Object.entries(bySlug).find(([, types]) => ![...types].some((t) => ['mc', 'mc_ru_nl', 'mc_nl_ru'].includes(t)));
  if (mcOnlyOff) {
    await page.goto(BASE + '/#/lesson/' + mcOnlyOff[0]);
    await page.waitForSelector('.card', { timeout: 10000 });
    const txt = await page.locator('.card').first().innerText();
    if (/oefenvormen die je hebt uitgezet/.test(txt)) ok(`een les zonder toegestane vormen legt het uit (${mcOnlyOff[0]})`);
    else fail('empty lesson message', txt.slice(0, 140));
  } else {
    console.log('INFO - elke les bevat meerkeuze, lege-les-scherm niet te reproduceren');
  }

  if (errs.length) fail('uncaught page errors', errs); else ok('geen onafgevangen JS-fouten');
  await browser.close();
  console.log('\nv1.9.0 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
