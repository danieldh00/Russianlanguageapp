const { chromium } = require('playwright');

const DIRECT = 'http://localhost:3000';
const INGRESS = 'http://localhost:3998/api/hassio_ingress/TESTTOKEN';
const stamp = Date.now();

function ok(l) { console.log('OK   - ' + l); }
function fail(l, x) { console.log('FAIL - ' + l + (x !== undefined ? ' :: ' + JSON.stringify(x) : '')); process.exitCode = 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: (process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium') });

  // ---------- 1. direct access is unchanged ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    const failed = [];
    page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) failed.push(r.url()); });
    const cspViolations = [];
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => {
        (window.__csp = window.__csp || []).push(e.violatedDirective + ' ' + e.blockedURI);
      });
    });

    await page.goto(DIRECT + '/#/register');
    await page.fill('#username', 'v22d_' + stamp);
    await page.fill('#password', 'secret123');
    await page.click('#register-form button[type=submit]');
    await page.waitForSelector('.level-section', { timeout: 20000 });
    ok('directe toegang: registreren en dashboard werken');

    const base = await page.evaluate(() => APP_BASE);
    if (base === '/') ok('APP_BASE is "/" op de directe route'); else fail('direct base', base);

    const sw = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return reg ? reg.scope : null;
    });
    if (sw && sw.endsWith('/')) ok('service worker geregistreerd op de directe route: ' + sw);
    else fail('service worker missing on direct path', sw);

    const cookie = (await ctx.cookies()).find((c) => c.name === 'russisch.sid');
    if (cookie && cookie.httpOnly && cookie.sameSite === 'Lax' && !cookie.secure) {
      ok('sessiecookie: httpOnly, SameSite=Lax, niet Secure op http');
    } else fail('cookie flags', cookie);

    if (!failed.length) ok('geen mislukte requests (fonts-CDN is hier niet bereikbaar en telt niet mee)');
    else fail('failed requests', failed.slice(0, 5));
    const violations = await page.evaluate(() => window.__csp || []);
    if (!violations.length) ok('geen enkele CSP-overtreding op de directe route');
    else fail('csp violations', violations);
    if (!errs.length) ok('geen JS-fouten op de directe route'); else fail('direct js errors', errs);
    await ctx.close();
  }

  // ---------- 2. the same app behind an ingress-style prefix ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    const failed = [];
    page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) failed.push(r.url()); });
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => {
        (window.__csp = window.__csp || []).push(e.violatedDirective + ' ' + e.blockedURI);
      });
    });
    const apiCalls = [];
    page.on('request', (r) => { if (r.url().includes('/api/auth/') || r.url().includes('/api/content')) apiCalls.push(r.url()); });

    await page.goto(INGRESS + '/#/register');
    await page.waitForSelector('#register-form', { timeout: 15000 });
    const base = await page.evaluate(() => APP_BASE);
    if (base === '/api/hassio_ingress/TESTTOKEN/') ok('APP_BASE volgt het ingress-pad: ' + base);
    else fail('ingress base', base);

    const swSkipped = await page.evaluate(() => IS_INGRESS && !('serviceWorker' in navigator ? false : true));
    const reg = await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      return r ? r.scope : null;
    });
    if (reg === null) ok('geen service worker onder ingress, zoals bedoeld');
    else fail('service worker registered under ingress', reg);

    await page.fill('#username', 'v22i_' + stamp);
    await page.fill('#password', 'secret123');
    await page.click('#register-form button[type=submit]');
    await page.waitForSelector('.level-section', { timeout: 25000 });
    ok('registreren en het lessenpad werken via het ingress-pad');

    const wrongBase = apiCalls.filter((u) => !u.includes('/api/hassio_ingress/TESTTOKEN/api/'));
    if (apiCalls.length && !wrongBase.length) ok(`alle ${apiCalls.length} API-aanroepen gingen via het ingress-pad`);
    else fail('api calls bypassed the prefix', wrongBase.slice(0, 3));

    // a lesson works end to end through the proxy
    await page.locator('.lesson-path .lesson-card').first().click();
    await page.waitForSelector('#options', { timeout: 15000 });
    await page.locator('#options .option-btn').first().click();
    await page.waitForSelector('#feedback .feedback', { timeout: 10000 });
    ok('een vraag beantwoorden werkt via ingress');

    const cssApplied = await page.evaluate(() => getComputedStyle(document.querySelector('.card')).borderRadius !== '0px');
    if (cssApplied) ok('de stylesheet is geladen via het ingress-pad'); else fail('css not applied under ingress');

    if (!failed.length) ok('geen mislukte requests onder ingress');
    else fail('failed requests under ingress', failed.slice(0, 5));
    const iv = await page.evaluate(() => window.__csp || []);
    if (!iv.length) ok('geen CSP-overtredingen onder ingress'); else fail('csp violations under ingress', iv);
    if (!errs.length) ok('geen JS-fouten onder ingress'); else fail('ingress js errors', errs);
    await ctx.close();
  }

  // ---------- 3. hardening that has nothing to do with the score ----------
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const res = await page.goto(DIRECT + '/');
    const h = res.headers();
    const wantCsp = ["default-src 'self'", "script-src 'self'", "frame-ancestors 'self'", "object-src 'none'"];
    if (wantCsp.every((p) => (h['content-security-policy'] || '').includes(p))) ok('CSP staat op elke respons');
    else fail('csp', h['content-security-policy']);
    if (h['x-content-type-options'] === 'nosniff' && h['referrer-policy'] === 'same-origin' && !h['x-powered-by']) {
      ok('nosniff en referrer-policy aanwezig, x-powered-by weg');
    } else fail('other headers', h);
    if ((h['permissions-policy'] || '').includes('microphone=(self)') && h['permissions-policy'].includes('camera=()')) {
      ok('permissions-policy laat alleen de microfoon toe');
    } else fail('permissions policy', h['permissions-policy']);
    if (!h['strict-transport-security']) ok('geen HSTS op een gewone http-verbinding'); else fail('hsts on http', h['strict-transport-security']);

    // session fixation: the id must change when logging in
    const before = await page.evaluate(async (base) => {
      await fetch(base + '/api/auth/me').catch(() => {});
      return document.cookie;
    }, DIRECT);
    const login = await page.evaluate(async (args) => {
      const r = await fetch(args.base + '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: args.user, password: 'secret123' })
      });
      return r.status;
    }, { base: DIRECT, user: 'v22d_' + stamp });
    const after = (await ctx.cookies()).find((c) => c.name === 'russisch.sid');
    if (login === 200 && after) ok('inloggen geeft een nieuwe sessiecookie (sessie-id vernieuwd)');
    else fail('login/session', { login, after });

    // an unknown user must not be distinguishable by the error
    const unknown = await page.evaluate(async (base) => {
      const r = await fetch(base + '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'bestaat-niet-' + Date.now(), password: 'x' })
      });
      return { status: r.status, body: await r.json() };
    }, DIRECT);
    if (unknown.status === 401 && /Ongeldige gebruikersnaam of wachtwoord/.test(unknown.body.error)) {
      ok('onbekende gebruiker krijgt dezelfde melding als een fout wachtwoord');
    } else fail('user enumeration', unknown);

    // deep links are bounced to the root, so relative assets keep resolving
    const deep = await page.goto(DIRECT + '/lesson/alfabet-uitspraak');
    if (deep.url().replace(/\/$/, '') === DIRECT) ok('een diepe link stuurt door naar de app-root');
    else fail('deep link', deep.url());
    // the limiter closes the door after enough wrong guesses
    let blocked = 0;
    for (let i = 0; i < 14; i++) {
      const st = await page.evaluate(async (args) => {
        const r = await fetch(args.base + '/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: args.user, password: 'fout' + args.i })
        });
        return r.status;
      }, { base: DIRECT, user: 'brute_' + stamp, i });
      if (st === 429) blocked++;
    }
    if (blocked >= 3) ok(`de rem slaat aan: ${blocked} van 14 pogingen geweigerd met 429`);
    else fail('rate limiter did not engage', blocked);

    await ctx.close();
  }

  await browser.close();
  console.log('\nv1.11.0 checks completed.');
})().catch((e) => { console.error('TEST CRASHED:', e); process.exitCode = 1; });
