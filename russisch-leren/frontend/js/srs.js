// Client-side mirror of backend/src/srs.js. Duplicated on purpose: the
// frontend is static (no build/bundle step), so it can't import the server
// module directly. Keep the two in sync if the scheduling rules ever change.
function scheduleReview(progress, isCorrect) {
  let easeFactor = progress.easeFactor != null ? progress.easeFactor : 2.5;
  let intervalDays = progress.intervalDays || 0;
  let repetitions = progress.repetitions || 0;

  if (isCorrect) {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1);
  } else {
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
  return { easeFactor, intervalDays, repetitions, nextReviewAt };
}
