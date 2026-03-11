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
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-stats'), 'index contains hero stats scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-example-tabs'), 'index contains hero examples tabs scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-example-stage'), 'index contains hero examples stage scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-examples-note'), 'index contains hero examples note');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'featured-shelves'), 'index contains featured shelves scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'Под рукой'), 'index contains softened showcase heading');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'Все брендбуки'), 'index contains showcase quick action');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-toggle'), 'index contains workspace toggle control');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'catalog-mode-toggle'), 'index contains catalog mode toggle control');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'copy-current-link'), 'index contains copy current link control');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-column-media'), 'index contains dedicated hero media column');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'scroll-rail'), 'index contains horizontal rail controls');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-grid'), 'index contains workspace grid scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-composition'), 'index contains workspace composition scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-inspector'), 'index contains workspace inspector scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'inspector-backdrop'), 'index contains inspector backdrop scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'close-inspector'), 'index contains inspector close action');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/brand-logo-main.svg')"), 'index uses versioned brand logo asset url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/brand-mark.svg')"), 'index uses versioned brand mark asset url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/styles.css')"), 'index uses versioned stylesheet url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/app.js')"), 'index uses versioned app script url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'brand-routes'), 'index contains brand routes scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'search-panel'), 'index contains compact search panel');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'hero-briefing'), 'index removed hero briefing grid');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'brand-note'), 'index removed brand note block');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'brand-principles'), 'index removed brand principles scaffold');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'hero-summary'), 'index removed old hero summary scaffold');

$stylesTemplate = file_get_contents(dirname(__DIR__) . '/assets/styles.css');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.brand-route-grid'), 'styles contain brand route classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.brand-route-icon'), 'styles contain simplified route icon class');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.brand-route-card.active'), 'styles contain active route state');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-ribbon'), 'styles contain hero ribbon classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-stats'), 'styles contain hero stats classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-example-tabs'), 'styles contain hero examples tabs classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-example-card'), 'styles contain hero example card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-example-overlay'), 'styles contain hero example overlay classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-example-thumbs'), 'styles contain hero example thumbnails classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-example-autoplay'), 'styles contain hero autoplay control classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.showcase-block'), 'styles contain subdued showcase block');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.visually-hidden'), 'styles contain visually hidden utility');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-column-media'), 'styles contain hero media column classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.rail-actions'), 'styles contain rail action classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.rail-button'), 'styles contain rail button classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.feature-grid'), 'styles contain feature grid classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.feature-visual'), 'styles contain feature visual classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.feature-panel.tone-mark'), 'styles contain extended feature tones');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-shell'), 'styles contain workspace shell classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-composition'), 'styles contain workspace composition classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-inspector'), 'styles contain workspace inspector classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'appearance: none'), 'styles normalize button appearance');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'scrollbar-width: thin'), 'styles contain inspector scrollbar styling');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-inspector::-webkit-scrollbar'), 'styles contain webkit inspector scrollbar styling');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.inspector-backdrop'), 'styles contain inspector backdrop classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-shell.inspector-open'), 'styles contain inspector open state classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.ghost-button.copy-success'), 'styles contain copy success state');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.ghost-button.copy-error'), 'styles contain copy error state');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.detail-caption'), 'styles contain detail caption classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.detail-section-card'), 'styles contain detail section card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.detail-path-card'), 'styles contain detail path card classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.detail-actions > *'), 'styles contain equal-width detail action buttons');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.detail-actions > .link-button'), 'styles unify detail action button visuals');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.card-kicker'), 'styles contain list card kicker classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.card-context'), 'styles contain list card context classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'scroll-snap-type: x proximity'), 'styles contain horizontal rail snapping');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, 'grid-auto-flow: column'), 'styles contain horizontal rail flow');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.page-shell.catalog-mode'), 'styles contain catalog mode classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.brand-principles'), 'styles removed brand principles classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.hero-briefing'), 'styles removed hero briefing classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.hero-badge'), 'styles removed old hero badge classes');

$frontendTemplate = file_get_contents(dirname(__DIR__) . '/assets/app.js');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderBrandRoutes'), 'frontend contains brand route renderer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderFeaturePanels'), 'frontend contains featured shelf renderer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderHeroExamples'), 'frontend contains hero examples renderer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'examples-tab'), 'frontend supports hero example tabs');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'toggle-example-autoplay'), 'frontend supports hero example autoplay toggle');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'scheduleExampleAutoplay'), 'frontend supports hero example autoplay scheduling');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildExampleSummary'), 'frontend compacts hero example summary');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'hero-example-thumb'), 'frontend renders hero example thumbnails');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildFeaturePanelFromItem'), 'frontend builds featured shelf items from runtime data');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'brand-route-icon'), 'frontend renders simplified route icons');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderHeroStats'), 'frontend renders hero stats');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'setActiveRoute'), 'frontend tracks active main menu route');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'bootstrap.favorites'), 'frontend uses bootstrap favorites for featured shelf');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'WORKSPACE_STORAGE_KEY'), 'frontend persists workspace collapse state');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'CATALOG_MODE_STORAGE_KEY'), 'frontend persists catalog mode state');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'copy-current-link'), 'frontend supports copy current link action');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'navigator.clipboard'), 'frontend uses clipboard api when available');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, "document.execCommand('copy')"), 'frontend keeps clipboard fallback');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'scrollRailById'), 'frontend supports horizontal rail controls');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'enhanceHorizontalRail'), 'frontend enhances horizontal rails for mouse wheel');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'preview-search'), 'frontend loads preview search data');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'setInspectorOpen'), 'frontend controls inspector drawer state');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'focusWorkspace'), 'frontend focuses workspace for route clicks');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'compactRelativePath'), 'frontend compacts path context in cards');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildItemPills'), 'frontend builds compact meta pills');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'splitDetailHeading'), 'frontend structures detail heading text');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'buildItemHeading'), 'frontend structures list item heading text');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'detail-section-card'), 'frontend renders detail section cards');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, '<div class="detail-actions">'), 'frontend renders dedicated detail action container');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'card-kicker'), 'frontend renders structured list card copy');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'siteTitle:'), 'frontend no longer tracks visible hero title');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'brand-route-helper'), 'frontend removed route helper duplication');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'brand-route-number'), 'frontend removed route numbering');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'result-path'), 'frontend removed full path line from result cards');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'renderFavorites'), 'frontend removed left rail favorites renderer');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'renderHeroBrief'), 'frontend removed old hero summary renderer');

$downloadTemplate = file_get_contents(dirname(__DIR__) . '/download.php');
assert_true($downloadTemplate !== false && str_contains($downloadTemplate, 'inline'), 'download supports inline mode');

assert_true(is_file(dirname(__DIR__) . '/assets/brand-logo-main.svg'), 'brand logo asset exists');
assert_true(is_file(dirname(__DIR__) . '/assets/brand-mark.svg'), 'brand mark asset exists');
assert_true(str_contains(asset_url('assets/styles.css'), '?v='), 'asset_url appends version query');
assert_true(str_contains(asset_url('assets/app.js'), '?v='), 'asset_url versions app script');
assert_true(str_contains(asset_url('assets/brand-logo-main.svg'), '?v='), 'asset_url versions logo asset');

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
mkdir($base . '/upload/Макеты1/Спорные примеры', 0777, true);
file_put_contents($base . '/upload/Макеты1/Логотип/Логотип основной вариант для печати финальный.pdf', 'pdf');
file_put_contents($base . '/upload/Макеты1/Брендбук ЯМАЛ Мастер бренд/Файлы/Макеты/Автобус/Автобус пример.png', 'png');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда/Хорошие примеры/Старая витрина.png', 'png');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда/Спорные примеры/Старый баннер.jpg', 'jpg');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда территории/Хорошие примеры/Автобус на маршруте.png', 'png');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда территории/Архив/Павильон.png', 'png');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда территории/Спорные примеры/Перегруженный баннер.jpg', 'jpg');
file_put_contents($base . '/upload/Макеты1/Примеры внедрения бренда территории/Обсуждение/Черновой щит.jpg', 'jpg');
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

echo "ok\n";
