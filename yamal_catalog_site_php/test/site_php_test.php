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

function constructor_test_defaults(array $definition): array
{
    $defaults = [];
    foreach (($definition['fields'] ?? []) as $field) {
        if (!is_array($field)) {
            continue;
        }
        $fieldId = (string) ($field['id'] ?? '');
        if ($fieldId === '') {
            continue;
        }
        $defaults[$fieldId] = $field['default'] ?? '';
    }
    return $defaults;
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
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'Опишите задачу одним сообщением'), 'index starts consultant from dialog copy');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'можно продолжать уточнениями прямо в этом же диалоге'), 'index keeps consultant guidance inside dialog');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'более глубокий ответ'), 'index mentions deeper consultant answer');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'role="dialog"'), 'index exposes consultant dialog semantics');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'role="log" aria-live="polite"'), 'index exposes consultant live transcript region');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'логотип SVG для Салехарда, можно ли менять цвет'), 'index contains richer consultant placeholder');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'что делать на тёмном фоне'), 'index contains deeper consultant starter example');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'consultant-intents'), 'index removed top consultant intent grid');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/brand-logo-main.svg')"), 'index uses versioned brand logo asset url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/brand-mark.svg')"), 'index uses versioned brand mark asset url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/styles.css')"), 'index uses versioned stylesheet url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/app.js')"), 'index uses versioned app script url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'brand-routes'), 'index contains brand routes scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'search-panel'), 'index contains compact search panel');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'Главное меню'), 'index contains unified main menu heading');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'solution-lab'), 'index contains solution lab scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'Лаборатория решений'), 'index contains solution lab heading');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'solution-lab-filters'), 'index contains solution lab filters scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'solution-lab-meta'), 'index contains solution lab meta scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'Каталог и решения'), 'index updates workspace heading for catalog and constructor');
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
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'width: min(860px, calc(100vw - 32px))'), 'styles widen consultant dialog for desktop');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'height: min(88vh, 960px)'), 'styles give consultant dialog full desktop height');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'grid-template-rows: auto minmax(0, 1fr);'), 'styles structure consultant dialog as header plus conversation area');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'background: transparent;'), 'styles keep consultant backdrop non-blocking on desktop');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-result::-webkit-scrollbar'), 'styles contain consultant result scrollbar styling');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-query-chip'), 'styles contain consultant dialog starter chips');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-response-home'), 'styles contain consultant home dialog classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-section-card'), 'styles contain consultant section cards');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-understanding'), 'styles contain consultant understanding chips');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-deep-answer'), 'styles contain consultant deep-answer group classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-deep-answer-card'), 'styles contain consultant deep-answer card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.consultant-deep-answer-note'), 'styles contain consultant deep-answer note classes');
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
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.solution-lab-grid'), 'styles contain solution lab grid classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.solution-lab-toolbar'), 'styles contain solution lab toolbar classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.solution-filter-chip.active'), 'styles contain active solution filter classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.solution-filter-chip small'), 'styles removed solution filter counters');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.solution-card'), 'styles contain solution card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '-webkit-line-clamp: 2'), 'styles clamp solution card copy to two lines');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-layout'), 'styles contain constructor layout classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-steps'), 'styles contain constructor steps classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-field-group'), 'styles contain grouped constructor field classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-field-accordion'), 'styles contain constructor field accordion classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-group-summary-meta'), 'styles contain constructor accordion meta pills');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-choice-card'), 'styles contain constructor choice card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-choice-card.is-pressed'), 'styles expose pressed state for constructor choice cards');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-choice-card.active::after'), 'styles expose visible selected marker for constructor choice cards');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-choice-grid.is-palette'), 'styles contain constructor palette choice grid classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'text-wrap: balance'), 'styles balance constructor choice labels');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'overflow-wrap: anywhere'), 'styles keep constructor choice copy inside cards');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preset-card'), 'styles contain constructor preset card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preset-card.active::after'), 'styles expose visible selected marker for constructor preset cards');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preset-grid'), 'styles contain constructor preset grid classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-handoff-grid'), 'styles contain constructor handoff grid classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-handoff-card'), 'styles contain constructor handoff card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preview-stage'), 'styles contain constructor preview stage classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preview-stage.is-panorama'), 'styles contain panorama constructor preview profile');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preview-visual.is-document svg'), 'styles contain document constructor preview profile');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '--constructor-paper: #fffdf9'), 'styles expose paper-like constructor surface tokens');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-progress-strip'), 'styles contain constructor progress strip classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-draft-status'), 'styles contain constructor draft status classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-warning-list'), 'styles contain constructor warning list classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-loading-shell'), 'styles contain constructor loading shell classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'height: clamp(340px, 48vh, 560px);'), 'styles size constructor preview stage to fit template without inner scrolling');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'max-height: 100%;'), 'styles keep constructor svg preview fully contained inside stage');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-warning-card.tone-warn'), 'styles contain constructor warning warn state');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-support-panel'), 'styles contain compact constructor support panel classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-support-note'), 'styles contain compact constructor support note classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-shell.is-syncing'), 'styles contain constructor syncing state classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-form-actions > *'), 'styles normalize constructor action buttons');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-download-card'), 'styles contain constructor artifact download classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-stage.is-constructor-mode'), 'styles expose constructor workspace mode override for sticky preview');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '@media (min-width: 981px)'), 'styles expose sticky preview breakpoint for two-column constructor layout');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '@media (max-width: 980px) and (min-width: 761px)'), 'styles expose sticky preview breakpoint for single-column tablet constructor layout');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preview-panel-frame'), 'styles expose preview frame wrapper for floating constructor preview');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preview-panel.is-floating .constructor-preview-panel-frame'), 'styles expose fixed constructor preview fallback');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preview-panel.is-floating-dock .constructor-preview-panel-frame'), 'styles expose floating dock fallback for constructor preview');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preview-panel.is-floating-dock .constructor-progress-strip'), 'styles compact floating dock preview chrome');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-preview-panel.is-floating-dock {'), 'styles expose dedicated floating dock shell state for always-follow preview');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'max-height: calc(100vh - 20px);'), 'styles keep constructor preview scrollable on narrow screens');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-field-group-style .constructor-choice-card'), 'styles expose compact constructor style card layout');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.constructor-style-primary,'), 'styles expose dense constructor style grids');
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
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderSolutionLab'), 'frontend contains solution lab renderer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildConstructorCategoryFilters'), 'frontend contains solution lab category filter builder');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'groupConstructorFields'), 'frontend contains constructor field grouping helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, "label: 'Заполнение шаблона'"), 'frontend exposes constructor fill group before style controls');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, "label: 'Оформление'"), 'frontend exposes dedicated constructor style group');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'palette_tone'), 'frontend groups constructor palette tone inside style controls');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'isConstructorChoiceField'), 'frontend exposes constructor choice field helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'shouldAutoBuildConstructorField'), 'frontend exposes constructor auto-build helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildConstructorCompletion'), 'frontend exposes constructor completion helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'CONSTRUCTOR_DRAFT_STORAGE_KEY'), 'frontend exposes constructor draft storage key');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'loadConstructorDraft'), 'frontend exposes constructor draft restore helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'saveConstructorDraft'), 'frontend exposes constructor draft save helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'removeConstructorDraft'), 'frontend exposes constructor draft clear helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildConstructorWarnings'), 'frontend exposes constructor warning helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'applyConstructorLivePreview'), 'frontend exposes local constructor live preview helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'CONSTRUCTOR_LIVE_PREVIEW_FIELD_IDS'), 'frontend exposes live constructor preview field set');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'setWorkspaceStageMode'), 'frontend exposes workspace mode helper for constructor sticky preview');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructorPreviewPrefersNativeSticky'), 'frontend prefers native sticky preview before js fallback');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'is-constructor-mode'), 'frontend toggles constructor workspace mode class');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'scheduleConstructorPreviewFloatSync'), 'frontend exposes constructor preview floating sync helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'is-floating-dock'), 'frontend toggles floating dock mode for constructor preview');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructor-preview-panel-frame'), 'frontend renders preview frame wrapper for floating constructor preview');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructorPreviewUsesStackedLayout'), 'frontend keeps dedicated floating preview logic for stacked constructor layout');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'shouldConstructorPreviewStackedDock'), 'frontend keeps follow-mode helper for stacked constructor preview');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructor-style-more'), 'frontend exposes compact advanced style block');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeConstructorHandoff'), 'frontend exposes constructor handoff normalizer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructor-choice-card'), 'frontend renders constructor choice cards for style fields');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructor-field-accordion'), 'frontend renders constructor field accordions');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildConstructorGroupMeta'), 'frontend builds compact constructor accordion meta');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'captureConstructorViewState'), 'frontend captures constructor view state before silent rebuilds');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'restoreConstructorViewState'), 'frontend restores constructor view state after silent rebuilds');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'shouldRestoreConstructorPageScroll'), 'frontend guards page scroll restoration when user moved during rebuild');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'shouldKeepConstructorPageScroll'), 'frontend keeps constructor page scroll when no user scroll intent happened during rebuild');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructor-warning-list'), 'frontend renders constructor warnings near progress');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructor-draft-status'), 'frontend renders constructor draft status near progress');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildConstructorPresetsMarkup'), 'frontend renders constructor presets block');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'applyConstructorPreset'), 'frontend applies constructor presets');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'apply-constructor-preset'), 'frontend exposes constructor preset action');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderConstructorHandoff'), 'frontend renders constructor handoff block');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'if (!normalized.generated)'), 'frontend hides handoff until constructor build');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructor-handoff-panel'), 'frontend exposes constructor handoff panel classes');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderConstructorLoadingState'), 'frontend renders constructor-specific loading state before payload arrives');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructorOpenRequestId'), 'frontend guards constructor opening with request ids');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'userScrollIntentCounter'), 'frontend tracks user scroll intent during constructor rebuilds');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'Пакеты handoff'), 'frontend removed handoff heading from constructor ui');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'Основа из каталога'), 'frontend removed verbose catalog foundation heading');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'Подходящие разделы'), 'frontend exposes compact catalog guidance heading');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, '${buildConstructorPreviewMarkup(previewArtifact, previewLayout)}'), 'frontend renders constructor preview markup in preview panel');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, '${buildConstructorProgressMarkup(completion, previewArtifact, { warnings, draftMeta: payload?.draftMeta })}'), 'frontend renders constructor progress markup in preview panel');
$previewMarkupOffset = strpos($frontendTemplate, '${buildConstructorPreviewMarkup(previewArtifact, previewLayout)}');
$progressMarkupOffset = strpos($frontendTemplate, '${buildConstructorProgressMarkup(completion, previewArtifact, { warnings, draftMeta: payload?.draftMeta })}');
assert_true($previewMarkupOffset !== false && $progressMarkupOffset !== false && $previewMarkupOffset < $progressMarkupOffset, 'frontend renders constructor preview before progress strip to avoid inner preview scrolling');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderConstructorErrorState'), 'frontend exposes constructor error state helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'Не удалось открыть конструктор'), 'frontend exposes constructor retry copy');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderWorkspaceErrorState'), 'frontend exposes generic workspace error state helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeWorkspaceErrorMessage'), 'frontend exposes readable workspace error message normalizer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildConstructorPreviewLayout'), 'frontend contains constructor preview layout helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'readConstructorPreviewBoxMetrics'), 'frontend contains preview box metrics helper');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'resolveConstructorSvgDownloadMarkup'), 'frontend resolves svg download from current preview state');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'constructor-summary-panel'), 'frontend removed verbose constructor summary panel');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, "item.artifactKind === 'brief' ? 'SVG + brief' : 'SVG шаблон'"), 'frontend removed verbose solution artifact pills');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'openConstructor'), 'frontend contains constructor opener');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildConstructor('), 'frontend contains constructor build action');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'reset-constructor'), 'frontend contains constructor reset action');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'download-artifact'), 'frontend contains constructor artifact download action');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'download-artifact-png'), 'frontend contains constructor png download action');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'constructor-form'), 'frontend renders constructor form');
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
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, "querySelectorAll('.consultant-turn.assistant')"), 'frontend aligns transcript to the top of the latest assistant turn');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeConsultantIntents'), 'frontend normalizes consultant intents');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildConsultantStarterQueries'), 'frontend builds consultant starter prompts inside dialog');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeConsultantFollowUps'), 'frontend normalizes consultant follow-up cards');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeConsultantContext'), 'frontend normalizes consultant memory context');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildConsultantMemoryPayload'), 'frontend serializes consultant memory payload');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeConsultantAdvice'), 'frontend normalizes consultant advice');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'normalizeConsultantDeepAnswer'), 'frontend normalizes consultant deep answer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'consultant-understanding'), 'frontend renders consultant understanding section');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'consultantHistory'), 'frontend tracks consultant transcript history');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'clear-consultant'), 'frontend handles consultant clear action');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'consultantAdviceBlock'), 'frontend renders consultant advice block');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'consultantDeepAnswerBlock'), 'frontend renders consultant deep answer block');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'payload?.deepAnswer'), 'frontend reads consultant deep answer payload');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'можно ли менять цвет'), 'frontend mentions consultant color-rule examples');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'что делать на тёмном фоне'), 'frontend mentions deeper consultant follow-up examples');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'что отправить подрядчику'), 'frontend mentions consultant follow-up examples inside dialog');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'consultant-intent'), 'frontend removed top consultant intent action flow');
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
assert_true($apiTemplate !== false && str_contains($apiTemplate, "case 'constructor'"), 'api exposes constructor action');
assert_true($apiTemplate !== false && str_contains($apiTemplate, "case 'construct'"), 'api exposes construct action');
assert_true($apiTemplate !== false && str_contains($apiTemplate, 'invalid_json'), 'api validates constructor json body');
assert_true($apiTemplate !== false && str_contains($apiTemplate, 'memory_intent'), 'api accepts consultant memory parameters');
assert_true($apiTemplate !== false && str_contains($apiTemplate, 'memory_focus'), 'api accepts consultant memory focus parameter');

$envExampleTemplate = file_get_contents(dirname(__DIR__) . '/.env.example');
assert_true($envExampleTemplate !== false && str_contains($envExampleTemplate, 'CONSULTANT_LLM_ENABLED=0'), 'env example exposes consultant llm flag');
assert_true($envExampleTemplate !== false && str_contains($envExampleTemplate, 'OPENAI_API_KEY='), 'env example exposes openai api key');
assert_true($envExampleTemplate !== false && str_contains($envExampleTemplate, 'OPENAI_MODEL=gpt-5'), 'env example exposes openai model');

$deployScriptTemplate = file_get_contents(dirname(__DIR__, 2) . '/scripts/deploy_regru_php_site.sh');
assert_true($deployScriptTemplate !== false && str_contains($deployScriptTemplate, 'OPENAI_API_KEY'), 'deploy script forwards openai key');
assert_true($deployScriptTemplate !== false && str_contains($deployScriptTemplate, 'CONSULTANT_LLM_ENABLED'), 'deploy script forwards consultant llm toggle');
assert_true($deployScriptTemplate !== false && str_contains($deployScriptTemplate, 'upsert_remote_env'), 'deploy script upserts remote env values');

$deployWorkflowTemplate = file_get_contents(dirname(__DIR__, 2) . '/.github/workflows/deploy_regru_php_site.yml');
assert_true($deployWorkflowTemplate !== false && str_contains($deployWorkflowTemplate, 'OPENAI_API_KEY'), 'deploy workflow exposes openai key secret');
assert_true($deployWorkflowTemplate !== false && str_contains($deployWorkflowTemplate, 'CONSULTANT_LLM_ENABLED'), 'deploy workflow exposes consultant llm secret');

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

$adaptiveText = constructor_svg_render_text(
    100,
    100,
    constructor_svg_wrap_lines('Очень длинный заголовок для проверки автоматического масштаба в ограниченном поле', 16, 2),
    'headline',
    ['maxWidth' => 180, 'maxHeight' => 82, 'minFontSize' => 24]
);
assert_true(str_contains($adaptiveText, 'font-size:'), 'adaptive svg text injects inline font size');
preg_match('/font-size:([0-9.]+)px/', $adaptiveText, $adaptiveTextMatch);
assert_true(isset($adaptiveTextMatch[1]), 'adaptive svg text exposes computed font size');
assert_true((float) $adaptiveTextMatch[1] < 92.0, 'adaptive svg text reduces font size for tight blocks');
$hyphenatedWrap = constructor_svg_wrap_lines_meta('Александрова-Виноградова', 14, 2);
assert_true(($hyphenatedWrap['lines'][0] ?? '') === 'Александрова-', 'adaptive wrap prefers natural split after hyphen for long tokens');
assert_true(($hyphenatedWrap['lines'][1] ?? '') === 'Виноградова', 'adaptive wrap keeps remaining token on next line');
assert_true(($hyphenatedWrap['truncated'] ?? true) === false, 'adaptive wrap does not falsely truncate a clean hyphen split');
$businessCardFit = constructor_svg_fit_text_block(
    'Александрова-Виноградова Екатерина Константиновна-Петрова',
    'headline',
    432,
    190,
    3,
    ['minFontSize' => 26]
);
assert_true(($businessCardFit['truncated'] ?? true) === false, 'business card full name fit prefers readable non-truncated layout');
assert_true(count($businessCardFit['lines'] ?? []) >= 2, 'business card full name fit uses multi-line layout for long fio');
assert_true((float) ($businessCardFit['fontSize'] ?? 0.0) < 92.0, 'business card full name fit reduces font size from default headline scale');
$styleLabels = constructor_color_variant_labels();
assert_true(($styleLabels['cmyk'] ?? '') === 'CMYK для печати', 'constructor exposes grounded cmyk color variant label');
assert_true((constructor_brand_lockup_labels()['logo'] ?? '') === 'Логотип с надписью', 'constructor exposes grounded logo lockup label');
assert_true((constructor_graphic_element_labels()['mark_yamal'] ?? '') === 'Знак Ямал', 'constructor exposes grounded graphic element label');
assert_true((constructor_graphic_element_labels()['logo_band'] ?? '') === 'Лента логотипов', 'constructor exposes expanded logo band graphic element label');
assert_true((constructor_graphic_element_labels()['lockup_bridge'] ?? '') === 'Логотип + знак', 'constructor exposes expanded bridge graphic element label');
assert_true((constructor_design_variant_labels()['poster'] ?? '') === 'Плакатный', 'constructor exposes grounded design variant label');
assert_true((constructor_design_variant_labels()['monument'] ?? '') === 'Монументальный', 'constructor exposes expanded monument design variant label');
assert_true((constructor_design_variant_labels()['gallery'] ?? '') === 'Галерейный', 'constructor exposes expanded gallery design variant label');
assert_true((constructor_background_style_labels()['pattern'] ?? '') === 'Сетка из знака', 'constructor exposes grounded background element label');
assert_true((constructor_background_style_labels()['corner'] ?? '') === 'Угловой акцент', 'constructor exposes extended grounded background option');
assert_true((constructor_background_style_labels()['split'] ?? '') === 'Разделённая сцена', 'constructor exposes expanded split background option');
assert_true((constructor_background_style_labels()['rail'] ?? '') === 'Опорная рейка', 'constructor exposes expanded rail background option');
assert_true((constructor_palette_tone_labels()['ivory'] ?? '') === 'Мамонтовая кость', 'constructor exposes grounded palette tone label from supplied palette');
$graphicElementOptions = constructor_graphic_element_options();
assert_true(count($graphicElementOptions) >= 9, 'constructor exposes expanded grounded graphic element options');
$graphicOptionLabels = [];
foreach ($graphicElementOptions as $option) {
    $graphicOptionLabels[(string) ($option['value'] ?? '')] = (string) ($option['label'] ?? '');
}
assert_true(($graphicOptionLabels['group_1410103616'] ?? '') === 'Group 1410103616', 'constructor keeps grounded supplied group option by id');
assert_true(($graphicOptionLabels['logo_band'] ?? '') === 'Лента логотипов', 'constructor exposes logo band option in style controls');
assert_true(str_contains(($graphicOptionLabels['logo_white'] ?? ''), 'White'), 'constructor exposes white graphic lockup option copy');
$paletteOptions = constructor_palette_tone_options();
$accentPaletteOption = null;
$ivoryPaletteOption = null;
foreach ($paletteOptions as $option) {
    if (($option['value'] ?? '') === 'accent') {
        $accentPaletteOption = $option;
    }
    if (($option['value'] ?? '') === 'ivory') {
        $ivoryPaletteOption = $option;
    }
}
assert_true((string) ($accentPaletteOption['swatch'] ?? '') === '#C40E3D', 'constructor exposes supplied red palette swatch metadata for style cards');
assert_true((string) ($ivoryPaletteOption['swatchSoft'] ?? '') === '#FFF9F0', 'constructor exposes supplied light palette tint metadata for style cards');
assert_true(str_contains((string) (constructor_color_variant_options()[3]['description'] ?? ''), 'Белая'), 'constructor exposes descriptive text for color variant cards');
assert_true(str_contains((string) (constructor_design_variant_options()[1]['description'] ?? ''), 'Редак'), 'constructor exposes descriptive text for design cards');
assert_true(
    array_reduce(
        constructor_background_style_options(),
        static fn(bool $carry, array $item): bool => $carry || (($item['value'] ?? '') === 'capsule' && str_contains((string) ($item['description'] ?? ''), 'округл')),
        false
    ),
    'constructor exposes descriptive text for capsule background cards'
);
assert_true((constructor_theme_palette('color', 'r6034')['tone'] ?? '') === '#D1E2E2', 'constructor theme palette exposes supplied RAL 6034 background tone');

$styledConstructorIds = ['business_card', 'nameplate', 'information_stand', 'room_navigation_sign', 'presentation_deck', 'certificate', 'badge', 'social_post', 'letterhead', 'rollup'];
foreach ($styledConstructorIds as $styledConstructorId) {
    $styledDefinition = constructor_definition_by_id($styledConstructorId);
    assert_true($styledDefinition !== null, $styledConstructorId . ' constructor definition exists for style controls');
    $styledFieldIds = array_map(static fn(array $field): string => (string) ($field['id'] ?? ''), $styledDefinition['fields'] ?? []);
    assert_true(in_array('color_variant', $styledFieldIds, true), $styledConstructorId . ' exposes color variant field');
    assert_true(in_array('brand_lockup', $styledFieldIds, true), $styledConstructorId . ' exposes brand lockup field');
    assert_true(in_array('graphic_element', $styledFieldIds, true), $styledConstructorId . ' exposes graphic element field');
    assert_true(in_array('design_variant', $styledFieldIds, true), $styledConstructorId . ' exposes design variant field');
    assert_true(in_array('background_style', $styledFieldIds, true), $styledConstructorId . ' exposes background style field');
    assert_true(in_array('palette_tone', $styledFieldIds, true), $styledConstructorId . ' exposes palette tone field');
}

$businessCardDefinition = constructor_definition_by_id('business_card');
assert_true($businessCardDefinition !== null, 'business card constructor definition exists');
$presentedBusinessCard = constructor_present_definition($businessCardDefinition);
$cityField = null;
$designField = null;
$graphicElementField = null;
$paletteToneField = null;
foreach (($presentedBusinessCard['fields'] ?? []) as $field) {
    if (($field['id'] ?? '') === 'city') {
        $cityField = $field;
    }
    if (($field['id'] ?? '') === 'graphic_element') {
        $graphicElementField = $field;
    }
    if (($field['id'] ?? '') === 'design_variant') {
        $designField = $field;
    }
    if (($field['id'] ?? '') === 'palette_tone') {
        $paletteToneField = $field;
    }
}
assert_true(is_array($cityField), 'constructor present definition exposes free locality field');
assert_true(($cityField['type'] ?? '') === 'text', 'constructor locality field is free text');
assert_true(($cityField['label'] ?? '') === 'Населённый пункт', 'constructor locality field uses settlement label');
assert_true(($cityField['default'] ?? '__missing__') === '', 'constructor locality field defaults to empty state');
assert_true(is_array($graphicElementField), 'constructor present definition exposes graphic element field');
assert_true(($graphicElementField['default'] ?? '') === 'mark_yamal', 'constructor graphic element field defaults to grounded sign mode');
assert_true((string) (($graphicElementField['options'][2]['label'] ?? '')) === 'Group 2087328779', 'constructor present definition keeps supplied group option label');
assert_true(is_array($designField), 'constructor present definition exposes design field');
assert_true(($designField['default'] ?? '') === 'calm', 'constructor design field defaults to calm mode');
assert_true(is_array($paletteToneField), 'constructor present definition exposes palette tone field');
assert_true(str_contains((string) ($paletteToneField['options'][0]['description'] ?? ''), 'Pantone'), 'constructor present definition keeps supplied palette option descriptions');
$presentedAccentOption = null;
$presentedIvoryOption = null;
foreach (($paletteToneField['options'] ?? []) as $option) {
    if (($option['value'] ?? '') === 'accent') {
        $presentedAccentOption = $option;
    }
    if (($option['value'] ?? '') === 'ivory') {
        $presentedIvoryOption = $option;
    }
}
assert_true((string) ($presentedAccentOption['swatch'] ?? '') === '#C40E3D', 'constructor present definition keeps supplied palette swatch metadata');
assert_true((string) ($presentedIvoryOption['swatchSoft'] ?? '') === '#FFF9F0', 'constructor present definition keeps supplied palette tint metadata');
$businessCardPresets = constructor_present_presets($businessCardDefinition, constructor_default_input($businessCardDefinition));
assert_true(count($businessCardPresets) >= 3, 'constructor exposes multiple grounded presets for business card');
assert_true(($businessCardPresets[0]['active'] ?? false) === true, 'constructor marks default preset as active');
assert_true(($businessCardPresets[1]['overrides']['color_variant'] ?? '') === 'cmyk', 'constructor preset exposes override payload');
assert_true(($businessCardPresets[1]['overrides']['design_variant'] ?? '') === 'editorial', 'constructor preset exposes grounded design override');
$styledBusinessCardInput = constructor_normalize_input($businessCardDefinition, [
    'city' => 'салехард',
    'full_name' => 'Александрова-Виноградова Екатерина Константиновна-Петрова',
    'role' => 'Руководитель стратегических коммуникаций',
    'phone' => '+7 999 123-45-67',
    'email' => 'team@yamal.ru',
    'department' => 'Департамент коммуникаций',
    'color_variant' => 'black',
    'brand_lockup' => 'logo',
    'graphic_element' => 'group_2087328779',
    'design_variant' => 'poster',
    'background_style' => 'pattern',
    'palette_tone' => 'accent',
]);
$styledBusinessCardDerived = constructor_derived_payload($businessCardDefinition, $styledBusinessCardInput);
assert_true(($styledBusinessCardDerived['colorVariantLabel'] ?? '') === 'Black', 'constructor derived payload exposes selected color variant label');
assert_true(($styledBusinessCardDerived['brandLockupLabel'] ?? '') === 'Логотип с надписью', 'constructor derived payload exposes selected brand lockup label');
assert_true(($styledBusinessCardDerived['graphicElementLabel'] ?? '') === 'Group 2087328779', 'constructor derived payload exposes selected graphic element label');
assert_true(($styledBusinessCardDerived['designVariantLabel'] ?? '') === 'Плакатный', 'constructor derived payload exposes selected design variant label');
assert_true(($styledBusinessCardDerived['backgroundStyleLabel'] ?? '') === 'Сетка из знака', 'constructor derived payload exposes selected background style label');
assert_true(($styledBusinessCardDerived['paletteToneLabel'] ?? '') === 'Фирменный красный', 'constructor derived payload exposes selected supplied palette tone label');
assert_true(($styledBusinessCardDerived['compositionLabel'] ?? '') === 'Плакатная композиция', 'constructor derived payload exposes adaptive composition label');
assert_true(
    constructor_resolve_brand_asset_variant($styledBusinessCardInput, constructor_theme_palette('black', 'accent')) === 'white',
    'constructor auto-selects white brand assets for dark palette tone'
);
$styledBusinessCardSvg = constructor_svg_artifact($businessCardDefinition, $styledBusinessCardInput);
assert_true($styledBusinessCardSvg !== null, 'styled business card svg artifact exists');
$styledBusinessCardContent = (string) ($styledBusinessCardSvg['content'] ?? '');
assert_true(str_contains($styledBusinessCardContent, '--ctor-accent:#182A31'), 'black color variant remaps accent color in live svg theme vars');
assert_true(substr_count($styledBusinessCardContent, '<image ') >= 5, 'pattern background style adds repeated grounded mark elements');
assert_true(str_contains($styledBusinessCardContent, '--ctor-lockup-fill:#C40E3D'), 'business card svg uses selected supplied palette tone for adaptive lockup panel');
assert_true(str_contains($styledBusinessCardContent, 'data-constructor-design-style="poster"'), 'constructor svg exposes design variant layers for live preview');
assert_true(str_contains($styledBusinessCardContent, 'data-constructor-graphic-element="group_2087328779"'), 'constructor svg exposes toggleable graphic element groups for live preview');

$expandedBusinessCardInput = constructor_normalize_input($businessCardDefinition, [
    'full_name' => 'Анна Куликова',
    'role' => 'Руководитель направления',
    'phone' => '+7 900 000-00-01',
    'email' => 'design@yamal.ru',
    'department' => 'Лаборатория решений',
    'graphic_element' => 'lockup_bridge',
    'design_variant' => 'monument',
    'background_style' => 'split',
    'palette_tone' => 'p621',
    'brand_lockup' => 'logo',
]);
$expandedBusinessCardDerived = constructor_derived_payload($businessCardDefinition, $expandedBusinessCardInput);
assert_true(($expandedBusinessCardDerived['graphicElementLabel'] ?? '') === 'Логотип + знак', 'constructor derived payload exposes expanded bridge graphic element label');
assert_true(($expandedBusinessCardDerived['designVariantLabel'] ?? '') === 'Монументальный', 'constructor derived payload exposes expanded monument design variant label');
assert_true(($expandedBusinessCardDerived['backgroundStyleLabel'] ?? '') === 'Разделённая сцена', 'constructor derived payload exposes expanded split background label');
$expandedBusinessCardSvg = constructor_svg_artifact($businessCardDefinition, $expandedBusinessCardInput);
assert_true($expandedBusinessCardSvg !== null, 'expanded business card svg artifact exists');
$expandedBusinessCardContent = (string) ($expandedBusinessCardSvg['content'] ?? '');
assert_true(str_contains($expandedBusinessCardContent, 'data-constructor-design-style="monument"'), 'constructor svg exposes expanded monument design layer for live preview');
assert_true(str_contains($expandedBusinessCardContent, 'data-constructor-bg-style="split"'), 'constructor svg exposes expanded split background layer for live preview');
assert_true(str_contains($expandedBusinessCardContent, 'data-constructor-graphic-element="lockup_bridge"'), 'constructor svg exposes expanded bridge graphic element group for live preview');
assert_true(substr_count($expandedBusinessCardContent, '<image ') >= 4, 'expanded business card svg uses additional grounded brand assets in monument scene');

$whiteBusinessCardSvg = constructor_svg_artifact($businessCardDefinition, constructor_normalize_input($businessCardDefinition, [
    'color_variant' => 'white',
    'brand_lockup' => 'logo',
    'design_variant' => 'editorial',
    'background_style' => 'frame',
]));
assert_true($whiteBusinessCardSvg !== null, 'white business card svg artifact exists');
assert_true(str_contains((string) ($whiteBusinessCardSvg['content'] ?? ''), '--ctor-bg:#FFF9F0'), 'white color variant keeps palette-tinted canvas instead of forcing a dark page theme');
assert_true(str_contains((string) ($whiteBusinessCardSvg['content'] ?? ''), '--ctor-ink:#182A31'), 'white color variant keeps readable dark text outside the reversed lockup');

$logoWhiteGraphicBusinessCard = constructor_normalize_input($businessCardDefinition, [
    'color_variant' => 'color',
    'brand_lockup' => 'logo',
    'graphic_element' => 'logo_white',
    'design_variant' => 'poster',
    'background_style' => 'watermark',
    'palette_tone' => 'ivory',
]);
$logoWhiteGraphicBusinessCardSvg = constructor_svg_artifact($businessCardDefinition, $logoWhiteGraphicBusinessCard);
assert_true($logoWhiteGraphicBusinessCardSvg !== null, 'logo white graphic business card svg artifact exists');
assert_true(str_contains((string) ($logoWhiteGraphicBusinessCardSvg['content'] ?? ''), 'data-constructor-force-variant="white"'), 'constructor svg keeps forced white variant metadata for dedicated white graphic elements');

$lightMarkBusinessCard = constructor_normalize_input($businessCardDefinition, [
    'color_variant' => 'white',
    'brand_lockup' => 'mark',
    'design_variant' => 'signal',
    'background_style' => 'clean',
    'palette_tone' => 'p621',
]);
assert_true(
    constructor_resolve_brand_asset_variant($lightMarkBusinessCard, constructor_theme_palette('white', 'p621')) === 'white',
    'white firm mark can be manually laid over any supplied palette color'
);

$socialHeadlineFit = constructor_svg_fit_text_block(
    'Новая система брендированных решений для муниципальных и событийных коммуникаций Ямала в едином цифровом каркасе',
    'headline',
    920,
    356,
    5,
    ['minFontSize' => 18, 'widthSafety' => 0.82, 'heightSafety' => 0.84]
);
assert_true(($socialHeadlineFit['truncated'] ?? true) === false, 'social post headline fit keeps full long headline inside safe area');
assert_true(count($socialHeadlineFit['lines'] ?? []) >= 3, 'social post headline fit uses multiline layout for long headline');
$lightMarkBusinessCardSvg = constructor_svg_artifact($businessCardDefinition, $lightMarkBusinessCard);
assert_true($lightMarkBusinessCardSvg !== null, 'light mark business card svg artifact exists');
assert_true(str_contains((string) ($lightMarkBusinessCardSvg['content'] ?? ''), '--ctor-bg:#F7FBF8'), 'white firm mark keeps the selected light palette visible on the canvas');
assert_true(str_contains((string) ($lightMarkBusinessCardSvg['content'] ?? ''), '--ctor-lockup-fill:#C40E3D'), 'white firm mark keeps a contrast accent panel when light palette would be too pale for reversed lockup');

$certificateDefinition = constructor_definition_by_id('certificate');
assert_true($certificateDefinition !== null, 'certificate constructor definition exists');
$certificateDefaults = constructor_default_input($certificateDefinition);
assert_true(($certificateDefaults['design_variant'] ?? '') === 'calm', 'certificate constructor defaults to calm design');
assert_true(($certificateDefaults['background_style'] ?? '') === 'clean', 'certificate constructor defaults to clean background');
$certificatePresets = constructor_present_presets($certificateDefinition, $certificateDefaults);
assert_true(($certificatePresets[0]['overrides']['design_variant'] ?? '') === 'calm', 'certificate official preset keeps calm design override');
assert_true(($certificatePresets[0]['overrides']['background_style'] ?? '') === 'clean', 'certificate official preset keeps clean background override');
$defaultCertificateSvg = constructor_svg_artifact($certificateDefinition, constructor_normalize_input($certificateDefinition, [
    'city' => 'салехард',
    'recipient' => 'Анна Куликова',
    'reason' => 'за системное развитие брендированных материалов региона',
    'event_name' => 'Форум брендовых решений',
    'signer' => 'Директор проектного офиса коммуникаций',
    'issue_date' => '2026-03-12',
]));
assert_true($defaultCertificateSvg !== null, 'default certificate svg artifact exists');
$defaultCertificateContent = (string) ($defaultCertificateSvg['content'] ?? '');
assert_true(str_contains($defaultCertificateContent, 'data-certificate-header="centered-wordmark"'), 'certificate svg keeps centered wordmark header');
assert_true(!str_contains($defaultCertificateContent, 'x="86" y="88"'), 'certificate svg no longer uses the old top-left lockup placement');
assert_true(str_contains($defaultCertificateContent, 'y1="258"'), 'certificate svg keeps the first divider lower to preserve a safer lockup zone');
assert_true(str_contains($defaultCertificateContent, 'y="200"'), 'certificate svg keeps city label lower under the centered lockup');
assert_true(!str_contains($defaultCertificateContent, 'y1="242"'), 'certificate svg no longer keeps the old tighter divider under the lockup');
$markCertificateSvg = constructor_svg_artifact($certificateDefinition, constructor_normalize_input($certificateDefinition, [
    'city' => 'салехард',
    'recipient' => 'Анна Куликова',
    'reason' => 'за развитие навигации и событийных коммуникаций',
    'event_name' => 'Форум брендовых решений',
    'signer' => 'Директор проектного офиса коммуникаций',
    'issue_date' => '2026-03-12',
    'brand_lockup' => 'mark',
    'design_variant' => 'signal',
    'background_style' => 'halo',
]));
assert_true($markCertificateSvg !== null, 'mark certificate svg artifact exists');
assert_true(str_contains((string) ($markCertificateSvg['content'] ?? ''), 'data-certificate-header="centered-mark"'), 'certificate svg keeps centered mark header for mark mode');

$logoBandPosterBusinessCardSvg = constructor_svg_artifact($businessCardDefinition, constructor_normalize_input($businessCardDefinition, [
    'full_name' => 'Анна Куликова',
    'role' => 'Руководитель проекта',
    'phone' => '+7 900 000-00-01',
    'email' => 'design@yamal.ru',
    'department' => 'Лаборатория решений',
    'graphic_element' => 'logo_band',
    'design_variant' => 'poster',
    'background_style' => 'clean',
    'brand_lockup' => 'logo',
]));
assert_true($logoBandPosterBusinessCardSvg !== null, 'logo band poster business card svg artifact exists');
$logoBandPosterBusinessCardContent = (string) ($logoBandPosterBusinessCardSvg['content'] ?? '');
assert_true(str_contains($logoBandPosterBusinessCardContent, 'data-constructor-variant-image="design-logo-band"'), 'logo band poster scene still renders decorative logo assets');
assert_true(str_contains($logoBandPosterBusinessCardContent, 'x="630" y="390"'), 'logo band poster scene keeps the main decorative logo near the lower edge instead of the text center');
assert_true(str_contains($logoBandPosterBusinessCardContent, 'x="72" y="410"'), 'logo band poster scene keeps the secondary decorative logo near the lower edge instead of the text center');

$nameplateDefinition = constructor_definition_by_id('nameplate');
assert_true($nameplateDefinition !== null, 'nameplate constructor definition exists');
assert_true(count(constructor_present_presets($nameplateDefinition, constructor_test_defaults($nameplateDefinition))) >= 4, 'nameplate constructor exposes expanded preset set');
assert_true(
    array_reduce(
        $nameplateDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'variant',
        false
    ),
    'nameplate constructor exposes variant field'
);
assert_true(
    array_reduce(
        $nameplateDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'room_number',
        false
    ),
    'nameplate constructor exposes room number field'
);
assert_true(
    array_reduce(
        $nameplateDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'direction',
        false
    ),
    'nameplate constructor exposes direction field'
);

$nameplateSvg = constructor_svg_artifact($nameplateDefinition, constructor_normalize_input($nameplateDefinition, [
    'city' => 'салехард',
    'variant' => 'navigation',
    'location' => 'Сектор деловой программы',
    'room_number' => 'B-204',
    'subline' => '2 этаж • блок Б',
    'size_variant' => '400x160',
    'mount' => 'door',
    'direction' => 'right',
]));
assert_true($nameplateSvg !== null, 'nameplate svg artifact exists');
assert_true(str_contains((string) ($nameplateSvg['content'] ?? ''), 'B-204'), 'nameplate svg exposes room number');
assert_true(!str_contains((string) ($nameplateSvg['content'] ?? ''), 'Навигационная'), 'nameplate svg hides variant label from the visible plate');
assert_true(!str_contains((string) ($nameplateSvg['content'] ?? ''), 'Направо'), 'nameplate svg hides direction copy from the visible plate');
assert_true(!str_contains((string) ($nameplateSvg['content'] ?? ''), 'Номер'), 'nameplate svg hides the room number caption');
assert_true(!str_contains((string) ($nameplateSvg['content'] ?? ''), '400x160'), 'nameplate svg hides size metadata from the visible plate');
assert_true(str_contains((string) ($nameplateSvg['content'] ?? ''), 'font-size:'), 'nameplate svg uses adaptive text sizing');

$informationStandDefinition = constructor_definition_by_id('information_stand');
assert_true($informationStandDefinition !== null, 'information stand constructor definition exists');
assert_true(count(constructor_present_presets($informationStandDefinition, constructor_test_defaults($informationStandDefinition))) >= 4, 'information stand constructor exposes expanded preset set');
assert_true(
    array_reduce(
        $informationStandDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'stand_type',
        false
    ),
    'information stand constructor exposes stand type field'
);
assert_true(
    array_reduce(
        $informationStandDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'section_one_body',
        false
    ),
    'information stand constructor exposes content block field'
);
assert_true(
    array_reduce(
        $informationStandDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'size_variant',
        false
    ),
    'information stand constructor exposes size field'
);
$informationStandSizeField = null;
foreach (($informationStandDefinition['fields'] ?? []) as $field) {
    if (($field['id'] ?? '') === 'size_variant') {
        $informationStandSizeField = $field;
        break;
    }
}
assert_true(is_array($informationStandSizeField), 'information stand exposes size field definition');
assert_true(count($informationStandSizeField['options'] ?? []) === 7, 'information stand exposes fixed A4 pocket variants');
assert_true((string) (($informationStandSizeField['options'][0]['label'] ?? '')) === '1 карман A4 • 300–400 мм', 'information stand keeps one-pocket label');
assert_true((string) (($informationStandSizeField['options'][6]['label'] ?? '')) === '12 карманов A4 • 1060×1230 мм', 'information stand keeps twelve-pocket label');
$informationStandSvg = constructor_svg_artifact($informationStandDefinition, constructor_normalize_input($informationStandDefinition, [
    'city' => 'салехард',
    'stand_type' => 'schedule',
    'headline' => 'Центр поддержки предпринимательства',
    'subtitle' => 'Режим работы, правила посещения и схема зоны',
    'section_one_title' => 'Сегодня',
    'section_one_body' => "Пн-Пт 08:30-18:00\nСб-Вс выходной",
    'section_two_title' => 'В помещении',
    'section_two_body' => "Регистрация — 1 этаж\nПереговорные — 2 этаж",
    'contact_line' => 'brand@yamal.ru • +7 900 000-00-00',
    'size_variant' => 'a4x4',
]));
assert_true($informationStandSvg !== null, 'information stand svg artifact exists');
assert_true(str_contains((string) ($informationStandSvg['content'] ?? ''), 'Центр поддержки предпринимательства'), 'information stand svg keeps the editable headline');
assert_true(!str_contains((string) ($informationStandSvg['content'] ?? ''), 'Режим / график'), 'information stand svg hides stand type label');
assert_true(!str_contains((string) ($informationStandSvg['content'] ?? ''), '4 кармана A4'), 'information stand svg hides pocket count metadata');
assert_true(!str_contains((string) ($informationStandSvg['content'] ?? ''), '540×800 мм'), 'information stand svg hides physical size metadata');
assert_true(!str_contains((string) ($informationStandSvg['content'] ?? ''), 'Карман 4'), 'information stand svg hides internal pocket captions');
assert_true(str_contains((string) ($informationStandSvg['content'] ?? ''), 'font-size:'), 'information stand svg uses adaptive text sizing');

$roomNavigationDefinition = constructor_definition_by_id('room_navigation_sign');
assert_true($roomNavigationDefinition !== null, 'room navigation sign constructor definition exists');
assert_true(count(constructor_present_presets($roomNavigationDefinition, constructor_test_defaults($roomNavigationDefinition))) >= 4, 'room navigation sign constructor exposes expanded preset set');
assert_true(
    array_reduce(
        $roomNavigationDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'destination',
        false
    ),
    'room navigation sign constructor exposes destination field'
);
assert_true(
    array_reduce(
        $roomNavigationDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'floor_label',
        false
    ),
    'room navigation sign constructor exposes floor label field'
);
assert_true(
    array_reduce(
        $roomNavigationDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'direction',
        false
    ),
    'room navigation sign constructor exposes direction field'
);
$roomNavigationSvg = constructor_svg_artifact($roomNavigationDefinition, constructor_normalize_input($roomNavigationDefinition, [
    'city' => 'салехард',
    'destination' => 'Переговорные и проектные офисы',
    'route_hint' => 'Через атриум • блок Б',
    'room_number' => 'B-204',
    'floor_label' => '3 этаж',
    'direction' => 'left',
    'mount' => 'ceiling',
    'size_variant' => '600x220',
]));
assert_true($roomNavigationSvg !== null, 'room navigation sign svg artifact exists');
assert_true(str_contains((string) ($roomNavigationSvg['content'] ?? ''), 'Переговорные и'), 'room navigation sign svg keeps the first line of the editable destination');
assert_true(str_contains((string) ($roomNavigationSvg['content'] ?? ''), 'проектные офисы'), 'room navigation sign svg keeps the second line of the editable destination');
assert_true(str_contains((string) ($roomNavigationSvg['content'] ?? ''), '3 этаж'), 'room navigation sign svg exposes floor label');
assert_true(!str_contains((string) ($roomNavigationSvg['content'] ?? ''), 'Навигация по помещениям'), 'room navigation sign svg hides purpose label');
assert_true(!str_contains((string) ($roomNavigationSvg['content'] ?? ''), 'Налево'), 'room navigation sign svg hides direction label');
assert_true(!str_contains((string) ($roomNavigationSvg['content'] ?? ''), '600x220'), 'room navigation sign svg hides size metadata');
assert_true(!str_contains((string) ($roomNavigationSvg['content'] ?? ''), 'Подвесное'), 'room navigation sign svg hides mount metadata');
assert_true(str_contains((string) ($roomNavigationSvg['content'] ?? ''), 'font-size:'), 'room navigation sign svg uses adaptive text sizing');

$presentationDefinition = constructor_definition_by_id('presentation_deck');
assert_true($presentationDefinition !== null, 'presentation constructor definition exists');
assert_true(count(constructor_present_presets($presentationDefinition, constructor_test_defaults($presentationDefinition))) >= 4, 'presentation constructor exposes expanded preset set');
assert_true(
    array_reduce(
        $presentationDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'presentation_mode',
        false
    ),
    'presentation constructor exposes mode field'
);
assert_true(
    array_reduce(
        $presentationDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'key_message',
        false
    ),
    'presentation constructor exposes key message field'
);
assert_true(
    array_reduce(
        $presentationDefinition['fields'] ?? [],
        static fn(bool $carry, array $field): bool => $carry || (string) ($field['id'] ?? '') === 'structure',
        false
    ),
    'presentation constructor exposes structure field'
);

$presentationInput = constructor_normalize_input($presentationDefinition, [
    'city' => 'салехард',
    'presentation_mode' => 'pitch',
    'title' => 'Ямал: пространство для инвестиций',
    'event_name' => 'Арктический форум',
    'key_message' => 'Показываем, почему регион удобен для партнёрских проектов.',
    'structure' => "1. Контекст рынка\n2. Доказательство и кейсы\n3. Следующий шаг",
    'speaker' => 'Ирина Полярная',
    'speaker_role' => 'Директор проектов',
    'audience' => 'Партнёры',
    'slide_count' => '14',
]);
$presentationPayload = constructor_brief_payload($presentationDefinition, $presentationInput, ['sections' => [], 'items' => [], 'advice' => []]);
assert_true(($presentationPayload['derived']['presentationModeLabel'] ?? '') === 'Партнёрский питч', 'presentation brief payload exposes mode label');
assert_true(($presentationPayload['derived']['outline'][1] ?? '') === 'Доказательство и кейсы', 'presentation brief payload exposes outline list');

$presentationHtml = constructor_html_brief_artifact($presentationDefinition, $presentationInput, [
    'sections' => [['label' => 'Брендбук Салехард']],
    'items' => [['label' => 'Салехард логотип.svg']],
    'advice' => ['title' => 'По брендбуку', 'summary' => 'Проверьте логотип и мастер-слайды.'],
]);
assert_true(str_contains((string) ($presentationHtml['content'] ?? ''), 'Паспорт презентации'), 'presentation html brief exposes presentation passport section');
assert_true(str_contains((string) ($presentationHtml['content'] ?? ''), 'Ключевое сообщение'), 'presentation html brief exposes key message section');
assert_true(str_contains((string) ($presentationHtml['content'] ?? ''), 'Структура слайдов'), 'presentation html brief exposes outline section');
assert_true(str_contains((string) ($presentationHtml['content'] ?? ''), 'Арктический форум'), 'presentation html brief exposes event name');
assert_true(str_contains((string) ($presentationHtml['content'] ?? ''), 'Партнёрский питч'), 'presentation html brief exposes selected mode label');
assert_true(str_contains((string) ($presentationHtml['content'] ?? ''), 'Цветовая версия'), 'presentation html brief exposes constructor color styling section');
assert_true(str_contains((string) ($presentationHtml['content'] ?? ''), 'Логотип / знак'), 'presentation html brief exposes constructor lockup section');
assert_true(str_contains((string) ($presentationHtml['content'] ?? ''), 'Элементы фона'), 'presentation html brief exposes constructor background section');
assert_true(str_contains((string) ($presentationHtml['content'] ?? ''), 'Палитра фона'), 'presentation html brief exposes constructor palette section');
assert_true(str_contains((string) ($presentationHtml['content'] ?? ''), 'Композиция'), 'presentation html brief exposes adaptive composition section');

$handoffArtifacts = array_values(array_filter([
    constructor_svg_artifact($businessCardDefinition, $styledBusinessCardInput),
    constructor_html_brief_artifact($businessCardDefinition, $styledBusinessCardInput, [
        'sections' => [],
        'items' => [],
        'advice' => ['title' => 'Проверьте брендбук', 'summary' => 'Сверьте цвет и логотип.', 'nextStep' => 'После согласования передайте подрядчику исходники.'],
    ]),
    constructor_json_brief_artifact($businessCardDefinition, $styledBusinessCardInput, [
        'sections' => [],
        'items' => [],
        'advice' => ['title' => 'Проверьте брендбук', 'summary' => 'Сверьте цвет и логотип.', 'nextStep' => 'После согласования передайте подрядчику исходники.'],
    ]),
]));
$handoffPayload = constructor_handoff_payload(
    $businessCardDefinition,
    $styledBusinessCardInput,
    [
        'context' => ['medium' => 'print', 'sourceMode' => 'editable', 'applicationFocus' => 'contractor_handoff'],
        'sections' => [
            ['id' => 'brandbook', 'label' => 'Брендбук ЯМАЛ Мастер бренд', 'name' => 'Брендбук ЯМАЛ Мастер бренд', 'relativePath' => 'Брендбук ЯМАЛ Мастер бренд', 'icon' => '📕', 'kindLabel' => 'Раздел'],
            ['id' => 'logo', 'label' => 'Логотип', 'name' => 'Логотип', 'relativePath' => 'Логотип', 'icon' => '🏷️', 'kindLabel' => 'Раздел'],
        ],
        'items' => [
            ['id' => 'brandbook-pdf', 'label' => 'Брендбук • PDF', 'relativePath' => 'Брендбук ЯМАЛ Мастер бренд/Брендбук.pdf', 'downloadUrl' => 'download.php?id=brandbook-pdf', 'extension' => 'pdf', 'kindLabel' => 'PDF'],
            ['id' => 'logo-svg', 'label' => 'Логотип • SVG', 'relativePath' => 'Логотип/2 Color/logo.svg', 'downloadUrl' => 'download.php?id=logo-svg', 'extension' => 'svg', 'kindLabel' => 'SVG'],
            ['id' => 'logo-ai', 'label' => 'Логотип • AI', 'relativePath' => 'Логотип/1 CMYK/logo.ai', 'downloadUrl' => 'download.php?id=logo-ai', 'extension' => 'ai', 'kindLabel' => 'AI'],
        ],
        'advice' => ['title' => 'Проверьте брендбук', 'summary' => 'Сверьте цвет и логотип.', 'nextStep' => 'После согласования передайте подрядчику исходники.'],
    ],
    $handoffArtifacts,
    true
);
assert_true(($handoffPayload['approval']['title'] ?? '') === 'На согласование', 'constructor handoff exposes approval package');
assert_true(
    array_reduce(
        $handoffPayload['approval']['files'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || ((string) ($item['id'] ?? '')) === 'brandbook-pdf',
        false
    ),
    'constructor handoff keeps pdf in approval package'
);
assert_true(
    array_reduce(
        $handoffPayload['contractor']['files'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || in_array((string) ($item['id'] ?? ''), ['logo-ai', 'logo-svg'], true),
        false
    ),
    'constructor handoff keeps editable/vector source files in contractor package'
);
assert_true(
    array_reduce(
        $handoffPayload['contractor']['artifacts'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || ((string) ($item['id'] ?? '')) === 'brief-json',
        false
    ),
    'constructor handoff keeps json brief in contractor package'
);
assert_true(str_contains((string) ($handoffPayload['contractor']['nextStep'] ?? ''), 'исходник'), 'constructor handoff contractor package exposes next step copy');

$presentationSvg = constructor_svg_artifact($presentationDefinition, constructor_normalize_input($presentationDefinition, [
    'city' => 'ямал',
    'presentation_mode' => 'report',
    'title' => 'Длинный заголовок презентации, который должен аккуратно поместиться в рамку обложки без вылета за правый край',
    'event_name' => 'Стратегическая сессия по развитию бренда региона',
    'key_message' => 'Показываем единый тезис для встречи и удерживаем его в безопасной карточке.',
    'structure' => "1. Контекст\n2. Текущий статус\n3. Следующий шаг",
    'speaker' => 'Алексей Северный',
    'speaker_role' => 'Куратор программы',
    'audience' => 'Команда проекта',
    'slide_count' => 18,
]));
assert_true($presentationSvg !== null, 'presentation svg artifact exists');
assert_true(str_contains((string) ($presentationSvg['content'] ?? ''), 'font-size:'), 'presentation svg uses adaptive text sizing');
assert_true(!str_contains((string) ($presentationSvg['content'] ?? ''), 'Статус / отчёт'), 'presentation svg hides the mode chip from the cover');

$overflowCasePayloads = [
    'business_card' => [
        'city' => 'салехард',
        'full_name' => 'Александрова-Виноградова Екатерина Константиновна-Петрова',
        'role' => 'Руководитель стратегических коммуникаций и территориального брендинга',
        'department' => 'Департамент внешних коммуникаций и проектного сопровождения',
        'phone' => '+7 999 123-45-67 доб. 1234',
        'email' => 'ekaterina.aleksandrova-vinogradova-petrova@brand.yamal.rf',
    ],
    'badge' => [
        'city' => 'салехард',
        'event_name' => 'Международный форум креативных индустрий Ямала',
        'full_name' => 'Александрова-Виноградова Екатерина Константиновна-Петрова',
        'role' => 'Руководитель стратегических коммуникаций и территориального брендинга',
    ],
    'nameplate' => [
        'city' => 'салехард',
        'variant' => 'navigation',
        'location' => 'Отдел стратегических коммуникаций и проектного сопровождения бренда территории',
        'subline' => 'Приёмная, переговорная и рабочая зона команды развития',
        'room_number' => '214Б-7',
        'mount' => 'wall',
        'direction' => 'right',
        'size_variant' => '400x160',
    ],
    'information_stand' => [
        'city' => 'салехард',
        'stand_type' => 'memo',
        'headline' => 'Центр коммуникаций и проектного сопровождения брендированных решений Ямала',
        'subtitle' => 'Правила посещения, режим работы и схема движения по общественной зоне офиса',
        'section_one_title' => 'Режим работы',
        'section_one_body' => "Пн-Пт 08:30-18:00\nСб-Вс по предварительной записи\nПраздничные дни по отдельному графику",
        'section_two_title' => 'В помещении',
        'section_two_body' => "Регистрация и зона ожидания — 1 этаж\nПроектные офисы и переговорные — 2 этаж\nСтойка выдачи материалов — 3 этаж",
        'contact_line' => 'brand@yamal.ru • +7 34922 00-000 • yamal.brand/office',
        'size_variant' => 'a4x12',
    ],
    'room_navigation_sign' => [
        'city' => 'салехард',
        'destination' => 'Отдел стратегических коммуникаций и проектного сопровождения бренда территории',
        'route_hint' => 'Через атриум, направо после стойки регистрации и дальше по коридору блока Б',
        'room_number' => '214Б-7',
        'floor_label' => '3 этаж',
        'mount' => 'ceiling',
        'direction' => 'left',
        'size_variant' => '600x220',
    ],
    'presentation_deck' => [
        'city' => 'салехард',
        'presentation_mode' => 'pitch',
        'title' => 'Комплексная платформа развития бренда Ямала для международных и межрегиональных коммуникаций',
        'event_name' => 'Международный инвестиционный форум северных территорий и креативной экономики',
        'key_message' => 'Мы переводим бренд региона в систему готовых решений для власти, бизнеса, туризма и событийной повестки без потери целостности айдентики.',
        'speaker' => 'Екатерина Александрова-Виноградова',
        'speaker_role' => 'Руководитель стратегических коммуникаций и территориального брендинга',
        'audience' => 'Партнёры, инвесторы и представители институтов развития',
        'slide_count' => 18,
    ],
    'certificate' => [
        'city' => 'салехард',
        'recipient' => 'Александрова-Виноградова Екатерина Константиновна-Петрова',
        'reason' => 'за вклад в развитие визуальных коммуникаций и внедрение системы брендированных решений на территории Ямала',
        'event_name' => 'Форум развития территориального брендинга',
        'signer' => 'Директор проектного офиса коммуникаций',
        'issue_date' => '2026-03-12',
    ],
    'social_post' => [
        'city' => 'салехард',
        'ratio' => '4:5',
        'headline' => 'Новая система брендированных решений для муниципальных и событийных коммуникаций Ямала',
        'message' => 'Собрали библиотеку типовых носителей, чтобы команды быстрее запускали согласованные материалы без ручного поиска файлов и расхождения по айдентике.',
        'cta' => 'Открыть каталог и выбрать подходящий шаблон',
    ],
    'letterhead' => [
        'city' => 'салехард',
        'department' => 'Департамент внешних коммуникаций и проектного сопровождения бренда территории',
        'document_title' => 'Служебное письмо о подготовке брендированных материалов к отраслевому форуму',
        'contact_line' => '629008, Салехард, ул. Республики, 12 • brand@yamal.ru • +7 34922 00-000',
        'signer' => 'Екатерина Александрова-Виноградова',
    ],
    'rollup' => [
        'city' => 'салехард',
        'headline' => 'Ямал. Платформа брендированных решений для событий, городов и партнёрских коммуникаций',
        'subline' => 'Единая библиотека исходников, готовых шаблонов и сценариев применения для команд региона, подрядчиков и организаторов.',
        'event_name' => 'Форум креативных индустрий',
        'size_variant' => '85x200',
    ],
];
foreach ($overflowCasePayloads as $definitionId => $payload) {
    $definition = constructor_definition_by_id($definitionId);
    assert_true($definition !== null, $definitionId . ' constructor definition exists for overflow check');
    $normalizedPayload = constructor_normalize_input($definition, $payload);
    $artifact = constructor_svg_artifact($definition, $normalizedPayload);
    assert_true($artifact !== null, $definitionId . ' svg artifact exists for overflow check');
    $content = (string) ($artifact['content'] ?? '');
    assert_true(str_contains($content, 'font-size:'), $definitionId . ' svg artifact keeps adaptive inline sizing for long copy');
    assert_true(!str_contains($content, '…'), $definitionId . ' svg artifact avoids truncating representative long copy');
}

$compactInformationStandDefinition = constructor_definition_by_id('information_stand');
assert_true($compactInformationStandDefinition !== null, 'compact information stand definition exists');
$compactInformationStandPayload = constructor_normalize_input($compactInformationStandDefinition, [
    'city' => 'салехард',
    'stand_type' => 'schedule',
    'headline' => 'График приёма и порядок выдачи брендированных материалов для сотрудников и подрядчиков',
    'subtitle' => 'Короткий формат стенда не должен рвать подписи, карточки и нижнюю контактную строку даже на длинных значениях',
    'section_one_title' => 'График посещения и регистрации',
    'section_one_body' => "Пн-Пт 08:30-18:00\nСб по записи\nПерерыв 12:30-13:30",
    'section_two_title' => 'Контакты и навигация по выдаче',
    'section_two_body' => "Стойка выдачи — 1 этаж\nПодрядчики — окно 2\nСогласование — кабинет 214Б",
    'contact_line' => 'brand@yamal.ru • +7 34922 00-000 • yamal.brand/office',
    'size_variant' => 'a4x2',
]);
$compactInformationStandSvg = constructor_svg_artifact($compactInformationStandDefinition, $compactInformationStandPayload);
assert_true($compactInformationStandSvg !== null, 'compact information stand svg artifact exists');
$compactInformationStandContent = (string) ($compactInformationStandSvg['content'] ?? '');
assert_true(str_contains($compactInformationStandContent, 'brand@yamal.ru'), 'compact information stand keeps the bottom contact line');
assert_true(!str_contains($compactInformationStandContent, '2 кармана A4'), 'compact information stand hides compact pocket metadata');
assert_true(!str_contains($compactInformationStandContent, '…'), 'compact information stand avoids truncating long footer and contact copy');

$compactInformationStandTitleFit = constructor_svg_fit_text_block(
    'Контакты и навигация по выдаче',
    'tiny',
    212,
    24,
    2,
    ['baseFontSize' => 16, 'minFontSize' => 9, 'widthSafety' => 0.86, 'heightSafety' => 0.88]
);
assert_true(($compactInformationStandTitleFit['truncated'] ?? true) === false, 'compact information stand title fit keeps the full section label inside the short footer card');

$compactInformationStandContactFit = constructor_svg_fit_text_block(
    'brand@yamal.ru • +7 34922 00-000 • yamal.brand/office',
    'tiny',
    500,
    32,
    3,
    ['baseFontSize' => 17, 'minFontSize' => 9, 'widthSafety' => 0.88, 'heightSafety' => 0.88, 'anchor' => 'middle']
);
assert_true(($compactInformationStandContactFit['truncated'] ?? true) === false, 'compact information stand contact fit keeps the full bottom line inside the reserved strip');

$businessCardCleanupSvg = constructor_svg_artifact($businessCardDefinition, constructor_normalize_input($businessCardDefinition, [
    'city' => 'салехард',
    'full_name' => 'Ирина Полярная',
    'role' => 'Руководитель проектов',
    'department' => 'Проектный офис',
    'phone' => '+7 900 000-00-00',
    'email' => 'brand@yamal.ru',
]));
assert_true($businessCardCleanupSvg !== null, 'business card cleanup svg artifact exists');
assert_true(!str_contains((string) ($businessCardCleanupSvg['content'] ?? ''), 'Контакты'), 'business card svg hides generic contacts caption');

$socialPostCleanupDefinition = constructor_definition_by_id('social_post');
assert_true($socialPostCleanupDefinition !== null, 'social post definition exists for cleanup check');
$socialPostCleanupSvg = constructor_svg_artifact($socialPostCleanupDefinition, constructor_normalize_input($socialPostCleanupDefinition, [
    'headline' => 'Новая система брендированных решений',
    'message' => 'Показываем короткое сообщение без служебной подписи.',
    'cta' => 'Открыть каталог',
    'ratio' => '4:5',
]));
assert_true($socialPostCleanupSvg !== null, 'social post cleanup svg artifact exists');
assert_true(!str_contains((string) ($socialPostCleanupSvg['content'] ?? ''), 'Сообщение'), 'social post svg hides generic message caption');
assert_true(!str_contains((string) ($socialPostCleanupSvg['content'] ?? ''), 'Следующий шаг'), 'social post svg hides generic cta caption');

$letterheadCleanupDefinition = constructor_definition_by_id('letterhead');
assert_true($letterheadCleanupDefinition !== null, 'letterhead definition exists for cleanup check');
$letterheadCleanupSvg = constructor_svg_artifact($letterheadCleanupDefinition, constructor_normalize_input($letterheadCleanupDefinition, [
    'department' => 'Департамент коммуникаций',
    'document_title' => 'Служебное письмо',
    'contact_line' => 'brand@yamal.ru',
    'signer' => 'Ирина Полярная',
]));
assert_true($letterheadCleanupSvg !== null, 'letterhead cleanup svg artifact exists');
assert_true(!str_contains((string) ($letterheadCleanupSvg['content'] ?? ''), 'Подразделение'), 'letterhead svg hides department caption');
assert_true(!str_contains((string) ($letterheadCleanupSvg['content'] ?? ''), 'Текст письма или справки размещается в рабочей области ниже.'), 'letterhead svg hides placeholder body copy');
assert_true(!str_contains((string) ($letterheadCleanupSvg['content'] ?? ''), 'Подписант'), 'letterhead svg hides signer caption');

$rollupCleanupDefinition = constructor_definition_by_id('rollup');
assert_true($rollupCleanupDefinition !== null, 'rollup definition exists for cleanup check');
$rollupCleanupSvg = constructor_svg_artifact($rollupCleanupDefinition, constructor_normalize_input($rollupCleanupDefinition, [
    'headline' => 'Ямал. Библиотека решений',
    'subline' => 'Единый набор материалов для команд региона.',
    'event_name' => 'Форум креативных индустрий',
    'size_variant' => '85x200',
]));
assert_true($rollupCleanupSvg !== null, 'rollup cleanup svg artifact exists');
assert_true(!str_contains((string) ($rollupCleanupSvg['content'] ?? ''), 'Событие / площадка'), 'rollup svg hides event caption');
assert_true(!str_contains((string) ($rollupCleanupSvg['content'] ?? ''), '85x200'), 'rollup svg hides size metadata');

$badgeNameFit = constructor_svg_fit_text_block(
    'Александрова-Виноградова Екатерина Константиновна-Петрова',
    'headline',
    548,
    356,
    6,
    ['minFontSize' => 15, 'widthSafety' => 0.8, 'heightSafety' => 0.78]
);
assert_true(($badgeNameFit['truncated'] ?? true) === false, 'badge full name fit keeps the full long name inside the safer badge area');
assert_true(count($badgeNameFit['lines'] ?? []) >= 3, 'badge full name fit uses multiline layout for long full names');

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
    $fallbackService = new SiteCatalogService([
        'title' => 'Fallback Site',
        'catalog_db_path' => $base . '/fallback_catalog.db',
        'runtime_db_path' => $base . '/fallback_runtime.db',
        'catalog_root_path' => $base . '/upload',
        'page_size' => 12,
        'favorites_limit' => 5,
        'public_base' => '',
    ]);
    $fallbackBootstrap = $fallbackService->getBootstrap();
    assert_true(
        $fallbackBootstrap['setupMessage'] === 'В PHP не подключен драйвер pdo_sqlite, поэтому каталог и аналитика SQLite сейчас недоступны. Подключите расширение и перезапустите сайт.',
        'fallback bootstrap explains missing sqlite driver'
    );
    assert_true(($fallbackBootstrap['stats']['totalAssets'] ?? -1) === 0, 'fallback bootstrap keeps catalog stats empty without sqlite');
    assert_true(count($fallbackBootstrap['sections'] ?? []) === 0, 'fallback bootstrap keeps sections empty without sqlite');
    assert_true(count($fallbackBootstrap['constructors']['items'] ?? []) >= 10, 'fallback bootstrap still exposes constructor cards without sqlite');
    $fallbackCatalogDb = new CatalogDb($base . '/fallback_catalog.db', $base . '/upload');
    assert_true($fallbackCatalogDb->isAvailable() === false, 'catalog db stays unavailable without sqlite driver');
    assert_true($fallbackCatalogDb->availabilityReason() === 'pdo_sqlite_missing', 'catalog db exposes missing sqlite reason');
    $fallbackRuntimeDb = new RuntimeDb($base . '/fallback_runtime.db');
    assert_true($fallbackRuntimeDb->isAvailable() === false, 'runtime db stays unavailable without sqlite driver');
    assert_true($fallbackRuntimeDb->availabilityReason() === 'pdo_sqlite_missing', 'runtime db exposes missing sqlite reason');
    fwrite(STDOUT, "ok: fallback checks passed without pdo_sqlite\n");
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
assert_true(str_contains((string) ($bootstrap['consultant']['description'] ?? ''), 'одним сообщением'), 'bootstrap exposes dialog-first consultant description');
assert_true(str_contains((string) ($bootstrap['consultant']['description'] ?? ''), 'глубокий ответ'), 'bootstrap exposes deeper consultant description');
assert_true(($bootstrap['consultant']['placeholder'] ?? '') === 'Например: логотип SVG для Салехарда, можно ли менять цвет', 'bootstrap exposes dialog-first consultant placeholder');
assert_true(count($bootstrap['consultant']['intents'] ?? []) >= 6, 'bootstrap exposes consultant scenarios');
assert_true(array_key_exists('smartMode', $bootstrap['consultant'] ?? []), 'bootstrap exposes consultant smart mode metadata');
assert_true(is_bool($bootstrap['consultant']['smartMode']['enabled'] ?? null), 'bootstrap smart mode flag is boolean');
assert_true(($bootstrap['constructors']['title'] ?? '') === 'Лаборатория решений', 'bootstrap exposes solution lab title');
assert_true(count($bootstrap['constructors']['items'] ?? []) >= 10, 'bootstrap exposes constructor cards');
assert_true(
    array_reduce(
        $bootstrap['constructors']['items'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || (((string) ($item['id'] ?? '')) === 'business_card' && ((string) ($item['summary'] ?? '')) === 'Контакты сотрудника'),
        false
    ),
    'bootstrap exposes shortened business card summary'
);
assert_true(
    array_reduce(
        $bootstrap['constructors']['items'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || ((string) ($item['id'] ?? '') === 'business_card' && (string) ($item['label'] ?? '') === 'Визитка'),
        false
    ),
    'bootstrap exposes business card constructor'
);
assert_true(
    array_reduce(
        $bootstrap['constructors']['items'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || ((string) ($item['id'] ?? '') === 'information_stand' && (string) ($item['label'] ?? '') === 'Инфостенд'),
        false
    ),
    'bootstrap exposes information stand constructor'
);
assert_true(
    array_reduce(
        $bootstrap['constructors']['items'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || ((string) ($item['id'] ?? '') === 'room_navigation_sign' && (string) ($item['label'] ?? '') === 'Навигационная табличка'),
        false
    ),
    'bootstrap exposes room navigation sign constructor'
);
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

$constructorDraft = $service->getConstructor('business_card');
assert_true($constructorDraft !== null, 'constructor draft exists');
assert_true(($constructorDraft['generated'] ?? null) === false, 'constructor draft is not marked as generated');
assert_true(($constructorDraft['definition']['id'] ?? '') === 'business_card', 'constructor draft exposes definition id');
assert_true(($constructorDraft['input']['city'] ?? '') === 'ямал', 'constructor draft exposes normalized default city');
assert_true(count($constructorDraft['artifacts'] ?? []) >= 2, 'constructor draft exposes starter artifacts');
assert_true(count($constructorDraft['recommendations']['items'] ?? []) === 0, 'constructor draft keeps lightweight file recommendations');
assert_true(
    array_reduce(
        $constructorDraft['recommendations']['sections'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || in_array((string) ($item['name'] ?? ''), ['Логотип', 'Брендбук ЯМАЛ Мастер бренд'], true),
        false
    ),
    'constructor draft exposes grounded recommended sections'
);
$constructorDraftPreview = (string) (($constructorDraft['artifacts'][0]['content'] ?? ''));
assert_true(str_contains($constructorDraftPreview, 'data-constructor-bg-style="band"'), 'constructor draft preview exposes toggleable background layers');
assert_true(str_contains($constructorDraftPreview, 'data-constructor-design-style="editorial"') || str_contains($constructorDraftPreview, 'data-constructor-design-style="calm"'), 'constructor draft preview exposes toggleable design layers');
assert_true(str_contains($constructorDraftPreview, 'data-constructor-graphic-element="mark_yamal"'), 'constructor draft preview exposes toggleable graphic element layers');
assert_true(str_contains($constructorDraftPreview, 'data-constructor-variant-image="lockup"'), 'constructor draft preview exposes variant-aware lockup image');
assert_true(str_contains($constructorDraftPreview, 'data-href-white='), 'constructor draft preview exposes white asset variant for local switching');
assert_true(str_contains($constructorDraftPreview, '--ctor-lockup-fill'), 'constructor draft preview exposes live theme variables');

$constructorBuild = $service->buildConstructor('presentation_deck', [
    'city' => 'салехард',
    'title' => 'Инвестиционный сезон Ямала',
    'speaker' => 'Имя Фамилия',
    'speaker_role' => 'Руководитель проекта',
    'audience' => 'Партнёры',
    'slide_count' => '18',
]);
assert_true($constructorBuild !== null, 'constructor build exists');
assert_true(($constructorBuild['generated'] ?? null) === true, 'constructor build is marked as generated');
assert_true(($constructorBuild['input']['slide_count'] ?? 0) === 18, 'constructor build normalizes numeric input');
assert_true(
    array_reduce(
        $constructorBuild['artifacts'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || ((string) ($item['previewType'] ?? '') === 'html'),
        false
    ),
    'presentation constructor build exposes html brief artifact'
);
assert_true(
    array_reduce(
        $constructorBuild['recommendations']['items'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || in_array((string) ($item['id'] ?? ''), ['salekhard-brandbook-file', 'salekhard-city-logo'], true),
        false
    ),
    'presentation constructor build exposes grounded city-aware files'
);
assert_true(str_contains((string) ($constructorBuild['summary']['lead'] ?? ''), 'Каркас решения собран'), 'constructor build exposes generated summary');
assert_true(($constructorBuild['handoff']['approval']['title'] ?? '') === 'На согласование', 'constructor build exposes approval handoff package');
assert_true(($constructorBuild['handoff']['contractor']['title'] ?? '') === 'В работу', 'constructor build exposes work package');
assert_true(
    array_reduce(
        $constructorBuild['handoff']['contractor']['artifacts'] ?? [],
        static fn(bool $carry, array $item): bool => $carry || ((string) ($item['id'] ?? '')) === 'brief-json',
        false
    ),
    'constructor build exposes json brief inside contractor handoff package'
);
assert_true(str_contains((string) ($constructorBuild['handoff']['note'] ?? ''), 'разложен'), 'constructor build exposes handoff note');

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
assert_true(($logoConsult['deepAnswer'] ?? null) === null, 'consult keeps deep answer empty when llm is disabled');

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

$hybridService = new SiteCatalogService([
    'title' => 'Hybrid Test Site',
    'catalog_db_path' => $catalogDb,
    'runtime_db_path' => $base . '/hybrid_runtime.db',
    'catalog_root_path' => $base . '/upload',
    'page_size' => 12,
    'favorites_limit' => 5,
    'public_base' => '',
    'consultant_llm' => [
        'enabled' => true,
        'api_key' => 'test-key',
        'model' => 'gpt-5',
        'reasoning_effort' => 'high',
        'max_output_tokens' => 1600,
        'timeout_seconds' => 10,
        'base_url' => 'https://api.openai.com/v1',
        'organization' => '',
        'project' => '',
    ],
], null, null, static function (array $request, array $settings): array {
    assert_true(($request['model'] ?? '') === 'gpt-5', 'hybrid consult uses configured llm model');
    assert_true(($settings['api_key'] ?? '') === 'test-key', 'hybrid consult receives configured llm settings');
    assert_true(($request['text']['format']['type'] ?? '') === 'json_schema', 'hybrid consult requests structured json schema output');
    return [
        'output_text' => json_encode([
            'mode' => 'general',
            'title' => 'Что отдать подрядчику первым',
            'answer' => 'Начните с готового PDF для проверки и добавьте векторный исходник только если подрядчик будет адаптировать макет.',
            'bullets' => [
                'PDF удобен для согласования и быстрой проверки.',
                'SVG, AI или EPS отдавайте только под реальную адаптацию.',
            ],
            'follow_up' => 'Нужен пакет для печати или только для согласования?',
            'note' => 'Общая рекомендация опирается на типовые рабочие сценарии и подтвержденные разделы каталога.',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ];
});

$hybridConsult = $hybridService->consult('что отправить подрядчику', '', ['intentId' => 'logo', 'city' => 'салехард']);
assert_true(($hybridConsult['deepAnswer']['provider'] ?? '') === 'openai', 'consult hybrid mode exposes llm provider');
assert_true(($hybridConsult['deepAnswer']['mode'] ?? '') === 'general', 'consult hybrid mode exposes llm answer mode');
assert_true(str_contains((string) ($hybridConsult['deepAnswer']['answer'] ?? ''), 'PDF'), 'consult hybrid mode exposes deeper answer text');
assert_true(count($hybridConsult['deepAnswer']['bullets'] ?? []) >= 2, 'consult hybrid mode exposes deeper answer bullets');
assert_true(str_contains((string) ($hybridConsult['deepAnswer']['followUp'] ?? ''), 'печати'), 'consult hybrid mode exposes next follow-up question');

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
