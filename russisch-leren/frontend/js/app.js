// ---------- lesson / quiz (fully local: grading, SRS update, outbox) ----------

// ---------- keeping near-identical questions apart ----------

// How many questions must sit between two questions about the same thing.
const MIN_RELATED_GAP = 3;

const QUOTED_CYRILLIC = /'([^']*[Ѐ-ӿ][^']*)'/;

// What a question is "about", as a set of keys. Two questions that share any
// key are near-identical: the sound question and the letter question of Ж
// share a word ("Hoe klinkt de letter 'Ж ж'?" / "Welke letter klinkt als
// 'zj'?"), and a typed question and a multiple-choice question about дом
// share their Russian subject even when they belong to different lessons.
function relatedKeys(ex) {
  const keys = new Set();
  if (ex.wordId != null) keys.add(`w:${ex.wordId}`);
  const answer = normalizeAnswer(ex.correctAnswer);
  if (answer) keys.add(`a:${answer}`);
  // The Russian the question quotes -- "Wat betekent 'дом'?", "Hoe klinkt de
  // letter 'Ж ж'?" -- which is the word the question is about, and which ties
  // it to the question whose *answer* is that same word. Only what is between
  // quotes counts: the Russian in a cloze sentence or a reading text is the
  // material, not the subject, and keying on that would pull apart the
  // questions belonging to one story.
  const quoted = String(ex.prompt || '').match(QUOTED_CYRILLIC);
  const run = quoted && quoted[1].match(CYRILLIC_RUN);
  if (run) {
    const subject = normalizeAnswer(run[0]);
    if (subject && subject.length <= 20 && subject.split(' ').length <= 2) keys.add(`a:${subject}`);
  }
  return [...keys];
}

// Reorders a picked session so questions about the same thing end up apart.
// Each step takes a question whose subject has been away at least MIN_RELATED_GAP
// places (or, if none has, the one away the longest), and among those the one
// with the most questions still waiting on the same subject -- otherwise the
// duplicates all sink to the end and cluster there instead. Ties keep the
// given order, so a due-first or mistakes-first ordering survives untouched
// when nothing conflicts. Ten questions about five words come out as five,
// then the other five, rather than in pairs.
function spreadRelated(items, minGap = MIN_RELATED_GAP) {
  if (items.length < 3) return [...items];
  const remaining = items.map((ex) => ({ ex, keys: relatedKeys(ex) }));
  const left = new Map();
  remaining.forEach((r) => r.keys.forEach((key) => left.set(key, (left.get(key) || 0) + 1)));
  const lastSeen = new Map();
  const out = [];
  while (remaining.length) {
    let chosen = 0, bestGap = -1, bestGroup = -1;
    for (let i = 0; i < remaining.length; i++) {
      let gap = minGap, group = 1;
      for (const key of remaining[i].keys) {
        if (lastSeen.has(key)) gap = Math.min(gap, out.length - lastSeen.get(key));
        group = Math.max(group, left.get(key) || 1);
      }
      if (gap > bestGap || (gap === bestGap && group > bestGroup)) { bestGap = gap; bestGroup = group; chosen = i; }
    }
    const [taken] = remaining.splice(chosen, 1);
    taken.keys.forEach((key) => { lastSeen.set(key, out.length); left.set(key, (left.get(key) || 1) - 1); });
    out.push(taken.ex);
  }
  return out;
}

// Deals the questions out word by word: every word gives one question before
// any word gives a second, and so on. A session then covers as many different
// words as it can, and what does not fit is cut from the tail -- rather than a
// ten-question lesson spending its last four questions on one word, which is
// what made the sound and the letter of Ж land together. Exercises without a
// word (reading, dialogue) count as a word of their own.
function roundRobinByWord(exercises) {
  const buckets = new Map();
  exercises.forEach((ex, i) => {
    const key = ex.wordId != null ? `w${ex.wordId}` : `x${i}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(ex);
  });
  const lists = [...buckets.values()];
  const deepest = lists.reduce((n, list) => Math.max(n, list.length), 0);
  const out = [];
  for (let round = 0; round < deepest; round++) {
    for (const list of lists) if (round < list.length) out.push(list[round]);
  }
  return out;
}


// Session order: words due for review first, then words never practised,
// then exercises without a tracked word, and finally words that are scheduled
// for later -- so a lesson can always be redone as extra practice instead
// of turning you away because "everything is planned for later". Within each
// group the questions are dealt out word by word, so a lesson's vocabulary is
// covered in as few sessions as possible. What is picked is finally spread,
// so two questions about the same word never land next to each other.
function pickBatch(exercises, wordProgress, limit) {
  const now = Date.now();
  const due = [], fresh = [], untracked = [], scheduled = [];
  exercises.forEach((ex) => {
    if (ex.wordId == null) { untracked.push(ex); return; }
    const p = wordProgress[ex.wordId];
    if (!p) { fresh.push(ex); return; }
    if (p.nextReviewAt && new Date(p.nextReviewAt).getTime() <= now) due.push(ex);
    else scheduled.push(ex);
  });
  due.sort((a, b) => new Date(wordProgress[a.wordId].nextReviewAt) - new Date(wordProgress[b.wordId].nextReviewAt));

  const pool = [
    ...roundRobinByWord(due),
    ...roundRobinByWord(shuffle(fresh)),
    ...shuffle(untracked),
    ...roundRobinByWord(shuffle(scheduled))
  ];
  return spreadRelated(pool.slice(0, limit));
}

async function renderLesson(slug) {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();

  const category = content.categories.find((c) => c.slug === slug);
  const allExercises = content.exercises.filter((e) => e.category === slug);
  const exercises = allowedExercises(allExercises);
  if (category && allExercises.length && !exercises.length) {
    // every exercise in this lesson is of a kind the learner switched off
    const off = disabledPartLabels();
    app.innerHTML = '';
    app.appendChild(el(`
      <div class="card">
        <h1>${escapeHtml(category.name)}</h1>
        <p class="muted">Deze les bestaat alleen uit oefenvormen die je hebt uitgezet${off.length ? ` (${escapeHtml(off.join(', '))})` : ''}. Zet er één weer aan om verder te kunnen.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
          <a class="secondary-link" href="#/settings">Naar instellingen</a>
          <a class="secondary-link" href="#/dashboard">Terug naar lessen</a>
        </div>
      </div>
    `));
    return;
  }
  if (!category || !exercises.length) {
    app.innerHTML = `<div class="card"><h1>${escapeHtml(category ? category.name : 'Les')}</h1><p class="muted">Geen oefeningen beschikbaar in deze les.</p><a href="#/dashboard">Terug naar lessen</a></div>`;
    return;
  }

  const path = computePath(content, state.user.username);
  const node = path.bySlug.get(slug);
  if (node && !node.unlocked) {
    app.innerHTML = '';
    app.appendChild(el(`
      <div class="card">
        <h1>🔒 ${escapeHtml(category.name)}</h1>
        <p class="muted">Deze les is nog vergrendeld. ${escapeHtml(lockReason(path, slug))}</p>
        <a href="#/dashboard">Terug naar lessen</a>
      </div>
    `));
    return;
  }

  const wordProgress = Storage.loadWordProgress(state.user.username);
  const items = pickBatch(exercises, wordProgress, 10).map((ex) => withGrammarRule(content, ex));

  const session = { category, items, index: 0, correctCount: 0 };
  renderExercise(session);
}

// A quiet switch flipped mid-session: drop the questions that are now out of
// bounds from the part still to come, keeping the ones already answered so
// the score stays honest. If nothing is left, the session is simply done.
function refilterSession(session) {
  const answered = session.items.slice(0, session.index);
  const rest = session.items.slice(session.index).filter((ex) => exerciseTypeAllowed(ex.type));
  session.items = [...answered, ...rest];
  if (session.index >= session.items.length) renderLessonComplete(session);
  else renderExercise(session);
}

function gradeAndRecord(ex) {
  return (chosenValue) => {
    // stress exercises are the one case where the accent mark is the answer
    const isCorrect = ex.type === 'stress'
      ? String(chosenValue).normalize('NFC').trim() === String(ex.correctAnswer).normalize('NFC').trim()
      : normalizeAnswer(chosenValue) === normalizeAnswer(ex.correctAnswer);
    const username = state.user.username;

    if (ex.wordId != null) {
      const wordProgress = Storage.loadWordProgress(username);
      const prev = wordProgress[ex.wordId] || { easeFactor: 2.5, intervalDays: 0, repetitions: 0, correctCount: 0, incorrectCount: 0 };
      const updated = scheduleReview(prev, isCorrect);
      wordProgress[ex.wordId] = {
        ...updated,
        correctCount: (prev.correctCount || 0) + (isCorrect ? 1 : 0),
        incorrectCount: (prev.incorrectCount || 0) + (isCorrect ? 0 : 1),
        lastReviewedAt: new Date().toISOString()
      };
      Storage.saveWordProgress(username, wordProgress);
    }

    const clientTimestamp = new Date().toISOString();
    Storage.enqueueOutbox(username, { clientId: uuid(), exerciseId: ex.id, givenAnswer: chosenValue, clientTimestamp });
    Storage.appendAttemptLog(username, {
      exerciseId: ex.id, prompt: ex.prompt, given: chosenValue, correctAnswer: ex.correctAnswer,
      explanation: ex.explanation, isCorrect, at: clientTimestamp
    });

    syncAll(); // best-effort immediate push; the outbox guarantees it isn't lost if this fails
    return isCorrect;
  };
}

function renderSentenceBuild(ex, container, onSubmit, { submitLabel = 'Controleren' } = {}) {
  const pool = shuffle(ex.options);
  const selected = [];
  let submitted = false;

  function paint() {
    container.innerHTML = '';

    const answerRow = el(`<div class="chip-row chip-answer"></div>`);
    if (!selected.length) answerRow.appendChild(el(`<span class="muted chip-placeholder">Tik hieronder de woorden in de juiste volgorde</span>`));
    selected.forEach((tok, i) => {
      const chip = el(`<button type="button" class="chip filled">${escapeHtml(tok)}</button>`);
      if (!submitted) chip.addEventListener('click', () => { selected.splice(i, 1); pool.push(tok); paint(); });
      else chip.disabled = true;
      answerRow.appendChild(chip);
    });
    container.appendChild(answerRow);

    const poolRow = el(`<div class="chip-row chip-pool"></div>`);
    pool.forEach((tok, i) => {
      const chip = el(`<button type="button" class="chip">${escapeHtml(tok)}</button>`);
      if (!submitted) chip.addEventListener('click', () => { pool.splice(i, 1); selected.push(tok); paint(); });
      else chip.disabled = true;
      poolRow.appendChild(chip);
    });
    container.appendChild(poolRow);

    if (!submitted) {
      const submitBtn = el(`<button type="button" class="primary" style="margin-top:14px">${escapeHtml(submitLabel)}</button>`);
      submitBtn.disabled = selected.length === 0;
      submitBtn.addEventListener('click', () => {
        submitted = true;
        const value = selected.join(' ');
        paint();
        onSubmit(value);
      });
      container.appendChild(submitBtn);
    }
  }

  paint();
}

// Everything above the answer controls: reading passage, listening button,
// the prompt itself. Shared by lessons and exams.
function renderExerciseHead(ex, { showContextText = true } = {}) {
  const head = el(`<div class="exercise-head"></div>`);
  if (ex.type === 'picture' && ex.context) {
    const pic = el(`<div class="picture-box" role="img" aria-label="plaatje"><span class="picture-emoji"></span></div>`);
    pic.querySelector('.picture-emoji').textContent = ex.context;
    head.appendChild(pic);
  }
  if (ex.type === 'reading' && ex.context) {
    const passage = el(`<div class="reading-passage"><div class="reading-label">Lees de tekst</div><p></p></div>`);
    passage.querySelector('p').textContent = ex.context;
    const speak = renderSpeakButton(ex.context, '🔊 Voorlezen');
    if (speak) passage.appendChild(speak);
    head.appendChild(passage);
  }
  if (ex.type === 'listen' && ex.context) {
    const box = el(`<div class="listen-box"><div class="reading-label">Luisteroefening</div></div>`);
    const speak = renderSpeakButton(ex.context, '🔊 Speel de zin af');
    if (speak) {
      speak.classList.add('listen-play');
      box.appendChild(speak);
    } else {
      box.appendChild(el(`<p class="muted">Spraaksynthese is niet beschikbaar in deze browser; de zin staat hieronder.</p>`));
      showContextText = true;
    }
    if (showContextText) {
      const txt = el(`<p class="listen-text"></p>`);
      txt.textContent = ex.context;
      box.appendChild(txt);
    }
    head.appendChild(box);
  }
  const promptRow = el(`<div class="prompt-row"><h2></h2></div>`);
  promptRow.querySelector('h2').textContent = ex.prompt;
  // no listen button where hearing the Russian would give the answer away
  // (the picture question's answer IS the Russian word)
  if (ex.type !== 'listen' && ex.type !== 'reading' && ex.type !== 'picture') {
    const speakBtn = renderSpeakButton(extractSpeakText(ex));
    if (speakBtn) promptRow.appendChild(speakBtn);
  }
  head.appendChild(promptRow);
  return head;
}

function renderExercise(session) {
  const ex = session.items[session.index];
  app.innerHTML = '';
  const wrapper = el(`
    <div class="card">
      <div class="exercise-progress">${escapeHtml(session.category.name)} &middot; vraag ${session.index + 1} van ${session.items.length}</div>
      <div id="quiet"></div>
      <div id="head"></div>
      <div id="options"></div>
      <div id="feedback"></div>
    </div>
  `);
  app.appendChild(wrapper);
  const quietBar = renderQuietBar(() => refilterSession(session), ex);
  const quietSlot = wrapper.querySelector('#quiet');
  if (quietBar) quietSlot.replaceWith(quietBar); else quietSlot.remove();
  wrapper.querySelector('#head').replaceWith(renderExerciseHead(ex, { showContextText: false }));
  if (ex.type === 'listen' && !quietSettings().noListen) speakRussian(ex.context);

  const optionsDiv = wrapper.querySelector('#options');
  const feedbackDiv = wrapper.querySelector('#feedback');
  const record = gradeAndRecord(ex);

  function afterAnswer(isCorrect, chosenAnswer) {
    if (isCorrect) session.correctCount += 1;

    const buttons = optionsDiv.querySelectorAll('.option-btn');
    buttons.forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.value === ex.correctAnswer) btn.classList.add('correct');
      else if (btn.dataset.value === chosenAnswer) btn.classList.add('incorrect');
    });

    const fb = el(`
      <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
        <strong>${isCorrect ? 'Goed gedaan!' : 'Niet helemaal juist.'}</strong>
        ${isCorrect ? '' : `<div>Het juiste antwoord is: <strong>${escapeHtml(ex.correctAnswer)}</strong></div>`}
        ${ex.type === 'listen' && ex.context ? `<div class="listen-reveal">Je hoorde: <strong>${escapeHtml(ex.context)}</strong></div>` : ''}
        <div class="explanation">${escapeHtml(ex.explanation)}</div>
        <div id="answer-speak-slot"></div>
        <div id="example-slot"></div>
        ${ex.grammarRule ? `<div class="grammar-rule"><strong>${escapeHtml(ex.grammarRule.title)}:</strong> ${escapeHtml(ex.grammarRule.explanation)}</div>` : ''}
        <div id="ai-explain-slot"></div>
      </div>
    `);
    // Now that the answer is on screen, hearing it gives nothing away.
    const answerSlot = fb.querySelector('#answer-speak-slot');
    const spokenAnswer = CYRILLIC_RUN.test(ex.correctAnswer || '') ? ex.correctAnswer : null;
    const answerSpeak = spokenAnswer && !quietSettings().noListen ? renderSpeakButton(spokenAnswer, '🔊 Hoor het antwoord') : null;
    if (answerSpeak) answerSlot.replaceWith(answerSpeak); else answerSlot.remove();

    const exampleBlock = renderExampleBlock(ex.example);
    if (exampleBlock) fb.querySelector('#example-slot').replaceWith(exampleBlock);
    fb.appendChild(renderAfterAnswerTools(ex));
    feedbackDiv.appendChild(fb);
    // hearing the stress is the whole point of a stress question: play it,
    // slowly -- unless the learner said they cannot listen right now
    if (ex.type === 'stress' && !quietSettings().noListen) speakRussian(ex.correctAnswer, { slow: true });

    if (!isCorrect && navigator.onLine) {
      fb.querySelector('#ai-explain-slot').appendChild(renderAiExplainButton(ex.id, chosenAnswer));
    }

    const nextBtn = el(`<button class="primary" style="margin-top:14px">${session.index + 1 < session.items.length ? 'Volgende' : 'Klaar'}</button>`);
    nextBtn.addEventListener('click', () => {
      session.index += 1;
      if (session.index < session.items.length) renderExercise(session);
      else renderLessonComplete(session);
    });
    feedbackDiv.appendChild(nextBtn);
  }

  renderAnswerControls(ex, optionsDiv, (value) => afterAnswer(record(value), value));
}

// The answer widget for any exercise type: chips, multiple choice or a text box.
function renderAnswerControls(ex, container, onAnswer, { submitLabel = 'Controleren' } = {}) {
  if (ex.type === 'sentence_build' && ex.options && ex.options.length) {
    renderSentenceBuild(ex, container, onAnswer, { submitLabel });
  } else if (ex.type === 'picture_choice' && ex.options && ex.options.length) {
    // pick the picture: a grid of big emoji tiles
    const grid = el(`<div class="picture-grid"></div>`);
    for (const opt of ex.options) {
      const btn = el(`<button class="option-btn picture-option" data-value="${escapeHtml(opt)}"><span class="picture-emoji"></span></button>`);
      btn.querySelector('.picture-emoji').textContent = opt;
      btn.addEventListener('click', () => onAnswer(opt));
      grid.appendChild(btn);
    }
    container.appendChild(grid);
  } else if (ex.options && ex.options.length) {
    for (const opt of ex.options) {
      const btn = el(`<button class="option-btn" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`);
      btn.addEventListener('click', () => onAnswer(opt));
      container.appendChild(btn);
    }
  } else {
    const form = el(`
      <form class="typing-form">
        <div class="typing-row">
          <input type="text" class="typing-answer" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ru" placeholder="Typ hier in het Russisch…" required />
          <span class="mic-slot"></span>
        </div>
        <button type="submit" class="primary" style="margin-top:10px;width:fit-content">${escapeHtml(submitLabel)}</button>
      </form>
    `);
    container.appendChild(form);
    const input = form.querySelector('input');
    const mic = renderMicButton((text) => { input.value = text; input.focus(); });
    if (mic) form.querySelector('.mic-slot').replaceWith(mic);
    setTimeout(() => input.focus(), 0);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value;
      container.querySelectorAll('input,button').forEach((n) => (n.disabled = true));
      onAnswer(value);
    });
  }
}

function renderAiExplainButton(exerciseId, givenAnswer) {
  const slot = el(`<div class="ai-slot"></div>`);
  const aiBtn = el(`<button type="button" class="ai-btn">🤖 Vraag AI om een diepere uitleg</button>`);
  aiBtn.addEventListener('click', async () => {
    aiBtn.disabled = true;
    aiBtn.textContent = '🤖 Even denken…';
    try {
      const data = await api('/ai/explain', { method: 'POST', body: { exerciseId, givenAnswer } });
      slot.appendChild(el(`<div class="ai-explanation"><strong>🤖 AI-uitleg</strong><p>${escapeHtml(data.explanation)}</p></div>`));
      aiBtn.remove();
    } catch (err) {
      aiBtn.disabled = false;
      aiBtn.textContent = '🤖 Vraag AI om een diepere uitleg';
      slot.appendChild(el(`<p class="error-message">${escapeHtml(err.message)}</p>`));
    }
  });
  slot.appendChild(aiBtn);
  return slot;
}

function renderLessonComplete(session) {
  app.innerHTML = '';
  const pct = Math.round((session.correctCount / session.items.length) * 100);
  const isPractice = session.category.slug === '__mistakes__';
  const isReview = session.category.slug === '__review__';
  app.appendChild(el(`
    <div class="card">
      <h1>${isPractice ? 'Foutenronde afgerond' : isReview ? 'Herhaling afgerond' : 'Les afgerond'}</h1>
      <p>Je had ${session.correctCount} van de ${session.items.length} vragen goed (${pct}%).</p>
      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
        <button class="primary" id="again-btn">Nog een keer</button>
        <button class="secondary" id="back-btn">Terug naar lessen</button>
      </div>
    </div>
  `));
  document.getElementById('again-btn').addEventListener('click', () => (isPractice ? renderMistakesPractice() : isReview ? renderReviewSession() : renderLesson(session.category.slug)));
  document.getElementById('back-btn').addEventListener('click', () => { location.hash = '#/dashboard'; });
}

