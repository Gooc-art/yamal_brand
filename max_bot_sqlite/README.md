# YAMAL MAX Bot (SQLite)

Бот работает без SeaTable, только на локальной SQLite базе, собранной из папки с файлами.

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

- `/start` и `/menu`: inline-навигация по папкам
- `/search <запрос>` или просто текст: умный поиск
- по кнопке файла: отправка файла напрямую

## Поиск

Поиск использует:
- нормализацию текста (`ё/е`, регистр, спецсимволы)
- рус/лат транслитерацию
- синонимы (`logo/логотип`, `brandbook/брендбук`, `font/шрифт`)
- fuzzy ранжирование для неточных запросов
