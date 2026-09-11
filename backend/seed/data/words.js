// grammarRule is optional and references a grammar_rules.code
module.exports = [
  // --- alphabet: false-friend letters & pronunciation ---
  { category: 'alphabet', russian: 'В в', transliteration: 'V v', translation_nl: "klinkt als 'v' (niet als 'b')", notes: "Lijkt op de Latijnse B, maar klinkt als 'v': вода = voda." },
  { category: 'alphabet', russian: 'Р р', transliteration: 'R r', translation_nl: "klinkt als een rollende 'r' (niet als 'p')", notes: "Lijkt op de Latijnse P, maar is een rollende 'r': русский." },
  { category: 'alphabet', russian: 'С с', transliteration: 'S s', translation_nl: "klinkt als 's' (niet als 'c')", notes: "Lijkt op de Latijnse C, maar klinkt als 's': спасибо." },
  { category: 'alphabet', russian: 'Н н', transliteration: 'N n', translation_nl: "klinkt als 'n' (niet als 'h')", notes: "Lijkt op de Latijnse H, maar klinkt als 'n': нет." },
  { category: 'alphabet', russian: 'У у', transliteration: 'U u', translation_nl: "klinkt als 'oe' (niet als 'y')", notes: "Lijkt op de Latijnse Y, maar klinkt als 'oe': улица." },
  { category: 'alphabet', russian: 'Х х', transliteration: 'Kh kh', translation_nl: "klinkt als een schrapende 'ch' (niet als 'x')", notes: "Lijkt op de Latijnse X, maar klinkt als de 'ch' in 'lach': хорошо.", grammarRule: 'STRESS-VOWEL-REDUCTION' },
  { category: 'alphabet', russian: 'Ё ё', transliteration: 'Yo yo', translation_nl: "klinkt als 'jo', altijd beklemtoond", notes: "De stip op de ё wordt vaak weggelaten in geschreven tekst, maar de klank blijft 'jo': мёд." },
  { category: 'alphabet', russian: 'Ы ы', transliteration: 'Y y', translation_nl: "harde 'i'-klank, uniek voor het Russisch", notes: "Klinkt niet als de Nederlandse 'y', maar als een donkere 'i' achter in de mond: мы, ты." },

  // --- greetings ---
  { category: 'greetings', russian: 'Привет', transliteration: 'Privet', translation_nl: 'hoi / hallo (informeel)' },
  { category: 'greetings', russian: 'Здравствуйте', transliteration: 'Zdravstvuyte', translation_nl: 'hallo / goedendag (formeel)' },
  { category: 'greetings', russian: 'Пока', transliteration: 'Poka', translation_nl: 'doei (informeel)' },
  { category: 'greetings', russian: 'До свидания', transliteration: 'Do svidaniya', translation_nl: 'tot ziens (formeel)' },
  { category: 'greetings', russian: 'Спасибо', transliteration: 'Spasibo', translation_nl: 'dank je / dank u' },
  { category: 'greetings', russian: 'Пожалуйста', transliteration: 'Pozhaluysta', translation_nl: 'alsjeblieft / graag gedaan' },
  { category: 'greetings', russian: 'Да', transliteration: 'Da', translation_nl: 'ja' },
  { category: 'greetings', russian: 'Нет', transliteration: 'Net', translation_nl: 'nee' },
  { category: 'greetings', russian: 'Извините', transliteration: 'Izvinite', translation_nl: 'sorry / pardon' },
  { category: 'greetings', russian: 'Как дела?', transliteration: 'Kak dela?', translation_nl: 'hoe gaat het?' },

  // --- numbers ---
  { category: 'numbers', russian: 'один', transliteration: 'odin', translation_nl: 'een (1)' },
  { category: 'numbers', russian: 'два', transliteration: 'dva', translation_nl: 'twee (2)' },
  { category: 'numbers', russian: 'три', transliteration: 'tri', translation_nl: 'drie (3)' },
  { category: 'numbers', russian: 'четыре', transliteration: 'chetyre', translation_nl: 'vier (4)' },
  { category: 'numbers', russian: 'пять', transliteration: 'pyat', translation_nl: 'vijf (5)' },
  { category: 'numbers', russian: 'шесть', transliteration: 'shest', translation_nl: 'zes (6)' },
  { category: 'numbers', russian: 'семь', transliteration: 'sem', translation_nl: 'zeven (7)' },
  { category: 'numbers', russian: 'восемь', transliteration: 'vosem', translation_nl: 'acht (8)' },
  { category: 'numbers', russian: 'девять', transliteration: 'devyat', translation_nl: 'negen (9)' },
  { category: 'numbers', russian: 'десять', transliteration: 'desyat', translation_nl: 'tien (10)' },

  // --- colors ---
  { category: 'colors', russian: 'красный', transliteration: 'krasnyy', translation_nl: 'rood' },
  { category: 'colors', russian: 'синий', transliteration: 'siniy', translation_nl: 'blauw' },
  { category: 'colors', russian: 'зелёный', transliteration: 'zelyonyy', translation_nl: 'groen' },
  { category: 'colors', russian: 'жёлтый', transliteration: 'zholtyy', translation_nl: 'geel' },
  { category: 'colors', russian: 'чёрный', transliteration: 'chyornyy', translation_nl: 'zwart' },
  { category: 'colors', russian: 'белый', transliteration: 'belyy', translation_nl: 'wit' },
  { category: 'colors', russian: 'оранжевый', transliteration: 'oranzhevyy', translation_nl: 'oranje' },

  // --- family ---
  { category: 'family', russian: 'мама', transliteration: 'mama', translation_nl: 'moeder', gender: 'v', grammarRule: 'GEN-NOUN' },
  { category: 'family', russian: 'папа', transliteration: 'papa', translation_nl: 'vader', gender: 'm', notes: "Let op: eindigt op -а maar is toch mannelijk (natuurlijk geslacht wint van de uitgang)." },
  { category: 'family', russian: 'брат', transliteration: 'brat', translation_nl: 'broer', gender: 'm' },
  { category: 'family', russian: 'сестра', transliteration: 'sestra', translation_nl: 'zus', gender: 'v' },
  { category: 'family', russian: 'сын', transliteration: 'syn', translation_nl: 'zoon', gender: 'm' },
  { category: 'family', russian: 'дочь', transliteration: 'doch', translation_nl: 'dochter', gender: 'v', grammarRule: 'SOFT-HARD-SIGN' },
  { category: 'family', russian: 'бабушка', transliteration: 'babushka', translation_nl: 'oma', gender: 'v' },
  { category: 'family', russian: 'дедушка', transliteration: 'dedushka', translation_nl: 'opa', gender: 'm', notes: "Eindigt op -а maar is mannelijk, net als папа." },

  // --- food ---
  { category: 'food', russian: 'хлеб', transliteration: 'khleb', translation_nl: 'brood', gender: 'm' },
  { category: 'food', russian: 'вода', transliteration: 'voda', translation_nl: 'water', gender: 'v' },
  { category: 'food', russian: 'чай', transliteration: 'chay', translation_nl: 'thee', gender: 'm' },
  { category: 'food', russian: 'кофе', transliteration: 'kofe', translation_nl: 'koffie', gender: 'o', notes: "Uitzondering: кофе klinkt als onzijdig maar wordt traditioneel als mannelijk behandeld." },
  { category: 'food', russian: 'молоко', transliteration: 'moloko', translation_nl: 'melk', gender: 'o', grammarRule: 'STRESS-VOWEL-REDUCTION' },
  { category: 'food', russian: 'яблоко', transliteration: 'yabloko', translation_nl: 'appel', gender: 'o' },
  { category: 'food', russian: 'суп', transliteration: 'sup', translation_nl: 'soep', gender: 'm' },

  // --- grammar-verbs vocabulary (infinitives used in exercises) ---
  { category: 'grammar-verbs', russian: 'читать', transliteration: 'chitat', translation_nl: 'lezen', grammarRule: 'VERB-PRES-1' },
  { category: 'grammar-verbs', russian: 'говорить', transliteration: 'govorit', translation_nl: 'spreken', grammarRule: 'VERB-PRES-2' },
  { category: 'grammar-verbs', russian: 'работать', transliteration: 'rabotat', translation_nl: 'werken', grammarRule: 'VERB-PRES-1' },
  { category: 'grammar-verbs', russian: 'учить', transliteration: 'uchit', translation_nl: 'leren', grammarRule: 'VERB-PRES-2' },
  { category: 'grammar-verbs', russian: 'знать', transliteration: 'znat', translation_nl: 'weten', grammarRule: 'VERB-PRES-1' },

  // --- grammar-nouns vocabulary ---
  { category: 'grammar-nouns', russian: 'книга', transliteration: 'kniga', translation_nl: 'boek', gender: 'v', grammarRule: 'CASE-NOM-ACC' },
  { category: 'grammar-nouns', russian: 'стол', transliteration: 'stol', translation_nl: 'tafel', gender: 'm', grammarRule: 'PLURAL-NOUN' },
  { category: 'grammar-nouns', russian: 'окно', transliteration: 'okno', translation_nl: 'raam', gender: 'o', grammarRule: 'PLURAL-NOUN' },
  { category: 'grammar-nouns', russian: 'дверь', transliteration: 'dver', translation_nl: 'deur', gender: 'v', grammarRule: 'SOFT-HARD-SIGN' }
];
