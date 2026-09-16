// ---------- survival phrasebook (offline, from the content bundle) ----------

async function renderPhrasebook() {
  const content = await ensureContentLoaded();
  if (!content) return renderNoContentMessage();
  const book = content.phrasebook || [];
  app.innerHTML = '';
  const wrap = el(`
    <div class="phrasebook">
      <h1>📕 Zakboekje</h1>
      <p class="muted">De zinnen die je ter plekke nodig hebt, per situatie. Tik op 🔊 om ze te laten uitspreken (🐢 langzaam), of laat het scherm gewoon zien. Werkt offline.</p>
      <input type="search" id="pb-search" class="typing-answer pb-search" placeholder="Zoek (Nederlands of Russisch)…" autocomplete="off" />
      <div class="pb-tabs" id="pb-tabs"></div>
      <div id="pb-body"></div>
    </div>
  `);
  app.appendChild(wrap);
  const tabs = wrap.querySelector('#pb-tabs');
  const body = wrap.querySelector('#pb-body');
  const search = wrap.querySelector('#pb-search');
  let current = book[0] ? book[0].id : null;

  function paint() {
    tabs.innerHTML = '';
    body.innerHTML = '';
    const q = search.value.trim().toLowerCase();
    const sections = q
      ? book.map((s) => ({ ...s, phrases: s.phrases.filter(([ru, nl]) => ru.toLowerCase().includes(q) || nl.toLowerCase().includes(q)) })).filter((s) => s.phrases.length)
      : book.filter((s) => s.id === current);
    if (!q) {
      for (const s of book) {
        const t = el(`<button type="button" class="level-pill ${s.id === current ? 'passed' : ''}">${s.icon} ${escapeHtml(s.title)}</button>`);
        t.addEventListener('click', () => { current = s.id; paint(); });
        tabs.appendChild(t);
      }
    }
    if (!sections.length) body.appendChild(el(`<p class="muted">Niets gevonden.</p>`));
    for (const s of sections) {
      const card = el(`<div class="card"><h2>${s.icon} ${escapeHtml(s.title)}</h2><div class="pb-list"></div></div>`);
      const list = card.querySelector('.pb-list');
      for (const [ru, nl] of s.phrases) {
        const row = el(`<div class="pb-row"><div class="pb-text"><p class="pb-ru"></p><p class="pb-nl muted"></p></div><span class="pb-speak"></span></div>`);
        row.querySelector('.pb-ru').textContent = ru;
        row.querySelector('.pb-nl').textContent = nl;
        const sp = renderSpeakButton(ru, '🔊');
        if (sp) row.querySelector('.pb-speak').replaceWith(sp); else row.querySelector('.pb-speak').remove();
        list.appendChild(row);
      }
      body.appendChild(card);
    }
  }
  search.addEventListener('input', paint);
  paint();
}

