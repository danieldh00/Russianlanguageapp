const state = { user: null, syncing: false, pendingCount: 0 };
let syncInFlight = false;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline app-shell caching is a nice-to-have, not required for the app to work */
    });
  });
}

async function api(path, options = {}) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (networkErr) {
    const err = new Error('Geen verbinding met de server.');
    err.isNetworkError = true;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Er ging iets mis.');
    err.status = res.status;
    throw err;
  }
  return data;
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- immersion: listen to the Russian text ----------

const CYRILLIC_RUN = /[Ѐ-ӿ][Ѐ-ӿ\s.,!?'"()-]*[Ѐ-ӿ]|[Ѐ-ӿ]/;

function extractSpeakText(ex) {
  if (CYRILLIC_RUN.test(ex.correctAnswer)) return ex.correctAnswer;
  const match = ex.prompt.match(CYRILLIC_RUN);
  return match ? match[0].trim() : null;
}

function speakRussian(text) {
  if (!text || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    /* Web Speech API not available or blocked -- listening is a bonus, not required */
  }
}

function renderSpeakButton(text) {
  if (!text || !('speechSynthesis' in window)) return null;
  const btn = el(`<button type="button" class="speak-btn" aria-label="Luister naar de Russische uitspraak">🔊 Luister</button>`);
  btn.addEventListener('click', () => speakRussian(text));
  return btn;
}

// ---------- auth ----------

async function ensureUser() {
  if (state.user) return state.user;
  try {
    const data = await api('/auth/me');
    state.user = data.user;
    Storage.setAuth(data.user);
  } catch (e) {
    if (e.isNetworkError) {
      // no connectivity right now -- fall back to the last account that
      // successfully logged in on this device, so the app still opens
      const cached = Storage.getAuth();
      state.user = cached || null;
    } else {
      // a real 401: not logged in (or logged out) according to the server
      state.user = null;
      Storage.clearAuth();
    }
  }
  return state.user;
}

// ---------- sync: push the local outbox, pull fresh content + word progress ----------

async function flushOutbox() {
  const username = state.user.username;
  const items = Storage.loadOutbox(username);
  if (!items.length) return;
  const payload = items.map((it) => ({
    clientId: it.clientId,
    exerciseId: it.exerciseId,
    givenAnswer: it.givenAnswer,
    clientTimestamp: it.clientTimestamp
  }));
  const result = await api('/sync/attempts', { method: 'POST', body: { attempts: payload } });
  const handled = [...result.accepted, ...result.skipped, ...result.failed.map((f) => f.clientId)];
  Storage.removeFromOutbox(username, handled);
}

async function refreshContentIfStale() {
  const username = state.user.username;
  const cached = Storage.loadContent(username);
  const staleMs = 24 * 60 * 60 * 1000;
  if (cached && cached.fetchedAt && Date.now() - new Date(cached.fetchedAt).getTime() < staleMs) return;
  const fresh = await api('/content');
  Storage.saveContent(username, fresh);
}

async function pullWordProgress() {
  const username = state.user.username;
  const data = await api('/progress/words');
  const map = {};
  data.words.forEach((w) => { map[w.wordId] = w; });
  Storage.saveWordProgress(username, map);
}

async function pullStats() {
  const stats = await api('/progress/stats');
  Storage.saveStats(state.user.username, stats);
}

async function syncAll({ force = false } = {}) {
  if (!state.user || syncInFlight || !navigator.onLine) {
    state.pendingCount = state.user ? Storage.loadOutbox(state.user.username).length : 0;
    return;
  }
  syncInFlight = true;
  state.syncing = true;
  renderNav();
  try {
    await flushOutbox();
    if (force) {
      const fresh = await api('/content');
      Storage.saveContent(state.user.username, fresh);
    } else {
      await refreshContentIfStale();
    }
    await pullWordProgress();
    await pullStats();
  } catch (e) {
    // best-effort: offline or a flaky connection, the local outbox keeps the data safe
  } finally {
    state.syncing = false;
    state.pendingCount = Storage.loadOutbox(state.user.username).length;
    syncInFlight = false;
    renderNav();
    // Deliberately not re-rendering the current view here: this function is
    // also called in the background (after answering a question, on
    // 'online') and forcing a full re-render mid-interaction caused a nasty
    // render race (the view a test/user was clicking in got replaced out
    // from under them). The dashboard/progress views already read local
    // storage fresh on every visit, so cross-device updates show up next
    // time the user navigates there.
  }
}

async function ensureContentLoaded() {
  const username = state.user.username;
  let content = Storage.loadContent(username);
  if (!content && navigator.onLine) {
    try {
      content = await api('/content');
      Storage.saveContent(username, content);
      await pullWordProgress().catch(() => {});
      await pullStats().catch(() => {});
    } catch (e) {
      content = null;
    }
  }
  return content;
}

// ---------- nav / routing ----------

const app = document.getElementById('app');
const nav = document.getElementById('nav');

function renderNav() {
  nav.innerHTML = '';
  if (state.user) {
    nav.appendChild(el(`<a href="#/dashboard">Lessen</a>`));
    nav.appendChild(el(`<a href="#/progress">Voortgang</a>`));
    nav.appendChild(el(`<a href="#/leaderboard">Ranglijst</a>`));
    const gamBadge = renderGamificationBadge();
    if (gamBadge) nav.appendChild(gamBadge);
    nav.appendChild(renderSyncBadge());
    nav.appendChild(el(`<span class="muted" style="margin-left:4px">${escapeHtml(state.user.username)}</span>`));
    const btn = el(`<button>Uitloggen</button>`);
    btn.addEventListener('click', async () => {
      api('/auth/logout', { method: 'POST' }).catch(() => {});
      Storage.clearAuth();
      state.user = null;
      location.hash = '#/login';
    });
    nav.appendChild(btn);
  } else {
    nav.appendChild(el(`<a href="#/login">Inloggen</a>`));
    nav.appendChild(el(`<a href="#/register">Registreren</a>`));
  }
}

function renderGamificationBadge() {
  const stats = Storage.loadStats(state.user.username);
  if (!stats) return null;
  const span = el(`<span class="gam-badge"></span>`);
  span.innerHTML =
    `<span class="gam-streak" title="Dagen op rij geoefend">🔥 ${stats.currentStreak}</span>` +
    `<span class="gam-xp" title="${escapeHtml(stats.title)}">⭐ ${stats.xp} XP</span>`;
  return span;
}

function renderSyncBadge() {
  let label, cls;
  if (!navigator.onLine) { label = '● Offline'; cls = 'offline'; }
  else if (state.syncing) { label = '⟳ Synchroniseren…'; cls = 'syncing'; }
  else if (state.pendingCount > 0) { label = `${state.pendingCount} nog te synchroniseren`; cls = 'pending'; }
  else { label = '✓ Gesynchroniseerd'; cls = 'synced'; }
  const span = el(`<span class="sync-badge ${cls}"></span>`);
  span.textContent = label;
  return span;
}

window.addEventListener('online', () => { renderNav(); syncAll(); });
window.addEventListener('offline', () => { renderNav(); });

async function router() {
  const hash = location.hash || '#/dashboard';
  const [, route, param] = hash.split('/');

  await ensureUser();
  renderNav();

  if (!state.user && !['login', 'register'].includes(route)) {
    location.hash = '#/login';
    return;
  }
  if (state.user && ['login', 'register'].includes(route)) {
    location.hash = '#/dashboard';
    return;
  }

  if (route === 'login') return renderLogin();
  if (route === 'register') return renderRegister();

  // first time this device sees this account: block on the initial pull so
  // the very first screen isn't empty; afterwards sync happens in the background
  const isFirstBoot = !Storage.loadContent(state.user.username);
  if (isFirstBoot && navigator.onLine) await syncAll();
  else syncAll();

  if (route === 'dashboard') return renderDashboard();
  if (route === 'lesson') return renderLesson(param);
  if (route === 'progress') return renderProgress();
  if (route === 'leaderboard') return renderLeaderboard();
  return renderDashboard();
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// ---------- auth views ----------

function renderLogin() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="card" style="max-width:400px">
      <h1>Inloggen</h1>
      <p class="muted">Log in om verder te leren en je voortgang bij te houden.</p>
      <form id="login-form">
        <div>
          <label for="username">Gebruikersnaam</label>
          <input type="text" id="username" required />
        </div>
        <div>
          <label for="password">Wachtwoord</label>
          <input type="password" id="password" required />
        </div>
        <p class="error-message" id="login-error"></p>
        <button type="submit" class="primary">Inloggen</button>
      </form>
      <p class="muted" style="margin-top:14px">Nog geen account? <a href="#/register">Registreer hier</a>.</p>
    </div>
  `));

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    try {
      const data = await api('/auth/login', { method: 'POST', body: { username, password } });
      state.user = data.user;
      Storage.setAuth(data.user);
      location.hash = '#/dashboard';
    } catch (err) {
      document.getElementById('login-error').textContent = err.isNetworkError
        ? 'Geen internetverbinding. Inloggen kan alleen als je online bent (eenmalig, per toestel).'
        : err.message;
    }
  });
}

function renderRegister() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="card" style="max-width:400px">
      <h1>Account aanmaken</h1>
      <p class="muted">Maak een account om je voortgang op te slaan en te delen tussen je toestellen.</p>
      <form id="register-form">
        <div>
          <label for="username">Gebruikersnaam</label>
          <input type="text" id="username" required minlength="3" />
        </div>
        <div>
          <label for="email">E-mail (optioneel)</label>
          <input type="email" id="email" />
        </div>
        <div>
          <label for="password">Wachtwoord (min. 6 tekens)</label>
          <input type="password" id="password" required minlength="6" />
        </div>
        <p class="error-message" id="register-error"></p>
        <button type="submit" class="primary">Registreren</button>
      </form>
      <p class="muted" style="margin-top:14px">Heb je al een account? <a href="#/login">Log in</a>.</p>
    </div>
  `));

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const data = await api('/auth/register', { method: 'POST', body: { username, email, password } });
      state.user = data.user;
      Storage.setAuth(data.user);
      location.hash = '#/dashboard';
    } catch (err) {
      document.getElementById('register-error').textContent = err.isNetworkError
        ? 'Geen internetverbinding. Een account aanmaken kan alleen online.'
        : err.message;
    }
  });
}

// ---------- shared: no local content yet ----------

function renderNoContentMessage() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="card">
      <h1>Nog geen offline gegevens op dit toestel</h1>
      <p class="muted">Deze app werkt offline zodra de lesinhoud eenmaal is opgehaald. Maak één keer verbinding met
      internet terwijl je bent ingelogd — daarna werken alle lessen, ook zonder internet.</p>
    </div>
  `));
}

// ---------- dashboard (fully local: content + word-progress mirror) ----------

function categoryStats(username, content, slug) {
  const wordProgress = Storage.loadWordProgress(username);
  const exercises = content.exercises.filter((e) => e.category === slug);
  const wordIds = [...new Set(exercises.filter((e) => e.wordId != null).map((e) => e.wordId))];
  let mastered = 0, started = 0, due = 0;
  const now = Date.now();
  wordIds.forEach((id) => {
    const p = wordProgress[id];
    if (p) {
      started++;
      if (p.intervalDays >= 6) mastered++;
      if (p.nextReviewAt && new Date(p.nextReviewAt).getTime() <= now) due++;
    }
  });
  return { totalWords: wordIds.length, masteredWords: mastered, startedWords: started, dueWords: due, totalExercises: exercises.length };
}

async function renderDashboard() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();

  const username = state.user.username;
  const allStats = content.categories.map((cat) => ({ cat, stats: categoryStats(username, content, cat.slug) }));

  // Grammar/sentence-only categories have no tracked vocabulary (no SRS
  // signal), so they can't be "complete" or block the path -- they're always
  // shown as freely available. The recommended path (current/upcoming/locked)
  // is only computed over categories that do have trackable words.
  const wordBearing = allStats.filter(({ stats }) => stats.totalWords > 0);
  const wordBearingIndex = new Map(wordBearing.map(({ cat }, idx) => [cat.slug, idx]));
  let frontier = wordBearing.findIndex(({ stats }) => stats.masteredWords < stats.totalWords);
  if (frontier === -1) frontier = wordBearing.length; // everything mastered

  const wrapper = el(`
    <div>
      <h1>Jouw pad door het Russisch</h1>
      <p class="muted">Volg het pad van boven naar beneden, of kies zelf een les. Alles werkt ook zonder internet.</p>
      <div class="lesson-path" id="lesson-path"></div>
    </div>
  `);
  app.innerHTML = '';
  app.appendChild(wrapper);

  const path = wrapper.querySelector('#lesson-path');
  allStats.forEach(({ cat, stats }, i) => {
    const hasWords = stats.totalWords > 0;
    const complete = hasWords && stats.masteredWords === stats.totalWords;
    const pct = hasWords ? Math.round((stats.masteredWords / stats.totalWords) * 100) : 0;

    let nodeState = 'available';
    if (complete) nodeState = 'complete';
    else if (hasWords) {
      const wi = wordBearingIndex.get(cat.slug);
      if (wi === frontier) nodeState = 'current';
      else if (wi > frontier + 1) nodeState = 'upcoming';
    }

    const marker = complete ? '✓' : nodeState === 'upcoming' ? '🔒' : String(i + 1);
    const progressLine = hasWords
      ? `${stats.masteredWords}/${stats.totalWords} woorden onder de knie${stats.dueWords ? ` &middot; ${stats.dueWords} te herhalen` : ''}`
      : `${stats.totalExercises} oefeningen`;

    const node = el(`
      <div class="path-node ${nodeState}">
        <div class="path-marker">${marker}</div>
        <button class="card lesson-card" type="button">
          <div class="row1"><h2>${escapeHtml(cat.name)}</h2><span class="level-badge">${escapeHtml(cat.level)}</span></div>
          <p class="muted">${escapeHtml(cat.description || '')}</p>
          <p class="muted">${progressLine}</p>
          ${hasWords ? `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>` : ''}
        </button>
      </div>
    `);
    node.querySelector('.lesson-card').addEventListener('click', () => { location.hash = `#/lesson/${cat.slug}`; });
    path.appendChild(node);
  });
}

// ---------- lesson / quiz (fully local: grading, SRS update, outbox) ----------

function pickBatch(exercises, wordProgress, limit) {
  const now = Date.now();
  const due = [], fresh = [], rest = [];
  exercises.forEach((ex) => {
    if (ex.wordId == null) { rest.push(ex); return; }
    const p = wordProgress[ex.wordId];
    if (!p) { fresh.push(ex); return; }
    if (p.nextReviewAt && new Date(p.nextReviewAt).getTime() <= now) due.push(ex);
    // else: scheduled for later, leave out of this batch
  });
  due.sort((a, b) => new Date(wordProgress[a.wordId].nextReviewAt) - new Date(wordProgress[b.wordId].nextReviewAt));
  const pool = [...due, ...shuffle(fresh), ...shuffle(rest)];
  return pool.slice(0, limit);
}

async function renderLesson(slug) {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();

  const category = content.categories.find((c) => c.slug === slug);
  const exercises = content.exercises.filter((e) => e.category === slug);
  if (!category || !exercises.length) {
    app.innerHTML = `<div class="card"><h1>${escapeHtml(category ? category.name : 'Les')}</h1><p class="muted">Geen oefeningen beschikbaar in deze les.</p><a href="#/dashboard">Terug naar lessen</a></div>`;
    return;
  }

  const wordProgress = Storage.loadWordProgress(state.user.username);
  const items = pickBatch(exercises, wordProgress, 10);
  if (!items.length) {
    app.innerHTML = `<div class="card"><h1>${escapeHtml(category.name)}</h1><p class="muted">Alles in deze les staat al gepland voor een latere herhaling. Kom later terug, of kies een andere les.</p><a href="#/dashboard">Terug naar lessen</a></div>`;
    return;
  }

  const session = { category, items, index: 0, correctCount: 0 };
  renderExercise(session);
}

function gradeAndRecord(ex) {
  return (chosenValue) => {
    const isCorrect = chosenValue === ex.correctAnswer;
    const username = state.user.username;

    if (ex.wordId != null) {
      const wordProgress = Storage.loadWordProgress(username);
      const prev = wordProgress[ex.wordId] || { easeFactor: 2.5, intervalDays: 0, repetitions: 0, correctCount: 0, incorrectCount: 0 };
      const updated = scheduleReview(prev, isCorrect);
      wordProgress[ex.wordId] = {
        ...updated,
        correctCount: (prev.correctCount || 0) + (isCorrect ? 1 : 0),
        incorrectCount: (prev.incorrectCount || 0) + (isCorrect ? 0 : 1),
        lastReviewedAt: new Date().toISOString()
      };
      Storage.saveWordProgress(username, wordProgress);
    }

    const clientTimestamp = new Date().toISOString();
    Storage.enqueueOutbox(username, { clientId: uuid(), exerciseId: ex.id, givenAnswer: chosenValue, clientTimestamp });
    Storage.appendAttemptLog(username, {
      exerciseId: ex.id, prompt: ex.prompt, given: chosenValue, correctAnswer: ex.correctAnswer,
      explanation: ex.explanation, isCorrect, at: clientTimestamp
    });

    syncAll(); // best-effort immediate push; the outbox guarantees it isn't lost if this fails
    return isCorrect;
  };
}

function renderSentenceBuild(ex, container, onSubmit) {
  let pool = shuffle(ex.options);
  let selected = [];
  let submitted = false;

  function paint() {
    container.innerHTML = '';

    const answerRow = el(`<div class="chip-row chip-answer"></div>`);
    if (!selected.length) answerRow.appendChild(el(`<span class="muted chip-placeholder">Tik hieronder de woorden in de juiste volgorde</span>`));
    selected.forEach((tok, i) => {
      const chip = el(`<button type="button" class="chip filled">${escapeHtml(tok)}</button>`);
      if (!submitted) chip.addEventListener('click', () => { selected.splice(i, 1); pool.push(tok); paint(); });
      else chip.disabled = true;
      answerRow.appendChild(chip);
    });
    container.appendChild(answerRow);

    const poolRow = el(`<div class="chip-row chip-pool"></div>`);
    pool.forEach((tok, i) => {
      const chip = el(`<button type="button" class="chip">${escapeHtml(tok)}</button>`);
      if (!submitted) chip.addEventListener('click', () => { pool.splice(i, 1); selected.push(tok); paint(); });
      else chip.disabled = true;
      poolRow.appendChild(chip);
    });
    container.appendChild(poolRow);

    if (!submitted) {
      const submitBtn = el(`<button type="button" class="primary" style="margin-top:14px">Controleren</button>`);
      submitBtn.disabled = selected.length === 0;
      submitBtn.addEventListener('click', () => {
        submitted = true;
        const value = selected.join(' ');
        paint();
        onSubmit(value);
      });
      container.appendChild(submitBtn);
    }
  }

  paint();
}

function renderExercise(session) {
  const ex = session.items[session.index];
  app.innerHTML = '';
  const speakText = extractSpeakText(ex);
  const wrapper = el(`
    <div class="card">
      <div class="exercise-progress">${escapeHtml(session.category.name)} &middot; vraag ${session.index + 1} van ${session.items.length}</div>
      <div class="prompt-row"><h2>${escapeHtml(ex.prompt)}</h2></div>
      <div id="options"></div>
      <div id="feedback"></div>
    </div>
  `);
  app.appendChild(wrapper);

  const promptRow = wrapper.querySelector('.prompt-row');
  const speakBtn = renderSpeakButton(speakText);
  if (speakBtn) promptRow.appendChild(speakBtn);

  const optionsDiv = wrapper.querySelector('#options');
  const feedbackDiv = wrapper.querySelector('#feedback');
  const record = gradeAndRecord(ex);

  function afterAnswer(isCorrect, chosenAnswer) {
    if (isCorrect) session.correctCount += 1;

    const buttons = optionsDiv.querySelectorAll('.option-btn');
    buttons.forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.value === ex.correctAnswer) btn.classList.add('correct');
      else if (btn.dataset.value === chosenAnswer) btn.classList.add('incorrect');
    });

    const fb = el(`
      <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
        <strong>${isCorrect ? 'Goed gedaan!' : 'Niet helemaal juist.'}</strong>
        ${isCorrect ? '' : `<div>Het juiste antwoord is: <strong>${escapeHtml(ex.correctAnswer)}</strong></div>`}
        <div class="explanation">${escapeHtml(ex.explanation)}</div>
        ${ex.grammarRule ? `<div class="grammar-rule"><strong>${escapeHtml(ex.grammarRule.title)}:</strong> ${escapeHtml(ex.grammarRule.explanation)}</div>` : ''}
        <div id="ai-explain-slot"></div>
      </div>
    `);
    feedbackDiv.appendChild(fb);

    if (!isCorrect && navigator.onLine) {
      const aiSlot = fb.querySelector('#ai-explain-slot');
      const aiBtn = el(`<button type="button" class="ai-btn">🤖 Vraag AI om een diepere uitleg</button>`);
      aiBtn.addEventListener('click', async () => {
        aiBtn.disabled = true;
        aiBtn.textContent = '🤖 Even denken…';
        try {
          const data = await api('/ai/explain', { method: 'POST', body: { exerciseId: ex.id, givenAnswer: chosenAnswer } });
          aiSlot.appendChild(el(`<div class="ai-explanation"><strong>🤖 AI-uitleg</strong><p>${escapeHtml(data.explanation)}</p></div>`));
          aiBtn.remove();
        } catch (err) {
          aiBtn.disabled = false;
          aiBtn.textContent = '🤖 Vraag AI om een diepere uitleg';
          aiSlot.appendChild(el(`<p class="error-message">${escapeHtml(err.message)}</p>`));
        }
      });
      aiSlot.appendChild(aiBtn);
    }

    const nextBtn = el(`<button class="primary" style="margin-top:14px">${session.index + 1 < session.items.length ? 'Volgende' : 'Klaar'}</button>`);
    nextBtn.addEventListener('click', () => {
      session.index += 1;
      if (session.index < session.items.length) renderExercise(session);
      else renderLessonComplete(session);
    });
    feedbackDiv.appendChild(nextBtn);
  }

  if (ex.type === 'sentence_build' && ex.options && ex.options.length) {
    renderSentenceBuild(ex, optionsDiv, (value) => afterAnswer(record(value), value));
  } else if (ex.options && ex.options.length) {
    for (const opt of ex.options) {
      const btn = el(`<button class="option-btn" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`);
      btn.addEventListener('click', () => afterAnswer(record(opt), opt));
      optionsDiv.appendChild(btn);
    }
  } else {
    const form = el(`
      <form id="typing-form">
        <input type="text" id="typing-answer" autocomplete="off" required />
        <button type="submit" class="primary" style="margin-top:10px;width:fit-content">Controleren</button>
      </form>
    `);
    optionsDiv.appendChild(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = document.getElementById('typing-answer').value;
      optionsDiv.querySelectorAll('input,button').forEach((n) => (n.disabled = true));
      afterAnswer(record(value), value);
    });
  }
}

function renderLessonComplete(session) {
  app.innerHTML = '';
  const pct = Math.round((session.correctCount / session.items.length) * 100);
  app.appendChild(el(`
    <div class="card">
      <h1>Les afgerond</h1>
      <p>Je had ${session.correctCount} van de ${session.items.length} vragen goed (${pct}%).</p>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="primary" id="again-btn">Nog een keer</button>
        <button class="secondary" id="back-btn">Terug naar lessen</button>
      </div>
    </div>
  `));
  document.getElementById('again-btn').addEventListener('click', () => renderLesson(session.category.slug));
  document.getElementById('back-btn').addEventListener('click', () => { location.hash = '#/dashboard'; });
}

// ---------- progress (fully local: folded from the word-progress mirror + this device's attempt log) ----------

async function renderProgress() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();

  const username = state.user.username;
  const wordProgress = Storage.loadWordProgress(username);
  const attemptsLog = Storage.loadAttemptsLog(username);
  const wordIds = Object.keys(wordProgress);

  let correctAttempts = 0, totalAttempts = 0, wordsMastered = 0;
  wordIds.forEach((id) => {
    const p = wordProgress[id];
    correctAttempts += p.correctCount || 0;
    totalAttempts += (p.correctCount || 0) + (p.incorrectCount || 0);
    if (p.intervalDays >= 6) wordsMastered++;
  });
  const accuracyPct = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 1000) / 10 : 0;

  const totalWordsInContent = new Set(content.exercises.filter((e) => e.wordId != null).map((e) => e.wordId)).size;

  app.innerHTML = '';
  app.appendChild(el(`
    <div>
      <h1>Mijn voortgang</h1>
      <div class="stats-row">
        <div class="stat-box"><div class="value">${accuracyPct}%</div><div class="label">Nauwkeurigheid</div></div>
        <div class="stat-box"><div class="value">${wordsMastered}/${totalWordsInContent}</div><div class="label">Woorden onder de knie</div></div>
        <div class="stat-box"><div class="value">${wordIds.length}</div><div class="label">Woorden geoefend</div></div>
        <div class="stat-box"><div class="value">${totalAttempts}</div><div class="label">Totaal antwoorden</div></div>
      </div>
    </div>
  `));

  const stats = Storage.loadStats(username);
  if (stats) {
    const pctIntoLevel = stats.xpForNextLevel ? Math.round((stats.xpIntoLevel / stats.xpForNextLevel) * 100) : 100;
    const levelCard = el(`
      <div class="card">
        <h2>Niveau &amp; reeks</h2>
        <div class="level-row">
          <div class="level-info">
            <div class="level-title">Niveau ${stats.level} &middot; ${escapeHtml(stats.title)}</div>
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${pctIntoLevel}%"></div></div>
            <div class="muted" style="font-size:0.8rem;margin-top:4px">${stats.xp} XP${stats.xpForNextLevel ? ` &middot; nog ${stats.xpForNextLevel - stats.xpIntoLevel} XP tot ${escapeHtml(stats.nextTitle)}` : ' &middot; hoogste niveau bereikt'}</div>
          </div>
          <div class="streak-info">
            <div class="streak-value">🔥 ${stats.currentStreak}</div>
            <div class="muted" style="font-size:0.78rem">dagen op rij${stats.longestStreak > stats.currentStreak ? ` (langste: ${stats.longestStreak})` : ''}</div>
          </div>
        </div>
      </div>
    `);
    app.appendChild(levelCard);

    const achCard = el(`<div class="card"><h2>Badges</h2><div class="badge-grid" id="badge-grid"></div></div>`);
    const badgeGrid = achCard.querySelector('#badge-grid');
    for (const a of stats.achievements) {
      badgeGrid.appendChild(el(`
        <div class="badge ${a.unlocked ? 'unlocked' : 'locked'}" title="${escapeHtml(a.description)}">
          <div class="badge-icon">${a.icon}</div>
          <div class="badge-title">${escapeHtml(a.title)}</div>
        </div>
      `));
    }
    app.appendChild(achCard);
  }

  const catCard = el(`<div class="card"><h2>Voortgang per les</h2><div class="table-scroll"><table><thead><tr><th>Les</th><th>Gestart</th><th>Onder de knie</th></tr></thead><tbody id="cat-body"></tbody></table></div></div>`);
  app.appendChild(catCard);
  const catBody = catCard.querySelector('#cat-body');
  for (const cat of content.categories) {
    const s = categoryStats(username, content, cat.slug);
    catBody.appendChild(el(`<tr><td>${escapeHtml(cat.name)}</td><td>${s.startedWords}/${s.totalWords}</td><td>${s.masteredWords}/${s.totalWords}</td></tr>`));
  }

  const mistakes = attemptsLog.filter((a) => !a.isCorrect);
  const missedCounts = {};
  mistakes.forEach((m) => { missedCounts[m.exerciseId] = (missedCounts[m.exerciseId] || { ...m, count: 0 }); missedCounts[m.exerciseId].count++; });
  const topMissed = Object.values(missedCounts).sort((a, b) => b.count - a.count).slice(0, 10);

  const missedCard = el(`<div class="card"><h2>Vaakst fout beantwoord <span class="muted" style="font-weight:400;font-size:0.8rem">(dit toestel)</span></h2></div>`);
  if (!topMissed.length) {
    missedCard.appendChild(el(`<p class="muted">Nog geen fouten geregistreerd op dit toestel. Blijf zo doorgaan!</p>`));
  } else {
    const table = el(`<table><thead><tr><th>Vraag</th><th>Juiste antwoord</th><th>Uitleg</th><th>Keer fout</th></tr></thead><tbody></tbody></table>`);
    const tbody = table.querySelector('tbody');
    for (const m of topMissed) {
      tbody.appendChild(el(`<tr><td>${escapeHtml(m.prompt)}</td><td>${escapeHtml(m.correctAnswer)}</td><td>${escapeHtml(m.explanation)}</td><td>${m.count}</td></tr>`));
    }
    const scroll = el(`<div class="table-scroll"></div>`);
    scroll.appendChild(table);
    missedCard.appendChild(scroll);
  }
  app.appendChild(missedCard);

  const recentCard = el(`<div class="card"><h2>Recente fouten <span class="muted" style="font-weight:400;font-size:0.8rem">(dit toestel)</span></h2></div>`);
  if (!mistakes.length) {
    recentCard.appendChild(el(`<p class="muted">Geen recente fouten op dit toestel.</p>`));
  } else {
    const table = el(`<table><thead><tr><th>Vraag</th><th>Jouw antwoord</th><th>Juist</th><th>Uitleg</th></tr></thead><tbody></tbody></table>`);
    const tbody = table.querySelector('tbody');
    for (const m of mistakes.slice(0, 20)) {
      tbody.appendChild(el(`<tr><td>${escapeHtml(m.prompt)}</td><td>${escapeHtml(m.given || '-')}</td><td>${escapeHtml(m.correctAnswer)}</td><td>${escapeHtml(m.explanation)}</td></tr>`));
    }
    const scroll = el(`<div class="table-scroll"></div>`);
    scroll.appendChild(table);
    recentCard.appendChild(scroll);
  }
  app.appendChild(recentCard);
}

// ---------- leaderboard (live only: ranking across accounts needs the server) ----------

const MEDALS = ['🥇', '🥈', '🥉'];

async function renderLeaderboard() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div>
      <h1>Ranglijst</h1>
      <p class="muted">Vergelijk je voortgang met andere leerlingen. Dit overzicht vraagt een internetverbinding.</p>
      <div id="leaderboard-content"></div>
    </div>
  `));
  const slot = document.getElementById('leaderboard-content');

  if (!navigator.onLine) {
    slot.appendChild(el(`<div class="card"><p class="muted">Je bent offline. Maak verbinding met internet om de ranglijst te bekijken.</p></div>`));
    return;
  }

  slot.appendChild(el(`<div class="card"><p class="muted">Ranglijst laden…</p></div>`));
  try {
    const data = await api('/leaderboard');
    slot.innerHTML = '';

    const table = el(`
      <div class="card">
        <div class="table-scroll">
          <table class="leaderboard-table">
            <thead><tr><th>#</th><th>Gebruiker</th><th>Niveau</th><th>XP</th><th>Reeks</th><th>Woorden</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    `);
    const tbody = table.querySelector('tbody');
    data.leaderboard.forEach((entry) => {
      const isMe = state.user && entry.userId === state.user.id;
      const rankLabel = MEDALS[entry.rank - 1] || entry.rank;
      const row = el(`
        <tr class="${isMe ? 'leaderboard-me' : ''}">
          <td class="rank-cell">${rankLabel}</td>
          <td>${escapeHtml(entry.username)}${isMe ? ' <span class="muted">(jij)</span>' : ''}</td>
          <td>${entry.level} &middot; <span class="muted">${escapeHtml(entry.levelTitle)}</span></td>
          <td>${entry.xp} XP</td>
          <td>🔥 ${entry.currentStreak}</td>
          <td>${entry.wordsMastered}</td>
        </tr>
      `);
      tbody.appendChild(row);
    });
    slot.appendChild(table);

    if (!data.leaderboard.length) {
      slot.appendChild(el(`<div class="card"><p class="muted">Nog geen andere leerlingen om mee te vergelijken.</p></div>`));
    }
  } catch (err) {
    slot.innerHTML = '';
    slot.appendChild(el(`<div class="card"><p class="error-message">${escapeHtml(err.message || 'Kon de ranglijst niet laden.')}</p></div>`));
  }
}
