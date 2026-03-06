import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUICK_SEARCHES,
  decorateFolderItems,
  getMainMenuQuickSearches,
  getQuickSearchByKey,
  getSectionHint,
  paginateItems,
  resolveRootMenuFolders,
} from '../src/menu.js';

test('resolveRootMenuFolders builds full top-level button structure in configured order', () => {
  const rootItems = [
    { id: 'a', name: 'Шрифт', type: 'folder' },
    { id: 'b', name: 'Логотип', type: 'folder' },
    { id: 'c', name: 'Каталог сувенирной продукции', type: 'folder' },
    { id: 'd', name: 'Брендбук ЯМАЛ Мастер бренд', type: 'folder' },
    { id: 'e', name: 'Фирменный знак', type: 'folder' },
    { id: 'f', name: 'Иллюстрации мастер-бренда SVG-элементы', type: 'folder' },
    { id: 'g', name: 'Детский логотип', type: 'folder' },
    { id: 'h', name: 'Логотипы городов', type: 'folder' },
    { id: 'i', name: 'Брендбук ЯМАЛ 100', type: 'folder' },
    { id: 'j', name: 'Паттерны', type: 'folder' },
    { id: 'k', name: 'Брендбук Салехард', type: 'folder' },
    { id: 'l', name: 'Брендбук Новый Уренгой', type: 'folder' },
    { id: 'm', name: 'Брендбук Ноябрьск', type: 'folder' },
  ];

  const menuFolders = resolveRootMenuFolders(rootItems);
  assert.deepEqual(
    menuFolders.map((item) => item.name),
    [
      'Логотип',
      'Фирменный знак',
      'Детский логотип',
      'Логотипы городов',
      'Паттерны',
      'Брендбук ЯМАЛ 100',
      'Брендбук ЯМАЛ Мастер бренд',
      'Брендбук Салехард',
      'Брендбук Новый Уренгой',
      'Брендбук Ноябрьск',
      'Иллюстрации мастер-бренда SVG-элементы',
      'Шрифт',
      'Каталог сувенирной продукции',
    ]
  );
  assert.deepEqual(
    menuFolders.map((item) => item.label),
    [
      'Логотип',
      'Фирменный знак',
      'Детский логотип',
      'Логотипы городов',
      'Паттерны',
      'Брендбук ЯМАЛ 100',
      'Мастер-Бренд',
      'Брендбук Салехард',
      'Брендбук Н. Уренгой',
      'Брендбук Ноябрьск',
      'Иллюстрации и SVG',
      'Шрифт',
      'Сувенирная продукция',
    ]
  );
});

test('resolveRootMenuFolders appends unknown root folders after known sections', () => {
  const rootItems = [
    { id: 'a', name: 'Шрифт', type: 'folder' },
    { id: 'b', name: ', новый раздел', type: 'folder' },
    { id: 'c', name: 'Логотип', type: 'folder' },
  ];

  const menuFolders = resolveRootMenuFolders(rootItems);
  assert.equal(menuFolders.at(-1)?.name, ', новый раздел');
  assert.equal(menuFolders.at(-1)?.label, 'Новый раздел');
  assert.equal(menuFolders.at(-1)?.icon, '📁');
});

test('menu helpers return configured quick search and paginate items', () => {
  assert.equal(getQuickSearchByKey('font')?.query, 'шрифт');
  assert.equal(getQuickSearchByKey('pattern')?.query, 'паттерн');
  assert.equal(QUICK_SEARCHES.length, 6);
  assert.deepEqual(getMainMenuQuickSearches().map((item) => item.label), ['Шрифт']);
  assert.deepEqual(QUICK_SEARCHES.map((item) => item.label), [
    'Логотип',
    'Брендбук',
    'Город',
    'Паттерн',
    'Шрифт',
    'Сувенир',
  ]);

  const result = paginateItems([1, 2, 3, 4, 5], 9, 2);
  assert.equal(result.page, 2);
  assert.equal(result.maxPage, 2);
  assert.deepEqual(result.items, [5]);
});

test('decorateFolderItems shortens and enriches known section children', () => {
  const parent = { name: 'Каталог сувенирной продукции' };
  const items = [
    { id: '1', name: '1-Сувенирная продукция', type: 'folder' },
    { id: '2', name: '3-Полиграфия и уличная навигация', type: 'folder' },
    { id: '3', name: '1-1 детские футболки', type: 'folder' },
    {
      id: '4',
      name: 'Детские футболки белые.pdf',
      type: 'file',
      relative_path: 'Каталог сувенирной продукции/1-Сувенирная продукция/1-1 детские футболки/Детские футболки белые.pdf',
    },
  ];

  const decorated = decorateFolderItems(parent, items);
  const byName = new Map(decorated.map((item) => [item.name, item]));
  assert.equal(byName.get('1-Сувенирная продукция')?.label, 'Сувениры');
  assert.equal(byName.get('1-Сувенирная продукция')?.icon, '🎁');
  assert.equal(byName.get('3-Полиграфия и уличная навигация')?.label, 'Полиграфия и навигация');
  assert.equal(byName.get('3-Полиграфия и уличная навигация')?.icon, '🪧');
  assert.equal(byName.get('1-1 детские футболки')?.label, 'Детские футболки');
  assert.equal(byName.get('1-1 детские футболки')?.icon, '👕');
  assert.equal(byName.get('Детские футболки белые.pdf')?.label, 'Белые • PDF');
  assert.equal(byName.get('Детские футболки белые.pdf')?.icon, '📕');
});

test('decorateFolderItems strips leading punctuation and capitalizes generic labels', () => {
  const parent = { name: 'Каталог сувенирной продукции' };
  const items = [
    { id: '1', name: ',, наклейки', type: 'folder' },
    { id: '2', name: '...брендбук.pdf', type: 'file' },
  ];

  const decorated = decorateFolderItems(parent, items);
  const byName = new Map(decorated.map((item) => [item.name, item]));
  assert.equal(byName.get(',, наклейки')?.label, 'Наклейки');
  assert.equal(byName.get('...брендбук.pdf')?.label, 'Брендбук • PDF');
  assert.equal(byName.get('...брендбук.pdf')?.icon, '📕');
});

test('decorateFolderItems prioritizes direct brandbook files and exposes section hints', () => {
  const parent = { name: 'Брендбук ЯМАЛ 100' };
  const items = [
    { id: '1', name: 'Файлы', type: 'folder' },
    { id: '2', name: 'Ямал 100 брендбук.pdf', type: 'file' },
  ];

  const decorated = decorateFolderItems(parent, items);
  assert.equal(decorated[0].type, 'file');
  assert.equal(decorated[0].label, 'Брендбук • PDF');
  assert.equal(decorated[0].icon, '📕');
  assert.equal(decorated[1].label, 'Файлы и исходники');
  assert.match(getSectionHint(parent), /сразу открыть PDF/u);
});

test('decorateFolderItems unifies style folders and short file format buttons', () => {
  const parent = { name: '2. Color' };
  const items = [
    { id: '1', name: 'Логотип_Color.png', type: 'file' },
    { id: '2', name: 'Логотип_Color.ai', type: 'file' },
    { id: '3', name: 'Логотип_Color.pdf', type: 'file' },
  ];

  const decorated = decorateFolderItems(parent, items);
  assert.deepEqual(
    decorated.map((item) => item.label),
    ['AI', 'PDF', 'PNG']
  );
  assert.equal(getSectionHint(parent), 'Выберите формат файла.');
});
