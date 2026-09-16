// ---------- leaderboard (live only: ranking across accounts needs the server) ----------

const MEDALS = ['🥇', '🥈', '🥉'];

async function renderLeaderboard() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div>
      <h1>Ranglijst</h1>
      <p class="muted">Vergelijk je voortgang met andere leerlingen. XP telt goede antwoorden (10) én behaalde niveautoetsen (150). Dit overzicht vraagt een internetverbinding.</p>
      <div id="leaderboard-content"></div>
    </div>
  `));
  const slot = document.getElementById('leaderboard-content');

  if (!navigator.onLine) {
    slot.appendChild(el(`<div class="card"><p class="muted">Je bent offline. Maak verbinding met internet om de ranglijst te bekijken.</p></div>`));
    return;
  }

  slot.appendChild(el(`<div class="card"><p class="muted">Ranglijst laden…</p></div>`));
  try {
    const data = await api('/leaderboard');
    slot.innerHTML = '';

    const table = el(`
      <div class="card">
        <div class="table-scroll">
          <table class="leaderboard-table">
            <thead><tr><th>#</th><th>Gebruiker</th><th>Toets</th><th>Niveau</th><th>XP</th><th>Reeks</th><th>Woorden</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    `);
    const tbody = table.querySelector('tbody');
    data.leaderboard.forEach((entry) => {
      const isMe = state.user && entry.userId === state.user.id;
      const rankLabel = MEDALS[entry.rank - 1] || entry.rank;
      const row = el(`
        <tr class="${isMe ? 'leaderboard-me' : ''}">
          <td class="rank-cell">${rankLabel}</td>
          <td>${escapeHtml(entry.username)}${isMe ? ' <span class="muted">(jij)</span>' : ''}</td>
          <td>${entry.highestLevel ? `🎓 ${escapeHtml(entry.highestLevel)}` : '<span class="muted">—</span>'}</td>
          <td>${entry.level} &middot; <span class="muted">${escapeHtml(entry.levelTitle)}</span></td>
          <td>${entry.xp} XP</td>
          <td>🔥 ${entry.currentStreak}</td>
          <td>${entry.wordsMastered}</td>
        </tr>
      `);
      tbody.appendChild(row);
    });
    slot.appendChild(table);

    if (!data.leaderboard.length) {
      slot.appendChild(el(`<div class="card"><p class="muted">Nog geen andere leerlingen om mee te vergelijken.</p></div>`));
    }
  } catch (err) {
    slot.innerHTML = '';
    slot.appendChild(el(`<div class="card"><p class="error-message">${escapeHtml(err.message || 'Kon de ranglijst niet laden.')}</p></div>`));
  }
}
