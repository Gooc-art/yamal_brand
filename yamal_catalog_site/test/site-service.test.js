import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOT_ID, SiteCatalogService, buildBreadcrumbs, humanFileSize } from '../src/site-service.js';

function makeFakeDb() {
  const items = new Map([
    [ROOT_ID, { id: ROOT_ID, parent_id: '', type: 'folder', name: 'Макеты1', relative_path: '.', is_active: 1 }],
    ['logo', { id: 'logo', parent_id: ROOT_ID, type: 'folder', name: 'Логотип', relative_path: 'Логотип', is_active: 1 }],
    ['souvenir', { id: 'souvenir', parent_id: ROOT_ID, type: 'folder', name: 'Каталог сувенирной продукции', relative_path: 'Каталог сувенирной продукции', is_active: 1 }],
    ['master', { id: 'master', parent_id: ROOT_ID, type: 'folder', name: 'Брендбук ЯМАЛ Мастер бренд', relative_path: 'Брендбук ЯМАЛ Мастер бренд', is_active: 1 }],
    ['logo-file', { id: 'logo-file', parent_id: 'logo', type: 'file', name: 'Логотип основной вариант для печати финальный.pdf', relative_path: 'Логотип/Логотип основной вариант для печати финальный.pdf', extension: 'pdf', size_bytes: 2048, modified_utc: '2026-03-08T00:00:00Z', is_active: 1, normalized_name: 'логотип основной вариант для печати финальный', normalized_path: 'логотип логотип основной вариант для печати финальный pdf', search_text: 'логотип основной вариант pdf' }],
  ]);

  return {
    getById(id) {
      return items.get(id) || null;
    },
    listChildren(parentId) {
      return [...items.values()].filter((item) => item.parent_id === parentId);
    },
    countChildren(parentId) {
      return [...items.values()].filter((item) => item.parent_id === parentId).length;
    },
    searchByVariants() {
      return [items.get('logo-file')];
    },
    allSearchCandidates() {
      return [items.get('logo-file')];
    },
    stats() {
      return { total: items.size, files: 1, folders: items.size - 1 };
    },
  };
}

function makeFakeState() {
  const calls = [];
  return {
    calls,
    getTopItems() {
      return [];
    },
    getTopSearches() {
      return [{ sample_query: 'логотип', uses: 4 }];
    },
    stats() {
      return { total_searches: 5, empty_searches: 1 };
    },
    logSearch(query, total) {
      calls.push(['search', query, total]);
    },
    trackItemEvent(item, type) {
      calls.push(['item', item.id, type]);
    },
  };
}

test('helpers format file size and breadcrumbs', () => {
  assert.equal(humanFileSize(2048), '2 KB');
  const db = makeFakeDb();
  const crumbs = buildBreadcrumbs(db.getById('logo-file'), db);
  assert.deepEqual(crumbs.map((item) => item.id), [ROOT_ID, 'logo', 'logo-file']);
});

test('site bootstrap uses fallback favorites and root sections', () => {
  const service = new SiteCatalogService({
    db: makeFakeDb(),
    state: makeFakeState(),
    rootPath: '/tmp',
    pageSize: 12,
    favoritesLimit: 4,
    siteTitle: 'Test',
  });

  const payload = service.getBootstrap();
  assert.equal(payload.title, 'Test');
  assert.equal(payload.sections.length >= 3, true);
  assert.equal(payload.favorites.length > 0, true);
  assert.equal(payload.topSearches[0].query, 'логотип');
});

test('site folder and search responses log usage and shorten file label', () => {
  const state = makeFakeState();
  const service = new SiteCatalogService({
    db: makeFakeDb(),
    state,
    rootPath: '/tmp',
    pageSize: 12,
    favoritesLimit: 4,
  });

  const folder = service.getFolder('logo', 0);
  assert.equal(folder.items[0].label, 'Основной • PDF');
  assert.deepEqual(state.calls[0], ['item', 'logo', 'open_folder']);

  const search = service.search('логотип');
  assert.equal(search.total, 1);
  assert.deepEqual(state.calls.at(-1), ['search', 'логотип', 1]);
});
