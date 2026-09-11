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
  }
];
