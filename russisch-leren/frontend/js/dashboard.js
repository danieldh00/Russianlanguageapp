// ---------- dashboard (fully local: content + word-progress mirror) ----------

function categoryStats(username, content, slug) {
  const wordProgress = Storage.loadWordProgress(username);
  const exercises = content.exercises.filter((e) => e.category === slug);
  const wordIds = [...new Set(exercises.filter((e) => e.wordId != null).map((e) => e.wordId))];
  let mastered = 0, started = 0, due = 0;
  const now = Date.now();
  wordIds.forEach((id) => {
    const p = wordProgress[id];
    if (p) {
      started++;
      if (p.intervalDays >= 6) mastered++;
      if (p.nextReviewAt && new Date(p.nextReviewAt).getTime() <= now) due++;
    }
  });
  return { totalWords: wordIds.length, masteredWords: mastered, startedWords: started, dueWords: due, totalExercises: exercises.length };
}

// The learning path with real locks. A lesson is "done" once every word in
// it has been practised at least once (mastery via spaced repetition takes
// days and would make the lock absurd); the next lesson in the level unlocks
// when the one before it is done. Grammar/sentence-only lessons carry no
// tracked words, so they never block the lesson after them -- they just
// open together with the lesson they follow. A level unlocks once the
// previous level's exam is passed, or once all of its lessons are done.
// Used by the dashboard for rendering and by the lesson/exam routes to
// refuse direct navigation to something that's still locked.
function computePath(content, username) {
  const stats = Storage.loadStats(username);
  const certified = new Set((stats && stats.certifiedLevels) || []);
  const levels = levelsOf(content);
  const bySlug = new Map();
  const byLevel = new Map();
  let previousLevelDone = true; // the first level is always open
  let currentAssigned = false;

  levels.forEach(({ level }, li) => {
    const entries = content.categories
      .filter((c) => c.level === level)
      .map((cat) => ({ cat, stats: categoryStats(username, content, cat.slug) }));
    if (!entries.length) return;
    const prevLevel = li > 0 ? levels[li - 1].level : null;
    const levelUnlocked = li === 0 || certified.has(prevLevel) || previousLevelDone;

    let gate = levelUnlocked;
    let allDone = true;
    entries.forEach(({ cat, stats: s }) => {
      const hasWords = s.totalWords > 0;
      const done = hasWords ? s.startedWords === s.totalWords : true;
      const mastered = hasWords && s.masteredWords === s.totalWords;
      const unlocked = gate;
      const current = unlocked && !currentAssigned && hasWords && !done;
      if (current) currentAssigned = true;
      bySlug.set(cat.slug, { cat, stats: s, unlocked, done, mastered, current, level });
      if (hasWords && !done) { gate = false; allDone = false; }
    });
    byLevel.set(level, { unlocked: levelUnlocked, passed: certified.has(level), allDone, entries: entries.map((e) => e.cat.slug), prevLevel });
    previousLevelDone = allDone;
  });

  return { bySlug, byLevel, levels };
}

// The lesson a locked one is waiting on: the nearest earlier lesson (same
// level) with words still to practise -- or the previous level as a whole.
function lockReason(path, slug) {
  const node = path.bySlug.get(slug);
  if (!node) return null;
  const level = path.byLevel.get(node.level);
  if (!level.unlocked) return `Rond eerst niveau ${level.prevLevel} af: maak de toets van ${level.prevLevel} of oefen alle lessen van dat niveau.`;
  const idx = level.entries.indexOf(slug);
  for (let i = idx - 1; i >= 0; i--) {
    const prev = path.bySlug.get(level.entries[i]);
    if (prev.stats.totalWords > 0 && !prev.done) {
      return `Rond eerst '${prev.cat.name}' af (${prev.stats.startedWords}/${prev.stats.totalWords} woorden geoefend).`;
    }
  }
  return 'Deze les is nog vergrendeld.';
}

async function renderDashboard() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();

  const username = state.user.username;
  const path = computePath(content, username);
  const certified = new Set([...path.byLevel.entries()].filter(([, l]) => l.passed).map(([lvl]) => lvl));
  const allStats = content.categories.map((cat) => {
    const node = path.bySlug.get(cat.slug);
    return { cat, stats: node ? node.stats : categoryStats(username, content, cat.slug) };
  });

  const levels = levelsOf(content);
  const wrapper = el(`
    <div>
      <h1>Jouw pad door het Russisch</h1>
      <p class="muted">Van A1 tot C2. Extra oefenvormen staan onder ✨ Oefenen.</p>
      <div class="level-jump" id="level-jump"></div>
      <div id="goal-slot"></div>
      <div id="practice-slot"></div>
      <div id="levels"></div>
    </div>
  `);
  app.innerHTML = '';
  app.appendChild(wrapper);

  // The lesson path is what this screen is for, so the practice tools moved
  // to their own tab. What stays here is only what is due today, as a single
  // line of chips: eight tiles pushed the first lesson off the screen.
  const openMistakes = mistakeExercises(content, username).length;
  const dueCount = dueWordIds(content, username).length;
  const strip = el(`<div class="daily-strip"></div>`);
  const chip = (cls, label, href, count) => {
    const a = el(`<a class="daily-chip ${cls}" href="${href}"></a>`);
    a.appendChild(document.createTextNode(label));
    if (count != null) a.appendChild(el(`<span class="daily-count">${count}</span>`));
    strip.appendChild(a);
  };
  if (dueCount) chip('due', '🔁 Herhalen', '#/review', dueCount);
  if (openMistakes) chip('mistakes', '🎯 Je fouten', '#/practice', openMistakes);
  chip('more', dueCount || openMistakes ? '✨ Meer oefenen' : '✨ Oefenen', '#/tools', null);
  wrapper.querySelector('#practice-slot').appendChild(strip);

  const goalCard = renderWeeklyGoalCard();
  if (goalCard) wrapper.querySelector('#goal-slot').appendChild(goalCard);

  const jump = wrapper.querySelector('#level-jump');
  const levelsRoot = wrapper.querySelector('#levels');
  let nodeNumber = 0;

  levels.forEach(({ level, title, description }) => {
    const entries = allStats.filter(({ cat }) => cat.level === level);
    if (!entries.length) return;
    const levelWords = entries.reduce((acc, e) => acc + e.stats.totalWords, 0);
    const levelMastered = entries.reduce((acc, e) => acc + e.stats.masteredWords, 0);
    const levelPct = levelWords ? Math.round((levelMastered / levelWords) * 100) : 0;
    const passed = certified.has(level);
    const levelState = path.byLevel.get(level);
    const levelLocked = !(levelState && levelState.unlocked);

    const pill = el(`<a class="level-pill ${passed ? 'passed' : ''}" href="#level-${level}">${level}${passed ? ' ✓' : ''}</a>`);
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(`level-${level}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    jump.appendChild(pill);

    const section = el(`
      <section class="level-section ${levelLocked ? 'locked' : ''}" id="level-${level}">
        <header class="level-header">
          <div class="level-header-main">
            <span class="level-code">${levelLocked ? '🔒' : level}</span>
            <div>
              <h2>${escapeHtml(title)}</h2>
              <p class="muted">${escapeHtml(description || '')}</p>
            </div>
          </div>
          <div class="level-header-stats">
            <span class="muted">${levelMastered}/${levelWords} woorden onder de knie &middot; ${entries.length} lessen</span>
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${levelPct}%"></div></div>
          </div>
        </header>
        <div class="lesson-path"></div>
      </section>
    `);
    const pathEl = section.querySelector('.lesson-path');

    entries.forEach(({ cat, stats: s }) => {
      nodeNumber++;
      const node = path.bySlug.get(cat.slug);
      const hasWords = s.totalWords > 0;
      const pct = hasWords ? Math.round((s.startedWords / s.totalWords) * 100) : 0;

      let nodeState = 'available';
      if (!node.unlocked) nodeState = 'locked';
      else if (node.mastered) nodeState = 'complete';
      else if (node.done) nodeState = 'done';
      else if (node.current) nodeState = 'current';

      const marker = node.mastered ? '✓' : nodeState === 'locked' ? '🔒' : String(nodeNumber);
      let progressLine;
      if (!hasWords) progressLine = `${s.totalExercises} oefeningen &middot; altijd te herhalen`;
      else if (node.mastered) progressLine = `Alle ${s.totalWords} woorden onder de knie${s.dueWords ? ` &middot; ${s.dueWords} te herhalen` : ''}`;
      else progressLine = `${s.startedWords}/${s.totalWords} woorden geoefend &middot; ${s.masteredWords} onder de knie${s.dueWords ? ` &middot; ${s.dueWords} te herhalen` : ''}`;
      const lockLine = nodeState === 'locked' ? `<p class="lock-reason">🔒 ${escapeHtml(lockReason(path, cat.slug))}</p>` : '';

      const nodeEl = el(`
        <div class="path-node ${nodeState}">
          <div class="path-marker">${marker}</div>
          <button class="card lesson-card" type="button" ${nodeState === 'locked' ? 'aria-disabled="true"' : ''}>
            <div class="row1"><h2>${escapeHtml(cat.name)}</h2><span class="level-badge">${escapeHtml(cat.level)}</span></div>
            <p class="muted">${escapeHtml(cat.description || '')}</p>
            <p class="muted">${progressLine}</p>
            ${lockLine}
            ${hasWords ? `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>` : ''}
          </button>
        </div>
      `);
      nodeEl.querySelector('.lesson-card').addEventListener('click', () => {
        if (nodeState === 'locked') return;
        location.hash = `#/lesson/${cat.slug}`;
      });
      pathEl.appendChild(nodeEl);
    });

    const examNode = el(`
      <div class="path-node exam ${passed ? 'complete' : levelLocked ? 'locked' : ''}">
        <div class="path-marker">${passed ? '🎓' : levelLocked ? '🔒' : '📝'}</div>
        <button class="card lesson-card exam-card" type="button" ${levelLocked ? 'aria-disabled="true"' : ''}>
          <div class="row1"><h2>Niveautoets ${level}</h2><span class="level-badge">${passed ? 'behaald' : 'toets'}</span></div>
          <p class="muted">${passed
            ? `Gehaald! Je hebt niveau ${level} officieel afgesloten. Je kunt de toets altijd opnieuw maken.`
            : `30 vragen uit alle lessen van ${level}. Bij 80% of hoger sluit je het niveau af, verdien je 150 XP en gaat het volgende niveau open. Alleen online.`}</p>
        </button>
      </div>
    `);
    examNode.querySelector('.exam-card').addEventListener('click', () => {
      if (levelLocked) return;
      location.hash = `#/exam/${level}`;
    });
    pathEl.appendChild(examNode);

    levelsRoot.appendChild(section);
  });
}

