// ---------- speech recognition: say it back, or dictate an answer ----------

function speechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Listens once for Russian speech and resolves with the transcript.
function listenOnce() {
  return new Promise((resolve, reject) => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return reject(new Error('Spraakherkenning wordt niet ondersteund in deze browser.'));
    const rec = new Ctor();
    rec.lang = 'ru-RU';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    let settled = false;
    rec.onresult = (e) => {
      settled = true;
      const alts = [...e.results[0]].map((r) => r.transcript);
      resolve(alts);
    };
    rec.onerror = (e) => {
      if (settled) return;
      settled = true;
      const msg = e.error === 'not-allowed' ? 'Geen toegang tot de microfoon. Sta die toe in de browserinstellingen.'
        : e.error === 'no-speech' ? 'Niets gehoord. Probeer het nog eens.'
        : `Spraakherkenning mislukt (${e.error}).`;
      reject(new Error(msg));
    };
    rec.onend = () => { if (!settled) { settled = true; reject(new Error('Niets gehoord. Probeer het nog eens.')); } };
    try { rec.start(); } catch (err) { reject(err); }
  });
}

function renderMicButton(onText) {
  if (!speechRecognitionSupported() || !micAvailable()) return null;
  const btn = el(`<button type="button" class="mic-btn" title="Spreek je antwoord in (Russisch)" aria-label="Spreek je antwoord in">🎤</button>`);
  btn.addEventListener('click', async () => {
    btn.classList.add('listening');
    btn.textContent = '…';
    try {
      const alts = await listenOnce();
      onText(alts[0] || '');
    } catch (err) {
      btn.title = err.message;
    } finally {
      btn.classList.remove('listening');
      btn.textContent = '🎤';
    }
  });
  return btn;
}

// The Russian a learner should be able to say after this exercise.
// Only ever used after an answer has been given, so here the correct answer
// is fair game -- it is already on screen, and repeating it is the point.
function pronunciationTarget(ex) {
  if (ex.type === 'listen' || ex.type === 'reading') return ex.context || null;
  if (ex.example && ex.example.ru && (ex.type === 'cloze')) return ex.example.ru;
  if (CYRILLIC_RUN.test(ex.correctAnswer || '')) return ex.correctAnswer;
  return extractSpeakText(ex);
}

// Buttons under the feedback: say it back (compared with what the
// recogniser heard) and the inflection table of the word.
function renderAfterAnswerTools(ex) {
  const wrap = el(`<div class="after-tools"></div>`);
  const target = pronunciationTarget(ex);
  if (target && speechRecognitionSupported() && micAvailable()) {
    const btn = el(`<button type="button" class="tool-btn">🎤 Zeg het na</button>`);
    const out = el(`<div class="shadow-result"></div>`);
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      out.textContent = 'Luisteren… zeg: ' + target.replace(/́/g, '');
      try {
        const alts = await listenOnce();
        const want = normalizeAnswer(target);
        const hit = alts.find((a) => normalizeAnswer(a) === want);
        const close = alts.some((a) => similarity(normalizeAnswer(a), want) >= 0.8);
        out.innerHTML = '';
        out.appendChild(el(`<div><span class="muted">Verstaan:</span> <strong>${escapeHtml(alts[0] || '')}</strong></div>`));
        out.appendChild(el(`<div class="${hit ? 'ok' : close ? 'meh' : 'bad'}">${hit ? '✓ Precies goed uitgesproken.' : close ? '≈ Bijna — de herkenner hoorde iets dat erg lijkt. Nog een keer, iets duidelijker.' : '✗ Dat werd anders verstaan. Luister nog eens en probeer opnieuw.'}</div>`));
      } catch (err) {
        out.textContent = err.message;
      } finally {
        btn.disabled = false;
      }
    });
    wrap.appendChild(btn);
    wrap.appendChild(out);
  }
  if (ex.wordId != null && navigator.onLine) {
    const btn = el(`<button type="button" class="tool-btn">📖 Vormen</button>`);
    const slot = el(`<div class="forms-slot"></div>`);
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '📖 Laden…';
      try {
        const data = await api(`/words/${ex.wordId}/forms`);
        slot.innerHTML = '';
        slot.appendChild(renderFormsTable(data));
        btn.remove();
      } catch (err) {
        btn.textContent = '📖 Vormen';
        btn.disabled = false;
        slot.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
      }
    });
    wrap.appendChild(btn);
    wrap.appendChild(slot);
  }
  return wrap;
}

// Levenshtein-based similarity in [0,1], for "almost right" pronunciation feedback.
function similarity(a, b) {
  if (!a.length && !b.length) return 1;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

// ---------- inflection tables (Open Russian data via /api/words/:id/forms) ----------

const CASE_LABELS = { nom: 'nominatief', gen: 'genitief', dat: 'datief', acc: 'accusatief', inst: 'instrumentalis', prep: 'prepositief' };
const PERSON_LABELS = { sg1: 'я', sg2: 'ты', sg3: 'он / она', pl1: 'мы', pl2: 'вы', pl3: 'они' };

function renderFormsTable(d) {
  const f = d.forms || {};
  const box = el(`<div class="forms-box"><div class="reading-label">Vormen van ${escapeHtml(d.accented || d.russian)}</div></div>`);
  const meta = [];
  if (d.pos === 'noun') meta.push(`zelfstandig naamwoord${d.gender ? `, ${{ m: 'mannelijk', f: 'vrouwelijk', n: 'onzijdig' }[d.gender] || d.gender}` : ''}${d.animate ? ', bezield' : ''}`);
  if (d.pos === 'verb') meta.push(`werkwoord, ${d.aspect === 'perfective' ? 'voltooid' : 'onvoltooid'} aspect${d.partner ? ` · aspectpartner: ${d.partner}` : ''}`);
  if (d.pos === 'adjective') meta.push(`bijvoeglijk naamwoord${d.comparative ? ` · vergrotende trap: ${d.comparative.split(';')[0]}` : ''}${d.superlative ? ` · overtreffende trap: ${d.superlative.split(';')[0]}` : ''}`);
  if (meta.length) box.appendChild(el(`<p class="muted forms-meta">${escapeHtml(meta.join(' · '))}</p>`));

  const table = (headers, rows) => {
    const t = el(`<div class="table-scroll"><table class="forms-table"><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody></tbody></table></div>`);
    const tb = t.querySelector('tbody');
    for (const r of rows) tb.appendChild(el(`<tr>${r.map((c, i) => `<td${i ? ' lang="ru"' : ''}>${escapeHtml(c || '—')}</td>`).join('')}</tr>`));
    return t;
  };

  if (d.pos === 'noun') {
    box.appendChild(table(['naamval', 'enkelvoud', 'meervoud'], Object.keys(CASE_LABELS).map((c) => [CASE_LABELS[c], f[`sg_${c}`], f[`pl_${c}`]])));
  } else if (d.pos === 'verb') {
    const tense = d.aspect === 'perfective' ? 'toekomende tijd' : 'tegenwoordige tijd';
    box.appendChild(table(['persoon', tense], Object.keys(PERSON_LABELS).map((p) => [PERSON_LABELS[p], f[`presfut_${p}`]])));
    box.appendChild(table(['verleden tijd', 'vorm'], [['hij', f.past_m], ['zij', f.past_f], ['het', f.past_n], ['zij (mv.)', f.past_pl]]));
    if (f.imperative_sg || f.imperative_pl) box.appendChild(table(['gebiedende wijs', 'vorm'], [['jij', f.imperative_sg], ['u / jullie', f.imperative_pl]]));
  } else if (d.pos === 'adjective') {
    box.appendChild(table(['', 'mannelijk', 'vrouwelijk', 'onzijdig', 'meervoud'], [
      ['nominatief', f.m_nom, f.f_nom, f.n_nom, f.pl_nom],
      ['genitief', f.m_gen, f.f_gen, f.m_gen, f.pl_gen],
      ['datief', f.m_dat, f.f_gen, f.m_dat, f.pl_dat],
      ['instrumentalis', f.m_inst, f.f_gen, f.m_inst, f.pl_inst],
      ['prepositief', f.m_prep, f.f_gen, f.m_prep, f.pl_prep],
      ['korte vorm', f.short_m, f.short_f, f.short_n, f.short_pl]
    ]));
  } else {
    const rows = Object.entries(f).map(([k, v]) => [k, v]);
    if (rows.length) box.appendChild(table(['vorm', 'waarde'], rows));
    else box.appendChild(el(`<p class="muted">Dit woord verandert niet van vorm.</p>`));
  }
  box.appendChild(el(`<p class="muted forms-source">Bron: Open Russian dictionary (CC-BY-SA 4.0)</p>`));
  return box;
}

