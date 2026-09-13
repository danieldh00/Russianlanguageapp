// Local-first storage: everything the quiz needs (lesson content, per-word
// progress, a queue of not-yet-synced answers) lives in localStorage so the
// app works with zero connectivity. Namespaced per username so more than one
// account can be used on the same device/browser without mixing data.

function uuid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false; // private browsing / storage full / storage disabled
  }
}

const AUTH_KEY = 'ru:auth';

const Storage = {
  // ---- device-level: last known logged-in identity, for offline boot ----
  getAuth() { return readJSON(AUTH_KEY, null); },
  setAuth(user) { writeJSON(AUTH_KEY, user ? { id: user.id, username: user.username } : null); },
  clearAuth() { try { localStorage.removeItem(AUTH_KEY); } catch (e) {} },

  // ---- per-user namespaced state ----
  loadContent(username) { return readJSON(`ru:${username}:content`, null); },
  saveContent(username, content) {
    writeJSON(`ru:${username}:content`, { ...content, fetchedAt: new Date().toISOString() });
  },

  loadWordProgress(username) { return readJSON(`ru:${username}:wordProgress`, {}); },
  saveWordProgress(username, map) { writeJSON(`ru:${username}:wordProgress`, map); },

  loadOutbox(username) { return readJSON(`ru:${username}:outbox`, []); },
  saveOutbox(username, items) { writeJSON(`ru:${username}:outbox`, items); },
  enqueueOutbox(username, item) {
    const items = Storage.loadOutbox(username);
    items.push(item);
    Storage.saveOutbox(username, items);
  },
  removeFromOutbox(username, clientIds) {
    const idSet = new Set(clientIds);
    const remaining = Storage.loadOutbox(username).filter((it) => !idSet.has(it.clientId));
    Storage.saveOutbox(username, remaining);
  },

  loadAttemptsLog(username) { return readJSON(`ru:${username}:attemptsLog`, []); },
  appendAttemptLog(username, entry) {
    const log = Storage.loadAttemptsLog(username);
    log.unshift(entry);
    Storage.saveAttemptsLog(username, log.slice(0, 200));
  },
  saveAttemptsLog(username, log) { writeJSON(`ru:${username}:attemptsLog`, log); },

  // device-level preferences (speech rate/voice, ...): not tied to an account
  loadSettings() { return readJSON('ru:settings', {}) || {}; },
  saveSettings(settings) { writeJSON('ru:settings', settings); },

  // gamification snapshot (xp/level/streak/achievements), refreshed on every sync
  loadStats(username) { return readJSON(`ru:${username}:stats`, null); },
  saveStats(username, stats) { writeJSON(`ru:${username}:stats`, stats); }
};
