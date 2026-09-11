module.exports = [
  {
    code: 'GEN-NOUN',
    title: 'Geslacht van zelfstandige naamwoorden',
    explanation:
      "Russische zelfstandige naamwoorden zijn mannelijk, vrouwelijk of onzijdig. Je herkent het geslacht meestal aan de laatste letter: eindigt het woord op een medeklinker of -й, dan is het mannelijk (стол, музей). Eindigt het op -а of -я, dan is het meestal vrouwelijk (мама, неделя). Eindigt het op -о of -е, dan is het onzijdig (окно, море). Woorden die eindigen op -ь kunnen zowel mannelijk (день) als vrouwelijk (дверь) zijn; dat moet je per woord onthouden.",
    example: 'стол (m) — тафel, мама (v) — moeder, окно (o) — raam, дверь (v) — deur'
  },
  {
    code: 'CASE-NOM-ACC',
    title: 'Naamval: nominatief vs. accusatief',
    explanation:
      "De nominatief gebruik je voor het onderwerp van de zin. De accusatief gebruik je voor het lijdend voorwerp (wat/wie de handeling ondergaat). Bij onzijdige en de meeste mannelijke onbezielde woorden verandert er niets. Bij vrouwelijke woorden op -а wordt dit -у, en op -я wordt dit -ю. Bezielde mannelijke woorden (mensen/dieren) krijgen in de accusatief de vorm van de genitief.",
    example: "Я читаю книгу. (книга → книгу, want 'boek' is hier lijdend voorwerp)"
  },
  {
    code: 'VERB-PRES-1',
    title: 'Werkwoorden groep 1 (е-vervoeging)',
    explanation:
      "Werkwoorden op -ать/-ять (zoals читать, знать, делать) vervoeg je in de tegenwoordige tijd met de uitgangen: я -ю/-у, ты -ешь, он/она/оно -ет, мы -ем, вы -ете, они -ют/-ут. Je haalt eerst de infinitiefuitgang (-ть) weg en plakt daarna de persoonsuitgang aan de stam.",
    example: 'читать → я читаю, ты читаешь, он читает, мы читаем, вы читаете, они читают'
  },
  {
    code: 'VERB-PRES-2',
    title: 'Werkwoorden groep 2 (и-vervoeging)',
    explanation:
      "Werkwoorden op -ить (zoals говорить, учить) vervoeg je met de uitgangen: я -ю/-у, ты -ишь, он/она/оно -ит, мы -им, вы -ите, они -ят/-ат. Let op: na de sisklanken ж, ш, щ, ч of na ц schrijf je in de я/они-vorm -у/-ат in plaats van -ю/-ят (spellingregel).",
    example: 'говорить → я говорю, ты говоришь, он говорит, мы говорим, вы говорите, они говорят'
  },
  {
    code: 'PLURAL-NOUN',
    title: 'Meervoud van zelfstandige naamwoorden',
    explanation:
      "Mannelijke en vrouwelijke woorden krijgen in het meervoud meestal -ы of -и, onzijdige woorden krijgen -а of -я. De keuze tussen -ы en -и hangt af van de zogeheten '7-letter-regel': na г, к, х, ж, ч, ш, щ schrijf je nooit -ы maar altijd -и.",
    example: 'стол → столы, книга → книги (na к geen -ы), окно → окна, море → моря'
  },
  {
    code: 'SOFT-HARD-SIGN',
    title: 'Zacht teken (ь) en hard teken (ъ)',
    explanation:
      "Het zachte teken ь maakt de voorafgaande medeklinker 'zacht' (palataal) en heeft zelf geen klank; het komt ook voor aan het einde van veel vrouwelijke woorden (дверь). Het harde teken ъ komt bijna alleen voor tussen een voorvoegsel op een medeklinker en een volgende jotende klinker (е, ё, ю, я) en zorgt ervoor dat die klinker met een duidelijke j-klank wordt uitgesproken in plaats van de medeklinker te verzachten.",
    example: "мать (zacht, 'moeder'), объявление (hard teken houdt 'об-' en 'явление' uit elkaar)"
  },
  {
    code: 'STRESS-VOWEL-REDUCTION',
    title: "Onbeklemtoonde 'o' klinkt als 'a' (akanje)",
    explanation:
      "In het Russisch wordt een onbeklemtoonde 'o' bijna altijd uitgesproken als een korte 'a'-klank. Dit heet akanje. Daardoor klinkt bijvoorbeeld 'молоко' (melk) als 'malako', terwijl je het toch met een 'o' schrijft. De klemtoon bepaalt dus niet alleen de nadruk, maar ook hoe klinkers klinken.",
    example: "молоко wordt uitgesproken als [malakó], хорошо als [xarashó]"
  },
  {
    code: 'PERSONAL-PRONOUNS-CASE',
    title: 'Verbuiging van persoonlijke voornaamwoorden',
    explanation:
      "Persoonlijke voornaamwoorden veranderen sterk per naamval en volgen geen regelmatig patroon, dus die moet je uit je hoofd leren. In de accusatief/genitief wordt я → меня, ты → тебя, он → его, она → её, мы → нас, вы → вас, они → их.",
    example: 'Я вижу тебя. (ik zie jou) — ты wordt тебя als lijdend voorwerp'
  },
  {
    code: 'CASE-GEN',
    title: 'Naamval: genitief',
    explanation:
      "De genitief gebruik je om bezit aan te geven ('van'), na de ontkenning 'нет' (er is geen), na hoeveelheden/telwoorden, en na voorzetsels als без (zonder), для (voor), из (uit) en у (bij). Vrouwelijke woorden op -а/-я krijgen -ы/-и, mannelijke woorden op een medeklinker krijgen -а, en onzijdige woorden op -о krijgen -а (let op: dat is dezelfde uitgang als het onzijdige meervoud in de nominatief — de context maakt het verschil duidelijk).",
    example: 'У меня нет книги. (ik heb geen boek — книга → книги, na нет)'
  },
  {
    code: 'CASE-DAT',
    title: 'Naamval: datief',
    explanation:
      "De datief gebruik je voor het meewerkend voorwerp ('aan/voor iemand'), bij leeftijd (Мне 25 лет — ik ben 25) en bij werkwoorden als нравиться (bevallen/leuk vinden). Mannelijke en onzijdige woorden krijgen de uitgang -у/-ю, vrouwelijke woorden op -а/-я krijgen -е.",
    example: 'Я дарю подарок маме. (ik geef een cadeau aan moeder — мама → маме)'
  },
  {
    code: 'CASE-INST',
    title: 'Naamval: instrumentalis',
    explanation:
      "De instrumentalis gebruik je om aan te geven waarmee of met wie iets gebeurt ('met'), en na een vorm van быть (zijn) in verleden of toekomst om een beroep of rol te noemen. Mannelijke en onzijdige woorden krijgen de uitgang -ом/-ем, vrouwelijke woorden op -а/-я krijgen -ой/-ей.",
    example: 'Он был врачом. (hij was arts — врач → врачом)'
  },
  {
    code: 'CASE-PREP',
    title: 'Naamval: prepositief',
    explanation:
      "De prepositief (ook wel de zesde naamval genoemd) bestaat nooit zonder voorzetsel: hij komt alleen voor na в/на (in/op, plaats) en о/об (over, onderwerp van gesprek). Zowel mannelijke, onzijdige als vrouwelijke woorden op -а/-я krijgen meestal de uitgang -е.",
    example: 'Я живу в Москве. (ik woon in Moskou — Москва → Москве)'
  },
  {
    code: 'ADJ-AGREEMENT',
    title: 'Overeenkomst van bijvoeglijke naamwoorden',
    explanation:
      "Een bijvoeglijk naamwoord stemt in geslacht, getal en naamval overeen met het zelfstandig naamwoord waar het bij hoort. In de nominatief enkelvoud krijgt het bij een mannelijk woord de uitgang -ый/-ий, bij een vrouwelijk woord -ая/-яя, bij een onzijdig woord -ое/-ее, en in het meervoud (voor alle geslachten samen) -ые/-ие.",
    example: 'новый стол (m), новая книга (v), новое окно (o), новые столы (mv)'
  },
  {
    code: 'VERB-PAST',
    title: 'Verleden tijd',
    explanation:
      "De verleden tijd vorm je door de infinitiefuitgang -ть te vervangen door -л (bij een mannelijk onderwerp), -ла (vrouwelijk), -ло (onzijdig) of -ли (meervoud). Er bestaat geen aparte uitgang per persoon zoals bij de tegenwoordige tijd — alleen het geslacht en getal van het onderwerp bepalen de uitgang, niet of het 'ik', 'jij' of 'hij' is.",
    example: 'читать → я читал (mannelijke spreker) / я читала (vrouwelijke spreker), они читали'
  },
  {
    code: 'VERB-FUTURE',
    title: 'Toekomende tijd',
    explanation:
      "De toekomende tijd van onvoltooide werkwoorden (een doorlopende of herhaalde handeling) vorm je met een vervoegde vorm van быть (буду, будешь, будет, будем, будете, будут) plus de infinitief. Voltooide werkwoorden (een eenmalige, afgeronde handeling) hebben hun eigen vervoegde toekomstvorm, zonder быть erbij.",
    example: 'Я буду читать. (ik ga lezen, onvoltooid) vs. Я прочитаю. (ik lees het uit, voltooid)'
  },
  {
    code: 'ASPECT-INTRO',
    title: 'Aspect: onvoltooid vs. voltooid',
    explanation:
      "De meeste Russische werkwoorden bestaan in twee versies: onvoltooid (nadruk op het proces, de duur of herhaling) en voltooid (nadruk op een eenmalige, afgeronde handeling met een resultaat). Het voltooide werkwoord wordt vaak gevormd met een voorvoegsel: читать (lezen, onvoltooid) → прочитать (uitlezen, voltooid). Dit onderscheid bestaat niet in het Nederlands en is een van de lastigste onderdelen van het Russisch.",
    example: 'Я читал книгу весь день. (ik was de hele dag een boek aan het lezen) vs. Я прочитал книгу. (ik heb het boek uitgelezen)'
  },
  {
    code: 'NEGATION-NE',
    title: 'Ontkenning met не',
    explanation:
      "Je ontkent een zin door 'не' vlak vóór het werkwoord (of het woord dat ontkend wordt) te plaatsen. Let op: in het Russisch is dubbele ontkenning normaal en zelfs verplicht, anders dan in het Nederlands: 'Я ничего не знаю' betekent letterlijk 'ik niets niet weet', oftewel 'ik weet niets'.",
    example: 'Я не знаю. (ik weet het niet) — Я ничего не знаю. (ik weet niets)'
  },
  {
    code: 'QUESTION-INTONATION',
    title: 'Ja/nee-vragen met intonatie',
    explanation:
      "Een ja/nee-vraag vorm je in het Russisch niet door de woordvolgorde om te draaien (zoals in het Nederlands 'ga je?'), maar met stijgende intonatie op het belangrijkste woord — de woordvolgorde blijft hetzelfde als in de mededeling. Vragen mét een vraagwoord (что, где, когда, почему) beginnen meestal met dat vraagwoord, net als in het Nederlands.",
    example: 'Ты говоришь по-русски? heeft dezelfde volgorde als: Ты говоришь по-русски. — alleen de intonatie (en het vraagteken) maakt het een vraag.'
  }
];
