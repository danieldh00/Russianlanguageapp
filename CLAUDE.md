# Russisch Leren — projectcontext

Dutch↔Russian leer-PWA (A1–C2), uitgeleverd als Home Assistant add-on op een
Raspberry Pi. Draait live op https://russisch.den-hollander.com/.

## Waar staat wat

| Pad | Inhoud |
|---|---|
| `russisch-leren/config.yaml` | HA add-on manifest (versie, poorten, ingress, schema) |
| `russisch-leren/CHANGELOG.md` | Nederlandstalig, nieuwste bovenaan; Supervisor toont dit |
| `russisch-leren/DOCS.md` | Gebruikersdocumentatie in de add-on |
| `russisch-leren/apparmor.txt` | AppArmor-profiel (`russisch_leren`), goed voor +1 veiligheidspunt |
| `russisch-leren/backend/src/` | Express + better-sqlite3; routes in `routes/` |
| `russisch-leren/backend/seed/` | `seed.js` + `data/` (woorden, zinnen, verhalen, per niveau) |
| `russisch-leren/frontend/js/` | Vanilla JS SPA, per feature een eigen bestand (zie hieronder) — geen bundler, geen modules: Ingress heeft statische, relatieve bestanden nodig, dus alles deelt globale scope net als `storage.js`/`srs.js` altijd al deden |
| `russisch-leren/frontend/js/storage.js` | localStorage-laag (`ru:<user>:<key>`) |
| `russisch-leren/qa/playwright/` | Playwright-regressiesuites (buiten `backend/` om `node --test` niet te laten botsen — zie het `README.md` daar) |

**Bestandsindeling `frontend/js/`** (laadvolgorde in `index.html`; dezelfde lijst
staat in `server.js`'s `APP_SHELL_FILES` (voor de PWA-versiehash) en `sw.js`'s
`APP_SHELL` (voor de offline-cache) — **alle drie moeten gelijk blijven** als
er een bestand bijkomt, anders werkt de installeerbare PWA niet meer offline):
`core.js` (state, `api()`/`el()`/`escapeHtml()`, spraak- en
onderdeel-instellingen — gebruikt door vrijwel alles, dus laadt als eerste)
→ `sync.js` (incl. `ensureUser()`), `nav.js` (incl. `router()`),
`auth-views.js`, `dashboard.js`, `tools-menu.js` → de losse oefenvormen
(`speech-input.js`, `dialogue.js`, `keyboard-trainer.js`, `phrasebook.js`,
`dictation.js`, `match-game.js`, `stories.js`, `handwriting.js`) →
`review-mistakes.js`, `exam.js`, `progress.js`, `goals.js`, `settings.js`,
`leaderboard.js` → `app.js` (nu alleen nog de quizmotor: spreiding,
`pickBatch()`, `renderLesson()`/`renderExercise()`/`gradeAndRecord()`).

## Harde regels

- **Nooit secrets in de repo.** `.env` staat in `.gitignore`; `session_secret`
  hoort alleen in de HA add-on-opties.
- **`webui: "http://[HOST]:[PORT:3000]/"` blijft staan** naast ingress — de
  geïnstalleerde PWA op de telefoon kan niet via ingress (pad wisselt per sessie).
- **De seed is additief en idempotent.** Nooit `attempts` of
  `user_word_progress` wissen; `addExerciseIfNew` matcht op bestaande rijen.
- **Elke release bumpt `config.yaml` én krijgt een `CHANGELOG.md`-entry.**
  Changelog in het Nederlands, gericht op wat de gebruiker merkt.
- Geen modelnamen/-ID's in commits, PR's, code-commentaar of andere repo-artefacten.
- Exports die de gebruiker vraagt: **Excel, geen CSV**, tenzij expliciet anders.
- **Nooit `pkill -f`** in deze omgeving: het matcht en killt de eigen shell.
  Stop testservers via `kill $(lsof -ti tcp:3000)`.
- Ontwikkelen en pushen op branch `claude/russian-learning-app-drxyc3`.

## Lokaal draaien en testen

```sh
export DATA_DIR=/tmp/russisch-leren-test
cd russisch-leren/backend
DATA_DIR=$DATA_DIR SESSION_SECRET=testsecret node src/server.js
# seeden duurt ~20 s; wacht op "Sync voltooid"
```

De Playwright-suites staan in `russisch-leren/qa/playwright/` (bewust buiten
`backend/`, zie het `README.md` daar — anders zou `node --test` in `backend/`
ze willen meedraaien). `npm install` daar eenmalig (playwright), dan
`export DATA_DIR=...` in dezelfde shell als de tests (`test-v14.js` en
`test-v19.js` openen die SQLite rechtstreeks) en `node test-vNN.js` per suite,
of `./run-regress.sh` voor de canonieke set naar `regress*.log`. Chromium op
`/opt/pw-browsers/chromium` (env `PW_CHROMIUM` als dat afwijkt). Elke test
print `OK -` / `FAIL -` regels.

`test-v22.js` heeft daarnaast de ingress-stand-in nodig: `node fake-ingress.js`
(poort 3998, strippt het prefix precies zoals Supervisor). Staat die niet aan,
dan crasht die suite met `ERR_CONNECTION_REFUSED` — dat is de harness, niet de
app. Een gecrashte Playwright-test blijft hangen; kill 'm **op PID** (`ps aux`
+ `kill <pid>`), nooit met `pkill -f` (zie hierboven).

`run-regress.sh` draait niet alle suites in de map — een paar oudere
(`test.js`, `test-bottomnav.js`, `test-features.js`, `test-leaderboard.js`)
hebben bevestigde, bestaande gevoeligheid voor willekeurige toetsinhoud en
gegroeide seed-data (stale verwachte tab-count, ranglijst-volgorde, e.d.).
Ook `test-exam.js` zelf faalt af en toe op willekeur (`review wrong count`,
`mc selection highlighted`) — drie keer achter elkaar draaien op identieke
code gaf 2x groen, 1x dezelfde afwijking. Een FAIL daar is dus pas een
regressie als 'm ook met de vorige commit reproduceert.

## Architectuur in het kort

- **Offline-first**: de hele lesinhoud komt als bundel binnen via
  `/api/content`, staat in localStorage (`CONTENT_SCHEMA_VERSION`), en
  antwoorden gaan via een outbox-wachtrij terug. Beoordelen, SRS en XP
  gebeuren client-side; de niveautoetsen juist server-side.
- **SRS**: SM-2-achtig in `backend/src/srs.js` + `user_word_progress.next_review_at`.
- **Oefenvormen**: `mc`, `mc_ru_nl`, `mc_nl_ru`, `sentence_build`, `typing`,
  `cloze`, `listen`, `reading`, `picture`, `picture_choice`, `stress`.
- **Sessies bouwen**: `pickBatch()` voor lessen (in `app.js`),
  `renderReviewSession()` voor dagelijkse herhaling en `renderMistakesPractice()`
  voor fouten (beide in `review-mistakes.js`). Alle drie gaan door
  `roundRobinByWord()` (spreiding bij het kiezen, `app.js`) en `spreadRelated()`
  (spreiding bij het ordenen, ook `app.js`), zodat twee vragen over hetzelfde
  woord minstens `MIN_RELATED_GAP` (3) uit elkaar staan. De toetsen doen
  hetzelfde server-side via `backend/src/spacing.js` — **die twee
  implementaties moeten gelijk blijven.**
- **HA-integratie**: `homeassistant_api: true` → Core API via
  `http://supervisor/core/api` met `SUPERVISOR_TOKEN`; publiceert
  `sensor.russisch_leren_<naam>`.
- **Ingress**: Supervisor strippt het `/api/hassio_ingress/<token>/`-prefix en
  stuurt géén `X-Ingress-Path`. `APP_BASE` (in `core.js`) wordt daarom
  client-side afgeleid uit `document.currentScript.src` — de regex daar
  verwijst naar `core.js`'s eigen bestandsnaam, dus moet mee als dat bestand
  ooit een andere naam krijgt. Alle fetches gaan via `api()` (ook `core.js`).
- **Veiligheidsscore 8/8** — dat is het maximum: het laatste punt is voor
  gesigneerde images en dat zit in Supervisor hard uitgeschakeld.

## Valkuilen die al een keer geld hebben gekost

- `el()` geeft alleen het **eerste** element terug — wikkel templates met
  meerdere roots in één `<div>`.
- Playwright ziet `<option>`-elementen nooit als "visible"; gebruik
  `waitForFunction` op `querySelectorAll(...).length`.
- 37 prompts horen bij meerdere oefeningen met verschillende antwoorden
  (alleen al 71 keer "Luister naar de zin en kies de juiste betekenis.").
  Identificeer een vraag in tests dus via de getoonde opties, niet via de prompt.
- De stille modus zet de laatst overgebleven lesonderdeel-schakelaar terug; in
  tests daarom `.click()` en niet `.uncheck()`.
- Het combining klemtoonteken `́` moet in `CYRILLIC_RUN` zitten, anders
  breekt 'де́вять' af tot 'де'.
- Google Fonts-requests falen in de sandbox; filter die uit assertions.
- Auto-update staat aan; de Supervisor-store ververst elke 3 uur op :32.
