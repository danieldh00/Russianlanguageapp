# Russisch Leren

Russisch leren van A1 tot C2 (moedertaalniveau) met voortgangsregistratie,
spaced repetition en uitleg bij fouten. 125 lessen, ±1.400 woorden en
±4.800 oefeningen: woordenschat, grammatica, typen, zinnen bouwen, luisteren
en lezen. Elk niveau sluit je af met een toets van 30 vragen (80% om te
slagen) die per fout uitlegt wat er misging. Werkt volledig offline zodra
je één keer bent ingelogd (de toetsen zelf niet), en synchroniseert je
voortgang tussen toestellen (bv. iPhone en iPad).

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

Op de voortgangspagina kun je per toestel een tijdstip instellen; je krijgt
dan een melding op dagen dat je nog niet geoefend hebt. Vereist een
`https://`-adres (zie hieronder). Op iPhone/iPad werkt dit alleen vanuit de
geïnstalleerde app: Safari → Delen → "Zet op beginscherm", en de app vanaf
het beginscherm openen (iOS 16.4 of nieuwer).

## Bereikbaar maken van buiten je netwerk

Deze add-on regelt zelf geen HTTPS. Als je 'm ook buiten je thuisnetwerk wilt
gebruiken (nodig voor volledige PWA-installatie op iPhone/iPad, incl. de
service worker), voeg een extra "Public Hostname" toe aan je bestaande
Cloudflare Tunnel-add-on, wijzend naar `localhost:3000`.

## Data

Je voortgang staat in een SQLite-database in de persistente opslag van deze
add-on (`/data`) en blijft dus behouden bij herstarts en updates.
