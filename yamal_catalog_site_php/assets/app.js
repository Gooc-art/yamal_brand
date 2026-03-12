const YAMAL_ROUTE_QUERY_KEYS = ['view', 'folder', 'page', 'q', 'file', 'solution'];
const DEFAULT_WORKSPACE_COLLAPSED = true;
const DEFAULT_CATALOG_MODE = false;
const DEFAULT_SOLUTION_FILTER = 'all';
const CONSTRUCTOR_STYLE_FIELD_IDS = new Set(['color_variant', 'brand_lockup', 'background_style', 'palette_tone']);
const WORKSPACE_NAVIGATION_ACTIONS = new Set(['open-folder', 'open-folder-page', 'open-file', 'search-chip', 'open-constructor']);
const DEFAULT_CONSULTANT_INTENTS = [
  { id: 'logo', label: 'Нужен логотип', summary: 'Логотип и знак', description: 'Логотип, знак и базовые форматы.', prompt: 'логотип svg' },
  { id: 'brandbook', label: 'Нужен брендбук', summary: 'Брендбуки', description: 'Брендбук региона или города.', prompt: 'брендбук Салехард' },
  { id: 'fonts', label: 'Нужны шрифты', summary: 'Шрифты', description: 'TTF, OTF и архивы.', prompt: 'шрифт otf' },
  { id: 'city', label: 'Материалы города', summary: 'Городские версии', description: 'Городские логотипы и брендбуки.', prompt: 'материалы Салехарда' },
  { id: 'merch', label: 'Сувенирка и носители', summary: 'Сувенирка', description: 'Сувениры, полиграфия и диджитал.', prompt: 'сувенирка наклейки' },
  { id: 'graphics', label: 'SVG, паттерны, графика', summary: 'SVG и паттерны', description: 'SVG, паттерны и векторная графика.', prompt: 'svg паттерн' },
];

function clampRoutePage(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeRoute(route) {
  const view = route?.view === 'folder'
    ? 'folder'
    : route?.view === 'search'
      ? 'search'
      : route?.view === 'constructor'
        ? 'constructor'
        : 'root';
  const folderId = String(route?.folderId || route?.id || '').trim();
  const query = String(route?.query || route?.q || '').trim();
  const fileId = String(route?.fileId || route?.file || '').trim();
  const solutionId = String(route?.solutionId || route?.solution || '').trim();
  const page = clampRoutePage(route?.page);

  if (view === 'folder' && folderId) {
    return { view, folderId, query: '', page, fileId, solutionId: '' };
  }
  if (view === 'search' && query) {
    return { view, folderId: '', query, page: 0, fileId, solutionId: '' };
  }
  if (view === 'constructor' && solutionId) {
    return { view, folderId: '', query: '', page: 0, fileId, solutionId };
  }
  return { view: 'root', folderId: '', query: '', page: 0, fileId, solutionId: '' };
}

function routeFromUrl(inputUrl) {
  const url = new URL(String(inputUrl || 'http://localhost/'), 'http://localhost');
  const params = url.searchParams;
  const view = params.get('view');
  if (view === 'constructor' || params.get('solution')) {
    return normalizeRoute({
      view: 'constructor',
      solutionId: params.get('solution') || '',
      fileId: params.get('file') || '',
    });
  }
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
  } else if (normalized.view === 'constructor') {
    url.searchParams.set('view', 'constructor');
    url.searchParams.set('solution', normalized.solutionId);
  }

  if (normalized.fileId) {
    url.searchParams.set('file', normalized.fileId);
  }

  url.hash = '';
  return url.toString();
}

function inferBrandRouteTone(...values) {
  const source = values
    .map((value) => String(value || '').toLowerCase())
    .join(' ');
  if (source.includes('100')) return 'tone-anniversary';
  if (source.includes('мастер')) return 'tone-master';
  if (source.includes('город') || source.includes('салехард') || source.includes('уренгой') || source.includes('ноябрьск')) return 'tone-city';
  if (source.includes('логотип')) return 'tone-logo';
  if (source.includes('знак')) return 'tone-mark';
  if (source.includes('паттер') || source.includes('цвет')) return 'tone-pattern';
  if (source.includes('шрифт')) return 'tone-type';
  if (source.includes('svg') || source.includes('иллюстра')) return 'tone-graphics';
  if (source.includes('сувенир') || source.includes('полиграф') || source.includes('диджитал') || source.includes('каталог')) return 'tone-digital';
  return 'tone-master';
}

  function buildBrandRouteMark(section) {
  const icon = String(section?.icon || '').trim();
  if (icon && icon !== '📁') {
    return icon;
  }
  const label = String(section?.label || section?.name || '').trim();
  if (!label) {
    return '•';
  }
  if (/\b100\b/u.test(label)) {
    return '100';
  }
  if (/svg/iu.test(label)) {
    return 'SVG';
  }
  const compact = label
    .replace(/^Брендбук\s+/iu, '')
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token.replace(/[^0-9A-Za-zА-ЯЁ]/giu, '').slice(0, 1))
    .join('')
    .toUpperCase();
  return compact || '•';
}

function buildBrandRouteHint(section) {
  const source = `${section?.label || ''} ${section?.name || ''}`.toLowerCase();
  if (source.includes('брендбук')) return 'PDF и исходники';
  if (source.includes('город')) return 'Города и версии';
  if (source.includes('логотип')) return 'SVG, PNG, PDF';
  if (source.includes('знак')) return 'Знак и сочетания';
  if (source.includes('паттер') || source.includes('цвет')) return 'Паттерны и цвет';
  if (source.includes('шрифт')) return 'TTF, OTF, архивы';
  if (source.includes('иллюстра') || source.includes('svg')) return 'SVG и графика';
  if (source.includes('сувенир') || source.includes('канцеляр') || source.includes('полиграф') || source.includes('диджитал')) return 'Носители и макеты';
  if (source.includes('пример') || source.includes('внедрения') || source.includes('кейс')) return 'Хорошие и спорные';
  return 'Открыть раздел';
}

function buildBrandRouteCards(sections, activeRouteId = '') {
  return (Array.isArray(sections) ? sections : [])
    .filter((section) => section && section.id)
    .map((section) => {
      const label = String(section.label || section.name || 'Раздел').trim();
      const sourceName = String(section.name || label).trim();
      return {
        mark: buildBrandRouteMark(section),
        label,
        hint: buildBrandRouteHint(section),
        tone: inferBrandRouteTone(label, sourceName),
        action: 'open-folder',
        target: section.id,
        routeId: section.id,
        available: true,
        isActive: String(activeRouteId || '') === String(section.id || ''),
      };
    });
}

function buildBrandRoutesSummary(sections, activeRouteId = '') {
  const cards = buildBrandRouteCards(sections, activeRouteId);
  const activeCard = cards.find((item) => item.isActive) || null;
  return {
    cards,
    total: cards.length,
    available: cards.length,
    activeLabel: activeCard ? activeCard.label : '',
  };
}

function normalizeConstructorSolutions(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items
    .map((item) => ({
      id: String(item?.id || '').trim(),
      label: String(item?.label || '').trim(),
      summary: String(item?.summary || '').trim(),
      description: String(item?.description || '').trim(),
      icon: String(item?.icon || '▣').trim() || '▣',
      category: String(item?.category || '').trim(),
      formatHint: String(item?.formatHint || '').trim(),
      artifactKind: String(item?.artifactKind || '').trim(),
    }))
    .filter((item) => item.id && item.label);
}

function buildConstructorCategoryFilters(items, activeCategory = DEFAULT_SOLUTION_FILTER) {
  const source = Array.isArray(items) ? items : [];
  const counts = new Map();
  source.forEach((item) => {
    const category = String(item?.category || '').trim();
    if (!category) {
      return;
    }
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  const categories = Array.from(counts.keys()).sort((left, right) => left.localeCompare(right, 'ru'));
  const normalizedActive = counts.has(activeCategory) ? activeCategory : DEFAULT_SOLUTION_FILTER;
  const filters = [{
    id: DEFAULT_SOLUTION_FILTER,
    label: 'Все',
    count: source.length,
    active: normalizedActive === DEFAULT_SOLUTION_FILTER,
  }];

  categories.forEach((category) => {
    filters.push({
      id: category,
      label: category,
      count: counts.get(category) || 0,
      active: normalizedActive === category,
    });
  });

  return {
    activeCategory: normalizedActive,
    filters,
    visibleItems: normalizedActive === DEFAULT_SOLUTION_FILTER
      ? source
      : source.filter((item) => String(item?.category || '').trim() === normalizedActive),
  };
}

function isConstructorChoiceField(fieldId) {
  return CONSTRUCTOR_STYLE_FIELD_IDS.has(String(fieldId || '').trim());
}

function shouldAutoBuildConstructorField(fieldId, fieldType = '') {
  const normalizedType = String(fieldType || '').trim().toLowerCase();
  return isConstructorChoiceField(fieldId) || ['select', 'date', 'number'].includes(normalizedType);
}

function groupConstructorFields(fields) {
  const groups = [
    { id: 'basics', label: 'Базовые параметры', hint: 'Город, формат и основной режим носителя.', items: [] },
    { id: 'style', label: 'Оформление', hint: 'Цветовая версия, логотип и фоновые элементы по мотивам брендбука.', items: [] },
    { id: 'content', label: 'Содержание', hint: 'Заголовки, сообщения, событие и смысловой текст.', items: [] },
    { id: 'people', label: 'Люди и контакты', hint: 'ФИО, роли, подписи и контактные данные.', items: [] },
  ];
  const fieldList = Array.isArray(fields) ? fields : [];
  const peopleIds = new Set(['full_name', 'role', 'department', 'phone', 'email', 'speaker', 'speaker_role', 'signer', 'recipient', 'contact_line']);
  const basicsIds = new Set([
    'city',
    'variant',
    'size_variant',
    'room_number',
    'direction',
    'mount',
    'presentation_mode',
    'audience',
    'slide_count',
    'ratio',
    'access_level',
    'issue_date',
  ]);

  fieldList.forEach((field) => {
    const fieldId = String(field?.id || '').trim();
    if (!fieldId) {
      return;
    }
    if (basicsIds.has(fieldId)) {
      groups[0].items.push(field);
      return;
    }
    if (isConstructorChoiceField(fieldId)) {
      groups[1].items.push(field);
      return;
    }
    if (peopleIds.has(fieldId)) {
      groups[3].items.push(field);
      return;
    }
    groups[2].items.push(field);
  });

  return groups.filter((group) => group.items.length);
}

function formatDataSize(value) {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) {
    return '0 Б';
  }
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} МБ`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(size >= 10 * 1024 ? 0 : 1)} КБ`;
  }
  return `${Math.round(size)} Б`;
}

function pickConstructorPreviewArtifact(artifacts) {
  const normalized = Array.isArray(artifacts) ? artifacts : [];
  return normalized.find((artifact) => artifact?.previewType === 'svg')
    || normalized.find((artifact) => artifact?.previewType === 'html')
    || normalized.find((artifact) => artifact?.previewType === 'json')
    || normalized[0]
    || null;
}

function readConstructorPreviewBoxMetrics(markup) {
  const source = String(markup || '');
  if (!source) {
    return { width: 0, height: 0, ratio: 1 };
  }

  const viewBoxMatch = source.match(/viewBox=["']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s*["']/i);
  const widthMatch = source.match(/\bwidth=["']([0-9.]+)["']/i);
  const heightMatch = source.match(/\bheight=["']([0-9.]+)["']/i);

  const width = Number(viewBoxMatch?.[1] || widthMatch?.[1] || 0);
  const height = Number(viewBoxMatch?.[2] || heightMatch?.[1] || 0);
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 0;
  const ratio = safeWidth > 0 && safeHeight > 0 ? safeWidth / safeHeight : 1;

  return {
    width: safeWidth,
    height: safeHeight,
    ratio,
  };
}

function buildConstructorPreviewLayout(definition, artifact) {
  const previewType = String(artifact?.previewType || '').trim();
  const solutionId = String(definition?.id || '').trim();

  if (previewType === 'html') {
    return {
      profile: 'brief',
      stageClass: 'constructor-preview-stage is-brief',
      visualClass: 'constructor-preview-visual is-brief',
      frameClass: 'constructor-preview-frame is-brief',
      codeClass: 'constructor-preview-code is-brief',
    };
  }

  if (previewType === 'json') {
    return {
      profile: 'code',
      stageClass: 'constructor-preview-stage is-code',
      visualClass: 'constructor-preview-visual is-code',
      frameClass: 'constructor-preview-frame is-code',
      codeClass: 'constructor-preview-code is-code',
    };
  }

  const metrics = readConstructorPreviewBoxMetrics(artifact?.content || '');
  let profile = 'landscape';

  if (solutionId === 'rollup') {
    profile = 'tower';
  } else if (solutionId === 'letterhead') {
    profile = 'document';
  } else if (metrics.ratio >= 2.05) {
    profile = 'panorama';
  } else if (metrics.ratio >= 1.18) {
    profile = 'landscape';
  } else if (metrics.ratio >= 0.88) {
    profile = 'square';
  } else if (metrics.ratio >= 0.58) {
    profile = 'portrait';
  } else {
    profile = 'tower';
  }

  return {
    profile,
    stageClass: `constructor-preview-stage is-${profile}`,
    visualClass: `constructor-preview-visual is-${profile}`,
    frameClass: `constructor-preview-frame is-${profile}`,
    codeClass: `constructor-preview-code is-${profile}`,
  };
}

function buildConstructorChoicePreview(fieldId, option) {
  const token = String(option?.mark || option?.label || option?.value || '').trim().slice(0, 10);
  if (fieldId === 'palette_tone') {
    const swatch = String(option?.swatch || '').trim() || '#f6f0e7';
    const dark = Boolean(option?.dark);
    return `
      <span class="constructor-choice-visual constructor-choice-visual-swatch${dark ? ' is-dark' : ''}" style="--choice-tone:${escapeHtml(swatch)};">
        <span class="constructor-choice-swatch" aria-hidden="true"></span>
        <span class="constructor-choice-token">${escapeHtml(token)}</span>
      </span>
    `;
  }
  return `<span class="constructor-choice-visual constructor-choice-visual-token">${escapeHtml(token)}</span>`;
}

function collectConstructorFormInput(form) {
  const input = {};
  new FormData(form).forEach((value, key) => {
    input[key] = String(value);
  });
  return input;
}

function normalizeConstructorHandoff(handoff) {
  const normalizeArtifacts = (items) => (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: String(item?.id || '').trim(),
      label: String(item?.label || '').trim(),
      filename: String(item?.filename || '').trim(),
      previewType: String(item?.previewType || '').trim(),
      sizeBytes: Number(item?.sizeBytes || 0),
      note: String(item?.note || '').trim(),
    }))
    .filter((item) => item.id && item.label);

  const normalizeFiles = (items) => (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: String(item?.id || '').trim(),
      label: String(item?.label || item?.name || '').trim(),
      relativePath: String(item?.relativePath || '').trim(),
      downloadUrl: String(item?.downloadUrl || '').trim(),
      extension: String(item?.extension || '').trim(),
      kindLabel: String(item?.kindLabel || '').trim(),
    }))
    .filter((item) => item.id && item.label);

  const normalizeSections = (items) => (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: String(item?.id || '').trim(),
      label: String(item?.label || item?.name || '').trim(),
      name: String(item?.name || '').trim(),
      icon: String(item?.icon || '📁').trim() || '📁',
      kindLabel: String(item?.kindLabel || 'Раздел').trim() || 'Раздел',
    }))
    .filter((item) => item.id && item.label);

  const normalizePack = (pack, fallbackId, fallbackTitle, fallbackSummary) => ({
    id: String(pack?.id || fallbackId).trim(),
    title: String(pack?.title || fallbackTitle).trim(),
    summary: String(pack?.summary || fallbackSummary).trim(),
    bullets: (Array.isArray(pack?.bullets) ? pack.bullets : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean),
    nextStep: String(pack?.nextStep || '').trim(),
    artifacts: normalizeArtifacts(pack?.artifacts),
    files: normalizeFiles(pack?.files),
    sections: normalizeSections(pack?.sections),
  });

  return {
    generated: Boolean(handoff?.generated),
    note: String(handoff?.note || '').trim(),
    cityLabel: String(handoff?.cityLabel || '').trim(),
    solutionLabel: String(handoff?.solutionLabel || '').trim(),
    approval: normalizePack(
      handoff?.approval,
      'approval',
      'На согласование',
      'Покажите визуальный каркас и brief команде или заказчику.',
    ),
    contractor: normalizePack(
      handoff?.contractor,
      'contractor',
      'Подрядчику',
      'Передайте подрядчику артефакты, исходники и разделы каталога.',
    ),
  };
}

function computeRevealScrollLeft({
  currentScrollLeft = 0,
  maxScrollLeft = 0,
  containerLeft = 0,
  containerRight = 0,
  itemLeft = 0,
  itemRight = 0,
  padding = 0,
}) {
  const safeMax = Math.max(0, Number(maxScrollLeft) || 0);
  const current = Math.max(0, Math.min(safeMax, Number(currentScrollLeft) || 0));
  const leftEdge = Number(containerLeft) + Math.max(0, Number(padding) || 0);
  const rightEdge = Number(containerRight) - Math.max(0, Number(padding) || 0);
  const left = Number(itemLeft) || 0;
  const right = Number(itemRight) || 0;

  if (left < leftEdge) {
    return Math.max(0, current - (leftEdge - left));
  }
  if (right > rightEdge) {
    return Math.min(safeMax, current + (right - rightEdge));
  }
  return current;
}

function initialWorkspaceCollapsed() {
  return DEFAULT_WORKSPACE_COLLAPSED;
}

function isWorkspaceNavigationAction(action) {
  return WORKSPACE_NAVIGATION_ACTIONS.has(String(action || '').trim());
}

function splitDetailHeading(label, suffixToken = '') {
  const rawLabel = String(label || '').trim();
  const rawSuffix = String(suffixToken || '').trim();
  if (!rawLabel || !rawSuffix) {
    return {
      title: rawLabel,
      suffix: [],
    };
  }

  const escapedSuffix = rawSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const suffixPattern = new RegExp(`\\s*[•·|/\\-]\\s*${escapedSuffix}$`, 'iu');
  if (!suffixPattern.test(rawLabel)) {
    return {
      title: rawLabel,
      suffix: [],
    };
  }

  const title = rawLabel.replace(suffixPattern, '').trim();
  return {
    title: title || rawLabel,
    suffix: [rawSuffix],
  };
}

function normalizeConsultantIntents(intents) {
  const source = Array.isArray(intents) && intents.length ? intents : DEFAULT_CONSULTANT_INTENTS;
  return source
    .map((intent) => ({
      id: String(intent?.id || '').trim(),
      label: String(intent?.label || '').trim(),
      summary: String(intent?.summary || intent?.label || '').trim(),
      description: String(intent?.description || '').trim(),
      prompt: String(intent?.prompt || '').trim(),
    }))
    .filter((intent) => intent.id && intent.label)
    .slice(0, 6);
}

function buildConsultantStarterQueries(intents) {
  const seen = new Set();
  return normalizeConsultantIntents(intents)
    .map((intent) => {
      const query = String(intent.prompt || intent.label || '').trim();
      if (!query || seen.has(query)) {
        return null;
      }
      seen.add(query);
      return {
        label: String(intent.summary || intent.label || query).trim() || query,
        query,
        description: String(intent.description || '').trim(),
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function buildConsultantResultTitle(result) {
  const explicit = String(result?.title || '').trim();
  if (explicit) {
    return explicit;
  }
  const intentLabel = String(result?.intent?.summary || result?.intent?.label || '').trim();
  if (intentLabel) {
    return intentLabel;
  }
  const query = String(result?.query || '').trim();
  return query ? `По запросу: ${query}` : 'Помощник каталога';
}

function normalizeConsultantFollowUps(followUps, suggestedQueries = []) {
  const items = [];
  const seen = new Set();
  if (Array.isArray(followUps)) {
    followUps.forEach((item) => {
      const query = String(item?.query || '').trim();
      if (!query || seen.has(query)) {
        return;
      }
      seen.add(query);
      items.push({
        label: String(item?.label || query).trim() || query,
        query,
        reason: String(item?.reason || '').trim(),
      });
    });
  }
  if (!items.length && Array.isArray(suggestedQueries)) {
    suggestedQueries.forEach((query) => {
      const text = String(query || '').trim();
      if (!text || seen.has(text)) {
        return;
      }
      seen.add(text);
      items.push({ label: text, query: text, reason: '' });
    });
  }
  return items.slice(0, 4);
}

function normalizeConsultantContext(context) {
  const formatsSource = Array.isArray(context?.formats)
    ? context.formats
    : String(context?.formats || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  const formats = [];
  formatsSource.forEach((value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized && !formats.includes(normalized)) {
      formats.push(normalized);
    }
  });
  return {
    intentId: String(context?.intentId || context?.intent?.id || '').trim(),
    city: String(context?.city || '').trim(),
    formats,
    medium: String(context?.medium || '').trim(),
    sourceMode: String(context?.sourceMode || '').trim(),
    applicationFocus: String(context?.applicationFocus || '').trim(),
    memoryApplied: Boolean(context?.memoryApplied),
  };
}

function buildConsultantMemoryPayload(context) {
  const normalized = normalizeConsultantContext(context);
  return {
    memory_intent: normalized.intentId,
    memory_city: normalized.city,
    memory_formats: normalized.formats.join(','),
    memory_medium: normalized.medium,
    memory_source: normalized.sourceMode,
    memory_focus: normalized.applicationFocus,
  };
}

function normalizeConsultantAdvice(advice) {
  return {
    topic: String(advice?.topic || '').trim(),
    title: String(advice?.title || '').trim(),
    summary: String(advice?.summary || '').trim(),
    bullets: Array.isArray(advice?.bullets)
      ? advice.bullets.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
      : [],
    nextStep: String(advice?.nextStep || '').trim(),
  };
}

function normalizeConsultantDeepAnswer(answer) {
  const mode = String(answer?.mode || '').trim().toLowerCase();
  const bullets = [];
  if (Array.isArray(answer?.bullets)) {
    answer.bullets.forEach((item) => {
      const text = String(item || '').trim();
      if (!text || bullets.includes(text)) {
        return;
      }
      bullets.push(text);
    });
  }
  return {
    provider: String(answer?.provider || '').trim(),
    mode: ['catalog', 'brandbook', 'general'].includes(mode) ? mode : 'catalog',
    title: String(answer?.title || '').trim(),
    answer: String(answer?.answer || '').trim(),
    bullets: bullets.slice(0, 4),
    followUp: String(answer?.followUp || answer?.follow_up || '').trim(),
    note: String(answer?.note || '').trim(),
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeRoute,
    routeFromUrl,
    buildRouteUrl,
    buildBrandRouteCards,
    buildBrandRoutesSummary,
    buildConstructorCategoryFilters,
    isConstructorChoiceField,
    shouldAutoBuildConstructorField,
    groupConstructorFields,
    normalizeConstructorHandoff,
    readConstructorPreviewBoxMetrics,
    buildConstructorPreviewLayout,
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
    activeSolutionFilter: DEFAULT_SOLUTION_FILTER,
    exampleTab: 'good',
    exampleIndex: { good: 0, debate: 0 },
    exampleAutoplay: true,
    workspaceVisible: false,
    workspaceCollapsed: DEFAULT_WORKSPACE_COLLAPSED,
    catalogMode: false,
    inspectorOpen: false,
    brandRoutesOpen: false,
    consultantOpen: false,
    consultantResult: null,
    consultantBusy: false,
    consultantIntentId: '',
    consultantHistory: [],
    consultantContext: null,
  };

  const els = {
    pageShell: document.querySelector('.page-shell'),
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
    solutionLab: document.querySelector('#solution-lab'),
    solutionLabTitle: document.querySelector('#solution-lab-title'),
    solutionLabCopy: document.querySelector('#solution-lab-copy'),
    solutionLabFilters: document.querySelector('#solution-lab-filters'),
    solutionLabMeta: document.querySelector('#solution-lab-meta'),
    solutionLabGrid: document.querySelector('#solution-lab-grid'),
    setupBanner: document.querySelector('#setup-banner'),
    topSearches: document.querySelector('#top-searches'),
    contentMode: document.querySelector('#content-mode'),
    contentTitle: document.querySelector('#content-title'),
    contentHint: document.querySelector('#content-hint'),
    sectionSwitcher: document.querySelector('#section-switcher'),
    breadcrumbs: document.querySelector('#breadcrumbs'),
    contentItems: document.querySelector('#content-items'),
    pagination: document.querySelector('#pagination'),
    detailPanel: document.querySelector('#detail-panel'),
    searchForm: document.querySelector('#search-form'),
    searchInput: document.querySelector('#search-input'),
    consultantToggle: document.querySelector('#consultant-toggle'),
    consultantBackdrop: document.querySelector('#consultant-backdrop'),
    consultantPanel: document.querySelector('#consultant-panel'),
    consultantTitle: document.querySelector('#consultant-title'),
    consultantCopy: document.querySelector('#consultant-copy'),
    consultantForm: document.querySelector('#consultant-form'),
    consultantInput: document.querySelector('#consultant-input'),
    consultantResult: document.querySelector('#consultant-result'),
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
    if (state.current?.kind === 'constructor') {
      return normalizeRoute({
        view: 'constructor',
        solutionId: state.current.payload?.definition?.id || '',
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

  function revealItemInHorizontalContainer(container, item, behavior = 'smooth') {
    if (!container || !item) {
      return;
    }
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    if (maxScrollLeft <= 0) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const padding = Math.max(12, Math.round(container.clientWidth * 0.04));
    const nextScrollLeft = computeRevealScrollLeft({
      currentScrollLeft: container.scrollLeft,
      maxScrollLeft,
      containerLeft: containerRect.left,
      containerRight: containerRect.right,
      itemLeft: itemRect.left,
      itemRight: itemRect.right,
      padding,
    });
    if (Math.abs(nextScrollLeft - container.scrollLeft) < 1) {
      return;
    }
    container.scrollTo({ left: nextScrollLeft, behavior });
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

    if (route.view === 'constructor' && route.solutionId) {
      await openConstructor(route.solutionId, { history: 'none' });
    } else if (route.view === 'folder' && route.folderId) {
      await openFolder(route.folderId, route.page, { history: 'none' });
    } else if (route.view === 'search' && route.query) {
      await search(route.query, { history: 'none' });
    } else {
      await openRoot({ history: 'none', keepWorkspace: Boolean(route.fileId) });
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

  function buildItemHeading(item) {
    const extensionLabel = item.type === 'file' && item.extension ? formatExtension(item.extension) : '';
    return splitDetailHeading(item.label || item.name, extensionLabel);
  }

  function buildItemPills(item, heading = null) {
    const resolvedHeading = heading || buildItemHeading(item);
    const pills = [];
    if (item.type === 'folder') {
      pills.push(item.kindLabel);
      return pills;
    }
    resolvedHeading.suffix.forEach((pill) => {
      if (pill && !pills.includes(pill)) {
        pills.push(pill);
      }
    });
    if (item.sizeLabel) {
      pills.push(item.sizeLabel);
    }
    const extensionLabel = formatExtension(item.extension);
    const labelSource = resolvedHeading.title || item.label || item.name;
    if (item.extension && !pills.includes(extensionLabel) && !labelIncludesToken(labelSource, extensionLabel)) {
      pills.push(extensionLabel);
    }
    return pills;
  }

  function buildListCardPills(item, heading = null) {
    if (item.type === 'folder') {
      return [];
    }
    const resolvedHeading = heading || buildItemHeading(item);
    const pills = [];
    const extensionLabel = item.extension ? formatExtension(item.extension) : '';
    resolvedHeading.suffix.forEach((pill) => {
      if (pill && !pills.includes(pill)) {
        pills.push(pill);
      }
    });
    if (extensionLabel && !pills.includes(extensionLabel)) {
      pills.push(extensionLabel);
    }
    if (item.sizeLabel && !pills.includes(item.sizeLabel)) {
      pills.push(item.sizeLabel);
    }
    return pills.slice(0, 2);
  }

  function buildListCardKicker(item, heading = null) {
    if (item.type === 'folder') {
      return item.kindLabel || 'Раздел';
    }
    const resolvedHeading = heading || buildItemHeading(item);
    return resolvedHeading.suffix[0] || formatExtension(item.extension) || item.kindLabel || 'Файл';
  }

  function buildDetailTrail(items) {
    const folders = (items || [])
      .filter((item, index, all) => item && item.type === 'folder' && index < all.length - 1)
      .map((item) => item.name)
      .filter(Boolean);
    return folders.join(' / ');
  }

  function formatDateLabel(value) {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  function inferDetailPreviewKind(payload) {
    const explicitKind = String(payload?.previewKind || '').trim();
    if (explicitKind) {
      return explicitKind;
    }
    const extension = String(payload?.extension || '').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(extension)) {
      return 'image';
    }
    if (extension === 'pdf') {
      return 'pdf';
    }
    return '';
  }

  function buildDetailPreview(payload, detailTitle) {
    const inlineUrl = payload.inlineUrl || toInlineDownloadUrl(payload.downloadUrl);
    const previewKind = inferDetailPreviewKind(payload);
    if (previewKind === 'image' && inlineUrl) {
      return `
        <div class="detail-preview detail-preview-image">
          <img src="${escapeHtml(inlineUrl)}" alt="${escapeHtml(detailTitle)}" loading="lazy" />
        </div>
      `;
    }
    if (previewKind === 'pdf' && inlineUrl) {
      return `
        <div class="detail-preview detail-preview-pdf">
          <iframe src="${escapeHtml(`${inlineUrl}#view=FitH`)}" title="${escapeHtml(detailTitle)}" loading="lazy"></iframe>
        </div>
      `;
    }

    const fallbackLabel = payload.extension ? formatExtension(payload.extension) : 'Файл';
    return `
      <div class="detail-preview detail-preview-fallback">
        <span class="detail-preview-sigil">${escapeHtml(fallbackLabel)}</span>
        <strong>Предпросмотр недоступен</strong>
        <p>Этот тип файла лучше открыть отдельно или скачать.</p>
      </div>
    `;
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
      const thumbsRail = els.heroExampleStage?.querySelector('.hero-example-thumbs');
      const activeThumb = thumbsRail?.querySelector('.hero-example-thumb.active');
      revealItemInHorizontalContainer(thumbsRail, activeThumb);
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

  async function api(action, params, options = {}) {
    const method = String(options.method || 'GET').toUpperCase();
    const fetchOptions = {
      method,
      headers: { Accept: 'application/json' },
    };
    let requestUrl = actionUrl(action, method === 'GET' ? params : {});

    if (method !== 'GET') {
      fetchOptions.headers['Content-Type'] = 'application/json; charset=utf-8';
      fetchOptions.body = JSON.stringify(params || {});
    } else {
      requestUrl = actionUrl(action, params);
    }

    const response = await fetch(requestUrl, fetchOptions);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  }

  function consultantConfig() {
    const payload = state.bootstrap?.consultant || {};
    const title = String(payload.title || '').trim() || 'Помощник по каталогу';
    const description = String(payload.description || '').trim()
      || 'Опишите задачу одним сообщением. Помощник сам разберет формат, город и тип материала, подберет реальные разделы и файлы каталога, а потом поможет уточнениями по брендбуку.';
    const placeholder = String(payload.placeholder || '').trim()
      || 'Например: логотип SVG для Салехарда, можно ли менять цвет';
    return {
      title,
      description,
      placeholder,
      starters: buildConsultantStarterQueries(payload.intents),
    };
  }

  function updateConsultantChrome() {
    const config = consultantConfig();
    if (els.consultantTitle) {
      els.consultantTitle.textContent = config.title;
    }
    if (els.consultantCopy) {
      els.consultantCopy.textContent = config.description;
    }
    if (els.consultantInput) {
      els.consultantInput.placeholder = config.placeholder;
    }
  }

  function setConsultantBusy(nextValue) {
    state.consultantBusy = Boolean(nextValue);
    if (els.consultantPanel) {
      els.consultantPanel.classList.toggle('loading', state.consultantBusy);
    }
    const submitButton = els.consultantForm?.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = state.consultantBusy;
    }
  }

  function setConsultantOpen(nextValue) {
    state.consultantOpen = Boolean(nextValue);
    if (els.pageShell) {
      els.pageShell.classList.toggle('consultant-open', state.consultantOpen);
    }
    if (els.consultantPanel) {
      els.consultantPanel.hidden = !state.consultantOpen;
      els.consultantPanel.classList.toggle('open', state.consultantOpen);
      els.consultantPanel.setAttribute('aria-hidden', state.consultantOpen ? 'false' : 'true');
    }
    if (els.consultantBackdrop) {
      els.consultantBackdrop.hidden = !state.consultantOpen;
    }
    if (els.consultantToggle) {
      els.consultantToggle.setAttribute('aria-expanded', state.consultantOpen ? 'true' : 'false');
    }
    if (state.consultantOpen) {
      updateConsultantChrome();
      renderConsultantHome(state.consultantIntentId);
      window.requestAnimationFrame(() => {
        if (els.consultantInput?.focus) {
          try {
            els.consultantInput.focus({ preventScroll: true });
          } catch (error) {
            els.consultantInput.focus();
          }
        }
      });
    }
  }

  function renderConsultantHome(activeIntentId = '') {
    const config = consultantConfig();
    updateConsultantChrome();
    state.consultantIntentId = String(activeIntentId || state.consultantIntentId || '').trim();
    if (!els.consultantResult) {
      return;
    }
    if (state.consultantHistory.length) {
      renderConsultantConversation();
      return;
    }
    const starterQueries = Array.isArray(config.starters) ? config.starters : [];
    els.consultantResult.innerHTML = `
      <div class="consultant-chat consultant-chat-home">
        <div class="consultant-turn assistant">
          <div class="consultant-turn-card consultant-assistant-turn">
            <div class="consultant-response consultant-response-home">
              <div class="consultant-response-head">
                <span class="consultant-kicker">Помощник</span>
                <strong>Опишите задачу одним сообщением</strong>
                <p>${escapeHtml(config.description)}</p>
              </div>
              ${starterQueries.length ? `
                <section class="consultant-group consultant-group-starter">
                  <div class="consultant-group-head">
                    <strong>Можно начать так</strong>
                  </div>
                  <div class="consultant-query-list">
                    ${starterQueries.map((item) => `
                      <button type="button" class="consultant-query-chip" data-action="consultant-query" data-query="${escapeHtml(item.query)}">
                        ${escapeHtml(item.label)}
                      </button>
                    `).join('')}
                  </div>
                </section>
              ` : ''}
              <p class="consultant-home-note">После первого ответа можно продолжать короткими сообщениями: «а для печати», «можно ли менять цвет», «что делать на тёмном фоне», «что отправить подрядчику».</p>
            </div>
          </div>
        </div>
      </div>
    `;
    els.consultantResult.scrollTop = 0;
  }

  function clearConsultantConversation(activeIntentId = '') {
    state.consultantIntentId = String(activeIntentId || '').trim();
    state.consultantResult = null;
    state.consultantContext = null;
    state.consultantHistory = [];
    if (els.consultantInput) {
      els.consultantInput.value = '';
    }
    renderConsultantHome(state.consultantIntentId);
  }

  function renderConsultantLoading(label = '') {
    renderConsultantConversation({ loadingLabel: label });
  }

  function scrollConsultantResultToLatest() {
    if (!els.consultantResult) {
      return;
    }
    window.requestAnimationFrame(() => {
      const turns = Array.from(els.consultantResult.querySelectorAll('.consultant-turn.assistant'));
      const latestTurn = turns[turns.length - 1];
      if (!latestTurn) {
        els.consultantResult.scrollTop = 0;
        return;
      }
      const topOffset = Math.max(0, latestTurn.offsetTop - 12);
      els.consultantResult.scrollTop = topOffset;
    });
  }

  function consultantSectionCard(section) {
    const mark = buildBrandRouteMark(section);
    const tone = inferBrandRouteTone(section?.label, section?.name);
    return `
      <button
        type="button"
        class="consultant-section-card ${escapeHtml(tone)}"
        data-action="open-folder"
        data-id="${escapeHtml(section.id)}"
      >
        <span class="consultant-section-icon" aria-hidden="true">${escapeHtml(mark)}</span>
        <span class="consultant-section-copy">
          <strong>${escapeHtml(section.label || section.name || 'Раздел')}</strong>
          <span>${escapeHtml(buildBrandRouteHint(section))}</span>
        </span>
      </button>
    `;
  }

  function consultantFileCard(item) {
    const heading = buildItemHeading(item);
    const title = heading.title || item.label || item.name || 'Файл';
    const context = compactRelativePath(item.relativePath, item.type);
    const kicker = buildListCardKicker(item, heading);
    return `
      <article class="consultant-file-card">
        <div class="consultant-file-copy">
          <span class="consultant-file-kicker">${escapeHtml(kicker)}</span>
          <strong>${escapeHtml(title)}</strong>
          ${context ? `<p>${escapeHtml(context)}</p>` : ''}
        </div>
        <div class="consultant-file-actions">
          <button type="button" class="ghost-button" data-action="open-file" data-id="${escapeHtml(item.id)}">Карточка</button>
          <a class="link-button" href="${escapeHtml(item.downloadUrl)}">Скачать</a>
        </div>
      </article>
    `;
  }

  function consultantAdviceBlock(payload) {
    const advice = normalizeConsultantAdvice(payload?.advice);
    if (!advice.title && !advice.summary && !advice.bullets.length && !advice.nextStep) {
      return '';
    }
    return `
      <section class="consultant-group consultant-advice">
        <div class="consultant-group-head">
          <strong>По брендбуку</strong>
        </div>
        <div class="consultant-advice-card">
          ${advice.title ? `<strong class="consultant-advice-title">${escapeHtml(advice.title)}</strong>` : ''}
          ${advice.summary ? `<p>${escapeHtml(advice.summary)}</p>` : ''}
          ${advice.bullets.length ? `
            <ul class="consultant-advice-list">
              ${advice.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          ` : ''}
          ${advice.nextStep ? `<p class="consultant-next-step">${escapeHtml(advice.nextStep)}</p>` : ''}
        </div>
      </section>
    `;
  }

  function consultantDeepAnswerBlock(payload, { compact = false } = {}) {
    const deepAnswer = normalizeConsultantDeepAnswer(payload?.deepAnswer);
    if (!deepAnswer.title && !deepAnswer.answer && !deepAnswer.bullets.length && !deepAnswer.followUp && !deepAnswer.note) {
      return '';
    }

    const modeLabel = deepAnswer.mode === 'general'
      ? 'Общий взгляд'
      : deepAnswer.mode === 'brandbook'
        ? 'Разбор по брендбуку'
        : 'Глубже по задаче';
    const bullets = compact ? deepAnswer.bullets.slice(0, 2) : deepAnswer.bullets;

    return `
      <section class="consultant-group consultant-deep-answer">
        <div class="consultant-group-head">
          <strong>${escapeHtml(modeLabel)}</strong>
          ${deepAnswer.provider ? `<span>${escapeHtml(deepAnswer.provider === 'openai' ? 'умный режим' : deepAnswer.provider)}</span>` : ''}
        </div>
        <div class="consultant-deep-answer-card mode-${escapeHtml(deepAnswer.mode)}">
          ${deepAnswer.title ? `<strong class="consultant-deep-answer-title">${escapeHtml(deepAnswer.title)}</strong>` : ''}
          ${deepAnswer.answer ? `<p class="consultant-deep-answer-copy">${escapeHtml(deepAnswer.answer)}</p>` : ''}
          ${bullets.length ? `
            <ul class="consultant-deep-answer-list">
              ${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          ` : ''}
          ${!compact && deepAnswer.note ? `<p class="consultant-deep-answer-note">${escapeHtml(deepAnswer.note)}</p>` : ''}
          ${!compact && deepAnswer.followUp ? `<p class="consultant-deep-answer-followup">${escapeHtml(deepAnswer.followUp)}</p>` : ''}
        </div>
      </section>
    `;
  }

  function consultantAssistantTurnMarkup(payload, { compact = false } = {}) {
    const title = buildConsultantResultTitle(payload);
    const message = String(payload?.message || '').trim();
    const understanding = Array.isArray(payload?.understanding) ? payload.understanding.slice(0, 6) : [];
    const sections = Array.isArray(payload?.sections) ? payload.sections.slice(0, 4) : [];
    const items = Array.isArray(payload?.items) ? payload.items.slice(0, 4) : [];
    const followUps = normalizeConsultantFollowUps(payload?.followUps, payload?.suggestedQueries);
    const primarySection = sections[0] || null;
    const searchQuery = String(payload?.searchQuery || payload?.query || '').trim();
    const deepAnswerMarkup = consultantDeepAnswerBlock(payload, { compact });
    const adviceMarkup = consultantAdviceBlock(payload);
    const stats = [];
    if (sections.length) stats.push(`Разделы: ${sections.length}`);
    if (items.length) stats.push(`Файлы: ${items.length}`);
    if (followUps.length) stats.push(`Уточнения: ${followUps.length}`);

    if (!sections.length && !items.length && !followUps.length && !adviceMarkup && !deepAnswerMarkup) {
      return `
        <div class="consultant-turn assistant">
          <div class="panel-empty consultant-empty consultant-assistant-turn">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(message || 'Помощник пока не нашел прямой ответ. Попробуйте уточнить запрос форматом, городом или типом материала.')}</span>
        </div>
        </div>
      `;
    }

    return `
      <div class="consultant-turn assistant${compact ? ' compact' : ''}">
        <div class="consultant-turn-card consultant-assistant-turn">
      <div class="consultant-response${compact ? ' compact' : ''}">
        <div class="consultant-response-head">
          <span class="consultant-kicker">${escapeHtml(payload?.intent?.label || 'Подбор')}</span>
          <strong>${escapeHtml(title)}</strong>
          ${message ? `<p>${escapeHtml(message)}</p>` : ''}
        </div>
        ${understanding.length ? `
          <section class="consultant-group consultant-group-understanding">
            <div class="consultant-group-head">
              <strong>Я понял</strong>
            </div>
            <div class="consultant-understanding">
              ${understanding.map((item) => `<span class="meta-pill consultant-pill">${escapeHtml(item)}</span>`).join('')}
            </div>
          </section>
        ` : ''}
        ${deepAnswerMarkup}
        ${adviceMarkup}
        ${compact ? `
          ${stats.length ? `<p class="consultant-turn-summary">${escapeHtml(stats.join(' • '))}</p>` : ''}
        ` : `
          <div class="consultant-primary-actions">
            ${primarySection ? `<button type="button" class="accent-button" data-action="open-folder" data-id="${escapeHtml(primarySection.id)}">Открыть раздел</button>` : ''}
            ${searchQuery ? `<button type="button" class="ghost-button" data-action="search-chip" data-query="${escapeHtml(searchQuery)}">Показать поиск</button>` : ''}
          </div>
          ${sections.length ? `
            <section class="consultant-group">
              <div class="consultant-group-head">
                <strong>Разделы</strong>
                <span>${escapeHtml(String(sections.length))}</span>
              </div>
              <div class="consultant-section-list">
                ${sections.map(consultantSectionCard).join('')}
              </div>
            </section>
          ` : ''}
          ${items.length ? `
            <section class="consultant-group">
              <div class="consultant-group-head">
                <strong>Файлы</strong>
                <span>${escapeHtml(String(items.length))}</span>
              </div>
              <div class="consultant-file-list">
                ${items.map(consultantFileCard).join('')}
              </div>
            </section>
          ` : ''}
          ${followUps.length ? `
            <section class="consultant-group">
              <div class="consultant-group-head">
                <strong>Уточнить</strong>
              </div>
              <div class="consultant-followup-list">
                ${followUps.map((item) => `
                  <button type="button" class="consultant-followup" data-action="consultant-query" data-query="${escapeHtml(item.query)}">
                    <strong>${escapeHtml(item.label)}</strong>
                    ${item.reason ? `<span>${escapeHtml(item.reason)}</span>` : ''}
                  </button>
                `).join('')}
              </div>
            </section>
          ` : ''}
        `}
      </div>
      </div>
      </div>
    `;
  }

  function renderConsultantConversation({ loadingLabel = '' } = {}) {
    if (!els.consultantResult) {
      return;
    }

    const history = Array.isArray(state.consultantHistory) ? state.consultantHistory : [];
    if (!history.length && !loadingLabel) {
      renderConsultantHome(state.consultantIntentId);
      return;
    }

    let lastAssistantIndex = -1;
    history.forEach((turn, index) => {
      if (turn?.role === 'assistant') {
        lastAssistantIndex = index;
      }
    });

    els.consultantResult.innerHTML = `
      <div class="consultant-chat">
        ${history.map((turn, index) => {
          if (turn?.role === 'user') {
            const queryText = String(turn?.query || '').trim() || 'Запрос';
            const intentText = String(turn?.intentLabel || '').trim();
            return `
              <div class="consultant-turn user">
                <div class="consultant-turn-card consultant-user-turn">
                  <span class="consultant-turn-kicker">${escapeHtml(intentText || 'Запрос')}</span>
                  <strong>${escapeHtml(queryText)}</strong>
                </div>
              </div>
            `;
          }
          if (turn?.error) {
            return `
              <div class="consultant-turn assistant">
                <div class="consultant-turn-card consultant-assistant-turn">
                  <div class="panel-empty consultant-empty">
                    <strong>${escapeHtml(turn.title || 'Не удалось загрузить подбор')}</strong>
                    <span>${escapeHtml(turn.message || 'Попробуйте повторить запрос чуть позже.')}</span>
                  </div>
                </div>
              </div>
            `;
          }
          return consultantAssistantTurnMarkup(turn?.payload || {}, { compact: index !== lastAssistantIndex });
        }).join('')}
        ${loadingLabel ? `
          <div class="consultant-turn assistant pending">
            <div class="consultant-turn-card consultant-assistant-turn consultant-loading-bubble">
              <span class="consultant-turn-kicker">Помощник ищет</span>
              <strong>${escapeHtml(String(loadingLabel || '').trim() || 'Подбор материалов')}</strong>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    scrollConsultantResultToLatest();
  }

  function renderConsultantResponse(payload) {
    state.consultantResult = payload || null;
    state.consultantIntentId = String(payload?.intent?.id || '').trim();
    state.consultantContext = normalizeConsultantContext(payload?.context);
    state.consultantHistory.push({
      role: 'assistant',
      payload,
    });
    renderConsultantConversation();
  }

  async function runConsultant(query = '', intentId = '') {
    const normalizedQuery = String(query || '').trim();
    const resolvedIntentId = String(intentId || state.consultantIntentId || '').trim();
    const activeIntent = normalizeConsultantIntents(state.bootstrap?.consultant?.intents).find((intent) => intent.id === resolvedIntentId) || null;
    if (!normalizedQuery && !resolvedIntentId) {
      renderConsultantHome();
      return;
    }
    state.consultantIntentId = resolvedIntentId;
    if (els.consultantInput) {
      if (normalizedQuery) {
        els.consultantInput.value = normalizedQuery;
      } else if (resolvedIntentId) {
        if (activeIntent?.prompt) {
          els.consultantInput.value = activeIntent.prompt;
        }
      }
    }
    state.consultantHistory.push({
      role: 'user',
      query: normalizedQuery || activeIntent?.prompt || activeIntent?.label || 'Подбор материалов',
      intentId: resolvedIntentId,
      intentLabel: activeIntent?.label || '',
    });
    renderConsultantLoading(normalizedQuery || activeIntent?.label || 'Подбор материалов');
    setConsultantBusy(true);
    try {
      const payload = await api('consult', {
        q: normalizedQuery,
        intent: resolvedIntentId,
        ...buildConsultantMemoryPayload(state.consultantContext),
      });
      renderConsultantResponse(payload);
    } catch (error) {
      console.error(error);
      state.consultantHistory.push({
        role: 'assistant',
        error: true,
        title: 'Не удалось загрузить подбор',
        message: String(error?.message || 'Попробуйте повторить запрос чуть позже.'),
      });
      renderConsultantConversation();
    } finally {
      setConsultantBusy(false);
    }
  }

  function setLoading(title, hint) {
    els.contentMode.textContent = 'Раздел';
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
        ? 'Блок скрыт. Он откроется автоматически после выбора раздела или поиска.'
        : 'Материалы выбранного раздела и результаты поиска открываются здесь.';
    }
  }

  function setWorkspaceVisible(nextValue) {
    state.workspaceVisible = Boolean(nextValue);
    if (els.workspaceShell) {
      els.workspaceShell.hidden = !state.workspaceVisible;
    }
    if (!state.workspaceVisible) {
      setInspectorOpen(false);
    }
  }

  function setCatalogMode(nextValue) {
    state.catalogMode = Boolean(nextValue);
    if (els.pageShell) {
      els.pageShell.classList.toggle('catalog-mode', state.catalogMode);
    }
    els.catalogModeButtons.forEach((button) => {
      button.textContent = state.catalogMode ? 'Вернуть витрину' : 'Скрыть витрину';
    });
    if (state.catalogMode) {
      setBrandRoutesOpen(false);
      setWorkspaceVisible(true);
      setWorkspaceCollapsed(false);
      els.workspaceShell?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (els.workspaceCopy) {
      els.workspaceCopy.textContent = state.catalogMode
        ? 'Включен режим рабочей области без верхней витрины.'
        : 'Материалы выбранного раздела и результаты поиска открываются здесь.';
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
    if (!state.workspaceVisible) {
      setWorkspaceVisible(true);
    }
    if (state.workspaceCollapsed) {
      setWorkspaceCollapsed(false);
    }
  }

  function focusWorkspace(target) {
    if (!els.workspaceShell || !state.workspaceVisible) return;
    if (target && target.closest && target.closest('#workspace-shell')) {
      return;
    }
    els.workspaceShell.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function focusBrandRoutes() {
    els.brandRoutesBlock?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        const targetCard = activeCard || firstCard;
        if (targetCard?.focus) {
          try {
            targetCard.focus({ preventScroll: true });
          } catch (error) {
            targetCard.focus();
          }
        }
        revealItemInHorizontalContainer(els.brandRoutes, targetCard);
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
        ? `Сейчас открыт раздел «${summary.activeLabel}». При необходимости переключитесь в другую ветку каталога.`
        : `${formatNumber(summary.total)} разделов каталога собраны в одном компактном меню без дублирующего root-экрана.`;
    }
    if (els.brandRoutesToggleMeta) {
      els.brandRoutesToggleMeta.textContent = summary.activeLabel
        ? `Сейчас: ${summary.activeLabel}`
        : `${formatNumber(summary.total)} разделов каталога`;
    }
    if (els.brandRoutesCurrent) {
      els.brandRoutesCurrent.textContent = summary.activeLabel || 'Все разделы';
    }
    els.brandRoutes.innerHTML = summary.cards.map((item) => {
      return `
        <button
          type="button"
          class="brand-route-card ${escapeHtml(item.tone)}${item.isActive ? ' active' : ''}"
          data-action="${escapeHtml(item.action)}"
          data-route-id="${escapeHtml(item.routeId || '')}"
          data-id="${escapeHtml(item.target)}"
          ${item.isActive ? 'aria-current="page"' : ''}
        >
          <span class="brand-route-icon" aria-hidden="true">${escapeHtml(item.mark)}</span>
          <span class="brand-route-copy">
            <strong>${escapeHtml(item.label)}</strong>
            <small>${escapeHtml(item.hint || 'Открыть раздел')}</small>
          </span>
          <span class="brand-route-arrow" aria-hidden="true">↗</span>
        </button>
      `;
    }).join('');
    if (state.brandRoutesOpen) {
      window.requestAnimationFrame(() => {
        const activeCard = els.brandRoutes?.querySelector('.brand-route-card.active');
        revealItemInHorizontalContainer(els.brandRoutes, activeCard);
      });
    }
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

  function renderSolutionLab(bootstrap) {
    if (!els.solutionLabGrid || !els.solutionLab) {
      return;
    }
    const config = bootstrap?.constructors || {};
    const items = normalizeConstructorSolutions(config);
    const { filters, visibleItems, activeCategory } = buildConstructorCategoryFilters(items, state.activeSolutionFilter);
    state.activeSolutionFilter = activeCategory;
    const activeSolutionId = state.current?.kind === 'constructor'
      ? String(state.current?.payload?.definition?.id || '').trim()
      : '';
    if (els.solutionLabTitle) {
      els.solutionLabTitle.textContent = String(config.title || 'Лаборатория решений').trim() || 'Лаборатория решений';
    }
    if (els.solutionLabCopy) {
      els.solutionLabCopy.textContent = String(config.description || 'Готовые каркасы для типовых бренд-носителей.').trim()
        || 'Готовые каркасы для типовых бренд-носителей.';
    }
    if (els.solutionLabFilters) {
      els.solutionLabFilters.innerHTML = filters.map((filter) => `
        <button
          type="button"
          class="chip solution-filter-chip${filter.active ? ' active' : ''}"
          data-action="set-solution-filter"
          data-filter="${escapeHtml(filter.id)}"
          ${filter.active ? 'aria-pressed="true"' : 'aria-pressed="false"'}
        >
          <span>${escapeHtml(filter.label)}</span>
        </button>
      `).join('');
    }
    if (els.solutionLabMeta) {
      els.solutionLabMeta.textContent = '';
      els.solutionLabMeta.hidden = true;
    }
    els.solutionLab.hidden = !items.length;
    if (!items.length) {
      els.solutionLabGrid.innerHTML = '';
      return;
    }
    els.solutionLabGrid.innerHTML = visibleItems.map((item) => `
      <article class="solution-card${activeSolutionId === item.id ? ' active' : ''}">
        <div class="solution-card-head">
          <span class="solution-card-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
          <div class="solution-card-copy">
            <span class="card-kicker">${escapeHtml(item.category || 'Решение')}</span>
            <strong>${escapeHtml(item.label)}</strong>
            <p>${escapeHtml(item.summary || item.description)}</p>
          </div>
        </div>
        <div class="item-actions">
          <button type="button" class="item-action" data-action="open-constructor" data-id="${escapeHtml(item.id)}">Открыть</button>
        </div>
      </article>
    `).join('');
  }

  function renderConstructorField(field, value) {
    const fieldId = String(field?.id || '').trim();
    if (!fieldId) {
      return '';
    }
    const fieldType = String(field?.type || 'text').trim() || 'text';
    const label = String(field?.label || fieldId).trim();
    const placeholder = String(field?.placeholder || '').trim();
    const required = Boolean(field?.required);
    const currentValue = value ?? field?.default ?? '';
    if (fieldType === 'select' && isConstructorChoiceField(fieldId)) {
      const options = Array.isArray(field?.options) ? field.options : [];
      return `
        <fieldset class="constructor-field constructor-choice-field">
          <legend class="constructor-field-label">${escapeHtml(label)}${required ? ' *' : ''}</legend>
          <div class="constructor-choice-grid${fieldId === 'palette_tone' ? ' is-palette' : ''}">
            ${options.map((option, index) => {
              const optionValue = String(option?.value || '').trim();
              const optionLabel = String(option?.label || optionValue || '').trim();
              const optionDescription = String(option?.description || option?.note || '').trim();
              const optionId = `constructor-field-${fieldId}-${index}`;
              const checked = optionValue === String(currentValue);
              return `
                <label class="constructor-choice-card${checked ? ' active' : ''}" for="${escapeHtml(optionId)}">
                  <input
                    class="constructor-choice-input"
                    type="radio"
                    id="${escapeHtml(optionId)}"
                    name="${escapeHtml(fieldId)}"
                    value="${escapeHtml(optionValue)}"
                    ${checked ? 'checked' : ''}
                    ${required && index === 0 ? 'required' : ''}
                  />
                  ${buildConstructorChoicePreview(fieldId, option)}
                  <span class="constructor-choice-copy">
                    <strong>${escapeHtml(optionLabel)}</strong>
                    ${optionDescription ? `<small>${escapeHtml(optionDescription)}</small>` : ''}
                  </span>
                </label>
              `;
            }).join('')}
          </div>
        </fieldset>
      `;
    }

    const baseAttrs = [
      `id="constructor-field-${escapeHtml(fieldId)}"`,
      `name="${escapeHtml(fieldId)}"`,
      placeholder ? `placeholder="${escapeHtml(placeholder)}"` : '',
      required ? 'required' : '',
    ].filter(Boolean).join(' ');

    let control = '';
    if (fieldType === 'textarea') {
      const rows = Math.max(2, Number.parseInt(field?.rows || '3', 10) || 3);
      control = `<textarea ${baseAttrs} rows="${rows}">${escapeHtml(currentValue)}</textarea>`;
    } else if (fieldType === 'select') {
      const options = Array.isArray(field?.options) ? field.options : [];
      control = `
        <select ${baseAttrs}>
          ${options.map((option) => `
            <option value="${escapeHtml(option?.value || '')}"${String(option?.value || '') === String(currentValue) ? ' selected' : ''}>
              ${escapeHtml(option?.label || option?.value || '')}
            </option>
          `).join('')}
        </select>
      `;
    } else {
      const inputType = ['email', 'date', 'number'].includes(fieldType) ? fieldType : 'text';
      const numericAttrs = inputType === 'number'
        ? `${field?.min !== null && field?.min !== undefined ? ` min="${escapeHtml(field.min)}"` : ''}${field?.max !== null && field?.max !== undefined ? ` max="${escapeHtml(field.max)}"` : ''}`
        : '';
      control = `<input type="${escapeHtml(inputType)}" value="${escapeHtml(currentValue)}" ${baseAttrs}${numericAttrs} />`;
    }

    return `
      <label class="constructor-field" for="constructor-field-${escapeHtml(fieldId)}">
        <span class="constructor-field-label">${escapeHtml(label)}${required ? ' *' : ''}</span>
        ${control}
      </label>
    `;
  }

  function buildConstructorFieldGroupsMarkup(fields, input) {
    return groupConstructorFields(fields).map((group) => `
      <section class="constructor-field-group">
        <div class="constructor-group-head">
          <strong>${escapeHtml(group.label)}</strong>
          <span>${escapeHtml(group.hint)}</span>
        </div>
        <div class="constructor-field-grid">
          ${group.items.map((field) => renderConstructorField(field, input[field.id])).join('')}
        </div>
      </section>
    `).join('');
  }

function buildConstructorStepsMarkup(generated) {
    const states = generated
      ? ['done', 'done', 'active']
      : ['active', 'muted', 'muted'];
    const labels = [
      { title: 'Параметры', note: 'Заполните поля шаблона.' },
      { title: 'Сборка', note: 'Получите стартовый пакет.' },
      { title: 'Handoff', note: 'Разделите пакет: согласование и подрядчик.' },
    ];
    return `
      <div class="constructor-steps" aria-label="Этапы решения">
        ${labels.map((item, index) => `
          <div class="constructor-step ${states[index]}">
            <span class="constructor-step-index">${index + 1}</span>
            <span class="constructor-step-copy">
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.note)}</small>
            </span>
          </div>
        `).join('')}
      </div>
  `;
}

function buildConstructorPresetsMarkup(presets) {
  const items = Array.isArray(presets) ? presets.filter((item) => item && item.id) : [];
  if (!items.length) {
    return '';
  }
  return `
    <section class="constructor-preset-block" aria-label="Готовые сценарии">
      <div class="constructor-panel-head">
        <strong>Готовые сценарии</strong>
        <span>Быстро переключают типовой режим носителя и оформление без ручной настройки каждого поля.</span>
      </div>
      <div class="constructor-preset-grid">
        ${items.map((preset) => `
          <button
            type="button"
            class="constructor-preset-card${preset.active ? ' active' : ''}"
            data-action="apply-constructor-preset"
            data-preset-id="${escapeHtml(preset.id)}"
          >
            <span class="constructor-preset-kicker">${preset.active ? 'Активно' : 'Сценарий'}</span>
            <strong>${escapeHtml(preset.label || 'Сценарий')}</strong>
            <span class="constructor-preset-summary">${escapeHtml(preset.summary || preset.description || '')}</span>
            ${preset.description ? `<small>${escapeHtml(preset.description)}</small>` : ''}
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function buildConstructorPreviewMarkup(artifact, layout) {
    const previewLayout = layout || buildConstructorPreviewLayout({}, artifact);
    if (!artifact) {
      return `
        <div class="constructor-preview-empty">
          <strong>Превью появится здесь</strong>
          <span>Соберите решение, и справа появится визуальный каркас или бриф.</span>
        </div>
      `;
    }
    if (artifact.previewType === 'svg') {
      return `<div class="${previewLayout.visualClass}">${artifact.content || ''}</div>`;
    }
    if (artifact.previewType === 'html') {
      return `<iframe class="${previewLayout.frameClass}" title="${escapeHtml(artifact.label || 'Превью')}" srcdoc="${escapeHtml(artifact.content || '')}"></iframe>`;
    }
    return `<pre class="${previewLayout.codeClass}">${escapeHtml(artifact.content || '')}</pre>`;
  }

  function renderConstructorRecommendations(recommendations) {
    const sections = Array.isArray(recommendations?.sections) ? recommendations.sections : [];
    const items = Array.isArray(recommendations?.items) ? recommendations.items : [];
    const advice = recommendations?.advice || {};
    return `
      <div class="constructor-support-grid">
        <section class="constructor-support-card">
          <div class="constructor-support-head">
            <strong>Разделы каталога</strong>
            <span>Куда идти за исходниками и правилами.</span>
          </div>
          <div class="constructor-mini-grid">
            ${sections.length ? sections.map((section) => `
              <button type="button" class="constructor-mini-card" data-action="open-folder" data-id="${escapeHtml(section.id)}">
                <span class="constructor-mini-icon" aria-hidden="true">${escapeHtml(section.icon || '📁')}</span>
                <span class="constructor-mini-copy">
                  <strong>${escapeHtml(section.label || section.name || 'Раздел')}</strong>
                  <small>${escapeHtml(section.kindLabel || 'Раздел')}</small>
                </span>
              </button>
            `).join('') : '<p class="detail-empty">Подходящие разделы появятся после загрузки каталога.</p>'}
          </div>
        </section>
        <section class="constructor-support-card">
          <div class="constructor-support-head">
            <strong>Файлы для старта</strong>
            <span>Реальные материалы из каталога под этот носитель.</span>
          </div>
          <div class="constructor-file-list">
            ${items.length ? items.map((item) => `
              <article class="constructor-file-card">
                <div class="constructor-file-copy">
                  <strong>${escapeHtml(item.label || item.name || 'Файл')}</strong>
                  <small>${escapeHtml(item.relativePath || item.kindLabel || '')}</small>
                </div>
                <div class="constructor-file-actions">
                  <button type="button" class="ghost-button" data-action="open-file" data-id="${escapeHtml(item.id)}">Карточка</button>
                  <a class="link-button" href="${escapeHtml(item.downloadUrl || '#')}">Скачать</a>
                </div>
              </article>
            `).join('') : '<p class="detail-empty">Реальные файлы будут подобраны после индексации каталога.</p>'}
          </div>
        </section>
        <section class="constructor-support-card constructor-support-advice">
          <div class="constructor-support-head">
            <strong>По брендбуку</strong>
            <span>Grounded-подсказка перед handoff в дизайн или печать.</span>
          </div>
          <div class="constructor-advice-copy">
            ${advice?.title ? `<strong>${escapeHtml(advice.title)}</strong>` : ''}
            ${advice?.summary ? `<p>${escapeHtml(advice.summary)}</p>` : '<p>Откройте брендбук и логотипы, затем заберите нужный формат под задачу.</p>'}
            ${Array.isArray(advice?.bullets) && advice.bullets.length ? `
              <ul class="constructor-summary-list">
                ${advice.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
              </ul>
            ` : ''}
            ${advice?.nextStep ? `<p class="constructor-next-step">${escapeHtml(advice.nextStep)}</p>` : ''}
          </div>
        </section>
      </div>
    `;
  }

  function renderConstructorHandoff(handoff) {
    const normalized = normalizeConstructorHandoff(handoff);
    const packages = [normalized.approval, normalized.contractor].filter((item) => item.id);
    if (!packages.length) {
      return '';
    }

    return `
      <section class="constructor-panel constructor-handoff-panel">
        <div class="constructor-panel-head">
          <strong>Пакеты handoff</strong>
          <span>${escapeHtml(normalized.note || 'Сначала согласование, затем передача подрядчику с реальными файлами и разделами каталога.')}</span>
        </div>
        <div class="constructor-handoff-grid">
          ${packages.map((pack, index) => `
            <article class="constructor-handoff-card" data-handoff-kind="${escapeHtml(pack.id)}">
              <div class="constructor-handoff-head">
                <span class="card-kicker">${index === 0 ? 'Сначала' : 'Дальше'}</span>
                <strong>${escapeHtml(pack.title)}</strong>
                <span>${escapeHtml(pack.summary)}</span>
              </div>
              ${pack.bullets.length ? `
                <ul class="constructor-summary-list">
                  ${pack.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
              ` : ''}
              ${pack.artifacts.length ? `
                <div class="constructor-handoff-block">
                  <div class="constructor-handoff-label">Артефакты пакета</div>
                  <div class="constructor-downloads constructor-handoff-downloads">
                    ${pack.artifacts.map((artifact) => `
                      <button type="button" class="constructor-download-card constructor-handoff-download-card" data-action="download-artifact" data-artifact-id="${escapeHtml(artifact.id)}">
                        <strong>${escapeHtml(artifact.label)}</strong>
                        <span>${escapeHtml(artifact.filename)}</span>
                        <small>${escapeHtml(artifact.note || formatDataSize(artifact.sizeBytes))}</small>
                      </button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${pack.files.length ? `
                <div class="constructor-handoff-block">
                  <div class="constructor-handoff-label">Реальные файлы каталога</div>
                  <div class="constructor-file-list constructor-handoff-file-list">
                    ${pack.files.map((item) => `
                      <article class="constructor-file-card">
                        <div class="constructor-file-copy">
                          <strong>${escapeHtml(item.label)}</strong>
                          <small>${escapeHtml(item.relativePath || item.kindLabel || '')}</small>
                        </div>
                        <div class="constructor-file-actions">
                          <button type="button" class="ghost-button" data-action="open-file" data-id="${escapeHtml(item.id)}">Карточка</button>
                          ${item.downloadUrl
                            ? `<a class="link-button" href="${escapeHtml(item.downloadUrl)}">Скачать</a>`
                            : '<span class="ghost-button" aria-disabled="true">Нет файла</span>'}
                        </div>
                      </article>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${pack.sections.length ? `
                <div class="constructor-handoff-block">
                  <div class="constructor-handoff-label">Разделы для открытия</div>
                  <div class="constructor-mini-grid constructor-handoff-section-grid">
                    ${pack.sections.map((section) => `
                      <button type="button" class="constructor-mini-card" data-action="open-folder" data-id="${escapeHtml(section.id)}">
                        <span class="constructor-mini-icon" aria-hidden="true">${escapeHtml(section.icon || '📁')}</span>
                        <span class="constructor-mini-copy">
                          <strong>${escapeHtml(section.label || section.name || 'Раздел')}</strong>
                          <small>${escapeHtml(section.kindLabel || 'Раздел')}</small>
                        </span>
                      </button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${pack.nextStep ? `<p class="constructor-next-step">${escapeHtml(pack.nextStep)}</p>` : ''}
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }

  function renderConstructor(payload) {
    const definition = payload?.definition || {};
    const fields = Array.isArray(definition?.fields) ? definition.fields : [];
    const input = payload?.input || {};
    const artifacts = Array.isArray(payload?.artifacts) ? payload.artifacts : [];
    const previewArtifact = pickConstructorPreviewArtifact(artifacts);
    const previewLayout = buildConstructorPreviewLayout(definition, previewArtifact);
    const summary = payload?.summary || {};
    const generated = Boolean(payload?.generated);
    const presets = Array.isArray(payload?.presets) ? payload.presets : [];

    state.current = { kind: 'constructor', payload };
    state.detail = null;
    renderSolutionLab(state.bootstrap);
    els.contentMode.textContent = 'Конструктор';
    els.contentTitle.textContent = definition.label || 'Лаборатория решений';
    els.contentHint.textContent = summary.lead || definition.description || 'Соберите шаблон под реальную задачу.';
    renderSectionSwitcher('');
    els.breadcrumbs.innerHTML = `
      <span class="breadcrumb current">Лаборатория решений</span>
      <span class="breadcrumb-sep">•</span>
      <span class="breadcrumb current">${escapeHtml(definition.label || 'Решение')}</span>
    `;
    els.pagination.innerHTML = '';
    els.contentItems.innerHTML = `
      <div class="constructor-shell">
        <section class="constructor-hero">
          <div class="constructor-hero-copy">
            <span class="card-kicker">${escapeHtml(definition.category || 'Решение')}</span>
            <h3>${escapeHtml(definition.label || 'Решение')}</h3>
            <p>${escapeHtml(definition.description || definition.summary || 'Готовый каркас носителя с привязкой к каталогу и брендбуку.')}</p>
          </div>
          ${buildConstructorStepsMarkup(generated)}
        </section>

        <div class="constructor-layout">
          <section class="constructor-panel constructor-form-panel">
            <div class="constructor-panel-head">
              <strong>Поля решения</strong>
              <span>Сначала задайте параметры, потом соберите SVG/brief-пакет и откройте реальные материалы каталога.</span>
            </div>
            ${buildConstructorPresetsMarkup(presets)}
            <form id="constructor-form" class="constructor-form" data-constructor-id="${escapeHtml(definition.id || '')}">
              ${buildConstructorFieldGroupsMarkup(fields, input)}
              <div class="constructor-form-actions">
                <button type="submit" class="accent-button">Собрать решение</button>
                <button type="button" class="ghost-button" data-action="reset-constructor" data-id="${escapeHtml(definition.id || '')}">Сбросить шаблон</button>
                <button type="button" class="ghost-button" data-action="copy-current-link">Скопировать ссылку</button>
              </div>
            </form>
          </section>

          <section class="constructor-panel constructor-preview-panel">
            <div class="constructor-panel-head">
              <strong>Превью и файлы</strong>
              <span>${escapeHtml(previewArtifact?.label || 'SVG-каркас или бриф')} • На ПК этот блок закреплён и остаётся в поле зрения.</span>
            </div>
            <div class="${previewLayout.stageClass}" data-preview-profile="${escapeHtml(previewLayout.profile)}">
              ${buildConstructorPreviewMarkup(previewArtifact, previewLayout)}
            </div>
            <div class="constructor-downloads">
              ${artifacts.map((artifact) => `
                <button type="button" class="constructor-download-card" data-action="download-artifact" data-artifact-id="${escapeHtml(artifact.id)}">
                  <strong>${escapeHtml(artifact.label || 'Артефакт')}</strong>
                  <span>${escapeHtml(artifact.filename || '')}</span>
                  <small>${escapeHtml(formatDataSize(artifact.sizeBytes))} • Нажмите, чтобы скачать</small>
                </button>
              `).join('')}
            </div>
          </section>
        </div>

        <section class="constructor-panel constructor-summary-panel">
          <div class="constructor-panel-head">
            <strong>${escapeHtml(summary.title || 'Результат')}</strong>
            <span>${escapeHtml(summary.lead || 'Готовый стартовый пакет для handoff.')}</span>
          </div>
          ${Array.isArray(summary?.bullets) && summary.bullets.length ? `
            <ul class="constructor-summary-list">
              ${summary.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          ` : ''}
        </section>

        ${renderConstructorHandoff(payload?.handoff)}

        ${renderConstructorRecommendations(payload?.recommendations)}
      </div>
    `;
    setDocumentTitle(definition.label || 'Лаборатория решений');
  }

  function applyConstructorPreset(presetId) {
    const currentPayload = state.current?.kind === 'constructor' ? state.current.payload : null;
    if (!currentPayload?.definition?.id) {
      return;
    }
    const presets = Array.isArray(currentPayload?.presets) ? currentPayload.presets : [];
    const preset = presets.find((item) => String(item?.id || '').trim() === String(presetId || '').trim());
    if (!preset) {
      return;
    }
    const form = document.querySelector('#constructor-form');
    const formInput = form ? collectConstructorFormInput(form) : {};
    const nextInput = {
      ...(currentPayload?.input || {}),
      ...formInput,
      ...(preset.overrides || {}),
    };
    void buildConstructor(String(currentPayload.definition.id || '').trim(), nextInput);
  }

  function renderSectionSwitcher(mode = '') {
    if (!els.sectionSwitcher) {
      return;
    }
    const cards = buildBrandRouteCards(state.bootstrap?.sections || [], state.activeRouteId);
    if (!cards.length || !mode) {
      els.sectionSwitcher.hidden = true;
      els.sectionSwitcher.innerHTML = '';
      return;
    }

    const activeCard = cards.find((item) => item.isActive) || null;
    const orderedCards = activeCard
      ? [activeCard, ...cards.filter((item) => item !== activeCard)]
      : cards;
    const title = mode === 'search' ? 'Разделы каталога' : 'Быстрый переход';
    const note = mode === 'search'
      ? 'Откройте нужный раздел прямо из результатов поиска.'
      : activeCard
        ? `Сейчас открыт раздел «${activeCard.label}». Можно быстро перейти в соседний.`
        : 'Переключайтесь между разделами без возврата к верхнему меню.';

    els.sectionSwitcher.hidden = false;
    els.sectionSwitcher.innerHTML = `
      <div class="section-switcher-head">
        <div class="section-switcher-copy">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(note)}</span>
        </div>
      </div>
      <div class="section-switcher-rail">
        ${orderedCards.map((item) => `
          <button
            type="button"
            class="section-switch-card ${escapeHtml(item.tone)}${item.isActive ? ' active' : ''}"
            data-action="open-folder"
            data-id="${escapeHtml(item.target)}"
            ${item.isActive ? 'aria-current="page"' : ''}
          >
            <span class="section-switch-icon" aria-hidden="true">${escapeHtml(item.mark)}</span>
            <span class="section-switch-copy">
              <strong>${escapeHtml(item.label)}</strong>
              <small>${escapeHtml(item.isActive ? 'Открыт сейчас' : item.hint)}</small>
            </span>
          </button>
        `).join('')}
      </div>
    `;

    window.requestAnimationFrame(() => {
      const rail = els.sectionSwitcher?.querySelector('.section-switcher-rail');
      const current = rail?.querySelector('.section-switch-card.active');
      revealItemInHorizontalContainer(rail, current);
    });
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
    const heading = buildItemHeading(item);
    const title = heading.title || item.label || item.name;
    const secondary = buildItemSecondary(item);
    const pills = buildListCardPills(item, heading);
    const kicker = buildListCardKicker(item, heading);
    const actions = item.type === 'folder'
      ? `<button type="button" class="item-action" data-action="open-folder" data-id="${escapeHtml(item.id)}">Открыть</button>`
      : `<button type="button" class="item-action" data-action="open-file" data-id="${escapeHtml(item.id)}">Карточка</button>
         <a class="link-button" href="${escapeHtml(item.downloadUrl)}">Скачать</a>`;

    return `
      <article class="result-card ${escapeHtml(item.type)}">
        <div class="result-head">
          <span class="card-icon">${escapeHtml(item.icon)}</span>
          <div class="card-copy">
            <span class="card-kicker">${escapeHtml(kicker)}</span>
            <strong>${escapeHtml(title)}</strong>
            ${secondary ? `<p class="card-context">${escapeHtml(secondary)}</p>` : ''}
          </div>
        </div>
        ${pills.length ? `
          <div class="item-meta">
            ${pills.map((pill) => `<span class="meta-pill">${escapeHtml(pill)}</span>`).join('')}
          </div>
        ` : ''}
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
    renderSolutionLab(state.bootstrap);
    els.contentMode.textContent = payload.root ? 'Главная' : 'Раздел';
    els.contentTitle.textContent = payload.folder.label || payload.folder.name;
    els.contentHint.textContent = payload.hint || 'Открой раздел или файл.';
    renderSectionSwitcher(payload.root ? '' : 'folder');
    renderBreadcrumbs(payload.breadcrumbs || []);
    renderItems(payload.items || [], 'Раздел пуст');
    renderPagination(payload);
    setDocumentTitle(payload.root ? '' : (payload.folder.label || payload.folder.name));
  }

  function renderSearch(payload) {
    state.current = { kind: 'search', payload };
    state.detail = null;
    renderSolutionLab(state.bootstrap);
    els.contentMode.textContent = 'Поиск';
    els.contentTitle.textContent = payload.query ? `Поиск: ${payload.query}` : 'Поиск';
    els.contentHint.textContent = payload.total
      ? `${formatNumber(payload.total)} результатов`
      : 'Ничего не найдено.';
    renderSectionSwitcher('search');
    els.breadcrumbs.innerHTML = '';
    renderItems(payload.items || [], payload.emptyState || 'Пусто');
    els.pagination.innerHTML = '';
    setDocumentTitle(payload.query ? `Поиск: ${payload.query}` : 'Поиск');
  }

  function renderDetail(payload) {
    state.detail = payload;
    const extensionLabel = payload.extension ? formatExtension(payload.extension) : '';
    const heading = splitDetailHeading(payload.label || payload.name, extensionLabel);
    const detailTitle = heading.title || payload.label || payload.name || 'Файл';
    const originalName = payload.name && payload.name !== detailTitle ? payload.name : '';
    const detailTrail = buildDetailTrail(payload.breadcrumbs || []);
    const inlineUrl = payload.inlineUrl || toInlineDownloadUrl(payload.downloadUrl);
    const pills = [];
    heading.suffix.forEach((pill) => {
      if (pill && !pills.includes(pill)) {
        pills.push(pill);
      }
    });
    if (payload.sizeLabel) {
      pills.push(payload.sizeLabel);
    }
    if (extensionLabel && !pills.includes(extensionLabel) && !labelIncludesToken(detailTitle, extensionLabel)) {
      pills.push(extensionLabel);
    }
    const modifiedLabel = formatDateLabel(payload.modifiedUtc);
    if (modifiedLabel && !pills.includes(modifiedLabel)) {
      pills.push(modifiedLabel);
    }
    const detailSections = [];
    if (detailTrail) {
      detailSections.push(`
        <div class="detail-section-card">
          <span class="detail-section-label">Раздел</span>
          <p class="detail-note">${escapeHtml(detailTrail)}</p>
        </div>
      `);
    }
    if (originalName) {
      detailSections.push(`
        <div class="detail-section-card">
          <span class="detail-section-label">Оригинальное имя</span>
          <p class="detail-note">${escapeHtml(originalName)}</p>
        </div>
      `);
    }
    if (payload.pathLabel) {
      detailSections.push(`
        <div class="detail-section-card detail-path-card">
          <span class="detail-section-label">Полный путь</span>
          <p class="detail-path">${escapeHtml(payload.pathLabel)}</p>
        </div>
      `);
    }
    els.detailPanel.innerHTML = `
      <article class="detail-card">
        ${buildDetailPreview(payload, detailTitle)}
        <div class="detail-copy">
          <div class="detail-headline">
            <span class="detail-kicker">${escapeHtml(payload.kindLabel || 'Файл')}</span>
            <h3 class="detail-title">${escapeHtml(detailTitle)}</h3>
            ${detailTrail ? `<p class="detail-caption">${escapeHtml(detailTrail)}</p>` : ''}
          </div>
          <div class="item-meta">
            ${pills.map((pill) => `<span class="meta-pill">${escapeHtml(pill)}</span>`).join('')}
          </div>
          ${detailSections.length ? `
            <div class="detail-sections">
              ${detailSections.join('')}
            </div>
          ` : ''}
          <div class="detail-actions">
            ${inlineUrl ? `<a class="ghost-button" href="${escapeHtml(inlineUrl)}" target="_blank" rel="noopener">Открыть</a>` : ''}
            <button type="button" class="ghost-button" data-action="copy-current-link">Скопировать ссылку</button>
            <a class="link-button" href="${escapeHtml(payload.downloadUrl)}">Скачать</a>
            <button type="button" class="item-action" data-action="open-folder" data-id="${escapeHtml(payload.parentId)}">К разделу</button>
          </div>
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

  function renderRootLanding() {
    state.current = null;
    state.detail = null;
    renderSolutionLab(state.bootstrap);
    els.contentMode.textContent = 'Меню';
    els.contentTitle.textContent = 'Выберите раздел';
    els.contentHint.textContent = 'Основной вход в материалы находится в верхнем меню, а готовые шаблоны носителей — в лаборатории решений ниже.';
    renderSectionSwitcher('');
    els.breadcrumbs.innerHTML = '';
    els.contentItems.innerHTML = `
      <div class="empty-state">
        <div class="empty-mark" aria-hidden="true">↗</div>
        <div>
          <h3>Главное меню и лаборатория решений наверху</h3>
          <p class="detail-empty">Откройте раздел каталога, воспользуйтесь поиском или запустите конструктор типового носителя.</p>
        </div>
      </div>
    `;
    els.pagination.innerHTML = '';
    setDocumentTitle('');
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
    renderSolutionLab(payload);
    renderTopSearches(payload.topSearches || []);
    renderConsultantHome();
  }

  async function openRoot(options = {}) {
    const keepWorkspace = Boolean(options.keepWorkspace);
    const revealMenu = Boolean(options.revealMenu);
    if (!keepWorkspace && state.catalogMode) {
      setCatalogMode(false);
    }
    setInspectorOpen(false);
    setActiveRoute('');
    renderDetailPlaceholder();
    renderRootLanding();
    if (els.searchInput) {
      els.searchInput.value = '';
    }
    if (keepWorkspace) {
      setWorkspaceVisible(true);
      ensureWorkspaceVisible();
    } else {
      setWorkspaceVisible(false);
      setWorkspaceCollapsed(true);
    }
    setBrandRoutesOpen(revealMenu, { focus: revealMenu });
    if (revealMenu) {
      focusBrandRoutes();
    }
    if (options.history !== 'none') {
      syncRouteWithState(options.history || 'push');
    }
  }

  async function openFolder(id, page, options = {}) {
    if (!id || String(id) === String(state.bootstrap?.rootId || '')) {
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

  async function openConstructor(id, options = {}) {
    const constructorId = String(id || '').trim();
    if (!constructorId) {
      await openRoot(options);
      return;
    }
    setLoading('Открываю конструктор', 'Поднимаю поля, рекомендации и стартовый каркас решения.');
    setInspectorOpen(false);
    setActiveRoute('');
    renderDetailPlaceholder();
    const payload = await api('constructor', { id: constructorId });
    renderConstructor(payload);
    if (options.history !== 'none') {
      syncRouteWithState(options.history || 'push');
    }
  }

  async function buildConstructor(id, input) {
    const constructorId = String(id || '').trim();
    if (!constructorId) {
      return;
    }
    setLoading('Собираю решение', 'Генерирую стартовый пакет и подтягиваю реальные материалы каталога.');
    const payload = await api('construct', { id: constructorId, input }, { method: 'POST' });
    renderConstructor(payload);
    syncRouteWithState('replace');
  }

  function currentConstructorArtifacts() {
    return Array.isArray(state.current?.payload?.artifacts) ? state.current.payload.artifacts : [];
  }

  function downloadArtifact(artifact) {
    if (!artifact || !artifact.content) {
      return;
    }
    const blob = new Blob([artifact.content], { type: artifact.mimeType || 'application/octet-stream' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = artifact.filename || 'artifact';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function goBack() {
    if (state.current && state.current.kind === 'folder') {
      const crumbs = state.current.payload.breadcrumbs || [];
      if (crumbs.length > 2) {
        openFolder(crumbs[crumbs.length - 2].id, 0);
        return;
      }
    }
    openRoot({ revealMenu: true });
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'toggle-consultant') {
      setConsultantOpen(!state.consultantOpen);
      return;
    }
    if (action === 'close-consultant') {
      setConsultantOpen(false);
      return;
    }
    if (action === 'clear-consultant') {
      clearConsultantConversation('');
      return;
    }
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
    if (action === 'set-solution-filter') {
      state.activeSolutionFilter = String(target.dataset.filter || DEFAULT_SOLUTION_FILTER).trim() || DEFAULT_SOLUTION_FILTER;
      renderSolutionLab(state.bootstrap);
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
    if (action === 'consultant-query') {
      const nextQuery = target.dataset.query || '';
      if (els.consultantInput) {
        els.consultantInput.value = nextQuery;
      }
      setConsultantOpen(true);
      void runConsultant(nextQuery, '');
      return;
    }
    if (action === 'download-artifact') {
      const artifact = currentConstructorArtifacts().find((item) => String(item?.id || '') === String(target.dataset.artifactId || ''));
      if (artifact) {
        downloadArtifact(artifact);
      }
      return;
    }
    if (action === 'reset-constructor') {
      void openConstructor(target.dataset.id, { history: 'replace' });
      return;
    }
    if (isWorkspaceNavigationAction(action)) {
      if (state.brandRoutesOpen) {
        setBrandRoutesOpen(false);
      }
      ensureWorkspaceVisible();
      focusWorkspace(target);
    }
    if (action === 'open-folder') openFolder(target.dataset.id, 0);
    if (action === 'open-folder-page') openFolder(target.dataset.id, Number.parseInt(target.dataset.page || '0', 10));
    if (action === 'open-file') openFile(target.dataset.id);
    if (action === 'open-constructor') openConstructor(target.dataset.id);
    if (action === 'apply-constructor-preset') applyConstructorPreset(target.dataset.presetId);
    if (action === 'search-chip') {
      els.searchInput.value = target.dataset.query || '';
      search(target.dataset.query || '');
    }
    if (action === 'go-root') openRoot({ revealMenu: true });
    if (action === 'back') goBack();
  });

  els.searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    ensureWorkspaceVisible();
    focusWorkspace(els.searchForm);
    search(els.searchInput.value.trim());
  });

  if (els.consultantForm) {
    els.consultantForm.addEventListener('submit', (event) => {
      event.preventDefault();
      setConsultantOpen(true);
      void runConsultant(els.consultantInput?.value.trim() || '', '');
    });
  }

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('#constructor-form');
    if (!form) {
      return;
    }
    event.preventDefault();
    const constructorId = String(form.dataset.constructorId || '').trim();
    if (!constructorId) {
      return;
    }
    void buildConstructor(constructorId, collectConstructorFormInput(form));
  });

  let constructorAutoBuildTimer = 0;
  document.addEventListener('change', (event) => {
    const form = event.target.closest('#constructor-form');
    if (!form) {
      return;
    }
    const constructorId = String(form.dataset.constructorId || '').trim();
    if (!constructorId) {
      return;
    }
    const fieldName = String(event.target?.name || '').trim();
    const fieldType = String(event.target?.type || event.target?.tagName || '').trim().toLowerCase();
    if (!shouldAutoBuildConstructorField(fieldName, fieldType)) {
      return;
    }
    clearTimeout(constructorAutoBuildTimer);
    constructorAutoBuildTimer = window.setTimeout(() => {
      if (!document.body.contains(form)) {
        return;
      }
      void buildConstructor(constructorId, collectConstructorFormInput(form));
    }, 140);
  });

  document.addEventListener('keydown', (event) => {
    const targetTag = String(event.target?.tagName || '').toLowerCase();
    const typingContext = ['input', 'textarea', 'select'].includes(targetTag) || event.target?.isContentEditable;
    if (event.key === 'Escape') {
      if (state.consultantOpen) {
        setConsultantOpen(false);
        return;
      }
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
