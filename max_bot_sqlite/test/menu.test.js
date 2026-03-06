import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUICK_SEARCHES,
  getQuickSearchByKey,
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
  ];

  const menuFolders = resolveRootMenuFolders(rootItems);
  assert.deepEqual(
    menuFolders.map((item) => item.name),
    [
      'Логотип',
      'Фирменный знак',
      'Детский логотип',
      'Логотипы городов',
      'Брендбук ЯМАЛ 100',
      'Брендбук ЯМАЛ Мастер бренд',
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
      'Брендбук ЯМАЛ 100',
      'Мастер-бренд',
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
  assert.equal(QUICK_SEARCHES.length, 4);

  const result = paginateItems([1, 2, 3, 4, 5], 9, 2);
  assert.equal(result.page, 2);
  assert.equal(result.maxPage, 2);
  assert.deepEqual(result.items, [5]);
});
