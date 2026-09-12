# Changelog

Alle merkbare wijzigingen aan de "Russisch Leren" add-on staan hier, nieuwste
versie bovenaan. Dit bestand wordt door Home Assistant Supervisor automatisch
getoond onder de "Changelog"-knop van de add-on.

## 1.1.5

- Nieuw: dit changelog-bestand zelf — vanaf nu staat bij elke update hier
  te lezen wat er precies veranderd is, in plaats van alleen een kaal
  versienummer in de Add-on Store.

## 1.1.4

- Fix: geïnstalleerde PWA's bleven na een update vastzitten op oude
  JS/CSS totdat je de browsercache handmatig wiste. De cache-versie van
  de service worker wordt nu automatisch afgeleid van een hash van de
  app-bestanden, dus elke deploy die iets wijzigt triggert vanzelf een
  cache-ververs — niemand hoeft dat meer te onthouden.
- De app controleert nu elke 5 minuten (en bij terugkeer naar het
  tabblad) op een nieuwe versie, en herlaadt zichzelf automatisch zodra
  die actief wordt. Voortgang gaat hierbij nooit verloren.

## 1.1.3

- Fix: lesinhoud (woorden, categorieën, grammatica, oefeningen) werd na
  de allereerste installatie nooit meer bijgewerkt, ook niet na een
  update — de database werd alleen gevuld als hij helemaal leeg was.
  Het vullen gebeurt nu bij elke herstart opnieuw, maar dan alleen
  *toevoegend*: bestaande categorieën/woorden behouden hun ID en
  bestaande voortgang/antwoorden worden nooit aangeraakt.

## 1.1.2

- Fix: de "Web UI" openen-knop in Home Assistant werkte niet meer nadat
  1.1.1 per ongeluk het verplichte `[HOST]`/`[PORT]`-patroon uit het
  `webui`-veld had gehaald, waardoor Supervisor de hele add-on niet meer
  kon inladen. Teruggezet naar het correcte formaat.

## 1.1.1

- Nieuw: navigatie verplaatst naar een zwevende, glazen knoppenbalk
  onderin (Lessen, Voortgang, Ranglijst, Uitloggen), zodat de bovenbalk
  niet meer overloopt op smallere telefoons.

## 1.1.0

- Nieuw: **Ranglijst** — vergelijk XP, niveau, leer-reeks en aantal
  onder-de-knie woorden met andere gebruikers.
- Nieuw: 8 extra categorieën (gevoelens, seizoenen & maanden, vervoer,
  sport & hobby's, natuur & dieren, werk & school, vergrotende/
  overtreffende trap, wederkerende werkwoorden) en tientallen nieuwe
  woorden en oefeningen.
- Vormgeving vernieuwd met een "Liquid Glass"-stijl: doorschijnende
  kaarten met achtergrondvervaging, zachte kleurvlekken op de
  achtergrond, pil-vormige knoppen — in zowel licht als donker thema.

## 1.0.1

- Fix: de add-on toonde soms een lege database bij de allereerste start
  omdat de lesinhoud niet automatisch werd geladen.

## 1.0.0

- Eerste release als Home Assistant add-on.
