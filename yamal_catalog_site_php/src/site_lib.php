<?php
declare(strict_types=1);

function load_env_file(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }
        $separator = strpos($trimmed, '=');
        if ($separator === false) {
            continue;
        }
        $key = trim(substr($trimmed, 0, $separator));
        $value = trim(substr($trimmed, $separator + 1));
        if ($key === '' || getenv($key) !== false) {
            continue;
        }
        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

load_env_file(dirname(__DIR__) . '/.env');

function env_flag(string $name, bool $default = false): bool
{
    $raw = getenv($name);
    if ($raw === false) {
        return $default;
    }

    $normalized = strtolower(trim((string) $raw));
    if ($normalized === '') {
        return $default;
    }
    if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
        return true;
    }
    if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
        return false;
    }
    return $default;
}

function consultant_llm_settings_from_env(): array
{
    $apiKey = trim((string) (getenv('OPENAI_API_KEY') ?: ''));
    $model = trim((string) (getenv('OPENAI_MODEL') ?: 'gpt-5'));
    $effort = strtolower(trim((string) (getenv('OPENAI_REASONING_EFFORT') ?: 'high')));
    if (!in_array($effort, ['low', 'medium', 'high'], true)) {
        $effort = 'high';
    }
    $maxOutputTokens = max(600, (int) (getenv('OPENAI_MAX_OUTPUT_TOKENS') ?: 2200));
    $timeoutSeconds = max(5, min(60, (int) (getenv('OPENAI_TIMEOUT_SECONDS') ?: 25)));
    $baseUrl = rtrim(trim((string) (getenv('OPENAI_BASE_URL') ?: 'https://api.openai.com/v1')), '/');

    return [
        'enabled' => env_flag('CONSULTANT_LLM_ENABLED', $apiKey !== ''),
        'api_key' => $apiKey,
        'model' => $model !== '' ? $model : 'gpt-5',
        'reasoning_effort' => $effort,
        'max_output_tokens' => $maxOutputTokens,
        'timeout_seconds' => $timeoutSeconds,
        'base_url' => $baseUrl !== '' ? $baseUrl : 'https://api.openai.com/v1',
        'organization' => trim((string) (getenv('OPENAI_ORG_ID') ?: '')),
        'project' => trim((string) (getenv('OPENAI_PROJECT_ID') ?: '')),
    ];
}

function consultant_llm_enabled(?array $config = null): bool
{
    $settings = $config['consultant_llm'] ?? consultant_llm_settings_from_env();
    return (bool) ($settings['enabled'] ?? false) && trim((string) ($settings['api_key'] ?? '')) !== '';
}

function openai_response_output_text(array $payload): string
{
    $explicit = trim((string) ($payload['output_text'] ?? ''));
    if ($explicit !== '') {
        return $explicit;
    }

    foreach (($payload['output'] ?? []) as $entry) {
        foreach (($entry['content'] ?? []) as $content) {
            $type = (string) ($content['type'] ?? '');
            if ($type === 'output_text' || $type === 'text') {
                $text = trim((string) ($content['text'] ?? ''));
                if ($text !== '') {
                    return $text;
                }
            }
            if ($type === 'refusal') {
                $refusal = trim((string) ($content['refusal'] ?? ''));
                if ($refusal !== '') {
                    return '';
                }
            }
        }
    }

    return '';
}

function consultant_llm_response_schema(): array
{
    return [
        'type' => 'object',
        'properties' => [
            'mode' => [
                'type' => 'string',
                'enum' => ['catalog', 'brandbook', 'general'],
            ],
            'title' => ['type' => 'string'],
            'answer' => ['type' => 'string'],
            'bullets' => [
                'type' => 'array',
                'items' => ['type' => 'string'],
                'maxItems' => 4,
            ],
            'follow_up' => ['type' => 'string'],
            'note' => ['type' => 'string'],
        ],
        'required' => ['mode', 'title', 'answer', 'bullets', 'follow_up', 'note'],
        'additionalProperties' => false,
    ];
}

function site_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $rootDir = dirname(__DIR__);
    $dataDir = $rootDir . '/data';
    $config = [
        'title' => getenv('SITE_TITLE') ?: 'Бренд Ямал',
        'catalog_db_path' => getenv('CATALOG_DB_PATH') ?: $dataDir . '/max_catalog.db',
        'runtime_db_path' => getenv('RUNTIME_DB_PATH') ?: $dataDir . '/max_bot_runtime.db',
        'catalog_root_path' => getenv('CATALOG_ROOT_PATH') ?: $dataDir . '/files',
        'page_size' => max(1, (int) (getenv('PAGE_SIZE') ?: 18)),
        'favorites_limit' => max(1, (int) (getenv('FAVORITES_LIMIT') ?: 8)),
        'public_base' => rtrim((string) (getenv('PUBLIC_BASE') ?: ''), '/'),
        'consultant_llm' => consultant_llm_settings_from_env(),
    ];
    return $config;
}

function asset_url(string $relativePath): string
{
    $normalized = ltrim(str_replace('\\', '/', $relativePath), '/');
    $fullPath = dirname(__DIR__) . '/' . $normalized;
    if (!is_file($fullPath)) {
        return $normalized;
    }
    $version = (string) (filemtime($fullPath) ?: 0);
    return $normalized . '?v=' . rawurlencode($version);
}

function safe_id(string $value): string
{
    return substr(sha1($value), 0, 16);
}

function root_id(): string
{
    static $rootId = null;
    if ($rootId === null) {
        $rootId = safe_id('.');
    }
    return $rootId;
}

function normalize_text(string $value): string
{
    $value = mb_strtolower($value, 'UTF-8');
    $value = str_replace('ё', 'е', $value);
    $value = preg_replace('/[^0-9a-zа-я]+/u', ' ', $value) ?? '';
    $value = preg_replace('/\s+/u', ' ', $value) ?? '';
    return trim($value);
}

function translit_map(): array
{
    static $map = null;
    if ($map !== null) {
        return $map;
    }
    $map = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'е' => 'e', 'ё' => 'e',
        'ж' => 'j', 'з' => 'z', 'и' => 'i', 'й' => 'i', 'к' => 'k', 'л' => 'l', 'м' => 'm',
        'н' => 'n', 'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u',
        'ф' => 'f', 'х' => 'h', 'ц' => 'c', 'ч' => 'ch', 'ш' => 'sh', 'щ' => 'sh',
        'ъ' => '', 'ы' => 'y', 'ь' => '', 'э' => 'e', 'ю' => 'yu', 'я' => 'ya',
    ];
    return $map;
}

function translit_to_latin(string $value): string
{
    $source = normalize_text($value);
    $out = '';
    foreach (preg_split('//u', $source, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $char) {
        $out .= translit_map()[$char] ?? $char;
    }
    return normalize_text($out);
}

function keyboard_swap_map(): array
{
    static $map = null;
    if ($map !== null) {
        return $map;
    }
    $map = [
        'q' => 'й', 'w' => 'ц', 'e' => 'у', 'r' => 'к', 't' => 'е', 'y' => 'н', 'u' => 'г',
        'i' => 'ш', 'o' => 'щ', 'p' => 'з', 'a' => 'ф', 's' => 'ы', 'd' => 'в', 'f' => 'а',
        'g' => 'п', 'h' => 'р', 'j' => 'о', 'k' => 'л', 'l' => 'д', 'z' => 'я', 'x' => 'ч',
        'c' => 'с', 'v' => 'м', 'b' => 'и', 'n' => 'т', 'm' => 'ь',
        'й' => 'q', 'ц' => 'w', 'у' => 'e', 'к' => 'r', 'е' => 't', 'н' => 'y', 'г' => 'u',
        'ш' => 'i', 'щ' => 'o', 'з' => 'p', 'ф' => 'a', 'ы' => 's', 'в' => 'd', 'а' => 'f',
        'п' => 'g', 'р' => 'h', 'о' => 'j', 'л' => 'k', 'д' => 'l', 'я' => 'z', 'ч' => 'x',
        'с' => 'c', 'м' => 'v', 'и' => 'b', 'т' => 'n', 'ь' => 'm',
    ];
    return $map;
}

function swap_keyboard_layout(string $value): string
{
    $out = '';
    foreach (preg_split('//u', mb_strtolower($value, 'UTF-8'), -1, PREG_SPLIT_NO_EMPTY) ?: [] as $char) {
        $out .= keyboard_swap_map()[$char] ?? $char;
    }
    return normalize_text($out);
}

function search_synonyms(): array
{
    static $synonyms = null;
    if ($synonyms !== null) {
        return $synonyms;
    }
    $synonyms = [
        'лого' => ['логотип', 'logo', 'logotype'],
        'логотип' => ['лого', 'logo', 'logotype', 'brandmark', 'знак', 'эмблема'],
        'logo' => ['логотип', 'лого', 'logotype', 'brandmark'],
        'logotype' => ['логотип', 'logo', 'лого'],
        'brandmark' => ['логотип', 'logo', 'знак'],
        'знак' => ['логотип', 'brandmark', 'эмблема', 'symbol'],
        'эмблема' => ['логотип', 'знак', 'symbol'],
        'symbol' => ['знак', 'эмблема', 'brandmark'],
        'брендбук' => ['гайдлайн', 'гайд', 'guide', 'guideline', 'brandbook'],
        'brandbook' => ['брендбук', 'гайдлайн', 'guide', 'guideline'],
        'гайдлайн' => ['брендбук', 'brandbook', 'guide', 'guideline'],
        'guideline' => ['брендбук', 'brandbook', 'гайдлайн', 'guide'],
        'гайд' => ['брендбук', 'гайдлайн', 'guide'],
        'guide' => ['брендбук', 'brandbook', 'гайдлайн', 'guideline'],
        'шрифт' => ['font', 'fonts', 'ttf', 'otf', 'гарнитура', 'typeface'],
        'font' => ['шрифт', 'fonts', 'ttf', 'otf', 'гарнитура', 'typeface'],
        'гарнитура' => ['шрифт', 'font', 'typeface'],
        'сувенир' => ['мерч', 'merch', 'сувенирка', 'подарок', 'подарки'],
        'мерч' => ['сувенир', 'merch', 'сувенирка', 'подарок'],
        'сувенирка' => ['сувенир', 'мерч', 'merch', 'подарок'],
        'иллюстрация' => ['иллюстрации', 'svg', 'вектор', 'элемент', 'графика'],
        'иллюстрации' => ['иллюстрация', 'svg', 'вектор', 'элементы', 'графика'],
        'svg' => ['иллюстрация', 'иллюстрации', 'вектор', 'элемент'],
        'паттерн' => ['svg', 'элемент', 'орнамент'],
        'город' => ['города', 'муниципалитет'],
        'города' => ['город', 'муниципалитет'],
        'мастербренд' => ['мастер бренд', 'брендбук', 'гайдлайн'],
        'мастер' => ['мастербренд', 'мастер бренд', 'брендбук'],
        'юбилей' => ['100', '95', 'брендбук'],
        'наклейка' => ['стикер', 'наклейки', 'стикеры'],
        'наклейки' => ['стикер', 'стикеры', 'наклейка'],
        'стикер' => ['наклейка', 'стикеры', 'наклейки'],
        'стикеры' => ['наклейка', 'наклейки', 'стикер'],
        'одежда' => ['футболка', 'худи', 'мерч'],
        'футболка' => ['одежда', 'мерч'],
        'худи' => ['одежда', 'мерч'],
        'баннер' => ['полиграфия', 'навигация'],
        'навигация' => ['полиграфия', 'баннер', 'табличка'],
        'полиграфия' => ['баннер', 'навигация', 'буклет'],
        'диджитал' => ['презентация', 'соцсети', 'цифровой'],
        'презентация' => ['диджитал', 'цифровой'],
        'соцсети' => ['диджитал', 'цифровой'],
        'канцелярия' => ['ручка', 'блокнот', 'ежедневник'],
    ];
    return $synonyms;
}

function build_query_variants(string $query): array
{
    $norm = normalize_text($query);
    $swapped = swap_keyboard_layout($query);
    $bases = array_values(array_filter([$norm, $swapped]));
    if ($bases === []) {
        return [];
    }

    $variants = [];
    $seen = [];
    $add = static function (string $value) use (&$variants, &$seen): void {
        $normalized = normalize_text($value);
        if ($normalized === '' || isset($seen[$normalized])) {
            return;
        }
        $seen[$normalized] = true;
        $variants[] = $normalized;
    };

    foreach ($bases as $base) {
        $add($base);
        $add(translit_to_latin($base));
    }

    foreach ($variants as $base) {
        foreach (preg_split('/\s+/u', $base) ?: [] as $token) {
            foreach (search_synonyms()[$token] ?? [] as $synonym) {
                $add($synonym);
                $add(translit_to_latin($synonym));
            }
        }
    }

    return $variants;
}

function split_tokens(string $value): array
{
    $normalized = normalize_text($value);
    if ($normalized === '') {
        return [];
    }
    return preg_split('/\s+/u', $normalized) ?: [];
}

function is_hidden_relative_path(string $value): bool
{
    foreach (explode('/', str_replace('\\', '/', $value)) as $part) {
        if ($part !== '' && str_starts_with($part, '.')) {
            return true;
        }
    }
    return false;
}

function as_iso_utc(int $timestamp): string
{
    return gmdate(DATE_ATOM, $timestamp);
}

function build_catalog_search_text(string $name, string $relPath, string $ext): string
{
    $base = normalize_text(trim($name . ' ' . $relPath . ' ' . $ext));
    if ($base === '') {
        return '';
    }

    $variants = [];
    $seen = [];
    $addVariant = static function (string $value) use (&$variants, &$seen): void {
        $normalized = normalize_text($value);
        if ($normalized === '' || isset($seen[$normalized])) {
            return;
        }
        $seen[$normalized] = true;
        $variants[] = $normalized;
    };

    $addVariant($base);
    $addVariant(translit_to_latin($base));
    foreach (split_tokens($base) as $token) {
        foreach (search_synonyms()[$token] ?? [] as $synonym) {
            $addVariant($synonym);
            $addVariant(translit_to_latin($synonym));
        }
    }

    return implode(' ', $variants);
}

function string_similarity(string $left, string $right): float
{
    $a = normalize_text($left);
    $b = normalize_text($right);
    if ($a === '' || $b === '') {
        return 0.0;
    }
    if ($a === $b) {
        return 1.0;
    }
    if (str_contains($a, $b) || str_contains($b, $a)) {
        return min(mb_strlen($a), mb_strlen($b)) / max(mb_strlen($a), mb_strlen($b));
    }
    similar_text($a, $b, $percent);
    return max(0.0, min(1.0, $percent / 100));
}

function token_overlap_score(array $queryTokens, array $candidateTokens): float
{
    if ($queryTokens === [] || $candidateTokens === []) {
        return 0.0;
    }

    $candidateSet = array_fill_keys($candidateTokens, true);
    $same = 0;
    foreach ($queryTokens as $token) {
        if (isset($candidateSet[$token])) {
            $same += 1;
        }
    }
    return $same / max(1, count($queryTokens));
}

function token_coverage_score(array $queryTokens, array $candidateTokens): float
{
    if ($queryTokens === [] || $candidateTokens === []) {
        return 0.0;
    }
    $total = 0.0;
    foreach ($queryTokens as $token) {
        $best = 0.0;
        foreach ($candidateTokens as $candidate) {
            $best = max($best, string_similarity($token, $candidate));
        }
        $total += $best;
    }
    return $total / max(1, count($queryTokens));
}

function rank_search_rows(string $query, array $rows, int $limit): array
{
    $variants = build_query_variants($query);
    $scored = [];

    foreach ($rows as $row) {
        $name = (string) ($row['normalized_name'] ?? '');
        $rel = (string) ($row['normalized_path'] ?? '');
        $searchText = (string) ($row['search_text'] ?? trim($name . ' ' . $rel));
        $candidateTokens = split_tokens($name . ' ' . $rel . ' ' . $searchText);
        $score = 0.0;

        foreach ($variants as $variant) {
            $variantTokens = split_tokens($variant);
            $direct = (str_contains($name, $variant) || str_contains($rel, $variant) || str_contains($searchText, $variant)) ? 1.0 : 0.0;
            $ratio = max(
                string_similarity($variant, $name),
                string_similarity($variant, $rel),
                string_similarity($variant, $searchText)
            );
            $overlap = token_overlap_score($variantTokens, $candidateTokens);
            $coverage = token_coverage_score($variantTokens, $candidateTokens);
            $variantScore = $direct * 0.42 + $ratio * 0.24 + $overlap * 0.12 + $coverage * 0.22;
            $score = max($score, $variantScore);
        }

        if ($score >= 0.31) {
            $row['score'] = round($score, 4);
            $scored[] = $row;
        }
    }

    usort($scored, static function (array $a, array $b): int {
        if (($b['score'] ?? 0) !== ($a['score'] ?? 0)) {
            return ($b['score'] <=> $a['score']);
        }
        if (($a['depth'] ?? 0) !== ($b['depth'] ?? 0)) {
            return ($a['depth'] <=> $b['depth']);
        }
        return strnatcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
    });

    $dedup = [];
    $seen = [];
    foreach ($scored as $row) {
        $id = (string) ($row['id'] ?? '');
        if ($id === '' || isset($seen[$id])) {
            continue;
        }
        $seen[$id] = true;
        $dedup[] = $row;
        if (count($dedup) >= $limit) {
            break;
        }
    }
    return $dedup;
}

function root_menu_folders(): array
{
    return [
        ['folderName' => 'Логотип', 'label' => 'Логотип', 'icon' => '🏷️'],
        ['folderName' => 'Фирменный знак', 'label' => 'Фирменный знак', 'icon' => '🔰'],
        ['folderName' => 'Детский логотип', 'label' => 'Детский логотип', 'icon' => '🧒'],
        ['folderName' => 'Логотипы городов', 'label' => 'Логотипы городов', 'icon' => '🏙️'],
        ['folderName' => 'Паттерны', 'label' => 'Паттерны', 'icon' => '🧩'],
        ['folderName' => 'Брендбук ЯМАЛ 100', 'label' => 'Брендбук ЯМАЛ 100', 'icon' => '📘'],
        ['folderName' => 'Брендбук ЯМАЛ Мастер бренд', 'label' => 'Мастер-Бренд', 'icon' => '📕'],
        ['folderName' => 'Брендбук Салехард', 'label' => 'Брендбук Салехард', 'icon' => '📗'],
        ['folderName' => 'Брендбук Новый Уренгой', 'label' => 'Брендбук Н. Уренгой', 'icon' => '📙'],
        ['folderName' => 'Брендбук Ноябрьск', 'label' => 'Брендбук Ноябрьск', 'icon' => '📒'],
        ['folderName' => 'Иллюстрации мастер-бренда SVG-элементы', 'label' => 'Иллюстрации и SVG', 'icon' => '🖼️'],
        ['folderName' => 'Каталог сувенирной продукции', 'label' => 'Сувенирная продукция', 'icon' => '🎁'],
        ['folderName' => 'Шрифт', 'label' => 'Шрифты', 'icon' => '🔤'],
        ['folderName' => 'Примеры внедрения бренда территории', 'label' => 'Кейсы внедрения', 'icon' => '🗂️'],
    ];
}

function hidden_root_folders(): array
{
    return [];
}

function section_hints(): array
{
    return [
        'Логотип' => 'Выберите тип логотипа или готовый формат.',
        'Фирменный знак' => 'Здесь собраны знак отдельно и знак с надписью ЯМАЛ.',
        'Логотипы городов' => 'Выберите город, затем цветовой вариант.',
        'Паттерны' => 'Выберите город и скачайте готовые паттерны.',
        'Каталог сувенирной продукции' => 'Выберите категорию носителей и материалов.',
        'Шрифт' => 'Здесь лежат архивы шрифтов и отдельный файл начертания.',
        'Брендбук ЯМАЛ 100' => 'Можно сразу открыть PDF или перейти в папку с файлами.',
        'Брендбук ЯМАЛ Мастер бренд' => 'Можно сразу открыть брендбук или перейти в папку с файлами.',
        'Брендбук Салехард' => 'Можно сразу открыть PDF или перейти в папку с файлами.',
        'Брендбук Новый Уренгой' => 'Можно сразу открыть PDF или перейти в папку с файлами.',
        'Брендбук Ноябрьск' => 'Можно сразу открыть PDF или перейти в папку с файлами.',
    ];
}

function parent_specific_labels(): array
{
    return [
        'Каталог сувенирной продукции' => [
            '1-Сувенирная продукция' => ['label' => 'Сувениры', 'icon' => '🎁'],
            '2-Канцелярия' => ['label' => 'Канцелярия', 'icon' => '📝'],
            '3-Полиграфия и уличная навигация' => ['label' => 'Полиграфия и навигация', 'icon' => '🪧'],
            '4-Диджитал' => ['label' => 'Диджитал', 'icon' => '💻'],
            'Шрифты' => ['label' => 'Шрифты', 'icon' => '🔤'],
        ],
        'Логотип' => [
            'Логотип' => ['label' => 'Базовый логотип', 'icon' => '🏷️'],
            'Логотип с охранным полем' => ['label' => 'С охранным полем', 'icon' => '🛡️'],
            'Угловые логотипы' => ['label' => 'Угловые логотипы', 'icon' => '📐'],
            'Ямал 95' => ['label' => 'Ямал 95', 'icon' => '⭐'],
        ],
        'Фирменный знак' => [
            'Ямал' => ['label' => 'Знак', 'icon' => '🔰'],
            'Ямал надпись' => ['label' => 'Знак + ЯМАЛ', 'icon' => '✍️'],
        ],
    ];
}

function generic_folder_labels(): array
{
    return [
        'Файлы' => ['label' => 'Файлы и исходники', 'icon' => '🗂️'],
        '1. CMYK для печати' => ['label' => 'CMYK для печати', 'icon' => '🖨️'],
        '2. Color' => ['label' => 'Color', 'icon' => '🎨'],
        '3. Black' => ['label' => 'Black', 'icon' => '⚫'],
        '4. White' => ['label' => 'White', 'icon' => '⚪'],
        'PNG' => ['label' => 'PNG', 'icon' => '🖼️'],
        'Вектор' => ['label' => 'Вектор', 'icon' => '🧩'],
    ];
}

function file_icons(): array
{
    return [
        'ai' => '🎨', 'cdr' => '🎨', 'eps' => '🎨', 'jpg' => '🖼️', 'jpeg' => '🖼️',
        'pdf' => '📕', 'png' => '🖼️', 'svg' => '🧩', 'zip' => '🗜️', 'otf' => '🔤', 'ttf' => '🔤',
    ];
}

function format_labels(): array
{
    return [
        'ai' => 'AI', 'cdr' => 'CDR', 'eps' => 'EPS', 'jpg' => 'JPG', 'jpeg' => 'JPG',
        'pdf' => 'PDF', 'png' => 'PNG', 'svg' => 'SVG', 'zip' => 'ZIP', 'otf' => 'OTF', 'ttf' => 'TTF',
    ];
}

function format_order(): array
{
    return ['ai' => 0, 'cdr' => 1, 'eps' => 2, 'pdf' => 3, 'png' => 4, 'jpg' => 5, 'jpeg' => 5, 'svg' => 6, 'zip' => 7, 'otf' => 8, 'ttf' => 9];
}

function style_folder_names(): array
{
    return ['1. CMYK для печати', '2. Color', '3. Black', '4. White'];
}

function upper_first(string $value): string
{
    if ($value === '') {
        return '';
    }
    return mb_strtoupper(mb_substr($value, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($value, 1, null, 'UTF-8');
}

function normalize_button_label(string $name, bool $stripNumericPrefix = true): string
{
    $text = $name;
    if ($stripNumericPrefix) {
        $text = preg_replace('/^\d+(?:[.-]\d+)*\s*[-.)]?\s*/u', '', $text) ?? $text;
    }
    $text = preg_replace('/^[\s,.;:!?\'"`~\-–—_()\[\]{}<>«»\/\\|]+/u', '', $text) ?? $text;
    $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
    return upper_first(trim($text));
}

function cleanup_folder_label(string $name): string
{
    return normalize_button_label($name, true);
}

function strip_file_extension(string $name): string
{
    return preg_replace('/\.[^.]+$/u', '', $name) ?? $name;
}

function cleanup_file_stem(string $name): string
{
    return normalize_button_label(str_replace('_', ' ', strip_file_extension($name)), false);
}

function split_words(string $value): array
{
    return split_tokens($value);
}

function collect_context_phrases(array $item, string $parentName): array
{
    $parts = [$parentName];
    $relativePath = (string) ($item['relative_path'] ?? '');
    $pathParts = array_values(array_filter(explode('/', $relativePath)));
    $slice = array_slice($pathParts, -4, 3);
    foreach ($slice as $part) {
        $parts[] = $part;
    }
    $normalized = [];
    foreach ($parts as $part) {
        $value = cleanup_folder_label((string) $part);
        if ($value !== '') {
            $normalized[$value] = true;
        }
    }
    $phrases = array_keys($normalized);
    usort($phrases, static fn(string $a, string $b): int => mb_strlen($b, 'UTF-8') <=> mb_strlen($a, 'UTF-8'));
    return $phrases;
}

function remove_context_phrases(string $label, array $phrases): string
{
    $text = $label;
    foreach ($phrases as $phrase) {
        if (mb_strlen($phrase, 'UTF-8') < 4) {
            continue;
        }
        $text = preg_replace('/(^|\s)' . preg_quote($phrase, '/') . '(?=\s|$)/ui', ' ', $text) ?? $text;
    }
    $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
    return trim($text);
}

function strip_low_value_file_phrases(string $value): string
{
    $patterns = [
        '/(^|\s)(?:исходник(?:и)?|макет(?:ы)?|вариант(?:ы)?|версия|копия|copy|final)(?=\s|$)/ui',
        '/(^|\s)финальн(?:ый|ая|ое|ые)(?=\s|$)/ui',
        '/(^|\s)готов(?:ый|ая|ое|ые)(?=\s|$)/ui',
        '/(^|\s)(?:для\s+печати|для\s+экрана)(?=\s|$)/ui',
    ];
    $text = $value;
    foreach ($patterns as $pattern) {
        $text = preg_replace($pattern, ' ', $text) ?? $text;
    }
    $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
    return trim($text);
}

function dedupe_words(string $value): string
{
    $out = [];
    $seen = [];
    foreach (preg_split('/\s+/u', trim($value)) ?: [] as $word) {
        if ($word === '') {
            continue;
        }
        $key = normalize_text($word);
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $out[] = $word;
    }
    return implode(' ', $out);
}

function shorten_long_label(string $value, int $maxWords = 4): string
{
    $words = array_values(array_filter(preg_split('/\s+/u', trim($value)) ?: []));
    if (count($words) <= $maxWords) {
        return implode(' ', $words);
    }
    return implode(' ', array_slice($words, 0, $maxWords));
}

function infer_file_kind(string $text): string
{
    $source = mb_strtolower($text, 'UTF-8');
    if (preg_match('/брендбук/u', $source)) return 'Брендбук';
    if (preg_match('/логотип/u', $source)) return 'Логотип';
    if (preg_match('/знак/u', $source)) return 'Знак';
    if (preg_match('/паттерн/u', $source)) return 'Паттерн';
    if (preg_match('/шрифт/u', $source)) return 'Шрифт';
    if (preg_match('/иллюстра|svg/u', $source)) return 'Иллюстрация';
    if (preg_match('/сувенир|мерч|макет/u', $source)) return 'Макет';
    return '';
}

function file_ext(string $name): string
{
    $ext = pathinfo($name, PATHINFO_EXTENSION);
    return strtolower((string) $ext);
}

function previewable_image_extensions(): array
{
    return ['png', 'jpg', 'jpeg', 'webp'];
}

function is_previewable_image_file(array $item): bool
{
    return in_array(file_ext((string) ($item['name'] ?? '')), previewable_image_extensions(), true);
}

function inline_preview_kind(array $item): string
{
    $ext = file_ext((string) ($item['name'] ?? ''));
    if (in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'], true)) {
        return 'image';
    }
    if ($ext === 'pdf') {
        return 'pdf';
    }
    return '';
}

function inline_download_url(string $downloadUrl): string
{
    if ($downloadUrl === '') {
        return '';
    }
    return $downloadUrl . (str_contains($downloadUrl, '?') ? '&' : '?') . 'inline=1';
}

function normalized_contains_any(string $value, array $needles): bool
{
    $source = normalize_text($value);
    if ($source === '') {
        return false;
    }
    foreach ($needles as $needle) {
        $normalized = normalize_text((string) $needle);
        if ($normalized !== '' && str_contains($source, $normalized)) {
            return true;
        }
    }
    return false;
}

function normalized_path_segments(string $value): array
{
    $parts = explode('/', str_replace('\\', '/', $value));
    $normalized = [];
    foreach ($parts as $part) {
        $token = normalize_text($part);
        if ($token !== '') {
            $normalized[] = $token;
        }
    }
    return $normalized;
}

function normalized_path_has_prefix(string $value, string $prefix): bool
{
    $pathParts = normalized_path_segments($value);
    $prefixParts = normalized_path_segments($prefix);
    if ($pathParts === [] || $prefixParts === [] || count($pathParts) <= count($prefixParts)) {
        return false;
    }
    foreach ($prefixParts as $index => $token) {
        if (($pathParts[$index] ?? null) !== $token) {
            return false;
        }
    }
    return true;
}

function normalized_path_has_any_prefix(string $value, array $prefixes): bool
{
    foreach ($prefixes as $prefix) {
        if (normalized_path_has_prefix($value, (string) $prefix)) {
            return true;
        }
    }
    return false;
}

function root_menu_labels(): array
{
    static $labels = null;
    if ($labels !== null) {
        return $labels;
    }
    $labels = [];
    foreach (root_menu_folders() as $config) {
        $labels[(string) $config['folderName']] = (string) $config['label'];
    }
    return $labels;
}

function display_section_label(string $value): string
{
    return root_menu_labels()[$value] ?? cleanup_folder_label($value);
}

function consultant_intent_definitions(): array
{
    return [
        [
            'id' => 'logo',
            'label' => 'Нужен логотип',
            'summary' => 'Логотип и фирменный знак',
            'description' => 'Подберу логотип, знак и базовые форматы.',
            'prompt' => 'логотип svg',
            'keywords' => ['логотип', 'лого', 'эмблема', 'знак', 'brandmark', 'symbol'],
            'sectionNames' => ['Логотип', 'Фирменный знак'],
            'queries' => ['логотип', 'логотип svg', 'логотип pdf', 'фирменный знак'],
            'suggestedQueries' => ['логотип svg', 'логотип pdf', 'фирменный знак'],
        ],
        [
            'id' => 'brandbook',
            'label' => 'Нужен брендбук',
            'summary' => 'Брендбуки и гайды',
            'description' => 'Покажу брендбук региона или города.',
            'prompt' => 'брендбук Салехард',
            'keywords' => ['брендбук', 'гайд', 'гайдлайн', 'brandbook', 'guideline', 'guide'],
            'sectionNames' => [],
            'queries' => ['брендбук', 'брендбук ямал', 'мастер бренд'],
            'suggestedQueries' => ['брендбук', 'брендбук Салехард', 'брендбук Новый Уренгой'],
        ],
        [
            'id' => 'fonts',
            'label' => 'Нужны шрифты',
            'summary' => 'Шрифты и архивы',
            'description' => 'Покажу TTF, OTF и архивы со шрифтами.',
            'prompt' => 'шрифт otf',
            'keywords' => ['шрифт', 'font', 'fonts', 'гарнитура', 'typeface', 'ttf', 'otf'],
            'sectionNames' => ['Шрифт'],
            'queries' => ['шрифт', 'ttf', 'otf'],
            'suggestedQueries' => ['шрифт', 'ttf', 'otf'],
        ],
        [
            'id' => 'city',
            'label' => 'Материалы города',
            'summary' => 'Городские версии',
            'description' => 'Соберу логотипы городов и городские брендбуки.',
            'prompt' => 'материалы Салехарда',
            'keywords' => ['город', 'города', 'салехард', 'уренгой', 'ноябрьск', 'муницип'],
            'sectionNames' => ['Логотипы городов'],
            'queries' => ['логотипы городов', 'салехард', 'новый уренгой', 'ноябрьск'],
            'suggestedQueries' => ['Салехард', 'Новый Уренгой', 'Ноябрьск'],
        ],
        [
            'id' => 'merch',
            'label' => 'Сувенирка и носители',
            'summary' => 'Сувенирка, полиграфия и диджитал',
            'description' => 'Подберу сувенирку, полиграфию, навигацию и диджитал.',
            'prompt' => 'сувенирка наклейки',
            'keywords' => ['сувенир', 'сувенирка', 'мерч', 'подарок', 'наклейка', 'полиграф', 'навигац', 'диджитал', 'футбол'],
            'sectionNames' => ['Каталог сувенирной продукции'],
            'queries' => ['сувенир', 'сувенирка', 'наклейка', 'полиграфия'],
            'suggestedQueries' => ['сувенир', 'наклейка', 'полиграфия'],
        ],
        [
            'id' => 'graphics',
            'label' => 'SVG, паттерны, графика',
            'summary' => 'SVG и графические элементы',
            'description' => 'Покажу SVG-элементы, паттерны и векторную графику.',
            'prompt' => 'svg паттерн',
            'keywords' => ['svg', 'паттерн', 'иллюстра', 'элемент', 'графика', 'вектор'],
            'sectionNames' => ['Иллюстрации мастер-бренда SVG-элементы', 'Паттерны'],
            'queries' => ['svg', 'паттерн', 'иллюстрации', 'вектор'],
            'suggestedQueries' => ['svg', 'паттерн', 'иллюстрации'],
        ],
    ];
}

function consultant_bootstrap(?array $config = null): array
{
    $resolvedConfig = is_array($config) ? $config : site_config();
    $smartModeEnabled = consultant_llm_enabled($resolvedConfig);
    return [
        'title' => 'Помощник по каталогу',
        'description' => 'Опишите задачу одним сообщением. Помощник сам разберет формат, город и тип материала, подберет реальные разделы и файлы каталога, а затем даст более глубокий ответ по брендбуку и применению.',
        'placeholder' => 'Например: логотип SVG для Салехарда, можно ли менять цвет',
        'intents' => array_map(
            static fn(array $intent): array => [
                'id' => (string) ($intent['id'] ?? ''),
                'label' => (string) ($intent['label'] ?? ''),
                'summary' => (string) ($intent['summary'] ?? ''),
                'description' => (string) ($intent['description'] ?? ''),
                'prompt' => (string) ($intent['prompt'] ?? ''),
            ],
            consultant_intent_definitions()
        ),
        'smartMode' => [
            'enabled' => $smartModeEnabled,
            'provider' => $smartModeEnabled ? 'openai' : '',
            'label' => $smartModeEnabled ? 'Глубокий ответ' : 'Grounded',
        ],
    ];
}

function constructor_city_options(): array
{
    return [
        ['value' => 'ямал', 'label' => 'Ямал'],
        ['value' => 'салехард', 'label' => 'Салехард'],
        ['value' => 'новый уренгой', 'label' => 'Новый Уренгой'],
        ['value' => 'ноябрьск', 'label' => 'Ноябрьск'],
    ];
}

function constructor_base_fields(): array
{
    return [
        'city' => [
            'id' => 'city',
            'type' => 'select',
            'label' => 'Город / версия',
            'required' => true,
            'default' => 'ямал',
            'options' => constructor_city_options(),
        ],
    ];
}

function constructor_solution_definitions(): array
{
    $base = constructor_base_fields();

    return [
        [
            'id' => 'business_card',
            'label' => 'Визитка',
            'summary' => 'Контакты сотрудника',
            'description' => 'Готовая визитка с ФИО, должностью и контактами на базе бренд-материалов региона или города.',
            'icon' => '▣',
            'category' => 'Печать',
            'artifactKind' => 'svg',
            'formatHint' => '90×50 мм • SVG + JSON',
            'consultPrompt' => 'визитка логотип шрифт брендбук',
            'sectionKeywords' => ['логотип', 'брендбук', 'шрифт'],
            'queries' => ['логотип svg {{city}}', 'брендбук {{city}}', 'шрифт otf'],
            'fields' => array_values(array_merge($base, [
                'full_name' => [
                    'id' => 'full_name',
                    'type' => 'text',
                    'label' => 'ФИО',
                    'required' => true,
                    'default' => 'Имя Фамилия',
                    'placeholder' => 'Например: Сергей Иванов',
                    'maxLength' => 80,
                ],
                'role' => [
                    'id' => 'role',
                    'type' => 'text',
                    'label' => 'Должность',
                    'required' => true,
                    'default' => 'Руководитель проекта',
                    'placeholder' => 'Например: Руководитель проекта',
                    'maxLength' => 80,
                ],
                'phone' => [
                    'id' => 'phone',
                    'type' => 'text',
                    'label' => 'Телефон',
                    'required' => true,
                    'default' => '+7 900 000-00-00',
                    'maxLength' => 40,
                ],
                'email' => [
                    'id' => 'email',
                    'type' => 'email',
                    'label' => 'Email',
                    'required' => true,
                    'default' => 'team@yamal.ru',
                    'maxLength' => 120,
                ],
                'department' => [
                    'id' => 'department',
                    'type' => 'text',
                    'label' => 'Подразделение',
                    'required' => false,
                    'default' => 'Бренд-команда',
                    'maxLength' => 80,
                ],
            ])),
        ],
        [
            'id' => 'nameplate',
            'label' => 'Табличка',
            'summary' => 'Кабинет, навигация, зона',
            'description' => 'Шаблон таблички для кабинета, переговорной или навигации с привязкой к городу и месту.',
            'icon' => '▭',
            'category' => 'Навигация',
            'artifactKind' => 'svg',
            'formatHint' => '300×120 мм • SVG + JSON',
            'consultPrompt' => 'табличка навигация логотип брендбук',
            'sectionKeywords' => ['логотип', 'брендбук', 'сувенир', 'полиграф'],
            'queries' => ['логотип svg {{city}}', 'брендбук {{city}}', 'навигация'],
            'fields' => array_values(array_merge($base, [
                'variant' => [
                    'id' => 'variant',
                    'type' => 'select',
                    'label' => 'Тип таблички',
                    'required' => true,
                    'default' => 'cabinet',
                    'options' => [
                        ['value' => 'cabinet', 'label' => 'Кабинетная'],
                        ['value' => 'navigation', 'label' => 'Навигационная'],
                        ['value' => 'zone', 'label' => 'Зональная'],
                    ],
                ],
                'location' => [
                    'id' => 'location',
                    'type' => 'text',
                    'label' => 'Название места',
                    'required' => true,
                    'default' => 'Переговорная Полярная',
                    'maxLength' => 100,
                ],
                'room_number' => [
                    'id' => 'room_number',
                    'type' => 'text',
                    'label' => 'Номер / индекс',
                    'required' => false,
                    'default' => 'B-204',
                    'maxLength' => 24,
                ],
                'subline' => [
                    'id' => 'subline',
                    'type' => 'text',
                    'label' => 'Подпись',
                    'required' => false,
                    'default' => '2 этаж • блок Б',
                    'maxLength' => 80,
                ],
                'size_variant' => [
                    'id' => 'size_variant',
                    'type' => 'select',
                    'label' => 'Размер',
                    'required' => true,
                    'default' => '300x120',
                    'options' => [
                        ['value' => '300x120', 'label' => '300×120 мм'],
                        ['value' => '400x160', 'label' => '400×160 мм'],
                        ['value' => '600x200', 'label' => '600×200 мм'],
                    ],
                ],
                'mount' => [
                    'id' => 'mount',
                    'type' => 'select',
                    'label' => 'Крепление',
                    'required' => false,
                    'default' => 'wall',
                    'options' => [
                        ['value' => 'wall', 'label' => 'Настенное'],
                        ['value' => 'door', 'label' => 'На дверь'],
                        ['value' => 'desktop', 'label' => 'Настольное'],
                    ],
                ],
                'direction' => [
                    'id' => 'direction',
                    'type' => 'select',
                    'label' => 'Направление',
                    'required' => false,
                    'default' => 'none',
                    'options' => [
                        ['value' => 'none', 'label' => 'Без стрелки'],
                        ['value' => 'left', 'label' => 'Налево'],
                        ['value' => 'right', 'label' => 'Направо'],
                        ['value' => 'up', 'label' => 'Вверх'],
                        ['value' => 'down', 'label' => 'Вниз'],
                    ],
                ],
            ])),
        ],
        [
            'id' => 'presentation_deck',
            'label' => 'Презентация',
            'summary' => 'Обложка и brief встречи',
            'description' => 'Структурированный бриф и обложка презентации с рекомендациями по брендбуку и файловому пакету.',
            'icon' => '▤',
            'category' => 'Презентации',
            'artifactKind' => 'brief',
            'formatHint' => '16:9 • SVG cover + HTML/JSON brief',
            'consultPrompt' => 'презентация брендбук логотип шрифт паттерн',
            'sectionKeywords' => ['брендбук', 'логотип', 'шрифт', 'паттер'],
            'queries' => ['брендбук {{city}} pdf', 'логотип svg {{city}}', 'шрифт otf', 'паттерн'],
            'fields' => array_values(array_merge($base, [
                'presentation_mode' => [
                    'id' => 'presentation_mode',
                    'type' => 'select',
                    'label' => 'Сценарий',
                    'required' => true,
                    'default' => 'invest',
                    'options' => [
                        ['value' => 'invest', 'label' => 'Инвест-питч'],
                        ['value' => 'report', 'label' => 'Статус / отчёт'],
                        ['value' => 'pitch', 'label' => 'Партнёрский питч'],
                    ],
                ],
                'title' => [
                    'id' => 'title',
                    'type' => 'text',
                    'label' => 'Название презентации',
                    'required' => true,
                    'default' => 'Инвестиционные возможности Ямала',
                    'maxLength' => 120,
                ],
                'event_name' => [
                    'id' => 'event_name',
                    'type' => 'text',
                    'label' => 'Событие / площадка',
                    'required' => false,
                    'default' => 'Инвестсовет ЯНАО',
                    'maxLength' => 100,
                ],
                'key_message' => [
                    'id' => 'key_message',
                    'type' => 'textarea',
                    'label' => 'Ключевое сообщение',
                    'required' => true,
                    'default' => 'Короткий тезис, который должен остаться у аудитории после встречи.',
                    'rows' => 3,
                    'maxLength' => 240,
                ],
                'structure' => [
                    'id' => 'structure',
                    'type' => 'textarea',
                    'label' => 'Структура слайдов',
                    'required' => false,
                    'default' => "1. Контекст и задача\n2. Что предлагает Ямал\n3. Кейсы и цифры\n4. Следующий шаг",
                    'rows' => 5,
                    'maxLength' => 520,
                ],
                'speaker' => [
                    'id' => 'speaker',
                    'type' => 'text',
                    'label' => 'Спикер',
                    'required' => true,
                    'default' => 'Имя Фамилия',
                    'maxLength' => 80,
                ],
                'speaker_role' => [
                    'id' => 'speaker_role',
                    'type' => 'text',
                    'label' => 'Должность спикера',
                    'required' => false,
                    'default' => 'Руководитель направления',
                    'maxLength' => 80,
                ],
                'audience' => [
                    'id' => 'audience',
                    'type' => 'text',
                    'label' => 'Аудитория',
                    'required' => false,
                    'default' => 'Партнёры и инвесторы',
                    'maxLength' => 80,
                ],
                'slide_count' => [
                    'id' => 'slide_count',
                    'type' => 'number',
                    'label' => 'Количество слайдов',
                    'required' => true,
                    'default' => 12,
                    'min' => 6,
                    'max' => 40,
                ],
            ])),
        ],
        [
            'id' => 'certificate',
            'label' => 'Сертификат',
            'summary' => 'Награда, диплом, сертификат',
            'description' => 'Шаблон сертификата для мероприятий, награждений и внутренних программ.',
            'icon' => '◫',
            'category' => 'Документы',
            'artifactKind' => 'svg',
            'formatHint' => 'A4 • SVG + JSON',
            'consultPrompt' => 'сертификат брендбук логотип паттерн',
            'sectionKeywords' => ['брендбук', 'логотип', 'паттер'],
            'queries' => ['логотип svg {{city}}', 'брендбук {{city}}', 'паттерн'],
            'fields' => array_values(array_merge($base, [
                'recipient' => [
                    'id' => 'recipient',
                    'type' => 'text',
                    'label' => 'Получатель',
                    'required' => true,
                    'default' => 'Имя Фамилия',
                    'maxLength' => 100,
                ],
                'reason' => [
                    'id' => 'reason',
                    'type' => 'textarea',
                    'label' => 'За что выдан',
                    'required' => true,
                    'default' => 'за вклад в развитие проектной инициативы и качественную реализацию программы.',
                    'rows' => 3,
                    'maxLength' => 220,
                ],
                'event_name' => [
                    'id' => 'event_name',
                    'type' => 'text',
                    'label' => 'Событие / программа',
                    'required' => false,
                    'default' => 'Форум северных инициатив',
                    'maxLength' => 100,
                ],
                'signer' => [
                    'id' => 'signer',
                    'type' => 'text',
                    'label' => 'Подписант',
                    'required' => true,
                    'default' => 'Имя Фамилия',
                    'maxLength' => 80,
                ],
                'issue_date' => [
                    'id' => 'issue_date',
                    'type' => 'date',
                    'label' => 'Дата',
                    'required' => true,
                    'default' => date('Y-m-d'),
                ],
            ])),
        ],
        [
            'id' => 'badge',
            'label' => 'Бейдж',
            'summary' => 'Бейдж участника или команды',
            'description' => 'Вертикальный бейдж для мероприятий, волонтёров, участников и организаторов.',
            'icon' => '◧',
            'category' => 'События',
            'artifactKind' => 'svg',
            'formatHint' => '100×140 мм • SVG + JSON',
            'consultPrompt' => 'бейдж логотип шрифт брендбук',
            'sectionKeywords' => ['логотип', 'шрифт', 'брендбук'],
            'queries' => ['логотип svg {{city}}', 'шрифт otf', 'брендбук {{city}}'],
            'fields' => array_values(array_merge($base, [
                'full_name' => [
                    'id' => 'full_name',
                    'type' => 'text',
                    'label' => 'Имя и фамилия',
                    'required' => true,
                    'default' => 'Имя Фамилия',
                    'maxLength' => 80,
                ],
                'role' => [
                    'id' => 'role',
                    'type' => 'text',
                    'label' => 'Роль',
                    'required' => true,
                    'default' => 'Участник',
                    'maxLength' => 60,
                ],
                'event_name' => [
                    'id' => 'event_name',
                    'type' => 'text',
                    'label' => 'Мероприятие',
                    'required' => false,
                    'default' => 'Арктический форум',
                    'maxLength' => 90,
                ],
                'access_level' => [
                    'id' => 'access_level',
                    'type' => 'select',
                    'label' => 'Уровень доступа',
                    'required' => false,
                    'default' => 'standard',
                    'options' => [
                        ['value' => 'standard', 'label' => 'Стандарт'],
                        ['value' => 'speaker', 'label' => 'Спикер'],
                        ['value' => 'staff', 'label' => 'Оргкомитет'],
                        ['value' => 'vip', 'label' => 'VIP'],
                    ],
                ],
            ])),
        ],
        [
            'id' => 'social_post',
            'label' => 'Пост для соцсетей',
            'summary' => 'Анонс и digital-карточка',
            'description' => 'Готовая digital-карточка для анонсов, поздравлений и коротких сообщений.',
            'icon' => '◩',
            'category' => 'Digital',
            'artifactKind' => 'svg',
            'formatHint' => '1:1 / 4:5 • SVG + JSON',
            'consultPrompt' => 'соцсети логотип паттерн svg',
            'sectionKeywords' => ['логотип', 'паттер', 'иллюстра', 'svg'],
            'queries' => ['логотип svg {{city}}', 'паттерн', 'иллюстрации svg'],
            'fields' => array_values(array_merge($base, [
                'headline' => [
                    'id' => 'headline',
                    'type' => 'text',
                    'label' => 'Заголовок',
                    'required' => true,
                    'default' => 'Ямал открывает новые возможности',
                    'maxLength' => 90,
                ],
                'message' => [
                    'id' => 'message',
                    'type' => 'textarea',
                    'label' => 'Текст',
                    'required' => true,
                    'default' => 'Короткий анонс, тезис или поздравление для публикации в digital-каналах.',
                    'rows' => 4,
                    'maxLength' => 240,
                ],
                'cta' => [
                    'id' => 'cta',
                    'type' => 'text',
                    'label' => 'CTA / ссылка',
                    'required' => false,
                    'default' => 'Подробнее на brand.yamal',
                    'maxLength' => 80,
                ],
                'ratio' => [
                    'id' => 'ratio',
                    'type' => 'select',
                    'label' => 'Формат',
                    'required' => true,
                    'default' => '4:5',
                    'options' => [
                        ['value' => '1:1', 'label' => '1:1'],
                        ['value' => '4:5', 'label' => '4:5'],
                        ['value' => '16:9', 'label' => '16:9'],
                    ],
                ],
            ])),
        ],
        [
            'id' => 'letterhead',
            'label' => 'Фирменный бланк',
            'summary' => 'Письмо и официальный лист',
            'description' => 'Шаблон для официальной переписки с шапкой, контактной строкой и местом под подпись.',
            'icon' => '◪',
            'category' => 'Документы',
            'artifactKind' => 'svg',
            'formatHint' => 'A4 • SVG + JSON',
            'consultPrompt' => 'фирменный бланк логотип брендбук шрифт',
            'sectionKeywords' => ['логотип', 'брендбук', 'шрифт'],
            'queries' => ['логотип pdf {{city}}', 'брендбук {{city}}', 'шрифт otf'],
            'fields' => array_values(array_merge($base, [
                'department' => [
                    'id' => 'department',
                    'type' => 'text',
                    'label' => 'Подразделение',
                    'required' => true,
                    'default' => 'Проектный офис',
                    'maxLength' => 80,
                ],
                'document_title' => [
                    'id' => 'document_title',
                    'type' => 'text',
                    'label' => 'Тема письма',
                    'required' => true,
                    'default' => 'Сопроводительное письмо',
                    'maxLength' => 100,
                ],
                'contact_line' => [
                    'id' => 'contact_line',
                    'type' => 'text',
                    'label' => 'Контактная строка',
                    'required' => false,
                    'default' => 'team@yamal.ru • +7 900 000-00-00',
                    'maxLength' => 120,
                ],
                'signer' => [
                    'id' => 'signer',
                    'type' => 'text',
                    'label' => 'Подписант',
                    'required' => false,
                    'default' => 'Имя Фамилия',
                    'maxLength' => 80,
                ],
            ])),
        ],
        [
            'id' => 'rollup',
            'label' => 'Роллап / стенд',
            'summary' => 'Стенд для события или зоны',
            'description' => 'Каркас роллапа или event-стенда с заголовком, подзаголовком и блоком ключевых сообщений.',
            'icon' => '▥',
            'category' => 'События',
            'artifactKind' => 'svg',
            'formatHint' => '85×200 см • SVG preview + JSON',
            'consultPrompt' => 'роллап логотип брендбук полиграфия паттерн',
            'sectionKeywords' => ['логотип', 'брендбук', 'паттер', 'сувенир', 'полиграф'],
            'queries' => ['логотип svg {{city}}', 'брендбук {{city}}', 'паттерн', 'полиграфия'],
            'fields' => array_values(array_merge($base, [
                'headline' => [
                    'id' => 'headline',
                    'type' => 'text',
                    'label' => 'Заголовок',
                    'required' => true,
                    'default' => 'Ямал. Север возможностей',
                    'maxLength' => 90,
                ],
                'subline' => [
                    'id' => 'subline',
                    'type' => 'textarea',
                    'label' => 'Подзаголовок',
                    'required' => true,
                    'default' => 'Короткое сообщение о событии, проекте или площадке, которое будет работать на расстоянии.',
                    'rows' => 3,
                    'maxLength' => 220,
                ],
                'event_name' => [
                    'id' => 'event_name',
                    'type' => 'text',
                    'label' => 'Событие / площадка',
                    'required' => false,
                    'default' => 'Деловая программа',
                    'maxLength' => 90,
                ],
                'size_variant' => [
                    'id' => 'size_variant',
                    'type' => 'select',
                    'label' => 'Размер',
                    'required' => true,
                    'default' => '85x200',
                    'options' => [
                        ['value' => '85x200', 'label' => '85×200 см'],
                        ['value' => '100x200', 'label' => '100×200 см'],
                        ['value' => '120x220', 'label' => '120×220 см'],
                    ],
                ],
            ])),
        ],
    ];
}

function constructor_definition_by_id(string $id): ?array
{
    $normalizedId = trim($id);
    if ($normalizedId === '') {
        return null;
    }
    foreach (constructor_solution_definitions() as $definition) {
        if ((string) ($definition['id'] ?? '') === $normalizedId) {
            return $definition;
        }
    }
    return null;
}

function constructor_bootstrap(): array
{
    return [
        'title' => 'Лаборатория решений',
        'description' => 'Шаблоны для типовых носителей: визитки, таблички, бейджи, сертификаты, бланки, digital-карточки, роллапы и презентации.',
        'items' => array_map(
            static fn(array $definition): array => [
                'id' => (string) ($definition['id'] ?? ''),
                'label' => (string) ($definition['label'] ?? ''),
                'summary' => (string) ($definition['summary'] ?? ''),
                'description' => (string) ($definition['description'] ?? ''),
                'icon' => (string) ($definition['icon'] ?? '▣'),
                'category' => (string) ($definition['category'] ?? ''),
                'formatHint' => (string) ($definition['formatHint'] ?? ''),
                'artifactKind' => (string) ($definition['artifactKind'] ?? ''),
            ],
            constructor_solution_definitions()
        ),
    ];
}

function consultant_city_aliases(): array
{
    return [
        'салехард' => ['салехард', 'схд'],
        'новый уренгой' => ['новый уренгой', 'уренгой', 'ну'],
        'ноябрьск' => ['ноябрьск', 'нск'],
    ];
}

function detect_consultant_city(string $query): string
{
    $source = normalize_text($query);
    if ($source === '') {
        return '';
    }

    foreach (consultant_city_aliases() as $city => $aliases) {
        if (normalized_contains_any($source, $aliases)) {
            return $city;
        }
    }

    return '';
}

function consultant_city_display_name(string $city): string
{
    $normalized = normalize_text($city);
    return match ($normalized) {
        'салехард' => 'Салехард',
        'новый уренгой' => 'Новый Уренгой',
        'ноябрьск' => 'Ноябрьск',
        default => cleanup_folder_label($city),
    };
}

function consultant_city_brandbook_name(string $city): string
{
    $normalized = normalize_text($city);
    return match ($normalized) {
        'салехард' => 'Брендбук Салехард',
        'новый уренгой' => 'Брендбук Новый Уренгой',
        'ноябрьск' => 'Брендбук Ноябрьск',
        default => '',
    };
}

function consultant_format_definitions(): array
{
    return [
        'svg' => ['label' => 'SVG', 'aliases' => ['svg', 'вектор svg']],
        'pdf' => ['label' => 'PDF', 'aliases' => ['pdf', 'пдф']],
        'png' => ['label' => 'PNG', 'aliases' => ['png']],
        'jpg' => ['label' => 'JPG', 'aliases' => ['jpg', 'jpeg', 'изображение', 'картинка']],
        'ai' => ['label' => 'AI', 'aliases' => ['ai', 'illustrator', 'иллюстратор', 'adobe illustrator']],
        'cdr' => ['label' => 'CDR', 'aliases' => ['cdr', 'coreldraw', 'corel']],
        'eps' => ['label' => 'EPS', 'aliases' => ['eps']],
        'zip' => ['label' => 'ZIP', 'aliases' => ['zip', 'архив']],
        'ttf' => ['label' => 'TTF', 'aliases' => ['ttf']],
        'otf' => ['label' => 'OTF', 'aliases' => ['otf']],
    ];
}

function consultant_medium_definitions(): array
{
    return [
        'print' => [
            'label' => 'Для печати',
            'aliases' => ['печать', 'печати', 'печатный', 'полиграфия', 'cmyk'],
        ],
        'digital' => [
            'label' => 'Для экрана',
            'aliases' => ['экран', 'экрана', 'сайт', 'соцсети', 'цифровой', 'digital', 'диджитал', 'web'],
        ],
        'navigation' => [
            'label' => 'Навигация',
            'aliases' => ['навигация', 'баннер', 'щит', 'табличка', 'вывеска', 'стенд'],
        ],
        'merch' => [
            'label' => 'Сувенирка',
            'aliases' => ['сувенир', 'сувенирка', 'мерч', 'одежда', 'футболка', 'худи', 'наклейка', 'подарок'],
        ],
    ];
}

function consultant_source_mode_definitions(): array
{
    return [
        'editable' => [
            'label' => 'Нужен исходник',
            'aliases' => ['исходник', 'редактируемый', 'вектор', 'оригинал', 'editable'],
        ],
        'ready' => [
            'label' => 'Готовый файл',
            'aliases' => ['готовый', 'скачать', 'посмотреть', 'preview'],
        ],
    ];
}

function consultant_application_focus_definitions(): array
{
    return [
        'dark_background' => [
            'label' => 'Тёмный фон',
            'aliases' => ['темный фон', 'тёмный фон', 'темном фоне', 'тёмном фоне', 'черном фоне', 'чёрном фоне', 'dark background'],
        ],
        'color_change' => [
            'label' => 'Изменение цвета',
            'aliases' => ['менять цвет', 'изменить цвет', 'сменить цвет', 'перекрасить', 'другого цвета', 'другим цветом', 'инвертировать цвет', 'цвет логотипа'],
        ],
        'distortion' => [
            'label' => 'Искажение',
            'aliases' => ['растягивать', 'растянуть', 'сжать', 'деформировать', 'искажать', 'исказить', 'менять пропорции', 'пропорции логотипа'],
        ],
        'photo_overlay' => [
            'label' => 'Поверх фото',
            'aliases' => ['поверх фото', 'на фото', 'на фотографии', 'поверх фотографии', 'на изображении', 'на картинке', 'на сложном фоне'],
        ],
        'contractor_handoff' => [
            'label' => 'Передача подрядчику',
            'aliases' => ['подрядчик', 'подрядчику', 'типография', 'в типографию', 'дизайнеру', 'производству', 'что отдать', 'что отправить подрядчику'],
        ],
        'approval_handoff' => [
            'label' => 'Согласование',
            'aliases' => ['согласование', 'на согласование', 'согласовать', 'заказчику', 'руководству', 'на утверждение', 'на соглас'],
        ],
    ];
}

function detect_consultant_formats(string $query): array
{
    $source = normalize_text($query);
    if ($source === '') {
        return [];
    }

    $formats = [];
    foreach (consultant_format_definitions() as $format => $config) {
        foreach (($config['aliases'] ?? []) as $alias) {
            $needle = normalize_text((string) $alias);
            if ($needle !== '' && str_contains($source, $needle)) {
                $formats[$format] = true;
                break;
            }
        }
    }

    return array_keys($formats);
}

function detect_consultant_medium(string $query): string
{
    $source = normalize_text($query);
    if ($source === '') {
        return '';
    }

    $bestKey = '';
    $bestScore = 0;
    foreach (consultant_medium_definitions() as $medium => $config) {
        $score = 0;
        foreach (($config['aliases'] ?? []) as $alias) {
            $needle = normalize_text((string) $alias);
            if ($needle !== '' && str_contains($source, $needle)) {
                $score += mb_strlen($needle, 'UTF-8') >= 5 ? 3 : 1;
            }
        }
        if ($score > $bestScore) {
            $bestScore = $score;
            $bestKey = $medium;
        }
    }

    return $bestKey;
}

function detect_consultant_source_mode(string $query): string
{
    $source = normalize_text($query);
    if ($source === '') {
        return '';
    }

    $bestKey = '';
    $bestScore = 0;
    foreach (consultant_source_mode_definitions() as $mode => $config) {
        $score = 0;
        foreach (($config['aliases'] ?? []) as $alias) {
            $needle = normalize_text((string) $alias);
            if ($needle !== '' && str_contains($source, $needle)) {
                $score += mb_strlen($needle, 'UTF-8') >= 5 ? 3 : 1;
            }
        }
        if ($score > $bestScore) {
            $bestScore = $score;
            $bestKey = $mode;
        }
    }

    if ($bestKey === '' && array_intersect(['ai', 'cdr', 'eps'], detect_consultant_formats($query)) !== []) {
        return 'editable';
    }

    return $bestKey;
}

function detect_consultant_application_focus(string $query): string
{
    $source = normalize_text($query);
    if ($source === '') {
        return '';
    }

    $bestKey = '';
    $bestScore = 0;
    foreach (consultant_application_focus_definitions() as $focus => $config) {
        $score = 0;
        foreach (($config['aliases'] ?? []) as $alias) {
            $needle = normalize_text((string) $alias);
            if ($needle !== '' && str_contains($source, $needle)) {
                $score += mb_strlen($needle, 'UTF-8') >= 7 ? 4 : 2;
            }
        }
        if ($score > $bestScore) {
            $bestScore = $score;
            $bestKey = $focus;
        }
    }

    return $bestKey;
}

function consultant_format_labels(array $formats): array
{
    $labels = [];
    foreach ($formats as $format) {
        $label = (string) (consultant_format_definitions()[$format]['label'] ?? strtoupper((string) $format));
        if ($label !== '' && !in_array($label, $labels, true)) {
            $labels[] = $label;
        }
    }
    return $labels;
}

function consultant_medium_label(string $medium): string
{
    return (string) (consultant_medium_definitions()[$medium]['label'] ?? '');
}

function consultant_source_mode_label(string $mode): string
{
    return (string) (consultant_source_mode_definitions()[$mode]['label'] ?? '');
}

function consultant_application_focus_label(string $focus): string
{
    return (string) (consultant_application_focus_definitions()[$focus]['label'] ?? '');
}

function consultant_intent_by_id(string $intentId): ?array
{
    foreach (consultant_intent_definitions() as $intent) {
        if ((string) ($intent['id'] ?? '') === $intentId) {
            return $intent;
        }
    }

    return null;
}

function detect_consultant_intent(string $query, string $intentId = ''): ?array
{
    $normalizedId = trim($intentId);
    if ($normalizedId !== '') {
        return consultant_intent_by_id($normalizedId);
    }

    $source = normalize_text($query);
    if ($source === '') {
        return null;
    }

    $formats = detect_consultant_formats($query);
    $medium = detect_consultant_medium($query);
    $city = detect_consultant_city($query);
    $applicationFocus = detect_consultant_application_focus($query);
    $bestIntent = null;
    $bestScore = 0;
    foreach (consultant_intent_definitions() as $intent) {
        $score = 0;
        foreach (($intent['keywords'] ?? []) as $keyword) {
            $needle = normalize_text((string) $keyword);
            if ($needle !== '' && str_contains($source, $needle)) {
                $score += mb_strlen($needle, 'UTF-8') >= 5 ? 3 : 1;
            }
        }

        $intentKey = (string) ($intent['id'] ?? '');
        if ($intentKey === 'fonts' && array_intersect($formats, ['ttf', 'otf']) !== []) {
            $score += 12;
        }
        if ($intentKey === 'logo' && (array_intersect($formats, ['svg', 'png', 'pdf', 'ai', 'eps']) !== [] || str_contains($source, 'логотип'))) {
            $score += 6;
        }
        if ($intentKey === 'graphics' && (str_contains($source, 'паттер') || str_contains($source, 'иллюстра') || (in_array('svg', $formats, true) && !str_contains($source, 'логотип')))) {
            $score += 8;
        }
        if ($intentKey === 'brandbook' && str_contains($source, 'брендбук')) {
            $score += 10;
        }
        if ($intentKey === 'city' && $city !== '') {
            $score += str_contains($source, 'брендбук') ? 2 : 7;
        }
        if ($intentKey === 'merch' && in_array($medium, ['merch', 'navigation'], true)) {
            $score += 8;
        }
        if ($applicationFocus === 'dark_background') {
            if ($intentKey === 'logo') {
                $score += 10;
            }
            if ($intentKey === 'graphics') {
                $score += 4;
            }
        }
        if (in_array($applicationFocus, ['color_change', 'distortion', 'photo_overlay'], true)) {
            if ($intentKey === 'logo') {
                $score += 10;
            }
            if ($intentKey === 'brandbook') {
                $score += 8;
            }
            if ($intentKey === 'graphics') {
                $score += 3;
            }
        }
        if (in_array($applicationFocus, ['contractor_handoff', 'approval_handoff'], true)) {
            if ($intentKey === 'brandbook') {
                $score += 10;
            }
            if ($intentKey === 'logo') {
                $score += 8;
            }
            if ($intentKey === 'merch' && in_array($medium, ['merch', 'navigation'], true)) {
                $score += 4;
            }
        }

        if ($score > $bestScore) {
            $bestScore = $score;
            $bestIntent = $intent;
        }
    }

    return $bestScore > 0 ? $bestIntent : null;
}

function consultant_query_is_follow_up(string $query): bool
{
    $source = normalize_text($query);
    if ($source === '') {
        return false;
    }

    if (preg_match('/^(а|и|ещ[eё]|тогда)\b/u', $source) === 1) {
        return true;
    }

    if (preg_match('/^(для|в)\s+(печати|экрана|pdf|svg|png|jpg|jpeg|ai|eps|cdr|ttf|otf)\b/u', $source) === 1) {
        return true;
    }

    if (preg_match('/^(что|как)\s+(по|с)\b/u', $source) === 1) {
        return true;
    }

    return normalized_contains_any($source, [
        'а если',
        'а теперь',
        'а еще',
        'а ещё',
        'нужен исходник',
        'для печати',
        'для экрана',
        'можно ли',
        'на темном фоне',
        'на тёмном фоне',
        'что отправить',
        'что отдать',
        'подрядчику',
        'на согласование',
        'менять цвет',
        'растягивать',
        'на фото',
        'поверх фото',
    ]);
}

function normalize_consultant_memory_context(array $memory): array
{
    $intentId = trim((string) ($memory['intentId'] ?? $memory['intent'] ?? ''));
    $intent = consultant_intent_by_id($intentId);

    $rawCity = trim((string) ($memory['city'] ?? ''));
    $city = '';
    if ($rawCity !== '') {
        $city = detect_consultant_city($rawCity);
        if ($city === '') {
            $normalizedCity = normalize_text($rawCity);
            if (isset(consultant_city_aliases()[$normalizedCity])) {
                $city = $normalizedCity;
            }
        }
    }

    $sourceFormats = $memory['formats'] ?? [];
    if (!is_array($sourceFormats)) {
        $sourceFormats = preg_split('/\s*,\s*/u', trim((string) $sourceFormats), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    }

    $allowedFormats = consultant_format_definitions();
    $formats = [];
    foreach ($sourceFormats as $format) {
        $normalizedFormat = strtolower(trim((string) $format));
        if ($normalizedFormat !== '' && isset($allowedFormats[$normalizedFormat]) && !in_array($normalizedFormat, $formats, true)) {
            $formats[] = $normalizedFormat;
        }
    }

    $medium = trim((string) ($memory['medium'] ?? ''));
    if (!isset(consultant_medium_definitions()[$medium])) {
        $medium = '';
    }

    $sourceMode = trim((string) ($memory['sourceMode'] ?? $memory['source'] ?? ''));
    if (!isset(consultant_source_mode_definitions()[$sourceMode])) {
        $sourceMode = '';
    }

    $applicationFocus = trim((string) ($memory['applicationFocus'] ?? $memory['focus'] ?? ''));
    if (!isset(consultant_application_focus_definitions()[$applicationFocus])) {
        $applicationFocus = '';
    }

    return [
        'intent' => $intent,
        'city' => $city,
        'formats' => $formats,
        'medium' => $medium,
        'sourceMode' => $sourceMode,
        'applicationFocus' => $applicationFocus,
    ];
}

function build_consultant_context(string $query, string $intentId = '', array $memory = []): array
{
    $trimmed = trim($query);
    $formats = detect_consultant_formats($trimmed);
    $medium = detect_consultant_medium($trimmed);
    $sourceMode = detect_consultant_source_mode($trimmed);
    $city = detect_consultant_city($trimmed);
    $applicationFocus = detect_consultant_application_focus($trimmed);
    $intent = detect_consultant_intent($trimmed, $intentId);
    $memoryContext = normalize_consultant_memory_context($memory);
    $memoryIntent = $memoryContext['intent'] ?? null;
    $useMemory = $memoryContext !== []
        && ($intent === null || consultant_query_is_follow_up($trimmed));
    $intentChanged = $intent !== null
        && $memoryIntent !== null
        && (string) ($intent['id'] ?? '') !== (string) ($memoryIntent['id'] ?? '');
    $memoryApplied = false;

    if ($intent === null && $memoryIntent !== null) {
        $intent = $memoryIntent;
        $memoryApplied = true;
    }

    if ($useMemory) {
        if ($city === '' && (string) ($memoryContext['city'] ?? '') !== '') {
            $city = (string) $memoryContext['city'];
            $memoryApplied = true;
        }
        if (!$intentChanged && $formats === [] && ($memoryContext['formats'] ?? []) !== []) {
            $formats = $memoryContext['formats'];
            $memoryApplied = true;
        }
        if (!$intentChanged && $medium === '' && (string) ($memoryContext['medium'] ?? '') !== '') {
            $medium = (string) $memoryContext['medium'];
            $memoryApplied = true;
        }
        if (!$intentChanged && $sourceMode === '' && (string) ($memoryContext['sourceMode'] ?? '') !== '') {
            $sourceMode = (string) $memoryContext['sourceMode'];
            $memoryApplied = true;
        }
    }

    return [
        'query' => $trimmed,
        'intent' => $intent,
        'city' => $city,
        'formats' => $formats,
        'medium' => $medium,
        'sourceMode' => $sourceMode,
        'applicationFocus' => $applicationFocus,
        'memoryApplied' => $memoryApplied,
    ];
}

function consultant_understanding_labels(array $context): array
{
    $labels = [];
    $intent = $context['intent'] ?? null;
    if ($intent !== null) {
        $labels[] = (string) ($intent['summary'] ?? $intent['label'] ?? '');
    }

    $city = (string) ($context['city'] ?? '');
    if ($city !== '') {
        $labels[] = consultant_city_display_name($city);
    }

    foreach (consultant_format_labels($context['formats'] ?? []) as $label) {
        $labels[] = $label;
    }

    $mediumLabel = consultant_medium_label((string) ($context['medium'] ?? ''));
    if ($mediumLabel !== '') {
        $labels[] = $mediumLabel;
    }

    $sourceModeLabel = consultant_source_mode_label((string) ($context['sourceMode'] ?? ''));
    if ($sourceModeLabel !== '') {
        $labels[] = $sourceModeLabel;
    }

    $applicationFocusLabel = consultant_application_focus_label((string) ($context['applicationFocus'] ?? ''));
    if ($applicationFocusLabel !== '') {
        $labels[] = $applicationFocusLabel;
    }

    return array_values(array_filter($labels));
}

function consultant_follow_up_suggestions(array $context): array
{
    $intentId = (string) (($context['intent']['id'] ?? ''));
    $city = (string) ($context['city'] ?? '');
    $formats = $context['formats'] ?? [];
    $applicationFocus = (string) ($context['applicationFocus'] ?? '');
    $followUps = [];
    $seen = [];
    $add = static function (string $label, string $query, string $reason = '') use (&$followUps, &$seen): void {
        $normalized = normalize_text($query);
        if ($label === '' || $query === '' || $normalized === '' || isset($seen[$normalized])) {
            return;
        }
        $seen[$normalized] = true;
        $followUps[] = [
            'label' => $label,
            'query' => $query,
            'reason' => $reason,
        ];
    };

    if ($intentId === '' && $city === '') {
        $add('Логотип', 'логотип svg', 'Если нужен логотип в векторе');
        $add('Брендбук', 'брендбук', 'Если нужен гайд или PDF');
        $add('Шрифты', 'шрифт otf', 'Если нужны гарнитуры');
        $add('Сувенирка', 'сувенирка', 'Если нужны носители и мерч');
        return array_slice($followUps, 0, 4);
    }

    if (in_array($intentId, ['city', 'brandbook'], true) && $city === '') {
        $add('Салехард', 'брендбук Салехард', 'Выбрать городской брендбук');
        $add('Новый Уренгой', 'брендбук Новый Уренгой', 'Выбрать городской брендбук');
        $add('Ноябрьск', 'брендбук Ноябрьск', 'Выбрать городской брендбук');
    }

    if ($intentId === 'logo' && $formats === []) {
        $add('SVG', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'логотип svg'), 'Для вектора и веба');
        $add('PDF', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'логотип pdf'), 'Для печати и согласования');
        if ($applicationFocus === '') {
            $add('Тёмный фон', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'логотип на темном фоне'), 'Какой вариант брать на тёмный фон');
            $add('Подрядчику', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'какой логотип отправить подрядчику'), 'Что отдавать в работу');
        }
        if ($applicationFocus === 'dark_background') {
            $add('Поверх фото', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'логотип поверх фото'), 'Какой вариант брать на фотографии');
            $add('Менять цвет', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'можно ли менять цвет логотипа'), 'Что делать с цветом логотипа');
        }
        if ($applicationFocus === 'photo_overlay') {
            $add('Тёмный фон', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'логотип на темном фоне'), 'Если фон станет ещё темнее');
            $add('Менять цвет', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'можно ли менять цвет логотипа'), 'Можно ли перекрасить логотип под фото');
        }
        if ($applicationFocus === 'color_change') {
            $add('Поверх фото', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'логотип поверх фото'), 'Как вести себя на фото без перекраски');
            $add('Тёмный фон', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'логотип на темном фоне'), 'Какой вариант брать на тёмный фон');
        }
        if ($applicationFocus === 'distortion') {
            $add('Подрядчику', trim(($city !== '' ? consultant_city_display_name($city) . ' ' : '') . 'что отправить подрядчику'), 'Какой файл отдать без ручных деформаций');
            $add('PDF брендбук', trim(($city !== '' ? 'брендбук ' . consultant_city_display_name($city) . ' pdf' : 'брендбук pdf')), 'Проверить правила применения');
        }
    }

    if ($intentId === 'graphics' && $formats === []) {
        $add('SVG элементы', 'svg элементы', 'Если нужен вектор');
        $add('Паттерны', 'паттерн', 'Если нужен орнамент или фон');
        $add('Иллюстрации', 'иллюстрации svg', 'Если нужна графика');
    }

    if ($intentId === 'merch' && (string) ($context['medium'] ?? '') === '') {
        $add('Сувениры', 'сувенир', 'Если нужен мерч и подарки');
        $add('Канцелярия', 'канцелярия', 'Если нужны ручки, блокноты и наборы');
        $add('Полиграфия', 'полиграфия', 'Если нужен баннер, буклет или навигация');
        $add('Диджитал', 'диджитал', 'Если нужны цифровые носители');
    }

    if ($intentId === 'brandbook' && $city !== '' && !in_array('pdf', $formats, true)) {
        $add('PDF брендбук', 'брендбук ' . consultant_city_display_name($city) . ' pdf', 'Открыть готовый PDF');
        if ($applicationFocus === '') {
            $add('На согласование', 'что отправить на согласование ' . consultant_city_display_name($city), 'Какой пакет показать без исходников');
        }
    }

    if ($intentId === 'fonts' && array_intersect($formats, ['ttf', 'otf']) === []) {
        $add('TTF', 'шрифт ttf', 'Если нужен TTF');
        $add('OTF', 'шрифт otf', 'Если нужен OTF');
        $add('Архив', 'шрифт zip', 'Если нужен архив со шрифтами');
    }

    return array_slice($followUps, 0, 4);
}

function detect_consultant_brandbook_topic(array $context): string
{
    $source = normalize_text((string) ($context['query'] ?? ''));
    $intentId = (string) (($context['intent']['id'] ?? ''));
    $city = (string) ($context['city'] ?? '');
    $formats = $context['formats'] ?? [];
    $medium = (string) ($context['medium'] ?? '');
    $sourceMode = (string) ($context['sourceMode'] ?? '');
    $applicationFocus = (string) ($context['applicationFocus'] ?? '');

    if ($intentId === 'fonts' || normalized_contains_any($source, ['шрифт', 'гарнитур', 'ttf', 'otf', 'font'])) {
        return 'fonts';
    }

    if ($applicationFocus === 'dark_background') {
        return 'background_usage';
    }

    if ($applicationFocus === 'color_change') {
        return 'color_change';
    }

    if ($applicationFocus === 'distortion') {
        return 'distortion';
    }

    if ($applicationFocus === 'photo_overlay') {
        return 'photo_overlay';
    }

    if ($applicationFocus === 'contractor_handoff') {
        return 'contractor_handoff';
    }

    if ($applicationFocus === 'approval_handoff') {
        return 'approval_handoff';
    }

    if ($intentId === 'graphics' || normalized_contains_any($source, ['цвет', 'палитр', 'паттер', 'иллюстра', 'орнамент', 'фон'])) {
        return 'colors_patterns';
    }

    if ($sourceMode === 'editable' || normalized_contains_any($source, ['исходник', 'редактир', 'ai', 'eps', 'cdr'])) {
        return 'source_files';
    }

    if ($intentId === 'merch' || in_array($medium, ['merch', 'navigation', 'digital'], true) || normalized_contains_any($source, ['носител', 'макет', 'сувенир', 'полиграф', 'баннер', 'навигац', 'диджитал'])) {
        return 'carriers';
    }

    if ($intentId === 'brandbook' && $city !== '') {
        return 'city_brandbook';
    }

    if ($intentId === 'brandbook') {
        return 'brandbook_start';
    }

    if ($intentId === 'logo' && ($formats !== [] || normalized_contains_any($source, ['формат', 'pdf', 'svg', 'png', 'jpg']))) {
        return 'logo_formats';
    }

    if ($intentId === 'logo') {
        return 'logo_rules';
    }

    if ($intentId === 'city' && $city !== '') {
        return 'city_brandbook';
    }

    if ($city !== '' && normalized_contains_any($source, ['брендбук', 'логотип'])) {
        return 'city_brandbook';
    }

    return 'brandbook_start';
}

function consultant_section_label_by_keywords(array $sections, array $keywords = []): string
{
    if ($sections === []) {
        return '';
    }

    foreach ($sections as $section) {
        $label = (string) ($section['label'] ?? $section['name'] ?? '');
        $source = normalize_text($label . ' ' . (string) ($section['name'] ?? ''));
        if ($source === '') {
            continue;
        }
        foreach ($keywords as $keyword) {
            $needle = normalize_text((string) $keyword);
            if ($needle !== '' && str_contains($source, $needle)) {
                return $label;
            }
        }
    }

    return (string) ($sections[0]['label'] ?? $sections[0]['name'] ?? '');
}

function consultant_brandbook_advice(array $context, array $sections): array
{
    $topic = detect_consultant_brandbook_topic($context);
    $city = (string) ($context['city'] ?? '');
    $cityLabel = $city !== '' ? consultant_city_display_name($city) : '';
    $logoSection = consultant_section_label_by_keywords($sections, ['логотип', 'знак']);
    $brandbookSection = consultant_section_label_by_keywords($sections, ['брендбук']);
    $graphicsSection = consultant_section_label_by_keywords($sections, ['паттер', 'иллюстра', 'svg']);
    $fontSection = consultant_section_label_by_keywords($sections, ['шрифт']);
    $carrierSection = consultant_section_label_by_keywords($sections, ['сувенир', 'полиграф', 'диджитал', 'навигац', 'каталог']);
    $citySection = consultant_section_label_by_keywords($sections, ['город']);
    $advice = [
        'topic' => $topic,
        'title' => '',
        'summary' => '',
        'bullets' => [],
        'nextStep' => '',
    ];

    switch ($topic) {
        case 'background_usage':
            $advice['title'] = 'По брендбуку: логотип на фоне';
            $advice['summary'] = 'На тёмном или сложном фоне лучше брать уже подготовленную контрастную версию, а не перекрашивать логотип вручную.';
            $advice['bullets'] = array_values(array_filter([
                'Сначала ищите светлую, белую или одноцветную версию в разделе логотипов или фирменного знака.',
                'Если читаемость падает, лучше взять знак или упрощённую версию, чем добавлять тени, обводки и эффекты.',
                $cityLabel !== '' ? 'Для ' . $cityLabel . ' проверьте именно городские варианты, а не общий региональный файл.' : 'Перед публикацией сверьте выбранный вариант с PDF брендбука.',
            ]));
            $advice['nextStep'] = $logoSection !== ''
                ? 'Откройте раздел «' . $logoSection . '» и проверьте светлые или одноцветные версии.'
                : 'Сначала откройте раздел с логотипами и проверьте контрастные варианты.';
            break;

        case 'color_change':
            $advice['title'] = 'По брендбуку: можно ли менять цвет';
            $advice['summary'] = 'Логотип лучше не перекрашивать под задачу вручную, а брать уже предусмотренный вариант из брендбука.';
            $advice['bullets'] = array_values(array_filter([
                'Если нужен другой контраст, сначала ищите готовую светлую, тёмную или одноцветную версию.',
                'Подгонять логотип под фон случайным цветом хуже, чем выбрать правильный фон или официальную версию.',
                $cityLabel !== '' ? 'Для ' . $cityLabel . ' сверяйтесь именно с городским брендбуком и городскими версиями.' : 'Если есть сомнение, ориентируйтесь на PDF брендбука, а не на отдельный макет.',
            ]));
            $advice['nextStep'] = $brandbookSection !== ''
                ? 'Откройте «' . $brandbookSection . '» и проверьте допустимые версии цвета, затем перейдите в «' . ($logoSection !== '' ? $logoSection : 'логотипы') . '».'
                : 'Сначала откройте брендбук, затем возьмите официальную цветовую версию логотипа.';
            break;

        case 'distortion':
            $advice['title'] = 'По брендбуку: можно ли растягивать логотип';
            $advice['summary'] = 'Логотип лучше не деформировать и не менять пропорции. Если не помещается, меняйте компоновку, а не сам знак.';
            $advice['bullets'] = [
                'Не растягивайте и не сжимайте логотип по одной стороне: это ломает форму и узнаваемость.',
                'Если места мало, лучше выбрать другой вариант логотипа, знак без подписи или пересобрать композицию.',
                'Для передачи подрядчику отдавайте векторный или PDF-файл, а не вручную искажённое изображение.',
            ];
            $advice['nextStep'] = $brandbookSection !== ''
                ? 'Откройте «' . $brandbookSection . '» и проверьте правила применения, затем используйте исходный файл из раздела «' . ($logoSection !== '' ? $logoSection : 'логотипы') . '».'
                : 'Сначала проверьте брендбук и возьмите исходный логотип без ручных деформаций.';
            break;

        case 'photo_overlay':
            $advice['title'] = 'По брендбуку: логотип поверх фото';
            $advice['summary'] = 'Ставить логотип поверх фотографии можно только если он остаётся читаемым и не спорит с изображением.';
            $advice['bullets'] = [
                'На пёстром фото лучше использовать светлую или тёмную официальную версию, а не перекрашивать логотип под снимок.',
                'Если фото слишком активное, лучше добавить спокойную подложку, увеличить чистое поле или выбрать другой кадр.',
                'Если читаемость не держится, лучше перенести логотип на более спокойный участок или вынести его из фото.',
            ];
            $advice['nextStep'] = $logoSection !== ''
                ? 'Откройте раздел «' . $logoSection . '» и проверьте контрастные варианты для размещения поверх фото.'
                : 'Сначала откройте раздел с логотипами и выберите контрастную официальную версию.';
            break;

        case 'contractor_handoff':
            $advice['title'] = 'По брендбуку: что отдавать подрядчику';
            $advice['summary'] = 'Подрядчику лучше отдавать пакет под задачу: готовый PDF для проверки и исходник только если он будет адаптировать макет.';
            $advice['bullets'] = [
                'Для типографии и производства обычно нужны PDF и векторный исходник AI, EPS или CDR.',
                'Для веб-разработчика или подрядчика без правок чаще достаточно SVG, PNG или готового PDF.',
                'Если подрядчик собирает носитель с нуля, добавьте брендбук или ссылку на профильный раздел, а не только один файл.',
            ];
            $workSection = $logoSection !== '' ? $logoSection : ($carrierSection !== '' ? $carrierSection : 'профильный раздел');
            $advice['nextStep'] = $brandbookSection !== ''
                ? 'Сначала откройте «' . $brandbookSection . '», затем выберите рабочий файл в разделе «' . $workSection . '».'
                : 'Откройте брендбук и профильный раздел с логотипом или носителем, затем соберите пакет для подрядчика.';
            break;

        case 'approval_handoff':
            $advice['title'] = 'По брендбуку: что отправлять на согласование';
            $advice['summary'] = 'На согласование лучше отправлять понятный пакет: брендбук, готовый PDF и превью, а не сырые исходники.';
            $advice['bullets'] = [
                'Для согласования удобнее PDF брендбука и готовый PDF-макет или логотип.',
                'Исходники AI, EPS и CDR обычно не нужны на этапе утверждения.',
                'Если нужно быстро показать вариант, дайте превью PNG или PDF и ссылку на полный раздел каталога.',
            ];
            $advice['nextStep'] = $brandbookSection !== ''
                ? 'Откройте «' . $brandbookSection . '» и соберите PDF-пакет для согласования.'
                : 'Сначала откройте брендбук и выберите готовые PDF-файлы для согласования.';
            break;

        case 'city_brandbook':
            $advice['title'] = $cityLabel !== '' ? 'По брендбуку: ' . $cityLabel : 'По брендбуку: городская версия';
            $advice['summary'] = 'Для городских материалов сначала сверяйтесь с городским брендбуком, а уже потом выбирайте логотипы и носители.';
            $advice['bullets'] = array_values(array_filter([
                $cityLabel !== '' ? 'Для официальной версии начните с брендбука ' . $cityLabel . '.' : 'Сначала откройте соответствующий городской брендбук.',
                'Для использования удобны готовые PDF, SVG и PNG, для адаптации нужны AI, EPS, CDR или SVG.',
                'После брендбука проверьте городские логотипы и профильные макеты под нужный носитель.',
            ]));
            $advice['nextStep'] = $brandbookSection !== ''
                ? 'Сначала откройте раздел «' . $brandbookSection . '», затем проверьте «' . ($citySection !== '' ? $citySection : $logoSection) . '».'
                : 'Сначала откройте городской брендбук, затем перейдите к логотипам города.';
            break;

        case 'logo_formats':
            $advice['title'] = 'По брендбуку: какой формат брать';
            $advice['summary'] = 'Для использования берите готовый файл, а для изменений только исходник.';
            $advice['bullets'] = [
                'SVG удобен для веба, презентаций и масштабирования без потери качества.',
                'PDF подходит для согласования и чаще всего для печати.',
                'AI, EPS и CDR нужны только если дизайнер будет менять макет или собирать новый носитель.',
            ];
            $advice['nextStep'] = $logoSection !== ''
                ? 'Откройте раздел «' . $logoSection . '» и выберите нужный формат.'
                : 'Сначала откройте раздел с логотипами и выберите готовый формат.';
            break;

        case 'logo_rules':
            $advice['title'] = 'По брендбуку: как брать логотип';
            $advice['summary'] = 'Сначала определите, нужен общий логотип, фирменный знак или городская версия.';
            $advice['bullets'] = array_values(array_filter([
                'Для готового использования обычно достаточно SVG, PDF или PNG.',
                'Если нужен только знак без подписи, ищите связанный раздел с фирменным знаком.',
                $cityLabel !== '' ? 'Для ' . $cityLabel . ' проверьте, что взята именно городская версия, а не общий региональный логотип.' : 'Если задача привязана к городу, уточните городскую версию брендбука.',
            ]));
            $advice['nextStep'] = $logoSection !== ''
                ? 'Откройте раздел «' . $logoSection . '» и сравните готовые варианты.'
                : 'Сначала откройте раздел с логотипами или фирменным знаком.';
            break;

        case 'fonts':
            $advice['title'] = 'По брендбуку: работа со шрифтами';
            $advice['summary'] = 'Шрифты лучше брать из выделенного раздела, а не из случайных вложений брендбука.';
            $advice['bullets'] = [
                'OTF чаще удобен для дизайна, TTF полезен для более широкой совместимости.',
                'ZIP имеет смысл, когда нужен полный пакет шрифтов одним архивом.',
                'Перед печатью или передачей подрядчику проверьте установку шрифта или переведите текст в кривые.',
            ];
            $advice['nextStep'] = $fontSection !== ''
                ? 'Откройте раздел «' . $fontSection . '» и выберите нужный формат.'
                : 'Сначала откройте раздел со шрифтами и заберите нужный пакет.';
            break;

        case 'colors_patterns':
            $advice['title'] = 'По брендбуку: цвет и паттерны';
            $advice['summary'] = 'Палитру и паттерны лучше сверять по брендбуку, а потом брать чистые графические файлы.';
            $advice['bullets'] = [
                'Если нужен фон, орнамент или графический элемент, сначала проверьте паттерны и SVG-элементы.',
                'Для печати чаще нужны PDF, AI или EPS, для экрана подойдут SVG и PNG.',
                'Если есть сомнение по сочетанию цветов, брендбук важнее любого отдельного макета.',
            ];
            $advice['nextStep'] = $graphicsSection !== ''
                ? 'Откройте раздел «' . $graphicsSection . '» и сопоставьте его с брендбуком.'
                : 'Сначала сверяйтесь с брендбуком, затем ищите паттерны и SVG-элементы.';
            break;

        case 'source_files':
            $advice['title'] = 'По брендбуку: когда нужен исходник';
            $advice['summary'] = 'Исходники берите только если макет будут адаптировать, а не просто использовать как есть.';
            $advice['bullets'] = [
                'AI, EPS и CDR нужны для редактирования и сборки новых носителей.',
                'SVG тоже может быть рабочим исходником, если правки не требуют редкой вёрстки.',
                'Для согласования и передачи без правок обычно достаточно PDF или готового SVG.',
            ];
            $advice['nextStep'] = $logoSection !== ''
                ? 'Начните с раздела «' . $logoSection . '» и ищите векторные исходники.'
                : 'Ищите исходники в профильном разделе с логотипами или графикой.';
            break;

        case 'carriers':
            $advice['title'] = 'По брендбуку: носители и макеты';
            $advice['summary'] = 'Для носителей сначала полезно свериться с брендбуком, а потом взять профильный макет под задачу.';
            $advice['bullets'] = [
                'Для согласования с заказчиком удобнее готовый PDF-макет.',
                'Если подрядчик будет адаптировать носитель, лучше брать исходник или векторный файл.',
                'Для сувенирки, полиграфии, навигации и диджитала лучше выбирать файлы из профильных разделов, а не из случайных примеров.',
            ];
            $advice['nextStep'] = $carrierSection !== ''
                ? 'Откройте раздел «' . $carrierSection . '» после проверки брендбука.'
                : 'Сначала сверяйтесь с брендбуком, затем переходите в раздел с нужным типом носителя.';
            break;

        case 'brandbook_start':
        default:
            $advice['title'] = 'По брендбуку: с чего начать';
            $advice['summary'] = 'Брендбук лучше открывать первым документом, а затем переходить в разделы с файлами.';
            $advice['bullets'] = array_values(array_filter([
                'Сначала откройте PDF брендбука или мастер-бренд, чтобы увидеть правила применения.',
                $cityLabel === '' ? 'Если нужен конкретный город, уточните Салехард, Новый Уренгой или Ноябрьск.' : 'Если задача привязана к городу, держитесь городской версии брендбука.',
                'После брендбука переходите в разделы с логотипами, паттернами, шрифтами и макетами.',
            ]));
            $advice['nextStep'] = $brandbookSection !== ''
                ? 'Откройте раздел «' . $brandbookSection . '» и начните с PDF.'
                : 'Сначала откройте раздел с брендбуком, затем переходите к файлам.';
            break;
    }

    $advice['bullets'] = array_values(array_slice(array_filter(array_map(static fn($item): string => trim((string) $item), $advice['bullets'])), 0, 3));
    return $advice;
}

function constructor_present_definition(array $definition): array
{
    return [
        'id' => (string) ($definition['id'] ?? ''),
        'label' => (string) ($definition['label'] ?? ''),
        'summary' => (string) ($definition['summary'] ?? ''),
        'description' => (string) ($definition['description'] ?? ''),
        'icon' => (string) ($definition['icon'] ?? '▣'),
        'category' => (string) ($definition['category'] ?? ''),
        'artifactKind' => (string) ($definition['artifactKind'] ?? ''),
        'formatHint' => (string) ($definition['formatHint'] ?? ''),
        'fields' => array_map(
            static function (array $field): array {
                return [
                    'id' => (string) ($field['id'] ?? ''),
                    'type' => (string) ($field['type'] ?? 'text'),
                    'label' => (string) ($field['label'] ?? ''),
                    'required' => (bool) ($field['required'] ?? false),
                    'default' => $field['default'] ?? '',
                    'placeholder' => (string) ($field['placeholder'] ?? ''),
                    'rows' => (int) ($field['rows'] ?? 0),
                    'min' => isset($field['min']) ? (int) $field['min'] : null,
                    'max' => isset($field['max']) ? (int) $field['max'] : null,
                    'maxLength' => isset($field['maxLength']) ? (int) $field['maxLength'] : 0,
                    'options' => array_values(array_map(
                        static fn(array $option): array => [
                            'value' => (string) ($option['value'] ?? ''),
                            'label' => (string) ($option['label'] ?? ''),
                        ],
                        array_filter($field['options'] ?? [], static fn($item): bool => is_array($item))
                    )),
                ];
            },
            array_filter($definition['fields'] ?? [], static fn($item): bool => is_array($item))
        ),
    ];
}

function constructor_default_input(array $definition): array
{
    $out = [];
    foreach (($definition['fields'] ?? []) as $field) {
        if (!is_array($field)) {
            continue;
        }
        $fieldId = (string) ($field['id'] ?? '');
        if ($fieldId === '') {
            continue;
        }
        $out[$fieldId] = $field['default'] ?? '';
    }
    return $out;
}

function constructor_allowed_option_values(array $field): array
{
    $values = [];
    foreach (($field['options'] ?? []) as $option) {
        if (!is_array($option)) {
            continue;
        }
        $value = trim((string) ($option['value'] ?? ''));
        if ($value !== '') {
            $values[] = $value;
        }
    }
    return $values;
}

function constructor_normalize_field_value(array $field, $rawValue)
{
    $fieldType = (string) ($field['type'] ?? 'text');
    $defaultValue = $field['default'] ?? '';
    $maxLength = max(0, (int) ($field['maxLength'] ?? 0));

    if ($fieldType === 'number') {
        $numeric = (int) $rawValue;
        if ($numeric === 0 && !is_numeric($rawValue)) {
            $numeric = (int) $defaultValue;
        }
        if (isset($field['min'])) {
            $numeric = max((int) $field['min'], $numeric);
        }
        if (isset($field['max'])) {
            $numeric = min((int) $field['max'], $numeric);
        }
        return $numeric;
    }

    $value = trim((string) $rawValue);
    if ($value === '') {
        $value = trim((string) $defaultValue);
    }
    if ($maxLength > 0) {
        $value = mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    if ($fieldType === 'select') {
        $allowed = constructor_allowed_option_values($field);
        if ($allowed !== [] && !in_array($value, $allowed, true)) {
            $value = (string) ($defaultValue ?: $allowed[0]);
        }
    }

    if ($fieldType === 'date' && $value !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        $value = (string) $defaultValue;
    }

    return $value;
}

function constructor_normalize_input(array $definition, array $input): array
{
    $normalized = constructor_default_input($definition);
    foreach (($definition['fields'] ?? []) as $field) {
        if (!is_array($field)) {
            continue;
        }
        $fieldId = (string) ($field['id'] ?? '');
        if ($fieldId === '') {
            continue;
        }
        $normalized[$fieldId] = constructor_normalize_field_value($field, $input[$fieldId] ?? $normalized[$fieldId] ?? '');
    }
    return $normalized;
}

function constructor_city_label(string $city): string
{
    $normalized = normalize_text($city);
    if ($normalized === 'ямал') {
        return 'Ямал';
    }
    return consultant_city_display_name($city);
}

function constructor_query_value(string $template, array $input): string
{
    $cityValue = (string) ($input['city'] ?? '');
    $cityLabel = constructor_city_label($cityValue);
    $query = str_replace(
        ['{{city}}', '{{city_display}}'],
        [$cityValue !== '' ? $cityLabel : '', $cityLabel],
        $template
    );
    return trim(preg_replace('/\s+/u', ' ', $query) ?: '');
}

function constructor_asset_data_uri(string $relativePath, string $mimeType): string
{
    static $cache = [];
    $cacheKey = $relativePath . '|' . $mimeType;
    if (isset($cache[$cacheKey])) {
        return $cache[$cacheKey];
    }

    $fullPath = dirname(__DIR__) . '/' . ltrim($relativePath, '/');
    if (!is_file($fullPath)) {
        return '';
    }
    $content = file_get_contents($fullPath);
    if ($content === false || $content === '') {
        return '';
    }
    $cache[$cacheKey] = 'data:' . $mimeType . ';base64,' . base64_encode($content);
    return $cache[$cacheKey];
}

function constructor_svg_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function constructor_svg_split_long_token(string $token, int $maxChars): array
{
    if ($maxChars <= 0 || mb_strlen($token, 'UTF-8') <= $maxChars) {
        return [$token, ''];
    }

    $prefix = mb_substr($token, 0, min(mb_strlen($token, 'UTF-8'), $maxChars + 1), 'UTF-8');
    $splitAfter = 0;
    foreach (['-', '/', '_', '@', '.'] as $separator) {
        $position = mb_strrpos($prefix, $separator, 0, 'UTF-8');
        if ($position !== false) {
            $splitAfter = max($splitAfter, (int) $position + 1);
        }
    }

    if ($splitAfter <= 1 || $splitAfter >= mb_strlen($token, 'UTF-8')) {
        $splitAfter = $maxChars;
    }

    $head = trim((string) mb_substr($token, 0, $splitAfter, 'UTF-8'));
    $tail = trim((string) mb_substr($token, $splitAfter, null, 'UTF-8'));

    if ($head === '' || $tail === '') {
        $head = trim((string) mb_substr($token, 0, $maxChars, 'UTF-8'));
        $tail = trim((string) mb_substr($token, $maxChars, null, 'UTF-8'));
    }

    return [$head, $tail];
}

function constructor_svg_wrap_lines_meta(string $text, int $maxChars, int $maxLines = 3): array
{
    $source = trim(preg_replace('/\s+/u', ' ', $text) ?: '');
    if ($source === '') {
        return [
            'source' => '',
            'lines' => [],
            'truncated' => false,
        ];
    }
    if ($maxChars <= 0) {
        return [
            'source' => $source,
            'lines' => [$source],
            'truncated' => false,
        ];
    }

    $words = preg_split('/\s+/u', $source) ?: [$source];
    $lines = [];
    $current = '';
    $hasOverflow = false;
    for ($index = 0; $index < count($words); $index++) {
        $word = (string) ($words[$index] ?? '');
        $candidate = trim($current === '' ? $word : $current . ' ' . $word);
        if (mb_strlen($candidate, 'UTF-8') <= $maxChars) {
            $current = $candidate;
            continue;
        }
        if ($current === '') {
            [$current, $rest] = constructor_svg_split_long_token($word, $maxChars);
            if ($rest !== '') {
                array_splice($words, $index + 1, 0, [$rest]);
            }
            continue;
        }
        $lines[] = $current;
        $current = $word;
        if (count($lines) >= $maxLines - 1) {
            $remaining = array_slice($words, $index + 1);
            if ($remaining !== []) {
                $current = trim($current . ' ' . implode(' ', $remaining));
                $hasOverflow = true;
            }
            break;
        }
    }

    if ($current !== '' && count($lines) < $maxLines) {
        $lines[] = $current;
    }

    $lines = array_values(array_filter($lines));
    if (count($lines) > $maxLines) {
        $lines = array_slice($lines, 0, $maxLines);
        $hasOverflow = true;
    }
    if ($lines !== []) {
        $lastIndex = count($lines) - 1;
        if ($hasOverflow || mb_strlen($source, 'UTF-8') > mb_strlen(implode(' ', $lines), 'UTF-8')) {
            $lines[$lastIndex] = rtrim(mb_substr($lines[$lastIndex], 0, max(1, $maxChars - 1), 'UTF-8'), " \t\n\r\0\x0B.") . '…';
        }
    }
    return [
        'source' => $source,
        'lines' => $lines,
        'truncated' => $hasOverflow || mb_strlen($source, 'UTF-8') > mb_strlen(implode(' ', $lines), 'UTF-8'),
    ];
}

function constructor_svg_wrap_lines(string $text, int $maxChars, int $maxLines = 3): array
{
    return constructor_svg_wrap_lines_meta($text, $maxChars, $maxLines)['lines'];
}

function constructor_svg_class_metrics(string $className): array
{
    return match ($className) {
        'title' => ['fontSize' => 64.0, 'minFontSize' => 36.0, 'lineHeightRatio' => 1.06, 'charWidth' => 0.56],
        'headline' => ['fontSize' => 92.0, 'minFontSize' => 42.0, 'lineHeightRatio' => 0.94, 'charWidth' => 0.58],
        'subhead' => ['fontSize' => 36.0, 'minFontSize' => 22.0, 'lineHeightRatio' => 1.16, 'charWidth' => 0.57],
        'body' => ['fontSize' => 30.0, 'minFontSize' => 18.0, 'lineHeightRatio' => 1.2, 'charWidth' => 0.55],
        'small' => ['fontSize' => 24.0, 'minFontSize' => 16.0, 'lineHeightRatio' => 1.18, 'charWidth' => 0.54],
        'tiny' => ['fontSize' => 20.0, 'minFontSize' => 13.0, 'lineHeightRatio' => 1.15, 'charWidth' => 0.6],
        'badge' => ['fontSize' => 28.0, 'minFontSize' => 18.0, 'lineHeightRatio' => 1.0, 'charWidth' => 0.62],
        default => ['fontSize' => 24.0, 'minFontSize' => 16.0, 'lineHeightRatio' => 1.18, 'charWidth' => 0.55],
    };
}

function constructor_svg_measure_line_units(string $line): float
{
    $characters = preg_split('//u', $line, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $units = 0.0;
    foreach ($characters as $character) {
        if (preg_match('/\s/u', $character) === 1) {
            $units += 0.34;
            continue;
        }
        if (preg_match('/[.,:;!?()"\'«»„“”’`\\/\\\\\\[\\]{}\\-]/u', $character) === 1) {
            $units += 0.44;
            continue;
        }
        if (preg_match('/[0-9]/u', $character) === 1) {
            $units += 0.74;
            continue;
        }
        if (preg_match('/[WMЖЩЮЫQGO@#%&]/u', $character) === 1) {
            $units += 1.04;
            continue;
        }
        if (preg_match('/[ilI1jtfr|]/u', $character) === 1) {
            $units += 0.5;
            continue;
        }
        $units += 0.82;
    }
    return max(1.0, $units);
}

function constructor_svg_text_style(array $lines, string $className, array $options = []): array
{
    $metrics = constructor_svg_class_metrics($className);
    $fontSize = isset($options['baseFontSize']) ? (float) $options['baseFontSize'] : (float) $metrics['fontSize'];
    $minFontSize = isset($options['minFontSize']) ? (float) $options['minFontSize'] : (float) $metrics['minFontSize'];
    $lineHeightRatio = isset($options['lineHeightRatio']) ? (float) $options['lineHeightRatio'] : (float) $metrics['lineHeightRatio'];
    $charWidth = isset($options['charWidth']) ? (float) $options['charWidth'] : (float) $metrics['charWidth'];
    $widthSafety = isset($options['widthSafety']) ? (float) $options['widthSafety'] : 0.92;
    $heightSafety = isset($options['heightSafety']) ? (float) $options['heightSafety'] : 0.94;

    if (isset($options['maxWidth']) && (float) $options['maxWidth'] > 0.0) {
        $maxUnits = 1.0;
        foreach ($lines as $line) {
            $maxUnits = max($maxUnits, constructor_svg_measure_line_units((string) $line));
        }
        $safeWidth = max(1.0, ((float) $options['maxWidth']) * max(0.6, min(1.0, $widthSafety)));
        $fontSize = min($fontSize, $safeWidth / max(1.0, $maxUnits * $charWidth));
    }

    if (isset($options['maxHeight']) && (float) $options['maxHeight'] > 0.0) {
        $lineCount = max(1, count($lines));
        $heightUnits = 1.0 + (max(0, $lineCount - 1) * $lineHeightRatio);
        $safeHeight = max(1.0, ((float) $options['maxHeight']) * max(0.6, min(1.0, $heightSafety)));
        $fontSize = min($fontSize, $safeHeight / max(1.0, $heightUnits));
    }

    $fontSize = max($minFontSize, min((float) $metrics['fontSize'], floor($fontSize * 10) / 10));
    $lineHeight = isset($options['lineHeight'])
        ? (float) $options['lineHeight']
        : round($fontSize * $lineHeightRatio, 1);

    $fontSizeString = rtrim(rtrim(number_format($fontSize, 1, '.', ''), '0'), '.');

    return [
        'fontSize' => $fontSize,
        'lineHeight' => $lineHeight,
        'style' => 'font-size:' . $fontSizeString . 'px;',
    ];
}

function constructor_svg_render_text(float $x, float $y, array $lines, string $className, float|array $lineHeightOrOptions, string $anchor = 'start'): string
{
    if ($lines === []) {
        return '';
    }

    $options = is_array($lineHeightOrOptions) ? $lineHeightOrOptions : ['lineHeight' => (float) $lineHeightOrOptions];
    $resolvedAnchor = (string) ($options['anchor'] ?? $anchor);
    $textStyle = constructor_svg_text_style($lines, $className, $options);
    $safeClass = constructor_svg_escape($className);
    $safeAnchor = constructor_svg_escape($resolvedAnchor);
    $safeStyle = constructor_svg_escape((string) ($textStyle['style'] ?? ''));
    $out = '<text class="' . $safeClass . '" x="' . $x . '" y="' . $y . '" text-anchor="' . $safeAnchor . '" style="' . $safeStyle . '">';
    foreach (array_values($lines) as $index => $line) {
        $dy = $index === 0 ? '0' : (string) $textStyle['lineHeight'];
        $out .= '<tspan x="' . $x . '" dy="' . $dy . '">' . constructor_svg_escape($line) . '</tspan>';
    }
    $out .= '</text>';
    return $out;
}

function constructor_svg_fit_text_block(string $text, string $className, float $maxWidth, float $maxHeight, int $maxLines = 3, array $options = []): array
{
    $source = trim(preg_replace('/\s+/u', ' ', $text) ?: '');
    if ($source === '') {
        return [
            'lines' => [],
            'fontSize' => 0.0,
            'lineHeight' => 0.0,
            'truncated' => false,
        ];
    }

    $length = mb_strlen($source, 'UTF-8');
    $searchStart = 4;
    $searchEnd = min(160, max($searchStart, $length));
    $best = null;
    $bestUntruncated = null;

    for ($maxChars = $searchStart; $maxChars <= $searchEnd; $maxChars++) {
        $wrapped = constructor_svg_wrap_lines_meta($source, $maxChars, $maxLines);
        $lines = $wrapped['lines'] ?? [];
        if ($lines === []) {
            continue;
        }

        $style = constructor_svg_text_style($lines, $className, array_merge($options, [
            'maxWidth' => $maxWidth,
            'maxHeight' => $maxHeight,
        ]));

        $score = ((float) ($style['fontSize'] ?? 0.0) * 100.0)
            - ((count($lines) - 1) * 8.0)
            - (constructor_svg_measure_line_units((string) end($lines)) * 0.15);

        $candidate = [
            'score' => $score,
            'lines' => $lines,
            'fontSize' => (float) ($style['fontSize'] ?? 0.0),
            'lineHeight' => (float) ($style['lineHeight'] ?? 0.0),
            'truncated' => (bool) ($wrapped['truncated'] ?? false),
        ];

        if (($wrapped['truncated'] ?? false) === false) {
            if ($bestUntruncated === null || $score > (float) $bestUntruncated['score']) {
                $bestUntruncated = $candidate;
            }
            continue;
        }

        if ($best === null || $score > (float) $best['score']) {
            $best = $candidate;
        }
    }

    if ($bestUntruncated !== null) {
        return $bestUntruncated;
    }

    if ($best === null) {
        return [
            'lines' => [$source],
            'fontSize' => 0.0,
            'lineHeight' => 0.0,
            'truncated' => false,
        ];
    }

    return $best;
}

function constructor_svg_render_fitted_text(
    float $x,
    float $y,
    string $text,
    string $className,
    float $maxWidth,
    float $maxHeight,
    int $maxLines = 3,
    array $options = [],
    string $anchor = 'start'
): string {
    $fit = constructor_svg_fit_text_block($text, $className, $maxWidth, $maxHeight, $maxLines, $options);
    if (($fit['lines'] ?? []) === []) {
        return '';
    }
    return constructor_svg_render_text(
        $x,
        $y,
        $fit['lines'],
        $className,
        array_merge($options, [
            'maxWidth' => $maxWidth,
            'maxHeight' => $maxHeight,
            'anchor' => $options['anchor'] ?? $anchor,
        ]),
        $anchor
    );
}

function constructor_svg_render_label(float $x, float $y, string $text, string $className, array $options = []): string
{
    $normalized = trim($text);
    if ($normalized === '') {
        return '';
    }
    return constructor_svg_render_text($x, $y, [$normalized], $className, $options, (string) ($options['anchor'] ?? 'start'));
}

function constructor_svg_document(float $width, float $height, string $body, string $background = '#ffffff'): string
{
    $bg = constructor_svg_escape($background);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' . $width . ' ' . $height . '" width="' . $width . '" height="' . $height . '">' .
        '<defs><style><![CDATA[' .
        '.bg{fill:' . $bg . ';}' .
        '.accent{fill:#bf1238;}.accent-soft{fill:#f4d8df;}.ink{fill:#182a31;}.muted{fill:#5d6972;}.sand{fill:#f6f0e7;}.white{fill:#ffffff;}' .
        '.title{font:700 64px DejaVu Sans,Arial,sans-serif;fill:#182a31;letter-spacing:-0.02em;}' .
        '.headline{font:700 92px DejaVu Sans,Arial,sans-serif;fill:#182a31;letter-spacing:-0.03em;}' .
        '.subhead{font:600 36px DejaVu Sans,Arial,sans-serif;fill:#182a31;}' .
        '.body{font:400 30px DejaVu Sans,Arial,sans-serif;fill:#182a31;}' .
        '.small{font:400 24px DejaVu Sans,Arial,sans-serif;fill:#5d6972;}' .
        '.tiny{font:500 20px DejaVu Sans,Arial,sans-serif;fill:#5d6972;letter-spacing:0.04em;text-transform:uppercase;}' .
        '.badge{font:700 28px DejaVu Sans,Arial,sans-serif;fill:#bf1238;letter-spacing:0.08em;text-transform:uppercase;}' .
        '.line{stroke:#d8d1c5;stroke-width:2;}' .
        '.card{fill:#ffffff;stroke:#e3dbcf;stroke-width:2;}' .
        'text{white-space:pre;}' .
        ']]></style></defs>' .
        '<rect class="bg" width="100%" height="100%" rx="0"/>' .
        $body .
        '</svg>';
}

function constructor_format_date(string $value): string
{
    if ($value === '') {
        return '';
    }
    $date = strtotime($value);
    if ($date === false) {
        return $value;
    }
    return date('d.m.Y', $date);
}

function constructor_nameplate_variant_labels(): array
{
    return [
        'cabinet' => 'Кабинетная',
        'navigation' => 'Навигационная',
        'zone' => 'Зональная',
    ];
}

function constructor_nameplate_direction_labels(): array
{
    return [
        'none' => 'Без стрелки',
        'left' => 'Налево',
        'right' => 'Направо',
        'up' => 'Вверх',
        'down' => 'Вниз',
    ];
}

function constructor_presentation_mode_labels(): array
{
    return [
        'invest' => 'Инвест-питч',
        'report' => 'Статус / отчёт',
        'pitch' => 'Партнёрский питч',
    ];
}

function constructor_field_map(array $definition): array
{
    $map = [];
    foreach (($definition['fields'] ?? []) as $field) {
        if (!is_array($field)) {
            continue;
        }
        $fieldId = trim((string) ($field['id'] ?? ''));
        if ($fieldId !== '') {
            $map[$fieldId] = $field;
        }
    }
    return $map;
}

function constructor_field_display_value(array $field, $value): string
{
    $fieldType = (string) ($field['type'] ?? 'text');
    $normalizedValue = is_scalar($value) ? trim((string) $value) : '';
    if ($normalizedValue === '') {
        return '';
    }

    if ($fieldType === 'select') {
        foreach (($field['options'] ?? []) as $option) {
            if (!is_array($option)) {
                continue;
            }
            if ((string) ($option['value'] ?? '') === $normalizedValue) {
                return trim((string) ($option['label'] ?? $normalizedValue));
            }
        }
    }

    if ($fieldType === 'date') {
        return constructor_format_date($normalizedValue);
    }

    if ($fieldType === 'textarea') {
        return trim(preg_replace('/\s*\R\s*/u', ' / ', $normalizedValue) ?: $normalizedValue);
    }

    return $normalizedValue;
}

function constructor_presentation_outline(string $value): array
{
    $source = trim($value);
    if ($source === '') {
        return [];
    }

    $lines = preg_split('/\R+/u', $source) ?: [];
    $items = [];
    foreach ($lines as $line) {
        $clean = trim((string) preg_replace('/^\s*(?:[-*•]+|\d+[.)])\s*/u', '', $line));
        if ($clean !== '') {
            $items[] = $clean;
        }
    }

    if ($items === []) {
        $items = preg_split('/\s*;\s*/u', $source) ?: [];
        $items = array_values(array_filter(array_map(static fn(string $item): string => trim($item), $items)));
    }

    return array_values(array_unique($items));
}

function constructor_derived_payload(array $definition, array $input): array
{
    $definitionId = (string) ($definition['id'] ?? '');

    if ($definitionId === 'nameplate') {
        $variant = (string) ($input['variant'] ?? 'cabinet');
        $direction = (string) ($input['direction'] ?? 'none');
        $mount = (string) ($input['mount'] ?? 'wall');
        $mountLabels = [
            'wall' => 'Настенное',
            'door' => 'На дверь',
            'desktop' => 'Настольное',
        ];

        return [
            'variantLabel' => constructor_nameplate_variant_labels()[$variant] ?? 'Кабинетная',
            'directionLabel' => constructor_nameplate_direction_labels()[$direction] ?? 'Без стрелки',
            'mountLabel' => $mountLabels[$mount] ?? 'Настенное',
            'roomNumber' => trim((string) ($input['room_number'] ?? '')),
        ];
    }

    if ($definitionId === 'presentation_deck') {
        $mode = (string) ($input['presentation_mode'] ?? 'invest');
        return [
            'presentationModeLabel' => constructor_presentation_mode_labels()[$mode] ?? 'Инвест-питч',
            'eventName' => trim((string) ($input['event_name'] ?? '')),
            'keyMessage' => trim((string) ($input['key_message'] ?? '')),
            'outline' => constructor_presentation_outline((string) ($input['structure'] ?? '')),
        ];
    }

    return [];
}

function constructor_filename_base(array $definition, array $input): string
{
    $slug = preg_replace('/[^a-z0-9_-]+/i', '-', (string) ($definition['id'] ?? 'solution')) ?: 'solution';
    $city = preg_replace('/[^a-z0-9_-]+/i', '-', strtolower((string) ($input['city'] ?? 'yamal'))) ?: 'yamal';
    return 'yamal-' . trim($slug, '-') . '-' . trim($city, '-');
}

function constructor_brief_payload(array $definition, array $input, array $recommendations): array
{
    $payload = [
        'solution' => [
            'id' => (string) ($definition['id'] ?? ''),
            'label' => (string) ($definition['label'] ?? ''),
            'category' => (string) ($definition['category'] ?? ''),
            'formatHint' => (string) ($definition['formatHint'] ?? ''),
        ],
        'input' => $input,
        'cityLabel' => constructor_city_label((string) ($input['city'] ?? '')),
        'recommendations' => [
            'sections' => array_map(
                static fn(array $item): array => [
                    'label' => (string) ($item['label'] ?? $item['name'] ?? ''),
                    'relativePath' => (string) ($item['relativePath'] ?? ''),
                ],
                array_slice($recommendations['sections'] ?? [], 0, 4)
            ),
            'files' => array_map(
                static fn(array $item): array => [
                    'label' => (string) ($item['label'] ?? $item['name'] ?? ''),
                    'downloadUrl' => (string) ($item['downloadUrl'] ?? ''),
                    'relativePath' => (string) ($item['relativePath'] ?? ''),
                    'extension' => (string) ($item['extension'] ?? ''),
                ],
                array_slice($recommendations['items'] ?? [], 0, 4)
            ),
            'advice' => $recommendations['advice'] ?? [],
        ],
        'generatedAtUtc' => gmdate(DATE_ATOM),
    ];

    $derived = constructor_derived_payload($definition, $input);
    if ($derived !== []) {
        $payload['derived'] = $derived;
    }

    return $payload;
}

function constructor_json_brief_artifact(array $definition, array $input, array $recommendations): array
{
    $payload = constructor_brief_payload($definition, $input, $recommendations);
    return [
        'id' => 'brief-json',
        'label' => 'Бриф JSON',
        'mimeType' => 'application/json',
        'filename' => constructor_filename_base($definition, $input) . '-brief.json',
        'content' => (string) json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT),
        'previewType' => 'json',
    ];
}

function constructor_html_brief_artifact(array $definition, array $input, array $recommendations): array
{
    $payload = constructor_brief_payload($definition, $input, $recommendations);
    $fieldMap = constructor_field_map($definition);
    $sections = array_map(static fn(array $item): string => (string) ($item['label'] ?? ''), $payload['recommendations']['sections'] ?? []);
    $files = array_map(static fn(array $item): string => (string) ($item['label'] ?? ''), $payload['recommendations']['files'] ?? []);
    $adviceTitle = trim((string) (($payload['recommendations']['advice']['title'] ?? '')));
    $adviceSummary = trim((string) (($payload['recommendations']['advice']['summary'] ?? '')));
    $cityLabel = (string) ($payload['cityLabel'] ?? 'Ямал');
    $derived = is_array($payload['derived'] ?? null) ? $payload['derived'] : [];

    $html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>' .
        htmlspecialchars((string) ($definition['label'] ?? 'Решение'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') .
        '</title><style>body{font-family:Arial,sans-serif;background:#f6f0e7;color:#182a31;margin:0;padding:40px;}article{max-width:920px;margin:0 auto;background:#fff;border:1px solid #e3dbcf;border-radius:28px;padding:36px;box-shadow:0 20px 60px rgba(24,42,49,.08);}h1{margin:0 0 8px;font-size:40px;}h2{margin:28px 0 10px;font-size:22px;}p,li{line-height:1.6;font-size:16px;}ul{margin:0;padding-left:18px;} .eyebrow{color:#bf1238;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;} .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;} .card{background:#faf7f2;border:1px solid #eee1d4;border-radius:18px;padding:14px;}</style></head><body><article>' .
        '<p class="eyebrow">Лаборатория решений</p>' .
        '<h1>' . htmlspecialchars((string) ($definition['label'] ?? 'Решение'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</h1>' .
        '<p>' . htmlspecialchars((string) ($definition['description'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>' .
        '<div class="grid">' .
        '<div class="card"><strong>Город</strong><p>' . htmlspecialchars($cityLabel, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p></div>' .
        '<div class="card"><strong>Формат</strong><p>' . htmlspecialchars((string) ($definition['formatHint'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p></div>' .
        '</div>';

    if ($adviceTitle !== '' || $adviceSummary !== '') {
        $html .= '<h2>По брендбуку</h2><p><strong>' . htmlspecialchars($adviceTitle, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</strong></p><p>' .
            htmlspecialchars($adviceSummary, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>';
    }

    if ((string) ($definition['id'] ?? '') === 'presentation_deck') {
        $presentationMode = trim((string) ($derived['presentationModeLabel'] ?? ''));
        $eventName = trim((string) ($derived['eventName'] ?? ''));
        $keyMessage = trim((string) ($derived['keyMessage'] ?? ''));
        $outline = array_values(array_filter(array_map(static fn($item): string => trim((string) $item), $derived['outline'] ?? [])));

        $html .= '<h2>Паспорт презентации</h2><div class="grid">';
        if ($presentationMode !== '') {
            $html .= '<div class="card"><strong>Сценарий</strong><p>' . htmlspecialchars($presentationMode, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p></div>';
        }
        if ($eventName !== '') {
            $html .= '<div class="card"><strong>Событие / площадка</strong><p>' . htmlspecialchars($eventName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p></div>';
        }
        $html .= '<div class="card"><strong>Спикер</strong><p>' . htmlspecialchars(trim((string) ($input['speaker'] ?? '')), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p></div>' .
            '<div class="card"><strong>Слайдов</strong><p>' . htmlspecialchars((string) ($input['slide_count'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p></div></div>';

        if ($keyMessage !== '') {
            $html .= '<h2>Ключевое сообщение</h2><p>' . htmlspecialchars($keyMessage, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>';
        }

        if ($outline !== []) {
            $html .= '<h2>Структура слайдов</h2><ul>' . implode('', array_map(
                static fn(string $item): string => '<li>' . htmlspecialchars($item, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</li>',
                $outline
            )) . '</ul>';
        }
    }

    if ($sections !== []) {
        $html .= '<h2>Рекомендуемые разделы</h2><ul>' . implode('', array_map(
            static fn(string $item): string => '<li>' . htmlspecialchars($item, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</li>',
            $sections
        )) . '</ul>';
    }
    if ($files !== []) {
        $html .= '<h2>Рекомендуемые файлы</h2><ul>' . implode('', array_map(
            static fn(string $item): string => '<li>' . htmlspecialchars($item, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</li>',
            $files
        )) . '</ul>';
    }

    $html .= '<h2>Поля</h2><ul>' . implode('', array_map(
        static function (string $key, $value) use ($fieldMap): string {
            $field = $fieldMap[$key] ?? ['label' => $key];
            $label = trim((string) ($field['label'] ?? $key));
            $displayValue = constructor_field_display_value($field, $value);
            return '<li><strong>' . htmlspecialchars($label, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . ':</strong> ' . htmlspecialchars($displayValue, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</li>';
        },
        array_keys($input),
        array_values($input)
    )) . '</ul></article></body></html>';

    return [
        'id' => 'brief-html',
        'label' => 'HTML-бриф',
        'mimeType' => 'text/html',
        'filename' => constructor_filename_base($definition, $input) . '-brief.html',
        'content' => $html,
        'previewType' => 'html',
    ];
}

function constructor_svg_artifact(array $definition, array $input): ?array
{
    $cityLabel = constructor_city_label((string) ($input['city'] ?? ''));
    $brandMark = constructor_asset_data_uri('assets/brand-mark.svg', 'image/svg+xml');
    $brandLogo = constructor_asset_data_uri('assets/brand-logo-main.svg', 'image/svg+xml');
    $body = '';
    $width = 1200.0;
    $height = 675.0;
    $background = '#ffffff';
    $fileSuffix = 'preview.svg';

    switch ((string) ($definition['id'] ?? '')) {
        case 'business_card':
            $width = 900;
            $height = 500;
            $background = '#f8f4ee';
            $body =
                '<rect x="40" y="40" width="820" height="420" rx="36" class="card"/>' .
                '<rect x="40" y="40" width="260" height="420" rx="36" class="accent"/>' .
                ($brandLogo !== '' ? '<image href="' . $brandLogo . '" x="88" y="92" width="164" height="28"/>' : '') .
                constructor_svg_render_fitted_text(348, 158, (string) ($input['full_name'] ?? ''), 'headline', 432, 190, 3, ['minFontSize' => 26]) .
                constructor_svg_render_fitted_text(348, 282, (string) ($input['role'] ?? ''), 'subhead', 432, 96, 3, ['minFontSize' => 18]) .
                constructor_svg_render_fitted_text(348, 366, (string) ($input['department'] ?? ''), 'small', 432, 52, 2, ['minFontSize' => 14]) .
                constructor_svg_render_fitted_text(348, 418, (string) ($input['phone'] ?? ''), 'body', 432, 34, 1, ['minFontSize' => 15]) .
                constructor_svg_render_fitted_text(348, 450, (string) ($input['email'] ?? ''), 'small', 432, 24, 1, ['minFontSize' => 11]) .
                constructor_svg_render_label(88, 392, $cityLabel, 'badge', ['maxWidth' => 150, 'minFontSize' => 18]);
            break;

        case 'nameplate':
            $width = 1200;
            $height = 420;
            $background = '#fbf7f0';
            $variant = (string) ($input['variant'] ?? 'cabinet');
            $variantLabel = constructor_nameplate_variant_labels()[$variant] ?? 'Кабинетная';
            $roomNumber = trim((string) ($input['room_number'] ?? ''));
            $direction = (string) ($input['direction'] ?? 'none');
            $directionLabel = constructor_nameplate_direction_labels()[$direction] ?? 'Без стрелки';
            $mountLabel = match ((string) ($input['mount'] ?? 'wall')) {
                'door' => 'На дверь',
                'desktop' => 'Настольное',
                default => 'Настенное',
            };
            $arrowPath = match ($direction) {
                'left' => '<path d="M1032 266H936M936 266l30-30M936 266l30 30" stroke="#bf1238" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
                'right' => '<path d="M936 266H1032M1032 266l-30-30M1032 266l-30 30" stroke="#bf1238" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
                'up' => '<path d="M984 318V222M984 222l-30 30M984 222l30 30" stroke="#bf1238" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
                'down' => '<path d="M984 214v96M984 310l-30-30M984 310l30-30" stroke="#bf1238" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
                default => '',
            };
            $locationX = $roomNumber !== '' ? 280 : 62;
            $locationMaxWidth = match (true) {
                $direction !== 'none' && $roomNumber !== '' => 520.0,
                $direction !== 'none' => 738.0,
                $roomNumber !== '' => 764.0,
                default => 982.0,
            };
            $body =
                '<rect x="30" y="30" width="1140" height="360" rx="28" class="card"/>' .
                '<rect x="30" y="30" width="1140" height="96" rx="28" class="accent"/>' .
                ($brandLogo !== '' ? '<image href="' . $brandLogo . '" x="62" y="62" width="182" height="30"/>' : '') .
                constructor_svg_render_label(1108, 78, $variantLabel, 'badge', ['anchor' => 'end', 'maxWidth' => 270, 'minFontSize' => 18]) .
                ($roomNumber !== ''
                    ? '<rect x="62" y="146" width="180" height="146" rx="28" class="accent-soft"/>' .
                        constructor_svg_render_label(94, 190, 'Номер', 'tiny', ['maxWidth' => 104, 'minFontSize' => 12]) .
                        constructor_svg_render_fitted_text(94, 252, $roomNumber, 'subhead', 116, 62, 2, ['minFontSize' => 16])
                    : '') .
                constructor_svg_render_fitted_text($locationX, 184, (string) ($input['location'] ?? ''), 'headline', $locationMaxWidth, 168, 3, ['minFontSize' => 24]) .
                constructor_svg_render_fitted_text($locationX, 324, (string) ($input['subline'] ?? ''), 'subhead', $locationMaxWidth, 72, 2, ['minFontSize' => 16]) .
                constructor_svg_render_label(62, 356, $mountLabel, 'small', ['maxWidth' => 180, 'minFontSize' => 15]) .
                constructor_svg_render_label(762, 356, (string) ($input['size_variant'] ?? '300x120'), 'badge', ['maxWidth' => 170, 'minFontSize' => 18]) .
                ($direction !== 'none'
                    ? '<rect x="868" y="200" width="200" height="112" rx="24" class="accent-soft"/>' .
                        $arrowPath .
                        constructor_svg_render_label(968, 348, $directionLabel, 'small', ['anchor' => 'middle', 'maxWidth' => 150, 'minFontSize' => 14])
                    : '');
            break;

        case 'presentation_deck':
            $width = 1600;
            $height = 900;
            $background = '#f7f1ea';
            $presentationMode = constructor_presentation_mode_labels()[(string) ($input['presentation_mode'] ?? 'invest')] ?? 'Инвест-питч';
            $eventName = trim((string) ($input['event_name'] ?? ''));
            $keyMessage = trim((string) ($input['key_message'] ?? ''));
            $outlinePreview = array_slice(constructor_presentation_outline((string) ($input['structure'] ?? '')), 0, 3);
            $outlinePreview = array_map(static fn(string $item): string => '• ' . $item, $outlinePreview);
            $body =
                '<rect x="0" y="0" width="520" height="900" class="accent"/>' .
                ($brandMark !== '' ? '<image href="' . $brandMark . '" x="96" y="96" width="232" height="151"/>' : '') .
                '<rect x="1184" y="86" width="304" height="72" rx="24" class="accent-soft"/>' .
                constructor_svg_render_label(1336, 131, $presentationMode, 'badge', ['anchor' => 'middle', 'maxWidth' => 232, 'minFontSize' => 16]) .
                constructor_svg_render_fitted_text(644, 158, $eventName !== '' ? $eventName : $cityLabel, 'tiny', 460, 58, 2, ['minFontSize' => 11]) .
                constructor_svg_render_fitted_text(644, 270, (string) ($input['title'] ?? ''), 'headline', 844, 316, 4, ['minFontSize' => 24]) .
                '<rect x="644" y="476" width="844" height="164" rx="32" class="card"/>' .
                constructor_svg_render_label(692, 528, 'Ключевое сообщение', 'tiny', ['maxWidth' => 260, 'minFontSize' => 12]) .
                constructor_svg_render_fitted_text(692, 578, $keyMessage, 'body', 748, 98, 3, ['minFontSize' => 15]) .
                constructor_svg_render_fitted_text(644, 712, (string) ($input['speaker'] ?? ''), 'subhead', 420, 54, 2, ['minFontSize' => 16]) .
                constructor_svg_render_fitted_text(644, 762, (string) ($input['speaker_role'] ?? ''), 'body', 520, 70, 2, ['minFontSize' => 15]) .
                '<rect x="644" y="796" width="404" height="74" rx="24" class="accent-soft"/>' .
                constructor_svg_render_label(846, 842, 'Слайдов: ' . (string) ($input['slide_count'] ?? ''), 'badge', ['anchor' => 'middle', 'maxWidth' => 320, 'minFontSize' => 16]) .
                constructor_svg_render_fitted_text(1088, 824, 'Аудитория: ' . (string) ($input['audience'] ?? ''), 'small', 360, 60, 2, ['minFontSize' => 13]) .
                ($outlinePreview !== []
                    ? constructor_svg_render_label(96, 324, 'Каркас слайдов', 'tiny', ['maxWidth' => 260, 'minFontSize' => 12]) .
                        constructor_svg_render_text(96, 382, $outlinePreview, 'small', ['maxWidth' => 320, 'maxHeight' => 176, 'minFontSize' => 16])
                    : '') .
                constructor_svg_render_label(1480, 852, $cityLabel, 'small', ['anchor' => 'end', 'maxWidth' => 150, 'minFontSize' => 14]);
            break;

        case 'certificate':
            $width = 1400;
            $height = 990;
            $background = '#fbf7f0';
            $body =
                '<rect x="44" y="44" width="1312" height="902" rx="28" fill="none" stroke="#bf1238" stroke-width="8"/>' .
                ($brandLogo !== '' ? '<image href="' . $brandLogo . '" x="86" y="88" width="200" height="32"/>' : '') .
                constructor_svg_render_label(700, 202, $cityLabel, 'badge', ['anchor' => 'middle', 'maxWidth' => 240, 'minFontSize' => 16]) .
                constructor_svg_render_label(700, 310, 'Сертификат', 'title', ['anchor' => 'middle', 'maxWidth' => 420, 'minFontSize' => 28]) .
                constructor_svg_render_fitted_text(700, 434, (string) ($input['recipient'] ?? ''), 'headline', 1020, 214, 3, ['anchor' => 'middle', 'minFontSize' => 24], 'middle') .
                constructor_svg_render_fitted_text(700, 606, (string) ($input['reason'] ?? ''), 'body', 1020, 146, 3, ['anchor' => 'middle', 'minFontSize' => 15], 'middle') .
                constructor_svg_render_fitted_text(160, 810, (string) ($input['event_name'] ?? ''), 'small', 520, 60, 2, ['minFontSize' => 15]) .
                '<line x1="968" y1="804" x2="1248" y2="804" class="line"/>' .
                constructor_svg_render_fitted_text(968, 846, (string) ($input['signer'] ?? ''), 'small', 260, 56, 2, ['minFontSize' => 13]) .
                constructor_svg_render_fitted_text(160, 900, constructor_format_date((string) ($input['issue_date'] ?? '')), 'small', 180, 28, 1, ['minFontSize' => 14]);
            break;

        case 'badge':
            $width = 720;
            $height = 1120;
            $background = '#f8f4ee';
            $accessMap = [
                'standard' => 'Стандарт',
                'speaker' => 'Спикер',
                'staff' => 'Оргкомитет',
                'vip' => 'VIP',
            ];
            $accessLabel = $accessMap[(string) ($input['access_level'] ?? 'standard')] ?? 'Стандарт';
            $body =
                '<rect x="44" y="44" width="632" height="1032" rx="36" class="card"/>' .
                '<rect x="44" y="44" width="632" height="182" rx="36" class="accent"/>' .
                ($brandMark !== '' ? '<image href="' . $brandMark . '" x="76" y="70" width="168" height="109"/>' : '') .
                constructor_svg_render_fitted_text(76, 300, (string) ($input['event_name'] ?? $cityLabel), 'small', 560, 58, 2, ['minFontSize' => 15]) .
                constructor_svg_render_fitted_text(76, 404, (string) ($input['full_name'] ?? ''), 'headline', 560, 326, 4, ['minFontSize' => 22]) .
                constructor_svg_render_fitted_text(76, 730, (string) ($input['role'] ?? ''), 'subhead', 560, 112, 3, ['minFontSize' => 16]) .
                '<rect x="76" y="824" width="260" height="72" rx="24" class="accent-soft"/>' .
                constructor_svg_render_label(206, 870, $accessLabel, 'badge', ['anchor' => 'middle', 'maxWidth' => 210, 'minFontSize' => 16]) .
                constructor_svg_render_fitted_text(76, 974, $cityLabel, 'small', 560, 30, 1, ['minFontSize' => 15]);
            break;

        case 'social_post':
            $ratio = (string) ($input['ratio'] ?? '4:5');
            if ($ratio === '1:1') {
                $width = 1080;
                $height = 1080;
            } elseif ($ratio === '16:9') {
                $width = 1600;
                $height = 900;
            } else {
                $width = 1080;
                $height = 1350;
            }
            $background = '#f7f1ea';
            $body =
                '<rect x="0" y="0" width="' . $width . '" height="220" class="accent"/>' .
                ($brandMark !== '' ? '<image href="' . $brandMark . '" x="64" y="50" width="172" height="112"/>' : '') .
                constructor_svg_render_fitted_text(80, 320, (string) ($input['headline'] ?? ''), 'headline', $width - 160, 356, 4, ['minFontSize' => 22]) .
                constructor_svg_render_fitted_text(80, 706, (string) ($input['message'] ?? ''), 'body', $width - 160, 462, 5, ['minFontSize' => 15]) .
                '<rect x="80" y="' . ($height - 178) . '" width="' . ($width - 160) . '" height="88" rx="28" class="card"/>' .
                constructor_svg_render_fitted_text(124, $height - 126, (string) ($input['cta'] ?? ''), 'subhead', $width - 280, 54, 2, ['minFontSize' => 14]) .
                constructor_svg_render_fitted_text($width - 80, $height - 46, $cityLabel, 'small', 160, 26, 1, ['anchor' => 'end', 'minFontSize' => 13], 'end');
            break;

        case 'letterhead':
            $width = 1240;
            $height = 1754;
            $background = '#ffffff';
            $body =
                '<rect x="0" y="0" width="1240" height="210" class="sand"/>' .
                ($brandLogo !== '' ? '<image href="' . $brandLogo . '" x="84" y="76" width="220" height="36"/>' : '') .
                constructor_svg_render_fitted_text(84, 162, (string) ($input['department'] ?? ''), 'subhead', 620, 64, 2, ['minFontSize' => 14]) .
                constructor_svg_render_fitted_text(84, 312, (string) ($input['document_title'] ?? ''), 'title', 1040, 214, 3, ['minFontSize' => 20]) .
                '<line x1="84" y1="412" x2="1156" y2="412" class="line"/>' .
                constructor_svg_render_fitted_text(84, 500, 'Текст письма или справки размещается в рабочей области ниже.', 'body', 1040, 84, 2, ['minFontSize' => 18]) .
                constructor_svg_render_fitted_text(84, 1604, (string) ($input['contact_line'] ?? ''), 'small', 1040, 72, 3, ['minFontSize' => 12]) .
                constructor_svg_render_fitted_text(900, 1488, (string) ($input['signer'] ?? ''), 'small', 240, 54, 2, ['minFontSize' => 12]);
            break;

        case 'rollup':
            $width = 1000;
            $height = 2200;
            $background = '#f8f4ee';
            $body =
                '<rect x="0" y="0" width="1000" height="620" class="accent"/>' .
                ($brandMark !== '' ? '<image href="' . $brandMark . '" x="88" y="82" width="220" height="143"/>' : '') .
                constructor_svg_render_fitted_text(88, 748, (string) ($input['headline'] ?? ''), 'headline', 824, 548, 5, ['minFontSize' => 24]) .
                constructor_svg_render_fitted_text(88, 1360, (string) ($input['subline'] ?? ''), 'body', 824, 390, 6, ['minFontSize' => 15]) .
                '<rect x="88" y="1730" width="824" height="232" rx="34" class="card"/>' .
                constructor_svg_render_fitted_text(132, 1818, (string) ($input['event_name'] ?? ''), 'subhead', 500, 102, 3, ['minFontSize' => 16]) .
                constructor_svg_render_fitted_text(132, 1908, (string) ($input['size_variant'] ?? ''), 'small', 300, 30, 1, ['minFontSize' => 13]) .
                constructor_svg_render_fitted_text(912, 2128, $cityLabel, 'small', 160, 26, 1, ['anchor' => 'end', 'minFontSize' => 13], 'end');
            break;
    }

    if ($body === '') {
        return null;
    }

    return [
        'id' => 'preview-svg',
        'label' => 'SVG-шаблон',
        'mimeType' => 'image/svg+xml',
        'filename' => constructor_filename_base($definition, $input) . '-' . $fileSuffix,
        'content' => constructor_svg_document($width, $height, $body, $background),
        'previewType' => 'svg',
    ];
}

function constructor_result_summary(array $definition, array $input, array $recommendations, array $artifacts): array
{
    $cityLabel = constructor_city_label((string) ($input['city'] ?? ''));
    $artifactLabels = array_values(array_filter(array_map(static fn(array $item): string => (string) ($item['label'] ?? ''), $artifacts)));
    return [
        'title' => (string) ($definition['label'] ?? 'Решение'),
        'lead' => 'Каркас решения собран. Его можно использовать как стартовую заготовку и handoff-пакет для дизайнера или подрядчика.',
        'bullets' => array_values(array_filter([
            'Город / версия: ' . $cityLabel,
            'Выход: ' . (string) ($definition['formatHint'] ?? ''),
            $artifactLabels !== [] ? 'Артефакты: ' . implode(', ', array_slice($artifactLabels, 0, 3)) : '',
            count($recommendations['items'] ?? []) > 0 ? 'Подобраны реальные файлы из каталога: ' . count($recommendations['items']) : '',
        ])),
    ];
}

function constructor_draft_summary(array $definition, array $input, array $recommendations): array
{
    $cityLabel = constructor_city_label((string) ($input['city'] ?? ''));
    $sectionLabels = array_values(array_filter(array_map(static fn(array $item): string => (string) ($item['label'] ?? $item['name'] ?? ''), $recommendations['sections'] ?? [])));
    return [
        'title' => (string) ($definition['label'] ?? 'Решение'),
        'lead' => 'Это стартовый каркас решения. Заполните поля и соберите пакет под конкретную задачу, подрядчика или внутреннюю команду.',
        'bullets' => array_values(array_filter([
            'Город / версия: ' . $cityLabel,
            'Выход: ' . (string) ($definition['formatHint'] ?? ''),
            $sectionLabels !== [] ? 'Под рукой уже подобраны разделы: ' . implode(', ', array_slice($sectionLabels, 0, 3)) : '',
            count($recommendations['items'] ?? []) > 0 ? 'Есть реальные файлы для старта: ' . count($recommendations['items']) : '',
        ])),
    ];
}

function constructor_present_artifact(array $artifact): array
{
    $content = (string) ($artifact['content'] ?? '');
    return [
        'id' => (string) ($artifact['id'] ?? ''),
        'label' => (string) ($artifact['label'] ?? ''),
        'mimeType' => (string) ($artifact['mimeType'] ?? 'text/plain'),
        'filename' => (string) ($artifact['filename'] ?? 'artifact.txt'),
        'previewType' => (string) ($artifact['previewType'] ?? 'text'),
        'sizeBytes' => strlen($content),
        'content' => $content,
    ];
}

function dedicated_examples_roots(): array
{
    return [
        'примеры внедрения бренда территории',
        'примеры внедрения бренда',
    ];
}

function dedicated_example_folders(string $group): array
{
    $groupFolder = $group === 'debate' ? 'спорные примеры' : 'хорошие примеры';
    return array_map(
        static fn(string $root): string => trim($root, '/') . '/' . $groupFolder,
        dedicated_examples_roots()
    );
}

function good_example_keywords(): array
{
    return ['хорошие примеры', 'хороший пример', 'good'];
}

function debate_example_keywords(): array
{
    return ['спорные примеры', 'спорный пример', 'антипример', 'антипримеры', 'ошибка', 'неправильно', 'обсуждение'];
}

function example_skip_segments(): array
{
    return [
        'макеты1', 'файлы', 'макеты', 'логотипы', 'логотип', 'основные логотипы',
        'анимированный логотип', 'анимированные логотипы', 'юбилейные логотипы',
        'юбилейный логотип', '1 cmyk для печати', '2 color', '3 black', '4 white',
        'примеры внедрения бренда территории', 'примеры внедрения бренда',
        'хорошие примеры', 'спорные примеры', 'антипримеры', 'антипример',
        'color', 'black', 'white', 'png', 'jpg', 'jpeg', 'webp',
    ];
}

function example_context_from_path(string $relativePath, string $fileName): array
{
    $parts = array_values(array_filter(explode('/', str_replace('\\', '/', $relativePath))));
    if ($parts !== []) {
        array_pop($parts);
    }

    $displayParts = array_map(static fn(string $part): string => cleanup_folder_label($part), $parts);
    $filtered = [];
    foreach ($displayParts as $part) {
        $normalized = normalize_text($part);
        if ($normalized === '' || in_array($normalized, example_skip_segments(), true)) {
            continue;
        }
        $filtered[] = $part;
    }

    $title = $filtered !== [] ? end($filtered) : cleanup_file_stem($fileName);
    $top = $filtered[0] ?? '';
    $top = $top !== '' ? display_section_label($top) : '';

    $subtitleParts = [];
    if ($top !== '' && $top !== $title) {
        $subtitleParts[] = $top;
    }
    if (count($filtered) >= 2) {
        $secondary = $filtered[count($filtered) - 2];
        if ($secondary !== '' && $secondary !== $title && $secondary !== $top) {
            $subtitleParts[] = $secondary;
        }
    }

    return [
        'title' => $title !== '' ? $title : cleanup_file_stem($fileName),
        'subtitle' => implode(' • ', array_slice($subtitleParts, 0, 2)),
    ];
}

function cleanup_file_label(array $item, string $parentName, string $ext): string
{
    $stem = cleanup_file_stem((string) ($item['name'] ?? ''));
    $contextPhrases = collect_context_phrases($item, $parentName);
    $contextWords = [];
    foreach ($contextPhrases as $phrase) {
        foreach (split_words($phrase) as $word) {
            $contextWords[$word] = true;
        }
    }

    $main = remove_context_phrases($stem, $contextPhrases);
    $main = strip_low_value_file_phrases($main);
    $main = dedupe_words($main);
    $main = shorten_long_label($main);
    $mainWords = split_words($main);

    $allCovered = $mainWords !== [];
    foreach ($mainWords as $word) {
        if (!isset($contextWords[$word])) {
            $allCovered = false;
            break;
        }
    }

    if ($main === '' || $allCovered) {
        $main = infer_file_kind($stem . ' ' . $parentName) ?: 'Файл';
    }
    $main = upper_first($main);
    $label = format_labels()[$ext] ?? strtoupper($ext);
    return implode(' • ', array_values(array_filter([$main, $label])));
}

function infer_folder_icon(string $parentName, string $label): string
{
    $haystack = mb_strtolower($parentName . ' ' . $label, 'UTF-8');
    if (preg_match('/футбол|худи|свитшот|толстов|майк|одеж|кеп|панам|шапк/u', $haystack)) return '👕';
    if (preg_match('/круж|термос|бутыл|стакан/u', $haystack)) return '🥤';
    if (preg_match('/ручк|карандаш|маркер/u', $haystack)) return '✏️';
    if (preg_match('/блокнот|тетрад|ежеднев|планер/u', $haystack)) return '📒';
    if (preg_match('/пакет|шоппер|сумк|рюкзак/u', $haystack)) return '👜';
    if (preg_match('/стикер|наклей/u', $haystack)) return '🏷️';
    if (preg_match('/значок|пин/u', $haystack)) return '📌';
    if (preg_match('/флеш/u', $haystack)) return '💾';
    if (preg_match('/зонт/u', $haystack)) return '☂️';
    if (preg_match('/плед/u', $haystack)) return '🧶';
    if (preg_match('/буклет|листов|плакат|баннер|навигац|таблич|полиграф/u', $haystack)) return '🪧';
    if (preg_match('/диджитал|сайт|экран|презент|соцсет/u', $haystack)) return '💻';
    if (preg_match('/шрифт/u', $haystack)) return '🔤';
    return '📁';
}

function folder_config(string $parentName, string $itemName): array
{
    $fallbackLabel = cleanup_folder_label($itemName);
    return parent_specific_labels()[$parentName][$itemName]
        ?? generic_folder_labels()[$itemName]
        ?? ['label' => $fallbackLabel, 'icon' => infer_folder_icon($parentName, $fallbackLabel)];
}

function file_config(array $item, string $parentName): array
{
    $ext = file_ext((string) ($item['name'] ?? ''));
    $formatLabel = format_labels()[$ext] ?? null;
    if (in_array($parentName, style_folder_names(), true) && $formatLabel !== null) {
        return [
            'label' => $formatLabel,
            'icon' => file_icons()[$ext] ?? '📄',
            'order' => format_order()[$ext] ?? 999,
        ];
    }
    return [
        'label' => cleanup_file_label($item, $parentName, $ext) ?: ((string) ($item['name'] ?? 'Файл')),
        'icon' => file_icons()[$ext] ?? '📄',
        'order' => format_order()[$ext] ?? 999,
    ];
}

function resolve_root_menu_folders(array $rootItems): array
{
    $byName = [];
    foreach ($rootItems as $item) {
        if (in_array($item['name'], hidden_root_folders(), true)) {
            continue;
        }
        $byName[$item['name']] = $item;
    }

    $ordered = [];
    foreach (root_menu_folders() as $config) {
        $item = $byName[$config['folderName']] ?? null;
        if ($item === null) {
            continue;
        }
        $item['label'] = $config['label'];
        $item['icon'] = $config['icon'];
        $ordered[] = $item;
        unset($byName[$config['folderName']]);
    }

    $rest = array_values($byName);
    usort($rest, static fn(array $a, array $b): int => strnatcasecmp((string) $a['name'], (string) $b['name']));
    foreach ($rest as &$item) {
        $item['label'] = cleanup_folder_label((string) $item['name']);
        $item['icon'] = '📁';
    }
    unset($item);

    return array_merge($ordered, $rest);
}

function get_section_hint(string $name): string
{
    if (in_array($name, style_folder_names(), true)) return 'Выберите формат файла.';
    if ($name === '1-Сувенирная продукция') return 'Выберите категорию сувениров.';
    if ($name === '2-Канцелярия') return 'Выберите тип канцелярии.';
    if ($name === '3-Полиграфия и уличная навигация') return 'Выберите тип носителя.';
    if ($name === '4-Диджитал') return 'Выберите цифровой носитель.';
    if ($name === 'Ямал 95') return 'Выберите PNG или вектор.';
    return section_hints()[$name] ?? '';
}

function decorate_folder_items(array $parentItem, array $items): array
{
    $parentName = (string) ($parentItem['name'] ?? '');
    $decorated = [];
    foreach ($items as $item) {
        if (($item['type'] ?? '') === 'file') {
            $config = file_config($item, $parentName);
            $item['label'] = $config['label'];
            $item['icon'] = $config['icon'];
            $item['sortRank'] = $config['order'] ?? 999;
        } else {
            $config = folder_config($parentName, (string) ($item['name'] ?? ''));
            $item['label'] = $config['label'];
            $item['icon'] = $config['icon'];
            $item['sortRank'] = 0;
        }
        $decorated[] = $item;
    }

    usort($decorated, static function (array $a, array $b) use ($parentName): int {
        if (preg_match('/^Брендбук /u', $parentName) && ($a['type'] ?? '') !== ($b['type'] ?? '')) {
            return ($a['type'] ?? '') === 'file' ? -1 : 1;
        }
        if (in_array($parentName, style_folder_names(), true) && ($a['type'] ?? '') === 'file' && ($b['type'] ?? '') === 'file') {
            if (($a['sortRank'] ?? 999) !== ($b['sortRank'] ?? 999)) {
                return ($a['sortRank'] ?? 999) <=> ($b['sortRank'] ?? 999);
            }
        }
        return strnatcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
    });

    return $decorated;
}

function file_kind_labels(): array
{
    return [
        'ai' => 'Исходник AI', 'cdr' => 'Исходник CDR', 'eps' => 'Вектор EPS', 'jpg' => 'Изображение JPG',
        'jpeg' => 'Изображение JPG', 'pdf' => 'Документ PDF', 'png' => 'Изображение PNG', 'svg' => 'Вектор SVG',
        'zip' => 'Архив ZIP', 'otf' => 'Шрифт OTF', 'ttf' => 'Шрифт TTF',
    ];
}

function human_file_size(int $bytes): string
{
    if ($bytes <= 0) {
        return '0 B';
    }
    $units = ['B', 'KB', 'MB', 'GB'];
    $size = (float) $bytes;
    $index = 0;
    while ($size >= 1024 && $index < count($units) - 1) {
        $size /= 1024;
        $index += 1;
    }
    $digits = ($size >= 10 || $index === 0) ? 0 : 1;
    $value = number_format($size, $digits, '.', '');
    $value = preg_replace('/\.0$/', '', $value) ?? $value;
    return $value . ' ' . $units[$index];
}

function content_type_by_ext(string $ext): string
{
    $map = [
        'ai' => 'application/postscript', 'cdr' => 'application/octet-stream', 'css' => 'text/css; charset=utf-8',
        'eps' => 'application/postscript', 'html' => 'text/html; charset=utf-8', 'ico' => 'image/x-icon',
        'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'js' => 'text/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8', 'otf' => 'font/otf', 'pdf' => 'application/pdf',
        'png' => 'image/png', 'svg' => 'image/svg+xml', 'ttf' => 'font/ttf', 'txt' => 'text/plain; charset=utf-8',
        'webp' => 'image/webp', 'zip' => 'application/zip',
    ];
    return $map[strtolower($ext)] ?? 'application/octet-stream';
}

function detect_catalog_source_root(string $catalogRootPath): ?string
{
    $rootReal = realpath($catalogRootPath);
    if ($rootReal === false || !is_dir($rootReal)) {
        return null;
    }

    $entries = array_values(array_filter(scandir($rootReal) ?: [], static function (string $name): bool {
        return $name !== '.' && $name !== '..' && !str_starts_with($name, '.');
    }));
    if ($entries === []) {
        return null;
    }

    $dirs = [];
    $files = [];
    foreach ($entries as $name) {
        $fullPath = $rootReal . DIRECTORY_SEPARATOR . $name;
        if (is_dir($fullPath)) {
            $dirs[] = $fullPath;
        } elseif (is_file($fullPath)) {
            $files[] = $fullPath;
        }
    }

    if ($files === [] && count($dirs) === 1) {
        return $dirs[0];
    }
    return $rootReal;
}

function build_catalog_rows(string $sourceRoot): array
{
    $sourceReal = realpath($sourceRoot);
    if ($sourceReal === false || !is_dir($sourceReal)) {
        return [];
    }

    $rows = [];
    $rootName = basename($sourceReal) ?: $sourceReal;
    $iter = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($sourceReal, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    $makeRow = static function (string $fullPath, string $type) use ($sourceReal, $rootName): array {
        $relativePath = $fullPath === $sourceReal
            ? '.'
            : str_replace('\\', '/', substr($fullPath, strlen($sourceReal) + 1));
        $parentPath = $relativePath === '.'
            ? ''
            : str_replace('\\', '/', dirname($relativePath));
        if ($parentPath === '.') {
            $parentPath = '';
        }

        $depth = $relativePath === '.' ? 0 : count(array_values(array_filter(explode('/', $relativePath), static fn(string $part): bool => $part !== '')));
        $name = $relativePath === '.' ? $rootName : basename($fullPath);
        $stat = stat($fullPath);
        $extension = $type === 'file' ? strtolower((string) pathinfo($name, PATHINFO_EXTENSION)) : '';
        $mimeType = $type === 'file' ? (mime_content_type($fullPath) ?: content_type_by_ext($extension)) : '';
        $sizeBytes = $type === 'file' ? (int) ($stat['size'] ?? 0) : null;

        return [
            'id' => safe_id($relativePath),
            'parent_id' => $relativePath === '.' ? '' : safe_id($parentPath !== '' ? $parentPath : '.'),
            'type' => $type,
            'name' => $name,
            'relative_path' => $relativePath,
            'parent_path' => $parentPath,
            'depth' => $depth,
            'extension' => $extension,
            'size_bytes' => $sizeBytes,
            'mime_type' => $mimeType,
            'modified_utc' => as_iso_utc((int) ($stat['mtime'] ?? time())),
            'normalized_name' => normalize_text($name),
            'normalized_path' => normalize_text($relativePath),
            'search_text' => build_catalog_search_text($name, $relativePath, $extension),
            'is_active' => 1,
            'sort_order' => 0,
        ];
    };

    $rows[] = $makeRow($sourceReal, 'folder');
    foreach ($iter as $item) {
        $fullPath = $item->getPathname();
        $relativePath = str_replace('\\', '/', substr($fullPath, strlen($sourceReal) + 1));
        if ($relativePath === '' || is_hidden_relative_path($relativePath)) {
            continue;
        }
        $rows[] = $makeRow($fullPath, $item->isDir() ? 'folder' : 'file');
    }

    usort($rows, static function (array $left, array $right): int {
        if (($left['depth'] ?? 0) !== ($right['depth'] ?? 0)) {
            return ($left['depth'] <=> $right['depth']);
        }
        if (($left['type'] ?? '') !== ($right['type'] ?? '')) {
            return ($left['type'] === 'folder') ? -1 : 1;
        }
        return strnatcasecmp((string) ($left['relative_path'] ?? ''), (string) ($right['relative_path'] ?? ''));
    });

    return $rows;
}

function init_catalog_db(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            parent_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ("folder", "file")),
            name TEXT NOT NULL,
            relative_path TEXT NOT NULL UNIQUE,
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
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_assets_parent ON assets(parent_id, type, is_active)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_assets_search ON assets(search_text)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(normalized_name)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_assets_rel ON assets(relative_path)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS catalog_meta (meta_key TEXT PRIMARY KEY, meta_value TEXT NOT NULL)');
}

function rebuild_catalog_database(string $catalogRootPath, string $dbPath): ?array
{
    $sourceRoot = detect_catalog_source_root($catalogRootPath);
    if ($sourceRoot === null) {
        return null;
    }

    $rows = build_catalog_rows($sourceRoot);
    if ($rows === []) {
        return null;
    }

    $dbDir = dirname($dbPath);
    if (!is_dir($dbDir)) {
        @mkdir($dbDir, 0775, true);
    }

    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    init_catalog_db($pdo);
    $pdo->beginTransaction();
    $pdo->exec('DELETE FROM assets');
    $stmt = $pdo->prepare(
        'INSERT INTO assets (
            id, parent_id, type, name, relative_path, parent_path, depth, extension,
            size_bytes, mime_type, modified_utc, normalized_name, normalized_path,
            search_text, is_active, sort_order
        ) VALUES (
            :id, :parent_id, :type, :name, :relative_path, :parent_path, :depth, :extension,
            :size_bytes, :mime_type, :modified_utc, :normalized_name, :normalized_path,
            :search_text, :is_active, :sort_order
        )'
    );
    foreach ($rows as $row) {
        $stmt->execute($row);
    }

    $metaStmt = $pdo->prepare('INSERT INTO catalog_meta (meta_key, meta_value) VALUES (?, ?) ON CONFLICT(meta_key) DO UPDATE SET meta_value = excluded.meta_value');
    $metaStmt->execute(['scan_root_path', $sourceRoot]);
    $metaStmt->execute(['build_utc', gmdate(DATE_ATOM)]);
    $metaStmt->execute(['root_name', basename($sourceRoot)]);
    $pdo->commit();

    return [
        'scan_root_path' => $sourceRoot,
        'rows' => count($rows),
    ];
}

class CatalogDb
{
    private ?PDO $pdo = null;
    private bool $available = false;
    private string $scanRootPath = '';

    public function __construct(private readonly string $dbPath, ?string $catalogRootPath = null)
    {
        if (!is_file($dbPath) && $catalogRootPath !== null) {
            rebuild_catalog_database($catalogRootPath, $dbPath);
        }
        if (!is_file($dbPath)) {
            return;
        }
        $this->pdo = new PDO('sqlite:' . $dbPath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $this->scanRootPath = (string) ($this->metaValue('scan_root_path') ?? '');
        $this->available = true;
    }

    public function isAvailable(): bool
    {
        return $this->available;
    }

    public function getScanRootPath(): string
    {
        return $this->scanRootPath;
    }

    private function metaValue(string $key): ?string
    {
        if ($this->pdo === null) {
            return null;
        }
        $stmt = $this->pdo->prepare('SELECT meta_value FROM catalog_meta WHERE meta_key = ? LIMIT 1');
        try {
            $stmt->execute([$key]);
            $value = $stmt->fetchColumn();
        } catch (Throwable) {
            return null;
        }
        return $value === false ? null : (string) $value;
    }

    public function getById(string $id): ?array
    {
        if (!$this->available) {
            return null;
        }
        $stmt = $this->pdo->prepare('SELECT * FROM assets WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function countChildren(string $parentId): int
    {
        if (!$this->available) {
            return 0;
        }
        $stmt = $this->pdo->prepare('SELECT COUNT(*) AS total FROM assets WHERE parent_id = ? AND is_active = 1');
        $stmt->execute([$parentId]);
        return (int) ($stmt->fetchColumn() ?: 0);
    }

    public function listChildren(string $parentId, int $limit, int $offset): array
    {
        if (!$this->available) {
            return [];
        }
        $stmt = $this->pdo->prepare(
            'SELECT * FROM assets WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order ASC, CASE type WHEN "folder" THEN 0 ELSE 1 END ASC, name ASC LIMIT ? OFFSET ?'
        );
        $stmt->bindValue(1, $parentId, PDO::PARAM_STR);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->bindValue(3, $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll() ?: [];
    }

    public function searchByVariants(array $variants, bool $includeFolders, int $limit): array
    {
        if (!$this->available || $variants === []) {
            return [];
        }
        $where = implode(' OR ', array_fill(0, count($variants), 'search_text LIKE ?'));
        $typeFilter = $includeFolders ? '' : 'AND type = "file"';
        $sql = "SELECT * FROM assets WHERE is_active = 1 {$typeFilter} AND ({$where}) ORDER BY depth ASC, name ASC LIMIT ?";
        $stmt = $this->pdo->prepare($sql);
        $index = 1;
        foreach ($variants as $variant) {
            $stmt->bindValue($index++, '%' . $variant . '%', PDO::PARAM_STR);
        }
        $stmt->bindValue($index, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll() ?: [];
    }

    public function allSearchCandidates(bool $includeFolders, int $limit): array
    {
        if (!$this->available) {
            return [];
        }
        $where = $includeFolders ? 'WHERE is_active = 1' : 'WHERE is_active = 1 AND type = "file"';
        $stmt = $this->pdo->prepare("SELECT * FROM assets {$where} ORDER BY depth ASC, name ASC LIMIT ?");
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll() ?: [];
    }

    public function stats(): array
    {
        if (!$this->available) {
            return ['total' => 0, 'files' => 0, 'folders' => 0];
        }
        return [
            'total' => (int) $this->pdo->query('SELECT COUNT(*) FROM assets')->fetchColumn(),
            'files' => (int) $this->pdo->query('SELECT COUNT(*) FROM assets WHERE type = "file"')->fetchColumn(),
            'folders' => (int) $this->pdo->query('SELECT COUNT(*) FROM assets WHERE type = "folder"')->fetchColumn(),
        ];
    }
}

class RuntimeDb
{
    private ?PDO $pdo = null;
    private bool $available = false;

    public function __construct(private readonly string $dbPath)
    {
        $directory = dirname($dbPath);
        if (!is_dir($directory)) {
            @mkdir($directory, 0775, true);
        }
        $this->pdo = new PDO('sqlite:' . $dbPath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $this->init();
        $this->available = true;
    }

    private function init(): void
    {
        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS search_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query_text TEXT NOT NULL,
                query_norm TEXT NOT NULL,
                result_count INTEGER NOT NULL DEFAULT 0,
                created_utc TEXT NOT NULL
            )'
        );
        $this->pdo->exec('CREATE INDEX IF NOT EXISTS idx_search_events_query_norm ON search_events (query_norm)');
        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS item_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                item_name_snapshot TEXT NOT NULL DEFAULT "",
                relative_path_snapshot TEXT NOT NULL DEFAULT "",
                created_utc TEXT NOT NULL
            )'
        );
        $this->pdo->exec('CREATE INDEX IF NOT EXISTS idx_item_events_item_id ON item_events (item_id)');
    }

    public function isAvailable(): bool
    {
        return $this->available;
    }

    public function logSearch(string $queryText, int $resultCount): void
    {
        if (!$this->available) {
            return;
        }
        $query = trim($queryText);
        if ($query === '') {
            return;
        }
        $stmt = $this->pdo->prepare('INSERT INTO search_events (query_text, query_norm, result_count, created_utc) VALUES (?, ?, ?, ?)');
        $stmt->execute([$query, normalize_text($query), $resultCount, gmdate(DATE_ATOM)]);
    }

    public function trackItemEvent(?array $item, string $eventType): void
    {
        if (!$this->available || $item === null || ($item['id'] ?? '') === '') {
            return;
        }
        $stmt = $this->pdo->prepare(
            'INSERT INTO item_events (item_id, event_type, item_name_snapshot, relative_path_snapshot, created_utc) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $item['id'],
            $eventType,
            (string) ($item['name'] ?? ''),
            (string) ($item['relative_path'] ?? ''),
            gmdate(DATE_ATOM),
        ]);
    }

    public function getTopSearches(int $limit): array
    {
        if (!$this->available) {
            return [];
        }
        $stmt = $this->pdo->prepare(
            'SELECT query_norm, MIN(query_text) AS sample_query, COUNT(*) AS uses, SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS empty_uses, MAX(created_utc) AS last_used_utc FROM search_events WHERE query_norm <> "" GROUP BY query_norm ORDER BY uses DESC, last_used_utc DESC, query_norm ASC LIMIT ?'
        );
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll() ?: [];
    }

    public function getTopItems(int $limit): array
    {
        if (!$this->available) {
            return [];
        }
        $stmt = $this->pdo->prepare(
            'SELECT item_id, COUNT(*) AS uses, SUM(CASE WHEN event_type = "open_folder" THEN 1 ELSE 0 END) AS folder_opens, SUM(CASE WHEN event_type = "send_file" THEN 1 ELSE 0 END) AS file_sends, MAX(item_name_snapshot) AS item_name_snapshot, MAX(relative_path_snapshot) AS relative_path_snapshot, MAX(created_utc) AS last_used_utc FROM item_events WHERE item_id <> "" GROUP BY item_id ORDER BY uses DESC, last_used_utc DESC, item_id ASC LIMIT ?'
        );
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll() ?: [];
    }

    public function stats(): array
    {
        if (!$this->available) {
            return ['total_searches' => 0, 'empty_searches' => 0, 'total_item_events' => 0];
        }
        $stmt = $this->pdo->query(
            'SELECT
                (SELECT COUNT(*) FROM search_events) AS total_searches,
                (SELECT COUNT(*) FROM search_events WHERE result_count = 0) AS empty_searches,
                (SELECT COUNT(*) FROM item_events) AS total_item_events'
        );
        return $stmt->fetch() ?: ['total_searches' => 0, 'empty_searches' => 0, 'total_item_events' => 0];
    }
}

function build_breadcrumbs(?array $item, CatalogDb $db): array
{
    if ($item === null) {
        return [];
    }
    $chain = [];
    $current = $item;
    while ($current !== null) {
        $chain[] = [
            'id' => $current['id'],
            'name' => $current['name'],
            'type' => $current['type'],
            'relative_path' => $current['relative_path'],
        ];
        if (($current['parent_id'] ?? '') === '' || ($current['id'] ?? '') === root_id()) {
            break;
        }
        $current = $db->getById((string) $current['parent_id']);
    }
    return array_reverse($chain);
}

function present_item(array $item, string $downloadBase = 'download.php?id='): array
{
    $ext = strtolower((string) ($item['extension'] ?? file_ext((string) ($item['name'] ?? ''))));
    return [
        'id' => $item['id'],
        'type' => $item['type'],
        'name' => $item['name'],
        'label' => $item['label'] ?? $item['name'],
        'icon' => $item['icon'] ?? (($item['type'] ?? '') === 'folder' ? '📁' : '📄'),
        'relativePath' => $item['relative_path'] ?? '',
        'parentId' => $item['parent_id'] ?? '',
        'extension' => $ext,
        'sizeBytes' => (int) ($item['size_bytes'] ?? 0),
        'sizeLabel' => $ext !== '' ? human_file_size((int) ($item['size_bytes'] ?? 0)) : '',
        'kindLabel' => ($item['type'] ?? '') === 'folder' ? 'Раздел' : (file_kind_labels()[$ext] ?? 'Файл'),
        'modifiedUtc' => $item['modified_utc'] ?? '',
        'downloadUrl' => ($item['type'] ?? '') === 'file' ? $downloadBase . urlencode((string) $item['id']) : '',
    ];
}

function root_fallback_items(array $rootItems, int $limit): array
{
    $preferred = ['Логотип', 'Брендбук ЯМАЛ 100', 'Брендбук ЯМАЛ Мастер бренд', 'Логотипы городов', 'Каталог сувенирной продукции', 'Паттерны'];
    $byName = [];
    foreach ($rootItems as $item) {
        $byName[$item['name']] = $item;
    }
    $out = [];
    foreach ($preferred as $name) {
        if (!isset($byName[$name])) {
            continue;
        }
        $out[] = $byName[$name];
        if (count($out) >= $limit) {
            break;
        }
    }
    return $out;
}

class SiteCatalogService
{
    private CatalogDb $db;
    private RuntimeDb $state;
    private array $config;
    private $consultantLlmTransport;

    public function __construct(?array $config = null, ?CatalogDb $db = null, ?RuntimeDb $state = null, $consultantLlmTransport = null)
    {
        $this->config = $config ?? site_config();
        $this->db = $db ?? new CatalogDb($this->config['catalog_db_path'], $this->config['catalog_root_path']);
        $this->state = $state ?? new RuntimeDb($this->config['runtime_db_path']);
        $this->consultantLlmTransport = is_callable($consultantLlmTransport) ? $consultantLlmTransport : null;
    }

    public function getRootFolders(): array
    {
        $items = $this->db->listChildren(root_id(), 200, 0);
        $folders = array_values(array_filter($items, static fn(array $item): bool => ($item['type'] ?? '') === 'folder'));
        return resolve_root_menu_folders($folders);
    }

    private function imageCandidates(): array
    {
        return array_values(array_filter(
            $this->db->allSearchCandidates(false, 8000),
            static fn(array $item): bool => is_previewable_image_file($item)
        ));
    }

    private function examplePayload(array $item, string $group): array
    {
        $presented = present_item($item);
        $context = example_context_from_path((string) ($item['relative_path'] ?? ''), (string) ($item['name'] ?? ''));
        return [
            'id' => (string) ($presented['id'] ?? ''),
            'title' => $context['title'],
            'subtitle' => $context['subtitle'],
            'group' => $group,
            'label' => (string) ($presented['label'] ?? ''),
            'imageUrl' => inline_download_url((string) ($presented['downloadUrl'] ?? '')),
            'downloadUrl' => (string) ($presented['downloadUrl'] ?? ''),
            'extension' => (string) ($presented['extension'] ?? ''),
            'relativePath' => (string) ($presented['relativePath'] ?? ''),
        ];
    }

    private function explicitExamples(array $items, array $keywords, int $limit): array
    {
        $matches = [];
        foreach ($items as $item) {
            $path = (string) ($item['relative_path'] ?? '');
            if (!normalized_contains_any($path, $keywords)) {
                continue;
            }
            $matches[] = $item;
            if (count($matches) >= $limit) {
                break;
            }
        }
        return $matches;
    }

    private function examplesFromDedicatedFolder(array $items, string $group, int $limit): array
    {
        foreach (dedicated_example_folders($group) as $folder) {
            $strictMatches = array_values(array_filter(
                $items,
                static fn(array $item): bool => normalized_path_has_prefix((string) ($item['relative_path'] ?? ''), $folder)
            ));
            if ($strictMatches !== []) {
                return array_slice($strictMatches, 0, $limit);
            }
        }

        $scoped = [];
        foreach (dedicated_examples_roots() as $root) {
            $scoped = array_values(array_filter(
                $items,
                static fn(array $item): bool => normalized_path_has_prefix((string) ($item['relative_path'] ?? ''), $root)
            ));
            if ($scoped !== []) {
                break;
            }
        }
        if ($scoped === []) {
            return [];
        }

        $matches = [];
        $fallback = [];
        foreach ($scoped as $item) {
            $path = (string) ($item['relative_path'] ?? '');
            $isDebate = normalized_contains_any($path, debate_example_keywords());
            $isGood = normalized_contains_any($path, good_example_keywords());

            if ($group === 'debate') {
                if ($isDebate) {
                    $matches[] = $item;
                }
                continue;
            }

            if ($isDebate) {
                continue;
            }
            if ($isGood) {
                $matches[] = $item;
            } else {
                $fallback[] = $item;
            }
        }

        if ($group === 'good' && $fallback !== []) {
            $matches = array_merge($matches, $fallback);
        }

        return array_slice($matches, 0, $limit);
    }

    private function fallbackGoodExamples(array $items, int $limit): array
    {
        $scored = [];
        $priorityWords = [
            'фирменная одежда', 'автобус', 'самолет', 'самолёт', 'рекламный щит', 'городская навигация',
            'фотозона', 'бумажный стаканчик', 'коробка для завтрака', 'шатер', 'шатёр', 'ролл ап',
            'баннер', 'футболка', 'худи', 'свитшот', 'зонт', 'термокружка', 'рюкзак', 'шоппер',
        ];
        $demoteWords = ['логотип', 'знак', 'иллюстрации', 'svg элементы', 'англ', 'black', 'white', 'color'];
        foreach ($items as $item) {
            $path = normalize_text((string) ($item['relative_path'] ?? ''));
            $score = 0;
            if (str_contains($path, normalize_text('файлы макеты'))) {
                $score += 120;
            }
            if (str_contains($path, normalize_text('каталог сувенирной продукции'))) {
                $score += 80;
            }
            if (normalized_contains_any($path, $priorityWords)) {
                $score += 40;
            }
            if (normalized_contains_any($path, $demoteWords)) {
                $score -= 60;
            }
            if ($score <= 0) {
                continue;
            }
            $item['__example_score'] = $score;
            $scored[] = $item;
        }

        usort($scored, static function (array $left, array $right): int {
            if (($right['__example_score'] ?? 0) !== ($left['__example_score'] ?? 0)) {
                return ($right['__example_score'] ?? 0) <=> ($left['__example_score'] ?? 0);
            }
            return strnatcasecmp((string) ($left['relative_path'] ?? ''), (string) ($right['relative_path'] ?? ''));
        });

        $out = [];
        $seenTitles = [];
        foreach ($scored as $item) {
            $context = example_context_from_path((string) ($item['relative_path'] ?? ''), (string) ($item['name'] ?? ''));
            $key = normalize_text(($context['title'] ?? '') . ' ' . ($context['subtitle'] ?? ''));
            if ($key === '' || isset($seenTitles[$key])) {
                continue;
            }
            $seenTitles[$key] = true;
            $out[] = $item;
            if (count($out) >= $limit) {
                break;
            }
        }
        return $out;
    }

    public function getHeroExamples(): array
    {
        $items = $this->imageCandidates();
        $good = $this->examplesFromDedicatedFolder($items, 'good', 8);
        if ($good === []) {
            $good = $this->explicitExamples($items, good_example_keywords(), 8);
        }
        if ($good === []) {
            $good = $this->fallbackGoodExamples($items, 8);
        }

        $debate = $this->examplesFromDedicatedFolder($items, 'debate', 8);
        if ($debate === []) {
            $debate = $this->explicitExamples($items, debate_example_keywords(), 8);
        }

        return [
            'good' => array_map(fn(array $item): array => $this->examplePayload($item, 'good'), $good),
            'debate' => array_map(fn(array $item): array => $this->examplePayload($item, 'debate'), $debate),
        ];
    }

    public function getFavorites(): array
    {
        $records = $this->state->getTopItems($this->config['favorites_limit'] * 3);
        $items = [];
        $seen = [];
        foreach ($records as $record) {
            $itemId = (string) ($record['item_id'] ?? '');
            if ($itemId === '' || isset($seen[$itemId])) {
                continue;
            }
            $item = $this->db->getById($itemId);
            if ($item === null || (int) ($item['is_active'] ?? 1) !== 1) {
                continue;
            }
            $parent = ($item['parent_id'] ?? '') !== '' ? $this->db->getById((string) $item['parent_id']) : null;
            $decorated = decorate_folder_items($parent ?? [], [$item]);
            $presented = present_item($decorated[0] ?? $item);
            $presented['uses'] = (int) ($record['uses'] ?? 0);
            $items[] = $presented;
            $seen[$itemId] = true;
            if (count($items) >= $this->config['favorites_limit']) {
                break;
            }
        }

        if ($items !== []) {
            return $items;
        }
        return array_map(static fn(array $item): array => present_item($item), root_fallback_items($this->getRootFolders(), $this->config['favorites_limit']));
    }

    public function getBootstrap(): array
    {
        $catalogStats = $this->db->stats();
        $runtimeStats = $this->state->stats();
        return [
            'title' => $this->config['title'],
            'rootId' => root_id(),
            'setupMessage' => $this->db->isAvailable() ? '' : 'Каталог еще не загружен на хостинг. Сайт уже готов, осталось положить файлы в папку data/files.',
            'stats' => [
                'totalAssets' => (int) ($catalogStats['total'] ?? 0),
                'files' => (int) ($catalogStats['files'] ?? 0),
                'folders' => (int) ($catalogStats['folders'] ?? 0),
                'searches' => (int) ($runtimeStats['total_searches'] ?? 0),
                'emptySearches' => (int) ($runtimeStats['empty_searches'] ?? 0),
            ],
            'sections' => array_map(static fn(array $item): array => present_item($item), $this->getRootFolders()),
            'examples' => $this->getHeroExamples(),
            'constructors' => constructor_bootstrap(),
            'consultant' => consultant_bootstrap($this->config),
            'favorites' => $this->getFavorites(),
            'topSearches' => array_map(static fn(array $row): array => ['query' => $row['sample_query'], 'uses' => (int) $row['uses']], $this->state->getTopSearches(8)),
        ];
    }

    private function constructorContext(array $definition, array $input): array
    {
        $query = constructor_query_value((string) ($definition['consultPrompt'] ?? ''), $input);
        if ($query === '') {
            $query = trim((string) ($definition['label'] ?? ''));
        }
        return build_consultant_context($query, '');
    }

    private function constructorKeywordSections(array $definition): array
    {
        $keywords = array_values(array_filter(array_map(
            static fn($value): string => trim((string) $value),
            $definition['sectionKeywords'] ?? []
        )));
        if ($keywords === []) {
            return [];
        }

        $sections = [];
        foreach ($this->getRootFolders() as $section) {
            $source = normalize_text(implode(' ', [
                (string) ($section['name'] ?? ''),
                (string) ($section['label'] ?? ''),
                (string) ($section['relative_path'] ?? ''),
            ]));
            $score = 0;
            foreach ($keywords as $keyword) {
                $normalizedKeyword = normalize_text($keyword);
                if ($normalizedKeyword !== '' && str_contains($source, $normalizedKeyword)) {
                    $score += 1;
                }
            }
            if ($score <= 0) {
                continue;
            }
            $section['__constructor_score'] = $score;
            $sections[] = $section;
        }

        usort($sections, static function (array $left, array $right): int {
            if (($right['__constructor_score'] ?? 0) !== ($left['__constructor_score'] ?? 0)) {
                return ($right['__constructor_score'] ?? 0) <=> ($left['__constructor_score'] ?? 0);
            }
            return strnatcasecmp((string) ($left['name'] ?? ''), (string) ($right['name'] ?? ''));
        });

        foreach ($sections as &$section) {
            unset($section['__constructor_score']);
        }
        unset($section);

        return array_slice($sections, 0, 4);
    }

    private function constructorMergeSections(array ...$sectionGroups): array
    {
        $merged = [];
        $seen = [];
        foreach ($sectionGroups as $group) {
            foreach ($group as $section) {
                $id = (string) ($section['id'] ?? '');
                if ($id === '' || isset($seen[$id])) {
                    continue;
                }
                $seen[$id] = true;
                $merged[] = $section;
                if (count($merged) >= 4) {
                    break 2;
                }
            }
        }
        return $merged;
    }

    private function constructorQueries(array $definition, array $input): array
    {
        $queries = [];
        $seen = [];
        $add = static function (string $value) use (&$queries, &$seen): void {
            $trimmed = trim($value);
            $normalized = normalize_text($trimmed);
            if ($trimmed === '' || $normalized === '' || isset($seen[$normalized])) {
                return;
            }
            $seen[$normalized] = true;
            $queries[] = $trimmed;
        };

        $add(constructor_query_value((string) ($definition['consultPrompt'] ?? ''), $input));
        foreach (($definition['queries'] ?? []) as $queryTemplate) {
            $add(constructor_query_value((string) $queryTemplate, $input));
        }

        return array_slice($queries, 0, 8);
    }

    private function constructorRecommendations(array $definition, array $input): array
    {
        $context = $this->constructorContext($definition, $input);
        $queries = $this->constructorQueries($definition, $input);
        $sections = $this->constructorMergeSections(
            $this->selectConsultSections($context),
            $this->constructorKeywordSections($definition)
        );

        $items = [];
        $seen = [];
        foreach ($queries as $query) {
            $payload = $this->search($query, false, false);
            foreach (($payload['items'] ?? []) as $item) {
                $id = (string) ($item['id'] ?? '');
                if ($id === '' || isset($seen[$id])) {
                    continue;
                }
                $seen[$id] = true;
                $items[] = $item;
                if (count($items) >= 20) {
                    break 2;
                }
            }
        }

        foreach ($this->collectSectionStarterItems($sections) as $item) {
            $id = (string) ($item['id'] ?? '');
            if ($id === '' || isset($seen[$id])) {
                continue;
            }
            $seen[$id] = true;
            $items[] = $item;
            if (count($items) >= 28) {
                break;
            }
        }

        $filtered = $this->filterConsultItemsBySections($items, $sections);
        $scored = [];
        foreach ($filtered as $item) {
            $item['__constructor_score'] = $this->scoreConsultItem($item, $context, $sections);
            $scored[] = $item;
        }

        usort($scored, static function (array $left, array $right): int {
            if (($right['__constructor_score'] ?? 0) !== ($left['__constructor_score'] ?? 0)) {
                return ($right['__constructor_score'] ?? 0) <=> ($left['__constructor_score'] ?? 0);
            }
            return strnatcasecmp((string) ($left['relativePath'] ?? ''), (string) ($right['relativePath'] ?? ''));
        });

        $pool = array_values(array_filter($scored, static fn(array $item): bool => (int) ($item['__constructor_score'] ?? 0) > 0));
        if ($pool === []) {
            $pool = $scored;
        }

        $recommendedItems = [];
        foreach (array_slice($pool, 0, 4) as $item) {
            unset($item['__constructor_score']);
            $recommendedItems[] = $item;
        }

        return [
            'query' => (string) ($queries[0] ?? ''),
            'queries' => $queries,
            'context' => [
                'intentId' => (string) (($context['intent']['id'] ?? '')),
                'city' => (string) ($context['city'] ?? ''),
                'formats' => array_values($context['formats'] ?? []),
                'medium' => (string) ($context['medium'] ?? ''),
                'sourceMode' => (string) ($context['sourceMode'] ?? ''),
                'applicationFocus' => (string) ($context['applicationFocus'] ?? ''),
            ],
            'sections' => array_map(static fn(array $item): array => present_item($item), $sections),
            'items' => $recommendedItems,
            'advice' => consultant_brandbook_advice($context, $sections),
        ];
    }

    private function constructorArtifacts(array $definition, array $input, array $recommendations): array
    {
        $artifacts = [];
        $svg = constructor_svg_artifact($definition, $input);
        if ($svg !== null) {
            $artifacts[] = $svg;
        }

        if ((string) ($definition['artifactKind'] ?? '') === 'brief') {
            $artifacts[] = constructor_html_brief_artifact($definition, $input, $recommendations);
        }

        $artifacts[] = constructor_json_brief_artifact($definition, $input, $recommendations);
        return $artifacts;
    }

    private function constructorResponsePayload(array $definition, array $input, bool $generated): array
    {
        $normalizedInput = constructor_normalize_input($definition, $input);
        $recommendations = $this->constructorRecommendations($definition, $normalizedInput);
        $artifacts = $this->constructorArtifacts($definition, $normalizedInput, $recommendations);

        return [
            'generated' => $generated,
            'definition' => constructor_present_definition($definition),
            'input' => $normalizedInput,
            'summary' => $generated
                ? constructor_result_summary($definition, $normalizedInput, $recommendations, $artifacts)
                : constructor_draft_summary($definition, $normalizedInput, $recommendations),
            'recommendations' => $recommendations,
            'artifacts' => array_map(static fn(array $artifact): array => constructor_present_artifact($artifact), $artifacts),
        ];
    }

    public function getConstructor(string $constructorId): ?array
    {
        $definition = constructor_definition_by_id($constructorId);
        if ($definition === null) {
            return null;
        }

        return $this->constructorResponsePayload($definition, constructor_default_input($definition), false);
    }

    public function buildConstructor(string $constructorId, array $input = []): ?array
    {
        $definition = constructor_definition_by_id($constructorId);
        if ($definition === null) {
            return null;
        }

        return $this->constructorResponsePayload($definition, $input, true);
    }

    private function consultSearchQueries(array $context): array
    {
        $intent = $context['intent'] ?? null;
        $query = (string) ($context['query'] ?? '');
        $city = (string) ($context['city'] ?? '');
        $formats = $context['formats'] ?? [];
        $medium = (string) ($context['medium'] ?? '');
        $sourceMode = (string) ($context['sourceMode'] ?? '');
        $applicationFocus = (string) ($context['applicationFocus'] ?? '');
        $queries = [];
        $seen = [];
        $add = static function (string $value) use (&$queries, &$seen): void {
            $trimmed = trim($value);
            $normalized = normalize_text($trimmed);
            if ($trimmed === '' || $normalized === '' || isset($seen[$normalized])) {
                return;
            }
            $seen[$normalized] = true;
            $queries[] = $trimmed;
        };

        $add($query);
        $intentId = (string) ($intent['id'] ?? '');
        $cityLabel = consultant_city_display_name($city);
        $singleFormat = strtolower((string) ($formats[0] ?? ''));

        if ($intentId === 'logo') {
            if ($cityLabel !== '') {
                $add('логотип ' . $cityLabel);
                $add($cityLabel . ' логотип');
                $add('логотипы городов ' . $cityLabel);
                $add($cityLabel . ' svg');
            }
            if ($singleFormat !== '') {
                $add('логотип ' . $singleFormat);
                $add('фирменный знак ' . $singleFormat);
            }
            if ($medium === 'print') {
                $add('логотип pdf');
                $add('логотип cmyk');
            } elseif ($medium === 'digital') {
                $add('логотип png');
                $add('логотип svg');
            }
            if ($sourceMode === 'editable' && $singleFormat === '') {
                $add('логотип ai');
                $add('логотип eps');
            }
            $add('логотип');
            $add('фирменный знак');

            if ($applicationFocus === 'dark_background') {
                if ($cityLabel !== '') {
                    $add($cityLabel . ' white');
                    $add($cityLabel . ' black');
                }
                $add('логотип white');
                $add('логотип black');
            }

            if ($applicationFocus === 'photo_overlay') {
                if ($cityLabel !== '') {
                    $add($cityLabel . ' white');
                    $add($cityLabel . ' pdf');
                }
                $add('логотип white');
                $add('логотип pdf');
                $add('фирменный знак white');
            }

            if ($applicationFocus === 'color_change') {
                $add('брендбук pdf');
                if ($cityLabel !== '') {
                    $add('брендбук ' . $cityLabel . ' pdf');
                }
                $add('логотип pdf');
                $add('фирменный знак pdf');
            }

            if ($applicationFocus === 'distortion') {
                $add('брендбук pdf');
                if ($cityLabel !== '') {
                    $add('брендбук ' . $cityLabel . ' pdf');
                }
                $add('логотип svg');
                $add('логотип pdf');
            }

            if ($applicationFocus === 'contractor_handoff') {
                $add('логотип pdf');
                $add('логотип ai');
                $add('логотип eps');
            }

            if ($applicationFocus === 'approval_handoff') {
                $add('логотип pdf');
                $add('фирменный знак pdf');
            }
        }

        if ($intentId === 'brandbook') {
            if ($cityLabel !== '') {
                $add('брендбук ' . $cityLabel);
                $cityBrandbook = consultant_city_brandbook_name($city);
                if ($cityBrandbook !== '') {
                    $add($cityBrandbook);
                }
                $add($cityLabel);
                $add($cityLabel . ' логотип');
            }
            if (in_array('pdf', $formats, true) || $medium === 'print') {
                $add('брендбук pdf');
            }
            $add('брендбук');
            $add('мастер бренд');

            if (in_array($applicationFocus, ['contractor_handoff', 'approval_handoff'], true)) {
                $add('брендбук pdf');
                if ($cityLabel !== '') {
                    $add('брендбук ' . $cityLabel . ' pdf');
                }
            }
        }

        if ($intentId === 'city') {
            if ($cityLabel !== '') {
                $add($cityLabel);
                $cityBrandbook = consultant_city_brandbook_name($city);
                if ($cityBrandbook !== '') {
                    $add($cityBrandbook);
                }
                $add('брендбук ' . $cityLabel);
                $add('логотип ' . $cityLabel);
                $add('логотипы городов ' . $cityLabel);
            }
            $add('логотипы городов');
        }

        if ($intentId === 'fonts') {
            $add('шрифт');
            foreach ($formats as $format) {
                $add('шрифт ' . strtoupper((string) $format));
            }
            if ($formats === []) {
                $add('шрифт ttf');
                $add('шрифт otf');
            }
        }

        if ($intentId === 'graphics') {
            $add('svg');
            $add('паттерн');
            $add('иллюстрации');
            if ($singleFormat !== '') {
                $add('svg ' . $singleFormat);
            }
        }

        if ($intentId === 'merch') {
            if ($medium === 'navigation') {
                $add('навигация');
                $add('баннер');
            } elseif ($medium === 'digital') {
                $add('диджитал');
            } else {
                $add('сувенир');
                $add('сувенирка');
                $add('полиграфия');
            }
        }

        if ($intentId === '' && $applicationFocus === 'contractor_handoff') {
            $add('брендбук pdf');
            $add('логотип pdf');
            $add('логотип ai');
        }

        if ($intentId === '' && $applicationFocus === 'dark_background') {
            $add('логотип white');
            $add('логотип black');
            $add('фирменный знак white');
        }

        if ($intentId === '' && $applicationFocus === 'approval_handoff') {
            $add('брендбук pdf');
            $add('логотип pdf');
        }

        foreach (($intent['queries'] ?? []) as $candidate) {
            $add((string) $candidate);
        }

        return array_slice($queries, 0, 8);
    }

    private function consultSuggestedQueries(?array $intent, string $query, array $queries): array
    {
        $suggestions = [];
        $seen = [];
        $queryNormalized = normalize_text($query);
        $add = static function (string $value) use (&$suggestions, &$seen, $queryNormalized): void {
            $trimmed = trim($value);
            $normalized = normalize_text($trimmed);
            if ($trimmed === '' || $normalized === '' || $normalized === $queryNormalized || isset($seen[$normalized])) {
                return;
            }
            $seen[$normalized] = true;
            $suggestions[] = $trimmed;
        };

        foreach (($intent['suggestedQueries'] ?? []) as $candidate) {
            $add((string) $candidate);
        }
        foreach ($queries as $candidate) {
            $add((string) $candidate);
        }

        return array_slice($suggestions, 0, 4);
    }

    private function scoreConsultSection(array $section, array $context): int
    {
        $name = (string) ($section['name'] ?? '');
        $label = (string) ($section['label'] ?? $name);
        $source = normalize_text($name . ' ' . $label);
        $intentId = (string) (($context['intent']['id'] ?? ''));
        $city = (string) ($context['city'] ?? '');
        $cityBrandbook = consultant_city_brandbook_name($city);
        $formats = $context['formats'] ?? [];
        $medium = (string) ($context['medium'] ?? '');
        $applicationFocus = (string) ($context['applicationFocus'] ?? '');
        $score = 0;

        if ($intentId === 'logo') {
            if (str_contains($source, normalize_text('логотип'))) {
                $score += 130;
            }
            if (str_contains($source, normalize_text('знак'))) {
                $score += 110;
            }
            if ($city !== '' && $name === 'Логотипы городов') {
                $score += 136;
            }
        }

        if ($intentId === 'brandbook') {
            if (str_starts_with($name, 'Брендбук ')) {
                $score += 120;
            }
            if ($cityBrandbook !== '' && $name === $cityBrandbook) {
                $score += 80;
            }
            if ($city !== '' && $name === 'Логотипы городов') {
                $score += 44;
            }
        }

        if ($intentId === 'city') {
            if ($name === 'Логотипы городов') {
                $score += 140;
            }
            if ($cityBrandbook !== '' && $name === $cityBrandbook) {
                $score += 126;
            }
        }

        if ($intentId === 'fonts' && str_contains($source, normalize_text('шрифт'))) {
            $score += 160;
        }

        if ($intentId === 'merch' && str_contains($source, normalize_text('сувенир'))) {
            $score += 160;
        }

        if ($intentId === 'graphics') {
            if (str_contains($source, normalize_text('иллюстра'))) {
                $score += 134;
            }
            if (str_contains($source, normalize_text('паттер'))) {
                $score += 126;
            }
            if (str_contains($source, normalize_text('svg'))) {
                $score += 122;
            }
        }

        if (array_intersect($formats, ['ttf', 'otf']) !== [] && str_contains($source, normalize_text('шрифт'))) {
            $score += 90;
        }
        if (in_array('svg', $formats, true) && (str_contains($source, normalize_text('логотип')) || str_contains($source, normalize_text('иллюстра')) || str_contains($source, normalize_text('svg')))) {
            $score += 26;
        }
        if ($medium === 'merch' && str_contains($source, normalize_text('сувенир'))) {
            $score += 42;
        }
        if (in_array($medium, ['navigation', 'digital'], true) && str_contains($source, normalize_text('сувенир'))) {
            $score += 26;
        }
        if ($applicationFocus === 'dark_background' && (str_contains($source, normalize_text('логотип')) || str_contains($source, normalize_text('знак')))) {
            $score += 34;
        }
        if ($applicationFocus === 'dark_background' && str_contains($source, normalize_text('брендбук'))) {
            $score += 18;
        }
        if (in_array($applicationFocus, ['color_change', 'distortion', 'photo_overlay'], true) && (str_contains($source, normalize_text('логотип')) || str_contains($source, normalize_text('знак')))) {
            $score += 34;
        }
        if (in_array($applicationFocus, ['color_change', 'distortion', 'photo_overlay'], true) && str_contains($source, normalize_text('брендбук'))) {
            $score += 18;
        }
        if (in_array($applicationFocus, ['contractor_handoff', 'approval_handoff'], true) && str_contains($source, normalize_text('брендбук'))) {
            $score += 34;
        }
        if (in_array($applicationFocus, ['contractor_handoff', 'approval_handoff'], true) && (str_contains($source, normalize_text('логотип')) || str_contains($source, normalize_text('знак')))) {
            $score += 24;
        }
        if ($applicationFocus === 'contractor_handoff' && str_contains($source, normalize_text('сувенир'))) {
            $score += 20;
        }

        foreach (build_query_variants((string) ($context['query'] ?? '')) as $variant) {
            if (mb_strlen($variant, 'UTF-8') >= 4 && str_contains($source, $variant)) {
                $score += 8;
            }
        }

        return $score;
    }

    private function selectConsultSections(array $context): array
    {
        $scored = [];
        $order = 0;
        foreach ($this->getRootFolders() as $section) {
            $score = $this->scoreConsultSection($section, $context);
            if ($score <= 0) {
                $order += 1;
                continue;
            }
            $section['__consult_score'] = $score;
            $section['__consult_order'] = $order;
            $scored[] = $section;
            $order += 1;
        }

        usort($scored, static function (array $left, array $right): int {
            if (($right['__consult_score'] ?? 0) !== ($left['__consult_score'] ?? 0)) {
                return ($right['__consult_score'] ?? 0) <=> ($left['__consult_score'] ?? 0);
            }
            return ($left['__consult_order'] ?? 0) <=> ($right['__consult_order'] ?? 0);
        });

        foreach ($scored as &$item) {
            unset($item['__consult_score'], $item['__consult_order']);
        }
        unset($item);

        return array_slice($scored, 0, 4);
    }

    private function filterConsultItemsBySections(array $items, array $sections): array
    {
        if ($items === [] || $sections === []) {
            return $items;
        }

        $allowed = [];
        foreach ($sections as $section) {
            $name = normalize_text((string) ($section['name'] ?? ''));
            if ($name !== '') {
                $allowed[$name] = true;
            }
        }

        if ($allowed === []) {
            return $items;
        }

        $filtered = [];
        foreach ($items as $item) {
            $relativePath = str_replace('\\', '/', (string) ($item['relativePath'] ?? ''));
            $parts = explode('/', $relativePath);
            $top = normalize_text((string) ($parts[0] ?? ''));
            if ($top !== '' && isset($allowed[$top])) {
                $filtered[] = $item;
            }
        }

        return $filtered !== [] ? $filtered : $items;
    }

    private function scoreConsultItem(array $item, array $context, array $sections): int
    {
        $intentId = (string) (($context['intent']['id'] ?? ''));
        $city = (string) ($context['city'] ?? '');
        $formats = $context['formats'] ?? [];
        $medium = (string) ($context['medium'] ?? '');
        $sourceMode = (string) ($context['sourceMode'] ?? '');
        $applicationFocus = (string) ($context['applicationFocus'] ?? '');
        $relativePath = (string) ($item['relativePath'] ?? '');
        $haystack = normalize_text(implode(' ', [
            (string) ($item['label'] ?? ''),
            (string) ($item['name'] ?? ''),
            $relativePath,
            (string) ($item['kindLabel'] ?? ''),
        ]));
        $extension = strtolower((string) ($item['extension'] ?? ''));
        $score = 0;

        foreach ($sections as $section) {
            $sectionName = normalize_text((string) ($section['name'] ?? ''));
            if ($sectionName !== '' && str_starts_with(normalize_text($relativePath), $sectionName)) {
                $score += 36;
                break;
            }
        }

        foreach (build_query_variants((string) ($context['query'] ?? '')) as $variant) {
            if ($variant !== '' && mb_strlen($variant, 'UTF-8') >= 4 && str_contains($haystack, $variant)) {
                $score += 10;
            }
        }

        if ($intentId === 'logo') {
            if (str_contains($haystack, normalize_text('логотип'))) {
                $score += 58;
            }
            if (str_contains($haystack, normalize_text('знак'))) {
                $score += 46;
            }
        }

        if ($intentId === 'brandbook' && str_contains($haystack, normalize_text('брендбук'))) {
            $score += 74;
        }

        if ($intentId === 'fonts') {
            if (in_array($extension, ['ttf', 'otf'], true)) {
                $score += 90;
            }
            if ($extension === 'zip') {
                $score += 42;
            }
            if (str_contains($haystack, normalize_text('шрифт'))) {
                $score += 56;
            }
        }

        if ($intentId === 'graphics') {
            if ($extension === 'svg') {
                $score += 58;
            }
            if (str_contains($haystack, normalize_text('паттер')) || str_contains($haystack, normalize_text('иллюстра')) || str_contains($haystack, normalize_text('svg'))) {
                $score += 50;
            }
        }

        if ($intentId === 'merch' && normalized_contains_any($haystack, ['сувенир', 'мерч', 'полиграф', 'канцеляр', 'диджитал', 'футбол', 'наклей'])) {
            $score += 54;
        }

        if ($intentId === 'city') {
            $aliases = consultant_city_aliases()[normalize_text($city)] ?? [];
            if ($aliases !== [] && normalized_contains_any($haystack, $aliases)) {
                $score += 58;
            }
            if (normalized_contains_any($haystack, ['логотип', 'брендбук'])) {
                $score += 22;
            }
        }

        if ($city !== '') {
            $aliases = consultant_city_aliases()[normalize_text($city)] ?? [consultant_city_display_name($city)];
            if (normalized_contains_any($haystack, $aliases)) {
                $score += 40;
            }
        }

        if ($formats !== []) {
            if (in_array($extension, $formats, true)) {
                $score += 86;
            } elseif (in_array('jpg', $formats, true) && $extension === 'jpeg') {
                $score += 86;
            }
        }

        if ($medium === 'print' && (normalized_contains_any($haystack, ['cmyk', 'печать']) || in_array($extension, ['pdf', 'ai', 'cdr', 'eps'], true))) {
            $score += 28;
        }
        if ($medium === 'digital' && in_array($extension, ['png', 'jpg', 'jpeg', 'svg'], true)) {
            $score += 24;
        }
        if ($medium === 'navigation' && normalized_contains_any($haystack, ['баннер', 'навигац', 'щит', 'таблич'])) {
            $score += 26;
        }
        if ($medium === 'merch' && normalized_contains_any($haystack, ['сувенир', 'мерч', 'футбол', 'худи', 'наклей'])) {
            $score += 24;
        }

        if ($sourceMode === 'editable' && in_array($extension, ['ai', 'cdr', 'eps', 'svg', 'zip'], true)) {
            $score += 26;
        }
        if ($sourceMode === 'ready' && in_array($extension, ['pdf', 'png', 'jpg', 'jpeg'], true)) {
            $score += 18;
        }

        if ($applicationFocus === 'dark_background') {
            if (normalized_contains_any($haystack, ['white', 'black', 'бел', 'черн', 'чёрн'])) {
                $score += 42;
            }
            if (in_array($extension, ['svg', 'pdf', 'png'], true)) {
                $score += 16;
            }
        }

        if ($applicationFocus === 'photo_overlay') {
            if (normalized_contains_any($haystack, ['white', 'black', 'бел', 'черн', 'чёрн'])) {
                $score += 32;
            }
            if (in_array($extension, ['svg', 'pdf', 'png'], true)) {
                $score += 18;
            }
        }

        if (in_array($applicationFocus, ['color_change', 'distortion'], true) && in_array($extension, ['pdf', 'svg'], true)) {
            $score += 16;
        }

        if ($applicationFocus === 'contractor_handoff' && in_array($extension, ['pdf', 'ai', 'eps', 'cdr', 'svg'], true)) {
            $score += 32;
        }

        if ($applicationFocus === 'approval_handoff' && in_array($extension, ['pdf', 'png', 'jpg', 'jpeg'], true)) {
            $score += 26;
        }

        if (normalized_contains_any($haystack, ['спорные примеры', 'хорошие примеры', 'примеры внедрения'])) {
            $score -= 60;
        }

        return $score;
    }

    private function collectSectionStarterItems(array $sections): array
    {
        $items = [];
        $seen = [];
        foreach ($sections as $section) {
            $children = decorate_folder_items($section, $this->db->listChildren((string) ($section['id'] ?? ''), 18, 0));
            foreach ($children as $child) {
                if (($child['type'] ?? '') === 'file') {
                    $presented = present_item($child);
                    $id = (string) ($presented['id'] ?? '');
                    if ($id !== '' && !isset($seen[$id])) {
                        $seen[$id] = true;
                        $items[] = $presented;
                    }
                    continue;
                }

                if (($child['type'] ?? '') !== 'folder') {
                    continue;
                }

                $nested = decorate_folder_items($child, $this->db->listChildren((string) ($child['id'] ?? ''), 10, 0));
                foreach ($nested as $nestedItem) {
                    if (($nestedItem['type'] ?? '') !== 'file') {
                        continue;
                    }
                    $presented = present_item($nestedItem);
                    $id = (string) ($presented['id'] ?? '');
                    if ($id !== '' && !isset($seen[$id])) {
                        $seen[$id] = true;
                        $items[] = $presented;
                    }
                    if (count($items) >= 18) {
                        break 3;
                    }
                }
            }
        }

        return $items;
    }

    private function collectConsultItems(array $context, array $sections): array
    {
        $items = [];
        $seen = [];
        foreach ($this->consultSearchQueries($context) as $query) {
            $payload = $this->search((string) $query, false, false);
            foreach ($payload['items'] ?? [] as $item) {
                $id = (string) ($item['id'] ?? '');
                if ($id === '' || isset($seen[$id])) {
                    continue;
                }
                $seen[$id] = true;
                $items[] = $item;
                if (count($items) >= 20) {
                    break 2;
                }
            }
        }

        foreach ($this->collectSectionStarterItems($sections) as $item) {
            $id = (string) ($item['id'] ?? '');
            if ($id === '' || isset($seen[$id])) {
                continue;
            }
            $seen[$id] = true;
            $items[] = $item;
            if (count($items) >= 28) {
                break;
            }
        }

        $filtered = $this->filterConsultItemsBySections($items, $sections);
        $scored = [];
        foreach ($filtered as $item) {
            $item['__consult_score'] = $this->scoreConsultItem($item, $context, $sections);
            $scored[] = $item;
        }

        usort($scored, static function (array $left, array $right): int {
            if (($right['__consult_score'] ?? 0) !== ($left['__consult_score'] ?? 0)) {
                return ($right['__consult_score'] ?? 0) <=> ($left['__consult_score'] ?? 0);
            }
            return strnatcasecmp((string) ($left['relativePath'] ?? ''), (string) ($right['relativePath'] ?? ''));
        });

        $pool = array_values(array_filter($scored, static fn(array $item): bool => (int) ($item['__consult_score'] ?? 0) > 0));
        if ($pool === []) {
            $pool = $scored;
        }

        $out = [];
        foreach (array_slice($pool, 0, 4) as $item) {
            unset($item['__consult_score']);
            $out[] = $item;
        }

        return $out;
    }

    private function deriveConsultSectionsFromItems(array $items): array
    {
        if ($items === []) {
            return [];
        }

        $rootsByName = [];
        foreach ($this->getRootFolders() as $section) {
            $name = normalize_text((string) ($section['name'] ?? ''));
            if ($name !== '') {
                $rootsByName[$name] = $section;
            }
        }

        $derived = [];
        foreach ($items as $item) {
            $relativePath = str_replace('\\', '/', (string) ($item['relativePath'] ?? ''));
            $parts = explode('/', $relativePath);
            $top = normalize_text((string) ($parts[0] ?? ''));
            if ($top !== '' && isset($rootsByName[$top])) {
                $derived[$top] = $rootsByName[$top];
            }
            if (count($derived) >= 4) {
                break;
            }
        }

        return array_values($derived);
    }

    private function consultResponseTitle(array $context): string
    {
        $intent = $context['intent'] ?? null;
        $city = (string) ($context['city'] ?? '');
        $intentId = (string) ($intent['id'] ?? '');
        if ($intentId === 'brandbook' && $city !== '') {
            return 'Брендбук: ' . consultant_city_display_name($city);
        }
        if ($intentId === 'city' && $city !== '') {
            return 'Материалы города: ' . consultant_city_display_name($city);
        }
        if ($intentId === 'logo' && $city !== '') {
            return 'Логотип: ' . consultant_city_display_name($city);
        }
        if ($intent !== null) {
            return (string) ($intent['summary'] ?? 'Подбор материалов');
        }
        if (trim((string) ($context['query'] ?? '')) !== '') {
            return 'Подбор по запросу';
        }
        return 'Помощник каталога';
    }

    private function consultResponseMessage(array $context, array $sections, array $items, array $followUps): string
    {
        $intent = $context['intent'] ?? null;
        $firstSection = (string) ($sections[0]['label'] ?? $sections[0]['name'] ?? '');
        $intentId = (string) ($intent['id'] ?? '');
        $city = (string) ($context['city'] ?? '');
        $applicationFocus = (string) ($context['applicationFocus'] ?? '');
        $understanding = consultant_understanding_labels($context);
        $lead = ($context['memoryApplied'] ?? false) ? 'Учел контекст прошлого шага. ' : '';
        if ($understanding !== []) {
            $lead .= 'Я понял запрос как: ' . implode(', ', $understanding) . '. ';
        }

        if ($applicationFocus === 'dark_background') {
            return $lead . 'Ниже собраны подходящие варианты и совет по использованию логотипа на тёмном фоне.';
        }
        if ($applicationFocus === 'color_change') {
            return $lead . 'Ниже собран совет по цвету логотипа и материалы, от которых безопасно отталкиваться.';
        }
        if ($applicationFocus === 'distortion') {
            return $lead . 'Ниже собран совет по пропорциям логотипа и файлы, которые лучше использовать без деформаций.';
        }
        if ($applicationFocus === 'photo_overlay') {
            return $lead . 'Ниже собраны варианты и совет, как размещать логотип поверх фотографии без потери читаемости.';
        }
        if ($applicationFocus === 'contractor_handoff') {
            return $lead . 'Ниже собран рабочий пакет и совет, что лучше отдавать подрядчику под задачу.';
        }
        if ($applicationFocus === 'approval_handoff') {
            return $lead . 'Ниже собран спокойный пакет для согласования без лишних исходников.';
        }

        if ($intentId === 'city' && $city !== '') {
            return $lead . 'Нашел городские материалы для ' . consultant_city_display_name($city) . '. Начните с логотипов города или брендбука.';
        }
        if ($intentId === 'brandbook' && $city !== '' && $firstSection !== '') {
            return $lead . 'Лучше начать с раздела «' . $firstSection . '». Ниже подобраны брендбук и связанные материалы города.';
        }
        if ($firstSection !== '' && $items !== []) {
            return $lead . 'Лучше начать с раздела «' . $firstSection . '». Ниже только реальные разделы и файлы из каталога.';
        }
        if ($firstSection !== '') {
            return $lead . 'Начните с раздела «' . $firstSection . '». Если нужно, уточните формат, город или тип файла.';
        }
        if ($items !== []) {
            return $lead . 'Нашел несколько реальных материалов по запросу. Можно открыть файл сразу или показать результаты поиска полностью.';
        }
        if ($followUps !== []) {
            return $lead . 'Пока прямого ответа мало, но ниже есть быстрые уточнения, которые сузят подбор.';
        }
        return $lead . 'Сформулируйте запрос чуть точнее: например, «логотип svg», «брендбук Салехард», «шрифт otf» или «сувенирка».';
    }

    private function consultantLlmSettings(): array
    {
        $settings = $this->config['consultant_llm'] ?? consultant_llm_settings_from_env();
        return is_array($settings) ? $settings : consultant_llm_settings_from_env();
    }

    private function consultantLlmStringList(array $items, int $limit = 4): array
    {
        $out = [];
        foreach ($items as $item) {
            $text = trim((string) $item);
            if ($text === '' || in_array($text, $out, true)) {
                continue;
            }
            $out[] = $text;
            if (count($out) >= $limit) {
                break;
            }
        }
        return $out;
    }

    private function consultantLlmSystemPrompt(): string
    {
        return implode("\n", [
            'Ты встроенный помощник каталога бренд-материалов Ямала.',
            'Отвечай только на русском языке.',
            'Ты получаешь уже найденные реальные разделы, реальные файлы и rule-based совет по брендбуку.',
            'Никогда не выдумывай названия файлов, разделов, форматов, ссылок, правил брендбука или фактов о содержимом каталога.',
            'Если опираешься на общую дизайнерскую практику, а не на конкретные материалы каталога, явно помечай это как общую рекомендацию.',
            'Если grounding недостаточен, не притворяйся, что видел файл или страницу брендбука; лучше честно скажи об ограничении и предложи следующий шаг.',
            'Пиши компактно и по делу: один понятный ответ, до четырех коротких буллетов и один следующий вопрос.',
            'В поле note оставляй пустую строку, если дополнительных оговорок нет.',
        ]);
    }

    private function buildConsultantLlmRequestPayload(
        array $context,
        array $sections,
        array $items,
        array $followUps,
        array $advice,
        string $title,
        string $message,
        array $understanding
    ): array {
        $settings = $this->consultantLlmSettings();
        $grounding = [
            'user_query' => (string) ($context['query'] ?? ''),
            'recognized_context' => [
                'intent_id' => (string) (($context['intent']['id'] ?? '')),
                'intent_label' => (string) (($context['intent']['label'] ?? '')),
                'city' => (string) ($context['city'] ?? ''),
                'formats' => array_values($context['formats'] ?? []),
                'medium' => (string) ($context['medium'] ?? ''),
                'source_mode' => (string) ($context['sourceMode'] ?? ''),
                'application_focus' => (string) ($context['applicationFocus'] ?? ''),
                'memory_applied' => (bool) ($context['memoryApplied'] ?? false),
            ],
            'grounded_response' => [
                'title' => $title,
                'message' => $message,
                'understanding' => $this->consultantLlmStringList($understanding, 6),
                'brandbook_advice' => [
                    'topic' => (string) ($advice['topic'] ?? ''),
                    'title' => (string) ($advice['title'] ?? ''),
                    'summary' => (string) ($advice['summary'] ?? ''),
                    'bullets' => $this->consultantLlmStringList($advice['bullets'] ?? [], 4),
                    'next_step' => (string) ($advice['nextStep'] ?? ''),
                ],
                'real_sections' => array_map(
                    static fn(array $section): array => [
                        'label' => (string) ($section['label'] ?? $section['name'] ?? ''),
                        'name' => (string) ($section['name'] ?? ''),
                    ],
                    array_slice($sections, 0, 4)
                ),
                'real_files' => array_map(
                    static fn(array $item): array => [
                        'label' => (string) ($item['label'] ?? $item['name'] ?? ''),
                        'name' => (string) ($item['name'] ?? ''),
                        'relative_path' => (string) ($item['relativePath'] ?? ''),
                        'extension' => (string) ($item['extension'] ?? ''),
                    ],
                    array_slice($items, 0, 4)
                ),
                'follow_ups' => array_map(
                    static fn(array $item): array => [
                        'label' => (string) ($item['label'] ?? ''),
                        'query' => (string) ($item['query'] ?? ''),
                        'reason' => (string) ($item['reason'] ?? ''),
                    ],
                    array_slice($followUps, 0, 4)
                ),
            ],
            'task' => 'Собери более глубокий ответ для пользователя, не нарушая grounding. Если вопрос шире каталога, дай общую рекомендацию, но явно отдели её от подтвержденных материалов каталога.',
        ];

        return [
            'model' => (string) ($settings['model'] ?? 'gpt-5'),
            'reasoning' => [
                'effort' => (string) ($settings['reasoning_effort'] ?? 'high'),
            ],
            'max_output_tokens' => (int) ($settings['max_output_tokens'] ?? 2200),
            'input' => [
                [
                    'role' => 'system',
                    'content' => [
                        [
                            'type' => 'input_text',
                            'text' => $this->consultantLlmSystemPrompt(),
                        ],
                    ],
                ],
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'input_text',
                            'text' => json_encode($grounding, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT),
                        ],
                    ],
                ],
            ],
            'text' => [
                'format' => [
                    'type' => 'json_schema',
                    'name' => 'consultant_deep_answer',
                    'strict' => true,
                    'schema' => consultant_llm_response_schema(),
                ],
            ],
        ];
    }

    private function httpJsonPost(string $url, array $payload, array $headers, int $timeoutSeconds): array
    {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($json) || $json === '') {
            throw new RuntimeException('consultant_llm_encode_failed');
        }

        if (function_exists('curl_init')) {
            $handle = curl_init($url);
            if ($handle === false) {
                throw new RuntimeException('consultant_llm_curl_init_failed');
            }
            curl_setopt_array($handle, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_POSTFIELDS => $json,
                CURLOPT_TIMEOUT => $timeoutSeconds,
                CURLOPT_CONNECTTIMEOUT => min(10, $timeoutSeconds),
            ]);
            $responseBody = curl_exec($handle);
            $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
            $error = curl_error($handle);
            curl_close($handle);
            if ($responseBody === false) {
                throw new RuntimeException('consultant_llm_request_failed: ' . $error);
            }
        } else {
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => implode("\r\n", $headers),
                    'content' => $json,
                    'ignore_errors' => true,
                    'timeout' => $timeoutSeconds,
                ],
            ]);
            $responseBody = @file_get_contents($url, false, $context);
            $status = 0;
            foreach ($http_response_header ?? [] as $headerLine) {
                if (preg_match('/\s(\d{3})\s/', (string) $headerLine, $matches)) {
                    $status = (int) ($matches[1] ?? 0);
                    break;
                }
            }
            if ($responseBody === false) {
                throw new RuntimeException('consultant_llm_stream_failed');
            }
        }

        $decoded = json_decode((string) $responseBody, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('consultant_llm_invalid_json');
        }
        if ($status >= 400) {
            $message = trim((string) (($decoded['error']['message'] ?? $decoded['message'] ?? '')));
            throw new RuntimeException('consultant_llm_http_' . $status . ($message !== '' ? ': ' . $message : ''));
        }

        return $decoded;
    }

    private function dispatchConsultantLlm(array $request): array
    {
        $settings = $this->consultantLlmSettings();
        if (is_callable($this->consultantLlmTransport)) {
            $response = call_user_func($this->consultantLlmTransport, $request, $settings);
            if (is_array($response)) {
                return $response;
            }
            if (is_string($response)) {
                return ['output_text' => $response];
            }
            return [];
        }

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . (string) ($settings['api_key'] ?? ''),
            'User-Agent: yamal-catalog-site/1.0',
        ];
        if (trim((string) ($settings['organization'] ?? '')) !== '') {
            $headers[] = 'OpenAI-Organization: ' . trim((string) $settings['organization']);
        }
        if (trim((string) ($settings['project'] ?? '')) !== '') {
            $headers[] = 'OpenAI-Project: ' . trim((string) $settings['project']);
        }

        return $this->httpJsonPost(
            rtrim((string) ($settings['base_url'] ?? 'https://api.openai.com/v1'), '/') . '/responses',
            $request,
            $headers,
            (int) ($settings['timeout_seconds'] ?? 25)
        );
    }

    private function normalizeConsultantLlmAnswer(array $response): ?array
    {
        $candidate = $response;
        if (!isset($candidate['title']) || !isset($candidate['answer'])) {
            $outputText = openai_response_output_text($response);
            if ($outputText === '') {
                return null;
            }
            $decoded = json_decode($outputText, true);
            if (!is_array($decoded)) {
                return null;
            }
            $candidate = $decoded;
        }

        $mode = (string) ($candidate['mode'] ?? 'catalog');
        if (!in_array($mode, ['catalog', 'brandbook', 'general'], true)) {
            $mode = 'catalog';
        }

        $title = trim((string) ($candidate['title'] ?? ''));
        $answer = trim((string) ($candidate['answer'] ?? ''));
        if ($title === '' || $answer === '') {
            return null;
        }

        $bullets = [];
        foreach (($candidate['bullets'] ?? []) as $item) {
            $text = trim((string) $item);
            if ($text === '' || in_array($text, $bullets, true)) {
                continue;
            }
            $bullets[] = $text;
            if (count($bullets) >= 4) {
                break;
            }
        }

        $followUp = trim((string) ($candidate['follow_up'] ?? $candidate['followUp'] ?? ''));
        $note = trim((string) ($candidate['note'] ?? ''));
        if ($mode === 'general' && $note === '') {
            $note = 'Общая рекомендация вне каталога. По конкретным файлам и разделам ориентируйтесь на подтвержденные материалы ниже.';
        }

        return [
            'provider' => 'openai',
            'mode' => $mode,
            'title' => $title,
            'answer' => $answer,
            'bullets' => $bullets,
            'followUp' => $followUp,
            'note' => $note,
        ];
    }

    private function consultDeepAnswer(
        array $context,
        array $sections,
        array $items,
        array $followUps,
        array $advice,
        string $title,
        string $message,
        array $understanding
    ): ?array {
        if (!consultant_llm_enabled($this->config)) {
            return null;
        }

        try {
            $request = $this->buildConsultantLlmRequestPayload(
                $context,
                $sections,
                $items,
                $followUps,
                $advice,
                $title,
                $message,
                $understanding
            );
            $response = $this->dispatchConsultantLlm($request);
            return $this->normalizeConsultantLlmAnswer($response);
        } catch (Throwable $error) {
            return null;
        }
    }

    public function consult(string $query, string $intentId = '', array $memory = []): array
    {
        $context = build_consultant_context($query, $intentId, $memory);
        $trimmedQuery = (string) ($context['query'] ?? '');
        $intent = $context['intent'] ?? null;
        $sections = $this->selectConsultSections($context);
        $items = $this->collectConsultItems($context, $sections);

        if ($sections === [] && $items !== []) {
            $sections = $this->deriveConsultSectionsFromItems($items);
        }

        $followUps = consultant_follow_up_suggestions($context);
        $queries = $this->consultSearchQueries($context);
        $advice = consultant_brandbook_advice($context, $sections);
        $understanding = consultant_understanding_labels($context);
        $title = $this->consultResponseTitle($context);
        $message = $this->consultResponseMessage($context, $sections, $items, $followUps);
        $presentedSections = array_map(static fn(array $item): array => present_item($item), $sections);
        $deepAnswer = $this->consultDeepAnswer(
            $context,
            $presentedSections,
            $items,
            $followUps,
            $advice,
            $title,
            $message,
            $understanding
        );

        return [
            'query' => $trimmedQuery,
            'intent' => $intent === null ? null : [
                'id' => (string) ($intent['id'] ?? ''),
                'label' => (string) ($intent['label'] ?? ''),
                'summary' => (string) ($intent['summary'] ?? ''),
            ],
            'title' => $title,
            'message' => $message,
            'understanding' => $understanding,
            'context' => [
                'intentId' => (string) ($intent['id'] ?? ''),
                'city' => (string) ($context['city'] ?? ''),
                'formats' => array_values($context['formats'] ?? []),
                'medium' => (string) ($context['medium'] ?? ''),
                'sourceMode' => (string) ($context['sourceMode'] ?? ''),
                'applicationFocus' => (string) ($context['applicationFocus'] ?? ''),
                'memoryApplied' => (bool) ($context['memoryApplied'] ?? false),
            ],
            'advice' => $advice,
            'deepAnswer' => $deepAnswer,
            'sections' => $presentedSections,
            'items' => $items,
            'searchQuery' => (string) ($queries[0] ?? $trimmedQuery),
            'followUps' => $followUps,
            'suggestedQueries' => $followUps !== []
                ? array_values(array_filter(array_unique(array_map(static fn(array $item): string => (string) ($item['query'] ?? ''), $followUps))))
                : $this->consultSuggestedQueries($intent, $trimmedQuery, $queries),
        ];
    }

    public function getFolder(?string $folderId, int $page = 0): ?array
    {
        $folderId = $folderId ?: root_id();
        if ($folderId === root_id()) {
            $roots = $this->getRootFolders();
            return [
                'root' => true,
                'folder' => ['id' => root_id(), 'label' => 'Главное меню', 'name' => 'Главное меню', 'type' => 'folder'],
                'breadcrumbs' => [['id' => root_id(), 'name' => 'Главная', 'type' => 'folder', 'relative_path' => '.']],
                'hint' => $this->db->isAvailable() ? 'Выберите раздел в главном меню.' : 'Сайт готов. Как только в data/files появятся материалы, каталог соберется автоматически.',
                'page' => 0,
                'total' => count($roots),
                'pageSize' => $this->config['page_size'],
                'maxPage' => 0,
                'items' => array_map(static fn(array $item): array => present_item($item), $roots),
            ];
        }

        $folder = $this->db->getById($folderId);
        if ($folder === null || ($folder['type'] ?? '') !== 'folder') {
            return null;
        }

        $total = $this->db->countChildren($folderId);
        $maxPage = max(0, (int) ceil($total / $this->config['page_size']) - 1);
        $currentPage = min(max($page, 0), $maxPage);
        $offset = $currentPage * $this->config['page_size'];
        $items = decorate_folder_items($folder, $this->db->listChildren($folderId, $this->config['page_size'], $offset));
        $this->state->trackItemEvent($folder, 'open_folder');

        return [
            'root' => false,
            'folder' => present_item(array_merge($folder, ['label' => $folder['name'], 'icon' => '📂'])),
            'breadcrumbs' => build_breadcrumbs($folder, $this->db),
            'hint' => get_section_hint((string) $folder['name']),
            'page' => $currentPage,
            'total' => $total,
            'pageSize' => $this->config['page_size'],
            'maxPage' => $maxPage,
            'items' => array_map(static fn(array $item): array => present_item($item), $items),
        ];
    }

    public function search(string $query, bool $track = true, bool $includeFolders = true): array
    {
        $variants = build_query_variants($query);
        if ($variants === []) {
            if ($track) {
                $this->state->logSearch($query, 0);
            }
            return ['query' => $query, 'total' => 0, 'items' => [], 'emptyState' => 'Пупупу....пусто'];
        }

        $direct = $this->db->searchByVariants($variants, $includeFolders, $this->config['page_size'] * 3);
        $fuzzy = rank_search_rows($query, $this->db->allSearchCandidates($includeFolders, 2500), $this->config['page_size'] * 3);
        $merged = [];
        foreach (array_merge($direct, $fuzzy) as $row) {
            $id = (string) ($row['id'] ?? '');
            if ($id === '' || isset($merged[$id])) {
                continue;
            }
            $merged[$id] = $row;
            if (count($merged) >= $this->config['page_size']) {
                break;
            }
        }

        $items = [];
        foreach (array_values($merged) as $item) {
            $parent = ($item['parent_id'] ?? '') !== '' ? $this->db->getById((string) $item['parent_id']) : null;
            $decorated = decorate_folder_items($parent ?? [], [$item]);
            $items[] = present_item($decorated[0] ?? $item);
        }

        if ($track) {
            $this->state->logSearch($query, count($items));
        }
        return [
            'query' => $query,
            'total' => count($items),
            'items' => $items,
            'emptyState' => $items === [] ? 'Пупупу....пусто' : '',
        ];
    }

    public function getFile(string $fileId): ?array
    {
        $item = $this->db->getById($fileId);
        if ($item === null || ($item['type'] ?? '') !== 'file') {
            return null;
        }
        $payload = present_item($item);
        $payload['breadcrumbs'] = build_breadcrumbs($item, $this->db);
        $payload['pathLabel'] = $item['relative_path'];
        $payload['mimeType'] = (string) ($item['mime_type'] ?? '');
        $payload['inlineUrl'] = inline_download_url((string) ($payload['downloadUrl'] ?? ''));
        $payload['previewKind'] = inline_preview_kind($item);
        return $payload;
    }

    public function resolveDownload(string $fileId, bool $track = true): ?array
    {
        $item = $this->db->getById($fileId);
        if ($item === null || ($item['type'] ?? '') !== 'file') {
            return null;
        }
        $rootPath = rtrim($this->db->getScanRootPath() !== '' ? $this->db->getScanRootPath() : (string) $this->config['catalog_root_path'], '/');
        $relative = (string) ($item['relative_path'] ?? '');
        $fullPath = realpath($rootPath . '/' . $relative);
        $rootReal = realpath($rootPath);
        if ($fullPath === false || $rootReal === false || !str_starts_with($fullPath, $rootReal)) {
            return null;
        }
        if ($track) {
            $this->state->trackItemEvent($item, 'send_file');
        }
        return [
            'item' => $item,
            'fullPath' => $fullPath,
            'contentType' => content_type_by_ext((string) ($item['extension'] ?? '')),
        ];
    }
}
