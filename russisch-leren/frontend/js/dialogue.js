// ---------- role-play dialogues (online, needs the server's AI key) ----------

const dialogueState = { scenario: null, level: 'B1', messages: [], turns: [] };

function defaultDialogueLevel() {
  const stats = Storage.loadStats(state.user.username);
  const certified = (stats && stats.certifiedLevels) || [];
  const highest = LEVEL_ORDER.filter((l) => certified.includes(l)).pop();
  const next = highest ? LEVEL_ORDER[Math.min(LEVEL_ORDER.indexOf(highest) + 1, LEVEL_ORDER.length - 1)] : 'A1';
  return next;
}

async function renderDialogueList() {
  app.innerHTML = '';
  const wrap = el(`
    <div>
      <h1>🗣️ Gesprek oefenen</h1>
      <p class="muted">Kies een situatie. De AI speelt de andere kant in het Russisch op jouw niveau, antwoordt op wat jij typt of inspreekt, en geeft na elke beurt een korte correctie in het Nederlands.</p>
      <div class="reminder-row" style="margin-bottom:16px">
        <label for="dialogue-level">Niveau</label>
        <select id="dialogue-level">${LEVEL_ORDER.map((l) => `<option value="${l}">${l}</option>`).join('')}</select>
      </div>
      <div id="scenario-grid" class="scenario-grid"><p class="muted">Laden…</p></div>
    </div>
  `);
  app.appendChild(wrap);
  const levelSel = wrap.querySelector('#dialogue-level');
  levelSel.value = dialogueState.level || defaultDialogueLevel();
  levelSel.addEventListener('change', () => { dialogueState.level = levelSel.value; });
  dialogueState.level = levelSel.value;

  const grid = wrap.querySelector('#scenario-grid');
  if (!navigator.onLine) {
    grid.innerHTML = `<p class="muted">Gesprekken oefenen kan alleen online.</p>`;
    return;
  }
  try {
    const data = await api('/ai/scenarios');
    grid.innerHTML = '';
    if (!data.configured) {
      grid.appendChild(el(`<div class="card"><p class="muted">Voor rollenspellen heeft de server een Anthropic API-sleutel nodig: vul in Home Assistant bij de add-on-configuratie <code>anthropic_api_key</code> in en herstart de add-on. Zonder sleutel werkt de rest van de app gewoon.</p></div>`));
    }
    for (const s of data.scenarios) {
      const card = el(`
        <button type="button" class="card tool-card scenario-card" ${data.configured ? '' : 'disabled'}>
          <div class="row1"><h2>${s.icon} ${escapeHtml(s.title)}</h2></div>
          <p class="muted">Je gesprekspartner: ${escapeHtml(s.role)}.</p>
        </button>
      `);
      card.addEventListener('click', () => {
        dialogueState.scenario = s;
        dialogueState.messages = [];
        dialogueState.turns = [];
        location.hash = `#/dialogue/${s.id}`;
      });
      grid.appendChild(card);
    }
  } catch (err) {
    grid.innerHTML = `<p class="error-message">${escapeHtml(err.message)}</p>`;
  }
}

async function renderDialogue(scenarioId) {
  if (!dialogueState.scenario || dialogueState.scenario.id !== scenarioId) {
    // deep link / reload: fetch the scenario meta first
    try {
      const data = await api('/ai/scenarios');
      const s = data.scenarios.find((x) => x.id === scenarioId);
      if (!s) { location.hash = '#/dialogue'; return; }
      dialogueState.scenario = s;
      dialogueState.messages = [];
      dialogueState.turns = [];
      if (!dialogueState.level) dialogueState.level = defaultDialogueLevel();
    } catch (err) {
      app.innerHTML = '';
      app.appendChild(el(`<div class="card"><p class="error-message">${escapeHtml(err.message)}</p><a href="#/dialogue">Terug</a></div>`));
      return;
    }
  }
  const s = dialogueState.scenario;
  app.innerHTML = '';
  const wrap = el(`
    <div class="dialogue">
      <div class="dialogue-head">
        <div><h1>${s.icon} ${escapeHtml(s.title)}</h1><p class="muted">${escapeHtml(s.role)} · niveau ${escapeHtml(dialogueState.level)}</p></div>
        <a href="#/dialogue" class="secondary-link">Andere situatie</a>
      </div>
      <div class="chat" id="chat"></div>
      <form class="chat-form" id="chat-form">
        <div class="typing-row">
          <input type="text" id="chat-input" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ru" placeholder="Typ of spreek je antwoord in het Russisch…" />
          <span class="mic-slot"></span>
        </div>
        <button type="submit" class="primary" id="chat-send">Versturen</button>
      </form>
    </div>
  `);
  app.appendChild(wrap);
  const chat = wrap.querySelector('#chat');
  const form = wrap.querySelector('#chat-form');
  const input = wrap.querySelector('#chat-input');
  const send = wrap.querySelector('#chat-send');
  const mic = renderMicButton((t) => { input.value = t; input.focus(); });
  if (mic) form.querySelector('.mic-slot').replaceWith(mic);

  function bubble(turn) {
    if (turn.role === 'user') {
      const b = el(`<div class="bubble me"><p></p></div>`);
      b.querySelector('p').textContent = turn.content;
      return b;
    }
    const b = el(`
      <div class="bubble them">
        <p class="ru"></p>
        <button type="button" class="link-btn toggle-nl">vertaling</button>
        <p class="nl muted" hidden></p>
        ${turn.correction ? `<div class="correction"><strong>Correctie:</strong> <span></span></div>` : ''}
        ${turn.tip ? `<div class="tip"><strong>Tip:</strong> <span></span></div>` : ''}
        <span class="speak-slot"></span>
      </div>
    `);
    b.querySelector('.ru').textContent = turn.content;
    b.querySelector('.nl').textContent = turn.translation || '';
    b.querySelector('.toggle-nl').addEventListener('click', () => { const nl = b.querySelector('.nl'); nl.hidden = !nl.hidden; });
    if (!turn.translation) b.querySelector('.toggle-nl').remove();
    if (turn.correction) b.querySelector('.correction span').textContent = turn.correction;
    if (turn.tip) b.querySelector('.tip span').textContent = turn.tip;
    const sp = renderSpeakButton(turn.content, '🔊');
    if (sp) b.querySelector('.speak-slot').replaceWith(sp); else b.querySelector('.speak-slot').remove();
    return b;
  }
  function paint() {
    chat.innerHTML = '';
    for (const t of dialogueState.turns) chat.appendChild(bubble(t));
    chat.scrollTop = chat.scrollHeight;
  }
  async function ask(userText) {
    if (userText) {
      dialogueState.messages.push({ role: 'user', content: userText });
      dialogueState.turns.push({ role: 'user', content: userText });
      paint();
      recordActivity('dialogue_turn', { scenario: s.id, level: dialogueState.level });
    }
    send.disabled = true;
    input.disabled = true;
    const thinking = el(`<div class="bubble them"><p class="muted">…</p></div>`);
    chat.appendChild(thinking);
    chat.scrollTop = chat.scrollHeight;
    try {
      const r = await api('/ai/dialogue', { method: 'POST', body: { scenario: s.id, level: dialogueState.level, messages: dialogueState.messages } });
      dialogueState.messages.push({ role: 'assistant', content: r.reply });
      dialogueState.turns.push({ role: 'assistant', content: r.reply, translation: r.translation, correction: r.correction, tip: r.tip });
      paint();
      speakRussian(r.reply);
      if (r.finished) {
        chat.appendChild(el(`<div class="card" style="margin-top:10px"><p>Gesprek afgerond. <a href="#/dialogue">Kies een nieuwe situatie</a> of ga gewoon door.</p></div>`));
      }
    } catch (err) {
      thinking.remove();
      chat.appendChild(el(`<p class="error-message">${escapeHtml(err.message)}</p>`));
    } finally {
      send.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    ask(text);
  });
  paint();
  if (!dialogueState.turns.length) ask(null);
}

