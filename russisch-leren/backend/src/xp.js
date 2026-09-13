// One place that answers "how much XP does this user have?": correct
// exercise answers, passed level exams, and activity events (keyboard
// trainer rounds, number dictation, dialogue turns). Used by the progress
// page, the leaderboard and the Home Assistant sensor, so they can't drift.
const db = require('./db');
const { XP_PER_CORRECT, XP_PER_CERTIFICATION } = require('./gamification');

// XP per activity kind, decided server-side so a client can't award itself.
const ACTIVITY_XP = {
  keyboard_round: (d) => 20 + (d && Number(d.accuracy) >= 95 ? 10 : 0) + (d && Number(d.cpm) >= 120 ? 10 : 0),
  dictation_correct: () => 5,
  dialogue_turn: () => 5,
  phrasebook_listen: () => 0,
  // Reading a story and answering its comprehension questions. The client
  // reports the score, so it is clamped to the question count it also
  // reports, and that count is capped -- a client can't invent a 500-question
  // story to mint XP. A story pays out once: re-reading it is worth doing,
  // but the answers are known by then, so it would be an XP faucet.
  story_finished: (d, userId) => {
    const storyId = d && d.story ? String(d.story) : null;
    if (storyId && userId) {
      const seen = db
        .prepare("SELECT 1 FROM activity_events WHERE user_id = ? AND kind = 'story_finished' AND json_extract(detail, '$.story') = ? LIMIT 1")
        .get(userId, storyId);
      if (seen) return 0;
    }
    const total = Math.min(10, Math.max(0, Math.round(Number(d && d.total) || 0)));
    const score = Math.min(total, Math.max(0, Math.round(Number(d && d.score) || 0)));
    return 10 + score * 5;
  },
  handwriting_round: (d) => 20 + (d && Number(d.score) >= 80 ? 10 : 0)
};

function activityXp(kind, detail, userId) {
  const fn = ACTIVITY_XP[kind];
  return fn ? Math.max(0, Math.round(fn(detail || {}, userId))) : null;
}

function certificationsFor(userId) {
  return db
    .prepare(
      `SELECT lc.level, lc.passed_at, ea.score, ea.total
       FROM level_certifications lc JOIN exam_attempts ea ON ea.id = lc.exam_attempt_id
       WHERE lc.user_id = ?`
    )
    .all(userId)
    .map((r) => ({ level: r.level, passedAt: r.passed_at, score: r.score, total: r.total }));
}

function computeXp(userId) {
  const correctCount = db.prepare('SELECT COUNT(*) c FROM attempts WHERE user_id = ? AND is_correct = 1').get(userId).c;
  const certifications = certificationsFor(userId);
  const activity = db.prepare('SELECT COALESCE(SUM(xp), 0) s, COUNT(*) n FROM activity_events WHERE user_id = ?').get(userId);
  const xp = correctCount * XP_PER_CORRECT + certifications.length * XP_PER_CERTIFICATION + activity.s;
  return { xp, correctCount, certifications, activityXp: activity.s, activityCount: activity.n };
}

module.exports = { ACTIVITY_XP, activityXp, computeXp, certificationsFor };
