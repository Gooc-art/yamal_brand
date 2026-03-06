import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUICK_SEARCHES,
  decorateFolderItems,
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
      'Мастер-бренд',
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
    { id: 'b', name: 'Новый раздел', type: 'folder' },
    { id: 'c', name: 'Логотип', type: 'folder' },
  ];

  const menuFolders = resolveRootMenuFolders(rootItems);
  assert.equal(menuFolders.at(-1)?.name, 'Новый раздел');
  assert.equal(menuFolders.at(-1)?.label, 'Новый раздел');
  assert.equal(menuFolders.at(-1)?.icon, '📁');
});

test('menu helpers return configured quick search and paginate items', () => {
  assert.equal(getQuickSearchByKey('font')?.query, 'шрифт');
  assert.equal(getQuickSearchByKey('pattern')?.query, 'паттерн');
  assert.equal(QUICK_SEARCHES.length, 6);

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
    { id: '4', name: 'guide.pdf', type: 'file' },
  ];

  const decorated = decorateFolderItems(parent, items);
  assert.equal(decorated[0].label, 'Сувениры');
  assert.equal(decorated[0].icon, '🎁');
  assert.equal(decorated[1].label, 'Полиграфия и навигация');
  assert.equal(decorated[1].icon, '🪧');
  assert.equal(decorated[2].label, 'детские футболки');
  assert.equal(decorated[2].icon, '📁');
  assert.equal(decorated[3].icon, '📕');
});

test('decorateFolderItems prioritizes direct brandbook files and exposes section hints', () => {
  const parent = { name: 'Брендбук ЯМАЛ 100' };
  const items = [
    { id: '1', name: 'Файлы', type: 'folder' },
    { id: '2', name: 'Ямал 100 брендбук.pdf', type: 'file' },
  ];

  const decorated = decorateFolderItems(parent, items);
  assert.equal(decorated[0].type, 'file');
  assert.equal(decorated[0].icon, '📕');
  assert.equal(decorated[1].label, 'Файлы и исходники');
  assert.match(getSectionHint(parent), /сразу открыть PDF/u);
});
