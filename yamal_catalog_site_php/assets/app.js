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

  const state = {
    bootstrap: null,
    current: null,
    detail: null,
    activeRouteId: '',
    workspaceCollapsed: false,
    catalogMode: false,
    inspectorOpen: false,
    featurePanels: [],
  };

  const els = {
    pageShell: document.querySelector('.page-shell'),
    heroStats: document.querySelector('#hero-stats'),
    brandRoutes: document.querySelector('#brand-routes'),
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
    try {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, state.workspaceCollapsed ? '1' : '0');
    } catch (error) {
      console.warn(error);
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
      setWorkspaceCollapsed(false);
      els.workspaceShell?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (els.workspaceCopy) {
      els.workspaceCopy.textContent = state.catalogMode
        ? 'Включен режим каталога.'
        : 'Все разделы и файлы в одном потоке.';
    }
    try {
      window.localStorage.setItem(CATALOG_MODE_STORAGE_KEY, state.catalogMode ? '1' : '0');
    } catch (error) {
      console.warn(error);
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

  function findSectionByName(sections, sectionName) {
    return (sections || []).find((item) => item && item.name === sectionName) || null;
  }

  function renderBrandRoutes(bootstrap) {
    const sections = bootstrap.sections || [];
    const blueprints = [
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

    els.brandRoutes.innerHTML = blueprints.map((item) => {
      const section = findSectionByName(sections, item.sectionName);
      const action = section ? 'open-folder' : 'search-chip';
      const target = section ? section.id : item.query;
      const attr = section ? `data-id="${escapeHtml(target)}"` : `data-query="${escapeHtml(target)}"`;
      const isActive = section && state.activeRouteId === section.id;
      return `
        <button type="button" class="brand-route-card ${escapeHtml(item.tone)}${isActive ? ' active' : ''}" data-action="${action}" data-route-id="${section ? escapeHtml(section.id) : ''}" ${attr}${isActive ? ' aria-current="page"' : ''}>
          <span class="brand-route-icon" aria-hidden="true">${escapeHtml(item.mark)}</span>
          <strong>${escapeHtml(item.label)}</strong>
          <span class="brand-route-arrow" aria-hidden="true">↗</span>
        </button>
      `;
    }).join('');
  }

  function buildFeaturePanels(bootstrap) {
    const sections = bootstrap.sections || [];
    const panels = [
      {
        badge: 'Брендбук',
        title: 'Мастер-бренд',
        sectionName: 'Брендбук ЯМАЛ Мастер бренд',
        query: 'брендбук ямал мастер pdf',
        previewQuery: 'фирменный знак svg',
        tone: 'tone-master',
        defaultPreview: {
          kind: 'asset',
          src: siteConfig.brandMarkAsset || siteConfig.brandLogoAsset,
          alt: 'Фирменный знак Ямала',
          label: 'SVG',
          source: 'Фирменный знак',
          fit: 'contain',
        },
        text: 'Главный брендбук и базовые правила.',
      },
      {
        badge: 'Логотип',
        title: 'Базовые версии',
        sectionName: 'Логотип',
        query: 'главный логотип svg',
        previewQuery: 'главный логотип svg',
        tone: 'tone-logo',
        defaultPreview: {
          kind: 'asset',
          src: siteConfig.brandLogoAsset,
          alt: 'Основной логотип Ямала',
          label: 'SVG',
          source: 'Основной логотип',
          fit: 'contain',
        },
        text: 'Логотипы и рабочие форматы.',
      },
      {
        badge: 'Города',
        title: 'Региональные линии',
        sectionName: 'Логотипы городов',
        query: 'салехард логотип',
        previewQuery: 'салехард логотип svg',
        tone: 'tone-city',
        defaultPreview: {
          kind: 'asset',
          src: siteConfig.brandLogoAsset,
          alt: 'Городские версии бренда Ямала',
          label: 'Города',
          source: 'Салехард, Новый Уренгой, Ноябрьск',
          fit: 'contain',
        },
        text: 'Городские версии бренда.',
      },
      {
        badge: 'Носители',
        title: 'Сувениры и диджитал',
        sectionName: 'Каталог сувенирной продукции',
        query: 'наклейка',
        previewQuery: 'наклейка png',
        tone: 'tone-digital',
        defaultPreview: {
          kind: 'asset',
          src: siteConfig.brandMarkAsset || siteConfig.brandLogoAsset,
          alt: 'Каталог носителей',
          label: 'Каталог',
          source: 'Сувениры и цифровые материалы',
          fit: 'contain',
        },
        text: 'Сувениры, полиграфия, диджитал.',
      },
    ];

    return panels.map((item) => {
      const section = findSectionByName(sections, item.sectionName);
      return {
        ...item,
        action: section ? 'open-folder' : 'search-chip',
        target: section ? section.id : item.query,
        preview: item.defaultPreview,
      };
    });
  }

  function renderFeaturePanels(panels) {
    if (!els.featuredShelves) return;
    els.featuredShelves.innerHTML = (panels || []).map((item) => {
      const attr = item.action === 'open-folder'
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
        src: panel.defaultPreview?.src || siteConfig.brandLogoAsset || siteConfig.brandMarkAsset || '',
        alt: preferred.label || panel.title,
        label: formatExtension(preferred.extension),
        source: trimPreviewLabel(preferred.label || preferred.name),
        fit: 'contain',
      };
    }

    return panel.defaultPreview || null;
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
    els.contentMode.textContent = payload.root ? 'Главная' : 'Раздел';
    els.contentTitle.textContent = payload.folder.label || payload.folder.name;
    els.contentHint.textContent = payload.hint || 'Открой раздел или файл.';
    renderBreadcrumbs(payload.breadcrumbs || []);
    renderItems(payload.items || [], 'Раздел пуст');
    renderPagination(payload);
  }

  function renderSearch(payload) {
    state.current = { kind: 'search', payload };
    els.contentMode.textContent = 'Поиск';
    els.contentTitle.textContent = payload.query ? `Поиск: ${payload.query}` : 'Поиск';
    els.contentHint.textContent = payload.total
      ? `${formatNumber(payload.total)} результатов`
      : 'Ничего не найдено.';
    els.breadcrumbs.innerHTML = '';
    renderItems(payload.items || [], payload.emptyState || 'Пусто');
    els.pagination.innerHTML = '';
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
          <a class="link-button" href="${escapeHtml(payload.downloadUrl)}">Скачать</a>
          <button type="button" class="item-action" data-action="open-folder" data-id="${escapeHtml(payload.parentId)}">К разделу</button>
        </div>
      </article>
    `;
    setInspectorOpen(true);
  }

  function renderDetailPlaceholder() {
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
    document.title = `${payload.title} — каталог`;
    renderSetupBanner(payload.setupMessage || '');
    renderBrandRoutes(payload);
    state.featurePanels = buildFeaturePanels(payload);
    renderFeaturePanels(state.featurePanels);
    renderHeroStats(payload.stats || {}, payload.sections || []);
    renderTopSearches(payload.topSearches || []);
    void hydrateFeaturePanels();
  }

  async function openRoot() {
    setLoading('Главное меню');
    setInspectorOpen(false);
    setActiveRoute('');
    renderDetailPlaceholder();
    const payload = await api('folder');
    renderFolder(payload);
  }

  async function openFolder(id, page) {
    if (!id) {
      await openRoot();
      return;
    }
    setLoading('Открываю раздел');
    setInspectorOpen(false);
    renderDetailPlaceholder();
    const payload = await api('folder', { id, page: page || 0 });
    const topRouteId = payload.root ? '' : (payload.breadcrumbs && payload.breadcrumbs[1] ? payload.breadcrumbs[1].id : payload.folder.id);
    setActiveRoute(topRouteId);
    renderFolder(payload);
  }

  async function search(query) {
    setLoading('Поиск', 'Ищу материалы по запросу.');
    setInspectorOpen(false);
    setActiveRoute('');
    renderDetailPlaceholder();
    const payload = await api('search', { q: query || '' });
    renderSearch(payload);
  }

  async function openFile(id) {
    const payload = await api('file', { id });
    renderDetail(payload);
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
    if (action === 'close-inspector') {
      setInspectorOpen(false);
      return;
    }
    if (['open-folder', 'open-folder-page', 'open-file', 'search-chip', 'go-root', 'back'].includes(action)) {
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
    if (event.key === 'Escape' && state.inspectorOpen) {
      setInspectorOpen(false);
    }
  });

  try {
    setWorkspaceCollapsed(window.localStorage.getItem(WORKSPACE_STORAGE_KEY) === '1');
  } catch (error) {
    console.warn(error);
  }

  try {
    setCatalogMode(window.localStorage.getItem(CATALOG_MODE_STORAGE_KEY) === '1');
  } catch (error) {
    console.warn(error);
  }

  setInspectorOpen(false);

  loadBootstrap()
    .then(openRoot)
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
