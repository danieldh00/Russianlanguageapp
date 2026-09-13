# Bronnen van de lesinhoud

De lesinhoud in deze map is grotendeels zelf geschreven (Nederlandse
vertalingen, uitleg, grammaticaregels, leesteksten, praktische zinnen).
Voor de Russische kant — klemtoontekens, woordvormen (vervoegingen,
verbuigingen, aspectpartners) en de keuze van woorden per niveau — is
gebruikgemaakt van twee open datasets. Beide staan hieronder met hun
licentie; de gegenereerde afgeleide (`generated/openrussian-forms.json`)
valt onder dezelfde voorwaarden als de bron.

## Open Russian dictionary (CC-BY-SA 4.0)

- Project: <https://en.openrussian.org/> — dump op
  <https://github.com/Badestrand/russian-dictionary>
- Licentie: [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Gebruikt voor: klemtoon per woord (`words.accented`), woordsoort, geslacht,
  aspect en aspectpartner van werkwoorden, vergrotende trap, en de volledige
  vorm-tabellen (personen/tijden/gebiedende wijs voor werkwoorden, naamvallen
  enkel- en meervoud voor zelfstandige naamwoorden, geslachten/naamvallen
  voor bijvoeglijke naamwoorden). Daaruit genereert de seed de
  "vervoegingsdrills" en "naamvaldrills" per niveau.
- Wijzigingen ten opzichte van de bron: alleen de woorden die de app zelf
  gebruikt zijn overgenomen; het klemtoonteken `'` is omgezet naar een
  combinerend accent (U+0301); de EN/DE-glossen zijn niet in de app
  opgenomen (vertalingen zijn eigen Nederlands werk).

## FrequencyWords — OpenSubtitles 2018, Russisch (MIT)

- Project: <https://github.com/hermitdave/FrequencyWords>
  (bestand `content/2018/ru/ru_50k.txt`, afgeleid van het OpenSubtitles-corpus
  van <https://opus.nlpl.eu/>)
- Licentie: MIT
- Gebruikt voor: de frequentierang per woord (`rank`) waarmee de
  woordenschatpakketten per niveau zijn samengesteld — grofweg rang
  1.500–4.000 voor B1, 4.000–8.000 voor B2, 8.000–15.000 voor C1 en
  15.000–30.000 voor C2 — zodat je eerst de woorden leert die je in echt
  gesproken Russisch ook het vaakst tegenkomt.

## Opnieuw genereren

Het bestand `generated/openrussian-forms.json` wordt **niet** bij het
opstarten van de app gebouwd (de app heeft geen internet nodig), maar
eenmalig met het ontwikkelscript:

```bash
# 1. dump ophalen
git clone --depth 1 https://github.com/Badestrand/russian-dictionary /tmp/openrussian
git clone --depth 1 https://github.com/hermitdave/FrequencyWords /tmp/freq
# 2. bouwen (schrijft seed/data/generated/openrussian-forms.json)
cd russisch-leren/backend
node seed/import/build-openrussian.js \
  --dict /tmp/openrussian \
  --freq /tmp/freq/content/2018/ru/ru_50k.txt \
  --candidates /tmp/candidates     # optioneel: kandidaatwoorden per niveau
```

De optie `--candidates` schrijft per niveau een TSV met de meest frequente
woorden die de app nog *niet* heeft (met EN/DE-gloss uit het woordenboek als
geheugensteun), zodat je die met de hand van een Nederlandse vertaling kunt
voorzien en aan `levels/vocab-<niveau>.js` kunt toevoegen. Woorden die na
het bouwen aan de app worden toegevoegd maar niet in het JSON-bestand staan,
werken gewoon — alleen zonder klemtoonteken en zonder drills.
