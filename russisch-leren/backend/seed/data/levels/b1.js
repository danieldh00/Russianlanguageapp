// B1 (drempelniveau): je redden in het dagelijks leven in een Russischtalig
// land -- dokter, apotheek, wonen, documenten, bank, telefoon, werk, uit eten,
// winkelen, onderweg, een mening geven -- plus de grammatica die daar
// onmisbaar voor is: werkwoorden van beweging, aspectparen, gebiedende wijs,
// voorwaardelijke wijs, telwoorden met naamvallen, data en tijd.
//
// Woorden hoeven geen transliteratie of klemtoon op te geven: die worden bij
// het vullen automatisch aangevuld (klemtoon uit het Open Russian-woordenboek).

const categories = [
  { slug: 'b1-gezondheid', name: 'Gezondheid & bij de dokter', description: 'Klachten uitleggen, een afspraak maken, de dokter begrijpen.', level: 'B1', sort_order: 40 },
  { slug: 'b1-apotheek', name: 'Apotheek & medicijnen', description: 'Medicijnen vragen, de bijsluiter en het advies van de apotheker begrijpen.', level: 'B1', sort_order: 41 },
  { slug: 'b1-wonen-huren', name: 'Wonen & huren', description: 'Een woning zoeken, een huurcontract, de buren en de huisbaas.', level: 'B1', sort_order: 42 },
  { slug: 'b1-documenten', name: 'Documenten & bureaucratie', description: 'Paspoort, visum, registratie, formulieren en loketten.', level: 'B1', sort_order: 43 },
  { slug: 'b1-bank-geld', name: 'Bank & geld', description: 'Een rekening openen, pinnen, overmaken, wisselen.', level: 'B1', sort_order: 44 },
  { slug: 'b1-telefoon-internet', name: 'Telefoon & internet', description: 'Een simkaart, bereik, wifi, opladen, een nummer bellen.', level: 'B1', sort_order: 45 },
  { slug: 'b1-werk-sollicitatie', name: 'Werk & sollicitatie', description: 'Vacatures, een cv, het sollicitatiegesprek, salaris en contract.', level: 'B1', sort_order: 46 },
  { slug: 'b1-restaurant', name: 'Uit eten & bestellen', description: 'Reserveren, bestellen, allergieën, de rekening en fooi.', level: 'B1', sort_order: 47 },
  { slug: 'b1-winkelen', name: 'Winkelen & markt', description: 'Maten, passen, korting, ruilen, contant of pin.', level: 'B1', sort_order: 48 },
  { slug: 'b1-onderweg', name: 'Onderweg: vervoer & de weg vragen', description: 'Openbaar vervoer, kaartjes, overstappen en de weg beschrijven.', level: 'B1', sort_order: 49 },
  { slug: 'b1-mening', name: 'Meningen & discussie', description: 'Zeggen wat je vindt, het eens of oneens zijn, twijfelen.', level: 'B1', sort_order: 50 },
  { slug: 'b1-karakter', name: 'Karakter & relaties', description: 'Mensen beschrijven en over relaties praten.', level: 'B1', sort_order: 51 },
  { slug: 'b1-grammatica-beweging', name: 'Grammatica: werkwoorden van beweging', description: 'идти/ходить, ехать/ездить en de belangrijkste voorvoegsels (при-, у-, вы-, по-).', level: 'B1', sort_order: 52 },
  { slug: 'b1-grammatica-aspect', name: 'Grammatica: aspectparen', description: 'Onvoltooid en voltooid aspect kiezen, en de partners uit je hoofd kennen.', level: 'B1', sort_order: 53 },
  { slug: 'b1-grammatica-gebiedende-wijs', name: 'Grammatica: gebiedende wijs', description: 'Verzoeken, bevelen en adviezen: -и, -й, -ь en de beleefde -те-vorm.', level: 'B1', sort_order: 54 },
  { slug: 'b1-grammatica-voorwaardelijk', name: 'Grammatica: voorwaardelijke wijs (бы)', description: 'Zou, als ... dan, wensen en beleefde verzoeken met бы.', level: 'B1', sort_order: 55 },
  { slug: 'b1-grammatica-telwoorden', name: 'Grammatica: telwoorden, datum & tijd', description: 'Telwoorden met naamvallen (2-4 / 5+), de klok en data.', level: 'B1', sort_order: 56 },
  { slug: 'b1-grammatica-vervoeging', name: 'Grammatica: vervoegingsdrills', description: 'Automatisch gegenereerde drills: tegenwoordige/toekomende tijd, verleden tijd en gebiedende wijs van B1-werkwoorden.', level: 'B1', sort_order: 57 },
  { slug: 'b1-grammatica-naamvallen', name: 'Grammatica: naamvaldrills', description: 'Automatisch gegenereerde drills: de naamvalsvormen van B1-zelfstandige naamwoorden.', level: 'B1', sort_order: 58 },
  { slug: 'b1-praktische-zinnen', name: 'Praktische zinnen B1', description: 'Complete zinnen voor de dokter, de bank, het loket en het restaurant — bouwen én luisteren.', level: 'B1', sort_order: 59 },
  { slug: 'b1-lezen', name: 'Lezen B1', description: 'Korte teksten uit het dagelijks leven (een advertentie, een bericht, een bijsluiter) met begripsvragen.', level: 'B1', sort_order: 60 }
];

const grammarRules = [
  {
    code: 'VERBS-OF-MOTION',
    title: 'Werkwoorden van beweging: идти/ходить, ехать/ездить',
    explanation:
      "Het Russisch heeft voor 'gaan' steeds twee onvoltooide werkwoorden. Het bepaalde werkwoord (идти te voet, ехать met een voertuig) beschrijft één beweging in één richting, meestal nu of gepland: Я иду в магазин (ik ben op weg naar de winkel). Het onbepaalde werkwoord (ходить, ездить) beschrijft herhaalde bewegingen, heen-en-terug, of het vermogen om te bewegen: Я хожу в магазин каждый день (ik ga elke dag naar de winkel). Te voet vs. met vervoer is een echte betekenisgrens: идти в театр (lopend), ехать в Москву (met de trein/auto). Lopen (пешком) hoort bij идти/ходить, vliegen bij лететь/летать, rennen bij бежать/бегать.",
    example: 'Сейчас я иду на работу. / Обычно я хожу на работу пешком. / Летом мы едем в Сочи. / Он часто ездит в Казань.'
  },
  {
    code: 'VERBS-OF-MOTION-PREFIXES',
    title: 'Voorvoegsels bij werkwoorden van beweging',
    explanation:
      "Met een voorvoegsel krijgt een bewegingswerkwoord een richting én wordt het meestal een aspectpaar: прийти/приходить (aankomen), уйти/уходить (weggaan), выйти/выходить (naar buiten gaan / uitstappen), войти/входить (binnengaan), перейти/переходить (oversteken), подойти/подходить (naderen). Bij het voorvoegsel + bepaald werkwoord (при + идти = прийти) krijg je het voltooide lid, bij het voorvoegsel + onbepaald werkwoord (при + ходить = приходить) het onvoltooide. Hetzelfde met ехать: приехать/приезжать, уехать/уезжать, выехать/выезжать. Het voorvoegsel по- betekent 'beginnen te gaan': Пойдём! (Laten we gaan!).",
    example: 'Он пришёл домой в семь. / Она приходит домой в семь каждый день. / Вы выходите на следующей? (Stapt u bij de volgende uit?)'
  },
  {
    code: 'ASPECT-PAIRS',
    title: 'Aspectparen in de praktijk',
    explanation:
      "Bijna elk werkwoord bestaat als paar: onvoltooid (proces, herhaling, gewoonte, het bezig zijn) en voltooid (één afgeronde handeling met resultaat, of het begin ervan). De partner wordt gevormd door (1) een voorvoegsel: читать → прочитать, писать → написать, делать → сделать; (2) een ander achtervoegsel: решать → решить, получать → получить, открывать → открыть; (3) een ander woord: говорить → сказать, брать → взять, класть → положить. In de tegenwoordige tijd gebruik je alleen onvoltooide werkwoorden; de 'tegenwoordige' vervoeging van een voltooid werkwoord betekent toekomst: Я прочитаю (ik zal uitlezen). Vuistregels: 'altijd/vaak/elke dag' → onvoltooid; 'al klaar/eenmalig/resultaat' → voltooid; na начать/продолжать/закончить altijd onvoltooid.",
    example: 'Я читал эту книгу (ik was ermee bezig) / Я прочитал эту книгу (ik heb hem uit). Я долго решал задачу и наконец решил её.'
  },
  {
    code: 'IMPERATIVE',
    title: 'Gebiedende wijs',
    explanation:
      "De gebiedende wijs vorm je vanuit de stam van de 3e persoon meervoud (они-vorm). Eindigt die stam op een medeklinker en ligt de klemtoon in de я-vorm op de uitgang, dan krijg je -и: говорят → говори! Eindigt de stam op een klinker, dan -й: читают → читай! Eindigt de stam op een medeklinker met klemtoon op de stam, dan -ь: готовят → готовь! Beleefd of tegen meerdere mensen plak je -те erachter: говорите, читайте, готовьте. Voor een verzoek voeg je пожалуйста toe; een ontkennend verzoek ('doe dat niet') staat meestal in het onvoltooide aspect: Не открывайте окно. Een positief eenmalig verzoek staat vaak in het voltooide: Откройте окно, пожалуйста.",
    example: 'Скажите, пожалуйста... / Подождите минуту. / Не беспокойтесь. / Давай пойдём! (Laten we gaan!)'
  },
  {
    code: 'CONDITIONAL-BY',
    title: 'Voorwaardelijke wijs met бы',
    explanation:
      "'Zou' maak je met het partikel бы plus de verleden tijd: Я хотел бы (ik zou willen), Она пошла бы (zij zou gaan). Bij een als-dan-zin staat бы in beide helften en begint de voorwaarde met если бы: Если бы у меня было время, я бы поехал в Россию (als ik tijd had, zou ik naar Rusland gaan). Let op: de verleden tijd zegt hier niets over de tijd -- dezelfde zin kan over nu, morgen of vroeger gaan. бы staat direct na если of na het werkwoord/het benadrukte woord en wordt na een klinker vaak verkort tot б. Ook voor wensen: Хорошо бы отдохнуть (het zou fijn zijn om uit te rusten) en beleefde vragen: Вы не могли бы помочь? (Zou u kunnen helpen?).",
    example: 'Если бы я знал, я бы позвонил. / Я бы выпил чаю. / Не могли бы вы повторить?'
  },
  {
    code: 'NUMERALS-CASES',
    title: 'Telwoorden en naamvallen',
    explanation:
      "Na один (одна, одно) staat het zelfstandig naamwoord in de nominatief enkelvoud en één stemt in geslacht overeen: один час, одна минута, одно окно. Na два/две, три en четыре staat het in de genitief enkelvoud: два часа, три минуты, четыре окна (два bij mannelijk/onzijdig, две bij vrouwelijk). Na пять en hoger (t/m twintig, en na elk telwoord dat op 5-9 of 0 eindigt) staat het in de genitief meervoud: пять часов, шесть минут, десять окон. Bij samengestelde getallen telt het laatste woord: двадцать один рубль, двадцать два рубля, двадцать пять рублей. Dit patroon zie je overal: bij geld (рубль/рубля/рублей), leeftijd (год/года/лет) en tijd (час/часа/часов).",
    example: 'Мне 31 год (тридцать один год), ему 24 года, ей 40 лет. Это стоит 150 рублей.'
  },
  {
    code: 'DATES-TIME',
    title: 'De klok, data en tijdsaanduidingen',
    explanation:
      "Hele uren: Сейчас три часа (het is drie uur; час/часа/часов volgt de telwoordregel). Tot het halve uur tel je vooruit naar het volgende uur met de genitief: десять минут пятого (10 over 4, letterlijk 'tien minuten van het vijfde'), половина пятого (half vijf). Na het halve uur tel je terug met без + genitief: без десяти пять (10 voor 5). In het dagelijks leven en op borden zegt men ook gewoon пятнадцать двадцать (15:20). 'Om ... uur' is в + accusatief: в три часа, в половине пятого (prepositief bij половина). Data: de dag als rangtelwoord in het onzijdig, de maand in de genitief: первое мая (1 mei); 'op 1 mei' is de genitief: первого мая. Het jaar: в 2024 году (в две тысячи двадцать четвёртом году). Dagen van de week: в понедельник (in + accusatief).",
    example: 'Поезд в семь тридцать. / Встретимся без четверти шесть. / Я родился двадцатого марта. / Магазин открыт с девяти до восьми.'
  },
  {
    code: 'VERB-CONJUGATION',
    title: 'Vervoeging in de tegenwoordige/toekomende tijd (overzicht)',
    explanation:
      "Groep 1 (е-vervoeging): -ю/-у, -ешь, -ет, -ем, -ете, -ют/-ут (читаю, читаешь, читает, читаем, читаете, читают). Groep 2 (и-vervoeging): -ю/-у, -ишь, -ит, -им, -ите, -ят/-ат (говорю, говоришь, говорит, говорим, говорите, говорят). Let op de medeklinkerwisseling in de я-vorm van veel groep-2-werkwoorden: любить → люблю, видеть → вижу, ходить → хожу, сидеть → сижу, платить → плачу. Bij klemtoonverschuiving valt de klemtoon in de я-vorm op de uitgang en daarna op de stam: пишу, пишешь, пишет. Onregelmatig maar onmisbaar: хотеть (хочу, хочешь, хочет, хотим, хотите, хотят), мочь (могу, можешь, может, можем, можете, могут), есть 'eten' (ем, ешь, ест, едим, едите, едят), дать (дам, дашь, даст, дадим, дадите, дадут).",
    example: 'я работаю, ты работаешь, они работают / я плачу, ты платишь, они платят'
  },
  {
    code: 'NOUN-DECLENSION',
    title: 'Verbuiging van zelfstandige naamwoorden (overzicht)',
    explanation:
      "Mannelijk op medeklinker (стол): стола, столу, стол (levend: стола), столом, столе; meervoud столы, столов, столам, столы, столами, столах. Vrouwelijk op -а (книга): книги, книге, книгу, книгой, книге; meervoud книги, книг, книгам, книги, книгами, книгах. Onzijdig op -о (окно): окна, окну, окно, окном, окне; meervoud окна, окон, окнам, окна, окнами, окнах. Vrouwelijk op -ь (дверь): двери, двери, дверь, дверью, двери; meervoud двери, дверей, дверям, двери, дверями, дверях. Zachte varianten (-я, -е, -й) krijgen dezelfde uitgangen in zachte vorm (-и, -е, -ю, -ей/-ем). Onthoud de spelregel: na г, к, х, ж, ш, щ, ч nooit ы maar и (книги, ножи).",
    example: 'у брата (gen), брату (dat), с братом (inst), о брате (prep); пять братьев (gen pl)'
  },
  {
    code: 'VERB-PAST-GENDER',
    title: 'Verleden tijd: uitgang naar geslacht en getal',
    explanation:
      "De verleden tijd kent geen persoon, alleen geslacht en getal: -л (hij / ik als man), -ла (zij / ik als vrouw), -ло (het), -ли (meervoud, en beleefd 'u'). De stam is de infinitief zonder -ть: работать → работал, работала, работало, работали. Werkwoorden op -ти en -чь zijn onregelmatiger: идти → шёл, шла, шло, шли; нести → нёс, несла; мочь → мог, могла, могли. Let op de klemtoon in de vrouwelijke vorm van korte werkwoorden: был, была́, было, были; жил, жила́; взял, взяла́.",
    example: 'Вчера я ходил (m) / ходила (v) в театр. Мы были дома. Она сказала, что придёт.'
  }
];

const words = [
  // --- gezondheid & dokter ---
  { category: 'b1-gezondheid', russian: 'болеть', translation_nl: 'ziek zijn; pijn doen', notes: "Twee betekenissen: Я болею (ik ben ziek) en У меня болит голова (mijn hoofd doet pijn — болит/болят, alleen 3e persoon)." },
  { category: 'b1-gezondheid', russian: 'врач', translation_nl: 'arts / dokter', notes: 'Formeel woord; in gesprek hoor je ook доктор.' },
  { category: 'b1-gezondheid', russian: 'поликлиника', translation_nl: 'polikliniek / huisartsenpost' },
  { category: 'b1-gezondheid', russian: 'приём', translation_nl: 'spreekuur / afspraak (bij de dokter)', notes: 'записаться на приём = een afspraak maken.' },
  { category: 'b1-gezondheid', russian: 'температура', translation_nl: 'temperatuur / koorts', notes: 'У меня температура = ik heb koorts.' },
  { category: 'b1-gezondheid', russian: 'кашель', translation_nl: 'hoest' },
  { category: 'b1-gezondheid', russian: 'насморк', translation_nl: 'verkoudheid / loopneus' },
  { category: 'b1-gezondheid', russian: 'простуда', translation_nl: 'verkoudheid (de ziekte)' },
  { category: 'b1-gezondheid', russian: 'тошнота', translation_nl: 'misselijkheid', notes: 'Меня тошнит = ik ben misselijk.' },
  { category: 'b1-gezondheid', russian: 'давление', translation_nl: 'bloeddruk', notes: 'высокое/низкое давление = hoge/lage bloeddruk.' },
  { category: 'b1-gezondheid', russian: 'анализ', translation_nl: 'onderzoek / test (bloed, urine)', notes: 'сдать анализ крови = bloed laten prikken.' },
  { category: 'b1-gezondheid', russian: 'страховка', translation_nl: 'verzekering' },
  { category: 'b1-gezondheid', russian: 'скорая помощь', translation_nl: 'ambulance', notes: 'Alarmnummer in Rusland: 112 (of 103 voor de ambulance).' },
  { category: 'b1-gezondheid', russian: 'аллергия', translation_nl: 'allergie', notes: 'У меня аллергия на орехи = ik ben allergisch voor noten (на + accusatief).' },
  { category: 'b1-gezondheid', russian: 'больница', translation_nl: 'ziekenhuis' },
  { category: 'b1-gezondheid', russian: 'выздоравливать', translation_nl: 'beter worden / herstellen', notes: 'Выздоравливай(те)! = beterschap!' },

  // --- apotheek ---
  { category: 'b1-apotheek', russian: 'аптека', translation_nl: 'apotheek', notes: 'Дежурная аптека = apotheek met nachtdienst.' },
  { category: 'b1-apotheek', russian: 'лекарство', translation_nl: 'medicijn', notes: 'лекарство от кашля = medicijn tegen hoest (от + genitief).' },
  { category: 'b1-apotheek', russian: 'таблетка', translation_nl: 'tablet / pil' },
  { category: 'b1-apotheek', russian: 'рецепт', translation_nl: 'recept (dokter én keuken)', notes: 'по рецепту = op recept; без рецепта = zonder recept.' },
  { category: 'b1-apotheek', russian: 'обезболивающее', translation_nl: 'pijnstiller' },
  { category: 'b1-apotheek', russian: 'капли', translation_nl: 'druppels', notes: 'капли для глаз / в нос = oog-/neusdruppels.' },
  { category: 'b1-apotheek', russian: 'мазь', translation_nl: 'zalf' },
  { category: 'b1-apotheek', russian: 'пластырь', translation_nl: 'pleister' },
  { category: 'b1-apotheek', russian: 'доза', translation_nl: 'dosis' },
  { category: 'b1-apotheek', russian: 'инструкция', translation_nl: 'bijsluiter / gebruiksaanwijzing' },
  { category: 'b1-apotheek', russian: 'принимать', translation_nl: 'innemen (medicijn); aannemen', notes: 'принимать по одной таблетке два раза в день = twee keer per dag één tablet innemen.' },
  { category: 'b1-apotheek', russian: 'побочный эффект', translation_nl: 'bijwerking' },

  // --- wonen & huren ---
  { category: 'b1-wonen-huren', russian: 'снимать', translation_nl: 'huren (woning); uittrekken; fotograferen', notes: 'снимать квартиру = een appartement huren. Voltooid: снять.' },
  { category: 'b1-wonen-huren', russian: 'сдавать', translation_nl: 'verhuren; inleveren; examen doen', notes: 'сдаётся квартира = appartement te huur.' },
  { category: 'b1-wonen-huren', russian: 'аренда', translation_nl: 'huur (het huren)', notes: 'арендная плата = de huurprijs.' },
  { category: 'b1-wonen-huren', russian: 'договор', translation_nl: 'contract / overeenkomst' },
  { category: 'b1-wonen-huren', russian: 'хозяин', translation_nl: 'huisbaas / eigenaar / gastheer', notes: 'Vrouwelijk: хозяйка.' },
  { category: 'b1-wonen-huren', russian: 'сосед', translation_nl: 'buurman', notes: 'Vrouwelijk: соседка; meervoud соседи.' },
  { category: 'b1-wonen-huren', russian: 'этаж', translation_nl: 'verdieping', notes: 'Let op: первый этаж = de begane grond (de Nederlandse eerste verdieping is второй этаж).' },
  { category: 'b1-wonen-huren', russian: 'лифт', translation_nl: 'lift' },
  { category: 'b1-wonen-huren', russian: 'ремонт', translation_nl: 'renovatie / reparatie', notes: 'квартира после ремонта = net gerenoveerd.' },
  { category: 'b1-wonen-huren', russian: 'коммунальные услуги', translation_nl: 'nutsvoorzieningen (gas, water, licht)', notes: 'Vaak afgekort tot коммуналка.' },
  { category: 'b1-wonen-huren', russian: 'залог', translation_nl: 'borg / waarborgsom' },
  { category: 'b1-wonen-huren', russian: 'переезжать', translation_nl: 'verhuizen', notes: 'Voltooid: переехать.' },
  { category: 'b1-wonen-huren', russian: 'мебель', translation_nl: 'meubels', notes: 'Altijd enkelvoud, vrouwelijk: квартира с мебелью = gemeubileerd.' },
  { category: 'b1-wonen-huren', russian: 'отопление', translation_nl: 'verwarming' },

  // --- documenten & bureaucratie ---
  { category: 'b1-documenten', russian: 'паспорт', translation_nl: 'paspoort', notes: 'заграничный паспорт (загранпаспорт) = internationaal paspoort.' },
  { category: 'b1-documenten', russian: 'виза', translation_nl: 'visum' },
  { category: 'b1-documenten', russian: 'регистрация', translation_nl: 'registratie (van verblijfsadres)', notes: 'In Rusland verplicht binnen enkele dagen na aankomst; het hotel regelt het meestal.' },
  { category: 'b1-documenten', russian: 'заявление', translation_nl: 'aanvraag / verzoekschrift', notes: 'подать заявление = een aanvraag indienen.' },
  { category: 'b1-documenten', russian: 'справка', translation_nl: 'verklaring / attest', notes: 'справка с работы = werkgeversverklaring.' },
  { category: 'b1-documenten', russian: 'бланк', translation_nl: 'formulier' },
  { category: 'b1-documenten', russian: 'заполнять', translation_nl: 'invullen', notes: 'Voltooid: заполнить. заполните бланк = vul het formulier in.' },
  { category: 'b1-documenten', russian: 'подпись', translation_nl: 'handtekening', notes: 'подписать = ondertekenen.' },
  { category: 'b1-documenten', russian: 'копия', translation_nl: 'kopie' },
  { category: 'b1-documenten', russian: 'срок', translation_nl: 'termijn / geldigheidsduur', notes: 'срок действия визы = geldigheid van het visum.' },
  { category: 'b1-documenten', russian: 'очередь', translation_nl: 'rij / wachtrij', notes: 'Кто последний? = wie is de laatste (in de rij)?' },
  { category: 'b1-documenten', russian: 'окошко', translation_nl: 'loket', notes: 'Letterlijk "raampje".' },
  { category: 'b1-documenten', russian: 'гражданство', translation_nl: 'nationaliteit / staatsburgerschap' },
  { category: 'b1-documenten', russian: 'разрешение', translation_nl: 'vergunning / toestemming', notes: 'разрешение на работу = werkvergunning.' },

  // --- bank & geld ---
  { category: 'b1-bank-geld', russian: 'счёт', translation_nl: 'rekening (bank én restaurant)', notes: 'открыть счёт = een rekening openen; Счёт, пожалуйста! = de rekening graag.' },
  { category: 'b1-bank-geld', russian: 'карта', translation_nl: 'kaart (bank-, sim-, land-)', notes: 'банковская карта = bankpas.' },
  { category: 'b1-bank-geld', russian: 'наличные', translation_nl: 'contant geld', notes: 'наличными = contant (instrumentalis).' },
  { category: 'b1-bank-geld', russian: 'банкомат', translation_nl: 'geldautomaat' },
  { category: 'b1-bank-geld', russian: 'снимать деньги', translation_nl: 'geld opnemen' },
  { category: 'b1-bank-geld', russian: 'переводить', translation_nl: 'overmaken; vertalen', notes: 'Voltooid: перевести. перевод = overschrijving / vertaling.' },
  { category: 'b1-bank-geld', russian: 'обмен валюты', translation_nl: 'geldwisselkantoor' },
  { category: 'b1-bank-geld', russian: 'курс', translation_nl: 'wisselkoers; cursus' },
  { category: 'b1-bank-geld', russian: 'комиссия', translation_nl: 'commissie / transactiekosten' },
  { category: 'b1-bank-geld', russian: 'сдача', translation_nl: 'wisselgeld', notes: 'Без сдачи = zonder wisselgeld (past precies).' },
  { category: 'b1-bank-geld', russian: 'долг', translation_nl: 'schuld' },
  { category: 'b1-bank-geld', russian: 'зарплата', translation_nl: 'salaris' },
  { category: 'b1-bank-geld', russian: 'платить', translation_nl: 'betalen', notes: 'Voltooid: заплатить. платить картой/наличными = pinnen/contant betalen.' },

  // --- telefoon & internet ---
  { category: 'b1-telefoon-internet', russian: 'сим-карта', translation_nl: 'simkaart' },
  { category: 'b1-telefoon-internet', russian: 'связь', translation_nl: 'verbinding / bereik / telecom', notes: 'Нет связи = geen bereik.' },
  { category: 'b1-telefoon-internet', russian: 'зарядка', translation_nl: 'oplader; het opladen', notes: 'зарядить телефон = de telefoon opladen.' },
  { category: 'b1-telefoon-internet', russian: 'пароль', translation_nl: 'wachtwoord', notes: 'Какой пароль от вайфая? = wat is het wifi-wachtwoord?' },
  { category: 'b1-telefoon-internet', russian: 'звонить', translation_nl: 'bellen', notes: 'Voltooid: позвонить. Klemtoon op de uitgang: звони́т.' },
  { category: 'b1-telefoon-internet', russian: 'сообщение', translation_nl: 'bericht' },
  { category: 'b1-telefoon-internet', russian: 'тариф', translation_nl: 'abonnement / tarief' },
  { category: 'b1-telefoon-internet', russian: 'пополнить', translation_nl: 'opwaarderen (beltegoed)', notes: 'пополнить баланс = beltegoed opwaarderen.' },
  { category: 'b1-telefoon-internet', russian: 'экран', translation_nl: 'scherm' },
  { category: 'b1-telefoon-internet', russian: 'скачать', translation_nl: 'downloaden', notes: 'Onvoltooid: скачивать.' },
  { category: 'b1-telefoon-internet', russian: 'приложение', translation_nl: 'app / applicatie' },
  { category: 'b1-telefoon-internet', russian: 'номер', translation_nl: 'nummer; hotelkamer', notes: 'Twee alledaagse betekenissen: номер телефона en номер в гостинице.' },

  // --- werk & sollicitatie ---
  { category: 'b1-werk-sollicitatie', russian: 'вакансия', translation_nl: 'vacature' },
  { category: 'b1-werk-sollicitatie', russian: 'резюме', translation_nl: 'cv', notes: 'Onverbuigbaar, onzijdig.' },
  { category: 'b1-werk-sollicitatie', russian: 'собеседование', translation_nl: 'sollicitatiegesprek' },
  { category: 'b1-werk-sollicitatie', russian: 'опыт', translation_nl: 'ervaring', notes: 'опыт работы = werkervaring.' },
  { category: 'b1-werk-sollicitatie', russian: 'образование', translation_nl: 'opleiding / onderwijs' },
  { category: 'b1-werk-sollicitatie', russian: 'начальник', translation_nl: 'baas / leidinggevende' },
  { category: 'b1-werk-sollicitatie', russian: 'сотрудник', translation_nl: 'medewerker' },
  { category: 'b1-werk-sollicitatie', russian: 'график', translation_nl: 'rooster / werktijden', notes: 'гибкий график = flexibele werktijden.' },
  { category: 'b1-werk-sollicitatie', russian: 'отпуск', translation_nl: 'vakantie (verlof)', notes: 'в отпуске = met vakantie.' },
  { category: 'b1-werk-sollicitatie', russian: 'больничный', translation_nl: 'ziekteverlof / ziektebriefje', notes: 'взять больничный = zich ziek melden.' },
  { category: 'b1-werk-sollicitatie', russian: 'увольняться', translation_nl: 'ontslag nemen', notes: 'уволить = ontslaan; уволиться = zelf weggaan.' },
  { category: 'b1-werk-sollicitatie', russian: 'совещание', translation_nl: 'vergadering' },
  { category: 'b1-werk-sollicitatie', russian: 'удалённо', translation_nl: 'op afstand / remote', notes: 'работать удалённо = thuiswerken.' },

  // --- uit eten & bestellen ---
  { category: 'b1-restaurant', russian: 'заказывать', translation_nl: 'bestellen / reserveren', notes: 'Voltooid: заказать. заказ = bestelling.' },
  { category: 'b1-restaurant', russian: 'официант', translation_nl: 'ober', notes: 'Vrouwelijk: официантка.' },
  { category: 'b1-restaurant', russian: 'меню', translation_nl: 'menukaart', notes: 'Onverbuigbaar.' },
  { category: 'b1-restaurant', russian: 'столик', translation_nl: 'tafeltje (in een restaurant)', notes: 'заказать столик на двоих = een tafel voor twee reserveren.' },
  { category: 'b1-restaurant', russian: 'блюдо', translation_nl: 'gerecht', notes: 'первое/второе блюдо = voorgerecht (soep)/hoofdgerecht.' },
  { category: 'b1-restaurant', russian: 'порция', translation_nl: 'portie' },
  { category: 'b1-restaurant', russian: 'острый', translation_nl: 'scherp / pittig' },
  { category: 'b1-restaurant', russian: 'вегетарианский', translation_nl: 'vegetarisch' },
  { category: 'b1-restaurant', russian: 'чаевые', translation_nl: 'fooi', notes: 'Alleen meervoud. In Rusland is 10% gebruikelijk.' },
  { category: 'b1-restaurant', russian: 'вкусно', translation_nl: 'lekker', notes: 'Очень вкусно! = heel lekker! (bijwoord); вкусный = lekker (bijv. nw.).' },
  { category: 'b1-restaurant', russian: 'приятного аппетита', translation_nl: 'eet smakelijk' },
  { category: 'b1-restaurant', russian: 'с собой', translation_nl: 'om mee te nemen (afhalen)', notes: 'Кофе с собой = koffie to go.' },

  // --- winkelen & markt ---
  { category: 'b1-winkelen', russian: 'размер', translation_nl: 'maat' },
  { category: 'b1-winkelen', russian: 'примерить', translation_nl: 'passen (kleding)', notes: 'Можно примерить? = mag ik dit passen? примерочная = paskamer.' },
  { category: 'b1-winkelen', russian: 'скидка', translation_nl: 'korting' },
  { category: 'b1-winkelen', russian: 'распродажа', translation_nl: 'uitverkoop' },
  { category: 'b1-winkelen', russian: 'касса', translation_nl: 'kassa' },
  { category: 'b1-winkelen', russian: 'чек', translation_nl: 'kassabon' },
  { category: 'b1-winkelen', russian: 'обменять', translation_nl: 'ruilen / omwisselen', notes: 'Onvoltooid: обменивать.' },
  { category: 'b1-winkelen', russian: 'вернуть', translation_nl: 'terugbrengen / teruggeven', notes: 'вернуть товар = een product retourneren.' },
  { category: 'b1-winkelen', russian: 'товар', translation_nl: 'product / artikel / waar' },
  { category: 'b1-winkelen', russian: 'дорого', translation_nl: 'duur (bijwoord)', notes: 'Это слишком дорого = dat is te duur.' },
  { category: 'b1-winkelen', russian: 'дёшево', translation_nl: 'goedkoop (bijwoord)', notes: 'дешевле = goedkoper.' },
  { category: 'b1-winkelen', russian: 'рынок', translation_nl: 'markt' },
  { category: 'b1-winkelen', russian: 'торговаться', translation_nl: 'afdingen / onderhandelen over de prijs' },

  // --- onderweg ---
  { category: 'b1-onderweg', russian: 'остановка', translation_nl: 'halte', notes: 'следующая остановка = volgende halte.' },
  { category: 'b1-onderweg', russian: 'пересадка', translation_nl: 'overstap', notes: 'сделать пересадку = overstappen.' },
  { category: 'b1-onderweg', russian: 'проездной', translation_nl: 'ov-abonnement / meerrittenkaart' },
  { category: 'b1-onderweg', russian: 'расписание', translation_nl: 'dienstregeling' },
  { category: 'b1-onderweg', russian: 'платформа', translation_nl: 'perron' },
  { category: 'b1-onderweg', russian: 'прямо', translation_nl: 'rechtdoor', notes: 'Идите прямо = ga rechtdoor.' },
  { category: 'b1-onderweg', russian: 'налево', translation_nl: 'naar links', notes: 'Поверните налево = sla linksaf.' },
  { category: 'b1-onderweg', russian: 'направо', translation_nl: 'naar rechts' },
  { category: 'b1-onderweg', russian: 'перекрёсток', translation_nl: 'kruispunt' },
  { category: 'b1-onderweg', russian: 'светофор', translation_nl: 'stoplicht' },
  { category: 'b1-onderweg', russian: 'заблудиться', translation_nl: 'verdwalen', notes: 'Я заблудился/заблудилась = ik ben verdwaald.' },
  { category: 'b1-onderweg', russian: 'далеко', translation_nl: 'ver', notes: 'Это далеко отсюда? = is het ver hiervandaan?' },
  { category: 'b1-onderweg', russian: 'пробка', translation_nl: 'file; kurk' },
  { category: 'b1-onderweg', russian: 'штраф', translation_nl: 'boete' },

  // --- meningen & discussie ---
  { category: 'b1-mening', russian: 'по-моему', translation_nl: 'volgens mij' },
  { category: 'b1-mening', russian: 'мне кажется', translation_nl: 'het lijkt mij / ik denk', notes: 'Letterlijk "het schijnt mij": мне кажется, что...' },
  { category: 'b1-mening', russian: 'согласен', translation_nl: 'akkoord / mee eens (m)', notes: 'Korte vorm: согласна (v), согласны (mv). Я с вами согласен.' },
  { category: 'b1-mening', russian: 'наоборот', translation_nl: 'integendeel / andersom' },
  { category: 'b1-mening', russian: 'конечно', translation_nl: 'natuurlijk', notes: "Uitspraak: конешно (ч klinkt hier als ш)." },
  { category: 'b1-mening', russian: 'возможно', translation_nl: 'mogelijk / misschien' },
  { category: 'b1-mening', russian: 'вряд ли', translation_nl: 'nauwelijks / waarschijnlijk niet' },
  { category: 'b1-mening', russian: 'зато', translation_nl: 'daarentegen / maar wel', notes: 'Дорого, зато удобно = duur, maar wel handig.' },
  { category: 'b1-mening', russian: 'например', translation_nl: 'bijvoorbeeld' },
  { category: 'b1-mening', russian: 'кстати', translation_nl: 'trouwens / overigens' },
  { category: 'b1-mening', russian: 'спорить', translation_nl: 'discussiëren / ruziën', notes: 'Voltooid: поспорить (ook: wedden).' },
  { category: 'b1-mening', russian: 'убеждать', translation_nl: 'overtuigen', notes: 'Voltooid: убедить.' },
  { category: 'b1-mening', russian: 'сомневаться', translation_nl: 'twijfelen', notes: 'сомневаться в + prepositief.' },

  // --- karakter & relaties ---
  { category: 'b1-karakter', russian: 'добрый', translation_nl: 'goedhartig / vriendelijk' },
  { category: 'b1-karakter', russian: 'вежливый', translation_nl: 'beleefd' },
  { category: 'b1-karakter', russian: 'честный', translation_nl: 'eerlijk' },
  { category: 'b1-karakter', russian: 'ленивый', translation_nl: 'lui' },
  { category: 'b1-karakter', russian: 'упрямый', translation_nl: 'koppig' },
  { category: 'b1-karakter', russian: 'застенчивый', translation_nl: 'verlegen' },
  { category: 'b1-karakter', russian: 'общительный', translation_nl: 'sociaal / spraakzaam' },
  { category: 'b1-karakter', russian: 'надёжный', translation_nl: 'betrouwbaar' },
  { category: 'b1-karakter', russian: 'дружба', translation_nl: 'vriendschap' },
  { category: 'b1-karakter', russian: 'отношения', translation_nl: 'relatie / verhouding', notes: 'Meervoud in het Russisch: у нас хорошие отношения.' },
  { category: 'b1-karakter', russian: 'ссориться', translation_nl: 'ruzie maken', notes: 'Voltooid: поссориться. ссора = ruzie.' },
  { category: 'b1-karakter', russian: 'мириться', translation_nl: 'het weer goedmaken', notes: 'Voltooid: помириться.' },
  { category: 'b1-karakter', russian: 'доверять', translation_nl: 'vertrouwen', notes: 'доверять + datief: Я ему доверяю.' },

  // --- werkwoorden van beweging ---
  { category: 'b1-grammatica-beweging', russian: 'идти', translation_nl: 'gaan / lopen (één richting, nu)', grammarRule: 'VERBS-OF-MOTION' },
  { category: 'b1-grammatica-beweging', russian: 'ходить', translation_nl: 'gaan / lopen (herhaald, heen en terug)', grammarRule: 'VERBS-OF-MOTION' },
  { category: 'b1-grammatica-beweging', russian: 'ехать', translation_nl: 'rijden / gaan met vervoer (één richting)', grammarRule: 'VERBS-OF-MOTION' },
  { category: 'b1-grammatica-beweging', russian: 'ездить', translation_nl: 'rijden / reizen (herhaald)', grammarRule: 'VERBS-OF-MOTION' },
  { category: 'b1-grammatica-beweging', russian: 'лететь', translation_nl: 'vliegen (één richting)', grammarRule: 'VERBS-OF-MOTION' },
  { category: 'b1-grammatica-beweging', russian: 'бежать', translation_nl: 'rennen (één richting)', grammarRule: 'VERBS-OF-MOTION' },
  { category: 'b1-grammatica-beweging', russian: 'прийти', translation_nl: 'aankomen (te voet, voltooid)', grammarRule: 'VERBS-OF-MOTION-PREFIXES', notes: 'Onvoltooid: приходить. Verleden tijd: пришёл, пришла, пришли.' },
  { category: 'b1-grammatica-beweging', russian: 'уйти', translation_nl: 'weggaan (voltooid)', grammarRule: 'VERBS-OF-MOTION-PREFIXES', notes: 'Onvoltooid: уходить.' },
  { category: 'b1-grammatica-beweging', russian: 'выйти', translation_nl: 'naar buiten gaan / uitstappen (voltooid)', grammarRule: 'VERBS-OF-MOTION-PREFIXES', notes: 'Onvoltooid: выходить.' },
  { category: 'b1-grammatica-beweging', russian: 'приехать', translation_nl: 'aankomen (met vervoer, voltooid)', grammarRule: 'VERBS-OF-MOTION-PREFIXES', notes: 'Onvoltooid: приезжать.' },

  // --- aspect ---
  { category: 'b1-grammatica-aspect', russian: 'читать', translation_nl: 'lezen (onvoltooid)', grammarRule: 'ASPECT-PAIRS', notes: 'Partner: прочитать.' },
  { category: 'b1-grammatica-aspect', russian: 'прочитать', translation_nl: 'uitlezen / lezen (voltooid)', grammarRule: 'ASPECT-PAIRS' },
  { category: 'b1-grammatica-aspect', russian: 'решать', translation_nl: 'beslissen / oplossen (onvoltooid)', grammarRule: 'ASPECT-PAIRS', notes: 'Partner: решить.' },
  { category: 'b1-grammatica-aspect', russian: 'решить', translation_nl: 'beslissen / oplossen (voltooid)', grammarRule: 'ASPECT-PAIRS' },
  { category: 'b1-grammatica-aspect', russian: 'покупать', translation_nl: 'kopen (onvoltooid)', grammarRule: 'ASPECT-PAIRS', notes: 'Partner: купить (let op: geen voorvoegsel).' },
  { category: 'b1-grammatica-aspect', russian: 'купить', translation_nl: 'kopen (voltooid)', grammarRule: 'ASPECT-PAIRS' },
  { category: 'b1-grammatica-aspect', russian: 'брать', translation_nl: 'nemen (onvoltooid)', grammarRule: 'ASPECT-PAIRS', notes: 'Partner: взять (ander woord).' },
  { category: 'b1-grammatica-aspect', russian: 'взять', translation_nl: 'nemen (voltooid)', grammarRule: 'ASPECT-PAIRS' },

  // --- gebiedende wijs (frequent imperatives as fixed phrases) ---
  { category: 'b1-grammatica-gebiedende-wijs', russian: 'подождите', translation_nl: 'wacht (u) even', grammarRule: 'IMPERATIVE' },
  { category: 'b1-grammatica-gebiedende-wijs', russian: 'покажите', translation_nl: 'laat (u) zien', grammarRule: 'IMPERATIVE' },
  { category: 'b1-grammatica-gebiedende-wijs', russian: 'повторите', translation_nl: 'herhaal (u)', grammarRule: 'IMPERATIVE' },
  { category: 'b1-grammatica-gebiedende-wijs', russian: 'садитесь', translation_nl: 'gaat u zitten', grammarRule: 'IMPERATIVE' },
  { category: 'b1-grammatica-gebiedende-wijs', russian: 'не беспокойтесь', translation_nl: 'maakt u zich geen zorgen', grammarRule: 'IMPERATIVE' },
  { category: 'b1-grammatica-gebiedende-wijs', russian: 'давай', translation_nl: 'kom op / laten we', grammarRule: 'IMPERATIVE', notes: 'Давай пойдём! = laten we gaan. Beleefd: давайте.' },

  // --- voorwaardelijk ---
  { category: 'b1-grammatica-voorwaardelijk', russian: 'если бы', translation_nl: 'als (irreëel)', grammarRule: 'CONDITIONAL-BY' },
  { category: 'b1-grammatica-voorwaardelijk', russian: 'хотел бы', translation_nl: 'zou willen (m)', grammarRule: 'CONDITIONAL-BY', notes: 'Vrouwelijk: хотела бы.' },
  { category: 'b1-grammatica-voorwaardelijk', russian: 'не могли бы вы', translation_nl: 'zou u kunnen ...', grammarRule: 'CONDITIONAL-BY' },
  { category: 'b1-grammatica-voorwaardelijk', russian: 'хорошо бы', translation_nl: 'het zou goed zijn om', grammarRule: 'CONDITIONAL-BY' },

  // --- telwoorden, datum & tijd ---
  { category: 'b1-grammatica-telwoorden', russian: 'полчаса', translation_nl: 'een half uur', grammarRule: 'DATES-TIME' },
  { category: 'b1-grammatica-telwoorden', russian: 'четверть', translation_nl: 'kwart(ier)', grammarRule: 'DATES-TIME', notes: 'без четверти шесть = kwart voor zes.' },
  { category: 'b1-grammatica-telwoorden', russian: 'половина', translation_nl: 'helft / half', grammarRule: 'DATES-TIME', notes: 'половина пятого = half vijf.' },
  { category: 'b1-grammatica-telwoorden', russian: 'сутки', translation_nl: 'etmaal (24 uur)', grammarRule: 'NUMERALS-CASES', notes: 'Alleen meervoud: двое суток = twee etmalen.' },
  { category: 'b1-grammatica-telwoorden', russian: 'неделя', translation_nl: 'week', grammarRule: 'NUMERALS-CASES', notes: 'две недели, пять недель.' },
  { category: 'b1-grammatica-telwoorden', russian: 'год', translation_nl: 'jaar', grammarRule: 'NUMERALS-CASES', notes: 'один год, два года, пять лет.' },
  { category: 'b1-grammatica-telwoorden', russian: 'рубль', translation_nl: 'roebel', grammarRule: 'NUMERALS-CASES', notes: 'один рубль, два рубля, пять рублей.' },
  { category: 'b1-grammatica-telwoorden', russian: 'первое', translation_nl: 'de eerste (datum)', grammarRule: 'DATES-TIME', notes: 'Сегодня первое мая. Rangtelwoord in het onzijdig.' }
];

const grammarExercises = [
  // VERBS-OF-MOTION
  {
    category: 'b1-grammatica-beweging', grammarRule: 'VERBS-OF-MOTION', type: 'mc',
    prompt: "Vul aan: Каждое утро я ___ на работу пешком. (elke ochtend loop ik naar mijn werk)",
    correctAnswer: 'хожу', options: ['иду', 'хожу', 'еду'],
    explanation: "'Каждое утро' (elke ochtend) duidt op een herhaalde beweging, dus het onbepaalde werkwoord ходить: я хожу. 'иду' zou betekenen dat je nú onderweg bent; 'еду' is met een voertuig."
  },
  {
    category: 'b1-grammatica-beweging', grammarRule: 'VERBS-OF-MOTION', type: 'mc',
    prompt: "Vul aan: Смотри, вон ___ автобус! (kijk, daar komt de bus aan)",
    correctAnswer: 'идёт', options: ['ходит', 'идёт', 'ездит'],
    explanation: "Eén concrete beweging die je nu ziet gebeuren: het bepaalde werkwoord. Voor openbaar vervoer zeggen Russen идти (автобус идёт, поезд идёт), niet ехать."
  },
  {
    category: 'b1-grammatica-beweging', grammarRule: 'VERBS-OF-MOTION', type: 'mc',
    prompt: "Vul aan: Летом мы ___ в Петербург на поезде. (deze zomer gaan we met de trein naar Petersburg)",
    correctAnswer: 'едем', options: ['идём', 'ходим', 'едем'],
    explanation: "Met de trein → ехать. Eén geplande reis in één richting → het bepaalde werkwoord: мы едем. De tegenwoordige tijd wordt hier voor een vaststaand plan gebruikt, net als in het Nederlands."
  },
  {
    category: 'b1-grammatica-beweging', grammarRule: 'VERBS-OF-MOTION-PREFIXES', type: 'mc',
    prompt: "Vul aan: Извините, вы ___ на следующей остановке? (stapt u bij de volgende halte uit?)",
    correctAnswer: 'выходите', options: ['уходите', 'выходите', 'приходите'],
    explanation: "вы- = naar buiten: выходить = uitstappen/naar buiten gaan. Dit is dé standaardvraag in een volle bus of metro. 'уходите' = weggaan, 'приходите' = aankomen."
  },
  {
    category: 'b1-grammatica-beweging', grammarRule: 'VERBS-OF-MOTION-PREFIXES', type: 'mc',
    prompt: "Vul aan: Она ___ домой в семь и сразу легла спать. (zij kwam om zeven thuis en ging meteen naar bed)",
    correctAnswer: 'пришла', options: ['приходила', 'пришла', 'ушла'],
    explanation: "Eén afgeronde gebeurtenis in een verhaal → het voltooide прийти: она пришла. 'приходила' (onvoltooid) zou een herhaling of een heen-en-terug betekenen; 'ушла' = ging weg."
  },

  // ASPECT-PAIRS
  {
    category: 'b1-grammatica-aspect', grammarRule: 'ASPECT-PAIRS', type: 'mc',
    prompt: "Vul aan: Я уже ___ эту книгу, могу дать тебе. (ik heb dit boek al uit, ik kan het je geven)",
    correctAnswer: 'прочитал', options: ['читал', 'прочитал', 'читаю'],
    explanation: "'уже' (al) plus een resultaat (het boek is uit, dus je kunt het uitlenen) → voltooid aspect: прочитал. 'читал' zegt alleen dat je erin bezig was, zonder resultaat."
  },
  {
    category: 'b1-grammatica-aspect', grammarRule: 'ASPECT-PAIRS', type: 'mc',
    prompt: "Vul aan: Каждый день она ___ газету. (elke dag koopt zij een krant)",
    correctAnswer: 'покупает', options: ['купит', 'купила', 'покупает'],
    explanation: "'Каждый день' = herhaling → onvoltooid aspect in de tegenwoordige tijd: покупает. 'купит' is toekomst (zij zal kopen, eenmalig), 'купила' is voltooid verleden."
  },
  {
    category: 'b1-grammatica-aspect', grammarRule: 'ASPECT-PAIRS', type: 'mc',
    prompt: "Vul aan: Завтра я обязательно ___ тебе. (morgen bel ik je zeker)",
    correctAnswer: 'позвоню', options: ['звоню', 'позвоню', 'звонил'],
    explanation: "Eén toekomstige, afgeronde handeling → de vervoegde vorm van het voltooide werkwoord: позвоню (dat is de toekomende tijd). 'звоню' is nu, 'звонил' is verleden."
  },
  {
    category: 'b1-grammatica-aspect', grammarRule: 'ASPECT-PAIRS', type: 'mc',
    prompt: "Welke zin zegt dat de taak daadwerkelijk is opgelost?",
    correctAnswer: 'Он решил задачу.', options: ['Он решал задачу.', 'Он решил задачу.', 'Он решает задачу.'],
    explanation: "решить is de voltooide partner van решать: 'Он решил задачу' = hij heeft de opgave opgelost (resultaat). 'решал' = hij was ermee bezig, 'решает' = hij is er nu mee bezig."
  },
  {
    category: 'b1-grammatica-aspect', grammarRule: 'ASPECT-PAIRS', type: 'mc',
    prompt: "Vul aan: Не надо ___ такси, я вас подвезу. (je hoeft geen taxi te nemen, ik breng je wel)",
    correctAnswer: 'брать', options: ['брать', 'взять', 'взял'],
    explanation: "Na een ontkenning ('не надо', niet nodig) staat de infinitief vrijwel altijd in het onvoltooide aspect: брать. Het voltooide взять zou hier onnatuurlijk klinken."
  },

  // IMPERATIVE
  {
    category: 'b1-grammatica-gebiedende-wijs', grammarRule: 'IMPERATIVE', type: 'mc',
    prompt: "Gebiedende wijs (beleefd) van говорить: '___ , пожалуйста, медленнее.'",
    correctAnswer: 'Говорите', options: ['Говори', 'Говорите', 'Говорят'],
    explanation: "Stam говор- (они говорят), klemtoon in de я-vorm op de uitgang (говорю́) → -и: говори; beleefd/meervoud + -те: говорите. 'говорят' is de 3e persoon meervoud, geen gebiedende wijs."
  },
  {
    category: 'b1-grammatica-gebiedende-wijs', grammarRule: 'IMPERATIVE', type: 'mc',
    prompt: "Gebiedende wijs (informeel) van читать:",
    correctAnswer: 'читай', options: ['читай', 'чити', 'чить'],
    explanation: "De stam eindigt op een klinker (чита-ют → чита-), dus de uitgang is -й: читай. Beleefd: читайте."
  },
  {
    category: 'b1-grammatica-gebiedende-wijs', grammarRule: 'IMPERATIVE', type: 'mc',
    prompt: "Welke zin is een beleefd, eenmalig verzoek?",
    correctAnswer: 'Откройте окно, пожалуйста.', options: ['Открывайте окно, пожалуйста.', 'Откройте окно, пожалуйста.', 'Не открывайте окно.'],
    explanation: "Een eenmalig positief verzoek staat in het voltooide aspect: Откройте (van открыть). De onvoltooide vorm Открывайте klinkt als een aansporing of gewoonte; 'Не открывайте' is een verbod (ontkenning → onvoltooid)."
  },
  {
    category: 'b1-grammatica-gebiedende-wijs', grammarRule: 'IMPERATIVE', type: 'mc',
    prompt: "Hoe zeg je 'Laten we naar de bioscoop gaan!'?",
    correctAnswer: 'Давай пойдём в кино!', options: ['Давай пойдём в кино!', 'Давай идти в кино!', 'Пойди в кино!'],
    explanation: "Een voorstel ('laten we...') maak je met давай(те) + de wij-vorm van het voltooide werkwoord: Давай пойдём. 'Пойди' is een bevel aan één persoon (ga jij maar)."
  },

  // CONDITIONAL-BY
  {
    category: 'b1-grammatica-voorwaardelijk', grammarRule: 'CONDITIONAL-BY', type: 'mc',
    prompt: "Vul aan: Если бы у меня было время, я ___ в музей. (als ik tijd had, zou ik naar het museum gaan)",
    correctAnswer: 'бы пошёл', options: ['пойду', 'бы пошёл', 'пошёл'],
    explanation: "In de hoofdzin van een irreële als-dan-zin staat бы + verleden tijd: я бы пошёл. 'пойду' (ik zal gaan) is een echte toekomst, 'пошёл' zonder бы is gewoon verleden tijd."
  },
  {
    category: 'b1-grammatica-voorwaardelijk', grammarRule: 'CONDITIONAL-BY', type: 'mc',
    prompt: "Hoe vraag je beleefd 'Zou u de deur kunnen sluiten?'",
    correctAnswer: 'Не могли бы вы закрыть дверь?', options: ['Не могли бы вы закрыть дверь?', 'Вы можете закрыть дверь!', 'Закрыть дверь бы?'],
    explanation: "'Не могли бы вы + infinitief' is de standaard beleefde verzoekvorm, vergelijkbaar met 'zou u kunnen...'. бы staat direct na могли."
  },
  {
    category: 'b1-grammatica-voorwaardelijk', grammarRule: 'CONDITIONAL-BY', type: 'mc',
    prompt: "Een vrouw zegt: 'Ik zou graag thee willen.' Kies de juiste vorm.",
    correctAnswer: 'Я хотела бы чаю.', options: ['Я хотел бы чаю.', 'Я хотела бы чаю.', 'Я хочу бы чаю.'],
    explanation: "бы combineert met de verleden tijd, en die richt zich naar het geslacht van de spreker: een vrouw zegt хотела бы. 'хочу бы' bestaat niet (бы gaat nooit met de tegenwoordige tijd)."
  },

  // NUMERALS-CASES
  {
    category: 'b1-grammatica-telwoorden', grammarRule: 'NUMERALS-CASES', type: 'mc',
    prompt: "Vul aan: Это стоит двадцать три ___ . (dat kost 23 roebel)",
    correctAnswer: 'рубля', options: ['рубль', 'рубля', 'рублей'],
    explanation: "Bij samengestelde getallen telt het laatste woord: три → genitief enkelvoud: рубля. (21 → рубль, 25 → рублей.)"
  },
  {
    category: 'b1-grammatica-telwoorden', grammarRule: 'NUMERALS-CASES', type: 'mc',
    prompt: "Vul aan: Моей дочери пять ___ . (mijn dochter is vijf)",
    correctAnswer: 'лет', options: ['год', 'года', 'лет'],
    explanation: "Na пять en hoger komt de genitief meervoud, en die is bij год onregelmatig: лет. (один год, два/три/четыре года, пять лет.)"
  },
  {
    category: 'b1-grammatica-telwoorden', grammarRule: 'NUMERALS-CASES', type: 'mc',
    prompt: "Vul aan: Мы ждали ___ часа. (we wachtten twee uur)",
    correctAnswer: 'два', options: ['два', 'две', 'двух'],
    explanation: "час is mannelijk, dus два (twee), niet две (dat is voor vrouwelijke woorden: две минуты). Na два volgt de genitief enkelvoud: часа."
  },
  {
    category: 'b1-grammatica-telwoorden', grammarRule: 'DATES-TIME', type: 'mc',
    prompt: "Hoe zeg je 'kwart voor zes'?",
    correctAnswer: 'без четверти шесть', options: ['четверть шестого', 'без четверти шесть', 'шесть без четверти'],
    explanation: "Na het halve uur tel je terug met без + genitief: без четверти шесть (letterlijk 'zonder een kwart zes'). 'четверть шестого' is kwart over vijf."
  },
  {
    category: 'b1-grammatica-telwoorden', grammarRule: 'DATES-TIME', type: 'mc',
    prompt: "Hoe zeg je 'op 8 maart'?",
    correctAnswer: 'восьмого марта', options: ['восьмое марта', 'восьмого марта', 'восемь марта'],
    explanation: "'Op' een datum druk je uit met de genitief van het rangtelwoord: восьмого марта. 'восьмое марта' is de datum als naam (het is 8 maart), 'восемь марта' is fout (hoofdtelwoord)."
  },
  {
    category: 'b1-grammatica-telwoorden', grammarRule: 'DATES-TIME', type: 'mc',
    prompt: "Hoe zeg je 'om half vijf'?",
    correctAnswer: 'в половине пятого', options: ['в половина пятого', 'в половине пятого', 'в половину пять'],
    explanation: "'Om' een tijdstip met половина staat in de prepositief: в половине пятого. Het uur dat volgt (het vijfde uur) staat in de genitief: пятого."
  },

  // VERB-PAST-GENDER (hand-crafted, complements generated drills)
  {
    category: 'b1-grammatica-vervoeging', grammarRule: 'VERB-PAST-GENDER', type: 'mc',
    prompt: "Vul aan: Вчера она ___ в магазин. (gisteren ging zij naar de winkel — идти)",
    correctAnswer: 'шла', options: ['шёл', 'шла', 'шли'],
    explanation: "идти heeft een onregelmatige verleden tijd: шёл (hij), шла (zij), шло (het), шли (zij mv). Bij она hoort шла."
  },
  {
    category: 'b1-grammatica-vervoeging', grammarRule: 'VERB-CONJUGATION', type: 'mc',
    prompt: "Vul aan: Я ___ картой. (ik betaal met de kaart — платить)",
    correctAnswer: 'плачу', options: ['платю', 'плачу', 'платишь'],
    explanation: "платить is een groep-2-werkwoord met medeklinkerwisseling in de я-vorm: т → ч: плачу (плачу́, met klemtoon op de uitgang). De andere vormen zijn regelmatig: платишь, платит, платим, платите, платят."
  },
  {
    category: 'b1-grammatica-vervoeging', grammarRule: 'VERB-CONJUGATION', type: 'mc',
    prompt: "Vul aan: Мы ___ пойти в кино. (wij willen naar de bioscoop — хотеть)",
    correctAnswer: 'хотим', options: ['хочем', 'хотим', 'хотите'],
    explanation: "хотеть is onregelmatig: хочу, хочешь, хочет (groep 1 in het enkelvoud) maar хотим, хотите, хотят (groep 2 in het meervoud)."
  },
  {
    category: 'b1-grammatica-naamvallen', grammarRule: 'NOUN-DECLENSION', type: 'mc',
    prompt: "Vul aan: Я живу в новой ___ . (ik woon in een nieuw appartement — квартира)",
    correctAnswer: 'квартире', options: ['квартира', 'квартиру', 'квартире'],
    explanation: "в + plaats waar iets is → prepositief: квартира → квартире (uitgang -е). Het bijvoeglijk naamwoord volgt: новой."
  },
  {
    category: 'b1-grammatica-naamvallen', grammarRule: 'NOUN-DECLENSION', type: 'mc',
    prompt: "Vul aan: У меня нет ___ . (ik heb geen tijd — время)",
    correctAnswer: 'времени', options: ['время', 'времени', 'временем'],
    explanation: "нет + genitief. время hoort bij de onregelmatige onzijdige woorden op -мя: genitief времени (net als имя → имени)."
  }
];

const practicalSentences = [
  { category: 'b1-praktische-zinnen', prompt: 'Ik wil graag een afspraak maken bij de dokter.', tokens: ['Я', 'хотел', 'бы', 'записаться', 'на', 'приём', 'к', 'врачу.'], explanation: "'записаться на приём' = een afspraak maken; 'к врачу' (datief na к) = bij de dokter. Een vrouw zegt 'хотела бы'." },
  { category: 'b1-praktische-zinnen', prompt: 'Ik heb sinds gisteren keelpijn en koorts.', tokens: ['У', 'меня', 'со', 'вчерашнего', 'дня', 'болит', 'горло', 'и', 'температура.'], explanation: "'У меня болит горло' = mijn keel doet pijn (letterlijk: bij mij doet de keel pijn). 'со вчерашнего дня' = sinds gisteren (с + genitief)." },
  { category: 'b1-praktische-zinnen', prompt: 'Heeft u iets tegen hoofdpijn?', tokens: ['У', 'вас', 'есть', 'что-нибудь', 'от', 'головной', 'боли?'], explanation: "'что-нибудь' = iets (onbepaald); een medicijn 'tegen' iets is 'от' + genitief: от головной боли." },
  { category: 'b1-praktische-zinnen', prompt: 'Hoe vaak per dag moet ik dit innemen?', tokens: ['Сколько', 'раз', 'в', 'день', 'это', 'нужно', 'принимать?'], explanation: "'сколько раз в день' = hoe vaak per dag; 'нужно' + infinitief = moeten. 'принимать' is het werkwoord voor medicijnen innemen." },
  { category: 'b1-praktische-zinnen', prompt: 'Ik zou graag een rekening willen openen.', tokens: ['Я', 'хотел', 'бы', 'открыть', 'счёт.'], explanation: "'открыть счёт' = een rekening openen. Vaste uitdrukking aan de bankbalie." },
  { category: 'b1-praktische-zinnen', prompt: 'Kan ik met de kaart betalen?', tokens: ['Можно', 'оплатить', 'картой?'], explanation: "'Можно + infinitief' = mag/kan ik...; 'картой' staat in de instrumentalis (met de kaart)." },
  { category: 'b1-praktische-zinnen', prompt: 'Wat is de wisselkoers van de euro vandaag?', tokens: ['Какой', 'сегодня', 'курс', 'евро?'], explanation: "'курс' = koers; евро is onverbuigbaar. 'Какой' vraagt naar 'welke/wat voor'." },
  { category: 'b1-praktische-zinnen', prompt: 'Ik wil een appartement huren voor een jaar.', tokens: ['Я', 'хочу', 'снять', 'квартиру', 'на', 'год.'], explanation: "'снять квартиру' = een appartement huren; 'на год' = voor (de duur van) een jaar (на + accusatief voor een periode)." },
  { category: 'b1-praktische-zinnen', prompt: 'Is de verwarming bij de huur inbegrepen?', tokens: ['Отопление', 'входит', 'в', 'стоимость', 'аренды?'], explanation: "'входить в стоимость' = inbegrepen zijn in de prijs (letterlijk 'ingaan in de kosten'); 'аренды' is de genitief van аренда." },
  { category: 'b1-praktische-zinnen', prompt: 'Welke documenten heb ik nodig voor de registratie?', tokens: ['Какие', 'документы', 'нужны', 'для', 'регистрации?'], explanation: "'нужны' (korte vorm, meervoud) = nodig; 'для' + genitief = voor (het doel)." },
  { category: 'b1-praktische-zinnen', prompt: 'Wie is de laatste in de rij?', tokens: ['Кто', 'последний?'], explanation: "Dé vraag bij elk Russisch loket. Je meldt je aan bij de laatste persoon in plaats van fysiek in een rij te staan." },
  { category: 'b1-praktische-zinnen', prompt: 'Een tafel voor twee, alstublieft.', tokens: ['Столик', 'на', 'двоих,', 'пожалуйста.'], explanation: "'столик' (verkleinwoord van стол) is het gebruikelijke woord in een restaurant; 'на двоих' = voor twee personen (verzameltelwoord)." },
  { category: 'b1-praktische-zinnen', prompt: 'Ik ben allergisch voor noten.', tokens: ['У', 'меня', 'аллергия', 'на', 'орехи.'], explanation: "'аллергия на' + accusatief. Belangrijk om te kunnen zeggen in een restaurant." },
  { category: 'b1-praktische-zinnen', prompt: 'Mag ik de rekening, alstublieft?', tokens: ['Можно', 'счёт,', 'пожалуйста?'], explanation: "Kort en beleefd. 'счёт' is zowel de bankrekening als de rekening in een restaurant." },
  { category: 'b1-praktische-zinnen', prompt: 'Heeft u dit in een grotere maat?', tokens: ['У', 'вас', 'есть', 'это', 'размером', 'побольше?'], explanation: "'размером побольше' = in een iets grotere maat (по- + vergrotende trap = 'een beetje groter')." },
  { category: 'b1-praktische-zinnen', prompt: 'Stapt u bij de volgende halte uit?', tokens: ['Вы', 'выходите', 'на', 'следующей?'], explanation: "In een volle metro of bus vraag je dit om erlangs te kunnen. 'на следующей (остановке)' = bij de volgende (halte), prepositief." },
  { category: 'b1-praktische-zinnen', prompt: 'Ik ben verdwaald. Kunt u me helpen?', tokens: ['Я', 'заблудился.', 'Вы', 'не', 'могли', 'бы', 'мне', 'помочь?'], explanation: "'заблудился' (m) / 'заблудилась' (v) = verdwaald; 'Вы не могли бы' = zou u kunnen (beleefd, met бы)." },
  { category: 'b1-praktische-zinnen', prompt: 'Ik ben het niet met u eens.', tokens: ['Я', 'с', 'вами', 'не', 'согласен.'], explanation: "'согласен' (m) / 'согласна' (v) is een korte vorm; 'с вами' = met u (instrumentalis). De ontkenning не staat direct voor согласен." }
];

const readings = [
  {
    category: 'b1-lezen',
    title: 'Объявление: сдаётся квартира',
    passage:
      'Сдаётся двухкомнатная квартира в центре города, рядом с метро «Пушкинская». Пятый этаж, есть лифт. Квартира после ремонта, с мебелью и техникой: холодильник, стиральная машина, интернет. Аренда — 45 000 рублей в месяц плюс коммунальные услуги. Залог — один месяц. Без животных. Звонить после 18:00. Хозяйка Ирина.',
    questions: [
      { prompt: 'Wat is bij de huurprijs NIET inbegrepen?', correctAnswer: 'de nutsvoorzieningen (gas, water, licht)', options: ['de nutsvoorzieningen (gas, water, licht)', 'de meubels', 'het internet'], explanation: "'плюс коммунальные услуги' = plus nutsvoorzieningen: die komen bovenop de 45.000 roebel. Meubels (с мебелью) en internet (интернет) zitten er wel bij." },
      { prompt: 'Hoeveel borg vraagt de verhuurder?', correctAnswer: 'één maand huur', options: ['één maand huur', 'twee maanden huur', 'geen borg'], explanation: "'Залог — один месяц' = de borg is één maand(huur)." },
      { prompt: 'Op welke verdieping ligt het appartement volgens de Nederlandse telling?', correctAnswer: 'de vierde verdieping', options: ['de vijfde verdieping', 'de vierde verdieping', 'de begane grond'], explanation: "Russisch telt de begane grond als первый этаж, dus пятый этаж is de Nederlandse vierde verdieping." }
    ]
  },
  {
    category: 'b1-lezen',
    title: 'Сообщение от коллеги',
    passage:
      'Привет, Даниэль! Завтра совещание переносится с десяти на половину двенадцатого, потому что начальник будет в банке. Пожалуйста, подготовь отчёт за прошлую неделю и отправь его мне до девяти. Если не успеешь — позвони, я помогу. Кстати, в пятницу я беру больничный, так что встречу с клиентом проведёшь ты. Спасибо!',
    questions: [
      { prompt: 'Hoe laat begint de vergadering morgen?', correctAnswer: 'om half twaalf', options: ['om tien uur', 'om half twaalf', 'om twaalf uur'], explanation: "'переносится с десяти на половину двенадцатого' = wordt verplaatst van tien naar half twaalf (половина двенадцатого = half twaalf)." },
      { prompt: 'Wat moet Daniël vóór negen uur doen?', correctAnswer: 'het weekrapport opsturen', options: ['het weekrapport opsturen', 'de klant bellen', 'naar de bank gaan'], explanation: "'подготовь отчёт ... и отправь его мне до девяти' = bereid het rapport voor en stuur het me vóór negen." },
      { prompt: 'Waarom neemt Daniël vrijdag de klantafspraak over?', correctAnswer: 'de collega meldt zich ziek', options: ['de collega meldt zich ziek', 'de collega heeft vakantie', 'de baas is bij de klant'], explanation: "'я беру больничный' = ik neem ziekteverlof / meld me ziek." }
    ]
  },
  {
    category: 'b1-lezen',
    title: 'Инструкция к лекарству',
    passage:
      'Принимать по одной таблетке два раза в день после еды, запивая водой. Курс лечения — пять дней. Не принимать больше четырёх таблеток в сутки. Возможные побочные эффекты: тошнота, головная боль. При появлении аллергии прекратить приём и обратиться к врачу. Хранить в сухом прохладном месте, недоступном для детей.',
    questions: [
      { prompt: 'Hoeveel tabletten mag je maximaal per etmaal innemen?', correctAnswer: 'vier', options: ['twee', 'vier', 'vijf'], explanation: "'Не принимать больше четырёх таблеток в сутки' = niet meer dan vier tabletten per etmaal innemen. 'два раза в день' is de normale dosering, 'пять дней' de kuurduur." },
      { prompt: 'Wanneer moet je de tabletten innemen?', correctAnswer: 'na het eten, met water', options: ['voor het eten, zonder water', 'na het eten, met water', "'s nachts"], explanation: "'после еды, запивая водой' = na het eten, wegspoelend met water." },
      { prompt: 'Wat moet je doen bij een allergische reactie?', correctAnswer: 'stoppen en naar de dokter gaan', options: ['de dosis verlagen', 'stoppen en naar de dokter gaan', 'meer water drinken'], explanation: "'прекратить приём и обратиться к врачу' = de inname stoppen en zich tot een arts wenden." }
    ]
  },
  {
    category: 'b1-lezen',
    title: 'В метро',
    passage:
      'Уважаемые пассажиры! Станция «Технологический институт» закрыта на ремонт до 15 сентября. Поезда следуют без остановки. Для пересадки на красную линию пользуйтесь станцией «Площадь Восстания». Приносим извинения за неудобства. Будьте внимательны и осторожны, не забывайте свои вещи в вагоне.',
    questions: [
      { prompt: 'Wat is er aan de hand met station Technologisch Instituut?', correctAnswer: 'het is tijdelijk dicht wegens werkzaamheden', options: ['het is tijdelijk dicht wegens werkzaamheden', 'het is voorgoed gesloten', 'er is alleen een lift kapot'], explanation: "'закрыта на ремонт до 15 сентября' = gesloten voor renovatie tot 15 september; 'поезда следуют без остановки' = treinen stoppen er niet." },
      { prompt: 'Waar moet je overstappen op de rode lijn?', correctAnswer: 'bij station Ploshchad Vosstaniya', options: ['bij station Ploshchad Vosstaniya', 'bij Technologisch Instituut', 'dat kan nergens'], explanation: "'Для пересадки ... пользуйтесь станцией «Площадь Восстания»' = gebruik voor de overstap station Ploshchad Vosstaniya." }
    ]
  }
];

// Generated drills for this level (see seed.js generateDrills): which
// categories and rules the automatic conjugation/declension questions go into.
const drills = {
  conjugation: { category: 'b1-grammatica-vervoeging', rule: 'VERB-CONJUGATION', maxVerbs: 30 },
  past: { category: 'b1-grammatica-vervoeging', rule: 'VERB-PAST-GENDER', maxVerbs: 15 },
  imperative: { category: 'b1-grammatica-gebiedende-wijs', rule: 'IMPERATIVE', maxVerbs: 12 },
  aspect: { category: 'b1-grammatica-aspect', rule: 'ASPECT-PAIRS', maxVerbs: 20 },
  cases: { category: 'b1-grammatica-naamvallen', rule: 'NOUN-DECLENSION', maxNouns: 30 }
};

module.exports = { categories, grammarRules, words, grammarExercises, practicalSentences, readings, drills };
