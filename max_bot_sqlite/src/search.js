import { randomUUID } from 'node:crypto';

const ruToLat = new Map([
  ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'], ['ё', 'e'],
  ['ж', 'j'], ['з', 'z'], ['и', 'i'], ['й', 'i'], ['к', 'k'], ['л', 'l'], ['м', 'm'],
  ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'], ['с', 's'], ['т', 't'], ['у', 'u'],
  ['ф', 'f'], ['х', 'h'], ['ц', 'c'], ['ч', 'ch'], ['ш', 'sh'], ['щ', 'sh'],
  ['ъ', ''], ['ы', 'y'], ['ь', ''], ['э', 'e'], ['ю', 'yu'], ['я', 'ya'],
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

export function buildQueryVariants(query) {
  const norm = normalizeText(query);
  if (!norm) return [];

  const variants = [norm];
  const lat = translitToLatin(norm);
  if (lat && !variants.includes(lat)) variants.push(lat);

  for (const token of norm.split(' ')) {
    const syns = synonyms[token] || [];
    for (const syn of syns) {
      const v = normalizeText(syn);
      if (v && !variants.includes(v)) variants.push(v);
    }
  }

  return variants;
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

export function rankSearch(query, rows, limit) {
  const qn = normalizeText(query);
  const qt = new Set(qn.split(' ').filter(Boolean));
  const scored = [];

  for (const row of rows) {
    const name = row.normalized_name || '';
    const rel = row.normalized_path || '';

    const r1 = ratio(qn, name);
    const r2 = ratio(qn, rel);

    let overlap = 0;
    if (qt.size) {
      const st = new Set(`${name} ${rel}`.split(' ').filter(Boolean));
      let common = 0;
      for (const t of qt) if (st.has(t)) common += 1;
      overlap = common / qt.size;
    }

    const score = Math.max(r1, r2) * 0.75 + overlap * 0.25;
    if (score >= 0.35) {
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
