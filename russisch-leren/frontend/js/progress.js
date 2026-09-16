// ---------- progress (fully local: folded from the word-progress mirror + this device's attempt log) ----------

async function renderProgress() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();

  const username = state.user.username;
  const wordProgress = Storage.loadWordProgress(username);
  const attemptsLog = Storage.loadAttemptsLog(username);
  const wordIds = Object.keys(wordProgress);

  let correctAttempts = 0, totalAttempts = 0, wordsMastered = 0;
  wordIds.forEach((id) => {
    const p = wordProgress[id];
    correctAttempts += p.correctCount || 0;
    totalAttempts += (p.correctCount || 0) + (p.incorrectCount || 0);
    if (p.intervalDays >= 6) wordsMastered++;
  });
  const accuracyPct = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 1000) / 10 : 0;

  const totalWordsInContent = new Set(content.exercises.filter((e) => e.wordId != null).map((e) => e.wordId)).size;

  app.innerHTML = '';
  app.appendChild(el(`
    <div>
      <h1>Mijn voortgang</h1>
      <div class="stats-row">
        <div class="stat-box"><div class="value">${accuracyPct}%</div><div class="label">Nauwkeurigheid</div></div>
        <div class="stat-box"><div class="value">${wordsMastered}/${totalWordsInContent}</div><div class="label">Woorden onder de knie</div></div>
        <div class="stat-box"><div class="value">${wordIds.length}</div><div class="label">Woorden geoefend</div></div>
        <div class="stat-box"><div class="value">${totalAttempts}</div><div class="label">Totaal antwoorden</div></div>
      </div>
    </div>
  `));

  const stats = Storage.loadStats(username);
  if (stats) {
    const pctIntoLevel = stats.xpForNextLevel ? Math.round((stats.xpIntoLevel / stats.xpForNextLevel) * 100) : 100;
    const levelCard = el(`
      <div class="card">
        <h2>Niveau &amp; reeks</h2>
        <div class="level-row">
          <div class="level-info">
            <div class="level-title">Niveau ${stats.level} &middot; ${escapeHtml(stats.title)}</div>
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${pctIntoLevel}%"></div></div>
            <div class="muted" style="font-size:0.8rem;margin-top:4px">${stats.xp} XP${stats.xpForNextLevel ? ` &middot; nog ${stats.xpForNextLevel - stats.xpIntoLevel} XP tot ${escapeHtml(stats.nextTitle)}` : ' &middot; hoogste niveau bereikt'}</div>
          </div>
          <div class="streak-info">
            <div class="streak-value">🔥 ${stats.currentStreak}</div>
            <div class="muted" style="font-size:0.78rem">dagen op rij${stats.longestStreak > stats.currentStreak ? ` (langste: ${stats.longestStreak})` : ''}</div>
          </div>
        </div>
      </div>
    `);
    app.appendChild(levelCard);

    // certifications: one row per CEFR level, from the last synced stats
    const certByLevel = Object.fromEntries((stats.certifications || []).map((c) => [c.level, c]));
    const levels = levelsOf(content);
    const certCard = el(`<div class="card"><h2>Niveautoetsen</h2><p class="muted">Sluit elk niveau af met een toets van 30 vragen (80% om te slagen). Alleen online.</p><div class="cert-grid"></div></div>`);
    const grid = certCard.querySelector('.cert-grid');
    levels.forEach(({ level, title }) => {
      const cert = certByLevel[level];
      const tile = el(`
        <a class="cert-tile ${cert ? 'passed' : ''}" href="#/exam/${level}">
          <div class="cert-level">${level}</div>
          <div class="cert-title">${escapeHtml(title)}</div>
          <div class="cert-status">${cert ? `🎓 behaald (${cert.score}/${cert.total}) &middot; ${escapeHtml(String(cert.passedAt).slice(0, 10))}` : 'nog niet behaald'}</div>
        </a>
      `);
      grid.appendChild(tile);
    });
    app.appendChild(certCard);

    const achCard = el(`<div class="card"><h2>Badges</h2><div class="badge-grid" id="badge-grid"></div></div>`);
    const badgeGrid = achCard.querySelector('#badge-grid');
    for (const a of stats.achievements) {
      badgeGrid.appendChild(el(`
        <div class="badge ${a.unlocked ? 'unlocked' : 'locked'}" title="${escapeHtml(a.description)}">
          <div class="badge-icon">${a.icon}</div>
          <div class="badge-title">${escapeHtml(a.title)}</div>
        </div>
      `));
    }
    app.appendChild(achCard);
  }

  // only lessons you've actually started -- 126 rows of zeros is noise
  const started = [], untouched = [];
  for (const cat of content.categories) {
    const s = categoryStats(username, content, cat.slug);
    if (!s.totalWords) continue;
    (s.startedWords > 0 ? started : untouched).push({ cat, s });
  }
  const catCard = el(`
    <div class="card">
      <h2>Voortgang per les</h2>
      ${started.length ? `<div class="table-scroll"><table><thead><tr><th>Niveau</th><th>Les</th><th>Geoefend</th><th>Onder de knie</th></tr></thead><tbody id="cat-body"></tbody></table></div>` : '<p class="muted">Je bent nog aan geen enkele les begonnen.</p>'}
      ${untouched.length ? `<p class="muted" style="margin-top:10px;font-size:0.82rem">${untouched.length} ${untouched.length === 1 ? 'les' : 'lessen'} nog niet gestart (niet getoond).</p>` : ''}
    </div>
  `);
  app.appendChild(catCard);
  const catBody = catCard.querySelector('#cat-body');
  for (const { cat, s } of started) {
    catBody.appendChild(el(`<tr><td>${escapeHtml(cat.level)}</td><td>${escapeHtml(cat.name)}</td><td>${s.startedWords}/${s.totalWords}</td><td>${s.masteredWords}/${s.totalWords}</td></tr>`));
  }

  // The local attempt log stores the wording of an exercise as it was when
  // it was answered. Show the *current* wording from the content bundle
  // instead (falling back to the stored copy for exercises that no longer
  // exist), so a corrected question doesn't keep haunting the history in
  // its old form.
  const exById = new Map(content.exercises.map((e) => [e.id, e]));
  const current = (m) => {
    const ex = exById.get(m.exerciseId);
    return ex ? { ...m, prompt: ex.prompt, correctAnswer: ex.correctAnswer, explanation: ex.explanation } : m;
  };
  const mistakes = attemptsLog.filter((a) => !a.isCorrect).map(current);
  const missedCounts = {};
  mistakes.forEach((m) => { missedCounts[m.exerciseId] = (missedCounts[m.exerciseId] || { ...m, count: 0 }); missedCounts[m.exerciseId].count++; });
  const topMissed = Object.values(missedCounts).sort((a, b) => b.count - a.count).slice(0, 10);

  const missedCard = el(`<div class="card"><h2>Vaakst fout beantwoord <span class="muted" style="font-weight:400;font-size:0.8rem">(dit toestel)</span></h2></div>`);
  const openMistakes = mistakeExercises(content, username).length;
  if (openMistakes) {
    const btn = el(`<button type="button" class="primary" style="margin-bottom:14px">🎯 Oefen je fouten (${openMistakes})</button>`);
    btn.addEventListener('click', () => { location.hash = '#/practice'; });
    missedCard.appendChild(btn);
  }
  if (!topMissed.length) {
    missedCard.appendChild(el(`<p class="muted">Nog geen fouten geregistreerd op dit toestel. Blijf zo doorgaan!</p>`));
  } else {
    const table = el(`<table><thead><tr><th>Vraag</th><th>Juiste antwoord</th><th>Uitleg</th><th>Keer fout</th></tr></thead><tbody></tbody></table>`);
    const tbody = table.querySelector('tbody');
    for (const m of topMissed) {
      tbody.appendChild(el(`<tr><td>${escapeHtml(m.prompt)}</td><td>${escapeHtml(m.correctAnswer)}</td><td>${escapeHtml(m.explanation)}</td><td>${m.count}</td></tr>`));
    }
    const scroll = el(`<div class="table-scroll"></div>`);
    scroll.appendChild(table);
    missedCard.appendChild(scroll);
  }
  app.appendChild(missedCard);

  const recentCard = el(`<div class="card"><h2>Recente fouten <span class="muted" style="font-weight:400;font-size:0.8rem">(dit toestel)</span></h2></div>`);
  if (!mistakes.length) {
    recentCard.appendChild(el(`<p class="muted">Geen recente fouten op dit toestel.</p>`));
  } else {
    const table = el(`<table><thead><tr><th>Vraag</th><th>Jouw antwoord</th><th>Juist</th><th>Uitleg</th></tr></thead><tbody></tbody></table>`);
    const tbody = table.querySelector('tbody');
    for (const m of mistakes.slice(0, 20)) {
      tbody.appendChild(el(`<tr><td>${escapeHtml(m.prompt)}</td><td>${escapeHtml(m.given || '-')}</td><td>${escapeHtml(m.correctAnswer)}</td><td>${escapeHtml(m.explanation)}</td></tr>`));
    }
    const scroll = el(`<div class="table-scroll"></div>`);
    scroll.appendChild(table);
    recentCard.appendChild(scroll);
  }
  app.appendChild(recentCard);
}

