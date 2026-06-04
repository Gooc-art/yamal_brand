<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$envPath = __DIR__ . '/.env';
$upstream = getenv('GLAS_PROXY_UPSTREAM') ?: '';
if ($upstream === '' && is_file($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        if (strpos(trim($line), 'GLAS_PROXY_UPSTREAM=') === 0) {
            $upstream = trim(substr(trim($line), strlen('GLAS_PROXY_UPSTREAM=')));
            break;
        }
    }
}

$upstream = rtrim($upstream, '/');
if ($upstream === '') {
    http_response_code(500);
    echo json_encode(['error' => 'proxy_upstream_missing'], JSON_UNESCAPED_SLASHES);
    exit;
}

$path = (string) ($_GET['path'] ?? 'health');
$targetPath = $path === 'analyze' ? '/api/analyze' : '/api/health';
$targetUrl = $upstream . $targetPath;
$method = $_SERVER['REQUEST_METHOD'] === 'POST' ? 'POST' : 'GET';
$body = file_get_contents('php://input');

$ch = curl_init($targetUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
]);
if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($body) ? $body : '');
}

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false || $status < 100) {
    http_response_code(502);
    echo json_encode(['error' => 'proxy_upstream_error', 'detail' => $error], JSON_UNESCAPED_SLASHES);
    exit;
}

http_response_code($status);
echo $response;
