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
