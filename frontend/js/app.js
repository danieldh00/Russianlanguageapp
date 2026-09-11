const state = { user: null };

async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Er ging iets mis.');
  return data;
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  if (state.user) {
    nav.appendChild(el(`<a href="#/dashboard">Lessen</a>`));
    nav.appendChild(el(`<a href="#/progress">Voortgang</a>`));
    const span = el(`<span class="muted" style="margin-left:4px">${state.user.username}</span>`);
    nav.appendChild(span);
    const btn = el(`<button>Uitloggen</button>`);
    btn.addEventListener('click', async () => {
      await api('/auth/logout', { method: 'POST' });
      state.user = null;
      location.hash = '#/login';
    });
    nav.appendChild(btn);
  } else {
    nav.appendChild(el(`<a href="#/login">Inloggen</a>`));
    nav.appendChild(el(`<a href="#/register">Registreren</a>`));
  }
}

async function ensureUser() {
  if (state.user) return state.user;
  try {
    const data = await api('/auth/me');
    state.user = data.user;
  } catch (e) {
    state.user = null;
  }
  return state.user;
}

const app = document.getElementById('app');

async function router() {
  const hash = location.hash || '#/dashboard';
  const [, route, param] = hash.split('/');

  await ensureUser();
  renderNav();

  if (!state.user && !['login', 'register'].includes(route)) {
    location.hash = '#/login';
    return;
  }
  if (state.user && ['login', 'register'].includes(route)) {
    location.hash = '#/dashboard';
    return;
  }

  if (route === 'login') return renderLogin();
  if (route === 'register') return renderRegister();
  if (route === 'dashboard') return renderDashboard();
  if (route === 'lesson') return renderLesson(param);
  if (route === 'progress') return renderProgress();
  return renderDashboard();
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// ---------- Auth views ----------

function renderLogin() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="card" style="max-width:400px">
      <h1>Inloggen</h1>
      <p class="muted">Log in om verder te leren en je voortgang bij te houden.</p>
      <form id="login-form">
        <div>
          <label for="username">Gebruikersnaam</label>
          <input type="text" id="username" required />
        </div>
        <div>
          <label for="password">Wachtwoord</label>
          <input type="password" id="password" required />
        </div>
        <p class="error-message" id="login-error"></p>
        <button type="submit" class="primary">Inloggen</button>
      </form>
      <p class="muted" style="margin-top:14px">Nog geen account? <a href="#/register">Registreer hier</a>.</p>
    </div>
  `));

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    try {
      const data = await api('/auth/login', { method: 'POST', body: { username, password } });
      state.user = data.user;
      location.hash = '#/dashboard';
    } catch (err) {
      document.getElementById('login-error').textContent = err.message;
    }
  });
}

function renderRegister() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="card" style="max-width:400px">
      <h1>Account aanmaken</h1>
      <p class="muted">Maak een account om je voortgang op te slaan.</p>
      <form id="register-form">
        <div>
          <label for="username">Gebruikersnaam</label>
          <input type="text" id="username" required minlength="3" />
        </div>
        <div>
          <label for="email">E-mail (optioneel)</label>
          <input type="email" id="email" />
        </div>
        <div>
          <label for="password">Wachtwoord (min. 6 tekens)</label>
          <input type="password" id="password" required minlength="6" />
        </div>
        <p class="error-message" id="register-error"></p>
        <button type="submit" class="primary">Registreren</button>
      </form>
      <p class="muted" style="margin-top:14px">Heb je al een account? <a href="#/login">Log in</a>.</p>
    </div>
  `));

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const data = await api('/auth/register', { method: 'POST', body: { username, email, password } });
      state.user = data.user;
      location.hash = '#/dashboard';
    } catch (err) {
      document.getElementById('register-error').textContent = err.message;
    }
  });
}

// ---------- Dashboard ----------

async function renderDashboard() {
  app.innerHTML = '<p class="muted">Laden...</p>';
  const { categories } = await api('/lessons');

  const wrapper = el(`<div><h1>Lessen</h1><p class="muted">Kies een les om te oefenen. Woorden die aan de beurt zijn voor herhaling worden automatisch eerst getoond.</p><div class="grid" id="lesson-grid"></div></div>`);
  app.innerHTML = '';
  app.appendChild(wrapper);

  const grid = wrapper.querySelector('#lesson-grid');
  for (const cat of categories) {
    const pct = cat.totalWords ? Math.round((cat.masteredWords / cat.totalWords) * 100) : 0;
    const card = el(`
      <div class="card lesson-card">
        <span class="level-badge">${cat.level}</span>
        <h2>${cat.name}</h2>
        <p class="muted">${cat.description || ''}</p>
        <p class="muted">${cat.masteredWords}/${cat.totalWords} woorden onder de knie${cat.dueWords ? ` &middot; ${cat.dueWords} te herhalen` : ''}</p>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>
    `);
    card.addEventListener('click', () => { location.hash = `#/lesson/${cat.slug}`; });
    grid.appendChild(card);
  }
}

// ---------- Lesson / quiz ----------

async function renderLesson(slug) {
  app.innerHTML = '<p class="muted">Laden...</p>';
  let data;
  try {
    data = await api(`/exercises/${slug}?limit=10`);
  } catch (err) {
    app.innerHTML = `<p class="error-message">${err.message}</p>`;
    return;
  }

  const session = { category: data.category, exercises: data.exercises, index: 0, correctCount: 0 };
  if (!session.exercises.length) {
    app.innerHTML = `<div class="card"><h1>${data.category.name}</h1><p class="muted">Geen oefeningen beschikbaar in deze les.</p><a href="#/dashboard">Terug naar lessen</a></div>`;
    return;
  }
  renderExercise(session);
}

function renderExercise(session) {
  const ex = session.exercises[session.index];
  app.innerHTML = '';
  const wrapper = el(`
    <div class="card">
      <div class="exercise-progress">${session.category.name} &middot; vraag ${session.index + 1} van ${session.exercises.length}</div>
      <h2>${ex.prompt}</h2>
      <div id="options"></div>
      <div id="feedback"></div>
    </div>
  `);
  app.appendChild(wrapper);

  const optionsDiv = wrapper.querySelector('#options');
  const feedbackDiv = wrapper.querySelector('#feedback');
  const options = ex.options && ex.options.length ? ex.options : null;

  function afterAnswer(result, chosenAnswer) {
    if (result.correct) session.correctCount += 1;

    const buttons = optionsDiv.querySelectorAll('.option-btn');
    buttons.forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.value === result.correctAnswer) btn.classList.add('correct');
      else if (btn.dataset.value === chosenAnswer) btn.classList.add('incorrect');
    });

    const fb = el(`
      <div class="feedback ${result.correct ? 'correct' : 'incorrect'}">
        <strong>${result.correct ? 'Goed gedaan!' : 'Niet helemaal juist.'}</strong>
        ${result.correct ? '' : `<div>Het juiste antwoord is: <strong>${result.correctAnswer}</strong></div>`}
        <div class="explanation">${result.explanation}</div>
        ${result.grammarRule ? `<div class="grammar-rule"><strong>${result.grammarRule.title}:</strong> ${result.grammarRule.explanation}</div>` : ''}
      </div>
    `);
    feedbackDiv.appendChild(fb);

    const nextBtn = el(`<button class="primary" style="margin-top:14px">${session.index + 1 < session.exercises.length ? 'Volgende' : 'Klaar'}</button>`);
    nextBtn.addEventListener('click', () => {
      session.index += 1;
      if (session.index < session.exercises.length) {
        renderExercise(session);
      } else {
        renderLessonComplete(session);
      }
    });
    feedbackDiv.appendChild(nextBtn);
  }

  async function submitAnswer(value) {
    try {
      const result = await api(`/exercises/${ex.id}/answer`, { method: 'POST', body: { answer: value } });
      afterAnswer(result, value);
    } catch (err) {
      feedbackDiv.innerHTML = `<p class="error-message">${err.message}</p>`;
    }
  }

  if (options) {
    for (const opt of options) {
      const btn = el(`<button class="option-btn" data-value="${escapeHtml(opt)}">${opt}</button>`);
      btn.addEventListener('click', () => submitAnswer(opt));
      optionsDiv.appendChild(btn);
    }
  } else {
    const form = el(`
      <form id="typing-form">
        <input type="text" id="typing-answer" autocomplete="off" required />
        <button type="submit" class="primary" style="margin-top:10px;width:fit-content">Controleren</button>
      </form>
    `);
    optionsDiv.appendChild(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitAnswer(document.getElementById('typing-answer').value);
    });
  }
}

function renderLessonComplete(session) {
  app.innerHTML = '';
  const pct = Math.round((session.correctCount / session.exercises.length) * 100);
  app.appendChild(el(`
    <div class="card">
      <h1>Les afgerond</h1>
      <p>Je had ${session.correctCount} van de ${session.exercises.length} vragen goed (${pct}%).</p>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="primary" id="again-btn">Nog een keer</button>
        <button class="secondary" id="back-btn">Terug naar lessen</button>
      </div>
    </div>
  `));
  document.getElementById('again-btn').addEventListener('click', () => renderLesson(session.category.slug));
  document.getElementById('back-btn').addEventListener('click', () => { location.hash = '#/dashboard'; });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Progress ----------

async function renderProgress() {
  app.innerHTML = '<p class="muted">Laden...</p>';
  const [progress, mistakes] = await Promise.all([api('/progress'), api('/progress/mistakes')]);

  app.innerHTML = '';
  app.appendChild(el(`
    <div>
      <h1>Mijn voortgang</h1>
      <div class="stats-row">
        <div class="stat-box"><div class="value">${progress.accuracyPct}%</div><div class="label">Nauwkeurigheid</div></div>
        <div class="stat-box"><div class="value">${progress.wordsMastered}/${progress.totalWords}</div><div class="label">Woorden onder de knie</div></div>
        <div class="stat-box"><div class="value">${progress.wordsStarted}</div><div class="label">Woorden geoefend</div></div>
        <div class="stat-box"><div class="value">${progress.totalAttempts}</div><div class="label">Totaal antwoorden</div></div>
      </div>
    </div>
  `));

  const catCard = el(`<div class="card"><h2>Voortgang per les</h2><table><thead><tr><th>Les</th><th>Gestart</th><th>Onder de knie</th></tr></thead><tbody id="cat-body"></tbody></table></div>`);
  app.appendChild(catCard);
  const catBody = catCard.querySelector('#cat-body');
  for (const c of progress.perCategory) {
    catBody.appendChild(el(`<tr><td>${c.name}</td><td>${c.startedWords}/${c.totalWords}</td><td>${c.masteredWords}/${c.totalWords}</td></tr>`));
  }

  const missedCard = el(`<div class="card"><h2>Vaakst fout beantwoord</h2></div>`);
  if (!mistakes.topMissed.length) {
    missedCard.appendChild(el(`<p class="muted">Nog geen fouten geregistreerd. Blijf zo doorgaan!</p>`));
  } else {
    const table = el(`<table><thead><tr><th>Vraag</th><th>Juiste antwoord</th><th>Uitleg</th><th>Keer fout</th></tr></thead><tbody></tbody></table>`);
    const tbody = table.querySelector('tbody');
    for (const m of mistakes.topMissed) {
      tbody.appendChild(el(`<tr><td>${m.prompt}</td><td>${m.correct_answer}</td><td>${m.explanation}</td><td>${m.missCount}</td></tr>`));
    }
    missedCard.appendChild(table);
  }
  app.appendChild(missedCard);

  const recentCard = el(`<div class="card"><h2>Recente fouten</h2></div>`);
  if (!mistakes.recentMistakes.length) {
    recentCard.appendChild(el(`<p class="muted">Geen recente fouten.</p>`));
  } else {
    const table = el(`<table><thead><tr><th>Vraag</th><th>Jouw antwoord</th><th>Juist</th><th>Uitleg</th></tr></thead><tbody></tbody></table>`);
    const tbody = table.querySelector('tbody');
    for (const m of mistakes.recentMistakes) {
      tbody.appendChild(el(`<tr><td>${m.prompt}</td><td>${m.given_answer || '-'}</td><td>${m.correct_answer}</td><td>${m.explanation}${m.grammar_title ? ` <span class="muted">(${m.grammar_title})</span>` : ''}</td></tr>`));
    }
    recentCard.appendChild(table);
  }
  app.appendChild(recentCard);
}
