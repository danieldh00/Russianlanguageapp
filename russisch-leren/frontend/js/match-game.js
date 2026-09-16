// ---------- match pairs game ----------

async function renderMatchGame() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const username = state.user.username;
  const wordProgress = Storage.loadWordProgress(username);
  // candidate words: practised ones first (due first), then words from unlocked lessons
  const path = computePath(content, username);
  const unlockedCats = new Set([...path.bySlug.values()].filter((n) => n.unlocked).map((n) => n.cat.slug));
  const byWord = new Map();
  for (const ex of content.exercises) {
    if (ex.wordId == null || ex.type !== 'mc_ru_nl' || !unlockedCats.has(ex.category)) continue;
    if (!byWord.has(ex.wordId)) byWord.set(ex.wordId, ex);
  }
  const due = new Set(dueWordIds(content, username));
  const practised = Object.keys(wordProgress).map(Number).filter((id) => byWord.has(id));
  const ordered = [...shuffle(practised.filter((id) => due.has(id))), ...shuffle(practised.filter((id) => !due.has(id))), ...shuffle([...byWord.keys()].filter((id) => !wordProgress[id]))];
  const chosen = [];
  const seenNl = new Set();
  for (const id of ordered) {
    const w = content.words[id];
    if (!w || seenNl.has(w.nl)) continue;
    seenNl.add(w.nl);
    chosen.push({ id, ru: w.ru, nl: w.nl, ex: byWord.get(id) });
    if (chosen.length === 5) break;
  }
  app.innerHTML = '';
  if (chosen.length < 5) {
    app.appendChild(el(`<div class="card"><h1>🃏 Koppelspel</h1><p class="muted">Nog te weinig woorden beschikbaar. Doe eerst een paar lessen.</p><a href="#/dashboard">Terug naar lessen</a></div>`));
    return;
  }
  const wrap = el(`
    <div class="match">
      <h1>🃏 Koppelspel</h1>
      <p class="muted">Tik een Russisch woord en daarna de Nederlandse vertaling. Goede paren verdwijnen; fouten kosten tijd. Elk goed paar telt als een goed antwoord (+10 XP) voor je herhaling.</p>
      <div class="card">
        <div class="exercise-progress"><span id="match-left">5 paren te gaan</span><span class="muted" id="match-timer">0,0 s</span></div>
        <div class="match-grid">
          <div class="match-col" id="col-ru"></div>
          <div class="match-col" id="col-nl"></div>
        </div>
        <div id="match-done"></div>
      </div>
    </div>
  `);
  app.appendChild(wrap);
  const colRu = wrap.querySelector('#col-ru'), colNl = wrap.querySelector('#col-nl');
  const start = Date.now();
  let selectedRu = null, left = chosen.length, mistakes = 0;
  const timer = setInterval(() => { wrap.querySelector('#match-timer').textContent = ((Date.now() - start) / 1000).toFixed(1).replace('.', ',') + ' s'; }, 100);
  const tiles = { ru: shuffle(chosen), nl: shuffle(chosen) };
  for (const w of tiles.ru) {
    const t = el(`<button type="button" class="match-tile ru" lang="ru"></button>`);
    t.textContent = w.ru;
    t.addEventListener('click', () => {
      if (t.classList.contains('done')) return;
      colRu.querySelectorAll('.match-tile').forEach((x) => x.classList.remove('selected'));
      t.classList.add('selected');
      selectedRu = w;
      speakRussian(w.ru);
    });
    colRu.appendChild(t);
  }
  for (const w of tiles.nl) {
    const t = el(`<button type="button" class="match-tile nl"></button>`);
    t.textContent = w.nl;
    t.addEventListener('click', () => {
      if (!selectedRu || t.classList.contains('done')) return;
      const ruTile = [...colRu.querySelectorAll('.match-tile')].find((x) => x.textContent === selectedRu.ru);
      if (w.id === selectedRu.id) {
        t.classList.add('done'); ruTile.classList.add('done'); ruTile.classList.remove('selected');
        gradeAndRecord(selectedRu.ex)(selectedRu.ex.correctAnswer);
        selectedRu = null;
        left--;
        wrap.querySelector('#match-left').textContent = left ? `${left} ${left === 1 ? 'paar' : 'paren'} te gaan` : 'Klaar!';
        if (!left) finish();
      } else {
        mistakes++;
        t.classList.add('wrong'); ruTile.classList.add('wrong');
        gradeAndRecord(selectedRu.ex)(w.nl);
        setTimeout(() => { t.classList.remove('wrong'); ruTile.classList.remove('wrong'); }, 500);
      }
    });
    colNl.appendChild(t);
  }
  function finish() {
    clearInterval(timer);
    const secs = ((Date.now() - start) / 1000).toFixed(1).replace('.', ',');
    const best = Storage.loadSettings().matchBest;
    const isBest = !best || parseFloat(secs.replace(',', '.')) < best;
    if (isBest && !mistakes) { const s = Storage.loadSettings(); s.matchBest = parseFloat(secs.replace(',', '.')); Storage.saveSettings(s); }
    const done = el(`
      <div class="feedback correct" style="margin-top:14px">
        <strong>Alle paren gevonden in ${secs} s${mistakes ? ` met ${mistakes} ${mistakes === 1 ? 'fout' : 'fouten'}` : ' zonder fouten'}.</strong>
        ${isBest && !mistakes ? '<div class="explanation">🏆 Nieuw persoonlijk record!</div>' : best ? `<div class="explanation">Record: ${String(best).replace('.', ',')} s.</div>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button type="button" class="primary" id="match-again">Nog een ronde</button><a class="secondary-link" href="#/dashboard">Terug naar lessen</a></div>
      </div>
    `);
    done.querySelector('#match-again').addEventListener('click', () => renderMatchGame());
    wrap.querySelector('#match-done').appendChild(done);
  }
}

