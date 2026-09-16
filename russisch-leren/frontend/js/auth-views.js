// ---------- auth views ----------

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
      Storage.setAuth(data.user);
      location.hash = '#/dashboard';
    } catch (err) {
      document.getElementById('login-error').textContent = err.isNetworkError
        ? 'Geen internetverbinding. Inloggen kan alleen als je online bent (eenmalig, per toestel).'
        : err.message;
    }
  });
}

function renderRegister() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="card" style="max-width:400px">
      <h1>Account aanmaken</h1>
      <p class="muted">Maak een account om je voortgang op te slaan en te delen tussen je toestellen.</p>
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
      Storage.setAuth(data.user);
      location.hash = '#/dashboard';
    } catch (err) {
      document.getElementById('register-error').textContent = err.isNetworkError
        ? 'Geen internetverbinding. Een account aanmaken kan alleen online.'
        : err.message;
    }
  });
}

// ---------- shared: no local content yet ----------

function renderNoContentMessage() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="card">
      <h1>Nog geen offline gegevens op dit toestel</h1>
      <p class="muted">Deze app werkt offline zodra de lesinhoud eenmaal is opgehaald. Maak één keer verbinding met
      internet terwijl je bent ingelogd — daarna werken alle lessen, ook zonder internet.</p>
    </div>
  `));
}

