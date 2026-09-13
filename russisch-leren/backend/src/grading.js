// One place for "is this answer right?", shared by lessons, offline sync and
// exams. Typed answers get a forgiving comparison: stress marks, ё/е, case,
// surrounding punctuation and extra whitespace never count against you.
function normalizeAnswer(value) {
  return (value == null ? '' : String(value))
    .normalize('NFC')
    .replace(/́/g, '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s ]+/g, ' ')
    .replace(/^[\s.,!?;:«»"'()-]+|[\s.,!?;:«»"'()-]+$/g, '')
    .trim();
}

// Stress exercises are the one place where the stress mark IS the answer
// (молоко́ vs моло́ко), so they're compared exactly.
function isCorrectAnswer(exercise, givenAnswer) {
  if (exercise.type === 'stress') {
    return String(givenAnswer == null ? '' : givenAnswer).normalize('NFC').trim() === String(exercise.correct_answer).normalize('NFC').trim();
  }
  return normalizeAnswer(givenAnswer) === normalizeAnswer(exercise.correct_answer);
}

module.exports = { normalizeAnswer, isCorrectAnswer };
