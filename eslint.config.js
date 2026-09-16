'use strict';

// Flat config (ESLint 9). Two runtimes in this repo, each with its own
// globals: the backend is plain CommonJS/Node, the frontend is three
// separately-loaded <script> tags (index.html) with no bundler and no ES
// modules -- Ingress needs every asset served as a static, relative file, so
// app.js/storage.js/srs.js share state through the global scope by design.
// That means no-undef can't be enforced across those files without every
// shared name in the ignore list, so it's switched off for them; everything
// else (unused vars, ==, var) still applies.

const backendGlobals = {
  require: 'readonly',
  module: 'writable',
  exports: 'writable',
  process: 'readonly',
  console: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  Buffer: 'readonly',
  setTimeout: 'readonly',
  setInterval: 'readonly',
  clearTimeout: 'readonly',
  clearInterval: 'readonly',
  fetch: 'readonly'
};

const frontendGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  setInterval: 'readonly',
  clearTimeout: 'readonly',
  clearInterval: 'readonly',
  location: 'readonly',
  history: 'readonly',
  crypto: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  Audio: 'readonly',
  Image: 'readonly',
  CustomEvent: 'readonly',
  MutationObserver: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  self: 'readonly',
  caches: 'readonly',
  Notification: 'readonly',
  speechSynthesis: 'readonly',
  SpeechSynthesisUtterance: 'readonly',
  SpeechRecognition: 'readonly',
  webkitSpeechRecognition: 'readonly',
  alert: 'readonly',
  confirm: 'readonly',
  prompt: 'readonly'
};

const serviceWorkerGlobals = {
  self: 'readonly',
  caches: 'readonly',
  clients: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  URL: 'readonly'
};

const baseRules = {
  // caughtErrors: 'none' -- an intentionally ignored `catch (e) {}` (private
  // browsing / storage disabled / best-effort cleanup) is a deliberate
  // pattern throughout this codebase, not a mistake to flag.
  'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_', caughtErrors: 'none' }],
  eqeqeq: ['warn', 'smart'],
  'no-var': 'error',
  'prefer-const': 'warn',
  'no-undef': 'error'
};

module.exports = [
  {
    ignores: ['node_modules/**', '**/node_modules/**', 'russisch-leren/backend/data/**', 'russisch-leren/backend/seed/data/generated/**']
  },
  {
    files: ['russisch-leren/backend/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: backendGlobals },
    rules: baseRules
  },
  {
    files: ['russisch-leren/frontend/js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: frontendGlobals },
    rules: { ...baseRules, 'no-undef': 'off' }
  },
  {
    files: ['russisch-leren/frontend/sw.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: serviceWorkerGlobals },
    rules: baseRules
  }
];
