// Survival phrasebook: per situation the sentences you actually need on the
// spot, with a Dutch gloss. Shipped inside the content bundle so it works
// offline (at the pharmacy you have no time for a lesson). Kept short and
// polite (вы-form) -- these are for strangers, officials and staff.
module.exports = [
  {
    id: 'basis', icon: '🙏', title: 'Basis & beleefdheid',
    phrases: [
      ['Здравствуйте.', 'Goedendag.'],
      ['Извините, вы говорите по-английски?', 'Pardon, spreekt u Engels?'],
      ['Я плохо говорю по-русски.', 'Ik spreek slecht Russisch.'],
      ['Повторите, пожалуйста, медленнее.', 'Herhaalt u het alstublieft langzamer.'],
      ['Я не понимаю.', 'Ik begrijp het niet.'],
      ['Напишите, пожалуйста.', 'Schrijft u het alstublieft op.'],
      ['Спасибо большое.', 'Hartelijk dank.'],
      ['Не за что.', 'Graag gedaan.'],
      ['Помогите, пожалуйста.', 'Help me alstublieft.'],
      ['Где туалет?', 'Waar is het toilet?'],
      ['Сколько это стоит?', 'Hoeveel kost dit?'],
      ['Можно оплатить картой?', 'Kan ik met de kaart betalen?']
    ]
  },
  {
    id: 'nood', icon: '🚨', title: 'Noodgeval',
    phrases: [
      ['Помогите!', 'Help!'],
      ['Вызовите скорую помощь!', 'Bel een ambulance!'],
      ['Вызовите полицию!', 'Bel de politie!'],
      ['Мне нужен врач.', 'Ik heb een dokter nodig.'],
      ['Здесь авария.', 'Hier is een ongeluk gebeurd.'],
      ['Человеку плохо.', 'Iemand is onwel geworden.'],
      ['У меня украли телефон / кошелёк / паспорт.', 'Mijn telefoon / portemonnee / paspoort is gestolen.'],
      ['Я потерял паспорт.', 'Ik ben mijn paspoort kwijt.'],
      ['Где ближайшая больница?', 'Waar is het dichtstbijzijnde ziekenhuis?'],
      ['Я гражданин Нидерландов.', 'Ik ben Nederlands staatsburger.'],
      ['Позвоните в консульство Нидерландов.', 'Bel het Nederlandse consulaat.'],
      ['Единый номер экстренных служб — 112.', 'Het algemene alarmnummer is 112.']
    ]
  },
  {
    id: 'apotheek', icon: '💊', title: 'Apotheek',
    phrases: [
      ['У вас есть что-нибудь от головной боли?', 'Heeft u iets tegen hoofdpijn?'],
      ['Мне нужно обезболивающее.', 'Ik heb een pijnstiller nodig.'],
      ['Что-нибудь от простуды / кашля / температуры.', 'Iets tegen verkoudheid / hoest / koorts.'],
      ['Это продаётся без рецепта?', 'Is dit zonder recept verkrijgbaar?'],
      ['Как принимать? Сколько раз в день?', 'Hoe moet ik het innemen? Hoe vaak per dag?'],
      ['У меня аллергия на пенициллин.', 'Ik ben allergisch voor penicilline.'],
      ['Есть ли побочные эффекты?', 'Zijn er bijwerkingen?'],
      ['Дайте, пожалуйста, пластырь и бинт.', 'Geeft u mij alstublieft pleisters en verband.'],
      ['Мне нужны капли для глаз.', 'Ik heb oogdruppels nodig.'],
      ['Аптека работает круглосуточно?', 'Is de apotheek 24 uur open?']
    ]
  },
  {
    id: 'dokter', icon: '🩺', title: 'Bij de dokter',
    phrases: [
      ['Я хочу записаться на приём.', 'Ik wil een afspraak maken.'],
      ['У меня болит здесь.', 'Het doet hier pijn.'],
      ['У меня температура / кашель / насморк.', 'Ik heb koorts / hoest / een loopneus.'],
      ['Меня тошнит.', 'Ik ben misselijk.'],
      ['У меня кружится голова.', 'Ik ben duizelig.'],
      ['Мне трудно дышать.', 'Ik heb moeite met ademen.'],
      ['Это началось два дня назад.', 'Het is twee dagen geleden begonnen.'],
      ['Я принимаю эти лекарства.', 'Ik gebruik deze medicijnen.'],
      ['У меня есть страховка.', 'Ik heb een verzekering.'],
      ['Мне нужна справка для страховой.', 'Ik heb een verklaring voor de verzekering nodig.'],
      ['Что мне делать дальше?', 'Wat moet ik nu doen?']
    ]
  },
  {
    id: 'restaurant', icon: '🍽️', title: 'Restaurant & café',
    phrases: [
      ['Столик на двоих, пожалуйста.', 'Een tafel voor twee, alstublieft.'],
      ['Можно меню на английском?', 'Heeft u een menukaart in het Engels?'],
      ['Что вы посоветуете?', 'Wat raadt u aan?'],
      ['Я буду борщ и чай.', 'Ik neem borsjt en thee.'],
      ['Без мяса, пожалуйста. Я вегетарианец.', 'Zonder vlees, alstublieft. Ik ben vegetariër.'],
      ['Это острое?', 'Is dit pittig?'],
      ['Воду без газа, пожалуйста.', 'Water zonder koolzuur, alstublieft.'],
      ['Ещё один кофе, пожалуйста.', 'Nog een koffie, alstublieft.'],
      ['Счёт, пожалуйста.', 'De rekening, alstublieft.'],
      ['Можно с собой?', 'Kan het om mee te nemen?'],
      ['Было очень вкусно.', 'Het was heel lekker.']
    ]
  },
  {
    id: 'hotel', icon: '🏨', title: 'Hotel',
    phrases: [
      ['У меня бронь на имя …', 'Ik heb een reservering op naam …'],
      ['Есть свободный номер на две ночи?', 'Heeft u een kamer vrij voor twee nachten?'],
      ['Завтрак включён?', 'Is het ontbijt inbegrepen?'],
      ['Какой пароль от вайфая?', 'Wat is het wifi-wachtwoord?'],
      ['В номере не работает кондиционер / отопление.', 'De airco / verwarming in de kamer doet het niet.'],
      ['Можно другой номер?', 'Kan ik een andere kamer krijgen?'],
      ['Во сколько выезд?', 'Hoe laat is het uitchecken?'],
      ['Можно оставить багаж?', 'Kan ik mijn bagage achterlaten?'],
      ['Вызовите такси, пожалуйста.', 'Belt u alstublieft een taxi.'],
      ['Мне нужна регистрация для визы.', 'Ik heb een registratie nodig voor mijn visum.']
    ]
  },
  {
    id: 'onderweg', icon: '🚕', title: 'Vervoer & de weg',
    phrases: [
      ['Как доехать до центра?', 'Hoe kom ik naar het centrum?'],
      ['Где ближайшая станция метро?', 'Waar is het dichtstbijzijnde metrostation?'],
      ['Один билет, пожалуйста.', 'Eén kaartje, alstublieft.'],
      ['Этот автобус идёт до вокзала?', 'Gaat deze bus naar het station?'],
      ['Скажите, пожалуйста, когда выходить.', 'Zegt u alstublieft wanneer ik moet uitstappen.'],
      ['Остановите здесь, пожалуйста.', 'Stopt u hier, alstublieft.'],
      ['Сколько стоит до аэропорта?', 'Hoeveel kost het naar de luchthaven?'],
      ['Включите счётчик, пожалуйста.', 'Zet u de meter aan, alstublieft.'],
      ['Прямо, потом налево / направо.', 'Rechtdoor, dan links / rechts.'],
      ['Это далеко? Можно дойти пешком?', 'Is het ver? Kan ik lopen?'],
      ['Я заблудился.', 'Ik ben verdwaald.']
    ]
  },
  {
    id: 'winkel', icon: '🛒', title: 'Winkel & markt',
    phrases: [
      ['Сколько стоит килограмм?', 'Hoeveel kost een kilo?'],
      ['Дайте, пожалуйста, полкило.', 'Doet u mij een halve kilo, alstublieft.'],
      ['Можно попробовать?', 'Mag ik proeven?'],
      ['Это слишком дорого.', 'Dat is te duur.'],
      ['Есть скидка?', 'Is er korting?'],
      ['У вас есть другой размер?', 'Heeft u een andere maat?'],
      ['Можно примерить?', 'Mag ik het passen?'],
      ['Я хочу это вернуть. Вот чек.', 'Ik wil dit terugbrengen. Hier is de bon.'],
      ['Пакет нужен?  — Да / Нет, спасибо.', 'Wilt u een tasje? — Ja / Nee, dank u.'],
      ['Сдачи не надо.', 'Laat het wisselgeld maar zitten.']
    ]
  },
  {
    id: 'geld', icon: '🏦', title: 'Bank, geld & telefoon',
    phrases: [
      ['Где банкомат?', 'Waar is een geldautomaat?'],
      ['Банкомат не выдал деньги.', 'De automaat gaf geen geld.'],
      ['Моя карта заблокирована.', 'Mijn kaart is geblokkeerd.'],
      ['Какой курс евро?', 'Wat is de eurokoers?'],
      ['Я хочу обменять деньги.', 'Ik wil geld wisselen.'],
      ['Мне нужна сим-карта с интернетом.', 'Ik heb een simkaart met internet nodig.'],
      ['Как пополнить баланс?', 'Hoe waardeer ik mijn tegoed op?'],
      ['Здесь нет связи.', 'Hier is geen bereik.'],
      ['Можно зарядить телефон?', 'Mag ik mijn telefoon opladen?']
    ]
  },
  {
    id: 'documenten', icon: '🛂', title: 'Politie & documenten',
    phrases: [
      ['Вот мой паспорт и виза.', 'Hier zijn mijn paspoort en visum.'],
      ['Я турист. Я здесь на неделю.', 'Ik ben toerist. Ik ben hier een week.'],
      ['Я хочу подать заявление о краже.', 'Ik wil aangifte doen van diefstal.'],
      ['Это случилось сегодня утром в метро.', 'Het gebeurde vanochtend in de metro.'],
      ['Мне нужна копия заявления для страховой.', 'Ik heb een kopie van de aangifte nodig voor de verzekering.'],
      ['Где нужно расписаться?', 'Waar moet ik tekenen?'],
      ['Какой у меня номер в очереди?', 'Welk nummer heb ik in de rij?'],
      ['Мне нужен переводчик.', 'Ik heb een tolk nodig.'],
      ['Я хочу позвонить в консульство.', 'Ik wil het consulaat bellen.']
    ]
  },
  {
    id: 'wonen', icon: '🏠', title: 'Wonen & huren',
    phrases: [
      ['Я хочу снять квартиру на год.', 'Ik wil een appartement huren voor een jaar.'],
      ['Сколько стоит аренда в месяц?', 'Hoeveel is de huur per maand?'],
      ['Коммунальные услуги включены?', 'Zijn gas, water en licht inbegrepen?'],
      ['Какой залог?', 'Hoeveel is de borg?'],
      ['Можно посмотреть договор?', 'Mag ik het contract zien?'],
      ['Не работает отопление / горячая вода.', 'De verwarming / het warme water werkt niet.'],
      ['Когда придёт мастер?', 'Wanneer komt de monteur?'],
      ['Соседи очень шумят.', 'De buren maken veel lawaai.'],
      ['Мне нужна регистрация по этому адресу.', 'Ik heb een inschrijving op dit adres nodig.']
    ]
  },
  {
    id: 'smalltalk', icon: '🥂', title: 'Kennismaken',
    phrases: [
      ['Меня зовут …  А вас?', 'Ik heet … En u?'],
      ['Очень приятно.', 'Aangenaam.'],
      ['Я из Нидерландов.', 'Ik kom uit Nederland.'],
      ['Я работаю системным администратором.', 'Ik werk als systeembeheerder.'],
      ['Я учу русский полгода.', 'Ik leer een half jaar Russisch.'],
      ['Мне очень нравится здесь.', 'Ik vind het hier heel leuk.'],
      ['Чем вы занимаетесь?', 'Wat doet u voor werk?'],
      ['У вас есть дети?', 'Heeft u kinderen?'],
      ['Давайте выпьем за знакомство!', 'Laten we drinken op de kennismaking!'],
      ['Было приятно познакомиться.', 'Leuk om u ontmoet te hebben.']
    ]
  }
];
