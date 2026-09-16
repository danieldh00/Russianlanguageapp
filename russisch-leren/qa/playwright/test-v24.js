const { chromium } = require('playwright');
const BASE = 'http://localhost:3000';
const USERNAME = 'v24_' + Date.now();

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
  ok('ingelogd als ' + USERNAME);

  // A helper that lives in the page and reuses the app's own relatedKeys().
  await page.evaluate(() => {
    // A key that turns up k times among n questions can be spread at most
    // floor((n-1)/(k-1)) apart -- a three-word lesson of ten questions simply
    // cannot keep everything three apart. So each key is judged against what
    // its own material allows, capped at the gap the app aims for.
    window.__violations = (items, minGap = 3) => {
      const counts = new Map();
      items.forEach((ex) => relatedKeys(ex).forEach((k) => counts.set(k, (counts.get(k) || 0) + 1)));
      const lastSeen = new Map();
      const bad = [];
      items.forEach((ex, i) => {
        for (const k of relatedKeys(ex)) {
          const k_n = counts.get(k);
          const possible = k_n > 1 ? Math.floor((items.length - 1) / (k_n - 1)) : minGap;
          const want = Math.min(minGap, possible);
          if (lastSeen.has(k) && i - lastSeen.get(k) < want) {
            bad.push({ gap: i - lastSeen.get(k), want, key: k, a: items[lastSeen.get(k)].prompt.slice(0, 40), b: ex.prompt.slice(0, 40) });
          }
          lastSeen.set(k, i);
        }
      });
      return bad;
    };
  });

  // ---- 1. the reported case: the alphabet lesson, in every progress state ----
  const lessonRuns = await page.evaluate(async () => {
    const c = await (await fetch('api/content')).json();
    const alphabet = c.exercises.filter((e) => e.category === 'alphabet');
    const wordIds = [...new Set(alphabet.filter((e) => e.wordId != null).map((e) => e.wordId))];
    const iso = (ms) => new Date(Date.now() + ms).toISOString();
    const states = {
      'alles nieuw': {},
      'alles te herhalen (zelfde tijdstip)': Object.fromEntries(wordIds.map((id) => [id, { nextReviewAt: iso(-3600e3) }])),
      'alles later gepland': Object.fromEntries(wordIds.map((id) => [id, { nextReviewAt: iso(86400e3) }])),
      'half te herhalen, half nieuw': Object.fromEntries(wordIds.filter((_, i) => i % 2 === 0).map((id) => [id, { nextReviewAt: iso(-3600e3) }]))
    };
    const out = {};
    for (const [label, progress] of Object.entries(states)) {
      let worst = [];
      let sizes = new Set();
      for (let run = 0; run < 40; run++) {
        const batch = pickBatch(alphabet, progress, 10);
        sizes.add(batch.length);
        const v = window.__violations(batch);
        if (v.length > worst.length) worst = v;
      }
      out[label] = { worst, sizes: [...sizes] };
    }
    return out;
  });
  for (const [label, r] of Object.entries(lessonRuns)) {
    if (r.worst.length === 0 && r.sizes.every((n) => n === 10)) ok(`alfabetles, ${label}: 40 sessies van 10 vragen, geen enkele vraag binnen 3 plaatsen van zijn tegenhanger`);
    else fail(`alfabetles, ${label}`, r);
  }

  // ---- 2. the same, over every lesson in the app ----
  const allLessons = await page.evaluate(async () => {
    const c = await (await fetch('api/content')).json();
    const iso = (ms) => new Date(Date.now() + ms).toISOString();
    const bad = [];
    let checked = 0;
    for (const cat of c.categories) {
      const list = c.exercises.filter((e) => e.category === cat.slug);
      if (!list.length) continue;
      const wordIds = [...new Set(list.filter((e) => e.wordId != null).map((e) => e.wordId))];
      const due = Object.fromEntries(wordIds.map((id) => [id, { nextReviewAt: iso(-3600e3) }]));
      for (const progress of [{}, due]) {
        const batch = pickBatch(list, progress, 10);
        checked++;
        const v = window.__violations(batch);
        if (v.length) bad.push({ lesson: cat.slug, v: v.slice(0, 2) });
      }
    }
    return { checked, bad: bad.slice(0, 5), badCount: bad.length };
  });
  if (allLessons.badCount === 0) ok(`alle 126 lessen, nieuw en te herhalen (${allLessons.checked} sessies): nergens twee bijna gelijke vragen achter elkaar`);
  else fail('lessons still cluster', allLessons);

  // ---- 3. the daily review, the session the user complained about ----
  const reviewPrompts = await page.evaluate(async (username) => {
    const c = await (await fetch('api/content')).json();
    const alphabet = c.exercises.filter((e) => e.category === 'alphabet' && e.wordId != null);
    const wordIds = [...new Set(alphabet.map((e) => e.wordId))].slice(0, 8);
    // every letter due, all at the same moment -- exactly what a first lesson leaves behind
    const progress = {};
    wordIds.forEach((id, i) => { progress[id] = { nextReviewAt: new Date(Date.now() - 3600e3 + i).toISOString(), repetitions: 1, interval: 1, ease: 2.5 }; });
    localStorage.setItem(`ru:${username}:wordProgress`, JSON.stringify(progress));
    return wordIds.length;
  }, USERNAME);
  ok(`${reviewPrompts} letters op herhaling gezet`);

  async function walkSession(hash, expected) {
    await page.goto(BASE + '/' + hash);
    await page.waitForSelector('.exercise-progress', { timeout: 15000 });
    const seen = [];
    for (let i = 0; i < expected + 2; i++) {
      const done = await page.locator('.exercise-progress').count() === 0;
      if (done) break;
      const prompt = (await page.locator('.exercise-prompt, .question, h2').first().innerText().catch(() => '')) || '';
      const shown = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('.option-btn, .option')].map((b) => b.innerText.trim());
        return btns;
      });
      seen.push({ prompt: prompt.trim(), options: shown });
      const opt = page.locator('.option-btn, .option').first();
      if (await opt.count()) await opt.click();
      else {
        const input = page.locator('input.typing-answer, .typing-answer').first();
        if (await input.count()) { await input.fill('x'); await page.locator('form button[type=submit]').first().click(); }
        else break;
      }
      const next = page.locator('button.primary').filter({ hasText: /Volgende|Klaar/ }).first();
      await next.waitFor({ timeout: 10000 });
      await next.click();
      await page.waitForTimeout(120);
    }
    return seen;
  }

  const review = await walkSession('#/review', 8);
  // Two review questions are near-identical when they are about the same letter:
  // the letter is either in the prompt or among the options.
  const subj = (q) => {
    const m = q.prompt.match(/[Ѐ-ӿ]\s[Ѐ-ӿ]/);
    return m ? m[0].toLowerCase() : null;
  };
  let reviewBad = [];
  for (let i = 1; i < review.length; i++) {
    const a = subj(review[i - 1]), b = subj(review[i]);
    if (a && b && a === b) reviewBad.push([review[i - 1].prompt, review[i].prompt]);
  }
  if (review.length >= 5 && !reviewBad.length) ok(`herhaalsessie van ${review.length} vragen doorlopen: geen twee vragen over dezelfde letter achter elkaar`);
  else if (review.length < 5) fail('review session too short to judge', review.length);
  else fail('review still repeats a letter', reviewBad);

  // ---- 4. "Oefen je fouten" ----
  const mistakeCheck = await page.evaluate(async (username) => {
    const c = await (await fetch('api/content')).json();
    const alphabet = c.exercises.filter((e) => e.category === 'alphabet' && e.wordId != null);
    const byWord = new Map();
    for (const e of alphabet) { if (!byWord.has(e.wordId)) byWord.set(e.wordId, []); byWord.get(e.wordId).push(e); }
    // five letters, both questions of each one answered wrongly -- the exact
    // pairing that used to come back as five back-to-back duos
    const pairs = [...byWord.values()].filter((l) => l.length >= 2).slice(0, 5);
    const log = [];
    pairs.forEach((list, i) => list.slice(0, 2).forEach((e) => {
      log.push({ exerciseId: e.id, isCorrect: false, at: new Date(Date.now() - i * 1000).toISOString() });
    }));
    localStorage.setItem(`ru:${username}:attemptsLog`, JSON.stringify(log));
    const pool = allowedExercises(mistakeExercises(c, username));
    const items = spreadRelated(roundRobinByWord(pool).slice(0, 10));
    return { pool: pool.length, items: items.length, violations: window.__violations(items) };
  }, USERNAME);
  if (mistakeCheck.items >= 5 && mistakeCheck.violations.length === 0) ok(`"Oefen je fouten" met ${mistakeCheck.pool} openstaande fouten: ${mistakeCheck.items} vragen, geen paar achter elkaar`);
  else fail('mistakes practice still clusters', mistakeCheck);

  // ---- 5. the level exam (composed on the server) ----
  const examCheck = await page.evaluate(async () => {
    const c = await (await fetch('api/content')).json();
    const byId = new Map(c.exercises.map((e) => [e.id, e]));
    const results = [];
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      let worst = null;
      for (let draw = 0; draw < 5; draw++) {
        const res = await fetch('api/exams/' + level);
        if (!res.ok) { worst = { level, error: res.status }; break; }
        const exam = await res.json();
        const full = exam.questions.map((q) => byId.get(q.id)).filter(Boolean);
        const v = window.__violations(full);
        if (!worst || worst.violations && v.length > worst.violations.length) worst = { level, count: exam.questions.length, resolved: full.length, violations: v };
      }
      results.push(worst);
    }
    return results;
  });
  for (const r of examCheck) {
    if (r.error) fail(`toets ${r.level} niet opgehaald`, r);
    else if (r.violations.length === 0 && r.resolved === r.count) ok(`niveautoets ${r.level}, 5 keer opgehaald: ${r.count} vragen, geen twee over hetzelfde woord binnen 3 plaatsen`);
    else fail(`exam ${r.level} clusters`, r);
  }

  // ---- 6. nothing gained or lost by the reordering ----
  const integrity = await page.evaluate(async () => {
    const c = await (await fetch('api/content')).json();
    const sample = c.exercises.slice(0, 200);
    const out = spreadRelated(sample);
    const before = sample.map((e) => e.id).sort((a, b) => a - b).join(',');
    const after = out.map((e) => e.id).sort((a, b) => a - b).join(',');
    const untouched = spreadRelated(c.exercises.filter((e) => e.category === 'alphabet').slice(0, 2));
    return { same: before === after, len: out.length, shortListKept: untouched.length === 2 };
  });
  if (integrity.same && integrity.len === 200 && integrity.shortListKept) ok('spreiden voegt niets toe en laat niets vallen (200 oefeningen, exact dezelfde verzameling)');
  else fail('spread changed the set', integrity);

  // ---- 7. the accented-word fix the spacing work uncovered ----
  const speech = await page.evaluate(async () => {
    const c = await (await fetch('api/content')).json();
    const truncated = [];
    let accented = 0;
    for (const ex of c.exercises) {
      const m = String(ex.prompt || '').match(/['\u2018\u2019]([\u0400-\u04ff\u0301]+)['\u2018\u2019]/);
      if (!m || !m[1].includes('\u0301')) continue;
      accented++;
      const spoken = extractSpeakText(ex);
      const bare = m[1].replace(/\u0301/g, '');
      if (spoken && spoken.replace(/\u0301/g, '') !== bare) truncated.push({ prompt: ex.prompt.slice(0, 40), spoken });
    }
    return { accented, truncated: truncated.slice(0, 4), count: truncated.length };
  });
  if (speech.accented > 100 && speech.count === 0) ok(`luisterknop leest alle ${speech.accented} vragen met een klemtoonteken nu volledig voor (was afgekapt op het teken, "де" i.p.v. "девять")`);
  else fail('listen button still truncates accented words', speech);

  if (!errs.length) ok('geen JavaScript-fouten in de console');
  else fail('page errors', errs.slice(0, 3));

  await browser.close();
})();
