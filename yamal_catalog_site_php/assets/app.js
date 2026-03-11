const YAMAL_ROUTE_QUERY_KEYS = ['view', 'folder', 'page', 'q', 'file'];
const BRAND_ROUTE_BLUEPRINTS = [
  {
    mark: '✳',
    label: 'Мастер-бренд',
    sectionName: 'Брендбук ЯМАЛ Мастер бренд',
    query: 'мастер бренд',
    tone: 'tone-master',
  },
  {
    mark: '100',
    label: 'ЯМАЛ 100',
    sectionName: 'Брендбук ЯМАЛ 100',
    query: 'ямал 100',
    tone: 'tone-anniversary',
  },
  {
    mark: '🏙',
    label: 'Городские версии',
    sectionName: 'Логотипы городов',
    query: 'салехард',
    tone: 'tone-city',
  },
  {
    mark: 'Я',
    label: 'Логотип',
    sectionName: 'Логотип',
    query: 'логотип',
    tone: 'tone-logo',
  },
  {
    mark: '◉',
    label: 'Фирменный знак',
    sectionName: 'Фирменный знак',
    query: 'фирменный знак',
    tone: 'tone-mark',
  },
  {
    mark: '▦',
    label: 'Цвет и паттерны',
    sectionName: 'Паттерны',
    query: 'паттерн',
    tone: 'tone-pattern',
  },
  {
    mark: 'Aa',
    label: 'Типографика',
    sectionName: 'Шрифт',
    query: 'шрифт',
    tone: 'tone-type',
  },
  {
    mark: 'SVG',
    label: 'Графические элементы',
    sectionName: 'Иллюстрации мастер-бренда SVG-элементы',
    query: 'иллюстрации svg',
    tone: 'tone-graphics',
  },
];
const DEFAULT_WORKSPACE_COLLAPSED = true;
const DEFAULT_CATALOG_MODE = false;

function clampRoutePage(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeRoute(route) {
  const view = route?.view === 'folder' ? 'folder' : route?.view === 'search' ? 'search' : 'root';
  const folderId = String(route?.folderId || route?.id || '').trim();
  const query = String(route?.query || route?.q || '').trim();
  const fileId = String(route?.fileId || route?.file || '').trim();
  const page = clampRoutePage(route?.page);

  if (view === 'folder' && folderId) {
    return { view, folderId, query: '', page, fileId };
  }
  if (view === 'search' && query) {
    return { view, folderId: '', query, page: 0, fileId };
  }
  return { view: 'root', folderId: '', query: '', page: 0, fileId };
}

function routeFromUrl(inputUrl) {
  const url = new URL(String(inputUrl || 'http://localhost/'), 'http://localhost');
  const params = url.searchParams;
  const view = params.get('view');
  if (view === 'folder' || params.get('folder')) {
    return normalizeRoute({
      view: 'folder',
      folderId: params.get('folder') || '',
      page: params.get('page') || '0',
      fileId: params.get('file') || '',
    });
  }
  if (view === 'search' || params.get('q')) {
    return normalizeRoute({
      view: 'search',
      query: params.get('q') || '',
      fileId: params.get('file') || '',
    });
  }
  return normalizeRoute({
    view: 'root',
    fileId: params.get('file') || '',
  });
}

function buildRouteUrl(inputUrl, route) {
  const url = new URL(String(inputUrl || 'http://localhost/'), 'http://localhost');
  YAMAL_ROUTE_QUERY_KEYS.forEach((key) => url.searchParams.delete(key));

  const normalized = normalizeRoute(route);
  if (normalized.view === 'folder') {
    url.searchParams.set('view', 'folder');
    url.searchParams.set('folder', normalized.folderId);
    if (normalized.page > 0) {
      url.searchParams.set('page', String(normalized.page));
    }
  } else if (normalized.view === 'search') {
    url.searchParams.set('view', 'search');
    url.searchParams.set('q', normalized.query);
  }

  if (normalized.fileId) {
    url.searchParams.set('file', normalized.fileId);
  }

  url.hash = '';
  return url.toString();
}

function buildBrandRouteCards(sections, activeRouteId = '') {
  const availableSections = Array.isArray(sections) ? sections : [];
  return BRAND_ROUTE_BLUEPRINTS.map((item) => {
    const section = availableSections.find((entry) => entry && entry.name === item.sectionName) || null;
    return {
      ...item,
      action: section ? 'open-folder' : 'search-chip',
      target: section ? section.id : item.query,
      routeId: section ? section.id : '',
      available: Boolean(section),
      isActive: Boolean(section) && String(activeRouteId || '') === String(section.id || ''),
    };
  });
}

function buildBrandRoutesSummary(sections, activeRouteId = '') {
  const cards = buildBrandRouteCards(sections, activeRouteId);
  const activeCard = cards.find((item) => item.isActive) || null;
  return {
    cards,
    total: cards.length,
    available: cards.filter((item) => item.available).length,
    activeLabel: activeCard ? activeCard.label : '',
  };
}

function initialWorkspaceCollapsed() {
  return DEFAULT_WORKSPACE_COLLAPSED;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeRoute,
    routeFromUrl,
    buildRouteUrl,
    buildBrandRouteCards,
    buildBrandRoutesSummary,
    initialWorkspaceCollapsed,
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (function () {
  const siteConfig = window.YAMAL_SITE || {
    apiBase: 'api.php?action=',
    downloadBase: 'download.php?id=',
    brandLogoAsset: '',
    brandMarkAsset: '',
  };
  const fallbackTopSearches = ['логотип', 'брендбук', 'паттерны', 'салехард', 'наклейка', 'svg'];
  const WORKSPACE_STORAGE_KEY = 'yamal-site-workspace-collapsed';
  const CATALOG_MODE_STORAGE_KEY = 'yamal-site-catalog-mode';
  const EXAMPLE_AUTOPLAY_DELAY = 5200;
  const COPY_FEEDBACK_DELAY = 1600;
  let exampleAutoplayTimer = null;
  let exampleAutoplayPaused = false;

  const state = {
    bootstrap: null,
    current: null,
    detail: null,
    activeRouteId: '',
    exampleTab: 'good',
    exampleIndex: { good: 0, debate: 0 },
    exampleAutoplay: true,
    workspaceCollapsed: DEFAULT_WORKSPACE_COLLAPSED,
    catalogMode: false,
    inspectorOpen: false,
    featurePanels: [],
    brandRoutesOpen: false,
  };

  const els = {
    pageShell: document.querySelector('.page-shell'),
    heroStats: document.querySelector('#hero-stats'),
    heroExamples: document.querySelector('.hero-examples'),
    heroExampleTabs: document.querySelector('#hero-example-tabs'),
    heroExampleStage: document.querySelector('#hero-example-stage'),
    brandRoutesBlock: document.querySelector('.brand-routes-block'),
    brandRoutes: document.querySelector('#brand-routes'),
    brandRoutesPanel: document.querySelector('#brand-routes-panel'),
    brandRoutesToggle: document.querySelector('#brand-routes-toggle'),
    brandRoutesToggleLabel: document.querySelector('#brand-routes-toggle-label'),
    brandRoutesToggleMeta: document.querySelector('#brand-routes-toggle-meta'),
    brandRoutesCaption: document.querySelector('#brand-routes-caption'),
    brandRoutesCurrent: document.querySelector('#brand-routes-current'),
    featuredShelves: document.querySelector('#featured-shelves'),
    setupBanner: document.querySelector('#setup-banner'),
    topSearches: document.querySelector('#top-searches'),
    contentMode: document.querySelector('#content-mode'),
    contentTitle: document.querySelector('#content-title'),
    contentHint: document.querySelector('#content-hint'),
    breadcrumbs: document.querySelector('#breadcrumbs'),
    contentItems: document.querySelector('#content-items'),
    pagination: document.querySelector('#pagination'),
    detailPanel: document.querySelector('#detail-panel'),
    searchForm: document.querySelector('#search-form'),
    searchInput: document.querySelector('#search-input'),
    workspaceShell: document.querySelector('#workspace-shell'),
    workspaceGrid: document.querySelector('#workspace-grid'),
    workspaceToggle: document.querySelector('#workspace-toggle'),
    workspaceCopy: document.querySelector('#workspace-copy'),
    workspaceInspector: document.querySelector('#workspace-inspector'),
    inspectorBackdrop: document.querySelector('#inspector-backdrop'),
    catalogModeButtons: Array.from(document.querySelectorAll('.catalog-mode-toggle')),
  };

  function catalogTitle() {
    return state.bootstrap?.title || 'Бренд Ямал';
  }

  function setDocumentTitle(section) {
    const suffix = catalogTitle();
    document.title = section ? `${section} — ${suffix}` : `${suffix} — каталог`;
  }

  function syncDocumentTitleToCurrentState() {
    if (state.inspectorOpen && state.detail) {
      setDocumentTitle(state.detail.label || state.detail.name || 'Файл');
      return;
    }
    if (state.current?.kind === 'search') {
      setDocumentTitle(state.current.payload?.query ? `Поиск: ${state.current.payload.query}` : 'Поиск');
      return;
    }
    if (state.current?.kind === 'folder' && !state.current.payload?.root) {
      setDocumentTitle(state.current.payload?.folder?.label || state.current.payload?.folder?.name || 'Раздел');
      return;
    }
    setDocumentTitle('');
  }

  function currentRoute() {
    const base = { view: 'root' };
    if (state.current?.kind === 'folder') {
      if (state.current.payload?.root) {
        return normalizeRoute({
          ...base,
          fileId: state.inspectorOpen ? state.detail?.id : '',
        });
      }
      return normalizeRoute({
        view: 'folder',
        folderId: state.current.payload?.folder?.id || '',
        page: state.current.payload?.page || 0,
        fileId: state.inspectorOpen ? state.detail?.id : '',
      });
    }
    if (state.current?.kind === 'search') {
      return normalizeRoute({
        view: 'search',
        query: state.current.payload?.query || '',
        fileId: state.inspectorOpen ? state.detail?.id : '',
      });
    }
    return normalizeRoute({
      ...base,
      fileId: state.inspectorOpen ? state.detail?.id : '',
    });
  }

  function syncRouteWithState(mode = 'push') {
    if (!window.history?.pushState) {
      return;
    }
    const currentUrl = buildRouteUrl(window.location.href, routeFromUrl(window.location.href));
    const nextUrl = buildRouteUrl(window.location.href, currentRoute());
    if (currentUrl === nextUrl) {
      return;
    }
    const historyMethod = mode === 'replace' ? 'replaceState' : 'pushState';
    window.history[historyMethod](null, '', nextUrl);
  }

  function currentShareUrl() {
    return buildRouteUrl(window.location.href, currentRoute());
  }

  function scrollRailById(id, direction) {
    const rail = document.getElementById(String(id || ''));
    if (!rail) {
      return;
    }
    const delta = Math.max(180, Math.round(rail.clientWidth * 0.82)) * Number(direction || 0);
    rail.scrollBy({ left: delta, behavior: 'smooth' });
  }

  function enhanceHorizontalRail(element) {
    if (!element) {
      return;
    }
    element.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || element.scrollWidth <= element.clientWidth) {
        return;
      }
      event.preventDefault();
      element.scrollBy({ left: event.deltaY, behavior: 'auto' });
    }, { passive: false });
  }

  async function copyTextToClipboard(value) {
    const text = String(value || '');
    if (!text) {
      return false;
    }

    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const probe = document.createElement('textarea');
    probe.value = text;
    probe.setAttribute('readonly', 'readonly');
    probe.style.position = 'fixed';
    probe.style.opacity = '0';
    probe.style.pointerEvents = 'none';
    document.body.appendChild(probe);
    probe.focus();
    probe.select();
    try {
      return document.execCommand('copy');
    } finally {
      probe.remove();
    }
  }

  function setCopyButtonFeedback(button, label, tone = '') {
    if (!button) {
      return;
    }
    const defaultLabel = button.dataset.defaultLabel || String(button.textContent || '').trim() || 'Скопировать ссылку';
    if (!button.dataset.defaultLabel) {
      button.dataset.defaultLabel = defaultLabel;
    }
    if (button._copyFeedbackTimer) {
      window.clearTimeout(button._copyFeedbackTimer);
    }
    button.textContent = label;
    button.classList.toggle('copy-success', tone === 'success');
    button.classList.toggle('copy-error', tone === 'error');
    button._copyFeedbackTimer = window.setTimeout(() => {
      button.textContent = button.dataset.defaultLabel || defaultLabel;
      button.classList.remove('copy-success', 'copy-error');
    }, COPY_FEEDBACK_DELAY);
  }

  async function handleCopyCurrentLink(button) {
    try {
      const copied = await copyTextToClipboard(currentShareUrl());
      setCopyButtonFeedback(button, copied ? 'Ссылка скопирована' : 'Не удалось скопировать', copied ? 'success' : 'error');
    } catch (error) {
      console.warn(error);
      setCopyButtonFeedback(button, 'Не удалось скопировать', 'error');
    }
  }

  function closeInspector(mode = 'replace') {
    if (!state.inspectorOpen) {
      return;
    }
    setInspectorOpen(false);
    syncDocumentTitleToCurrentState();
    if (mode !== 'none') {
      syncRouteWithState(mode);
    }
  }

  async function restoreRouteFromLocation() {
    const route = routeFromUrl(window.location.href);
    const shouldRevealWorkspace = route.view !== 'root' || Boolean(route.fileId);
    if (shouldRevealWorkspace) {
      ensureWorkspaceVisible();
    }

    if (route.view === 'folder' && route.folderId) {
      await openFolder(route.folderId, route.page, { history: 'none' });
    } else if (route.view === 'search' && route.query) {
      await search(route.query, { history: 'none' });
    } else {
      await openRoot({ history: 'none' });
    }

    if (route.fileId) {
      try {
        await openFile(route.fileId, { history: 'none' });
      } catch (error) {
        console.warn(error);
        syncRouteWithState('replace');
      }
    }

    if (shouldRevealWorkspace) {
      focusWorkspace();
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('ru-RU').format(Number(value || 0));
  }

  function formatExtension(extension) {
    return String(extension || '').trim().toUpperCase() || 'Файл';
  }

  function labelIncludesToken(label, token) {
    const source = String(label || '').toUpperCase();
    const needle = String(token || '').trim().toUpperCase();
    return Boolean(needle) && source.includes(needle);
  }

  function trimPreviewLabel(value) {
    const source = String(value || '').trim();
    if (!source) return '';
    const clean = source.replace(/\s*•\s*[A-Z0-9]+$/u, '').trim();
    return clean.length > 48 ? `${clean.slice(0, 45).trim()}...` : clean;
  }

  function trimPanelTitle(value) {
    const source = String(value || '').trim();
    if (!source) return '';
    return source.length > 42 ? `${source.slice(0, 39).trim()}...` : source;
  }

  function compactRelativePath(relativePath, type) {
    const source = String(relativePath || '').trim();
    if (!source || source === '.') return '';
    const parts = source.split('/').filter(Boolean);
    if (!parts.length) return '';
    if (type === 'file') {
      parts.pop();
    }
    return parts.slice(-2).join(' / ');
  }

  function buildItemSecondary(item) {
    const trail = compactRelativePath(item.relativePath, item.type);
    if (trail && trail !== item.label && trail !== item.name) {
      return trail;
    }
    return item.type === 'folder' ? item.kindLabel : '';
  }

  function buildItemPills(item) {
    const pills = [];
    if (item.type === 'folder') {
      pills.push(item.kindLabel);
      return pills;
    }
    if (item.sizeLabel) {
      pills.push(item.sizeLabel);
    }
    const extensionLabel = formatExtension(item.extension);
    if (item.extension && !labelIncludesToken(item.label, extensionLabel)) {
      pills.push(extensionLabel);
    }
    return pills;
  }

  function buildDetailTrail(items) {
    const folders = (items || [])
      .filter((item, index, all) => item && item.type === 'folder' && index < all.length - 1)
      .map((item) => item.name)
      .filter(Boolean);
    return folders.join(' / ');
  }

  function normalizeHeroExamples(examples) {
    return {
      good: Array.isArray(examples?.good) ? examples.good : [],
      debate: Array.isArray(examples?.debate) ? examples.debate : [],
    };
  }

  function activeExampleItems() {
    const examples = normalizeHeroExamples(state.bootstrap?.examples);
    return examples[state.exampleTab] || [];
  }

  function buildExampleSummary(item) {
    const parts = [];
    const title = String(item?.title || '').trim();
    const label = String(item?.label || '').trim();
    const context = compactRelativePath(item?.relativePath, 'file');
    if (label && label !== title) {
      parts.push(label);
    }
    if (context && !parts.includes(context)) {
      parts.push(context);
    }
    return parts.slice(0, 2).join(' • ');
  }

  function ensureExampleIndex(tab) {
    const examples = normalizeHeroExamples(state.bootstrap?.examples);
    const items = examples[tab] || [];
    const maxIndex = Math.max(0, items.length - 1);
    state.exampleIndex[tab] = Math.min(Math.max(Number(state.exampleIndex[tab] || 0), 0), maxIndex);
    return state.exampleIndex[tab];
  }

  function stopExampleAutoplay() {
    if (exampleAutoplayTimer) {
      window.clearTimeout(exampleAutoplayTimer);
      exampleAutoplayTimer = null;
    }
  }

  function scheduleExampleAutoplay() {
    stopExampleAutoplay();
    const items = activeExampleItems();
    if (!state.exampleAutoplay || exampleAutoplayPaused || items.length <= 1) {
      return;
    }
    exampleAutoplayTimer = window.setTimeout(() => {
      if (document.hidden) {
        scheduleExampleAutoplay();
        return;
      }
      shiftExample(1, true);
    }, EXAMPLE_AUTOPLAY_DELAY);
  }

  function setExampleAutoplay(nextValue) {
    state.exampleAutoplay = Boolean(nextValue);
    renderHeroExamples();
  }

  function renderHeroExamples() {
    if (!els.heroExampleStage || !els.heroExampleTabs) return;
    const examples = normalizeHeroExamples(state.bootstrap?.examples);
    const goodCount = examples.good.length;
    const debateCount = examples.debate.length;
    const tabMeta = [
      ['good', 'Хорошие примеры', goodCount],
      ['debate', 'Спорные примеры', debateCount],
    ];

    els.heroExampleTabs.innerHTML = tabMeta.map(([tab, label, count]) => `
      <button
        type="button"
        class="hero-example-tab${state.exampleTab === tab ? ' active' : ''}"
        data-action="examples-tab"
        data-tab="${escapeHtml(tab)}"
        aria-pressed="${state.exampleTab === tab ? 'true' : 'false'}"
      >
        <span>${escapeHtml(label)}</span>
        <small>${escapeHtml(formatNumber(count))}</small>
      </button>
    `).join('');

    const items = activeExampleItems();
    if (!items.length) {
      stopExampleAutoplay();
      const label = state.exampleTab === 'debate' ? 'Спорные примеры' : 'Хорошие примеры';
      const hint = state.exampleTab === 'debate'
        ? 'Пока не найдены. Если добавишь папку со словом "Спорные", фото появятся здесь автоматически.'
        : 'Пока не найдены изображения кейсов.';
      els.heroExampleStage.innerHTML = `
        <div class="hero-example-empty">
          <strong>${escapeHtml(label)}</strong>
          <p>${escapeHtml(hint)}</p>
          ${state.exampleTab === 'debate' ? '<button type="button" class="ghost-button" data-action="examples-tab" data-tab="good">Показать хорошие</button>' : ''}
        </div>
      `;
      return;
    }

    const currentIndex = ensureExampleIndex(state.exampleTab);
    const item = items[currentIndex];
    const thumbWindow = Math.min(items.length, 5);
    const thumbStart = Math.max(0, Math.min(currentIndex - 2, items.length - thumbWindow));
    const thumbs = items.slice(thumbStart, thumbStart + thumbWindow);
    els.heroExampleStage.innerHTML = `
      <div class="hero-example-shell">
        <article class="hero-example-card">
          <div class="hero-example-frame">
            <button
              type="button"
              class="hero-example-nav hero-example-nav-prev"
              data-action="examples-shift"
              data-direction="-1"
              aria-label="Предыдущий пример"
              ${items.length <= 1 ? 'disabled' : ''}
            >←</button>
            <div class="hero-example-media">
              <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title || item.label || 'Пример внедрения бренда')}" loading="lazy" />
              <div class="hero-example-overlay">
                <span class="hero-example-badge">${escapeHtml(state.exampleTab === 'debate' ? 'Для обсуждения' : 'Хороший пример')}</span>
                <strong>${escapeHtml(item.title || item.label || 'Пример')}</strong>
                ${item.subtitle ? `<p>${escapeHtml(item.subtitle)}</p>` : ''}
              </div>
            </div>
            <button
              type="button"
              class="hero-example-nav hero-example-nav-next"
              data-action="examples-shift"
              data-direction="1"
              aria-label="Следующий пример"
              ${items.length <= 1 ? 'disabled' : ''}
            >→</button>
          </div>
          <div class="hero-example-copy">
            <div class="hero-example-toolbar">
              <div class="hero-example-pager">
                <span>${escapeHtml(formatNumber(currentIndex + 1))} / ${escapeHtml(formatNumber(items.length))}</span>
                <div class="hero-example-dots">
                  ${items.map((_, index) => `
                    <button
                      type="button"
                      class="hero-example-dot${index === currentIndex ? ' active' : ''}"
                      data-action="examples-jump"
                      data-index="${index}"
                      aria-label="Перейти к примеру ${index + 1}"
                    ></button>
                  `).join('')}
                </div>
              </div>
              <button
                type="button"
                class="hero-example-autoplay${state.exampleAutoplay ? ' active' : ''}"
                data-action="toggle-example-autoplay"
                aria-pressed="${state.exampleAutoplay ? 'true' : 'false'}"
              >${state.exampleAutoplay ? 'Пауза' : 'Авто'}</button>
            </div>
            ${buildExampleSummary(item) ? `<p class="hero-example-summary">${escapeHtml(buildExampleSummary(item))}</p>` : ''}
            <div class="hero-example-actions">
              <button type="button" class="ghost-button" data-action="open-file" data-id="${escapeHtml(item.id)}">Открыть</button>
              <a class="link-button" href="${escapeHtml(item.downloadUrl)}">Скачать</a>
            </div>
            <div class="hero-example-thumbs" role="tablist" aria-label="Миниатюры примеров">
              ${thumbs.map((thumb, index) => {
                const realIndex = thumbStart + index;
                return `
                  <button
                    type="button"
                    class="hero-example-thumb${realIndex === currentIndex ? ' active' : ''}"
                    data-action="examples-jump"
                    data-index="${realIndex}"
                    aria-label="Открыть пример ${escapeHtml(thumb.title || thumb.label || `#${realIndex + 1}`)}"
                  >
                    <img src="${escapeHtml(thumb.imageUrl)}" alt="" loading="lazy" />
                    <span>${escapeHtml(trimPanelTitle(thumb.title || thumb.label || `Пример ${realIndex + 1}`))}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </article>
      </div>
    `;
    window.requestAnimationFrame(() => {
      els.heroExampleStage
        ?.querySelector('.hero-example-thumb.active')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
    scheduleExampleAutoplay();
  }

  function setExampleTab(tab) {
    const nextTab = tab === 'debate' ? 'debate' : 'good';
    state.exampleTab = nextTab;
    ensureExampleIndex(nextTab);
    renderHeroExamples();
  }

  function shiftExample(direction, fromAutoplay = false) {
    const items = activeExampleItems();
    if (items.length <= 1) {
      return;
    }
    const currentIndex = ensureExampleIndex(state.exampleTab);
    const delta = Number(direction || 0);
    const nextIndex = (currentIndex + delta + items.length) % items.length;
    state.exampleIndex[state.exampleTab] = nextIndex;
    renderHeroExamples();
    if (!fromAutoplay) {
      scheduleExampleAutoplay();
    }
  }

  function pluralizeRu(value, one, few, many) {
    const number = Math.abs(Number(value || 0));
    const mod10 = number % 10;
    const mod100 = number % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function formatUsageLabel(value) {
    const count = Number(value || 0);
    if (!count) return '';
    return `${formatNumber(count)} ${pluralizeRu(count, 'обращение', 'обращения', 'обращений')}`;
  }

  function resolveFeatureSectionName(item) {
    const source = String(item?.relativePath || '').trim();
    if (!source || source === '.') {
      return String(item?.label || item?.name || '').trim();
    }
    const parts = source.split('/').filter(Boolean);
    if (!parts.length) {
      return String(item?.label || item?.name || '').trim();
    }
    if (item?.type === 'folder') {
      return parts[0] || String(item.label || item.name || '').trim();
    }
    return parts[0] || String(item?.label || item?.name || '').trim();
  }

  function inferFeatureTone(...values) {
    const source = values
      .map((value) => String(value || '').toLowerCase())
      .join(' ');
    if (source.includes('100')) return 'tone-anniversary';
    if (source.includes('мастер') || source.includes('брендбук')) return 'tone-master';
    if (source.includes('город') || source.includes('салехард') || source.includes('уренгой') || source.includes('ноябрьск')) return 'tone-city';
    if (source.includes('логотип')) return 'tone-logo';
    if (source.includes('знак')) return 'tone-mark';
    if (source.includes('паттер') || source.includes('цвет')) return 'tone-pattern';
    if (source.includes('шрифт') || source.includes('типограф')) return 'tone-type';
    if (source.includes('svg') || source.includes('иллюстра')) return 'tone-graphics';
    if (source.includes('сувенир') || source.includes('полиграф') || source.includes('диджитал') || source.includes('наклей') || source.includes('каталог')) return 'tone-digital';
    return 'tone-master';
  }

  function inferFeatureBadge(item, sectionName) {
    const source = `${sectionName} ${item?.kindLabel || ''} ${item?.extension || ''}`.toLowerCase();
    if (source.includes('100')) return 'ЯМАЛ 100';
    if (source.includes('брендбук')) return 'Брендбук';
    if (source.includes('город')) return 'Города';
    if (source.includes('логотип')) return 'Логотип';
    if (source.includes('знак')) return 'Знак';
    if (source.includes('паттер') || source.includes('цвет')) return 'Паттерны';
    if (source.includes('шрифт') || source.includes('типограф')) return 'Шрифт';
    if (source.includes('svg') || source.includes('иллюстра')) return 'SVG';
    if (source.includes('сувенир') || source.includes('полиграф') || source.includes('диджитал') || source.includes('каталог')) return 'Носители';
    if (item?.type === 'folder') return 'Раздел';
    return item?.kindLabel || formatExtension(item?.extension);
  }

  function featureFallbackAsset(tone) {
    if (['tone-master', 'tone-mark', 'tone-pattern', 'tone-graphics'].includes(tone)) {
      return siteConfig.brandMarkAsset || siteConfig.brandLogoAsset || '';
    }
    return siteConfig.brandLogoAsset || siteConfig.brandMarkAsset || '';
  }

  function buildDefaultFeaturePreview(item, tone, sectionName) {
    const baseSource = sectionName && !labelIncludesToken(item?.label || item?.name, sectionName)
      ? sectionName
      : (item?.label || item?.name || '');
    return {
      kind: 'asset',
      src: featureFallbackAsset(tone),
      alt: item?.label || item?.name || sectionName || 'Материал каталога',
      label: item?.type === 'file' && item?.extension ? formatExtension(item.extension) : 'Каталог',
      source: trimPreviewLabel(baseSource),
      fit: 'contain',
    };
  }

  function buildFileFeaturePreview(item, tone, sectionName) {
    if (!item || item.type !== 'file') return null;
    if (item.downloadUrl && isPreviewableImage(item.extension)) {
      return {
        kind: 'image',
        src: toInlineDownloadUrl(item.downloadUrl),
        alt: item.label || item.name || sectionName || 'Материал каталога',
        label: formatExtension(item.extension),
        source: trimPreviewLabel(sectionName || item.label || item.name),
        fit: item.extension === 'svg' ? 'contain' : 'cover',
      };
    }
    return buildDefaultFeaturePreview(item, tone, sectionName);
  }

  function buildFeatureText(item, sectionName) {
    const parts = [];
    const normalizedSection = String(sectionName || '').trim();
    if (normalizedSection && !labelIncludesToken(item?.label || item?.name, normalizedSection)) {
      parts.push(normalizedSection);
    }
    if (item?.type === 'file' && item?.extension) {
      const extensionLabel = formatExtension(item.extension);
      if (!labelIncludesToken(item?.label || item?.name, extensionLabel)) {
        parts.push(extensionLabel);
      }
    }
    if (item?.uses) {
      parts.push(formatUsageLabel(item.uses));
    }
    if (!parts.length) {
      return item?.type === 'folder' ? 'Раздел каталога' : 'Материал каталога';
    }
    return parts.slice(0, 2).join(' • ');
  }

  function buildFeaturePanelFromItem(item) {
    if (!item || !item.id) return null;
    const sectionName = resolveFeatureSectionName(item);
    const tone = inferFeatureTone(sectionName, item.label, item.name);
    const preview = item.type === 'file'
      ? buildFileFeaturePreview(item, tone, sectionName)
      : buildDefaultFeaturePreview(item, tone, sectionName);
    return {
      badge: inferFeatureBadge(item, sectionName),
      title: trimPanelTitle(item.label || item.name || sectionName),
      text: buildFeatureText(item, sectionName),
      tone,
      action: item.type === 'folder' ? 'open-folder' : 'open-file',
      target: item.id,
      previewQuery: item.type === 'folder' ? (sectionName || item.name || '') : '',
      preview,
    };
  }

  function isPreviewableImage(extension) {
    return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(String(extension || '').toLowerCase());
  }

  function toInlineDownloadUrl(downloadUrl) {
    if (!downloadUrl) return '';
    return `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}inline=1`;
  }

  function actionUrl(action, params) {
    const url = new URL(siteConfig.apiBase + encodeURIComponent(action), window.location.href);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      url.searchParams.set(key, value);
    });
    return url.toString();
  }

  async function api(action, params) {
    const response = await fetch(actionUrl(action, params), {
      headers: { Accept: 'application/json' },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  }

  function setLoading(title, hint) {
    els.contentMode.textContent = 'Каталог';
    els.contentTitle.textContent = title;
    els.contentHint.textContent = hint || 'Загрузка раздела.';
    els.contentItems.innerHTML = `
      <div class="empty-state loading-state">
        <div class="loading-mark" aria-hidden="true"></div>
        <div>
          <h3>Загрузка</h3>
          <p class="detail-empty">Содержимое раздела скоро появится.</p>
        </div>
      </div>
    `;
    els.pagination.innerHTML = '';
  }

  function setWorkspaceCollapsed(nextValue) {
    state.workspaceCollapsed = Boolean(nextValue);
    if (els.workspaceShell) {
      els.workspaceShell.classList.toggle('collapsed', state.workspaceCollapsed);
    }
    if (els.workspaceGrid) {
      els.workspaceGrid.hidden = state.workspaceCollapsed;
    }
    if (els.workspaceToggle) {
      els.workspaceToggle.textContent = state.workspaceCollapsed ? 'Показать рабочую область' : 'Скрыть рабочую область';
    }
    if (els.workspaceCopy) {
      els.workspaceCopy.textContent = state.workspaceCollapsed
        ? 'Блок скрыт. Он откроется автоматически.'
        : 'Все разделы и файлы в одном потоке.';
    }
  }

  function setCatalogMode(nextValue) {
    state.catalogMode = Boolean(nextValue);
    if (els.pageShell) {
      els.pageShell.classList.toggle('catalog-mode', state.catalogMode);
    }
    els.catalogModeButtons.forEach((button) => {
      button.textContent = state.catalogMode ? 'Вернуть витрину' : 'Только каталог';
    });
    if (state.catalogMode) {
      setBrandRoutesOpen(false);
      setWorkspaceCollapsed(false);
      els.workspaceShell?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (els.workspaceCopy) {
      els.workspaceCopy.textContent = state.catalogMode
        ? 'Включен режим каталога.'
        : 'Все разделы и файлы в одном потоке.';
    }
  }

  function setInspectorOpen(nextValue) {
    state.inspectorOpen = Boolean(nextValue);
    if (els.workspaceShell) {
      els.workspaceShell.classList.toggle('inspector-open', state.inspectorOpen);
    }
    if (els.workspaceInspector) {
      els.workspaceInspector.setAttribute('aria-hidden', state.inspectorOpen ? 'false' : 'true');
    }
    if (els.inspectorBackdrop) {
      els.inspectorBackdrop.hidden = !state.inspectorOpen;
    }
  }

  function ensureWorkspaceVisible() {
    if (state.workspaceCollapsed) {
      setWorkspaceCollapsed(false);
    }
  }

  function focusWorkspace(target) {
    if (!els.workspaceShell) return;
    if (target && target.closest && target.closest('#workspace-shell')) {
      return;
    }
    els.workspaceShell.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setActiveRoute(routeId) {
    const nextValue = String(routeId || '');
    if (state.activeRouteId === nextValue) {
      return;
    }
    state.activeRouteId = nextValue;
    if (state.bootstrap) {
      renderBrandRoutes(state.bootstrap);
    }
  }

  function setBrandRoutesOpen(nextValue, options = {}) {
    state.brandRoutesOpen = Boolean(nextValue);
    if (els.brandRoutesBlock) {
      els.brandRoutesBlock.classList.toggle('open', state.brandRoutesOpen);
    }
    if (els.brandRoutesPanel) {
      els.brandRoutesPanel.hidden = !state.brandRoutesOpen;
    }
    if (els.brandRoutesToggle) {
      els.brandRoutesToggle.setAttribute('aria-expanded', state.brandRoutesOpen ? 'true' : 'false');
    }
    if (els.brandRoutesToggleLabel) {
      els.brandRoutesToggleLabel.textContent = state.brandRoutesOpen ? 'Скрыть разделы' : 'Открыть разделы';
    }
    if (state.brandRoutesOpen && options.focus) {
      window.requestAnimationFrame(() => {
        const activeCard = els.brandRoutes?.querySelector('.brand-route-card.active');
        const firstCard = els.brandRoutes?.querySelector('.brand-route-card');
        (activeCard || firstCard)?.focus?.();
        (activeCard || firstCard)?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    }
  }

  function renderSetupBanner(message) {
    if (!message) {
      els.setupBanner.style.display = 'none';
      els.setupBanner.textContent = '';
      return;
    }
    els.setupBanner.style.display = 'block';
    els.setupBanner.innerHTML = `
      <div class="setup-banner-copy">
        <p class="eyebrow">Статус каталога</p>
        <strong>Каталог готовится к публикации</strong>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  }

  function renderBrandRoutes(bootstrap) {
    if (!els.brandRoutes) {
      return;
    }
    const summary = buildBrandRoutesSummary(bootstrap.sections || [], state.activeRouteId);
    if (els.brandRoutesCaption) {
      els.brandRoutesCaption.textContent = summary.activeLabel
        ? `Сейчас открыт раздел «${summary.activeLabel}». При необходимости переключитесь в другую ветку брендирования.`
        : `${formatNumber(summary.available)} направлений брендирования собраны в одном компактном переключателе.`;
    }
    if (els.brandRoutesToggleMeta) {
      els.brandRoutesToggleMeta.textContent = summary.activeLabel
        ? `Сейчас: ${summary.activeLabel}`
        : `${formatNumber(summary.available)} ключевых разделов`;
    }
    if (els.brandRoutesCurrent) {
      els.brandRoutesCurrent.textContent = summary.activeLabel || 'Все разделы';
    }
    els.brandRoutes.innerHTML = summary.cards.map((item) => {
      const attr = item.action === 'open-folder'
        ? `data-id="${escapeHtml(item.target)}"`
        : `data-query="${escapeHtml(item.target)}"`;
      return `
        <button
          type="button"
          class="brand-route-card ${escapeHtml(item.tone)}${item.isActive ? ' active' : ''}"
          data-action="${escapeHtml(item.action)}"
          data-route-id="${escapeHtml(item.routeId || '')}"
          ${attr}
          ${item.isActive ? 'aria-current="page"' : ''}
        >
          <span class="brand-route-icon" aria-hidden="true">${escapeHtml(item.mark)}</span>
          <span class="brand-route-copy">
            <strong>${escapeHtml(item.label)}</strong>
            <small>${escapeHtml(item.available ? 'Открыть раздел' : `Искать: ${item.query}`)}</small>
          </span>
          <span class="brand-route-arrow" aria-hidden="true">↗</span>
        </button>
      `;
    }).join('');
    if (state.brandRoutesOpen) {
      window.requestAnimationFrame(() => {
        els.brandRoutes
          ?.querySelector('.brand-route-card.active')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    }
  }

  function buildFeaturePanels(bootstrap) {
    const sourceItems = Array.isArray(bootstrap.favorites) && bootstrap.favorites.length
      ? bootstrap.favorites
      : (bootstrap.sections || []);
    return sourceItems
      .slice(0, 4)
      .map(buildFeaturePanelFromItem)
      .filter(Boolean);
  }

  function renderFeaturePanels(panels) {
    if (!els.featuredShelves) return;
    els.featuredShelves.innerHTML = (panels || []).map((item) => {
      const attr = (item.action === 'open-folder' || item.action === 'open-file')
        ? `data-id="${escapeHtml(item.target)}"`
        : `data-query="${escapeHtml(item.target)}"`;
      const preview = item.preview || {};
      const imageMarkup = preview.src
        ? `<img class="feature-preview-image${preview.fit === 'contain' ? ' contain' : ''}" src="${escapeHtml(preview.src)}" alt="${escapeHtml(preview.alt || item.title)}" loading="lazy" />`
        : `<span class="feature-preview-sigil">${escapeHtml(item.badge)}</span>`;
      return `
        <button type="button" class="feature-panel ${escapeHtml(item.tone)}" data-action="${escapeHtml(item.action)}" ${attr}>
          <div class="feature-visual ${escapeHtml(preview.kind || 'asset')}">
            <div class="feature-visual-frame">
              ${imageMarkup}
            </div>
            <div class="feature-preview-chips">
              ${preview.label ? `<span class="feature-preview-chip">${escapeHtml(preview.label)}</span>` : ''}
              ${preview.source ? `<span class="feature-preview-chip muted">${escapeHtml(preview.source)}</span>` : ''}
            </div>
          </div>
          <div class="feature-copy">
            <span class="feature-badge">${escapeHtml(item.badge)}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.text)}</p>
          </div>
        </button>
      `;
    }).join('');
  }

  function pickFeaturePreview(panel, items) {
    const files = (items || []).filter((item) => item && item.type === 'file');
    const image = files.find((item) => isPreviewableImage(item.extension));
    if (image) {
      return {
        kind: 'image',
        src: toInlineDownloadUrl(image.downloadUrl),
        alt: image.label || panel.title,
        label: formatExtension(image.extension),
        source: trimPreviewLabel(image.label || image.name),
        fit: image.extension === 'svg' ? 'contain' : 'cover',
      };
    }

    const preferred = files.find((item) => item.extension === 'pdf') || files[0];
    if (preferred) {
      return {
        kind: 'asset',
        src: panel.preview?.src || featureFallbackAsset(panel.tone) || '',
        alt: preferred.label || panel.title,
        label: formatExtension(preferred.extension),
        source: trimPreviewLabel(preferred.label || preferred.name),
        fit: 'contain',
      };
    }

    return panel.preview || null;
  }

  async function hydrateFeaturePanels() {
    if (!state.featurePanels.length) return;
    const tasks = state.featurePanels.map(async (panel, index) => {
      if (!panel.previewQuery) return;
      try {
        const payload = await api('preview-search', { q: panel.previewQuery });
        const preview = pickFeaturePreview(panel, payload.items || []);
        if (!preview) return;
        state.featurePanels[index] = {
          ...panel,
          preview,
        };
        renderFeaturePanels(state.featurePanels);
      } catch (error) {
        console.warn(error);
      }
    });
    await Promise.allSettled(tasks);
  }

  function renderHeroStats(stats, sections) {
    if (!els.heroStats) return;
    const rootSections = Array.isArray(sections) ? sections.length : 0;
    const cards = [
      ['Файлов', formatNumber(stats.files)],
      ['Папок', formatNumber(stats.folders)],
      ['Входов', formatNumber(rootSections)],
    ];
    els.heroStats.innerHTML = cards.map(([label, value]) => `
      <article class="hero-stat">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join('');
  }

  function renderTopSearches(items) {
    const normalized = (items && items.length ? items : fallbackTopSearches.map((query) => ({ query })))
      .map((item) => typeof item === 'string' ? item : item.query)
      .filter(Boolean)
      .slice(0, 6);
    els.topSearches.innerHTML = normalized.map((query) => `
      <button type="button" class="chip" data-action="search-chip" data-query="${escapeHtml(query)}">
        ${escapeHtml(query)}
      </button>
    `).join('');
  }

  function renderBreadcrumbs(items) {
    els.breadcrumbs.innerHTML = items.map((item, index) => {
      if (index === items.length - 1 || item.type !== 'folder') {
        return `<span class="breadcrumb current">${escapeHtml(item.name)}</span>`;
      }
      return `<button type="button" class="breadcrumb" data-action="open-folder" data-id="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button>`;
    }).join('<span class="breadcrumb-sep">•</span>');
  }

  function itemCard(item) {
    const secondary = buildItemSecondary(item);
    const pills = buildItemPills(item);
    const actions = item.type === 'folder'
      ? `<button type="button" class="item-action" data-action="open-folder" data-id="${escapeHtml(item.id)}">Открыть</button>`
      : `<button type="button" class="item-action" data-action="open-file" data-id="${escapeHtml(item.id)}">Карточка</button>
         <a class="link-button" href="${escapeHtml(item.downloadUrl)}">Скачать</a>`;

    return `
      <article class="result-card ${escapeHtml(item.type)}">
        <div class="result-head">
          <span class="card-icon">${escapeHtml(item.icon)}</span>
          <div class="card-copy">
            <strong>${escapeHtml(item.label)}</strong>
            ${secondary ? `<span>${escapeHtml(secondary)}</span>` : ''}
          </div>
        </div>
        <div class="item-meta">
          ${pills.map((pill) => `<span class="meta-pill">${escapeHtml(pill)}</span>`).join('')}
        </div>
        <div class="item-actions">${actions}</div>
      </article>
    `;
  }

  function renderItems(items, emptyText) {
    if (!items.length) {
      els.contentItems.innerHTML = `
        <div class="empty-state">
          <div class="empty-mark" aria-hidden="true">○</div>
          <div>
            <h3>${escapeHtml(emptyText || 'Пусто')}</h3>
            <p class="detail-empty">Попробуй другой запрос или открой раздел.</p>
          </div>
        </div>
      `;
      return;
    }
    els.contentItems.innerHTML = items.map(itemCard).join('');
  }

  function renderPagination(payload) {
    if (!payload || payload.maxPage <= 0) {
      els.pagination.innerHTML = '';
      return;
    }
    const buttons = [];
    if (payload.page > 0) {
      buttons.push(`<button type="button" class="ghost-button" data-action="open-folder-page" data-id="${escapeHtml(payload.folder.id)}" data-page="${payload.page - 1}">◀ Назад</button>`);
    }
    buttons.push(`<span class="meta-pill">Страница ${payload.page + 1} / ${payload.maxPage + 1}</span>`);
    if (payload.page < payload.maxPage) {
      buttons.push(`<button type="button" class="ghost-button" data-action="open-folder-page" data-id="${escapeHtml(payload.folder.id)}" data-page="${payload.page + 1}">Вперед ▶</button>`);
    }
    els.pagination.innerHTML = buttons.join('');
  }

  function renderFolder(payload) {
    state.current = { kind: 'folder', payload };
    state.detail = null;
    els.contentMode.textContent = payload.root ? 'Главная' : 'Раздел';
    els.contentTitle.textContent = payload.folder.label || payload.folder.name;
    els.contentHint.textContent = payload.hint || 'Открой раздел или файл.';
    renderBreadcrumbs(payload.breadcrumbs || []);
    renderItems(payload.items || [], 'Раздел пуст');
    renderPagination(payload);
    setDocumentTitle(payload.root ? '' : (payload.folder.label || payload.folder.name));
  }

  function renderSearch(payload) {
    state.current = { kind: 'search', payload };
    state.detail = null;
    els.contentMode.textContent = 'Поиск';
    els.contentTitle.textContent = payload.query ? `Поиск: ${payload.query}` : 'Поиск';
    els.contentHint.textContent = payload.total
      ? `${formatNumber(payload.total)} результатов`
      : 'Ничего не найдено.';
    els.breadcrumbs.innerHTML = '';
    renderItems(payload.items || [], payload.emptyState || 'Пусто');
    els.pagination.innerHTML = '';
    setDocumentTitle(payload.query ? `Поиск: ${payload.query}` : 'Поиск');
  }

  function renderDetail(payload) {
    state.detail = payload;
    const detailTitle = payload.label || payload.name;
    const originalName = payload.name && payload.name !== detailTitle ? payload.name : '';
    const detailTrail = buildDetailTrail(payload.breadcrumbs || []);
    const pills = [];
    if (payload.sizeLabel) {
      pills.push(payload.sizeLabel);
    }
    if (payload.extension) {
      const extensionLabel = formatExtension(payload.extension);
      if (!labelIncludesToken(detailTitle, extensionLabel)) {
        pills.push(extensionLabel);
      }
    }
    els.detailPanel.innerHTML = `
      <article class="detail-card">
        <h3 class="detail-title">${escapeHtml(detailTitle)}</h3>
        <div class="item-meta">
          ${pills.map((pill) => `<span class="meta-pill">${escapeHtml(pill)}</span>`).join('')}
        </div>
        ${originalName ? `<p class="meta-row">${escapeHtml(originalName)}</p>` : ''}
        ${detailTrail ? `<p class="meta-row">${escapeHtml(detailTrail)}</p>` : ''}
        <div class="item-actions">
          <button type="button" class="ghost-button" data-action="copy-current-link">Скопировать ссылку</button>
          <a class="link-button" href="${escapeHtml(payload.downloadUrl)}">Скачать</a>
          <button type="button" class="item-action" data-action="open-folder" data-id="${escapeHtml(payload.parentId)}">К разделу</button>
        </div>
      </article>
    `;
    setInspectorOpen(true);
    setDocumentTitle(detailTitle);
  }

  function renderDetailPlaceholder() {
    state.detail = null;
    els.detailPanel.innerHTML = `
      <div class="panel-empty">
        <strong>Файл</strong>
        <span>Выберите материал.</span>
      </div>
    `;
  }

  async function loadBootstrap() {
    const payload = await api('bootstrap');
    state.bootstrap = payload;
    setDocumentTitle('');
    renderSetupBanner(payload.setupMessage || '');
    state.exampleIndex = { good: 0, debate: 0 };
    state.exampleTab = (payload.examples && Array.isArray(payload.examples.good) && payload.examples.good.length) ? 'good' : 'debate';
    renderHeroExamples();
    renderBrandRoutes(payload);
    state.featurePanels = buildFeaturePanels(payload);
    renderFeaturePanels(state.featurePanels);
    renderHeroStats(payload.stats || {}, payload.sections || []);
    renderTopSearches(payload.topSearches || []);
    void hydrateFeaturePanels();
  }

  async function openRoot(options = {}) {
    setLoading('Главное меню');
    setInspectorOpen(false);
    setActiveRoute('');
    renderDetailPlaceholder();
    const payload = await api('folder');
    renderFolder(payload);
    if (els.searchInput) {
      els.searchInput.value = '';
    }
    if (options.history !== 'none') {
      syncRouteWithState(options.history || 'push');
    }
  }

  async function openFolder(id, page, options = {}) {
    if (!id) {
      await openRoot(options);
      return;
    }
    setLoading('Открываю раздел');
    setInspectorOpen(false);
    renderDetailPlaceholder();
    const payload = await api('folder', { id, page: page || 0 });
    const topRouteId = payload.root ? '' : (payload.breadcrumbs && payload.breadcrumbs[1] ? payload.breadcrumbs[1].id : payload.folder.id);
    setActiveRoute(topRouteId);
    renderFolder(payload);
    if (els.searchInput) {
      els.searchInput.value = '';
    }
    if (options.history !== 'none') {
      syncRouteWithState(options.history || 'push');
    }
  }

  async function search(query, options = {}) {
    const normalizedQuery = String(query || '').trim();
    if (!normalizedQuery) {
      await openRoot(options);
      return;
    }
    setLoading('Поиск', 'Ищу материалы по запросу.');
    setInspectorOpen(false);
    setActiveRoute('');
    renderDetailPlaceholder();
    const payload = await api('search', { q: normalizedQuery });
    renderSearch(payload);
    if (els.searchInput) {
      els.searchInput.value = payload.query || normalizedQuery;
    }
    if (options.history !== 'none') {
      syncRouteWithState(options.history || 'push');
    }
  }

  async function openFile(id, options = {}) {
    const payload = await api('file', { id });
    renderDetail(payload);
    if (options.history !== 'none') {
      syncRouteWithState(options.history || 'push');
    }
  }

  function goBack() {
    if (state.current && state.current.kind === 'folder') {
      const crumbs = state.current.payload.breadcrumbs || [];
      if (crumbs.length > 1) {
        openFolder(crumbs[crumbs.length - 2].id, 0);
        return;
      }
    }
    openRoot();
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'toggle-workspace') {
      setWorkspaceCollapsed(!state.workspaceCollapsed);
      return;
    }
    if (action === 'toggle-catalog-mode') {
      setCatalogMode(!state.catalogMode);
      return;
    }
    if (action === 'toggle-brand-routes') {
      setBrandRoutesOpen(!state.brandRoutesOpen, { focus: !state.brandRoutesOpen });
      return;
    }
    if (action === 'examples-tab') {
      setExampleTab(target.dataset.tab || 'good');
      return;
    }
    if (action === 'examples-shift') {
      shiftExample(Number(target.dataset.direction || '0'));
      return;
    }
    if (action === 'examples-jump') {
      state.exampleIndex[state.exampleTab] = Math.max(0, Number.parseInt(target.dataset.index || '0', 10));
      renderHeroExamples();
      return;
    }
    if (action === 'toggle-example-autoplay') {
      setExampleAutoplay(!state.exampleAutoplay);
      return;
    }
    if (action === 'close-inspector') {
      closeInspector('replace');
      return;
    }
    if (action === 'copy-current-link') {
      void handleCopyCurrentLink(target);
      return;
    }
    if (action === 'scroll-rail') {
      scrollRailById(target.dataset.target, Number(target.dataset.direction || '0'));
      return;
    }
    if (['open-folder', 'open-folder-page', 'open-file', 'search-chip', 'go-root', 'back'].includes(action)) {
      if (state.brandRoutesOpen) {
        setBrandRoutesOpen(false);
      }
      ensureWorkspaceVisible();
      focusWorkspace(target);
    }
    if (action === 'open-folder') openFolder(target.dataset.id, 0);
    if (action === 'open-folder-page') openFolder(target.dataset.id, Number.parseInt(target.dataset.page || '0', 10));
    if (action === 'open-file') openFile(target.dataset.id);
    if (action === 'search-chip') {
      els.searchInput.value = target.dataset.query || '';
      search(target.dataset.query || '');
    }
    if (action === 'go-root') openRoot();
    if (action === 'back') goBack();
  });

  els.searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    ensureWorkspaceVisible();
    focusWorkspace(els.searchForm);
    search(els.searchInput.value.trim());
  });

  document.addEventListener('keydown', (event) => {
    const targetTag = String(event.target?.tagName || '').toLowerCase();
    const typingContext = ['input', 'textarea', 'select'].includes(targetTag) || event.target?.isContentEditable;
    if (event.key === 'Escape') {
      if (state.brandRoutesOpen) {
        setBrandRoutesOpen(false);
        return;
      }
      if (state.inspectorOpen) {
        closeInspector('replace');
      }
    }
    if (typingContext) {
      return;
    }
    if (event.key === 'ArrowLeft' && document.activeElement && els.heroExamples?.contains(document.activeElement)) {
      shiftExample(-1);
    }
    if (event.key === 'ArrowRight' && document.activeElement && els.heroExamples?.contains(document.activeElement)) {
      shiftExample(1);
    }
  });

  if (els.heroExamples) {
    els.heroExamples.addEventListener('mouseenter', () => {
      exampleAutoplayPaused = true;
      stopExampleAutoplay();
    });
    els.heroExamples.addEventListener('mouseleave', () => {
      exampleAutoplayPaused = false;
      scheduleExampleAutoplay();
    });
  }

  enhanceHorizontalRail(els.featuredShelves);

  document.addEventListener('click', (event) => {
    if (!state.brandRoutesOpen) {
      return;
    }
    if (event.target.closest('#brand-routes-toggle') || event.target.closest('#brand-routes-panel')) {
      return;
    }
    setBrandRoutesOpen(false);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopExampleAutoplay();
      return;
    }
    scheduleExampleAutoplay();
  });

  window.addEventListener('popstate', () => {
    restoreRouteFromLocation().catch((error) => {
      console.error(error);
    });
  });

  try {
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    window.localStorage.removeItem(CATALOG_MODE_STORAGE_KEY);
  } catch (error) {
    console.warn(error);
  }

  setWorkspaceCollapsed(initialWorkspaceCollapsed());
  setCatalogMode(DEFAULT_CATALOG_MODE);

  setInspectorOpen(false);

  loadBootstrap()
    .then(restoreRouteFromLocation)
    .catch((error) => {
      console.error(error);
      els.contentTitle.textContent = 'Ошибка запуска';
      els.contentHint.textContent = 'Не удалось загрузить данные сайта.';
      els.contentItems.innerHTML = `
        <div class="empty-state">
          <div class="empty-mark" aria-hidden="true">!</div>
          <div>
            <h3>Ошибка запуска</h3>
            <p class="detail-empty">${escapeHtml(error.message)}</p>
          </div>
        </div>
      `;
    });
  })();
}
