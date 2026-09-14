# Changelog

Alle merkbare wijzigingen aan de "Russisch Leren" add-on staan hier, nieuwste
versie bovenaan. Dit bestand wordt door Home Assistant Supervisor automatisch
getoond onder de "Changelog"-knop van de add-on.

## 1.11.1

- **Opgelost: de luisterknop verklapte het antwoord.** Bij 1812 meerkeuze-
  vragen las de knop naast de vraag het juiste antwoord voor — bij "Welke
  letter klinkt als 'v' in 'vis'?" hoorde je gewoon «В в». De knop leest nu
  alleen nog Russisch voor dat al in de vraag staat, en bij klemtoonvragen
  zwijgt hij helemaal, want daar ís het horen het antwoord. Staat er geen
  Russisch in de vraag, dan is er ook geen knop meer.
- Nieuw op zijn plaats: **nadat je hebt geantwoord** verschijnt "🔊 Hoor het
  antwoord" in de uitleg, zodat je het juiste Russisch alsnog hoort — nu
  zonder iets weg te geven.
- **Opgelost: een luisterknop die zwijgt zegt nu waaróm.** Blijft het stil,
  dan verschijnt er onder de knop een korte uitleg: geen Russische stem op
  dit toestel (met het pad in de iOS-instellingen), helemaal geen stemmen
  geïnstalleerd, of controleer het schakelaartje voor stil en het volume.
  Op een iPhone zonder Russische stem blijft iOS namelijk volledig stil in
  plaats van naar een andere taal terug te vallen.
- De knopjes **"Even niet luisteren"** en **"Even niet praten"** staan niet
  meer boven élke vraag. Ze verschijnen alleen bij een vraag die zelf geluid
  maakt (luisteren, klemtoon) of waar je in de microfoon kunt antwoorden — en
  natuurlijk zolang je ze aan hebt staan, zodat je ze altijd weer uit kunt
  zetten. Alle twee blijven ook gewoon onder Instellingen → Stille modus
  staan.

## 1.11.0

Beveiliging. De veiligheidsscore die Home Assistant aan deze add-on geeft
gaat van 5 naar 8 — de hoogst haalbare waarde, want ondertekening van
images is in Supervisor uitgeschakeld en levert niemand meer punten op.

- **AppArmor-profiel** (+1). De add-on draait nu onder een eigen profiel dat
  mounts, ptrace, het laden van kernelmodules en schrijven naar `/proc/sys`
  en `/sys` verbiedt. Gewone bestands- en netwerktoegang blijft ongemoeid.
- **Ingress** (+2). Je kunt de app voortaan ook vanuit Home Assistant zelf
  openen, achter de HA-login, zonder dat er een poort aan te pas komt. De
  gewone toegang via poort 3000 en je eigen adres blijft precies zoals hij
  was: dát is de weg die de geïnstalleerde app op je telefoon gebruikt, met
  offline ondersteuning. Onder Ingress werkt de offline modus niet, omdat het
  adres daar elke sessie verandert.
- Verder aangescherpt, los van de score:
  - Beveiligingsheaders op elke respons, waaronder een Content Security
    Policy die alleen scripts van de app zelf toestaat en inbedding door
    andere sites blokkeert.
  - De sessiecookie is nu `httpOnly` met `SameSite=Lax`, en krijgt de
    `Secure`-vlag zodra je via https binnenkomt — zonder dat
    `http://<pi>:3000` op je eigen netwerk stukgaat.
  - Sessies staan in de database in plaats van in het geheugen. Je blijft
    dus ingelogd na een herstart of update van de add-on, en de
    waarschuwing over `MemoryStore` in het logboek is weg.
  - Bij inloggen krijg je een nieuw sessie-id, zodat een van tevoren
    geplaatste cookie nooit een ingelogde cookie kan worden.
  - Een rem op inloggen: tien mislukte pogingen per kwartier per IP-adres én
    per gebruikersnaam. Geslaagde pogingen tellen niet mee. Een onbekende
    gebruikersnaam en een fout wachtwoord geven dezelfde melding en kosten
    evenveel tijd, zodat niet te achterhalen is welke namen bestaan.

## 1.10.0

- De oefenvormen hebben een **eigen tab** gekregen: ✨ Oefenen, naast Lessen.
  Daar staan ze gegroepeerd per soort — elke dag (herhalen, je fouten),
  luisteren & spreken, lezen & woorden, typen & schrijven. Het lessenscherm
  toont nu alleen nog het pad zelf, met bovenin één regel met wat er vandaag
  klaarstaat: herhalen, je fouten en een knop naar het oefenmenu. De eerste
  les staat daardoor weer meteen in beeld in plaats van acht tegels lager.
- Het weekdoel op het lessenscherm is compacter: kleinere ring en de
  vriezers als klein ❄-teken naast de dagenbalk. Hoeveel vriezers je hebt
  staat nu ook bij Instellingen → Weekdoel, waar je het doel instelt.

## 1.9.0

- Nieuw: **Lesonderdelen aan- en uitzetten** (Instellingen → Lesonderdelen).
  Per oefenvorm — meerkeuze, typen, gatenzinnen, zinnen bouwen, luisteren,
  lezen, plaatjes, klemtoon — bepaal je of die nog in je lessen voorkomt.
  Daaronder zet je de tegels op het lessenscherm aan of uit, zoals de
  schrijftrainer, die op een telefoon nu eenmaal niet te doen is. Deze
  keuzes gelden per toestel, zodat je op je telefoon iets anders kunt
  uitzetten dan op je tablet. "Vandaag herhalen" en "Oefen je fouten"
  blijven altijd staan, er moet minstens één oefenvorm aan blijven, en de
  niveautoets blijft alle vormen toetsen.
- Nieuw: **Stille modus** met twee knopjes boven elke oefenvraag: "Even niet
  luisteren" en "Even niet praten". Luisteroefeningen worden dan
  overgeslagen en er speelt niets meer vanzelf af; de microfoonknoppen en
  "Zeg het na" verdwijnen. Het werkt meteen op de rest van de sessie die je
  al bezig bent, en blijft aan tot je het weer uitzet — ook via
  Instellingen → Stille modus. De knoppen om zelf een woord af te spelen
  blijven staan, zodat je met een koptelefoon op verder kunt.
- Als een les of herhaalronde door die keuzes helemaal leeg zou zijn, zegt
  het scherm welke vormen uitstaan en verwijst het naar de instellingen, in
  plaats van je met een lege les achter te laten.

## 1.8.0

- Nieuw: **Leesverhalen** (Lessen → Leesverhalen). Twaalf korte verhalen,
  twee per niveau van A1 tot C2, die meegroeien met je Russisch: van een
  simpele voorstelling tot een literaire terugkeer naar het ouderlijk huis
  en een essay over taal en macht. Tik op een zin voor de Nederlandse
  vertaling, op een los woord voor de betekenis (met een gok naar het
  grondwoord bij verbogen vormen), of laat het hele verhaal voorlezen.
  Elk verhaal sluit af met begripsvragen mét uitleg; een verhaal levert
  10 XP op plus 5 XP per goed antwoord, eenmalig — herlezen mag altijd,
  maar levert geen XP meer op. Werkt volledig offline.
- Nieuw: **Weekdoel met streak-vriezers** (Instellingen → Weekdoel). Kies
  hoeveel XP en hoeveel dagen per week je wilt halen (250 tot 2000 XP,
  3 tot 7 dagen). Bovenaan het lessenscherm staat een ring met je
  voortgang en een balk met de zeven dagen van deze week. Elke volle week
  op rij levert een vriezer op; mis je daarna een dag, dan vangt de
  vriezer die automatisch op en blijft je reeks staan. Meerdere dagen
  achter elkaar missen wordt niet opgevangen. Het weekdoel hoort bij je
  account en geldt dus op al je toestellen.
- Nieuw: **Schrijven met de hand** (Lessen → Schrijven met de hand). Trek
  de Cyrillische drukletters na op het scherm met vinger of muis. De app
  kijkt na of je binnen de vorm blijft én of je de hele letter hebt
  geraakt, en geeft een percentage terug. Een ronde van acht letters
  levert 20 XP op, met 10 XP bonus vanaf gemiddeld 80%.
- De Home Assistant-sensor heeft er attributen bij gekregen: `weekly_xp`,
  `weekly_goal_xp`, `weekly_days`, `weekly_goal_days`,
  `weekly_goal_reached` en `streak_freezes`. De dagelijkse
  HA-herinnering vermeldt hoeveel XP je nog van je weekdoel af zit.

## 1.7.2

- XP voor activiteiten die geen oefenvraag zijn: een ronde
  toetsenbordtrainer levert 20 XP op (+10 bij ≥95% nauwkeurig, +10 bij
  ≥120 tekens/min), elk goed dictee-antwoord 5 XP, elke beurt in een
  gesprek 5 XP. Deze activiteiten tellen nu ook als oefendag voor je
  reeks, en tellen mee in de ranglijst en de Home Assistant-sensor. Werkt
  ook offline (wordt gesynchroniseerd zodra je online bent).

## 1.7.1

- Russische tekst staat nu overal in het normale (schreefloze) lettertype —
  in oefeningen, antwoordknoppen, chips, voorbeeldzinnen, het zakboekje,
  de chat en de toetsenbordtrainer — zodat de lettervormen overeenkomen
  met die van het toetsenbord op je telefoon. Alleen de paginakoppen
  blijven in het sierlettertype.

## 1.7.0

- Nieuw: **Home Assistant-integratie** (Instellingen → Home Assistant).
  Per leeraccount kies je naar welk Home Assistant-doel de dagelijkse
  herinnering gaat: een telefoon/tablet met de Companion-app
  (`notify.mobile_app_…`) — dát is de koppeling tussen dit account en jouw
  HA-gebruiker — of de dashboardmelding. De melding bevat het aantal woorden
  te herhalen en opent de app (stel `public_url` in bij de add-on-opties).
  Daarnaast een sensor per leerling, `sensor.russisch_leren_<naam>`: status
  = woorden te herhalen, met reeks, XP, niveau en "vandaag geoefend" als
  attributen, elke 5 minuten bijgewerkt — voor dashboards en
  automatiseringen. Hiervoor heeft de add-on nu `homeassistant_api: true`.
- Nieuw: **📕 Zakboekje** — twaalf situaties (basis, noodgeval, apotheek,
  dokter, restaurant, hotel, vervoer, winkel, geld & telefoon, politie &
  documenten, wonen, kennismaken) met de zinnen die je ter plekke nodig
  hebt, groot, met uitspraak (ook langzaam) en zoekfunctie. Werkt offline.
- Nieuw: **🔢 Getallen & tijd** — dictee: je hoort prijzen, getallen,
  tijden, datums of telefoonnummers in het Russisch en typt wat je hoort.
- Nieuw: **🃏 Koppelspel** — vijf Russische en vijf Nederlandse woorden,
  tik de paren, met tijd en persoonlijk record; goede paren tellen mee voor
  je herhaling.
- Voortgangspagina: "Voortgang per les" toont alleen nog lessen waar je aan
  begonnen bent (plus hoeveel er nog ongestart zijn).

## 1.6.0

- Nieuw: **⚙️ Instellingen** als vierde tab onderin (in plaats van
  Uitloggen, dat daar nu in zit): uitspraak, dagelijkse herinnering en
  account. De herinneringsinstellingen zijn van de voortgangspagina hierheen
  verhuisd.
- Nieuw: **uitspraak instelbaar**. Elke luisterknop heeft er een 🐢 naast
  voor langzaam afspelen; in Instellingen kies je de normale en de langzame
  snelheid (met testknoppen) en de Russische stem. Op iPhone/iPad kun je
  een veel betere stem downloaden (Toegankelijkheid → Gesproken materiaal →
  Stemmen → Russisch → Milena uitgebreid); die verschijnt dan in de lijst.
- Nieuw: **Klemtoon** — tweede les van A1, direct na het alfabet: waar de
  klemtoon ligt, hoe je hem hoort, en waarom hij de klank van de andere
  klinkers verandert (молоко́ → malakó), met de houvasten (ё altijd
  beklemtoond, leenwoorden, verleden tijd vrouwelijk, за́мок/замо́к).
- Nieuw: **klemtoonoefening bij elk woord** ("Waar ligt de klemtoon in
  'молоко'?" — kies moло́ко / молоко́ …), ruim 1.000 stuks, en na je
  antwoord hoor je het woord langzaam. Alleen bij deze oefening telt het
  accentteken zelf als antwoord.

## 1.5.0

- Nieuw: **plaatjesoefeningen** zoals bij Duolingo. Bij ±330 concrete
  woorden (eten, dieren, kleding, vervoer, weer, gevoelens, beroepen,
  lichaam, huis, werk, gezondheid, verkeer …) krijg je "Welk woord hoort bij
  het plaatje? 🍎" met Russische woorden als keuze, en omgekeerd "Welk
  plaatje hoort bij 'яблоко'?" met vier plaatjes. De plaatjes zijn emoji:
  op iPhone/iPad Apple's eigen illustraties, offline en zonder licentie.
  Ze doen ook mee in de toetsen.

## 1.4.0

- Nieuw: **Vandaag herhalen** — één knop op het dashboard met alle woorden
  die aan herhaling toe zijn, uit al je lessen samen (max. 20 per ronde,
  meest achterstallige eerst, bij voorkeur als typ- of gatenzin). Dít is
  wat spaced repetition laat werken.
- Nieuw: **actieve productie vanaf A1**: bij elk woord nu ook een
  typoefening én een **gatenzin** uit de voorbeeldzin (*Один билет, ___.*),
  waarbij je de vorm intypt die de zin vereist (воду, читаю…). +1.238
  gatenzinnen, +216 typoefeningen op A1/A2. Op iPhone heb je hiervoor het
  Russische toetsenbord nodig (Instellingen → Algemeen → Toetsenbord).
- Nieuw: **Gesprek oefenen** — twaalf AI-rollenspellen (apotheek, dokter,
  hotel, restaurant, de weg vragen, politie-aangifte, huurbaas, bank,
  sollicitatie, markt, kennismaken, simkaart). De AI speelt de andere kant
  in het Russisch op jouw niveau, met vertaling op afroep, een correctie in
  het Nederlands na elke beurt en een tip wat je kunt zeggen. Vereist de
  add-on-optie `anthropic_api_key`.
- Nieuw: **spreken** — microfoonknop bij elke typ-/gatenzinoefening en in
  het gesprek (spraakherkenning van de browser, Russisch), en na elk
  antwoord "🎤 Zeg het na": de app vergelijkt wat het verstond met het
  juiste antwoord.
- Nieuw: **📖 Vormen** na elk antwoord: de volledige verbuiging
  (naamvallen enkel-/meervoud) of vervoeging (personen, verleden tijd,
  gebiedende wijs, aspectpartner) van het woord, uit de Open Russian
  dictionary. Alleen online.
- Nieuw: **Toetsenbordtrainer ЙЦУКЕН** — de Russische indeling op het
  scherm met de QWERTY-toets eronder; typ woorden en zinnen uit de lessen
  na, de volgende toets licht op, met tekens/minuut en nauwkeurigheid.
- Toetsen strenger: minstens 40% van de vragen is nu productie (typen,
  gatenzin, zinnen bouwen) in plaats van meerkeuze. Slaaggrens blijft 80%.

## 1.3.0

- Nieuw: **dagelijkse herinnering** via pushmelding. Op de voortgangspagina
  kies je een tijdstip; je krijgt op dat moment een melding op dit toestel,
  maar alleen op dagen dat je nog niet geoefend hebt (met het aantal woorden
  dat op herhaling wacht). Inclusief testknop. Op iPhone/iPad werkt dit
  alleen in de geïnstalleerde app ("Zet op beginscherm", iOS 16.4+). De
  sleutels hiervoor worden bij de eerste start aangemaakt en in de
  persistente opslag van de add-on bewaard.
- Nieuw: **elk woord in een voorbeeldzin**. Na elk antwoord zie je het woord
  in een echte zin (Russisch + Nederlands) met een eigen luisterknop —
  ±1.400 zinnen, geschreven per woord, zodat je context en naamvalsvormen
  meekrijgt. Ook in de toetsreview.
- Nieuw: **"Oefen je fouten"** — een ronde van maximaal tien vragen die je
  op dit toestel fout had en nog niet hebt rechtgezet, de vaakst gemiste
  eerst. Kaart op het dashboard en knop op de voortgangspagina; verdwijnt
  vanzelf als alles is rechtgezet.

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
