# MAX bot + SQLite (without SeaTable)

This setup stores the file catalog in local SQLite and works well for:
- inline folder navigation
- text search by name/path/extension
- direct file lookup by `id`
- runtime analytics and popular-item stats in a separate writable SQLite DB

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
  --runtime-db "/home/sergey/yamal_brand/max_bot_runtime.db"
```

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

Root id is constant and printed by `build_sqlite_catalog.py`.
