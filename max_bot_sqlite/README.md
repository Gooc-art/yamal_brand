# YAMAL MAX Bot (SQLite)

Бот работает без SeaTable, только на локальной SQLite базе, собранной из папки с файлами.

Что уже настроено в боте:
- компактное главное меню по 5 разделам
- быстрые inline-кнопки для популярных запросов
- текстовый поиск с учетом опечаток, синонимов и транслитерации
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
Если на сервере нет passwordless `sudo`, deploy-скрипт запустит бота от пользователя `sergey` и будет хранить логи в `/home/sergey/yamal_brand/logs/max_bot.log`.

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

- `/start` и `/menu`: компактное меню по разделам бренда
- `/search <запрос>` или просто текст: умный поиск по файлам и папкам
- быстрые кнопки: `Логотип`, `Брендбук`, `Шрифт`, `Сувенир`
- по кнопке папки: открытие раздела
- по кнопке файла: отправка файла напрямую

## Поиск

Поиск использует:
- нормализацию текста (`ё/е`, регистр, спецсимволы)
- рус/лат транслитерацию
- синонимы (`logo/логотип`, `brandbook/брендбук`, `font/шрифт`)
- fuzzy ранжирование для неточных запросов

## Тесты

```bash
cd /home/sergey/yamal_brand/max_bot_sqlite
npm test
```
