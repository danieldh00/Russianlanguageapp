// ---------- level exams (online only: graded on the server) ----------

async function renderExam(level) {
  app.innerHTML = '';
  if (!LEVEL_ORDER.includes(level)) {
    app.appendChild(el(`<div class="card"><h1>Onbekend niveau</h1><a href="#/dashboard">Terug naar lessen</a></div>`));
    return;
  }
  const content = await ensureContentLoaded();
  if (content) {
    const levelState = computePath(content, state.user.username).byLevel.get(level);
    if (levelState && !levelState.unlocked) {
      app.appendChild(el(`
        <div class="card">
          <h1>🔒 Niveautoets ${level}</h1>
          <p class="muted">Niveau ${level} is nog vergrendeld. Rond eerst niveau ${levelState.prevLevel} af: maak de toets van ${levelState.prevLevel}, of oefen alle lessen van dat niveau.</p>
          <a href="#/dashboard">Terug naar lessen</a>
        </div>
      `));
      return;
    }
  }
  if (!navigator.onLine) {
    app.appendChild(el(`
      <div class="card">
        <h1>Niveautoets ${level}</h1>
        <p class="muted">Toetsen worden op de server nagekeken en zijn daarom alleen online beschikbaar. De lessen zelf werken wel offline.</p>
        <a href="#/dashboard">Terug naar lessen</a>
      </div>
    `));
    return;
  }

  app.appendChild(el(`<div class="card"><p class="muted">Toets laden…</p></div>`));
  let info;
  try {
    const data = await api('/exams');
    info = data.levels.find((l) => l.level === level);
  } catch (err) {
    app.innerHTML = '';
    app.appendChild(el(`<div class="card"><p class="error-message">${escapeHtml(err.message)}</p><a href="#/dashboard">Terug naar lessen</a></div>`));
    return;
  }

  app.innerHTML = '';
  const intro = el(`
    <div class="card exam-intro">
      <div class="exam-intro-head">
        <span class="level-code big">${level}</span>
        <div>
          <h1>Niveautoets ${level} — ${escapeHtml(info.title)}</h1>
          <p class="muted">${escapeHtml(info.description)}</p>
        </div>
      </div>
      <ul class="exam-facts">
        <li><strong>${info.questionCount}</strong> vragen, willekeurig gekozen uit alle ${info.categories} lessen van ${level}</li>
        <li>Alle oefenvormen komen voor: woorden, grammatica, typen, zinnen bouwen, luisteren en lezen</li>
        <li>Je ziet pas aan het eind hoe je het deed — mét uitleg bij elke fout</li>
        <li>Geslaagd bij <strong>${info.passPct}%</strong> of hoger: dan is niveau ${level} afgesloten (+150 XP)</li>
        ${info.attempts ? `<li>Eerder gemaakt: ${info.attempts}× &middot; beste score ${info.bestScorePct}%${info.passed ? ` &middot; behaald op ${escapeHtml(String(info.passedAt).slice(0, 10))}` : ''}</li>` : ''}
      </ul>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
        <button class="primary" id="start-exam">${info.passed ? 'Opnieuw maken' : 'Start de toets'}</button>
        <button class="secondary" id="back-btn">Terug naar lessen</button>
      </div>
    </div>
  `);
  app.appendChild(intro);
  intro.querySelector('#back-btn').addEventListener('click', () => { location.hash = '#/dashboard'; });
  intro.querySelector('#start-exam').addEventListener('click', async () => {
    intro.querySelector('#start-exam').disabled = true;
    try {
      const exam = await api(`/exams/${level}`);
      runExam(exam);
    } catch (err) {
      intro.appendChild(el(`<p class="error-message">${escapeHtml(err.message)}</p>`));
      intro.querySelector('#start-exam').disabled = false;
    }
  });
}

function runExam(exam) {
  const answers = new Map();
  let index = 0;

  function showQuestion() {
    const q = exam.questions[index];
    app.innerHTML = '';
    const wrapper = el(`
      <div class="card exam-question">
        <div class="exercise-progress">
          <span>Niveautoets ${exam.level} &middot; vraag ${index + 1} van ${exam.questions.length}</span>
          <span class="muted">${escapeHtml(q.category.name)}</span>
        </div>
        <div class="progress-bar exam-bar"><div class="progress-bar-fill" style="width:${Math.round((index / exam.questions.length) * 100)}%"></div></div>
        <div id="head"></div>
        <div id="options"></div>
        <div id="actions"></div>
      </div>
    `);
    app.appendChild(wrapper);
    wrapper.querySelector('#head').replaceWith(renderExerciseHead(q, { showContextText: false }));
    if (q.type === 'listen') speakRussian(q.context);

    const optionsDiv = wrapper.querySelector('#options');
    const actions = wrapper.querySelector('#actions');
    const isLast = index === exam.questions.length - 1;

    function commit(value) {
      answers.set(q.id, value);
      optionsDiv.querySelectorAll('.option-btn').forEach((b) => {
        b.classList.toggle('selected', b.dataset.value === value);
      });
      actions.innerHTML = '';
      const next = el(`<button class="primary" style="margin-top:14px">${isLast ? 'Toets inleveren' : 'Volgende'}</button>`);
      next.addEventListener('click', () => {
        if (isLast) submitExam();
        else { index++; showQuestion(); }
      });
      actions.appendChild(next);
    }

    if (q.type !== 'sentence_build' && q.options && q.options.length) {
      // multiple choice: selecting is not final until "Volgende", so you can change your mind
      const isPictures = q.type === 'picture_choice';
      const holder = isPictures ? el(`<div class="picture-grid"></div>`) : optionsDiv;
      for (const opt of q.options) {
        const btn = isPictures
          ? el(`<button class="option-btn picture-option" data-value="${escapeHtml(opt)}"><span class="picture-emoji"></span></button>`)
          : el(`<button class="option-btn" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`);
        if (isPictures) btn.querySelector('.picture-emoji').textContent = opt;
        btn.addEventListener('click', () => commit(opt));
        holder.appendChild(btn);
      }
      if (isPictures) optionsDiv.appendChild(holder);
    } else {
      renderAnswerControls(q, optionsDiv, commit, { submitLabel: 'Antwoord vastleggen' });
    }
  }

  async function submitExam() {
    app.innerHTML = '';
    app.appendChild(el(`<div class="card"><p class="muted">Nakijken…</p></div>`));
    try {
      const payload = exam.questions.map((q) => ({ exerciseId: q.id, answer: answers.get(q.id) || '' }));
      const result = await api(`/exams/${exam.level}/submit`, { method: 'POST', body: { answers: payload } });
      await pullStats().catch(() => {});
      renderNav();
      renderExamResult(result);
    } catch (err) {
      app.innerHTML = '';
      app.appendChild(el(`<div class="card"><p class="error-message">${escapeHtml(err.message)}</p><a href="#/dashboard">Terug naar lessen</a></div>`));
    }
  }

  showQuestion();
}

function renderExamResult(result) {
  app.innerHTML = '';
  const wrong = result.review.filter((r) => !r.isCorrect);
  const summary = el(`
    <div class="card exam-result ${result.passed ? 'passed' : 'failed'}">
      <div class="exam-score">
        <div class="exam-score-ring"><span>${result.pct}%</span></div>
        <div>
          <h1>${result.passed ? `Geslaagd voor niveau ${result.level}!` : `Nog niet geslaagd voor ${result.level}`}</h1>
          <p>${result.score} van de ${result.total} vragen goed (grens: ${result.passPct}%).
          ${result.passed
            ? (result.newlyCertified ? ` Niveau ${result.level} is nu afgesloten: +150 XP en een badge.` : ` Je had dit niveau al behaald — mooi bevestigd.`)
            : ' Bekijk hieronder per les waar het misging, oefen die lessen en probeer het opnieuw.'}</p>
        </div>
      </div>
      <h2>Per les</h2>
      <div class="exam-breakdown"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
        <button class="primary" id="retry-btn">${result.passed ? 'Nog een keer' : 'Opnieuw proberen'}</button>
        <button class="secondary" id="back-btn">Terug naar lessen</button>
      </div>
    </div>
  `);
  const breakdown = summary.querySelector('.exam-breakdown');
  for (const c of result.perCategory) {
    const pct = Math.round((c.correct / c.total) * 100);
    const row = el(`
      <a class="breakdown-row ${pct === 100 ? 'ok' : pct < 50 ? 'bad' : 'meh'}" href="#/lesson/${escapeHtml(c.slug)}">
        <span class="breakdown-name">${escapeHtml(c.name)}</span>
        <span class="breakdown-score">${c.correct}/${c.total}</span>
        <span class="breakdown-bar"><span style="width:${pct}%"></span></span>
      </a>
    `);
    breakdown.appendChild(row);
  }
  summary.querySelector('#retry-btn').addEventListener('click', () => renderExam(result.level));
  summary.querySelector('#back-btn').addEventListener('click', () => { location.hash = '#/dashboard'; });
  app.appendChild(summary);

  const reviewCard = el(`
    <div class="card">
      <h2>${wrong.length ? `Wat ging er mis (${wrong.length})` : 'Alles goed — geen fouten om te bespreken'}</h2>
      <p class="muted">${wrong.length ? 'Per vraag: jouw antwoord, het juiste antwoord, de uitleg en de grammaticaregel erachter. Vraag de AI om een uitleg die ingaat op jóuw fout.' : ''}</p>
      <div class="review-list"></div>
      ${result.review.length > wrong.length ? `<button type="button" class="secondary" id="show-all" style="margin-top:12px">Ook de goede antwoorden tonen</button>` : ''}
    </div>
  `);
  const list = reviewCard.querySelector('.review-list');
  function renderReviewItem(r) {
    const item = el(`
      <div class="review-item ${r.isCorrect ? 'correct' : 'incorrect'}">
        <div class="review-meta"><span class="level-badge">${escapeHtml(r.category.name)}</span><span class="muted">${r.isCorrect ? '✓ goed' : '✗ fout'}</span></div>
        ${r.context ? `<p class="review-context"></p>` : ''}
        <p class="review-prompt"></p>
        <div class="review-answers">
          <div><span class="muted">Jouw antwoord:</span> <strong class="given"></strong></div>
          ${r.isCorrect ? '' : `<div><span class="muted">Juist:</span> <strong class="correct-answer"></strong></div>`}
        </div>
        <div class="explanation"></div>
        <div class="example-slot"></div>
        ${r.grammarRule ? `<div class="grammar-rule"><strong>${escapeHtml(r.grammarRule.title)}:</strong> ${escapeHtml(r.grammarRule.explanation)}${r.grammarRule.example ? `<div class="muted" style="margin-top:6px">Voorbeeld: ${escapeHtml(r.grammarRule.example)}</div>` : ''}</div>` : ''}
        <div class="ai-slot-holder"></div>
      </div>
    `);
    if (r.context) item.querySelector('.review-context').textContent = r.context;
    item.querySelector('.review-prompt').textContent = r.prompt;
    item.querySelector('.given').textContent = r.given || '(geen antwoord)';
    if (!r.isCorrect) item.querySelector('.correct-answer').textContent = r.correctAnswer;
    item.querySelector('.explanation').textContent = r.explanation;
    const exampleBlock = renderExampleBlock(r.example);
    if (exampleBlock) item.querySelector('.example-slot').replaceWith(exampleBlock);
    if (!r.isCorrect && navigator.onLine) item.querySelector('.ai-slot-holder').appendChild(renderAiExplainButton(r.exerciseId, r.given));
    return item;
  }
  wrong.forEach((r) => list.appendChild(renderReviewItem(r)));
  const showAll = reviewCard.querySelector('#show-all');
  if (showAll) {
    showAll.addEventListener('click', () => {
      result.review.filter((r) => r.isCorrect).forEach((r) => list.appendChild(renderReviewItem(r)));
      showAll.remove();
    });
  }
  app.appendChild(reviewCard);
  window.scrollTo({ top: 0 });
}

