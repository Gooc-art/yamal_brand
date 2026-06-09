# MAX bot + SQLite (without SeaTable)

This setup stores the file catalog in local SQLite and works well for:
- inline folder navigation
- text search by name/path/extension
- direct file lookup by `id`
- runtime analytics and popular-item stats in a separate writable SQLite DB
- unique bot users with first-seen/last-seen timestamps and total interaction counts for admin reports
- parallel Node.js web interface in `/yamal_catalog_site`
- parallel PHP + SQLite web interface for shared hosting in `/yamal_catalog_site_php`
- companion MAX bot can present this base as the official catalog of the Yamal regional brand for public-sector teams and businesses

## 1) Build DB from your folder tree

```bash
python3 /home/sergey/yamal_brand/scripts/build_sqlite_catalog.py \
  --source "/home/sergey/yamal_brand/input/Макеты1" \
  --db "/home/sergey/yamal_brand/max_catalog.db"
```

## 2) Quick checks

```bash
python3 /home/sergey/yamal_brand/scripts/query_sqlite_catalog.py \
  --db "/home/sergey/yamal_brand/max_catalog.db" stats
```

List root buttons:

```bash
python3 /home/sergey/yamal_brand/scripts/query_sqlite_catalog.py \
  --db "/home/sergey/yamal_brand/max_catalog.db" children
```

Search files:

```bash
python3 /home/sergey/yamal_brand/scripts/query_sqlite_catalog.py \
  --db "/home/sergey/yamal_brand/max_catalog.db" search --query "логотип"
```

Search understands broader user wording too:
- `логотип`, `знак`, `эмблема`
- `брендбук`, `гайд`, `гайдлайн`
- `шрифт`, `гарнитура`
- `сувенир`, `мерч`, `сувенирка`
- `наклейка`, `стикер`
- `полиграфия`, `навигация`, `баннер`
- `диджитал`, `презентация`, `соцсети`

## 3) Runtime analytics

Report current usage summary:

```bash
python3 /home/sergey/yamal_brand/scripts/report_bot_usage.py \
  --catalog-db "/home/sergey/yamal_brand/max_catalog.db" \
  --runtime-db "/home/sergey/yamal_brand/max_bot_runtime.db" \
  --days 7
```

The report now includes:
- total unique users for all time
- new users for the last 7 days
- active users for the last 7 days
- top searches and top opened sections/files for the selected rolling period

Create a timestamped backup snapshot with CSV/JSON exports:

```bash
python3 /home/sergey/yamal_brand/scripts/backup_bot_data.py \
  --catalog-db "/home/sergey/yamal_brand/max_catalog.db" \
  --runtime-db "/home/sergey/yamal_brand/max_bot_runtime.db" \
  --output-dir "/home/sergey/yamal_brand/backups"
```

Snapshot contents:
- `assets.csv`
- `top_searches.csv`
- `top_empty_searches.csv`
- `top_items.csv`
- `summary.json`

## 4) Integration idea for MAX bot

- `/start` -> run `children --parent-id <root_id>`
- folder button -> run `children --parent-id <folder_id>`
- text search -> run `search --query "<text>"`
- file button -> run `get --id <file_id>` and send file URL/path
- admin report -> restrict `/admin` or `/stats` to `ADMIN_USER_IDS` and read analytics from `max_bot_runtime.db`

`max_bot_sqlite` validates startup paths before opening SQLite: `CATALOG_DB_PATH`
must point to an existing catalog DB, the parent directory of `RUNTIME_DB_PATH`
must exist, and `CATALOG_ROOT_PATH` must point to the real file tree. Relative
paths in `.env` are resolved from `max_bot_sqlite`, matching `.env.example`.

Root id is constant and printed by `build_sqlite_catalog.py`.
