// Practical, real-life sentences for the "sentence_build" exercise type: the
// learner taps Russian word-chips (in `tokens`) into the right order for the
// given Dutch prompt. `tokens.join(' ')` must equal the sentence exactly --
// that joined string is stored as the answer key.
module.exports = [
  {
    prompt: 'Sorry, waar is het station?',
    tokens: ['Извините,', 'где', 'вокзал?'],
    explanation:
      "'Извините' (sorry/pardon) is de beleefde manier om iemands aandacht te trekken voordat je een vraag stelt. 'где' (waar) staat vooraan in de vraag, gevolgd door wat je zoekt."
  },
  {
    prompt: 'Ik wil graag een koffie, alstublieft.',
    tokens: ['Я', 'хотел', 'бы', 'кофе,', 'пожалуйста.'],
    explanation:
      "'хотел бы' is de beleefde/voorwaardelijke vorm van willen (letterlijk 'zou willen'), net als 'ik zou graag willen'. Een vrouwelijke spreker zegt 'хотела бы'. 'пожалуйста' (alstublieft) staat meestal aan het einde van het verzoek."
  },
  {
    prompt: 'Hoeveel kost dit?',
    tokens: ['Сколько', 'это', 'стоит?'],
    explanation: "'Сколько' (hoeveel) begint de vraag, gevolgd door 'это' (dit) en het werkwoord 'стоит' (kost)."
  },
  {
    prompt: 'Ik heet Anna.',
    tokens: ['Меня', 'зовут', 'Анна.'],
    explanation:
      "'Меня зовут' is een vaste uitdrukking die letterlijk 'mij noemt men' betekent — je naam komt aan het einde. Dit is de gebruikelijke manier om jezelf voor te stellen."
  },
  {
    prompt: 'Ik begrijp het niet.',
    tokens: ['Я', 'не', 'понимаю.'],
    explanation: "'не' staat altijd direct vóór het werkwoord dat ontkend wordt: 'не понимаю' (ik begrijp niet)."
  },
  {
    prompt: 'Spreekt u Engels?',
    tokens: ['Вы', 'говорите', 'по-английски?'],
    explanation:
      "'по-английски' betekent letterlijk 'op Engelse wijze' — deze vorm met по- gebruik je bij talen in combinatie met een werkwoord zoals говорить (spreken)."
  },
  {
    prompt: 'Waar is het toilet?',
    tokens: ['Где', 'туалет?'],
    explanation: "Een korte, directe vraag: 'где' (waar) plus het zelfstandig naamwoord. Het werkwoord 'is' laat je in dit soort korte vragen weg."
  },
  {
    prompt: 'Mag ik de rekening, alstublieft?',
    tokens: ['Можно', 'счёт,', 'пожалуйста?'],
    explanation: "'Можно' (mag het / is het mogelijk) is een handige, veelzijdige manier om beleefd ergens om te vragen."
  },
  {
    prompt: 'Hoe laat is het?',
    tokens: ['Который', 'час?'],
    explanation: "'Который час?' is de vaste uitdrukking voor 'hoe laat is het', letterlijk 'welk uur'."
  },
  {
    prompt: 'Help me alstublieft.',
    tokens: ['Помогите,', 'пожалуйста.'],
    explanation: "'Помогите' is de gebiedende wijs (bevelsvorm) van 'helpen', in de beleefde вы-vorm — zo roep je in het Russisch om hulp."
  },
  {
    prompt: 'Ik ben verdwaald.',
    tokens: ['Я', 'заблудился.'],
    explanation: "'заблудился' is de mannelijke verledentijdsvorm van 'de weg kwijtraken'; een vrouwelijke spreker zegt 'заблудилась'."
  },
  {
    prompt: 'Ik heb een dokter nodig.',
    tokens: ['Мне', 'нужен', 'врач.'],
    explanation: "'нужен' (nodig) stemt in geslacht overeen met wat nodig is: 'врач' is mannelijk, dus 'нужен'. Bij een vrouwelijk woord zou het 'нужна' zijn."
  }
];
