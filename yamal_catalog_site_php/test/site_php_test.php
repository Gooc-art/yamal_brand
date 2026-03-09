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

if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
    fwrite(STDOUT, "skipped: pdo_sqlite not available in local PHP CLI\n");
    exit(0);
}

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
mkdir($base . '/files', 0777, true);
mkdir($base . '/files/Логотип', 0777, true);
file_put_contents($base . '/files/Логотип/Логотип основной вариант для печати финальный.pdf', 'pdf');

$catalogDb = $base . '/max_catalog.db';
$runtimeDb = $base . '/max_bot_runtime.db';
create_catalog_db($catalogDb);

$service = new SiteCatalogService([
    'title' => 'Test Site',
    'catalog_db_path' => $catalogDb,
    'runtime_db_path' => $runtimeDb,
    'catalog_root_path' => $base . '/files',
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
assert_true($missingBootstrap['setupMessage'] !== '', 'missing db returns setup message');

echo "ok\n";
