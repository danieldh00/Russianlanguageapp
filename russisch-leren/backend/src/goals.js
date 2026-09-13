// Weekly goal and streak freezes.
//
// The weekly goal is what turns "study when you feel like it" into a target
// you can miss and notice: XP earned since Monday, and the number of days you
// showed up. A streak freeze covers exactly one missed day, so a single busy
// Tuesday doesn't throw away a 40-day streak. Freezes are earned by keeping
// the streak (one per full week) and capped, so they stay a safety net rather
// than a way to keep a streak without studying.
const db = require('./db');
const { XP_PER_CORRECT, XP_PER_CERTIFICATION, computeStreak } = require('./gamification');

const GOAL_XP_CHOICES = [250, 500, 1000, 2000];
const GOAL_DAYS_CHOICES = [3, 4, 5, 6, 7];
const MAX_FREEZES = 2;
const DAYS_PER_FREEZE = 7;

const dayKey = (d) => d.toISOString().slice(0, 10);

function utcToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function shiftDays(date, delta) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + delta);
  return d;
}

// Monday 00:00 UTC of the week `date` falls in. Dutch weeks start on Monday,
// and so does every "this week" number the app shows.
function weekStart(date = utcToday()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const weekday = (d.getUTCDay() + 6) % 7; // Mon = 0 ... Sun = 6
  return shiftDays(d, -weekday);
}

function getPrefs(userId) {
  db.prepare('INSERT OR IGNORE INTO user_prefs (user_id) VALUES (?)').run(userId);
  return db.prepare('SELECT weekly_goal_xp, weekly_goal_days, freezes, last_freeze_streak FROM user_prefs WHERE user_id = ?').get(userId);
}

function setGoal(userId, { weeklyXp, weeklyDays }) {
  const prefs = getPrefs(userId);
  const xp = GOAL_XP_CHOICES.includes(Number(weeklyXp)) ? Number(weeklyXp) : prefs.weekly_goal_xp;
  const days = GOAL_DAYS_CHOICES.includes(Number(weeklyDays)) ? Number(weeklyDays) : prefs.weekly_goal_days;
  db.prepare('UPDATE user_prefs SET weekly_goal_xp = ?, weekly_goal_days = ?, updated_at = datetime(\'now\') WHERE user_id = ?').run(xp, days, userId);
  return getPrefs(userId);
}

// Every day the learner was counted present: a real study day, or one a
// freeze paid for. This is the set the streak is computed over.
function streakDates(userId) {
  const study = db.prepare('SELECT study_date AS d FROM study_days WHERE user_id = ?').all(userId).map((r) => r.d);
  const frozen = db.prepare('SELECT freeze_date AS d FROM streak_freezes WHERE user_id = ?').all(userId).map((r) => r.d);
  return [...study, ...frozen];
}

// Spend a freeze on yesterday if that is the day about to break the streak,
// then award new freezes for every full week the streak has survived.
// Returns what changed, so the client can say "een vriezer heeft gisteren
// opgevangen" instead of silently moving the number.
function maintainStreak(userId) {
  const prefs = getPrefs(userId);
  let freezes = prefs.freezes;
  let spentOn = null;
  const dates = new Set(streakDates(userId));

  const today = utcToday();
  const yesterday = dayKey(shiftDays(today, -1));
  const dayBefore = dayKey(shiftDays(today, -2));

  // Only ever covers the single day that just lapsed, and only when there was
  // a streak to protect: coming back after a week away starts fresh.
  if (freezes > 0 && !dates.has(yesterday) && dates.has(dayBefore)) {
    db.prepare('INSERT OR IGNORE INTO streak_freezes (user_id, freeze_date) VALUES (?, ?)').run(userId, yesterday);
    freezes -= 1;
    spentOn = yesterday;
    dates.add(yesterday);
  }

  const { currentStreak, longestStreak } = computeStreak([...dates]);

  // One freeze per full week of streak, never more than MAX_FREEZES in hand.
  // last_freeze_streak remembers the streak length we last paid out for, so a
  // streak that keeps running doesn't pay out again for the same week.
  let lastPaidStreak = prefs.last_freeze_streak;
  let earned = 0;
  if (currentStreak < lastPaidStreak) lastPaidStreak = 0; // streak broke: start counting again
  const weeksNow = Math.floor(currentStreak / DAYS_PER_FREEZE);
  const weeksPaid = Math.floor(lastPaidStreak / DAYS_PER_FREEZE);
  if (weeksNow > weeksPaid) {
    earned = Math.min(weeksNow - weeksPaid, MAX_FREEZES - freezes);
    if (earned < 0) earned = 0;
    freezes += earned;
    lastPaidStreak = currentStreak;
  }

  if (freezes !== prefs.freezes || lastPaidStreak !== prefs.last_freeze_streak) {
    db.prepare("UPDATE user_prefs SET freezes = ?, last_freeze_streak = ?, updated_at = datetime('now') WHERE user_id = ?").run(freezes, lastPaidStreak, userId);
  }

  return { currentStreak, longestStreak, freezes, maxFreezes: MAX_FREEZES, freezeSpentOn: spentOn, freezesEarned: earned };
}

// XP earned since Monday, split the same three ways as total XP, plus the
// days the learner actually showed up this week.
function weeklyProgress(userId) {
  const prefs = getPrefs(userId);
  const start = dayKey(weekStart());

  const correct = db
    .prepare("SELECT COUNT(*) c FROM attempts WHERE user_id = ? AND is_correct = 1 AND date(created_at) >= ?")
    .get(userId, start).c;
  const certs = db
    .prepare('SELECT COUNT(*) c FROM level_certifications WHERE user_id = ? AND date(passed_at) >= ?')
    .get(userId, start).c;
  const activity = db
    .prepare('SELECT COALESCE(SUM(xp), 0) s FROM activity_events WHERE user_id = ? AND date(created_at) >= ?')
    .get(userId, start).s;

  const xp = correct * XP_PER_CORRECT + certs * XP_PER_CERTIFICATION + activity;
  const days = db
    .prepare('SELECT study_date AS d FROM study_days WHERE user_id = ? AND study_date >= ? ORDER BY study_date')
    .all(userId, start)
    .map((r) => r.d);
  const frozenDays = db
    .prepare('SELECT freeze_date AS d FROM streak_freezes WHERE user_id = ? AND freeze_date >= ? ORDER BY freeze_date')
    .all(userId, start)
    .map((r) => r.d);

  return {
    weekStart: start,
    goalXp: prefs.weekly_goal_xp,
    goalDays: prefs.weekly_goal_days,
    xp,
    days: days.length,
    dayDates: days,
    frozenDates: frozenDays,
    xpPct: prefs.weekly_goal_xp ? Math.min(100, Math.round((xp / prefs.weekly_goal_xp) * 100)) : 0,
    daysPct: prefs.weekly_goal_days ? Math.min(100, Math.round((days.length / prefs.weekly_goal_days) * 100)) : 0,
    reached: xp >= prefs.weekly_goal_xp && days.length >= prefs.weekly_goal_days
  };
}

module.exports = {
  GOAL_XP_CHOICES,
  GOAL_DAYS_CHOICES,
  MAX_FREEZES,
  weekStart,
  getPrefs,
  setGoal,
  streakDates,
  maintainStreak,
  weeklyProgress
};
