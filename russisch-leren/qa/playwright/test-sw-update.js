const { chromium } = require('playwright');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

const BASE = 'http://localhost:3080';
const BACKEND_DIR = require('path').join(__dirname, '../../backend');
const CSS_FILE = require('path').join(__dirname, '../../frontend/css/style.css');
const DATA_DIR = '/tmp/pwa-update-test';

function ok(label) { console.log('OK   - ' + label); }
function fail(label, extra) { console.log('FAIL - ' + label + (extra ? ' :: ' + JSON.stringify(extra) : '')); process.exitCode = 1; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

let serverProc = null;
function startServer(port, logFile) {
  serverProc = spawn('node', ['src/server.js'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, DATA_DIR, SESSION_SECRET: 'testsecret', PORT: String(port) },
    stdio: ['ignore', fs.openSync(logFile, 'a'), fs.openSync(logFile, 'a')],
    detached: false
  });
  return serverProc;
}
function stopServer() {
  if (serverProc && !serverProc.killed) {
    try { process.kill(serverProc.pid, 'SIGKILL'); } catch (e) {}
  }
}

(async () => {
  startServer(3080, '/tmp/pwa-update-test/server.log');
  await sleep(2000);

  const userDataDir = '/tmp/pwa-update-test/chrome-profile';
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium')
  });
  const page = await ctx.newPage();

  await page.goto(BASE + '/');
  try {
    await page.waitForFunction(() => navigator.serviceWorker.controller != null, { timeout: 15000 });
    ok('service worker took control on first load');
  } catch (e) {
    fail('service worker never took control on first load');
  }

  const initialCacheName = await page.evaluate(() => caches.keys().then((k) => k[0]));
  ok('initial cache name: ' + initialCacheName);

  const cssBefore = await page.evaluate(() => fetch('/css/style.css').then((r) => r.text()));
  ok('fetched css via SW before deploy, length=' + cssBefore.length);

  // --- simulate a deploy: change a shell file + restart the server ---
  fs.appendFileSync(CSS_FILE, '\n/* deploy marker */\n');
  stopServer();
  await sleep(800);
  startServer(3080, '/tmp/pwa-update-test/server.log');
  await sleep(2000);

  // the currently open tab doesn't know yet -- this mirrors what our
  // periodic registration.update() / visibilitychange handler would trigger.
  // Arm the navigation wait BEFORE triggering it: our app's controllerchange
  // handler can reload fast enough to interrupt the very evaluate() call
  // that requested the update, so racing them is what the real flow does.
  let reloaded = false;
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) reloaded = true; });
  const navWait = page.waitForNavigation({ timeout: 15000 }).catch(() => null);
  const updateWait = page
    .evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg.update();
      return { hadWaiting: !!reg.waiting, hadInstalling: !!reg.installing };
    })
    .catch((e) => ({ interrupted: true, message: e.message }));
  const [navResult, updateResult] = await Promise.all([navWait, updateWait]);
  ok('registration.update() outcome: ' + JSON.stringify(updateResult));

  await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
  await sleep(1000);

  const afterCacheName = await page.evaluate(() => caches.keys().then((keys) => keys.sort().pop()));
  if (afterCacheName !== initialCacheName) ok('cache name changed after deploy: ' + initialCacheName + ' -> ' + afterCacheName);
  else fail('cache name did NOT change after deploy', { initialCacheName, afterCacheName });

  if (reloaded) ok('the open tab auto-reloaded when the new service worker took over');
  else fail('the open tab never auto-reloaded');

  const cssAfter = await page.evaluate(() => fetch('/css/style.css').then((r) => r.text()));
  if (cssAfter.includes('deploy marker')) ok('page now serves the NEW css content (no manual cache clear needed)');
  else fail('page still serving stale css after the simulated deploy');

  // revert the test change to the real source file
  const original = fs.readFileSync(CSS_FILE, 'utf8').replace('\n/* deploy marker */\n', '');
  fs.writeFileSync(CSS_FILE, original);

  await ctx.close();
  stopServer();
  console.log('done');
})().catch((e) => {
  console.error(e);
  try {
    const original = fs.readFileSync(CSS_FILE, 'utf8').replace('\n/* deploy marker */\n', '');
    fs.writeFileSync(CSS_FILE, original);
  } catch (e2) {}
  stopServer();
  process.exit(1);
});
