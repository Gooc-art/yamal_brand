(function () {
  const siteConfig = window.YAMAL_SITE || { apiBase: 'api.php?action=', downloadBase: 'download.php?id=' };
  const fallbackTopSearches = ['логотип', 'брендбук', 'паттерны', 'салехард', 'наклейка', 'svg'];

  const state = {
    bootstrap: null,
    current: null,
    detail: null,
  };

  const els = {
    siteTitle: document.querySelector('#site-title'),
    brandRoutes: document.querySelector('#brand-routes'),
    setupBanner: document.querySelector('#setup-banner'),
    statsGrid: document.querySelector('#stats-grid'),
    rootSections: document.querySelector('#root-sections'),
    favoritesList: document.querySelector('#favorites-list'),
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
        number: '01',
        label: 'Мастер-бренд',
        sectionName: 'Брендбук ЯМАЛ Мастер бренд',
        query: 'мастер бренд',
        badge: 'Брендбук',
        tone: 'tone-master',
        text: 'Опорный брендбук с правилами, носителями и системой постоянных элементов.',
      },
      {
        number: '02',
        label: 'ЯМАЛ 100',
        sectionName: 'Брендбук ЯМАЛ 100',
        query: 'ямал 100',
        badge: 'Брендбук',
        tone: 'tone-anniversary',
        text: 'Юбилейная линия со своим знаком, праздничными логотипами и отдельным набором материалов.',
      },
      {
        number: '03',
        label: 'Городские версии',
        sectionName: 'Логотипы городов',
        query: 'салехард',
        badge: 'Иерархия',
        tone: 'tone-city',
        text: 'Линии для Салехарда, Нового Уренгоя и Ноябрьска с самостоятельными вариантами логотипов.',
      },
      {
        number: '04',
        label: 'Логотип',
        sectionName: 'Логотип',
        query: 'логотип',
        badge: 'Стандарт',
        tone: 'tone-logo',
        text: 'Основной логотип, охранные поля, угловые версии и рабочие экспортные форматы.',
      },
      {
        number: '05',
        label: 'Фирменный знак',
        sectionName: 'Фирменный знак',
        query: 'фирменный знак',
        badge: 'Стандарт',
        tone: 'tone-mark',
        text: 'Знак Ямала и версии со словесной частью для самостоятельного применения.',
      },
       {
        number: '06',
        label: 'Цвет и паттерны',
        sectionName: 'Паттерны',
        query: 'паттерн',
        badge: 'Система',
        tone: 'tone-pattern',
        text: 'Цветовые сочетания, графические поверхности и паттерны для среды и носителей.',
      },
      {
        number: '07',
        label: 'Типографика',
        sectionName: 'Шрифт',
        query: 'шрифт',
        badge: 'Система',
        tone: 'tone-type',
        text: 'Шрифтовые материалы и типографическая основа для деловой и презентационной верстки.',
      },
      {
        number: '08',
        label: 'Графические элементы',
        sectionName: 'Иллюстрации мастер-бренда SVG-элементы',
        query: 'иллюстрации svg',
        badge: 'Графика',
        tone: 'tone-graphics',
        text: 'SVG, иллюстрации и дополнительные фирменные элементы для носителей и цифровых макетов.',
      },
    ];

    els.brandRoutes.innerHTML = blueprints.map((item) => {
      const section = findSectionByName(sections, item.sectionName);
      const action = section ? 'open-folder' : 'search-chip';
      const target = section ? section.id : item.query;
      const attr = section ? `data-id="${escapeHtml(target)}"` : `data-query="${escapeHtml(target)}"`;
      const helper = section ? section.relativePath || section.name : `Запрос: ${item.query}`;
      return `
        <button type="button" class="brand-route-card ${escapeHtml(item.tone)}" data-action="${action}" ${attr}>
          <span class="brand-route-number">${escapeHtml(item.number)}</span>
          <span class="brand-route-badge">${escapeHtml(item.badge)}</span>
          <strong>${escapeHtml(item.label)}</strong>
          <span class="brand-route-text">${escapeHtml(item.text)}</span>
          <span class="brand-route-helper">${escapeHtml(helper)}</span>
        </button>
      `;
    }).join('');
  }

  function renderStats(stats, sections) {
    const rootSections = Array.isArray(sections) ? sections.length : 0;
    const brandbooks = (sections || []).filter((item) => /брендбук/i.test(String(item && item.name || ''))).length;
    const cards = [
      ['Материалы', stats.totalAssets, 'Все файлы и папки каталога', '01', 'tone-accent'],
      ['Файлы', stats.files, 'Готовые материалы для скачивания', '02', 'tone-teal'],
      ['Разделы', rootSections, 'Основные точки входа в каталог', '03', 'tone-slate'],
      ['Брендбуки', brandbooks, 'Ключевые руководства по системе бренда', '04', 'tone-soft'],
    ];
    els.statsGrid.innerHTML = cards.map(([label, value, note, icon, tone]) => `
      <article class="surface stat-card ${tone}">
        <div class="stat-top">
          <p class="stat-label">${escapeHtml(label)}</p>
          <span class="stat-icon">${escapeHtml(icon)}</span>
        </div>
        <p class="stat-value">${escapeHtml(formatNumber(value))}</p>
        <p class="stat-note">${escapeHtml(note)}</p>
      </article>
    `).join('');
  }

  function renderRootSections(items) {
    if (!items.length) {
      els.rootSections.innerHTML = `
        <div class="panel-empty">
          <strong>Разделы появятся позже</strong>
          <span>Как только каталог прогрузится, здесь появится корневое меню.</span>
        </div>
      `;
      return;
    }
    els.rootSections.innerHTML = items.map((item) => `
      <button type="button" class="nav-card" data-action="open-folder" data-id="${escapeHtml(item.id)}">
        <span class="card-icon">${escapeHtml(item.icon)}</span>
        <span class="card-copy">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.kindLabel)}</span>
        </span>
        <span class="card-arrow">→</span>
      </button>
    `).join('');
  }

  function renderFavorites(items) {
    if (!items.length) {
      els.favoritesList.innerHTML = `
        <div class="panel-empty">
          <strong>Избранное пока пустое</strong>
          <span>Здесь появятся материалы, к которым возвращаются чаще всего.</span>
        </div>
      `;
      return;
    }
    els.favoritesList.innerHTML = items.map((item) => {
      const action = item.type === 'folder' ? 'open-folder' : 'open-file';
      const meta = item.uses ? `${item.kindLabel} • ${item.uses} использ.` : item.kindLabel;
      return `
        <button type="button" class="favorite-card" data-action="${action}" data-id="${escapeHtml(item.id)}">
          <span class="card-icon">${escapeHtml(item.icon)}</span>
          <span class="card-copy">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(meta)}</span>
          </span>
          <span class="card-arrow">↗</span>
        </button>
      `;
    }).join('');
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
    const secondary = item.relativePath && item.relativePath !== item.label ? item.relativePath : item.kindLabel;
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
            <span>${escapeHtml(secondary || '')}</span>
          </div>
        </div>
        <div class="item-meta">
          <span class="meta-pill">${escapeHtml(item.kindLabel)}</span>
          ${item.sizeLabel ? `<span class="meta-pill">${escapeHtml(item.sizeLabel)}</span>` : ''}
          ${item.extension ? `<span class="meta-pill">${escapeHtml(item.extension.toUpperCase())}</span>` : ''}
        </div>
        <p class="result-path">${escapeHtml(item.relativePath || item.name || '')}</p>
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
            <p class="detail-empty">Попробуй другой запрос или вернись в меню разделов.</p>
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
    els.contentHint.textContent = payload.hint || 'Открой нужную папку или скачай файл.';
    renderBreadcrumbs(payload.breadcrumbs || []);
    renderItems(payload.items || [], 'Раздел пуст');
    renderPagination(payload);
  }

  function renderSearch(payload) {
    state.current = { kind: 'search', payload };
    els.contentMode.textContent = 'Поиск';
    els.contentTitle.textContent = payload.query ? `Результаты: ${payload.query}` : 'Поиск';
    els.contentHint.textContent = payload.total
      ? `Найдено ${formatNumber(payload.total)} элементов. Открой файл или раздел прямо из списка.`
      : 'Совпадений не нашлось. Попробуй другой запрос, город, формат или название брендбука.';
    els.breadcrumbs.innerHTML = '';
    renderItems(payload.items || [], payload.emptyState || 'Пусто');
    els.pagination.innerHTML = '';
  }

  function renderDetail(payload) {
    state.detail = payload;
    const breadcrumb = (payload.breadcrumbs || []).map((item) => escapeHtml(item.name)).join(' › ');
    els.detailPanel.innerHTML = `
      <article class="detail-card">
        <p class="eyebrow">${escapeHtml(payload.kindLabel)}</p>
        <h3 class="detail-title">${escapeHtml(payload.name)}</h3>
        <div class="item-meta">
          ${payload.sizeLabel ? `<span class="meta-pill">${escapeHtml(payload.sizeLabel)}</span>` : ''}
          ${payload.extension ? `<span class="meta-pill">${escapeHtml(payload.extension.toUpperCase())}</span>` : ''}
        </div>
        <p class="meta-row">${escapeHtml(breadcrumb)}</p>
        <p class="detail-path">${escapeHtml(payload.pathLabel || payload.relativePath || '')}</p>
        <div class="item-actions">
          <a class="link-button" href="${escapeHtml(payload.downloadUrl)}">Скачать</a>
          <button type="button" class="item-action" data-action="open-folder" data-id="${escapeHtml(payload.parentId)}">К разделу</button>
        </div>
      </article>
    `;
  }

  function renderDetailPlaceholder() {
    els.detailPanel.innerHTML = `
      <div class="panel-empty">
        <strong>Карточка файла</strong>
        <span>Выберите файл, чтобы увидеть путь, формат, размер и ссылку на скачивание.</span>
      </div>
    `;
  }

  async function refreshFavorites() {
    try {
      const payload = await api('favorites');
      renderFavorites(payload.items || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadBootstrap() {
    const payload = await api('bootstrap');
    state.bootstrap = payload;
    document.title = `${payload.title} — каталог`;
    els.siteTitle.textContent = payload.title;
    renderSetupBanner(payload.setupMessage || '');
    renderBrandRoutes(payload);
    renderStats(payload.stats || {}, payload.sections || []);
    renderRootSections(payload.sections || []);
    renderFavorites(payload.favorites || []);
    renderTopSearches(payload.topSearches || []);
  }

  async function openRoot() {
    setLoading('Главное меню');
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
    const payload = await api('folder', { id, page: page || 0 });
    renderFolder(payload);
    await refreshFavorites();
  }

  async function search(query) {
    setLoading('Поиск', 'Ищу материалы по запросу.');
    const payload = await api('search', { q: query || '' });
    renderSearch(payload);
    await refreshFavorites();
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
    if (action === 'open-folder') openFolder(target.dataset.id, 0);
    if (action === 'open-folder-page') openFolder(target.dataset.id, Number.parseInt(target.dataset.page || '0', 10));
    if (action === 'open-file') openFile(target.dataset.id);
    if (action === 'search-chip') {
      els.searchInput.value = target.dataset.query || '';
      search(target.dataset.query || '');
    }
    if (action === 'go-root') openRoot();
    if (action === 'back') goBack();
    if (action === 'refresh-favorites') refreshFavorites();
  });

  els.searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    search(els.searchInput.value.trim());
  });

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
