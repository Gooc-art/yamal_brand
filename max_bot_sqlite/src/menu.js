export const ROOT_MENU_FOLDERS = [
  { folderName: 'Логотип', label: 'Логотип', icon: '🏷️' },
  { folderName: 'Фирменный знак', label: 'Фирменный знак', icon: '🔰' },
  { folderName: 'Детский логотип', label: 'Детский логотип', icon: '🧒' },
  { folderName: 'Логотипы городов', label: 'Логотипы городов', icon: '🏙️' },
  { folderName: 'Паттерны', label: 'Паттерны', icon: '🧩' },
  { folderName: 'Брендбук ЯМАЛ 100', label: 'Брендбук ЯМАЛ 100', icon: '📘' },
  { folderName: 'Брендбук ЯМАЛ Мастер бренд', label: 'Мастер-бренд', icon: '📕' },
  { folderName: 'Брендбук Салехард', label: 'Брендбук Салехард', icon: '📗' },
  { folderName: 'Брендбук Новый Уренгой', label: 'Брендбук Н. Уренгой', icon: '📙' },
  { folderName: 'Брендбук Ноябрьск', label: 'Брендбук Ноябрьск', icon: '📒' },
  { folderName: 'Иллюстрации мастер-бренда SVG-элементы', label: 'Иллюстрации и SVG', icon: '🖼️' },
  { folderName: 'Шрифт', label: 'Шрифт', icon: '🔤' },
  { folderName: 'Каталог сувенирной продукции', label: 'Сувенирная продукция', icon: '🎁' },
];

export const QUICK_SEARCHES = [
  { key: 'logo', label: 'Логотип', query: 'логотип' },
  { key: 'brandbook', label: 'Брендбук', query: 'брендбук' },
  { key: 'city', label: 'Город', query: 'город' },
  { key: 'pattern', label: 'Паттерн', query: 'паттерн' },
  { key: 'font', label: 'Шрифт', query: 'шрифт' },
  { key: 'souvenir', label: 'Сувенир', query: 'сувенир' },
];

const SECTION_HINTS = {
  'Логотип': 'Выберите тип логотипа или готовый формат.',
  'Фирменный знак': 'Здесь собраны знак отдельно и знак с надписью ЯМАЛ.',
  'Логотипы городов': 'Выберите город, затем цветовой вариант.',
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

function cleanupFolderLabel(name) {
  return String(name || '')
    .replace(/^\d+(?:[.-]\d+)*\s*[-.)]?\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fileExt(name) {
  const match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

function fileConfig(item) {
  const ext = fileExt(item?.name);
  return {
    label: item?.name || '',
    icon: FILE_ICONS[ext] || '📄',
  };
}

function folderConfig(parentName, itemName) {
  return (
    PARENT_SPECIFIC_LABELS[parentName]?.[itemName] ||
    GENERIC_FOLDER_LABELS[itemName] || {
      label: cleanupFolderLabel(itemName),
      icon: '📁',
    }
  );
}

export function resolveRootMenuFolders(rootItems) {
  const byName = new Map(rootItems.map((item) => [item.name, item]));
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
      label: item.name,
      icon: '📁',
    }));

  return [...ordered, ...rest];
}

export function getQuickSearchByKey(key) {
  return QUICK_SEARCHES.find((item) => item.key === key) || null;
}

export function getSectionHint(itemOrName) {
  const name = typeof itemOrName === 'string' ? itemOrName : itemOrName?.name;
  return SECTION_HINTS[name] || '';
}

export function decorateFolderItems(parentItem, items) {
  const parentName = parentItem?.name || '';
  const decorated = items.map((item) => {
    if (item.type === 'file') {
      const config = fileConfig(item);
      return {
        ...item,
        label: config.label,
        icon: config.icon,
      };
    }

    const config = folderConfig(parentName, item.name);
    return {
      ...item,
      label: config.label,
      icon: config.icon,
    };
  });

  if (!/^Брендбук /u.test(parentName)) {
    return decorated;
  }

  return decorated.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'file' ? -1 : 1;
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
