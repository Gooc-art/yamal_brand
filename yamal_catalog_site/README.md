# YAMAL Catalog Site

Отдельный сайт поверх тех же баз и файлов, что использует MAX-бот.

Что умеет сайт:
- адаптивный каталог разделов и подпапок
- полнотекстовый поиск по той же SQLite базе
- блок `Избранное` на основе runtime-статистики
- карточка файла с путем, размером и скачиванием
- общая аналитика поиска через `max_bot_runtime.db`

## Быстрый запуск

```bash
cd /home/sergey/yamal_brand/yamal_catalog_site
cp .env.example .env
node src/server.js
```

По умолчанию сайт поднимается на:

```bash
http://0.0.0.0:3200
```

## Переменные окружения

- `SITE_HOST`
- `SITE_PORT`
- `SITE_TITLE`
- `SITE_CATALOG_DB_PATH`
- `SITE_RUNTIME_DB_PATH`
- `SITE_CATALOG_ROOT_PATH`
- `SITE_PAGE_SIZE`
- `SITE_FAVORITES_LIMIT`

Пример значений лежит в `.env.example`.

## Как сайт использует текущие данные

- `../max_catalog.db` - каталог файлов и папок
- `../max_bot_runtime.db` - статистика поиска и популярности
- `../input/Макеты1` - реальные файлы для скачивания

## API

- `GET /health`
- `GET /api/bootstrap`
- `GET /api/folder?id=<folder_id>&page=<n>`
- `GET /api/search?q=<query>`
- `GET /api/file?id=<file_id>`
- `GET /api/favorites`
- `GET /download/<file_id>`

## Тесты

```bash
cd /home/sergey/yamal_brand/yamal_catalog_site
npm test
```

## Systemd

Готовый unit:
- `systemd/yamal_catalog_site.service`

Установка:

```bash
cp /home/sergey/yamal_brand/yamal_catalog_site/systemd/yamal_catalog_site.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now yamal_catalog_site.service
systemctl status yamal_catalog_site.service --no-pager
```

## Reverse proxy

После поднятия сервиса сайт удобно отдавать через `nginx` или `caddy` на домене.
Для старта достаточно проксировать домен на `127.0.0.1:3200`.
