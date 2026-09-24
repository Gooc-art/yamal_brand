import { randomUUID } from 'node:crypto';

const ruToLat = new Map([
  ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'], ['ё', 'e'],
  ['ж', 'j'], ['з', 'z'], ['и', 'i'], ['й', 'i'], ['к', 'k'], ['л', 'l'], ['м', 'm'],
  ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'], ['с', 's'], ['т', 't'], ['у', 'u'],
  ['ф', 'f'], ['х', 'h'], ['ц', 'c'], ['ч', 'ch'], ['ш', 'sh'], ['щ', 'sh'],
  ['ъ', ''], ['ы', 'y'], ['ь', ''], ['э', 'e'], ['ю', 'yu'], ['я', 'ya'],
]);

const keyboardSwap = new Map([
  ['q', 'й'], ['w', 'ц'], ['e', 'у'], ['r', 'к'], ['t', 'е'], ['y', 'н'], ['u', 'г'],
  ['i', 'ш'], ['o', 'щ'], ['p', 'з'], ['a', 'ф'], ['s', 'ы'], ['d', 'в'], ['f', 'а'],
  ['g', 'п'], ['h', 'р'], ['j', 'о'], ['k', 'л'], ['l', 'д'], ['z', 'я'], ['x', 'ч'],
  ['c', 'с'], ['v', 'м'], ['b', 'и'], ['n', 'т'], ['m', 'ь'],
  ['й', 'q'], ['ц', 'w'], ['у', 'e'], ['к', 'r'], ['е', 't'], ['н', 'y'], ['г', 'u'],
  ['ш', 'i'], ['щ', 'o'], ['з', 'p'], ['ф', 'a'], ['ы', 's'], ['в', 'd'], ['а', 'f'],
  ['п', 'g'], ['р', 'h'], ['о', 'j'], ['л', 'k'], ['д', 'l'], ['я', 'z'], ['ч', 'x'],
  ['с', 'c'], ['м', 'v'], ['и', 'b'], ['т', 'n'], ['ь', 'm'],
]);

const synonyms = {
  'лого': ['логотип', 'logo', 'logotype'],
  'логотип': ['лого', 'logo', 'logotype', 'brandmark', 'знак', 'эмблема'],
  'logo': ['логотип', 'лого', 'logotype', 'brandmark'],
  'logotype': ['логотип', 'logo', 'лого'],
  'brandmark': ['логотип', 'logo', 'знак'],
  'знак': ['логотип', 'brandmark', 'эмблема', 'symbol'],
  'эмблема': ['логотип', 'знак', 'symbol'],
  'symbol': ['знак', 'эмблема', 'brandmark'],
  'брендбук': ['гайдлайн', 'гайд', 'guide', 'guideline', 'brandbook'],
  'brandbook': ['брендбук', 'гайдлайн', 'guide', 'guideline'],
  'гайдлайн': ['брендбук', 'brandbook', 'guide', 'guideline'],
  'guideline': ['брендбук', 'brandbook', 'гайдлайн', 'guide'],
  'гайд': ['брендбук', 'гайдлайн', 'guide'],
  'guide': ['брендбук', 'brandbook', 'гайдлайн', 'guideline'],
  'шрифт': ['font', 'fonts', 'ttf', 'otf', 'гарнитура', 'typeface'],
  'font': ['шрифт', 'fonts', 'ttf', 'otf', 'гарнитура', 'typeface'],
  'fonts': ['шрифт', 'font', 'гарнитура'],
  'гарнитура': ['шрифт', 'font', 'typeface'],
  'typeface': ['шрифт', 'font', 'гарнитура'],
  'сувенир': ['мерч', 'merch', 'сувенирка', 'подарок', 'подарки'],
  'мерч': ['сувенир', 'merch', 'сувенирка', 'подарок'],
  'merch': ['сувенир', 'мерч', 'сувенирка'],
  'сувенирка': ['сувенир', 'мерч', 'merch', 'подарок'],
  'подарок': ['сувенир', 'мерч', 'сувенирка'],
  'подарки': ['сувенир', 'мерч', 'сувенирка'],
  'иллюстрация': ['иллюстрации', 'svg', 'вектор', 'элемент', 'графика'],
  'иллюстрации': ['иллюстрация', 'svg', 'вектор', 'элементы', 'графика'],
  'svg': ['иллюстрация', 'иллюстрации', 'вектор', 'элемент'],
  'вектор': ['svg', 'иллюстрация', 'иллюстрации'],
  'элемент': ['svg', 'иллюстрация', 'паттерн'],
  'элементы': ['svg', 'иллюстрации', 'паттерн'],
  'иконка': ['icon', 'svg', 'пиктограмма'],
  'icon': ['иконка', 'svg', 'пиктограмма'],
  'пиктограмма': ['иконка', 'icon', 'svg'],
  'паттерн': ['svg', 'элемент', 'орнамент'],
  'орнамент': ['паттерн', 'элемент'],
  'детский': ['дети', 'child'],
  'дети': ['детский', 'child'],
  'child': ['детский', 'дети'],
  'город': ['города', 'муниципалитет'],
  'города': ['город', 'муниципалитет'],
  'муниципалитет': ['город', 'города'],
  'мастербренд': ['мастер бренд', 'брендбук', 'гайдлайн'],
  'мастер': ['мастербренд', 'мастер бренд', 'брендбук'],
  'юбилей': ['100', '95', 'брендбук'],
  'наклейка': ['стикер', 'наклейки', 'стикеры'],
  'наклейки': ['стикер', 'стикеры', 'наклейка'],
  'стикер': ['наклейка', 'стикеры', 'наклейки'],
  'стикеры': ['наклейка', 'наклейки', 'стикер'],
  'одежда': ['футболка', 'худи', 'мерч'],
  'футболка': ['одежда', 'мерч'],
  'худи': ['одежда', 'мерч'],
  'баннер': ['полиграфия', 'навигация'],
  'навигация': ['полиграфия', 'баннер', 'табличка'],
  'полиграфия': ['баннер', 'навигация', 'буклет'],
  'диджитал': ['презентация', 'соцсети', 'цифровой'],
  'презентация': ['диджитал', 'цифровой'],
  'соцсети': ['диджитал', 'цифровой'],
  'канцелярия': ['ручка', 'блокнот', 'ежедневник'],
  'буклет': ['полиграфия'],
  'табличка': ['навигация', 'полиграфия'],
};

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[^0-9a-zа-я]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function translitToLatin(value) {
  const src = normalizeText(value);
  let out = '';
  for (const ch of src) {
    out += ruToLat.has(ch) ? ruToLat.get(ch) : ch;
  }
  return normalizeText(out);
}

export function swapKeyboardLayout(value) {
  const src = String(value || '').toLowerCase();
  let out = '';
  for (const ch of src) {
    out += keyboardSwap.has(ch) ? keyboardSwap.get(ch) : ch;
  }
  return normalizeText(out);
}

export function buildQueryVariants(query) {
  const norm = normalizeText(query);
  const swapped = swapKeyboardLayout(query);
  const bases = [norm, swapped].filter(Boolean);
  if (!bases.length) return [];

  const variants = [];
  const seen = new Set();

  function addVariant(value) {
    const v = normalizeText(value);
    if (!v || seen.has(v)) return;
    seen.add(v);
    variants.push(v);
  }

  for (const base of bases) {
    addVariant(base);
    addVariant(translitToLatin(base));
  }

  for (const base of [...variants]) {
    for (const token of base.split(' ')) {
      const syns = synonyms[token] || [];
      for (const syn of syns) {
        addVariant(syn);
        addVariant(translitToLatin(syn));
      }
    }
  }

  return variants;
}

export function filterExactIntentMatches(query, rows) {
  const queryNorm = normalizeText(query);
  if (queryNorm === 'брендбук') {
    return rows.filter((row) => splitTokens(row.normalized_name || row.name).includes('брендбук'));
  }

  const categoryNames = {
    'шрифт': ['шрифт', 'шрифты'],
    'шрифты': ['шрифт', 'шрифты'],
    'лого': ['логотип', 'логотипы'],
    'логотип': ['логотип', 'логотипы'],
    'логотипы': ['логотип', 'логотипы'],
    'паттерн': ['паттерн', 'паттерны'],
    'паттерны': ['паттерн', 'паттерны'],
    'иллюстрация': ['иллюстрация', 'иллюстрации'],
    'иллюстрации': ['иллюстрация', 'иллюстрации'],
  }[queryNorm];
  if (!categoryNames) return rows;

  return rows.filter((row) => {
    if (row.type !== 'folder') return false;
    const name = normalizeText(row.normalized_name || row.name)
      .replace(/^\d+\s+/, '')
      .replace(/\s+каркас$/, '');
    return categoryNames.includes(name);
  });
}

function ratio(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return Math.min(a.length, b.length) / Math.max(a.length, b.length);

  // Lightweight similarity without extra deps.
  let same = 0;
  const sa = new Set(a.split(' '));
  const sb = new Set(b.split(' '));
  for (const t of sa) if (sb.has(t)) same += 1;
  return same / Math.max(sa.size, sb.size, 1);
}

function splitTokens(value) {
  return normalizeText(value).split(' ').filter(Boolean);
}

function damerauLevenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const rows = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost
      );

      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + cost);
      }
    }
  }

  return rows[a.length][b.length];
}

function stringSimilarity(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) {
    return Math.min(left.length, right.length) / Math.max(left.length, right.length);
  }
  const distance = damerauLevenshtein(left, right);
  return Math.max(0, 1 - distance / Math.max(left.length, right.length));
}

function buildNgrams(value, size = 3) {
  const text = normalizeText(value).replace(/\s+/g, ' ');
  if (!text) return new Set();
  if (text.length <= size) return new Set([text]);
  const out = new Set();
  for (let index = 0; index <= text.length - size; index += 1) {
    out.add(text.slice(index, index + size));
  }
  return out;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const item of a) if (b.has(item)) common += 1;
  return common / (a.size + b.size - common);
}

function tokenCoverage(queryTokens, candidateTokens) {
  if (!queryTokens.length || !candidateTokens.length) return 0;
  let total = 0;

  for (const token of queryTokens) {
    let best = 0;
    for (const candidate of candidateTokens) {
      const score = stringSimilarity(token, candidate);
      if (score > best) best = score;
      if (best >= 1) break;
    }
    total += best;
  }

  return total / queryTokens.length;
}

export function rankSearch(query, rows, limit) {
  const variants = buildQueryVariants(query);
  const qn = normalizeText(query);
  const qt = new Set(splitTokens(qn));
  const scored = [];

  for (const row of rows) {
    const name = row.normalized_name || '';
    const rel = row.normalized_path || '';
    const searchText = row.search_text || `${name} ${rel}`;
    const candidateTokens = splitTokens(`${name} ${rel} ${searchText}`);
    const candidateTokenSet = new Set(candidateTokens);
    const nameNgrams = buildNgrams(name);
    const relNgrams = buildNgrams(rel);
    const searchNgrams = buildNgrams(searchText);

    let score = 0;
    for (const variant of variants) {
      const variantTokens = splitTokens(variant);
      const variantNgrams = buildNgrams(variant);
      const directMatch =
        name.includes(variant) || rel.includes(variant) || searchText.includes(variant) ? 1 : 0;
      const ratioScore = Math.max(ratio(variant, name), ratio(variant, rel), ratio(variant, searchText));
      const overlap = variantTokens.length
        ? variantTokens.filter((token) => candidateTokenSet.has(token)).length / variantTokens.length
        : 0;
      const tokenScore = tokenCoverage(variantTokens, candidateTokens);
      const ngramScore = Math.max(
        jaccard(variantNgrams, nameNgrams),
        jaccard(variantNgrams, relNgrams),
        jaccard(variantNgrams, searchNgrams)
      );
      const typoScore = Math.max(
        stringSimilarity(variant, name),
        stringSimilarity(variant, rel),
        stringSimilarity(variant, searchText)
      );

      const variantScore =
        directMatch * 0.34 +
        ratioScore * 0.14 +
        overlap * 0.16 +
        tokenScore * 0.24 +
        ngramScore * 0.12 +
        typoScore * 0.2;

      if (variantScore > score) score = variantScore;
    }

    if (score >= 0.31) {
      scored.push({ ...row, score: Number(score.toFixed(4)) });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.depth !== b.depth) return a.depth - b.depth;
    return String(a.name).localeCompare(String(b.name), 'ru');
  });

  const dedup = new Map();
  for (const item of scored) {
    if (!dedup.has(item.id)) dedup.set(item.id, item);
    if (dedup.size >= limit) break;
  }

  return [...dedup.values()];
}

export function buildSessionId() {
  return randomUUID().slice(0, 8);
}
