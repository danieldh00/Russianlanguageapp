// ---------- graded readers ----------

function storiesOf(content) {
  return content.stories || [];
}

// Word -> translation, for tapping a word in a story: the story's own
// glossary first (those entries are the ones chosen for this text), then the
// full dictionary from the content bundle as a fallback.
function storyLookup(content, story) {
  const map = new Map();
  const norm = (s) => s.toLowerCase().replace(/[̀-ͯ]/g, '').replace(/ё/g, 'е').trim();
  for (const w of Object.values(content.words || {})) {
    const key = norm(w.ru);
    if (key && !map.has(key)) map.set(key, w.nl);
  }
  for (const [ru, nl] of story.glossary || []) map.set(norm(ru), nl);

  // Russian inflects heavily, so an exact hit on the headword is the
  // exception. Index the dictionary by its first four letters and, when the
  // exact form is unknown, offer the headword with the longest shared stem --
  // labelled as a guess, because a shared stem is not proof of a shared word.
  const byStem = new Map();
  for (const key of map.keys()) {
    if (key.length < 4 || key.includes(' ')) continue;
    const stem = key.slice(0, 4);
    if (!byStem.has(stem)) byStem.set(stem, []);
    byStem.get(stem).push(key);
  }
  const sharedPrefix = (a, b) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
  };

  return (word) => {
    const key = norm(word);
    const exact = map.get(key);
    if (exact) return { nl: exact, exact: true };
    if (key.length < 4) return null;
    let best = null;
    let bestLen = 0;
    for (const candidate of byStem.get(key.slice(0, 4)) || []) {
      const shared = sharedPrefix(key, candidate);
      if (shared >= 4 && Math.abs(candidate.length - key.length) <= 4 && shared > bestLen) {
        best = candidate;
        bestLen = shared;
      }
    }
    return best ? { nl: map.get(best), exact: false, headword: best } : null;
  };
}

async function renderStoryList() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const stories = storiesOf(content);
  const read = Storage.loadStories(state.user.username);

  app.innerHTML = '';
  const wrap = el(`
    <div class="stories">
      <h1>📖 Leesverhalen</h1>
      <p class="muted">Korte verhalen die meegroeien met je niveau. Tik op een zin voor de Nederlandse vertaling en op een los woord voor de betekenis. Na elk verhaal volgen begripsvragen die XP opleveren. Werkt offline.</p>
      <div class="pb-tabs" id="story-tabs"></div>
      <div id="story-list"></div>
    </div>
  `);
  app.appendChild(wrap);

  const tabs = wrap.querySelector('#story-tabs');
  const list = wrap.querySelector('#story-list');
  const levels = LEVEL_ORDER.filter((l) => stories.some((s) => s.level === l));
  let current = 'ALLE';

  function paint() {
    tabs.innerHTML = '';
    list.innerHTML = '';
    ['ALLE', ...levels].forEach((lvl) => {
      const t = el(`<button type="button" class="level-pill ${lvl === current ? 'passed' : ''}">${lvl === 'ALLE' ? 'Alle' : lvl}</button>`);
      t.addEventListener('click', () => { current = lvl; paint(); });
      tabs.appendChild(t);
    });
    const shown = current === 'ALLE' ? stories : stories.filter((s) => s.level === current);
    for (const s of shown) {
      const done = read[s.id];
      const card = el(`
        <button type="button" class="card story-card ${done ? 'read' : ''}">
          <div class="row1"><h2>${s.icon} ${escapeHtml(s.title)}</h2><span class="level-badge">${escapeHtml(s.level)}</span></div>
          <p class="story-card-nl">${escapeHtml(s.titleNl)}</p>
          <p class="muted">${escapeHtml(s.intro)}</p>
          <p class="muted story-meta">${s.paragraphs.length} alinea's &middot; ± ${s.minutes} min &middot; ${s.questions.length} vragen${done ? ` &middot; ✓ gelezen, ${done.score}/${done.total} goed` : ''}</p>
        </button>
      `);
      card.addEventListener('click', () => { location.hash = `#/story/${s.id}`; });
      list.appendChild(card);
    }
    if (!shown.length) list.appendChild(el(`<p class="muted">Voor dit niveau staat nog geen verhaal klaar.</p>`));
  }
  paint();
}

async function renderStory(storyId) {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const story = storiesOf(content).find((s) => s.id === storyId);
  if (!story) { location.hash = '#/stories'; return; }
  const lookup = storyLookup(content, story);

  app.innerHTML = '';
  const wrap = el(`
    <div class="story-reader">
      <a class="secondary-link" href="#/stories">← Alle verhalen</a>
      <h1>${story.icon} ${escapeHtml(story.title)}</h1>
      <p class="muted">${escapeHtml(story.titleNl)} &middot; niveau ${escapeHtml(story.level)} &middot; ± ${story.minutes} min lezen</p>
      <div class="story-controls">
        <button type="button" class="secondary" id="story-translate">Alle vertalingen tonen</button>
        <span id="story-listen"></span>
      </div>
      <div id="story-body"></div>
      <div class="card story-glossary">
        <h2>Woorden om te onthouden</h2>
        <div class="pb-list" id="story-gloss"></div>
      </div>
      <div id="story-quiz"></div>
    </div>
  `);
  app.appendChild(wrap);

  const listenSlot = wrap.querySelector('#story-listen');
  const wholeText = story.paragraphs.map(([ru]) => ru).join(' ');
  const listen = renderSpeakButton(wholeText, '🔊 Hele verhaal');
  if (listen) listenSlot.replaceWith(listen); else listenSlot.remove();

  const body = wrap.querySelector('#story-body');
  const paraEls = [];
  story.paragraphs.forEach(([ru, nl], i) => {
    const p = el(`
      <div class="card story-para">
        <p class="story-ru" id="story-ru-${i}"></p>
        <div class="story-para-tools">
          <button type="button" class="secondary story-toggle">Vertaling</button>
          <span class="story-speak"></span>
        </div>
        <p class="story-nl muted" hidden></p>
        <p class="story-hint" hidden></p>
      </div>
    `);
    const ruEl = p.querySelector('.story-ru');
    const hint = p.querySelector('.story-hint');
    // Tokenise so each word is tappable while punctuation and spacing stay put.
    for (const token of ru.split(/(\s+)/)) {
      if (/^\s+$/.test(token)) { ruEl.appendChild(document.createTextNode(token)); continue; }
      const bare = token.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
      if (!bare) { ruEl.appendChild(document.createTextNode(token)); continue; }
      const [before, after] = token.split(bare);
      if (before) ruEl.appendChild(document.createTextNode(before));
      const span = document.createElement('span');
      span.className = 'story-word';
      span.textContent = bare;
      span.addEventListener('click', () => {
        const hit = lookup(bare);
        hint.hidden = false;
        if (!hit) hint.textContent = `${bare} — staat niet in de woordenlijst`;
        else if (hit.exact) hint.textContent = `${bare} — ${hit.nl}`;
        else hint.textContent = `${bare} — vermoedelijk een vorm van «${hit.headword}»: ${hit.nl}`;
        hint.classList.toggle('unknown', !hit);
      });
      ruEl.appendChild(span);
      if (after) ruEl.appendChild(document.createTextNode(after));
    }
    p.querySelector('.story-nl').textContent = nl;
    const sp = renderSpeakButton(ru, '🔊');
    const slot = p.querySelector('.story-speak');
    if (sp) slot.replaceWith(sp); else slot.remove();
    p.querySelector('.story-toggle').addEventListener('click', () => {
      const nlEl = p.querySelector('.story-nl');
      nlEl.hidden = !nlEl.hidden;
    });
    body.appendChild(p);
    paraEls.push(p);
  });

  let allShown = false;
  wrap.querySelector('#story-translate').addEventListener('click', (e) => {
    allShown = !allShown;
    paraEls.forEach((p) => { p.querySelector('.story-nl').hidden = !allShown; });
    e.currentTarget.textContent = allShown ? 'Vertalingen verbergen' : 'Alle vertalingen tonen';
  });

  const gloss = wrap.querySelector('#story-gloss');
  for (const [ru, nl] of story.glossary || []) {
    const row = el(`<div class="pb-row"><div class="pb-text"><p class="pb-ru"></p><p class="pb-nl muted"></p></div><span class="pb-speak"></span></div>`);
    row.querySelector('.pb-ru').textContent = ru;
    row.querySelector('.pb-nl').textContent = nl;
    const sp = renderSpeakButton(ru, '🔊');
    if (sp) row.querySelector('.pb-speak').replaceWith(sp); else row.querySelector('.pb-speak').remove();
    gloss.appendChild(row);
  }

  renderStoryQuizIntro(story, wrap.querySelector('#story-quiz'));
}

function renderStoryQuizIntro(story, mount) {
  mount.innerHTML = '';
  const card = el(`
    <div class="card">
      <h2>Begripsvragen</h2>
      <p class="muted">${story.questions.length} vragen over de tekst. Je mag terugbladeren in het verhaal; het gaat erom dat je begrijpt wat er staat, niet dat je het uit je hoofd kent.</p>
      <button type="button" class="primary" id="story-start">Start de vragen</button>
    </div>
  `);
  card.querySelector('#story-start').addEventListener('click', () => runStoryQuiz(story, mount));
  mount.appendChild(card);
}

function runStoryQuiz(story, mount) {
  let index = 0;
  let score = 0;
  const given = [];

  function paint() {
    mount.innerHTML = '';
    if (index >= story.questions.length) return finish();
    const q = story.questions[index];
    const card = el(`
      <div class="card story-quiz">
        <div class="exercise-progress"><span>Vraag ${index + 1} van ${story.questions.length}</span><span class="muted">${score} goed</span></div>
        <div class="prompt-row"><h2 class="story-question"></h2></div>
        <div class="options" id="story-options"></div>
        <div id="story-feedback"></div>
      </div>
    `);
    card.querySelector('.story-question').textContent = q.q;
    const options = card.querySelector('#story-options');
    const feedback = card.querySelector('#story-feedback');
    shuffle([...q.options]).forEach((opt) => {
      const btn = el(`<button type="button" class="option-btn"></button>`);
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (options.classList.contains('answered')) return;
        options.classList.add('answered');
        const correct = opt === q.answer;
        if (correct) score++;
        given.push({ q: q.q, given: opt, answer: q.answer, correct, explanation: q.explanation });
        [...options.children].forEach((b) => {
          b.disabled = true;
          if (b.textContent === q.answer) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        const fb = el(`
          <div class="feedback ${correct ? 'correct' : 'incorrect'}">
            <strong>${correct ? 'Goed!' : `Het juiste antwoord is: ${escapeHtml(q.answer)}`}</strong>
            <div class="explanation">${escapeHtml(q.explanation)}</div>
            <button type="button" class="primary" id="story-next" style="margin-top:12px">${index + 1 < story.questions.length ? 'Volgende vraag' : 'Resultaat'}</button>
          </div>
        `);
        fb.querySelector('#story-next').addEventListener('click', () => { index++; paint(); });
        feedback.appendChild(fb);
      });
      options.appendChild(btn);
    });
    mount.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function finish() {
    const total = story.questions.length;
    // A story pays out once; the server enforces this, the badge only has to
    // tell the same story so the number never comes as a surprise.
    const reread = !!Storage.loadStories(state.user.username)[story.id];
    const xp = reread ? 0 : 10 + score * 5;
    recordActivity('story_finished', { story: story.id, level: story.level, score, total });
    Storage.markStoryRead(state.user.username, story.id, score, total);
    const card = el(`
      <div class="card">
        <h2>${score === total ? 'Alles goed!' : `${score} van de ${total} goed`} ${xp ? `<span class="xp-gain">+${xp} XP</span>` : ''}</h2>
        <p class="muted">${reread
          ? 'Je had dit verhaal al gelezen, dus het levert geen XP meer op — herlezen is wél het beste wat je met een tekst kunt doen.'
          : score === total
            ? 'Je hebt de tekst helemaal begrepen. Lees er meteen nog een, of pak er een van een niveau hoger.'
            : 'Loop de uitleg hieronder na en lees de bijbehorende alinea nog eens terug — daar zit de winst.'}</p>
        <div class="story-review" id="story-review"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
          <a class="secondary-link" href="#/stories">Ander verhaal</a>
          <a class="secondary-link" href="#/dashboard">Terug naar lessen</a>
        </div>
      </div>
    `);
    const review = card.querySelector('#story-review');
    for (const g of given) {
      const row = el(`
        <div class="story-review-row ${g.correct ? 'ok' : 'bad'}">
          <p class="story-review-q"></p>
          <p class="muted story-review-a"></p>
          <p class="explanation"></p>
        </div>
      `);
      row.querySelector('.story-review-q').textContent = `${g.correct ? '✓' : '✗'} ${g.q}`;
      row.querySelector('.story-review-a').textContent = g.correct ? g.answer : `Jouw antwoord: ${g.given} · juist: ${g.answer}`;
      row.querySelector('.explanation').textContent = g.explanation;
      review.appendChild(row);
    }
    mount.innerHTML = '';
    mount.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  paint();
}

