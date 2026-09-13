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

function isCorrectAnswer(exercise, givenAnswer) {
  return normalizeAnswer(givenAnswer) === normalizeAnswer(exercise.correct_answer);
}

module.exports = { normalizeAnswer, isCorrectAnswer };
