// ---------- "Oefenen": everything that is not the lesson path ----------

// One description of every practice tool, grouped, so the tab can render them
// and the dashboard can stay a lesson path. `id` is the switch in
// Instellingen; the two daily ones have none and can never be hidden.
function toolTiles(content, username) {
  const openMistakes = mistakeExercises(content, username).length;
  const dueCount = dueWordIds(content, username).length;
  const storiesRead = Object.keys(Storage.loadStories(username)).length;
  const storyTotal = (content.stories || []).length;

  const tiles = [
    { group: 'dag', cls: 'review-card', icon: '🔁', title: 'Vandaag herhalen',
      text: dueCount
        ? `${dueCount === 1 ? 'Eén woord is' : `${dueCount} woorden zijn`} aan herhaling toe, uit al je lessen samen. Dít is wat het laat beklijven.`
        : 'Niets aan herhaling toe — alles zit nog vers. Kom morgen terug of ga verder op het pad.',
      badge: dueCount || null, hash: dueCount ? '#/review' : '#/dashboard' },
    { group: 'dag', cls: 'practice-card', icon: '🎯', title: 'Oefen je fouten',
      text: openMistakes
        ? `${openMistakes === 1 ? 'Eén vraag die je fout had' : `${openMistakes} vragen die je fout had`} en nog niet hebt rechtgezet, de vaakst gemiste eerst.`
        : 'Niets open: alles wat je fout had, heb je daarna goed beantwoord.',
      badge: openMistakes || null, hash: openMistakes ? '#/practice' : '#/dashboard' },

    { group: 'spreken', id: 'dialogue', cls: 'dialogue-card', icon: '🗣️', title: 'Gesprek oefenen',
      text: 'Rollenspel met de AI: apotheek, hotel, politie, huurbaas… Jij typt of spreekt Russisch, de AI antwoordt in zijn rol en corrigeert je.', badge: null, hash: '#/dialogue' },
    { group: 'spreken', id: 'dictation', cls: 'dictation-card', icon: '🔢', title: 'Getallen & tijd',
      text: 'Luister naar prijzen, tijden, datums en telefoonnummers en typ wat je hoort — het eerste wat misgaat in een winkel of taxi.', badge: null, hash: '#/dictation' },

    { group: 'lezen', id: 'stories', cls: 'stories-card', icon: '📖', title: 'Leesverhalen',
      text: 'Korte verhalen van A1 tot C2. Tik op een zin voor de vertaling, op een woord voor de betekenis, en beantwoord daarna de begripsvragen.',
      badge: storyTotal ? `${storiesRead}/${storyTotal}` : null, hash: '#/stories', hide: !storyTotal },
    { group: 'lezen', id: 'phrasebook', cls: 'phrasebook-card', icon: '📕', title: 'Zakboekje',
      text: 'Per situatie de zinnen die je écht nodig hebt — apotheek, noodgeval, taxi, hotel — groot, met uitspraak, ook offline.', badge: null, hash: '#/phrasebook' },
    { group: 'lezen', id: 'match', cls: 'match-card', icon: '🃏', title: 'Koppelspel',
      text: 'Vijf Russische en vijf Nederlandse woorden: tik de paren bij elkaar, zo snel mogelijk. Telt mee voor je herhaling.', badge: null, hash: '#/match' },

    { group: 'schrijven', id: 'keyboard', cls: 'keyboard-card', icon: '⌨️', title: 'Toetsenbord ЙЦУКЕН',
      text: 'Leer blind typen op de Russische indeling: woorden en zinnen uit de lessen, met de toets die je zoekt uitgelicht.', badge: null, hash: '#/keyboard' },
    { group: 'schrijven', id: 'handwriting', cls: 'handwriting-card', icon: '✍️', title: 'Schrijven met de hand',
      text: 'Trek de Cyrillische letters na op het scherm. De app kijkt na hoe nauwkeurig je bent — schrijven laat de vorm pas echt beklijven.', badge: null, hash: '#/handwriting' }
  ];
  return tiles.filter((t) => !t.hide && (!t.id || toolEnabled(t.id)));
}

const TOOL_GROUPS = [
  { id: 'dag', title: 'Elke dag', desc: 'De twee rondes die je voortgang echt vasthouden.' },
  { id: 'spreken', title: 'Luisteren & spreken', desc: 'Oefenen met wat er in het echt op je afkomt.' },
  { id: 'lezen', title: 'Lezen & woorden', desc: 'Woordenschat en leestempo, ook zonder internet.' },
  { id: 'schrijven', title: 'Typen & schrijven', desc: 'Cyrillisch onder je vingers krijgen.' }
];

async function renderToolsMenu() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const tiles = toolTiles(content, state.user.username);

  app.innerHTML = '';
  const wrap = el(`
    <div>
      <h1>✨ Oefenen</h1>
      <p class="muted">Alles naast het lessenpad. Welke hiervan je ziet, bepaal je onder Instellingen → Lesonderdelen.</p>
      <div id="tool-groups"></div>
    </div>
  `);
  app.appendChild(wrap);
  const root = wrap.querySelector('#tool-groups');

  for (const group of TOOL_GROUPS) {
    const inGroup = tiles.filter((t) => t.group === group.id);
    if (!inGroup.length) continue;
    const section = el(`
      <section class="tool-group">
        <h2>${escapeHtml(group.title)}</h2>
        <p class="muted tool-group-desc">${escapeHtml(group.desc)}</p>
        <div class="tool-grid"></div>
      </section>
    `);
    const grid = section.querySelector('.tool-grid');
    for (const t of inGroup) {
      const card = el(`
        <button type="button" class="card tool-card ${t.cls}">
          <div class="row1"><h2>${t.icon} ${escapeHtml(t.title)}</h2>${t.badge != null ? `<span class="level-badge">${escapeHtml(String(t.badge))}</span>` : ''}</div>
          <p class="muted">${escapeHtml(t.text)}</p>
        </button>
      `);
      card.addEventListener('click', () => { location.hash = t.hash; });
      grid.appendChild(card);
    }
    root.appendChild(section);
  }

  if (!tiles.length) {
    root.appendChild(el(`<div class="card"><p class="muted">Je hebt alle oefenvormen verborgen. Zet ze weer aan onder Instellingen → Lesonderdelen.</p><a class="secondary-link" href="#/settings">Naar instellingen</a></div>`));
  }
}

