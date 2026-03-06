import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUICK_SEARCHES,
  getQuickSearchByKey,
  getSectionByKey,
  paginateItems,
  resolveMenuSections,
} from '../src/menu.js';

test('resolveMenuSections groups root folders into compact sections', () => {
  const rootItems = [
    { id: 'a', name: 'Логотип', type: 'folder' },
    { id: 'b', name: 'Детский логотип', type: 'folder' },
    { id: 'c', name: 'Логотипы городов', type: 'folder' },
    { id: 'd', name: 'Фирменный знак', type: 'folder' },
    { id: 'e', name: 'Брендбук ЯМАЛ 100', type: 'folder' },
    { id: 'f', name: 'Брендбук ЯМАЛ Мастер бренд', type: 'folder' },
    { id: 'g', name: 'Шрифт', type: 'folder' },
  ];

  const sections = resolveMenuSections(rootItems);
  assert.equal(sections.length, 3);
  assert.equal(sections[0].key, 'logos');
  assert.equal(sections[0].kind, 'group');
  assert.deepEqual(
    sections[0].items.map((item) => item.name),
    ['Логотип', 'Детский логотип', 'Логотипы городов', 'Фирменный знак']
  );
  assert.equal(sections[2].key, 'fonts');
  assert.equal(sections[2].kind, 'direct');
  assert.equal(sections[2].targetId, 'g');
});

test('menu helpers return configured section and quick search', () => {
  assert.equal(getSectionByKey('brandbooks')?.title, 'Брендбуки');
  assert.equal(getQuickSearchByKey('font')?.query, 'шрифт');
  assert.equal(QUICK_SEARCHES.length, 4);
});

test('paginateItems clamps page and slices items', () => {
  const result = paginateItems([1, 2, 3, 4, 5], 9, 2);
  assert.equal(result.page, 2);
  assert.equal(result.maxPage, 2);
  assert.deepEqual(result.items, [5]);
});
