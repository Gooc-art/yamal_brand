<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/site_lib.php';

function assert_true(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "Assertion failed: {$message}\n");
        exit(1);
    }
}

$indexTemplate = file_get_contents(dirname(__DIR__) . '/index.php');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-ribbon'), 'index contains hero ribbon block');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'Официальная библиотека фирменного стиля'), 'index contains official library ribbon text');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'visually-hidden'), 'index keeps hidden h1 for semantics');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-example-tabs'), 'index contains hero examples tabs scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-example-stage'), 'index contains hero examples stage scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-examples-note'), 'index contains hero examples note');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-toggle'), 'index contains workspace toggle control');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'catalog-mode-toggle'), 'index contains catalog mode toggle control');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'copy-current-link'), 'index contains copy current link control');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-column-media'), 'index contains dedicated hero media column');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-grid'), 'index contains workspace grid scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-composition'), 'index contains workspace composition scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-inspector'), 'index contains workspace inspector scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-shell collapsed" hidden'), 'index hides workspace shell by default');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'section-switcher'), 'index contains workspace section switcher scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'inspector-backdrop'), 'index contains inspector backdrop scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'close-inspector'), 'index contains inspector close action');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'consultant-toggle'), 'index contains consultant toggle scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'consultant-panel'), 'index contains consultant panel scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'Помощник по каталогу'), 'index contains consultant heading');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'consultant-clear-button'), 'index contains consultant clear control');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'цвет, пропорции, фото, подрядчика или согласование'), 'index mentions extended consultant follow-up scenarios');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'role="dialog"'), 'index exposes consultant dialog semantics');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'role="log" aria-live="polite"'), 'index exposes consultant live transcript region');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'нужен логотип в SVG, можно ли менять цвет'), 'index contains richer consultant placeholder');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/brand-logo-main.svg')"), 'index uses versioned brand logo asset url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/brand-mark.svg')"), 'index uses versioned brand mark asset url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/styles.css')"), 'index uses versioned stylesheet url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/app.js')"), 'index uses versioned app script url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'brand-routes'), 'index contains brand routes scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'search-panel'), 'index contains compact search panel');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'Главное меню'), 'index contains unified main menu heading');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'Скрыть витрину'), 'index contains hide showcase action label');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'hero-stats'), 'index removed hero stats scaffold');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'hero-briefing'), 'index removed hero briefing grid');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'brand-note'), 'index removed brand note block');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'brand-principles'), 'index removed brand principles scaffold');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'hero-summary'), 'index removed old hero summary scaffold');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'Каталог брендирования'), 'index removed old branding catalog heading');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'Только каталог'), 'index removed confusing catalog-only label');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'featured-shelves'), 'index removed featured shelves scaffold');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'Под рукой'), 'index removed secondary showcase heading');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'Все брендбуки'), 'index removed showcase quick action');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'scroll-rail'), 'index removed showcase rail controls');

$stylesTemplate = file_get_contents(dirname(__DIR__) . '/assets/styles.css');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.brand-route-grid'), 'styles contain brand route classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.brand-route-icon'), 'styles contain simplified route icon class');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.brand-route-card.active'), 'styles contain active route state');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-ribbon'), 'styles contain hero ribbon classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-example-tabs'), 'styles contain hero examples tabs classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-example-card'), 'styles contain hero example card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-example-overlay'), 'styles contain hero example overlay classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-example-thumbs'), 'styles contain hero example thumbnails classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-example-autoplay'), 'styles contain hero autoplay control classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.visually-hidden'), 'styles contain visually hidden utility');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-column-media'), 'styles contain hero media column classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-shell'), 'styles contain workspace shell classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-composition'), 'styles contain workspace composition classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-inspector'), 'styles contain workspace inspector classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.section-switcher'), 'styles contain workspace section switcher classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.section-switch-card'), 'styles contain compact section switch cards');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'width: min(600px, calc(100vw - 24px))'), 'styles widen inspector for desktop edge fit');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'appearance: none'), 'styles normalize button appearance');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'scrollbar-width: none'), 'styles hide inspector scrollbar visuals');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '-ms-overflow-style: none'), 'styles hide legacy inspector scrollbar visuals');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-inspector::-webkit-scrollbar'), 'styles contain webkit inspector scrollbar styling');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.inspector-backdrop'), 'styles contain inspector backdrop classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-shell.inspector-open'), 'styles contain inspector open state classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-toggle'), 'styles contain consultant toggle classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-panel'), 'styles contain consultant panel classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'width: min(720px, calc(100vw - 32px))'), 'styles widen consultant dialog for desktop');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'height: min(82vh, 860px)'), 'styles give consultant dialog full desktop height');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'grid-template-rows: auto minmax(0, 1fr);'), 'styles structure consultant dialog as header plus conversation area');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'background: transparent;'), 'styles keep consultant backdrop non-blocking on desktop');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-result::-webkit-scrollbar'), 'styles contain consultant result scrollbar styling');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-intent'), 'styles contain consultant intent classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-section-card'), 'styles contain consultant section cards');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-understanding'), 'styles contain consultant understanding chips');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-followup'), 'styles contain consultant follow-up cards');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-chat'), 'styles contain consultant transcript classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-user-turn'), 'styles contain consultant user bubble classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-advice'), 'styles contain consultant brandbook advice classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-head-actions'), 'styles contain consultant head action classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.ghost-button.copy-success'), 'styles contain copy success state');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.ghost-button.copy-error'), 'styles contain copy error state');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.detail-caption'), 'styles contain detail caption classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.detail-section-card'), 'styles contain detail section card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.detail-path-card'), 'styles contain detail path card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.detail-actions > *'), 'styles contain equal-width detail action buttons');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.detail-actions > .link-button'), 'styles unify detail action button visuals');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'white-space: normal'), 'styles allow detail action buttons to wrap cleanly');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.detail-facts'), 'styles removed detail fact tiles');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.card-kicker'), 'styles contain list card kicker classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.card-context'), 'styles contain list card context classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'scroll-snap-type: x proximity'), 'styles contain horizontal rail snapping');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'grid-auto-flow: column'), 'styles contain horizontal rail flow');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.page-shell.catalog-mode'), 'styles contain catalog mode classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-actions > *'), 'styles contain tablet hero action grid');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.chip-row > *'), 'styles contain responsive quick search grid');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-actions > *'), 'styles contain mobile workspace action grid');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.toolbar > [data-action="copy-current-link"]'), 'styles contain mobile toolbar spanning copy action');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.result-card.file .item-actions'), 'styles contain mobile file action grid');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.hero-stats'), 'styles removed hero stats block');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.showcase-block'), 'styles removed showcase block classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.rail-actions'), 'styles removed showcase rail action classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.rail-button'), 'styles removed showcase rail button classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.feature-grid'), 'styles removed feature grid classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.feature-visual'), 'styles removed feature preview classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.feature-panel.tone-mark'), 'styles removed feature tone classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.brand-principles'), 'styles removed brand principles classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.hero-briefing'), 'styles removed hero briefing classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.hero-badge'), 'styles removed old hero badge classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.hero-stat'), 'styles removed hero stat cards');

$frontendTemplate = file_get_contents(dirname(__DIR__) . '/assets/app.js');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderBrandRoutes'), 'frontend contains brand route renderer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildBrandRouteMark'), 'frontend derives route marks from real catalog sections');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'inferBrandRouteTone'), 'frontend derives route tones from real catalog sections');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildBrandRouteHint'), 'frontend derives compact route hints from real catalog sections');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderHeroExamples'), 'frontend contains hero examples renderer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'examples-tab'), 'frontend supports hero example tabs');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'toggle-example-autoplay'), 'frontend supports hero example autoplay toggle');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'scheduleExampleAutoplay'), 'frontend supports hero example autoplay scheduling');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildExampleSummary'), 'frontend compacts hero example summary');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'hero-example-thumb'), 'frontend renders hero example thumbnails');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'brand-route-icon'), 'frontend renders simplified route icons');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'setActiveRoute'), 'frontend tracks active main menu route');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'WORKSPACE_STORAGE_KEY'), 'frontend persists workspace collapse state');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'CATALOG_MODE_STORAGE_KEY'), 'frontend persists catalog mode state');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'copy-current-link'), 'frontend supports copy current link action');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'navigator.clipboard'), 'frontend uses clipboard api when available');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, "document.execCommand('copy')"), 'frontend keeps clipboard fallback');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'setInspectorOpen'), 'frontend controls inspector drawer state');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'setWorkspaceVisible'), 'frontend controls full workspace visibility state');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'runConsultant'), 'frontend contains consultant runner');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'toggle-consultant'), 'frontend contains consultant toggle action');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'isWorkspaceNavigationAction'), 'frontend centralizes workspace navigation actions for consultant flow');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'scrollConsultantResultToLatest'), 'frontend keeps consultant transcript scrolled to the latest answer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeConsultantIntents'), 'frontend normalizes consultant intents');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeConsultantFollowUps'), 'frontend normalizes consultant follow-up cards');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeConsultantContext'), 'frontend normalizes consultant memory context');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildConsultantMemoryPayload'), 'frontend serializes consultant memory payload');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeConsultantAdvice'), 'frontend normalizes consultant advice');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'consultant-understanding'), 'frontend renders consultant understanding section');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'consultantHistory'), 'frontend tracks consultant transcript history');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'clear-consultant'), 'frontend handles consultant clear action');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'consultantAdviceBlock'), 'frontend renders consultant advice block');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'можно ли менять цвет'), 'frontend mentions consultant color-rule examples');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'можно ли ставить поверх фото'), 'frontend mentions consultant photo-rule examples');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderSectionSwitcher'), 'frontend renders workspace section switcher');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'focusWorkspace'), 'frontend focuses workspace for route clicks');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'compactRelativePath'), 'frontend compacts path context in cards');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildItemPills'), 'frontend builds compact meta pills');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'splitDetailHeading'), 'frontend structures detail heading text');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildItemHeading'), 'frontend structures list item heading text');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'detail-section-card'), 'frontend renders detail section cards');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, '<div class="detail-actions">'), 'frontend renders dedicated detail action container');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'buildDetailFacts'), 'frontend removed boxed detail fact builder');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, '<div class="detail-facts">'), 'frontend removed detail fact tile markup');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'renderFeaturePanels'), 'frontend removed featured shelf renderer');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'buildFeaturePanelFromItem'), 'frontend removed featured shelf item builder');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'bootstrap.favorites'), 'frontend no longer depends on favorites shelf data');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'scrollRailById'), 'frontend removed showcase rail helper');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'enhanceHorizontalRail'), 'frontend removed showcase wheel enhancer');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'preview-search'), 'frontend removed showcase preview search calls');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'card-kicker'), 'frontend renders structured list card copy');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'siteTitle:'), 'frontend no longer tracks visible hero title');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'brand-route-helper'), 'frontend removed route helper duplication');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'brand-route-number'), 'frontend removed route numbering');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'result-path'), 'frontend removed full path line from result cards');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'renderFavorites'), 'frontend removed left rail favorites renderer');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'BRAND_ROUTE_BLUEPRINTS'), 'frontend removed fixed route blueprint');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'renderHeroBrief'), 'frontend removed old hero summary renderer');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'renderHeroStats'), 'frontend removed hero stats renderer');

$downloadTemplate = file_get_contents(dirname(__DIR__) . '/download.php');
assert_true($downloadTemplate !== false && str_contains($downloadTemplate, 'inline'), 'download supports inline mode');

$apiTemplate = file_get_contents(dirname(__DIR__) . '/api.php');
assert_true($apiTemplate !== false && str_contains($apiTemplate, "case 'consult'"), 'api exposes consult action');
assert_true($apiTemplate !== false && str_contains($apiTemplate, 'memory_intent'), 'api accepts consultant memory parameters');
assert_true($apiTemplate !== false && str_contains($apiTemplate, 'memory_focus'), 'api accepts consultant memory focus parameter');

assert_true(is_file(dirname(__DIR__) . '/assets/brand-logo-main.svg'), 'brand logo asset exists');
assert_true(is_file(dirname(__DIR__) . '/assets/brand-mark.svg'), 'brand mark asset exists');
assert_true(str_contains(asset_url('assets/styles.css'), '?v='), 'asset_url appends version query');
assert_true(str_contains(asset_url('assets/app.js'), '?v='), 'asset_url versions app script');
assert_true(str_contains(asset_url('assets/brand-logo-main.svg'), '?v='), 'asset_url versions logo asset');

assert_true(detect_consultant_intent('нужен логотип в svg') !== null && (detect_consultant_intent('нужен логотип в svg')['id'] ?? '') === 'logo', 'consultant detects logo intent from svg query');
assert_true(detect_consultant_city('материалы Салехарда') === 'салехард', 'consultant detects city from query');
assert_true(detect_consultant_medium('наклейка для печати') === 'print', 'consultant detects print medium from query');
assert_true(detect_consultant_source_mode('нужен исходник логотипа') === 'editable', 'consultant detects editable source mode');
assert_true(detect_consultant_formats('логотип svg pdf') === ['svg', 'pdf'], 'consultant detects ordered format list');
$consultContext = build_consultant_context('логотип svg для Салехарда');
assert_true(($consultContext['intent']['id'] ?? '') === 'logo', 'consultant context resolves intent');
assert_true(($consultContext['city'] ?? '') === 'салехард', 'consultant context resolves city');
assert_true(($consultContext['formats'] ?? []) === ['svg'], 'consultant context resolves formats');
assert_true(in_array('SVG', consultant_understanding_labels($consultContext), true), 'consultant understanding exposes resolved format');
$followUpContext = build_consultant_context('а для печати', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($followUpContext['intent']['id'] ?? '') === 'logo', 'consultant context can reuse intent from previous step');
assert_true(($followUpContext['city'] ?? '') === 'салехард', 'consultant context can reuse city from previous step');
assert_true(($followUpContext['medium'] ?? '') === 'print', 'consultant follow-up query still resolves new medium');
assert_true(($followUpContext['memoryApplied'] ?? false) === true, 'consultant context marks reused dialogue memory');
$backgroundFollowUpContext = build_consultant_context('можно ли на тёмном фоне', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($backgroundFollowUpContext['intent']['id'] ?? '') === 'logo', 'consultant keeps previous logo intent for background follow-up');
assert_true(($backgroundFollowUpContext['city'] ?? '') === 'салехард', 'consultant keeps previous city for background follow-up');
assert_true(($backgroundFollowUpContext['applicationFocus'] ?? '') === 'dark_background', 'consultant detects dark background usage focus');
$colorFollowUpContext = build_consultant_context('можно ли менять цвет', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($colorFollowUpContext['applicationFocus'] ?? '') === 'color_change', 'consultant detects color change usage focus');
$distortionFollowUpContext = build_consultant_context('можно ли растягивать', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($distortionFollowUpContext['applicationFocus'] ?? '') === 'distortion', 'consultant detects distortion usage focus');
$photoFollowUpContext = build_consultant_context('можно ли ставить поверх фото', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($photoFollowUpContext['applicationFocus'] ?? '') === 'photo_overlay', 'consultant detects photo overlay usage focus');
$mediumAfterFocusContext = build_consultant_context('а для печати', '', ['intentId' => 'logo', 'city' => 'салехард', 'applicationFocus' => 'color_change']);
assert_true(($mediumAfterFocusContext['applicationFocus'] ?? '') === '', 'consultant does not leak previous usage-focus into unrelated follow-up');
$switchedTopicContext = build_consultant_context('а брендбук', '', ['intentId' => 'logo', 'city' => 'салехард', 'formats' => ['svg']]);
assert_true(($switchedTopicContext['intent']['id'] ?? '') === 'brandbook', 'consultant can switch intent inside follow-up dialogue');
assert_true(($switchedTopicContext['city'] ?? '') === 'салехард', 'consultant keeps city when follow-up switches to brandbook');
assert_true(($switchedTopicContext['formats'] ?? []) === [], 'consultant does not leak old file format into a new intent');
$brandbookTopic = detect_consultant_brandbook_topic(build_consultant_context('какие цвета и паттерны использовать'));
assert_true($brandbookTopic === 'colors_patterns', 'consultant detects brandbook color and pattern topic');
$backgroundTopic = detect_consultant_brandbook_topic(build_consultant_context('можно ли логотип на тёмном фоне'));
assert_true($backgroundTopic === 'background_usage', 'consultant detects dark background usage topic');
$colorTopic = detect_consultant_brandbook_topic(build_consultant_context('можно ли менять цвет логотипа'));
assert_true($colorTopic === 'color_change', 'consultant detects color change usage topic');
$distortionTopic = detect_consultant_brandbook_topic(build_consultant_context('можно ли растягивать логотип'));
assert_true($distortionTopic === 'distortion', 'consultant detects distortion usage topic');
$photoTopic = detect_consultant_brandbook_topic(build_consultant_context('можно ли ставить логотип поверх фото'));
assert_true($photoTopic === 'photo_overlay', 'consultant detects photo overlay usage topic');
$contractorTopic = detect_consultant_brandbook_topic(build_consultant_context('что отправить подрядчику'));
assert_true($contractorTopic === 'contractor_handoff', 'consultant detects contractor handoff topic');
$brandbookAdvice = consultant_brandbook_advice(build_consultant_context('нужен логотип svg'), [['label' => 'Логотип', 'name' => 'Логотип']]);
assert_true(($brandbookAdvice['topic'] ?? '') === 'logo_formats', 'consultant returns brandbook topic-aware advice');
assert_true(str_contains((string) ($brandbookAdvice['title'] ?? ''), 'формат'), 'consultant advice exposes brandbook title');
assert_true(count($brandbookAdvice['bullets'] ?? []) >= 2, 'consultant advice exposes brandbook guidance bullets');
$backgroundAdvice = consultant_brandbook_advice(build_consultant_context('можно ли логотип на тёмном фоне'), [['label' => 'Логотип', 'name' => 'Логотип']]);
assert_true(($backgroundAdvice['topic'] ?? '') === 'background_usage', 'consultant returns background usage advice');
assert_true(str_contains((string) ($backgroundAdvice['summary'] ?? ''), 'тёмн'), 'consultant background advice references dark background');
$colorAdvice = consultant_brandbook_advice(build_consultant_context('можно ли менять цвет логотипа'), [['label' => 'Брендбук ЯМАЛ Мастер бренд', 'name' => 'Брендбук ЯМАЛ Мастер бренд'], ['label' => 'Логотип', 'name' => 'Логотип']]);
assert_true(($colorAdvice['topic'] ?? '') === 'color_change', 'consultant returns color change advice');
assert_true(str_contains((string) ($colorAdvice['title'] ?? ''), 'цвет'), 'consultant color change advice exposes color title');
$distortionAdvice = consultant_brandbook_advice(build_consultant_context('можно ли растягивать логотип'), [['label' => 'Брендбук ЯМАЛ Мастер бренд', 'name' => 'Брендбук ЯМАЛ Мастер бренд'], ['label' => 'Логотип', 'name' => 'Логотип']]);
assert_true(($distortionAdvice['topic'] ?? '') === 'distortion', 'consultant returns distortion advice');
assert_true(str_contains((string) ($distortionAdvice['summary'] ?? ''), 'пропорц'), 'consultant distortion advice references proportions');
$photoAdvice = consultant_brandbook_advice(build_consultant_context('можно ли ставить логотип поверх фото'), [['label' => 'Логотип', 'name' => 'Логотип']]);
assert_true(($photoAdvice['topic'] ?? '') === 'photo_overlay', 'consultant returns photo overlay advice');
assert_true(str_contains((string) ($photoAdvice['summary'] ?? ''), 'фото'), 'consultant photo overlay advice references photo placement');
$contractorAdvice = consultant_brandbook_advice(build_consultant_context('что отправить подрядчику'), [['label' => 'Брендбук ЯМАЛ Мастер бренд', 'name' => 'Брендбук ЯМАЛ Мастер бренд'], ['label' => 'Логотип', 'name' => 'Логотип']]);
assert_true(($contractorAdvice['topic'] ?? '') === 'contractor_handoff', 'consultant returns contractor handoff advice');
assert_true(str_contains((string) ($contractorAdvice['title'] ?? ''), 'подрядчику'), 'consultant contractor advice exposes handoff title');
$followUps = consultant_follow_up_suggestions(build_consultant_context('брендбук', ''));
assert_true(count($followUps) >= 3, 'consultant builds follow-up clarifications for broad query');

function create_catalog_db(string $path): void
{
    $pdo = new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec(
        'CREATE TABLE assets (
            id TEXT PRIMARY KEY,
            parent_id TEXT NOT NULL,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            relative_path TEXT NOT NULL,
            parent_path TEXT NOT NULL,
            depth INTEGER NOT NULL,
            extension TEXT NOT NULL,
            size_bytes INTEGER,
            mime_type TEXT NOT NULL,
            modified_utc TEXT NOT NULL,
            normalized_name TEXT NOT NULL,
            normalized_path TEXT NOT NULL,
            search_text TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            sort_order INTEGER NOT NULL DEFAULT 0
        )'
    );

    $rootId = root_id();
    $rows = [
        [$rootId, '', 'folder', 'Макеты1', '.', '', 0, '', null, '', '2026-03-09T00:00:00Z', 'макеты1', '.', 'макеты1', 1, 0],
        ['logo', $rootId, 'folder', 'Логотип', 'Логотип', '.', 1, '', null, '', '2026-03-09T00:00:00Z', 'логотип', 'логотип', 'логотип logo sign', 1, 0],
        ['master', $rootId, 'folder', 'Брендбук ЯМАЛ Мастер бренд', 'Брендбук ЯМАЛ Мастер бренд', '.', 1, '', null, '', '2026-03-09T00:00:00Z', 'брендбук ямал мастер бренд', 'брендбук ямал мастер бренд', 'брендбук мастер бренд guide', 1, 0],
        ['mockups', 'master', 'folder', 'Файлы', 'Брендбук ЯМАЛ Мастер бренд/Файлы', 'Брендбук ЯМАЛ Мастер бренд', 2, '', null, '', '2026-03-09T00:00:00Z', 'файлы', 'брендбук ямал мастер бренд файлы', 'файлы макеты', 1, 0],
        ['mockups-inner', 'mockups', 'folder', 'Макеты', 'Брендбук ЯМАЛ Мастер бренд/Файлы/Макеты', 'Брендбук ЯМАЛ Мастер бренд/Файлы', 3, '', null, '', '2026-03-09T00:00:00Z', 'макеты', 'брендбук ямал мастер бренд файлы макеты', 'макеты внедрение', 1, 0],
        ['bus-folder', 'mockups-inner', 'folder', 'Автобус', 'Брендбук ЯМАЛ Мастер бренд/Файлы/Макеты/Автобус', 'Брендбук ЯМАЛ Мастер бренд/Файлы/Макеты', 4, '', null, '', '2026-03-09T00:00:00Z', 'автобус', 'брендбук ямал мастер бренд файлы макеты автобус', 'автобус макет пример', 1, 0],
        ['good-example', 'bus-folder', 'file', 'Автобус пример.png', 'Брендбук ЯМАЛ Мастер бренд/Файлы/Макеты/Автобус/Автобус пример.png', 'Брендбук ЯМАЛ Мастер бренд/Файлы/Макеты/Автобус', 5, 'png', 4096, 'image/png', '2026-03-09T00:00:00Z', 'автобус пример', 'брендбук ямал мастер бренд файлы макеты автобус автобус пример png', 'автобус пример png', 1, 0],
        ['examples-root', $rootId, 'folder', 'Примеры внедрения бренда территории', 'Примеры внедрения бренда территории', '.', 1, '', null, '', '2026-03-09T00:00:00Z', 'примеры внедрения бренда территории', 'примеры внедрения бренда территории', 'примеры внедрения бренда территории', 1, 0],
        ['examples-good-root', 'examples-root', 'folder', 'Хорошие примеры', 'Примеры внедрения бренда территории/Хорошие примеры', 'Примеры внедрения бренда территории', 2, '', null, '', '2026-03-09T00:00:00Z', 'хорошие примеры', 'примеры внедрения бренда территории хорошие примеры', 'хорошие примеры кейсы', 1, 0],
        ['examples-good-file', 'examples-good-root', 'file', 'Автобус на маршруте.png', 'Примеры внедрения бренда территории/Хорошие примеры/Автобус на маршруте.png', 'Примеры внедрения бренда территории/Хорошие примеры', 3, 'png', 4096, 'image/png', '2026-03-09T00:00:00Z', 'автобус на маршруте', 'примеры внедрения бренда территории хорошие примеры автобус на маршруте png', 'автобус на маршруте png хороший пример', 1, 0],
        ['examples-archive-root', 'examples-root', 'folder', 'Архив', 'Примеры внедрения бренда территории/Архив', 'Примеры внедрения бренда территории', 2, '', null, '', '2026-03-09T00:00:00Z', 'архив', 'примеры внедрения бренда территории архив', 'архив кейсы', 1, 0],
        ['examples-archive-file', 'examples-archive-root', 'file', 'Павильон.png', 'Примеры внедрения бренда территории/Архив/Павильон.png', 'Примеры внедрения бренда территории/Архив', 3, 'png', 3072, 'image/png', '2026-03-09T00:00:00Z', 'павильон', 'примеры внедрения бренда территории архив павильон png', 'павильон png архив кейс', 1, 0],
        ['examples-debate-root', 'examples-root', 'folder', 'Спорные примеры', 'Примеры внедрения бренда территории/Спорные примеры', 'Примеры внедрения бренда территории', 2, '', null, '', '2026-03-09T00:00:00Z', 'спорные примеры', 'примеры внедрения бренда территории спорные примеры', 'спорные примеры обсуждение', 1, 0],
        ['examples-debate-file', 'examples-debate-root', 'file', 'Перегруженный баннер.jpg', 'Примеры внедрения бренда территории/Спорные примеры/Перегруженный баннер.jpg', 'Примеры внедрения бренда территории/Спорные примеры', 3, 'jpg', 2048, 'image/jpeg', '2026-03-09T00:00:00Z', 'перегруженный баннер', 'примеры внедрения бренда территории спорные примеры перегруженный баннер jpg', 'перегруженный баннер jpg спорный пример', 1, 0],
        ['examples-review-root', 'examples-root', 'folder', 'Обсуждение', 'Примеры внедрения бренда территории/Обсуждение', 'Примеры внедрения бренда территории', 2, '', null, '', '2026-03-09T00:00:00Z', 'обсуждение', 'примеры внедрения бренда территории обсуждение', 'обсуждение спорный кейс', 1, 0],
        ['examples-review-file', 'examples-review-root', 'file', 'Черновой щит.jpg', 'Примеры внедрения бренда территории/Обсуждение/Черновой щит.jpg', 'Примеры внедрения бренда территории/Обсуждение', 3, 'jpg', 3072, 'image/jpeg', '2026-03-09T00:00:00Z', 'черновой щит', 'примеры внедрения бренда территории обсуждение черновой щит jpg', 'черновой щит jpg обсуждение', 1, 0],
        ['examples-generic-root', $rootId, 'folder', 'Примеры внедрения бренда', 'Примеры внедрения бренда', '.', 1, '', null, '', '2026-03-09T00:00:00Z', 'примеры внедрения бренда', 'примеры внедрения бренда', 'примеры внедрения бренда', 1, 0],
        ['examples-generic-good-root', 'examples-generic-root', 'folder', 'Хорошие примеры', 'Примеры внедрения бренда/Хорошие примеры', 'Примеры внедрения бренда', 2, '', null, '', '2026-03-09T00:00:00Z', 'хорошие примеры', 'примеры внедрения бренда хорошие примеры', 'хорошие примеры generic', 1, 0],
        ['examples-generic-good-file', 'examples-generic-good-root', 'file', 'Старая витрина.png', 'Примеры внедрения бренда/Хорошие примеры/Старая витрина.png', 'Примеры внедрения бренда/Хорошие примеры', 3, 'png', 1024, 'image/png', '2026-03-09T00:00:00Z', 'старая витрина', 'примеры внедрения бренда хорошие примеры старая витрина png', 'старая витрина png', 1, 0],
        ['examples-generic-debate-root', 'examples-generic-root', 'folder', 'Спорные примеры', 'Примеры внедрения бренда/Спорные примеры', 'Примеры внедрения бренда', 2, '', null, '', '2026-03-09T00:00:00Z', 'спорные примеры', 'примеры внедрения бренда спорные примеры', 'спорные примеры generic', 1, 0],
        ['examples-generic-debate-file', 'examples-generic-debate-root', 'file', 'Старый баннер.jpg', 'Примеры внедрения бренда/Спорные примеры/Старый баннер.jpg', 'Примеры внедрения бренда/Спорные примеры', 3, 'jpg', 1024, 'image/jpeg', '2026-03-09T00:00:00Z', 'старый баннер', 'примеры внедрения бренда спорные примеры старый баннер jpg', 'старый баннер jpg', 1, 0],
        ['cities-root', $rootId, 'folder', 'Логотипы городов', 'Логотипы городов', '.', 1, '', null, '', '2026-03-09T00:00:00Z', 'логотипы городов', 'логотипы городов', 'логотипы городов салехард ноябрьск уренгой', 1, 0],
        ['salekhard-city-folder', 'cities-root', 'folder', 'Салехард', 'Логотипы городов/Салехард', 'Логотипы городов', 2, '', null, '', '2026-03-09T00:00:00Z', 'салехард', 'логотипы городов салехард', 'салехард логотип город', 1, 0],
        ['salekhard-city-logo', 'salekhard-city-folder', 'file', 'Логотип Салехард.svg', 'Логотипы городов/Салехард/Логотип Салехард.svg', 'Логотипы городов/Салехард', 3, 'svg', 1024, 'image/svg+xml', '2026-03-09T00:00:00Z', 'логотип салехард', 'логотипы городов салехард логотип салехард svg', 'салехард логотип svg город', 1, 0],
        ['salekhard-city-mark', 'salekhard-city-folder', 'file', 'Фирменный знак Салехард.pdf', 'Логотипы городов/Салехард/Фирменный знак Салехард.pdf', 'Логотипы городов/Салехард', 3, 'pdf', 1024, 'application/pdf', '2026-03-09T00:00:00Z', 'фирменный знак салехард', 'логотипы городов салехард фирменный знак салехард pdf', 'салехард фирменный знак pdf город', 1, 0],
        ['salekhard-brandbook', $rootId, 'folder', 'Брендбук Салехард', 'Брендбук Салехард', '.', 1, '', null, '', '2026-03-09T00:00:00Z', 'брендбук салехард', 'брендбук салехард', 'брендбук салехард guide', 1, 0],
        ['salekhard-brandbook-file', 'salekhard-brandbook', 'file', 'Брендбук Салехард.pdf', 'Брендбук Салехард/Брендбук Салехард.pdf', 'Брендбук Салехард', 2, 'pdf', 2048, 'application/pdf', '2026-03-09T00:00:00Z', 'брендбук салехард', 'брендбук салехард брендбук салехард pdf', 'брендбук салехард pdf guide', 1, 0],
        ['debate-root', $rootId, 'folder', 'Спорные примеры', 'Спорные примеры', '.', 1, '', null, '', '2026-03-09T00:00:00Z', 'спорные примеры', 'спорные примеры', 'спорные примеры обсуждение', 1, 0],
        ['debate-file', 'debate-root', 'file', 'Плохой щит.jpg', 'Спорные примеры/Плохой щит.jpg', 'Спорные примеры', 2, 'jpg', 2048, 'image/jpeg', '2026-03-09T00:00:00Z', 'плохой щит', 'спорные примеры плохой щит jpg', 'плохой щит jpg спорный пример', 1, 0],
        ['file1', 'logo', 'file', 'Логотип основной вариант для печати финальный.pdf', 'Логотип/Логотип основной вариант для печати финальный.pdf', 'Логотип', 2, 'pdf', 2048, 'application/pdf', '2026-03-09T00:00:00Z', 'логотип основной вариант для печати финальный', 'логотип логотип основной вариант для печати финальный pdf', 'логотип основной вариант pdf', 1, 0],
    ];

    $stmt = $pdo->prepare('INSERT INTO assets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    foreach ($rows as $row) {
        $stmt->execute($row);
    }
}

$base = sys_get_temp_dir() . '/yamal-php-site-' . bin2hex(random_bytes(4));
mkdir($base, 0777, true);
mkdir($base . '/upload', 0777, true);
mkdir($base . '/upload/Макеты1', 0777, true);
mkdir($base . '/upload/Макеты1/Логотип', 0777, true);
mkdir($base . '/upload/Макеты1/Брендбук ЯМАЛ Мастер бренд/Файлы/Макеты/Автобус', 0777, true);
mkdir($base . '/upload/Макеты1/Примеры внедрения бренда', 0777, true);
mkdir($base . '/upload/Макеты1/Примеры внедрения бренда/Хорошие примеры', 0777, true);
mkdir($base . '/upload/Макеты1/Примеры внедрения бренда/Спорные примеры', 0777, true);
mkdir($base . '/upload/Макеты1/Примеры внедрения бренда территории/Хорошие примеры', 0777, true);
mkdir($base . '/upload/Макеты1/Примеры внедрения бренда территории/Архив', 0777, true);
mkdir($base . '/upload/Макеты1/Примеры внедрения бренда территории/Спорные примеры', 0777, true);
mkdir($base . '/upload/Макеты1/Примеры внедрения бренда территории/Обсуждение', 0777, true);
mkdir($base . '/upload/Макеты1/Логотипы городов/Салехард', 0777, true);
mkdir($base . '/upload/Макеты1/Брендбук Салехард', 0777, true);
mkdir($base . '/upload/Макеты1/Спорные примеры', 0777, true);
file_put_contents($base . '/upload/Макеты1/Логотип/Логотип основной вариант для печати финальный.pdf', 'pdf');
file_put_contents($base . '/upload/Макеты1/Брендбук ЯМАЛ Мастер бренд/Файлы/Макеты/Автобус/Автобус пример.png', 'png');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда/Хорошие примеры/Старая витрина.png', 'png');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда/Спорные примеры/Старый баннер.jpg', 'jpg');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда территории/Хорошие примеры/Автобус на маршруте.png', 'png');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда территории/Архив/Павильон.png', 'png');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда территории/Спорные примеры/Перегруженный баннер.jpg', 'jpg');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда территории/Обсуждение/Черновой щит.jpg', 'jpg');
file_put_contents($base . '/upload/Макеты1/Логотипы городов/Салехард/Логотип Салехард.svg', 'svg');
file_put_contents($base . '/upload/Макеты1/Логотипы городов/Салехард/Фирменный знак Салехард.pdf', 'pdf');
file_put_contents($base . '/upload/Макеты1/Брендбук Салехард/Брендбук Салехард.pdf', 'pdf');
file_put_contents($base . '/upload/Макеты1/Спорные примеры/Плохой щит.jpg', 'jpg');

$detectedRoot = detect_catalog_source_root($base . '/upload');
assert_true($detectedRoot === $base . '/upload/Макеты1', 'detect nested source root');

$builtRows = build_catalog_rows($detectedRoot);
assert_true(count($builtRows) >= 9, 'scan returns extended catalog structure');
assert_true($builtRows[0]['id'] === root_id(), 'root id is stable');
$builtRelativePaths = array_column($builtRows, 'relative_path');
assert_true(in_array('Логотип/Логотип основной вариант для печати финальный.pdf', $builtRelativePaths, true), 'scan includes logo pdf path');
assert_true(in_array('Брендбук ЯМАЛ Мастер бренд/Файлы/Макеты/Автобус/Автобус пример.png', $builtRelativePaths, true), 'scan includes good example image path');
assert_true(in_array('Примеры внедрения бренда территории/Хорошие примеры/Автобус на маршруте.png', $builtRelativePaths, true), 'scan includes dedicated good example path');
assert_true(in_array('Примеры внедрения бренда территории/Спорные примеры/Перегруженный баннер.jpg', $builtRelativePaths, true), 'scan includes dedicated debate example path');
assert_true(in_array('Логотипы городов/Салехард/Логотип Салехард.svg', $builtRelativePaths, true), 'scan includes city logo path');
assert_true(in_array('Брендбук Салехард/Брендбук Салехард.pdf', $builtRelativePaths, true), 'scan includes city brandbook path');
assert_true(str_contains(implode(' ', array_column($builtRows, 'search_text')), 'логотип'), 'search text includes normalized file words');

if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
    fwrite(STDOUT, "skipped: pdo_sqlite not available in local PHP CLI; pure scan checks passed\n");
    exit(0);
}

$catalogDb = $base . '/max_catalog.db';
$runtimeDb = $base . '/max_bot_runtime.db';
create_catalog_db($catalogDb);

$service = new SiteCatalogService([
    'title' => 'Test Site',
    'catalog_db_path' => $catalogDb,
    'runtime_db_path' => $runtimeDb,
    'catalog_root_path' => $base . '/upload',
    'page_size' => 12,
    'favorites_limit' => 5,
    'public_base' => '',
]);

$bootstrap = $service->getBootstrap();
assert_true($bootstrap['title'] === 'Test Site', 'bootstrap title');
assert_true(count($bootstrap['sections']) >= 2, 'root sections exist');
assert_true($bootstrap['setupMessage'] === '', 'setup message empty when db exists');
assert_true(($bootstrap['consultant']['title'] ?? '') === 'Помощник по каталогу', 'bootstrap exposes consultant title');
assert_true(str_contains((string) ($bootstrap['consultant']['description'] ?? ''), 'формат'), 'bootstrap exposes smarter consultant description');
assert_true(count($bootstrap['consultant']['intents'] ?? []) >= 6, 'bootstrap exposes consultant scenarios');
assert_true(count($bootstrap['examples']['good'] ?? []) >= 1, 'bootstrap good examples exist');
assert_true(count($bootstrap['examples']['debate'] ?? []) >= 1, 'bootstrap debate examples exist');
assert_true(($bootstrap['examples']['good'][0]['relativePath'] ?? '') === 'Примеры внедрения бренда территории/Хорошие примеры/Автобус на маршруте.png', 'dedicated good examples are prioritized');
assert_true(($bootstrap['examples']['debate'][0]['relativePath'] ?? '') === 'Примеры внедрения бренда территории/Спорные примеры/Перегруженный баннер.jpg', 'dedicated debate examples are prioritized');
assert_true(
    array_reduce(
        $bootstrap['examples']['good'] ?? [],
        static fn(bool $carry, array $item): bool => $carry && str_starts_with((string) ($item['relativePath'] ?? ''), 'Примеры внедрения бренда территории/Хорошие примеры/'),
        true
    ),
    'good examples stay inside territory dedicated good folder when it exists'
);
assert_true(
    array_reduce(
        $bootstrap['examples']['debate'] ?? [],
        static fn(bool $carry, array $item): bool => $carry && str_starts_with((string) ($item['relativePath'] ?? ''), 'Примеры внедрения бренда территории/Спорные примеры/'),
        true
    ),
    'debate examples stay inside territory dedicated debate folder when it exists'
);
assert_true(
    array_reduce(
        $bootstrap['sections'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || ((string) ($item['name'] ?? '') === 'Примеры внедрения бренда территории' && (string) ($item['label'] ?? '') === 'Кейсы внедрения'),
        false
    ),
    'root menu shortens examples section label'
);

$folder = $service->getFolder('logo', 0);
assert_true($folder !== null, 'logo folder exists');
assert_true($folder['items'][0]['label'] === 'Основной • PDF', 'file label shortened');

$search = $service->search('логотеп');
assert_true($search['total'] >= 1, 'fuzzy search returns result');

$previewSearch = $service->search('логотип', false);
assert_true($previewSearch['total'] >= 1, 'preview search returns result without analytics side effect');

$runtimeStats = (new RuntimeDb($runtimeDb))->stats();
assert_true((int) ($runtimeStats['total_searches'] ?? 0) === 1, 'preview search does not increment search analytics');

$previewFilesOnly = $service->search('логотип', false, false);
assert_true(($previewFilesOnly['items'][0]['type'] ?? '') === 'file', 'preview search can be restricted to files only');

$logoConsult = $service->consult('', 'logo');
assert_true(($logoConsult['intent']['id'] ?? '') === 'logo', 'consult keeps explicit logo intent');
assert_true(($logoConsult['sections'][0]['name'] ?? '') === 'Логотип', 'consult logo points to logo section');
assert_true(($logoConsult['items'][0]['id'] ?? '') === 'file1', 'consult logo suggests matching file');
assert_true(in_array('Логотип и фирменный знак', $logoConsult['understanding'] ?? [], true), 'consult logo exposes understanding labels');
assert_true(count($logoConsult['followUps'] ?? []) >= 1, 'consult logo exposes follow-up clarifications');
assert_true(str_contains((string) ($logoConsult['advice']['title'] ?? ''), 'брендбук') || str_contains((string) ($logoConsult['advice']['title'] ?? ''), 'логотип'), 'consult logo exposes brandbook advice title');

$brandbookConsult = $service->consult('брендбук', '');
assert_true(($brandbookConsult['intent']['id'] ?? '') === 'brandbook', 'consult detects brandbook intent from query');
assert_true(count($brandbookConsult['sections'] ?? []) >= 1, 'consult brandbook returns matching sections');
assert_true(count($brandbookConsult['followUps'] ?? []) >= 1, 'consult brandbook proposes city follow-ups');
assert_true(str_contains((string) ($brandbookConsult['advice']['title'] ?? ''), 'брендбук'), 'consult brandbook exposes brandbook advice');

$cityConsult = $service->consult('логотип Салехард svg', '');
assert_true(($cityConsult['intent']['id'] ?? '') === 'logo', 'consult city query still resolves logo intent');
assert_true(($cityConsult['context']['city'] ?? '') === 'салехард', 'consult city query exposes resolved city context');
assert_true(($cityConsult['sections'][0]['name'] ?? '') === 'Логотипы городов', 'consult city query points to city logos section');
assert_true(($cityConsult['items'][0]['id'] ?? '') === 'salekhard-city-logo', 'consult city query promotes city-specific file');

$memoryConsult = $service->consult('а для печати', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($memoryConsult['context']['memoryApplied'] ?? false) === true, 'consult exposes reused memory context');
assert_true(($memoryConsult['context']['city'] ?? '') === 'салехард', 'consult follow-up keeps previous city');
assert_true(($memoryConsult['context']['medium'] ?? '') === 'print', 'consult follow-up resolves new medium');

$backgroundConsult = $service->consult('можно ли на тёмном фоне', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($backgroundConsult['context']['memoryApplied'] ?? false) === true, 'consult background follow-up reuses dialogue memory');
assert_true(($backgroundConsult['context']['applicationFocus'] ?? '') === 'dark_background', 'consult exposes dark background focus in context');
assert_true(($backgroundConsult['advice']['topic'] ?? '') === 'background_usage', 'consult returns dark background advice');

$colorConsult = $service->consult('можно ли менять цвет', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($colorConsult['context']['applicationFocus'] ?? '') === 'color_change', 'consult exposes color change focus in context');
assert_true(($colorConsult['advice']['topic'] ?? '') === 'color_change', 'consult returns color change advice');

$distortionConsult = $service->consult('можно ли растягивать', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($distortionConsult['context']['applicationFocus'] ?? '') === 'distortion', 'consult exposes distortion focus in context');
assert_true(($distortionConsult['advice']['topic'] ?? '') === 'distortion', 'consult returns distortion advice');

$photoConsult = $service->consult('можно ли ставить поверх фото', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($photoConsult['context']['applicationFocus'] ?? '') === 'photo_overlay', 'consult exposes photo overlay focus in context');
assert_true(($photoConsult['advice']['topic'] ?? '') === 'photo_overlay', 'consult returns photo overlay advice');

$contractorConsult = $service->consult('что отправить подрядчику', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($contractorConsult['context']['applicationFocus'] ?? '') === 'contractor_handoff', 'consult exposes contractor handoff focus in context');
assert_true(($contractorConsult['advice']['topic'] ?? '') === 'contractor_handoff', 'consult returns contractor handoff advice');
assert_true(count($contractorConsult['items'] ?? []) >= 1, 'consult contractor handoff returns working files');

$file = $service->getFile('file1');
assert_true($file !== null, 'file details exist');
assert_true($file['downloadUrl'] === 'download.php?id=file1', 'download url format');
assert_true(($file['inlineUrl'] ?? '') === 'download.php?id=file1&inline=1', 'file details expose inline url');
assert_true(($file['previewKind'] ?? '') === 'pdf', 'file details expose preview kind');
assert_true(($file['mimeType'] ?? '') === 'application/pdf', 'file details expose mime type');

$previewDownload = $service->resolveDownload('file1', false);
assert_true($previewDownload !== null, 'preview download resolves without tracking');

$runtimeStats = (new RuntimeDb($runtimeDb))->stats();
assert_true((int) ($runtimeStats['total_item_events'] ?? 0) === 1, 'preview download does not increment item analytics');

$download = $service->resolveDownload('file1');
assert_true($download !== null, 'download resolves');
assert_true(is_file($download['fullPath']), 'download file exists');

$runtimeStats = (new RuntimeDb($runtimeDb))->stats();
assert_true((int) ($runtimeStats['total_item_events'] ?? 0) === 2, 'real download increments item analytics');

$bootstrapAfterUsage = $service->getBootstrap();
assert_true(($bootstrapAfterUsage['favorites'][0]['id'] ?? '') === 'file1', 'favorites prefer recent real item activity');
assert_true((int) ($bootstrapAfterUsage['favorites'][0]['uses'] ?? 0) === 1, 'favorites expose usage count');

mkdir($base . '/missing-files', 0777, true);
mkdir($base . '/missing-files/Макеты1', 0777, true);
mkdir($base . '/missing-files/Макеты1/Шрифт', 0777, true);
file_put_contents($base . '/missing-files/Макеты1/Шрифт/Arial.ttf', 'font');

$missing = new SiteCatalogService([
    'title' => 'Missing',
    'catalog_db_path' => $base . '/missing.db',
    'runtime_db_path' => $base . '/missing-runtime.db',
    'catalog_root_path' => $base . '/missing-files',
    'page_size' => 12,
    'favorites_limit' => 5,
    'public_base' => '',
]);
$missingBootstrap = $missing->getBootstrap();
assert_true($missingBootstrap['setupMessage'] === '', 'missing db auto-builds when files exist');
assert_true(($missingBootstrap['stats']['totalAssets'] ?? 0) >= 3, 'auto-built db has rows');
assert_true(
    array_reduce(
        $missingBootstrap['sections'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || in_array((string) ($item['label'] ?? $item['name'] ?? ''), ['Шрифты', 'Шрифт'], true),
        false
    ),
    'root section menu includes fonts when only font folder exists'
);

echo "ok\n";
