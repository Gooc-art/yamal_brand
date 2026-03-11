const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeRoute,
  routeFromUrl,
  buildRouteUrl,
  buildBrandRouteCards,
  buildBrandRoutesSummary,
  initialWorkspaceCollapsed,
} = require('../assets/app.js');

test('normalizeRoute keeps only valid folder routes', () => {
  assert.deepEqual(normalizeRoute({ view: 'folder', folderId: 'logo', page: '2', fileId: 'file1' }), {
    view: 'folder',
    folderId: 'logo',
    query: '',
    page: 2,
    fileId: 'file1',
  });

  assert.deepEqual(normalizeRoute({ view: 'folder', folderId: '', page: '-4', fileId: 'file1' }), {
    view: 'root',
    folderId: '',
    query: '',
    page: 0,
    fileId: 'file1',
  });
});

test('routeFromUrl parses search and file state from query string', () => {
  assert.deepEqual(
    routeFromUrl('https://brand.yamal/?view=search&q=%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF&file=file42'),
    {
      view: 'search',
      folderId: '',
      query: 'логотип',
      page: 0,
      fileId: 'file42',
    },
  );
});

test('buildRouteUrl serializes folder route and preserves unrelated params', () => {
  assert.equal(
    buildRouteUrl('https://brand.yamal/catalog/?utm_source=test', {
      view: 'folder',
      folderId: 'logo-folder',
      page: 3,
      fileId: 'file5',
    }),
    'https://brand.yamal/catalog/?utm_source=test&view=folder&folder=logo-folder&page=3&file=file5',
  );
});

test('buildRouteUrl removes stale route params for root state', () => {
  assert.equal(
    buildRouteUrl('https://brand.yamal/catalog/?view=search&q=%D1%88%D1%80%D0%B8%D1%84%D1%82&page=2&file=file5&utm=1', {
      view: 'root',
    }),
    'https://brand.yamal/catalog/?utm=1',
  );
});

test('buildBrandRouteCards falls back to search when section is missing', () => {
  const cards = buildBrandRouteCards([
    { id: 'folder-master', name: 'Брендбук ЯМАЛ Мастер бренд' },
    { id: 'folder-logo', name: 'Логотип' },
  ], 'folder-logo');

  assert.equal(cards[0].action, 'open-folder');
  assert.equal(cards[0].target, 'folder-master');
  assert.equal(cards[3].isActive, true);
  assert.equal(cards[6].action, 'search-chip');
  assert.equal(cards[6].target, 'шрифт');
});

test('buildBrandRoutesSummary exposes active label and route counters', () => {
  const summary = buildBrandRoutesSummary([
    { id: 'folder-master', name: 'Брендбук ЯМАЛ Мастер бренд' },
    { id: 'folder-logo', name: 'Логотип' },
    { id: 'folder-cities', name: 'Логотипы городов' },
  ], 'folder-cities');

  assert.equal(summary.total, 8);
  assert.equal(summary.available, 3);
  assert.equal(summary.activeLabel, 'Городские версии');
});

test('initialWorkspaceCollapsed defaults to hidden state until user overrides it', () => {
  assert.equal(initialWorkspaceCollapsed(), true);
  assert.equal(initialWorkspaceCollapsed(''), true);
  assert.equal(initialWorkspaceCollapsed('1'), true);
  assert.equal(initialWorkspaceCollapsed('0'), true);
});
