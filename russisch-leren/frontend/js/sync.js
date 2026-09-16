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

