# Changelog

Alle merkbare wijzigingen aan de "Russisch Leren" add-on staan hier, nieuwste
versie bovenaan. Dit bestand wordt door Home Assistant Supervisor automatisch
getoond onder de "Changelog"-knop van de add-on.

## 1.2.3

- Fix: "Recente fouten" en "Vaakst fout beantwoord" op de voortgangspagina
  toonden de vraagtekst zoals die was op het moment van antwoorden — dus
  ook na de correctie van de alfabetvragen bleef daar "Wat betekent 'Ы ы'
  (Y y)?" staan. De historie toont nu altijd de actuele vraag, het actuele
  antwoord en de actuele uitleg.

## 1.2.2

- Fix: lessen met een slotje waren gewoon te openen. Het slot wordt nu
  echt afgedwongen: een les opent pas als je in de les ervoor elk woord
  minstens één keer hebt geoefend, en een volgend niveau opent pas na de
  toets van het niveau ervoor (of nadat je alle lessen van dat niveau hebt
  gedaan). Vergrendelde kaarten zijn niet klikbaar en tonen waar je eerst
  mee verder moet; ook rechtstreeks navigeren naar een vergrendelde les of
  toets wordt geweigerd.
- Fix: een les opnieuw doen kon niet ("alles staat al gepland voor een
  latere herhaling"). Een les is nu altijd te herhalen: eerst de woorden
  die aan herhaling toe zijn, dan nieuwe, dan de rest — altijd een
  volledige sessie van 10 vragen.
- Nieuwe woorden komen sneller aan bod: in een sessie krijgt elk nieuw
  woord eerst één oefening voordat een tweede van hetzelfde woord volgt.
- Op de kaarten staat nu "x/y woorden geoefend · z onder de knie", zodat
  je ziet wat er nog nodig is om de volgende les te openen.

## 1.2.1

- Fix: de alfabetles verklapte het antwoord. Bij "Wat betekent 'В в (V v)'?"
  stond de transliteratie al in de vraag, en de antwoordopties bevatten de
  hint "(niet als 'b')". Lettervragen luiden nu "Hoe klinkt de letter 'В в'?"
  en "Welke letter klinkt als 'v' in 'vis'?" — zonder transliteratie; de
  uitleg over de valse vrienden (В lijkt op B) zie je pas ná je antwoord.
- Nieuw: de alfabetles dekt nu alle 33 letters (was 8) en bevat 20
  leesoefeningen ("Hoe schrijf je 'ресторан' in Latijnse letters?") waarbij
  de foute opties precies de klassieke beginnersvallen zijn (pectopah).
- Bestaande oefeningen worden bij een update nu ook inhoudelijk ververst
  (vraagtekst, opties, uitleg) in plaats van bevroren te blijven op de
  eerste versie; je voortgang op die oefeningen blijft gewoon staan.

## 1.2.0

- Nieuw: **niveautoetsen A1 t/m C2**. Elk niveau sluit je af met een toets
  van 30 vragen, willekeurig verdeeld over alle lessen van dat niveau en
  alle oefenvormen. Geslaagd bij 80% of hoger: dan is het niveau officieel
  behaald (+150 XP, badge, zichtbaar in de bovenbalk, op de voortgangspagina
  en in de ranglijst). Na afloop zie je per les hoe je scoorde en bij elke
  fout: jouw antwoord, het juiste antwoord, de uitleg, de grammaticaregel
  erachter en de knop voor een AI-uitleg over jóuw fout.
- Nieuw: **lesmateriaal doorgetrokken tot C2** (moedertaalniveau). Van 32
  naar 125 lessen, van ±230 naar ±1.400 woorden en ±4.800 oefeningen, met
  47 grammaticaregels. Per niveau thematische lessen gericht op je redden in
  een Russischtalig land (gezondheid & apotheek, wonen & huren, documenten &
  bureaucratie, bank, telefoon & internet, werk & sollicitatie, noodgevallen
  & politie, recht & contracten, nieuws & politiek, spreektaal, slang,
  idiomen, spreekwoorden, vakjargon, culturele referenties …) plus de
  grammatica die daarbij hoort (werkwoorden van beweging, aspectparen,
  gebiedende & voorwaardelijke wijs, deelwoorden, gerundium, passief,
  woordvorming, partikels, woordvolgorde, schrijftaal & interpunctie).
- Nieuw: oefenvormen **typen** (vanaf B1 typ je het Russische woord zelf),
  **luisteren** (een zin wordt voorgelezen, jij bouwt 'm na), **lezen**
  (korte tekst met begripsvragen) en automatisch gegenereerde
  **vervoegings- en naamvaldrills**.
- Nieuw: klemtoontekens op elk woord (bv. спа́льня) en frequentie-gebaseerde
  woordenschatpakketten per niveau, op basis van de open datasets Open
  Russian dictionary (CC-BY-SA 4.0) en FrequencyWords/OpenSubtitles (MIT) —
  zie `backend/seed/data/SOURCES.md`.
- Het lessenoverzicht is nu gegroepeerd per niveau (A1 … C2) met een
  voortgangsbalk per niveau, snelkoppelingen bovenaan en de toets als
  laatste stap van elk niveau.
- Antwoorden worden soepeler nagekeken: ё/е, klemtoontekens,
  hoofdletters en leestekens tellen niet mee als fout.
- Bestaande accounts en voortgang blijven volledig behouden; de nieuwe
  inhoud wordt bij de eerste start na de update automatisch toegevoegd.

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
