// Graded readers: twelve short stories, two per CEFR level, written so that
// each one only uses grammar the learner has met by that level. They are
// static content (like the phrasebook) rather than seeded exercises: the
// reading screen serves them straight from the offline content bundle, and
// only the comprehension questions are graded.
//
// Shape per story:
//   id          stable slug, used in the #/story/<id> route and in progress
//   level       CEFR level the language is pitched at
//   minutes     rough reading time, shown on the card
//   paragraphs  [russian, dutch] -- the Dutch line stays hidden until tapped
//   glossary    [russian, dutch] -- the words worth pre-teaching
//   questions   multiple choice, answered in Russian, explained afterwards

const stories = [
  {
    id: 'a1-anna',
    level: 'A1',
    icon: '👋',
    title: 'Меня зовут Анна',
    titleNl: 'Ik heet Anna',
    minutes: 2,
    intro: 'Anna stelt zichzelf voor. Alleen tegenwoordige tijd en woorden uit de eerste lessen.',
    paragraphs: [
      ['Привет! Меня зовут Анна. Мне двадцать пять лет. Я живу в Москве.', 'Hoi! Ik heet Anna. Ik ben vijfentwintig jaar. Ik woon in Moskou.'],
      ['Я работаю в школе. Я учительница. Я очень люблю свою работу.', 'Ik werk op een school. Ik ben lerares. Ik hou erg van mijn werk.'],
      ['У меня есть брат. Его зовут Иван. Он студент и живёт в Петербурге.', 'Ik heb een broer. Hij heet Ivan. Hij is student en woont in Sint-Petersburg.'],
      ['Вечером я читаю книги или смотрю фильмы. А что ты делаешь вечером?', "'s Avonds lees ik boeken of kijk ik films. En wat doe jij 's avonds?"]
    ],
    glossary: [
      ['учительница', 'lerares'],
      ['у меня есть', 'ik heb'],
      ['свою работу', 'mijn eigen werk'],
      ['вечером', "'s avonds"]
    ],
    questions: [
      {
        q: 'Waar woont Anna?',
        options: ['В Москве', 'В Петербурге', 'В школе'],
        answer: 'В Москве',
        explanation: 'In de eerste alinea staat het letterlijk: «Я живу в Москве». Петербург is waar haar broer woont.'
      },
      {
        q: 'Wat is haar beroep?',
        options: ['Учительница', 'Студентка', 'Врач'],
        answer: 'Учительница',
        explanation: '«Я работаю в школе. Я учительница.» Haar broer is student, niet zij.'
      },
      {
        q: 'Wie is Иван?',
        options: ['Её брат', 'Её муж', 'Её сын'],
        answer: 'Её брат',
        explanation: '«У меня есть брат. Его зовут Иван.» — брат betekent broer.'
      },
      {
        q: "Wat doet Anna 's avonds?",
        options: ['Читает книги или смотрит фильмы', 'Работает в школе', 'Ездит в Петербург'],
        answer: 'Читает книги или смотрит фильмы',
        explanation: 'De laatste alinea: «Вечером я читаю книги или смотрю фильмы».'
      }
    ]
  },
  {
    id: 'a1-utro',
    level: 'A1',
    icon: '🌅',
    title: 'Моё утро',
    titleNl: 'Mijn ochtend',
    minutes: 2,
    intro: 'Een gewone werkochtend: opstaan, ontbijten, de bus, de lunch. Veel kloktijden en dagelijkse werkwoorden.',
    paragraphs: [
      ['Я встаю в семь часов. Сначала я пью кофе и ем хлеб с сыром.', 'Ik sta om zeven uur op. Eerst drink ik koffie en eet ik brood met kaas.'],
      ['Потом я иду на автобус. Автобус идёт двадцать минут.', 'Daarna loop ik naar de bus. De bus doet er twintig minuten over.'],
      ['На работе я говорю по-русски и по-английски. Это трудно, но интересно.', 'Op mijn werk spreek ik Russisch en Engels. Dat is moeilijk, maar interessant.'],
      ['В час я обедаю. Я всегда беру суп, потому что это вкусно и недорого.', 'Om één uur lunch ik. Ik neem altijd soep, want dat is lekker en niet duur.']
    ],
    glossary: [
      ['я встаю', 'ik sta op'],
      ['сначала', 'eerst'],
      ['потом', 'daarna'],
      ['недорого', 'niet duur']
    ],
    questions: [
      {
        q: 'Hoe laat staat de verteller op?',
        options: ['В семь часов', 'В час', 'В двадцать минут'],
        answer: 'В семь часов',
        explanation: '«Я встаю в семь часов.» В час is het tijdstip van de lunch.'
      },
      {
        q: 'Wat eet hij bij het ontbijt?',
        options: ['Хлеб с сыром', 'Суп', 'Только кофе'],
        answer: 'Хлеб с сыром',
        explanation: '«Я пью кофе и ем хлеб с сыром.» De soep is voor de lunch.'
      },
      {
        q: 'Hoe lang duurt de busrit?',
        options: ['Двадцать минут', 'Семь минут', 'Один час'],
        answer: 'Двадцать минут',
        explanation: '«Автобус идёт двадцать минут.»'
      },
      {
        q: 'Waarom neemt hij altijd soep?',
        options: ['Потому что это вкусно и недорого', 'Потому что это быстро', 'Потому что суп только по средам'],
        answer: 'Потому что это вкусно и недорого',
        explanation: 'Потому что leidt de reden in: «…потому что это вкусно и недорого».'
      }
    ]
  },
  {
    id: 'a2-magazin',
    level: 'A2',
    icon: '🛒',
    title: 'В магазине',
    titleNl: 'In de winkel',
    minutes: 3,
    intro: 'Een klein voorval bij de kassa. Eerste verhaal in de verleden tijd, met perfectieve werkwoorden.',
    paragraphs: [
      ['В субботу я пошёл в магазин за продуктами. Мне нужны были хлеб, молоко и что-нибудь на ужин.', 'Zaterdag ging ik naar de winkel voor boodschappen. Ik had brood, melk en iets voor het avondeten nodig.'],
      ['У кассы я понял, что забыл кошелёк дома. Я стоял и не знал, что делать.', 'Bij de kassa besefte ik dat ik mijn portemonnee thuis had laten liggen. Ik stond daar en wist niet wat ik moest doen.'],
      ['Женщина за мной сказала: «Не волнуйтесь, я заплачу». Я очень удивился и поблагодарил её.', "De vrouw achter me zei: 'Maakt u zich geen zorgen, ik betaal wel.' Ik was heel verbaasd en bedankte haar."],
      ['На следующий день я принёс ей деньги и коробку конфет. Теперь мы здороваемся каждое утро.', 'De volgende dag bracht ik haar het geld en een doos bonbons. Nu groeten we elkaar elke ochtend.']
    ],
    glossary: [
      ['за продуктами', 'boodschappen doen'],
      ['кошелёк', 'portemonnee'],
      ['не волнуйтесь', 'maakt u zich geen zorgen'],
      ['поблагодарил', 'bedankte'],
      ['здороваемся', 'we groeten elkaar']
    ],
    questions: [
      {
        q: 'Wat had de verteller thuis laten liggen?',
        options: ['Кошелёк', 'Хлеб', 'Ключи'],
        answer: 'Кошелёк',
        explanation: '«Я понял, что забыл кошелёк дома.»'
      },
      {
        q: 'Wat deed de vrouw achter hem?',
        options: ['Заплатила за него', 'Дала ему хлеб', 'Позвала директора'],
        answer: 'Заплатила за него',
        explanation: 'Ze zei «я заплачу» — ik betaal, en deed dat ook.'
      },
      {
        q: 'Wat bracht hij de volgende dag?',
        options: ['Деньги и коробку конфет', 'Только деньги', 'Цветы'],
        answer: 'Деньги и коробку конфет',
        explanation: '«Я принёс ей деньги и коробку конфет.»'
      },
      {
        q: 'Op welke dag speelt het verhaal zich af?',
        options: ['В субботу', 'В воскресенье', 'В понедельник'],
        answer: 'В субботу',
        explanation: 'De eerste zin begint met «В субботу…».'
      }
    ]
  },
  {
    id: 'a2-dacha',
    level: 'A2',
    icon: '🏡',
    title: 'Дача',
    titleNl: 'Het zomerhuisje',
    minutes: 3,
    intro: 'Zomer bij oma op de datsja. Herhaalde handelingen in de tegenwoordige tijd, met veel plaats- en tijdsbepalingen.',
    paragraphs: [
      ['Каждое лето мы ездим на дачу к бабушке. Это два часа на электричке от города.', 'Elke zomer gaan we naar het zomerhuisje van oma. Dat is twee uur met de voorstadstrein vanaf de stad.'],
      ['Там нет интернета, и сначала мне было скучно. Но потом я нашёл в сарае старый велосипед.', 'Daar is geen internet, en eerst verveelde ik me. Maar toen vond ik in de schuur een oude fiets.'],
      ['Утром мы работаем в огороде, а днём купаемся в реке. Бабушка печёт пироги с ягодами.', "'s Ochtends werken we in de moestuin en 's middags zwemmen we in de rivier. Oma bakt taarten met bessen."],
      ['Вечером все сидят на веранде и пьют чай. Мне кажется, что время там идёт медленнее.', "'s Avonds zit iedereen op de veranda thee te drinken. Ik heb het gevoel dat de tijd daar langzamer gaat."]
    ],
    glossary: [
      ['электричка', 'voorstadstrein'],
      ['сарай', 'schuur'],
      ['огород', 'moestuin'],
      ['ягоды', 'bessen'],
      ['мне кажется', 'ik heb het gevoel']
    ],
    questions: [
      {
        q: 'Hoe reizen ze naar de datsja?',
        options: ['На электричке', 'На машине', 'На автобусе'],
        answer: 'На электричке',
        explanation: '«Это два часа на электричке от города.»'
      },
      {
        q: 'Waarom verveelde de verteller zich eerst?',
        options: ['Там нет интернета', 'Там нет реки', 'Бабушка много работает'],
        answer: 'Там нет интернета',
        explanation: '«Там нет интернета, и сначала мне было скучно.»'
      },
      {
        q: "Wat doen ze 's middags?",
        options: ['Купаются в реке', 'Работают в огороде', 'Пьют чай на веранде'],
        answer: 'Купаются в реке',
        explanation: 'Утром is de moestuin, днём de rivier, вечером de thee op de veranda.'
      },
      {
        q: 'Wat bakt oma?',
        options: ['Пироги с ягодами', 'Хлеб', 'Блины'],
        answer: 'Пироги с ягодами',
        explanation: '«Бабушка печёт пироги с ягодами.»'
      }
    ]
  },
  {
    id: 'b1-rabota',
    level: 'B1',
    icon: '💼',
    title: 'Новая работа',
    titleNl: 'Een nieuwe baan',
    minutes: 4,
    intro: 'Een Nederlander gaat in Jekaterinenburg werken en botst op een andere omgangsvorm. Over directheid en wennen.',
    paragraphs: [
      ['Через месяц после переезда в Екатеринбург я наконец нашёл работу в небольшой IT-компании.', 'Een maand na mijn verhuizing naar Jekaterinenburg vond ik eindelijk werk bij een klein IT-bedrijf.'],
      ['В первый день начальник сказал: «У нас все говорят прямо. Если что-то непонятно — спрашивай сразу».', "Op de eerste dag zei de baas: 'Bij ons zegt iedereen het rechtuit. Als iets onduidelijk is, vraag het dan meteen.'"],
      ['Мне было трудно привыкнуть. В Нидерландах я тоже привык говорить прямо, но здесь это звучало резче.', 'Ik moest er erg aan wennen. In Nederland was ik ook gewend rechtuit te praten, maar hier klonk het scherper.'],
      ['Через полгода я понял, что за этой прямотой скрывается уважение. Коллеги просто не тратят твоё время.', 'Na een half jaar begreep ik dat achter die directheid respect schuilgaat. Collega\'s verspillen je tijd gewoon niet.'],
      ['Теперь, когда я приезжаю домой, мне кажется, что голландцы говорят слишком осторожно.', 'Nu ik naar huis kom, vind ik juist dat Nederlanders te voorzichtig praten.']
    ],
    glossary: [
      ['переезд', 'verhuizing'],
      ['привыкнуть', 'wennen'],
      ['резче', 'scherper'],
      ['прямота', 'directheid'],
      ['скрывается', 'gaat schuil'],
      ['осторожно', 'voorzichtig']
    ],
    questions: [
      {
        q: 'Wat voor bedrijf is het?',
        options: ['Небольшая IT-компания', 'Школа', 'Большой завод'],
        answer: 'Небольшая IT-компания',
        explanation: '«…нашёл работу в небольшой IT-компании».'
      },
      {
        q: 'Wat zei de baas op de eerste dag?',
        options: ['Что нужно спрашивать сразу', 'Что нельзя опаздывать', 'Что все работают из дома'],
        answer: 'Что нужно спрашивать сразу',
        explanation: '«Если что-то непонятно — спрашивай сразу.»'
      },
      {
        q: 'Wat begreep hij na een half jaar?',
        options: ['Что за прямотой скрывается уважение', 'Что коллеги его не любят', 'Что ему нужно уехать'],
        answer: 'Что за прямотой скрывается уважение',
        explanation: 'De vierde alinea draait het om: de directheid is respect, geen onbeleefdheid.'
      },
      {
        q: 'Hoe klinkt het Nederlands hem nu in de oren?',
        options: ['Слишком осторожно', 'Слишком резко', 'Слишком быстро'],
        answer: 'Слишком осторожно',
        explanation: 'De slotzin: «…голландцы говорят слишком осторожно».'
      }
    ]
  },
  {
    id: 'b1-telefon',
    level: 'B1',
    icon: '📱',
    title: 'Потерянный телефон',
    titleNl: 'De verloren telefoon',
    minutes: 4,
    intro: 'Een telefoon blijft in de taxi liggen. Verleden tijd, indirecte rede en tijdsaanduidingen.',
    paragraphs: [
      ['В пятницу вечером я забыл телефон в такси. Понял я это только дома, когда захотел позвонить жене.', 'Vrijdagavond liet ik mijn telefoon in de taxi liggen. Ik had het pas thuis door, toen ik mijn vrouw wilde bellen.'],
      ['Сначала я решил, что телефон пропал навсегда. Но жена предложила написать в приложение такси.', 'Eerst dacht ik dat de telefoon voorgoed weg was. Maar mijn vrouw stelde voor om via de taxi-app te schrijven.'],
      ['Через двадцать минут водитель ответил, что телефон лежит у него, и предложил привезти его утром.', 'Twintig minuten later antwoordde de chauffeur dat de telefoon bij hem lag, en bood aan hem \'s ochtends te brengen.'],
      ['Утром он приехал, отдал телефон и отказался брать деньги. «Со мной тоже такое было», — сказал он.', "'s Ochtends kwam hij, gaf de telefoon terug en weigerde geld aan te nemen. 'Mij is dat ook eens overkomen,' zei hij."],
      ['С тех пор я всегда проверяю задний карман, прежде чем выйти из машины.', 'Sindsdien controleer ik altijd mijn achterzak voordat ik uit de auto stap.']
    ],
    glossary: [
      ['пропал навсегда', 'voorgoed verdwenen'],
      ['приложение', 'app'],
      ['отказался', 'weigerde'],
      ['с тех пор', 'sindsdien'],
      ['прежде чем', 'voordat']
    ],
    questions: [
      {
        q: 'Waar bleef de telefoon liggen?',
        options: ['В такси', 'В метро', 'На работе'],
        answer: 'В такси',
        explanation: '«…я забыл телефон в такси».'
      },
      {
        q: 'Wie bedacht de oplossing?',
        options: ['Жена', 'Водитель', 'Коллега'],
        answer: 'Жена',
        explanation: '«Жена предложила написать в приложение такси.»'
      },
      {
        q: 'Wat deed de chauffeur met het aangeboden geld?',
        options: ['Отказался его брать', 'Взял двойную цену', 'Попросил перевод'],
        answer: 'Отказался его брать',
        explanation: '«…отдал телефон и отказался брать деньги».'
      },
      {
        q: 'Wat doet de verteller sindsdien?',
        options: ['Проверяет задний карман', 'Больше не ездит на такси', 'Всегда звонит жене из машины'],
        answer: 'Проверяет задний карман',
        explanation: 'De slotzin noemt precies die gewoonte.'
      }
    ]
  },
  {
    id: 'b2-sosed',
    level: 'B2',
    icon: '🎻',
    title: 'Сосед сверху',
    titleNl: 'De bovenbuurman',
    minutes: 5,
    intro: 'Een burenkwestie die anders afloopt dan verwacht. Langere zinnen, bijzinnen en werkwoorden van twijfel.',
    paragraphs: [
      ['Мой сосед сверху — музыкант. Первые недели я даже радовался: живая музыка приятнее телевизора.', 'Mijn bovenbuurman is muzikant. De eerste weken was ik zelfs blij: live muziek is prettiger dan televisie.'],
      ['Но к декабрю выяснилось, что репетирует он по ночам, причём одну и ту же пьесу.', 'Maar in december bleek dat hij \'s nachts repeteert, en dan ook nog steeds hetzelfde stuk.'],
      ['Я долго не решался с ним поговорить: боялся, что разговор превратится в ссору на годы.', 'Ik durfde er lang niet met hem over te praten: ik was bang dat het gesprek zou uitlopen op jarenlange ruzie.'],
      ['В итоге я поднялся и просто спросил, во сколько ему удобно репетировать. Он смутился и предложил заканчивать до десяти.', 'Uiteindelijk ging ik naar boven en vroeg gewoon hoe laat het hem uitkwam om te repeteren. Hij werd verlegen en stelde voor om voor tienen te stoppen.'],
      ['Оказалось, он был уверен, что в доме отличная звукоизоляция. С тех пор мы иногда пьём кофе вместе.', 'Het bleek dat hij ervan overtuigd was dat het gebouw uitstekende geluidsisolatie had. Sindsdien drinken we soms samen koffie.']
    ],
    glossary: [
      ['выяснилось', 'het bleek'],
      ['причём', 'en dan ook nog'],
      ['не решался', 'durfde niet'],
      ['превратится в ссору', 'zou uitlopen op ruzie'],
      ['смутился', 'werd verlegen'],
      ['звукоизоляция', 'geluidsisolatie']
    ],
    questions: [
      {
        q: 'Waarom was de verteller in het begin blij met zijn buurman?',
        options: ['Живая музыка приятнее телевизора', 'Сосед играл только днём', 'Сосед был его старым другом'],
        answer: 'Живая музыка приятнее телевизора',
        explanation: 'Precies de reden die in de eerste alinea staat.'
      },
      {
        q: 'Waar was hij bang voor?',
        options: ['Что разговор превратится в ссору', 'Что сосед переедет', 'Что его выселят'],
        answer: 'Что разговор превратится в ссору',
        explanation: '«…боялся, что разговор превратится в ссору на годы».'
      },
      {
        q: 'Wat stelde de buurman zelf voor?',
        options: ['Заканчивать до десяти', 'Играть только по выходным', 'Купить наушники'],
        answer: 'Заканчивать до десяти',
        explanation: '«Он смутился и предложил заканчивать до десяти.»'
      },
      {
        q: 'Waarom speelde hij zonder zorgen \'s nachts?',
        options: ['Он был уверен, что звукоизоляция отличная', 'Он думал, что внизу никто не живёт', 'Ему разрешил хозяин дома'],
        answer: 'Он был уверен, что звукоизоляция отличная',
        explanation: 'De laatste alinea verklaart zijn gedrag: hij dacht dat niemand het hoorde.'
      }
    ]
  },
  {
    id: 'b2-sobesedovanie',
    level: 'B2',
    icon: '🤝',
    title: 'Собеседование',
    titleNl: 'Het sollicitatiegesprek',
    minutes: 5,
    intro: 'Eén eerlijk antwoord verandert een sollicitatiegesprek. Met indirecte rede en werkwoorden van menen en toegeven.',
    paragraphs: [
      ['На собеседовании меня спросили, кем я вижу себя через пять лет. Я ответил честно: «Не знаю».', "Bij het sollicitatiegesprek vroegen ze me waar ik mezelf over vijf jaar zag. Ik antwoordde eerlijk: 'Geen idee.'"],
      ['В комнате стало тихо. Мне показалось, что я только что провалил всё собеседование.', 'Het werd stil in de kamer. Ik dacht dat ik het hele gesprek zojuist verprutst had.'],
      ['Но директор улыбнулась и сказала, что за десять лет никто ей так не отвечал.', 'Maar de directeur glimlachte en zei dat niemand haar in tien jaar zo had geantwoord.'],
      ['Она объяснила, что ищет людей, готовых признать, чего они не знают: таких проще учить.', 'Ze legde uit dat ze mensen zoekt die durven toegeven wat ze niet weten: die zijn makkelijker op te leiden.'],
      ['Через неделю мне позвонили и предложили место. Иногда честность работает лучше подготовленного ответа.', 'Een week later belden ze me en boden me de baan aan. Soms werkt eerlijkheid beter dan een ingestudeerd antwoord.']
    ],
    glossary: [
      ['собеседование', 'sollicitatiegesprek'],
      ['провалил', 'verprutst, gezakt voor'],
      ['признать', 'toegeven'],
      ['подготовленный ответ', 'ingestudeerd antwoord'],
      ['честность', 'eerlijkheid']
    ],
    questions: [
      {
        q: 'Welke vraag kreeg hij?',
        options: ['Кем он видит себя через пять лет', 'Почему он ушёл с прошлой работы', 'Сколько он хочет зарабатывать'],
        answer: 'Кем он видит себя через пять лет',
        explanation: 'De klassieke sollicitatievraag uit de eerste zin.'
      },
      {
        q: 'Hoe reageerde de kamer op zijn antwoord?',
        options: ['Стало тихо', 'Все засмеялись', 'Никто не заметил'],
        answer: 'Стало тихо',
        explanation: '«В комнате стало тихо.» Daarom dacht hij dat het misging.'
      },
      {
        q: 'Wat voor mensen zoekt de directeur?',
        options: ['Готовых признать, чего они не знают', 'С самым большим опытом', 'Которые всегда уверены в себе'],
        answer: 'Готовых признать, чего они не знают',
        explanation: 'Zij noemt die mensen «проще учить» — makkelijker op te leiden.'
      },
      {
        q: 'Wat gebeurde er een week later?',
        options: ['Ему предложили место', 'Ему отказали', 'Его позвали на второе собеседование'],
        answer: 'Ему предложили место',
        explanation: '«Через неделю мне позвонили и предложили место.»'
      }
    ]
  },
  {
    id: 'c1-pismo',
    level: 'C1',
    icon: '✉️',
    title: 'Письмо из Иркутска',
    titleNl: 'Een brief uit Irkoetsk',
    minutes: 6,
    intro: 'Een brief van een nicht na twaalf jaar stilte. Literaire toon, deelwoorden en subtiele nuances.',
    paragraphs: [
      ['Письмо пришло в конверте, какие давно уже не продают: серая бумага, марка с изображением Байкала.', 'De brief kwam in een envelop zoals ze allang niet meer verkopen: grijs papier, een postzegel met het Baikalmeer erop.'],
      ['Писала двоюродная сестра, с которой мы не общались с самых похорон деда, то есть двенадцать лет.', 'Hij was van mijn nicht, met wie ik geen contact meer had gehad sinds opa\'s begrafenis, dus twaalf jaar.'],
      ['Она не извинялась и ничего не объясняла. Просто описывала свой день так подробно, будто я сидел рядом.', 'Ze bood geen excuses aan en legde niets uit. Ze beschreef gewoon haar dag zo gedetailleerd alsof ik naast haar zat.'],
      ['В конце была одна фраза: «Я подумала, что тебе это может быть интересно». Ни вопроса, ни просьбы ответить.', "Aan het eind stond één zin: 'Ik dacht dat dit je misschien zou interesseren.' Geen vraag, geen verzoek om te antwoorden."],
      ['Я перечитал письмо трижды и понял, что впервые за годы мне не нужно решать, кто из нас был прав.', 'Ik las de brief drie keer over en besefte dat ik voor het eerst in jaren niet hoefde uit te maken wie van ons gelijk had.']
    ],
    glossary: [
      ['конверт', 'envelop'],
      ['двоюродная сестра', 'nicht (dochter van oom of tante)'],
      ['похороны', 'begrafenis'],
      ['подробно', 'gedetailleerd'],
      ['будто', 'alsof'],
      ['перечитал', 'herlas']
    ],
    questions: [
      {
        q: 'Hoe lang hadden ze geen contact gehad?',
        options: ['Двенадцать лет', 'Три года', 'С прошлого лета'],
        answer: 'Двенадцать лет',
        explanation: '«…с самых похорон деда, то есть двенадцать лет».'
      },
      {
        q: 'Wat stond er juist níét in de brief?',
        options: ['Извинения и объяснения', 'Описание её дня', 'Короткая фраза в конце'],
        answer: 'Извинения и объяснения',
        explanation: '«Она не извинялась и ничего не объясняла.» Dat maakt de brief zo bijzonder.'
      },
      {
        q: 'Wat zegt de slotzin van de brief?',
        options: ['«Я подумала, что тебе это может быть интересно»', 'Een verzoek om langs te komen', 'Een vraag over zijn gezondheid'],
        answer: '«Я подумала, что тебе это может быть интересно»',
        explanation: 'En opvallend genoeg: «Ни вопроса, ни просьбы ответить».'
      },
      {
        q: 'Wat besefte de verteller na het herlezen?',
        options: ['Что ему не нужно решать, кто был прав', 'Что сестре нужны деньги', 'Что он должен ехать в Иркутск'],
        answer: 'Что ему не нужно решать, кто был прав',
        explanation: 'De brief vraagt niets, dus het oude conflict hoeft niet beslecht te worden.'
      }
    ]
  },
  {
    id: 'c1-tishina',
    level: 'C1',
    icon: '🔕',
    title: 'Цифровая тишина',
    titleNl: 'Digitale stilte',
    minutes: 6,
    intro: 'Een week zonder meldingen, en wat dat blootlegt. Betogende tekst met abstracte woordenschat.',
    paragraphs: [
      ['Эксперимент начался просто: на неделю я отключил все уведомления, кроме звонков.', 'Het experiment begon simpel: een week lang zette ik alle meldingen uit, behalve inkomende gesprekken.'],
      ['Первые два дня я хватался за телефон каждые несколько минут — рука делала это раньше, чем я успевал подумать.', 'De eerste twee dagen greep ik om de paar minuten naar mijn telefoon: mijn hand deed het eerder dan ik kon nadenken.'],
      ['К среде я заметил странное: рабочие письма никуда не делись, но перестали казаться срочными.', 'Tegen woensdag viel me iets vreemds op: de werkmails waren er nog steeds, maar leken niet langer dringend.'],
      ['Оказалось, что срочность создавали не сами письма, а звук, который их сопровождал.', 'Het bleek dat niet de mails zelf de urgentie veroorzaakten, maar het geluid dat ze begeleidde.'],
      ['Через неделю я вернул уведомления только двум приложениям. Остальное, как выяснилось, прекрасно ждёт до вечера.', 'Na een week zette ik de meldingen van slechts twee apps weer aan. De rest kan, zo bleek, prima wachten tot de avond.']
    ],
    glossary: [
      ['уведомления', 'meldingen'],
      ['хватался за', 'greep naar'],
      ['срочный', 'dringend'],
      ['сопровождал', 'begeleidde'],
      ['остальное', 'de rest']
    ],
    questions: [
      {
        q: 'Wat schakelde de verteller uit?',
        options: ['Все уведомления, кроме звонков', 'Телефон полностью', 'Только рабочую почту'],
        answer: 'Все уведомления, кроме звонков',
        explanation: 'De eerste zin noemt precies die uitzondering.'
      },
      {
        q: 'Wat gebeurde er de eerste twee dagen?',
        options: ['Он постоянно хватался за телефон', 'Он ничего не заметил', 'Он потерял телефон'],
        answer: 'Он постоянно хватался за телефон',
        explanation: 'De gewoonte zat in de hand, niet in het hoofd: «рука делала это раньше, чем я успевал подумать».'
      },
      {
        q: 'Waar kwam het gevoel van urgentie volgens hem vandaan?',
        options: ['От звука уведомления', 'От начальника', 'От количества писем'],
        answer: 'От звука уведомления',
        explanation: '«…срочность создавали не сами письма, а звук, который их сопровождал».'
      },
      {
        q: 'Hoeveel apps kregen hun meldingen terug?',
        options: ['Два', 'Все', 'Ни одного'],
        answer: 'Два',
        explanation: '«…я вернул уведомления только двум приложениям».'
      }
    ]
  },
  {
    id: 'c2-dom',
    level: 'C2',
    icon: '🏚️',
    title: 'Двадцать лет спустя',
    titleNl: 'Twintig jaar later',
    minutes: 7,
    intro: 'Terug bij het ouderlijk huis. Literair proza met gerundia, ingebedde bijzinnen en ironie.',
    paragraphs: [
      ['Дом оказался меньше, чем я помнил, — не потому, что он усох, а потому, что вырос я.', 'Het huis bleek kleiner dan ik het me herinnerde, niet omdat het gekrompen was, maar omdat ik gegroeid was.'],
      ['Новые владельцы, люди вежливые и слегка растерянные, пустили меня во двор, как пускают в музей чужого детства.', 'De nieuwe eigenaars, beleefde en enigszins verbouwereerde mensen, lieten me het erf op, zoals je iemand toelaat in het museum van andermans jeugd.'],
      ['Яблоня стояла на месте, но её подрезали так аккуратно, что она перестала быть той, на которую я когда-то залезал.', 'De appelboom stond er nog, maar was zo netjes gesnoeid dat hij niet meer de boom was waar ik ooit in klom.'],
      ['Я поймал себя на желании объяснить им, где именно висели качели, — и промолчал, поняв, что объяснять пришлось бы всю жизнь.', 'Ik betrapte mezelf op de neiging hun uit te leggen waar de schommel precies had gehangen, en zweeg, beseffend dat ik daarvoor mijn hele leven zou moeten uitleggen.'],
      ['Уезжая, я думал не о том, что потерял дом, а о том, что уехал отсюда навсегда ещё двадцать лет назад, просто не знал об этом.', 'Toen ik wegreed dacht ik niet aan het verlies van het huis, maar eraan dat ik hier twintig jaar geleden al voorgoed was vertrokken, alleen wist ik dat toen nog niet.']
    ],
    glossary: [
      ['усох', 'ingekrompen, verdroogd'],
      ['растерянный', 'verbouwereerd, van zijn stuk'],
      ['подрезать', 'snoeien'],
      ['поймал себя на желании', 'betrapte zichzelf op de neiging'],
      ['качели', 'schommel'],
      ['промолчал', 'zweeg']
    ],
    questions: [
      {
        q: 'Waarom leek het huis kleiner?',
        options: ['Потому что вырос рассказчик', 'Потому что его перестроили', 'Потому что двор стал больше'],
        answer: 'Потому что вырос рассказчик',
        explanation: 'De openingszin zet die tegenstelling meteen neer: niet het huis kromp, de verteller groeide.'
      },
      {
        q: 'Hoe worden de nieuwe eigenaars beschreven?',
        options: ['Вежливые и слегка растерянные', 'Грубые и занятые', 'Старые друзья семьи'],
        answer: 'Вежливые и слегка растерянные',
        explanation: 'Precies die twee bijvoeglijke naamwoorden staan in de tweede alinea.'
      },
      {
        q: 'Waarom zei hij niets over de schommel?',
        options: ['Объяснять пришлось бы всю жизнь', 'Он забыл, где она висела', 'Хозяева торопились'],
        answer: 'Объяснять пришлось бы всю жизнь',
        explanation: 'Het gerundium поняв leidt de reden in: één detail uitleggen zou een heel leven uitleggen betekenen.'
      },
      {
        q: 'Waar dacht hij aan toen hij wegreed?',
        options: ['Что уехал отсюда навсегда ещё двадцать лет назад', 'Что хочет выкупить дом', 'Что вернётся следующим летом'],
        answer: 'Что уехал отсюда навсегда ещё двадцать лет назад',
        explanation: 'Het verlies lag niet vandaag, maar twintig jaar terug: hij wist het alleen nog niet.'
      }
    ]
  },
  {
    id: 'c2-yazyk',
    level: 'C2',
    icon: '🗣️',
    title: 'Язык и власть',
    titleNl: 'Taal en macht',
    minutes: 7,
    intro: 'Een essay over leenwoorden en wie de norm bepaalt. Abstracte, academische stijl met passieve constructies.',
    paragraphs: [
      ['Спор о том, портят ли язык заимствования, стар как сам язык, и почти всегда ведётся не о словах.', 'De discussie of leenwoorden een taal bederven is zo oud als de taal zelf, en gaat bijna nooit werkelijk over woorden.'],
      ['За требованием «говорить чисто» обычно стоит вопрос, кому принадлежит право решать, что считается нормой.', "Achter de eis om 'zuiver te spreken' gaat meestal de vraag schuil wie het recht heeft te bepalen wat als norm geldt."],
      ['Показательно, что заимствования из языков, которые считаются престижными, вызывают куда меньше возмущения.', 'Veelzeggend is dat leenwoorden uit talen die als prestigieus gelden veel minder verontwaardiging oproepen.'],
      ['Сам язык при этом устроен вполне прагматично: он берёт то, что ему нужно, и выбрасывает то, что не прижилось.', 'De taal zelf is intussen heel pragmatisch ingericht: ze neemt wat ze nodig heeft en werpt af wat geen wortel schiet.'],
      ['Поэтому словари в конечном счёте описывают не то, как правильно, а то, как договорились говорить достаточно многие.', 'Daarom beschrijven woordenboeken uiteindelijk niet hoe het hoort, maar hoe voldoende veel mensen zijn overeengekomen te spreken.']
    ],
    glossary: [
      ['заимствование', 'leenwoord'],
      ['ведётся', 'wordt gevoerd'],
      ['показательно', 'veelzeggend'],
      ['возмущение', 'verontwaardiging'],
      ['прижилось', 'heeft wortel geschoten'],
      ['в конечном счёте', 'uiteindelijk']
    ],
    questions: [
      {
        q: 'Waar gaat het debat over leenwoorden volgens de tekst werkelijk over?',
        options: ['О том, кому принадлежит право решать, что считается нормой', 'О грамматике', 'О произношении'],
        answer: 'О том, кому принадлежит право решать, что считается нормой',
        explanation: 'De tweede alinea legt de machtsvraag onder de taalvraag bloot.'
      },
      {
        q: 'Welke leenwoorden roepen minder verontwaardiging op?',
        options: ['Из языков, которые считаются престижными', 'Из соседних языков', 'Из мёртвых языков'],
        answer: 'Из языков, которые считаются престижными',
        explanation: 'Показательно markeert dat juist als het veelzeggende detail.'
      },
      {
        q: 'Hoe wordt de taal zelf gekarakteriseerd?',
        options: ['Прагматично устроенной', 'Консервативной', 'Хрупкой'],
        answer: 'Прагматично устроенной',
        explanation: '«Сам язык при этом устроен вполне прагматично…»'
      },
      {
        q: 'Wat beschrijven woordenboeken uiteindelijk?',
        options: ['Как договорились говорить достаточно многие', 'Как правильно по правилам', 'Как говорили сто лет назад'],
        answer: 'Как договорились говорить достаточно многие',
        explanation: 'De slotzin maakt het woordenboek beschrijvend in plaats van voorschrijvend.'
      }
    ]
  }
];

module.exports = stories;
