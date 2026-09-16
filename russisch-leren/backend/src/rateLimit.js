// A small fixed-window limiter, used to slow down password guessing.
//
// Deliberately in-memory: it protects a single-process add-on on a home
// network, and losing the counters on restart is not worth a database write
// per login attempt. Keys are pruned as they expire, so it cannot grow
// without bound.
//
// Only *failed* logins count against the budget. Counting successes too would
// punish the household that simply logs in on several devices -- and under
// Ingress every request arrives from the same Supervisor address, so one busy
// evening would lock everyone out.
const buckets = new Map();

function prune(now) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

// How long the caller still has to wait, or 0 when they are within budget.
function blockedFor(keys, max, now = Date.now()) {
  let wait = 0;
  for (const key of keys) {
    const bucket = buckets.get(key);
    if (bucket && bucket.resetAt > now && bucket.count >= max) wait = Math.max(wait, bucket.resetAt - now);
  }
  return wait;
}

function record(keys, windowMs, now = Date.now()) {
  prune(now);
  for (const key of keys) {
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + windowMs });
    else bucket.count += 1;
  }
}

function reset(keys) {
  for (const key of keys) buckets.delete(key);
}

// Counts per IP and per username separately: one attacker spraying many
// accounts is caught by the IP bucket, many devices guessing one account by
// the username bucket.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 10;

function loginKeys(req) {
  const name = req.body && req.body.username ? String(req.body.username).toLowerCase() : null;
  return [`login-ip:${req.ip}`, name ? `login-user:${name}` : null].filter(Boolean);
}

function loginGuard(req, res, next) {
  const wait = blockedFor(loginKeys(req), LOGIN_MAX);
  if (!wait) return next();
  const minutes = Math.ceil(wait / 60000);
  res.setHeader('Retry-After', String(Math.ceil(wait / 1000)));
  return res.status(429).json({ error: `Te veel mislukte inlogpogingen. Probeer het over ${minutes} ${minutes === 1 ? 'minuut' : 'minuten'} opnieuw.` });
}

const noteLoginFailure = (req) => record(loginKeys(req), LOGIN_WINDOW_MS);
const clearLoginFailures = (req) => reset(loginKeys(req));

// Generous on purpose: a household adding accounts should never notice it,
// while a script hammering the endpoint still gets stopped.
const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX = 20;

function registerGuard(req, res, next) {
  const keys = [`register-ip:${req.ip}`];
  const wait = blockedFor(keys, REGISTER_MAX);
  if (wait) {
    const minutes = Math.ceil(wait / 60000);
    res.setHeader('Retry-After', String(Math.ceil(wait / 1000)));
    return res.status(429).json({ error: `Te veel accounts aangemaakt vanaf dit adres. Probeer het over ${minutes} ${minutes === 1 ? 'minuut' : 'minuten'} opnieuw.` });
  }
  record(keys, REGISTER_WINDOW_MS);
  next();
}

// Every AI call is a billed Anthropic request, so this is a cost guard, not
// just an abuse guard. Two windows per account: a short burst budget (a
// normal dialogue turn-by-turn session, or a couple of mistake explanations
// in a row, never comes close) and a daily ceiling that bounds worst case
// spend from one compromised or careless account. Keyed by user id, not IP:
// under Ingress every request already arrives from the same Supervisor
// address, so an IP-based limit would either be useless or punish everyone.
const AI_BURST_WINDOW_MS = 10 * 60 * 1000;
const AI_BURST_MAX = 20;
const AI_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const AI_DAILY_MAX = 150;

function aiKeys(userId) {
  return [`ai-burst:${userId}`, `ai-daily:${userId}`];
}

function aiGuard(req, res, next) {
  const userId = req.session && req.session.userId;
  const [burstKey, dailyKey] = aiKeys(userId);
  const wait = Math.max(blockedFor([burstKey], AI_BURST_MAX), blockedFor([dailyKey], AI_DAILY_MAX));
  if (wait) {
    const minutes = Math.ceil(wait / 60000);
    res.setHeader('Retry-After', String(Math.ceil(wait / 1000)));
    return res.status(429).json({ error: `Te veel AI-verzoeken. Probeer het over ${minutes} ${minutes === 1 ? 'minuut' : 'minuten'} opnieuw.` });
  }
  record([burstKey], AI_BURST_WINDOW_MS);
  record([dailyKey], AI_DAILY_WINDOW_MS);
  next();
}

module.exports = { loginGuard, noteLoginFailure, clearLoginFailures, registerGuard, aiGuard, _buckets: buckets };
