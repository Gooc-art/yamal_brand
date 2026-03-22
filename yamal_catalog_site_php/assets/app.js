const YAMAL_ROUTE_QUERY_KEYS = ['view', 'folder', 'page', 'q', 'file', 'solution'];
const DEFAULT_WORKSPACE_COLLAPSED = true;
const DEFAULT_CATALOG_MODE = false;
const DEFAULT_SOLUTION_FILTER = 'all';
const CONSTRUCTOR_STYLE_FIELD_IDS = new Set(['color_variant', 'brand_lockup', 'graphic_element', 'design_variant', 'background_style', 'palette_tone']);
const CONSTRUCTOR_PRIMARY_STYLE_FIELD_IDS = new Set(['brand_lockup', 'graphic_element', 'design_variant', 'background_style', 'palette_tone']);
const CONSTRUCTOR_LIVE_PREVIEW_FIELD_IDS = new Set(['color_variant', 'graphic_element', 'design_variant', 'background_style', 'palette_tone']);
const CONSTRUCTOR_DRAFT_STORAGE_KEY = 'yamal-site-constructor-drafts-v1';
const CONSTRUCTOR_DRAFT_SAVE_DELAY = 220;
const CONSTRUCTOR_PREVIEW_STACKED_BREAKPOINT = 980;
const CONSTRUCTOR_PREVIEW_FLOAT_BREAKPOINT = 0;
const CONSTRUCTOR_PREVIEW_TOP_OFFSET = 18;
const CONSTRUCTOR_PREVIEW_VIEWPORT_GAP = 28;
const WORKSPACE_NAVIGATION_ACTIONS = new Set(['open-folder', 'open-folder-page', 'open-file', 'search-chip', 'open-constructor']);
const PRESSABLE_INTERACTIVE_SELECTOR = '.accent-button, .ghost-button, .link-button, .item-action, .chip, .brand-route-card, .constructor-preset-card, .constructor-choice-card, .constructor-download-card, .constructor-mini-card';
const DEFAULT_CONSULTANT_INTENTS = [
  { id: 'logo', label: 'Нужен логотип', summary: 'Логотип и знак', description: 'Логотип, знак и базовые форматы.', prompt: 'логотип svg' },
  { id: 'brandbook', label: 'Нужен брендбук', summary: 'Брендбуки', description: 'Брендбук региона или города.', prompt: 'брендбук Салехард' },
  { id: 'fonts', label: 'Нужны шрифты', summary: 'Шрифты', description: 'TTF, OTF и архивы.', prompt: 'шрифт otf' },
  { id: 'city', label: 'Материалы города', summary: 'Городские версии', description: 'Городские логотипы и брендбуки.', prompt: 'материалы Салехарда' },
  { id: 'merch', label: 'Сувенирка и носители', summary: 'Сувенирка', description: 'Сувениры, полиграфия и диджитал.', prompt: 'сувенирка наклейки' },
  { id: 'graphics', label: 'SVG, паттерны, графика', summary: 'SVG и паттерны', description: 'SVG, паттерны и векторная графика.', prompt: 'svg паттерн' },
];
let constructorPreviewFloatFrame = 0;
let pressedInteractiveNode = null;
let pressedInteractiveClearTimer = 0;

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function hexToRgb(hex) {
  const normalized = String(hex || '').trim().replace(/^#/, '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((token) => `${token}${token}`).join('')
    : normalized;
  if (!/^[a-f0-9]{6}$/i.test(expanded)) {
    return null;
  }
  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function mixHexColors(baseHex, overlayHex, overlayWeight = 0.5) {
  const base = hexToRgb(baseHex);
  const overlay = hexToRgb(overlayHex);
  if (!base || !overlay) {
    return String(baseHex || '').trim() || '#000000';
  }

  const weight = Math.max(0, Math.min(1, Number(overlayWeight) || 0));
  const inverse = 1 - weight;
  const toHex = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0').toUpperCase();

  return `#${toHex((base.r * inverse) + (overlay.r * weight))}${toHex((base.g * inverse) + (overlay.g * weight))}${toHex((base.b * inverse) + (overlay.b * weight))}`;
}

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
    { id: 'fill', label: 'Заполнение шаблона', hint: 'Текст, имена, контакты и содержание самого носителя.', items: [] },
    { id: 'setup', label: 'Параметры носителя', hint: 'Размер, сценарий, направление и другие параметры носителя.', items: [] },
    { id: 'style', label: 'Оформление', hint: 'Логотип, фон, композиция и графические элементы.', items: [] },
  ];
  const fieldList = Array.isArray(fields) ? fields : [];
  const peopleIds = new Set(['full_name', 'role', 'department', 'phone', 'email', 'speaker', 'speaker_role', 'signer', 'recipient', 'contact_line']);
  const basicsIds = new Set([
    'city',
    'variant',
    'stand_type',
    'size_variant',
    'room_number',
    'floor_label',
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
      groups[1].items.push(field);
      return;
    }
    if (isConstructorChoiceField(fieldId)) {
      groups[2].items.push(field);
      return;
    }
    if (peopleIds.has(fieldId)) {
      groups[0].items.push(field);
      return;
    }
    groups[0].items.push(field);
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

function constructorArtifactSupportsPngExport(artifact) {
  return String(artifact?.previewType || '').trim() === 'svg'
    && /<svg[\s>]/i.test(String(artifact?.content || ''));
}

function constructorArtifactPngLabel(artifact) {
  const label = String(artifact?.label || '').trim();
  if (!label) {
    return 'PNG';
  }
  if (/svg/iu.test(label)) {
    return label.replace(/svg/iu, 'PNG');
  }
  return `PNG • ${label}`;
}

function constructorArtifactPngFilename(artifactOrFilename) {
  const source = typeof artifactOrFilename === 'string'
    ? artifactOrFilename
    : artifactOrFilename?.filename;
  const filename = String(source || '').trim() || 'artifact';
  if (/\.[a-z0-9]{2,8}$/i.test(filename)) {
    return filename.replace(/\.[a-z0-9]{2,8}$/i, '.png');
  }
  return `${filename}.png`;
}

function buildConstructorPngDownloadEntry(artifactRef, sourceArtifact = null) {
  const reference = artifactRef && typeof artifactRef === 'object' ? artifactRef : {};
  const resolvedSource = sourceArtifact && typeof sourceArtifact === 'object'
    ? sourceArtifact
    : reference;
  const artifactId = String(reference?.id || resolvedSource?.id || '').trim();
  if (!artifactId || !constructorArtifactSupportsPngExport(resolvedSource)) {
    return null;
  }
  return {
    id: `${artifactId}-png`,
    action: 'download-artifact-png',
    artifactId,
    label: constructorArtifactPngLabel(reference?.label ? reference : resolvedSource),
    filename: constructorArtifactPngFilename(reference?.filename || resolvedSource?.filename || ''),
    note: 'Растровая выгрузка из текущего SVG',
  };
}

function resolveConstructorSvgDownloadMarkup(artifact, previewMarkup = '') {
  if (!constructorArtifactSupportsPngExport(artifact)) {
    return String(artifact?.content || '');
  }
  const previewSource = String(previewMarkup || '').trim();
  if (previewSource) {
    return previewSource;
  }
  return String(artifact?.content || '');
}

function sanitizeConstructorPreviewToken(value, fallback = 'default') {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  return normalized || fallback;
}

function buildConstructorChoiceSvg(content, viewBox = '0 0 92 52') {
  return `
    <svg class="constructor-choice-svg" viewBox="${viewBox}" aria-hidden="true" focusable="false">
      ${content}
    </svg>
  `;
}

function buildConstructorDesignPreviewSvg(variant) {
  switch (variant) {
    case 'editorial':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fffaf3" stroke="#d9cfbf" stroke-width="1.2"/>
        <rect x="14" y="12" width="4" height="28" fill="#182a31"/>
        <line x1="24" y1="16" x2="56" y2="16" stroke="#c40e3d" stroke-width="3" stroke-linecap="round"/>
        <line x1="24" y1="25" x2="70" y2="25" stroke="#42515b" stroke-width="3" stroke-linecap="round" opacity="0.28"/>
        <line x1="24" y1="34" x2="62" y2="34" stroke="#42515b" stroke-width="3" stroke-linecap="round" opacity="0.18"/>
      `);
    case 'signal':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fff9f0" stroke="#d9cfbf" stroke-width="1.2"/>
        <rect x="14" y="12" width="20" height="5" fill="#182a31"/>
        <line x1="14" y1="24" x2="58" y2="24" stroke="#42515b" stroke-width="3" stroke-linecap="round" opacity="0.24"/>
        <rect x="14" y="31" width="56" height="7" fill="#c40e3d"/>
      `);
    case 'poster':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#1f3138"/>
        <line x1="14" y1="15" x2="34" y2="15" stroke="#f9f0e1" stroke-width="3" stroke-linecap="round"/>
        <rect x="14" y="21" width="44" height="15" fill="#c40e3d"/>
        <rect x="63" y="21" width="7" height="15" fill="#f9f0e1"/>
        <line x1="14" y1="40" x2="46" y2="40" stroke="#f9f0e1" stroke-width="2.5" stroke-linecap="round" opacity="0.84"/>
      `);
    case 'monument':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#f8f3ec" stroke="#d9cfbf" stroke-width="1.2"/>
        <rect x="14" y="12" width="12" height="28" fill="#c40e3d"/>
        <line x1="34" y1="16" x2="70" y2="16" stroke="#182a31" stroke-width="4" stroke-linecap="round"/>
        <line x1="34" y1="27" x2="62" y2="27" stroke="#42515b" stroke-width="3" stroke-linecap="round" opacity="0.28"/>
        <line x1="34" y1="36" x2="56" y2="36" stroke="#42515b" stroke-width="3" stroke-linecap="round" opacity="0.18"/>
      `);
    case 'navigator':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#f4f8f6" stroke="#d2ddd8" stroke-width="1.2"/>
        <path d="M16 29h28v-10h18" stroke="#182a31" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M54 13l10 6-10 6" fill="none" stroke="#c40e3d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="16" cy="29" r="4" fill="#182a31"/>
        <circle cx="44" cy="29" r="4" fill="#42515b" opacity="0.42"/>
      `);
    case 'gallery':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#f7fbfb" stroke="#d5dfdf" stroke-width="1.2"/>
        <rect x="14" y="13" width="14" height="18" fill="#c40e3d"/>
        <rect x="34" y="13" width="14" height="24" fill="#182a31" opacity="0.22"/>
        <rect x="54" y="13" width="20" height="14" fill="#d1e2e2"/>
        <line x1="54" y1="35" x2="74" y2="35" stroke="#42515b" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
      `);
    case 'calm':
    default:
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fffaf3" stroke="#d9cfbf" stroke-width="1.2"/>
        <line x1="14" y1="16" x2="46" y2="16" stroke="#182a31" stroke-width="3" stroke-linecap="round"/>
        <line x1="14" y1="25" x2="62" y2="25" stroke="#42515b" stroke-width="3" stroke-linecap="round" opacity="0.22"/>
        <line x1="14" y1="34" x2="54" y2="34" stroke="#42515b" stroke-width="3" stroke-linecap="round" opacity="0.16"/>
        <rect x="72" y="13" width="4" height="24" fill="#f0eaed"/>
      `);
  }
}

function buildConstructorBackgroundPreviewSvg(variant) {
  switch (variant) {
    case 'band':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fff9f0" stroke="#d9cfbf" stroke-width="1.2"/>
        <rect x="8" y="8" width="76" height="8" fill="#c40e3d"/>
        <line x1="12" y1="28" x2="62" y2="28" stroke="#42515b" stroke-width="3" stroke-linecap="round" opacity="0.18"/>
      `);
    case 'frame':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fffdf9" stroke="#d9cfbf" stroke-width="1.2"/>
        <rect x="14" y="14" width="64" height="24" rx="6" fill="none" stroke="#182a31" stroke-width="2.4"/>
        <rect x="18" y="18" width="56" height="16" rx="4" fill="none" stroke="#cfc1ae" stroke-width="1.2"/>
      `);
    case 'watermark':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fffaf3" stroke="#d9cfbf" stroke-width="1.2"/>
        <circle cx="60" cy="26" r="14" fill="none" stroke="#c40e3d" stroke-width="2.4" opacity="0.22"/>
        <line x1="18" y1="26" x2="44" y2="26" stroke="#182a31" stroke-width="3" stroke-linecap="round" opacity="0.18"/>
      `);
    case 'pattern':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#faf7f1" stroke="#d9cfbf" stroke-width="1.2"/>
        <circle cx="20" cy="18" r="2.4" fill="#182a31" opacity="0.28"/>
        <circle cx="34" cy="14" r="2.4" fill="#c40e3d" opacity="0.32"/>
        <circle cx="48" cy="24" r="2.4" fill="#182a31" opacity="0.28"/>
        <circle cx="64" cy="18" r="2.4" fill="#c40e3d" opacity="0.32"/>
        <circle cx="26" cy="32" r="2.4" fill="#182a31" opacity="0.28"/>
        <circle cx="58" cy="34" r="2.4" fill="#182a31" opacity="0.28"/>
      `);
    case 'corner':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fffaf3" stroke="#d9cfbf" stroke-width="1.2"/>
        <path d="M8 8h24l-10 12H8z" fill="#c40e3d"/>
        <line x1="66" y1="34" x2="78" y2="34" stroke="#182a31" stroke-width="3" stroke-linecap="round" opacity="0.24"/>
      `);
    case 'halo':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fff9f0" stroke="#d9cfbf" stroke-width="1.2"/>
        <circle cx="48" cy="26" r="15" fill="none" stroke="#c40e3d" stroke-width="2.4" opacity="0.24"/>
        <circle cx="48" cy="26" r="8" fill="none" stroke="#cfc1ae" stroke-width="1.2"/>
      `);
    case 'split':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#f6efe5" stroke="#d9cfbf" stroke-width="1.2"/>
        <path d="M48 8h36v36H36z" fill="#182a31"/>
        <line x1="14" y1="16" x2="34" y2="16" stroke="#c40e3d" stroke-width="3" stroke-linecap="round"/>
      `);
    case 'rail':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fffaf3" stroke="#d9cfbf" stroke-width="1.2"/>
        <rect x="14" y="10" width="8" height="32" fill="#182a31"/>
        <line x1="30" y1="17" x2="72" y2="17" stroke="#c40e3d" stroke-width="3" stroke-linecap="round"/>
        <line x1="30" y1="31" x2="62" y2="31" stroke="#42515b" stroke-width="3" stroke-linecap="round" opacity="0.18"/>
      `);
    case 'capsule':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fbf7f1" stroke="#d9cfbf" stroke-width="1.2"/>
        <rect x="14" y="16" width="26" height="8" rx="4" fill="#c40e3d"/>
        <rect x="46" y="12" width="22" height="6" rx="3" fill="#182a31" opacity="0.18"/>
        <rect x="38" y="29" width="28" height="7" rx="3.5" fill="#d1e2e2"/>
      `);
    case 'clean':
    default:
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="10" fill="#fffdf9" stroke="#d9cfbf" stroke-width="1.2"/>
        <line x1="18" y1="21" x2="66" y2="21" stroke="#182a31" stroke-width="2.6" stroke-linecap="round" opacity="0.14"/>
        <line x1="18" y1="31" x2="58" y2="31" stroke="#182a31" stroke-width="2.6" stroke-linecap="round" opacity="0.1"/>
      `);
  }
}

function buildConstructorGraphicPreviewSvg(variant) {
  switch (variant) {
    case 'group_1410103616':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="11" fill="#fff9f0"/>
        <circle cx="26" cy="20" r="8" fill="#182a31"/>
        <circle cx="42" cy="29" r="8" fill="#c40e3d"/>
        <circle cx="58" cy="20" r="8" fill="#182a31" opacity="0.72"/>
      `);
    case 'group_2087328779':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="11" fill="#fff9f0"/>
        <rect x="18" y="15" width="12" height="12" rx="4" fill="#182a31"/>
        <rect x="33" y="23" width="12" height="12" rx="4" fill="#c40e3d"/>
        <rect x="48" y="14" width="12" height="12" rx="4" fill="#182a31" opacity="0.6"/>
        <rect x="63" y="22" width="12" height="12" rx="4" fill="#d1e2e2"/>
      `);
    case 'group_1':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="11" fill="#fff9f0"/>
        <path d="M20 33l12-16 12 16" fill="#182a31"/>
        <path d="M40 33l10-12 10 12" fill="#c40e3d"/>
        <circle cx="66" cy="22" r="7" fill="#182a31" opacity="0.28"/>
      `);
    case 'logo_band':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="11" fill="#fbf7f1"/>
        <rect x="14" y="16" width="16" height="20" rx="5" fill="#182a31"/>
        <rect x="34" y="16" width="16" height="20" rx="5" fill="#c40e3d"/>
        <rect x="54" y="16" width="16" height="20" rx="5" fill="#182a31"/>
      `);
    case 'mark_constellation':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="11" fill="#f7fbfb"/>
        <path d="M18 29l17-10 15 12 17-13" stroke="#182a31" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="18" cy="29" r="4" fill="#c40e3d"/>
        <circle cx="35" cy="19" r="4" fill="#182a31"/>
        <circle cx="50" cy="31" r="4" fill="#c40e3d"/>
        <circle cx="67" cy="18" r="4" fill="#182a31"/>
      `);
    case 'lockup_bridge':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="11" fill="#fffaf3"/>
        <rect x="14" y="16" width="26" height="20" rx="6" fill="#182a31"/>
        <rect x="45" y="20" width="9" height="4" rx="2" fill="#c40e3d"/>
        <rect x="58" y="14" width="14" height="14" rx="5" fill="#c40e3d"/>
        <rect x="58" y="31" width="14" height="5" rx="2.5" fill="#182a31" opacity="0.28"/>
      `);
    case 'mark_white':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="11" fill="#182a31"/>
        <circle cx="46" cy="26" r="11" fill="#fffdf9"/>
      `);
    case 'logo_mark_white':
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="11" fill="#182a31"/>
        <rect x="18" y="18" width="20" height="16" rx="5" fill="#fffdf9"/>
        <circle cx="58" cy="26" r="9" fill="#fffdf9"/>
      `);
    case 'mark_yamal':
    default:
      return buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="76" height="36" rx="11" fill="#fffaf3"/>
        <path d="M46 14l10 12-10 12-10-12z" fill="#c40e3d"/>
      `);
  }
}

function buildConstructorLockupPreviewSvg(variant) {
  if (variant === 'mark') {
    return buildConstructorChoiceSvg(`
      <rect x="10" y="10" width="72" height="32" rx="10" fill="#fffaf3" stroke="#d9cfbf" stroke-width="1.2"/>
      <path d="M46 15l10 11-10 11-10-11z" fill="#c40e3d"/>
    `);
  }
  return buildConstructorChoiceSvg(`
    <rect x="10" y="10" width="72" height="32" rx="10" fill="#fffaf3" stroke="#d9cfbf" stroke-width="1.2"/>
    <path d="M18 33l6-14h7l-7 14z" fill="#c40e3d"/>
    <line x1="40" y1="22" x2="68" y2="22" stroke="#c40e3d" stroke-width="3" stroke-linecap="round"/>
    <line x1="40" y1="30" x2="60" y2="30" stroke="#182a31" stroke-width="2.6" stroke-linecap="round" opacity="0.28"/>
  `);
}

function buildConstructorPresetPreview(preset) {
  const overrides = preset && typeof preset.overrides === 'object' ? preset.overrides : {};
  const designVariant = sanitizeConstructorPreviewToken(overrides.design_variant, 'calm');
  const backgroundStyle = sanitizeConstructorPreviewToken(overrides.background_style, 'clean');
  const brandLockup = sanitizeConstructorPreviewToken(overrides.brand_lockup, 'logo');
  const graphicElement = sanitizeConstructorPreviewToken(
    overrides.graphic_element,
    brandLockup === 'mark' ? 'mark_yamal' : 'lockup_bridge',
  );

  let backgroundLayer = '';
  switch (backgroundStyle) {
    case 'split':
      backgroundLayer = `
        <path d="M68 8h44v56H44z" fill="#182a31"/>
        <line x1="14" y1="20" x2="40" y2="20" stroke="#c40e3d" stroke-width="4" stroke-linecap="round"/>
      `;
      break;
    case 'rail':
      backgroundLayer = `
        <rect x="16" y="12" width="10" height="48" fill="#182a31"/>
        <line x1="34" y1="19" x2="84" y2="19" stroke="#c40e3d" stroke-width="4" stroke-linecap="round"/>
      `;
      break;
    case 'capsule':
      backgroundLayer = `
        <rect x="18" y="19" width="30" height="8" rx="4" fill="#c40e3d"/>
        <rect x="54" y="15" width="22" height="6" rx="3" fill="#182a31" opacity="0.18"/>
        <rect x="58" y="38" width="26" height="7" rx="3.5" fill="#d1e2e2"/>
      `;
      break;
    case 'band':
      backgroundLayer = `
        <rect x="8" y="8" width="104" height="10" fill="#c40e3d"/>
        <line x1="18" y1="52" x2="68" y2="52" stroke="#42515b" stroke-width="4" stroke-linecap="round" opacity="0.14"/>
      `;
      break;
    case 'frame':
      backgroundLayer = `
        <rect x="16" y="16" width="88" height="40" rx="8" fill="none" stroke="#182a31" stroke-width="2.6"/>
        <rect x="21" y="21" width="78" height="30" rx="5" fill="none" stroke="#d5c7b5" stroke-width="1.2"/>
      `;
      break;
    case 'watermark':
      backgroundLayer = `<circle cx="82" cy="34" r="18" fill="none" stroke="#c40e3d" stroke-width="3" opacity="0.18"/>`;
      break;
    case 'pattern':
      backgroundLayer = `
        <circle cx="28" cy="22" r="2.8" fill="#182a31" opacity="0.28"/>
        <circle cx="46" cy="17" r="2.8" fill="#c40e3d" opacity="0.32"/>
        <circle cx="64" cy="34" r="2.8" fill="#182a31" opacity="0.28"/>
        <circle cx="82" cy="20" r="2.8" fill="#c40e3d" opacity="0.32"/>
        <circle cx="92" cy="42" r="2.8" fill="#182a31" opacity="0.28"/>
      `;
      break;
    case 'corner':
      backgroundLayer = `
        <path d="M8 8h28l-11 12H8z" fill="#c40e3d"/>
        <line x1="86" y1="52" x2="100" y2="52" stroke="#42515b" stroke-width="4" stroke-linecap="round" opacity="0.16"/>
      `;
      break;
    case 'halo':
      backgroundLayer = `
        <circle cx="62" cy="36" r="18" fill="none" stroke="#c40e3d" stroke-width="3" opacity="0.2"/>
        <circle cx="62" cy="36" r="10" fill="none" stroke="#d5c7b5" stroke-width="1.4"/>
      `;
      break;
    default:
      backgroundLayer = '';
  }

  let contentLayer = '';
  switch (designVariant) {
    case 'editorial':
      contentLayer = `
        <rect x="22" y="16" width="4" height="30" fill="#182a31"/>
        <line x1="32" y1="20" x2="62" y2="20" stroke="#c40e3d" stroke-width="4" stroke-linecap="round"/>
        <line x1="32" y1="31" x2="76" y2="31" stroke="#182a31" stroke-width="3.6" stroke-linecap="round" opacity="0.24"/>
        <line x1="32" y1="41" x2="68" y2="41" stroke="#182a31" stroke-width="3.6" stroke-linecap="round" opacity="0.16"/>
      `;
      break;
    case 'signal':
      contentLayer = `
        <line x1="18" y1="22" x2="40" y2="22" stroke="#182a31" stroke-width="4" stroke-linecap="round"/>
        <rect x="18" y="32" width="58" height="8" fill="#c40e3d"/>
      `;
      break;
    case 'poster':
      contentLayer = `
        <rect x="18" y="20" width="48" height="20" fill="#c40e3d"/>
        <rect x="72" y="20" width="8" height="20" fill="#f9f0e1"/>
      `;
      break;
    case 'monument':
      contentLayer = `
        <rect x="18" y="14" width="14" height="40" fill="#c40e3d"/>
        <line x1="42" y1="22" x2="84" y2="22" stroke="#182a31" stroke-width="5" stroke-linecap="round"/>
        <line x1="42" y1="36" x2="74" y2="36" stroke="#182a31" stroke-width="3.6" stroke-linecap="round" opacity="0.24"/>
      `;
      break;
    case 'navigator':
      contentLayer = `
        <path d="M20 36h26v-12h22" stroke="#182a31" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M60 18l12 6-12 6" fill="none" stroke="#c40e3d" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      `;
      break;
    case 'gallery':
      contentLayer = `
        <rect x="16" y="18" width="16" height="26" fill="#c40e3d"/>
        <rect x="40" y="18" width="16" height="32" fill="#182a31" opacity="0.2"/>
        <rect x="64" y="18" width="24" height="18" fill="#d1e2e2"/>
      `;
      break;
    case 'calm':
    default:
      contentLayer = `
        <line x1="18" y1="22" x2="50" y2="22" stroke="#182a31" stroke-width="4" stroke-linecap="round"/>
        <line x1="18" y1="34" x2="66" y2="34" stroke="#182a31" stroke-width="3.4" stroke-linecap="round" opacity="0.2"/>
      `;
  }

  let graphicLayer = '';
  switch (graphicElement) {
    case 'logo_band':
      graphicLayer = `
        <rect x="74" y="46" width="10" height="10" rx="4" fill="#182a31"/>
        <rect x="88" y="46" width="10" height="10" rx="4" fill="#c40e3d"/>
      `;
      break;
    case 'mark_constellation':
      graphicLayer = `
        <path d="M72 46l10-6 10 8" stroke="#182a31" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="72" cy="46" r="3.5" fill="#c40e3d"/>
        <circle cx="82" cy="40" r="3.5" fill="#182a31"/>
        <circle cx="92" cy="48" r="3.5" fill="#c40e3d"/>
      `;
      break;
    case 'group_1410103616':
    case 'group_2087328779':
    case 'group_1':
      graphicLayer = `
        <circle cx="86" cy="46" r="5" fill="#182a31" opacity="0.72"/>
        <circle cx="98" cy="40" r="5" fill="#c40e3d" opacity="0.88"/>
      `;
      break;
    case 'mark_yamal':
    case 'mark_white':
    case 'logo_mark_white':
    case 'lockup_bridge':
    default:
      graphicLayer = `
        <path d="M94 18l8 10-8 10-8-10z" fill="${graphicElement === 'mark_white' || graphicElement === 'logo_mark_white' ? '#ffffff' : '#c40e3d'}"/>
      `;
  }

  return `
    <span class="constructor-preset-visual">
      ${buildConstructorChoiceSvg(`
        <rect x="8" y="8" width="104" height="56" rx="18" fill="#fffaf3"/>
        ${backgroundLayer}
        ${contentLayer}
        ${graphicLayer}
      `, '0 0 120 72')}
    </span>
  `;
}

function buildConstructorChoicePreview(fieldId, option) {
  const token = String(option?.mark || option?.label || option?.value || '').trim().slice(0, 10);
  const variant = sanitizeConstructorPreviewToken(option?.value, 'default');
  if (fieldId === 'palette_tone') {
    const swatch = String(option?.swatch || '').trim() || '#f6f0e7';
    const swatchSoft = String(option?.swatchSoft || '').trim() || '#fffdfa';
    const dark = Boolean(option?.dark);
    return `
      <span class="constructor-choice-visual constructor-choice-visual-swatch${dark ? ' is-dark' : ''}" style="--choice-tone:${escapeHtml(swatch)};--choice-tone-soft:${escapeHtml(swatchSoft)};">
        <span class="constructor-choice-swatch constructor-choice-swatch-primary" aria-hidden="true"></span>
        <span class="constructor-choice-swatch constructor-choice-swatch-secondary" aria-hidden="true"></span>
      </span>
    `;
  }
  if (fieldId === 'design_variant') {
    return `
      <span class="constructor-choice-visual constructor-choice-visual-layout">
        ${buildConstructorDesignPreviewSvg(variant)}
      </span>
    `;
  }
  if (fieldId === 'background_style') {
    return `
      <span class="constructor-choice-visual constructor-choice-visual-background">
        ${buildConstructorBackgroundPreviewSvg(variant)}
      </span>
    `;
  }
  if (fieldId === 'graphic_element') {
    return `
      <span class="constructor-choice-visual constructor-choice-visual-graphic">
        ${buildConstructorGraphicPreviewSvg(variant)}
      </span>
    `;
  }
  if (fieldId === 'brand_lockup') {
    return `
      <span class="constructor-choice-visual constructor-choice-visual-lockup">
        ${buildConstructorLockupPreviewSvg(variant)}
      </span>
    `;
  }
  return `<span class="constructor-choice-visual constructor-choice-visual-token">${escapeHtml(token)}</span>`;
}

function constructorPaletteToneDefinition(paletteTone) {
  const definitions = {
    accent: { id: 'accent', label: 'Фирменный красный', tone: '#C40E3D', toneSoft: '#F4D7E0', toneInk: '#ffffff', frame: '#C40E3D', dark: true },
    ivory: { id: 'ivory', label: 'Мамонтовая кость', tone: '#F9F0E1', toneSoft: '#FFF9F0', toneInk: '#182a31', frame: '#F9F0E1', dark: false },
    lichen: { id: 'lichen', label: 'Ягель снежный', tone: '#F0EAED', toneSoft: '#FBF9FA', toneInk: '#182a31', frame: '#F0EAED', dark: false },
    p621: { id: 'p621', label: 'Pantone 621 C', tone: '#E1ECE7', toneSoft: '#F7FBF8', toneInk: '#182a31', frame: '#E1ECE7', dark: false },
    r6034: { id: 'r6034', label: 'RAL 6034', tone: '#D1E2E2', toneSoft: '#F1F7F7', toneInk: '#182a31', frame: '#D1E2E2', dark: false },
  };
  return definitions[String(paletteTone || '').trim()] || definitions.ivory;
}

function buildConstructorLiveTheme(input = {}) {
  const colorVariant = String(input?.color_variant || 'color').trim() || 'color';
  const paletteTone = String(input?.palette_tone || 'ivory').trim() || 'ivory';
  const tone = constructorPaletteToneDefinition(paletteTone);
  const accent = colorVariant === 'black' ? '#182A31' : '#C40E3D';
  const background = String(tone.toneSoft || '#FFF9F0').trim() || '#FFF9F0';
  const surface = mixHexColors(background, '#FFFFFF', tone.dark ? 0.36 : 0.52);
  const surfaceAlt = mixHexColors(String(tone.tone || background).trim() || background, '#FFFFFF', tone.dark ? 0.42 : 0.24);
  const frame = String(tone.frame || tone.tone || '#C40E3D').trim() || '#C40E3D';
  const line = mixHexColors(frame, '#FFFFFF', tone.dark ? 0.18 : 0.08);
  const accentSoft = mixHexColors(String(tone.tone || '#F4D7E0').trim() || '#F4D7E0', '#FFFFFF', tone.dark ? 0.62 : 0.46);
  return {
    colorVariant: ['cmyk', 'black', 'white'].includes(colorVariant) ? colorVariant : 'color',
    background,
    surface,
    surfaceAlt,
    cardStroke: frame,
    accent,
    accentSoft,
    ink: '#182A31',
    muted: '#5D6972',
    badge: colorVariant === 'black' ? '#182A31' : accent,
    line,
    frame,
    watermarkOpacity: tone.dark ? '0.14' : '0.2',
    paletteTone: tone.id,
    paletteToneLabel: tone.label,
    tone: tone.tone,
    toneSoft: tone.toneSoft,
    toneInk: tone.toneInk,
    toneIsDark: Boolean(tone.dark),
  };
}

function resolveConstructorLiveBrandVariant(input = {}, theme = null) {
  const currentTheme = theme && typeof theme === 'object' ? theme : buildConstructorLiveTheme(input);
  const requestedVariant = String(input?.color_variant || 'color').trim() || 'color';
  if (requestedVariant === 'white') {
    return 'white';
  }
  return currentTheme.toneIsDark ? 'white' : requestedVariant;
}

function buildConstructorLiveLockupSurface(theme, brandVariant) {
  const tone = String(theme?.tone || '#f6f0e7').trim() || '#f6f0e7';
  const toneInk = String(theme?.toneInk || '#182a31').trim() || '#182a31';
  if (brandVariant === 'white' && !theme?.toneIsDark) {
    return {
      fill: String(theme?.accent || '#182a31').trim() || '#182a31',
      ink: '#ffffff',
    };
  }
  return {
    fill: tone,
    ink: toneInk,
  };
}

function hasConstructorFieldValue(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasConstructorFieldValue(item));
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  return String(value ?? '').trim() !== '';
}

function buildConstructorCompletion(fields, input) {
  const fieldList = Array.isArray(fields) ? fields : [];
  const source = input && typeof input === 'object' ? input : {};
  let total = 0;
  let filled = 0;
  let requiredTotal = 0;
  let requiredFilled = 0;

  fieldList.forEach((field) => {
    const fieldId = String(field?.id || '').trim();
    const fieldType = String(field?.type || 'text').trim().toLowerCase();
    if (!fieldId || fieldType === 'hidden' || isConstructorChoiceField(fieldId)) {
      return;
    }

    total += 1;
    const value = source[fieldId] ?? field?.default ?? '';
    const filledValue = hasConstructorFieldValue(value);
    if (filledValue) {
      filled += 1;
    }

    if (Boolean(field?.required)) {
      requiredTotal += 1;
      if (filledValue) {
        requiredFilled += 1;
      }
    }
  });

  const percent = total > 0 ? Math.round((filled / total) * 100) : 100;
  const remainingRequired = Math.max(0, requiredTotal - requiredFilled);

  return {
    total,
    filled,
    requiredTotal,
    requiredFilled,
    remainingRequired,
    percent,
    ready: remainingRequired === 0,
  };
}

function normalizeConstructorDraftInput(fields, input) {
  const fieldList = Array.isArray(fields) ? fields : [];
  const source = input && typeof input === 'object' ? input : {};
  const normalized = {};

  fieldList.forEach((field) => {
    const fieldId = String(field?.id || '').trim();
    if (!fieldId || !Object.prototype.hasOwnProperty.call(source, fieldId)) {
      return;
    }

    const fieldType = String(field?.type || 'text').trim().toLowerCase();
    const rawValue = source[fieldId];
    const value = Array.isArray(rawValue) ? String(rawValue[0] ?? '') : String(rawValue ?? '');
    const defaultValue = String(field?.default ?? '');

    if ((fieldType === 'select' || fieldType === 'radio') && Array.isArray(field?.options) && field.options.length) {
      const allowedValues = new Set(field.options.map((option) => String(option?.value ?? '')));
      if (value !== '' && !allowedValues.has(value)) {
        return;
      }
    }

    if (value === defaultValue) {
      return;
    }

    normalized[fieldId] = value;
  });

  return normalized;
}

function buildConstructorDraftEntry(fields, input, nowValue = new Date()) {
  const normalizedInput = normalizeConstructorDraftInput(fields, input);
  if (!Object.keys(normalizedInput).length) {
    return null;
  }

  const updatedAt = nowValue instanceof Date
    ? nowValue.toISOString()
    : String(nowValue || '').trim() || new Date().toISOString();

  return {
    input: normalizedInput,
    updatedAt,
  };
}

function normalizeStoredConstructorDraft(entry, fields) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }

  const normalizedInput = normalizeConstructorDraftInput(fields, entry.input);
  if (!Object.keys(normalizedInput).length) {
    return null;
  }

  return {
    input: normalizedInput,
    updatedAt: String(entry.updatedAt || '').trim(),
  };
}

function readConstructorDraftStore(storage = null) {
  if (!storage || typeof storage.getItem !== 'function') {
    return {};
  }

  try {
    const raw = storage.getItem(CONSTRUCTOR_DRAFT_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch (error) {
    return {};
  }
}

function writeConstructorDraftStore(store, storage = null) {
  if (!storage || typeof storage.setItem !== 'function') {
    return false;
  }

  try {
    storage.setItem(CONSTRUCTOR_DRAFT_STORAGE_KEY, JSON.stringify(store || {}));
    return true;
  } catch (error) {
    return false;
  }
}

function loadConstructorDraft(constructorId, fields, storage = null) {
  const normalizedId = String(constructorId || '').trim();
  if (!normalizedId) {
    return null;
  }

  const store = readConstructorDraftStore(storage);
  return normalizeStoredConstructorDraft(store[normalizedId], fields);
}

function saveConstructorDraft(constructorId, fields, input, storage = null, nowValue = new Date()) {
  const normalizedId = String(constructorId || '').trim();
  if (!normalizedId) {
    return null;
  }

  const nextEntry = buildConstructorDraftEntry(fields, input, nowValue);
  const store = readConstructorDraftStore(storage);

  if (!nextEntry) {
    delete store[normalizedId];
    writeConstructorDraftStore(store, storage);
    return null;
  }

  store[normalizedId] = nextEntry;
  return writeConstructorDraftStore(store, storage) ? nextEntry : null;
}

function removeConstructorDraft(constructorId, storage = null) {
  const normalizedId = String(constructorId || '').trim();
  if (!normalizedId) {
    return false;
  }

  const store = readConstructorDraftStore(storage);
  if (!Object.prototype.hasOwnProperty.call(store, normalizedId)) {
    return true;
  }

  delete store[normalizedId];
  return writeConstructorDraftStore(store, storage);
}

function buildConstructorDraftState(draftMeta) {
  const meta = draftMeta && typeof draftMeta === 'object' ? draftMeta : {};
  if (meta.restored) {
    return {
      title: 'Черновик восстановлен',
      note: 'Последняя локальная версия формы подставлена автоматически и будет сохраняться дальше в этом браузере.',
    };
  }
  if (String(meta.updatedAt || '').trim()) {
    return {
      title: 'Черновик сохраняется локально',
      note: 'Изменения формы останутся в этом браузере даже после обновления страницы.',
    };
  }
  return {
    title: 'Черновик включен',
    note: 'Форма сохраняется локально в этом браузере без отдельного проекта на сервере.',
  };
}

function summarizeConstructorFieldLabels(labels, maxItems = 3) {
  const normalized = Array.from(new Set((Array.isArray(labels) ? labels : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)));
  if (!normalized.length) {
    return '';
  }
  if (normalized.length <= maxItems) {
    return normalized.join(', ');
  }
  return `${normalized.slice(0, maxItems).join(', ')} и ещё ${normalized.length - maxItems}`;
}

function constructorFieldWarningThreshold(field) {
  const fieldId = String(field?.id || '').trim();
  const fieldType = String(field?.type || 'text').trim().toLowerCase();

  if (/^(full_name|recipient)$/u.test(fieldId)) {
    return { soft: 32, hard: 48 };
  }
  if (/^(headline|title|document_title|location|destination)$/u.test(fieldId)) {
    return { soft: 54, hard: 84 };
  }
  if (/^(role|department|speaker|speaker_role|signer|event_name|cta|subline|reason|subtitle|route_hint|section_one_title|section_two_title)$/u.test(fieldId)) {
    return { soft: 68, hard: 120 };
  }
  if (/^(message|structure|contact_line|section_one_body|section_two_body)$/u.test(fieldId)) {
    return { soft: 170, hard: 280 };
  }
  if (fieldType === 'textarea') {
    return { soft: 150, hard: 260 };
  }
  if (fieldType === 'email') {
    return { soft: 34, hard: 54 };
  }
  if (fieldType === 'text') {
    return { soft: 64, hard: 110 };
  }
  return null;
}

function buildConstructorWarnings(fields, input, options = {}) {
  const fieldList = Array.isArray(fields) ? fields : [];
  const source = input && typeof input === 'object' ? input : {};
  const warnings = [];
  const missingRequired = [];
  const longFields = [];

  fieldList.forEach((field) => {
    const fieldId = String(field?.id || '').trim();
    const fieldType = String(field?.type || 'text').trim().toLowerCase();
    if (!fieldId || fieldType === 'hidden') {
      return;
    }

    const label = String(field?.label || fieldId).trim() || fieldId;
    const value = source[fieldId] ?? field?.default ?? '';
    const hasValue = hasConstructorFieldValue(value);

    if (Boolean(field?.required) && !hasValue) {
      missingRequired.push(label);
    }

    if (!hasValue || isConstructorChoiceField(fieldId)) {
      return;
    }

    const threshold = constructorFieldWarningThreshold(field);
    if (!threshold) {
      return;
    }

    const compactLength = String(value ?? '').replace(/\s+/gu, ' ').trim().length;
    if (compactLength >= threshold.hard) {
      longFields.push({ label, severity: 'hard' });
    } else if (compactLength >= threshold.soft) {
      longFields.push({ label, severity: 'soft' });
    }
  });

  if (missingRequired.length) {
    warnings.push({
      id: 'missing_required',
      tone: 'warn',
      title: 'Заполните обязательные поля',
      message: `Нужно ещё: ${summarizeConstructorFieldLabels(missingRequired, 3)}.`,
    });
  }

  if (longFields.length) {
    const severe = longFields.some((item) => item.severity === 'hard');
    warnings.push({
      id: 'long_text',
      tone: severe ? 'warn' : 'info',
      title: severe ? 'Текст уже упирается в safe-area' : 'Проверьте длинные поля',
      message: severe
        ? `Поля ${summarizeConstructorFieldLabels(longFields.map((item) => item.label), 2)} могут сильнее ужать кегль или переносы в макете.`
        : `Поля ${summarizeConstructorFieldLabels(longFields.map((item) => item.label), 2)} уже выглядят плотными. Проверьте их в превью перед скачиванием.`,
    });
  }

  if (String(options?.previewArtifact?.previewType || '').trim() === 'svg' && longFields.length) {
    warnings.push({
      id: 'preview_review',
      tone: 'info',
      title: 'Сверьте SVG перед передачей',
      message: 'Перед отправкой откройте превью и проверьте переносы, охранные поля и читаемость длинного текста.',
    });
  }

  return warnings.slice(0, 3);
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
      'Покажите визуальный вариант и описание команде или заказчику.',
    ),
    contractor: normalizePack(
      handoff?.contractor,
      'contractor',
      'В работу',
      'Передайте исходники, файлы и нужные разделы каталога.',
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

function normalizeWorkspaceErrorMessage(error, fallbackMessage = '') {
  const rawMessage = String(error?.message || '').trim();
  const source = rawMessage || String(error || '').trim();
  if (!rawMessage && (source === 'Error' || source === '[object Error]')) {
    return String(fallbackMessage || 'Попробуйте повторить действие чуть позже.').trim();
  }
  if (!source) {
    return String(fallbackMessage || 'Попробуйте повторить действие чуть позже.').trim();
  }
  if (source === 'Failed to fetch') {
    return 'Сеть не ответила вовремя или API сайта временно недоступен.';
  }
  if (source === 'folder_not_found') {
    return 'Раздел не найден. Возможно, каталог уже обновился и ссылка устарела.';
  }
  if (source === 'file_not_found') {
    return 'Файл не найден. Возможно, материал был перемещён или ссылка устарела.';
  }
  if (source === 'constructor_not_found') {
    return 'Конструктор не найден. Возможно, шаблон был отключён или переименован.';
  }
  if (source === 'internal_error') {
    return 'Сайт вернул внутреннюю ошибку. Повторите действие чуть позже.';
  }
  return source;
}

function buildConstructorWarningsMarkup(warnings) {
  const items = Array.isArray(warnings) ? warnings.filter((item) => item && item.title && item.message) : [];
  return items.map((item) => `
    <article class="constructor-warning-card tone-${escapeHtml(item.tone || 'info')}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.message)}</span>
    </article>
  `).join('');
}

function constructorPreviewUsesStackedLayout(viewportWidth) {
  const width = Number.isFinite(Number(viewportWidth))
    ? Number(viewportWidth)
    : CONSTRUCTOR_PREVIEW_STACKED_BREAKPOINT;
  return width <= CONSTRUCTOR_PREVIEW_STACKED_BREAKPOINT;
}

function shouldConstructorPreviewStackedDock(metrics = {}) {
  const shellTop = Number(metrics.shellTop);
  const shellBottom = Number(metrics.shellBottom);
  const panelTop = Number(metrics.panelTop);
  const viewportHeight = Number(metrics.viewportHeight);
  const topOffset = Number.isFinite(Number(metrics.topOffset))
    ? Number(metrics.topOffset)
    : CONSTRUCTOR_PREVIEW_TOP_OFFSET;
  if (!Number.isFinite(shellTop) || !Number.isFinite(shellBottom) || !Number.isFinite(panelTop) || !Number.isFinite(viewportHeight)) {
    return false;
  }
  const shellVisible = shellBottom > 120 && shellTop < viewportHeight - 120;
  const reachedFollowZone = panelTop <= topOffset + 6;
  return shellVisible && reachedFollowZone;
}

function shouldRestoreConstructorPageScroll(viewState, currentPageScrollTop, tolerance = 24) {
  if (!viewState || typeof viewState !== 'object') {
    return false;
  }
  const targetScrollTop = Number(viewState.pageScrollTop);
  const currentScrollTop = Number(currentPageScrollTop);
  const maxDelta = Math.max(0, Number(tolerance) || 0);
  if (!Number.isFinite(targetScrollTop) || !Number.isFinite(currentScrollTop)) {
    return false;
  }
  return Math.abs(targetScrollTop - currentScrollTop) <= maxDelta;
}

function clearPressedInteractive() {
  if (pressedInteractiveClearTimer) {
    window.clearTimeout(pressedInteractiveClearTimer);
    pressedInteractiveClearTimer = 0;
  }
  if (!pressedInteractiveNode) {
    return;
  }
  pressedInteractiveNode.classList.remove('is-pressed');
  pressedInteractiveNode = null;
}

function schedulePressedInteractiveClear(delay = 160) {
  if (!pressedInteractiveNode) {
    return;
  }
  if (pressedInteractiveClearTimer) {
    window.clearTimeout(pressedInteractiveClearTimer);
    pressedInteractiveClearTimer = 0;
  }
  const targetNode = pressedInteractiveNode;
  pressedInteractiveClearTimer = window.setTimeout(() => {
    targetNode.classList.remove('is-pressed');
    if (pressedInteractiveNode === targetNode) {
      pressedInteractiveNode = null;
    }
    pressedInteractiveClearTimer = 0;
  }, Math.max(0, Number(delay) || 0));
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
    buildConstructorChoicePreview,
    buildConstructorCompletion,
    normalizeConstructorDraftInput,
    buildConstructorDraftEntry,
    loadConstructorDraft,
    saveConstructorDraft,
    removeConstructorDraft,
    buildConstructorDraftState,
    buildConstructorWarnings,
    constructorPaletteToneDefinition,
    buildConstructorLiveTheme,
    resolveConstructorLiveBrandVariant,
    buildConstructorLiveLockupSurface,
    normalizeWorkspaceErrorMessage,
    normalizeConstructorHandoff,
    readConstructorPreviewBoxMetrics,
    buildConstructorPreviewLayout,
    constructorPreviewUsesStackedLayout,
    shouldConstructorPreviewStackedDock,
    shouldRestoreConstructorPageScroll,
    constructorArtifactSupportsPngExport,
    constructorArtifactPngFilename,
    buildConstructorPngDownloadEntry,
    resolveConstructorSvgDownloadMarkup,
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
  const constructorBuildCache = new Map();
  let constructorBuildAbortController = null;
  let constructorBuildRequestId = 0;
  let constructorOpenRequestId = 0;
  let constructorDraftSaveTimer = 0;

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
    workspaceStage: document.querySelector('.workspace-stage'),
    workspaceToggle: document.querySelector('#workspace-toggle'),
    workspaceCopy: document.querySelector('#workspace-copy'),
    workspaceInspector: document.querySelector('#workspace-inspector'),
    inspectorBackdrop: document.querySelector('#inspector-backdrop'),
    catalogModeButtons: Array.from(document.querySelectorAll('.catalog-mode-toggle')),
  };

  function syncConstructorChoiceSelectionState(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') {
      return;
    }
    root.querySelectorAll('.constructor-choice-card').forEach((card) => {
      const input = card.querySelector('.constructor-choice-input');
      const active = Boolean(input?.checked);
      card.classList.toggle('active', active);
      card.toggleAttribute('data-selected', active);
    });
  }

  function syncConstructorPresetSelectionState(activePresetId = '', root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') {
      return;
    }
    const normalizedId = String(activePresetId || '').trim();
    root.querySelectorAll('.constructor-preset-card').forEach((card) => {
      const active = normalizedId && String(card.getAttribute('data-preset-id') || '').trim() === normalizedId;
      card.classList.toggle('active', active);
      if (active) {
        card.setAttribute('aria-pressed', 'true');
      } else {
        card.removeAttribute('aria-pressed');
      }
    });
  }

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

  function constructorBuildCacheKey(id, input) {
    return `${String(id || '').trim()}::${JSON.stringify(input || {})}`;
  }

  function currentConstructorId() {
    return String(state.current?.payload?.definition?.id || '').trim();
  }

  function currentPageScrollTop() {
    const scrollingElement = document.scrollingElement;
    const pageScrollTop = scrollingElement ? scrollingElement.scrollTop : window.scrollY;
    return Number.isFinite(pageScrollTop) ? pageScrollTop : 0;
  }

  function findConstructorSolution(constructorId = '') {
    const normalizedId = String(constructorId || '').trim();
    if (!normalizedId) {
      return null;
    }
    return normalizeConstructorSolutions(state.bootstrap?.constructors || {})
      .find((item) => item.id === normalizedId) || null;
  }

  function cancelPendingConstructorBuild() {
    constructorBuildRequestId += 1;
    if (constructorBuildAbortController) {
      constructorBuildAbortController.abort();
      constructorBuildAbortController = null;
    }
    setConstructorSyncState(false);
  }

  function resolveConstructorPreservedViewState(viewState, constructorId) {
    const normalizedConstructorId = String(constructorId || '').trim();
    if (!viewState || String(viewState.constructorId || '').trim() !== normalizedConstructorId) {
      return null;
    }
    return {
      ...viewState,
      pageScrollTop: shouldRestoreConstructorPageScroll(viewState, currentPageScrollTop())
        ? viewState.pageScrollTop
        : null,
    };
  }

  function pruneConstructorBuildCache(maxEntries = 36) {
    if (constructorBuildCache.size <= maxEntries) {
      return;
    }
    const overflow = constructorBuildCache.size - maxEntries;
    const keys = constructorBuildCache.keys();
    for (let index = 0; index < overflow; index += 1) {
      const next = keys.next();
      if (next.done) {
        break;
      }
      constructorBuildCache.delete(next.value);
    }
  }

  function setConstructorSyncState(active) {
    const shell = document.querySelector('.constructor-shell');
    if (!shell) {
      return;
    }
    shell.classList.toggle('is-syncing', Boolean(active));
  }

  function decorateConstructorPayload(payload, draftMeta) {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }
    const { draftMeta: existingDraftMeta, ...rest } = payload;
    if (!draftMeta) {
      return rest;
    }
    return {
      ...rest,
      draftMeta: {
        ...(existingDraftMeta && typeof existingDraftMeta === 'object' ? existingDraftMeta : {}),
        ...draftMeta,
      },
    };
  }

  function currentConstructorFields(constructorId = '') {
    const currentId = currentConstructorId();
    if (constructorId && currentId && constructorId !== currentId) {
      return [];
    }
    return Array.isArray(state.current?.payload?.definition?.fields) ? state.current.payload.definition.fields : [];
  }

  function currentConstructorPreviewArtifact() {
    return pickConstructorPreviewArtifact(state.current?.payload?.artifacts || []);
  }

  function setCurrentConstructorDraftMeta(draftMeta) {
    if (state.current?.kind !== 'constructor' || !state.current?.payload) {
      return;
    }
    state.current = {
      ...state.current,
      payload: decorateConstructorPayload(state.current.payload, draftMeta),
    };
  }

  function persistConstructorDraft(constructorId, fields, input, options = {}) {
    const draftEntry = saveConstructorDraft(constructorId, fields, input, window.localStorage);
    const draftMeta = draftEntry
      ? { updatedAt: draftEntry.updatedAt, restored: Boolean(options.restored) }
      : null;
    setCurrentConstructorDraftMeta(draftMeta);
    return draftMeta;
  }

  function updateConstructorProgressStrip(fields, input, previewArtifact, options = {}) {
    const strip = document.querySelector('.constructor-progress-strip');
    if (!strip) {
      return;
    }
    const completion = buildConstructorCompletion(fields, input);
    const warnings = buildConstructorWarnings(fields, input, {
      previewArtifact,
    });
    const draftState = buildConstructorDraftState(options?.draftMeta ?? state.current?.payload?.draftMeta);
    const artifactLabel = String(previewArtifact?.label || 'Черновое превью').trim() || 'Черновое превью';
    const statusTitle = completion.ready ? 'Шаблон готов к сборке' : 'Заполнение шаблона';
    const statusNote = completion.ready
      ? 'Все обязательные поля на месте. Можно собирать файлы и проверять превью.'
      : completion.requiredTotal > 0
        ? `Обязательные поля: ${completion.requiredFilled} из ${completion.requiredTotal}.`
        : 'Шаблон можно заполнять постепенно, превью обновляется рядом.';
    const titleNode = strip.querySelector('[data-constructor-progress-title]');
    const noteNode = strip.querySelector('[data-constructor-progress-note]');
    const meterNode = strip.querySelector('[data-constructor-progress-meter]');
    const filledNode = strip.querySelector('[data-constructor-progress-filled]');
    const artifactNode = strip.querySelector('[data-constructor-progress-artifact]');
    const requiredNode = strip.querySelector('[data-constructor-progress-required]');
    const statusCard = strip.querySelector('[data-constructor-progress-status-card]');
    const draftTitleNode = strip.querySelector('[data-constructor-draft-title]');
    const draftNoteNode = strip.querySelector('[data-constructor-draft-note]');
    const warningListNode = strip.querySelector('[data-constructor-warning-list]');

    if (titleNode) titleNode.textContent = statusTitle;
    if (noteNode) noteNode.textContent = statusNote;
    if (meterNode) meterNode.style.width = `${Math.max(0, Math.min(100, completion.percent))}%`;
    if (filledNode) filledNode.textContent = `${completion.filled}/${completion.total || 0}`;
    if (artifactNode) artifactNode.textContent = artifactLabel;
    if (requiredNode) requiredNode.textContent = completion.ready ? 'Готово' : `${completion.requiredFilled}/${completion.requiredTotal || 0}`;
    if (statusCard) {
      statusCard.classList.toggle('is-ready', completion.ready);
    }
    if (draftTitleNode) draftTitleNode.textContent = draftState.title;
    if (draftNoteNode) draftNoteNode.textContent = draftState.note;
    if (warningListNode) {
      warningListNode.innerHTML = buildConstructorWarningsMarkup(warnings);
      warningListNode.hidden = warnings.length === 0;
    }
    strip.querySelector('.constructor-progress-bar')?.setAttribute('aria-valuenow', String(completion.percent));
    scheduleConstructorPreviewFloatSync();
  }

  function refreshConstructorProgressFromForm(form, options = {}) {
    if (!form || state.current?.kind !== 'constructor') {
      return;
    }
    const fields = currentConstructorFields(String(form.dataset.constructorId || '').trim());
    const nextInput = options?.input && typeof options.input === 'object'
      ? options.input
      : collectConstructorFormInput(form);
    updateConstructorProgressStrip(fields, nextInput, currentConstructorPreviewArtifact(), {
      draftMeta: options?.draftMeta,
    });
  }

  function scheduleConstructorDraftSave(form, options = {}) {
    if (!form) {
      return;
    }

    const constructorId = String(form.dataset.constructorId || '').trim();
    const fields = currentConstructorFields(constructorId);
    if (!constructorId || !fields.length) {
      return;
    }

    const nextInput = options?.input && typeof options.input === 'object'
      ? options.input
      : collectConstructorFormInput(form);

    window.clearTimeout(constructorDraftSaveTimer);
    constructorDraftSaveTimer = window.setTimeout(() => {
      if (!document.body.contains(form)) {
        return;
      }
      const draftMeta = persistConstructorDraft(constructorId, fields, nextInput);
      refreshConstructorProgressFromForm(form, { input: nextInput, draftMeta });
    }, CONSTRUCTOR_DRAFT_SAVE_DELAY);
  }

  function captureConstructorViewState() {
    const shell = document.querySelector('.constructor-shell');
    if (!shell) {
      return null;
    }

    const constructorId = currentConstructorId();
    const previewPanel = shell.querySelector('.constructor-preview-panel-frame') || shell.querySelector('.constructor-preview-panel');
    const previewStage = shell.querySelector('.constructor-preview-stage');
    const accordionIds = Array.from(shell.querySelectorAll('.constructor-field-accordion[open]'))
      .map((node) => String(node.getAttribute('data-constructor-group-id') || '').trim())
      .filter(Boolean);

    return {
      constructorId,
      pageScrollTop: currentPageScrollTop(),
      previewPanelScrollTop: previewPanel ? previewPanel.scrollTop : 0,
      previewStageScrollTop: previewStage ? previewStage.scrollTop : 0,
      openAccordionIds: accordionIds,
      styleMoreOpen: Boolean(shell.querySelector('.constructor-style-more[open]')),
    };
  }

  function restoreConstructorViewState(viewState) {
    if (!viewState) {
      return;
    }

    window.requestAnimationFrame(() => {
      const shell = document.querySelector('.constructor-shell');
      if (!shell) {
        return;
      }

      const openIds = new Set(Array.isArray(viewState.openAccordionIds) ? viewState.openAccordionIds : []);
      shell.querySelectorAll('.constructor-field-accordion').forEach((node) => {
        const groupId = String(node.getAttribute('data-constructor-group-id') || '').trim();
        if (groupId) {
          node.open = openIds.has(groupId);
        }
      });

      const styleMore = shell.querySelector('.constructor-style-more');
      if (styleMore instanceof HTMLDetailsElement) {
        styleMore.open = Boolean(viewState.styleMoreOpen);
      }

      const previewPanel = shell.querySelector('.constructor-preview-panel-frame') || shell.querySelector('.constructor-preview-panel');
      if (previewPanel) {
        previewPanel.scrollTop = Number(viewState.previewPanelScrollTop || 0);
      }
      const previewStage = shell.querySelector('.constructor-preview-stage');
      if (previewStage) {
        previewStage.scrollTop = Number(viewState.previewStageScrollTop || 0);
      }

      const pageScrollTop = Number(viewState.pageScrollTop);
      if (Number.isFinite(pageScrollTop)) {
        const scrollingElement = document.scrollingElement;
        if (scrollingElement) {
          scrollingElement.scrollTop = pageScrollTop;
        } else {
          window.scrollTo(0, pageScrollTop);
        }
      }

      scheduleConstructorPreviewFloatSync();
    });
  }

  function clearConstructorPreviewFloatState(panel = null) {
    const resolvedPanel = panel || document.querySelector('.constructor-preview-panel');
    if (!resolvedPanel) {
      return;
    }
    resolvedPanel.classList.remove('is-floating', 'is-bottom-anchored', 'is-floating-dock');
    resolvedPanel.style.removeProperty('--constructor-preview-panel-height');
    resolvedPanel.style.removeProperty('--constructor-preview-frame-left');
    resolvedPanel.style.removeProperty('--constructor-preview-frame-width');
  }

  function constructorPreviewPrefersNativeSticky() {
    if (typeof window === 'undefined') {
      return false;
    }
    if (constructorPreviewUsesStackedLayout(window.innerWidth)) {
      return false;
    }
    const supports = window.CSS && typeof window.CSS.supports === 'function'
      ? window.CSS.supports('position', 'sticky') || window.CSS.supports('position', '-webkit-sticky')
      : false;
    return Boolean(supports);
  }

  function syncConstructorPreviewFloatState() {
    constructorPreviewFloatFrame = 0;
    const shell = document.querySelector('.constructor-shell');
    const layout = shell?.querySelector('.constructor-layout');
    const panel = shell?.querySelector('.constructor-preview-panel');
    const frame = shell?.querySelector('.constructor-preview-panel-frame');
    if (state.current?.kind !== 'constructor' || !shell || !layout || !panel || !frame) {
      clearConstructorPreviewFloatState(panel || null);
      return;
    }

    if (window.innerWidth < CONSTRUCTOR_PREVIEW_FLOAT_BREAKPOINT) {
      clearConstructorPreviewFloatState(panel);
      return;
    }

    const stackedLayout = constructorPreviewUsesStackedLayout(window.innerWidth);
    if (constructorPreviewPrefersNativeSticky()) {
      clearConstructorPreviewFloatState(panel);
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const layoutRect = layout.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const panelVisible = panelRect.bottom > CONSTRUCTOR_PREVIEW_TOP_OFFSET
      && panelRect.top < window.innerHeight - CONSTRUCTOR_PREVIEW_TOP_OFFSET;
    if (stackedLayout) {
      const shouldDock = shouldConstructorPreviewStackedDock({
        shellTop: shellRect.top,
        shellBottom: shellRect.bottom,
        panelTop: panelRect.top,
        viewportHeight: window.innerHeight,
        topOffset: CONSTRUCTOR_PREVIEW_TOP_OFFSET,
      });
      panel.classList.remove('is-floating', 'is-bottom-anchored');
      panel.classList.toggle('is-floating-dock', shouldDock);
      if (!shouldDock) {
        panel.style.removeProperty('--constructor-preview-panel-height');
        panel.style.removeProperty('--constructor-preview-frame-left');
        panel.style.removeProperty('--constructor-preview-frame-width');
      }
      return;
    }

    const panelStyles = window.getComputedStyle(panel);
    const panelPaddingLeft = Number.parseFloat(panelStyles.paddingLeft || '0') || 0;
    const panelPaddingRight = Number.parseFloat(panelStyles.paddingRight || '0') || 0;
    const panelBorderLeft = Number.parseFloat(panelStyles.borderLeftWidth || '0') || 0;
    const frameWidth = Math.max(0, panel.clientWidth - panelPaddingLeft - panelPaddingRight);
    const frameLeft = panelRect.left + panelBorderLeft + panelPaddingLeft;
    const panelHeight = Math.ceil(frame.scrollHeight);
    if (!Number.isFinite(frameWidth) || frameWidth <= 0 || panelHeight <= 0) {
      clearConstructorPreviewFloatState(panel);
      return;
    }

    const floatingHeight = Math.min(
      panelHeight,
      Math.max(220, window.innerHeight - CONSTRUCTOR_PREVIEW_VIEWPORT_GAP),
    );

    panel.style.setProperty('--constructor-preview-panel-height', `${panelHeight}px`);
    panel.style.setProperty('--constructor-preview-frame-left', `${Math.round(frameLeft)}px`);
    panel.style.setProperty('--constructor-preview-frame-width', `${Math.round(frameWidth)}px`);

    const reachedTop = layoutRect.top <= CONSTRUCTOR_PREVIEW_TOP_OFFSET;
    const reachedBottom = layoutRect.bottom <= CONSTRUCTOR_PREVIEW_TOP_OFFSET + floatingHeight;
    const shouldAnchorBottom = reachedTop && reachedBottom;
    const shouldFloat = reachedTop && !reachedBottom;
    const shouldDock = window.innerWidth >= 761
      && shellRect.bottom > 120
      && shellRect.top < window.innerHeight - 120
      && !panelVisible;

    panel.classList.toggle('is-floating', shouldFloat || shouldAnchorBottom);
    panel.classList.toggle('is-bottom-anchored', shouldAnchorBottom);
    panel.classList.toggle('is-floating-dock', shouldDock);

    if (!shouldFloat && !shouldAnchorBottom && !shouldDock) {
      clearConstructorPreviewFloatState(panel);
    }
  }

  function scheduleConstructorPreviewFloatSync() {
    if (constructorPreviewFloatFrame) {
      return;
    }
    constructorPreviewFloatFrame = window.requestAnimationFrame(() => {
      syncConstructorPreviewFloatState();
    });
  }

  function applyConstructorLivePreview(input) {
    if (state.current?.kind !== 'constructor') {
      return false;
    }
    const previewSvg = document.querySelector('.constructor-preview-visual svg');
    const previewRoot = previewSvg?.querySelector('[data-constructor-preview-root="1"]') || previewSvg;
    if (!previewSvg || !previewRoot) {
      return false;
    }

    const nextInput = {
      ...(state.current?.payload?.input || {}),
      ...(input || {}),
    };
    const theme = buildConstructorLiveTheme(nextInput);
    const brandVariant = resolveConstructorLiveBrandVariant(nextInput, theme);
    const lockupSurface = buildConstructorLiveLockupSurface(theme, brandVariant);
    const rootVars = {
      '--ctor-bg': theme.background,
      '--ctor-accent': theme.accent,
      '--ctor-accent-soft': theme.accentSoft,
      '--ctor-tone': theme.tone,
      '--ctor-tone-soft': theme.toneSoft,
      '--ctor-tone-ink': theme.toneInk,
      '--ctor-ink': theme.ink,
      '--ctor-muted': theme.muted,
      '--ctor-surface-alt': theme.surfaceAlt,
      '--ctor-surface': theme.surface,
      '--ctor-card-stroke': theme.cardStroke,
      '--ctor-line': theme.line,
      '--ctor-badge': theme.badge,
      '--ctor-frame': theme.frame,
      '--ctor-watermark-opacity': theme.watermarkOpacity,
      '--ctor-lockup-fill': lockupSurface.fill,
      '--ctor-lockup-ink': lockupSurface.ink,
    };

    Object.entries(rootVars).forEach(([name, value]) => {
      previewRoot.style.setProperty(name, String(value || ''));
    });

    const backgroundStyle = String(nextInput.background_style || 'clean').trim() || 'clean';
    previewRoot.querySelectorAll('[data-constructor-bg-style]').forEach((node) => {
      node.style.display = String(node.getAttribute('data-constructor-bg-style') || '') === backgroundStyle ? 'inline' : 'none';
    });
    const designVariant = String(nextInput.design_variant || 'calm').trim() || 'calm';
    previewRoot.querySelectorAll('[data-constructor-design-style]').forEach((node) => {
      node.style.display = String(node.getAttribute('data-constructor-design-style') || '') === designVariant ? 'inline' : 'none';
    });
    const graphicElement = String(nextInput.graphic_element || 'mark_yamal').trim() || 'mark_yamal';
    previewRoot.querySelectorAll('[data-constructor-graphic-element]').forEach((node) => {
      node.style.display = String(node.getAttribute('data-constructor-graphic-element') || '') === graphicElement ? 'inline' : 'none';
    });

    previewRoot.querySelectorAll('[data-constructor-variant-image]').forEach((node) => {
      const forcedVariant = String(node.getAttribute('data-constructor-force-variant') || '').trim();
      const resolvedVariant = forcedVariant || brandVariant;
      const nextHref = node.getAttribute(`data-href-${resolvedVariant}`) || node.getAttribute(`data-href-${brandVariant}`) || '';
      if (nextHref) {
        node.setAttribute('href', nextHref);
      }
    });

    const fields = Array.isArray(state.current?.payload?.definition?.fields) ? state.current.payload.definition.fields : [];
    const previewArtifact = pickConstructorPreviewArtifact(state.current?.payload?.artifacts || []);
    updateConstructorProgressStrip(fields, nextInput, previewArtifact);
    return true;
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
    if (options.signal) {
      fetchOptions.signal = options.signal;
    }
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
    setWorkspaceStageMode('');
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

  function setWorkspaceStageMode(mode = '') {
    if (!els.workspaceStage) {
      return;
    }
    const isConstructorMode = String(mode || '').trim() === 'constructor';
    els.workspaceStage.classList.toggle('is-constructor-mode', isConstructorMode);
  }

  function buildWorkspaceRetryActionMarkup(retry = null) {
    if (!retry || !retry.action) {
      return '';
    }
    const action = String(retry.action || '').trim();
    const label = String(retry.label || 'Повторить').trim() || 'Повторить';
    const attrs = [
      `data-action="${escapeHtml(action)}"`,
      retry.id ? `data-id="${escapeHtml(retry.id)}"` : '',
      retry.page !== undefined && retry.page !== null ? `data-page="${escapeHtml(retry.page)}"` : '',
      retry.query ? `data-query="${escapeHtml(retry.query)}"` : '',
    ].filter(Boolean).join(' ');
    return `<button type="button" class="item-action" ${attrs}>${escapeHtml(label)}</button>`;
  }

  function renderWorkspaceErrorState(title, message, options = {}) {
    const safeTitle = String(title || '').trim() || 'Не удалось открыть раздел';
    const safeMessage = normalizeWorkspaceErrorMessage(message, 'Попробуйте повторить действие ещё раз.');
    const mode = String(options.mode || 'Раздел').trim() || 'Раздел';
    const hint = String(options.hint || 'Рабочая область открыта, но сайт не получил нужные данные.').trim()
      || 'Рабочая область открыта, но сайт не получил нужные данные.';
    setWorkspaceStageMode(options.workspaceMode || '');
    els.contentMode.textContent = mode;
    els.contentTitle.textContent = safeTitle;
    els.contentHint.textContent = hint;
    els.contentItems.innerHTML = `
      <div class="empty-state workspace-error-state">
        <div class="empty-mark" aria-hidden="true">!</div>
        <div class="constructor-error-copy">
          <h3>${escapeHtml(safeTitle)}</h3>
          <p class="detail-empty">${escapeHtml(safeMessage)}</p>
          <div class="item-actions">
            ${buildWorkspaceRetryActionMarkup(options.retry)}
            <button type="button" class="ghost-button" data-action="go-root">Вернуться на витрину</button>
          </div>
        </div>
      </div>
    `;
    els.pagination.innerHTML = '';
  }

  function renderConstructorErrorState(title, message, constructorId = '') {
    renderWorkspaceErrorState(title, message, {
      mode: 'Конструктор',
      workspaceMode: 'constructor',
      hint: 'Рабочая область открыта, но конструктор не получил данные.',
      retry: constructorId
        ? { action: 'open-constructor', id: constructorId, label: 'Повторить' }
        : null,
    });
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

  function renderConstructorField(field, value, options = {}) {
    const fieldId = String(field?.id || '').trim();
    if (!fieldId) {
      return '';
    }
    const fieldType = String(field?.type || 'text').trim() || 'text';
    const label = String(field?.label || fieldId).trim();
    const placeholder = String(field?.placeholder || '').trim();
    const required = Boolean(field?.required);
    const currentValue = value ?? field?.default ?? '';
    const compactChoice = Boolean(options?.compactChoice);
    if (fieldType === 'select' && isConstructorChoiceField(fieldId)) {
      const options = Array.isArray(field?.options) ? field.options : [];
      return `
        <fieldset class="constructor-field constructor-choice-field${compactChoice ? ' is-compact' : ''}">
          <legend class="constructor-field-label">${escapeHtml(label)}${required ? ' *' : ''}</legend>
          <div class="constructor-choice-grid${fieldId === 'palette_tone' ? ' is-palette' : ''}${fieldId === 'design_variant' ? ' is-design' : ''}${fieldId === 'graphic_element' ? ' is-graphic' : ''}${compactChoice ? ' is-compact' : ''}">
            ${options.map((option, index) => {
              const optionValue = String(option?.value || '').trim();
              const optionLabel = String(option?.label || optionValue || '').trim();
              const optionDescription = compactChoice
                ? ''
                : fieldId === 'palette_tone'
                ? ''
                : String(option?.description || option?.note || '').trim();
              const optionId = `constructor-field-${fieldId}-${index}`;
              const checked = optionValue === String(currentValue);
              return `
                <label class="constructor-choice-card${checked ? ' active' : ''}${compactChoice ? ' is-compact' : ''}" for="${escapeHtml(optionId)}">
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

  function isConstructorFieldDefaultValue(field, input) {
    const fieldId = String(field?.id || '').trim();
    if (!fieldId) {
      return true;
    }
    const currentValue = input?.[fieldId] ?? field?.default ?? '';
    return String(currentValue ?? '') === String(field?.default ?? '');
  }

  function findConstructorFieldOptionLabel(field, value) {
    const options = Array.isArray(field?.options) ? field.options : [];
    const normalizedValue = String(value ?? '').trim();
    const match = options.find((option) => String(option?.value ?? '').trim() === normalizedValue);
    return String(match?.label || normalizedValue).trim();
  }

  function countFilledConstructorGroupFields(group, input, includeChoiceFields = false) {
    const items = Array.isArray(group?.items) ? group.items : [];
    return items.reduce((count, field) => {
      const fieldId = String(field?.id || '').trim();
      if (!fieldId) {
        return count;
      }
      if (!includeChoiceFields && isConstructorChoiceField(fieldId)) {
        return count;
      }
      const currentValue = input?.[fieldId] ?? field?.default ?? '';
      return hasConstructorFieldValue(currentValue) ? count + 1 : count;
    }, 0);
  }

  function buildConstructorGroupMeta(group, input) {
    const items = Array.isArray(group?.items) ? group.items : [];
    if (!items.length) {
      return '';
    }

    if (group?.id === 'style') {
      const designField = items.find((field) => String(field?.id || '').trim() === 'design_variant');
      const paletteField = items.find((field) => String(field?.id || '').trim() === 'palette_tone');
      const backgroundField = items.find((field) => String(field?.id || '').trim() === 'background_style');
      const parts = [
        designField ? findConstructorFieldOptionLabel(designField, input?.design_variant ?? designField?.default ?? '') : '',
        paletteField ? findConstructorFieldOptionLabel(paletteField, input?.palette_tone ?? paletteField?.default ?? '') : '',
        backgroundField ? findConstructorFieldOptionLabel(backgroundField, input?.background_style ?? backgroundField?.default ?? '') : '',
      ].filter(Boolean);
      return parts.slice(0, 2).join(' • ') || `${items.length} настроек`;
    }

    const filled = countFilledConstructorGroupFields(group, input);
    const trackable = items.filter((field) => {
      const fieldId = String(field?.id || '').trim();
      return fieldId && !isConstructorChoiceField(fieldId);
    }).length;
    if (trackable <= 0) {
      return `${items.length} полей`;
    }
    return group?.id === 'fill'
      ? `${filled}/${trackable} заполнено`
      : `${filled}/${trackable} задано`;
  }

  function shouldOpenConstructorFieldGroup(group, input) {
    if (group?.id === 'fill') {
      return true;
    }
    if (group?.id === 'style') {
      return true;
    }
    const items = Array.isArray(group?.items) ? group.items : [];
    return items.some((field) => !isConstructorFieldDefaultValue(field, input));
  }

  function buildConstructorStyleGroupMarkup(group, input) {
    const items = Array.isArray(group?.items) ? group.items : [];
    if (!items.length) {
      return '';
    }
    const primaryFields = items.filter((field) => CONSTRUCTOR_PRIMARY_STYLE_FIELD_IDS.has(String(field?.id || '').trim()));
    const advancedFields = items.filter((field) => !CONSTRUCTOR_PRIMARY_STYLE_FIELD_IDS.has(String(field?.id || '').trim()));
    const resolvedPrimary = primaryFields.length ? primaryFields : items;
    const resolvedAdvanced = primaryFields.length ? advancedFields : [];
    const advancedOpen = resolvedAdvanced.some((field) => !isConstructorFieldDefaultValue(field, input));
    const sectionOpen = shouldOpenConstructorFieldGroup(group, input);
    const meta = buildConstructorGroupMeta(group, input);

    return `
      <section class="constructor-field-group constructor-field-group-style">
        <details class="constructor-field-accordion"${sectionOpen ? ' open' : ''} data-constructor-group-id="${escapeHtml(group.id || 'style')}">
          <summary class="constructor-group-summary">
            <span class="constructor-group-summary-copy">
              <strong>${escapeHtml(group.label)}</strong>
              <span>${escapeHtml(group.hint)}</span>
            </span>
            ${meta ? `<span class="constructor-group-summary-meta">${escapeHtml(meta)}</span>` : ''}
          </summary>
          <div class="constructor-field-accordion-body">
            <div class="constructor-style-primary">
              ${resolvedPrimary.map((field) => renderConstructorField(field, input[field.id], { compactChoice: true })).join('')}
            </div>
            ${resolvedAdvanced.length ? `
              <details class="constructor-style-more"${advancedOpen ? ' open' : ''}>
                <summary>Цвет и версия</summary>
                <div class="constructor-style-more-body">
                  ${resolvedAdvanced.map((field) => renderConstructorField(field, input[field.id], { compactChoice: true })).join('')}
                </div>
              </details>
            ` : ''}
          </div>
        </details>
      </section>
    `;
  }

  function buildConstructorFieldGroupMarkup(group, input) {
    const sectionOpen = shouldOpenConstructorFieldGroup(group, input);
    const meta = buildConstructorGroupMeta(group, input);
    if (group?.id === 'style') {
      return buildConstructorStyleGroupMarkup(group, input);
    }
    return `
      <section class="constructor-field-group">
        <details class="constructor-field-accordion"${sectionOpen ? ' open' : ''} data-constructor-group-id="${escapeHtml(group.id || '')}">
          <summary class="constructor-group-summary">
            <span class="constructor-group-summary-copy">
              <strong>${escapeHtml(group.label)}</strong>
              <span>${escapeHtml(group.hint)}</span>
            </span>
            ${meta ? `<span class="constructor-group-summary-meta">${escapeHtml(meta)}</span>` : ''}
          </summary>
          <div class="constructor-field-accordion-body">
            <div class="constructor-field-grid">
              ${group.items.map((field) => renderConstructorField(field, input[field.id])).join('')}
            </div>
          </div>
        </details>
      </section>
    `;
  }

  function buildConstructorFieldGroupsMarkup(fields, input) {
    return groupConstructorFields(fields).map((group) => buildConstructorFieldGroupMarkup(group, input)).join('');
  }

function buildConstructorStepsMarkup(generated) {
    const states = generated
      ? ['done', 'done', 'active']
      : ['active', 'muted', 'muted'];
    const labels = [
      { title: 'Параметры', note: 'Заполните поля шаблона.' },
      { title: 'Сборка', note: 'Получите стартовый пакет.' },
      { title: 'Файлы', note: 'Скачайте и откройте нужные материалы.' },
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
        <strong>Быстрые варианты</strong>
        <span>Меняют вид носителя одной кнопкой.</span>
      </div>
      <div class="constructor-preset-grid">
        ${items.map((preset) => `
          <button
            type="button"
            class="constructor-preset-card${preset.active ? ' active' : ''}"
            data-action="apply-constructor-preset"
            data-preset-id="${escapeHtml(preset.id)}"
          >
            <span class="constructor-preset-kicker">${preset.active ? 'Сейчас' : 'Вариант'}</span>
            ${buildConstructorPresetPreview(preset)}
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
          <span>Соберите решение, и справа появится готовый макет.</span>
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

function buildConstructorProgressMarkup(completion, previewArtifact, options = {}) {
    const warnings = Array.isArray(options?.warnings) ? options.warnings : [];
    const draftState = buildConstructorDraftState(options?.draftMeta);
    const stats = completion && typeof completion === 'object'
      ? completion
      : buildConstructorCompletion([], {});
    const artifactLabel = String(previewArtifact?.label || 'Черновое превью').trim() || 'Черновое превью';
    const statusTitle = stats.ready
      ? 'Шаблон готов к сборке'
      : 'Заполнение шаблона';
    const statusNote = stats.ready
      ? 'Все обязательные поля на месте. Можно собирать файлы и проверять превью.'
      : stats.requiredTotal > 0
        ? `Обязательные поля: ${stats.requiredFilled} из ${stats.requiredTotal}.`
        : 'Шаблон можно заполнять постепенно, превью обновляется рядом.';

    return `
      <div class="constructor-progress-strip">
        <div class="constructor-progress-copy">
          <strong data-constructor-progress-title>${escapeHtml(statusTitle)}</strong>
          <span data-constructor-progress-note>${escapeHtml(statusNote)}</span>
        </div>
        <div class="constructor-progress-bar" role="progressbar" aria-label="Заполнение шаблона" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stats.percent}">
          <span data-constructor-progress-meter style="width:${Math.max(0, Math.min(100, stats.percent))}%;"></span>
        </div>
        <div class="constructor-progress-stats">
          <div class="constructor-progress-card">
            <small>Поля шаблона</small>
            <strong data-constructor-progress-filled>${escapeHtml(`${stats.filled}/${stats.total || 0}`)}</strong>
          </div>
          <div class="constructor-progress-card${stats.ready ? ' is-ready' : ''}" data-constructor-progress-status-card>
            <small data-constructor-progress-artifact>${escapeHtml(artifactLabel)}</small>
            <strong data-constructor-progress-required>${stats.ready ? 'Готово' : escapeHtml(`${stats.requiredFilled}/${stats.requiredTotal || 0}`)}</strong>
          </div>
        </div>
        <div class="constructor-draft-status">
          <strong data-constructor-draft-title>${escapeHtml(draftState.title)}</strong>
          <span data-constructor-draft-note>${escapeHtml(draftState.note)}</span>
        </div>
        <div class="constructor-warning-list" data-constructor-warning-list${warnings.length ? '' : ' hidden'}>
          ${buildConstructorWarningsMarkup(warnings)}
        </div>
      </div>
    `;
  }

  function renderConstructorRecommendations(recommendations, generated = false) {
    if (generated) {
      return '';
    }

    const sections = Array.isArray(recommendations?.sections) ? recommendations.sections : [];
    const items = Array.isArray(recommendations?.items) ? recommendations.items : [];
    const advice = recommendations?.advice || {};
    const note = advice?.summary
      ? String(advice.summary).trim()
      : 'Откройте подходящий раздел каталога, если нужен исходник или брендбук.';
    const nextStep = String(advice?.nextStep || '').trim();

    if (!sections.length && !items.length && !note) {
      return '';
    }

    return `
      <section class="constructor-panel constructor-support-panel">
        <div class="constructor-panel-head">
          <strong>Подходящие разделы</strong>
          <span>Короткий список нужных разделов и файлов без лишних служебных блоков.</span>
        </div>
        <div class="constructor-support-card constructor-support-card-compact">
          ${sections.length ? `
            <div class="constructor-mini-grid constructor-support-section-grid">
              ${sections.map((section) => `
              <button type="button" class="constructor-mini-card" data-action="open-folder" data-id="${escapeHtml(section.id)}">
                <span class="constructor-mini-icon" aria-hidden="true">${escapeHtml(section.icon || '📁')}</span>
                <span class="constructor-mini-copy">
                  <strong>${escapeHtml(section.label || section.name || 'Раздел')}</strong>
                  <small>${escapeHtml(section.kindLabel || 'Раздел')}</small>
                </span>
              </button>
              `).join('')}
            </div>
          ` : '<p class="detail-empty">Подходящие разделы появятся после загрузки каталога.</p>'}
          <div class="constructor-support-note">
            <strong>${items.length ? `Подобрано файлов: ${items.length}` : 'Файлы появятся после полной сборки'}</strong>
            <span>${escapeHtml(note)}</span>
            ${nextStep ? `<small>${escapeHtml(nextStep)}</small>` : ''}
          </div>
        </div>
      </section>
    `;
  }

  function renderConstructorHandoff(handoff, sourceArtifacts = []) {
    const normalized = normalizeConstructorHandoff(handoff);
    if (!normalized.generated) {
      return '';
    }
    const packages = [normalized.approval, normalized.contractor].filter((item) => item.id);
    if (!packages.length) {
      return '';
    }
    const sourceArtifactMap = new Map(
      (Array.isArray(sourceArtifacts) ? sourceArtifacts : [])
        .map((artifact) => [String(artifact?.id || '').trim(), artifact]),
    );

    return `
      <section class="constructor-panel constructor-handoff-panel">
        <div class="constructor-panel-head">
          <strong>Что скачать и открыть</strong>
          <span>${escapeHtml(normalized.note || 'Сначала покажите вариант, затем отдайте исходники в работу.')}</span>
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
                  <div class="constructor-handoff-label">Скачать</div>
                  <div class="constructor-downloads constructor-handoff-downloads">
                    ${pack.artifacts.map((artifact) => {
                      const pngEntry = buildConstructorPngDownloadEntry(
                        artifact,
                        sourceArtifactMap.get(String(artifact?.id || '').trim()),
                      );
                      return `
                        <button type="button" class="constructor-download-card constructor-handoff-download-card" data-action="download-artifact" data-artifact-id="${escapeHtml(artifact.id)}">
                          <strong>${escapeHtml(artifact.label)}</strong>
                          <span>${escapeHtml(artifact.filename)}</span>
                          <small>${escapeHtml(artifact.note || formatDataSize(artifact.sizeBytes))}</small>
                        </button>
                        ${pngEntry ? `
                          <button type="button" class="constructor-download-card constructor-handoff-download-card" data-action="${escapeHtml(pngEntry.action)}" data-artifact-id="${escapeHtml(pngEntry.artifactId)}">
                            <strong>${escapeHtml(pngEntry.label)}</strong>
                            <span>${escapeHtml(pngEntry.filename)}</span>
                            <small>${escapeHtml(pngEntry.note)}</small>
                          </button>
                        ` : ''}
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
              ${pack.files.length ? `
                <div class="constructor-handoff-block">
                  <div class="constructor-handoff-label">Исходники</div>
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
                  <div class="constructor-handoff-label">Разделы</div>
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

  function renderConstructorLoadingState(constructorId = '') {
    const solution = findConstructorSolution(constructorId);
    const label = String(solution?.label || 'Лаборатория решений').trim() || 'Лаборатория решений';
    const category = String(solution?.category || 'Решение').trim() || 'Решение';
    const description = String(solution?.summary || solution?.description || 'Поднимаю поля, стартовое превью и grounded-подсказки для выбранного носителя.').trim()
      || 'Поднимаю поля, стартовое превью и grounded-подсказки для выбранного носителя.';

    state.current = {
      kind: 'constructor',
      payload: {
        definition: {
          id: String(constructorId || '').trim(),
          label,
          category,
          description,
          fields: [],
        },
        input: {},
        artifacts: [],
        generated: false,
      },
    };
    state.detail = null;
    setWorkspaceStageMode('constructor');
    renderSolutionLab(state.bootstrap);
    els.contentMode.textContent = 'Конструктор';
    els.contentTitle.textContent = label;
    els.contentHint.textContent = 'Загружаю поля, превью и рекомендации для выбранного решения.';
    renderSectionSwitcher('');
    els.breadcrumbs.innerHTML = `
      <span class="breadcrumb current">Лаборатория решений</span>
      <span class="breadcrumb-sep">•</span>
      <span class="breadcrumb current">${escapeHtml(label)}</span>
    `;
    els.pagination.innerHTML = '';
    els.contentItems.innerHTML = `
      <div class="constructor-shell constructor-loading-shell">
        <section class="constructor-hero">
          <div class="constructor-hero-copy">
            <span class="card-kicker">${escapeHtml(category)}</span>
            <h3>${escapeHtml(label)}</h3>
            <p>${escapeHtml(description)}</p>
          </div>
          ${buildConstructorStepsMarkup(false)}
        </section>
        <section class="constructor-panel constructor-loading-panel">
          <div class="empty-state loading-state constructor-loading-state">
            <div class="loading-mark" aria-hidden="true"></div>
            <div class="constructor-loading-copy">
              <h3>Поднимаю решение</h3>
              <p class="detail-empty">Старый шаблон уже убран. Сейчас появятся поля и превью нового носителя.</p>
            </div>
          </div>
        </section>
      </div>
    `;
    setDocumentTitle(label);
  }

  function renderConstructor(payload, options = {}) {
    const definition = payload?.definition || {};
    const fields = Array.isArray(definition?.fields) ? definition.fields : [];
    const input = payload?.input || {};
    const artifacts = Array.isArray(payload?.artifacts) ? payload.artifacts : [];
    const previewArtifact = pickConstructorPreviewArtifact(artifacts);
    const previewLayout = buildConstructorPreviewLayout(definition, previewArtifact);
    const generated = Boolean(payload?.generated);
    const presets = Array.isArray(payload?.presets) ? payload.presets : [];
    const completion = buildConstructorCompletion(fields, input);
    const warnings = buildConstructorWarnings(fields, input, { previewArtifact });

    state.current = { kind: 'constructor', payload };
    state.detail = null;
    setWorkspaceStageMode('constructor');
    renderSolutionLab(state.bootstrap);
    els.contentMode.textContent = 'Конструктор';
    els.contentTitle.textContent = definition.label || 'Лаборатория решений';
    els.contentHint.textContent = generated
      ? 'Материалы готовы: превью, скачивание и нужные разделы уже собраны.'
      : 'Заполните поля и настройте вид рядом с превью.';
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
              <span>Сначала заполните шаблон, затем сразу выбирайте вид носителя в блоке оформления.</span>
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
            <div class="constructor-preview-panel-frame">
              <div class="constructor-panel-head">
                <strong>Превью и файлы</strong>
                <span>${escapeHtml(previewArtifact?.label || 'Текущее превью')} • Рядом видно, насколько шаблон уже заполнен.</span>
              </div>
              ${buildConstructorProgressMarkup(completion, previewArtifact, { warnings, draftMeta: payload?.draftMeta })}
              <div class="${previewLayout.stageClass}" data-preview-profile="${escapeHtml(previewLayout.profile)}">
                ${buildConstructorPreviewMarkup(previewArtifact, previewLayout)}
              </div>
              <div class="constructor-downloads">
                ${artifacts.map((artifact) => {
                  const pngEntry = buildConstructorPngDownloadEntry(artifact);
                  return `
                    <button type="button" class="constructor-download-card" data-action="download-artifact" data-artifact-id="${escapeHtml(artifact.id)}">
                      <strong>${escapeHtml(artifact.label || 'Артефакт')}</strong>
                      <span>${escapeHtml(artifact.filename || '')}</span>
                      <small>${escapeHtml(formatDataSize(artifact.sizeBytes))} • Нажмите, чтобы скачать</small>
                    </button>
                    ${pngEntry ? `
                      <button type="button" class="constructor-download-card" data-action="${escapeHtml(pngEntry.action)}" data-artifact-id="${escapeHtml(pngEntry.artifactId)}">
                        <strong>${escapeHtml(pngEntry.label)}</strong>
                        <span>${escapeHtml(pngEntry.filename)}</span>
                        <small>${escapeHtml(pngEntry.note)}</small>
                      </button>
                    ` : ''}
                  `;
                }).join('')}
              </div>
            </div>
          </section>
        </div>

        ${renderConstructorHandoff(payload?.handoff, artifacts)}

        ${renderConstructorRecommendations(payload?.recommendations, generated)}
      </div>
    `;
    setDocumentTitle(definition.label || 'Лаборатория решений');
    syncConstructorChoiceSelectionState(els.contentItems);
    const activePreset = presets.find((preset) => preset?.active);
    syncConstructorPresetSelectionState(activePreset?.id || '', els.contentItems);
    scheduleConstructorPreviewFloatSync();

    if (options?.preserveViewState) {
      restoreConstructorViewState(options.preserveViewState);
    }
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
    syncConstructorPresetSelectionState(String(preset.id || '').trim(), els.contentItems);
    const fields = currentConstructorFields(String(currentPayload.definition.id || '').trim());
    const draftMeta = persistConstructorDraft(String(currentPayload.definition.id || '').trim(), fields, nextInput);
    applyConstructorLivePreview(nextInput);
    void buildConstructor(String(currentPayload.definition.id || '').trim(), nextInput, { silent: true, draftMeta });
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
    setWorkspaceStageMode('');
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
    setWorkspaceStageMode('');
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
    try {
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
    } catch (error) {
      console.error(error);
      setActiveRoute('');
      renderWorkspaceErrorState('Не удалось открыть раздел', error, {
        mode: 'Раздел',
        hint: 'Рабочая область открыта, но каталог не вернул содержимое выбранной ветки.',
        retry: { action: 'open-folder', id, page: page || 0, label: 'Повторить раздел' },
      });
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
    try {
      const payload = await api('search', { q: normalizedQuery });
      renderSearch(payload);
      if (els.searchInput) {
        els.searchInput.value = payload.query || normalizedQuery;
      }
      if (options.history !== 'none') {
        syncRouteWithState(options.history || 'push');
      }
    } catch (error) {
      console.error(error);
      renderWorkspaceErrorState('Не удалось выполнить поиск', error, {
        mode: 'Поиск',
        hint: 'Рабочая область открыта, но поиск не получил ответ от API.',
        retry: { action: 'search-chip', query: normalizedQuery, label: 'Повторить поиск' },
      });
    }
  }

  async function openFile(id, options = {}) {
    try {
      const payload = await api('file', { id });
      renderDetail(payload);
      if (options.history !== 'none') {
        syncRouteWithState(options.history || 'push');
      }
    } catch (error) {
      console.error(error);
      setInspectorOpen(false);
      renderWorkspaceErrorState('Не удалось открыть карточку файла', error, {
        mode: 'Файл',
        hint: 'Каталог открыт, но карточка выбранного файла не получила данные.',
        retry: { action: 'open-file', id, label: 'Повторить файл' },
      });
    }
  }

  async function openConstructor(id, options = {}) {
    const constructorId = String(id || '').trim();
    if (!constructorId) {
      await openRoot(options);
      return;
    }
    const shouldFocusWorkspace = !state.workspaceVisible || state.workspaceCollapsed;
    ensureWorkspaceVisible();
    if (shouldFocusWorkspace) {
      focusWorkspace();
    }
    const requestId = ++constructorOpenRequestId;
    cancelPendingConstructorBuild();
    setInspectorOpen(false);
    setActiveRoute('');
    renderDetailPlaceholder();
    renderConstructorLoadingState(constructorId);
    try {
      const initialPayload = await api('constructor', { id: constructorId });
      if (requestId !== constructorOpenRequestId) {
        return;
      }
      const fields = Array.isArray(initialPayload?.definition?.fields) ? initialPayload.definition.fields : [];
      const savedDraft = options.ignoreDraft ? null : loadConstructorDraft(constructorId, fields, window.localStorage);
      let draftMeta = null;
      let historySynced = false;

      const syncConstructorHistory = () => {
        if (historySynced || options.history === 'none' || requestId !== constructorOpenRequestId) {
          return;
        }
        syncRouteWithState(options.history || 'push');
        historySynced = true;
      };

      if (savedDraft?.input && Object.keys(savedDraft.input).length) {
        const restoredInput = {
          ...(initialPayload?.input || {}),
          ...savedDraft.input,
        };
        draftMeta = { updatedAt: savedDraft.updatedAt, restored: true };
        const restoredCacheKey = constructorBuildCacheKey(constructorId, restoredInput);
        if (constructorBuildCache.has(restoredCacheKey)) {
          renderConstructor(decorateConstructorPayload(constructorBuildCache.get(restoredCacheKey), draftMeta));
          syncConstructorHistory();
        } else {
          renderConstructor(decorateConstructorPayload({
            ...initialPayload,
            input: restoredInput,
          }, draftMeta));
          syncConstructorHistory();
          void buildConstructor(constructorId, restoredInput, { silent: true, draftMeta });
        }
      } else {
        renderConstructor(decorateConstructorPayload(initialPayload, draftMeta));
        syncConstructorHistory();
      }
    } catch (error) {
      if (requestId !== constructorOpenRequestId) {
        return;
      }
      console.error(error);
      renderConstructorErrorState('Не удалось открыть конструктор', String(error?.message || 'Попробуйте повторить открытие чуть позже.'), constructorId);
    }
  }

  async function buildConstructor(id, input, options = {}) {
    const constructorId = String(id || '').trim();
    if (!constructorId) {
      return;
    }
    const normalizedInput = input && typeof input === 'object' ? input : {};
    const cacheKey = constructorBuildCacheKey(constructorId, normalizedInput);
    const silent = Boolean(options?.silent);
    const draftMeta = options?.draftMeta ?? state.current?.payload?.draftMeta ?? null;
    const keepCurrentView = state.current?.kind === 'constructor' && currentConstructorId() === constructorId;
    const preservedViewState = keepCurrentView ? captureConstructorViewState() : null;
    const buildRenderOptions = () => {
      const resolvedViewState = resolveConstructorPreservedViewState(preservedViewState, constructorId);
      return resolvedViewState ? { preserveViewState: resolvedViewState } : {};
    };
    ensureWorkspaceVisible();
    if (!keepCurrentView && !silent) {
      setLoading('Собираю решение', 'Генерирую стартовый пакет и подтягиваю реальные материалы каталога.');
    }
    setConstructorSyncState(true);

    if (constructorBuildCache.has(cacheKey)) {
      renderConstructor(decorateConstructorPayload(constructorBuildCache.get(cacheKey), draftMeta), buildRenderOptions());
      if (!keepCurrentView && !silent) {
        focusWorkspace();
      }
      syncRouteWithState('replace');
      setConstructorSyncState(false);
      return;
    }

    if (constructorBuildAbortController) {
      constructorBuildAbortController.abort();
    }
    const controller = new AbortController();
    constructorBuildAbortController = controller;
    const requestId = ++constructorBuildRequestId;

    try {
      const payload = await api('construct', { id: constructorId, input: normalizedInput }, { method: 'POST', signal: controller.signal });
      if (requestId !== constructorBuildRequestId) {
        return;
      }
      constructorBuildCache.set(cacheKey, payload);
      pruneConstructorBuildCache();
      renderConstructor(decorateConstructorPayload(payload, draftMeta), buildRenderOptions());
      if (!keepCurrentView && !silent) {
        focusWorkspace();
      }
      syncRouteWithState('replace');
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error(error);
      renderConstructorErrorState('Не удалось собрать решение', String(error?.message || 'Попробуйте повторить сборку ещё раз.'), constructorId);
    } finally {
      if (requestId === constructorBuildRequestId) {
        constructorBuildAbortController = null;
        setConstructorSyncState(false);
      }
    }
  }

  function currentConstructorArtifacts() {
    return Array.isArray(state.current?.payload?.artifacts) ? state.current.payload.artifacts : [];
  }

  function downloadArtifactBlob(blob, filename) {
    if (!blob) {
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename || 'artifact';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function downloadArtifact(artifact) {
    if (!artifact || !artifact.content) {
      return;
    }
    const content = constructorArtifactSupportsPngExport(artifact)
      ? resolveCurrentConstructorSvgMarkup(artifact)
      : artifact.content;
    downloadArtifactBlob(
      new Blob([content], { type: artifact.mimeType || 'application/octet-stream' }),
      artifact.filename || 'artifact',
    );
  }

  function normalizeSvgMarkupForPngExport(markup) {
    let source = String(markup || '').trim();
    if (!source || !/<svg[\s>]/i.test(source)) {
      return '';
    }
    source = source.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
      let nextAttrs = String(attrs || '');
      if (!/\bxmlns=/.test(nextAttrs)) {
        nextAttrs += ' xmlns="http://www.w3.org/2000/svg"';
      }
      if (!/\bxmlns:xlink=/.test(nextAttrs)) {
        nextAttrs += ' xmlns:xlink="http://www.w3.org/1999/xlink"';
      }
      return `<svg${nextAttrs}>`;
    });
    return source;
  }

  function readCurrentConstructorPreviewSvgMarkup() {
    const previewSvg = document.querySelector('.constructor-preview-visual svg');
    if (!previewSvg || typeof XMLSerializer === 'undefined') {
      return '';
    }
    try {
      const serializer = new XMLSerializer();
      return normalizeSvgMarkupForPngExport(serializer.serializeToString(previewSvg));
    } catch (error) {
      console.error(error);
      return '';
    }
  }

  function resolveCurrentConstructorSvgMarkup(artifact) {
    return normalizeSvgMarkupForPngExport(
      resolveConstructorSvgDownloadMarkup(artifact, readCurrentConstructorPreviewSvgMarkup()),
    );
  }

  function constructorPngExportDimensions(markup, maxSide = 2400) {
    const metrics = readConstructorPreviewBoxMetrics(markup);
    const width = metrics.width > 0 ? metrics.width : 1200;
    const height = metrics.height > 0 ? metrics.height : 675;
    const longestSide = Math.max(width, height, 1);
    const scale = Math.max(1, Math.min(2, maxSide / longestSide));
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    };
  }

  function loadImageFromObjectUrl(objectUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('png_export_image_error'));
      image.src = objectUrl;
    });
  }

  function canvasToBlob(canvas, type = 'image/png') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('png_export_blob_error'));
      }, type);
    });
  }

  async function rasterizeSvgArtifactToPngBlob(artifact) {
    if (!constructorArtifactSupportsPngExport(artifact)) {
      throw new Error('png_export_not_supported');
    }
    const svgMarkup = resolveCurrentConstructorSvgMarkup(artifact);
    if (!svgMarkup) {
      throw new Error('png_export_empty_svg');
    }
    const { width, height } = constructorPngExportDimensions(svgMarkup);
    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    try {
      const image = await loadImageFromObjectUrl(svgUrl);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('png_export_canvas_unavailable');
      }
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      return await canvasToBlob(canvas, 'image/png');
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  async function downloadArtifactAsPng(artifact, trigger = null) {
    if (!constructorArtifactSupportsPngExport(artifact)) {
      return;
    }
    const button = trigger && typeof trigger.setAttribute === 'function'
      ? trigger
      : null;
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    }
    try {
      const pngBlob = await rasterizeSvgArtifactToPngBlob(artifact);
      downloadArtifactBlob(pngBlob, constructorArtifactPngFilename(artifact));
    } catch (error) {
      console.error(error);
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('Не удалось выгрузить PNG из текущего SVG. Попробуйте повторить ещё раз или скачайте SVG.');
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    }
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
    schedulePressedInteractiveClear();
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
    if (action === 'download-artifact-png') {
      const artifact = currentConstructorArtifacts().find((item) => String(item?.id || '') === String(target.dataset.artifactId || ''));
      if (artifact) {
        void downloadArtifactAsPng(artifact, target);
      }
      return;
    }
    if (action === 'reset-constructor') {
      window.clearTimeout(constructorDraftSaveTimer);
      removeConstructorDraft(String(target.dataset.id || '').trim(), window.localStorage);
      void openConstructor(target.dataset.id, { history: 'replace', ignoreDraft: true });
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
    const fields = currentConstructorFields(constructorId);
    const nextInput = collectConstructorFormInput(form);
    const draftMeta = persistConstructorDraft(constructorId, fields, nextInput);
    refreshConstructorProgressFromForm(form, { input: nextInput, draftMeta });
    void buildConstructor(constructorId, nextInput, { draftMeta });
  });

  document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) {
      return;
    }
    if (pressedInteractiveClearTimer) {
      window.clearTimeout(pressedInteractiveClearTimer);
      pressedInteractiveClearTimer = 0;
    }
    const pressable = event.target.closest(PRESSABLE_INTERACTIVE_SELECTOR);
    if (!pressable) {
      clearPressedInteractive();
      return;
    }
    if (pressedInteractiveNode && pressedInteractiveNode !== pressable) {
      clearPressedInteractive();
    }
    pressedInteractiveNode = pressable;
    pressedInteractiveNode.classList.add('is-pressed');
  });

  document.addEventListener('pointerup', () => {
    schedulePressedInteractiveClear();
  });
  document.addEventListener('pointercancel', clearPressedInteractive);
  window.addEventListener('blur', clearPressedInteractive);

  let constructorAutoBuildTimer = 0;
  document.addEventListener('input', (event) => {
    const form = event.target.closest('#constructor-form');
    if (!form) {
      return;
    }
    refreshConstructorProgressFromForm(form);
    scheduleConstructorDraftSave(form);
  });

  document.addEventListener('change', (event) => {
    const form = event.target.closest('#constructor-form');
    if (!form) {
      return;
    }
    const constructorId = String(form.dataset.constructorId || '').trim();
    if (!constructorId) {
      return;
    }
    const nextInput = collectConstructorFormInput(form);
    refreshConstructorProgressFromForm(form, { input: nextInput });
    scheduleConstructorDraftSave(form, { input: nextInput });
    const fieldName = String(event.target?.name || '').trim();
    const fieldType = String(event.target?.type || event.target?.tagName || '').trim().toLowerCase();
    if (event.target?.matches?.('.constructor-choice-input')) {
      syncConstructorChoiceSelectionState(form);
    }
    if (!shouldAutoBuildConstructorField(fieldName, fieldType)) {
      return;
    }
    if (CONSTRUCTOR_LIVE_PREVIEW_FIELD_IDS.has(fieldName)) {
      applyConstructorLivePreview(nextInput);
    }
    clearTimeout(constructorAutoBuildTimer);
    constructorAutoBuildTimer = window.setTimeout(() => {
      if (!document.body.contains(form)) {
        return;
      }
      void buildConstructor(constructorId, collectConstructorFormInput(form), { silent: true });
    }, 180);
  });

  document.addEventListener('toggle', (event) => {
    if (!event.target?.closest?.('.constructor-shell')) {
      return;
    }
    scheduleConstructorPreviewFloatSync();
  }, true);

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
    scheduleConstructorPreviewFloatSync();
  });

  window.addEventListener('popstate', () => {
    restoreRouteFromLocation().catch((error) => {
      console.error(error);
    });
  });

  window.addEventListener('scroll', () => {
    scheduleConstructorPreviewFloatSync();
  }, { passive: true });

  window.addEventListener('resize', () => {
    scheduleConstructorPreviewFloatSync();
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
