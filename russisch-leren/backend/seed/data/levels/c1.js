// C1 (effectieve operationele vaardigheid): vloeiend en genuanceerd Russisch
// voor werk, studie en maatschappelijke discussie -- abstracte begrippen,
// formeel en academisch register, synoniemen en hun nuances, partikels,
// spreekwoorden, slang, aspectnuances, woordvolgorde en gevorderde telwoorden.

const categories = [
  { slug: 'c1-abstract-argumentatie', name: 'Abstracte begrippen & argumentatie', description: 'Oorzaak en gevolg, tegenstrijdigheid, criteria, tendensen — de woorden om een betoog te bouwen.', level: 'C1', sort_order: 100 },
  { slug: 'c1-formeel-academisch', name: 'Formeel & academisch register', description: 'Ambtelijke en wetenschappelijke formuleringen: в соответствии с, вследствие, осуществлять, являться, подлежать.', level: 'C1', sort_order: 101 },
  { slug: 'c1-synoniemen', name: 'Nuances & synoniemen', description: 'Zeggen, kijken, denken, lopen — vijf manieren en wanneer je welke kiest.', level: 'C1', sort_order: 102 },
  { slug: 'c1-spreekwoorden', name: 'Spreekwoorden & gezegden', description: 'De пословицы die iedere Rus kent en in gesprekken aanhaalt.', level: 'C1', sort_order: 103 },
  { slug: 'c1-partikels', name: 'Partikels & modale woorden', description: 'же, ведь, -то, разве, неужели, всё-таки, вроде, якобы — de kleine woorden die de toon bepalen.', level: 'C1', sort_order: 104 },
  { slug: 'c1-slang', name: 'Slang & jongerentaal', description: 'Wat je op straat, in chats en onder vrienden hoort — en wanneer je het beter niet gebruikt.', level: 'C1', sort_order: 105 },
  { slug: 'c1-media-maatschappij', name: 'Media & maatschappelijk debat', description: 'Pers, propaganda, publieke opinie, onthullingen, nepnieuws.', level: 'C1', sort_order: 106 },
  { slug: 'c1-gezondheid-gevorderd', name: 'Gezondheid gevorderd & medisch', description: 'Diagnose, onderzoek, chronische aandoeningen, vaccinatie, contra-indicaties, ziekenhuisopname.', level: 'C1', sort_order: 107 },
  { slug: 'c1-werk-carriere', name: 'Werk & carrière gevorderd', description: 'Promotie, kwalificaties, reorganisatie, bevoegdheden, rapportage, burn-out.', level: 'C1', sort_order: 108 },
  { slug: 'c1-wonen-samenleving', name: 'Woningmarkt & bureaucratie gevorderd', description: 'Hypotheek, nieuwbouw, inschrijving, woningcorporatie, toeslagen en uitkeringen.', level: 'C1', sort_order: 109 },
  { slug: 'c1-grammatica-register', name: 'Grammatica: stijl & register', description: 'Formeel, neutraal en informeel Russisch: aanspreekvormen, отчество, brieven en ambtelijke taal.', level: 'C1', sort_order: 110 },
  { slug: 'c1-grammatica-aspect-nuance', name: 'Grammatica: aspectnuances', description: 'Het aspect als betekenisinstrument: teniet gedaan resultaat, ontkende verzoeken, herhaling, algemeen feit.', level: 'C1', sort_order: 111 },
  { slug: 'c1-grammatica-woordvolgorde', name: 'Grammatica: woordvolgorde & nadruk', description: 'Thema en rhema, nadruk door volgorde, inversie en de plaats van partikels.', level: 'C1', sort_order: 112 },
  { slug: 'c1-grammatica-telwoorden', name: 'Grammatica: telwoorden gevorderd', description: 'Verzameltelwoorden (двое, трое, оба), verbuiging van telwoorden, breuken, procenten, jaartallen.', level: 'C1', sort_order: 113 },
  { slug: 'c1-grammatica-vervoeging', name: 'Grammatica: vervoegingsdrills C1', description: 'Automatisch gegenereerde drills met C1-werkwoorden: vervoeging, verleden tijd, aspectpartners.', level: 'C1', sort_order: 114 },
  { slug: 'c1-grammatica-naamvallen', name: 'Grammatica: naamval- en vergelijkingsdrills C1', description: 'Automatisch gegenereerde drills met C1-zelfstandige en bijvoeglijke naamwoorden.', level: 'C1', sort_order: 115 },
  { slug: 'c1-praktische-zinnen', name: 'Praktische zinnen C1', description: 'Genuanceerd argumenteren, diplomatiek weigeren, formeel corresponderen — bouwen én luisteren.', level: 'C1', sort_order: 116 },
  { slug: 'c1-lezen', name: 'Lezen C1', description: 'Een opiniestuk, een populair-wetenschappelijke tekst en een literair fragment, met vragen over impliciete betekenis.', level: 'C1', sort_order: 117 }
];

const grammarRules = [
  {
    code: 'REGISTER-STYLE',
    title: 'Stijl en register: formeel, neutraal, informeel',
    explanation:
      "Het Russisch onderscheidt scherp tussen registers. Aanspreken: ты + voornaam (informeel, vrienden, familie, kinderen), вы + voornaam (collega's van gelijke rang, jongeren onderling beleefd), Вы + voornaam en vadersnaam (отчество: Иван Петрович) voor ouderen, meerderen, ambtenaren, artsen en in zaken. Overstappen op ты gebeurt op voorstel van de oudere/hogere: Давайте на ты. Formele brieven: Уважаемый Иван Петрович! ... С уважением, [naam]. Ambtelijke taal (канцелярит) gebruikt zelfstandige naamwoorden in plaats van werkwoorden (осуществить проверку i.p.v. проверить), voorzetselconstructies (в связи с, в целях, по причине, в соответствии с) en passieven. Neutraal spreek-Russisch gebruikt korte zinnen, actieve werkwoorden en partikels. Wat in het Nederlands 'gewoon vriendelijk' is, kan in het Russisch als te informeel of juist stijf overkomen: lees het register van je gesprekspartner en spiegel het.",
    example: 'Informeel: Привет, Саш! Есть минутка? / Neutraal: Здравствуйте, Саша, у вас есть минута? / Formeel: Добрый день, Александр Иванович. Не могли бы Вы уделить мне несколько минут?'
  },
  {
    code: 'PARTICLES',
    title: 'Partikels: же, ведь, -то, разве, неужели, всё-таки',
    explanation:
      "Partikels dragen geen eigen betekenis maar sturen de toon en de verwachting. же benadrukt of drukt ongeduld/vanzelfsprekendheid uit: Я же говорил! (ik zei het toch!), Что же делать? (wat nu?); na ты/вы werkt het als 'toch': Ты же знаешь. ведь = 'immers/toch', doet een beroep op gedeelde kennis: Ведь это правда. -то (aan het woord vast) haalt het woord naar voren als bekend onderwerp: Книгу-то ты прочитал? (dat boek, heb je dat nou gelezen?). разве en неужели maken van een vraag een uiting van verbazing of twijfel: Разве он уже ушёл? (is hij nou al weg?), Неужели ты не знал? (wist je dat echt niet?) — неужели is sterker. всё-таки/всё же = toch (ondanks alles). вроде (бы) = zo'n beetje/ik geloof; якобы = zogenaamd (ongeloof); мол/дескать geven aan dat je iemand anders citeert; чуть ли не = bijna; авось = op goed geluk; небось = vast wel (spreektaal).",
    example: 'Ты же обещал! / Разве это дорого? / Неужели он всё сделал сам? / Он вроде бы согласен. / Он якобы был болен.'
  },
  {
    code: 'ASPECT-ADVANCED',
    title: 'Aspectnuances: teniet gedaan resultaat, ontkenning, algemeen feit',
    explanation:
      "Op C1-niveau kies je het aspect om betekenis te sturen. (1) Algemeen feit (общефактическое значение): onvoltooid als je alleen meldt dát iets gebeurd is, zonder resultaat te benadrukken: Ты читал «Мастера и Маргариту»? (heb je die ooit gelezen?) versus Ты прочитал статью? (ben je klaar met het artikel?). (2) Teniet gedaan resultaat (аннулированный результат): het onvoltooide bij een handeling die weer ongedaan is: Он открывал окно (hij heeft het raam open gehad, het is weer dicht) versus Он открыл окно (het staat open). Dit geldt sterk bij bewegingswerkwoorden: Он приходил (hij is langs geweest, en weer weg) versus Он пришёл (hij is er). (3) Ontkenning: Я не звонил ему (ik heb hem niet gebeld — feit) versus Я не позвонил ему (ik heb verzuimd te bellen — een gemiste afgeronde handeling). Bij een ontkend verzoek: Не звони (bel niet, algemeen) versus Не позвони! (pas op dat je niet per ongeluk belt — waarschuwing). (4) Herhaling van afgeronde handelingen: Каждый день он прочитывал по главе (elke dag las hij één hoofdstuk uit) — voltooid met een iteratief achtervoegsel.",
    example: 'К нам приходил врач (hij is geweest). / К нам пришёл врач (hij is er nu). / Смотри не опоздай! (pas op dat je niet te laat komt)'
  },
  {
    code: 'WORD-ORDER-INFO',
    title: 'Woordvolgorde en nadruk: thema en rhema',
    explanation:
      "De Russische woordvolgorde is vrij, maar niet willekeurig: het bekende (thema) staat vooraan, het nieuwe of benadrukte (rhema) staat achteraan en krijgt de zinsklemtoon. Vergelijk: В комнату вошла девушка (er kwam een meisje binnen — het meisje is nieuw) en Девушка вошла в комнату (het meisje kwam de kamer binnen — je wist al van haar). Zo beantwoordt de volgorde onuitgesproken vragen: Я купил книгу вчера (wanneer? gisteren) / Я вчера купил книгу (wat? een boek). In spreektaal kan het rhema juist vooraan met sterke nadruk: Книгу я купил! Bijvoeglijke naamwoorden staan normaal vóór het zelfstandig naamwoord; erachter zijn ze benadrukt of poëtisch (ночь тёмная). Partikels als же, ли en -то staan direct na het woord dat ze benadrukken; бы na het werkwoord of het benadrukte woord. Een gesproken zin die met het werkwoord begint klinkt vaak als vraag, verhaal of bevel: Идёт дождь. Была зима. Знаешь что?",
    example: 'Вчера мне позвонил директор. (wie belde? de directeur) / Директор позвонил мне вчера. (wanneer? gisteren) / Мне директор позвонил, а не тебе! (nadruk)'
  },
  {
    code: 'NUMERALS-ADVANCED',
    title: 'Telwoorden gevorderd: verzameltelwoorden, verbuiging, breuken',
    explanation:
      "Verzameltelwoorden двое, трое, четверо (tot десятеро) worden gebruikt voor groepen mannen of gemengde groepen personen, voor kinderen en jongen dieren en voor woorden die alleen in het meervoud bestaan: двое друзей, трое детей, двое суток (twee etmalen), двое ножниц. Niet voor vrouwen: две подруги. оба (m/o) en обе (v) = beide: оба брата, обе сестры. полтора (m/o) / полторы (v) = anderhalf: полтора часа, полторы недели. Telwoorden verbuigen zelf mee: с двумя друзьями (met twee vrienden), о трёх книгах, к пяти часам (tegen vijven), в двадцати километрах (op twintig kilometer). Breuken en procenten: одна вторая / половина, одна треть, три четверти; проценты volgen de telwoordregel: один процент, два процента, пять процентов, en het geheel staat in de genitief: двадцать процентов населения. Jaartallen als rangtelwoord, alleen het laatste deel verbuigt: в тысяча девятьсот девяносто первом году (in 1991), в две тысячи двадцать четвёртом году.",
    example: 'У них трое детей. / Мы ждали полтора часа. / Он живёт в пяти минутах от метро. / Это случилось в две тысячи десятом году.'
  }
];

const words = [
  // --- abstracte begrippen & argumentatie ---
  { category: 'c1-abstract-argumentatie', russian: 'довод', translation_nl: 'argument (in een betoog)', notes: 'привести довод = een argument aanvoeren; аргумент is ook gangbaar.' },
  { category: 'c1-abstract-argumentatie', russian: 'предпосылка', translation_nl: 'voorwaarde / uitgangspunt / premisse' },
  { category: 'c1-abstract-argumentatie', russian: 'следствие', translation_nl: 'gevolg; onderzoek (justitie)', notes: 'причина и следствие = oorzaak en gevolg.' },
  { category: 'c1-abstract-argumentatie', russian: 'противоречие', translation_nl: 'tegenstrijdigheid', notes: 'противоречить + datief = in tegenspraak zijn met.' },
  { category: 'c1-abstract-argumentatie', russian: 'критерий', translation_nl: 'criterium' },
  { category: 'c1-abstract-argumentatie', russian: 'закономерность', translation_nl: 'wetmatigheid / patroon' },
  { category: 'c1-abstract-argumentatie', russian: 'тенденция', translation_nl: 'tendens / trend' },
  { category: 'c1-abstract-argumentatie', russian: 'взаимосвязь', translation_nl: 'onderlinge samenhang' },
  { category: 'c1-abstract-argumentatie', russian: 'целесообразный', translation_nl: 'doelmatig / zinvol', notes: 'Нецелесообразно = niet zinvol (ambtelijk).' },
  { category: 'c1-abstract-argumentatie', russian: 'опровергать', translation_nl: 'weerleggen', notes: 'Voltooid: опровергнуть.' },
  { category: 'c1-abstract-argumentatie', russian: 'обосновать', translation_nl: 'onderbouwen (voltooid)', notes: 'Onvoltooid: обосновывать.' },
  { category: 'c1-abstract-argumentatie', russian: 'сущность', translation_nl: 'wezen / essentie', notes: 'в сущности = in wezen.' },
  { category: 'c1-abstract-argumentatie', russian: 'преимущество', translation_nl: 'voordeel', notes: 'недостаток = nadeel.' },
  { category: 'c1-abstract-argumentatie', russian: 'оценивать', translation_nl: 'beoordelen / inschatten', notes: 'Voltooid: оценить.' },

  // --- formeel & academisch register ---
  { category: 'c1-formeel-academisch', russian: 'в соответствии с', translation_nl: 'in overeenstemming met / conform', notes: '+ instrumentalis: в соответствии с законом.' },
  { category: 'c1-formeel-academisch', russian: 'вследствие', translation_nl: 'ten gevolge van', notes: '+ genitief. Vergelijk: в следствие (los) = in het onderzoek.' },
  { category: 'c1-formeel-academisch', russian: 'ввиду', translation_nl: 'gezien / met het oog op', notes: '+ genitief: ввиду плохой погоды.' },
  { category: 'c1-formeel-academisch', russian: 'в целях', translation_nl: 'met als doel', notes: '+ genitief: в целях безопасности.' },
  { category: 'c1-formeel-academisch', russian: 'осуществлять', translation_nl: 'uitvoeren / realiseren (ambtelijk)', notes: 'Voltooid: осуществить. осуществлять контроль = controle uitoefenen.' },
  { category: 'c1-formeel-academisch', russian: 'являться', translation_nl: 'zijn (formeel) / vormen', notes: '+ instrumentalis: Москва является столицей России.' },
  { category: 'c1-formeel-academisch', russian: 'представлять собой', translation_nl: 'vormen / zijn (formeel)', notes: '+ accusatief: Это представляет собой проблему.' },
  { category: 'c1-formeel-academisch', russian: 'подлежать', translation_nl: 'onderworpen zijn aan / moeten', notes: '+ datief: не подлежит обмену = kan niet worden geruild.' },
  { category: 'c1-formeel-academisch', russian: 'надлежащий', translation_nl: 'behoorlijk / passend (juridisch)', notes: 'надлежащим образом = op de juiste wijze.' },
  { category: 'c1-formeel-academisch', russian: 'вышеуказанный', translation_nl: 'bovengenoemd' },
  { category: 'c1-formeel-academisch', russian: 'настоящий', translation_nl: 'onderhavig (formeel); echt', notes: 'настоящий договор = dit contract; настоящий друг = een echte vriend.' },
  { category: 'c1-formeel-academisch', russian: 'уведомить', translation_nl: 'in kennis stellen (voltooid)', notes: 'уведомление = kennisgeving. Onvoltooid: уведомлять.' },
  { category: 'c1-formeel-academisch', russian: 'предусматривать', translation_nl: 'voorzien in / bepalen (van een regel)', notes: 'Договор предусматривает... Voltooid: предусмотреть.' },
  { category: 'c1-formeel-academisch', russian: 'исследовать', translation_nl: 'onderzoeken (wetenschappelijk)' },

  // --- nuances & synoniemen ---
  { category: 'c1-synoniemen', russian: 'произнести', translation_nl: 'uitspreken (een woord, een toost)', notes: 'Naast сказать (zeggen), заявить (verklaren), выразить (uiten), промолвить (literair).' },
  { category: 'c1-synoniemen', russian: 'промолвить', translation_nl: 'zeggen (literair, zacht)', notes: 'Alleen in literatuur.' },
  { category: 'c1-synoniemen', russian: 'глядеть', translation_nl: 'kijken (spreektaal/volks)', notes: 'смотреть is neutraal; наблюдать = observeren; уставиться = staren.' },
  { category: 'c1-synoniemen', russian: 'наблюдать', translation_nl: 'observeren / gadeslaan', notes: 'наблюдать за + instrumentalis.' },
  { category: 'c1-synoniemen', russian: 'уставиться', translation_nl: 'staren (voltooid)', notes: 'уставиться на + accusatief.' },
  { category: 'c1-synoniemen', russian: 'полагать', translation_nl: 'menen / aannemen (formeel)', notes: 'думать neutraal, считать = vinden/van mening zijn, размышлять = nadenken.' },
  { category: 'c1-synoniemen', russian: 'размышлять', translation_nl: 'nadenken / peinzen', notes: 'размышлять о + prepositief.' },
  { category: 'c1-synoniemen', russian: 'шагать', translation_nl: 'stappen / marcheren', notes: 'идти neutraal; брести = sjokken; мчаться = razen.' },
  { category: 'c1-synoniemen', russian: 'брести', translation_nl: 'sjokken / zich voortslepen' },
  { category: 'c1-synoniemen', russian: 'мчаться', translation_nl: 'razen / snellen' },
  { category: 'c1-synoniemen', russian: 'изумительный', translation_nl: 'verbluffend', notes: 'Trap van bewondering: хороший < прекрасный < изумительный < потрясающий.' },
  { category: 'c1-synoniemen', russian: 'потрясающий', translation_nl: 'overweldigend / fantastisch' },
  { category: 'c1-synoniemen', russian: 'скверный', translation_nl: 'akelig / bar slecht', notes: 'плохой < скверный < отвратительный (walgelijk).' },
  { category: 'c1-synoniemen', russian: 'отвратительный', translation_nl: 'walgelijk / afschuwelijk' },

  // --- spreekwoorden ---
  { category: 'c1-spreekwoorden', russian: 'Без труда не вытащишь и рыбку из пруда', translation_nl: 'Zonder inspanning bereik je niets (zonder moeite haal je geen visje uit de vijver)' },
  { category: 'c1-spreekwoorden', russian: 'Тише едешь — дальше будешь', translation_nl: 'Haastige spoed is zelden goed (hoe rustiger je rijdt, hoe verder je komt)' },
  { category: 'c1-spreekwoorden', russian: 'Семь раз отмерь, один раз отрежь', translation_nl: 'Bezint eer ge begint (zeven keer meten, één keer snijden)' },
  { category: 'c1-spreekwoorden', russian: 'В гостях хорошо, а дома лучше', translation_nl: 'Oost west, thuis best' },
  { category: 'c1-spreekwoorden', russian: 'Не имей сто рублей, а имей сто друзей', translation_nl: 'Vrienden zijn meer waard dan geld' },
  { category: 'c1-spreekwoorden', russian: 'Лучше поздно, чем никогда', translation_nl: 'Beter laat dan nooit' },
  { category: 'c1-spreekwoorden', russian: 'Яблоко от яблони недалеко падает', translation_nl: 'De appel valt niet ver van de boom' },
  { category: 'c1-spreekwoorden', russian: 'Нет худа без добра', translation_nl: 'Elk nadeel heeft zijn voordeel (geen kwaad zonder goed)' },
  { category: 'c1-spreekwoorden', russian: 'Утро вечера мудренее', translation_nl: "Slaap er een nachtje over (de ochtend is wijzer dan de avond)" },
  { category: 'c1-spreekwoorden', russian: 'Слово не воробей, вылетит — не поймаешь', translation_nl: 'Een woord is geen mus: eenmaal uitgevlogen vang je het niet meer' },
  { category: 'c1-spreekwoorden', russian: 'Куй железо, пока горячо', translation_nl: 'Smeed het ijzer als het heet is' },
  { category: 'c1-spreekwoorden', russian: 'Волков бояться — в лес не ходить', translation_nl: 'Wie bang is voor wolven, moet het bos niet in (wie niet waagt, die niet wint)' },
  { category: 'c1-spreekwoorden', russian: 'Первый блин комом', translation_nl: 'De eerste poging mislukt altijd (de eerste pannenkoek is een klont)' },
  { category: 'c1-spreekwoorden', russian: 'Что посеешь, то и пожнёшь', translation_nl: 'Wie wind zaait, zal storm oogsten (wat je zaait, oogst je)' },

  // --- partikels & modale woorden ---
  { category: 'c1-partikels', russian: 'же', translation_nl: 'toch / immers (nadruk)', grammarRule: 'PARTICLES', notes: 'Я же говорил! = ik zei het toch!' },
  { category: 'c1-partikels', russian: 'ведь', translation_nl: 'immers / toch', grammarRule: 'PARTICLES' },
  { category: 'c1-partikels', russian: 'разве', translation_nl: 'is het dan zo dat...? (verbazing)', grammarRule: 'PARTICLES' },
  { category: 'c1-partikels', russian: 'неужели', translation_nl: 'echt waar? / kan het zijn dat...? (sterke verbazing)', grammarRule: 'PARTICLES' },
  { category: 'c1-partikels', russian: 'всё-таки', translation_nl: 'toch / desondanks', grammarRule: 'PARTICLES' },
  { category: 'c1-partikels', russian: 'вроде', translation_nl: 'zo\'n beetje / ik geloof / lijkt', grammarRule: 'PARTICLES', notes: 'Он вроде согласен = hij lijkt akkoord.' },
  { category: 'c1-partikels', russian: 'якобы', translation_nl: 'zogenaamd / naar verluidt (met ongeloof)', grammarRule: 'PARTICLES' },
  { category: 'c1-partikels', russian: 'мол', translation_nl: '(zegt hij / zogezegd) — markeert een citaat', grammarRule: 'PARTICLES', notes: 'Он сказал, мол, занят = hij zei van, ik heb het druk.' },
  { category: 'c1-partikels', russian: 'чуть ли не', translation_nl: 'bijna / haast', grammarRule: 'PARTICLES', notes: 'Он чуть ли не плакал = hij huilde bijna.' },
  { category: 'c1-partikels', russian: 'авось', translation_nl: 'op goed geluk / misschien lukt het', grammarRule: 'PARTICLES', notes: 'надеяться на авось = het erop wagen.' },
  { category: 'c1-partikels', russian: 'небось', translation_nl: 'vast wel / zeker (spreektaal)', grammarRule: 'PARTICLES' },
  { category: 'c1-partikels', russian: 'именно', translation_nl: 'juist / precies', grammarRule: 'PARTICLES', notes: 'Вот именно! = precies!' },

  // --- slang & jongerentaal ---
  { category: 'c1-slang', russian: 'прикольно', translation_nl: 'cool / grappig (informeel)', notes: 'прикол = grap/geintje.' },
  { category: 'c1-slang', russian: 'стрёмно', translation_nl: 'eng / gênant (jongerentaal)' },
  { category: 'c1-slang', russian: 'забить', translation_nl: 'iets laten zitten / niet meer om iets geven (slang)', notes: 'Забей! = laat maar zitten.' },
  { category: 'c1-slang', russian: 'париться', translation_nl: 'zich druk maken (slang)', notes: 'Не парься! = maak je niet druk.' },
  { category: 'c1-slang', russian: 'ржать', translation_nl: 'keihard lachen (slang)', notes: 'Letterlijk: hinniken.' },
  { category: 'c1-slang', russian: 'халява', translation_nl: 'iets gratis / een buitenkansje', notes: 'на халяву = voor niks.' },
  { category: 'c1-slang', russian: 'лажа', translation_nl: 'prutswerk / blunder (slang)', notes: 'лажать = blunderen.' },
  { category: 'c1-slang', russian: 'тачка', translation_nl: 'auto / bak (slang)' },
  { category: 'c1-slang', russian: 'чел', translation_nl: 'gast / gozer (afkorting van человек)' },
  { category: 'c1-slang', russian: 'зависать', translation_nl: 'rondhangen; vastlopen (computer)' },
  { category: 'c1-slang', russian: 'залипать', translation_nl: 'blijven hangen (aan een scherm / video)' },
  { category: 'c1-slang', russian: 'бабло', translation_nl: 'poen (slang)' },
  { category: 'c1-slang', russian: 'капец', translation_nl: 'nou zeg / dat is het einde (uitroep, mild)', notes: 'Milde variant van een grovere uitroep; onder vrienden gangbaar.' },
  { category: 'c1-slang', russian: 'жесть', translation_nl: 'heftig / bizar (uitroep)' },

  // --- media & maatschappelijk debat ---
  { category: 'c1-media-maatschappij', russian: 'СМИ', translation_nl: 'de media (средства массовой информации)', notes: 'Onverbuigbaar, meervoud.' },
  { category: 'c1-media-maatschappij', russian: 'цензура', translation_nl: 'censuur' },
  { category: 'c1-media-maatschappij', russian: 'пропаганда', translation_nl: 'propaganda' },
  { category: 'c1-media-maatschappij', russian: 'общественное мнение', translation_nl: 'publieke opinie' },
  { category: 'c1-media-maatschappij', russian: 'освещать', translation_nl: 'verslag doen van / belichten (media)', notes: 'освещать события = verslag doen van gebeurtenissen.' },
  { category: 'c1-media-maatschappij', russian: 'разоблачение', translation_nl: 'onthulling / ontmaskering' },
  { category: 'c1-media-maatschappij', russian: 'утечка', translation_nl: 'lek (van informatie, gas)' },
  { category: 'c1-media-maatschappij', russian: 'фейк', translation_nl: 'nepnieuws / fake' },
  { category: 'c1-media-maatschappij', russian: 'повестка', translation_nl: 'agenda (van het debat); dagvaarding', notes: 'повестка дня = de agenda.' },
  { category: 'c1-media-maatschappij', russian: 'общественность', translation_nl: 'het publiek / de gemeenschap' },
  { category: 'c1-media-maatschappij', russian: 'достоверный', translation_nl: 'betrouwbaar / geloofwaardig (van informatie)', notes: 'достоверный источник.' },
  { category: 'c1-media-maatschappij', russian: 'предвзятый', translation_nl: 'bevooroordeeld / partijdig' },

  // --- gezondheid gevorderd ---
  { category: 'c1-gezondheid-gevorderd', russian: 'диагноз', translation_nl: 'diagnose', notes: 'поставить диагноз = een diagnose stellen.' },
  { category: 'c1-gezondheid-gevorderd', russian: 'обследование', translation_nl: 'medisch onderzoek / check-up' },
  { category: 'c1-gezondheid-gevorderd', russian: 'хронический', translation_nl: 'chronisch' },
  { category: 'c1-gezondheid-gevorderd', russian: 'воспаление', translation_nl: 'ontsteking', notes: 'воспаление лёгких = longontsteking.' },
  { category: 'c1-gezondheid-gevorderd', russian: 'прививка', translation_nl: 'vaccinatie / inenting', notes: 'сделать прививку = zich laten inenten.' },
  { category: 'c1-gezondheid-gevorderd', russian: 'противопоказание', translation_nl: 'contra-indicatie' },
  { category: 'c1-gezondheid-gevorderd', russian: 'госпитализация', translation_nl: 'ziekenhuisopname' },
  { category: 'c1-gezondheid-gevorderd', russian: 'выписать', translation_nl: 'voorschrijven; ontslaan uit het ziekenhuis (voltooid)', notes: 'выписать рецепт / выписать из больницы.' },
  { category: 'c1-gezondheid-gevorderd', russian: 'операция', translation_nl: 'operatie', notes: 'хирург = chirurg.' },
  { category: 'c1-gezondheid-gevorderd', russian: 'наркоз', translation_nl: 'narcose' },
  { category: 'c1-gezondheid-gevorderd', russian: 'давление', translation_nl: 'bloeddruk; druk' },
  { category: 'c1-gezondheid-gevorderd', russian: 'сердечный приступ', translation_nl: 'hartaanval', notes: 'инсульт = beroerte.' },

  // --- werk & carrière gevorderd ---
  { category: 'c1-werk-carriere', russian: 'повышение', translation_nl: 'promotie; verhoging', notes: 'получить повышение = promotie krijgen.' },
  { category: 'c1-werk-carriere', russian: 'квалификация', translation_nl: 'kwalificatie', notes: 'повышение квалификации = bijscholing.' },
  { category: 'c1-werk-carriere', russian: 'сокращение', translation_nl: 'reorganisatie / inkrimping; afkorting', notes: 'попасть под сокращение = boventallig worden.' },
  { category: 'c1-werk-carriere', russian: 'стажировка', translation_nl: 'stage' },
  { category: 'c1-werk-carriere', russian: 'полномочия', translation_nl: 'bevoegdheden', notes: 'Meervoud.' },
  { category: 'c1-werk-carriere', russian: 'подчинённый', translation_nl: 'ondergeschikte / medewerker (onder je)' },
  { category: 'c1-werk-carriere', russian: 'отчётность', translation_nl: 'rapportage / verslaglegging' },
  { category: 'c1-werk-carriere', russian: 'срок сдачи', translation_nl: 'deadline', notes: 'In de praktijk ook дедлайн.' },
  { category: 'c1-werk-carriere', russian: 'выгорание', translation_nl: 'burn-out', notes: 'профессиональное выгорание.' },
  { category: 'c1-werk-carriere', russian: 'назначить', translation_nl: 'benoemen; vaststellen (afspraak) (voltooid)', notes: 'назначить встречу = een afspraak plannen.' },
  { category: 'c1-werk-carriere', russian: 'должностная инструкция', translation_nl: 'functieomschrijving' },
  { category: 'c1-werk-carriere', russian: 'испытательный срок', translation_nl: 'proeftijd' },

  // --- woningmarkt & bureaucratie gevorderd ---
  { category: 'c1-wonen-samenleving', russian: 'ипотека', translation_nl: 'hypotheek' },
  { category: 'c1-wonen-samenleving', russian: 'застройщик', translation_nl: 'projectontwikkelaar' },
  { category: 'c1-wonen-samenleving', russian: 'новостройка', translation_nl: 'nieuwbouw', notes: 'вторичка = bestaande bouw (spreektaal).' },
  { category: 'c1-wonen-samenleving', russian: 'прописка', translation_nl: 'inschrijving op een woonadres', notes: 'Officieel регистрация по месту жительства.' },
  { category: 'c1-wonen-samenleving', russian: 'управляющая компания', translation_nl: 'VvE-beheerder / woningbeheerder' },
  { category: 'c1-wonen-samenleving', russian: 'ЖКХ', translation_nl: 'nutsvoorzieningen en woningbeheer (жилищно-коммунальное хозяйство)' },
  { category: 'c1-wonen-samenleving', russian: 'льгота', translation_nl: 'korting / voordeel (voor bepaalde groepen)', notes: 'льготный билет = kortingskaartje.' },
  { category: 'c1-wonen-samenleving', russian: 'пособие', translation_nl: 'uitkering / toeslag', notes: 'пособие по безработице = werkloosheidsuitkering.' },
  { category: 'c1-wonen-samenleving', russian: 'пенсия', translation_nl: 'pensioen', notes: 'выйти на пенсию = met pensioen gaan.' },
  { category: 'c1-wonen-samenleving', russian: 'налоговая', translation_nl: 'de belastingdienst (налоговая инспекция)' },
  { category: 'c1-wonen-samenleving', russian: 'нотариус', translation_nl: 'notaris' },
  { category: 'c1-wonen-samenleving', russian: 'выписка', translation_nl: 'uittreksel (bank, register)' },

  // --- register ---
  { category: 'c1-grammatica-register', russian: 'отчество', translation_nl: 'vadersnaam (patroniem)', grammarRule: 'REGISTER-STYLE', notes: 'Иван Петрович: Петрович is het отчество.' },
  { category: 'c1-grammatica-register', russian: 'обращение', translation_nl: 'aanspreekvorm; beroep (op iemand)', grammarRule: 'REGISTER-STYLE' },
  { category: 'c1-grammatica-register', russian: 'с уважением', translation_nl: 'met vriendelijke groet / hoogachtend', grammarRule: 'REGISTER-STYLE' },
  { category: 'c1-grammatica-register', russian: 'канцелярит', translation_nl: 'ambtelijke taal / bureaucratenjargon', grammarRule: 'REGISTER-STYLE' },
  { category: 'c1-grammatica-register', russian: 'перейти на ты', translation_nl: 'elkaar gaan tutoyeren', grammarRule: 'REGISTER-STYLE' },
  { category: 'c1-grammatica-register', russian: 'просторечие', translation_nl: 'volkstaal / platte spreektaal', grammarRule: 'REGISTER-STYLE' },

  // --- telwoorden gevorderd ---
  { category: 'c1-grammatica-telwoorden', russian: 'двое', translation_nl: 'twee (personen, verzameltelwoord)', grammarRule: 'NUMERALS-ADVANCED', notes: 'двое детей, двое суток.' },
  { category: 'c1-grammatica-telwoorden', russian: 'оба', translation_nl: 'beide (m/o)', grammarRule: 'NUMERALS-ADVANCED', notes: 'обе = beide (v).' },
  { category: 'c1-grammatica-telwoorden', russian: 'полтора', translation_nl: 'anderhalf', grammarRule: 'NUMERALS-ADVANCED', notes: 'полтора часа, полторы недели.' },
  { category: 'c1-grammatica-telwoorden', russian: 'треть', translation_nl: 'een derde', grammarRule: 'NUMERALS-ADVANCED' },
  { category: 'c1-grammatica-telwoorden', russian: 'четверть', translation_nl: 'een kwart', grammarRule: 'NUMERALS-ADVANCED' },
  { category: 'c1-grammatica-telwoorden', russian: 'процент', translation_nl: 'procent', grammarRule: 'NUMERALS-ADVANCED', notes: 'два процента, пять процентов.' },
  { category: 'c1-grammatica-telwoorden', russian: 'дюжина', translation_nl: 'dozijn', grammarRule: 'NUMERALS-ADVANCED' },
  { category: 'c1-grammatica-telwoorden', russian: 'десятилетие', translation_nl: 'decennium', grammarRule: 'NUMERALS-ADVANCED' }
];

const grammarExercises = [
  // REGISTER-STYLE
  {
    category: 'c1-grammatica-register', grammarRule: 'REGISTER-STYLE', type: 'mc',
    prompt: "Je schrijft een e-mail aan een onbekende manager, Ольга Сергеевна Иванова. Welke aanhef past?",
    correctAnswer: 'Уважаемая Ольга Сергеевна!', options: ['Привет, Оля!', 'Уважаемая Ольга Сергеевна!', 'Дорогая госпожа Иванова!'],
    explanation: "Formele correspondentie: Уважаемый/Уважаемая + voornaam + vadersnaam, met uitroepteken. 'Дорогая' is voor persoonlijke brieven; госпожа + achternaam is ongebruikelijk in het Russisch."
  },
  {
    category: 'c1-grammatica-register', grammarRule: 'REGISTER-STYLE', type: 'mc',
    prompt: "Wat is de neutrale, gesproken variant van het ambtelijke 'осуществить оплату'?",
    correctAnswer: 'заплатить', options: ['заплатить', 'произвести платёж', 'осуществлять оплачивание'],
    explanation: "Ambtelijke taal (канцелярит) zet een werkwoord om in een zelfstandig naamwoord + hulpwerkwoord (осуществить оплату, произвести платёж). In gesproken Russisch zeg je gewoon het werkwoord: заплатить."
  },
  {
    category: 'c1-grammatica-register', grammarRule: 'REGISTER-STYLE', type: 'mc',
    prompt: "Wie stelt normaal gesproken voor om op 'ты' over te gaan?",
    correctAnswer: 'de oudere of hogergeplaatste persoon', options: ['de jongere persoon, uit beleefdheid', 'de oudere of hogergeplaatste persoon', 'niemand; dat gebeurt vanzelf na drie ontmoetingen'],
    explanation: "Het initiatief 'Давайте на ты' komt van degene met de hogere status of leeftijd. Zelf ongevraagd overstappen op ты kan als onbeleefd worden ervaren."
  },

  // PARTICLES
  {
    category: 'c1-partikels', grammarRule: 'PARTICLES', type: 'mc',
    prompt: "Welk partikel past: 'Я ___ тебе говорил, что он опоздает!' (ik zei het je toch!)",
    correctAnswer: 'же', options: ['же', 'ли', 'разве'],
    explanation: "же drukt hier het verwijtende 'toch' uit: ik hád het je gezegd. ли maakt een indirecte vraag, разве drukt verbazing uit."
  },
  {
    category: 'c1-partikels', grammarRule: 'PARTICLES', type: 'mc',
    prompt: "Wat drukt 'Неужели он всё сделал сам?' uit?",
    correctAnswer: 'sterke verbazing of twijfel: heeft hij dat écht helemaal zelf gedaan?', options: ['een neutrale vraag om informatie', 'sterke verbazing of twijfel: heeft hij dat écht helemaal zelf gedaan?', 'een bevel'],
    explanation: "неужели maakt van een vraag een uiting van (sterke) verbazing of ongeloof. Een neutrale vraag zou zijn: Он всё сделал сам?"
  },
  {
    category: 'c1-partikels', grammarRule: 'PARTICLES', type: 'mc',
    prompt: "Wat betekent 'Он якобы был болен'?",
    correctAnswer: 'Hij zou zogenaamd ziek zijn geweest (de spreker gelooft het niet).', options: ['Hij was zeker ziek.', 'Hij zou zogenaamd ziek zijn geweest (de spreker gelooft het niet).', 'Hij was een beetje ziek.'],
    explanation: "якобы geeft aan dat de spreker een bewering doorgeeft waar hij zelf niet in gelooft: 'zogenaamd', 'naar eigen zeggen'."
  },
  {
    category: 'c1-partikels', grammarRule: 'PARTICLES', type: 'mc',
    prompt: "Vul aan: 'Книгу___ ты прочитал?' (en dat boek, heb je dat nou gelezen?)",
    correctAnswer: '-то', options: ['-то', '-нибудь', '-ка'],
    explanation: "-то (met koppelteken achter het woord) haalt het woord naar voren als bekend gespreksonderwerp: 'dat boek, waar we het over hadden'. -нибудь maakt onbepaalde voornaamwoorden (что-нибудь), -ка verzacht een bevel (скажи-ка)."
  },

  // ASPECT-ADVANCED
  {
    category: 'c1-grammatica-aspect-nuance', grammarRule: 'ASPECT-ADVANCED', type: 'mc',
    prompt: "Je komt thuis en het raam is dicht, maar het is koud. Wat zeg je?",
    correctAnswer: 'Кто-то открывал окно.', options: ['Кто-то открыл окно.', 'Кто-то открывал окно.', 'Кто-то откроет окно.'],
    explanation: "Het raam is weer dicht: het resultaat is teniet gedaan → onvoltooid aspect: открывал (iemand heeft het open gehad). 'открыл' zou betekenen dat het nu open staat."
  },
  {
    category: 'c1-grammatica-aspect-nuance', grammarRule: 'ASPECT-ADVANCED', type: 'mc',
    prompt: "Welke vraag vraagt of iemand een boek ooit gelezen heeft (algemeen feit)?",
    correctAnswer: 'Ты читал «Войну и мир»?', options: ['Ты прочитал «Войну и мир»?', 'Ты читал «Войну и мир»?', 'Ты прочитаешь «Войну и мир»?'],
    explanation: "Voor een algemeen feit ('ooit gelezen?') gebruik je het onvoltooide aspect: читал. 'прочитал' vraagt of je hem úit hebt (bijvoorbeeld voor een tentamen)."
  },
  {
    category: 'c1-grammatica-aspect-nuance', grammarRule: 'ASPECT-ADVANCED', type: 'mc',
    prompt: "Vul aan: 'Смотри не ___ ключи!' (pas op dat je je sleutels niet vergeet)",
    correctAnswer: 'забудь', options: ['забывай', 'забудь', 'забыл'],
    explanation: "Een waarschuwing voor iets wat per ongeluk kan gebeuren staat in het voltooide aspect, meestal met смотри: Смотри не забудь! De onvoltooide ontkenning (не забывай) is een algemeen verbod ('vergeet het niet' als gewoonte)."
  },
  {
    category: 'c1-grammatica-aspect-nuance', grammarRule: 'ASPECT-ADVANCED', type: 'mc',
    prompt: "Wat betekent 'К вам приходил курьер'?",
    correctAnswer: 'Er is een koerier langs geweest (hij is weer weg).', options: ['Er is een koerier langs geweest (hij is weer weg).', 'Er staat een koerier voor de deur.', 'Er komt straks een koerier.'],
    explanation: "Het onvoltooide приходил bij bewegingswerkwoorden betekent 'is geweest en is weer weg' (heen en terug). 'пришёл' = hij is er nu."
  },

  // WORD-ORDER-INFO
  {
    category: 'c1-grammatica-woordvolgorde', grammarRule: 'WORD-ORDER-INFO', type: 'mc',
    prompt: "Welke zin beantwoordt de vraag 'Wie heeft je gisteren gebeld?'",
    correctAnswer: 'Вчера мне звонил директор.', options: ['Директор звонил мне вчера.', 'Вчера мне звонил директор.', 'Мне вчера директор звонил.'],
    explanation: "Het nieuwe/gevraagde (het rhema) staat achteraan: 'директор' is het antwoord en staat dus aan het eind. 'Директор звонил мне вчера' beantwoordt 'wanneer?'."
  },
  {
    category: 'c1-grammatica-woordvolgorde', grammarRule: 'WORD-ORDER-INFO', type: 'mc',
    prompt: "Welke zin introduceert een nieuw personage in een verhaal?",
    correctAnswer: 'В комнату вошла девушка.', options: ['Девушка вошла в комнату.', 'В комнату вошла девушка.', 'Девушка в комнату вошла.'],
    explanation: "Een onbekend, nieuw element staat achteraan: 'В комнату вошла девушка' (er kwam een meisje binnen). Begint de zin met девушка, dan is zij al bekend."
  },
  {
    category: 'c1-grammatica-woordvolgorde', grammarRule: 'WORD-ORDER-INFO', type: 'mc',
    prompt: "Waar staat het partikel ли in de zin 'Ik weet niet of hij mórgen komt' (nadruk op morgen)?",
    correctAnswer: 'Я не знаю, завтра ли он придёт.', options: ['Я не знаю, ли завтра он придёт.', 'Я не знаю, завтра ли он придёт.', 'Я не знаю, он придёт завтра ли.'],
    explanation: "ли staat direct achter het benadrukte woord, dat daarvoor naar voren wordt gehaald: завтра ли (of het morgen is). Met nadruk op het komen: придёт ли он завтра."
  },

  // NUMERALS-ADVANCED
  {
    category: 'c1-grammatica-telwoorden', grammarRule: 'NUMERALS-ADVANCED', type: 'mc',
    prompt: "Vul aan: У них ___ детей. (zij hebben drie kinderen)",
    correctAnswer: 'трое', options: ['три', 'трое', 'третий'],
    explanation: "Bij kinderen (en gemengde groepen personen) gebruik je het verzameltelwoord: трое детей. 'три детей' is fout (het zou три ребёнка moeten zijn, maar трое детей is de gangbare vorm)."
  },
  {
    category: 'c1-grammatica-telwoorden', grammarRule: 'NUMERALS-ADVANCED', type: 'mc',
    prompt: "Vul aan: Мы ждали ___ часа. (we wachtten anderhalf uur)",
    correctAnswer: 'полтора', options: ['полтора', 'полторы', 'полутора'],
    explanation: "час is mannelijk → полтора (полторы is voor vrouwelijke woorden: полторы недели; полутора is de verbogen vorm: около полутора часов)."
  },
  {
    category: 'c1-grammatica-telwoorden', grammarRule: 'NUMERALS-ADVANCED', type: 'mc',
    prompt: "Vul aan: Он живёт в ___ минутах ходьбы от метро. (hij woont op vijf minuten lopen van de metro)",
    correctAnswer: 'пяти', options: ['пять', 'пяти', 'пятью'],
    explanation: "Na в (plaats/afstand) staat het telwoord in de prepositief: в пяти минутах. Telwoorden verbuigen mee: пять → пяти (gen/dat/prep), пятью (inst)."
  },
  {
    category: 'c1-grammatica-telwoorden', grammarRule: 'NUMERALS-ADVANCED', type: 'mc',
    prompt: "Hoe zeg je 'in 1991'?",
    correctAnswer: 'в тысяча девятьсот девяносто первом году', options: ['в тысяча девятьсот девяносто один год', 'в тысяча девятьсот девяносто первом году', 'в тысячном девятисотом девяностом первом году'],
    explanation: "Het jaartal is een rangtelwoord waarvan alleen het laatste deel verbuigt (prepositief na в): ... девяносто первом году. De rest blijft onveranderd."
  }
];

const practicalSentences = [
  { category: 'c1-praktische-zinnen', prompt: 'Ik ben bang dat ik u daarin niet tegemoet kan komen.', tokens: ['Боюсь,', 'что', 'не', 'смогу', 'пойти', 'вам', 'навстречу', 'в', 'этом', 'вопросе.'], explanation: "'пойти навстречу' + datief = iemand tegemoetkomen; 'в этом вопросе' = op dit punt. Diplomatiek weigeren." },
  { category: 'c1-praktische-zinnen', prompt: 'Voor zover ik weet, is de beslissing nog niet genomen.', tokens: ['Насколько', 'мне', 'известно,', 'решение', 'ещё', 'не', 'принято.'], explanation: "'Насколько мне известно' = voor zover ik weet; 'принято' = korte passieve vorm van принятый (genomen)." },
  { category: 'c1-praktische-zinnen', prompt: 'Ik zou willen benadrukken dat dit slechts mijn persoonlijke mening is.', tokens: ['Хотел', 'бы', 'подчеркнуть,', 'что', 'это', 'лишь', 'моё', 'личное', 'мнение.'], explanation: "'подчеркнуть' = benadrukken (letterlijk: onderstrepen); 'лишь' = slechts (formeler dan только)." },
  { category: 'c1-praktische-zinnen', prompt: 'Aan de ene kant is het goedkoper, aan de andere kant minder betrouwbaar.', tokens: ['С', 'одной', 'стороны,', 'это', 'дешевле,', 'с', 'другой', '—', 'менее', 'надёжно.'], explanation: "'с одной стороны... с другой (стороны)' = enerzijds... anderzijds. 'менее' + bijwoord = minder." },
  { category: 'c1-praktische-zinnen', prompt: 'Ik stel voor dat we hier morgen op terugkomen.', tokens: ['Предлагаю', 'вернуться', 'к', 'этому', 'вопросу', 'завтра.'], explanation: "'вернуться к вопросу' = op een kwestie terugkomen. Het onderwerp я wordt weggelaten: Предлагаю... is gangbaar in vergaderingen." },
  { category: 'c1-praktische-zinnen', prompt: 'Naar verluidt is het contract al ondertekend.', tokens: ['Якобы', 'договор', 'уже', 'подписан.'], explanation: "'якобы' markeert dat je een bewering doorgeeft zonder ervoor in te staan; 'подписан' = korte passieve vorm (ondertekend)." },
  { category: 'c1-praktische-zinnen', prompt: 'Ondanks alle inspanningen hebben we geen overeenstemming bereikt.', tokens: ['Несмотря', 'на', 'все', 'усилия,', 'нам', 'не', 'удалось', 'прийти', 'к', 'соглашению.'], explanation: "'нам не удалось' + infinitief = het is ons niet gelukt (onpersoonlijk, persoon in de datief); 'прийти к соглашению' = tot overeenstemming komen." },
  { category: 'c1-praktische-zinnen', prompt: 'Overeenkomstig het contract dient u ons dertig dagen van tevoren in kennis te stellen.', tokens: ['В', 'соответствии', 'с', 'договором', 'вы', 'обязаны', 'уведомить', 'нас', 'за', 'тридцать', 'дней.'], explanation: "'в соответствии с' + instrumentalis; 'обязаны' = verplicht (korte vorm); 'за тридцать дней' = dertig dagen van tevoren (за + accusatief van de periode)." },
  { category: 'c1-praktische-zinnen', prompt: 'Laten we het beestje bij zijn naam noemen: dat was een vergissing.', tokens: ['Давайте', 'называть', 'вещи', 'своими', 'именами:', 'это', 'была', 'ошибка.'], explanation: "'называть вещи своими именами' = de dingen bij hun naam noemen. Let op de instrumentalis: своими именами." },
  { category: 'c1-praktische-zinnen', prompt: 'Het spijt me, maar ik moet u hierin tegenspreken.', tokens: ['Прошу', 'прощения,', 'но', 'вынужден', 'вам', 'возразить.'], explanation: "'вынужден' = genoodzaakt (korte vorm; een vrouw zegt вынуждена); 'возразить' + datief = tegenspreken. Formeel en beleefd." },
  { category: 'c1-praktische-zinnen', prompt: 'Hoe je het ook wendt of keert, we hebben geen keus.', tokens: ['Как', 'ни', 'крути,', 'выбора', 'у', 'нас', 'нет.'], explanation: "'как ни крути' (hoe je het ook draait) is een gangbare uitdrukking; 'выбора нет' = er is geen keus (genitief na нет)." },
  { category: 'c1-praktische-zinnen', prompt: 'Laten we niet overhaast te werk gaan; morgen zien we verder.', tokens: ['Давайте', 'не', 'будем', 'спешить', '—', 'утро', 'вечера', 'мудренее.'], explanation: "'Давайте не будем' + infinitief = laten we niet...; het spreekwoord 'утро вечера мудренее' sluit de zin af zoals een Rus dat zou doen." },
  { category: 'c1-praktische-zinnen', prompt: 'Ik heb met de nodige scepsis naar het voorstel gekeken.', tokens: ['Я', 'отнёсся', 'к', 'предложению', 'с', 'некоторым', 'скепсисом.'], explanation: "'отнестись к чему-то с' + instrumentalis = iets benaderen/beoordelen met...; een vrouw zegt отнеслась." },
  { category: 'c1-praktische-zinnen', prompt: 'Dat is, om het zacht uit te drukken, geen goed idee.', tokens: ['Это,', 'мягко', 'говоря,', 'не', 'лучшая', 'идея.'], explanation: "'мягко говоря' = om het zacht uit te drukken (gerundium); 'не лучшая идея' = niet het beste idee, een typisch Russisch understatement." }
];

const readings = [
  {
    category: 'c1-lezen',
    title: 'Колонка: почему мы не умеем отдыхать',
    passage:
      'Парадокс современного горожанина заключается в том, что, имея больше свободного времени, чем любое предыдущее поколение, он чувствует себя более уставшим. Отпуск превращается в проект: его планируют, оптимизируют, документируют для социальных сетей и, вернувшись, нуждаются в отдыхе от отдыха. Виновата, разумеется, не технология сама по себе, а наша неспособность провести границу между работой и жизнью, которая с появлением смартфона стёрлась почти окончательно. Мы, мол, всегда на связи — и гордимся этим, не замечая, что превратили собственную доступность в новую форму зависимости.',
    questions: [
      { prompt: 'Wat is volgens de auteur de eigenlijke oorzaak van de vermoeidheid?', correctAnswer: 'ons onvermogen om een grens te trekken tussen werk en privé', options: ['de technologie zelf', 'ons onvermogen om een grens te trekken tussen werk en privé', 'te weinig vrije tijd'], explanation: "'Виновата... не технология сама по себе, а наша неспособность провести границу между работой и жизнью' — niet de technologie, maar wij zelf." },
      { prompt: "Welke toon heeft het woordje 'мол' in 'Мы, мол, всегда на связи'?", correctAnswer: 'ironisch: de auteur citeert wat mensen over zichzelf zeggen, met afstand', options: ['neutraal beschrijvend', 'ironisch: de auteur citeert wat mensen over zichzelf zeggen, met afstand', 'bewonderend'], explanation: "мол markeert een (zelf)citaat waar de spreker afstand van neemt: 'wij zijn zogenaamd altijd bereikbaar' — de auteur bedoelt het spottend.", grammarRule: 'PARTICLES' },
      { prompt: "Wat betekent 'нуждаются в отдыхе от отдыха'?", correctAnswer: 'ze hebben rust nodig van hun vakantie (de vakantie was zelf vermoeiend)', options: ['ze willen niet meer op vakantie', 'ze hebben rust nodig van hun vakantie (de vakantie was zelf vermoeiend)', 'ze hebben te veel vakantiedagen'], explanation: "'нуждаться в' + prepositief = behoefte hebben aan; 'отдых от отдыха' is een woordspeling: rust van de rust." }
    ]
  },
  {
    category: 'c1-lezen',
    title: 'Научно-популярное: почему мы забываем',
    passage:
      'Забывание — не сбой памяти, а её функция. Мозг, вынужденный ежедневно обрабатывать огромный поток информации, избирательно удаляет то, что не подкрепляется повторением или эмоциональной значимостью. Именно поэтому иностранные слова, выученные накануне экзамена, исчезают спустя неделю: они не успели закрепиться в долговременной памяти. Исследования показывают, что интервальное повторение — возвращение к материалу через всё увеличивающиеся промежутки времени — позволяет удержать до восьмидесяти процентов выученного, тогда как однократное заучивание даёт едва ли двадцать.',
    questions: [
      { prompt: 'Hoe kijkt de tekst tegen vergeten aan?', correctAnswer: 'als een nuttige functie van het geheugen, niet als een fout', options: ['als een ziekte', 'als een nuttige functie van het geheugen, niet als een fout', 'als een gevolg van te veel slaap'], explanation: "'Забывание — не сбой памяти, а её функция' = vergeten is geen storing van het geheugen, maar een functie ervan." },
      { prompt: 'Welke methode houdt volgens de tekst tot 80% van het geleerde vast?', correctAnswer: 'gespreide herhaling met steeds grotere tussenpozen', options: ['alles de avond voor het examen leren', 'gespreide herhaling met steeds grotere tussenpozen', 'emotioneel worden tijdens het leren'], explanation: "'интервальное повторение — возвращение к материалу через всё увеличивающиеся промежутки времени' — precies het systeem dat deze app gebruikt." },
      { prompt: "'Едва ли двадцать' betekent:", correctAnswer: 'nauwelijks twintig (procent)', options: ['precies twintig', 'nauwelijks twintig (procent)', 'meer dan twintig'], explanation: "'едва ли' = nauwelijks/amper; hier: eenmalig stampen levert amper twintig procent op." }
    ]
  },
  {
    category: 'c1-lezen',
    title: 'Литературный фрагмент: Вокзал',
    passage:
      'Поезд опаздывал, и Вера Николаевна, уже в третий раз перечитав расписание, поняла, что ждать придётся долго. Она села на холодную скамью, поставила рядом чемодан и стала смотреть, как по перрону, не спеша, бредёт старик с собакой. Собака была стара, как и её хозяин, и шла так же — с достоинством человека, которому некуда торопиться. «Вот бы и мне так», — подумала Вера Николаевна и вдруг, впервые за много лет, не почувствовала никакого раздражения от того, что что-то в её жизни идёт не по плану.',
    questions: [
      { prompt: 'Wat verandert er in Vera Nikolajevna aan het eind van het fragment?', correctAnswer: 'ze voelt voor het eerst geen ergernis over iets wat niet volgens plan gaat', options: ['ze besluit de trein te missen', 'ze voelt voor het eerst geen ergernis over iets wat niet volgens plan gaat', 'ze krijgt medelijden met de oude man'], explanation: "'впервые за много лет, не почувствовала никакого раздражения от того, что что-то ... идёт не по плану' — een innerlijke omslag, niet een gebeurtenis." },
      { prompt: "Welke stijlfiguur zit in 'с достоинством человека, которому некуда торопиться'?", correctAnswer: 'een vergelijking: de hond loopt met de waardigheid van iemand die nergens heen hoeft te haasten', options: ['een overdrijving', 'een vergelijking: de hond loopt met de waardigheid van iemand die nergens heen hoeft te haasten', 'een bevel'], explanation: "De hond krijgt een menselijke eigenschap toegedicht via een vergelijking; 'некуда торопиться' = nergens heen hoeven haasten (onpersoonlijk, met datief)." },
      { prompt: "'Вот бы и мне так' drukt uit:", correctAnswer: 'een wens: kon ik dat ook maar', options: ['een bevel', 'een wens: kon ik dat ook maar', 'een vraag'], explanation: "'Вот бы + (infinitief/bijwoord)' is een wensconstructie met бы: kon ik dat ook maar.", grammarRule: 'CONDITIONAL-BY' }
    ]
  }
];

const drills = {
  conjugation: { category: 'c1-grammatica-vervoeging', rule: 'VERB-CONJUGATION', maxVerbs: 30 },
  past: { category: 'c1-grammatica-vervoeging', rule: 'VERB-PAST-GENDER', maxVerbs: 10 },
  aspect: { category: 'c1-grammatica-vervoeging', rule: 'ASPECT-PAIRS', maxVerbs: 25 },
  cases: { category: 'c1-grammatica-naamvallen', rule: 'NOUN-DECLENSION', maxNouns: 30 },
  comparative: { category: 'c1-grammatica-naamvallen', rule: 'COMPARATIVE-SUPERLATIVE', maxAdjectives: 15 }
};

module.exports = { categories, grammarRules, words, grammarExercises, practicalSentences, readings, drills };
