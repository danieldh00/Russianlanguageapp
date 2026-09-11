const db = require('./db');
const { schedule } = require('./srs');

/**
 * Grades an answer, inserts the attempt and updates SRS state. Shared by the
 * single-answer route and the batch sync route so both paths stay identical.
 * `clientId` makes the insert idempotent (safe to retry from a device that
 * queued the attempt while offline); `clientTimestamp` (ISO string) lets a
 * synced offline attempt keep the time it actually happened, not the time it
 * reached the server.
 */
function recordAttempt(userId, exercise, givenAnswer, { clientId = null, clientTimestamp = null } = {}) {
  if (clientId) {
    const existing = db.prepare('SELECT id FROM attempts WHERE user_id = ? AND client_id = ?').get(userId, clientId);
    if (existing) {
      return buildResult(exercise, null, true);
    }
  }

  const given = (givenAnswer || '').toString();
  const isCorrect = given.trim().toLowerCase() === exercise.correct_answer.trim().toLowerCase() ? 1 : 0;

  const studyDate = (clientTimestamp ? new Date(clientTimestamp) : new Date()).toISOString().slice(0, 10);
  db.prepare('INSERT OR IGNORE INTO study_days (user_id, study_date) VALUES (?, ?)').run(userId, studyDate);

  if (clientTimestamp) {
    db.prepare(
      'INSERT INTO attempts (user_id, exercise_id, given_answer, is_correct, client_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, exercise.id, given, isCorrect, clientId, clientTimestamp);
  } else {
    db.prepare(
      'INSERT INTO attempts (user_id, exercise_id, given_answer, is_correct, client_id) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, exercise.id, given, isCorrect, clientId);
  }

  let srsInfo = null;
  if (exercise.word_id) {
    let progress = db.prepare('SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?').get(userId, exercise.word_id);
    if (!progress) {
      db.prepare('INSERT INTO user_word_progress (user_id, word_id) VALUES (?, ?)').run(userId, exercise.word_id);
      progress = db.prepare('SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?').get(userId, exercise.word_id);
    }
    const updated = schedule(progress, !!isCorrect);
    db.prepare(
      `UPDATE user_word_progress
       SET ease_factor = ?, interval_days = ?, repetitions = ?,
           correct_count = correct_count + ?, incorrect_count = incorrect_count + ?,
           next_review_at = ?, last_reviewed_at = ?
       WHERE id = ?`
    ).run(
      updated.ease_factor,
      updated.interval_days,
      updated.repetitions,
      isCorrect,
      isCorrect ? 0 : 1,
      updated.next_review_at,
      clientTimestamp || new Date().toISOString(),
      progress.id
    );
    srsInfo = updated;
  }

  return buildResult(exercise, { isCorrect: !!isCorrect, srsInfo }, false);
}

function buildResult(exercise, outcome, duplicate) {
  let grammarRule = null;
  if (exercise.grammar_rule_id) {
    grammarRule = db
      .prepare('SELECT code, title, explanation, example FROM grammar_rules WHERE id = ?')
      .get(exercise.grammar_rule_id);
  }
  return {
    duplicate,
    correct: outcome ? outcome.isCorrect : null,
    correctAnswer: exercise.correct_answer,
    explanation: exercise.explanation,
    grammarRule,
    srs: outcome ? outcome.srsInfo : null
  };
}

module.exports = { recordAttempt };
