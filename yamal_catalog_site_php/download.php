<?php
declare(strict_types=1);

require __DIR__ . '/src/site_lib.php';

$service = new SiteCatalogService();
$fileId = trim((string) ($_GET['id'] ?? ''));
$result = $service->resolveDownload($fileId);

if ($result === null || !is_file($result['fullPath'])) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Файл не найден';
    exit;
}

$item = $result['item'];
$filename = rawurlencode((string) ($item['name'] ?? 'download'));
header('Content-Type: ' . $result['contentType']);
header("Content-Disposition: attachment; filename*=UTF-8''{$filename}");
header('Content-Length: ' . filesize($result['fullPath']));
readfile($result['fullPath']);
