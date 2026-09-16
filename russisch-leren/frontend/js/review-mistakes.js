// ---------- "Vandaag herhalen": every due word, across all lessons ----------

function dueWordIds(content, username) {
  const wordProgress = Storage.loadWordProgress(username);
  const now = Date.now();
  const known = new Set(content.exercises.filter((e) => e.wordId != null).map((e) => e.wordId));
  return Object.keys(wordProgress)
    .map(Number)
    .filter((id) => known.has(id) && wordProgress[id].nextReviewAt && new Date(wordProgress[id].nextReviewAt).getTime() <= now)
    .sort((a, b) => new Date(wordProgress[a].nextReviewAt) - new Date(wordProgress[b].nextReviewAt));
}

// Shown when a session has material but every piece of it is an exercise
// kind the learner switched off (or quiet mode rules out right now).
function renderNoAllowedExercises(title) {
  const off = disabledPartLabels();
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="card">
      <h1>${escapeHtml(title)}</h1>
      <p class="muted">Er staat wel materiaal klaar, maar alleen in oefenvormen die nu uitstaan${off.length ? ` (${escapeHtml(off.join(', '))})` : ''}. Zet er één weer aan, of schakel de stille modus uit.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <a class="secondary-link" href="#/settings">Naar instellingen</a>
        <a class="secondary-link" href="#/dashboard">Terug naar lessen</a>
      </div>
    </div>
  `));
}

// One exercise per due word (the most overdue first), preferring the
// production forms -- typing and cloze -- over recognition, since a word
// you can still produce is the one that's really still known. The result is
// spread, so words that ask nearly the same thing keep their distance.
async function renderReviewSession() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const ids = dueWordIds(content, state.user.username).slice(0, 20);
  if (!ids.length) {
    app.innerHTML = '';
    app.appendChild(el(`
      <div class="card">
        <h1>🔁 Vandaag herhalen</h1>
        <p class="muted">Niets aan herhaling toe. De planner zet elk woord dat je goed had steeds verder in de toekomst; kom morgen terug of ga verder op het pad.</p>
        <a href="#/dashboard">Terug naar lessen</a>
      </div>
    `));
    return;
  }
  const byWord = new Map();
  for (const ex of content.exercises) {
    if (ex.wordId == null) continue;
    if (!byWord.has(ex.wordId)) byWord.set(ex.wordId, []);
    byWord.get(ex.wordId).push(ex);
  }
  const items = ids.map((id) => {
    const pool = allowedExercises(byWord.get(id) || []);
    if (!pool.length) return null;
    const production = pool.filter((e) => e.type === 'typing' || e.type === 'cloze');
    const pick = shuffle((production.length && Math.random() < 0.6) ? production : pool)[0];
    return withGrammarRule(content, pick);
  }).filter(Boolean);
  if (!items.length) return renderNoAllowedExercises('🔁 Vandaag herhalen');
  renderExercise({ category: { slug: '__review__', name: 'Herhaling van vandaag' }, items: spreadRelated(items), index: 0, correctCount: 0 });
}

// ---------- "Oefen je fouten": a session built from this device's mistake log ----------

// Exercises answered wrongly on this device, the ones missed most often (and
// most recently) first. An exercise drops off the list once its last answer
// here was correct -- so the list shrinks as you fix things.
function mistakeExercises(content, username) {
  const log = Storage.loadAttemptsLog(username); // newest first
  const stats = new Map();
  const lastOutcome = new Map();
  for (const a of log) {
    if (!lastOutcome.has(a.exerciseId)) lastOutcome.set(a.exerciseId, a.isCorrect);
    if (a.isCorrect) continue;
    const s = stats.get(a.exerciseId) || { count: 0, last: a.at };
    s.count++;
    stats.set(a.exerciseId, s);
  }
  const byId = new Map(content.exercises.map((e) => [e.id, e]));
  return [...stats.entries()]
    .filter(([id]) => byId.has(id) && lastOutcome.get(id) === false)
    .sort((a, b) => b[1].count - a[1].count || (b[1].last > a[1].last ? 1 : -1))
    .map(([id]) => byId.get(id));
}

async function renderMistakesPractice() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const pool = allowedExercises(mistakeExercises(content, state.user.username));
  if (!pool.length && mistakeExercises(content, state.user.username).length) {
    return renderNoAllowedExercises('Oefen je fouten');
  }
  if (!pool.length) {
    app.innerHTML = '';
    app.appendChild(el(`
      <div class="card">
        <h1>Oefen je fouten</h1>
        <p class="muted">Geen openstaande fouten op dit toestel: alles wat je fout had, heb je daarna goed beantwoord. Mooi zo.</p>
        <a href="#/dashboard">Terug naar lessen</a>
      </div>
    `));
    return;
  }
  const items = spreadRelated(roundRobinByWord(pool).slice(0, 10)).map((ex) => withGrammarRule(content, ex));
  renderExercise({ category: { slug: '__mistakes__', name: 'Oefen je fouten' }, items, index: 0, correctCount: 0 });
}

