// C2 (beheersing): het Russisch van een ontwikkelde moedertaalspreker --
// literaire en zeldzame woordenschat, frazeologie met klassieke bronnen,
// culturele en historische referenties, humor en woordspel, juridisch en
// technisch vakjargon, regionale varianten, fijnzinnige emoties, schrijftaal
// en interpunctie, aspectmeesterschap en stilistische syntaxis.

const categories = [
  { slug: 'c2-literair', name: 'Literaire & zeldzame woordenschat', description: 'Woorden uit romans en essays die een moedertaalspreker passief kent en een goede schrijver actief gebruikt.', level: 'C2', sort_order: 130 },
  { slug: 'c2-frazeologie', name: 'Frazeologie met klassieke bronnen', description: 'Uitdrukkingen uit de Bijbel, de oudheid en de literatuur die in de pers en in gesprekken opduiken.', level: 'C2', sort_order: 131 },
  { slug: 'c2-cultuur-referenties', name: 'Culturele & historische referenties', description: 'Citaten en begrippen uit Poesjkin, Gogol, Gribojedov, Dostojevski, Boelgakov en de Sovjettijd die iedereen herkent.', level: 'C2', sort_order: 132 },
  { slug: 'c2-humor-woordspel', name: 'Humor, ironie & woordspeling', description: 'Anekdotes, sarcasme, zelfspot, dubbelzinnigheid en de Russische stёб.', level: 'C2', sort_order: 133 },
  { slug: 'c2-juridisch-financieel', name: 'Vakjargon: juridisch & financieel', description: 'Eiser en gedaagde, vordering, boetebeding, liquiditeit, statuten — voor contracten en rechtszaken.', level: 'C2', sort_order: 134 },
  { slug: 'c2-it-techniek', name: 'Vakjargon: IT & systeembeheer', description: 'Storingen, redundantie, uitrol, back-ups, kwetsbaarheden, versleuteling, toegangsrechten — het Russisch van de serverruimte.', level: 'C2', sort_order: 135 },
  { slug: 'c2-regionaal', name: 'Regionale varianten & buurlanden', description: 'Moskou tegen Petersburg (поребрик, парадная, шаверма), het Russisch van Oekraïne, Belarus en Kazachstan, dialectkenmerken.', level: 'C2', sort_order: 136 },
  { slug: 'c2-emoties-fijn', name: 'Fijnzinnige emoties', description: 'тоска, умиление, злорадство, досада, недоумение, хандра — gevoelens zonder één Nederlands woord.', level: 'C2', sort_order: 137 },
  { slug: 'c2-grammatica-schrijftaal', name: 'Grammatica: schrijftaal & interpunctie', description: 'Komma\'s, gedachtestreepjes, dubbele punt, aanhalingstekens «», deelwoordconstructies en de opbouw van formele tekst.', level: 'C2', sort_order: 138 },
  { slug: 'c2-grammatica-aspect-meesterschap', name: 'Grammatica: aspectmeesterschap', description: 'Tweeaspectige werkwoorden, aspect na faseverba, het voltooide futurum voor gewoonten, het historisch presens.', level: 'C2', sort_order: 139 },
  { slug: 'c2-grammatica-stilistiek', name: 'Grammatica: stilistische syntaxis', description: 'Inversie, parcellatie, ellips, retorische vraag, anafora, nominale zinnen — herkennen en zelf inzetten.', level: 'C2', sort_order: 140 },
  { slug: 'c2-grammatica-vervoeging', name: 'Grammatica: vervoegingsdrills C2', description: 'Automatisch gegenereerde drills met C2-werkwoorden.', level: 'C2', sort_order: 141 },
  { slug: 'c2-grammatica-naamvallen', name: 'Grammatica: naamval- en vergelijkingsdrills C2', description: 'Automatisch gegenereerde drills met C2-zelfstandige en bijvoeglijke naamwoorden.', level: 'C2', sort_order: 142 },
  { slug: 'c2-praktische-zinnen', name: 'Praktische zinnen C2', description: 'Formele en literaire formuleringen, ironie en understatement — bouwen én luisteren.', level: 'C2', sort_order: 143 },
  { slug: 'c2-lezen', name: 'Lezen C2', description: 'Een juridische clausule, een technisch incidentrapport, een satirische column en een literair fragment.', level: 'C2', sort_order: 144 }
];

const grammarRules = [
  {
    code: 'WRITTEN-STYLE-PUNCTUATION',
    title: 'Schrijftaal en interpunctie',
    explanation:
      "Russische interpunctie is strenger dan de Nederlandse. Een komma is verplicht vóór elke bijzin (что, который, чтобы, если, когда, потому что, хотя) en tussen nevengeschikte zinnen met а, но, или (niet vóór и tussen twee gelijkwaardige leden). Deelwoordconstructies (причастный оборот) worden door komma's afgesloten als ze ná het zelfstandig naamwoord staan: студент, читающий книгу, — maar niet ervoor: читающий книгу студент. Gerundiumconstructies (деепричастный оборот) staan altijd tussen komma's. Het gedachtestreepje (тире) vervangt het ontbrekende koppelwerkwoord tussen twee zelfstandige naamwoorden: Москва — столица России; en staat voor een conclusie of tegenstelling. De dubbele punt kondigt een opsomming of verklaring aan. Aanhalingstekens zijn «ёлочки» (guillemets); in een citaat binnen een citaat „lapki“. Inleidende woorden (конечно, во-первых, к сожалению, по-моему, кстати) staan tussen komma's. De letter ё wordt in gewone tekst als е geschreven, maar bij mogelijke verwarring (все/всё, узнаем/узнаём) en in namen hoort ё. Formele teksten: aanhef met uitroepteken, Вы met hoofdletter, afsluiting С уважением, zonder komma na de naam.",
    example: 'Он сказал, что придёт. / Книга, лежащая на столе, — моя. / Прочитав письмо, она заплакала. / Кстати, «Мастер и Маргарита» — мой любимый роман.'
  },
  {
    code: 'ASPECT-MASTERY',
    title: 'Aspectmeesterschap',
    explanation:
      "(1) Tweeaspectige werkwoorden (двувидовые) zijn onvoltooid én voltooid: жениться, казнить, ранить, обещать, исследовать, использовать en de meeste leenwoorden op -овать (организовать, реагировать). De context beslist: Я использую (nu of straks). (2) Na faseverba (начать, стать, продолжать, кончить, перестать, бросить) staat altijd de onvoltooide infinitief: Он начал читать. (3) Het voltooide futurum voor gewoonten en algemene waarheden (наглядно-примерное значение): Как выпьет — так и запоёт (zodra hij drinkt, begint hij te zingen); Он всегда что-нибудь да скажет. (4) Het historisch presens: in een levendig verhaal over het verleden gebruik je de tegenwoordige tijd (onvoltooid): Иду я вчера по улице, и вдруг... (5) Het voltooide aspect na не kan een vrees of onmogelijkheid uitdrukken: Не открою (ik krijg het niet open) tegenover Не буду открывать (ik ga het niet openen). (6) Herhaalde afgeronde handelingen in de verleden tijd met bijwoorden van frequentie vragen het onvoltooide, tenzij de reeks als geheel wordt samengevat: Он трижды повторил вопрос (drie keer, als één geheel) versus Он всё повторял вопрос (bleef herhalen).",
    example: 'Она перестала плакать. / Как только он войдёт, все замолчат. / Прихожу я домой, а там — никого. / Никак не найду очки.'
  },
  {
    code: 'STYLISTIC-SYNTAX',
    title: 'Stilistische syntaxis',
    explanation:
      "Herken de middelen van goede schrijvers en sprekers. Inversie: het bijvoeglijk naamwoord achter het zelfstandig naamwoord of het werkwoord vooraan geeft een verheven of volkse toon (Ночь тёмная; Пришла зима). Parcellatie: een zin in korte losse stukken hakken voor nadruk (Он ушёл. Навсегда. Без слов.). Ellips: het werkwoord weglaten, vaak met тире (Я — домой. Он — в кино). Nominale zinnen: alleen zelfstandige naamwoorden voor sfeer (Ночь. Улица. Фонарь. Аптека.). Retorische vraag: А судьи кто? Anafora: herhaling aan het begin van opeenvolgende zinnen (Клянусь... Клянусь...). Oxymoron: живой труп, горячий снег. Chiasme en antithese: Не место красит человека, а человек — место. Gradatie: хороший, прекрасный, изумительный. In gesproken Russisch zijn korte, elliptische zinnen de norm; volle zinnen met deelwoorden klinken geschreven.",
    example: '«Люблю тебя, Петра творенье» (inversie, Poesjkin). / «Ночь, улица, фонарь, аптека» (nominale zin, Blok). / Умом Россию не понять (ellips van het onderwerp).'
  },
  {
    code: 'PHRASEOLOGY-SOURCES',
    title: 'Frazeologie en haar bronnen',
    explanation:
      "Veel Russische uitdrukkingen komen uit de Bijbel (kerkslavische vorm!), de klassieke oudheid en de literatuur, en juist de herkomst maakt ze begrijpelijk. Bijbels: манна небесная (manna uit de hemel: onverwachte zegen), козёл отпущения (zondebok), вавилонское столпотворение (Babylonische spraakverwarring: chaos), зарыть талант в землю (je talent begraven), притча во языцех (het gesprek van de dag, letterlijk: een gelijkenis onder de volkeren), камень преткновения (struikelblok), глас вопиющего в пустыне (een roepende in de woestijn). Antiek: ахиллесова пята, дамоклов меч, троянский конь, сизифов труд, авгиевы конюшни, яблоко раздора, между Сциллой и Харибдой. Volks en historisch: бить в набат (alarm slaan), положить под сукно (in de la laten liggen), пускать пыль в глаза (indruk willen maken), водить за нос (aan het lijntje houden), тянуть кота за хвост (talmen), ломать голову (je hoofd breken), после дождичка в четверг (met sint-juttemis), потёмкинские деревни (Potemkindorpen).",
    example: 'Этот вопрос стал притчей во языцех. / Проект положили под сукно. / Не води меня за нос!'
  },
  {
    code: 'CULTURAL-REFERENCES',
    title: 'Culturele en historische referenties',
    explanation:
      "Een ontwikkelde Rus citeert voortdurend, vaak zonder bron te noemen. Gribojedov, «Горе от ума»: А судьи кто? (retorisch: wie zijn zij om te oordelen?), Счастливые часов не наблюдают (gelukkigen kijken niet op de klok), Свежо предание, а верится с трудом (mooi verhaal, maar moeilijk te geloven). Poesjkin: Народ безмолвствует («Борис Годунов»: het volk zwijgt, berusting), Я вас любил... Gogol, «Ревизор»: К нам едет ревизор! (paniek om een inspectie), хлестаковщина (bluf), Тришкин кафтан (Krylov: lapmiddel dat elders een gat slaat). Gontsjarov: обломовщина (lethargie). Tsjernysjevski/Herzen: Что делать? en Кто виноват? — de 'eeuwige Russische vragen'. Dostojevski: Красота спасёт мир; Тварь ли я дрожащая или право имею? Tolstoj: Все счастливые семьи похожи друг на друга... Tjoettsjev: Умом Россию не понять. Boelgakov: Рукописи не горят; Квартирный вопрос их испортил; Аннушка уже разлила масло (het onheil is al in gang gezet). Sovjet-erfgoed: коммуналка, дефицит, блат (connecties), субботник, «Ирония судьбы» (elk oudjaar op tv), Есть ли жизнь на Марсе? (uit «Карнавальная ночь»: een onbeantwoordbare vraag).",
    example: 'Ну, это как в «Ревизоре»: к нам едет ревизор! / Не ищи виноватых — извечный вопрос «кто виноват?» ещё никто не решил.'
  }
];

const words = [
  // --- literair & zeldzaam ---
  { category: 'c2-literair', russian: 'обыденность', translation_nl: 'alledaagsheid / sleur' },
  { category: 'c2-literair', russian: 'мимолётный', translation_nl: 'vluchtig / kortstondig' },
  { category: 'c2-literair', russian: 'безмятежный', translation_nl: 'sereen / onbekommerd' },
  { category: 'c2-literair', russian: 'тщетный', translation_nl: 'vergeefs', notes: 'тщетно = tevergeefs.' },
  { category: 'c2-literair', russian: 'снисходительный', translation_nl: 'toegeeflijk; neerbuigend' },
  { category: 'c2-literair', russian: 'надменный', translation_nl: 'hooghartig / arrogant' },
  { category: 'c2-literair', russian: 'отчаяние', translation_nl: 'wanhoop', notes: 'в отчаянии = wanhopig.' },
  { category: 'c2-literair', russian: 'упоение', translation_nl: 'vervoering / roes' },
  { category: 'c2-literair', russian: 'изысканный', translation_nl: 'verfijnd / exquis' },
  { category: 'c2-literair', russian: 'невзначай', translation_nl: 'per ongeluk / terloops' },
  { category: 'c2-literair', russian: 'сокровенный', translation_nl: 'innigst / diep verborgen (geheim, wens)' },
  { category: 'c2-literair', russian: 'блаженство', translation_nl: 'gelukzaligheid' },
  { category: 'c2-literair', russian: 'сумерки', translation_nl: 'schemering', notes: 'Alleen meervoud.' },
  { category: 'c2-literair', russian: 'ветхий', translation_nl: 'vervallen / bouwvallig; oud', notes: 'Ветхий Завет = het Oude Testament.' },
  { category: 'c2-literair', russian: 'дремучий', translation_nl: 'dicht en donker (bos); achterlijk' },
  { category: 'c2-literair', russian: 'неумолимый', translation_nl: 'onverbiddelijk' },

  // --- frazeologie ---
  { category: 'c2-frazeologie', russian: 'ахиллесова пята', translation_nl: 'achilleshiel', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'дамоклов меч', translation_nl: 'zwaard van Damocles', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'притча во языцех', translation_nl: 'het gesprek van de dag / iets waar iedereen over praat', grammarRule: 'PHRASEOLOGY-SOURCES', notes: 'Kerkslavisch: во языцех = onder de volkeren.' },
  { category: 'c2-frazeologie', russian: 'камень преткновения', translation_nl: 'struikelblok', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'манна небесная', translation_nl: 'manna uit de hemel / een onverwacht geschenk', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'козёл отпущения', translation_nl: 'zondebok', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'сизифов труд', translation_nl: 'sisyfusarbeid / zinloos werk', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'яблоко раздора', translation_nl: 'twistappel', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'бить в набат', translation_nl: 'alarm slaan', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'положить под сукно', translation_nl: 'in de la laten liggen / op de lange baan schuiven', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'пускать пыль в глаза', translation_nl: 'zand in de ogen strooien / indruk willen maken', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'водить за нос', translation_nl: 'aan het lijntje houden', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'тянуть кота за хвост', translation_nl: 'treuzelen / de zaak rekken', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'после дождичка в четверг', translation_nl: 'met sint-juttemis (nooit)', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'потёмкинские деревни', translation_nl: 'Potemkindorpen / schone schijn', grammarRule: 'PHRASEOLOGY-SOURCES' },
  { category: 'c2-frazeologie', russian: 'глас вопиющего в пустыне', translation_nl: 'een roepende in de woestijn', grammarRule: 'PHRASEOLOGY-SOURCES' },

  // --- culturele referenties ---
  { category: 'c2-cultuur-referenties', russian: 'А судьи кто?', translation_nl: 'Wie zijn zij om te oordelen? (Gribojedov)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'Счастливые часов не наблюдают', translation_nl: 'Gelukkige mensen kijken niet op de klok (Gribojedov)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'К нам едет ревизор!', translation_nl: 'De inspecteur komt eraan! — paniek om een controle (Gogol)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'обломовщина', translation_nl: 'lethargie, apathisch nietsdoen (naar Gontsjarovs Oblomov)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'хлестаковщина', translation_nl: 'schaamteloos bluffen (naar Chlestakov uit De Revisor)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'Тришкин кафтан', translation_nl: 'een lapmiddel dat elders een gat slaat (Krylov)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'Что делать?', translation_nl: 'Wat te doen? — de eeuwige Russische vraag (Tsjernysjevski)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'Кто виноват?', translation_nl: 'Wie is schuldig? — de andere eeuwige vraag (Herzen)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'Красота спасёт мир', translation_nl: 'Schoonheid zal de wereld redden (Dostojevski)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'Умом Россию не понять', translation_nl: 'Rusland is met het verstand niet te begrijpen (Tjoettsjev)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'Рукописи не горят', translation_nl: 'Manuscripten branden niet (Boelgakov: de waarheid is onverwoestbaar)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'Аннушка уже разлила масло', translation_nl: 'Het onheil is al in gang gezet (Boelgakov)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'Народ безмолвствует', translation_nl: 'Het volk zwijgt (Poesjkin: berusting)', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'блат', translation_nl: 'connecties / kruiwagen (Sovjet-erfenis)', grammarRule: 'CULTURAL-REFERENCES', notes: 'по блату = via via.' },
  { category: 'c2-cultuur-referenties', russian: 'коммуналка', translation_nl: 'gedeeld appartement (Sovjet); nutslasten', grammarRule: 'CULTURAL-REFERENCES' },
  { category: 'c2-cultuur-referenties', russian: 'Ирония судьбы', translation_nl: 'de oudejaarsfilm die heel Rusland jaarlijks kijkt', grammarRule: 'CULTURAL-REFERENCES' },

  // --- humor & woordspel ---
  { category: 'c2-humor-woordspel', russian: 'каламбур', translation_nl: 'woordspeling' },
  { category: 'c2-humor-woordspel', russian: 'анекдот', translation_nl: 'mop / grap (verteld)', notes: 'Niet "anekdote": een Russische анекдот is een mop.' },
  { category: 'c2-humor-woordspel', russian: 'сарказм', translation_nl: 'sarcasme' },
  { category: 'c2-humor-woordspel', russian: 'самоирония', translation_nl: 'zelfspot' },
  { category: 'c2-humor-woordspel', russian: 'чёрный юмор', translation_nl: 'zwarte humor' },
  { category: 'c2-humor-woordspel', russian: 'подтекст', translation_nl: 'ondertoon / subtekst' },
  { category: 'c2-humor-woordspel', russian: 'издёвка', translation_nl: 'spot / hoon' },
  { category: 'c2-humor-woordspel', russian: 'стёб', translation_nl: 'ironische spot / dollen (informeel)', notes: 'стебаться над + instrumentalis.' },
  { category: 'c2-humor-woordspel', russian: 'тонкий намёк', translation_nl: 'subtiele hint', notes: 'тонкий намёк на толстые обстоятельства (ironisch: niet zo subtiel).' },
  { category: 'c2-humor-woordspel', russian: 'двусмысленность', translation_nl: 'dubbelzinnigheid' },
  { category: 'c2-humor-woordspel', russian: 'острота', translation_nl: 'kwinkslag / geestige opmerking; scherpte' },
  { category: 'c2-humor-woordspel', russian: 'пародия', translation_nl: 'parodie' },

  // --- juridisch & financieel ---
  { category: 'c2-juridisch-financieel', russian: 'истец', translation_nl: 'eiser' },
  { category: 'c2-juridisch-financieel', russian: 'ответчик', translation_nl: 'gedaagde' },
  { category: 'c2-juridisch-financieel', russian: 'иск', translation_nl: 'vordering / rechtszaak', notes: 'подать иск = een vordering instellen.' },
  { category: 'c2-juridisch-financieel', russian: 'взыскание', translation_nl: 'inning / invordering; sanctie' },
  { category: 'c2-juridisch-financieel', russian: 'неустойка', translation_nl: 'boetebeding / contractuele boete' },
  { category: 'c2-juridisch-financieel', russian: 'дебиторская задолженность', translation_nl: 'debiteuren / uitstaande vorderingen' },
  { category: 'c2-juridisch-financieel', russian: 'обеспечение', translation_nl: 'zekerheid / onderpand; voorziening' },
  { category: 'c2-juridisch-financieel', russian: 'ликвидность', translation_nl: 'liquiditeit' },
  { category: 'c2-juridisch-financieel', russian: 'аудит', translation_nl: 'audit / accountantscontrole' },
  { category: 'c2-juridisch-financieel', russian: 'устав', translation_nl: 'statuten' },
  { category: 'c2-juridisch-financieel', russian: 'учредитель', translation_nl: 'oprichter / aandeelhouder-oprichter' },
  { category: 'c2-juridisch-financieel', russian: 'юридическое лицо', translation_nl: 'rechtspersoon', notes: 'физическое лицо = natuurlijk persoon.' },
  { category: 'c2-juridisch-financieel', russian: 'обжаловать', translation_nl: 'in beroep gaan tegen' },
  { category: 'c2-juridisch-financieel', russian: 'вступить в силу', translation_nl: 'in werking treden' },

  // --- IT & systeembeheer ---
  { category: 'c2-it-techniek', russian: 'отказоустойчивость', translation_nl: 'redundantie / fouttolerantie' },
  { category: 'c2-it-techniek', russian: 'развёртывание', translation_nl: 'uitrol / deployment', notes: 'развернуть сервер = een server uitrollen.' },
  { category: 'c2-it-techniek', russian: 'резервное копирование', translation_nl: 'back-up (het maken van)', notes: 'резервная копия = de back-up zelf.' },
  { category: 'c2-it-techniek', russian: 'уязвимость', translation_nl: 'kwetsbaarheid (security)' },
  { category: 'c2-it-techniek', russian: 'шифрование', translation_nl: 'versleuteling' },
  { category: 'c2-it-techniek', russian: 'нагрузка', translation_nl: 'belasting / load' },
  { category: 'c2-it-techniek', russian: 'масштабирование', translation_nl: 'schaalbaarheid / opschalen' },
  { category: 'c2-it-techniek', russian: 'журнал событий', translation_nl: 'logboek / eventlog', notes: 'Ook лог in jargon.' },
  { category: 'c2-it-techniek', russian: 'права доступа', translation_nl: 'toegangsrechten' },
  { category: 'c2-it-techniek', russian: 'учётная запись', translation_nl: 'account / gebruikersaccount', notes: 'Jargon: аккаунт, учётка.' },
  { category: 'c2-it-techniek', russian: 'обновление безопасности', translation_nl: 'beveiligingsupdate' },
  { category: 'c2-it-techniek', russian: 'простой', translation_nl: 'downtime / stilstand', notes: 'Klemtoon: просто́й (niet про́стой = eenvoudig).' },
  { category: 'c2-it-techniek', russian: 'восстановление после сбоя', translation_nl: 'disaster recovery / herstel na storing' },
  { category: 'c2-it-techniek', russian: 'виртуальная машина', translation_nl: 'virtuele machine' },
  { category: 'c2-it-techniek', russian: 'техническое задание', translation_nl: 'programma van eisen / specificatie', notes: 'Afkorting: ТЗ.' },
  { category: 'c2-it-techniek', russian: 'соглашение об уровне обслуживания', translation_nl: 'SLA (service level agreement)' },

  // --- regionaal ---
  { category: 'c2-regionaal', russian: 'поребрик', translation_nl: 'stoeprand (Petersburg; Moskou: бордюр)' },
  { category: 'c2-regionaal', russian: 'парадная', translation_nl: 'portiek / trappenhuis (Petersburg; Moskou: подъезд)' },
  { category: 'c2-regionaal', russian: 'шаверма', translation_nl: 'shoarma (Petersburg; Moskou: шаурма)' },
  { category: 'c2-regionaal', russian: 'булка', translation_nl: 'witbrood (Petersburg; Moskou: батон)' },
  { category: 'c2-regionaal', russian: 'оканье', translation_nl: 'noordelijke uitspraak waarbij de onbeklemtoonde о als о klinkt', notes: 'Tegenover het standaard аканье.' },
  { category: 'c2-regionaal', russian: 'суржик', translation_nl: 'mengtaal van Russisch en Oekraïens' },
  { category: 'c2-regionaal', russian: 'трасянка', translation_nl: 'mengtaal van Russisch en Belarussisch' },
  { category: 'c2-regionaal', russian: 'чё', translation_nl: 'wat? (spreektaal, Oeral/Siberië; ook algemeen informeel)' },
  { category: 'c2-regionaal', russian: 'мультифора', translation_nl: 'insteekhoes (Siberië; elders файл)' },
  { category: 'c2-regionaal', russian: 'кулёк', translation_nl: 'plastic zakje (zuiden/Oekraïne; elders пакет)' },
  { category: 'c2-regionaal', russian: 'гэкать', translation_nl: 'de г zachtjes als h uitspreken (zuidelijk, Oekraïens)' },
  { category: 'c2-regionaal', russian: 'айда', translation_nl: 'kom mee / laten we gaan (Tataars-Russisch, Oeral, Kazachstan)' },

  // --- fijnzinnige emoties ---
  { category: 'c2-emoties-fijn', russian: 'тоска', translation_nl: 'diepe weemoed / heimwee / zielspijn', notes: 'Onvertaalbaar volgens Nabokov; тоска по родине = heimwee.' },
  { category: 'c2-emoties-fijn', russian: 'умиление', translation_nl: 'vertedering' },
  { category: 'c2-emoties-fijn', russian: 'смятение', translation_nl: 'verwarring / ontreddering' },
  { category: 'c2-emoties-fijn', russian: 'злорадство', translation_nl: 'leedvermaak' },
  { category: 'c2-emoties-fijn', russian: 'досада', translation_nl: 'ergernis / spijt over een tegenvaller', notes: 'Какая досада! = wat jammer nou.' },
  { category: 'c2-emoties-fijn', russian: 'недоумение', translation_nl: 'verbijstering / niet-begrijpen' },
  { category: 'c2-emoties-fijn', russian: 'благоговение', translation_nl: 'eerbied / ontzag' },
  { category: 'c2-emoties-fijn', russian: 'томление', translation_nl: 'smachten / kwellend verlangen' },
  { category: 'c2-emoties-fijn', russian: 'хандра', translation_nl: 'zwaarmoedigheid / de blues', notes: 'Poesjkin: русская хандра.' },
  { category: 'c2-emoties-fijn', russian: 'азарт', translation_nl: 'gedrevenheid / gokkoorts', notes: 'войти в азарт = op dreef raken.' },
  { category: 'c2-emoties-fijn', russian: 'угрызения совести', translation_nl: 'wroeging' },
  { category: 'c2-emoties-fijn', russian: 'трепет', translation_nl: 'beven / huivering (van ontzag of opwinding)' },

  // --- schrijftaal ---
  { category: 'c2-grammatica-schrijftaal', russian: 'тире', translation_nl: 'gedachtestreepje', grammarRule: 'WRITTEN-STYLE-PUNCTUATION', notes: 'Onverbuigbaar.' },
  { category: 'c2-grammatica-schrijftaal', russian: 'кавычки', translation_nl: 'aanhalingstekens', grammarRule: 'WRITTEN-STYLE-PUNCTUATION', notes: 'в кавычках = tussen aanhalingstekens (ook figuurlijk).' },
  { category: 'c2-grammatica-schrijftaal', russian: 'причастный оборот', translation_nl: 'deelwoordconstructie', grammarRule: 'WRITTEN-STYLE-PUNCTUATION' },
  { category: 'c2-grammatica-schrijftaal', russian: 'вводное слово', translation_nl: 'inleidend woord (tussen komma\'s)', grammarRule: 'WRITTEN-STYLE-PUNCTUATION' },
  { category: 'c2-grammatica-schrijftaal', russian: 'двоеточие', translation_nl: 'dubbele punt', grammarRule: 'WRITTEN-STYLE-PUNCTUATION' },
  { category: 'c2-grammatica-schrijftaal', russian: 'абзац', translation_nl: 'alinea', grammarRule: 'WRITTEN-STYLE-PUNCTUATION' },

  // --- aspectmeesterschap ---
  { category: 'c2-grammatica-aspect-meesterschap', russian: 'жениться', translation_nl: 'trouwen (man) — tweeaspectig', grammarRule: 'ASPECT-MASTERY' },
  { category: 'c2-grammatica-aspect-meesterschap', russian: 'использовать', translation_nl: 'gebruiken — tweeaspectig', grammarRule: 'ASPECT-MASTERY' },
  { category: 'c2-grammatica-aspect-meesterschap', russian: 'обещать', translation_nl: 'beloven — tweeaspectig', grammarRule: 'ASPECT-MASTERY' },
  { category: 'c2-grammatica-aspect-meesterschap', russian: 'перестать', translation_nl: 'ophouden met (+ onvoltooide infinitief)', grammarRule: 'ASPECT-MASTERY' },
  { category: 'c2-grammatica-aspect-meesterschap', russian: 'стать', translation_nl: 'worden; beginnen te (+ onvoltooide infinitief)', grammarRule: 'ASPECT-MASTERY' },
  { category: 'c2-grammatica-aspect-meesterschap', russian: 'двувидовой глагол', translation_nl: 'tweeaspectig werkwoord', grammarRule: 'ASPECT-MASTERY' },

  // --- stilistiek ---
  { category: 'c2-grammatica-stilistiek', russian: 'инверсия', translation_nl: 'inversie', grammarRule: 'STYLISTIC-SYNTAX' },
  { category: 'c2-grammatica-stilistiek', russian: 'парцелляция', translation_nl: 'parcellatie (zin in losse stukken hakken)', grammarRule: 'STYLISTIC-SYNTAX' },
  { category: 'c2-grammatica-stilistiek', russian: 'эллипсис', translation_nl: 'ellips (weglating)', grammarRule: 'STYLISTIC-SYNTAX' },
  { category: 'c2-grammatica-stilistiek', russian: 'риторический вопрос', translation_nl: 'retorische vraag', grammarRule: 'STYLISTIC-SYNTAX' },
  { category: 'c2-grammatica-stilistiek', russian: 'оксюморон', translation_nl: 'oxymoron', grammarRule: 'STYLISTIC-SYNTAX', notes: 'живой труп, горячий снег.' },
  { category: 'c2-grammatica-stilistiek', russian: 'анафора', translation_nl: 'anafora (herhaling aan het begin)', grammarRule: 'STYLISTIC-SYNTAX' }
];

const grammarExercises = [
  // WRITTEN-STYLE-PUNCTUATION
  {
    category: 'c2-grammatica-schrijftaal', grammarRule: 'WRITTEN-STYLE-PUNCTUATION', type: 'mc',
    prompt: "Welke zin is correct geïnterpungeerd?",
    correctAnswer: 'Студент, читающий книгу, сидел у окна.', options: ['Студент читающий книгу сидел у окна.', 'Студент, читающий книгу, сидел у окна.', 'Студент, читающий книгу сидел у окна.'],
    explanation: "Een deelwoordconstructie die ná het zelfstandig naamwoord staat, wordt aan beide kanten door een komma afgesloten. Zou de constructie vooraf gaan (Читающий книгу студент сидел у окна), dan komen er geen komma's."
  },
  {
    category: 'c2-grammatica-schrijftaal', grammarRule: 'WRITTEN-STYLE-PUNCTUATION', type: 'mc',
    prompt: "Welk leesteken hoort tussen 'Москва' en 'столица России'?",
    correctAnswer: 'een gedachtestreepje (тире)', options: ['een komma', 'een gedachtestreepje (тире)', 'niets'],
    explanation: "Tussen onderwerp en naamwoordelijk gezegde die beide zelfstandige naamwoorden in de nominatief zijn, vervangt het тире het ontbrekende koppelwerkwoord: Москва — столица России."
  },
  {
    category: 'c2-grammatica-schrijftaal', grammarRule: 'WRITTEN-STYLE-PUNCTUATION', type: 'mc',
    prompt: "Welke aanhalingstekens gebruikt een gedrukte Russische tekst standaard?",
    correctAnswer: '«ёлочки»', options: ['"английские"', '«ёлочки»', "'одинарные'"],
    explanation: "In Russisch drukwerk zijn de guillemets «...» (ёлочки, 'kerstboompjes') de norm; „lapki“ gebruik je voor een citaat binnen een citaat. Rechte Engelse aanhalingstekens gelden als slordig."
  },
  {
    category: 'c2-grammatica-schrijftaal', grammarRule: 'WRITTEN-STYLE-PUNCTUATION', type: 'mc',
    prompt: "In welke zin is de komma fout?",
    correctAnswer: 'Я купил хлеб, и молоко.', options: ['Я думаю, что он прав.', 'Я купил хлеб, и молоко.', 'Он устал, но продолжал работать.'],
    explanation: "Vóór и tussen twee gelijkwaardige zinsdelen (хлеб и молоко) komt geen komma. Vóór что en но is de komma wél verplicht."
  },

  // ASPECT-MASTERY
  {
    category: 'c2-grammatica-aspect-meesterschap', grammarRule: 'ASPECT-MASTERY', type: 'mc',
    prompt: "Vul aan: Он перестал ___ . (hij is gestopt met roken)",
    correctAnswer: 'курить', options: ['курить', 'покурить', 'закурить'],
    explanation: "Na faseverba (начать, перестать, продолжать, бросить) staat altijd de onvoltooide infinitief: перестал курить."
  },
  {
    category: 'c2-grammatica-aspect-meesterschap', grammarRule: 'ASPECT-MASTERY', type: 'mc',
    prompt: "Welk aspect heeft 'использовать' in 'Мы использовали этот метод'?",
    correctAnswer: 'onbepaald: het werkwoord is tweeaspectig, alleen de context beslist', options: ['onvoltooid', 'voltooid', 'onbepaald: het werkwoord is tweeaspectig, alleen de context beslist'],
    explanation: "использовать is een двувидовой глагол: dezelfde vorm dient als onvoltooid én voltooid. 'Мы использовали' kan zowel 'we gebruikten (steeds)' als 'we hebben (eenmalig) gebruikt' betekenen."
  },
  {
    category: 'c2-grammatica-aspect-meesterschap', grammarRule: 'ASPECT-MASTERY', type: 'mc',
    prompt: "Wat drukt de zin 'Как выпьет — так и запоёт' uit?",
    correctAnswer: 'een terugkerende gewoonte, verteld met voltooide futurumvormen', options: ['een eenmalige gebeurtenis in de toekomst', 'een terugkerende gewoonte, verteld met voltooide futurumvormen', 'een bevel'],
    explanation: "Het voltooide futurum (выпьет, запоёт) beschrijft hier een typisch, steeds terugkerend patroon: 'zodra hij drinkt, begint hij te zingen' — de zogeheten voorbeeldbetekenis."
  },
  {
    category: 'c2-grammatica-aspect-meesterschap', grammarRule: 'ASPECT-MASTERY', type: 'mc',
    prompt: "Welke zin gebruikt het historisch presens?",
    correctAnswer: 'Иду я вчера домой, и вдруг звонит телефон.', options: ['Я шёл вчера домой, и вдруг зазвонил телефон.', 'Иду я вчера домой, и вдруг звонит телефон.', 'Я пойду завтра домой.'],
    explanation: "Een verhaal over gisteren in de tegenwoordige tijd (иду, звонит) maakt het levendig: het historisch presens, typisch voor mondelinge vertellingen, met inversie (Иду я...)."
  },

  // STYLISTIC-SYNTAX
  {
    category: 'c2-grammatica-stilistiek', grammarRule: 'STYLISTIC-SYNTAX', type: 'mc',
    prompt: "Welk stijlmiddel zit in 'Он ушёл. Навсегда. Без слов.'?",
    correctAnswer: 'parcellatie', options: ['anafora', 'parcellatie', 'oxymoron'],
    explanation: "Eén gedachte is in losse, korte zinnen gehakt om elk deel nadruk te geven: parcellatie."
  },
  {
    category: 'c2-grammatica-stilistiek', grammarRule: 'STYLISTIC-SYNTAX', type: 'mc',
    prompt: "'Ночь, улица, фонарь, аптека' (Blok) is een voorbeeld van:",
    correctAnswer: 'een nominale zin (alleen zelfstandige naamwoorden)', options: ['een retorische vraag', 'een nominale zin (alleen zelfstandige naamwoorden)', 'een ellips van het onderwerp'],
    explanation: "Een reeks zelfstandige naamwoorden zonder werkwoord schetst een sfeerbeeld: de nominale zin (назывное предложение)."
  },
  {
    category: 'c2-grammatica-stilistiek', grammarRule: 'STYLISTIC-SYNTAX', type: 'mc',
    prompt: "Welke zin is een oxymoron?",
    correctAnswer: 'горячий снег', options: ['горячий чай', 'горячий снег', 'горячий спор'],
    explanation: "Een oxymoron combineert twee tegenstrijdige begrippen: hete sneeuw. горячий чай is letterlijk, горячий спор (verhitte discussie) is een gewone metafoor."
  },

  // PHRASEOLOGY-SOURCES
  {
    category: 'c2-frazeologie', grammarRule: 'PHRASEOLOGY-SOURCES', type: 'mc',
    prompt: "Wat betekent 'Этот проект положили под сукно'?",
    correctAnswer: 'Het project is in de la gelegd / op de lange baan geschoven.', options: ['Het project is goedgekeurd.', 'Het project is in de la gelegd / op de lange baan geschoven.', 'Het project is geheim verklaard.'],
    explanation: "положить под сукно (onder het laken leggen: het groene laken van een ambtelijk bureau) = een zaak bewust laten liggen."
  },
  {
    category: 'c2-frazeologie', grammarRule: 'PHRASEOLOGY-SOURCES', type: 'mc',
    prompt: "Uit welke bron komt 'притча во языцех'?",
    correctAnswer: 'de Bijbel (kerkslavische vorm)', options: ['de Griekse mythologie', 'de Bijbel (kerkslavische vorm)', 'een roman van Gogol'],
    explanation: "'во языцех' is de oude kerkslavische prepositief meervoud van язык (volk): 'een gelijkenis onder de volkeren' (Deuteronomium). Vandaar de ongewone vorm."
  },
  {
    category: 'c2-frazeologie', grammarRule: 'PHRASEOLOGY-SOURCES', type: 'mc',
    prompt: "Wanneer krijg je iets terug 'после дождичка в четверг'?",
    correctAnswer: 'nooit (met sint-juttemis)', options: ['volgende donderdag', 'nooit (met sint-juttemis)', 'als het regent'],
    explanation: "De uitdrukking verwijst spottend naar het heidense gebruik om de dondergod Peroen op donderdag om regen te vragen — wat zelden hielp. Betekenis: nooit."
  },

  // CULTURAL-REFERENCES
  {
    category: 'c2-cultuur-referenties', grammarRule: 'CULTURAL-REFERENCES', type: 'mc',
    prompt: "Een collega zegt over een onverwachte controle: 'Ну всё, к нам едет ревизор!' Waar verwijst hij naar?",
    correctAnswer: "Gogols komedie «Ревизор»: paniek om een inspectie", options: ["Poesjkins «Борис Годунов»", "Gogols komedie «Ревизор»: paniek om een inspectie", "een Sovjetfilm over de politie"],
    explanation: "De openingszin van Gogols «Ревизор» (1836) is spreekwoordelijk geworden voor de paniek die uitbreekt als een inspecteur wordt verwacht."
  },
  {
    category: 'c2-cultuur-referenties', grammarRule: 'CULTURAL-REFERENCES', type: 'mc',
    prompt: "Wat bedoelt iemand met 'Аннушка уже разлила масло'?",
    correctAnswer: 'Het is al te laat; het onheil is onafwendbaar in gang gezet.', options: ['Het eten is klaar.', 'Het is al te laat; het onheil is onafwendbaar in gang gezet.', 'Iemand heeft een fout gemaakt en moet opruimen.'],
    explanation: "In Boelgakovs «Мастер и Маргарита» voorspelt Woland dat Berlioz zal sterven omdat Annoesjka al zonnebloemolie heeft gemorst — waar hij zal uitglijden. De zin betekent: de keten van gebeurtenissen is al niet meer te stoppen."
  },
  {
    category: 'c2-cultuur-referenties', grammarRule: 'CULTURAL-REFERENCES', type: 'mc',
    prompt: "Wat is 'обломовщина'?",
    correctAnswer: 'apathische lethargie en nietsdoen, naar de romanheld Oblomov', options: ['overdreven werklust', 'apathische lethargie en nietsdoen, naar de romanheld Oblomov', 'zuinigheid'],
    explanation: "Gontsjarovs Oblomov (1859) brengt zijn dagen op de bank door; het achtervoegsel -щина maakt van een naam een (meestal negatief) maatschappelijk verschijnsel."
  }
];

const practicalSentences = [
  { category: 'c2-praktische-zinnen', prompt: 'Met alle respect, maar uw redenering gaat mank.', tokens: ['При', 'всём', 'уважении,', 'ваша', 'аргументация', 'хромает.'], explanation: "'При всём уважении' = met alle respect; 'хромать' (mank lopen) wordt figuurlijk gebruikt voor een zwakke redenering." },
  { category: 'c2-praktische-zinnen', prompt: 'Onderhavige overeenkomst treedt in werking op het moment van ondertekening.', tokens: ['Настоящий', 'договор', 'вступает', 'в', 'силу', 'с', 'момента', 'подписания.'], explanation: "Juridisch standaardformule: 'настоящий договор' = deze overeenkomst; 'вступать в силу' = in werking treden; 'с момента' + genitief." },
  { category: 'c2-praktische-zinnen', prompt: 'De storing werd veroorzaakt door een verlopen certificaat op de back-upserver.', tokens: ['Сбой', 'был', 'вызван', 'истёкшим', 'сертификатом', 'на', 'резервном', 'сервере.'], explanation: "Passief met korte deelwoord: 'был вызван' + instrumentalis van de oorzaak (истёкшим сертификатом = door een verlopen certificaat)." },
  { category: 'c2-praktische-zinnen', prompt: 'Laten we geen Potemkindorpen bouwen: de cijfers spreken voor zich.', tokens: ['Не', 'будем', 'строить', 'потёмкинские', 'деревни:', 'цифры', 'говорят', 'сами', 'за', 'себя.'], explanation: "'потёмкинские деревни' = schone schijn; 'говорить сами за себя' = voor zich spreken. De dubbele punt kondigt de verklaring aan." },
  { category: 'c2-praktische-zinnen', prompt: 'Hij heeft, om het zacht uit te drukken, een hooghartige manier van doen.', tokens: ['У', 'него,', 'мягко', 'говоря,', 'надменная', 'манера', 'держаться.'], explanation: "'манера держаться' = manier van doen/houding; 'мягко говоря' tussen komma's als inleidend gerundium." },
  { category: 'c2-praktische-zinnen', prompt: 'Zoals Gribojedov al zei: wie zijn zij om te oordelen?', tokens: ['Как', 'говорил', 'Грибоедов:', 'а', 'судьи', 'кто?'], explanation: "Een klassiek citaat inleiden met 'как говорил/писал' + naam. 'А судьи кто?' wordt zonder verdere uitleg begrepen." },
  { category: 'c2-praktische-zinnen', prompt: 'Ik vraag u dit verzoek met voorrang te behandelen.', tokens: ['Прошу', 'рассмотреть', 'данное', 'обращение', 'в', 'приоритетном', 'порядке.'], explanation: "Ambtelijk register: 'данное обращение' = dit verzoek; 'в приоритетном порядке' = met voorrang (letterlijk: in prioritaire volgorde)." },
  { category: 'c2-praktische-zinnen', prompt: 'Zijn stilzwijgen sprak boekdelen.', tokens: ['Его', 'молчание', 'было', 'красноречивее', 'любых', 'слов.'], explanation: "'красноречивее любых слов' = welsprekender dan welke woorden ook (vergrotende trap + genitief)." },
  { category: 'c2-praktische-zinnen', prompt: 'We kunnen de kosten niet blijven afwentelen op de klant.', tokens: ['Мы', 'не', 'можем', 'бесконечно', 'перекладывать', 'расходы', 'на', 'клиента.'], explanation: "'перекладывать на' + accusatief = afwentelen op; 'бесконечно' = eindeloos." },
  { category: 'c2-praktische-zinnen', prompt: 'Toegang tot de productieomgeving wordt uitsluitend op basis van rollen verleend.', tokens: ['Доступ', 'к', 'производственной', 'среде', 'предоставляется', 'исключительно', 'на', 'основе', 'ролей.'], explanation: "Technisch-formeel: 'предоставляться' (passief -ся) = worden verleend; 'на основе' + genitief = op basis van." },
  { category: 'c2-praktische-zinnen', prompt: 'Ironisch genoeg was juist de reservekopie beschadigd.', tokens: ['По', 'иронии', 'судьбы,', 'повреждённой', 'оказалась', 'именно', 'резервная', 'копия.'], explanation: "'по иронии судьбы' = ironisch genoeg; 'оказаться' + instrumentalis (повреждённой) = blijken te zijn; 'именно' benadrukt 'juist'." },
  { category: 'c2-praktische-zinnen', prompt: 'Ik kan niet zeggen dat het me koud laat.', tokens: ['Не', 'могу', 'сказать,', 'что', 'меня', 'это', 'оставляет', 'равнодушным.'], explanation: "Litotes (dubbele ontkenning als understatement): 'оставлять равнодушным' = onverschillig laten; een vrouw zegt равнодушной." }
];

const readings = [
  {
    category: 'c2-lezen',
    title: 'Пункт договора: ответственность сторон',
    passage:
      '5.1. За нарушение сроков оказания услуг, предусмотренных пунктом 3.2 настоящего Договора, Исполнитель уплачивает Заказчику неустойку в размере 0,1 % от стоимости несвоевременно оказанных услуг за каждый день просрочки, но не более 10 % от общей стоимости услуг. 5.2. Уплата неустойки не освобождает Исполнителя от исполнения обязательств в натуре. 5.3. Стороны освобождаются от ответственности за частичное или полное неисполнение обязательств, если оно явилось следствием обстоятельств непреодолимой силы, при условии уведомления другой стороны в течение пяти рабочих дней.',
    questions: [
      { prompt: 'Wat is het maximale boetebedrag bij te late levering?', correctAnswer: '10% van de totale waarde van de diensten', options: ['0,1% van de totale waarde', '10% van de totale waarde van de diensten', 'onbeperkt'], explanation: "'но не более 10 % от общей стоимости услуг' = maar niet meer dan 10% van de totale waarde. De 0,1% is het dagtarief." },
      { prompt: "Wat betekent 'исполнение обязательств в натуре'?", correctAnswer: 'de verplichting daadwerkelijk nakomen (de dienst alsnog leveren)', options: ['betaling in natura (goederen in plaats van geld)', 'de verplichting daadwerkelijk nakomen (de dienst alsnog leveren)', 'ontbinding van het contract'], explanation: "Juridisch jargon: 'в натуре' = daadwerkelijk, feitelijk. De boete betalen ontslaat de uitvoerder niet van de plicht de dienst alsnog te leveren." },
      { prompt: 'Onder welke voorwaarde geldt overmacht?', correctAnswer: 'als de andere partij binnen vijf werkdagen is geïnformeerd', options: ['altijd', 'als de andere partij binnen vijf werkdagen is geïnformeerd', 'alleen bij natuurrampen'], explanation: "'при условии уведомления другой стороны в течение пяти рабочих дней' = op voorwaarde van kennisgeving aan de andere partij binnen vijf werkdagen. 'обстоятельства непреодолимой силы' = overmacht." }
    ]
  },
  {
    category: 'c2-lezen',
    title: 'Отчёт об инциденте',
    passage:
      'В 03:14 система мониторинга зафиксировала недоступность основного сервера базы данных. Автоматическое переключение на резервный узел не сработало из-за расхождения версий конфигурации, возникшего после планового обновления накануне. Дежурный инженер восстановил работоспособность вручную к 04:02; простой составил 48 минут, потери данных не выявлено. Первопричина: обновление было развёрнуто без предварительной проверки совместимости на тестовом стенде. Меры: внедрить обязательное тестирование конфигураций, добавить проверку согласованности версий в процедуру переключения, пересмотреть регламент плановых работ.',
    questions: [
      { prompt: 'Waarom werkte de automatische failover niet?', correctAnswer: 'door een versieverschil in de configuratie na een geplande update', options: ['omdat de reserveserver uitstond', 'door een versieverschil in de configuratie na een geplande update', 'omdat de dienstdoende engineer niet reageerde'], explanation: "'из-за расхождения версий конфигурации, возникшего после планового обновления' = door een configuratie-versieverschil dat na de geplande update was ontstaan." },
      { prompt: 'Hoe lang was de downtime en ging er data verloren?', correctAnswer: '48 minuten; geen dataverlies', options: ['48 minuten; geen dataverlies', '3 uur; gedeeltelijk dataverlies', '14 minuten; geen dataverlies'], explanation: "'простой составил 48 минут, потери данных не выявлено' = de stilstand bedroeg 48 minuten, er is geen dataverlies vastgesteld." },
      { prompt: "'Первопричина' is het Russische woord voor:", correctAnswer: 'root cause', options: ['root cause', 'eerste melding', 'prioriteit'], explanation: "перво- (eerste) + причина (oorzaak) = de eerste/diepste oorzaak, in IT-jargon de root cause." }
    ]
  },
  {
    category: 'c2-lezen',
    title: 'Сатирическая колонка: совещание',
    passage:
      'Совещание было назначено на десять, начато в четверть одиннадцатого и посвящено, как выяснилось к одиннадцати, вопросу о том, когда провести следующее совещание. Докладчик, человек с усами и без тезисов, говорил о синергии так вдохновенно, что двое присутствующих проснулись. Решили: назначить ответственного за назначение ответственных. Протокол вести не стали — мол, и так всё понятно. Расходились с чувством глубокого удовлетворения: день прошёл не зря, а главное — ничего не было сделано, и, следовательно, ничего не могло быть сделано неправильно.',
    questions: [
      { prompt: 'Waarin schuilt de satire van de laatste zin?', correctAnswer: 'in de omgekeerde logica: niets doen wordt gepresenteerd als een succes omdat er dan ook niets fout kan gaan', options: ['in de beschrijving van de snor', 'in de omgekeerde logica: niets doen wordt gepresenteerd als een succes omdat er dan ook niets fout kan gaan', 'in het tijdstip van de vergadering'], explanation: "'ничего не было сделано, и, следовательно, ничего не могло быть сделано неправильно' — een quasi-logische conclusie die de bureaucratische mentaliteit ontmaskert." },
      { prompt: "Wat suggereert 'человек с усами и без тезисов'?", correctAnswer: 'een spreker met uiterlijk vertoon maar zonder inhoud (zeugma als stijlmiddel)', options: ['een geheim agent', 'een spreker met uiterlijk vertoon maar zonder inhoud (zeugma als stijlmiddel)', 'een man die zijn aantekeningen vergat'], explanation: "Door 'met snor' en 'zonder stellingen' grammaticaal gelijk te schakelen (een zeugma) wordt de spreker belachelijk gemaakt: vorm zonder inhoud.", grammarRule: 'STYLISTIC-SYNTAX' },
      { prompt: "Welke functie heeft 'мол' in 'мол, и так всё понятно'?", correctAnswer: 'het markeert de smoes van de deelnemers als citaat waar de auteur afstand van neemt', options: ['het benadrukt dat de auteur het ermee eens is', 'het markeert de smoes van de deelnemers als citaat waar de auteur afstand van neemt', 'het is een spelfout'], explanation: "мол geeft indirecte rede weer met een ironische afstand: 'want, zeiden ze, het was toch allemaal duidelijk'.", grammarRule: 'PARTICLES' }
    ]
  },
  {
    category: 'c2-lezen',
    title: 'Литературный фрагмент: Сумерки',
    passage:
      'Сумерки в этом городе наступали не сразу, а исподволь, как наступает старость: сначала тускнел свет на куполах, потом синели стены домов, и лишь потом, когда уже казалось, что вечер давно вступил в свои права, гасли окна. Он шёл вдоль набережной, не спеша, и думал о том, что тоска — вовсе не отсутствие чего-то, как принято считать, а, напротив, присутствие: слишком ясное, слишком полное ощущение всего, что могло бы быть и не случилось. Впрочем, подумал он, невзначай улыбнувшись, это тоже пройдёт. Всё проходит.',
    questions: [
      { prompt: 'Hoe definieert de hoofdpersoon тоска?', correctAnswer: 'niet als een gemis, maar als een te heldere aanwezigheid van alles wat had kunnen zijn', options: ['als verveling', 'niet als een gemis, maar als een te heldere aanwezigheid van alles wat had kunnen zijn', 'als angst voor de nacht'], explanation: "'тоска — вовсе не отсутствие чего-то... а, напротив, присутствие: слишком ясное, слишком полное ощущение всего, что могло бы быть и не случилось'." },
      { prompt: 'Welke vergelijking gebruikt de auteur voor het vallen van de avond?', correctAnswer: 'de schemering komt geleidelijk, zoals de ouderdom', options: ['de schemering valt als een gordijn', 'de schemering komt geleidelijk, zoals de ouderdom', 'de schemering is als een rivier'], explanation: "'наступали не сразу, а исподволь, как наступает старость' — 'исподволь' = gaandeweg, ongemerkt." },
      { prompt: "'Всё проходит.' als losse slotzin is een voorbeeld van:", correctAnswer: 'parcellatie met een allusie op de ring van Salomo (и это пройдёт)', options: ['een retorische vraag', 'parcellatie met een allusie op de ring van Salomo (и это пройдёт)', 'een oxymoron'], explanation: "De korte losse zin (parcellatie) verwijst naar de legende van Salomo's ring met de inscriptie 'ook dit gaat voorbij' — een referentie die een Russische lezer meteen herkent.", grammarRule: 'STYLISTIC-SYNTAX' }
    ]
  }
];

const drills = {
  conjugation: { category: 'c2-grammatica-vervoeging', rule: 'VERB-CONJUGATION', maxVerbs: 25 },
  aspect: { category: 'c2-grammatica-vervoeging', rule: 'ASPECT-PAIRS', maxVerbs: 20 },
  cases: { category: 'c2-grammatica-naamvallen', rule: 'NOUN-DECLENSION', maxNouns: 30 },
  comparative: { category: 'c2-grammatica-naamvallen', rule: 'COMPARATIVE-SUPERLATIVE', maxAdjectives: 15 }
};

module.exports = { categories, grammarRules, words, grammarExercises, practicalSentences, readings, drills };
