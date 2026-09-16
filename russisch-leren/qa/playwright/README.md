# Playwright-regressiesuites

End-to-end-tests die de app in een echte browser bedienen: inloggen, een les
doorlopen, de herhaling, de toetsen, de PWA-updateflow en ingress. Ze zijn
historisch gegroeid — elke suite hoort bij de release waarin die functie werd
toegevoegd — en draaien met de hand, niet in CI.

**Deze map staat bewust buiten `backend/`.** Node's ingebouwde testrunner
(`npm test` in `backend/`, oftewel `node --test`) pikt automatisch elk bestand
op dat `test-*.js` heet of in een map `test`/`tests` staat. Zou dit onder
`backend/` liggen, dan zou `node --test` deze suites willen draaien — ze hebben
een draaiende Chromium en een geseede server nodig en zouden de CI dus breken.
Laat ze hier staan.

## Voorbereiden

```sh
npm install                       # playwright
```

Chromium wordt gezocht op `/opt/pw-browsers/chromium`. Staat die ergens anders,
zet dan `PW_CHROMIUM` naar het juiste pad.

## Backend starten

De tests praten met een draaiende backend op `http://localhost:3000`. Start die
met een eigen `DATA_DIR`, zodat je echte voortgang er buiten blijft (zie ook
`CLAUDE.md`, "Lokaal draaien en testen"):

```sh
export DATA_DIR=/tmp/russisch-leren-test
cd ../../backend
DATA_DIR=$DATA_DIR SESSION_SECRET=testsecret node src/server.js
# seeden duurt ~20 s; wacht op "Sync voltooid"
```

`test-v14.js` en `test-v19.js` openen diezelfde SQLite rechtstreeks, dus
**exporteer `DATA_DIR` ook in de shell waarin je de tests draait** — anders
vallen ze terug op `/tmp/russisch-leren-test` en kijken ze in een lege database.

## Extra harnas

`test-v22.js` (ingress) heeft de Home Assistant-stand-in nodig. Die luistert op
poort 3998 en strippt het `/api/hassio_ingress/<token>/`-prefix precies zoals
Supervisor dat doet:

```sh
node fake-ingress.js &
```

Staat die niet aan, dan crasht die suite met `ERR_CONNECTION_REFUSED` — dat is
het harnas, niet de app. `fake-supervisor.js` doet hetzelfde voor de
Supervisor-API en wordt door de oudere HA-tests gebruikt.

## Draaien

Eén suite:

```sh
node test-v24.js
```

Alles achter elkaar, met de uitvoer in één logbestand:

```sh
./run-regress.sh                  # schrijft regress.log
REGRESS_LOG=regress-1.11.2.log ./run-regress.sh
```

Elke test print regels die met `OK   -` of `FAIL -` beginnen en eindigt vanzelf.
Een suite die crasht blijft hangen op de openstaande browser; stop 'm op PID.
Stop de testserver met `kill $(lsof -ti tcp:3000)` — **nooit met `pkill -f`**,
dat killt in deze omgeving ook je eigen shell.

## Wat waar over gaat

| Suite | Onderwerp |
|---|---|
| `test.js` | Eerste offline-first doorloop (inloggen, les, outbox) |
| `test-bottomnav.js`, `test-ipad.js` | Navigatie en layout op telefoon/iPad |
| `test-features.js`, `test-leaderboard.js` | Gamification, XP, ranglijst |
| `test-sw-update.js` | Service worker: nieuwe versie oppikken |
| `test-v13.js` – `test-v15.js` | Voorbeeldzinnen, cloze/typen, plaatjesoefeningen |
| `test-v16.js`, `test-v17.js` | Instellingen, TTS, klemtoon, zakboekje, dictee |
| `test-v18.js`, `test-v19.js` | Leesverhalen, weekdoel, streak-vriezers, handschrift |
| `test-v20.js`, `test-v21.js` | Lesonderdelen aan/uit, stille modus, oefenmenu |
| `test-v22.js`, `test-v23.js` | Ingress en app-hardening; luisterknop en stille-modus-knopjes |
| `test-v24.js` | Spreiding: nooit twee bijna gelijke vragen achter elkaar |
| `test-exam.js` | Niveautoetsen: samenstelling, nakijken, certificaten |

## Instelbaar via de omgeving

| Variabele | Default | Waarvoor |
|---|---|---|
| `DATA_DIR` | `/tmp/russisch-leren-test` | Map met `russian.sqlite`; moet gelijk zijn aan waarmee de backend draait |
| `PW_CHROMIUM` | `/opt/pw-browsers/chromium` | Pad naar de Chromium die Playwright start |
| `OUT_DIR` | deze map | Waar `test-ipad.js` zijn schermafbeeldingen neerzet |
| `REGRESS_LOG` | `regress.log` | Logbestand van `run-regress.sh` |
