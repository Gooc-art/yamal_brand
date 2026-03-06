# YAMAL MAX Bot (SQLite)

Бот работает без SeaTable, только на локальной SQLite базе, собранной из папки с файлами.

Что уже настроено в боте:
- главное меню со всеми верхними папками каталога
- быстрые inline-кнопки для популярных запросов
- текстовый поиск с учетом опечаток, синонимов, бытовых формулировок и транслитерации
- поиск как по файлам, так и по папкам
- отправка файла прямо в чат

## 1) Собрать базу из структуры папок

```bash
python3 /home/sergey/yamal_brand/scripts/build_sqlite_catalog.py \
  --source "/home/sergey/yamal_brand/input/Макеты1" \
  --db "/home/sergey/yamal_brand/max_catalog.db"
```

## 2) Установить зависимости

```bash
cd /home/sergey/yamal_brand/max_bot_sqlite
cp .env.example .env
npm install
```

Для автодеплоя отдельная системная установка Node.js не обязательна: deploy-скрипт сам скачает локальный runtime в `/home/sergey/yamal_brand/.runtime/node`.
Основной режим запуска: `systemd`-сервис `max_yamal_bot.service`.
Deploy-скрипт теперь требует passwordless `sudo` для `cp`, `systemctl` и `journalctl`, чтобы бот всегда запускался как нормальный сервис, а не как фоновый user-process.

Заполни в `.env`:
- `MAX_BOT_TOKEN`
- при необходимости `ALLOWED_USER_IDS`

## 3) Запуск

```bash
cd /home/sergey/yamal_brand/max_bot_sqlite
node src/bot.js
```

## 4) Systemd (автозапуск)

```bash
cp /home/sergey/yamal_brand/max_bot_sqlite/systemd/max_yamal_bot.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now max_yamal_bot.service
systemctl status max_yamal_bot.service --no-pager
```

## Что умеет бот

- `/start` и `/menu`: полное меню по верхним папкам каталога
- нажатие системной кнопки Start в MAX тоже открывает меню
- `/search <запрос>` или просто текст: умный поиск по файлам и папкам
- быстрые кнопки: `Логотип`, `Брендбук`, `Шрифт`, `Сувенир`
- по кнопке папки: открытие раздела
- по кнопке файла: отправка файла напрямую

## Поиск

Поиск использует:
- нормализацию текста (`ё/е`, регистр, спецсимволы)
- рус/лат транслитерацию
- расширенные синонимы и бытовые названия (`logo/логотип/знак`, `brandbook/брендбук/гайд`, `font/шрифт/гарнитура`, `сувенир/мерч/сувенирка`)
- fuzzy ранжирование для неточных запросов

## Тесты

```bash
cd /home/sergey/yamal_brand/max_bot_sqlite
npm test
```
