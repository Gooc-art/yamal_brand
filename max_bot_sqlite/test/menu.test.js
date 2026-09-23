import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanupFolderLabel,
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
    { id: 'a', name: '03 Фирменные стили МО', type: 'folder' },
    { id: 'b', name: '01 Мастер-бренд Ямала', type: 'folder' },
    { id: 'c', name: '02 Ямал-100', type: 'folder' },
  ];

  const menuFolders = resolveRootMenuFolders(rootItems);
  assert.deepEqual(
    menuFolders.map((item) => item.name),
    [
      '01 Мастер-бренд Ямала',
      '02 Ямал-100',
      '03 Фирменные стили МО',
    ]
  );
  assert.deepEqual(
    menuFolders.map((item) => item.label),
    [
      'Мастер-бренд Ямала',
      'Ямал-100',
      'Фирменные стили МО',
    ]
  );
});

test('resolveRootMenuFolders appends unknown root folders after known sections', () => {
  const rootItems = [
    { id: 'a', name: '01 Мастер-бренд Ямала', type: 'folder' },
    { id: 'b', name: ', новый раздел', type: 'folder' },
    { id: 'c', name: '02 Ямал-100', type: 'folder' },
  ];

  const menuFolders = resolveRootMenuFolders(rootItems);
  assert.equal(menuFolders[0]?.name, '01 Мастер-бренд Ямала');
  assert.equal(menuFolders.at(-1)?.name, ', новый раздел');
  assert.equal(menuFolders.at(-1)?.label, 'Новый раздел');
  assert.equal(menuFolders.at(-1)?.icon, '📁');
});

test('menu helpers return configured quick search and paginate items', () => {
  assert.equal(getQuickSearchByKey('font')?.query, 'шрифт');
  assert.equal(getQuickSearchByKey('pattern')?.query, 'паттерн');
  assert.equal(QUICK_SEARCHES.length, 5);
  assert.deepEqual(getMainMenuQuickSearches(), []);
  assert.deepEqual(QUICK_SEARCHES.map((item) => item.label), [
    'Логотип',
    'Брендбук',
    'Паттерн',
    'Шрифт',
    'Иллюстрация',
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
  assert.equal(byName.get('Детские футболки белые.pdf')?.label, 'Детские футболки белые • PDF');
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

test('decorateFolderItems removes low-value file words and keeps meaningful short labels', () => {
  const parent = { name: 'Логотип' };
  const items = [
    {
      id: '1',
      name: 'Логотип основной вариант для печати финальный.pdf',
      type: 'file',
      relative_path: 'Логотип/Логотип основной вариант для печати финальный.pdf',
    },
  ];

  const decorated = decorateFolderItems(parent, items);
  assert.equal(decorated[0]?.label, 'Логотип основной • PDF');
});

test('decorateFolderItems prioritizes direct brandbook files and exposes section hints', () => {
  const parent = { name: 'Брендбук ЯМАЛ 100' };
  const items = [
    { id: '1', name: 'Файлы', type: 'folder' },
    { id: '2', name: 'Ямал 100 брендбук.pdf', type: 'file' },
  ];

  const decorated = decorateFolderItems(parent, items);
  assert.equal(decorated[0].type, 'file');
  assert.equal(decorated[0].label, 'Ямал 100 брендбук • PDF');
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

test('button labels preserve the file variant and format folders use matching icons', () => {
  const parent = { name: 'Знак с надписью «Я+Ямал»' };
  const decorated = decorateFolderItems(parent, [
    { type: 'file', name: 'Знак с надписью «Я + Ямал» White.svg' },
    { type: 'folder', name: 'svg' },
  ]);
  const file = decorated.find((item) => item.type === 'file');
  const folder = decorated.find((item) => item.type === 'folder');

  assert.equal(file.label, 'Знак с надписью «Я + Ямал» White • SVG');
  assert.deepEqual({ label: folder.label, icon: folder.icon }, { label: 'SVG', icon: '🧩' });
});

test('technical scaffold suffix is hidden from folder buttons', () => {
  const [item] = decorateFolderItems({ name: 'Ямал-100' }, [
    { type: 'folder', name: '02 Логотипы (каркас)' },
  ]);
  assert.equal(item.label, 'Логотипы');
  assert.equal(cleanupFolderLabel('03 Шрифты (каркас)'), 'Шрифты');
});

test('horizontal logo folders do not get the umbrella icon', () => {
  const [item] = decorateFolderItems({ name: 'Логотипы' }, [
    { type: 'folder', name: '01 Горизонтальный' },
  ]);
  assert.equal(item.icon, '📁');
});
