// ---------- weekly goal + streak freezes ----------

const WEEKDAY_LETTERS = ['M', 'D', 'W', 'D', 'V', 'Z', 'Z'];

function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// The card at the top of the lesson path: a ring for the XP goal, seven dots
// for the days of this week, and how many streak freezes are in the bank.
function renderWeeklyGoalCard() {
  const stats = Storage.loadStats(state.user.username);
  const w = stats && stats.weekly;
  if (!w) return null;

  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, w.xpPct || 0));
  const dash = (pct / 100) * circumference;
  const doneDays = new Set(w.dayDates || []);
  const frozenDays = new Set(w.frozenDates || []);
  const today = new Date().toISOString().slice(0, 10);

  const card = el(`
    <div class="card goal-card ${w.reached ? 'reached' : ''}">
      <div class="goal-main">
        <div class="goal-ring">
          <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
            <circle class="goal-ring-track" cx="32" cy="32" r="${radius}"></circle>
            <circle class="goal-ring-fill ${dash > 0 ? '' : 'empty'}" cx="32" cy="32" r="${radius}"
              stroke-dasharray="${dash.toFixed(1)} ${(circumference - dash).toFixed(1)}"></circle>
          </svg>
          <span class="goal-ring-label">${pct}%</span>
        </div>
        <div class="goal-text">
          <h2>${w.reached ? '🎉 Weekdoel gehaald' : '🎯 Weekdoel'}</h2>
          <p class="muted goal-numbers"><strong>${w.xp}</strong> van ${w.goalXp} XP deze week &middot; <strong>${w.days}</strong> van ${w.goalDays} dagen geoefend</p>
          <div class="goal-days" id="goal-days"></div>
        </div>
      </div>
      <p class="muted goal-freeze" id="goal-freeze"></p>
    </div>
  `);

  const daysEl = card.querySelector('#goal-days');
  for (let i = 0; i < 7; i++) {
    const date = addDays(w.weekStart, i);
    const frozen = frozenDays.has(date);
    const done = doneDays.has(date);
    const cls = frozen ? 'frozen' : done ? 'done' : date > today ? 'future' : 'missed';
    const dot = el(`<span class="goal-day ${cls} ${date === today ? 'today' : ''}" title="${date}">${frozen ? '❄' : WEEKDAY_LETTERS[i]}</span>`);
    daysEl.appendChild(dot);
  }

  // Freezes sit in the day row as a small chip; the explanation lives in
  // Instellingen, where you set the goal. Only news gets its own line.
  const freezes = stats.freezes || 0;
  if (freezes) daysEl.appendChild(el(`<span class="goal-freeze-chip" title="Vangt één gemiste dag op">❄ ${freezes}</span>`));

  const freezeEl = card.querySelector('#goal-freeze');
  const yesterday = addDays(today, -1);
  if (stats.freezeSpentOn === yesterday) freezeEl.textContent = '❄️ Een vriezer ving gisteren op, je reeks loopt door.';
  else freezeEl.remove();
  return card;
}

// Settings card: how much XP and how many days per week you aim for.
function renderGoalSettingsCard() {
  const card = el(`
    <div class="card">
      <h2>🎯 Weekdoel</h2>
      <p class="muted">Je doel loopt van maandag tot en met zondag en telt alle XP mee: oefeningen, toetsen, spelletjes en verhalen. Houd je het vol, dan verdien je elke volle week een vriezer die één gemiste dag opvangt. Dit doel hoort bij je account en geldt dus op al je toestellen.</p>
      <div class="setting-row">
        <label for="goal-xp">XP per week</label>
        <select id="goal-xp"></select>
      </div>
      <div class="setting-row">
        <label for="goal-days-sel">Dagen per week</label>
        <select id="goal-days-sel"></select>
      </div>
      <p class="muted setting-hint" id="goal-status"></p>
    </div>
  `);
  const xpSel = card.querySelector('#goal-xp');
  const daysSel = card.querySelector('#goal-days-sel');
  const status = card.querySelector('#goal-status');
  const XP_LABELS = { 250: '250 XP — rustig aan (ongeveer 25 goede antwoorden)', 500: '500 XP — standaard', 1000: '1000 XP — stevig tempo', 2000: '2000 XP — intensief' };

  function fill(w) {
    xpSel.innerHTML = '';
    (w.xpChoices || [250, 500, 1000, 2000]).forEach((v) => {
      xpSel.appendChild(el(`<option value="${v}" ${v === w.goalXp ? 'selected' : ''}>${escapeHtml(XP_LABELS[v] || v + ' XP')}</option>`));
    });
    daysSel.innerHTML = '';
    (w.dayChoices || [3, 4, 5, 6, 7]).forEach((v) => {
      daysSel.appendChild(el(`<option value="${v}" ${v === w.goalDays ? 'selected' : ''}>${v} ${v === 1 ? 'dag' : 'dagen'}</option>`));
    });
    const stats = Storage.loadStats(state.user.username);
    const freezes = (stats && stats.freezes) || 0;
    status.textContent = `Deze week: ${w.xp} XP op ${w.days} ${w.days === 1 ? 'dag' : 'dagen'}. `
      + (freezes ? `Je hebt ${freezes} ${freezes === 1 ? 'vriezer' : 'vriezers'} op zak.` : 'Nog geen vriezer op zak.');
  }

  async function save() {
    status.textContent = 'Opslaan…';
    try {
      const w = await api('/progress/goal', { method: 'POST', body: { weeklyXp: Number(xpSel.value), weeklyDays: Number(daysSel.value) } });
      fill(w);
      status.textContent = `Opgeslagen. Deze week: ${w.xp} van ${w.goalXp} XP op ${w.days} van ${w.goalDays} dagen.`;
      await pullStats().catch(() => {});
    } catch (e) {
      status.textContent = 'Opslaan lukte niet. Probeer het opnieuw zodra je online bent.';
    }
  }

  xpSel.addEventListener('change', save);
  daysSel.addEventListener('change', save);

  api('/progress/goal')
    .then(fill)
    .catch(() => { status.textContent = 'Het weekdoel is alleen online in te stellen.'; });
  return card;
}

