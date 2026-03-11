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

function consultant_bootstrap(): array
{
    return [
        'title' => 'Помощник по каталогу',
        'description' => 'Опишите задачу или выберите готовый сценарий. Помощник предлагает только реальные разделы и файлы из каталога.',
        'placeholder' => 'Например: нужен логотип в SVG или брендбук Салехарда',
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

        if ($score > $bestScore) {
            $bestScore = $score;
            $bestIntent = $intent;
        }
    }

    return $bestScore > 0 ? $bestIntent : null;
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

    public function __construct(?array $config = null, ?CatalogDb $db = null, ?RuntimeDb $state = null)
    {
        $this->config = $config ?? site_config();
        $this->db = $db ?? new CatalogDb($this->config['catalog_db_path'], $this->config['catalog_root_path']);
        $this->state = $state ?? new RuntimeDb($this->config['runtime_db_path']);
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
            'consultant' => consultant_bootstrap(),
            'favorites' => $this->getFavorites(),
            'topSearches' => array_map(static fn(array $row): array => ['query' => $row['sample_query'], 'uses' => (int) $row['uses']], $this->state->getTopSearches(8)),
        ];
    }

    private function consultSearchQueries(?array $intent, string $query, string $city): array
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

        $add($query);
        $intentId = (string) ($intent['id'] ?? '');
        $cityLabel = consultant_city_display_name($city);

        if ($intentId === 'brandbook' && $cityLabel !== '') {
            $add('брендбук ' . $cityLabel);
            $add($cityLabel);
            $add($cityLabel . ' логотип');
        }

        if ($intentId === 'city' && $cityLabel !== '') {
            $add($cityLabel);
            $add('брендбук ' . $cityLabel);
            $add('логотип ' . $cityLabel);
        }

        foreach (($intent['queries'] ?? []) as $candidate) {
            $add((string) $candidate);
        }

        return array_slice($queries, 0, 6);
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

    private function selectConsultSections(?array $intent, string $city): array
    {
        $roots = $this->getRootFolders();
        $selected = [];
        $intentId = (string) ($intent['id'] ?? '');
        $cityBrandbook = consultant_city_brandbook_name($city);

        foreach ($roots as $section) {
            $name = (string) ($section['name'] ?? '');
            if ($name === '') {
                continue;
            }

            if ($intentId === 'brandbook') {
                if ($cityBrandbook !== '' && ($name === $cityBrandbook || $name === 'Логотипы городов')) {
                    $selected[$name] = $section;
                    continue;
                }
                if (str_starts_with($name, 'Брендбук ')) {
                    $selected[$name] = $section;
                }
                continue;
            }

            if ($intentId === 'city') {
                if ($name === 'Логотипы городов' || ($cityBrandbook !== '' && $name === $cityBrandbook)) {
                    $selected[$name] = $section;
                    continue;
                }
                if ($cityBrandbook === '' && in_array($name, ['Брендбук Салехард', 'Брендбук Новый Уренгой', 'Брендбук Ноябрьск'], true)) {
                    $selected[$name] = $section;
                }
                continue;
            }

            if (in_array($name, $intent['sectionNames'] ?? [], true)) {
                $selected[$name] = $section;
            }
        }

        if ($intentId === 'brandbook' && $cityBrandbook !== '') {
            $ordered = [];
            foreach ([$cityBrandbook, 'Логотипы городов'] as $name) {
                if (isset($selected[$name])) {
                    $ordered[$name] = $selected[$name];
                    unset($selected[$name]);
                }
            }
            foreach ($selected as $name => $section) {
                $ordered[$name] = $section;
            }
            $selected = $ordered;
        }

        return array_slice(array_values($selected), 0, 4);
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

    private function collectConsultItems(array $queries, array $sections): array
    {
        $items = [];
        $seen = [];
        foreach ($queries as $query) {
            $payload = $this->search((string) $query, false, false);
            foreach ($payload['items'] ?? [] as $item) {
                $id = (string) ($item['id'] ?? '');
                if ($id === '' || isset($seen[$id])) {
                    continue;
                }
                $seen[$id] = true;
                $items[] = $item;
                if (count($items) >= 12) {
                    break 2;
                }
            }
        }

        $filtered = $this->filterConsultItemsBySections($items, $sections);
        return array_slice($filtered, 0, 4);
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

    private function consultResponseTitle(?array $intent, string $city, string $query): string
    {
        $intentId = (string) ($intent['id'] ?? '');
        if ($intentId === 'brandbook' && $city !== '') {
            return 'Брендбук: ' . consultant_city_display_name($city);
        }
        if ($intentId === 'city' && $city !== '') {
            return 'Материалы города: ' . consultant_city_display_name($city);
        }
        if ($intent !== null) {
            return (string) ($intent['summary'] ?? 'Подбор материалов');
        }
        if (trim($query) !== '') {
            return 'Подбор материалов';
        }
        return 'Помощник каталога';
    }

    private function consultResponseMessage(?array $intent, array $sections, array $items, string $city): string
    {
        $firstSection = (string) ($sections[0]['label'] ?? $sections[0]['name'] ?? '');
        $intentId = (string) ($intent['id'] ?? '');

        if ($intentId === 'city' && $city !== '') {
            return 'Нашел городские материалы для ' . consultant_city_display_name($city) . '. Начните с логотипов города или брендбука.';
        }
        if ($intentId === 'brandbook' && $city !== '' && $firstSection !== '') {
            return 'Лучше начать с раздела «' . $firstSection . '». Ниже подобраны брендбук и связанные материалы города.';
        }
        if ($firstSection !== '' && $items !== []) {
            return 'Лучше начать с раздела «' . $firstSection . '». Ниже только реальные разделы и файлы из каталога.';
        }
        if ($firstSection !== '') {
            return 'Начните с раздела «' . $firstSection . '». Если нужно, уточните формат, город или тип файла.';
        }
        if ($items !== []) {
            return 'Нашел несколько реальных материалов по запросу. Можно открыть файл сразу или показать результаты поиска полностью.';
        }
        return 'Сформулируйте запрос чуть точнее: например, «логотип svg», «брендбук Салехард», «шрифт otf» или «сувенирка».';
    }

    public function consult(string $query, string $intentId = ''): array
    {
        $trimmedQuery = trim($query);
        $intent = detect_consultant_intent($trimmedQuery, $intentId);
        $city = detect_consultant_city($trimmedQuery);
        $sections = $this->selectConsultSections($intent, $city);
        $queries = $this->consultSearchQueries($intent, $trimmedQuery, $city);
        $items = $this->collectConsultItems($queries, $sections);

        if ($sections === [] && $items !== []) {
            $sections = $this->deriveConsultSectionsFromItems($items);
        }

        return [
            'query' => $trimmedQuery,
            'intent' => $intent === null ? null : [
                'id' => (string) ($intent['id'] ?? ''),
                'label' => (string) ($intent['label'] ?? ''),
                'summary' => (string) ($intent['summary'] ?? ''),
            ],
            'title' => $this->consultResponseTitle($intent, $city, $trimmedQuery),
            'message' => $this->consultResponseMessage($intent, $sections, $items, $city),
            'sections' => array_map(static fn(array $item): array => present_item($item), $sections),
            'items' => $items,
            'searchQuery' => $trimmedQuery !== '' ? $trimmedQuery : ((string) ($queries[0] ?? '')),
            'suggestedQueries' => $this->consultSuggestedQueries($intent, $trimmedQuery, $queries),
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
