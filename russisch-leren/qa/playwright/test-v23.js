const { chromium } = require('playwright');
const BASE = 'http://localhost:3000';
const USERNAME = 'v23_' + Date.now();

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

  // ---- the listen button must never read the answer of an unanswered question ----
  const leak = await page.evaluate(async () => {
    const c = await (await fetch('api/content')).json();
    const leaks = [];
    let withButton = 0;
    for (const ex of c.exercises) {
      const spoken = extractSpeakText(ex);
      if (spoken) withButton++;
      if (spoken && ex.correctAnswer && spoken.trim() === ex.correctAnswer.trim() && ex.type !== 'listen' && ex.type !== 'reading') {
        leaks.push({ type: ex.type, prompt: ex.prompt.slice(0, 50), spoken });
      }
    }
    return { total: c.exercises.length, withButton, leaks: leaks.slice(0, 5), leakCount: leaks.length };
  });
  if (leak.leakCount === 0) ok(`geen enkele van de ${leak.total} oefeningen leest nog het antwoord voor (${leak.withButton} houden een luisterknop)`);
  else fail('answer still spoken aloud', leak.leaks);

  // the exact question from the screenshot
  const screenshotCase = await page.evaluate(async () => {
    const c = await (await fetch('api/content')).json();
    const ex = c.exercises.find((e) => /Welke letter klinkt als 'zj'/.test(e.prompt || ''));
    return ex ? { prompt: ex.prompt, answer: ex.correctAnswer, spoken: extractSpeakText(ex) } : null;
  });
  if (screenshotCase && screenshotCase.spoken === null) ok('de vraag uit de schermafbeelding heeft geen luisterknop meer');
  else fail('screenshot case', screenshotCase);

  // a question whose prompt does contain Russian keeps its button
  const keeps = await page.evaluate(async () => {
    const c = await (await fetch('api/content')).json();
    const ex = c.exercises.find((e) => /Hoe klinkt de letter/.test(e.prompt || ''));
    return ex ? { prompt: ex.prompt, spoken: extractSpeakText(ex) } : null;
  });
  if (keeps && keeps.spoken && /[Ѐ-ӿ]/.test(keeps.spoken)) ok('een vraag mét Russisch in de tekst houdt de knop: ' + keeps.spoken);
  else fail('lost a legitimate button', keeps);

  // ---- the quiet chips only where they mean something ----
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.lesson-card', { timeout: 10000 });
  await page.locator('.lesson-path .lesson-card').first().click();
  await page.waitForSelector('.exercise-progress', { timeout: 10000 });
  const type = await page.evaluate(() => document.querySelector('#options .option-btn') ? 'keuze' : 'tekst');
  const chips = await page.locator('.quiet-chip').count();
  if (type === 'keuze' && chips === 0) ok('meerkeuzevraag toont geen stille-modus-knopjes meer');
  else if (type === 'tekst' && chips === 1) ok('een typvraag toont alleen "Even niet praten"');
  else fail('chips on a plain question', { type, chips });

  // once switched on, the chip stays reachable so it can be switched off again
  await page.evaluate(() => saveQuietSettings({ noListen: true }));
  await page.reload();
  await page.waitForSelector('.exercise-progress', { timeout: 15000 });
  const activeChip = await page.locator('.quiet-chip.active').count();
  if (activeChip >= 1) ok('een ingeschakelde stille modus blijft zichtbaar om weer uit te zetten');
  else fail('no way back from quiet mode');
  await page.evaluate(() => saveQuietSettings({ noListen: false, noSpeak: false }));

  // ---- a silent listen button says why ----
  await page.goto(BASE + '/#/phrasebook');
  await page.waitForSelector('.pb-row .speak-btn', { timeout: 10000 });
  const voices = await page.evaluate(() => window.speechSynthesis.getVoices().filter((v) => /^ru/i.test(v.lang)).length);
  await page.locator('.pb-row .speak-btn').first().click();
  await page.waitForTimeout(2200);
  const notice = await page.locator('.speak-problem').first().count();
  if (voices === 0 && notice === 1) {
    const text = await page.locator('.speak-problem').first().innerText();
    ok('zonder Russische stem verschijnt een uitleg bij de knop: ' + text.slice(0, 70) + '…');
  } else if (voices > 0 && notice === 0) {
    ok('er is een Russische stem, dus geen melding');
  } else fail('speech problem notice', { voices, notice });

  // ---- after answering, the answer may be heard ----
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.lesson-card', { timeout: 10000 });
  await page.locator('.lesson-path .lesson-card').first().click();
  await page.waitForSelector('#options', { timeout: 10000 });
  // walk on until a question turns up whose answer is actually Russian
  let checked = false;
  for (let i = 0; i < 10 && !checked; i++) {
    const russianAnswer = await page.evaluate(() =>
      [...document.querySelectorAll('#options .option-btn')].some((b) => /[Ѐ-ӿ]/.test(b.textContent)));
    const btn = page.locator('#options .option-btn').first();
    if (!(await btn.count())) break;
    await btn.click();
    await page.waitForSelector('#feedback .feedback', { timeout: 10000 });
    if (russianAnswer) {
      const answerSpeak = await page.locator('#feedback .speak-btn', { hasText: 'Hoor het antwoord' }).count();
      if (answerSpeak >= 1) ok('na het antwoorden staat er een knop om het juiste antwoord te horen');
      else fail('no answer listen button after answering a Russian answer');
      checked = true;
      break;
    }
    const next = page.locator('#feedback button.primary');
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(200);
    if (!(await page.locator('#options').count())) break;
  }
  if (!checked) console.log('INFO - geen vraag met Russisch antwoord tegengekomen in deze ronde');

  if (errs.length) fail('uncaught page errors', errs); else ok('geen onafgevangen JS-fouten');
  await browser.close();
  console.log('\nv1.11.1 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
