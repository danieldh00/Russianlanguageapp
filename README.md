# Russisch Leren

Webapp om Russisch te leren, met een SQLite-database voor voortgangsregistratie
(spaced repetition per woord) en uitleg bij elke fout: waarom een antwoord fout
is en welke grammaticaregel erachter zit.

## Functionaliteit

- **Accounts**: registratie/login (bcrypt-gehashte wachtwoorden, sessie-cookie).
- **Lessen**: 23 categorieën, Nederlands ↔ Russisch, niveau A1 t/m B1.
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
- **Spaced repetition**: elk woord heeft per gebruiker een `ease_factor`,
  `interval_days` en `next_review_at` (SM-2-achtig algoritme, zie
  `backend/src/srs.js`). Woorden die aan herhaling toe zijn, komen als eerste
  terug in een les.
- **Foutuitleg**: elke oefening bevat een `explanation`-veld dat na het
  antwoorden getoond wordt, en grammaticale oefeningen verwijzen daarnaast naar
  een `grammar_rules`-record met de onderliggende regel en een voorbeeld.
- **Voortgangsdashboard**: nauwkeurigheid, aantal geoefende/onder-de-knie
  woorden per les, en overzichten van de vaakst gemaakte fouten en recente
  fouten (met uitleg).

## Techniek

- **Backend**: Node.js + Express, SQLite via `better-sqlite3` (bestandsgebaseerd,
  geen aparte databaseserver nodig).
- **Frontend**: losse HTML/CSS/vanilla JS single-page app (`frontend/`), wordt
  direct door Express geserveerd — geen build-stap nodig.
- **Data**: `data/russian.sqlite`, wordt automatisch aangemaakt bij eerste start.

## Projectstructuur

```
backend/
  src/
    server.js        Express-app + sessies + static hosting van frontend/
    db.js             SQLite-verbinding + schema-init
    schema.sql        Databaseschema
    srs.js            Spaced-repetition-planner
    middleware.js      Auth-middleware
    routes/
      auth.js         Registreren/inloggen/uitloggen
      lessons.js        Lessenoverzicht + voortgang per les
      exercises.js      Oefeningen ophalen + antwoorden verwerken
      progress.js       Statistieken + foutenoverzicht
  seed/
    seed.js            Vult de database met lesinhoud
    data/              Woordenschat, grammaticaregels, grammatica-oefeningen
frontend/
  index.html, css/, js/app.js   SPA (login, dashboard, quiz, voortgang)
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

## Uitbreiden met eigen content

Nieuwe woorden, categorieën of grammaticaregels toevoegen kan zonder de
applicatiecode aan te passen:

- `backend/seed/data/categories.js` — lessen/categorieën
- `backend/seed/data/words.js` — woordenschat (per woord automatisch
  gegenereerde meerkeuzeoefeningen in beide richtingen)
- `backend/seed/data/grammarRules.js` — grammaticaregels met uitleg
- `backend/seed/data/grammarExercises.js` — losse grammatica-oefeningen met
  eigen foutuitleg, gekoppeld aan een regel uit `grammarRules.js`

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

## Bekende beperkingen (bewuste keuzes voor deze versie)

- Sessies worden in het geheugen van het Express-proces bijgehouden
  (`express-session` MemoryStore); bij een herstart van de app moet iedereen
  opnieuw inloggen. Voor persoonlijk/kleinschalig gebruik is dit voldoende;
  bij meerdere serverinstanties is een gedeelde sessiestore (bv. Redis) nodig.
- Er is geen wachtwoord-resetflow; wachtwoorden worden wel met bcrypt gehasht.
