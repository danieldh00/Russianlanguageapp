const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

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
router.post('/explain', requireAuth, async (req, res) => {
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
      model: 'claude-opus-5',
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

module.exports = router;
