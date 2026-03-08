const state = {
  bootstrap: null,
  current: null,
  history: [],
  detail: null,
};

const els = {
  siteTitle: document.querySelector('#site-title'),
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

async function api(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function setLoading(title, hint = 'Загрузка...') {
  els.contentMode.textContent = 'Каталог';
  els.contentTitle.textContent = title;
  els.contentHint.textContent = hint;
  els.contentItems.innerHTML = '<div class="empty-state"><p>Загрузка...</p></div>';
  els.pagination.innerHTML = '';
}

function renderStats(stats) {
  const cards = [
    ['Всего', stats.totalAssets],
    ['Файлы', stats.files],
    ['Папки', stats.folders],
    ['Поиски', stats.searches],
    ['Пустые', stats.emptySearches],
  ];
  els.statsGrid.innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="surface stat-card">
          <p class="stat-label">${escapeHtml(label)}</p>
          <p class="stat-value">${escapeHtml(value)}</p>
        </article>
      `
    )
    .join('');
}

function renderRootSections(items) {
  els.rootSections.innerHTML = items
    .map(
      (item) => `
        <button class="nav-card" data-action="open-folder" data-id="${item.id}">
          <strong>${escapeHtml(item.icon)} ${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.kindLabel)}</span>
        </button>
      `
    )
    .join('');
}

function renderFavorites(items) {
  els.favoritesList.innerHTML = items
    .map((item) => {
      const action = item.type === 'folder' ? 'open-folder' : 'open-file';
      return `
        <button class="favorite-card" data-action="${action}" data-id="${item.id}">
          <strong>${escapeHtml(item.icon)} ${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.kindLabel)}${item.uses ? ` • ${item.uses} использ.` : ''}</span>
        </button>
      `;
    })
    .join('');
}

function renderTopSearches(items) {
  els.topSearches.innerHTML = items
    .map(
      (item) => `<button type="button" class="chip" data-action="search-chip" data-query="${escapeHtml(item.query)}">${escapeHtml(item.query)}</button>`
    )
    .join('');
}

function renderBreadcrumbs(items) {
  els.breadcrumbs.innerHTML = items
    .map((item, index) => {
      if (index === items.length - 1 || item.type !== 'folder') {
        return `<span>${escapeHtml(item.name)}</span>`;
      }
      return `<button type="button" class="breadcrumb" data-action="open-folder" data-id="${item.id}">${escapeHtml(item.name)}</button>`;
    })
    .join('<span>›</span>');
}

function itemCard(item) {
  const actionButton = item.type === 'folder'
    ? `<button class="item-action" data-action="open-folder" data-id="${item.id}">Открыть</button>`
    : `<button class="item-action" data-action="open-file" data-id="${item.id}">Подробнее</button>
       <a class="link-button" href="${item.downloadUrl}">Скачать</a>`;

  return `
    <article class="result-card ${escapeHtml(item.type)}">
      <div>
        <strong>${escapeHtml(item.icon)} ${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.relativePath || '')}</span>
      </div>
      <div class="item-meta">
        <span class="meta-pill">${escapeHtml(item.kindLabel)}</span>
        ${item.sizeLabel ? `<span class="meta-pill">${escapeHtml(item.sizeLabel)}</span>` : ''}
        ${item.extension ? `<span class="meta-pill">${escapeHtml(item.extension.toUpperCase())}</span>` : ''}
      </div>
      <div class="item-actions">${actionButton}</div>
    </article>
  `;
}

function renderItems(items, emptyText) {
  if (!items.length) {
    els.contentItems.innerHTML = `
      <div class="empty-state">
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
    buttons.push(`<button class="ghost-button" data-action="open-folder-page" data-id="${payload.folder.id}" data-page="${payload.page - 1}">◀ Назад</button>`);
  }
  buttons.push(`<span class="meta-pill">Страница ${payload.page + 1} / ${payload.maxPage + 1}</span>`);
  if (payload.page < payload.maxPage) {
    buttons.push(`<button class="ghost-button" data-action="open-folder-page" data-id="${payload.folder.id}" data-page="${payload.page + 1}">Вперед ▶</button>`);
  }
  els.pagination.innerHTML = buttons.join('');
}

function renderFolder(payload) {
  state.current = { kind: 'folder', payload };
  els.contentMode.textContent = payload.root ? 'Главная' : 'Раздел';
  els.contentTitle.textContent = payload.folder.label || payload.folder.name;
  els.contentHint.textContent = payload.hint || 'Открой нужную папку или скачай файл.';
  renderBreadcrumbs(payload.breadcrumbs || []);
  renderItems(payload.items, 'Раздел пуст');
  renderPagination(payload);
}

function renderSearch(payload) {
  state.current = { kind: 'search', payload };
  els.contentMode.textContent = 'Поиск';
  els.contentTitle.textContent = payload.query ? `Результаты: ${payload.query}` : 'Поиск';
  els.contentHint.textContent = payload.total
    ? `Найдено ${payload.total} элементов.`
    : 'Пупупу....пусто';
  els.breadcrumbs.innerHTML = '';
  renderItems(payload.items, payload.emptyState || 'Пусто');
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
        <a class="link-button" href="${payload.downloadUrl}">Скачать</a>
        <button class="item-action" data-action="open-folder" data-id="${payload.parentId}">К разделу</button>
      </div>
    </article>
  `;
}

async function refreshFavorites() {
  try {
    const payload = await api('/api/favorites');
    renderFavorites(payload.items || []);
  } catch (err) {
    console.error(err);
  }
}

async function loadBootstrap() {
  state.bootstrap = await api('/api/bootstrap');
  document.title = state.bootstrap.title;
  els.siteTitle.textContent = state.bootstrap.title;
  renderStats(state.bootstrap.stats);
  renderRootSections(state.bootstrap.sections);
  renderFavorites(state.bootstrap.favorites);
  renderTopSearches(state.bootstrap.topSearches || []);
}

async function openRoot() {
  setLoading('Главное меню');
  const payload = await api('/api/folder');
  renderFolder(payload);
}

async function openFolder(id, page = 0) {
  if (!id) {
    await openRoot();
    return;
  }
  setLoading('Открываю раздел');
  const payload = await api(`/api/folder?id=${encodeURIComponent(id)}&page=${page}`);
  renderFolder(payload);
  await refreshFavorites();
}

async function search(query) {
  setLoading('Поиск', 'Подбираю совпадения по файлам и папкам...');
  const payload = await api(`/api/search?q=${encodeURIComponent(query)}`);
  renderSearch(payload);
  await refreshFavorites();
}

async function openFile(id) {
  const payload = await api(`/api/file?id=${encodeURIComponent(id)}`);
  renderDetail(payload);
}

function goBack() {
  if (state.current?.kind === 'folder' && state.current.payload?.breadcrumbs?.length > 1) {
    const crumbs = state.current.payload.breadcrumbs;
    const parent = crumbs[crumbs.length - 2];
    openFolder(parent.id);
    return;
  }
  openRoot();
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  if (action === 'open-folder') openFolder(target.dataset.id);
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
  const query = els.searchInput.value.trim();
  search(query);
});

(async function init() {
  try {
    await loadBootstrap();
    await openRoot();
  } catch (err) {
    console.error(err);
    els.contentTitle.textContent = 'Ошибка запуска';
    els.contentHint.textContent = 'Не удалось загрузить данные сайта.';
    els.contentItems.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
  }
})();
