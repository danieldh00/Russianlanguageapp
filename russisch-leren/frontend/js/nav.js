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

