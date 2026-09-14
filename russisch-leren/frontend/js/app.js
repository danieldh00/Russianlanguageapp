const state = { user: null, syncing: false, pendingCount: 0 };
let syncInFlight = false;

// the content bundle shape this client understands (see /api/content)
const CONTENT_SCHEMA_VERSION = 5;

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

// Speech settings live on the device (Instellingen): normal rate, slow rate
// (for hearing each sound and the stressed syllable) and a preferred voice.
const SPEECH_DEFAULTS = { rate: 0.9, slowRate: 0.55, voiceURI: '' };
function speechSettings() {
  return { ...SPEECH_DEFAULTS, ...(Storage.loadSettings().speech || {}) };
}
function saveSpeechSettings(patch) {
  const all = Storage.loadSettings();
  all.speech = { ...speechSettings(), ...patch };
  Storage.saveSettings(all);
}
// ---------- which lesson parts and tools this device shows ----------
//
// Two separate ideas, deliberately kept apart:
//  - "onderdelen": a lasting choice per device. Handwriting on a phone is
//    hopeless, so it should be possible to hide it there and keep it on the
//    tablet, without that choice following the account around.
//  - "stille modus": a right-now choice, switched from inside the lesson.
//    You are on the train, you cannot speak or hear, and the session should
//    just step around those exercises until you say otherwise.

const LESSON_PARTS = [
  { id: 'mc', icon: '🔤', label: 'Meerkeuze', types: ['mc', 'mc_ru_nl', 'mc_nl_ru'], desc: 'Kies het juiste woord uit de opties, Russisch → Nederlands en omgekeerd.' },
  { id: 'typing', icon: '⌨️', label: 'Typen', types: ['typing'], desc: 'Typ het Russische woord zelf. Vraagt een Russisch toetsenbord op je toestel.' },
  { id: 'cloze', icon: '✏️', label: 'Gatenzinnen', types: ['cloze'], desc: 'Vul het ontbrekende woord in de voorbeeldzin in, in de vorm die de zin vraagt.' },
  { id: 'sentence', icon: '🧩', label: 'Zinnen bouwen', types: ['sentence_build'], desc: 'Zet losse woorden in de juiste volgorde.' },
  { id: 'listen', icon: '🎧', label: 'Luisteren', types: ['listen'], desc: 'Een zin wordt voorgelezen en jij bouwt hem na. Heeft geluid nodig.' },
  { id: 'reading', icon: '📄', label: 'Lezen', types: ['reading'], desc: 'Een korte tekst met een vraag erover.' },
  { id: 'picture', icon: '🖼️', label: 'Plaatjes', types: ['picture', 'picture_choice'], desc: 'Welk woord hoort bij het plaatje, en welk plaatje bij het woord.' },
  { id: 'stress', icon: '🎵', label: 'Klemtoon', types: ['stress'], desc: 'Kies op welke lettergreep de klemtoon ligt.' }
];

const TOOL_TILES = [
  { id: 'dialogue', icon: '🗣️', label: 'Gesprek oefenen' },
  { id: 'match', icon: '🃏', label: 'Koppelspel' },
  { id: 'dictation', icon: '🔢', label: 'Getallen & tijd' },
  { id: 'phrasebook', icon: '📕', label: 'Zakboekje' },
  { id: 'stories', icon: '📖', label: 'Leesverhalen' },
  { id: 'keyboard', icon: '⌨️', label: 'Toetsenbord ЙЦУКЕН' },
  { id: 'handwriting', icon: '✍️', label: 'Schrijven met de hand' }
];

const PART_OF_TYPE = new Map();
for (const part of LESSON_PARTS) for (const t of part.types) PART_OF_TYPE.set(t, part.id);

function partSettings() {
  const saved = Storage.loadSettings().parts || {};
  const out = {};
  for (const p of LESSON_PARTS) out[p.id] = saved[p.id] !== false; // default on
  return out;
}
function savePartSettings(patch) {
  const all = Storage.loadSettings();
  all.parts = { ...partSettings(), ...patch };
  Storage.saveSettings(all);
}
function toolSettings() {
  const saved = Storage.loadSettings().tools || {};
  const out = {};
  for (const t of TOOL_TILES) out[t.id] = saved[t.id] !== false;
  return out;
}
function saveToolSettings(patch) {
  const all = Storage.loadSettings();
  all.tools = { ...toolSettings(), ...patch };
  Storage.saveSettings(all);
}
function toolEnabled(id) {
  return toolSettings()[id] !== false;
}

const QUIET_DEFAULTS = { noListen: false, noSpeak: false };
function quietSettings() {
  return { ...QUIET_DEFAULTS, ...(Storage.loadSettings().quiet || {}) };
}
function saveQuietSettings(patch) {
  const all = Storage.loadSettings();
  all.quiet = { ...quietSettings(), ...patch };
  Storage.saveSettings(all);
}
function micAvailable() {
  return !quietSettings().noSpeak;
}

// An exercise type is shown when its part is on AND quiet mode does not rule
// it out. Types this table does not know (new content, older cached bundle)
// are always allowed, so an unknown type can never make a lesson disappear.
function exerciseTypeAllowed(type) {
  const partId = PART_OF_TYPE.get(type);
  if (!partId) return true;
  if (partId === 'listen' && quietSettings().noListen) return false;
  return partSettings()[partId] !== false;
}
function allowedExercises(list) {
  return list.filter((ex) => exerciseTypeAllowed(ex.type));
}
// Names of the parts that are switched off, for the "nothing left" message.
function disabledPartLabels() {
  const parts = partSettings();
  const quiet = quietSettings();
  return LESSON_PARTS.filter((p) => parts[p.id] === false || (p.id === 'listen' && quiet.noListen)).map((p) => p.label);
}

// The two switches in the lesson header. Flipping one re-filters the rest of
// the session straight away, so it takes effect on the very next question.
function renderQuietBar(onChange) {
  const quiet = quietSettings();
  const bar = el(`<div class="quiet-bar"></div>`);
  const chip = (key, onLabel, offLabel, title) => {
    const active = quiet[key];
    const btn = el(`<button type="button" class="quiet-chip ${active ? 'active' : ''}" title="${escapeHtml(title)}" aria-pressed="${active}"></button>`);
    btn.textContent = active ? onLabel : offLabel;
    btn.addEventListener('click', () => {
      saveQuietSettings({ [key]: !active });
      onChange();
    });
    bar.appendChild(btn);
  };
  chip('noListen', '🔇 Luisteren staat uit', '🎧 Even niet luisteren',
    'Slaat luisteroefeningen over en speelt niets vanzelf af. De knoppen om zelf iets af te spelen blijven staan.');
  chip('noSpeak', '🙊 Spreken staat uit', '🎤 Even niet praten',
    'Verbergt de microfoonknoppen en "Zeg het na".');
  return bar;
}

function russianVoices() {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter((v) => /^ru/i.test(v.lang));
}
function pickVoice() {
  const voices = russianVoices();
  if (!voices.length) return null;
  const { voiceURI } = speechSettings();
  return voices.find((v) => v.voiceURI === voiceURI) || voices.find((v) => v.localService) || voices[0];
}

function speakRussian(text, { slow = false } = {}) {
  if (!text || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/́/g, ''));
    utterance.lang = 'ru-RU';
    const s = speechSettings();
    utterance.rate = slow ? s.slowRate : s.rate;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    /* Web Speech API not available or blocked -- listening is a bonus, not required */
  }
}

// A listen control: normal speed plus a 🐢 button for slow speech, where
// every sound and the stressed syllable are easy to pick out.
function renderSpeakButton(text, label = '🔊 Luister') {
  if (!text || !('speechSynthesis' in window)) return null;
  const group = el(`<span class="speak-group"></span>`);
  const btn = el(`<button type="button" class="speak-btn" aria-label="Luister naar de Russische uitspraak">${label}</button>`);
  btn.addEventListener('click', () => speakRussian(text));
  const slow = el(`<button type="button" class="speak-btn speak-slow" title="Langzaam" aria-label="Langzaam beluisteren">🐢</button>`);
  slow.addEventListener('click', () => speakRussian(text, { slow: true }));
  group.appendChild(btn);
  group.appendChild(slow);
  return group;
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
    await flushActivities();
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

// XP-earning activities that aren't exercise answers. Queued locally (so a
// keyboard round done offline still counts) and confirmed by the server,
// which decides the XP and marks the study day.
function recordActivity(kind, detail) {
  if (!state.user) return;
  Storage.enqueueActivity(state.user.username, { clientId: uuid(), kind, detail: detail || {}, clientTimestamp: new Date().toISOString() });
  syncAll();
}

async function flushActivities() {
  const username = state.user.username;
  const items = Storage.loadActivities(username);
  if (!items.length) return;
  const res = await api('/sync/activities', { method: 'POST', body: { events: items } });
  Storage.removeActivities(username, [...(res.accepted || []), ...(res.skipped || []), ...(res.failed || []).map((f) => f.clientId)]);
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
  { route: 'tools', label: 'Oefenen', icon: '✨' },
  { route: 'progress', label: 'Voortgang', icon: '📊' },
  { route: 'leaderboard', label: 'Ranglijst', icon: '🏆' },
  { route: 'settings', label: 'Instellingen', icon: '⚙️' }
];

function currentRouteSection() {
  const route = (location.hash || '#/dashboard').split('/')[1] || 'dashboard';
  // a lesson or exam screen is reached from, and belongs to, the "Lessen" tab
  if (['lesson', 'exam'].includes(route)) return 'dashboard';
  // every practice screen is reached from, and belongs to, the "Oefenen" tab
  if (['tools', 'practice', 'review', 'dialogue', 'keyboard', 'phrasebook', 'dictation', 'match', 'stories', 'story', 'handwriting'].includes(route)) return 'tools';
  return route;
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
  if (route === 'review') return renderReviewSession();
  if (route === 'dialogue') return param ? renderDialogue(param) : renderDialogueList();
  if (route === 'keyboard') return renderKeyboardTrainer();
  if (route === 'phrasebook') return renderPhrasebook();
  if (route === 'dictation') return renderDictation();
  if (route === 'match') return renderMatchGame();
  if (route === 'tools') return renderToolsMenu();
  if (route === 'stories') return renderStoryList();
  if (route === 'story') return renderStory(param);
  if (route === 'handwriting') return renderHandwriting();
  if (route === 'exam') return renderExam((param || '').toUpperCase());
  if (route === 'progress') return renderProgress();
  if (route === 'settings') return renderSettings();
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
      <p class="muted">Van A1 tot C2. Extra oefenvormen staan onder ✨ Oefenen.</p>
      <div class="level-jump" id="level-jump"></div>
      <div id="goal-slot"></div>
      <div id="practice-slot"></div>
      <div id="levels"></div>
    </div>
  `);
  app.innerHTML = '';
  app.appendChild(wrapper);

  // The lesson path is what this screen is for, so the practice tools moved
  // to their own tab. What stays here is only what is due today, as a single
  // line of chips: eight tiles pushed the first lesson off the screen.
  const openMistakes = mistakeExercises(content, username).length;
  const dueCount = dueWordIds(content, username).length;
  const strip = el(`<div class="daily-strip"></div>`);
  const chip = (cls, label, href, count) => {
    const a = el(`<a class="daily-chip ${cls}" href="${href}"></a>`);
    a.appendChild(document.createTextNode(label));
    if (count != null) a.appendChild(el(`<span class="daily-count">${count}</span>`));
    strip.appendChild(a);
  };
  if (dueCount) chip('due', '🔁 Herhalen', '#/review', dueCount);
  if (openMistakes) chip('mistakes', '🎯 Je fouten', '#/practice', openMistakes);
  chip('more', dueCount || openMistakes ? '✨ Meer oefenen' : '✨ Oefenen', '#/tools', null);
  wrapper.querySelector('#practice-slot').appendChild(strip);

  const goalCard = renderWeeklyGoalCard();
  if (goalCard) wrapper.querySelector('#goal-slot').appendChild(goalCard);

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

// ---------- "Oefenen": everything that is not the lesson path ----------

// One description of every practice tool, grouped, so the tab can render them
// and the dashboard can stay a lesson path. `id` is the switch in
// Instellingen; the two daily ones have none and can never be hidden.
function toolTiles(content, username) {
  const openMistakes = mistakeExercises(content, username).length;
  const dueCount = dueWordIds(content, username).length;
  const storiesRead = Object.keys(Storage.loadStories(username)).length;
  const storyTotal = (content.stories || []).length;

  const tiles = [
    { group: 'dag', cls: 'review-card', icon: '🔁', title: 'Vandaag herhalen',
      text: dueCount
        ? `${dueCount === 1 ? 'Eén woord is' : `${dueCount} woorden zijn`} aan herhaling toe, uit al je lessen samen. Dít is wat het laat beklijven.`
        : 'Niets aan herhaling toe — alles zit nog vers. Kom morgen terug of ga verder op het pad.',
      badge: dueCount || null, hash: dueCount ? '#/review' : '#/dashboard' },
    { group: 'dag', cls: 'practice-card', icon: '🎯', title: 'Oefen je fouten',
      text: openMistakes
        ? `${openMistakes === 1 ? 'Eén vraag die je fout had' : `${openMistakes} vragen die je fout had`} en nog niet hebt rechtgezet, de vaakst gemiste eerst.`
        : 'Niets open: alles wat je fout had, heb je daarna goed beantwoord.',
      badge: openMistakes || null, hash: openMistakes ? '#/practice' : '#/dashboard' },

    { group: 'spreken', id: 'dialogue', cls: 'dialogue-card', icon: '🗣️', title: 'Gesprek oefenen',
      text: 'Rollenspel met de AI: apotheek, hotel, politie, huurbaas… Jij typt of spreekt Russisch, de AI antwoordt in zijn rol en corrigeert je.', badge: null, hash: '#/dialogue' },
    { group: 'spreken', id: 'dictation', cls: 'dictation-card', icon: '🔢', title: 'Getallen & tijd',
      text: 'Luister naar prijzen, tijden, datums en telefoonnummers en typ wat je hoort — het eerste wat misgaat in een winkel of taxi.', badge: null, hash: '#/dictation' },

    { group: 'lezen', id: 'stories', cls: 'stories-card', icon: '📖', title: 'Leesverhalen',
      text: 'Korte verhalen van A1 tot C2. Tik op een zin voor de vertaling, op een woord voor de betekenis, en beantwoord daarna de begripsvragen.',
      badge: storyTotal ? `${storiesRead}/${storyTotal}` : null, hash: '#/stories', hide: !storyTotal },
    { group: 'lezen', id: 'phrasebook', cls: 'phrasebook-card', icon: '📕', title: 'Zakboekje',
      text: 'Per situatie de zinnen die je écht nodig hebt — apotheek, noodgeval, taxi, hotel — groot, met uitspraak, ook offline.', badge: null, hash: '#/phrasebook' },
    { group: 'lezen', id: 'match', cls: 'match-card', icon: '🃏', title: 'Koppelspel',
      text: 'Vijf Russische en vijf Nederlandse woorden: tik de paren bij elkaar, zo snel mogelijk. Telt mee voor je herhaling.', badge: null, hash: '#/match' },

    { group: 'schrijven', id: 'keyboard', cls: 'keyboard-card', icon: '⌨️', title: 'Toetsenbord ЙЦУКЕН',
      text: 'Leer blind typen op de Russische indeling: woorden en zinnen uit de lessen, met de toets die je zoekt uitgelicht.', badge: null, hash: '#/keyboard' },
    { group: 'schrijven', id: 'handwriting', cls: 'handwriting-card', icon: '✍️', title: 'Schrijven met de hand',
      text: 'Trek de Cyrillische letters na op het scherm. De app kijkt na hoe nauwkeurig je bent — schrijven laat de vorm pas echt beklijven.', badge: null, hash: '#/handwriting' }
  ];
  return tiles.filter((t) => !t.hide && (!t.id || toolEnabled(t.id)));
}

const TOOL_GROUPS = [
  { id: 'dag', title: 'Elke dag', desc: 'De twee rondes die je voortgang echt vasthouden.' },
  { id: 'spreken', title: 'Luisteren & spreken', desc: 'Oefenen met wat er in het echt op je afkomt.' },
  { id: 'lezen', title: 'Lezen & woorden', desc: 'Woordenschat en leestempo, ook zonder internet.' },
  { id: 'schrijven', title: 'Typen & schrijven', desc: 'Cyrillisch onder je vingers krijgen.' }
];

async function renderToolsMenu() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const tiles = toolTiles(content, state.user.username);

  app.innerHTML = '';
  const wrap = el(`
    <div>
      <h1>✨ Oefenen</h1>
      <p class="muted">Alles naast het lessenpad. Welke hiervan je ziet, bepaal je onder Instellingen → Lesonderdelen.</p>
      <div id="tool-groups"></div>
    </div>
  `);
  app.appendChild(wrap);
  const root = wrap.querySelector('#tool-groups');

  for (const group of TOOL_GROUPS) {
    const inGroup = tiles.filter((t) => t.group === group.id);
    if (!inGroup.length) continue;
    const section = el(`
      <section class="tool-group">
        <h2>${escapeHtml(group.title)}</h2>
        <p class="muted tool-group-desc">${escapeHtml(group.desc)}</p>
        <div class="tool-grid"></div>
      </section>
    `);
    const grid = section.querySelector('.tool-grid');
    for (const t of inGroup) {
      const card = el(`
        <button type="button" class="card tool-card ${t.cls}">
          <div class="row1"><h2>${t.icon} ${escapeHtml(t.title)}</h2>${t.badge != null ? `<span class="level-badge">${escapeHtml(String(t.badge))}</span>` : ''}</div>
          <p class="muted">${escapeHtml(t.text)}</p>
        </button>
      `);
      card.addEventListener('click', () => { location.hash = t.hash; });
      grid.appendChild(card);
    }
    root.appendChild(section);
  }

  if (!tiles.length) {
    root.appendChild(el(`<div class="card"><p class="muted">Je hebt alle oefenvormen verborgen. Zet ze weer aan onder Instellingen → Lesonderdelen.</p><a class="secondary-link" href="#/settings">Naar instellingen</a></div>`));
  }
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
  const allExercises = content.exercises.filter((e) => e.category === slug);
  const exercises = allowedExercises(allExercises);
  if (category && allExercises.length && !exercises.length) {
    // every exercise in this lesson is of a kind the learner switched off
    const off = disabledPartLabels();
    app.innerHTML = '';
    app.appendChild(el(`
      <div class="card">
        <h1>${escapeHtml(category.name)}</h1>
        <p class="muted">Deze les bestaat alleen uit oefenvormen die je hebt uitgezet${off.length ? ` (${escapeHtml(off.join(', '))})` : ''}. Zet er één weer aan om verder te kunnen.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
          <a class="secondary-link" href="#/settings">Naar instellingen</a>
          <a class="secondary-link" href="#/dashboard">Terug naar lessen</a>
        </div>
      </div>
    `));
    return;
  }
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

// A quiet switch flipped mid-session: drop the questions that are now out of
// bounds from the part still to come, keeping the ones already answered so
// the score stays honest. If nothing is left, the session is simply done.
function refilterSession(session) {
  const answered = session.items.slice(0, session.index);
  const rest = session.items.slice(session.index).filter((ex) => exerciseTypeAllowed(ex.type));
  session.items = [...answered, ...rest];
  if (session.index >= session.items.length) renderLessonComplete(session);
  else renderExercise(session);
}

function gradeAndRecord(ex) {
  return (chosenValue) => {
    // stress exercises are the one case where the accent mark is the answer
    const isCorrect = ex.type === 'stress'
      ? String(chosenValue).normalize('NFC').trim() === String(ex.correctAnswer).normalize('NFC').trim()
      : normalizeAnswer(chosenValue) === normalizeAnswer(ex.correctAnswer);
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
  if (ex.type === 'picture' && ex.context) {
    const pic = el(`<div class="picture-box" role="img" aria-label="plaatje"><span class="picture-emoji"></span></div>`);
    pic.querySelector('.picture-emoji').textContent = ex.context;
    head.appendChild(pic);
  }
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
  // no listen button where hearing the Russian would give the answer away
  // (the picture question's answer IS the Russian word)
  if (ex.type !== 'listen' && ex.type !== 'reading' && ex.type !== 'picture') {
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
      <div id="quiet"></div>
      <div id="head"></div>
      <div id="options"></div>
      <div id="feedback"></div>
    </div>
  `);
  app.appendChild(wrapper);
  wrapper.querySelector('#quiet').replaceWith(renderQuietBar(() => refilterSession(session)));
  wrapper.querySelector('#head').replaceWith(renderExerciseHead(ex, { showContextText: false }));
  if (ex.type === 'listen' && !quietSettings().noListen) speakRussian(ex.context);

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
    fb.appendChild(renderAfterAnswerTools(ex));
    feedbackDiv.appendChild(fb);
    // hearing the stress is the whole point of a stress question: play it,
    // slowly -- unless the learner said they cannot listen right now
    if (ex.type === 'stress' && !quietSettings().noListen) speakRussian(ex.correctAnswer, { slow: true });

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
  } else if (ex.type === 'picture_choice' && ex.options && ex.options.length) {
    // pick the picture: a grid of big emoji tiles
    const grid = el(`<div class="picture-grid"></div>`);
    for (const opt of ex.options) {
      const btn = el(`<button class="option-btn picture-option" data-value="${escapeHtml(opt)}"><span class="picture-emoji"></span></button>`);
      btn.querySelector('.picture-emoji').textContent = opt;
      btn.addEventListener('click', () => onAnswer(opt));
      grid.appendChild(btn);
    }
    container.appendChild(grid);
  } else if (ex.options && ex.options.length) {
    for (const opt of ex.options) {
      const btn = el(`<button class="option-btn" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`);
      btn.addEventListener('click', () => onAnswer(opt));
      container.appendChild(btn);
    }
  } else {
    const form = el(`
      <form class="typing-form">
        <div class="typing-row">
          <input type="text" class="typing-answer" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ru" placeholder="Typ hier in het Russisch…" required />
          <span class="mic-slot"></span>
        </div>
        <button type="submit" class="primary" style="margin-top:10px;width:fit-content">${escapeHtml(submitLabel)}</button>
      </form>
    `);
    container.appendChild(form);
    const input = form.querySelector('input');
    const mic = renderMicButton((text) => { input.value = text; input.focus(); });
    if (mic) form.querySelector('.mic-slot').replaceWith(mic);
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
  const isReview = session.category.slug === '__review__';
  app.appendChild(el(`
    <div class="card">
      <h1>${isPractice ? 'Foutenronde afgerond' : isReview ? 'Herhaling afgerond' : 'Les afgerond'}</h1>
      <p>Je had ${session.correctCount} van de ${session.items.length} vragen goed (${pct}%).</p>
      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
        <button class="primary" id="again-btn">Nog een keer</button>
        <button class="secondary" id="back-btn">Terug naar lessen</button>
      </div>
    </div>
  `));
  document.getElementById('again-btn').addEventListener('click', () => (isPractice ? renderMistakesPractice() : isReview ? renderReviewSession() : renderLesson(session.category.slug)));
  document.getElementById('back-btn').addEventListener('click', () => { location.hash = '#/dashboard'; });
}

// ---------- "Vandaag herhalen": every due word, across all lessons ----------

function dueWordIds(content, username) {
  const wordProgress = Storage.loadWordProgress(username);
  const now = Date.now();
  const known = new Set(content.exercises.filter((e) => e.wordId != null).map((e) => e.wordId));
  return Object.keys(wordProgress)
    .map(Number)
    .filter((id) => known.has(id) && wordProgress[id].nextReviewAt && new Date(wordProgress[id].nextReviewAt).getTime() <= now)
    .sort((a, b) => new Date(wordProgress[a].nextReviewAt) - new Date(wordProgress[b].nextReviewAt));
}

// Shown when a session has material but every piece of it is an exercise
// kind the learner switched off (or quiet mode rules out right now).
function renderNoAllowedExercises(title) {
  const off = disabledPartLabels();
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="card">
      <h1>${escapeHtml(title)}</h1>
      <p class="muted">Er staat wel materiaal klaar, maar alleen in oefenvormen die nu uitstaan${off.length ? ` (${escapeHtml(off.join(', '))})` : ''}. Zet er één weer aan, of schakel de stille modus uit.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <a class="secondary-link" href="#/settings">Naar instellingen</a>
        <a class="secondary-link" href="#/dashboard">Terug naar lessen</a>
      </div>
    </div>
  `));
}

// One exercise per due word (the most overdue first), preferring the
// production forms -- typing and cloze -- over recognition, since a word
// you can still produce is the one that's really still known.
async function renderReviewSession() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const ids = dueWordIds(content, state.user.username).slice(0, 20);
  if (!ids.length) {
    app.innerHTML = '';
    app.appendChild(el(`
      <div class="card">
        <h1>🔁 Vandaag herhalen</h1>
        <p class="muted">Niets aan herhaling toe. De planner zet elk woord dat je goed had steeds verder in de toekomst; kom morgen terug of ga verder op het pad.</p>
        <a href="#/dashboard">Terug naar lessen</a>
      </div>
    `));
    return;
  }
  const byWord = new Map();
  for (const ex of content.exercises) {
    if (ex.wordId == null) continue;
    if (!byWord.has(ex.wordId)) byWord.set(ex.wordId, []);
    byWord.get(ex.wordId).push(ex);
  }
  const items = ids.map((id) => {
    const pool = allowedExercises(byWord.get(id) || []);
    if (!pool.length) return null;
    const production = pool.filter((e) => e.type === 'typing' || e.type === 'cloze');
    const pick = shuffle((production.length && Math.random() < 0.6) ? production : pool)[0];
    return withGrammarRule(content, pick);
  }).filter(Boolean);
  if (!items.length) return renderNoAllowedExercises('🔁 Vandaag herhalen');
  renderExercise({ category: { slug: '__review__', name: 'Herhaling van vandaag' }, items, index: 0, correctCount: 0 });
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
  const pool = allowedExercises(mistakeExercises(content, state.user.username));
  if (!pool.length && mistakeExercises(content, state.user.username).length) {
    return renderNoAllowedExercises('Oefen je fouten');
  }
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
      const isPictures = q.type === 'picture_choice';
      const holder = isPictures ? el(`<div class="picture-grid"></div>`) : optionsDiv;
      for (const opt of q.options) {
        const btn = isPictures
          ? el(`<button class="option-btn picture-option" data-value="${escapeHtml(opt)}"><span class="picture-emoji"></span></button>`)
          : el(`<button class="option-btn" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`);
        if (isPictures) btn.querySelector('.picture-emoji').textContent = opt;
        btn.addEventListener('click', () => commit(opt));
        holder.appendChild(btn);
      }
      if (isPictures) optionsDiv.appendChild(holder);
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

  // only lessons you've actually started -- 126 rows of zeros is noise
  const started = [], untouched = [];
  for (const cat of content.categories) {
    const s = categoryStats(username, content, cat.slug);
    if (!s.totalWords) continue;
    (s.startedWords > 0 ? started : untouched).push({ cat, s });
  }
  const catCard = el(`
    <div class="card">
      <h2>Voortgang per les</h2>
      ${started.length ? `<div class="table-scroll"><table><thead><tr><th>Niveau</th><th>Les</th><th>Geoefend</th><th>Onder de knie</th></tr></thead><tbody id="cat-body"></tbody></table></div>` : '<p class="muted">Je bent nog aan geen enkele les begonnen.</p>'}
      ${untouched.length ? `<p class="muted" style="margin-top:10px;font-size:0.82rem">${untouched.length} ${untouched.length === 1 ? 'les' : 'lessen'} nog niet gestart (niet getoond).</p>` : ''}
    </div>
  `);
  app.appendChild(catCard);
  const catBody = catCard.querySelector('#cat-body');
  for (const { cat, s } of started) {
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
function pronunciationTarget(ex) {
  if (ex.type === 'listen' || ex.type === 'reading') return ex.context || null;
  if (ex.example && ex.example.ru && (ex.type === 'cloze')) return ex.example.ru;
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

// ---------- role-play dialogues (online, needs the server's AI key) ----------

const dialogueState = { scenario: null, level: 'B1', messages: [], turns: [] };

function defaultDialogueLevel() {
  const stats = Storage.loadStats(state.user.username);
  const certified = (stats && stats.certifiedLevels) || [];
  const highest = LEVEL_ORDER.filter((l) => certified.includes(l)).pop();
  const next = highest ? LEVEL_ORDER[Math.min(LEVEL_ORDER.indexOf(highest) + 1, LEVEL_ORDER.length - 1)] : 'A1';
  return next;
}

async function renderDialogueList() {
  app.innerHTML = '';
  const wrap = el(`
    <div>
      <h1>🗣️ Gesprek oefenen</h1>
      <p class="muted">Kies een situatie. De AI speelt de andere kant in het Russisch op jouw niveau, antwoordt op wat jij typt of inspreekt, en geeft na elke beurt een korte correctie in het Nederlands.</p>
      <div class="reminder-row" style="margin-bottom:16px">
        <label for="dialogue-level">Niveau</label>
        <select id="dialogue-level">${LEVEL_ORDER.map((l) => `<option value="${l}">${l}</option>`).join('')}</select>
      </div>
      <div id="scenario-grid" class="scenario-grid"><p class="muted">Laden…</p></div>
    </div>
  `);
  app.appendChild(wrap);
  const levelSel = wrap.querySelector('#dialogue-level');
  levelSel.value = dialogueState.level || defaultDialogueLevel();
  levelSel.addEventListener('change', () => { dialogueState.level = levelSel.value; });
  dialogueState.level = levelSel.value;

  const grid = wrap.querySelector('#scenario-grid');
  if (!navigator.onLine) {
    grid.innerHTML = `<p class="muted">Gesprekken oefenen kan alleen online.</p>`;
    return;
  }
  try {
    const data = await api('/ai/scenarios');
    grid.innerHTML = '';
    if (!data.configured) {
      grid.appendChild(el(`<div class="card"><p class="muted">Voor rollenspellen heeft de server een Anthropic API-sleutel nodig: vul in Home Assistant bij de add-on-configuratie <code>anthropic_api_key</code> in en herstart de add-on. Zonder sleutel werkt de rest van de app gewoon.</p></div>`));
    }
    for (const s of data.scenarios) {
      const card = el(`
        <button type="button" class="card tool-card scenario-card" ${data.configured ? '' : 'disabled'}>
          <div class="row1"><h2>${s.icon} ${escapeHtml(s.title)}</h2></div>
          <p class="muted">Je gesprekspartner: ${escapeHtml(s.role)}.</p>
        </button>
      `);
      card.addEventListener('click', () => {
        dialogueState.scenario = s;
        dialogueState.messages = [];
        dialogueState.turns = [];
        location.hash = `#/dialogue/${s.id}`;
      });
      grid.appendChild(card);
    }
  } catch (err) {
    grid.innerHTML = `<p class="error-message">${escapeHtml(err.message)}</p>`;
  }
}

async function renderDialogue(scenarioId) {
  if (!dialogueState.scenario || dialogueState.scenario.id !== scenarioId) {
    // deep link / reload: fetch the scenario meta first
    try {
      const data = await api('/ai/scenarios');
      const s = data.scenarios.find((x) => x.id === scenarioId);
      if (!s) { location.hash = '#/dialogue'; return; }
      dialogueState.scenario = s;
      dialogueState.messages = [];
      dialogueState.turns = [];
      if (!dialogueState.level) dialogueState.level = defaultDialogueLevel();
    } catch (err) {
      app.innerHTML = '';
      app.appendChild(el(`<div class="card"><p class="error-message">${escapeHtml(err.message)}</p><a href="#/dialogue">Terug</a></div>`));
      return;
    }
  }
  const s = dialogueState.scenario;
  app.innerHTML = '';
  const wrap = el(`
    <div class="dialogue">
      <div class="dialogue-head">
        <div><h1>${s.icon} ${escapeHtml(s.title)}</h1><p class="muted">${escapeHtml(s.role)} · niveau ${escapeHtml(dialogueState.level)}</p></div>
        <a href="#/dialogue" class="secondary-link">Andere situatie</a>
      </div>
      <div class="chat" id="chat"></div>
      <form class="chat-form" id="chat-form">
        <div class="typing-row">
          <input type="text" id="chat-input" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ru" placeholder="Typ of spreek je antwoord in het Russisch…" />
          <span class="mic-slot"></span>
        </div>
        <button type="submit" class="primary" id="chat-send">Versturen</button>
      </form>
    </div>
  `);
  app.appendChild(wrap);
  const chat = wrap.querySelector('#chat');
  const form = wrap.querySelector('#chat-form');
  const input = wrap.querySelector('#chat-input');
  const send = wrap.querySelector('#chat-send');
  const mic = renderMicButton((t) => { input.value = t; input.focus(); });
  if (mic) form.querySelector('.mic-slot').replaceWith(mic);

  function bubble(turn) {
    if (turn.role === 'user') {
      const b = el(`<div class="bubble me"><p></p></div>`);
      b.querySelector('p').textContent = turn.content;
      return b;
    }
    const b = el(`
      <div class="bubble them">
        <p class="ru"></p>
        <button type="button" class="link-btn toggle-nl">vertaling</button>
        <p class="nl muted" hidden></p>
        ${turn.correction ? `<div class="correction"><strong>Correctie:</strong> <span></span></div>` : ''}
        ${turn.tip ? `<div class="tip"><strong>Tip:</strong> <span></span></div>` : ''}
        <span class="speak-slot"></span>
      </div>
    `);
    b.querySelector('.ru').textContent = turn.content;
    b.querySelector('.nl').textContent = turn.translation || '';
    b.querySelector('.toggle-nl').addEventListener('click', () => { const nl = b.querySelector('.nl'); nl.hidden = !nl.hidden; });
    if (!turn.translation) b.querySelector('.toggle-nl').remove();
    if (turn.correction) b.querySelector('.correction span').textContent = turn.correction;
    if (turn.tip) b.querySelector('.tip span').textContent = turn.tip;
    const sp = renderSpeakButton(turn.content, '🔊');
    if (sp) b.querySelector('.speak-slot').replaceWith(sp); else b.querySelector('.speak-slot').remove();
    return b;
  }
  function paint() {
    chat.innerHTML = '';
    for (const t of dialogueState.turns) chat.appendChild(bubble(t));
    chat.scrollTop = chat.scrollHeight;
  }
  async function ask(userText) {
    if (userText) {
      dialogueState.messages.push({ role: 'user', content: userText });
      dialogueState.turns.push({ role: 'user', content: userText });
      paint();
      recordActivity('dialogue_turn', { scenario: s.id, level: dialogueState.level });
    }
    send.disabled = true;
    input.disabled = true;
    const thinking = el(`<div class="bubble them"><p class="muted">…</p></div>`);
    chat.appendChild(thinking);
    chat.scrollTop = chat.scrollHeight;
    try {
      const r = await api('/ai/dialogue', { method: 'POST', body: { scenario: s.id, level: dialogueState.level, messages: dialogueState.messages } });
      dialogueState.messages.push({ role: 'assistant', content: r.reply });
      dialogueState.turns.push({ role: 'assistant', content: r.reply, translation: r.translation, correction: r.correction, tip: r.tip });
      paint();
      speakRussian(r.reply);
      if (r.finished) {
        chat.appendChild(el(`<div class="card" style="margin-top:10px"><p>Gesprek afgerond. <a href="#/dialogue">Kies een nieuwe situatie</a> of ga gewoon door.</p></div>`));
      }
    } catch (err) {
      thinking.remove();
      chat.appendChild(el(`<p class="error-message">${escapeHtml(err.message)}</p>`));
    } finally {
      send.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    ask(text);
  });
  paint();
  if (!dialogueState.turns.length) ask(null);
}

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

// ---------- survival phrasebook (offline, from the content bundle) ----------

async function renderPhrasebook() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const book = content.phrasebook || [];
  app.innerHTML = '';
  const wrap = el(`
    <div class="phrasebook">
      <h1>📕 Zakboekje</h1>
      <p class="muted">De zinnen die je ter plekke nodig hebt, per situatie. Tik op 🔊 om ze te laten uitspreken (🐢 langzaam), of laat het scherm gewoon zien. Werkt offline.</p>
      <input type="search" id="pb-search" class="typing-answer pb-search" placeholder="Zoek (Nederlands of Russisch)…" autocomplete="off" />
      <div class="pb-tabs" id="pb-tabs"></div>
      <div id="pb-body"></div>
    </div>
  `);
  app.appendChild(wrap);
  const tabs = wrap.querySelector('#pb-tabs');
  const body = wrap.querySelector('#pb-body');
  const search = wrap.querySelector('#pb-search');
  let current = book[0] ? book[0].id : null;

  function paint() {
    tabs.innerHTML = '';
    body.innerHTML = '';
    const q = search.value.trim().toLowerCase();
    const sections = q
      ? book.map((s) => ({ ...s, phrases: s.phrases.filter(([ru, nl]) => ru.toLowerCase().includes(q) || nl.toLowerCase().includes(q)) })).filter((s) => s.phrases.length)
      : book.filter((s) => s.id === current);
    if (!q) {
      for (const s of book) {
        const t = el(`<button type="button" class="level-pill ${s.id === current ? 'passed' : ''}">${s.icon} ${escapeHtml(s.title)}</button>`);
        t.addEventListener('click', () => { current = s.id; paint(); });
        tabs.appendChild(t);
      }
    }
    if (!sections.length) body.appendChild(el(`<p class="muted">Niets gevonden.</p>`));
    for (const s of sections) {
      const card = el(`<div class="card"><h2>${s.icon} ${escapeHtml(s.title)}</h2><div class="pb-list"></div></div>`);
      const list = card.querySelector('.pb-list');
      for (const [ru, nl] of s.phrases) {
        const row = el(`<div class="pb-row"><div class="pb-text"><p class="pb-ru"></p><p class="pb-nl muted"></p></div><span class="pb-speak"></span></div>`);
        row.querySelector('.pb-ru').textContent = ru;
        row.querySelector('.pb-nl').textContent = nl;
        const sp = renderSpeakButton(ru, '🔊');
        if (sp) row.querySelector('.pb-speak').replaceWith(sp); else row.querySelector('.pb-speak').remove();
        list.appendChild(row);
      }
      body.appendChild(card);
    }
  }
  search.addEventListener('input', paint);
  paint();
}

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

// ---------- weekly goal + streak freezes ----------

const WEEKDAY_LETTERS = ['M', 'D', 'W', 'D', 'V', 'Z', 'Z'];

function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// The card at the top of the lesson path: a ring for the XP goal, seven dots
// for the days of this week, and how many streak freezes are in the bank.
function renderWeeklyGoalCard() {
  const stats = Storage.loadStats(state.user.username);
  const w = stats && stats.weekly;
  if (!w) return null;

  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, w.xpPct || 0));
  const dash = (pct / 100) * circumference;
  const doneDays = new Set(w.dayDates || []);
  const frozenDays = new Set(w.frozenDates || []);
  const today = new Date().toISOString().slice(0, 10);

  const card = el(`
    <div class="card goal-card ${w.reached ? 'reached' : ''}">
      <div class="goal-main">
        <div class="goal-ring">
          <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
            <circle class="goal-ring-track" cx="32" cy="32" r="${radius}"></circle>
            <circle class="goal-ring-fill ${dash > 0 ? '' : 'empty'}" cx="32" cy="32" r="${radius}"
              stroke-dasharray="${dash.toFixed(1)} ${(circumference - dash).toFixed(1)}"></circle>
          </svg>
          <span class="goal-ring-label">${pct}%</span>
        </div>
        <div class="goal-text">
          <h2>${w.reached ? '🎉 Weekdoel gehaald' : '🎯 Weekdoel'}</h2>
          <p class="muted goal-numbers"><strong>${w.xp}</strong> van ${w.goalXp} XP deze week &middot; <strong>${w.days}</strong> van ${w.goalDays} dagen geoefend</p>
          <div class="goal-days" id="goal-days"></div>
        </div>
      </div>
      <p class="muted goal-freeze" id="goal-freeze"></p>
    </div>
  `);

  const daysEl = card.querySelector('#goal-days');
  for (let i = 0; i < 7; i++) {
    const date = addDays(w.weekStart, i);
    const frozen = frozenDays.has(date);
    const done = doneDays.has(date);
    const cls = frozen ? 'frozen' : done ? 'done' : date > today ? 'future' : 'missed';
    const dot = el(`<span class="goal-day ${cls} ${date === today ? 'today' : ''}" title="${date}">${frozen ? '❄' : WEEKDAY_LETTERS[i]}</span>`);
    daysEl.appendChild(dot);
  }

  // Freezes sit in the day row as a small chip; the explanation lives in
  // Instellingen, where you set the goal. Only news gets its own line.
  const freezes = stats.freezes || 0;
  if (freezes) daysEl.appendChild(el(`<span class="goal-freeze-chip" title="Vangt één gemiste dag op">❄ ${freezes}</span>`));

  const freezeEl = card.querySelector('#goal-freeze');
  const yesterday = addDays(today, -1);
  if (stats.freezeSpentOn === yesterday) freezeEl.textContent = '❄️ Een vriezer ving gisteren op, je reeks loopt door.';
  else freezeEl.remove();
  return card;
}

// Settings card: how much XP and how many days per week you aim for.
function renderGoalSettingsCard() {
  const card = el(`
    <div class="card">
      <h2>🎯 Weekdoel</h2>
      <p class="muted">Je doel loopt van maandag tot en met zondag en telt alle XP mee: oefeningen, toetsen, spelletjes en verhalen. Houd je het vol, dan verdien je elke volle week een vriezer die één gemiste dag opvangt. Dit doel hoort bij je account en geldt dus op al je toestellen.</p>
      <div class="setting-row">
        <label for="goal-xp">XP per week</label>
        <select id="goal-xp"></select>
      </div>
      <div class="setting-row">
        <label for="goal-days-sel">Dagen per week</label>
        <select id="goal-days-sel"></select>
      </div>
      <p class="muted setting-hint" id="goal-status"></p>
    </div>
  `);
  const xpSel = card.querySelector('#goal-xp');
  const daysSel = card.querySelector('#goal-days-sel');
  const status = card.querySelector('#goal-status');
  const XP_LABELS = { 250: '250 XP — rustig aan (ongeveer 25 goede antwoorden)', 500: '500 XP — standaard', 1000: '1000 XP — stevig tempo', 2000: '2000 XP — intensief' };

  function fill(w) {
    xpSel.innerHTML = '';
    (w.xpChoices || [250, 500, 1000, 2000]).forEach((v) => {
      xpSel.appendChild(el(`<option value="${v}" ${v === w.goalXp ? 'selected' : ''}>${escapeHtml(XP_LABELS[v] || v + ' XP')}</option>`));
    });
    daysSel.innerHTML = '';
    (w.dayChoices || [3, 4, 5, 6, 7]).forEach((v) => {
      daysSel.appendChild(el(`<option value="${v}" ${v === w.goalDays ? 'selected' : ''}>${v} ${v === 1 ? 'dag' : 'dagen'}</option>`));
    });
    const stats = Storage.loadStats(state.user.username);
    const freezes = (stats && stats.freezes) || 0;
    status.textContent = `Deze week: ${w.xp} XP op ${w.days} ${w.days === 1 ? 'dag' : 'dagen'}. `
      + (freezes ? `Je hebt ${freezes} ${freezes === 1 ? 'vriezer' : 'vriezers'} op zak.` : 'Nog geen vriezer op zak.');
  }

  async function save() {
    status.textContent = 'Opslaan…';
    try {
      const w = await api('/progress/goal', { method: 'POST', body: { weeklyXp: Number(xpSel.value), weeklyDays: Number(daysSel.value) } });
      fill(w);
      status.textContent = `Opgeslagen. Deze week: ${w.xp} van ${w.goalXp} XP op ${w.days} van ${w.goalDays} dagen.`;
      await pullStats().catch(() => {});
    } catch (e) {
      status.textContent = 'Opslaan lukte niet. Probeer het opnieuw zodra je online bent.';
    }
  }

  xpSel.addEventListener('change', save);
  daysSel.addEventListener('change', save);

  api('/progress/goal')
    .then(fill)
    .catch(() => { status.textContent = 'Het weekdoel is alleen online in te stellen.'; });
  return card;
}

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

// ---------- Home Assistant: notification target + sensor ----------

function renderHaCard() {
  const card = el(`
    <div class="card">
      <h2>🏠 Home Assistant</h2>
      <p class="muted">Laat Home Assistant de dagelijkse herinnering sturen naar jóuw telefoon (Companion-app) of naar het dashboard, en publiceer een sensor met je herhaalachterstand voor dashboards en automatiseringen.</p>
      <div id="ha-body"><p class="muted">Laden…</p></div>
    </div>
  `);
  const body = card.querySelector('#ha-body');
  (async () => {
    let st;
    try {
      st = await api('/ha/status');
    } catch (err) {
      body.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
      return;
    }
    if (!st.available) {
      body.innerHTML = `<p class="muted">Niet beschikbaar: de app draait niet als Home Assistant add-on (of de add-on mist <code>homeassistant_api: true</code>).</p>`;
      return;
    }
    const s = st.settings || { target: 'persistent_notification', enabled: false, reminderTime: '19:00', sensorEnabled: true };
    body.innerHTML = '';
    body.appendChild(el(`
      <div>
        <div class="setting-row">
          <label for="ha-target">Melding naar</label>
          <select id="ha-target"></select>
          <p class="muted setting-hint">Dit koppelt dit leeraccount (<strong>${escapeHtml(state.user.username)}</strong>) aan een Home Assistant-toestel: elk toestel met de Companion-app staat hier als <em>notify.mobile_app_…</em>. Kies je eigen telefoon. "Home Assistant-melding" verschijnt in het dashboard van iedereen.</p>
        </div>
        <div class="reminder-row">
          <label for="ha-time">Tijdstip</label>
          <input type="time" id="ha-time" value="${escapeHtml(s.reminderTime)}" />
          <label class="check"><input type="checkbox" id="ha-enabled" ${s.enabled ? 'checked' : ''} /> Herinnering aan</label>
          <label class="check"><input type="checkbox" id="ha-sensor" ${s.sensorEnabled ? 'checked' : ''} /> Sensor publiceren</label>
        </div>
        <p class="muted setting-hint">Sensor: <code>${escapeHtml(st.sensorEntityId)}</code> — status = aantal woorden te herhalen; attributen: reeks, XP, niveau, vandaag geoefend. Bijgewerkt elke 5 minuten.${st.publicUrl ? '' : ' Tip: vul in de add-on-configuratie <code>public_url</code> in (bv. je Cloudflare-adres), dan opent de melding direct de app.'}</p>
        <div class="reminder-row">
          <button type="button" class="primary" id="ha-save">Opslaan</button>
          <button type="button" class="secondary" id="ha-test">Testmelding</button>
        </div>
        <p class="muted reminder-status" id="ha-status">${st.error ? escapeHtml('Home Assistant meldde: ' + st.error) : (s.enabled ? `Aan — dagelijks om ${escapeHtml(s.reminderTime)} naar ${escapeHtml(s.target)}.` : 'Uit.')}</p>
      </div>
    `));
    const sel = body.querySelector('#ha-target');
    for (const t of st.targets) {
      const o = document.createElement('option');
      o.value = t.id; o.textContent = t.label;
      sel.appendChild(o);
    }
    if (st.targets.some((t) => t.id === s.target)) sel.value = s.target;
    const statusEl = body.querySelector('#ha-status');
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'Europe/Amsterdam';
    body.querySelector('#ha-save').addEventListener('click', async () => {
      statusEl.textContent = 'Opslaan…';
      try {
        const r = await api('/ha/settings', { method: 'POST', body: { target: sel.value, enabled: body.querySelector('#ha-enabled').checked, reminderTime: body.querySelector('#ha-time').value || '19:00', timeZone: tz, sensorEnabled: body.querySelector('#ha-sensor').checked } });
        statusEl.textContent = r.settings.enabled ? `Opgeslagen — dagelijks om ${r.settings.reminderTime} naar ${r.settings.target}.` : 'Opgeslagen — herinnering uit.';
      } catch (err) { statusEl.textContent = err.message; }
    });
    body.querySelector('#ha-test').addEventListener('click', async () => {
      statusEl.textContent = 'Testmelding versturen…';
      try { await api('/ha/test', { method: 'POST', body: {} }); statusEl.textContent = 'Verstuurd via Home Assistant.'; } catch (err) { statusEl.textContent = err.message; }
    });
  })();
  return card;
}

// ---------- settings: speech, reminder, account ----------

const SPEECH_SAMPLE = 'Здравствуйте! Меня зовут Даниэль. Я учу русский язык.';

function renderSpeechCard() {
  const card = el(`
    <div class="card">
      <h2>🔊 Uitspraak</h2>
      <p class="muted">Elke luisterknop heeft twee snelheden: normaal en 🐢 langzaam. Stel hier in hoe snel die zijn en welke stem je hoort. Langzaam is handig om elke klank en de beklemtoonde lettergreep te horen.</p>
      <div id="speech-body"></div>
    </div>
  `);
  const body = card.querySelector('#speech-body');
  if (!('speechSynthesis' in window)) {
    body.appendChild(el(`<p class="muted">Deze browser ondersteunt geen spraaksynthese.</p>`));
    return card;
  }
  const s = speechSettings();
  body.appendChild(el(`
    <div>
    <div class="setting-row">
      <label for="rate">Normale snelheid <span class="muted" id="rate-val">${s.rate.toFixed(2)}×</span></label>
      <input type="range" id="rate" min="0.5" max="1.3" step="0.05" value="${s.rate}" />
    </div>
    <div class="setting-row">
      <label for="slow-rate">Langzame snelheid 🐢 <span class="muted" id="slow-val">${s.slowRate.toFixed(2)}×</span></label>
      <input type="range" id="slow-rate" min="0.3" max="0.9" step="0.05" value="${s.slowRate}" />
    </div>
    <div class="setting-row">
      <label for="voice">Stem</label>
      <select id="voice"><option value="">Automatisch (beste Russische stem)</option></select>
      <p class="muted setting-hint" id="voice-hint"></p>
    </div>
    <div class="reminder-row">
      <button type="button" class="secondary" id="test-normal">▶︎ Test normaal</button>
      <button type="button" class="secondary" id="test-slow">🐢 Test langzaam</button>
    </div>
    <p class="muted setting-hint">Op iPhone/iPad krijg je een veel betere stem via Instellingen → Toegankelijkheid → Gesproken materiaal → Stemmen → Russisch → Milena (uitgebreid) downloaden. Daarna staat hij hier in de lijst.</p>
    </div>
  `));
  const rate = body.querySelector('#rate');
  const slowRate = body.querySelector('#slow-rate');
  const voiceSel = body.querySelector('#voice');
  const hint = body.querySelector('#voice-hint');
  rate.addEventListener('input', () => { body.querySelector('#rate-val').textContent = Number(rate.value).toFixed(2) + '×'; saveSpeechSettings({ rate: Number(rate.value) }); });
  slowRate.addEventListener('input', () => { body.querySelector('#slow-val').textContent = Number(slowRate.value).toFixed(2) + '×'; saveSpeechSettings({ slowRate: Number(slowRate.value) }); });
  function fillVoices() {
    const voices = russianVoices();
    [...voiceSel.querySelectorAll('option:not([value=""])')].forEach((o) => o.remove());
    for (const v of voices) {
      const opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})${v.localService ? '' : ' · online'}`;
      voiceSel.appendChild(opt);
    }
    voiceSel.value = voices.some((v) => v.voiceURI === s.voiceURI) ? s.voiceURI : '';
    hint.textContent = voices.length ? `${voices.length} Russische ${voices.length === 1 ? 'stem' : 'stemmen'} beschikbaar op dit toestel.` : 'Geen Russische stem gevonden op dit toestel; installeer er een via de systeeminstellingen.';
  }
  fillVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.addEventListener('voiceschanged', fillVoices);
  voiceSel.addEventListener('change', () => saveSpeechSettings({ voiceURI: voiceSel.value }));
  body.querySelector('#test-normal').addEventListener('click', () => speakRussian(SPEECH_SAMPLE));
  body.querySelector('#test-slow').addEventListener('click', () => speakRussian(SPEECH_SAMPLE, { slow: true }));
  return card;
}

// Settings: which exercise kinds a lesson may draw from on this device, and
// which tiles the dashboard shows. Per device on purpose -- the phone and the
// tablet are not equally good at every exercise.
function renderPartsCard() {
  const card = el(`
    <div class="card">
      <h2>🎛️ Lesonderdelen</h2>
      <p class="muted">Wat je hier uitzet, komt niet meer voor in je lessen, de dagelijkse herhaling en het oefenen van je fouten. Dit geldt alleen voor dit toestel, zodat je op je telefoon iets anders kunt uitzetten dan op je tablet. De niveautoets blijft altijd alle vormen toetsen, anders zegt het certificaat niets.</p>
      <div class="parts-list" id="parts-list"></div>
      <h3 class="parts-heading">Tegels onder ✨ Oefenen</h3>
      <p class="muted">Verbergt de tegel in het oefenmenu. "Vandaag herhalen" en "Oefen je fouten" blijven altijd staan.</p>
      <div class="parts-list" id="tools-list"></div>
      <p class="muted setting-hint" id="parts-status"></p>
    </div>
  `);
  const partsList = card.querySelector('#parts-list');
  const toolsList = card.querySelector('#tools-list');
  const status = card.querySelector('#parts-status');

  for (const part of LESSON_PARTS) {
    const on = partSettings()[part.id] !== false;
    const row = el(`
      <label class="part-row">
        <input type="checkbox" ${on ? 'checked' : ''} />
        <span class="part-text">
          <span class="part-label">${part.icon} ${escapeHtml(part.label)}</span>
          <span class="part-desc muted">${escapeHtml(part.desc)}</span>
        </span>
      </label>
    `);
    const box = row.querySelector('input');
    box.addEventListener('change', () => {
      const next = { ...partSettings(), [part.id]: box.checked };
      if (!Object.values(next).some(Boolean)) {
        // there has to be something left to practise with
        box.checked = true;
        status.textContent = 'Er moet minstens één oefenvorm aan blijven staan.';
        return;
      }
      savePartSettings({ [part.id]: box.checked });
      const off = Object.entries(next).filter(([, v]) => !v).length;
      status.textContent = off ? `${off} ${off === 1 ? 'oefenvorm staat' : 'oefenvormen staan'} uit op dit toestel.` : 'Alle oefenvormen staan aan.';
    });
    partsList.appendChild(row);
  }

  for (const t of TOOL_TILES) {
    const on = toolEnabled(t.id);
    const row = el(`
      <label class="part-row">
        <input type="checkbox" ${on ? 'checked' : ''} />
        <span class="part-text"><span class="part-label">${t.icon} ${escapeHtml(t.label)}</span></span>
      </label>
    `);
    const box = row.querySelector('input');
    box.addEventListener('change', () => {
      saveToolSettings({ [t.id]: box.checked });
      status.textContent = box.checked ? `${t.label} staat weer in het oefenmenu.` : `${t.label} is verborgen op dit toestel.`;
    });
    toolsList.appendChild(row);
  }
  return card;
}

// Settings: the same two switches that sit in the lesson header, so they can
// also be found (and turned off again) from here.
function renderQuietCard() {
  const card = el(`
    <div class="card">
      <h2>🤫 Stille modus</h2>
      <p class="muted">Voor onderweg. Je zet dit ook midden in een les aan met de twee knopjes boven de vraag; het werkt meteen op de rest van die sessie en blijft aan tot je het weer uitzet.</p>
      <div class="parts-list" id="quiet-list"></div>
      <p class="muted setting-hint">Met luisteren uit krijg je geen luisteroefeningen meer en speelt er niets vanzelf af. De knoppen om zelf een woord af te spelen blijven staan, zodat je met een koptelefoon op verder kunt.</p>
    </div>
  `);
  const list = card.querySelector('#quiet-list');
  const rows = [
    { key: 'noListen', icon: '🎧', label: 'Even niet luisteren', desc: 'Luisteroefeningen worden overgeslagen en niets speelt vanzelf af.' },
    { key: 'noSpeak', icon: '🎤', label: 'Even niet praten', desc: 'De microfoonknoppen en "Zeg het na" verdwijnen.' }
  ];
  for (const r of rows) {
    const on = quietSettings()[r.key];
    const row = el(`
      <label class="part-row">
        <input type="checkbox" ${on ? 'checked' : ''} />
        <span class="part-text">
          <span class="part-label">${r.icon} ${escapeHtml(r.label)}</span>
          <span class="part-desc muted">${escapeHtml(r.desc)}</span>
        </span>
      </label>
    `);
    row.querySelector('input').addEventListener('change', (e) => saveQuietSettings({ [r.key]: e.currentTarget.checked }));
    list.appendChild(row);
  }
  return card;
}

async function renderSettings() {
  app.innerHTML = '';
  app.appendChild(el(`<div><h1>⚙️ Instellingen</h1><p class="muted">Uitspraak en herinneringen gelden voor dit toestel; je weekdoel hoort bij je account en werkt overal.</p></div>`));
  app.appendChild(renderPartsCard());
  app.appendChild(renderQuietCard());
  app.appendChild(renderGoalSettingsCard());
  app.appendChild(renderSpeechCard());
  app.appendChild(renderReminderCard());
  if (navigator.onLine) app.appendChild(renderHaCard());

  const account = el(`
    <div class="card">
      <h2>👤 Account</h2>
      <p class="muted">Ingelogd als <strong>${escapeHtml(state.user.username)}</strong>. Je voortgang staat op de server en wordt op elk toestel waar je inlogt gesynchroniseerd.</p>
      <button type="button" class="secondary" id="logout-btn">🚪 Uitloggen</button>
    </div>
  `);
  account.querySelector('#logout-btn').addEventListener('click', async () => {
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    Storage.clearAuth();
    state.user = null;
    location.hash = '#/login';
  });
  app.appendChild(account);

  const content = Storage.loadContent(state.user.username);
  if (content) {
    const counts = {};
    for (const e of content.exercises) counts[e.type] = (counts[e.type] || 0) + 1;
    app.appendChild(el(`
      <div class="card">
        <h2>ℹ️ Lesinhoud op dit toestel</h2>
        <p class="muted">${content.categories.length} lessen · ${content.exercises.length} oefeningen · ${Object.keys(content.words || {}).length} woorden · opgehaald ${escapeHtml(String(content.generatedAt || '').slice(0, 16).replace('T', ' '))}. Nieuwe inhoud wordt automatisch opgehaald zodra je online bent.</p>
      </div>
    `));
  }
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
