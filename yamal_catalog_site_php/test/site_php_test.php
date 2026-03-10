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
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'hero-briefing'), 'index contains hero briefing grid');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'dossier-grid'), 'index contains dossier grid');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'featured-shelves'), 'index contains featured shelves scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-toggle'), 'index contains workspace toggle control');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'workspace-grid'), 'index contains workspace grid scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'brand-note'), 'index contains brand note block');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/brand-logo-main.svg')"), 'index uses versioned brand logo asset url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/brand-mark.svg')"), 'index uses versioned brand mark asset url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/styles.css')"), 'index uses versioned stylesheet url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, "asset_url('assets/app.js')"), 'index uses versioned app script url');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'brand-routes'), 'index contains brand routes scaffold');
assert_true($indexTemplate !== false && str_contains($indexTemplate, 'brand-principles'), 'index contains brand principles scaffold');
assert_true($indexTemplate !== false && !str_contains($indexTemplate, 'hero-summary'), 'index removed old hero summary scaffold');

$stylesTemplate = file_get_contents(dirname(__DIR__) . '/assets/styles.css');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.brand-principles'), 'styles contain brand principles classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.brand-lockup'), 'styles contain brand lockup classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.brand-route-grid'), 'styles contain brand route classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.brand-route-number'), 'styles contain brand route numbering');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-ribbon'), 'styles contain hero ribbon classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.hero-briefing'), 'styles contain hero briefing classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.dossier-grid'), 'styles contain dossier grid classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.feature-grid'), 'styles contain feature grid classes');
assert_true($stylesTemplate !== false && str_contains($stylesTemplate, '.workspace-shell'), 'styles contain workspace shell classes');
assert_true($stylesTemplate !== false && !str_contains($stylesTemplate, '.hero-badge'), 'styles removed old hero badge classes');

$frontendTemplate = file_get_contents(dirname(__DIR__) . '/assets/app.js');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderBrandRoutes'), 'frontend contains brand route renderer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'renderFeaturePanels'), 'frontend contains featured shelf renderer');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'brand-route-number'), 'frontend renders route numbering');
assert_true($frontendTemplate !== false && str_contains($frontendTemplate, 'WORKSPACE_STORAGE_KEY'), 'frontend persists workspace collapse state');
assert_true($frontendTemplate !== false && !str_contains($frontendTemplate, 'renderHeroBrief'), 'frontend removed old hero summary renderer');

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
file_put_contents($base . '/upload/Макеты1/Логотип/Логотип основной вариант для печати финальный.pdf', 'pdf');

$detectedRoot = detect_catalog_source_root($base . '/upload');
assert_true($detectedRoot === $base . '/upload/Макеты1', 'detect nested source root');

$builtRows = build_catalog_rows($detectedRoot);
assert_true(count($builtRows) === 3, 'scan returns root folder, child folder and file');
assert_true($builtRows[0]['id'] === root_id(), 'root id is stable');
assert_true($builtRows[2]['relative_path'] === 'Логотип/Логотип основной вариант для печати финальный.pdf', 'relative path built');
assert_true(str_contains((string) $builtRows[2]['search_text'], 'логотип'), 'search text includes normalized file words');

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

$folder = $service->getFolder('logo', 0);
assert_true($folder !== null, 'logo folder exists');
assert_true($folder['items'][0]['label'] === 'Основной • PDF', 'file label shortened');

$search = $service->search('логотеп');
assert_true($search['total'] >= 1, 'fuzzy search returns result');

$file = $service->getFile('file1');
assert_true($file !== null, 'file details exist');
assert_true($file['downloadUrl'] === 'download.php?id=file1', 'download url format');

$download = $service->resolveDownload('file1');
assert_true($download !== null, 'download resolves');
assert_true(is_file($download['fullPath']), 'download file exists');

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
