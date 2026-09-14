# Russisch Leren

Russisch leren van A1 tot C2 (moedertaalniveau) met voortgangsregistratie,
spaced repetition en uitleg bij fouten. 126 lessen, ±1.400 woorden en
±8.000 oefeningen: woordenschat, grammatica, typen, zinnen bouwen, luisteren,
lezen, klemtoon en plaatjes. Elk niveau sluit je af met een toets van 30
vragen (80% om te slagen) die per fout uitlegt wat er misging. Werkt volledig
offline zodra je één keer bent ingelogd (de toetsen en de AI-onderdelen niet),
en synchroniseert je voortgang tussen toestellen (bv. iPhone en iPad).

Naast het lessenpad zitten er losse oefenvormen in: dagelijkse herhaling over
alle lessen heen, je eigen fouten opnieuw, AI-rollenspellen, een koppelspel,
dictee van getallen en tijden, een zakboekje met noodzinnen, de ЙЦУКЕН-
toetsenbordtrainer, twaalf leesverhalen met begripsvragen en een
schrijftrainer voor de Cyrillische letters.

## Installatie

1. Vul bij **Configuration** een `session_secret` in: een lange, willekeurige
   tekenreeks (bv. gegenereerd met `openssl rand -hex 32`). Dit beveiligt de
   inlogsessies van de app — bewaar 'm, wijzig hem niet zomaar achteraf zolang
   je ingelogd wilt blijven.
2. `anthropic_api_key` is optioneel: nodig voor de knop "Vraag AI om een
   diepere uitleg" bij foute antwoorden én voor **Gesprek oefenen** (de
   AI-rollenspellen). Vereist een sleutel van
   [console.anthropic.com](https://console.anthropic.com/); zonder sleutel
   werkt de rest van de app gewoon.
3. Start de add-on. Open de webinterface via de **OPEN WEB UI**-knop, of via
   poort 3000 op het IP-adres van je Home Assistant-instantie.
4. Maak een account aan en begin met een les.

## Dagelijkse herinnering (pushmelding)

Onder ⚙️ Instellingen kun je per toestel een tijdstip instellen; je krijgt
dan een melding op dagen dat je nog niet geoefend hebt. Vereist een
`https://`-adres (zie hieronder). Op iPhone/iPad werkt dit alleen vanuit de
geïnstalleerde app: Safari → Delen → "Zet op beginscherm", en de app vanaf
het beginscherm openen (iOS 16.4 of nieuwer).

## Home Assistant-meldingen en sensor

Onder ⚙️ Instellingen → Home Assistant kies je per leeraccount naar welk
toestel de dagelijkse herinnering gaat (elk toestel met de Companion-app
staat er als `notify.mobile_app_…`; of kies de dashboardmelding). Zet in
de add-on-configuratie `public_url` op het adres waarop je de app opent
(bv. `https://russisch.jouwdomein.nl`), dan opent de melding direct de
app. De add-on publiceert ook `sensor.russisch_leren_<naam>` met het aantal
woorden dat op herhaling wacht, handig voor dashboards en automatiseringen.
Attributen: `streak`, `longest_streak`, `xp`, `level`, `level_title`,
`words_mastered`, `weekly_xp`, `weekly_goal_xp`, `weekly_days`,
`weekly_goal_days`, `weekly_goal_reached`, `streak_freezes`,
`studied_today` en `last_studied`.

## Waar staat wat

Onderin staan vijf tabs. **Lessen** is het pad van A1 tot C2, met bovenaan je
weekdoel en één regel met wat er vandaag klaarstaat. **Oefenen** verzamelt
alles daarnaast: dagelijkse herhaling, je fouten, het AI-rollenspel, getallen
en tijd, leesverhalen, het zakboekje, het koppelspel, de toetsenbordtrainer en
de schrijftrainer. Daarna volgen **Voortgang**, **Ranglijst** en
**Instellingen**.

## Lesonderdelen en stille modus

Onder ⚙️ Instellingen → Lesonderdelen zet je per oefenvorm aan of uit of die
nog in je lessen voorkomt, en verberg je tegels in het oefenmenu (zoals de
schrijftrainer op een telefoon). Dat is een keuze per toestel. Midden in een
les staan twee knopjes boven de vraag: "Even niet luisteren" en "Even niet
praten" — handig in de trein. Luisteroefeningen worden dan overgeslagen en de
microfoonknoppen verdwijnen, meteen voor de rest van die sessie. De
niveautoets blijft altijd alle oefenvormen toetsen.

## Weekdoel en streak-vriezers

Onder ⚙️ Instellingen → Weekdoel stel je in hoeveel XP en hoeveel dagen per
week je wilt halen. Het doel loopt van maandag tot en met zondag en hoort bij
je account, niet bij één toestel. Houd je een volle week je reeks vast, dan
verdien je een vriezer (maximaal twee tegelijk). Mis je daarna één dag, dan
wordt die automatisch opgevangen en blijft je reeks staan; meerdere dagen
achter elkaar missen wordt niet opgevangen.

## Bereikbaar maken van buiten je netwerk

Deze add-on regelt zelf geen HTTPS. Als je 'm ook buiten je thuisnetwerk wilt
gebruiken (nodig voor volledige PWA-installatie op iPhone/iPad, incl. de
service worker), voeg een extra "Public Hostname" toe aan je bestaande
Cloudflare Tunnel-add-on, wijzend naar `localhost:3000`.

## Data

Je voortgang staat in een SQLite-database in de persistente opslag van deze
add-on (`/data`) en blijft dus behouden bij herstarts en updates.
