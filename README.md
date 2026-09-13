# Russisch Leren

Webapp om Russisch te leren, met een SQLite-database voor voortgangsregistratie
(spaced repetition per woord) en uitleg bij elke fout: waarom een antwoord fout
is en welke grammaticaregel erachter zit.

## Functionaliteit

- **Accounts**: registratie/login (bcrypt-gehashte wachtwoorden, sessie-cookie).
- **Lessen**: 126 lessen, Nederlands ↔ Russisch, van **A1 tot en met C2**
  (moedertaalniveau) — ±1.400 woorden, ±8.000 oefeningen en 48
  grammaticaregels. Het dashboard groepeert de lessen per niveau, met een
  voortgangsbalk per niveau en de niveautoets als laatste stap.

  | Niveau | Lessen | Woorden | Waar het over gaat |
  |---|---|---|---|
  | A1 Beginner | 19 | 182 | alfabet, begroeten, getallen, kleuren, familie, eten, tijd, lichaam, kleding, weer, wonen, beroepen, basisgrammatica (geslacht, meervoud, naamvallen, vervoeging) |
  | A2 Elementair | 10 | 47 | reizen, vervoer, sport, natuur, werk & school, gevoelens, verleden/toekomst, aspect, ontkenning & vragen |
  | B1 Drempelniveau | 28 | 329 | *je redden*: gezondheid & apotheek, wonen & huren, documenten & bureaucratie, bank, telefoon & internet, sollicitatie, uit eten, markt, de weg vragen, meningen; werkwoorden van beweging, aspectparen, gebiedende & voorwaardelijke wijs, telwoorden/datum/tijd |
  | B2 Gevorderd | 27 | 325 | nieuws & politiek, milieu, technologie, cultuur, economie, noodgevallen & politie, recht & contracten, idiomen, spreektaal & register, onderwijs; deelwoorden, gerundium, passief, samengestelde zinnen, woordvorming, korte adjectieven |
  | C1 Vergevorderd | 22 | 270 | abstracte begrippen & argumentatie, formeel/academisch register, nuances & synoniemen, spreekwoorden, partikels, slang, media, medisch/carrière/woningmarkt gevorderd; stijl & register, aspectnuances, woordvolgorde & nadruk |
  | C2 Beheersing | 19 | 258 | literaire woordenschat, frazeologie met klassieke bronnen, culturele & historische referenties, humor & woordspeling, vakjargon (juridisch/financieel, IT & systeembeheer), regionale varianten; schrijftaal & interpunctie, aspectmeesterschap, stilistische syntaxis |

  Elk niveau vanaf B1 bevat daarnaast vier frequentie-gebaseerde
  woordenschatpakketten (zelfstandige naamwoorden, werkwoorden, bijvoeglijke
  naamwoorden & bijwoorden), een les "Praktische zinnen", een les "Lezen" en
  automatisch gegenereerde vervoegings- en naamvaldrills.
- **Oefenvormen**: meerkeuze in beide richtingen, losse grammatica-oefeningen,
  **zinnen bouwen** met woord-chips, **typen** (vanaf A1 typ je het Russische
  woord zelf; ё/е, klemtoontekens, hoofdletters en leestekens tellen niet als
  fout), **gatenzinnen** (de voorbeeldzin met het woord weggelaten — je typt
  de vorm die de zin vereist, bv. воду), **luisteren** (een zin wordt
  voorgelezen en jij bouwt 'm na) en **lezen** (korte tekst met
  begripsvragen) en **plaatjes** (bij ±330 concrete woorden: "Welk woord
  hoort bij 🍎?" en omgekeerd "Welk plaatje hoort bij 'яблоко'?" — emoji als
  illustratie, dus offline en licentievrij; `seed/data/pictures.js`). Elk
  woord toont z'n klemtoon (спа́льня) en transliteratie.
- **Vandaag herhalen**: één knop met alle woorden die aan herhaling toe zijn,
  over alle lessen heen (max. 20, meest achterstallige eerst, bij voorkeur
  als typ- of gatenzin).
- **Spreken**: microfoonknop bij typ-/gatenzinoefeningen en in gesprekken
  (Web Speech API, `ru-RU`), en "🎤 Zeg het na" na elk antwoord — de app
  vergelijkt de herkende tekst met het juiste antwoord (exact / bijna /
  anders).
- **📖 Vormen**: na elk antwoord de volledige verbuiging of vervoeging van
  het woord (`GET /api/words/:id/forms`, data uit de Open Russian dictionary;
  online).
- **Gesprek oefenen**: twaalf AI-rollenspellen (apotheek, dokter, hotel,
  restaurant, de weg vragen, politie, huurbaas, bank, sollicitatie, markt,
  kennismaken, simkaart) op een gekozen CEFR-niveau. De AI antwoordt in het
  Russisch in zijn rol (JSON: reply/translation/correction/tip), met
  vertaling op afroep en een Nederlandse correctie na elke beurt. Vereist
  `ANTHROPIC_API_KEY`.
- **Home Assistant-integratie** (als add-on, `homeassistant_api: true`): per
  leeraccount een notify-doel (`notify.mobile_app_…` van de Companion-app of
  de dashboardmelding) voor de dagelijkse herinnering — de koppeling tussen
  app-account en HA-gebruiker/telefoon — en een sensor
  `sensor.russisch_leren_<naam>` (woorden te herhalen; attributen reeks,
  XP, niveau, vandaag geoefend), elke 5 minuten bijgewerkt via de Core API
  (`http://supervisor/core/api`, `SUPERVISOR_TOKEN`). Optie `public_url`
  maakt de melding klikbaar naar de app.
- **Zakboekje**: twaalf situaties met overlevingszinnen (offline, in de
  content-bundel: `seed/data/phrasebook.js`), groot, met uitspraak en
  zoekfunctie.
- **Getallen & tijd**: dictee van prijzen, getallen, tijden, datums en
  telefoonnummers, gegenereerd in de browser met Russische telwoorden
  (geslacht, meervoudsvormen, rangtelwoorden voor datums).
- **Koppelspel**: vijf paren RU↔NL op tijd; goede paren worden als
  antwoorden geregistreerd en tellen mee voor spaced repetition.
- **Toetsenbordtrainer ЙЦУКЕН**: de Russische indeling op het scherm met de
  QWERTY-toets eronder; typ woorden/zinnen uit de lessen na, de volgende
  toets licht op, met tekens/minuut en nauwkeurigheid.
- **Voorbeeldzinnen**: elk woord heeft een eigen zin (Russisch + Nederlands,
  met luisterknop) die na elk antwoord verschijnt — ±1.400 zinnen in
  `seed/data/examples/`, per niveau, zodat je het woord in context en in
  een verbogen vorm ziet.
- **Oefen je fouten**: een ronde van maximaal tien vragen die je op dit
  toestel fout had en nog niet hebt rechtgezet (vaakst gemiste eerst);
  verdwijnt vanzelf zodra alles is rechtgezet.
- **Dagelijkse herinnering** via Web Push: per toestel een tijdstip, alleen
  op dagen dat je nog niet geoefend hebt, met het aantal woorden dat op
  herhaling wacht. VAPID-sleutels worden bij de eerste start aangemaakt in
  `DATA_DIR/vapid.json`; op iOS alleen vanuit de geïnstalleerde PWA
  (16.4+).
- **Niveautoetsen**: elk niveau sluit je af met een toets van 30 vragen,
  evenredig verdeeld over alle lessen van dat niveau en alle oefenvormen,
  waarvan minstens 40% productie (typen, gatenzin, zinnen bouwen).
  Server-side nagekeken; geslaagd bij 80% of hoger. Dan is het niveau
  officieel behaald (+150 XP, badge, 🎓-label in de bovenbalk, de
  voortgangspagina en de ranglijst). De uitslag toont per les hoe je scoorde
  en bij elke fout: jouw antwoord, het juiste antwoord, de uitleg, de
  grammaticaregel erachter en een knop voor een AI-uitleg over precies jóuw
  fout. Toetsen vereisen een internetverbinding; herkansen kan onbeperkt.
- **Spaced repetition**: elk woord heeft per gebruiker een `ease_factor`,
  `interval_days` en `next_review_at` (SM-2-achtig algoritme, zie
  `russisch-leren/backend/src/srs.js`). Woorden die aan herhaling toe zijn, komen als eerste
  terug in een les.
- **Foutuitleg**: elke oefening bevat een `explanation`-veld dat na het
  antwoorden getoond wordt, en grammaticale oefeningen verwijzen daarnaast naar
  een `grammar_rules`-record met de onderliggende regel en een voorbeeld. Bij
  een fout antwoord kun je optioneel ook een AI om een diepere, op jouw
  specifieke fout toegespitste uitleg vragen (zie hieronder).
- **Gamification**: XP per goed antwoord en per behaalde niveautoets,
  XP-niveaus, een dagelijkse leer-reeks ("streak") en 11 te ontgrendelen
  badges (waaronder drie voor behaalde toetsen). Het dashboard toont je lessen als een pad
  met echte vergrendeling: een les opent pas als je in de les ervoor elk woord
  minstens één keer hebt geoefend, en een volgend niveau opent na de toets van
  het niveau ervoor (of nadat je alle lessen van dat niveau hebt gedaan).
  Afgeronde lessen blijven altijd te herhalen.
- **Immersie**: een luisterknop op elke oefening spreekt de Russische tekst
  hardop uit (via de ingebouwde spraaksynthese van de browser, werkt ook
  offline), met een 🐢-knop voor langzaam; snelheid en stem stel je in onder
  ⚙️ Instellingen (samen met de dagelijkse herinnering en uitloggen).
- **Klemtoon**: A1-les "Klemtoon" (regel `STRESS-PLACEMENT`: vrij en
  beweeglijk, ё altijd beklemtoond, klinkerreductie, leenwoorden,
  betekenisverschil за́мок/замо́к) plus een gegenereerde klemtoonoefening
  bij elk woord met bekende klemtoon (type `stress`: kies de juiste
  accentpositie; de enige oefening waar het accentteken zelf telt).
- **Leesverhalen**: twaalf korte verhalen, twee per niveau van A1 tot C2, met
  per alinea een verborgen Nederlandse vertaling, een woordenlijst en een
  luisterknop. Tik op een los woord voor de betekenis; bij een verbogen vorm
  raadt de app het grondwoord op basis van de gedeelde stam en zegt erbij dat
  het een gok is. Elk verhaal sluit af met begripsvragen mét uitleg
  (10 XP + 5 XP per goed antwoord, eenmalig per verhaal — de server kijkt
  of dit verhaal al eens is afgerond). Reist mee in de offline inhoudsbundel.
- **Weekdoel en streak-vriezers**: een doel in XP én dagen per week (maandag
  t/m zondag), zichtbaar als ring en dagbalk boven het lessenpad. Elke volle
  week reeks levert een vriezer op (maximaal twee); één gemiste dag wordt
  daarmee automatisch opgevangen, meerdere dagen achter elkaar niet. Het doel
  hoort bij het account en geldt dus op elk toestel.
- **Schrijftrainer**: trek de Cyrillische drukletters na op een canvas. De
  score combineert nauwkeurigheid (hoeveel van je inkt binnen de letter valt)
  en dekking (hoeveel van de letter je hebt geraakt), berekend uit twee
  maskers, dus zowel krabbelen als één veeg scoort laag. Acht letters per
  ronde: 20 XP, met 10 XP bonus vanaf gemiddeld 80%.
- **Voortgangsdashboard**: nauwkeurigheid, aantal geoefende/onder-de-knie
  woorden per les, niveau/streak/badges, en overzichten van de vaakst gemaakte
  fouten en recente fouten (met uitleg).
- **Ranglijst**: alle geregistreerde gebruikers gerangschikt op XP, met
  hoogst behaalde toetsniveau, XP-niveau, leer-reeks en aantal onder-de-knie
  woorden — handig om onderling een beetje te wedijveren. Vereist een internetverbinding (`GET /api/leaderboard`),
  net als inloggen en registreren.

## Techniek

- **Backend**: Node.js + Express, SQLite via `better-sqlite3` (bestandsgebaseerd,
  geen aparte databaseserver nodig).
- **Frontend**: losse HTML/CSS/vanilla JS single-page app (`russisch-leren/frontend/`), wordt
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

De hele app leeft in `russisch-leren/`, met daarnaast alleen wat nodig is om
dezelfde map ook als Home Assistant Add-on te kunnen installeren
(`repository.yaml` op de repo-root, `config.yaml`/`DOCS.md` in de map zelf) —
zie de sectie daarover hieronder.

```
repository.yaml          Herkenningsbestand: maakt deze repo een HA add-on-repository
russisch-leren/
  config.yaml             HA add-on-configuratie (poort, opties, architecturen)
  DOCS.md                 Documentatie zoals getoond in de HA add-on-store
  Dockerfile              Wordt gebruikt door zowel docker-compose als de HA add-on
  backend/
    src/
      server.js          Express-app + sessies + static hosting van frontend/
      db.js               SQLite-verbinding + schema-init + migraties
      schema.sql          Databaseschema
      srs.js               Spaced-repetition-planner (server)
      gamification.js       XP/niveau-berekening, leer-reeks, badge-definities
      xp.js                  Eén XP-berekening voor voortgang, ranglijst en HA-sensor
      goals.js                Weekdoel (XP/dagen sinds maandag) en streak-vriezers
      ha.js                    Home Assistant: notify-doelen, meldingen en sensor per leerling
      grading.js            Antwoorden normaliseren en vergelijken (ё/е, klemtoon, hoofdletters)
      push.js               Web Push: VAPID-sleutels, dagelijkse herinneringsplanner
      levels.js             CEFR-niveaus A1..C2 met titels en omschrijvingen
      recordAttempt.js      Gedeelde logica: antwoord verwerken + SRS bijwerken
                             (gebruikt door zowel /exercises/:id/answer als /sync/attempts)
      loadAddonOptions.js     Leest /data/options.json wanneer als HA add-on gedraaid
      middleware.js            Auth-middleware
      routes/
        auth.js               Registreren/inloggen/uitloggen
        lessons.js              Lessenoverzicht + voortgang per les
        exercises.js             Oefeningen ophalen + antwoorden verwerken
        progress.js               Statistieken + foutenoverzicht + per-woord SRS-status + gamification
        content.js                  Volledige lesinhoud voor offline gebruik
        sync.js                      Offline-wachtrij van antwoorden verwerken
        ai.js                         AI-uitleg + rollenspel-dialogen via de Claude API (optioneel)
        leaderboard.js                Ranglijst
        exams.js                      Niveautoetsen: samenstellen, nakijken, certificeringen
        push.js                       Push-abonnementen en herinneringsinstellingen per toestel
        words.js                      Vormentabellen per woord (Open Russian)
        ha.js                          Home Assistant-status, meldingsinstellingen en testmelding
    seed/
      seed.js            Vult/actualiseert de database met lesinhoud (toevoegend, bij elke start)
      data/
        index.js         Voegt alle contentmodules samen tot één bundel
        categories.js, words.js, grammarRules.js,
        grammarExercises.js, practicalSentences.js   Basisinhoud A1/A2
        levels/b1.js .. c2.js           Per niveau: lessen, regels, oefeningen, zinnen, leesteksten, drills
        levels/vocab-b1.js .. vocab-c2.js   Frequentie-gebaseerde woordenschatpakketten per niveau
        examples/a.js .. c2.js          Voorbeeldzin per woord ({ 'вода': [ru, nl] })
        pictures.js                     Emoji-plaatje per concreet woord ({ 'яблоко': '🍎' })
        phrasebook.js                   Zakboekje: noodzinnen per situatie
        stories.js                      Twaalf leesverhalen A1..C2 met woordenlijst en begripsvragen
        generated/openrussian-forms.json   Klemtoon + woordvormen uit Open Russian (gegenereerd)
        translit.js      Transliteratie en klemtoon-hulpfuncties
        SOURCES.md       Bronvermelding en licenties van de open datasets
      import/build-openrussian.js   Ontwikkelscript dat generated/ opbouwt uit de open datasets
  frontend/
    index.html, css/            SPA-opmaak en vormgeving
    js/
      app.js                    Router + alle views (login, dashboard per niveau, quiz, toets, voortgang, ranglijst)
      storage.js                 Lokale opslag (localStorage), per gebruiker genamespaced
      srs.js                      Spaced-repetition-planner (client, spiegelt de backend-versie hierboven)
    manifest.webmanifest        PWA-manifest (naam, iconen, themakleur)
    sw.js                        Service worker (cachet de app-shell)
    icons/                       App-iconen (192/512/maskable/apple-touch/favicon)
data/                  SQLite-bestand (niet in git; heet `/data` binnen de HA add-on)
```

## Installatie & lokaal draaien

Vereist: Node.js 18+.

```bash
cd russisch-leren/backend
npm install
cp .env.example .env        # pas SESSION_SECRET aan
npm start                    # start op http://localhost:3000
```

De database wordt bij **elke start** gesynchroniseerd met de lesinhoud in
`seed/data/`: op een lege database is dat de eerste vulling, op een bestaande
worden alleen nieuwe categorieën/woorden/regels/oefeningen toegevoegd
(bestaande behouden hun ID; `attempts` en `user_word_progress` worden nooit
aangeraakt). Geen losse seed-stap nodig, bij geen enkele installatiemethode.

Open daarna `http://localhost:3000` in de browser, registreer een account en
begin met een les.

Voor ontwikkeling met automatisch herladen bij bestandswijzigingen:

```bash
npm run dev
```

`npm run seed` voert dezelfde toevoegende synchronisatie los uit (handig om
een contentwijziging te controleren zonder de server te starten).

## Draaien met Docker

```bash
docker compose up -d --build
```

De database vult zichzelf automatisch bij de eerste start (zie hierboven).
De SQLite-data staat in een named volume (`russian-data`) en blijft dus
behouden tussen herstarts en updates van de container.

## Draaien op een Raspberry Pi naast Home Assistant OS (HAOS)

Deze repository is zelf een geldige **Home Assistant Add-on-repository**
(`repository.yaml` op de root, de add-on zelf in `russisch-leren/` met een
`config.yaml`) — dat is de eenvoudigste manier om 'm op HAOS te draaien, want
het gaat via de normale Add-on Store en heeft geen SSH/Portainer nodig.

**Add-on installeren (aanbevolen)**

1. Instellingen → Add-ons → Add-on Store → ⋮ (rechtsboven) → **Repositories**.
2. Voeg toe: `https://github.com/danieldh00/Russianlanguageapp` (of het pad
   naar jouw fork/branch). Vereist dat deze repository **publiek** leesbaar
   is voor Supervisor — bij een privé-repository moet je 'm tijdelijk publiek
   zetten, of de app zelf handmatig via Optie 2 hieronder draaien.
3. De add-on "Russisch Leren" verschijnt in de store. Installeer 'm — de
   eerste build (compileert `better-sqlite3` voor jouw Pi's architectuur) kan
   een paar minuten duren.
4. Ga naar het tabblad **Configuration** en vul `session_secret` in (een
   lange, willekeurige string, bv. gegenereerd met `openssl rand -hex 32`).
   `anthropic_api_key` is optioneel (voor de AI-uitleg-knop). Sla op.
5. Start de add-on. De 125 lessen worden bij deze allereerste start automatisch
   ingeladen (geen aparte seed-stap nodig), en bij elke update worden nieuwe
   lessen er automatisch bijgezet. Je voortgang staat in de
   persistente `/data`-opslag van de add-on en overleeft dus herstarts en
   updates.

**Optie 2 — gewone Docker-container (als de repo privé moet blijven)**

Installeer de **Portainer**-add-on (Add-on Store, vaak onder "Home Assistant
Community Add-ons") of gebruik de **"Advanced SSH & Web Terminal"**-add-on
met **Protection mode** uit (geeft toegang tot de Docker-daemon van de
host — alleen doen als je weet wat je doet). Kloon dit repository, en draai
vanuit de hoofdmap:

```bash
docker compose up -d --build
```

Dit gebruikt dezelfde `docker-compose.yml`/`Dockerfile` als de add-on, dus
functioneel identiek — alleen buiten Supervisor's add-on-systeem om, wat wél
werkt met een privé-repository.

**Poortconflict controleren.** Deze app luistert standaard op poort 3000 —
hetzelfde als de standaardpoort van Grafana, mocht je die ook draaien. Bij de
add-on-route wijzig je dat via het tabblad **Network** van de add-on; bij
Optie 2 via een `.env`-bestand naast de `docker-compose.yml` (`APP_PORT=3300`).

**Cloudflare Tunnel koppelen.** Als je tunnel via het Cloudflare Zero
Trust-dashboard wordt beheerd (de gebruikelijke opzet): ga naar **Networks →
Tunnels → jouw tunnel → Public Hostname → Add a public hostname**, kies een
subdomein (bv. `russisch.jouwdomein.nl`), Service type **HTTP**, en als URL
`localhost:3000` (of het IP van je Home Assistant-instantie, en de gekozen
poort als je die aangepast hebt). Beheer je `cloudflared` zelf via een
`config.yml` met eigen ingress-regels (zoals de community "Cloudflared"
add-on), voeg daar op dezelfde manier een extra regel toe naast die voor
Home Assistant.

Zodra dat staat, is de app van buiten je netwerk bereikbaar over een echte
HTTPS-verbinding — precies wat nodig is voor volledige PWA-installatie
inclusief de service worker (die alleen in een secure context registreert).

**Resources.** Node.js + SQLite is licht: op een Pi 4 (4 GB+) naast Home
Assistant merk je er niets van. Op een Pi 3 of een al zwaarbelaste Pi 4 kan
het samen met veel HA-integraties/add-ons krap worden — houd dat in de gaten
via de Supervisor-systeemmonitor.

**Bijwerken.** Add-on: Add-on Store → Russisch Leren → **Update** zodra er
een nieuwe versie beschikbaar is (versie-nummer staat in `config.yaml`).
Optie 2: `git pull`, daarna `docker compose up -d --build`.

**Bij elke release: versie + changelog samen bijwerken.** Elke wijziging die
naar de add-on gepusht wordt, hoort twee dingen te bevatten: een opgehoogd
`version`-veld in `russisch-leren/config.yaml` (anders ziet Supervisor geen
update) én een nieuw kopje bovenaan `russisch-leren/CHANGELOG.md` met wat er
veranderd is voor dat versienummer. Supervisor toont dat bestand automatisch
onder de "Changelog"-knop van de add-on — zonder dat kopje zie je in Home
Assistant alleen "er is een update" zonder te weten waaróm.

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
# in russisch-leren/backend/.env
ANTHROPIC_API_KEY=sk-ant-...   # verkrijgbaar via https://console.anthropic.com/
```

Zonder deze variabele blijft de knop gewoon verborgen. Let op: elke klik op de
knop is één API-aanroep (Claude Opus 5) op jouw eigen Anthropic-account —
reken op een fractie van een cent per uitleg, maar het is wel een lopende
kostenpost zolang de sleutel actief is.

## Uitbreiden met eigen content

Nieuwe woorden, lessen of grammaticaregels toevoegen kan zonder de
applicatiecode aan te passen. Alles staat onder
`russisch-leren/backend/seed/data/`:

- A1/A2: `categories.js`, `words.js`, `grammarRules.js`, `grammarExercises.js`,
  `practicalSentences.js`.
- B1 t/m C2: één module per niveau in `levels/<niveau>.js` die
  `{ categories, grammarRules, words, grammarExercises, practicalSentences, readings, drills }`
  exporteert, plus `levels/vocab-<niveau>.js` voor de woordenschatpakketten
  (`{ categories, words }`). `index.js` voegt alles samen en controleert op
  dubbele slugs/codes.

Formaten:

- **Voorbeeldzin**: in `examples/<niveau>.js`, `{ 'вода': ['Можно воду без газа?', 'Mag ik water zonder koolzuur?'] }`
  — gekoppeld op het Russische woord; een woord zonder zin werkt gewoon, alleen zonder het blok "In een zin".
- **Woord**: `{ category, russian, translation_nl, notes?, grammarRule? }`.
  Transliteratie, klemtoon en geslacht worden automatisch aangevuld uit
  `generated/openrussian-forms.json` (zie `SOURCES.md`); per woord ontstaan
  meerkeuzeoefeningen in beide richtingen en vanaf B1 ook een typoefening.
- **Grammatica-oefening**: `{ category, grammarRule, prompt, correctAnswer, options, explanation }`.
- **Praktische zin**: `{ category, prompt, tokens, explanation }` —
  `tokens.join(' ')` moet exact de zin opleveren; hieruit ontstaan een
  zinnen-bouw- én een luisteroefening.
- **Leestekst**: `{ category, title, passage, questions: [{ prompt, correctAnswer, options, explanation, grammarRule? }] }`.
- **Drills**: `{ level, conjugation: { category, rule, maxVerbs }, past, imperative, aspect, cases, comparative }`
  — genereert automatisch vervoegings-/naamvaloefeningen uit de woordvormen
  in `generated/`.

De wijziging komt live bij de eerstvolgende (her)start: de seed is toevoegend
en verwijdert nooit iets, dus een hernoemde les moet je zelf uit de database
halen als je 'm echt kwijt wilt.

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
| POST | `/sync/activities` | XP-activiteiten (toetsenbordronde, dictee, gespreksbeurt, gelezen verhaal, schrijfronde); server bepaalt de XP, dag telt als oefendag |
| GET | `/progress/stats` | XP, niveau, leer-reeks ("streak"), vriezers, weekdoel en badges |
| GET | `/progress/goal` | Weekdoel (XP en dagen sinds maandag) + de toegestane keuzes |
| POST | `/progress/goal` | Weekdoel instellen (`{ weeklyXp, weeklyDays }`; onbekende waarden worden genegeerd) |
| POST | `/ai/explain` | Diepere AI-uitleg bij één fout antwoord (503 als er geen `ANTHROPIC_API_KEY` is ingesteld) |
| GET | `/leaderboard` | Alle gebruikers gerangschikt op XP, met hoogst behaalde toetsniveau, streak en onder-de-knie woorden |
| GET | `/exams` | Status per CEFR-niveau: aantal lessen/vragen, eerdere pogingen, behaald of niet |
| GET | `/exams/:level` | Nieuwe toets van 30 vragen voor een niveau (zonder antwoorden/uitleg) |
| POST | `/exams/:level/submit` | Toets inleveren → score, geslaagd/niet, per-les-uitsplitsing en volledige review met uitleg |
| GET | `/exams/history` | Eerdere toetspogingen van de ingelogde gebruiker |
| GET | `/words/:id/forms` | Verbuiging/vervoeging van een woord (Open Russian) |
| GET | `/ai/scenarios` | Rollenspel-scenario's + of AI geconfigureerd is |
| POST | `/ai/dialogue` | Volgende beurt in een rollenspel (`{ scenario, level, messages }` → `{ reply, translation, correction, tip, finished }`) |
| GET | `/ha/status` | Home Assistant bereikbaar? notify-doelen + instellingen van deze leerling |
| POST | `/ha/settings` | Notify-doel, tijdstip, aan/uit, sensor aan/uit opslaan |
| POST | `/ha/test` | Herinnering nu via Home Assistant versturen |
| GET | `/push/vapid-public-key` | Publieke VAPID-sleutel voor het push-abonnement |
| GET | `/push/status?endpoint=` | Herinneringsinstelling van dit toestel |
| POST | `/push/subscribe` | Abonnement + tijdstip + tijdzone opslaan (per toestel) |
| POST | `/push/unsubscribe` | Herinnering op dit toestel uitzetten |
| POST | `/push/test` | Direct een testmelding sturen |

## Bronnen & licenties van de lesinhoud

De Nederlandse vertalingen, uitleg, leesteksten en zinnen zijn eigen werk.
Klemtoon, woordvormen en de frequentie-gebaseerde woordkeuze per niveau komen
uit twee open datasets: de [Open Russian dictionary](https://github.com/Badestrand/russian-dictionary)
(CC-BY-SA 4.0) en [FrequencyWords](https://github.com/hermitdave/FrequencyWords)
(MIT, afgeleid van OpenSubtitles). Details, wat precies is overgenomen en hoe
je de afgeleide `generated/openrussian-forms.json` opnieuw bouwt staan in
`russisch-leren/backend/seed/data/SOURCES.md`.

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
