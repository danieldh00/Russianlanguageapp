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
  { category: 'grammar-nouns', russian: 'дверь', transliteration: 'dver', translation_nl: 'deur', gender: 'v', grammarRule: 'SOFT-HARD-SIGN' },

  // --- numbers-large ---
  { category: 'numbers-large', russian: 'одиннадцать', transliteration: 'odinnadtsat', translation_nl: 'elf (11)' },
  { category: 'numbers-large', russian: 'двенадцать', transliteration: 'dvenadtsat', translation_nl: 'twaalf (12)' },
  { category: 'numbers-large', russian: 'пятнадцать', transliteration: 'pyatnadtsat', translation_nl: 'vijftien (15)' },
  { category: 'numbers-large', russian: 'двадцать', transliteration: 'dvadtsat', translation_nl: 'twintig (20)' },
  { category: 'numbers-large', russian: 'тридцать', transliteration: 'tridtsat', translation_nl: 'dertig (30)' },
  { category: 'numbers-large', russian: 'сорок', transliteration: 'sorok', translation_nl: 'veertig (40)' },
  { category: 'numbers-large', russian: 'пятьдесят', transliteration: 'pyatdesyat', translation_nl: 'vijftig (50)' },
  { category: 'numbers-large', russian: 'семьдесят', transliteration: 'semdesyat', translation_nl: 'zeventig (70)' },
  { category: 'numbers-large', russian: 'девяносто', transliteration: 'devyanosto', translation_nl: 'negentig (90)' },
  { category: 'numbers-large', russian: 'сто', transliteration: 'sto', translation_nl: 'honderd (100)' },

  // --- time ---
  { category: 'time', russian: 'сегодня', transliteration: 'segodnya', translation_nl: 'vandaag' },
  { category: 'time', russian: 'завтра', transliteration: 'zavtra', translation_nl: 'morgen' },
  { category: 'time', russian: 'вчера', transliteration: 'vchera', translation_nl: 'gisteren' },
  { category: 'time', russian: 'утро', transliteration: 'utro', translation_nl: 'ochtend', gender: 'o' },
  { category: 'time', russian: 'вечер', transliteration: 'vecher', translation_nl: 'avond', gender: 'm' },
  { category: 'time', russian: 'ночь', transliteration: 'noch', translation_nl: 'nacht', gender: 'v', grammarRule: 'SOFT-HARD-SIGN' },
  { category: 'time', russian: 'неделя', transliteration: 'nedelya', translation_nl: 'week', gender: 'v' },
  { category: 'time', russian: 'понедельник', transliteration: 'ponedelnik', translation_nl: 'maandag', gender: 'm' },
  { category: 'time', russian: 'вторник', transliteration: 'vtornik', translation_nl: 'dinsdag', gender: 'm' },
  { category: 'time', russian: 'среда', transliteration: 'sreda', translation_nl: 'woensdag', gender: 'v' },
  { category: 'time', russian: 'четверг', transliteration: 'chetverg', translation_nl: 'donderdag', gender: 'm' },
  { category: 'time', russian: 'пятница', transliteration: 'pyatnitsa', translation_nl: 'vrijdag', gender: 'v' },
  { category: 'time', russian: 'суббота', transliteration: 'subbota', translation_nl: 'zaterdag', gender: 'v' },
  { category: 'time', russian: 'воскресенье', transliteration: 'voskresenye', translation_nl: 'zondag', gender: 'o' },

  // --- body ---
  { category: 'body', russian: 'голова', transliteration: 'golova', translation_nl: 'hoofd', gender: 'v' },
  { category: 'body', russian: 'рука', transliteration: 'ruka', translation_nl: 'hand / arm', gender: 'v' },
  { category: 'body', russian: 'нога', transliteration: 'noga', translation_nl: 'been / voet', gender: 'v' },
  { category: 'body', russian: 'глаз', transliteration: 'glaz', translation_nl: 'oog', gender: 'm' },
  { category: 'body', russian: 'рот', transliteration: 'rot', translation_nl: 'mond', gender: 'm' },
  { category: 'body', russian: 'ухо', transliteration: 'ukho', translation_nl: 'oor', gender: 'o' },
  { category: 'body', russian: 'живот', transliteration: 'zhivot', translation_nl: 'buik', gender: 'm' },
  { category: 'body', russian: 'сердце', transliteration: 'serdtse', translation_nl: 'hart', gender: 'o' },
  { category: 'body', russian: 'спина', transliteration: 'spina', translation_nl: 'rug', gender: 'v' },
  { category: 'body', russian: 'палец', transliteration: 'palets', translation_nl: 'vinger', gender: 'm' },

  // --- clothing ---
  { category: 'clothing', russian: 'рубашка', transliteration: 'rubashka', translation_nl: 'overhemd', gender: 'v' },
  { category: 'clothing', russian: 'брюки', transliteration: 'bryuki', translation_nl: 'broek', gender: 'mv' },
  { category: 'clothing', russian: 'платье', transliteration: 'plate', translation_nl: 'jurk', gender: 'o' },
  { category: 'clothing', russian: 'туфли', transliteration: 'tufli', translation_nl: 'schoenen', gender: 'mv' },
  { category: 'clothing', russian: 'куртка', transliteration: 'kurtka', translation_nl: 'jas', gender: 'v' },
  { category: 'clothing', russian: 'шапка', transliteration: 'shapka', translation_nl: 'muts', gender: 'v' },
  { category: 'clothing', russian: 'носки', transliteration: 'noski', translation_nl: 'sokken', gender: 'mv' },
  { category: 'clothing', russian: 'пальто', transliteration: 'palto', translation_nl: 'winterjas', gender: 'o', notes: "Onverbuigbaar leenwoord: 'пальто' verandert nooit van vorm, in geen enkele naamval of getal." },

  // --- weather ---
  { category: 'weather', russian: 'погода', transliteration: 'pogoda', translation_nl: 'weer', gender: 'v' },
  { category: 'weather', russian: 'солнце', transliteration: 'solntse', translation_nl: 'zon', gender: 'o' },
  { category: 'weather', russian: 'дождь', transliteration: 'dozhd', translation_nl: 'regen', gender: 'm' },
  { category: 'weather', russian: 'снег', transliteration: 'sneg', translation_nl: 'sneeuw', gender: 'm' },
  { category: 'weather', russian: 'ветер', transliteration: 'veter', translation_nl: 'wind', gender: 'm' },
  { category: 'weather', russian: 'облако', transliteration: 'oblako', translation_nl: 'wolk', gender: 'o' },
  { category: 'weather', russian: 'жарко', transliteration: 'zharko', translation_nl: 'heet (bijwoord)' },
  { category: 'weather', russian: 'холодно', transliteration: 'kholodno', translation_nl: 'koud (bijwoord)' },

  // --- house ---
  { category: 'house', russian: 'дом', transliteration: 'dom', translation_nl: 'huis', gender: 'm' },
  { category: 'house', russian: 'квартира', transliteration: 'kvartira', translation_nl: 'appartement', gender: 'v' },
  { category: 'house', russian: 'комната', transliteration: 'komnata', translation_nl: 'kamer', gender: 'v' },
  { category: 'house', russian: 'кухня', transliteration: 'kukhnya', translation_nl: 'keuken', gender: 'v' },
  { category: 'house', russian: 'ванная', transliteration: 'vannaya', translation_nl: 'badkamer', gender: 'v' },
  { category: 'house', russian: 'спальня', transliteration: 'spalnya', translation_nl: 'slaapkamer', gender: 'v' },
  { category: 'house', russian: 'гостиная', transliteration: 'gostinaya', translation_nl: 'woonkamer', gender: 'v' },
  { category: 'house', russian: 'сад', transliteration: 'sad', translation_nl: 'tuin', gender: 'm' },

  // --- professions ---
  { category: 'professions', russian: 'врач', transliteration: 'vrach', translation_nl: 'arts', gender: 'm', grammarRule: 'CASE-INST' },
  { category: 'professions', russian: 'учитель', transliteration: 'uchitel', translation_nl: 'leraar', gender: 'm' },
  { category: 'professions', russian: 'инженер', transliteration: 'inzhener', translation_nl: 'ingenieur', gender: 'm' },
  { category: 'professions', russian: 'студент', transliteration: 'student', translation_nl: 'student', gender: 'm' },
  { category: 'professions', russian: 'продавец', transliteration: 'prodavets', translation_nl: 'verkoper', gender: 'm' },
  { category: 'professions', russian: 'водитель', transliteration: 'voditel', translation_nl: 'chauffeur', gender: 'm' },
  { category: 'professions', russian: 'повар', transliteration: 'povar', translation_nl: 'kok', gender: 'm' },
  { category: 'professions', russian: 'полицейский', transliteration: 'politseyskiy', translation_nl: 'politieagent', gender: 'm' },

  // --- travel ---
  { category: 'travel', russian: 'вокзал', transliteration: 'vokzal', translation_nl: 'station', gender: 'm' },
  { category: 'travel', russian: 'аэропорт', transliteration: 'aeroport', translation_nl: 'luchthaven', gender: 'm' },
  { category: 'travel', russian: 'поезд', transliteration: 'poyezd', translation_nl: 'trein', gender: 'm' },
  { category: 'travel', russian: 'самолёт', transliteration: 'samolyot', translation_nl: 'vliegtuig', gender: 'm' },
  { category: 'travel', russian: 'билет', transliteration: 'bilet', translation_nl: 'kaartje', gender: 'm' },
  { category: 'travel', russian: 'паспорт', transliteration: 'pasport', translation_nl: 'paspoort', gender: 'm' },
  { category: 'travel', russian: 'багаж', transliteration: 'bagazh', translation_nl: 'bagage', gender: 'm' },
  { category: 'travel', russian: 'гостиница', transliteration: 'gostinitsa', translation_nl: 'hotel', gender: 'v' },

  // --- adjectives ---
  { category: 'adjectives', russian: 'большой', transliteration: 'bolshoy', translation_nl: 'groot', grammarRule: 'ADJ-AGREEMENT' },
  { category: 'adjectives', russian: 'маленький', transliteration: 'malenkiy', translation_nl: 'klein', grammarRule: 'ADJ-AGREEMENT' },
  { category: 'adjectives', russian: 'хороший', transliteration: 'khoroshiy', translation_nl: 'goed' },
  { category: 'adjectives', russian: 'плохой', transliteration: 'plokhoy', translation_nl: 'slecht' },
  { category: 'adjectives', russian: 'новый', transliteration: 'novyy', translation_nl: 'nieuw', grammarRule: 'ADJ-AGREEMENT' },
  { category: 'adjectives', russian: 'старый', transliteration: 'staryy', translation_nl: 'oud' },
  { category: 'adjectives', russian: 'красивый', transliteration: 'krasivyy', translation_nl: 'mooi' },
  { category: 'adjectives', russian: 'интересный', transliteration: 'interesnyy', translation_nl: 'interessant' },
  { category: 'adjectives', russian: 'быстрый', transliteration: 'bystryy', translation_nl: 'snel' },
  { category: 'adjectives', russian: 'медленный', transliteration: 'medlennyy', translation_nl: 'langzaam' },

  // --- questions ---
  { category: 'questions', russian: 'что', transliteration: 'chto', translation_nl: 'wat' },
  { category: 'questions', russian: 'кто', transliteration: 'kto', translation_nl: 'wie' },
  { category: 'questions', russian: 'где', transliteration: 'gde', translation_nl: 'waar' },
  { category: 'questions', russian: 'когда', transliteration: 'kogda', translation_nl: 'wanneer' },
  { category: 'questions', russian: 'почему', transliteration: 'pochemu', translation_nl: 'waarom' },
  { category: 'questions', russian: 'как', transliteration: 'kak', translation_nl: 'hoe' },
  { category: 'questions', russian: 'сколько', transliteration: 'skolko', translation_nl: 'hoeveel' },
  { category: 'questions', russian: 'какой', transliteration: 'kakoy', translation_nl: 'welke / wat voor een' },

  // --- verbs-common ---
  { category: 'verbs-common', russian: 'идти', transliteration: 'idti', translation_nl: 'lopen / gaan (te voet)' },
  { category: 'verbs-common', russian: 'есть', transliteration: 'yest', translation_nl: 'eten' },
  { category: 'verbs-common', russian: 'пить', transliteration: 'pit', translation_nl: 'drinken' },
  { category: 'verbs-common', russian: 'любить', transliteration: 'lyubit', translation_nl: 'houden van', grammarRule: 'VERB-PRES-2' },
  { category: 'verbs-common', russian: 'хотеть', transliteration: 'khotet', translation_nl: 'willen', notes: "Onregelmatig werkwoord: я хочу, ты хочешь, он хочет, мы хотим, вы хотите, они хотят." },
  { category: 'verbs-common', russian: 'мочь', transliteration: 'moch', translation_nl: 'kunnen', notes: "Onregelmatig werkwoord: я могу, ты можешь, он может, мы можем, вы можете, они могут." },
  { category: 'verbs-common', russian: 'видеть', transliteration: 'videt', translation_nl: 'zien', grammarRule: 'VERB-PRES-2' },
  { category: 'verbs-common', russian: 'слышать', transliteration: 'slyshat', translation_nl: 'horen', grammarRule: 'VERB-PRES-2' },
  { category: 'verbs-common', russian: 'давать', transliteration: 'davat', translation_nl: 'geven' },

  // --- grammar-cases vocabulary ---
  { category: 'grammar-cases', russian: 'ручка', transliteration: 'ruchka', translation_nl: 'pen', gender: 'v', grammarRule: 'CASE-INST' },
  { category: 'grammar-cases', russian: 'друг', transliteration: 'drug', translation_nl: 'vriend', gender: 'm', grammarRule: 'CASE-DAT' },
  { category: 'grammar-cases', russian: 'город', transliteration: 'gorod', translation_nl: 'stad', gender: 'm', grammarRule: 'CASE-PREP' },

  // --- grammar-tense vocabulary ---
  { category: 'grammar-tense', russian: 'смотреть', transliteration: 'smotret', translation_nl: 'kijken', grammarRule: 'VERB-PAST' },
  { category: 'grammar-tense', russian: 'прочитать', transliteration: 'prochitat', translation_nl: 'uitlezen (voltooid)', grammarRule: 'ASPECT-INTRO' },

  // --- grammar-questions-negation vocabulary ---
  { category: 'grammar-questions-negation', russian: 'ничего', transliteration: 'nichego', translation_nl: 'niets', grammarRule: 'NEGATION-NE' },
  { category: 'grammar-questions-negation', russian: 'никто', transliteration: 'nikto', translation_nl: 'niemand', grammarRule: 'NEGATION-NE' }
];
