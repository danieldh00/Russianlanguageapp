// Cyrillic -> Latin transliteration in the same (English-style) convention the
// hand-written A1/A2 vocabulary already uses (zh, sh, shch, ch, kh, ya, yu, yo).
// Used to auto-fill `transliteration` for words that don't specify one, and
// to strip stress marks before transliterating.
const MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ъ: '', ы: 'y', ь: "'", э: 'e', ю: 'yu', я: 'ya'
};

function stripStress(s) {
  return (s || '').replace(/́/g, '');
}

function transliterate(text) {
  const src = stripStress(text);
  let out = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const lower = ch.toLowerCase();
    const prev = src[i - 1] ? src[i - 1].toLowerCase() : '';
    let latin;
    if (lower === 'е' && (i === 0 || !/[а-яё]/.test(prev) || 'аеёиоуыэюяьъ'.includes(prev))) latin = 'ye';
    else if (lower in MAP) latin = MAP[lower];
    else latin = ch;
    if (ch !== lower && latin) latin = latin[0].toUpperCase() + latin.slice(1);
    out += latin;
  }
  return out;
}

module.exports = { transliterate, stripStress };
