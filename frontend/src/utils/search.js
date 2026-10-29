// Search helpers. Everything is compared in Latin script, so a user can type
// either "Червената шапчица" or "chervenata shapchitsa" and get the same result.

const CYR_TO_LAT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
  ё: 'yo', э: 'e', ы: 'i',
};

/** Bulgarian Cyrillic → Latin (official streamlined system). */
export function toLatin(text) {
  let out = '';
  for (const ch of text) out += CYR_TO_LAT[ch] ?? ch;
  return out;
}

/**
 * Lower-case, strip accents and punctuation, transliterate to Latin.
 * Common Latin spelling variants are folded together (c/ts, w/v, j/zh, q/ya, x/h).
 */
export function normalizeText(text) {
  return toLatin(
    String(text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, ''),
  )
    .replace(/c(?!h)/g, 'ts')
    .replace(/w/g, 'v')
    .replace(/j/g, 'zh')
    .replace(/q/g, 'ya')
    .replace(/x/g, 'h')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Splits a query into normalized words. */
export function tokenize(query) {
  return normalizeText(query).split(' ').filter(Boolean);
}

/** Text that a kindergarten can be found by. */
export function searchableText(kg) {
  return ` ${normalizeText(`${kg.name} ${kg.address} ${kg.regionName}`)} `;
}

/** True when every word of the query appears in the kindergarten's name, address or district. */
export function matchesQuery(kg, query) {
  const tokens = Array.isArray(query) ? query : tokenize(query);
  if (tokens.length === 0) return true;
  const haystack = kg._search ?? searchableText(kg);
  return tokens.every((t) => (/^\d+$/.test(t) ? haystack.includes(` ${t} `) : haystack.includes(t)));
}
