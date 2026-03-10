# YAMAL Catalog Site PHP

PHP + SQLite версия сайта для shared hosting, в первую очередь под REG.RU.

Что умеет:
- разделы и подпапки каталога
- поиск по SQLite базе
- `Избранное` по runtime-статистике
- карточка файла
- прямое скачивание
- обновленный публичный интерфейс: hero-блок, быстрые запросы, выразительные карточки и sticky-панели
- встроенные бренд-ассеты из каталога `Брендбук ЯМАЛ Мастер бренд`: основной логотип и фирменный знак в SVG
- понятный экран даже если база и файлы еще не загружены
- автосборка `max_catalog.db` из `data/files/`, если база еще не создана

## Структура

- `index.php` - главная страница
- `api.php` - JSON API для фронтенда
- `download.php` - скачивание файла по `id`
- `src/site_lib.php` - вся backend-логика
- `assets/` - фронтенд
- `data/` - место для баз и файлов каталога

## Ожидаемые файлы данных

По умолчанию сайт использует:
- `data/max_catalog.db`
- `data/max_bot_runtime.db`
- `data/files/`

Если `data/max_catalog.db` еще нет, сайт попробует собрать ее сам из `data/files/`.
Если в `data/files/` лежит одна верхняя папка `Макеты1`, она будет автоматически использована как корень каталога.
Если файлов еще нет, сайт все равно откроется и покажет статус подготовки.

## Локальный запуск

```bash
cd /root/projects/yamal_brand/yamal_catalog_site_php
cp .env.example .env
./tools/serve_local.sh
```

Потом открой:

```bash
http://127.0.0.1:8080
```

## Конфиг

Заполняется через `.env`:

- `SITE_TITLE`
- `CATALOG_DB_PATH`
- `RUNTIME_DB_PATH`
- `CATALOG_ROOT_PATH`
- `PAGE_SIZE`
- `FAVORITES_LIMIT`
- `PUBLIC_BASE`

## Тесты

```bash
php /root/projects/yamal_brand/yamal_catalog_site_php/test/site_php_test.php
```

Если локальный `php` собран без `pdo_sqlite`, smoke test завершится со статусом `skipped`, а полноценная проверка SQLite-логики должна выполняться на хостинге или машине с установленным драйвером.

## Деплой на REG.RU

Готовый скрипт:
- [deploy_regru_php_site.sh](/root/projects/yamal_brand/scripts/deploy_regru_php_site.sh)
- [import_regru_archive.sh](/root/projects/yamal_brand/scripts/import_regru_archive.sh)
- [deploy_regru_php_site.yml](/root/projects/yamal_brand/.github/workflows/deploy_regru_php_site.yml)

Пример:

```bash
SSH_PASSWORD='***' \
REMOTE_HOST=server215.hosting.reg.ru \
REMOTE_USER=u3443089 \
REMOTE_DIR=/var/www/u3443089/data/www/xn--80abjd6aefw2l.xn--p1ai \
SSH_PORT=22 \
/root/projects/yamal_brand/scripts/deploy_regru_php_site.sh
```

Что делает скрипт:
- создает backup текущих `index.html`, `index.php`, `api.php`, `download.php`, `.env`, `assets/`, `src/`
- выкладывает PHP-сайт в веб-корень домена
- не трогает `data/` и `_backup/`
- умеет работать через парольный `SSH`, если передать `SSH_PASSWORD`
- создает рабочий `.env` с путями под текущий веб-корень, если файла еще нет

Можно запускать и без локального SSH-доступа через GitHub Actions:
- открой `Deploy REG.RU PHP Catalog Site`
- workflow использует уже сохраненные `REGRU_HOST`, `REGRU_USER`, `REGRU_TARGET_DIR`, `REGRU_PASSWORD`
- выкладывает только код PHP-сайта, не трогая `data/` с каталогом

## Импорт каталога по прямой ссылке

Есть отдельный GitHub Actions workflow:
- [import_regru_archive.yml](/root/projects/yamal_brand/.github/workflows/import_regru_archive.yml)

Он нужен для сценария, когда сервер недоступен по SSH, но есть прямая ссылка на архив `zip/tar.gz`.

Что делает workflow:
- скачивает архив по `archive_url`
- делает backup текущих `data/files` и баз на хостинге
- заливает содержимое архива в `data/files/`
- удаляет старый `max_catalog.db`
- прогревает сайт, чтобы каталог пересобрался автоматически

## Что нужно положить на хостинг после выкладки

Минимально достаточно:
- `data/files/` с реальными файлами каталога

Дальше сайт сам:
- создаст `data/max_catalog.db`, если его нет
- создаст `data/max_bot_runtime.db`, если его нет

Можно загружать:
- либо сразу содержимое `Макеты1` в `data/files/`
- либо целиком папку `Макеты1` в `data/files/Макеты1`

Оба варианта поддерживаются.

Если позже обновишь файлы и захочешь пересобрать каталог заново, достаточно удалить `data/max_catalog.db` и открыть сайт еще раз.
