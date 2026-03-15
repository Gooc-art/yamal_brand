export const ROOT_MENU_FOLDERS = [
  { folderName: 'Логотип', label: 'Логотип', icon: '🏷️' },
  { folderName: 'Фирменный знак', label: 'Фирменный знак', icon: '🔰' },
  { folderName: 'Детский логотип', label: 'Детский логотип', icon: '🧒' },
  { folderName: 'Паттерны', label: 'Паттерны', icon: '🧩' },
  { folderName: 'Брендбук ЯМАЛ 100', label: 'Брендбук ЯМАЛ 100', icon: '📘' },
  { folderName: 'Брендбук ЯМАЛ Мастер бренд', label: 'Мастер-Бренд', icon: '📕' },
  { folderName: 'Брендбук Салехард', label: 'Брендбук Салехард', icon: '📗' },
  { folderName: 'Брендбук Новый Уренгой', label: 'Брендбук Н. Уренгой', icon: '📙' },
  { folderName: 'Брендбук Ноябрьск', label: 'Брендбук Ноябрьск', icon: '📒' },
  { folderName: 'Иллюстрации мастер-бренда SVG-элементы', label: 'Иллюстрации и SVG', icon: '🖼️' },
  { folderName: 'Каталог сувенирной продукции', label: 'Сувенирная продукция', icon: '🎁' },
];

const HIDDEN_ROOT_FOLDERS = new Set(['Шрифт']);

export const QUICK_SEARCHES = [
  { key: 'logo', label: 'Логотип', query: 'логотип' },
  { key: 'brandbook', label: 'Брендбук', query: 'брендбук' },
  { key: 'pattern', label: 'Паттерн', query: 'паттерн' },
  { key: 'font', label: 'Шрифт', query: 'шрифт' },
  { key: 'souvenir', label: 'Сувенир', query: 'сувенир' },
];

export function getMainMenuQuickSearches() {
  return QUICK_SEARCHES.filter((item) => item.key === 'font');
}

const SECTION_HINTS = {
  'Логотип': 'Выберите тип логотипа или готовый формат.',
  'Фирменный знак': 'Здесь собраны знак отдельно и знак с надписью ЯМАЛ.',
  'Паттерны': 'Выберите город и скачайте готовые паттерны.',
  'Каталог сувенирной продукции': 'Выберите категорию носителей и материалов.',
  'Шрифт': 'Здесь лежат архивы шрифтов и отдельный файл начертания.',
  'Брендбук ЯМАЛ 100': 'Можно сразу открыть PDF или перейти в папку с файлами.',
  'Брендбук ЯМАЛ Мастер бренд': 'Можно сразу открыть брендбук или перейти в папку с файлами.',
  'Брендбук Салехард': 'Можно сразу открыть PDF или перейти в папку с файлами.',
  'Брендбук Новый Уренгой': 'Можно сразу открыть PDF или перейти в папку с файлами.',
  'Брендбук Ноябрьск': 'Можно сразу открыть PDF или перейти в папку с файлами.',
};

const PARENT_SPECIFIC_LABELS = {
  'Каталог сувенирной продукции': {
    '1-Сувенирная продукция': { label: 'Сувениры', icon: '🎁' },
    '2-Канцелярия': { label: 'Канцелярия', icon: '📝' },
    '3-Полиграфия и уличная навигация': { label: 'Полиграфия и навигация', icon: '🪧' },
    '4-Диджитал': { label: 'Диджитал', icon: '💻' },
    'Шрифты': { label: 'Шрифты', icon: '🔤' },
  },
  'Логотип': {
    'Логотип': { label: 'Базовый логотип', icon: '🏷️' },
    'Логотип с охранным полем': { label: 'С охранным полем', icon: '🛡️' },
    'Угловые логотипы': { label: 'Угловые логотипы', icon: '📐' },
    'Ямал 95': { label: 'Ямал 95', icon: '⭐' },
  },
  'Фирменный знак': {
    'Ямал': { label: 'Знак', icon: '🔰' },
    'Ямал надпись': { label: 'Знак + ЯМАЛ', icon: '✍️' },
  },
  'Логотипы городов': {
    'Новый Уренгой': { label: 'Новый Уренгой', icon: '🏙️' },
    'Ноябрьск': { label: 'Ноябрьск', icon: '🏙️' },
    'Салехард': { label: 'Салехард', icon: '🏙️' },
  },
  'Паттерны': {
    'Новый Уренгой': { label: 'Новый Уренгой', icon: '🧩' },
    'Ноябрьск': { label: 'Ноябрьск', icon: '🧩' },
    'Салехард': { label: 'Салехард', icon: '🧩' },
  },
  'Угловые логотипы': {
    'Левый верхний': { label: 'Левый верхний', icon: '↖️' },
    'Левый нижний': { label: 'Левый нижний', icon: '↙️' },
    'Правый верхний': { label: 'Правый верхний', icon: '↗️' },
    'Правый нижний': { label: 'Правый нижний', icon: '↘️' },
  },
};

const GENERIC_FOLDER_LABELS = {
  'Файлы': { label: 'Файлы и исходники', icon: '🗂️' },
  '1. CMYK для печати': { label: 'CMYK для печати', icon: '🖨️' },
  '2. Color': { label: 'Color', icon: '🎨' },
  '3. Black': { label: 'Black', icon: '⚫' },
  '4. White': { label: 'White', icon: '⚪' },
  'PNG': { label: 'PNG', icon: '🖼️' },
  'Вектор': { label: 'Вектор', icon: '🧩' },
};

const FILE_ICONS = {
  ai: '🎨',
  cdr: '🎨',
  eps: '🎨',
  jpg: '🖼️',
  jpeg: '🖼️',
  pdf: '📕',
  png: '🖼️',
  svg: '🧩',
  zip: '🗜️',
  otf: '🔤',
  ttf: '🔤',
};

const FORMAT_LABELS = {
  ai: 'AI',
  cdr: 'CDR',
  eps: 'EPS',
  jpg: 'JPG',
  jpeg: 'JPG',
  pdf: 'PDF',
  png: 'PNG',
  svg: 'SVG',
  zip: 'ZIP',
  otf: 'OTF',
  ttf: 'TTF',
};

const FORMAT_ORDER = {
  ai: 0,
  cdr: 1,
  eps: 2,
  pdf: 3,
  png: 4,
  jpg: 5,
  jpeg: 5,
  svg: 6,
  zip: 7,
  otf: 8,
  ttf: 9,
};

const STYLE_FOLDER_NAMES = new Set([
  '1. CMYK для печати',
  '2. Color',
  '3. Black',
  '4. White',
]);

const LOW_VALUE_FILE_PATTERNS = [
  /(^|\s)(?:исходник(?:и)?|макет(?:ы)?|вариант(?:ы)?|версия|копия|copy|final)(?=\s|$)/giu,
  /(^|\s)финальн(?:ый|ая|ое|ые)(?=\s|$)/giu,
  /(^|\s)готов(?:ый|ая|ое|ые)(?=\s|$)/giu,
  /(^|\s)(?:для\s+печати|для\s+экрана)(?=\s|$)/giu,
];

function upperFirst(value) {
  const text = String(value || '');
  return text ? `${text.slice(0, 1).toUpperCase()}${text.slice(1)}` : text;
}

function normalizeButtonLabel(name, { stripNumericPrefix = true } = {}) {
  let text = String(name || '');
  if (stripNumericPrefix) {
    text = text.replace(/^\d+(?:[.-]\d+)*\s*[-.)]?\s*/u, '');
  }

  return upperFirst(
    text
      .replace(/^[\s,.;:!?'"`~\-–—_()[\]{}<>«»/\\|]+/u, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function cleanupFolderLabel(name) {
  return normalizeButtonLabel(name);
}

function stripFileExtension(name) {
  return String(name || '').replace(/\.[^.]+$/u, '');
}

function cleanupFileStem(name) {
  return normalizeButtonLabel(
    stripFileExtension(name).replace(/[_]+/gu, ' '),
    { stripNumericPrefix: false }
  );
}

function stripLowValueFilePhrases(value) {
  let text = String(value || '');
  for (const pattern of LOW_VALUE_FILE_PATTERNS) {
    text = text.replace(pattern, ' ');
  }
  return text.replace(/\s+/gu, ' ').trim();
}

function dedupeWords(value) {
  const out = [];
  const seen = new Set();
  for (const word of String(value || '').split(/\s+/u).filter(Boolean)) {
    const key = word.toLowerCase().replace(/ё/gu, 'е');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(word);
  }
  return out.join(' ');
}

function shortenLongLabel(value, maxWords = 4) {
  const words = String(value || '').split(/\s+/u).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

function splitWords(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/gu, 'е')
    .replace(/[^0-9a-zа-я]+/giu, ' ')
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function collectContextPhrases(item, parentName) {
  const rawParts = [
    parentName,
    ...String(item?.relative_path || '')
      .split('/')
      .slice(-4, -1),
  ];

  return [...new Set(rawParts.map((part) => cleanupFolderLabel(part)).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
}

function removeContextPhrases(label, phrases) {
  let text = String(label || '');
  for (const phrase of phrases) {
    if (!phrase || phrase.length < 4) continue;
    text = text.replace(new RegExp(`(^|\\s)${escapeRegex(phrase)}(?=\\s|$)`, 'iu'), ' ');
  }
  return text.replace(/\s+/gu, ' ').trim();
}

function inferFileKind(text) {
  const source = String(text || '').toLowerCase();
  if (/брендбук/u.test(source)) return 'Брендбук';
  if (/логотип/u.test(source)) return 'Логотип';
  if (/знак/u.test(source)) return 'Знак';
  if (/паттерн/u.test(source)) return 'Паттерн';
  if (/шрифт/u.test(source)) return 'Шрифт';
  if (/иллюстра|svg/u.test(source)) return 'Иллюстрация';
  if (/сувенир|мерч|макет/u.test(source)) return 'Макет';
  return '';
}

function cleanupFileLabel(item, parentName, ext) {
  const stem = cleanupFileStem(item?.name || '');
  const contextPhrases = collectContextPhrases(item, parentName);
  const contextWords = new Set(contextPhrases.flatMap((value) => splitWords(value)));
  let main = removeContextPhrases(stem, contextPhrases);
  main = stripLowValueFilePhrases(main);
  main = dedupeWords(main);
  main = shortenLongLabel(main);
  const mainWords = splitWords(main);

  if (!main || (mainWords.length && mainWords.every((word) => contextWords.has(word)))) {
    main = inferFileKind(`${stem} ${parentName}`) || 'Файл';
  }
  main = upperFirst(main);

  const extLabel = FORMAT_LABELS[ext] || String(ext || '').toUpperCase();
  return [main, extLabel].filter(Boolean).join(' • ');
}

function fileExt(name) {
  const match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

function fileConfig(item, parentName) {
  const ext = fileExt(item?.name);
  const formatLabel = FORMAT_LABELS[ext];
  if (STYLE_FOLDER_NAMES.has(parentName) && formatLabel) {
    return {
      label: formatLabel,
      icon: FILE_ICONS[ext] || '📄',
      order: FORMAT_ORDER[ext] ?? 999,
    };
  }
  return {
    label: cleanupFileLabel(item, parentName, ext) || item?.name || 'Файл',
    icon: FILE_ICONS[ext] || '📄',
    order: FORMAT_ORDER[ext] ?? 999,
  };
}

function inferFolderIcon(parentName, label) {
  const haystack = `${parentName} ${label}`.toLowerCase();
  if (/футбол|худи|свитшот|толстов|майк|одеж|кеп|панам|шапк/u.test(haystack)) return '👕';
  if (/круж|термос|бутыл|стакан/u.test(haystack)) return '🥤';
  if (/ручк|карандаш|маркер/u.test(haystack)) return '✏️';
  if (/блокнот|тетрад|ежеднев|планер/u.test(haystack)) return '📒';
  if (/пакет|шоппер|сумк|рюкзак/u.test(haystack)) return '👜';
  if (/стикер|наклей/u.test(haystack)) return '🏷️';
  if (/значок|пин/u.test(haystack)) return '📌';
  if (/флеш/u.test(haystack)) return '💾';
  if (/зонт/u.test(haystack)) return '☂️';
  if (/плед/u.test(haystack)) return '🧶';
  if (/буклет|листов|плакат|баннер|навигац|таблич|полиграф/u.test(haystack)) return '🪧';
  if (/диджитал|сайт|экран|презент|соцсет/u.test(haystack)) return '💻';
  if (/шрифт/u.test(haystack)) return '🔤';
  return '📁';
}

function folderConfig(parentName, itemName) {
  const fallbackLabel = cleanupFolderLabel(itemName);
  return (
    PARENT_SPECIFIC_LABELS[parentName]?.[itemName] ||
    GENERIC_FOLDER_LABELS[itemName] || {
      label: fallbackLabel,
      icon: inferFolderIcon(parentName, fallbackLabel),
    }
  );
}

export function resolveRootMenuFolders(rootItems) {
  const byName = new Map(
    rootItems
      .filter((item) => !HIDDEN_ROOT_FOLDERS.has(item.name))
      .map((item) => [item.name, item])
  );
  const ordered = [];

  for (const config of ROOT_MENU_FOLDERS) {
    const item = byName.get(config.folderName);
    if (!item) continue;
    ordered.push({
      ...item,
      label: config.label,
      icon: config.icon,
    });
    byName.delete(config.folderName);
  }

  const rest = [...byName.values()]
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'ru'))
    .map((item) => ({
      ...item,
      label: cleanupFolderLabel(item.name) || item.name,
      icon: '📁',
    }));

  return [...ordered, ...rest];
}

export function getQuickSearchByKey(key) {
  return QUICK_SEARCHES.find((item) => item.key === key) || null;
}

export function getSectionHint(itemOrName) {
  const name = typeof itemOrName === 'string' ? itemOrName : itemOrName?.name;
  if (STYLE_FOLDER_NAMES.has(name)) return 'Выберите формат файла.';
  if (name === '1-Сувенирная продукция') return 'Выберите категорию сувениров.';
  if (name === '2-Канцелярия') return 'Выберите тип канцелярии.';
  if (name === '3-Полиграфия и уличная навигация') return 'Выберите тип носителя.';
  if (name === '4-Диджитал') return 'Выберите цифровой носитель.';
  if (name === 'Ямал 95') return 'Выберите PNG или вектор.';
  return SECTION_HINTS[name] || '';
}

export function decorateFolderItems(parentItem, items) {
  const parentName = parentItem?.name || '';
  const decorated = items.map((item) => {
    if (item.type === 'file') {
      const config = fileConfig(item, parentName);
      return {
        ...item,
        label: config.label,
        icon: config.icon,
        sortRank: config.order ?? 999,
      };
    }

    const config = folderConfig(parentName, item.name);
    return {
      ...item,
      label: config.label,
      icon: config.icon,
      sortRank: 0,
    };
  });

  return decorated.sort((a, b) => {
    if (/^Брендбук /u.test(parentName) && a.type !== b.type) {
      return a.type === 'file' ? -1 : 1;
    }
    if (STYLE_FOLDER_NAMES.has(parentName) && a.type === 'file' && b.type === 'file') {
      if ((a.sortRank ?? 999) !== (b.sortRank ?? 999)) {
        return (a.sortRank ?? 999) - (b.sortRank ?? 999);
      }
    }
    return String(a.name).localeCompare(String(b.name), 'ru');
  });
}

export function paginateItems(items, page, pageSize) {
  const total = items.length;
  const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  const safePage = Number.isFinite(page) && page >= 0 ? page : 0;
  const pageClamped = Math.min(safePage, maxPage);
  const offset = pageClamped * pageSize;

  return {
    total,
    maxPage,
    page: pageClamped,
    items: items.slice(offset, offset + pageSize),
  };
}
