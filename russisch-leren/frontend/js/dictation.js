// ---------- numbers & time dictation ----------

// Russian cardinal numbers 0..999 999 with gender for 1 and 2.
const RU_ONES = { m: ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'], f: ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'] };
const RU_TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const RU_TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const RU_HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
function ruUnder1000(n, gender = 'm') {
  const parts = [];
  const h = Math.floor(n / 100), rest = n % 100;
  if (h) parts.push(RU_HUNDREDS[h]);
  if (rest >= 10 && rest < 20) parts.push(RU_TEENS[rest - 10]);
  else {
    const t = Math.floor(rest / 10), o = rest % 10;
    if (t) parts.push(RU_TENS[t]);
    if (o) parts.push(RU_ONES[gender][o]);
  }
  return parts.join(' ');
}
// plural form after a number: one / few (2-4) / many
function ruPlural(n, [one, few, many]) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
function ruNumber(n, gender = 'm') {
  if (n === 0) return 'ноль';
  const parts = [];
  const th = Math.floor(n / 1000), rest = n % 1000;
  if (th) parts.push(`${ruUnder1000(th, 'f')} ${ruPlural(th, ['тысяча', 'тысячи', 'тысяч'])}`);
  if (rest) parts.push(ruUnder1000(rest, gender));
  return parts.join(' ');
}
const RU_MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const RU_ORD_N = ['', 'первое', 'второе', 'третье', 'четвёртое', 'пятое', 'шестое', 'седьмое', 'восьмое', 'девятое', 'десятое', 'одиннадцатое', 'двенадцатое', 'тринадцатое', 'четырнадцатое', 'пятнадцатое', 'шестнадцатое', 'семнадцатое', 'восемнадцатое', 'девятнадцатое', 'двадцатое'];
function ruOrdinalDay(d) {
  if (d <= 20) return RU_ORD_N[d];
  if (d === 30) return 'тридцатое';
  const t = d < 30 ? 'двадцать' : 'тридцать';
  return `${t} ${RU_ORD_N[d % 10]}`;
}
function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pad2(n) { return String(n).padStart(2, '0'); }

const DICTATION_MODES = {
  prijs: {
    label: '💶 Prijzen', hint: 'Typ het bedrag in roebels (alleen cijfers).',
    make() {
      const pick = Math.random();
      const n = pick < 0.4 ? rnd(1, 99) * 10 : pick < 0.8 ? rnd(100, 9999) : rnd(10000, 99999);
      const rub = ruPlural(n, ['рубль', 'рубля', 'рублей']);
      return { text: `${ruNumber(n)} ${rub}`, answer: String(n), show: `${n} ₽` };
    }
  },
  getal: {
    label: '🔢 Getallen', hint: 'Typ het getal.',
    make() { const n = Math.random() < 0.5 ? rnd(0, 100) : rnd(100, 9999); return { text: ruNumber(n), answer: String(n), show: String(n) }; }
  },
  tijd: {
    label: '🕒 Tijden', hint: 'Typ de tijd als UU:MM (bv. 14:05).',
    make() {
      const h = rnd(0, 23), m = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][rnd(0, 11)];
      const hours = `${ruNumber(h)} ${ruPlural(h, ['час', 'часа', 'часов'])}`;
      const minutes = m ? ` ${ruNumber(m, 'f')} ${ruPlural(m, ['минута', 'минуты', 'минут'])}` : '';
      return { text: `${hours}${minutes}`, answer: `${pad2(h)}:${pad2(m)}`, show: `${pad2(h)}:${pad2(m)}`, alt: [`${h}:${pad2(m)}`] };
    }
  },
  datum: {
    label: '📅 Datums', hint: 'Typ de datum als DD-MM (bv. 09-05).',
    make() {
      const mo = rnd(1, 12), d = rnd(1, mo === 2 ? 28 : 30);
      return { text: `${ruOrdinalDay(d)} ${RU_MONTHS_GEN[mo - 1]}`, answer: `${pad2(d)}-${pad2(mo)}`, show: `${pad2(d)}-${pad2(mo)}`, alt: [`${d}-${mo}`, `${d}-${pad2(mo)}`, `${pad2(d)}-${mo}`] };
    }
  },
  telefoon: {
    label: '📱 Telefoonnummers', hint: 'Typ de cijfers (zonder +7), bv. 9161234567.',
    make() {
      const g = [rnd(900, 999), rnd(100, 999), rnd(10, 99), rnd(10, 99)];
      const text = `плюс семь, ${ruNumber(g[0])}, ${ruNumber(g[1])}, ${ruNumber(g[2])}, ${ruNumber(g[3])}`;
      const digits = `${g[0]}${g[1]}${pad2(g[2])}${pad2(g[3])}`;
      return { text, answer: digits, show: `+7 ${g[0]} ${g[1]}-${pad2(g[2])}-${pad2(g[3])}` };
    }
  }
};

async function renderDictation() {
  app.innerHTML = '';
  const wrap = el(`
    <div class="dictation">
      <h1>🔢 Getallen & tijd</h1>
      <p class="muted">Je hoort een prijs, tijd, datum, getal of telefoonnummer in het Russisch; typ wat je hoort. Luister zo vaak je wilt, ook langzaam.</p>
      <div class="pb-tabs" id="dict-modes"></div>
      <div class="card">
        <div class="exercise-progress"><span id="dict-progress"></span><span class="muted" id="dict-score"></span></div>
        <div class="listen-box"><div class="reading-label">Luister</div><span class="dict-speak"></span><p class="muted" id="dict-hint"></p></div>
        <form class="typing-form" id="dict-form">
          <div class="typing-row"><input type="text" id="dict-input" class="typing-answer" inputmode="numeric" autocomplete="off" placeholder="…" /></div>
          <button type="submit" class="primary" style="margin-top:10px;width:fit-content">Controleren</button>
        </form>
        <div id="dict-feedback"></div>
      </div>
    </div>
  `);
  app.appendChild(wrap);
  const modesEl = wrap.querySelector('#dict-modes');
  let mode = Storage.loadSettings().dictationMode || 'prijs';
  let round = 0, score = 0, item = null;

  function paintModes() {
    modesEl.innerHTML = '';
    for (const [id, m] of Object.entries(DICTATION_MODES)) {
      const t = el(`<button type="button" class="level-pill ${id === mode ? 'passed' : ''}">${m.label}</button>`);
      t.addEventListener('click', () => { mode = id; const s = Storage.loadSettings(); s.dictationMode = id; Storage.saveSettings(s); round = 0; score = 0; next(); });
      modesEl.appendChild(t);
    }
  }
  function next() {
    paintModes();
    item = DICTATION_MODES[mode].make();
    round++;
    wrap.querySelector('#dict-progress').textContent = `${DICTATION_MODES[mode].label} · opgave ${round}`;
    wrap.querySelector('#dict-score').textContent = `${score} goed`;
    wrap.querySelector('#dict-hint').textContent = DICTATION_MODES[mode].hint;
    const slot = wrap.querySelector('.listen-box .speak-group, .listen-box .dict-speak');
    const sp = renderSpeakButton(item.text, '🔊 Speel af');
    if (sp) { sp.classList.add('listen-play'); slot.replaceWith(sp); }
    wrap.querySelector('#dict-feedback').innerHTML = '';
    const input = wrap.querySelector('#dict-input');
    input.value = '';
    input.disabled = false;
    wrap.querySelector('#dict-form button').disabled = false;
    input.focus();
    speakRussian(item.text);
  }
  wrap.querySelector('#dict-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = wrap.querySelector('#dict-input');
    const given = input.value.trim().replace(/\s+/g, '').replace(/[.,]/g, mode === 'tijd' ? ':' : mode === 'datum' ? '-' : '');
    const okAnswer = given === item.answer || (item.alt || []).includes(given);
    if (okAnswer) { score++; recordActivity('dictation_correct', { mode }); }
    input.disabled = true;
    wrap.querySelector('#dict-form button').disabled = true;
    const fb = el(`
      <div class="feedback ${okAnswer ? 'correct' : 'incorrect'}">
        <strong>${okAnswer ? 'Goed gehoord! <span class="xp-gain">+5 XP</span>' : 'Niet helemaal.'}</strong>
        <div class="explanation">Je hoorde: <span lang="ru" class="serif">${escapeHtml(item.text)}</span> = <strong>${escapeHtml(item.show)}</strong>${okAnswer ? '' : ` — jij typte ${escapeHtml(input.value || '(niets)')}`}.</div>
        <button type="button" class="primary" style="margin-top:12px" id="dict-next">Volgende</button>
      </div>
    `);
    wrap.querySelector('#dict-feedback').appendChild(fb);
    fb.querySelector('#dict-next').addEventListener('click', next);
    fb.querySelector('#dict-next').focus();
  });
  next();
}

