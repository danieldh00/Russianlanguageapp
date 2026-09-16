const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { aiGuard } = require('../rateLimit');

const router = express.Router();

// Sonnet is plenty for a few sentences of Dutch feedback or one dialogue
// turn, at a fraction of Opus's cost -- configurable via the add-on option
// for anyone who wants Opus's extra nuance for the roleplay dialogues.
const DEFAULT_MODEL = 'claude-sonnet-5';
const MODEL = process.env.ANTHROPIC_API_MODEL || DEFAULT_MODEL;

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

const SYSTEM_PROMPT = `Je bent een vriendelijke, deskundige docent Russisch die uitleg geeft aan een Nederlandstalige volwassen taalleerder.
Je krijgt een oefenvraag, het juiste antwoord en het antwoord dat de leerling zelf gaf.
Leg in het Nederlands, in maximaal 4 korte zinnen, precies uit waarom het gegeven antwoord fout is (of, als het toevallig toch goed is, wat er subtiel anders had gekund) en wat de leerling moet onthouden om dit soort fouten voortaan te vermijden.
Wees concreet over het specifieke antwoord dat de leerling gaf -- herhaal niet enkel de standaarduitleg. Gebruik geen opsommingstekens, geen aanhef en geen afsluitende groet. Antwoord uitsluitend met de uitleg zelf.`;

// POST /api/ai/explain -> a deeper, personalized explanation for one mistake, via Claude.
router.post('/explain', requireAuth, aiGuard, async (req, res) => {
  const anthropic = getClient();
  if (!anthropic) {
    return res.status(503).json({
      error: 'AI-uitleg is niet geconfigureerd op deze server. Vraag de beheerder om een ANTHROPIC_API_KEY in te stellen.'
    });
  }

  const { exerciseId, givenAnswer } = req.body || {};
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Oefening niet gevonden.' });

  let grammarRule = null;
  if (exercise.grammar_rule_id) {
    grammarRule = db.prepare('SELECT title, explanation FROM grammar_rules WHERE id = ?').get(exercise.grammar_rule_id);
  }

  const userPrompt = `Vraag: ${exercise.prompt}
Juiste antwoord: ${exercise.correct_answer}
Antwoord van de leerling: ${(givenAnswer || '(geen antwoord)').toString()}
Standaarduitleg die de leerling al zag: ${exercise.explanation}
${grammarRule ? `Onderliggende grammaticaregel (${grammarRule.title}): ${grammarRule.explanation}` : ''}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }]
    });

    if (response.stop_reason === 'refusal') {
      return res.status(502).json({ error: 'De AI kon hier geen uitleg voor geven.' });
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    res.json({ explanation: textBlock ? textBlock.text.trim() : '' });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      res.status(502).json({ error: 'De geconfigureerde ANTHROPIC_API_KEY is ongeldig.' });
    } else if (err instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: 'Even te veel AI-verzoeken. Probeer het over een moment opnieuw.' });
    } else if (err instanceof Anthropic.APIError) {
      res.status(502).json({ error: 'De AI-service is momenteel niet bereikbaar.' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Er ging iets mis bij het ophalen van de AI-uitleg.' });
    }
  }
});

// ---- role-play dialogues: practise the situations the app teaches ----

const SCENARIOS = [
  { id: 'apotheek', title: 'In de apotheek', icon: '💊', role: 'apotheker in een Russische apotheek', goal: 'De leerling wil een pijnstiller of iets tegen verkoudheid kopen en vraagt naar dosering en bijwerkingen. Vraag ook naar allergieën.' },
  { id: 'dokter', title: 'Bij de dokter', icon: '🩺', role: 'huisarts in een Russische polikliniek', goal: 'De leerling beschrijft klachten (hoofdpijn, koorts, hoest); je stelt vragen, geeft een diagnose en een recept.' },
  { id: 'hotel', title: 'Hotelbalie', icon: '🏨', role: 'receptionist van een hotel in Sint-Petersburg', goal: 'Inchecken op een reservering; daarna blijkt de airco in de kamer kapot en vraagt de leerling om een andere kamer.' },
  { id: 'restaurant', title: 'In het restaurant', icon: '🍽️', role: 'ober in een Russisch restaurant', goal: 'De leerling bestelt eten en drinken, vraagt naar een vegetarisch gerecht en betaalt uiteindelijk (met kaart, vraagt om de bon).' },
  { id: 'weg', title: 'De weg vragen', icon: '🧭', role: 'voorbijganger op straat in Moskou', goal: 'De leerling zoekt het metrostation of een apotheek; je legt de route uit met links/rechts/rechtdoor en afstanden.' },
  { id: 'politie', title: 'Aangifte bij de politie', icon: '🚔', role: 'politieagent op een bureau', goal: 'De telefoon van de leerling is gestolen in de metro; je vraagt wat, waar, wanneer, en vult samen de aangifte in.' },
  { id: 'huur', title: 'Huurcontract bespreken', icon: '🏠', role: 'huisbaas die een appartement verhuurt', goal: 'Bespreek huurprijs, borg, wat inbegrepen is (nutsvoorzieningen), huisdieren en de looptijd van het contract.' },
  { id: 'bank', title: 'Bij de bank', icon: '🏦', role: 'medewerker van een bankfiliaal', goal: 'De leerling wil een rekening openen of zijn geblokkeerde kaart deblokkeren; je vraagt naar paspoort, registratie en telefoonnummer.' },
  { id: 'sollicitatie', title: 'Sollicitatiegesprek', icon: '💼', role: 'HR-manager van een IT-bedrijf', goal: 'De leerling solliciteert als systeembeheerder; vraag naar ervaring, opleiding, salariswens en beschikbaarheid.' },
  { id: 'markt', title: 'Op de markt', icon: '🥕', role: 'verkoper op een groentemarkt', goal: 'De leerling koopt fruit en groente en probeert af te dingen; je noemt prijzen per kilo en geeft wisselgeld.' },
  { id: 'kennismaken', title: 'Kennismaken op een feestje', icon: '🥂', role: 'gast op een verjaardagsfeest die de leerling nog niet kent', goal: 'Smalltalk: naam, waar je vandaan komt, werk, hobby\'s, waarom je Russisch leert. Stel zelf ook vragen.' },
  { id: 'telefoon', title: 'Simkaart kopen', icon: '📱', role: 'verkoper in een telefoonwinkel', goal: 'De leerling wil een simkaart met internet voor een maand; bespreek abonnementen, prijs, paspoort en het opwaarderen.' }
];

const LEVEL_GUIDE = {
  A1: 'heel korte, simpele zinnen; tegenwoordige tijd; basiswoordenschat; herhaal desnoods langzaam',
  A2: 'korte zinnen, alledaagse woordenschat, verleden tijd is prima',
  B1: 'normale spreektaal, af en toe een idioom, vraag door',
  B2: 'natuurlijk tempo, spreektaal en vaste uitdrukkingen, nuance',
  C1: 'volwaardig natuurlijk Russisch, register wisselen (formeel/informeel), partikels',
  C2: 'moedertaalniveau, humor, ironie, uitdrukkingen, spreekwoorden'
};

function dialogueSystemPrompt(scenario, level) {
  return `Je speelt een rollenspel om een Nederlandstalige leerder Russisch te laten oefenen.
Jouw rol: ${scenario.role}. Situatie en doel van het gesprek: ${scenario.goal}
Niveau van de leerling: ${level} (${LEVEL_GUIDE[level] || LEVEL_GUIDE.B1}). Pas je Russisch daarop aan.
Blijf in je rol en in het Russisch. Antwoord met 1 tot 3 zinnen en eindig meestal met een vraag, zodat de leerling verder moet praten.
Als de leerling in het Nederlands schrijft of vastloopt, reageer toch in je rol in het Russisch en geef in "correction" een voorbeeldzin in het Russisch die de leerling had kunnen gebruiken.
Als het gesprek zijn doel bereikt heeft (of na ongeveer tien beurten), rond je het natuurlijk af en zet je "finished" op true.

Antwoord ALTIJD uitsluitend met één JSON-object, zonder tekst eromheen, met precies deze velden:
{"reply": "<jouw Russische zin(nen) in je rol>",
 "translation": "<Nederlandse vertaling van reply>",
 "correction": "<in het Nederlands: korte, concrete correctie van fouten in de laatste zin van de leerling (grammatica, naamval, woordkeus) met de verbeterde Russische zin; null als er niets te verbeteren was of dit de openingszin is>",
 "tip": "<één korte Nederlandse hint wat de leerling nu zou kunnen zeggen, met een Russische voorbeeldzin; null als niet nodig>",
 "finished": <true|false>}`;
}

// GET /api/ai/scenarios -> the role-play list, plus whether AI is configured at all
router.get('/scenarios', requireAuth, (req, res) => {
  res.json({
    configured: !!getClient(),
    scenarios: SCENARIOS.map(({ id, title, icon, role }) => ({ id, title, icon, role }))
  });
});

// POST /api/ai/dialogue { scenario, level, messages: [{ role: 'user'|'assistant', content }] }
// With an empty messages list the assistant opens the conversation.
router.post('/dialogue', requireAuth, aiGuard, async (req, res) => {
  const anthropic = getClient();
  if (!anthropic) {
    return res.status(503).json({ error: 'Rollenspellen vereisen een ANTHROPIC_API_KEY op de server (add-on-optie anthropic_api_key).' });
  }
  const { scenario: scenarioId, level, messages } = req.body || {};
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return res.status(400).json({ error: 'Onbekend scenario.' });
  const lvl = LEVEL_GUIDE[level] ? level : 'B1';
  const history = Array.isArray(messages) ? messages.slice(-24) : [];
  const clean = [];
  for (const m of history) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') continue;
    const content = m.content.trim().slice(0, 1000);
    if (!content) continue;
    // the API needs strictly alternating roles; drop a message that would repeat the previous role
    if (clean.length && clean[clean.length - 1].role === m.role) continue;
    clean.push({ role: m.role, content });
  }
  if (!clean.length || clean[0].role !== 'user') {
    clean.unshift({ role: 'user', content: '(Het gesprek begint. Open het gesprek in je rol.)' });
  }
  if (clean[clean.length - 1].role !== 'user') clean.push({ role: 'user', content: '(Ga verder.)' });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: dialogueSystemPrompt(scenario, lvl),
      messages: clean
    });
    if (response.stop_reason === 'refusal') return res.status(502).json({ error: 'De AI wilde hier niet op ingaan.' });
    const text = (response.content.find((b) => b.type === 'text') || { text: '' }).text.trim();
    let parsed;
    try {
      const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
      parsed = JSON.parse(jsonText);
    } catch (err) {
      parsed = { reply: text, translation: null, correction: null, tip: null, finished: false };
    }
    res.json({
      reply: String(parsed.reply || '').trim(),
      translation: parsed.translation ? String(parsed.translation).trim() : null,
      correction: parsed.correction ? String(parsed.correction).trim() : null,
      tip: parsed.tip ? String(parsed.tip).trim() : null,
      finished: !!parsed.finished
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      res.status(502).json({ error: 'De geconfigureerde ANTHROPIC_API_KEY is ongeldig.' });
    } else if (err instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: 'Even te veel AI-verzoeken. Probeer het over een moment opnieuw.' });
    } else if (err instanceof Anthropic.APIError) {
      res.status(502).json({ error: 'De AI-service is momenteel niet bereikbaar.' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Er ging iets mis in het gesprek.' });
    }
  }
});

module.exports = router;
