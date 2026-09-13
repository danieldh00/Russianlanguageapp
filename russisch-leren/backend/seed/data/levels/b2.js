// B2 (vantage): vlot meepraten over nieuws, werk, cultuur en maatschappij,
// klachten en noodgevallen afhandelen, en de grammatica van geschreven
// Russisch begrijpen: deelwoorden, gerundia, passief, samengestelde zinnen,
// woordvorming en korte bijvoeglijke naamwoorden.

const categories = [
  { slug: 'b2-nieuws-politiek', name: 'Nieuws & politiek', description: 'Het nieuws volgen en erover praten: verkiezingen, regering, protest, oorlog en vrede.', level: 'B2', sort_order: 70 },
  { slug: 'b2-milieu-klimaat', name: 'Milieu & klimaat', description: 'Klimaat, vervuiling, energie en duurzaamheid.', level: 'B2', sort_order: 71 },
  { slug: 'b2-technologie', name: 'Technologie & digitaal leven', description: 'Software, data, privacy, kunstmatige intelligentie en gadgets.', level: 'B2', sort_order: 72 },
  { slug: 'b2-cultuur-kunst', name: 'Cultuur, kunst & literatuur', description: 'Theater, film, muziek, schilderkunst en de Russische literatuur.', level: 'B2', sort_order: 73 },
  { slug: 'b2-economie-zaken', name: 'Economie & zakelijk Russisch', description: 'Onderhandelen, contracten, facturen, de markt en de crisis.', level: 'B2', sort_order: 74 },
  { slug: 'b2-noodgevallen', name: 'Noodgevallen, politie & verzekering', description: 'Aangifte doen, een ongeluk melden, de verzekering en het consulaat.', level: 'B2', sort_order: 75 },
  { slug: 'b2-recht', name: 'Recht & contracten', description: 'Basisbegrippen uit het recht: rechten en plichten, aansprakelijkheid, een advocaat.', level: 'B2', sort_order: 76 },
  { slug: 'b2-idiomen', name: 'Idiomen & vaste uitdrukkingen', description: 'Uitdrukkingen die elke Rus dagelijks gebruikt en die je niet letterlijk kunt vertalen.', level: 'B2', sort_order: 77 },
  { slug: 'b2-spreektaal', name: 'Spreektaal & register', description: 'Hoe mensen écht praten: verkortingen, tussenwerpsels, informele woorden en wanneer je ze wel of niet gebruikt.', level: 'B2', sort_order: 78 },
  { slug: 'b2-gevoelens-nuance', name: 'Gevoelens & nuances', description: 'Nauwkeuriger zeggen hoe je je voelt: van geïrriteerd tot opgelucht.', level: 'B2', sort_order: 79 },
  { slug: 'b2-reizen-gevorderd', name: 'Reizen gevorderd: hotel, klachten, douane', description: 'Problemen in het hotel, een klacht indienen, de douane en het vliegveld.', level: 'B2', sort_order: 80 },
  { slug: 'b2-onderwijs-studie', name: 'Onderwijs & studie', description: 'Universiteit, tentamens, scriptie, diploma en een cursus volgen.', level: 'B2', sort_order: 81 },
  { slug: 'b2-grammatica-deelwoorden', name: 'Grammatica: deelwoorden (причастия)', description: 'Actieve en passieve deelwoorden: читающий, читавший, читаемый, прочитанный — de bouwstenen van geschreven Russisch.', level: 'B2', sort_order: 82 },
  { slug: 'b2-grammatica-gerundium', name: 'Grammatica: gerundium (деепричастия)', description: 'Bijwoordelijke deelwoorden: читая (terwijl je leest), прочитав (na te hebben gelezen).', level: 'B2', sort_order: 83 },
  { slug: 'b2-grammatica-passief', name: 'Grammatica: passief & onpersoonlijke zinnen', description: 'Passief met -ся en korte deelwoorden; onpersoonlijke zinnen met мне, надо, можно, нельзя.', level: 'B2', sort_order: 84 },
  { slug: 'b2-grammatica-samengestelde-zinnen', name: 'Grammatica: samengestelde zinnen', description: 'который, чтобы, если, хотя, потому что, поэтому, ли — zinnen aan elkaar knopen.', level: 'B2', sort_order: 85 },
  { slug: 'b2-grammatica-woordvorming', name: 'Grammatica: woordvorming', description: 'Voor- en achtervoegsels herkennen: verkleinwoorden, -ость, -ник, без-, не-, пере-.', level: 'B2', sort_order: 86 },
  { slug: 'b2-grammatica-korte-adjectieven', name: 'Grammatica: korte bijvoeglijke naamwoorden', description: 'готов, занят, нужен, должен, рад, болен — de korte vormen die je elke dag hoort.', level: 'B2', sort_order: 87 },
  { slug: 'b2-grammatica-vergelijking', name: 'Grammatica: vergelijken (gevorderd)', description: 'Vergrotende trap met чем en de genitief, самый, наиболее, onregelmatige vormen — drills.', level: 'B2', sort_order: 88 },
  { slug: 'b2-grammatica-vervoeging', name: 'Grammatica: vervoegingsdrills B2', description: 'Automatisch gegenereerde drills met B2-werkwoorden: vervoeging, verleden tijd, aspectpartners.', level: 'B2', sort_order: 89 },
  { slug: 'b2-grammatica-naamvallen', name: 'Grammatica: naamvaldrills B2', description: 'Automatisch gegenereerde drills met B2-zelfstandige naamwoorden.', level: 'B2', sort_order: 90 },
  { slug: 'b2-praktische-zinnen', name: 'Praktische zinnen B2', description: 'Zinnen voor klachten, onderhandelingen, de politie en het uiten van nuance — bouwen én luisteren.', level: 'B2', sort_order: 91 },
  { slug: 'b2-lezen', name: 'Lezen B2', description: 'Nieuwsberichten, een zakelijke e-mail en een recensie, met begripsvragen.', level: 'B2', sort_order: 92 }
];

const grammarRules = [
  {
    code: 'PARTICIPLES-ACTIVE',
    title: 'Actieve deelwoorden (-ущий/-ющий, -ащий/-ящий, -вший)',
    explanation:
      "Een actief deelwoord is een bijvoeglijk naamwoord dat van een werkwoord is gemaakt en 'die ... doet/deed' betekent. Tegenwoordige tijd: neem de они-vorm, vervang -т door -щий: читают → читающий (die leest), говорят → говорящий (die spreekt). Verleden tijd: infinitiefstam + -вший: читать → читавший (die las), прочитать → прочитавший (die gelezen heeft). Ze verbuigen als bijvoeglijke naamwoorden en stemmen overeen met het woord waar ze bij horen: студент, читающий книгу; студентка, читающая книгу. In spreektaal zeg je liever een bijzin met который: студент, который читает книгу. Deelwoorden hoor je vooral in geschreven taal, nieuws en borden: курящий = roker, нижеподписавшийся = ondergetekende.",
    example: 'Люди, живущие в этом доме, ... (de mensen die in dit huis wonen) / Человек, написавший это письмо, ... (de man die deze brief schreef)'
  },
  {
    code: 'PARTICIPLES-PASSIVE',
    title: 'Passieve deelwoorden (-емый/-имый, -нный/-тый)',
    explanation:
      "Passieve deelwoorden betekenen 'die ... wordt/is gedaan'. Tegenwoordige tijd (onvoltooid, formeel): мы-vorm + -ый: читаем → читаемый (dat gelezen wordt), любим → любимый (geliefd). Verleden tijd (meestal van voltooide werkwoorden, heel frequent): infinitiefstam + -нный (bij -ать/-ять), -енный/-ённый (bij -ить, met medeklinkerwisseling) of -тый (bij korte stammen): прочитать → прочитанный, купить → купленный, закрыть → закрытый, открыть → открытый. De korte vorm (прочитан, закрыта, куплено, открыты) vormt het passief in de verleden/toekomende tijd en zie je overal: Магазин закрыт (de winkel is dicht), Билеты проданы (de kaartjes zijn uitverkocht), Вход запрещён (verboden toegang).",
    example: 'написанное письмо (de geschreven brief) / Дом построен в 1900 году. / Столик заказан на восемь.'
  },
  {
    code: 'GERUNDS',
    title: 'Gerundium / bijwoordelijk deelwoord (-я, -в)',
    explanation:
      "Het gerundium (деепричастие) beschrijft een bijkomende handeling van hetzelfde onderwerp: 'terwijl/door te ...' of 'na te hebben ...'. Onvoltooid (gelijktijdig): они-stam + -я (na ж, ш, ч, щ: -а): читают → читая (al lezend), говорят → говоря (zeggend), слышат → слыша. Voltooid (voorafgaand): infinitiefstam + -в: прочитать → прочитав (na gelezen te hebben), сделать → сделав; bij -ся: -вшись (вернувшись = teruggekeerd zijnde). Het gerundium is onveranderlijk en vereist dat het onderwerp van beide handelingen hetzelfde is: Читая газету, я пил кофе (ik las én dronk). Veel vaste uitdrukkingen zijn gerundia: судя по (te oordelen naar), не спеша (op je gemak), молча (zwijgend), честно говоря (eerlijk gezegd).",
    example: 'Выйдя из дома, он понял, что забыл ключи. (Toen hij het huis uit was, besefte hij dat hij zijn sleutels vergeten was.) / Честно говоря, мне всё равно.'
  },
  {
    code: 'PASSIVE-IMPERSONAL',
    title: 'Passief en onpersoonlijke zinnen',
    explanation:
      "Het Russisch vermijdt een uitgesproken lijdende vorm vaak op drie manieren. (1) Met -ся bij onvoltooide werkwoorden: Дом строится (het huis wordt gebouwd), Здесь продаются билеты (hier worden kaartjes verkocht). (2) Met korte passieve deelwoorden bij voltooide: Дом построен (het huis is gebouwd). (3) Met de 3e persoon meervoud zonder onderwerp: Говорят, что... (men zegt dat...), Здесь не курят (hier wordt niet gerookt). Daarnaast zijn er onpersoonlijke zinnen zonder onderwerp waarbij de persoon in de datief staat: Мне холодно (ik heb het koud), Ему скучно, Нам пора (het is tijd voor ons), Мне надо/нужно (ik moet), Можно? (mag het?), Нельзя (het mag/kan niet), Мне не спится (ik kan niet slapen). Het werkwoord staat in de onzijdige 3e persoon: Было холодно. Стало темно.",
    example: 'Магазин закрывается в десять. / Вход запрещён. / Мне нужно идти. / Здесь нельзя парковаться.'
  },
  {
    code: 'COMPLEX-SENTENCES',
    title: 'Samengestelde zinnen: который, чтобы, если, хотя, ли',
    explanation:
      "который (die/dat/welke) stemt in geslacht en getal overeen met het woord waarnaar het verwijst, maar krijgt zijn naamval uit de eigen bijzin: женщина, которую я видел (de vrouw die ik zag: accusatief), дом, в котором я живу (het huis waarin ik woon). чтобы (opdat/om te): met een infinitief als het onderwerp hetzelfde is (Я пришёл, чтобы помочь), met de verleden tijd als het onderwerp anders is (Я хочу, чтобы ты пришёл = ik wil dat jij komt). если (als, reëel) + toekomst/heden: Если будет дождь, мы останемся дома. хотя (hoewel), потому что (omdat), поэтому (daarom), так как (aangezien), несмотря на то что (ondanks dat). Een ja/nee-vraag in de bijzin maak je met ли ná het benadrukte woord: Я не знаю, придёт ли он (ik weet niet of hij komt) — nooit met если. Voor elke bijzin staat een komma.",
    example: 'Я не уверен, работает ли банк в субботу. / Скажи ему, чтобы он позвонил мне. / Хотя было холодно, мы пошли гулять.'
  },
  {
    code: 'WORD-FORMATION',
    title: 'Woordvorming: voor- en achtervoegsels',
    explanation:
      "Als je de bouwstenen kent, begrijp je duizenden woorden zonder ze te leren. Achtervoegsels: -ость maakt eigenschappen (новый → новость, молодой → молодость), -ник/-ница personen en voorwerpen (школа → школьник, чай → чайник), -тель handelende personen (учить → учитель), -ение/-ание handelingen (решить → решение), -ка verkleinwoorden en vrouwelijke vormen (студент → студентка), -ик/-чик/-очка/-ечка verkleinwoorden met een warme toon (стол → столик, кофе → кофеёк, мама → мамочка). Voorvoegsels: не- ontkent (правда → неправда), без-/бес- 'zonder' (билет → бесплатный = gratis), пере- 'opnieuw/over' (делать → переделать, ехать → переехать), под- 'onder/naderen' (земля → подземный), при- 'erbij/aankomst' (ходить → приходить), вы- 'eruit' (ход → выход), в-/во- 'erin' (вход), со- 'samen' (сотрудник, собеседование).",
    example: 'выход (uitgang) — вход (ingang) — переход (oversteekplaats) — подход (aanpak) — доход (inkomen) — расход (uitgave)'
  },
  {
    code: 'SHORT-ADJECTIVES',
    title: 'Korte bijvoeglijke naamwoorden',
    explanation:
      "Veel bijvoeglijke naamwoorden hebben naast de lange vorm (готовый) een korte vorm die alleen als naamwoordelijk deel van het gezegde staat en alleen in geslacht/getal verandert: готов, готова, готово, готовы (klaar). De korte vorm beschrijft meestal een tijdelijke toestand of een verplichting: Я занят (ik heb het druk / ben bezet), Она больна (zij is ziek), Мы рады (wij zijn blij), Ты прав (je hebt gelijk). Onmisbare korte vormen met bijzondere betekenis: должен/должна/должны (moeten: Я должен идти), нужен/нужна/нужно/нужны (nodig hebben, met de datief van de persoon: Мне нужна помощь), можно/нельзя, согласен (akkoord), похож (lijkt op: Он похож на отца), уверен (zeker), свободен (vrij: Вы свободны?), женат/замужем (getrouwd: hij/zij). Let op de vluchtige klinker: больной → болен, нужный → нужен.",
    example: 'Вы готовы заказать? / Мне нужны две минуты. / Я должна позвонить маме. / Это место свободно?'
  }
];

const words = [
  // --- nieuws & politiek ---
  { category: 'b2-nieuws-politiek', russian: 'выборы', translation_nl: 'verkiezingen', notes: 'Alleen meervoud.' },
  { category: 'b2-nieuws-politiek', russian: 'голосовать', translation_nl: 'stemmen (bij verkiezingen)', notes: 'голосовать за + accusatief. Voltooid: проголосовать.' },
  { category: 'b2-nieuws-politiek', russian: 'партия', translation_nl: 'partij' },
  { category: 'b2-nieuws-politiek', russian: 'депутат', translation_nl: 'parlementslid / afgevaardigde' },
  { category: 'b2-nieuws-politiek', russian: 'мэр', translation_nl: 'burgemeester' },
  { category: 'b2-nieuws-politiek', russian: 'общество', translation_nl: 'samenleving / maatschappij' },
  { category: 'b2-nieuws-politiek', russian: 'государство', translation_nl: 'staat (het land als instelling)' },
  { category: 'b2-nieuws-politiek', russian: 'власть', translation_nl: 'macht / de autoriteiten', notes: 'Meervoud власти = de overheid.' },
  { category: 'b2-nieuws-politiek', russian: 'протест', translation_nl: 'protest', notes: 'митинг = demonstratie/bijeenkomst.' },
  { category: 'b2-nieuws-politiek', russian: 'переговоры', translation_nl: 'onderhandelingen', notes: 'Alleen meervoud: вести переговоры = onderhandelen.' },
  { category: 'b2-nieuws-politiek', russian: 'мир', translation_nl: 'vrede; wereld', notes: 'Twee betekenissen in één woord.' },
  { category: 'b2-nieuws-politiek', russian: 'война', translation_nl: 'oorlog' },
  { category: 'b2-nieuws-politiek', russian: 'источник', translation_nl: 'bron', notes: 'по данным источника = volgens een bron.' },
  { category: 'b2-nieuws-politiek', russian: 'заявить', translation_nl: 'verklaren / stellen (officieel)', notes: 'Onvoltooid: заявлять. Standaardwerkwoord in nieuwsberichten.' },
  { category: 'b2-nieuws-politiek', russian: 'сообщать', translation_nl: 'melden / berichten', notes: 'Как сообщает агентство... = zoals het persbureau meldt.' },

  // --- milieu & klimaat ---
  { category: 'b2-milieu-klimaat', russian: 'окружающая среда', translation_nl: 'milieu / leefomgeving' },
  { category: 'b2-milieu-klimaat', russian: 'загрязнение', translation_nl: 'vervuiling' },
  { category: 'b2-milieu-klimaat', russian: 'изменение климата', translation_nl: 'klimaatverandering' },
  { category: 'b2-milieu-klimaat', russian: 'отходы', translation_nl: 'afval (industrieel)', notes: 'мусор = huisvuil.' },
  { category: 'b2-milieu-klimaat', russian: 'переработка', translation_nl: 'recycling / verwerking' },
  { category: 'b2-milieu-klimaat', russian: 'возобновляемый', translation_nl: 'hernieuwbaar', notes: 'возобновляемые источники энергии.' },
  { category: 'b2-milieu-klimaat', russian: 'выбросы', translation_nl: 'uitstoot / emissies' },
  { category: 'b2-milieu-klimaat', russian: 'наводнение', translation_nl: 'overstroming' },
  { category: 'b2-milieu-klimaat', russian: 'засуха', translation_nl: 'droogte' },
  { category: 'b2-milieu-klimaat', russian: 'лесной пожар', translation_nl: 'bosbrand' },
  { category: 'b2-milieu-klimaat', russian: 'потепление', translation_nl: 'opwarming', notes: 'глобальное потепление.' },
  { category: 'b2-milieu-klimaat', russian: 'экономить', translation_nl: 'besparen / zuinig zijn met', notes: 'экономить воду/электричество.' },

  // --- technologie ---
  { category: 'b2-technologie', russian: 'данные', translation_nl: 'gegevens / data', notes: 'Alleen meervoud: персональные данные.' },
  { category: 'b2-technologie', russian: 'искусственный интеллект', translation_nl: 'kunstmatige intelligentie', notes: 'Afkorting: ИИ.' },
  { category: 'b2-technologie', russian: 'устройство', translation_nl: 'apparaat / toestel' },
  { category: 'b2-technologie', russian: 'обновление', translation_nl: 'update' },
  { category: 'b2-technologie', russian: 'настройки', translation_nl: 'instellingen', notes: 'Meervoud.' },
  { category: 'b2-technologie', russian: 'сеть', translation_nl: 'netwerk; het internet', notes: 'социальные сети = sociale media.' },
  { category: 'b2-technologie', russian: 'взлом', translation_nl: 'hack / inbraak', notes: 'взломать = hacken/openbreken.' },
  { category: 'b2-technologie', russian: 'конфиденциальность', translation_nl: 'privacy / vertrouwelijkheid' },
  { category: 'b2-technologie', russian: 'разработчик', translation_nl: 'ontwikkelaar / programmeur' },
  { category: 'b2-technologie', russian: 'сбой', translation_nl: 'storing / crash' },
  { category: 'b2-technologie', russian: 'подключиться', translation_nl: 'verbinding maken (voltooid)', notes: 'подключиться к вайфаю. Onvoltooid: подключаться.' },
  { category: 'b2-technologie', russian: 'хранить', translation_nl: 'opslaan / bewaren' },

  // --- cultuur, kunst & literatuur ---
  { category: 'b2-cultuur-kunst', russian: 'спектакль', translation_nl: 'toneelvoorstelling' },
  { category: 'b2-cultuur-kunst', russian: 'выставка', translation_nl: 'tentoonstelling' },
  { category: 'b2-cultuur-kunst', russian: 'художник', translation_nl: 'kunstschilder / kunstenaar' },
  { category: 'b2-cultuur-kunst', russian: 'писатель', translation_nl: 'schrijver' },
  { category: 'b2-cultuur-kunst', russian: 'роман', translation_nl: 'roman; romance' },
  { category: 'b2-cultuur-kunst', russian: 'стихотворение', translation_nl: 'gedicht', notes: 'стихи = poëzie/gedichten.' },
  { category: 'b2-cultuur-kunst', russian: 'сюжет', translation_nl: 'plot / verhaallijn' },
  { category: 'b2-cultuur-kunst', russian: 'произведение', translation_nl: 'werk (kunstwerk, literair werk)' },
  { category: 'b2-cultuur-kunst', russian: 'режиссёр', translation_nl: 'regisseur' },
  { category: 'b2-cultuur-kunst', russian: 'зритель', translation_nl: 'toeschouwer / kijker' },
  { category: 'b2-cultuur-kunst', russian: 'отзыв', translation_nl: 'recensie / beoordeling', notes: 'оставить отзыв = een review achterlaten.' },
  { category: 'b2-cultuur-kunst', russian: 'наследие', translation_nl: 'erfgoed' },
  { category: 'b2-cultuur-kunst', russian: 'вдохновение', translation_nl: 'inspiratie' },

  // --- economie & zakelijk ---
  { category: 'b2-economie-zaken', russian: 'сделка', translation_nl: 'deal / transactie', notes: 'заключить сделку = een deal sluiten.' },
  { category: 'b2-economie-zaken', russian: 'поставщик', translation_nl: 'leverancier' },
  { category: 'b2-economie-zaken', russian: 'счёт-фактура', translation_nl: 'factuur', notes: 'In de praktijk vaak gewoon счёт.' },
  { category: 'b2-economie-zaken', russian: 'прибыль', translation_nl: 'winst' },
  { category: 'b2-economie-zaken', russian: 'убыток', translation_nl: 'verlies (financieel)' },
  { category: 'b2-economie-zaken', russian: 'налог', translation_nl: 'belasting', notes: 'НДС = btw.' },
  { category: 'b2-economie-zaken', russian: 'рынок', translation_nl: 'markt (ook economisch)' },
  { category: 'b2-economie-zaken', russian: 'спрос', translation_nl: 'vraag (economisch)', notes: 'спрос и предложение = vraag en aanbod.' },
  { category: 'b2-economie-zaken', russian: 'предложение', translation_nl: 'aanbod; voorstel; zin (grammatica)' },
  { category: 'b2-economie-zaken', russian: 'инвестиции', translation_nl: 'investeringen' },
  { category: 'b2-economie-zaken', russian: 'кризис', translation_nl: 'crisis' },
  { category: 'b2-economie-zaken', russian: 'инфляция', translation_nl: 'inflatie' },
  { category: 'b2-economie-zaken', russian: 'договориться', translation_nl: 'overeenkomen / afspreken (voltooid)', notes: 'Договорились! = afgesproken! Onvoltooid: договариваться.' },
  { category: 'b2-economie-zaken', russian: 'условия', translation_nl: 'voorwaarden', notes: 'условия договора = de contractvoorwaarden.' },

  // --- noodgevallen, politie & verzekering ---
  { category: 'b2-noodgevallen', russian: 'полиция', translation_nl: 'politie', notes: 'Noodnummer 102 of 112. Een agent: полицейский.' },
  { category: 'b2-noodgevallen', russian: 'заявление в полицию', translation_nl: 'aangifte' },
  { category: 'b2-noodgevallen', russian: 'кража', translation_nl: 'diefstal', notes: 'украсть = stelen: У меня украли кошелёк.' },
  { category: 'b2-noodgevallen', russian: 'авария', translation_nl: 'ongeluk (verkeer) / storing' },
  { category: 'b2-noodgevallen', russian: 'пострадавший', translation_nl: 'slachtoffer / gewonde' },
  { category: 'b2-noodgevallen', russian: 'свидетель', translation_nl: 'getuige' },
  { category: 'b2-noodgevallen', russian: 'пожар', translation_nl: 'brand', notes: 'пожарные = brandweer (101).' },
  { category: 'b2-noodgevallen', russian: 'страховой случай', translation_nl: 'verzekeringsclaim / gedekte gebeurtenis' },
  { category: 'b2-noodgevallen', russian: 'возмещение', translation_nl: 'vergoeding / schadeloosstelling' },
  { category: 'b2-noodgevallen', russian: 'консульство', translation_nl: 'consulaat', notes: 'посольство = ambassade.' },
  { category: 'b2-noodgevallen', russian: 'потерпевший', translation_nl: 'benadeelde / slachtoffer (juridisch)' },
  { category: 'b2-noodgevallen', russian: 'угроза', translation_nl: 'dreiging / bedreiging' },

  // --- recht ---
  { category: 'b2-recht', russian: 'право', translation_nl: 'recht', notes: 'иметь право на = recht hebben op.' },
  { category: 'b2-recht', russian: 'обязанность', translation_nl: 'plicht / verplichting' },
  { category: 'b2-recht', russian: 'адвокат', translation_nl: 'advocaat' },
  { category: 'b2-recht', russian: 'суд', translation_nl: 'rechtbank', notes: 'подать в суд = een rechtszaak aanspannen.' },
  { category: 'b2-recht', russian: 'ответственность', translation_nl: 'aansprakelijkheid / verantwoordelijkheid' },
  { category: 'b2-recht', russian: 'нарушение', translation_nl: 'overtreding / schending' },
  { category: 'b2-recht', russian: 'соглашение', translation_nl: 'overeenkomst' },
  { category: 'b2-recht', russian: 'доверенность', translation_nl: 'volmacht' },
  { category: 'b2-recht', russian: 'наследство', translation_nl: 'erfenis' },
  { category: 'b2-recht', russian: 'штраф', translation_nl: 'boete', notes: 'выписать штраф = een boete uitschrijven.' },
  { category: 'b2-recht', russian: 'законный', translation_nl: 'wettig / legaal', notes: 'незаконный = illegaal.' },
  { category: 'b2-recht', russian: 'расторгнуть', translation_nl: 'ontbinden / opzeggen (contract)', notes: 'расторгнуть договор.' },

  // --- idiomen ---
  { category: 'b2-idiomen', russian: 'ни пуха ни пера', translation_nl: 'succes! (letterlijk: noch dons noch veer)', notes: "Antwoord altijd: К чёрту! ('naar de duivel') — anders werkt het niet." },
  { category: 'b2-idiomen', russian: 'убить двух зайцев', translation_nl: 'twee vliegen in één klap slaan (twee hazen doden)' },
  { category: 'b2-idiomen', russian: 'вешать лапшу на уши', translation_nl: 'iemand iets wijsmaken (noedels aan de oren hangen)' },
  { category: 'b2-idiomen', russian: 'как рыба в воде', translation_nl: 'als een vis in het water' },
  { category: 'b2-idiomen', russian: 'делать из мухи слона', translation_nl: 'van een mug een olifant maken' },
  { category: 'b2-idiomen', russian: 'ждать у моря погоды', translation_nl: 'op iets wachten wat niet komt (bij de zee op weer wachten)' },
  { category: 'b2-idiomen', russian: 'бить баклуши', translation_nl: 'niksen / lanterfanten' },
  { category: 'b2-idiomen', russian: 'руки не доходят', translation_nl: 'er niet aan toekomen', notes: 'У меня руки не доходят до ремонта = ik kom niet toe aan de klus.' },
  { category: 'b2-idiomen', russian: 'зарубить на носу', translation_nl: 'goed in je oren knopen' },
  { category: 'b2-idiomen', russian: 'с глазу на глаз', translation_nl: 'onder vier ogen' },
  { category: 'b2-idiomen', russian: 'на всякий случай', translation_nl: 'voor de zekerheid' },
  { category: 'b2-idiomen', russian: 'в конце концов', translation_nl: 'uiteindelijk / per slot van rekening' },
  { category: 'b2-idiomen', russian: 'не за что', translation_nl: 'graag gedaan (geen dank)' },
  { category: 'b2-idiomen', russian: 'ничего страшного', translation_nl: 'geen probleem / geeft niet' },

  // --- spreektaal & register ---
  { category: 'b2-spreektaal', russian: 'ладно', translation_nl: 'oké / goed dan' },
  { category: 'b2-spreektaal', russian: 'ну', translation_nl: 'nou / tja', notes: 'Ну что? = nou, hoe zit het? Ну ладно = nou goed.' },
  { category: 'b2-spreektaal', russian: 'типа', translation_nl: 'zeg maar / zo van (jongerentaal)', notes: 'Stopwoord; vermijden in nette gesprekken.' },
  { category: 'b2-spreektaal', russian: 'короче', translation_nl: 'kortom / lang verhaal kort' },
  { category: 'b2-spreektaal', russian: 'блин', translation_nl: 'verdorie (nette vloek)', notes: 'Letterlijk: pannenkoek. Zeer gangbaar en onschuldig.' },
  { category: 'b2-spreektaal', russian: 'офигеть', translation_nl: 'wow / niet te geloven (informeel)' },
  { category: 'b2-spreektaal', russian: 'чувак', translation_nl: 'gozer / kerel' },
  { category: 'b2-spreektaal', russian: 'бабки', translation_nl: 'poen / geld (slang)' },
  { category: 'b2-spreektaal', russian: 'фигня', translation_nl: 'onzin / gedoe (informeel)' },
  { category: 'b2-spreektaal', russian: 'тусовка', translation_nl: 'feestje / het uitgaan (informeel)', notes: 'тусоваться = uitgaan, rondhangen.' },
  { category: 'b2-spreektaal', russian: 'достал', translation_nl: 'ik ben het zat (letterlijk: hij heeft me bereikt)', notes: 'Ты меня достал! = ik ben je beu.' },
  { category: 'b2-spreektaal', russian: 'вообще', translation_nl: 'überhaupt / over het algemeen', notes: 'Вообще-то = eigenlijk.' },
  { category: 'b2-spreektaal', russian: 'здорово', translation_nl: 'te gek / super', notes: "Klemtoon op -о (здо́рово); здоро́во is 'hoi' onder mannen." },

  // --- gevoelens & nuances ---
  { category: 'b2-gevoelens-nuance', russian: 'раздражённый', translation_nl: 'geïrriteerd', notes: 'Меня это раздражает = dat irriteert me.' },
  { category: 'b2-gevoelens-nuance', russian: 'разочарованный', translation_nl: 'teleurgesteld' },
  { category: 'b2-gevoelens-nuance', russian: 'облегчение', translation_nl: 'opluchting', notes: 'Какое облегчение! = wat een opluchting.' },
  { category: 'b2-gevoelens-nuance', russian: 'тревожный', translation_nl: 'ongerust / angstig; verontrustend' },
  { category: 'b2-gevoelens-nuance', russian: 'смущённый', translation_nl: 'in verlegenheid gebracht / beschaamd' },
  { category: 'b2-gevoelens-nuance', russian: 'гордый', translation_nl: 'trots', notes: 'гордиться + instrumentalis = trots zijn op.' },
  { category: 'b2-gevoelens-nuance', russian: 'ревновать', translation_nl: 'jaloers zijn (in de liefde)', notes: 'завидовать = benijden.' },
  { category: 'b2-gevoelens-nuance', russian: 'скучать', translation_nl: 'missen; zich vervelen', notes: 'Я скучаю по тебе = ik mis je (по + datief).' },
  { category: 'b2-gevoelens-nuance', russian: 'обидеться', translation_nl: 'beledigd/gekwetst zijn (voltooid)', notes: 'Не обижайся! = wees niet gekwetst. обида = krenking.' },
  { category: 'b2-gevoelens-nuance', russian: 'вдохновлённый', translation_nl: 'geïnspireerd' },
  { category: 'b2-gevoelens-nuance', russian: 'равнодушный', translation_nl: 'onverschillig', notes: 'Мне всё равно = het maakt me niet uit.' },
  { category: 'b2-gevoelens-nuance', russian: 'растерянный', translation_nl: 'in de war / van slag' },

  // --- reizen gevorderd ---
  { category: 'b2-reizen-gevorderd', russian: 'жалоба', translation_nl: 'klacht', notes: 'подать жалобу = een klacht indienen. книга жалоб = klachtenboek.' },
  { category: 'b2-reizen-gevorderd', russian: 'таможня', translation_nl: 'douane', notes: 'таможенный контроль = douanecontrole.' },
  { category: 'b2-reizen-gevorderd', russian: 'декларация', translation_nl: 'aangifte (douane)', notes: 'Нечего декларировать = niets aan te geven.' },
  { category: 'b2-reizen-gevorderd', russian: 'посадка', translation_nl: 'boarding; landing' },
  { category: 'b2-reizen-gevorderd', russian: 'задержка', translation_nl: 'vertraging', notes: 'Рейс задерживается = de vlucht is vertraagd.' },
  { category: 'b2-reizen-gevorderd', russian: 'багаж', translation_nl: 'bagage', notes: 'ручная кладь = handbagage.' },
  { category: 'b2-reizen-gevorderd', russian: 'потерялся', translation_nl: 'is zoekgeraakt', notes: 'Мой багаж потерялся.' },
  { category: 'b2-reizen-gevorderd', russian: 'бронь', translation_nl: 'reservering', notes: 'подтвердить бронь = de reservering bevestigen.' },
  { category: 'b2-reizen-gevorderd', russian: 'администратор', translation_nl: 'receptionist / manager (hotel)' },
  { category: 'b2-reizen-gevorderd', russian: 'неисправен', translation_nl: 'defect / kapot (korte vorm)', notes: 'Кондиционер неисправен.' },
  { category: 'b2-reizen-gevorderd', russian: 'возврат', translation_nl: 'restitutie / retour', notes: 'возврат денег = terugbetaling.' },
  { category: 'b2-reizen-gevorderd', russian: 'пограничник', translation_nl: 'grenswacht' },

  // --- onderwijs & studie ---
  { category: 'b2-onderwijs-studie', russian: 'экзамен', translation_nl: 'examen / tentamen', notes: 'сдать экзамен = slagen; сдавать экзамен = examen doen.' },
  { category: 'b2-onderwijs-studie', russian: 'зачёт', translation_nl: 'toets met alleen voldoende/onvoldoende' },
  { category: 'b2-onderwijs-studie', russian: 'лекция', translation_nl: 'college / lezing' },
  { category: 'b2-onderwijs-studie', russian: 'преподаватель', translation_nl: 'docent (hoger onderwijs)' },
  { category: 'b2-onderwijs-studie', russian: 'диплом', translation_nl: 'diploma; scriptie' },
  { category: 'b2-onderwijs-studie', russian: 'факультет', translation_nl: 'faculteit' },
  { category: 'b2-onderwijs-studie', russian: 'стипендия', translation_nl: 'studiebeurs' },
  { category: 'b2-onderwijs-studie', russian: 'общежитие', translation_nl: 'studentenhuis / studentenflat' },
  { category: 'b2-onderwijs-studie', russian: 'курсы', translation_nl: 'cursus', notes: 'курсы русского языка = een cursus Russisch (meervoud).' },
  { category: 'b2-onderwijs-studie', russian: 'оценка', translation_nl: 'cijfer / beoordeling', notes: 'Russische cijfers gaan van 2 (onvoldoende) tot 5 (uitstekend).' },
  { category: 'b2-onderwijs-studie', russian: 'исследование', translation_nl: 'onderzoek (wetenschappelijk)' },
  { category: 'b2-onderwijs-studie', russian: 'выпускник', translation_nl: 'afgestudeerde / oud-leerling' },

  // --- deelwoorden (frequent participles as vocabulary) ---
  { category: 'b2-grammatica-deelwoorden', russian: 'курящий', translation_nl: 'rokend; roker', grammarRule: 'PARTICIPLES-ACTIVE', notes: 'для курящих = voor rokers.' },
  { category: 'b2-grammatica-deelwoorden', russian: 'следующий', translation_nl: 'volgend', grammarRule: 'PARTICIPLES-ACTIVE', notes: 'Oorspronkelijk een deelwoord van следовать.' },
  { category: 'b2-grammatica-deelwoorden', russian: 'нижеподписавшийся', translation_nl: 'ondergetekende', grammarRule: 'PARTICIPLES-ACTIVE' },
  { category: 'b2-grammatica-deelwoorden', russian: 'любимый', translation_nl: 'geliefd / favoriet', grammarRule: 'PARTICIPLES-PASSIVE' },
  { category: 'b2-grammatica-deelwoorden', russian: 'закрытый', translation_nl: 'gesloten', grammarRule: 'PARTICIPLES-PASSIVE', notes: 'Korte vorm: закрыт, закрыта, закрыто, закрыты.' },
  { category: 'b2-grammatica-deelwoorden', russian: 'запрещённый', translation_nl: 'verboden', grammarRule: 'PARTICIPLES-PASSIVE', notes: 'Вход запрещён.' },
  { category: 'b2-grammatica-deelwoorden', russian: 'уважаемый', translation_nl: 'geachte (aanhef)', grammarRule: 'PARTICIPLES-PASSIVE', notes: 'Уважаемый Иван Петрович! = Geachte Ivan Petrovitsj.' },
  { category: 'b2-grammatica-deelwoorden', russian: 'сделанный', translation_nl: 'gemaakt', grammarRule: 'PARTICIPLES-PASSIVE', notes: 'сделано в России = made in Russia.' },

  // --- gerundium (fixed expressions) ---
  { category: 'b2-grammatica-gerundium', russian: 'честно говоря', translation_nl: 'eerlijk gezegd', grammarRule: 'GERUNDS' },
  { category: 'b2-grammatica-gerundium', russian: 'судя по всему', translation_nl: 'naar het zich laat aanzien', grammarRule: 'GERUNDS' },
  { category: 'b2-grammatica-gerundium', russian: 'не спеша', translation_nl: 'op je gemak / zonder haast', grammarRule: 'GERUNDS' },
  { category: 'b2-grammatica-gerundium', russian: 'молча', translation_nl: 'zwijgend', grammarRule: 'GERUNDS' },
  { category: 'b2-grammatica-gerundium', russian: 'несмотря на', translation_nl: 'ondanks', grammarRule: 'GERUNDS', notes: 'Oorspronkelijk een gerundium (niet kijkend naar). несмотря на + accusatief.' },
  { category: 'b2-grammatica-gerundium', russian: 'начиная с', translation_nl: 'vanaf / te beginnen bij', grammarRule: 'GERUNDS' },

  // --- passief / onpersoonlijk ---
  { category: 'b2-grammatica-passief', russian: 'нельзя', translation_nl: 'het mag niet / het kan niet', grammarRule: 'PASSIVE-IMPERSONAL' },
  { category: 'b2-grammatica-passief', russian: 'пора', translation_nl: 'het is tijd (om)', grammarRule: 'PASSIVE-IMPERSONAL', notes: 'Мне пора = ik moet gaan.' },
  { category: 'b2-grammatica-passief', russian: 'мне жаль', translation_nl: 'het spijt me / ik vind het jammer', grammarRule: 'PASSIVE-IMPERSONAL' },
  { category: 'b2-grammatica-passief', russian: 'говорят', translation_nl: 'men zegt', grammarRule: 'PASSIVE-IMPERSONAL' },
  { category: 'b2-grammatica-passief', russian: 'продаётся', translation_nl: 'te koop / wordt verkocht', grammarRule: 'PASSIVE-IMPERSONAL' },
  { category: 'b2-grammatica-passief', russian: 'мне не спится', translation_nl: 'ik kan niet slapen', grammarRule: 'PASSIVE-IMPERSONAL' },

  // --- samengestelde zinnen (connectors) ---
  { category: 'b2-grammatica-samengestelde-zinnen', russian: 'который', translation_nl: 'die / dat / welke', grammarRule: 'COMPLEX-SENTENCES' },
  { category: 'b2-grammatica-samengestelde-zinnen', russian: 'чтобы', translation_nl: 'opdat / om te / dat', grammarRule: 'COMPLEX-SENTENCES' },
  { category: 'b2-grammatica-samengestelde-zinnen', russian: 'хотя', translation_nl: 'hoewel', grammarRule: 'COMPLEX-SENTENCES' },
  { category: 'b2-grammatica-samengestelde-zinnen', russian: 'поэтому', translation_nl: 'daarom', grammarRule: 'COMPLEX-SENTENCES' },
  { category: 'b2-grammatica-samengestelde-zinnen', russian: 'так как', translation_nl: 'aangezien', grammarRule: 'COMPLEX-SENTENCES' },
  { category: 'b2-grammatica-samengestelde-zinnen', russian: 'несмотря на то что', translation_nl: 'ondanks dat', grammarRule: 'COMPLEX-SENTENCES' },
  { category: 'b2-grammatica-samengestelde-zinnen', russian: 'пока не', translation_nl: 'totdat', grammarRule: 'COMPLEX-SENTENCES', notes: 'Подожди, пока я не вернусь.' },
  { category: 'b2-grammatica-samengestelde-zinnen', russian: 'как только', translation_nl: 'zodra', grammarRule: 'COMPLEX-SENTENCES' },

  // --- woordvorming ---
  { category: 'b2-grammatica-woordvorming', russian: 'выход', translation_nl: 'uitgang', grammarRule: 'WORD-FORMATION', notes: 'вы- (eruit) + ход (gang).' },
  { category: 'b2-grammatica-woordvorming', russian: 'вход', translation_nl: 'ingang', grammarRule: 'WORD-FORMATION' },
  { category: 'b2-grammatica-woordvorming', russian: 'переход', translation_nl: 'oversteekplaats / overgang', grammarRule: 'WORD-FORMATION', notes: 'подземный переход = voetgangerstunnel.' },
  { category: 'b2-grammatica-woordvorming', russian: 'доход', translation_nl: 'inkomen', grammarRule: 'WORD-FORMATION' },
  { category: 'b2-grammatica-woordvorming', russian: 'расход', translation_nl: 'uitgave / kosten', grammarRule: 'WORD-FORMATION' },
  { category: 'b2-grammatica-woordvorming', russian: 'бесплатный', translation_nl: 'gratis', grammarRule: 'WORD-FORMATION', notes: 'без/бес- (zonder) + плата (betaling).' },
  { category: 'b2-grammatica-woordvorming', russian: 'молодость', translation_nl: 'jeugd (de levensfase)', grammarRule: 'WORD-FORMATION', notes: 'молодой + -ость.' },
  { category: 'b2-grammatica-woordvorming', russian: 'чайник', translation_nl: 'theepot / waterkoker; beginner (informeel)', grammarRule: 'WORD-FORMATION', notes: 'чай + -ник.' },
  { category: 'b2-grammatica-woordvorming', russian: 'столик', translation_nl: 'tafeltje', grammarRule: 'WORD-FORMATION', notes: 'Verkleinwoord met -ик.' },
  { category: 'b2-grammatica-woordvorming', russian: 'переделать', translation_nl: 'opnieuw doen / overdoen', grammarRule: 'WORD-FORMATION', notes: 'пере- (opnieuw) + делать.' },

  // --- korte adjectieven ---
  { category: 'b2-grammatica-korte-adjectieven', russian: 'готов', translation_nl: 'klaar (m)', grammarRule: 'SHORT-ADJECTIVES', notes: 'готова (v), готовы (mv).' },
  { category: 'b2-grammatica-korte-adjectieven', russian: 'занят', translation_nl: 'bezet / druk (m)', grammarRule: 'SHORT-ADJECTIVES', notes: 'Это место занято? = is deze plaats bezet?' },
  { category: 'b2-grammatica-korte-adjectieven', russian: 'должен', translation_nl: 'moet (m)', grammarRule: 'SHORT-ADJECTIVES', notes: 'должна (v), должны (mv). Ook: schuldig zijn (geld).' },
  { category: 'b2-grammatica-korte-adjectieven', russian: 'нужен', translation_nl: 'nodig (m)', grammarRule: 'SHORT-ADJECTIVES', notes: 'Мне нужен билет / нужна карта / нужно время / нужны деньги.' },
  { category: 'b2-grammatica-korte-adjectieven', russian: 'рад', translation_nl: 'blij (m)', grammarRule: 'SHORT-ADJECTIVES', notes: 'Alleen als korte vorm in gebruik: Рад познакомиться.' },
  { category: 'b2-grammatica-korte-adjectieven', russian: 'прав', translation_nl: 'heeft gelijk (m)', grammarRule: 'SHORT-ADJECTIVES', notes: 'Ты права (v). Klemtoon: права́.' },
  { category: 'b2-grammatica-korte-adjectieven', russian: 'похож', translation_nl: 'lijkt op (m)', grammarRule: 'SHORT-ADJECTIVES', notes: 'похож на + accusatief.' },
  { category: 'b2-grammatica-korte-adjectieven', russian: 'свободен', translation_nl: 'vrij / beschikbaar (m)', grammarRule: 'SHORT-ADJECTIVES', notes: 'Вы сегодня свободны? = bent u vandaag vrij?' }
];

const grammarExercises = [
  // PARTICIPLES
  {
    category: 'b2-grammatica-deelwoorden', grammarRule: 'PARTICIPLES-ACTIVE', type: 'mc',
    prompt: "Zet om in een deelwoord: 'студенты, которые изучают русский язык' → 'студенты, ___ русский язык'",
    correctAnswer: 'изучающие', options: ['изучающие', 'изучавшие', 'изучаемые'],
    explanation: "Tegenwoordige tijd, actief (de studenten doen het zelf, nu) → они-vorm изучают, -т → -щий: изучающий, en meervoud omdat студенты meervoud is: изучающие. 'изучавшие' is verleden tijd, 'изучаемые' is passief (dat bestudeerd wordt)."
  },
  {
    category: 'b2-grammatica-deelwoorden', grammarRule: 'PARTICIPLES-ACTIVE', type: 'mc',
    prompt: "Vul aan: Человек, ___ это письмо, был очень зол. (de man die deze brief schreef, was erg boos)",
    correctAnswer: 'написавший', options: ['пишущий', 'написавший', 'написанный'],
    explanation: "Actief én verleden (hij schreef): infinitiefstam написа- + -вший: написавший. 'пишущий' = die (nu) schrijft; 'написанный' = passief: die geschreven is (dat zou bij het woord 'brief' horen, niet bij de man)."
  },
  {
    category: 'b2-grammatica-deelwoorden', grammarRule: 'PARTICIPLES-PASSIVE', type: 'mc',
    prompt: "Vul aan (korte passieve vorm): Магазин ___ на ремонт. (de winkel is gesloten wegens renovatie)",
    correctAnswer: 'закрыт', options: ['закрыт', 'закрытый', 'закрывающий'],
    explanation: "Als gezegde ('is gesloten') gebruik je de korte vorm van het passieve deelwoord: закрыт (магазин is mannelijk). De lange vorm закрытый staat bij een zelfstandig naamwoord (закрытый магазин = een gesloten winkel)."
  },
  {
    category: 'b2-grammatica-deelwoorden', grammarRule: 'PARTICIPLES-PASSIVE', type: 'mc',
    prompt: "Wat betekent het bordje 'Вход запрещён'?",
    correctAnswer: 'Verboden toegang', options: ['Ingang verplicht', 'Verboden toegang', 'Ingang gesloten'],
    explanation: "запрещён is de korte mannelijke vorm van запрещённый (verboden), het passieve deelwoord van запретить. вход = ingang/toegang."
  },
  {
    category: 'b2-grammatica-deelwoorden', grammarRule: 'PARTICIPLES-PASSIVE', type: 'mc',
    prompt: "Vul aan: Столик ___ на восемь часов. (de tafel is gereserveerd voor acht uur)",
    correctAnswer: 'заказан', options: ['заказан', 'заказана', 'заказывающий'],
    explanation: "столик is mannelijk → korte vorm заказан (van заказанный, passief deelwoord van заказать). 'заказана' zou bij een vrouwelijk woord horen (комната заказана)."
  },

  // GERUNDS
  {
    category: 'b2-grammatica-gerundium', grammarRule: 'GERUNDS', type: 'mc',
    prompt: "Vul aan: ___ газету, он пил кофе. (terwijl hij de krant las, dronk hij koffie)",
    correctAnswer: 'Читая', options: ['Читая', 'Прочитав', 'Читающий'],
    explanation: "Twee gelijktijdige handelingen van hetzelfde onderwerp → onvoltooid gerundium: читая (они читают → чита-я). 'Прочитав' = na gelezen te hebben (eerst uit, dan koffie); 'Читающий' is een deelwoord, geen gerundium."
  },
  {
    category: 'b2-grammatica-gerundium', grammarRule: 'GERUNDS', type: 'mc',
    prompt: "Vul aan: ___ работу, она пошла домой. (na haar werk afgemaakt te hebben, ging zij naar huis)",
    correctAnswer: 'Закончив', options: ['Заканчивая', 'Закончив', 'Закончившая'],
    explanation: "De ene handeling is afgerond vóór de andere → voltooid gerundium: закончи-ть → закончив. 'Заканчивая' zou betekenen dat ze naar huis ging terwijl ze nog bezig was."
  },
  {
    category: 'b2-grammatica-gerundium', grammarRule: 'GERUNDS', type: 'mc',
    prompt: "Welke zin is grammaticaal correct?",
    correctAnswer: 'Вернувшись домой, я сразу лёг спать.', options: ['Вернувшись домой, я сразу лёг спать.', 'Вернувшись домой, телефон зазвонил.', 'Вернувшись домой, был поздний вечер.'],
    explanation: "Het gerundium moet hetzelfde onderwerp hebben als de hoofdzin: ík kwam thuis en ík ging slapen. In de andere zinnen 'kwam de telefoon thuis' of 'kwam de avond thuis' — een klassieke fout."
  },

  // PASSIVE-IMPERSONAL
  {
    category: 'b2-grammatica-passief', grammarRule: 'PASSIVE-IMPERSONAL', type: 'mc',
    prompt: "Hoe zeg je 'Ik heb het koud'?",
    correctAnswer: 'Мне холодно.', options: ['Я холодный.', 'Мне холодно.', 'Я холодно.'],
    explanation: "Een gevoel of toestand is onpersoonlijk: de persoon staat in de datief (мне) en het gezegde is een bijwoord op -о: Мне холодно. 'Я холодный' betekent 'ik ben een koud/kil persoon'."
  },
  {
    category: 'b2-grammatica-passief', grammarRule: 'PASSIVE-IMPERSONAL', type: 'mc',
    prompt: "Vul aan: Здесь не ___ . (hier wordt niet gerookt / roken verboden)",
    correctAnswer: 'курят', options: ['курит', 'курят', 'курящий'],
    explanation: "De onpersoonlijke 3e persoon meervoud zonder onderwerp: 'zij (men) roken hier niet' = Здесь не курят. Zo werken ook Говорят, что... en Вас просят к телефону."
  },
  {
    category: 'b2-grammatica-passief', grammarRule: 'PASSIVE-IMPERSONAL', type: 'mc',
    prompt: "Vul aan: Билеты ___ в кассе. (kaartjes worden bij de kassa verkocht)",
    correctAnswer: 'продаются', options: ['продают себя', 'продаются', 'проданный'],
    explanation: "Passief bij een onvoltooid werkwoord maak je met -ся: продаются (билеты is meervoud). 'продают себя' zou letterlijk 'verkopen zichzelf' zijn."
  },

  // COMPLEX-SENTENCES
  {
    category: 'b2-grammatica-samengestelde-zinnen', grammarRule: 'COMPLEX-SENTENCES', type: 'mc',
    prompt: "Vul aan: Это женщина, ___ я видел вчера. (dit is de vrouw die ik gisteren zag)",
    correctAnswer: 'которую', options: ['которая', 'которую', 'которой'],
    explanation: "который stemt in geslacht overeen met женщина (vrouwelijk) maar krijgt zijn naamval uit de bijzin: ik zag háár → accusatief: которую."
  },
  {
    category: 'b2-grammatica-samengestelde-zinnen', grammarRule: 'COMPLEX-SENTENCES', type: 'mc',
    prompt: "Vul aan: Я хочу, ___ ты мне позвонил. (ik wil dat jij me belt)",
    correctAnswer: 'чтобы', options: ['что', 'чтобы', 'если'],
    explanation: "Een wens of verzoek met een ander onderwerp → чтобы + verleden tijd: Я хочу, чтобы ты позвонил. Met что zou je een feit meedelen (Я знаю, что ты позвонил)."
  },
  {
    category: 'b2-grammatica-samengestelde-zinnen', grammarRule: 'COMPLEX-SENTENCES', type: 'mc',
    prompt: "Hoe zeg je 'Ik weet niet of hij komt'?",
    correctAnswer: 'Я не знаю, придёт ли он.', options: ['Я не знаю, если он придёт.', 'Я не знаю, придёт ли он.', 'Я не знаю, что он придёт.'],
    explanation: "'Of' in een indirecte ja/nee-vraag is ли, geplaatst ná het werkwoord: придёт ли он. если betekent alleen 'als' (voorwaarde) en is hier een veelgemaakte fout."
  },
  {
    category: 'b2-grammatica-samengestelde-zinnen', grammarRule: 'COMPLEX-SENTENCES', type: 'mc',
    prompt: "Vul aan: ___ было холодно, мы пошли гулять. (hoewel het koud was, gingen we wandelen)",
    correctAnswer: 'Хотя', options: ['Потому что', 'Хотя', 'Поэтому'],
    explanation: "Een tegenstelling ('hoewel') → хотя. потому что = omdat, поэтому = daarom."
  },

  // WORD-FORMATION
  {
    category: 'b2-grammatica-woordvorming', grammarRule: 'WORD-FORMATION', type: 'mc',
    prompt: "Je kent ход (gang, loop). Wat betekent dan 'подземный переход'?",
    correctAnswer: 'voetgangerstunnel (ondergrondse oversteek)', options: ['ondergrondse parkeergarage', 'voetgangerstunnel (ondergrondse oversteek)', 'metro-ingang'],
    explanation: "пере- = over/dwars, ход = gang → переход = oversteekplaats; подземный = onder (под) de aarde (земля) → een ondergrondse oversteek: voetgangerstunnel."
  },
  {
    category: 'b2-grammatica-woordvorming', grammarRule: 'WORD-FORMATION', type: 'mc',
    prompt: "Welk woord betekent 'gratis'?",
    correctAnswer: 'бесплатный', options: ['платный', 'бесплатный', 'заплаченный'],
    explanation: "без-/бес- betekent 'zonder': бес + плата (betaling) + -ный = zonder betaling = gratis. платный = betaald (je moet ervoor betalen)."
  },
  {
    category: 'b2-grammatica-woordvorming', grammarRule: 'WORD-FORMATION', type: 'mc',
    prompt: "Wat is het verkleinwoord van 'стол' (tafel) dat je in een restaurant gebruikt?",
    correctAnswer: 'столик', options: ['столик', 'столище', 'стольник'],
    explanation: "-ик is het gangbare verkleinwoord: столик (tafeltje). In een restaurant vraag je altijd om een столик, nooit om een стол."
  },

  // SHORT-ADJECTIVES
  {
    category: 'b2-grammatica-korte-adjectieven', grammarRule: 'SHORT-ADJECTIVES', type: 'mc',
    prompt: "Vul aan: Мне ___ ваша помощь. (ik heb uw hulp nodig — помощь is vrouwelijk)",
    correctAnswer: 'нужна', options: ['нужен', 'нужна', 'нужно'],
    explanation: "нужен stemt overeen met wat er nodig is, niet met wie het nodig heeft: помощь is vrouwelijk → нужна. De persoon staat in de datief: мне."
  },
  {
    category: 'b2-grammatica-korte-adjectieven', grammarRule: 'SHORT-ADJECTIVES', type: 'mc',
    prompt: "Een vrouw zegt dat ze moet gaan. Kies de juiste vorm.",
    correctAnswer: 'Я должна идти.', options: ['Я должен идти.', 'Я должна идти.', 'Я должно идти.'],
    explanation: "должен verandert met het onderwerp: должен (m), должна (v), должно (o), должны (mv). Een vrouw zegt должна."
  },
  {
    category: 'b2-grammatica-korte-adjectieven', grammarRule: 'SHORT-ADJECTIVES', type: 'mc',
    prompt: "Hoe vraag je in een café of een stoel vrij is?",
    correctAnswer: 'Здесь свободно?', options: ['Здесь свободный?', 'Здесь свободно?', 'Здесь свобода?'],
    explanation: "Onpersoonlijk, met de onzijdige korte vorm: свободно. Ook gebruikelijk: Это место свободно? / Здесь не занято?"
  }
];

const practicalSentences = [
  { category: 'b2-praktische-zinnen', prompt: 'Ik wil een klacht indienen over de service.', tokens: ['Я', 'хочу', 'подать', 'жалобу', 'на', 'обслуживание.'], explanation: "'подать жалобу на' + accusatief = een klacht indienen over. Formeel maar volkomen gangbaar." },
  { category: 'b2-praktische-zinnen', prompt: 'Mijn bagage is niet aangekomen. Waar kan ik dat melden?', tokens: ['Мой', 'багаж', 'не', 'прилетел.', 'Где', 'можно', 'об', 'этом', 'заявить?'], explanation: "Bagage 'vliegt' mee: не прилетел. 'заявить об этом' = dit melden (о/об + prepositief)." },
  { category: 'b2-praktische-zinnen', prompt: 'Er is bij mij ingebroken; ik wil aangifte doen.', tokens: ['Меня', 'обокрали,', 'я', 'хочу', 'написать', 'заявление.'], explanation: "'Меня обокрали' = ik ben bestolen (onpersoonlijk, 3e persoon meervoud). Aangifte doen = написать/подать заявление (в полицию)." },
  { category: 'b2-praktische-zinnen', prompt: 'De airco in mijn kamer doet het niet.', tokens: ['В', 'моём', 'номере', 'не', 'работает', 'кондиционер.'], explanation: "'номер' = hotelkamer; 'не работает' = doet het niet. Woordvolgorde: het nieuwe (кондиционер) komt achteraan." },
  { category: 'b2-praktische-zinnen', prompt: 'Zou u me kunnen uitleggen hoe dit werkt?', tokens: ['Не', 'могли', 'бы', 'вы', 'объяснить,', 'как', 'это', 'работает?'], explanation: "Beleefd verzoek met бы, gevolgd door een bijzin met как (hoe). Let op de komma voor как." },
  { category: 'b2-praktische-zinnen', prompt: 'Ik ben het gedeeltelijk met u eens, maar ...', tokens: ['Я', 'частично', 'с', 'вами', 'согласен,', 'но...'], explanation: "'частично' = gedeeltelijk. Handig om een discussie beleefd te nuanceren." },
  { category: 'b2-praktische-zinnen', prompt: 'Laten we de voorwaarden van het contract bespreken.', tokens: ['Давайте', 'обсудим', 'условия', 'договора.'], explanation: "'Давайте + wij-vorm voltooid' = laten we...; 'условия договора' = de voorwaarden van het contract (genitief)." },
  { category: 'b2-praktische-zinnen', prompt: 'Volgens de laatste berichten is de vlucht vertraagd.', tokens: ['По', 'последним', 'данным,', 'рейс', 'задерживается.'], explanation: "'по последним данным' = volgens de laatste gegevens (по + datief meervoud). 'задерживается' = wordt vertraagd (passief met -ся)." },
  { category: 'b2-praktische-zinnen', prompt: 'Eerlijk gezegd had ik iets anders verwacht.', tokens: ['Честно', 'говоря,', 'я', 'ожидал', 'другого.'], explanation: "'Честно говоря' is een vast gerundium; 'ожидать другого' = iets anders verwachten (genitief bij ожидать van iets onbepaalds)." },
  { category: 'b2-praktische-zinnen', prompt: 'Kunt u dat schriftelijk bevestigen?', tokens: ['Вы', 'можете', 'подтвердить', 'это', 'письменно?'], explanation: "'письменно' = schriftelijk (bijwoord); 'подтвердить' = bevestigen. Essentieel bij elke afspraak in Rusland." },
  { category: 'b2-praktische-zinnen', prompt: 'Ik heb niets aan te geven.', tokens: ['Мне', 'нечего', 'декларировать.'], explanation: "'нечего' + infinitief = er is niets om te...; de persoon in de datief. Standaardzin bij de douane." },
  { category: 'b2-praktische-zinnen', prompt: 'Ondanks de regen was het festival een succes.', tokens: ['Несмотря', 'на', 'дождь,', 'фестиваль', 'прошёл', 'успешно.'], explanation: "'несмотря на' + accusatief = ondanks; 'прошёл успешно' = verliep succesvol (een evenement 'gaat voorbij')." },
  { category: 'b2-praktische-zinnen', prompt: 'Ik heb geen tijd voor onzin.', tokens: ['У', 'меня', 'нет', 'времени', 'на', 'ерунду.'], explanation: "'нет времени на' + accusatief = geen tijd hebben voor. 'ерунда' = onzin (neutraal, ook in nette gesprekken bruikbaar)." },
  { category: 'b2-praktische-zinnen', prompt: 'Zodra ik iets weet, laat ik het u weten.', tokens: ['Как', 'только', 'я', 'что-нибудь', 'узнаю,', 'я', 'вам', 'сообщу.'], explanation: "'как только' = zodra, met de toekomende tijd in beide helften (узнаю, сообщу — beide voltooid)." },
  { category: 'b2-praktische-zinnen', prompt: 'Maakt u zich geen zorgen, alles komt goed.', tokens: ['Не', 'волнуйтесь,', 'всё', 'будет', 'хорошо.'], explanation: "'Не волнуйтесь' = maakt u zich geen zorgen (gebiedende wijs, onvoltooid na не). 'Всё будет хорошо' is dé Russische geruststelling." },
  { category: 'b2-praktische-zinnen', prompt: 'Wie is hiervoor verantwoordelijk?', tokens: ['Кто', 'за', 'это', 'отвечает?'], explanation: "'отвечать за' + accusatief = verantwoordelijk zijn voor (letterlijk: antwoorden voor)." }
];

const readings = [
  {
    category: 'b2-lezen',
    title: 'Новости: отключение горячей воды',
    passage:
      'В связи с плановыми работами на тепловых сетях в Центральном районе с 3 по 16 июля будет отключена горячая вода. Как сообщает пресс-служба городской администрации, работы затронут около двухсот домов. Жителей просят заранее запастись водой и следить за информацией на сайте управляющей компании. В случае аварийных ситуаций следует обращаться по телефону горячей линии. Администрация приносит извинения за временные неудобства.',
    questions: [
      { prompt: 'Hoelang zit het Centrale district zonder warm water?', correctAnswer: 'twee weken (3 t/m 16 juli)', options: ['drie dagen', 'twee weken (3 t/m 16 juli)', 'de hele zomer'], explanation: "'с 3 по 16 июля' = van 3 tot en met 16 juli. Dit soort jaarlijkse afsluitingen (отключение горячей воды) zijn in Russische steden heel normaal." },
      { prompt: 'Wat wordt de bewoners gevraagd?', correctAnswer: 'van tevoren water in te slaan en de website in de gaten te houden', options: ['om thuis te blijven', 'van tevoren water in te slaan en de website in de gaten te houden', 'om de administratie te bellen'], explanation: "'просят заранее запастись водой и следить за информацией на сайте' = men vraagt tijdig water in te slaan en de informatie op de site te volgen. Bellen is alleen voor noodgevallen (аварийные ситуации)." },
      { prompt: "Welke grammaticale vorm is 'будет отключена'?", correctAnswer: 'een passief (korte vorm van het deelwoord) in de toekomende tijd', options: ['een gerundium', 'een passief (korte vorm van het deelwoord) in de toekomende tijd', 'een gebiedende wijs'], explanation: "будет + korte passieve vorm (отключена, vrouwelijk bij вода) = zal worden afgesloten: het passief in de toekomende tijd.", grammarRule: 'PARTICIPLES-PASSIVE' }
    ]
  },
  {
    category: 'b2-lezen',
    title: 'Деловое письмо',
    passage:
      'Уважаемый Даниэль! Благодарим Вас за интерес к нашей компании. Подтверждаем получение Вашего коммерческого предложения от 12 мая. К сожалению, предложенные условия оплаты нас не устраивают: мы работаем только по предоплате в размере 50 процентов. Если Вы готовы пересмотреть условия, мы будем рады обсудить детали на встрече на следующей неделе. Просим сообщить удобное для Вас время. С уважением, Елена Смирнова, менеджер по закупкам.',
    questions: [
      { prompt: 'Wat is het probleem met het voorstel van Daniël?', correctAnswer: 'de betalingsvoorwaarden', options: ['de prijs', 'de betalingsvoorwaarden', 'de leverdatum'], explanation: "'предложенные условия оплаты нас не устраивают' = de voorgestelde betalingsvoorwaarden komen ons niet uit. Het bedrijf wil 50% vooruitbetaling (предоплата)." },
      { prompt: 'Wat wordt Daniël gevraagd te doen?', correctAnswer: 'een geschikt tijdstip voor een afspraak doorgeven', options: ['een nieuwe offerte sturen', 'een geschikt tijdstip voor een afspraak doorgeven', 'de betaling overmaken'], explanation: "'Просим сообщить удобное для Вас время' = we verzoeken u een voor u geschikt tijdstip door te geven." },
      { prompt: "Waarom wordt 'Вас' met een hoofdletter geschreven?", correctAnswer: 'als beleefdheidsvorm in formele correspondentie', options: ['omdat het aan het begin van de zin staat', 'als beleefdheidsvorm in formele correspondentie', 'het is een spelfout'], explanation: "In zakelijke brieven wordt de beleefde aanspreekvorm Вы/Вас/Ваш met een hoofdletter geschreven wanneer je één persoon aanspreekt." }
    ]
  },
  {
    category: 'b2-lezen',
    title: 'Отзыв о ресторане',
    passage:
      'Были с женой в этом ресторане в субботу вечером. Столик бронировали заранее, но всё равно ждали минут двадцать. Интерьер уютный, музыка ненавязчивая. Заказали борщ, пельмени и салат «Оливье». Борщ — выше всяких похвал, а вот пельмени показались нам пересоленными. Официант был вежлив, хотя и немного медлителен. Цены средние по городу. В целом впечатление скорее положительное, но во второй раз пойдём, только если не будет очереди.',
    questions: [
      { prompt: 'Wat vond het stel van de borsjtsj?', correctAnswer: 'uitstekend', options: ['te zout', 'uitstekend', 'te duur'], explanation: "'выше всяких похвал' = boven alle lof verheven (uitstekend). De pelmeni waren te zout (пересоленными: пере- = te veel)." },
      { prompt: 'Onder welke voorwaarde komen ze terug?', correctAnswer: 'als er geen wachtrij is', options: ['als de prijzen dalen', 'als er geen wachtrij is', 'als er een andere ober is'], explanation: "'только если не будет очереди' = alleen als er geen rij is. Ze hadden ondanks een reservering twintig minuten gewacht." },
      { prompt: "Wat betekent het voorvoegsel пере- in 'пересоленный'?", correctAnswer: 'te veel (over-)', options: ['te weinig', 'te veel (over-)', 'opnieuw'], explanation: "пере- kan 'opnieuw' betekenen (переделать) maar ook 'te veel/over-': пересолить = te veel zouten, переплатить = te veel betalen.", grammarRule: 'WORD-FORMATION' }
    ]
  },
  {
    category: 'b2-lezen',
    title: 'Правила проживания в общежитии',
    passage:
      'Проживающие обязаны соблюдать тишину с 23:00 до 7:00. Курение в комнатах и коридорах запрещено. Гости могут находиться в общежитии до 22:00 при условии регистрации на входе. Пользоваться электроприборами мощностью свыше 1 кВт не разрешается. За порчу имущества с проживающего взимается штраф в размере стоимости повреждённого имущества. Уборка комнат проводится самими проживающими не реже одного раза в неделю.',
    questions: [
      { prompt: 'Tot hoe laat mogen gasten blijven?', correctAnswer: 'tot 22:00, mits ze zich bij de ingang registreren', options: ['tot 23:00', 'tot 22:00, mits ze zich bij de ingang registreren', 'gasten zijn niet toegestaan'], explanation: "'Гости могут находиться ... до 22:00 при условии регистрации на входе' = tot 22:00 op voorwaarde van registratie bij de ingang." },
      { prompt: 'Wat gebeurt er als je iets kapotmaakt?', correctAnswer: 'je betaalt een boete ter hoogte van de waarde', options: ['je wordt uit het huis gezet', 'je betaalt een boete ter hoogte van de waarde', 'niets, dat is verzekerd'], explanation: "'взимается штраф в размере стоимости повреждённого имущества' = er wordt een boete geïnd ter hoogte van de waarde van het beschadigde eigendom." },
      { prompt: "'Проживающие' is grammaticaal gezien:", correctAnswer: 'een actief tegenwoordig deelwoord, gebruikt als zelfstandig naamwoord (de bewoners)', options: ['een gerundium', 'een actief tegenwoordig deelwoord, gebruikt als zelfstandig naamwoord (de bewoners)', 'een bijwoord'], explanation: "проживать (wonen) → они проживают → проживающий; in het meervoud zelfstandig gebruikt: проживающие = de bewoners. Typisch ambtelijk Russisch.", grammarRule: 'PARTICIPLES-ACTIVE' }
    ]
  }
];

const drills = {
  conjugation: { category: 'b2-grammatica-vervoeging', rule: 'VERB-CONJUGATION', maxVerbs: 30 },
  past: { category: 'b2-grammatica-vervoeging', rule: 'VERB-PAST-GENDER', maxVerbs: 12 },
  aspect: { category: 'b2-grammatica-vervoeging', rule: 'ASPECT-PAIRS', maxVerbs: 20 },
  cases: { category: 'b2-grammatica-naamvallen', rule: 'NOUN-DECLENSION', maxNouns: 30 },
  comparative: { category: 'b2-grammatica-vergelijking', rule: 'COMPARATIVE-SUPERLATIVE', maxAdjectives: 20 }
};

module.exports = { categories, grammarRules, words, grammarExercises, practicalSentences, readings, drills };
