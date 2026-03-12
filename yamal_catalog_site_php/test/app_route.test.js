const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeRoute,
  routeFromUrl,
  buildRouteUrl,
  buildBrandRouteCards,
  buildBrandRoutesSummary,
  buildConstructorCategoryFilters,
  groupConstructorFields,
  computeRevealScrollLeft,
  initialWorkspaceCollapsed,
  isWorkspaceNavigationAction,
  splitDetailHeading,
  normalizeConsultantIntents,
  buildConsultantStarterQueries,
  buildConsultantResultTitle,
  normalizeConsultantFollowUps,
  normalizeConsultantContext,
  buildConsultantMemoryPayload,
  normalizeConsultantAdvice,
  normalizeConsultantDeepAnswer,
} = require('../assets/app.js');

test('normalizeRoute keeps only valid folder routes', () => {
  assert.deepEqual(normalizeRoute({ view: 'folder', folderId: 'logo', page: '2', fileId: 'file1' }), {
    view: 'folder',
    folderId: 'logo',
    query: '',
    page: 2,
    fileId: 'file1',
    solutionId: '',
  });

  assert.deepEqual(normalizeRoute({ view: 'folder', folderId: '', page: '-4', fileId: 'file1' }), {
    view: 'root',
    folderId: '',
    query: '',
    page: 0,
    fileId: 'file1',
    solutionId: '',
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
      solutionId: '',
    },
  );
});

test('routeFromUrl parses constructor state from query string', () => {
  assert.deepEqual(
    routeFromUrl('https://brand.yamal/?view=constructor&solution=business_card&file=file7'),
    {
      view: 'constructor',
      folderId: '',
      query: '',
      page: 0,
      fileId: 'file7',
      solutionId: 'business_card',
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

test('buildRouteUrl serializes constructor route and keeps file overlay', () => {
  assert.equal(
    buildRouteUrl('https://brand.yamal/catalog/?utm=1', {
      view: 'constructor',
      solutionId: 'rollup',
      fileId: 'file5',
    }),
    'https://brand.yamal/catalog/?utm=1&view=constructor&solution=rollup&file=file5',
  );
});

test('buildConstructorCategoryFilters keeps all filter and current category stable', () => {
  const result = buildConstructorCategoryFilters([
    { id: 'business_card', category: 'Печать' },
    { id: 'nameplate', category: 'Навигация' },
    { id: 'certificate', category: 'Документы' },
    { id: 'badge', category: 'События' },
  ], 'Документы');

  assert.equal(result.activeCategory, 'Документы');
  assert.equal(result.filters[0].id, 'all');
  assert.equal(result.filters[0].count, 4);
  assert.deepEqual(result.visibleItems.map((item) => item.id), ['certificate']);
});

test('groupConstructorFields splits fields into basics, content and people blocks', () => {
  const groups = groupConstructorFields([
    { id: 'city', label: 'Город / версия' },
    { id: 'presentation_mode', label: 'Сценарий' },
    { id: 'room_number', label: 'Номер / индекс' },
    { id: 'title', label: 'Название' },
    { id: 'message', label: 'Текст' },
    { id: 'full_name', label: 'ФИО' },
    { id: 'email', label: 'Email' },
  ]);

  assert.deepEqual(groups.map((group) => group.id), ['basics', 'content', 'people']);
  assert.deepEqual(groups[0].items.map((item) => item.id), ['city', 'presentation_mode', 'room_number']);
  assert.deepEqual(groups[1].items.map((item) => item.id), ['title', 'message']);
  assert.deepEqual(groups[2].items.map((item) => item.id), ['full_name', 'email']);
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

test('isWorkspaceNavigationAction keeps assistant navigation logic explicit', () => {
  assert.equal(isWorkspaceNavigationAction('open-folder'), true);
  assert.equal(isWorkspaceNavigationAction('open-folder-page'), true);
  assert.equal(isWorkspaceNavigationAction('open-file'), true);
  assert.equal(isWorkspaceNavigationAction('open-constructor'), true);
  assert.equal(isWorkspaceNavigationAction('search-chip'), true);
  assert.equal(isWorkspaceNavigationAction('toggle-consultant'), false);
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

test('buildConsultantStarterQueries turns assistant scenarios into compact dialog starters', () => {
  const starters = buildConsultantStarterQueries([
    { id: 'logo', label: 'Нужен логотип', summary: 'Логотип', description: 'Логотип и знак', prompt: 'логотип svg' },
    { id: 'brandbook', label: 'Нужен брендбук', summary: 'Брендбук', description: 'PDF и правила', prompt: 'брендбук Салехард' },
    { id: 'logo-duplicate', label: 'Еще логотип', summary: 'Логотип', description: 'Дубль', prompt: 'логотип svg' },
  ]);

  assert.deepEqual(starters, [
    { label: 'Логотип', query: 'логотип svg', description: 'Логотип и знак' },
    { label: 'Брендбук', query: 'брендбук Салехард', description: 'PDF и правила' },
  ]);
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

test('normalizeConsultantFollowUps keeps rich follow-up cards and falls back to plain queries', () => {
  assert.deepEqual(
    normalizeConsultantFollowUps([
      { label: 'SVG', query: 'логотип svg', reason: 'Для вектора и веба' },
      { label: 'PDF', query: 'логотип pdf', reason: 'Для печати' },
    ]),
    [
      { label: 'SVG', query: 'логотип svg', reason: 'Для вектора и веба' },
      { label: 'PDF', query: 'логотип pdf', reason: 'Для печати' },
    ],
  );

  assert.deepEqual(
    normalizeConsultantFollowUps([], ['брендбук', 'брендбук Салехард']).map((item) => item.query),
    ['брендбук', 'брендбук Салехард'],
  );
});

test('normalizeConsultantContext keeps compact dialog memory for the next step', () => {
  assert.deepEqual(
    normalizeConsultantContext({
      intentId: 'logo',
      city: 'салехард',
      formats: ['svg', 'pdf', 'svg'],
      medium: 'print',
      sourceMode: 'editable',
      applicationFocus: 'dark_background',
      memoryApplied: true,
    }),
    {
      intentId: 'logo',
      city: 'салехард',
      formats: ['svg', 'pdf'],
      medium: 'print',
      sourceMode: 'editable',
      applicationFocus: 'dark_background',
      memoryApplied: true,
    },
  );
});

test('normalizeConsultantDeepAnswer keeps structured hybrid response compact and predictable', () => {
  assert.deepEqual(
    normalizeConsultantDeepAnswer({
      provider: 'openai',
      mode: 'general',
      title: 'Что лучше отдать в типографию',
      answer: 'Для типографии обычно нужен PDF и векторный исходник.',
      bullets: ['PDF для проверки', 'AI или EPS для адаптации', '', 'PDF для проверки'],
      follow_up: 'Нужна печать или только согласование?',
      note: 'Общая рекомендация.',
    }),
    {
      provider: 'openai',
      mode: 'general',
      title: 'Что лучше отдать в типографию',
      answer: 'Для типографии обычно нужен PDF и векторный исходник.',
      bullets: ['PDF для проверки', 'AI или EPS для адаптации'],
      followUp: 'Нужна печать или только согласование?',
      note: 'Общая рекомендация.',
    },
  );
});

test('buildConsultantMemoryPayload serializes previous context for API follow-ups', () => {
  assert.deepEqual(
    buildConsultantMemoryPayload({
      intentId: 'logo',
      city: 'салехард',
      formats: ['svg', 'pdf'],
      medium: 'print',
      sourceMode: 'editable',
      applicationFocus: 'photo_overlay',
    }),
    {
      memory_intent: 'logo',
      memory_city: 'салехард',
      memory_formats: 'svg,pdf',
      memory_medium: 'print',
      memory_source: 'editable',
      memory_focus: 'photo_overlay',
    },
  );
});

test('normalizeConsultantAdvice keeps only meaningful brandbook guidance fields', () => {
  assert.deepEqual(
    normalizeConsultantAdvice({
      topic: 'logo_formats',
      title: 'По брендбуку: какой формат брать',
      summary: 'Для использования берите готовый файл.',
      bullets: ['SVG для веба', '', 'PDF для печати', 'AI для редактирования'],
      nextStep: 'Откройте раздел «Логотип».',
    }),
    {
      topic: 'logo_formats',
      title: 'По брендбуку: какой формат брать',
      summary: 'Для использования берите готовый файл.',
      bullets: ['SVG для веба', 'PDF для печати', 'AI для редактирования'],
      nextStep: 'Откройте раздел «Логотип».',
    },
  );
});
