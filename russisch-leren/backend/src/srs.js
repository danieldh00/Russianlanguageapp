// Minimal SM-2-style spaced repetition scheduler.
function schedule(progress, isCorrect) {
  let { ease_factor, interval_days, repetitions } = progress;

  if (isCorrect) {
    repetitions += 1;
    if (repetitions === 1) interval_days = 1;
    else if (repetitions === 2) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    ease_factor = Math.max(1.3, ease_factor + 0.1);
  } else {
    repetitions = 0;
    interval_days = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  }

  const nextReview = new Date(Date.now() + interval_days * 24 * 60 * 60 * 1000);
  return { ease_factor, interval_days, repetitions, next_review_at: nextReview.toISOString() };
}

module.exports = { schedule };
