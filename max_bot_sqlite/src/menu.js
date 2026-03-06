export const MENU_SECTIONS = [
  {
    key: 'logos',
    title: 'Логотипы и знаки',
    folderNames: ['Логотип', 'Детский логотип', 'Логотипы городов', 'Фирменный знак'],
  },
  {
    key: 'brandbooks',
    title: 'Брендбуки',
    folderNames: ['Брендбук ЯМАЛ 100', 'Брендбук ЯМАЛ Мастер бренд'],
  },
  {
    key: 'illustrations',
    title: 'Иллюстрации и SVG',
    folderNames: ['Иллюстрации мастер-бренда SVG-элементы'],
  },
  {
    key: 'fonts',
    title: 'Шрифты',
    folderNames: ['Шрифт'],
  },
  {
    key: 'souvenirs',
    title: 'Сувенирная продукция',
    folderNames: ['Каталог сувенирной продукции'],
  },
];

export const QUICK_SEARCHES = [
  { key: 'logo', label: 'Логотип', query: 'логотип' },
  { key: 'brandbook', label: 'Брендбук', query: 'брендбук' },
  { key: 'font', label: 'Шрифт', query: 'шрифт' },
  { key: 'souvenir', label: 'Сувенир', query: 'сувенир' },
];

export function resolveMenuSections(rootItems) {
  const byName = new Map(rootItems.map((item) => [item.name, item]));

  return MENU_SECTIONS.map((section) => {
    const items = section.folderNames.map((name) => byName.get(name)).filter(Boolean);
    if (!items.length) return null;

    return {
      ...section,
      items,
      kind: items.length === 1 ? 'direct' : 'group',
      targetId: items.length === 1 ? items[0].id : null,
    };
  }).filter(Boolean);
}

export function getSectionByKey(key) {
  return MENU_SECTIONS.find((section) => section.key === key) || null;
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
