// The app shell: state, low-level helpers (api/el/escapeHtml), speech
// settings and the lesson-part/tool toggles. Loaded first (see index.html)
// because every other frontend/js/*.js file uses functions from here.
const state = { user: null, syncing: false, pendingCount: 0 };
let syncInFlight = false;

// Where this app is mounted. Normally "/", but Home Assistant's Ingress serves
// the add-on under /api/hassio_ingress/<token>/ and strips that prefix before
// the request reaches us, so the server cannot tell us -- the browser can.
// This script's own URL is the authoritative answer; the document path is the
// fallback for the case where currentScript is unavailable. Matches this
// file's own name (core.js) -- keep that in sync if this file is ever renamed.
const APP_BASE = (() => {
  const src = (document.currentScript && document.currentScript.src) || '';
  const match = src.match(/^https?:\/\/[^/]+(\/(?:.*\/)?)js\/core\.js(?:[?#].*)?$/);
  if (match) return match[1];
  return location.pathname.endsWith('/') ? location.pathname : '/';
})();
// Ingress runs inside an authenticated Home Assistant frame under a path that
// changes every session, so an offline service worker there would be useless.
const IS_INGRESS = APP_BASE !== '/';

// the content bundle shape this client understands (see /api/content)
const CONTENT_SCHEMA_VERSION = 5;

if ('serviceWorker' in navigator && !IS_INGRESS) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(APP_BASE + 'sw.js')
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
    res = await fetch(APP_BASE + 'api' + path, {
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

// The combining stress mark (́) sits between the letters of an accented
// word, so it has to be part of the run: without it 'де́вять' matched only
// 'де', which both truncated what the listen button said out loud and made
// two unrelated words look like the same question.
const CYRILLIC_RUN = /[Ѐ-ӿ][Ѐ-ӿ́\s.,!?'"()-]*[Ѐ-ӿ́]|[Ѐ-ӿ]/;

// What the listen button next to a question may say out loud: only Russian
// that is already on screen. It used to fall back to the correct answer
// whenever that was Cyrillic, which read the answer aloud on 1812 of the
// multiple-choice questions ("Welke letter klinkt als 'v' in 'vis'?" -> "В в").
// After answering, the feedback has its own listen button.
function extractSpeakText(ex) {
  if (ex.type === 'listen') return ex.context || null;
  if (ex.type === 'reading') return ex.context || null;
  // A stress question asks where the stress falls, so hearing the word spoken
  // is the answer. It is played slowly on its own once you have answered.
  if (ex.type === 'stress') return null;
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

// Does this question actually play audio by itself? A listening exercise is
// nothing without sound, and a stress question plays the answer slowly after
// you answer. A plain multiple-choice question with an optional listen button
// does not qualify -- nobody needs to switch off a button they can ignore.
function needsHearing(ex) {
  return !!ex && (ex.type === 'listen' || ex.type === 'stress');
}
// Does it offer the microphone as a way to answer? That is the free-text
// exercises: typing and gatenzinnen.
function offersMicrophone(ex) {
  return !!ex && !(ex.options && ex.options.length) && speechRecognitionSupported();
}

// The two switches in the lesson header. They only appear where they mean
// something -- on a question that makes sound or asks you to speak -- plus
// whenever one is already on, because otherwise there would be no way back.
// Instellingen → Stille modus is the permanent home for both.
function renderQuietBar(onChange, ex) {
  const quiet = quietSettings();
  const show = {
    noListen: quiet.noListen || (needsHearing(ex) && 'speechSynthesis' in window),
    noSpeak: quiet.noSpeak || offersMicrophone(ex)
  };
  if (!show.noListen && !show.noSpeak) return null;

  const bar = el(`<div class="quiet-bar"></div>`);
  const chip = (key, onLabel, offLabel, title) => {
    if (!show[key]) return;
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

// Why speaking would produce nothing, in words the learner can act on. The
// common case on an iPhone is simply that no Russian voice is installed: iOS
// then stays completely silent for lang="ru-RU" rather than falling back to
// another language, which looks like a broken button.
function speechProblem() {
  if (!('speechSynthesis' in window)) return 'Deze browser kan geen tekst voorlezen.';
  const all = window.speechSynthesis.getVoices();
  if (!all.length) return 'Dit toestel heeft geen stemmen voor tekst-naar-spraak. Installeer er een via de systeeminstellingen van je telefoon of computer.';
  if (!russianVoices().length) {
    return 'Er staat geen Russische stem op dit toestel, daarom blijft het stil. Op iPhone/iPad: Instellingen → Toegankelijkheid → Gesproken materiaal → Stemmen → Russisch (kies Milena). Op Android: Instellingen → Systeem → Talen → Tekst-naar-spraak.';
  }
  return 'Er kwam geen geluid. Zet het schakelaartje voor stil op je iPhone uit en het volume omhoog; op een computer: controleer of het geluid niet gedempt staat.';
}

function speakRussian(text, { slow = false, onProblem } = {}) {
  if (!text || !('speechSynthesis' in window)) {
    if (onProblem) onProblem(text ? speechProblem() : 'Er is niets om voor te lezen.');
    return;
  }
  try {
    // Cancelling an idle engine is what silences the next utterance on iOS,
    // so only clear a sentence that is actually still running.
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/́/g, ''));
    utterance.lang = 'ru-RU';
    const s = speechSettings();
    utterance.rate = slow ? s.slowRate : s.rate;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    if (onProblem) {
      let started = false;
      utterance.onstart = () => { started = true; };
      utterance.onerror = () => onProblem(speechProblem());
      // Nothing started within a second and a half means nothing is coming.
      setTimeout(() => { if (!started) onProblem(speechProblem()); }, 1500);
    }
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    if (onProblem) onProblem('Voorlezen lukte niet op dit toestel.');
  }
}

// A listen control: normal speed plus a 🐢 button for slow speech, where
// every sound and the stressed syllable are easy to pick out.
function renderSpeakButton(text, label = '🔊 Luister') {
  if (!text || !('speechSynthesis' in window)) return null;
  const group = el(`<span class="speak-group"></span>`);
  const btn = el(`<button type="button" class="speak-btn" aria-label="Luister naar de Russische uitspraak">${label}</button>`);
  const slow = el(`<button type="button" class="speak-btn speak-slow" title="Langzaam" aria-label="Langzaam beluisteren">🐢</button>`);
  group.appendChild(btn);
  group.appendChild(slow);

  // A silent button is indistinguishable from a broken app, so say what is
  // wrong right where it happened instead of leaving the learner guessing.
  let notice = null;
  const onProblem = (message) => {
    if (notice) return;
    notice = el(`<span class="speak-problem"></span>`);
    notice.textContent = message;
    group.insertAdjacentElement('afterend', notice);
  };
  const clearNotice = () => { if (notice) { notice.remove(); notice = null; } };

  btn.addEventListener('click', () => { clearNotice(); speakRussian(text, { onProblem }); });
  slow.addEventListener('click', () => { clearNotice(); speakRussian(text, { slow: true, onProblem }); });
  return group;
}

