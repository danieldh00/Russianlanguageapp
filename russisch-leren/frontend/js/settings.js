// ---------- Home Assistant: notification target + sensor ----------

function renderHaCard() {
  const card = el(`
    <div class="card">
      <h2>🏠 Home Assistant</h2>
      <p class="muted">Laat Home Assistant de dagelijkse herinnering sturen naar jóuw telefoon (Companion-app) of naar het dashboard, en publiceer een sensor met je herhaalachterstand voor dashboards en automatiseringen.</p>
      <div id="ha-body"><p class="muted">Laden…</p></div>
    </div>
  `);
  const body = card.querySelector('#ha-body');
  (async () => {
    let st;
    try {
      st = await api('/ha/status');
    } catch (err) {
      body.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
      return;
    }
    if (!st.available) {
      body.innerHTML = `<p class="muted">Niet beschikbaar: de app draait niet als Home Assistant add-on (of de add-on mist <code>homeassistant_api: true</code>).</p>`;
      return;
    }
    const s = st.settings || { target: 'persistent_notification', enabled: false, reminderTime: '19:00', sensorEnabled: true };
    body.innerHTML = '';
    body.appendChild(el(`
      <div>
        <div class="setting-row">
          <label for="ha-target">Melding naar</label>
          <select id="ha-target"></select>
          <p class="muted setting-hint">Dit koppelt dit leeraccount (<strong>${escapeHtml(state.user.username)}</strong>) aan een Home Assistant-toestel: elk toestel met de Companion-app staat hier als <em>notify.mobile_app_…</em>. Kies je eigen telefoon. "Home Assistant-melding" verschijnt in het dashboard van iedereen.</p>
        </div>
        <div class="reminder-row">
          <label for="ha-time">Tijdstip</label>
          <input type="time" id="ha-time" value="${escapeHtml(s.reminderTime)}" />
          <label class="check"><input type="checkbox" id="ha-enabled" ${s.enabled ? 'checked' : ''} /> Herinnering aan</label>
          <label class="check"><input type="checkbox" id="ha-sensor" ${s.sensorEnabled ? 'checked' : ''} /> Sensor publiceren</label>
        </div>
        <p class="muted setting-hint">Sensor: <code>${escapeHtml(st.sensorEntityId)}</code> — status = aantal woorden te herhalen; attributen: reeks, XP, niveau, vandaag geoefend. Bijgewerkt elke 5 minuten.${st.publicUrl ? '' : ' Tip: vul in de add-on-configuratie <code>public_url</code> in (bv. je Cloudflare-adres), dan opent de melding direct de app.'}</p>
        <div class="reminder-row">
          <button type="button" class="primary" id="ha-save">Opslaan</button>
          <button type="button" class="secondary" id="ha-test">Testmelding</button>
        </div>
        <p class="muted reminder-status" id="ha-status">${st.error ? escapeHtml('Home Assistant meldde: ' + st.error) : (s.enabled ? `Aan — dagelijks om ${escapeHtml(s.reminderTime)} naar ${escapeHtml(s.target)}.` : 'Uit.')}</p>
      </div>
    `));
    const sel = body.querySelector('#ha-target');
    for (const t of st.targets) {
      const o = document.createElement('option');
      o.value = t.id; o.textContent = t.label;
      sel.appendChild(o);
    }
    if (st.targets.some((t) => t.id === s.target)) sel.value = s.target;
    const statusEl = body.querySelector('#ha-status');
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'Europe/Amsterdam';
    body.querySelector('#ha-save').addEventListener('click', async () => {
      statusEl.textContent = 'Opslaan…';
      try {
        const r = await api('/ha/settings', { method: 'POST', body: { target: sel.value, enabled: body.querySelector('#ha-enabled').checked, reminderTime: body.querySelector('#ha-time').value || '19:00', timeZone: tz, sensorEnabled: body.querySelector('#ha-sensor').checked } });
        statusEl.textContent = r.settings.enabled ? `Opgeslagen — dagelijks om ${r.settings.reminderTime} naar ${r.settings.target}.` : 'Opgeslagen — herinnering uit.';
      } catch (err) { statusEl.textContent = err.message; }
    });
    body.querySelector('#ha-test').addEventListener('click', async () => {
      statusEl.textContent = 'Testmelding versturen…';
      try { await api('/ha/test', { method: 'POST', body: {} }); statusEl.textContent = 'Verstuurd via Home Assistant.'; } catch (err) { statusEl.textContent = err.message; }
    });
  })();
  return card;
}

// ---------- settings: speech, reminder, account ----------

const SPEECH_SAMPLE = 'Здравствуйте! Меня зовут Даниэль. Я учу русский язык.';

function renderSpeechCard() {
  const card = el(`
    <div class="card">
      <h2>🔊 Uitspraak</h2>
      <p class="muted">Elke luisterknop heeft twee snelheden: normaal en 🐢 langzaam. Stel hier in hoe snel die zijn en welke stem je hoort. Langzaam is handig om elke klank en de beklemtoonde lettergreep te horen.</p>
      <div id="speech-body"></div>
    </div>
  `);
  const body = card.querySelector('#speech-body');
  if (!('speechSynthesis' in window)) {
    body.appendChild(el(`<p class="muted">Deze browser ondersteunt geen spraaksynthese.</p>`));
    return card;
  }
  const s = speechSettings();
  body.appendChild(el(`
    <div>
    <div class="setting-row">
      <label for="rate">Normale snelheid <span class="muted" id="rate-val">${s.rate.toFixed(2)}×</span></label>
      <input type="range" id="rate" min="0.5" max="1.3" step="0.05" value="${s.rate}" />
    </div>
    <div class="setting-row">
      <label for="slow-rate">Langzame snelheid 🐢 <span class="muted" id="slow-val">${s.slowRate.toFixed(2)}×</span></label>
      <input type="range" id="slow-rate" min="0.3" max="0.9" step="0.05" value="${s.slowRate}" />
    </div>
    <div class="setting-row">
      <label for="voice">Stem</label>
      <select id="voice"><option value="">Automatisch (beste Russische stem)</option></select>
      <p class="muted setting-hint" id="voice-hint"></p>
    </div>
    <div class="reminder-row">
      <button type="button" class="secondary" id="test-normal">▶︎ Test normaal</button>
      <button type="button" class="secondary" id="test-slow">🐢 Test langzaam</button>
    </div>
    <p class="muted setting-hint">Op iPhone/iPad krijg je een veel betere stem via Instellingen → Toegankelijkheid → Gesproken materiaal → Stemmen → Russisch → Milena (uitgebreid) downloaden. Daarna staat hij hier in de lijst.</p>
    </div>
  `));
  const rate = body.querySelector('#rate');
  const slowRate = body.querySelector('#slow-rate');
  const voiceSel = body.querySelector('#voice');
  const hint = body.querySelector('#voice-hint');
  rate.addEventListener('input', () => { body.querySelector('#rate-val').textContent = Number(rate.value).toFixed(2) + '×'; saveSpeechSettings({ rate: Number(rate.value) }); });
  slowRate.addEventListener('input', () => { body.querySelector('#slow-val').textContent = Number(slowRate.value).toFixed(2) + '×'; saveSpeechSettings({ slowRate: Number(slowRate.value) }); });
  function fillVoices() {
    const voices = russianVoices();
    [...voiceSel.querySelectorAll('option:not([value=""])')].forEach((o) => o.remove());
    for (const v of voices) {
      const opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})${v.localService ? '' : ' · online'}`;
      voiceSel.appendChild(opt);
    }
    voiceSel.value = voices.some((v) => v.voiceURI === s.voiceURI) ? s.voiceURI : '';
    hint.textContent = voices.length ? `${voices.length} Russische ${voices.length === 1 ? 'stem' : 'stemmen'} beschikbaar op dit toestel.` : 'Geen Russische stem gevonden op dit toestel; installeer er een via de systeeminstellingen.';
  }
  fillVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.addEventListener('voiceschanged', fillVoices);
  voiceSel.addEventListener('change', () => saveSpeechSettings({ voiceURI: voiceSel.value }));
  body.querySelector('#test-normal').addEventListener('click', () => speakRussian(SPEECH_SAMPLE));
  body.querySelector('#test-slow').addEventListener('click', () => speakRussian(SPEECH_SAMPLE, { slow: true }));
  return card;
}

// Settings: which exercise kinds a lesson may draw from on this device, and
// which tiles the dashboard shows. Per device on purpose -- the phone and the
// tablet are not equally good at every exercise.
function renderPartsCard() {
  const card = el(`
    <div class="card">
      <h2>🎛️ Lesonderdelen</h2>
      <p class="muted">Wat je hier uitzet, komt niet meer voor in je lessen, de dagelijkse herhaling en het oefenen van je fouten. Dit geldt alleen voor dit toestel, zodat je op je telefoon iets anders kunt uitzetten dan op je tablet. De niveautoets blijft altijd alle vormen toetsen, anders zegt het certificaat niets.</p>
      <div class="parts-list" id="parts-list"></div>
      <h3 class="parts-heading">Tegels onder ✨ Oefenen</h3>
      <p class="muted">Verbergt de tegel in het oefenmenu. "Vandaag herhalen" en "Oefen je fouten" blijven altijd staan.</p>
      <div class="parts-list" id="tools-list"></div>
      <p class="muted setting-hint" id="parts-status"></p>
    </div>
  `);
  const partsList = card.querySelector('#parts-list');
  const toolsList = card.querySelector('#tools-list');
  const status = card.querySelector('#parts-status');

  for (const part of LESSON_PARTS) {
    const on = partSettings()[part.id] !== false;
    const row = el(`
      <label class="part-row">
        <input type="checkbox" ${on ? 'checked' : ''} />
        <span class="part-text">
          <span class="part-label">${part.icon} ${escapeHtml(part.label)}</span>
          <span class="part-desc muted">${escapeHtml(part.desc)}</span>
        </span>
      </label>
    `);
    const box = row.querySelector('input');
    box.addEventListener('change', () => {
      const next = { ...partSettings(), [part.id]: box.checked };
      if (!Object.values(next).some(Boolean)) {
        // there has to be something left to practise with
        box.checked = true;
        status.textContent = 'Er moet minstens één oefenvorm aan blijven staan.';
        return;
      }
      savePartSettings({ [part.id]: box.checked });
      const off = Object.entries(next).filter(([, v]) => !v).length;
      status.textContent = off ? `${off} ${off === 1 ? 'oefenvorm staat' : 'oefenvormen staan'} uit op dit toestel.` : 'Alle oefenvormen staan aan.';
    });
    partsList.appendChild(row);
  }

  for (const t of TOOL_TILES) {
    const on = toolEnabled(t.id);
    const row = el(`
      <label class="part-row">
        <input type="checkbox" ${on ? 'checked' : ''} />
        <span class="part-text"><span class="part-label">${t.icon} ${escapeHtml(t.label)}</span></span>
      </label>
    `);
    const box = row.querySelector('input');
    box.addEventListener('change', () => {
      saveToolSettings({ [t.id]: box.checked });
      status.textContent = box.checked ? `${t.label} staat weer in het oefenmenu.` : `${t.label} is verborgen op dit toestel.`;
    });
    toolsList.appendChild(row);
  }
  return card;
}

// Settings: the same two switches that sit in the lesson header, so they can
// also be found (and turned off again) from here.
function renderQuietCard() {
  const card = el(`
    <div class="card">
      <h2>🤫 Stille modus</h2>
      <p class="muted">Voor onderweg. Je zet dit ook midden in een les aan met de twee knopjes boven de vraag; het werkt meteen op de rest van die sessie en blijft aan tot je het weer uitzet.</p>
      <div class="parts-list" id="quiet-list"></div>
      <p class="muted setting-hint">Met luisteren uit krijg je geen luisteroefeningen meer en speelt er niets vanzelf af. De knoppen om zelf een woord af te spelen blijven staan, zodat je met een koptelefoon op verder kunt.</p>
    </div>
  `);
  const list = card.querySelector('#quiet-list');
  const rows = [
    { key: 'noListen', icon: '🎧', label: 'Even niet luisteren', desc: 'Luisteroefeningen worden overgeslagen en niets speelt vanzelf af.' },
    { key: 'noSpeak', icon: '🎤', label: 'Even niet praten', desc: 'De microfoonknoppen en "Zeg het na" verdwijnen.' }
  ];
  for (const r of rows) {
    const on = quietSettings()[r.key];
    const row = el(`
      <label class="part-row">
        <input type="checkbox" ${on ? 'checked' : ''} />
        <span class="part-text">
          <span class="part-label">${r.icon} ${escapeHtml(r.label)}</span>
          <span class="part-desc muted">${escapeHtml(r.desc)}</span>
        </span>
      </label>
    `);
    row.querySelector('input').addEventListener('change', (e) => saveQuietSettings({ [r.key]: e.currentTarget.checked }));
    list.appendChild(row);
  }
  return card;
}

async function renderSettings() {
  app.innerHTML = '';
  app.appendChild(el(`<div><h1>⚙️ Instellingen</h1><p class="muted">Uitspraak en herinneringen gelden voor dit toestel; je weekdoel hoort bij je account en werkt overal.</p></div>`));
  app.appendChild(renderPartsCard());
  app.appendChild(renderQuietCard());
  app.appendChild(renderGoalSettingsCard());
  app.appendChild(renderSpeechCard());
  app.appendChild(renderReminderCard());
  if (navigator.onLine) app.appendChild(renderHaCard());

  const account = el(`
    <div class="card">
      <h2>👤 Account</h2>
      <p class="muted">Ingelogd als <strong>${escapeHtml(state.user.username)}</strong>. Je voortgang staat op de server en wordt op elk toestel waar je inlogt gesynchroniseerd.</p>
      <button type="button" class="secondary" id="logout-btn">🚪 Uitloggen</button>
    </div>
  `);
  account.querySelector('#logout-btn').addEventListener('click', async () => {
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    Storage.clearAuth();
    state.user = null;
    location.hash = '#/login';
  });
  app.appendChild(account);

  const content = Storage.loadContent(state.user.username);
  if (content) {
    const counts = {};
    for (const e of content.exercises) counts[e.type] = (counts[e.type] || 0) + 1;
    app.appendChild(el(`
      <div class="card">
        <h2>ℹ️ Lesinhoud op dit toestel</h2>
        <p class="muted">${content.categories.length} lessen · ${content.exercises.length} oefeningen · ${Object.keys(content.words || {}).length} woorden · opgehaald ${escapeHtml(String(content.generatedAt || '').slice(0, 16).replace('T', ' '))}. Nieuwe inhoud wordt automatisch opgehaald zodra je online bent.</p>
      </div>
    `));
  }
}

// ---------- daily reminder (Web Push) ----------

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// iOS only allows Web Push for a PWA opened from the home screen (16.4+);
// in the Safari tab itself PushManager simply doesn't exist.
function isIosBrowserTab() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  return ios && !standalone;
}

async function currentPushSubscription() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

function renderReminderCard() {
  const card = el(`
    <div class="card reminder-card">
      <h2>🔔 Dagelijkse herinnering</h2>
      <p class="muted">Een melding op dit toestel op een vast tijdstip — alleen op dagen dat je nog niet geoefend hebt, zodat je reeks niet breekt.</p>
      <div id="reminder-body"></div>
    </div>
  `);
  const body = card.querySelector('#reminder-body');

  if (!pushSupported()) {
    body.appendChild(el(`<p class="muted">${isIosBrowserTab()
      ? 'Op iPhone/iPad werken meldingen alleen in de geïnstalleerde app: tik in Safari op Delen → "Zet op beginscherm" en open de app vanaf je beginscherm (iOS 16.4 of nieuwer).'
      : 'Deze browser ondersteunt geen pushmeldingen.'}</p>`));
    return card;
  }
  if (!navigator.onLine) {
    body.appendChild(el(`<p class="muted">Je bent offline; de herinnering instellen kan alleen online.</p>`));
    return card;
  }

  body.appendChild(el(`<p class="muted">Laden…</p>`));
  (async () => {
    let sub = null;
    let status = { subscribed: false, settings: null };
    try {
      sub = await currentPushSubscription();
      if (sub) status = await api(`/push/status?endpoint=${encodeURIComponent(sub.endpoint)}`);
    } catch (err) {
      /* fall through: show the form */
    }
    const active = !!(sub && status.subscribed && status.settings && status.settings.enabled);
    const time = (status.settings && status.settings.reminderTime) || '19:00';
    body.innerHTML = '';
    body.appendChild(el(`
      <div class="reminder-row">
        <label for="reminder-time">Tijdstip</label>
        <input type="time" id="reminder-time" value="${time}" />
        <button type="button" class="${active ? 'secondary' : 'primary'}" id="reminder-toggle">${active ? 'Herinnering uitzetten' : 'Herinnering aanzetten'}</button>
        ${active ? `<button type="button" class="secondary" id="reminder-save">Tijd opslaan</button><button type="button" class="secondary" id="reminder-test">Testmelding</button>` : ''}
      </div>
      <p class="muted reminder-status">${active ? `Aan — dagelijks om ${time} (${escapeHtml(status.settings.timeZone)}).` : Notification.permission === 'denied' ? 'Meldingen zijn voor deze site geblokkeerd; sta ze toe in de browser-/systeeminstellingen.' : 'Uit.'}</p>
    `));
    const statusLine = body.querySelector('.reminder-status');
    const timeInput = body.querySelector('#reminder-time');
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'Europe/Amsterdam';

    async function subscribeNow() {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Geen toestemming voor meldingen gegeven.');
      const reg = await navigator.serviceWorker.ready;
      let s = await reg.pushManager.getSubscription();
      if (!s) {
        const { publicKey } = await api('/push/vapid-public-key');
        s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      }
      await api('/push/subscribe', { method: 'POST', body: { subscription: s.toJSON(), reminderTime: timeInput.value || '19:00', timeZone: tz } });
    }

    body.querySelector('#reminder-toggle').addEventListener('click', async () => {
      statusLine.textContent = 'Bezig…';
      try {
        if (active) {
          const s = await currentPushSubscription();
          if (s) {
            await api('/push/unsubscribe', { method: 'POST', body: { endpoint: s.endpoint } });
            await s.unsubscribe();
          }
        } else {
          await subscribeNow();
        }
        card.replaceWith(renderReminderCard());
      } catch (err) {
        statusLine.textContent = err.message;
      }
    });
    const saveBtn = body.querySelector('#reminder-save');
    if (saveBtn) saveBtn.addEventListener('click', async () => {
      statusLine.textContent = 'Opslaan…';
      try { await subscribeNow(); card.replaceWith(renderReminderCard()); } catch (err) { statusLine.textContent = err.message; }
    });
    const testBtn = body.querySelector('#reminder-test');
    if (testBtn) testBtn.addEventListener('click', async () => {
      statusLine.textContent = 'Testmelding versturen…';
      try {
        const s = await currentPushSubscription();
        await api('/push/test', { method: 'POST', body: { endpoint: s.endpoint } });
        statusLine.textContent = 'Verstuurd — hij verschijnt binnen enkele seconden.';
      } catch (err) { statusLine.textContent = err.message; }
    });
  })();
  return card;
}

