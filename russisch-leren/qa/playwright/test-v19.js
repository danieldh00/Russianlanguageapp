const { chromium } = require('playwright');
const Database = require('../../backend/node_modules/better-sqlite3');

const BASE = 'http://localhost:3000';
// Dezelfde DATA_DIR waarmee de backend is gestart; zie README.md.
const DB_PATH = require('path').join(process.env.DATA_DIR || '/tmp/russisch-leren-test', 'russian.sqlite');
const USERNAME = 'v19_' + Date.now();
const PASSWORD = 'secret123';

function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }

const dayKey = (offset) => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(BASE + '/#/register');
  await page.fill('#username', USERNAME);
  await page.fill('#password', PASSWORD);
  await page.click('#register-form button[type=submit]');
  await page.waitForSelector('.level-section', { timeout: 20000 });

  // ---- content bundle carries the stories ----
  const bundle = await page.evaluate(async () => (await fetch('/api/content')).json());
  if (bundle.schemaVersion === 5 && Array.isArray(bundle.stories) && bundle.stories.length === 12) ok(`content bundle v5 with ${bundle.stories.length} verhalen`);
  else fail('content bundle', { v: bundle.schemaVersion, stories: bundle.stories && bundle.stories.length });
  const levels = [...new Set(bundle.stories.map((s) => s.level))];
  if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].every((l) => levels.includes(l))) ok('verhalen dekken A1 t/m C2');
  else fail('story levels', levels);
  const badStory = bundle.stories.find((s) => !s.questions.every((q) => q.options.includes(q.answer)));
  if (!badStory) ok('elk juist antwoord staat tussen de keuzes van zijn vraag');
  else fail('story answers', badStory.id);

  // ---- dashboard: goal card + new tool cards ----
  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.goal-card', { timeout: 10000 });
  const goalText = await page.locator('.goal-card').innerText();
  const dots = await page.locator('.goal-day').count();
  if (dots === 7 && /0 van 500 XP/.test(goalText)) ok('weekdoelkaart: ring op 0%, 7 dagbolletjes, standaarddoel 500 XP');
  else fail('goal card', { dots, goalText });
  const freezeChips = await page.locator('.goal-freeze-chip').count();
  if (freezeChips === 0) ok('geen vriezerchip op een vers account');
  else fail('freeze chip on fresh account', freezeChips);
  await page.goto(BASE + '/#/tools');
  await page.waitForSelector('.tool-card', { timeout: 10000 });
  const toolTitles = await page.locator('.tool-card h2').allInnerTexts();
  if (toolTitles.some((t) => t.includes('Leesverhalen')) && toolTitles.some((t) => t.includes('Schrijven met de hand'))) ok('tegels staan in het oefenmenu: ' + toolTitles.length + ' tegels');
  else fail('tool cards', toolTitles);

  // ---- story list + level filter ----
  await page.locator('.tool-card', { hasText: 'Leesverhalen' }).click();
  await page.waitForSelector('.story-card', { timeout: 10000 });
  if (await page.locator('.story-card').count() === 12) ok('verhalenlijst toont alle 12 verhalen');
  else fail('story list count', await page.locator('.story-card').count());
  await page.locator('#story-tabs .level-pill', { hasText: 'C2' }).click();
  const c2 = await page.locator('.story-card').count();
  if (c2 === 2) ok('niveaufilter C2 laat 2 verhalen zien');
  else fail('c2 filter', c2);

  // ---- read a story: translation toggle, word tap, comprehension quiz ----
  await page.locator('#story-tabs .level-pill', { hasText: 'Alle' }).click();
  const story = bundle.stories[0];
  await page.locator('.story-card', { hasText: story.title }).click();
  await page.waitForSelector('.story-para', { timeout: 10000 });
  if (await page.locator('.story-para').count() === story.paragraphs.length) ok(`verhaal "${story.title}" geopend met ${story.paragraphs.length} alinea's`);
  else fail('paragraph count', await page.locator('.story-para').count());

  const firstNl = page.locator('.story-para').first().locator('.story-nl');
  if (await firstNl.isHidden()) ok('vertaling staat standaard verborgen');
  else fail('translation hidden by default');
  await page.locator('.story-para').first().locator('.story-toggle').click();
  if (await firstNl.isVisible() && (await firstNl.innerText()).trim() === story.paragraphs[0][1]) ok('vertaling per alinea klapt open met de juiste tekst');
  else fail('paragraph translation', await firstNl.innerText());
  await page.click('#story-translate');
  const shownAll = await page.locator('.story-nl:visible').count();
  await page.click('#story-translate');
  const shownNone = await page.locator('.story-nl:visible').count();
  if (shownAll === story.paragraphs.length && shownNone === 0) ok('knop "alle vertalingen" schakelt alles tegelijk aan en uit');
  else fail('translate all', { shownAll, shownNone });

  const glossWord = story.glossary[0][0];
  const wordSpan = page.locator('.story-word', { hasText: new RegExp('^' + glossWord.split(' ')[0] + '$', 'i') }).first();
  if (await wordSpan.count()) {
    await wordSpan.click();
    const hint = await page.locator('.story-hint:visible').first().innerText();
    if (hint.includes('—')) ok('tikken op een woord toont de betekenis: ' + hint.replace(/\s+/g, ' ').slice(0, 60));
    else fail('word hint', hint);
  } else {
    const anyWord = page.locator('.story-word').first();
    await anyWord.click();
    const hint = await page.locator('.story-hint:visible').first().innerText();
    if (hint.includes('—')) ok('tikken op een woord toont een reactie: ' + hint.replace(/\s+/g, ' ').slice(0, 60));
    else fail('word hint fallback', hint);
  }

  const xpBeforeStory = (await page.evaluate(async () => (await fetch('/api/progress/stats')).json())).xp;
  await page.click('#story-start');
  await page.waitForSelector('.story-quiz', { timeout: 10000 });
  for (let i = 0; i < story.questions.length; i++) {
    const q = story.questions[i];
    await page.locator('#story-options .option-btn', { hasText: q.answer }).first().click();
    await page.waitForSelector('#story-next', { timeout: 5000 });
    await page.click('#story-next');
  }
  await page.waitForSelector('.xp-gain', { timeout: 10000 });
  const resultText = await page.locator('.story-reader .card').last().innerText();
  const expectedXp = 10 + story.questions.length * 5;
  if (resultText.includes(`+${expectedXp} XP`) && resultText.includes('Alles goed')) ok(`alle ${story.questions.length} vragen goed → +${expectedXp} XP op het resultaatscherm`);
  else fail('story result', resultText.slice(0, 120));
  if (await page.locator('.story-review-row.ok').count() === story.questions.length) ok('elk antwoord krijgt zijn uitleg terug in het overzicht');
  else fail('story review rows');

  await page.waitForTimeout(2500);
  const afterStory = await page.evaluate(async () => (await fetch('/api/progress/stats')).json());
  if (afterStory.xp === xpBeforeStory + expectedXp) ok(`server schrijft de leesXP bij: ${xpBeforeStory} → ${afterStory.xp}`);
  else fail('story xp on server', { before: xpBeforeStory, after: afterStory.xp, expectedXp });
  if (afterStory.weekly.xp === expectedXp && afterStory.weekly.days === 1) ok('weekdoel telt de leessessie mee: ' + afterStory.weekly.xp + ' XP op 1 dag');
  else fail('weekly after story', afterStory.weekly);

  await page.goto(BASE + '/#/stories');
  await page.waitForSelector('.story-card.read', { timeout: 10000 });
  const readCard = await page.locator('.story-card.read').first().innerText();
  if (/✓ gelezen, \d+\/\d+ goed/.test(readCard)) ok('gelezen verhaal is gemarkeerd op de kaart');
  else fail('read marker', readCard);

  // ---- XP for a story cannot be inflated by the client ----
  const cheat = await page.evaluate(async () => {
    const r = await fetch('/api/sync/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: [
      { clientId: 'cheat1', kind: 'story_finished', detail: { score: 9999, total: 2 }, clientTimestamp: new Date().toISOString() }
    ] }) });
    return r.json();
  });
  if (cheat.xpGained === 20) ok('score wordt afgekapt op het opgegeven aantal vragen: 10 + 2×5 = 20 XP');
  else fail('story xp clamp', cheat);

  // ---- a story pays out once ----
  const replay = await page.evaluate(async (id) => {
    const r = await fetch('/api/sync/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: [
      { clientId: 'replay1', kind: 'story_finished', detail: { story: id, score: 4, total: 4 }, clientTimestamp: new Date().toISOString() }
    ] }) });
    return r.json();
  }, story.id);
  if (replay.accepted.length === 1 && replay.xpGained === 0) ok('hetzelfde verhaal opnieuw afronden levert 0 XP op');
  else fail('story replay xp', replay);
  const otherStory = await page.evaluate(async () => {
    const r = await fetch('/api/sync/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: [
      { clientId: 'other1', kind: 'story_finished', detail: { story: 'c2-yazyk', score: 3, total: 4 }, clientTimestamp: new Date().toISOString() }
    ] }) });
    return r.json();
  });
  if (otherStory.xpGained === 25) ok('een ander verhaal levert wel gewoon XP op: 10 + 3×5 = 25');
  else fail('other story xp', otherStory);

  // ---- weekly goal settings ----
  await page.goto(BASE + '/#/settings');
  await page.waitForFunction(() => document.querySelectorAll('#goal-xp option').length > 0, null, { timeout: 10000 });
  await page.selectOption('#goal-xp', '250');
  await page.waitForTimeout(800);
  await page.selectOption('#goal-days-sel', '3');
  await page.waitForTimeout(1200);
  const goalApi = await page.evaluate(async () => (await fetch('/api/progress/goal')).json());
  if (goalApi.goalXp === 250 && goalApi.goalDays === 3) ok('weekdoel opgeslagen op de server: 250 XP / 3 dagen');
  else fail('goal saved', goalApi);
  const badGoal = await page.evaluate(async () => {
    const r = await fetch('/api/progress/goal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weeklyXp: 999999, weeklyDays: 99 }) });
    return r.json();
  });
  if (badGoal.goalXp === 250 && badGoal.goalDays === 3) ok('onzinnige doelwaarden worden genegeerd, het oude doel blijft staan');
  else fail('goal validation', badGoal);

  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.goal-card', { timeout: 10000 });
  const goal2 = await page.locator('.goal-card').innerText();
  if (/van 250 XP/.test(goal2) && /van 3 dagen/.test(goal2)) ok('dashboard toont het nieuwe weekdoel');
  else fail('dashboard goal', goal2);

  // ---- streak freezes: earn one after a full week, spend it on a missed day ----
  const db = new Database(DB_PATH);
  const userId = db.prepare('SELECT id FROM users WHERE username = ?').get(USERNAME).id;
  const insertDay = db.prepare('INSERT OR IGNORE INTO study_days (user_id, study_date) VALUES (?, ?)');
  for (let i = 8; i >= 1; i--) insertDay.run(userId, dayKey(-i));
  const s1 = await page.evaluate(async () => (await fetch('/api/progress/stats')).json());
  if (s1.currentStreak >= 8 && s1.freezes === 1) ok(`acht dagen op rij → reeks ${s1.currentStreak}, 1 vriezer verdiend`);
  else fail('freeze earned', { streak: s1.currentStreak, freezes: s1.freezes });

  db.prepare('DELETE FROM study_days WHERE user_id = ? AND study_date = ?').run(userId, dayKey(-1));
  const s2 = await page.evaluate(async () => (await fetch('/api/progress/stats')).json());
  const frozen = db.prepare('SELECT freeze_date FROM streak_freezes WHERE user_id = ?').all(userId).map((r) => r.freeze_date);
  if (s2.freezeSpentOn === dayKey(-1) && s2.freezes === 0 && frozen.includes(dayKey(-1))) ok('gemiste dag van gisteren is automatisch opgevangen door de vriezer');
  else fail('freeze spent', { spent: s2.freezeSpentOn, freezes: s2.freezes, frozen });
  if (s2.currentStreak === s1.currentStreak) ok(`reeks blijft ${s2.currentStreak} ondanks de gemiste dag`);
  else fail('streak after freeze', { before: s1.currentStreak, after: s2.currentStreak });

  const s3 = await page.evaluate(async () => (await fetch('/api/progress/stats')).json());
  const frozen2 = db.prepare('SELECT COUNT(*) c FROM streak_freezes WHERE user_id = ?').get(userId).c;
  if (frozen2 === 1 && s3.freezes === 0) ok('een tweede keer ophalen verbruikt geen extra vriezer');
  else fail('freeze idempotent', { frozen2, freezes: s3.freezes });

  // a gap of several days is not covered: the streak really does reset
  db.prepare('DELETE FROM study_days WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM streak_freezes WHERE user_id = ?').run(userId);
  db.prepare('UPDATE user_prefs SET freezes = 2, last_freeze_streak = 0 WHERE user_id = ?').run(userId);
  for (let i = 12; i >= 9; i--) insertDay.run(userId, dayKey(-i));
  const s4 = await page.evaluate(async () => (await fetch('/api/progress/stats')).json());
  if (s4.currentStreak === 0 && s4.freezeSpentOn === null && s4.freezes === 2) ok('na een week afwezigheid wordt geen vriezer verspild en begint de reeks opnieuw');
  else fail('long gap', { streak: s4.currentStreak, spent: s4.freezeSpentOn, freezes: s4.freezes });
  db.close();

  await page.goto(BASE + '/#/dashboard');
  await page.waitForSelector('.goal-card', { timeout: 10000 });
  const frozenDot = await page.locator('.goal-day.frozen').count();
  ok(`weekbalk tekent ${frozenDot} bevroren ${frozenDot === 1 ? 'dag' : 'dagen'} als ❄`);

  // ---- handwriting trainer ----
  await page.goto(BASE + '/#/handwriting');
  await page.waitForSelector('#hw-canvas', { timeout: 10000 });
  const firstLetter = await page.locator('#hw-letter').innerText();
  if (/^[А-ЯЁ] [а-яё]$/.test(firstLetter.trim())) ok('handschrifttrainer opent met een letterpaar: ' + firstLetter.trim());
  else fail('hw letter', firstLetter);

  await page.click('#hw-check');
  if ((await page.locator('#hw-feedback').innerText()).includes('Trek eerst de letter na')) ok('nakijken zonder inkt vraagt eerst om te tekenen');
  else fail('hw empty check', await page.locator('#hw-feedback').innerText());

  const box = await page.locator('#hw-canvas').boundingBox();
  async function draw(points) {
    await page.mouse.move(box.x + points[0][0], box.y + points[0][1]);
    await page.mouse.down();
    for (const [x, y] of points.slice(1)) await page.mouse.move(box.x + x, box.y + y, { steps: 4 });
    await page.mouse.up();
  }
  // a scribble far off the glyph should score low
  await draw([[15, 15], [40, 20], [15, 30], [40, 35]]);
  await page.click('#hw-check');
  await page.waitForSelector('#hw-next', { timeout: 5000 });
  const scribble = await page.locator('#hw-feedback .feedback strong').innerText();
  const scribbleScore = parseInt(scribble, 10);
  if (scribbleScore >= 0 && scribbleScore < 60) ok(`een krabbel buiten de letter scoort laag: ${scribble.trim()}`);
  else fail('scribble score', scribble);

  await page.click('#hw-retry');
  // trace roughly over the glyph area: a big vertical sweep through the middle
  await draw([[160, 40], [160, 120], [160, 200]]);
  await page.click('#hw-check');
  await page.waitForSelector('#hw-next', { timeout: 5000 });
  const traced = await page.locator('#hw-feedback .feedback strong').innerText();
  if (parseInt(traced, 10) > scribbleScore) ok(`inkt op de letter scoort hoger dan ernaast: ${traced.trim()} tegen ${scribble.trim()}`);
  else fail('traced score not higher', { traced, scribble });

  const xpBeforeHw = (await page.evaluate(async () => (await fetch('/api/progress/stats')).json())).xp;
  await page.click('#hw-next');
  for (let i = 0; i < 8; i++) {
    if (await page.locator('#hw-again').count()) break;
    await page.click('#hw-skip');
    await page.waitForTimeout(120);
  }
  await page.waitForSelector('#hw-again', { timeout: 10000 });
  const hwDone = await page.locator('.hw-card').innerText();
  if (/\+\d+ XP/.test(hwDone) && /Gemiddeld \d+% nauwkeurig over 8 letters/.test(hwDone)) ok('ronde afgerond met XP-badge: ' + hwDone.split('\n')[0]);
  else fail('hw finish', hwDone.slice(0, 120));
  await page.waitForTimeout(2500);
  const afterHw = await page.evaluate(async () => (await fetch('/api/progress/stats')).json());
  if (afterHw.xp === xpBeforeHw + 20) ok(`server schrijft 20 XP bij voor de schrijfronde: ${xpBeforeHw} → ${afterHw.xp}`);
  else fail('hw xp', { before: xpBeforeHw, after: afterHw.xp });

  if (pageErrors.length) fail('uncaught page errors', pageErrors); else ok('geen onafgevangen JS-fouten');
  await browser.close();
  console.log('\nv1.8.0 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
