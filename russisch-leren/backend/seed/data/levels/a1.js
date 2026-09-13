// A1 additions on top of the base A1 files (categories.js, words.js, ...).
// Completes the alphabet lesson: the base file only has the eight
// "false friend" letters; this adds the other 25 so the lesson covers all
// 33 letters, plus word-reading exercises where the trap is reading a
// Cyrillic word as if it were Latin (ресторан is not "pectopah").
//
// Letter entries are recognised by the seed by their "X x" shape and get
// letter-specific prompts ("Hoe klinkt de letter 'Ж ж'?" / "Welke letter
// klinkt als 'zj'?") without the transliteration, which would give the
// answer away. `translation_nl` always starts with "als" so both prompt
// directions read naturally.

const A = 'alphabet';

const words = [
  { category: A, russian: 'А а', transliteration: 'A a', translation_nl: "als 'a' in 'bad'", notes: "Beklemtoond een open 'a', onbeklemtoond korter en doffer: мама, банан." },
  { category: A, russian: 'Б б', transliteration: 'B b', translation_nl: "als 'b' in 'boek'", notes: "Dit is de échte b — niet В (dat is de v): банк, брат. Aan het woordeinde klinkt hij als 'p': хлеб = khlep." },
  { category: A, russian: 'Г г', transliteration: 'G g', translation_nl: "als de harde 'g' in het Engelse 'go'", notes: "Nooit de Nederlandse schraap-g. In de uitgangen -ого/-его klinkt hij als 'v': его = jevo, сегодня = sevodnja." },
  { category: A, russian: 'Д д', transliteration: 'D d', translation_nl: "als 'd' in 'dag'", notes: "Aan het woordeinde verstemloost hij tot 't': сад = sat, год = got." },
  { category: A, russian: 'Е е', transliteration: 'Ye ye', translation_nl: "als 'je' in 'jes' (na een medeklinker: zachte 'e')", notes: "Aan het begin en na een klinker hoor je de j: ем = jem. Na een medeklinker maakt hij die zacht: нет ≈ n'et." },
  { category: A, russian: 'Ж ж', transliteration: 'Zh zh', translation_nl: "als 'zj' (de j in het Franse 'journal')", notes: "Altijd hard, ook voor и: жить = zjyt'. Woorden: жена, журнал, можно." },
  { category: A, russian: 'З з', transliteration: 'Z z', translation_nl: "als een stemhebbende 'z' in 'zon'", notes: "Lijkt op het cijfer 3. Niet verwarren met Э (e): зима, звезда." },
  { category: A, russian: 'И и', transliteration: 'I i', translation_nl: "als 'ie' in 'ziek'", notes: "Lijkt op een gespiegelde N. Maakt de medeklinker ervoor zacht: они, кино." },
  { category: A, russian: 'Й й', transliteration: 'Y y', translation_nl: "als 'j' in 'jas' (een korte i)", notes: "Komt bijna altijd na een klinker: мой, чай, музей. Heet 'и краткое' (korte i)." },
  { category: A, russian: 'К к', transliteration: 'K k', translation_nl: "als 'k' in 'kat'", notes: "Zonder de uitademing van het Engels: кот, как, книга." },
  { category: A, russian: 'Л л', transliteration: 'L l', translation_nl: "als 'l' in 'lamp'", notes: "Lijkt op de Griekse lambda. Hard en donker, zoals de Engelse 'l' in 'ball': лампа, стол." },
  { category: A, russian: 'М м', transliteration: 'M m', translation_nl: "als 'm' in 'mama'", notes: "мама, Москва, дом." },
  { category: A, russian: 'О о', transliteration: 'O o', translation_nl: "als 'o' in 'boot' — maar alleen beklemtoond", notes: "Onbeklemtoond klinkt hij als een korte 'a': Москва = Maskva, молоко = malako (akanje).", grammarRule: 'STRESS-VOWEL-REDUCTION' },
  { category: A, russian: 'П п', transliteration: 'P p', translation_nl: "als 'p' in 'pen'", notes: "Lijkt op de Griekse pi. Dit is de échte p — Р is de r: папа, парк." },
  { category: A, russian: 'Т т', transliteration: 'T t', translation_nl: "als 't' in 'tas'", notes: "там, ты, стол. In handschrift lijkt de kleine т op een m." },
  { category: A, russian: 'Ф ф', transliteration: 'F f', translation_nl: "als 'f' in 'fiets'", notes: "Komt vooral voor in leenwoorden: телефон, кофе, фото." },
  { category: A, russian: 'Ц ц', transliteration: 'Ts ts', translation_nl: "als 'ts' in 'tsaar'", notes: "Altijd hard, ook voor и: цирк = tsyrk, отец, улица." },
  { category: A, russian: 'Ч ч', transliteration: 'Ch ch', translation_nl: "als 'tsj' in 'Tsjechië'", notes: "Altijd zacht: чай, час, очень. In что klinkt hij als 'sj': sjto." },
  { category: A, russian: 'Ш ш', transliteration: 'Sh sh', translation_nl: "als 'sj' in 'sjaal'", notes: "Altijd hard: школа, хорошо, шесть." },
  { category: A, russian: 'Щ щ', transliteration: 'Shch shch', translation_nl: "als een lange, zachte 'sjsj'", notes: "Zachter en langer dan Ш, met de tong naar voren: щи, борщ, ещё." },
  { category: A, russian: 'Ъ ъ', transliteration: '" (hard teken)', translation_nl: "als een stille scheiding (hard teken, houdt de medeklinker ervoor hard)", notes: "Staat tussen een voorvoegsel en е/ё/ю/я, zodat je de j duidelijk hoort: подъезд = pod-jezd, объект.", grammarRule: 'SOFT-HARD-SIGN' },
  { category: A, russian: 'Ь ь', transliteration: "' (zacht teken)", translation_nl: "als een stille verzachting (zacht teken, maakt de medeklinker ervoor zacht)", notes: "Heel vaak aan het woordeinde: дверь, день, мать. Zonder eigen klank, maar hoorbaar aan de zachte medeklinker.", grammarRule: 'SOFT-HARD-SIGN' },
  { category: A, russian: 'Э э', transliteration: 'E e', translation_nl: "als 'e' in 'bed' (zonder j)", notes: "Anders dan Е heeft Э nooit een j-klank: это, экран, поэт." },
  { category: A, russian: 'Ю ю', transliteration: 'Yu yu', translation_nl: "als 'joe' in 'Joeri'", notes: "юг, люблю, меню. Na een medeklinker: zachte medeklinker + 'oe'." },
  { category: A, russian: 'Я я', transliteration: 'Ya ya', translation_nl: "als 'ja' in 'jas'", notes: "Lijkt op een gespiegelde R. я = ik; яблоко, пять." }
];

// "Read this word" -- transliterate a whole word. The distractors are the
// classic beginner traps: reading В/Р/С/Н/У/Х as Latin B/P/C/H/Y/X, and
// mixing up Б/В, Ш/Щ, Ц/Ч, З/Э.
// Options are stored (and shown) in this order, so the correct answer is
// placed at a position derived from the word rather than always first.
function read(word, correct, distractors, meaning, note) {
  const options = [...distractors];
  options.splice(word.length % (distractors.length + 1), 0, correct);
  return {
    category: A, type: 'mc',
    prompt: `Hoe schrijf je '${word}' in Latijnse letters?`,
    correctAnswer: correct,
    options,
    explanation: `${word} = ${correct} (${meaning}). ${note}`
  };
}

const grammarExercises = [
  read('вода', 'voda', ['boda', 'vona', 'woda'], 'water', "В is een v, geen b; Д is een d."),
  read('нет', 'net', ['het', 'nem', 'pet'], 'nee', "Н lijkt op een H maar is een n."),
  read('спасибо', 'spasibo', ['cpacibo', 'spasido', 'snasibo'], 'dank je', "С is altijd een s, П een p, Б een b."),
  read('ресторан', 'restoran', ['pectopah', 'resporan', 'restopan'], 'restaurant', "De beruchte val: Р = r, С = s, Н = n — dus geen 'pectopah'."),
  read('хорошо', 'khorosho', ['xoposho', 'khoposho', 'khorocho'], 'goed', "Х = kh (schraap-ch), Р = r, Ш = sh."),
  read('улица', 'ulitsa', ['ylitsa', 'ulisa', 'unitsa'], 'straat', "У lijkt op een Y maar is 'oe'; Ц = ts."),
  read('сыр', 'syr', ['cyp', 'sir', 'syp'], 'kaas', "С = s, Ы = harde i (y), Р = r."),
  read('мёд', 'myod', ['med', 'mep', 'myob'], 'honing', "Ё = jo, Д = d (klinkt aan het eind als 't')."),
  read('Москва', 'Moskva', ['Mockba', 'Moskwa', 'Mosvka'], 'Moskou', "С = s, К = k, В = v. Je hoort 'Maskva' (akanje)."),
  read('банк', 'bank', ['vank', 'bahk', 'dank'], 'bank', "Б is de echte b; Н = n."),
  read('чай', 'chay', ['tsay', 'shay', 'chau'], 'thee', "Ч = ch (tsj), Й = korte j."),
  read('школа', 'shkola', ['wkola', 'shchkola', 'skola'], 'school', "Ш = sh (sj), Щ zou shch zijn."),
  read('центр', 'tsentr', ['centr', 'chentr', 'tsenpr'], 'centrum', "Ц = ts, Р = r — het lijkt op 'centr' maar klinkt als 'tsentr'."),
  read('друг', 'drug', ['dpyr', 'drut', 'dryg'], 'vriend', "Р = r, У = oe, Г = g. Lees je het als Latijn, krijg je 'dpyr' — en dat bestaat niet."),
  read('это', 'eto', ['ezo', 'ito', 'emo'], 'dit / dat', "Э = e zonder j, Т = t."),
  read('жена', 'zhena', ['zena', 'shena', 'chena'], 'vrouw / echtgenote', "Ж = zh (zj)."),
  read('щи', 'shchi', ['shi', 'chi', 'tsi'], 'koolsoep', "Щ = shch, langer en zachter dan Ш."),
  read('плохо', 'plokho', ['nloxo', 'ploxo', 'plokno'], 'slecht', "П = p, Л = l, Х = kh."),
  read('вечер', 'vecher', ['becher', 'vetser', 'veshcher'], 'avond', "В = v, Ч = ch, Р = r."),
  read('здравствуйте', 'zdravstvuyte', ['zdpabctbyute', 'zdravstvyte', 'sdravstvuyte'], 'goedendag', "З = z, В = v, С = s, Т = t, У = oe, Й = j. Lees je de в/с/у als Latijn, komt er onzin uit.")
];

// ---- Klemtoon: the second A1 lesson, right after the alphabet ----
const categories = [
  {
    slug: 'klemtoon', name: 'Klemtoon', level: 'A1', sort_order: 1,
    description: 'Waar ligt de klemtoon, hoe hoor je hem, en hoe verandert hij de klank van de andere klinkers. Daarna oefen je de klemtoon bij elk nieuw woord.'
  }
];

const grammarRules = [
  {
    code: 'STRESS-PLACEMENT',
    title: 'Klemtoon: waar hij ligt en hoe je hem hoort',
    explanation:
      "De Russische klemtoon is vrij (hij kan op elke lettergreep liggen) en beweeglijk (hij kan verschuiven bij verbuiging: рука́ → ру́ку, го́род → города́). In gewone teksten wordt hij niet geschreven; woordenboeken en deze app zetten er een accentteken op (вода́). Er is geen sluitende regel, dus je leert de klemtoon samen met het woord — maar er zijn houvasten. " +
      "1) ё is altijd beklemtoond (мёд, ещё, всё). " +
      "2) Alleen de beklemtoonde klinker spreek je vol en lang uit; de andere worden kort en dof: een onbeklemtoonde о klinkt als a (молоко́ → malakó, хорошо́ → xarashó) en een onbeklemtoonde е of я als een korte i (телефо́н → tilifón). Leg je de klemtoon verkeerd, dan veranderen dus ook die klanken en klinkt het woord onherkenbaar. " +
      "3) Leenwoorden houden meestal de klemtoon van de brontaal: компью́тер, телефо́н, рестора́н, докуме́нт. " +
      "4) Werkwoorden op -ова́ть/-ева́ть hebben de klemtoon op -ва́-; bij korte werkwoorden verschuift hij in de verleden tijd vrouwelijk naar het einde (был, была́, бы́ли; взял, взяла́). " +
      "5) De klemtoon onderscheidt soms woorden: за́мок (kasteel) – замо́к (slot), мука́ (meel) – му́ка (kwelling), пла́чу (ik huil) – плачу́ (ik betaal). " +
      "Praktisch: druk op de luisterknop (ook de langzame 🐢), luister welke lettergreep 'vol' klinkt, en zeg het na.",
    example: 'молоко́ [malakó] · хорошо́ [xarashó] · за́мок (kasteel) ≠ замо́к (slot)'
  }
];

const K = 'klemtoon';
const R = 'STRESS-PLACEMENT';
const stressLesson = [
  { category: K, grammarRule: R, type: 'mc', prompt: 'Welke letter is in het Russisch áltijd beklemtoond?', correctAnswer: 'ё', options: ['о', 'ё', 'а', 'е'], explanation: 'ё draagt altijd de klemtoon: мёд, ещё, всё. Daarom wordt de stip in gewone tekst vaak weggelaten — een Rus weet waar hij hoort.' },
  { category: K, grammarRule: R, type: 'mc', prompt: "Hoe klinkt 'молоко́' (klemtoon op de laatste о)?", correctAnswer: 'malakó', options: ['mólako', 'malakó', 'molokó', 'malóka'], explanation: "Alleen de beklemtoonde о klinkt als o; de twee onbeklemtoonde о's klinken als een korte a: malakó." },
  { category: K, grammarRule: R, type: 'mc', prompt: "Wat gebeurt er met een onbeklemtoonde 'о'?", correctAnswer: "hij klinkt als een korte 'a'", options: ["hij klinkt als een korte 'a'", 'hij wordt langer', 'hij klinkt als oe', 'hij valt weg'], explanation: "Akanje: onbeklemtoonde о → a. Москва́ klinkt als Maskvá, хорошо́ als xarashó." },
  { category: K, grammarRule: R, type: 'mc', prompt: "Wat gebeurt er met een onbeklemtoonde 'е' (bv. in телефо́н)?", correctAnswer: "hij klinkt als een korte 'i'", options: ["hij klinkt als een korte 'i'", "hij klinkt als 'je'", 'hij blijft een duidelijke e', "hij klinkt als 'o'"], explanation: 'Ikanje: onbeklemtoonde е/я → korte i. телефо́н klinkt als tilifón, семья́ als simjá.' },
  { category: K, grammarRule: R, type: 'mc', prompt: 'Wordt de klemtoon in een gewone Russische tekst (krant, bericht) geschreven?', correctAnswer: 'nee, alleen in woordenboeken en leerboeken', options: ['nee, alleen in woordenboeken en leerboeken', 'ja, altijd met een accentteken', 'alleen bij namen', 'alleen in hoofdletters'], explanation: 'Het accentteken (вода́) zie je in woordenboeken, leerboeken en deze app. Russen lezen zonder — jij leert de klemtoon dus per woord.' },
  { category: K, grammarRule: R, type: 'mc', prompt: "Wat betekent 'замо́к' (klemtoon op de о)?", correctAnswer: 'slot (om af te sluiten)', options: ['slot (om af te sluiten)', 'kasteel', 'sleutel', 'deur'], explanation: 'замо́к = slot; за́мок = kasteel. Alleen de klemtoon verschilt.' },
  { category: K, grammarRule: R, type: 'mc', prompt: "Wat betekent 'мука́' (klemtoon op de а)?", correctAnswer: 'meel / bloem', options: ['meel / bloem', 'kwelling', 'vlieg', 'muis'], explanation: 'мука́ = meel; му́ка = kwelling. Bij de bakker wil je de eerste.' },
  { category: K, grammarRule: R, type: 'stress', prompt: "Waar ligt de klemtoon in 'телефон' (leenwoord)?", correctAnswer: 'телефо́н', options: ['те́лефон', 'теле́фон', 'телефо́н'], explanation: 'Leenwoorden houden meestal de klemtoon van de brontaal: telefóón → телефо́н. Klinkt als tilifón.' },
  { category: K, grammarRule: R, type: 'stress', prompt: "Waar ligt de klemtoon in 'компьютер'?", correctAnswer: 'компью́тер', options: ['ко́мпьютер', 'компью́тер', 'компьюте́р'], explanation: 'Uit het Engels compúter → компью́тер.' },
  { category: K, grammarRule: R, type: 'stress', prompt: "Waar ligt de klemtoon in 'была' (zij was)?", correctAnswer: 'была́', options: ['бы́ла', 'была́'], explanation: 'Bij korte werkwoorden verschuift de klemtoon in de vrouwelijke verleden tijd naar het einde: был, была́, бы́ло, бы́ли.' },
  { category: K, grammarRule: R, type: 'stress', prompt: "Waar ligt de klemtoon in 'хорошо'?", correctAnswer: 'хорошо́', options: ['хо́рошо', 'хоро́шо', 'хорошо́'], explanation: "хорошо́ — klinkt als xarashó: de twee eerste о's zijn onbeklemtoond en klinken als a." },
  { category: K, grammarRule: R, type: 'stress', prompt: "Waar ligt de klemtoon in 'спасибо'?", correctAnswer: 'спаси́бо', options: ['спа́сибо', 'спаси́бо', 'спасибо́'], explanation: 'спаси́бо — de и is beklemtoond; de о aan het eind is dof.' },
  { category: K, grammarRule: R, type: 'stress', prompt: "Waar ligt de klemtoon in 'ещё' (nog)?", correctAnswer: 'ещё', options: ['е́ще', 'ещё'], explanation: 'ё is altijd beklemtoond, dus bij een woord met ё hoef je niet te twijfelen: ещё [jisjó].' },
  { category: K, grammarRule: R, type: 'mc', prompt: 'Hoe herken je bij het luisteren de beklemtoonde lettergreep?', correctAnswer: 'hij klinkt langer, luider en met een volle klinker', options: ['hij klinkt langer, luider en met een volle klinker', 'hij klinkt hoger', 'hij is altijd de eerste', 'hij is altijd de laatste'], explanation: 'De beklemtoonde lettergreep is de enige die je vol uitspreekt; de rest wordt kort en dof. Gebruik de langzame luisterknop 🐢 om het te horen.' }
];

module.exports = { categories, grammarRules, words, grammarExercises: [...grammarExercises, ...stressLesson], practicalSentences: [], readings: [] };
