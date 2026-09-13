// The CEFR ladder the content is organised on, with the Dutch labels the UI
// shows for it.
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const LEVEL_TITLES = {
  A1: 'Beginner',
  A2: 'Elementair',
  B1: 'Drempelniveau',
  B2: 'Gevorderd',
  C1: 'Vergevorderd',
  C2: 'Beheersing (moedertaalniveau)'
};

const LEVEL_DESCRIPTIONS = {
  A1: 'Jezelf voorstellen, tellen, eten bestellen, de basisgrammatica.',
  A2: 'Alledaagse gesprekken, de naamvallen, verleden en toekomende tijd.',
  B1: 'Je redden bij de dokter, de bank, het loket en op je werk.',
  B2: 'Vlot meepraten over nieuws, cultuur en zaken; geschreven Russisch begrijpen.',
  C1: 'Genuanceerd argumenteren, formeel en informeel register, idioom en partikels.',
  C2: 'Literatuur, vakjargon, culturele referenties, stijl en interpunctie op moedertaalniveau.'
};

function levelRank(level) {
  return LEVELS.indexOf(level);
}

module.exports = { LEVELS, LEVEL_TITLES, LEVEL_DESCRIPTIONS, levelRank };
