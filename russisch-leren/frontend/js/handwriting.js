// ---------- handwriting: trace the Cyrillic letters ----------

// name = how the letter is called, sound = what it sounds like in Dutch terms
const CYRILLIC_LETTERS = [
  ['А', 'а', 'a', 'als de a in "dag"'],
  ['Б', 'б', 'be', 'als de b in "boek"'],
  ['В', 'в', 've', 'als de v/w in "vis"'],
  ['Г', 'г', 'ge', 'als de g in "goal"'],
  ['Д', 'д', 'de', 'als de d in "dak"'],
  ['Е', 'е', 'je', 'als "je" in "jelui"'],
  ['Ё', 'ё', 'jo', 'als "jo", altijd beklemtoond'],
  ['Ж', 'ж', 'zje', 'als de g in "garage"'],
  ['З', 'з', 'ze', 'als de z in "zon"'],
  ['И', 'и', 'i', 'als de ie in "niet"'],
  ['Й', 'й', 'korte i', 'als de j in "saai"'],
  ['К', 'к', 'ka', 'als de k in "kat"'],
  ['Л', 'л', 'el', 'als de l in "lamp"'],
  ['М', 'м', 'em', 'als de m in "maan"'],
  ['Н', 'н', 'en', 'als de n in "nacht"'],
  ['О', 'о', 'o', 'als de o in "boot", onbeklemtoond bijna "a"'],
  ['П', 'п', 'pe', 'als de p in "pen"'],
  ['Р', 'р', 'er', 'rollende r'],
  ['С', 'с', 'es', 'als de s in "sok"'],
  ['Т', 'т', 'te', 'als de t in "tak"'],
  ['У', 'у', 'oe', 'als de oe in "boek"'],
  ['Ф', 'ф', 'ef', 'als de f in "fiets"'],
  ['Х', 'х', 'cha', 'als de ch in "lachen"'],
  ['Ц', 'ц', 'tse', 'als de ts in "tsaar"'],
  ['Ч', 'ч', 'tsje', 'als de tsj in "Tsjechië"'],
  ['Ш', 'ш', 'sja', 'als de sj in "sjaal"'],
  ['Щ', 'щ', 'sjtsja', 'zachte, lange sj'],
  ['Ъ', 'ъ', 'hard teken', 'geen klank: scheidt de lettergreep'],
  ['Ы', 'ы', 'y', 'doffe i, achter in de mond'],
  ['Ь', 'ь', 'zacht teken', 'geen klank: maakt de vorige letter zacht'],
  ['Э', 'э', 'e', 'als de e in "bed"'],
  ['Ю', 'ю', 'joe', 'als "joe"'],
  ['Я', 'я', 'ja', 'als "ja"']
];

const HW_W = 300;
const HW_H = 260;
const HW_ROUND = 8;
const HW_PASS = 60;

function hwMaskCanvas() {
  const c = document.createElement('canvas');
  c.width = HW_W;
  c.height = HW_H;
  return c;
}

function hwDrawGlyph(ctx, char, { dilate = 0 } = {}) {
  ctx.clearRect(0, 0, HW_W, HW_H);
  ctx.font = '190px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText(char, HW_W / 2, HW_H / 2);
  if (dilate) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = dilate * 2;
    ctx.lineJoin = 'round';
    ctx.strokeText(char, HW_W / 2, HW_H / 2);
  }
}

function hwDrawStrokes(ctx, strokes, width) {
  ctx.clearRect(0, 0, HW_W, HW_H);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y);
    else for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  }
}

// How well the traced ink matches the letter, in two halves that catch two
// different mistakes: accuracy punishes ink outside the letter (scribbling),
// coverage punishes parts of the letter left undrawn (a single swipe).
function hwScore(char, strokes) {
  if (!strokes.some((s) => s.length > 1)) return 0;
  const mask = (draw) => {
    const c = hwMaskCanvas();
    const ctx = c.getContext('2d', { willReadFrequently: true });
    draw(ctx);
    return ctx.getImageData(0, 0, HW_W, HW_H).data;
  };
  const glyph = mask((ctx) => hwDrawGlyph(ctx, char));
  const glyphWide = mask((ctx) => hwDrawGlyph(ctx, char, { dilate: 18 }));
  const inkThin = mask((ctx) => hwDrawStrokes(ctx, strokes, 9));
  const inkWide = mask((ctx) => hwDrawStrokes(ctx, strokes, 38));

  let inkTotal = 0, inkInside = 0, glyphTotal = 0, glyphCovered = 0;
  for (let i = 3; i < glyph.length; i += 4) {
    const g = glyph[i] > 40, gw = glyphWide[i] > 40, it = inkThin[i] > 40, iw = inkWide[i] > 40;
    if (it) { inkTotal++; if (gw) inkInside++; }
    if (g) { glyphTotal++; if (iw) glyphCovered++; }
  }
  if (!inkTotal || !glyphTotal) return 0;
  const accuracy = inkInside / inkTotal;
  const coverage = glyphCovered / glyphTotal;
  return Math.round(100 * (0.5 * accuracy + 0.5 * coverage));
}

async function renderHandwriting() {
  const round = shuffle([...CYRILLIC_LETTERS]).slice(0, HW_ROUND);
  let index = 0;
  const scores = [];

  app.innerHTML = '';
  const wrap = el(`
    <div class="handwriting">
      <h1>✍️ Schrijven met de hand</h1>
      <p class="muted">Trek de letter na met je vinger of muis. De app kijkt na of je binnen de vorm blijft én of je de hele letter hebt gehad. Dit zijn de drukletters; die staan op straat, op formulieren en op het toetsenbord.</p>
      <div class="card hw-card">
        <div class="exercise-progress"><span id="hw-progress"></span><span class="muted" id="hw-score"></span></div>
        <div class="hw-letter-head">
          <div>
            <h2 id="hw-letter"></h2>
            <p class="muted" id="hw-hint"></p>
          </div>
          <span id="hw-speak"></span>
        </div>
        <canvas id="hw-canvas" width="${HW_W}" height="${HW_H}" aria-label="Schrijfvlak"></canvas>
        <div class="hw-buttons">
          <button type="button" class="secondary" id="hw-clear">Wissen</button>
          <button type="button" class="primary" id="hw-check">Nakijken</button>
          <button type="button" class="secondary" id="hw-skip">Overslaan</button>
        </div>
        <div id="hw-feedback"></div>
      </div>
    </div>
  `);
  app.appendChild(wrap);

  const canvas = wrap.querySelector('#hw-canvas');
  const ctx = canvas.getContext('2d');
  const letterEl = wrap.querySelector('#hw-letter');
  const hintEl = wrap.querySelector('#hw-hint');
  const progressEl = wrap.querySelector('#hw-progress');
  const scoreEl = wrap.querySelector('#hw-score');
  const feedback = wrap.querySelector('#hw-feedback');
  const speakSlot = wrap.querySelector('#hw-speak');

  let strokes = [];
  let currentStroke = null;
  // alternate capital and small letters so both shapes get practised
  const formFor = (i) => (i % 2 === 0 ? 0 : 1);

  function currentChar() {
    const entry = round[index];
    return entry[formFor(index)];
  }

  function repaint() {
    ctx.clearRect(0, 0, HW_W, HW_H);
    // guide lines: baseline and x-height, like ruled paper
    ctx.strokeStyle = 'rgba(125, 135, 160, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    [70, 130, 190].forEach((y) => { ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(HW_W - 12, y); ctx.stroke(); });
    ctx.setLineDash([]);
    // the letter to trace, faint
    ctx.globalAlpha = 0.16;
    hwDrawGlyphOn(ctx, currentChar());
    ctx.globalAlpha = 1;
    // the learner's ink
    ctx.strokeStyle = '#1f6feb';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of strokes) {
      if (!stroke.length) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y);
      else for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      ctx.stroke();
    }
  }

  // same glyph geometry as the scoring masks, drawn onto the visible canvas
  function hwDrawGlyphOn(target, char) {
    target.font = '190px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    target.textAlign = 'center';
    target.textBaseline = 'middle';
    target.fillStyle = '#101828';
    target.fillText(char, HW_W / 2, HW_H / 2);
  }

  function pointFrom(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * HW_W, y: ((e.clientY - rect.top) / rect.height) * HW_H };
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    currentStroke = [pointFrom(e)];
    strokes.push(currentStroke);
    repaint();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!currentStroke) return;
    e.preventDefault();
    currentStroke.push(pointFrom(e));
    repaint();
  });
  const endStroke = () => { currentStroke = null; };
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('pointerleave', endStroke);

  function paintItem() {
    if (index >= round.length) return finishRound();
    const [upper, lower, name, sound] = round[index];
    strokes = [];
    currentStroke = null;
    feedback.innerHTML = '';
    letterEl.textContent = `${upper} ${lower}`;
    letterEl.classList.toggle('hw-target-lower', formFor(index) === 1);
    hintEl.textContent = `Schrijf de ${formFor(index) === 0 ? 'hoofdletter' : 'kleine letter'} «${currentChar()}» — heet «${name}», klinkt ${sound}.`;
    progressEl.textContent = `Letter ${index + 1} van ${round.length}`;
    scoreEl.textContent = scores.length ? `gemiddeld ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : '';
    speakSlot.innerHTML = '';
    const sp = renderSpeakButton(currentChar(), '🔊');
    if (sp) speakSlot.appendChild(sp);
    repaint();
  }

  wrap.querySelector('#hw-clear').addEventListener('click', () => { strokes = []; feedback.innerHTML = ''; repaint(); });
  wrap.querySelector('#hw-skip').addEventListener('click', () => { scores.push(0); index++; paintItem(); });
  wrap.querySelector('#hw-check').addEventListener('click', () => {
    if (!strokes.some((s) => s.length > 1)) {
      feedback.innerHTML = '<p class="muted">Trek eerst de letter na op het vlak hierboven.</p>';
      return;
    }
    const score = hwScore(currentChar(), strokes);
    scores.push(score);
    const good = score >= HW_PASS;
    const fb = el(`
      <div class="feedback ${good ? 'correct' : 'incorrect'}">
        <strong>${score}% — ${good ? 'goed getroffen!' : 'nog niet helemaal'}</strong>
        <div class="explanation">${good
          ? 'Je bleef netjes binnen de vorm en hebt de hele letter gehad.'
          : 'Blijf dichter op de grijze vorm en zorg dat je elk onderdeel van de letter aandoet — ook de kleine streepjes.'}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
          <button type="button" class="secondary" id="hw-retry">Opnieuw proberen</button>
          <button type="button" class="primary" id="hw-next">${index + 1 < round.length ? 'Volgende letter' : 'Ronde afsluiten'}</button>
        </div>
      </div>
    `);
    fb.querySelector('#hw-retry').addEventListener('click', () => { scores.pop(); strokes = []; feedback.innerHTML = ''; repaint(); });
    fb.querySelector('#hw-next').addEventListener('click', () => { index++; paintItem(); });
    feedback.innerHTML = '';
    feedback.appendChild(fb);
  });

  function finishRound() {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const xp = 20 + (avg >= 80 ? 10 : 0);
    recordActivity('handwriting_round', { score: avg, letters: round.length });
    wrap.querySelector('.hw-card').innerHTML = `
      <h2>Ronde klaar! <span class="xp-gain">+${xp} XP</span></h2>
      <p>Gemiddeld ${avg}% nauwkeurig over ${round.length} letters.${avg >= 80 ? ' Bonus voor nauwkeurigheid.' : ''} Elke ronde telt als oefendag voor je reeks.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <button class="primary" id="hw-again">Nog een ronde</button>
        <a class="secondary-link" href="#/dashboard">Terug naar lessen</a>
      </div>`;
    wrap.querySelector('#hw-again').addEventListener('click', () => renderHandwriting());
  }

  paintItem();
}

