<?php
declare(strict_types=1);

require __DIR__ . '/src/site_lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$service = new SiteCatalogService();
$action = trim((string) ($_GET['action'] ?? ''));

try {
    switch ($action) {
        case 'bootstrap':
            echo json_encode($service->getBootstrap(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            break;

        case 'favorites':
            echo json_encode(['items' => $service->getFavorites()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            break;

        case 'folder':
            $folderId = isset($_GET['id']) ? (string) $_GET['id'] : null;
            $page = isset($_GET['page']) ? (int) $_GET['page'] : 0;
            $payload = $service->getFolder($folderId, $page);
            if ($payload === null) {
                http_response_code(404);
                echo json_encode(['error' => 'folder_not_found'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                break;
            }
            echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            break;

        case 'search':
            $query = trim((string) ($_GET['q'] ?? ''));
            echo json_encode($service->search($query), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            break;

        case 'preview-search':
            $query = trim((string) ($_GET['q'] ?? ''));
            echo json_encode($service->search($query, false, false), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            break;

        case 'consult':
            $query = trim((string) ($_GET['q'] ?? ''));
            $intent = trim((string) ($_GET['intent'] ?? ''));
            $memory = [
                'intentId' => trim((string) ($_GET['memory_intent'] ?? '')),
                'city' => trim((string) ($_GET['memory_city'] ?? '')),
                'formats' => trim((string) ($_GET['memory_formats'] ?? '')),
                'medium' => trim((string) ($_GET['memory_medium'] ?? '')),
                'sourceMode' => trim((string) ($_GET['memory_source'] ?? '')),
                'applicationFocus' => trim((string) ($_GET['memory_focus'] ?? '')),
            ];
            echo json_encode($service->consult($query, $intent, $memory), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            break;

        case 'file':
            $fileId = trim((string) ($_GET['id'] ?? ''));
            $payload = $service->getFile($fileId);
            if ($payload === null) {
                http_response_code(404);
                echo json_encode(['error' => 'file_not_found'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                break;
            }
            echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'unknown_action'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'internal_error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
