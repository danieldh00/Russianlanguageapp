# Russisch Leren

Webapp om Russisch te leren, met een SQLite-database voor voortgangsregistratie
(spaced repetition per woord) en uitleg bij elke fout: waarom een antwoord fout
is en welke grammaticaregel erachter zit.

## Functionaliteit

- **Accounts**: registratie/login (bcrypt-gehashte wachtwoorden, sessie-cookie).
- **Lessen**: 24 categorieën, Nederlands ↔ Russisch, niveau A1 t/m B1.
  - *Woordenschat*: alfabet & uitspraak, begroetingen, getallen 1-10 en 11-100,
    kleuren, familie, eten & drinken, tijd & dagen van de week, lichaamsdelen,
    kleding, weer, huis & wonen, beroepen, reizen, bijvoeglijke naamwoorden,
    vraagwoorden, veelgebruikte werkwoorden.
  - *Grammatica*: geslacht en meervoud van zelfstandige naamwoorden, alle zes
    naamvallen (nominatief, genitief, datief, accusatief, instrumentalis,
    prepositief), overeenkomst van bijvoeglijke naamwoorden, werkwoordvervoeging
    in de tegenwoordige tijd, verleden en toekomende tijd, het aspectonderscheid
    (voltooid/onvoltooid), ontkenning en vraagzinnen, zacht/hard teken, klemtoon
    (akanje).
  - *Praktische zinnen*: complete, bruikbare zinnen voor echte situaties (de
    weg vragen, bestellen, jezelf voorstellen) die je met woord-chips in de
    juiste volgorde legt — in plaats van losse, willekeurige woordjes.
- **Spaced repetition**: elk woord heeft per gebruiker een `ease_factor`,
  `interval_days` en `next_review_at` (SM-2-achtig algoritme, zie
  `backend/src/srs.js`). Woorden die aan herhaling toe zijn, komen als eerste
  terug in een les.
- **Foutuitleg**: elke oefening bevat een `explanation`-veld dat na het
  antwoorden getoond wordt, en grammaticale oefeningen verwijzen daarnaast naar
  een `grammar_rules`-record met de onderliggende regel en een voorbeeld. Bij
  een fout antwoord kun je optioneel ook een AI om een diepere, op jouw
  specifieke fout toegespitste uitleg vragen (zie hieronder).
- **Gamification**: XP per goed antwoord, niveaus (van Beginner A1 tot
  Zelfstandig gebruiker), een dagelijkse leer-reeks ("streak") en 8 te
  ontgrendelen badges. Het dashboard toont je lessen als een pad: voltooide
  lessen, je huidige les, en de rest — geen harde vergrendeling, je kunt altijd
  zelf een les kiezen.
- **Immersie**: een luisterknop op elke oefening spreekt de Russische tekst
  hardop uit (via de ingebouwde spraaksynthese van de browser, werkt ook
  offline) — handig om de uitspraak te oefenen, niet alleen het schrift.
- **Voortgangsdashboard**: nauwkeurigheid, aantal geoefende/onder-de-knie
  woorden per les, niveau/streak/badges, en overzichten van de vaakst gemaakte
  fouten en recente fouten (met uitleg).

## Techniek

- **Backend**: Node.js + Express, SQLite via `better-sqlite3` (bestandsgebaseerd,
  geen aparte databaseserver nodig).
- **Frontend**: losse HTML/CSS/vanilla JS single-page app (`frontend/`), wordt
  direct door Express geserveerd — geen build-stap nodig. Vormgeving met
  PT Serif (koppen/Russische tekst) en IBM Plex Sans (interface), een eigen
  kleurenpalet met lichte/donkere modus (volgt de systeeminstelling).
- **PWA**: `manifest.webmanifest` + `sw.js` (app-shell caching) maken de app
  installeerbaar op iPhone/iPad en Android — zie hieronder.
- **Offline-first + synchronisatie tussen toestellen**: de app werkt volledig
  zonder internet en houdt je voortgang bij op elk toestel waarop je bent
  ingelogd — zie de sectie hieronder.
- **Data**: `data/russian.sqlite` op de server is de centrale, blijvende
  opslag; wordt automatisch aangemaakt bij eerste start.

## Projectstructuur

```
backend/
  src/
    server.js          Express-app + sessies + static hosting van frontend/
    db.js               SQLite-verbinding + schema-init + migraties
    schema.sql          Databaseschema
    srs.js               Spaced-repetition-planner (server)
    gamification.js       XP/niveau-berekening, leer-reeks, badge-definities
    recordAttempt.js      Gedeelde logica: antwoord verwerken + SRS bijwerken
                           (gebruikt door zowel /exercises/:id/answer als /sync/attempts)
    middleware.js          Auth-middleware
    routes/
      auth.js             Registreren/inloggen/uitloggen
      lessons.js            Lessenoverzicht + voortgang per les
      exercises.js           Oefeningen ophalen + antwoorden verwerken
      progress.js             Statistieken + foutenoverzicht + per-woord SRS-status + gamification
      content.js                Volledige lesinhoud voor offline gebruik
      sync.js                    Offline-wachtrij van antwoorden verwerken
      ai.js                       AI-uitleg via de Claude API (optioneel)
  seed/
    seed.js            Vult de database met lesinhoud
    data/              Woordenschat, grammaticaregels, grammatica-oefeningen, praktische zinnen
frontend/
  index.html, css/            SPA-opmaak en vormgeving
  js/
    app.js                    Router + alle views (login, dashboard, quiz, voortgang, gamification, AI-uitleg)
    storage.js                 Lokale opslag (localStorage), per gebruiker genamespaced
    srs.js                      Spaced-repetition-planner (client, spiegelt backend/src/srs.js)
  manifest.webmanifest        PWA-manifest (naam, iconen, themakleur)
  sw.js                        Service worker (cachet de app-shell)
  icons/                       App-iconen (192/512/maskable/apple-touch/favicon)
data/                  SQLite-bestand (niet in git)
```

## Installatie & lokaal draaien

Vereist: Node.js 18+.

```bash
cd backend
npm install
cp .env.example .env        # pas SESSION_SECRET aan
npm run seed                 # vult de database met lessen (eenmalig, of na content-update)
npm start                    # start op http://localhost:3000
```

Open daarna `http://localhost:3000` in de browser, registreer een account en
begin met een les.

Voor ontwikkeling met automatisch herladen bij bestandswijzigingen:

```bash
npm run dev
```

> **Let op**: `npm run seed` verwijdert en herbouwt alle lesinhoud
> (categorieën, woorden, oefeningen) én de bijbehorende voortgangsgegevens
> (`attempts`, `user_word_progress`). Gebruikersaccounts blijven behouden. Draai
> dit dus alleen bij het eerste opzetten of bewust bij een contentupdate, niet
> als onderdeel van een automatische opstart-/deploy-routine.

## Draaien met Docker

```bash
docker compose up -d --build
docker compose exec app node seed/seed.js   # eenmalig, na de allereerste build
```

De SQLite-data staat in een named volume (`russian-data`) en blijft dus
behouden tussen herstarts en updates van de container.

## Installeren als app op iPhone/iPad

De app is een Progressive Web App (PWA): eenmaal toegevoegd aan het beginscherm
opent hij zonder Safari-balken, met een eigen app-icoon en in de systeemkleur.

1. **De app moet bereikbaar zijn op een adres dat je iPhone/iPad kan openen.**
   `localhost` op je laptop werkt niet vanaf een ander apparaat. Kies een van:
   - Draai de app op een server/NAS/Raspberry Pi in je eigen netwerk (bv. via
     Docker, zie hierboven) en open die op je iPhone terwijl je op hetzelfde
     wifi-netwerk zit — installeren via "Voeg toe aan beginscherm" werkt dan
     ook gewoon over `http://` op een lokaal adres.
   - Wil je de app ook buiten je eigen netwerk (bv. onderweg) kunnen gebruiken,
     zet er dan een reverse proxy met automatisch HTTPS voor, bijvoorbeeld
     [Caddy](https://caddyserver.com/) (één regel: `jouwdomein.nl { reverse_proxy localhost:3000 }`)
     of Traefik, achter een domeinnaam die naar je server wijst.
2. Open de URL in **Safari** op de iPhone/iPad (moet Safari zijn, geen Chrome —
   alleen Safari kan op iOS een PWA installeren).
3. Tik op het deelicoon (vierkant met pijl omhoog) onderin de balk.
4. Kies **"Zet op beginscherm"** ("Add to Home Screen").
5. Het icoon (de blauwe "Я") verschijnt op je beginscherm en opent de app
   voortaan los van Safari, met een eigen statusbalk.

Dit werkt hetzelfde op iPad. Je voortgang staat gewoon in de SQLite-database op
de server, dus die blijft behouden ongeacht op welk apparaat je inlogt.

## Offline gebruik & synchronisatie tussen toestellen

De app is *local-first*: lesinhoud en al je voortgang staan lokaal op het
toestel (in `localStorage`), en oefeningen worden daar ook direct nagekeken —
er is geen netwerk nodig om te leren. Op de achtergrond synchroniseert de app
met de centrale SQLite-database op de server, zodat dezelfde voortgang
beschikbaar is op al je toestellen (bv. verder leren op de iPad waar je op de
iPhone was gebleven).

**Hoe het werkt:**

1. Bij het eerste (online) inloggen op een toestel haalt de app de volledige
   lesinhoud op (`GET /api/content`, inclusief de juiste antwoorden en uitleg
   — nodig om offline te kunnen nakijken) en je bestaande voortgang
   (`GET /api/progress/words`), en slaat dit lokaal op.
2. Vanaf dat moment werkt alles lokaal: een les kiezen, een antwoord nakijken,
   de spaced-repetitionplanning bijwerken — allemaal zonder netwerk.
3. Elk gegeven antwoord komt in een lokale wachtrij ("outbox"). Zodra er weer
   internet is, stuurt de app die wachtrij naar `POST /api/sync/attempts`, dat
   idempotent is (een `clientId` per antwoord voorkomt dubbele verwerking als
   een verzoek wordt herhaald) en vervolgens de nieuwste voortgang weer
   terugleest — zo blijven meerdere toestellen convergeren naar dezelfde staat.
4. De statusindicator naast "Voortgang" in de navigatiebalk toont of alles
   gesynchroniseerd is, hoeveel antwoorden nog in de wachtrij staan, of dat je
   offline bent.

**Bewuste grenzen van dit ontwerp:**

- **Eerste keer per toestel moet online.** Zonder ooit online te zijn geweest
  op een toestel heeft de app nog geen lesinhoud om mee te werken — logisch,
  want die moet ergens vandaan komen. Daarna werkt dat toestel altijd offline.
- **Synchroniseren gebeurt alleen terwijl de app open is.** iOS/Safari staat
  geen achtergrondsynchronisatie toe voor PWA's (de Background Sync API wordt
  niet ondersteund); open de app dus even terwijl je online bent om bij te
  werken, in plaats van te verwachten dat dit vanzelf op de achtergrond
  gebeurt.
- **"Recente fouten" en "vaakst fout beantwoord" op het voortgangsscherm zijn
  per toestel** (ze zijn gebaseerd op een lokaal logboek, niet op de server) —
  gemarkeerd als "(dit toestel)" in de app. De nauwkeurigheid, het aantal
  onder-de-knie woorden en de les-voortgang tellen wél toestel-overstijgend
  correct op, omdat die uit de gesynchroniseerde per-woord-voortgang komen.
- Bij een conflict (bv. hetzelfde woord op twee toestellen geoefend terwijl
  beide een tijd offline waren) verwerkt de server de binnenkomende
  antwoorden gewoon op volgorde van binnenkomst — er is geen "slimme" merge.
  Voor een persoonlijke leerapp met één gebruiker per account is dat in de
  praktijk geen probleem.

## AI-uitleg instellen (optioneel)

De knop "Vraag AI om een diepere uitleg" (getoond bij een fout antwoord) stuurt
de vraag, het juiste antwoord, jouw antwoord en de standaarduitleg naar de
Claude API, en laat die in het Nederlands specifiek uitleggen waarom precies
*jouw* antwoord fout was — nuttiger dan de statische uitleg alleen, vooral bij
subtiele grammaticale fouten.

Dit is volledig optioneel en de rest van de app werkt exact hetzelfde zonder:

```bash
# in backend/.env
ANTHROPIC_API_KEY=sk-ant-...   # verkrijgbaar via https://console.anthropic.com/
```

Zonder deze variabele blijft de knop gewoon verborgen. Let op: elke klik op de
knop is één API-aanroep (Claude Opus 5) op jouw eigen Anthropic-account —
reken op een fractie van een cent per uitleg, maar het is wel een lopende
kostenpost zolang de sleutel actief is.

## Uitbreiden met eigen content

Nieuwe woorden, categorieën of grammaticaregels toevoegen kan zonder de
applicatiecode aan te passen:

- `backend/seed/data/categories.js` — lessen/categorieën
- `backend/seed/data/words.js` — woordenschat (per woord automatisch
  gegenereerde meerkeuzeoefeningen in beide richtingen)
- `backend/seed/data/grammarRules.js` — grammaticaregels met uitleg
- `backend/seed/data/grammarExercises.js` — losse grammatica-oefeningen met
  eigen foutuitleg, gekoppeld aan een regel uit `grammarRules.js`
- `backend/seed/data/practicalSentences.js` — praktische zinnen voor de
  woord-chipoefening (`sentence_build`): elke zin heeft `tokens` (de losse
  woorden, `tokens.join(' ')` moet exact de zin opleveren) en een `explanation`

Na het aanpassen van deze bestanden: `npm run seed` opnieuw draaien.

## API (overzicht)

Alle routes onder `/api`, JSON in/uit, sessie-cookie voor authenticatie.

| Methode | Route | Omschrijving |
|---|---|---|
| POST | `/auth/register` | Account aanmaken en inloggen |
| POST | `/auth/login` | Inloggen |
| POST | `/auth/logout` | Uitloggen |
| GET | `/auth/me` | Huidige gebruiker |
| GET | `/lessons` | Lessenoverzicht met voortgang |
| GET | `/exercises/:slug?limit=10` | Oefeningenbatch voor een les (due-woorden eerst) |
| POST | `/exercises/:id/answer` | Antwoord indienen → correct/fout + uitleg + grammaticaregel |
| GET | `/progress` | Algemene statistieken + voortgang per les |
| GET | `/progress/mistakes` | Vaakst en meest recent gemaakte fouten met uitleg |
| GET | `/progress/words` | Volledige per-woord SRS-status (voor het lokale voortgangs-mirror op een toestel) |
| GET | `/content` | Volledige lesinhoud incl. juiste antwoorden/uitleg (voor offline gebruik op een toestel) |
| POST | `/sync/attempts` | Batch van offline gegeven antwoorden verwerken (idempotent via `clientId`) |
| GET | `/progress/stats` | XP, niveau, leer-reeks ("streak") en badges |
| POST | `/ai/explain` | Diepere AI-uitleg bij één fout antwoord (503 als er geen `ANTHROPIC_API_KEY` is ingesteld) |

## Bekende beperkingen (bewuste keuzes voor deze versie)

- Sessies worden in het geheugen van het Express-proces bijgehouden
  (`express-session` MemoryStore); bij een herstart van de app moet iedereen
  opnieuw inloggen. Voor persoonlijk/kleinschalig gebruik is dit voldoende;
  bij meerdere serverinstanties is een gedeelde sessiestore (bv. Redis) nodig.
- Er is geen wachtwoord-resetflow; wachtwoorden worden wel met bcrypt gehasht.
- De service worker (offline caching van de app-shell) registreert alleen in
  een "secure context": `https://` of `http://localhost`. Draai je de app op
  een lokaal IP-adres over plain `http://` (bv. `http://192.168.1.50:3000`),
  dan werkt "Zet op beginscherm" op iOS gewoon, maar blijft de service worker
  inactief — de app werkt dan prima, alleen zonder offline-caching van de
  statische bestanden. Voor dat laatste is een `https://`-verbinding nodig
  (reverse proxy met certificaat, zie hierboven).
