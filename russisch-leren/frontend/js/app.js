const state = { user: null, syncing: false, pendingCount: 0 };
let syncInFlight = false;

// the content bundle shape this client understands (see /api/content)
const CONTENT_SCHEMA_VERSION = 3;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // The browser only checks for a new service worker on its own
        // schedule (up to ~24h), which is why a deploy could sit unnoticed
        // in an already-open tab. Ask more often, so updates land quickly.
        setInterval(() => registration.update(), 5 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update();
        });
      })
      .catch(() => {
        /* offline app-shell caching is a nice-to-have, not required for the app to work */
      });

    // 'controllerchange' fires both for a genuine update (a new SW version
    // replacing one that already controlled this page) AND the very first
    // time a freshly-registered SW claims a previously-uncontrolled page
    // (clients.claim() on first install). Only the former should force a
    // reload -- reloading on every first-time visit would be an unwanted
    // surprise refresh right after someone's page loads. Track whether a
    // controller already existed *at the time of each event* (not just once
    // at page load) so this stays correct across repeated updates too.
    let lastKnownController = navigator.serviceWorker.controller;
    let reloadedForUpdate = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const isGenuineUpdate = lastKnownController != null;
      lastKnownController = navigator.serviceWorker.controller;
      if (!isGenuineUpdate || reloadedForUpdate) return;
      // A new service worker activates immediately (skipWaiting +
      // clients.claim on the server side) once installed, but the
      // already-running tab keeps executing the old JS/CSS until it
      // reloads. Reload once so a deployed update is never stuck behind a
      // stale cache -- progress is saved continuously (outbox + local
      // mirror), so this can't lose data.
      reloadedForUpdate = true;
      window.location.reload();
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

// Same forgiving comparison as the server (src/grading.js): stress marks,
// ё/е, case, surrounding punctuation and whitespace never count against you.
function normalizeAnswer(value) {
  return (value == null ? '' : String(value))
    .normalize('NFC')
    .replace(/́/g, '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s ]+/g, ' ')
    .replace(/^[\s.,!?;:«»"'()-]+|[\s.,!?;:«»"'()-]+$/g, '')
    .trim();
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVEL_FALLBACK_TITLES = { A1: 'Beginner', A2: 'Elementair', B1: 'Drempelniveau', B2: 'Gevorderd', C1: 'Vergevorderd', C2: 'Beheersing' };

// ---------- immersion: listen to the Russian text ----------

const CYRILLIC_RUN = /[Ѐ-ӿ][Ѐ-ӿ\s.,!?'"()-]*[Ѐ-ӿ]|[Ѐ-ӿ]/;

function extractSpeakText(ex) {
  if (ex.type === 'listen') return ex.context || null;
  if (ex.type === 'reading') return ex.context || null;
  if (CYRILLIC_RUN.test(ex.correctAnswer)) return ex.correctAnswer;
  const match = ex.prompt.match(CYRILLIC_RUN);
  return match ? match[0].trim() : null;
}

function speakRussian(text) {
  if (!text || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/́/g, ''));
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    /* Web Speech API not available or blocked -- listening is a bonus, not required */
  }
}

function renderSpeakButton(text, label = '🔊 Luister') {
  if (!text || !('speechSynthesis' in window)) return null;
  const btn = el(`<button type="button" class="speak-btn" aria-label="Luister naar de Russische uitspraak">${label}</button>`);
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

function contentIsCurrent(content) {
  return !!content && content.schemaVersion === CONTENT_SCHEMA_VERSION;
}

async function refreshContentIfStale() {
  const username = state.user.username;
  const cached = Storage.loadContent(username);
  const staleMs = 24 * 60 * 60 * 1000;
  if (contentIsCurrent(cached) && cached.fetchedAt && Date.now() - new Date(cached.fetchedAt).getTime() < staleMs) return;
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
  if (!contentIsCurrent(content) && navigator.onLine) {
    try {
      content = await api('/content');
      Storage.saveContent(username, content);
      await pullWordProgress().catch(() => {});
      await pullStats().catch(() => {});
    } catch (e) {
      // keep whatever older bundle we have rather than showing nothing
    }
  }
  return content;
}

// Grammar rules travel once per bundle (a map by code); resolve them onto an
// exercise when it's about to be shown. Older cached bundles still carry the
// rule inline, so fall back to that.
function withGrammarRule(content, ex) {
  const rule = ex.ruleCode && content.grammarRules ? content.grammarRules[ex.ruleCode] : ex.grammarRule || null;
  const word = ex.wordId != null && content.words ? content.words[ex.wordId] : null;
  return { ...ex, grammarRule: rule || null, example: (word && word.example) || ex.example || null };
}

// "Я пью воду. — Ik drink water." with a listen button: the word in a real
// sentence, shown after every answer so the context sticks, not just the word.
function renderExampleBlock(example) {
  if (!example || !example.ru) return null;
  const block = el(`
    <div class="example-box">
      <div class="reading-label">In een zin</div>
      <p class="example-ru"></p>
      <p class="example-nl muted"></p>
    </div>
  `);
  block.querySelector('.example-ru').textContent = example.ru;
  block.querySelector('.example-nl').textContent = example.nl || '';
  const speak = renderSpeakButton(example.ru, '🔊 Zin beluisteren');
  if (speak) block.appendChild(speak);
  return block;
}

function levelsOf(content) {
  if (content.levels && content.levels.length) return content.levels;
  const present = [...new Set(content.categories.map((c) => c.level))];
  return LEVEL_ORDER.filter((l) => present.includes(l)).map((level) => ({ level, title: LEVEL_FALLBACK_TITLES[level] || level, description: '' }));
}

// ---------- nav / routing ----------

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const bottomNav = document.getElementById('bottom-nav');

// Bottom tab bar: the primary navigation, styled as a floating glass pill
// (like an iOS tab bar) so it never has to wrap or overflow on a narrow
// phone screen -- unlike a top nav row, which runs out of horizontal room
// once badges + username + several links are all fighting for the same line.
const NAV_ITEMS = [
  { route: 'dashboard', label: 'Lessen', icon: '📚' },
  { route: 'progress', label: 'Voortgang', icon: '📊' },
  { route: 'leaderboard', label: 'Ranglijst', icon: '🏆' }
];

function currentRouteSection() {
  const route = (location.hash || '#/dashboard').split('/')[1] || 'dashboard';
  // a lesson or exam screen is reached from, and belongs to, the "Lessen" tab
  return route === 'lesson' || route === 'exam' || route === 'practice' ? 'dashboard' : route;
}

function renderNav() {
  nav.innerHTML = '';
  bottomNav.innerHTML = '';
  document.body.classList.toggle('has-bottom-nav', !!state.user);

  if (state.user) {
    const gamBadge = renderGamificationBadge();
    if (gamBadge) nav.appendChild(gamBadge);
    nav.appendChild(renderSyncBadge());
    nav.appendChild(el(`<span class="muted user-name">${escapeHtml(state.user.username)}</span>`));

    const activeSection = currentRouteSection();
    NAV_ITEMS.forEach((item) => {
      const tab = el(`
        <a href="#/${item.route}" class="bottom-nav-item ${activeSection === item.route ? 'active' : ''}">
          <span class="bottom-nav-icon">${item.icon}</span>
          <span class="bottom-nav-label">${item.label}</span>
        </a>
      `);
      bottomNav.appendChild(tab);
    });
    const logoutTab = el(`
      <button type="button" class="bottom-nav-item">
        <span class="bottom-nav-icon">🚪</span>
        <span class="bottom-nav-label">Uitloggen</span>
      </button>
    `);
    logoutTab.addEventListener('click', async () => {
      api('/auth/logout', { method: 'POST' }).catch(() => {});
      Storage.clearAuth();
      state.user = null;
      location.hash = '#/login';
    });
    bottomNav.appendChild(logoutTab);
  } else {
    nav.appendChild(el(`<a href="#/login">Inloggen</a>`));
    nav.appendChild(el(`<a href="#/register">Registreren</a>`));
  }
}

function renderGamificationBadge() {
  const stats = Storage.loadStats(state.user.username);
  if (!stats) return null;
  const span = el(`<span class="gam-badge"></span>`);
  const highest = (stats.certifiedLevels || []).slice().sort((a, b) => LEVEL_ORDER.indexOf(b) - LEVEL_ORDER.indexOf(a))[0];
  span.innerHTML =
    `<span class="gam-streak" title="Dagen op rij geoefend">🔥 ${stats.currentStreak}</span>` +
    `<span class="gam-xp" title="${escapeHtml(stats.title)}">⭐ ${stats.xp} XP</span>` +
    (highest ? `<span class="gam-cert" title="Hoogste behaalde niveautoets">🎓 ${highest}</span>` : '');
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
  if (route === 'practice') return renderMistakesPractice();
  if (route === 'exam') return renderExam((param || '').toUpperCase());
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

// The learning path with real locks. A lesson is "done" once every word in
// it has been practised at least once (mastery via spaced repetition takes
// days and would make the lock absurd); the next lesson in the level unlocks
// when the one before it is done. Grammar/sentence-only lessons carry no
// tracked words, so they never block the lesson after them -- they just
// open together with the lesson they follow. A level unlocks once the
// previous level's exam is passed, or once all of its lessons are done.
// Used by the dashboard for rendering and by the lesson/exam routes to
// refuse direct navigation to something that's still locked.
function computePath(content, username) {
  const stats = Storage.loadStats(username);
  const certified = new Set((stats && stats.certifiedLevels) || []);
  const levels = levelsOf(content);
  const bySlug = new Map();
  const byLevel = new Map();
  let previousLevelDone = true; // the first level is always open
  let currentAssigned = false;

  levels.forEach(({ level }, li) => {
    const entries = content.categories
      .filter((c) => c.level === level)
      .map((cat) => ({ cat, stats: categoryStats(username, content, cat.slug) }));
    if (!entries.length) return;
    const prevLevel = li > 0 ? levels[li - 1].level : null;
    const levelUnlocked = li === 0 || certified.has(prevLevel) || previousLevelDone;

    let gate = levelUnlocked;
    let allDone = true;
    entries.forEach(({ cat, stats: s }) => {
      const hasWords = s.totalWords > 0;
      const done = hasWords ? s.startedWords === s.totalWords : true;
      const mastered = hasWords && s.masteredWords === s.totalWords;
      const unlocked = gate;
      const current = unlocked && !currentAssigned && hasWords && !done;
      if (current) currentAssigned = true;
      bySlug.set(cat.slug, { cat, stats: s, unlocked, done, mastered, current, level });
      if (hasWords && !done) { gate = false; allDone = false; }
    });
    byLevel.set(level, { unlocked: levelUnlocked, passed: certified.has(level), allDone, entries: entries.map((e) => e.cat.slug), prevLevel });
    previousLevelDone = allDone;
  });

  return { bySlug, byLevel, levels };
}

// The lesson a locked one is waiting on: the nearest earlier lesson (same
// level) with words still to practise -- or the previous level as a whole.
function lockReason(path, slug) {
  const node = path.bySlug.get(slug);
  if (!node) return null;
  const level = path.byLevel.get(node.level);
  if (!level.unlocked) return `Rond eerst niveau ${level.prevLevel} af: maak de toets van ${level.prevLevel} of oefen alle lessen van dat niveau.`;
  const idx = level.entries.indexOf(slug);
  for (let i = idx - 1; i >= 0; i--) {
    const prev = path.bySlug.get(level.entries[i]);
    if (prev.stats.totalWords > 0 && !prev.done) {
      return `Rond eerst '${prev.cat.name}' af (${prev.stats.startedWords}/${prev.stats.totalWords} woorden geoefend).`;
    }
  }
  return 'Deze les is nog vergrendeld.';
}

async function renderDashboard() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();

  const username = state.user.username;
  const path = computePath(content, username);
  const certified = new Set([...path.byLevel.entries()].filter(([, l]) => l.passed).map(([lvl]) => lvl));
  const allStats = content.categories.map((cat) => {
    const node = path.bySlug.get(cat.slug);
    return { cat, stats: node ? node.stats : categoryStats(username, content, cat.slug) };
  });

  const levels = levelsOf(content);
  const wrapper = el(`
    <div>
      <h1>Jouw pad door het Russisch</h1>
      <p class="muted">Van A1 tot C2. Elke les opent zodra je de vorige helemaal hebt geoefend; een nieuw niveau opent na de toets (of na alle lessen) van het niveau ervoor. Alles werkt ook zonder internet, behalve de toetsen.</p>
      <div class="level-jump" id="level-jump"></div>
      <div id="practice-slot"></div>
      <div id="levels"></div>
    </div>
  `);
  app.innerHTML = '';
  app.appendChild(wrapper);

  const openMistakes = mistakeExercises(content, username).length;
  if (openMistakes) {
    const card = el(`
      <button type="button" class="card practice-card">
        <div class="row1"><h2>🎯 Oefen je fouten</h2><span class="level-badge">${openMistakes}</span></div>
        <p class="muted">${openMistakes === 1 ? 'Eén vraag die je fout had' : `${openMistakes} vragen die je fout had`} en nog niet hebt rechtgezet. Een ronde van ${Math.min(10, openMistakes)}, de vaakst gemiste eerst.</p>
      </button>
    `);
    card.addEventListener('click', () => { location.hash = '#/practice'; });
    wrapper.querySelector('#practice-slot').appendChild(card);
  }

  const jump = wrapper.querySelector('#level-jump');
  const levelsRoot = wrapper.querySelector('#levels');
  let nodeNumber = 0;

  levels.forEach(({ level, title, description }) => {
    const entries = allStats.filter(({ cat }) => cat.level === level);
    if (!entries.length) return;
    const levelWords = entries.reduce((acc, e) => acc + e.stats.totalWords, 0);
    const levelMastered = entries.reduce((acc, e) => acc + e.stats.masteredWords, 0);
    const levelPct = levelWords ? Math.round((levelMastered / levelWords) * 100) : 0;
    const passed = certified.has(level);
    const levelState = path.byLevel.get(level);
    const levelLocked = !(levelState && levelState.unlocked);

    const pill = el(`<a class="level-pill ${passed ? 'passed' : ''}" href="#level-${level}">${level}${passed ? ' ✓' : ''}</a>`);
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(`level-${level}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    jump.appendChild(pill);

    const section = el(`
      <section class="level-section ${levelLocked ? 'locked' : ''}" id="level-${level}">
        <header class="level-header">
          <div class="level-header-main">
            <span class="level-code">${levelLocked ? '🔒' : level}</span>
            <div>
              <h2>${escapeHtml(title)}</h2>
              <p class="muted">${escapeHtml(description || '')}</p>
            </div>
          </div>
          <div class="level-header-stats">
            <span class="muted">${levelMastered}/${levelWords} woorden onder de knie &middot; ${entries.length} lessen</span>
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${levelPct}%"></div></div>
          </div>
        </header>
        <div class="lesson-path"></div>
      </section>
    `);
    const pathEl = section.querySelector('.lesson-path');

    entries.forEach(({ cat, stats: s }) => {
      nodeNumber++;
      const node = path.bySlug.get(cat.slug);
      const hasWords = s.totalWords > 0;
      const pct = hasWords ? Math.round((s.startedWords / s.totalWords) * 100) : 0;

      let nodeState = 'available';
      if (!node.unlocked) nodeState = 'locked';
      else if (node.mastered) nodeState = 'complete';
      else if (node.done) nodeState = 'done';
      else if (node.current) nodeState = 'current';

      const marker = node.mastered ? '✓' : nodeState === 'locked' ? '🔒' : String(nodeNumber);
      let progressLine;
      if (!hasWords) progressLine = `${s.totalExercises} oefeningen &middot; altijd te herhalen`;
      else if (node.mastered) progressLine = `Alle ${s.totalWords} woorden onder de knie${s.dueWords ? ` &middot; ${s.dueWords} te herhalen` : ''}`;
      else progressLine = `${s.startedWords}/${s.totalWords} woorden geoefend &middot; ${s.masteredWords} onder de knie${s.dueWords ? ` &middot; ${s.dueWords} te herhalen` : ''}`;
      const lockLine = nodeState === 'locked' ? `<p class="lock-reason">🔒 ${escapeHtml(lockReason(path, cat.slug))}</p>` : '';

      const nodeEl = el(`
        <div class="path-node ${nodeState}">
          <div class="path-marker">${marker}</div>
          <button class="card lesson-card" type="button" ${nodeState === 'locked' ? 'aria-disabled="true"' : ''}>
            <div class="row1"><h2>${escapeHtml(cat.name)}</h2><span class="level-badge">${escapeHtml(cat.level)}</span></div>
            <p class="muted">${escapeHtml(cat.description || '')}</p>
            <p class="muted">${progressLine}</p>
            ${lockLine}
            ${hasWords ? `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>` : ''}
          </button>
        </div>
      `);
      nodeEl.querySelector('.lesson-card').addEventListener('click', () => {
        if (nodeState === 'locked') return;
        location.hash = `#/lesson/${cat.slug}`;
      });
      pathEl.appendChild(nodeEl);
    });

    const examNode = el(`
      <div class="path-node exam ${passed ? 'complete' : levelLocked ? 'locked' : ''}">
        <div class="path-marker">${passed ? '🎓' : levelLocked ? '🔒' : '📝'}</div>
        <button class="card lesson-card exam-card" type="button" ${levelLocked ? 'aria-disabled="true"' : ''}>
          <div class="row1"><h2>Niveautoets ${level}</h2><span class="level-badge">${passed ? 'behaald' : 'toets'}</span></div>
          <p class="muted">${passed
            ? `Gehaald! Je hebt niveau ${level} officieel afgesloten. Je kunt de toets altijd opnieuw maken.`
            : `30 vragen uit alle lessen van ${level}. Bij 80% of hoger sluit je het niveau af, verdien je 150 XP en gaat het volgende niveau open. Alleen online.`}</p>
        </button>
      </div>
    `);
    examNode.querySelector('.exam-card').addEventListener('click', () => {
      if (levelLocked) return;
      location.hash = `#/exam/${level}`;
    });
    pathEl.appendChild(examNode);

    levelsRoot.appendChild(section);
  });
}

// ---------- lesson / quiz (fully local: grading, SRS update, outbox) ----------

// Session order: words due for review first, then words never practised
// (one exercise per new word before a second one of the same word, so a
// lesson's vocabulary is covered in as few sessions as possible), then
// exercises without a tracked word, and finally words that are scheduled
// for later -- so a lesson can always be redone as extra practice instead
// of turning you away because "everything is planned for later".
function pickBatch(exercises, wordProgress, limit) {
  const now = Date.now();
  const due = [], fresh = [], untracked = [], scheduled = [];
  exercises.forEach((ex) => {
    if (ex.wordId == null) { untracked.push(ex); return; }
    const p = wordProgress[ex.wordId];
    if (!p) { fresh.push(ex); return; }
    if (p.nextReviewAt && new Date(p.nextReviewAt).getTime() <= now) due.push(ex);
    else scheduled.push(ex);
  });
  due.sort((a, b) => new Date(wordProgress[a.wordId].nextReviewAt) - new Date(wordProgress[b.wordId].nextReviewAt));

  const seen = new Set();
  const firstPerWord = [], repeats = [];
  shuffle(fresh).forEach((ex) => {
    if (seen.has(ex.wordId)) repeats.push(ex);
    else { seen.add(ex.wordId); firstPerWord.push(ex); }
  });

  const pool = [...due, ...firstPerWord, ...repeats, ...shuffle(untracked), ...shuffle(scheduled)];
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

  const path = computePath(content, state.user.username);
  const node = path.bySlug.get(slug);
  if (node && !node.unlocked) {
    app.innerHTML = '';
    app.appendChild(el(`
      <div class="card">
        <h1>🔒 ${escapeHtml(category.name)}</h1>
        <p class="muted">Deze les is nog vergrendeld. ${escapeHtml(lockReason(path, slug))}</p>
        <a href="#/dashboard">Terug naar lessen</a>
      </div>
    `));
    return;
  }

  const wordProgress = Storage.loadWordProgress(state.user.username);
  const items = pickBatch(exercises, wordProgress, 10).map((ex) => withGrammarRule(content, ex));

  const session = { category, items, index: 0, correctCount: 0 };
  renderExercise(session);
}

function gradeAndRecord(ex) {
  return (chosenValue) => {
    const isCorrect = normalizeAnswer(chosenValue) === normalizeAnswer(ex.correctAnswer);
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

function renderSentenceBuild(ex, container, onSubmit, { submitLabel = 'Controleren' } = {}) {
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
      const submitBtn = el(`<button type="button" class="primary" style="margin-top:14px">${escapeHtml(submitLabel)}</button>`);
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

// Everything above the answer controls: reading passage, listening button,
// the prompt itself. Shared by lessons and exams.
function renderExerciseHead(ex, { showContextText = true } = {}) {
  const head = el(`<div class="exercise-head"></div>`);
  if (ex.type === 'reading' && ex.context) {
    const passage = el(`<div class="reading-passage"><div class="reading-label">Lees de tekst</div><p></p></div>`);
    passage.querySelector('p').textContent = ex.context;
    const speak = renderSpeakButton(ex.context, '🔊 Voorlezen');
    if (speak) passage.appendChild(speak);
    head.appendChild(passage);
  }
  if (ex.type === 'listen' && ex.context) {
    const box = el(`<div class="listen-box"><div class="reading-label">Luisteroefening</div></div>`);
    const speak = renderSpeakButton(ex.context, '🔊 Speel de zin af');
    if (speak) {
      speak.classList.add('listen-play');
      box.appendChild(speak);
    } else {
      box.appendChild(el(`<p class="muted">Spraaksynthese is niet beschikbaar in deze browser; de zin staat hieronder.</p>`));
      showContextText = true;
    }
    if (showContextText) {
      const txt = el(`<p class="listen-text"></p>`);
      txt.textContent = ex.context;
      box.appendChild(txt);
    }
    head.appendChild(box);
  }
  const promptRow = el(`<div class="prompt-row"><h2></h2></div>`);
  promptRow.querySelector('h2').textContent = ex.prompt;
  if (ex.type !== 'listen' && ex.type !== 'reading') {
    const speakBtn = renderSpeakButton(extractSpeakText(ex));
    if (speakBtn) promptRow.appendChild(speakBtn);
  }
  head.appendChild(promptRow);
  return head;
}

function renderExercise(session) {
  const ex = session.items[session.index];
  app.innerHTML = '';
  const wrapper = el(`
    <div class="card">
      <div class="exercise-progress">${escapeHtml(session.category.name)} &middot; vraag ${session.index + 1} van ${session.items.length}</div>
      <div id="head"></div>
      <div id="options"></div>
      <div id="feedback"></div>
    </div>
  `);
  app.appendChild(wrapper);
  wrapper.querySelector('#head').replaceWith(renderExerciseHead(ex, { showContextText: false }));
  if (ex.type === 'listen') speakRussian(ex.context);

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
        ${ex.type === 'listen' && ex.context ? `<div class="listen-reveal">Je hoorde: <strong>${escapeHtml(ex.context)}</strong></div>` : ''}
        <div class="explanation">${escapeHtml(ex.explanation)}</div>
        <div id="example-slot"></div>
        ${ex.grammarRule ? `<div class="grammar-rule"><strong>${escapeHtml(ex.grammarRule.title)}:</strong> ${escapeHtml(ex.grammarRule.explanation)}</div>` : ''}
        <div id="ai-explain-slot"></div>
      </div>
    `);
    const exampleBlock = renderExampleBlock(ex.example);
    if (exampleBlock) fb.querySelector('#example-slot').replaceWith(exampleBlock);
    feedbackDiv.appendChild(fb);

    if (!isCorrect && navigator.onLine) {
      fb.querySelector('#ai-explain-slot').appendChild(renderAiExplainButton(ex.id, chosenAnswer));
    }

    const nextBtn = el(`<button class="primary" style="margin-top:14px">${session.index + 1 < session.items.length ? 'Volgende' : 'Klaar'}</button>`);
    nextBtn.addEventListener('click', () => {
      session.index += 1;
      if (session.index < session.items.length) renderExercise(session);
      else renderLessonComplete(session);
    });
    feedbackDiv.appendChild(nextBtn);
  }

  renderAnswerControls(ex, optionsDiv, (value) => afterAnswer(record(value), value));
}

// The answer widget for any exercise type: chips, multiple choice or a text box.
function renderAnswerControls(ex, container, onAnswer, { submitLabel = 'Controleren' } = {}) {
  if (ex.type === 'sentence_build' && ex.options && ex.options.length) {
    renderSentenceBuild(ex, container, onAnswer, { submitLabel });
  } else if (ex.options && ex.options.length) {
    for (const opt of ex.options) {
      const btn = el(`<button class="option-btn" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`);
      btn.addEventListener('click', () => onAnswer(opt));
      container.appendChild(btn);
    }
  } else {
    const form = el(`
      <form class="typing-form">
        <input type="text" class="typing-answer" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ru" placeholder="Typ hier in het Russisch…" required />
        <button type="submit" class="primary" style="margin-top:10px;width:fit-content">${escapeHtml(submitLabel)}</button>
      </form>
    `);
    container.appendChild(form);
    const input = form.querySelector('input');
    setTimeout(() => input.focus(), 0);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value;
      container.querySelectorAll('input,button').forEach((n) => (n.disabled = true));
      onAnswer(value);
    });
  }
}

function renderAiExplainButton(exerciseId, givenAnswer) {
  const slot = el(`<div class="ai-slot"></div>`);
  const aiBtn = el(`<button type="button" class="ai-btn">🤖 Vraag AI om een diepere uitleg</button>`);
  aiBtn.addEventListener('click', async () => {
    aiBtn.disabled = true;
    aiBtn.textContent = '🤖 Even denken…';
    try {
      const data = await api('/ai/explain', { method: 'POST', body: { exerciseId, givenAnswer } });
      slot.appendChild(el(`<div class="ai-explanation"><strong>🤖 AI-uitleg</strong><p>${escapeHtml(data.explanation)}</p></div>`));
      aiBtn.remove();
    } catch (err) {
      aiBtn.disabled = false;
      aiBtn.textContent = '🤖 Vraag AI om een diepere uitleg';
      slot.appendChild(el(`<p class="error-message">${escapeHtml(err.message)}</p>`));
    }
  });
  slot.appendChild(aiBtn);
  return slot;
}

function renderLessonComplete(session) {
  app.innerHTML = '';
  const pct = Math.round((session.correctCount / session.items.length) * 100);
  const isPractice = session.category.slug === '__mistakes__';
  app.appendChild(el(`
    <div class="card">
      <h1>${isPractice ? 'Foutenronde afgerond' : 'Les afgerond'}</h1>
      <p>Je had ${session.correctCount} van de ${session.items.length} vragen goed (${pct}%).</p>
      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
        <button class="primary" id="again-btn">Nog een keer</button>
        <button class="secondary" id="back-btn">Terug naar lessen</button>
      </div>
    </div>
  `));
  document.getElementById('again-btn').addEventListener('click', () => (isPractice ? renderMistakesPractice() : renderLesson(session.category.slug)));
  document.getElementById('back-btn').addEventListener('click', () => { location.hash = '#/dashboard'; });
}

// ---------- "Oefen je fouten": a session built from this device's mistake log ----------

// Exercises answered wrongly on this device, the ones missed most often (and
// most recently) first. An exercise drops off the list once its last answer
// here was correct -- so the list shrinks as you fix things.
function mistakeExercises(content, username) {
  const log = Storage.loadAttemptsLog(username); // newest first
  const stats = new Map();
  const lastOutcome = new Map();
  for (const a of log) {
    if (!lastOutcome.has(a.exerciseId)) lastOutcome.set(a.exerciseId, a.isCorrect);
    if (a.isCorrect) continue;
    const s = stats.get(a.exerciseId) || { count: 0, last: a.at };
    s.count++;
    stats.set(a.exerciseId, s);
  }
  const byId = new Map(content.exercises.map((e) => [e.id, e]));
  return [...stats.entries()]
    .filter(([id]) => byId.has(id) && lastOutcome.get(id) === false)
    .sort((a, b) => b[1].count - a[1].count || (b[1].last > a[1].last ? 1 : -1))
    .map(([id]) => byId.get(id));
}

async function renderMistakesPractice() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const pool = mistakeExercises(content, state.user.username);
  if (!pool.length) {
    app.innerHTML = '';
    app.appendChild(el(`
      <div class="card">
        <h1>Oefen je fouten</h1>
        <p class="muted">Geen openstaande fouten op dit toestel: alles wat je fout had, heb je daarna goed beantwoord. Mooi zo.</p>
        <a href="#/dashboard">Terug naar lessen</a>
      </div>
    `));
    return;
  }
  const items = pool.slice(0, 10).map((ex) => withGrammarRule(content, ex));
  renderExercise({ category: { slug: '__mistakes__', name: 'Oefen je fouten' }, items, index: 0, correctCount: 0 });
}

// ---------- level exams (online only: graded on the server) ----------

async function renderExam(level) {
  app.innerHTML = '';
  if (!LEVEL_ORDER.includes(level)) {
    app.appendChild(el(`<div class="card"><h1>Onbekend niveau</h1><a href="#/dashboard">Terug naar lessen</a></div>`));
    return;
  }
  const content = await ensureContentLoaded();
  if (content) {
    const levelState = computePath(content, state.user.username).byLevel.get(level);
    if (levelState && !levelState.unlocked) {
      app.appendChild(el(`
        <div class="card">
          <h1>🔒 Niveautoets ${level}</h1>
          <p class="muted">Niveau ${level} is nog vergrendeld. Rond eerst niveau ${levelState.prevLevel} af: maak de toets van ${levelState.prevLevel}, of oefen alle lessen van dat niveau.</p>
          <a href="#/dashboard">Terug naar lessen</a>
        </div>
      `));
      return;
    }
  }
  if (!navigator.onLine) {
    app.appendChild(el(`
      <div class="card">
        <h1>Niveautoets ${level}</h1>
        <p class="muted">Toetsen worden op de server nagekeken en zijn daarom alleen online beschikbaar. De lessen zelf werken wel offline.</p>
        <a href="#/dashboard">Terug naar lessen</a>
      </div>
    `));
    return;
  }

  app.appendChild(el(`<div class="card"><p class="muted">Toets laden…</p></div>`));
  let info;
  try {
    const data = await api('/exams');
    info = data.levels.find((l) => l.level === level);
  } catch (err) {
    app.innerHTML = '';
    app.appendChild(el(`<div class="card"><p class="error-message">${escapeHtml(err.message)}</p><a href="#/dashboard">Terug naar lessen</a></div>`));
    return;
  }

  app.innerHTML = '';
  const intro = el(`
    <div class="card exam-intro">
      <div class="exam-intro-head">
        <span class="level-code big">${level}</span>
        <div>
          <h1>Niveautoets ${level} — ${escapeHtml(info.title)}</h1>
          <p class="muted">${escapeHtml(info.description)}</p>
        </div>
      </div>
      <ul class="exam-facts">
        <li><strong>${info.questionCount}</strong> vragen, willekeurig gekozen uit alle ${info.categories} lessen van ${level}</li>
        <li>Alle oefenvormen komen voor: woorden, grammatica, typen, zinnen bouwen, luisteren en lezen</li>
        <li>Je ziet pas aan het eind hoe je het deed — mét uitleg bij elke fout</li>
        <li>Geslaagd bij <strong>${info.passPct}%</strong> of hoger: dan is niveau ${level} afgesloten (+150 XP)</li>
        ${info.attempts ? `<li>Eerder gemaakt: ${info.attempts}× &middot; beste score ${info.bestScorePct}%${info.passed ? ` &middot; behaald op ${escapeHtml(String(info.passedAt).slice(0, 10))}` : ''}</li>` : ''}
      </ul>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
        <button class="primary" id="start-exam">${info.passed ? 'Opnieuw maken' : 'Start de toets'}</button>
        <button class="secondary" id="back-btn">Terug naar lessen</button>
      </div>
    </div>
  `);
  app.appendChild(intro);
  intro.querySelector('#back-btn').addEventListener('click', () => { location.hash = '#/dashboard'; });
  intro.querySelector('#start-exam').addEventListener('click', async () => {
    intro.querySelector('#start-exam').disabled = true;
    try {
      const exam = await api(`/exams/${level}`);
      runExam(exam);
    } catch (err) {
      intro.appendChild(el(`<p class="error-message">${escapeHtml(err.message)}</p>`));
      intro.querySelector('#start-exam').disabled = false;
    }
  });
}

function runExam(exam) {
  const answers = new Map();
  let index = 0;

  function showQuestion() {
    const q = exam.questions[index];
    app.innerHTML = '';
    const wrapper = el(`
      <div class="card exam-question">
        <div class="exercise-progress">
          <span>Niveautoets ${exam.level} &middot; vraag ${index + 1} van ${exam.questions.length}</span>
          <span class="muted">${escapeHtml(q.category.name)}</span>
        </div>
        <div class="progress-bar exam-bar"><div class="progress-bar-fill" style="width:${Math.round((index / exam.questions.length) * 100)}%"></div></div>
        <div id="head"></div>
        <div id="options"></div>
        <div id="actions"></div>
      </div>
    `);
    app.appendChild(wrapper);
    wrapper.querySelector('#head').replaceWith(renderExerciseHead(q, { showContextText: false }));
    if (q.type === 'listen') speakRussian(q.context);

    const optionsDiv = wrapper.querySelector('#options');
    const actions = wrapper.querySelector('#actions');
    const isLast = index === exam.questions.length - 1;

    function commit(value) {
      answers.set(q.id, value);
      optionsDiv.querySelectorAll('.option-btn').forEach((b) => {
        b.classList.toggle('selected', b.dataset.value === value);
      });
      actions.innerHTML = '';
      const next = el(`<button class="primary" style="margin-top:14px">${isLast ? 'Toets inleveren' : 'Volgende'}</button>`);
      next.addEventListener('click', () => {
        if (isLast) submitExam();
        else { index++; showQuestion(); }
      });
      actions.appendChild(next);
    }

    if (q.type !== 'sentence_build' && q.options && q.options.length) {
      // multiple choice: selecting is not final until "Volgende", so you can change your mind
      for (const opt of q.options) {
        const btn = el(`<button class="option-btn" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`);
        btn.addEventListener('click', () => commit(opt));
        optionsDiv.appendChild(btn);
      }
    } else {
      renderAnswerControls(q, optionsDiv, commit, { submitLabel: 'Antwoord vastleggen' });
    }
  }

  async function submitExam() {
    app.innerHTML = '';
    app.appendChild(el(`<div class="card"><p class="muted">Nakijken…</p></div>`));
    try {
      const payload = exam.questions.map((q) => ({ exerciseId: q.id, answer: answers.get(q.id) || '' }));
      const result = await api(`/exams/${exam.level}/submit`, { method: 'POST', body: { answers: payload } });
      await pullStats().catch(() => {});
      renderNav();
      renderExamResult(result);
    } catch (err) {
      app.innerHTML = '';
      app.appendChild(el(`<div class="card"><p class="error-message">${escapeHtml(err.message)}</p><a href="#/dashboard">Terug naar lessen</a></div>`));
    }
  }

  showQuestion();
}

function renderExamResult(result) {
  app.innerHTML = '';
  const wrong = result.review.filter((r) => !r.isCorrect);
  const summary = el(`
    <div class="card exam-result ${result.passed ? 'passed' : 'failed'}">
      <div class="exam-score">
        <div class="exam-score-ring"><span>${result.pct}%</span></div>
        <div>
          <h1>${result.passed ? `Geslaagd voor niveau ${result.level}!` : `Nog niet geslaagd voor ${result.level}`}</h1>
          <p>${result.score} van de ${result.total} vragen goed (grens: ${result.passPct}%).
          ${result.passed
            ? (result.newlyCertified ? ` Niveau ${result.level} is nu afgesloten: +150 XP en een badge.` : ` Je had dit niveau al behaald — mooi bevestigd.`)
            : ' Bekijk hieronder per les waar het misging, oefen die lessen en probeer het opnieuw.'}</p>
        </div>
      </div>
      <h2>Per les</h2>
      <div class="exam-breakdown"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
        <button class="primary" id="retry-btn">${result.passed ? 'Nog een keer' : 'Opnieuw proberen'}</button>
        <button class="secondary" id="back-btn">Terug naar lessen</button>
      </div>
    </div>
  `);
  const breakdown = summary.querySelector('.exam-breakdown');
  for (const c of result.perCategory) {
    const pct = Math.round((c.correct / c.total) * 100);
    const row = el(`
      <a class="breakdown-row ${pct === 100 ? 'ok' : pct < 50 ? 'bad' : 'meh'}" href="#/lesson/${escapeHtml(c.slug)}">
        <span class="breakdown-name">${escapeHtml(c.name)}</span>
        <span class="breakdown-score">${c.correct}/${c.total}</span>
        <span class="breakdown-bar"><span style="width:${pct}%"></span></span>
      </a>
    `);
    breakdown.appendChild(row);
  }
  summary.querySelector('#retry-btn').addEventListener('click', () => renderExam(result.level));
  summary.querySelector('#back-btn').addEventListener('click', () => { location.hash = '#/dashboard'; });
  app.appendChild(summary);

  const reviewCard = el(`
    <div class="card">
      <h2>${wrong.length ? `Wat ging er mis (${wrong.length})` : 'Alles goed — geen fouten om te bespreken'}</h2>
      <p class="muted">${wrong.length ? 'Per vraag: jouw antwoord, het juiste antwoord, de uitleg en de grammaticaregel erachter. Vraag de AI om een uitleg die ingaat op jóuw fout.' : ''}</p>
      <div class="review-list"></div>
      ${result.review.length > wrong.length ? `<button type="button" class="secondary" id="show-all" style="margin-top:12px">Ook de goede antwoorden tonen</button>` : ''}
    </div>
  `);
  const list = reviewCard.querySelector('.review-list');
  function renderReviewItem(r) {
    const item = el(`
      <div class="review-item ${r.isCorrect ? 'correct' : 'incorrect'}">
        <div class="review-meta"><span class="level-badge">${escapeHtml(r.category.name)}</span><span class="muted">${r.isCorrect ? '✓ goed' : '✗ fout'}</span></div>
        ${r.context ? `<p class="review-context"></p>` : ''}
        <p class="review-prompt"></p>
        <div class="review-answers">
          <div><span class="muted">Jouw antwoord:</span> <strong class="given"></strong></div>
          ${r.isCorrect ? '' : `<div><span class="muted">Juist:</span> <strong class="correct-answer"></strong></div>`}
        </div>
        <div class="explanation"></div>
        <div class="example-slot"></div>
        ${r.grammarRule ? `<div class="grammar-rule"><strong>${escapeHtml(r.grammarRule.title)}:</strong> ${escapeHtml(r.grammarRule.explanation)}${r.grammarRule.example ? `<div class="muted" style="margin-top:6px">Voorbeeld: ${escapeHtml(r.grammarRule.example)}</div>` : ''}</div>` : ''}
        <div class="ai-slot-holder"></div>
      </div>
    `);
    if (r.context) item.querySelector('.review-context').textContent = r.context;
    item.querySelector('.review-prompt').textContent = r.prompt;
    item.querySelector('.given').textContent = r.given || '(geen antwoord)';
    if (!r.isCorrect) item.querySelector('.correct-answer').textContent = r.correctAnswer;
    item.querySelector('.explanation').textContent = r.explanation;
    const exampleBlock = renderExampleBlock(r.example);
    if (exampleBlock) item.querySelector('.example-slot').replaceWith(exampleBlock);
    if (!r.isCorrect && navigator.onLine) item.querySelector('.ai-slot-holder').appendChild(renderAiExplainButton(r.exerciseId, r.given));
    return item;
  }
  wrong.forEach((r) => list.appendChild(renderReviewItem(r)));
  const showAll = reviewCard.querySelector('#show-all');
  if (showAll) {
    showAll.addEventListener('click', () => {
      result.review.filter((r) => r.isCorrect).forEach((r) => list.appendChild(renderReviewItem(r)));
      showAll.remove();
    });
  }
  app.appendChild(reviewCard);
  window.scrollTo({ top: 0 });
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

  app.appendChild(renderReminderCard());

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

    // certifications: one row per CEFR level, from the last synced stats
    const certByLevel = Object.fromEntries((stats.certifications || []).map((c) => [c.level, c]));
    const levels = levelsOf(content);
    const certCard = el(`<div class="card"><h2>Niveautoetsen</h2><p class="muted">Sluit elk niveau af met een toets van 30 vragen (80% om te slagen). Alleen online.</p><div class="cert-grid"></div></div>`);
    const grid = certCard.querySelector('.cert-grid');
    levels.forEach(({ level, title }) => {
      const cert = certByLevel[level];
      const tile = el(`
        <a class="cert-tile ${cert ? 'passed' : ''}" href="#/exam/${level}">
          <div class="cert-level">${level}</div>
          <div class="cert-title">${escapeHtml(title)}</div>
          <div class="cert-status">${cert ? `🎓 behaald (${cert.score}/${cert.total}) &middot; ${escapeHtml(String(cert.passedAt).slice(0, 10))}` : 'nog niet behaald'}</div>
        </a>
      `);
      grid.appendChild(tile);
    });
    app.appendChild(certCard);

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

  const catCard = el(`<div class="card"><h2>Voortgang per les</h2><div class="table-scroll"><table><thead><tr><th>Niveau</th><th>Les</th><th>Gestart</th><th>Onder de knie</th></tr></thead><tbody id="cat-body"></tbody></table></div></div>`);
  app.appendChild(catCard);
  const catBody = catCard.querySelector('#cat-body');
  for (const cat of content.categories) {
    const s = categoryStats(username, content, cat.slug);
    if (!s.totalWords) continue;
    catBody.appendChild(el(`<tr><td>${escapeHtml(cat.level)}</td><td>${escapeHtml(cat.name)}</td><td>${s.startedWords}/${s.totalWords}</td><td>${s.masteredWords}/${s.totalWords}</td></tr>`));
  }

  // The local attempt log stores the wording of an exercise as it was when
  // it was answered. Show the *current* wording from the content bundle
  // instead (falling back to the stored copy for exercises that no longer
  // exist), so a corrected question doesn't keep haunting the history in
  // its old form.
  const exById = new Map(content.exercises.map((e) => [e.id, e]));
  const current = (m) => {
    const ex = exById.get(m.exerciseId);
    return ex ? { ...m, prompt: ex.prompt, correctAnswer: ex.correctAnswer, explanation: ex.explanation } : m;
  };
  const mistakes = attemptsLog.filter((a) => !a.isCorrect).map(current);
  const missedCounts = {};
  mistakes.forEach((m) => { missedCounts[m.exerciseId] = (missedCounts[m.exerciseId] || { ...m, count: 0 }); missedCounts[m.exerciseId].count++; });
  const topMissed = Object.values(missedCounts).sort((a, b) => b.count - a.count).slice(0, 10);

  const missedCard = el(`<div class="card"><h2>Vaakst fout beantwoord <span class="muted" style="font-weight:400;font-size:0.8rem">(dit toestel)</span></h2></div>`);
  const openMistakes = mistakeExercises(content, username).length;
  if (openMistakes) {
    const btn = el(`<button type="button" class="primary" style="margin-bottom:14px">🎯 Oefen je fouten (${openMistakes})</button>`);
    btn.addEventListener('click', () => { location.hash = '#/practice'; });
    missedCard.appendChild(btn);
  }
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

// ---------- daily reminder (Web Push) ----------

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// iOS only allows Web Push for a PWA opened from the home screen (16.4+);
// in the Safari tab itself PushManager simply doesn't exist.
function isIosBrowserTab() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  return ios && !standalone;
}

async function currentPushSubscription() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

function renderReminderCard() {
  const card = el(`
    <div class="card reminder-card">
      <h2>🔔 Dagelijkse herinnering</h2>
      <p class="muted">Een melding op dit toestel op een vast tijdstip — alleen op dagen dat je nog niet geoefend hebt, zodat je reeks niet breekt.</p>
      <div id="reminder-body"></div>
    </div>
  `);
  const body = card.querySelector('#reminder-body');

  if (!pushSupported()) {
    body.appendChild(el(`<p class="muted">${isIosBrowserTab()
      ? 'Op iPhone/iPad werken meldingen alleen in de geïnstalleerde app: tik in Safari op Delen → "Zet op beginscherm" en open de app vanaf je beginscherm (iOS 16.4 of nieuwer).'
      : 'Deze browser ondersteunt geen pushmeldingen.'}</p>`));
    return card;
  }
  if (!navigator.onLine) {
    body.appendChild(el(`<p class="muted">Je bent offline; de herinnering instellen kan alleen online.</p>`));
    return card;
  }

  body.appendChild(el(`<p class="muted">Laden…</p>`));
  (async () => {
    let sub = null;
    let status = { subscribed: false, settings: null };
    try {
      sub = await currentPushSubscription();
      if (sub) status = await api(`/push/status?endpoint=${encodeURIComponent(sub.endpoint)}`);
    } catch (err) {
      /* fall through: show the form */
    }
    const active = !!(sub && status.subscribed && status.settings && status.settings.enabled);
    const time = (status.settings && status.settings.reminderTime) || '19:00';
    body.innerHTML = '';
    body.appendChild(el(`
      <div class="reminder-row">
        <label for="reminder-time">Tijdstip</label>
        <input type="time" id="reminder-time" value="${time}" />
        <button type="button" class="${active ? 'secondary' : 'primary'}" id="reminder-toggle">${active ? 'Herinnering uitzetten' : 'Herinnering aanzetten'}</button>
        ${active ? `<button type="button" class="secondary" id="reminder-save">Tijd opslaan</button><button type="button" class="secondary" id="reminder-test">Testmelding</button>` : ''}
      </div>
      <p class="muted reminder-status">${active ? `Aan — dagelijks om ${time} (${escapeHtml(status.settings.timeZone)}).` : Notification.permission === 'denied' ? 'Meldingen zijn voor deze site geblokkeerd; sta ze toe in de browser-/systeeminstellingen.' : 'Uit.'}</p>
    `));
    const statusLine = body.querySelector('.reminder-status');
    const timeInput = body.querySelector('#reminder-time');
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'Europe/Amsterdam';

    async function subscribeNow() {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Geen toestemming voor meldingen gegeven.');
      const reg = await navigator.serviceWorker.ready;
      let s = await reg.pushManager.getSubscription();
      if (!s) {
        const { publicKey } = await api('/push/vapid-public-key');
        s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      }
      await api('/push/subscribe', { method: 'POST', body: { subscription: s.toJSON(), reminderTime: timeInput.value || '19:00', timeZone: tz } });
    }

    body.querySelector('#reminder-toggle').addEventListener('click', async () => {
      statusLine.textContent = 'Bezig…';
      try {
        if (active) {
          const s = await currentPushSubscription();
          if (s) {
            await api('/push/unsubscribe', { method: 'POST', body: { endpoint: s.endpoint } });
            await s.unsubscribe();
          }
        } else {
          await subscribeNow();
        }
        card.replaceWith(renderReminderCard());
      } catch (err) {
        statusLine.textContent = err.message;
      }
    });
    const saveBtn = body.querySelector('#reminder-save');
    if (saveBtn) saveBtn.addEventListener('click', async () => {
      statusLine.textContent = 'Opslaan…';
      try { await subscribeNow(); card.replaceWith(renderReminderCard()); } catch (err) { statusLine.textContent = err.message; }
    });
    const testBtn = body.querySelector('#reminder-test');
    if (testBtn) testBtn.addEventListener('click', async () => {
      statusLine.textContent = 'Testmelding versturen…';
      try {
        const s = await currentPushSubscription();
        await api('/push/test', { method: 'POST', body: { endpoint: s.endpoint } });
        statusLine.textContent = 'Verstuurd — hij verschijnt binnen enkele seconden.';
      } catch (err) { statusLine.textContent = err.message; }
    });
  })();
  return card;
}

// ---------- leaderboard (live only: ranking across accounts needs the server) ----------

const MEDALS = ['🥇', '🥈', '🥉'];

async function renderLeaderboard() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div>
      <h1>Ranglijst</h1>
      <p class="muted">Vergelijk je voortgang met andere leerlingen. XP telt goede antwoorden (10) én behaalde niveautoetsen (150). Dit overzicht vraagt een internetverbinding.</p>
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
            <thead><tr><th>#</th><th>Gebruiker</th><th>Toets</th><th>Niveau</th><th>XP</th><th>Reeks</th><th>Woorden</th></tr></thead>
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
          <td>${entry.highestLevel ? `🎓 ${escapeHtml(entry.highestLevel)}` : '<span class="muted">—</span>'}</td>
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
