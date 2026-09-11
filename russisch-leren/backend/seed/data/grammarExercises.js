// Hand-crafted grammar exercises. `category` = category slug, `grammarRule` = grammar_rules.code
module.exports = [
  // GEN-NOUN
  {
    category: 'grammar-nouns', grammarRule: 'GEN-NOUN', type: 'mc',
    prompt: "Welk geslacht heeft 'дверь' (deur)?",
    correctAnswer: 'vrouwelijk',
    options: ['mannelijk', 'vrouwelijk', 'onzijdig'],
    explanation:
      "'дверь' eindigt op -ь. Woorden op -ь kunnen mannelijk óf vrouwelijk zijn, dat moet je per woord onthouden. 'дверь' is vrouwelijk. Een veelgemaakte fout is aannemen dat -ь altijd onzijdig of altijd mannelijk is — dat klopt niet."
  },
  {
    category: 'grammar-nouns', grammarRule: 'GEN-NOUN', type: 'mc',
    prompt: "Welk geslacht heeft 'окно' (raam)?",
    correctAnswer: 'onzijdig',
    options: ['mannelijk', 'vrouwelijk', 'onzijdig'],
    explanation: "Woorden die eindigen op -о zijn (op enkele uitzonderingen na) onzijdig. 'окно' volgt deze hoofdregel."
  },
  {
    category: 'grammar-nouns', grammarRule: 'GEN-NOUN', type: 'mc',
    prompt: "Welk geslacht heeft 'папа' (vader), ook al eindigt het op -а?",
    correctAnswer: 'mannelijk',
    options: ['mannelijk', 'vrouwelijk', 'onzijdig'],
    explanation:
      "Normaal duiden woorden op -а op vrouwelijk geslacht, maar bij woorden die een persoon aanduiden wint het natuurlijke (biologische) geslacht altijd van de uitgang. 'папа' verwijst naar een man en is dus mannelijk, ondanks de -а uitgang."
  },

  // PLURAL-NOUN
  {
    category: 'grammar-nouns', grammarRule: 'PLURAL-NOUN', type: 'mc',
    prompt: "Wat is het meervoud van 'стол' (tafel)?",
    correctAnswer: 'столы',
    options: ['столы', 'столи', 'столя'],
    explanation:
      "'стол' is mannelijk en eindigt op een gewone medeklinker (л), dus krijgt het meervoud de uitgang -ы: столы. De 7-letter-regel (na г,к,х,ж,ч,ш,щ altijd -и) is hier niet van toepassing omdat л niet in dat rijtje staat."
  },
  {
    category: 'grammar-nouns', grammarRule: 'PLURAL-NOUN', type: 'mc',
    prompt: "Wat is het meervoud van 'книга' (boek)?",
    correctAnswer: 'книги',
    options: ['книгы', 'книги', 'книгa'],
    explanation:
      "Na de letter к mag je volgens de 7-letter-regel (г, к, х, ж, ч, ш, щ) nooit -ы schrijven, alleen -и. Daarom wordt het meervoud 'книги' en niet 'книгы', ook al is 'книга' een gewoon vrouwelijk woord op -а."
  },
  {
    category: 'grammar-nouns', grammarRule: 'PLURAL-NOUN', type: 'mc',
    prompt: "Wat is het meervoud van 'окно' (raam)?",
    correctAnswer: 'окна',
    options: ['окны', 'окна', 'окни'],
    explanation: "Onzijdige woorden op -о krijgen in het meervoud de uitgang -а: окно → окна."
  },

  // CASE-NOM-ACC
  {
    category: 'grammar-nouns', grammarRule: 'CASE-NOM-ACC', type: 'mc',
    prompt: "Vul aan: Я читаю ___. (ik lees een boek — книга)",
    correctAnswer: 'книгу',
    options: ['книга', 'книгу', 'книге'],
    explanation:
      "'книга' is hier het lijdend voorwerp (wat wordt er gelezen?), dus moet de accusatief gebruikt worden. Vrouwelijke woorden op -а krijgen in de accusatief de uitgang -у: книга → книгу. De fout 'книга' laten staan is de meestgemaakte fout: dat is de nominatief (onderwerpsvorm), die je hier niet gebruikt."
  },
  {
    category: 'grammar-nouns', grammarRule: 'CASE-NOM-ACC', type: 'mc',
    prompt: "Welke zin gebruikt de nominatief correct als onderwerp: 'boek is interessant'?",
    correctAnswer: 'Книга интересная.',
    options: ['Книгу интересная.', 'Книга интересная.', 'Книге интересная.'],
    explanation:
      "'книга' is hier het onderwerp van de zin (wat is interessant?), dus blijft het in de nominatief: 'Книга интересная.' De accusatiefvorm 'книгу' gebruik je alleen voor een lijdend voorwerp, niet voor het onderwerp."
  },
  {
    category: 'grammar-nouns', grammarRule: 'CASE-NOM-ACC', type: 'mc',
    prompt: "Vul aan: Я вижу ___. (ik zie jou — ты)",
    correctAnswer: 'тебя',
    options: ['ты', 'тебя', 'тебе'],
    explanation:
      "Als lijdend voorwerp verandert 'ты' onregelmatig in 'тебя' (zie ook: persoonlijke voornaamwoorden). Dit moet je uit je hoofd leren, want het volgt niet het reguliere -а/-у patroon van zelfstandige naamwoorden."
  },

  // VERB-PRES-1
  {
    category: 'grammar-verbs', grammarRule: 'VERB-PRES-1', type: 'mc',
    prompt: "Vul aan: Я ___ книгу. (ik lees een boek — читать)",
    correctAnswer: 'читаю',
    options: ['читаю', 'читаешь', 'читает'],
    explanation:
      "'читать' is een groep-1-werkwoord (е-vervoeging). Bij 'я' hoort de uitgang -ю (op een klinkerstam): чита- + -ю = читаю. De uitgang -ешь hoort bij 'ты', en -ет hoort bij 'он/она'."
  },
  {
    category: 'grammar-verbs', grammarRule: 'VERB-PRES-1', type: 'mc',
    prompt: "Vul aan: Ты ___ по-русски? (spreek jij Russisch? — hint: dit is eigenlijk groep 2, ter controle: kies de juiste 'ты'-vorm van 'работать', werken)",
    correctAnswer: 'работаешь',
    options: ['работаю', 'работаешь', 'работают'],
    explanation:
      "Bij 'ты' hoort bij groep-1-werkwoorden altijd de uitgang -ешь: работать → работаешь. 'работаю' hoort bij 'я' en 'работают' hoort bij 'они' — een veelgemaakte fout is de persoonsvorm verwisselen."
  },
  {
    category: 'grammar-verbs', grammarRule: 'VERB-PRES-1', type: 'mc',
    prompt: "Vul aan: Они ___ английский. (zij kennen Engels — знать)",
    correctAnswer: 'знают',
    options: ['знаю', 'знает', 'знают'],
    explanation: "Bij 'они' (zij, meervoud) hoort bij groep-1-werkwoorden de uitgang -ют: знать → знают."
  },

  // VERB-PRES-2
  {
    category: 'grammar-verbs', grammarRule: 'VERB-PRES-2', type: 'mc',
    prompt: "Vul aan: Он ___ по-русски. (hij spreekt Russisch — говорить)",
    correctAnswer: 'говорит',
    options: ['говорю', 'говоришь', 'говорит'],
    explanation:
      "'говорить' is een groep-2-werkwoord (и-vervoeging). Bij 'он/она' hoort de uitgang -ит: говорит. Let op het verschil met groep 1, waar bij 'он/она' -ет hoort."
  },
  {
    category: 'grammar-verbs', grammarRule: 'VERB-PRES-2', type: 'mc',
    prompt: "Vul aan: Мы ___ русский язык. (wij leren Russisch — учить)",
    correctAnswer: 'учим',
    options: ['учим', 'учаем', 'учете'],
    explanation:
      "Bij 'мы' hoort bij groep-2-werkwoorden de uitgang -им: учить → учим. De uitgang -аем ('учаем') bestaat niet voor dit werkwoord — dat is de groep-1-uitgang, die hier niet van toepassing is omdat 'учить' op -ить eindigt."
  },

  // SOFT-HARD-SIGN
  {
    category: 'grammar-nouns', grammarRule: 'SOFT-HARD-SIGN', type: 'mc',
    prompt: "Welk woord voor 'deur' is correct gespeld?",
    correctAnswer: 'дверь',
    options: ['двер', 'дверь', 'дверъ'],
    explanation:
      "Zonder het zachte teken ь zou de voorafgaande medeklinker 'r' hard klinken en zou het woord onvolledig/fout gespeld zijn. Het harde teken ъ ('дверъ') wordt hier nooit gebruikt — dat teken komt alleen voor na voorvoegsels vóór een jotende klinker (е, ё, ю, я)."
  },

  // STRESS-VOWEL-REDUCTION
  {
    category: 'food', grammarRule: 'STRESS-VOWEL-REDUCTION', type: 'mc',
    prompt: "Hoe wordt de onbeklemtoonde 'o' in 'молоко' (melk) uitgesproken?",
    correctAnswer: "als een 'a'-klank",
    options: ["als een 'a'-klank", "als een korte 'o'-klank", "helemaal niet"],
    explanation:
      "Door akanje (onbeklemtoonde-o-reductie) klinkt een onbeklemtoonde 'o' in het Russisch bijna altijd als 'a'. 'молоко' wordt dus uitgesproken als [malakó]: de eerste twee o's zijn onbeklemtoond en klinken als 'a', alleen de laatste (beklemtoonde) o blijft een volle o-klank."
  },

  // PERSONAL-PRONOUNS-CASE
  {
    category: 'grammar-nouns', grammarRule: 'PERSONAL-PRONOUNS-CASE', type: 'mc',
    prompt: "Vul aan: Она видит ___. (zij ziet hem — он)",
    correctAnswer: 'его',
    options: ['он', 'его', 'ему'],
    explanation:
      "Als lijdend voorwerp wordt 'он' onregelmatig 'его'. Persoonlijke voornaamwoorden volgen geen vaste naamvalsuitgang zoals zelfstandige naamwoorden en moeten apart geleerd worden."
  },

  // CASE-GEN
  {
    category: 'grammar-cases', grammarRule: 'CASE-GEN', type: 'mc',
    prompt: "Vul aan: У меня нет ___. (ik heb geen boek — книга)",
    correctAnswer: 'книги',
    options: ['книга', 'книгу', 'книги'],
    explanation:
      "Na 'нет' (er is geen) gebruik je altijd de genitief, nooit de nominatief of accusatief. 'книга' is vrouwelijk op -а, dus wordt dat in de genitief -и: книги. De fout 'книгу' komt vaak voort uit verwarring met de accusatief, maar 'нет' vraagt specifiek om de genitief."
  },
  {
    category: 'grammar-cases', grammarRule: 'CASE-GEN', type: 'mc',
    prompt: "Vul aan: Это дом ___. (dit is het huis van vader — папа)",
    correctAnswer: 'папы',
    options: ['папа', 'папы', 'папе'],
    explanation:
      "Om bezit uit te drukken ('van iemand') gebruik je de genitief. Mannelijke woorden op -а (zoals папа, die als een 'vrouwelijk' woord verbuigt ondanks het mannelijke geslacht) krijgen in de genitief de uitgang -ы: папа → папы."
  },

  // CASE-DAT
  {
    category: 'grammar-cases', grammarRule: 'CASE-DAT', type: 'mc',
    prompt: "Vul aan: Я дарю подарок ___. (ik geef een cadeau aan een vriend — друг)",
    correctAnswer: 'другу',
    options: ['друг', 'друга', 'другу'],
    explanation:
      "'друг' is hier het meewerkend voorwerp (aan wie geef je het cadeau?), dus gebruik je de datief. Mannelijke woorden op een medeklinker krijgen in de datief de uitgang -у: друг → другу."
  },
  {
    category: 'grammar-cases', grammarRule: 'CASE-DAT', type: 'mc',
    prompt: "Vul aan: ___ 25 лет. (moeder is 25 — мама, bij leeftijd gebruik je de datief van de persoon)",
    correctAnswer: 'Маме',
    options: ['Мама', 'Маму', 'Маме'],
    explanation:
      "Bij leeftijd gebruikt het Russisch een vaste constructie met de datief: 'Мне 30 лет' (ik ben 30, letterlijk 'aan mij 30 jaar'). 'мама' krijgt daarom de datiefuitgang -е: маме."
  },

  // CASE-INST
  {
    category: 'grammar-cases', grammarRule: 'CASE-INST', type: 'mc',
    prompt: "Vul aan: Я пишу ___. (ik schrijf met een pen — ручка)",
    correctAnswer: 'ручкой',
    options: ['ручка', 'ручку', 'ручкой'],
    explanation:
      "Om aan te geven waarmee iets gebeurt ('met'), gebruik je de instrumentalis. Vrouwelijke woorden op -а krijgen in de instrumentalis de uitgang -ой: ручка → ручкой."
  },
  {
    category: 'grammar-cases', grammarRule: 'CASE-INST', type: 'mc',
    prompt: "Vul aan: Он был ___. (hij was arts — врач)",
    correctAnswer: 'врачом',
    options: ['врач', 'врача', 'врачом'],
    explanation:
      "Na een vorm van быть (zijn) in de verleden of toekomende tijd gebruik je voor het beroep de instrumentalis, niet de nominatief. Mannelijke woorden op een medeklinker krijgen -ом: врач → врачом."
  },

  // CASE-PREP
  {
    category: 'grammar-cases', grammarRule: 'CASE-PREP', type: 'mc',
    prompt: "Vul aan: Я живу в ___. (ik woon in de stad — город)",
    correctAnswer: 'городе',
    options: ['город', 'города', 'городе'],
    explanation:
      "Na het voorzetsel 'в' (in, plaats) gebruik je de prepositief. Deze naamval komt nooit zelfstandig voor, alleen samen met een voorzetsel als в of на. Mannelijke woorden krijgen in de prepositief de uitgang -е: город → городе."
  },

  // ADJ-AGREEMENT
  {
    category: 'grammar-adjectives', grammarRule: 'ADJ-AGREEMENT', type: 'mc',
    prompt: "Vul aan: ___ книга (een nieuw boek — новый)",
    correctAnswer: 'новая',
    options: ['новый', 'новая', 'новое'],
    explanation:
      "'книга' is vrouwelijk, dus moet het bijvoeglijk naamwoord ook de vrouwelijke uitgang krijgen: -ая. 'новый' is de mannelijke vorm en hoort dus niet bij 'книга'. Een bijvoeglijk naamwoord moet altijd in geslacht overeenkomen met het zelfstandig naamwoord dat het beschrijft."
  },
  {
    category: 'grammar-adjectives', grammarRule: 'ADJ-AGREEMENT', type: 'mc',
    prompt: "Vul aan: ___ окно (een groot raam — большой)",
    correctAnswer: 'большое',
    options: ['большой', 'большая', 'большое'],
    explanation:
      "'окно' is onzijdig, dus krijgt het bijvoeglijk naamwoord de onzijdige uitgang -ое: большое. De mannelijke vorm 'большой' zou hier fout zijn, ook al lijkt die qua uitgang op wat je zou verwachten."
  },
  {
    category: 'grammar-adjectives', grammarRule: 'ADJ-AGREEMENT', type: 'mc',
    prompt: "Vul aan: ___ столы (nieuwe tafels — новый, meervoud)",
    correctAnswer: 'новые',
    options: ['новый', 'новая', 'новые'],
    explanation:
      "In het meervoud krijgen bijvoeglijke naamwoorden voor alle geslachten dezelfde uitgang: -ые (of -ие na г,к,х,ж,ч,ш,щ). 'столы' is meervoud, dus wordt het 'новые столы', ongeacht dat 'стол' oorspronkelijk mannelijk is."
  },

  // VERB-PAST
  {
    category: 'grammar-tense', grammarRule: 'VERB-PAST', type: 'mc',
    prompt: "Vul aan (vrouwelijke spreker): Вчера я ___ телевизор. (gisteren keek ik tv — смотреть)",
    correctAnswer: 'смотрела',
    options: ['смотрел', 'смотрела', 'смотрю'],
    explanation:
      "In de verleden tijd bepaalt het geslacht van het onderwerp de uitgang, niet de persoon. Bij een vrouwelijke spreker ('я' = een vrouw) hoort de uitgang -ла: смотрела. 'смотрел' is de mannelijke vorm en 'смотрю' is de tegenwoordige tijd, die hier niet past bij 'вчера' (gisteren)."
  },
  {
    category: 'grammar-tense', grammarRule: 'VERB-PAST', type: 'mc',
    prompt: "Vul aan: Мы ___ фильм. (wij keken een film — смотреть, meervoud)",
    correctAnswer: 'смотрели',
    options: ['смотрел', 'смотрели', 'смотрит'],
    explanation:
      "Bij een meervoudig onderwerp ('мы') krijgt de verleden tijd altijd de uitgang -ли, ongeacht het geslacht van de personen: смотрели."
  },

  // VERB-FUTURE
  {
    category: 'grammar-tense', grammarRule: 'VERB-FUTURE', type: 'mc',
    prompt: "Vul aan: Завтра я ___ фильм. (morgen ga ik een film kijken — смотреть, onvoltooid)",
    correctAnswer: 'буду смотреть',
    options: ['буду смотреть', 'смотрел', 'смотрю'],
    explanation:
      "Voor de toekomende tijd van een onvoltooid werkwoord gebruik je de vervoegde vorm van быть (hier: буду bij 'я') plus de infinitief: буду смотреть. 'смотрю' is tegenwoordige tijd en past niet bij 'завтра' (morgen)."
  },

  // ASPECT-INTRO
  {
    category: 'grammar-tense', grammarRule: 'ASPECT-INTRO', type: 'mc',
    prompt: "Welke zin benadrukt dat het boek helemaal uit is (een afgerond resultaat)?",
    correctAnswer: 'Я прочитал книгу.',
    options: ['Я читал книгу.', 'Я прочитал книгу.', 'Я читаю книгу.'],
    explanation:
      "'прочитать' is het voltooide aspect van 'читать' en benadrukt dat de handeling is afgerond met een resultaat: het boek is uitgelezen. 'Я читал книгу' (onvoltooid) beschrijft alleen dat je bezig was met lezen, zonder te zeggen of je klaar bent."
  },

  // NEGATION-NE
  {
    category: 'grammar-questions-negation', grammarRule: 'NEGATION-NE', type: 'mc',
    prompt: "Hoe zeg je 'ik weet niets' correct in het Russisch?",
    correctAnswer: 'Я ничего не знаю.',
    options: ['Я ничего знаю.', 'Я ничего не знаю.', 'Я не ничего знаю.'],
    explanation:
      "In het Russisch is dubbele ontkenning verplicht: naast het ontkennende woord 'ничего' (niets) moet er ook 'не' vóór het werkwoord staan. 'Я ничего знаю' mist het 'не' bij het werkwoord en is daarom fout, ook al zou je vanuit het Nederlands verwachten dat één ontkennend woord genoeg is."
  },
  {
    category: 'grammar-questions-negation', grammarRule: 'NEGATION-NE', type: 'mc',
    prompt: "Hoe ontken je: Я говорю по-русски. (ik spreek Russisch)?",
    correctAnswer: 'Я не говорю по-русски.',
    options: ['Я не говорю по-русски.', 'Я говорю не по-русски.', 'Не я говорю по-русски.'],
    explanation:
      "Om de hele zin te ontkennen (ik spreek geen Russisch) plaats je 'не' direct vóór het werkwoord: Я не говорю по-русски. Zou je 'не' voor 'по-русски' zetten, dan ontken je alleen dat woord specifiek ('ik spreek, maar niet in het Russisch'), wat een andere betekenis geeft."
  },

  // QUESTION-INTONATION
  {
    category: 'grammar-questions-negation', grammarRule: 'QUESTION-INTONATION', type: 'mc',
    prompt: "Hoe maak je van 'Ты говоришь по-русски.' een ja/nee-vraag?",
    correctAnswer: 'Ты говоришь по-русски?',
    options: ['Говоришь ты по-русски?', 'Ты говоришь по-русски?', 'До ты говоришь по-русски?'],
    explanation:
      "In het Russisch verandert de woordvolgorde niet bij een ja/nee-vraag zoals in het Nederlands ('spreek je...?'). Je gebruikt exact dezelfde woordvolgorde als de mededeling en maakt er met stijgende intonatie (en een vraagteken in geschreven tekst) een vraag van: Ты говоришь по-русски?"
  },

  // COMPARATIVE-SUPERLATIVE
  {
    category: 'grammar-comparatives', grammarRule: 'COMPARATIVE-SUPERLATIVE', type: 'mc',
    prompt: "Wat is de vergrotende trap van быстрый (snel)?",
    correctAnswer: 'быстрее',
    options: ['быстрее', 'самый быстрый', 'быстрый'],
    explanation:
      "De vergrotende trap vorm je meestal door -ее achter de stam te plakken: быстрый (snel) → быстрее (sneller). 'самый быстрый' is de overtreffende trap (de snelste)."
  },
  {
    category: 'grammar-comparatives', grammarRule: 'COMPARATIVE-SUPERLATIVE', type: 'mc',
    prompt: "Wat betekent 'лучше'?",
    correctAnswer: 'beter',
    options: ['beter', 'goed', 'de beste'],
    explanation:
      "'лучше' is de onregelmatige vergrotende trap van хороший (goed): хороший → лучше (beter). Deze vorm moet je apart leren, want hij volgt niet het gewone -ее-patroon."
  },
  {
    category: 'grammar-comparatives', grammarRule: 'COMPARATIVE-SUPERLATIVE', type: 'mc',
    prompt: "Hoe zeg je 'de snelste' in het Russisch?",
    correctAnswer: 'самый быстрый',
    options: ['быстрее', 'самый быстрый', 'быстрее всех'],
    explanation:
      "De overtreffende trap vorm je meestal met самый + het gewone bijvoeglijk naamwoord: самый быстрый (de snelste)."
  },

  // REFLEXIVE-VERBS
  {
    category: 'grammar-reflexive', grammarRule: 'REFLEXIVE-VERBS', type: 'mc',
    prompt: "Vul aan: Я ___ каждое утро. (ik was me elke ochtend — мыться)",
    correctAnswer: 'моюсь',
    options: ['моюсь', 'моется', 'моешься'],
    explanation:
      "Bij 'я' krijgt het werkwoord de normale vervoeging (мою) plus het achtervoegsel -сь na een klinker: моюсь. Het achtervoegsel -ся/-сь verandert niet mee met de persoon, alleen het stamdeel ervoor."
  },
  {
    category: 'grammar-reflexive', grammarRule: 'REFLEXIVE-VERBS', type: 'mc',
    prompt: "Welk achtervoegsel hoort bij een wederkerend werkwoord na een medeklinker, zoals bij 'он моет...'?",
    correctAnswer: '-ся',
    options: ['-ся', '-сь', '-ла'],
    explanation:
      "Na een medeklinker gebruik je -ся: он моется (hij wast zich). Na een klinker gebruik je -сь, zoals in я моюсь (ik was me)."
  },
  {
    category: 'grammar-reflexive', grammarRule: 'REFLEXIVE-VERBS', type: 'mc',
    prompt: "Wat betekent 'учиться'?",
    correctAnswer: 'leren / studeren',
    options: ['leren / studeren', 'onderwijzen', 'lezen'],
    explanation:
      "'учиться' is het wederkerende werkwoord voor 'leren/studeren' (zelf leren), terwijl 'учить' (zonder -ся) 'onderwijzen' of 'iets uit het hoofd leren' betekent."
  }
];
