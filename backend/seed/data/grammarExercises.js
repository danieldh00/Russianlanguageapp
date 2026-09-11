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
  }
];
