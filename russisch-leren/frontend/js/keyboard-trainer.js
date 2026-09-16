// ---------- keyboard trainer: the ЙЦУКЕН layout ----------

const RU_ROWS = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', '.']
];
const QWERTY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
];

async function renderKeyboardTrainer() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  // drill material: A1/A2 words first, then example sentences of practised words
  const levelOf = Object.fromEntries(content.categories.map((c) => [c.slug, c.level]));
  const words = [...new Set(content.exercises.filter((e) => e.wordId != null && ['A1', 'A2'].includes(levelOf[e.category]) && content.words[e.wordId]).map((e) => content.words[e.wordId].ru.replace(/́/g, '')))].filter((w) => /^[а-яё]+$/i.test(w));
  const sentences = Object.values(content.words).filter((w) => w.example && w.example.ru).map((w) => w.example.ru);
  const drill = [...shuffle(words).slice(0, 6), ...shuffle(sentences).slice(0, 4)];

  app.innerHTML = '';
  const wrap = el(`
    <div class="keyboard-trainer">
      <h1>⌨️ Toetsenbord ЙЦУКЕН</h1>
      <p class="muted">Typ de tekst na. De volgende toets licht op in de indeling hieronder; eronder staat de QWERTY-toets op dezelfde plek. Op een iPhone/iPad gebruik je het Russische toetsenbord van iOS (Instellingen → Algemeen → Toetsenbord); op een computer zet je de Russische indeling aan en typ je blind.</p>
      <div class="card">
        <div class="exercise-progress"><span id="kb-progress"></span><span class="muted" id="kb-stats"></span></div>
        <p class="kb-target" id="kb-target"></p>
        <input type="text" id="kb-input" class="typing-answer" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ru" placeholder="Typ hier…" />
        <p class="muted kb-hint" id="kb-hint"></p>
      </div>
      <div class="kb-layout" id="kb-layout"></div>
    </div>
  `);
  app.appendChild(wrap);
  const layout = wrap.querySelector('#kb-layout');
  const keyEls = new Map();
  RU_ROWS.forEach((row, ri) => {
    const rowEl = el(`<div class="kb-row"></div>`);
    row.forEach((ch, ci) => {
      const k = el(`<div class="kb-key"><span class="ru">${ch}</span><span class="qw">${QWERTY_ROWS[ri][ci] || ''}</span></div>`);
      keyEls.set(ch, k);
      rowEl.appendChild(k);
    });
    layout.appendChild(rowEl);
  });
  const space = el(`<div class="kb-row"><div class="kb-key space"><span class="ru">spatie</span></div></div>`);
  keyEls.set(' ', space.querySelector('.kb-key'));
  layout.appendChild(space);

  const targetEl = wrap.querySelector('#kb-target');
  const input = wrap.querySelector('#kb-input');
  const hint = wrap.querySelector('#kb-hint');
  const progress = wrap.querySelector('#kb-progress');
  const statsEl = wrap.querySelector('#kb-stats');
  let idx = 0, typedChars = 0, errors = 0, started = null;

  function highlight() {
    keyEls.forEach((k) => k.classList.remove('next', 'shift'));
    const target = drill[idx];
    const pos = input.value.length;
    const ch = target[pos];
    if (ch == null) return;
    const key = keyEls.get(ch.toLowerCase()) || keyEls.get(ch === 'ё' ? 'е' : ch);
    if (key) {
      key.classList.add('next');
      if (ch !== ch.toLowerCase()) key.classList.add('shift');
    }
    hint.textContent = ch === ' ' ? 'Volgende: spatie' : `Volgende letter: ${ch}${ch !== ch.toLowerCase() ? ' (met Shift)' : ''}`;
  }
  function paintTarget() {
    const target = drill[idx];
    const typed = input.value;
    targetEl.innerHTML = '';
    [...target].forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch;
      if (i < typed.length) span.className = typed[i] === ch ? 'ok' : 'bad';
      else if (i === typed.length) span.className = 'cur';
      targetEl.appendChild(span);
    });
    progress.textContent = `Oefening ${idx + 1} van ${drill.length}`;
    const minutes = started ? (Date.now() - started) / 60000 : 0;
    const cpm = minutes > 0 ? Math.round(typedChars / minutes) : 0;
    const acc = typedChars ? Math.max(0, Math.round(((typedChars - errors) / typedChars) * 100)) : 100;
    statsEl.textContent = `${cpm} tekens/min · ${acc}% nauwkeurig`;
    highlight();
  }
  input.addEventListener('input', () => {
    if (!started) started = Date.now();
    const target = drill[idx];
    const typed = input.value;
    typedChars++;
    const last = typed.length - 1;
    if (last >= 0 && typed[last] !== target[last]) errors++;
    if (typed === target) {
      idx++;
      input.value = '';
      if (idx >= drill.length) {
        const minutes = (Date.now() - started) / 60000;
        const cpm = Math.round(typedChars / minutes);
        const accuracy = Math.max(0, Math.round(((typedChars - errors) / typedChars) * 100));
        const xp = 20 + (accuracy >= 95 ? 10 : 0) + (cpm >= 120 ? 10 : 0);
        recordActivity('keyboard_round', { cpm, accuracy, chars: typedChars, items: drill.length });
        wrap.querySelector('.card').innerHTML = `<h2>Ronde klaar! <span class="xp-gain">+${xp} XP</span></h2><p>${cpm} tekens per minuut, ${accuracy}% nauwkeurig.${accuracy >= 95 ? ' Bonus voor nauwkeurigheid.' : ''}${cpm >= 120 ? ' Bonus voor snelheid.' : ''} Elke ronde telt als oefendag voor je reeks.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="primary" id="kb-again">Nog een ronde</button><a class="secondary-link" href="#/dashboard">Terug naar lessen</a></div>`;
        wrap.querySelector('#kb-again').addEventListener('click', () => renderKeyboardTrainer());
        keyEls.forEach((k) => k.classList.remove('next', 'shift'));
        return;
      }
    }
    paintTarget();
  });
  paintTarget();
  setTimeout(() => input.focus(), 0);
}

