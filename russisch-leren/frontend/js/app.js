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

// ---------- keeping near-identical questions apart ----------

// How many questions must sit between two questions about the same thing.
const MIN_RELATED_GAP = 3;

const QUOTED_CYRILLIC = /'([^']*[Ѐ-ӿ][^']*)'/;

// What a question is "about", as a set of keys. Two questions that share any
// key are near-identical: the sound question and the letter question of Ж
// share a word ("Hoe klinkt de letter 'Ж ж'?" / "Welke letter klinkt als
// 'zj'?"), and a typed question and a multiple-choice question about дом
// share their Russian subject even when they belong to different lessons.
function relatedKeys(ex) {
  const keys = new Set();
  if (ex.wordId != null) keys.add(`w:${ex.wordId}`);
  const answer = normalizeAnswer(ex.correctAnswer);
  if (answer) keys.add(`a:${answer}`);
  // The Russian the question quotes -- "Wat betekent 'дом'?", "Hoe klinkt de
  // letter 'Ж ж'?" -- which is the word the question is about, and which ties
  // it to the question whose *answer* is that same word. Only what is between
  // quotes counts: the Russian in a cloze sentence or a reading text is the
  // material, not the subject, and keying on that would pull apart the
  // questions belonging to one story.
  const quoted = String(ex.prompt || '').match(QUOTED_CYRILLIC);
  const run = quoted && quoted[1].match(CYRILLIC_RUN);
  if (run) {
    const subject = normalizeAnswer(run[0]);
    if (subject && subject.length <= 20 && subject.split(' ').length <= 2) keys.add(`a:${subject}`);
  }
  return [...keys];
}

// Reorders a picked session so questions about the same thing end up apart.
// Each step takes a question whose subject has been away at least MIN_RELATED_GAP
// places (or, if none has, the one away the longest), and among those the one
// with the most questions still waiting on the same subject -- otherwise the
// duplicates all sink to the end and cluster there instead. Ties keep the
// given order, so a due-first or mistakes-first ordering survives untouched
// when nothing conflicts. Ten questions about five words come out as five,
// then the other five, rather than in pairs.
function spreadRelated(items, minGap = MIN_RELATED_GAP) {
  if (items.length < 3) return [...items];
  const remaining = items.map((ex) => ({ ex, keys: relatedKeys(ex) }));
  const left = new Map();
  remaining.forEach((r) => r.keys.forEach((key) => left.set(key, (left.get(key) || 0) + 1)));
  const lastSeen = new Map();
  const out = [];
  while (remaining.length) {
    let chosen = 0, bestGap = -1, bestGroup = -1;
    for (let i = 0; i < remaining.length; i++) {
      let gap = minGap, group = 1;
      for (const key of remaining[i].keys) {
        if (lastSeen.has(key)) gap = Math.min(gap, out.length - lastSeen.get(key));
        group = Math.max(group, left.get(key) || 1);
      }
      if (gap > bestGap || (gap === bestGap && group > bestGroup)) { bestGap = gap; bestGroup = group; chosen = i; }
    }
    const [taken] = remaining.splice(chosen, 1);
    taken.keys.forEach((key) => { lastSeen.set(key, out.length); left.set(key, (left.get(key) || 1) - 1); });
    out.push(taken.ex);
  }
  return out;
}

// Deals the questions out word by word: every word gives one question before
// any word gives a second, and so on. A session then covers as many different
// words as it can, and what does not fit is cut from the tail -- rather than a
// ten-question lesson spending its last four questions on one word, which is
// what made the sound and the letter of Ж land together. Exercises without a
// word (reading, dialogue) count as a word of their own.
function roundRobinByWord(exercises) {
  const buckets = new Map();
  exercises.forEach((ex, i) => {
    const key = ex.wordId != null ? `w${ex.wordId}` : `x${i}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(ex);
  });
  const lists = [...buckets.values()];
  const deepest = lists.reduce((n, list) => Math.max(n, list.length), 0);
  const out = [];
  for (let round = 0; round < deepest; round++) {
    for (const list of lists) if (round < list.length) out.push(list[round]);
  }
  return out;
}


// Session order: words due for review first, then words never practised,
// then exercises without a tracked word, and finally words that are scheduled
// for later -- so a lesson can always be redone as extra practice instead
// of turning you away because "everything is planned for later". Within each
// group the questions are dealt out word by word, so a lesson's vocabulary is
// covered in as few sessions as possible. What is picked is finally spread,
// so two questions about the same word never land next to each other.
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

  const pool = [
    ...roundRobinByWord(due),
    ...roundRobinByWord(shuffle(fresh)),
    ...shuffle(untracked),
    ...roundRobinByWord(shuffle(scheduled))
  ];
  return spreadRelated(pool.slice(0, limit));
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
  const pool = shuffle(ex.options);
  const selected = [];
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
  const quietBar = renderQuietBar(() => refilterSession(session), ex);
  const quietSlot = wrapper.querySelector('#quiet');
  if (quietBar) quietSlot.replaceWith(quietBar); else quietSlot.remove();
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
        <div id="answer-speak-slot"></div>
        <div id="example-slot"></div>
        ${ex.grammarRule ? `<div class="grammar-rule"><strong>${escapeHtml(ex.grammarRule.title)}:</strong> ${escapeHtml(ex.grammarRule.explanation)}</div>` : ''}
        <div id="ai-explain-slot"></div>
      </div>
    `);
    // Now that the answer is on screen, hearing it gives nothing away.
    const answerSlot = fb.querySelector('#answer-speak-slot');
    const spokenAnswer = CYRILLIC_RUN.test(ex.correctAnswer || '') ? ex.correctAnswer : null;
    const answerSpeak = spokenAnswer && !quietSettings().noListen ? renderSpeakButton(spokenAnswer, '🔊 Hoor het antwoord') : null;
    if (answerSpeak) answerSlot.replaceWith(answerSpeak); else answerSlot.remove();

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

