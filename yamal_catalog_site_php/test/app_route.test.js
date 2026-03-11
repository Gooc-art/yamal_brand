const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeRoute,
  routeFromUrl,
  buildRouteUrl,
  buildBrandRouteCards,
  buildBrandRoutesSummary,
  computeRevealScrollLeft,
  initialWorkspaceCollapsed,
  splitDetailHeading,
  normalizeConsultantIntents,
  buildConsultantResultTitle,
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

test('buildBrandRouteCards maps real root sections into menu cards', () => {
  const cards = buildBrandRouteCards([
    { id: 'folder-master', name: 'Брендбук ЯМАЛ Мастер бренд', label: 'Мастер-Бренд', icon: '📕' },
    { id: 'folder-font', name: 'Шрифт', label: 'Шрифты', icon: '🔤' },
    { id: 'folder-cases', name: 'Примеры внедрения бренда территории', label: 'Кейсы внедрения', icon: '🗂️' },
  ], 'folder-font');

  assert.equal(cards.length, 3);
  assert.equal(cards[0].action, 'open-folder');
  assert.equal(cards[0].target, 'folder-master');
  assert.equal(cards[0].mark, '📕');
  assert.equal(cards[0].tone, 'tone-master');
  assert.equal(cards[0].hint, 'PDF и исходники');
  assert.equal(cards[1].label, 'Шрифты');
  assert.equal(cards[1].hint, 'TTF, OTF, архивы');
  assert.equal(cards[1].isActive, true);
  assert.equal(cards[2].label, 'Кейсы внедрения');
  assert.equal(cards[2].hint, 'Хорошие и спорные');
});

test('buildBrandRoutesSummary exposes active label and menu counters', () => {
  const summary = buildBrandRoutesSummary([
    { id: 'folder-master', name: 'Брендбук ЯМАЛ Мастер бренд', label: 'Мастер-Бренд', icon: '📕' },
    { id: 'folder-logo', name: 'Логотип', label: 'Логотип', icon: '🏷️' },
    { id: 'folder-cities', name: 'Логотипы городов', label: 'Городские версии', icon: '🏙️' },
  ], 'folder-cities');

  assert.equal(summary.total, 3);
  assert.equal(summary.available, 3);
  assert.equal(summary.activeLabel, 'Городские версии');
});

test('initialWorkspaceCollapsed defaults to hidden state until user overrides it', () => {
  assert.equal(initialWorkspaceCollapsed(), true);
  assert.equal(initialWorkspaceCollapsed(''), true);
  assert.equal(initialWorkspaceCollapsed('1'), true);
  assert.equal(initialWorkspaceCollapsed('0'), true);
});

test('computeRevealScrollLeft keeps horizontal reveal local to the rail', () => {
  assert.equal(computeRevealScrollLeft({
    currentScrollLeft: 120,
    maxScrollLeft: 600,
    containerLeft: 100,
    containerRight: 500,
    itemLeft: 80,
    itemRight: 160,
    padding: 20,
  }), 80);

  assert.equal(computeRevealScrollLeft({
    currentScrollLeft: 120,
    maxScrollLeft: 600,
    containerLeft: 100,
    containerRight: 500,
    itemLeft: 430,
    itemRight: 540,
    padding: 20,
  }), 180);

  assert.equal(computeRevealScrollLeft({
    currentScrollLeft: 120,
    maxScrollLeft: 600,
    containerLeft: 100,
    containerRight: 500,
    itemLeft: 160,
    itemRight: 320,
    padding: 20,
  }), 120);
});

test('splitDetailHeading keeps the title clean and moves suffix into pills', () => {
  assert.deepEqual(
    splitDetailHeading('Основной логотип • PDF', 'PDF'),
    {
      title: 'Основной логотип',
      suffix: ['PDF'],
    },
  );

  assert.deepEqual(
    splitDetailHeading('Логотип северного маршрута', 'PDF'),
    {
      title: 'Логотип северного маршрута',
      suffix: [],
    },
  );
});

test('normalizeConsultantIntents falls back to default assistant scenarios', () => {
  const intents = normalizeConsultantIntents([]);

  assert.equal(intents.length, 6);
  assert.equal(intents[0].id, 'logo');
  assert.equal(intents[0].label, 'Нужен логотип');
});

test('buildConsultantResultTitle prefers explicit title and falls back to intent summary', () => {
  assert.equal(
    buildConsultantResultTitle({ title: 'Брендбук: Салехард', intent: { summary: 'Брендбуки' } }),
    'Брендбук: Салехард',
  );

  assert.equal(
    buildConsultantResultTitle({ intent: { summary: 'Шрифты и архивы' } }),
    'Шрифты и архивы',
  );

  assert.equal(
    buildConsultantResultTitle({ query: 'логотип svg' }),
    'По запросу: логотип svg',
  );
});
