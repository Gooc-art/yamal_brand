# MAX bot + SQLite (without SeaTable)

This setup stores the file catalog in local SQLite and works well for:
- inline folder navigation
- text search by name/path/extension
- direct file lookup by `id`

## 1) Build DB from your folder tree

```bash
python3 /root/projects/yamal_brand/scripts/build_sqlite_catalog.py \
  --source "/root/projects/yamal_brand/input/Макеты1" \
  --db "/root/projects/yamal_brand/max_catalog.db"
```

## 2) Quick checks

```bash
python3 /root/projects/yamal_brand/scripts/query_sqlite_catalog.py \
  --db "/root/projects/yamal_brand/max_catalog.db" stats
```

List root buttons:

```bash
python3 /root/projects/yamal_brand/scripts/query_sqlite_catalog.py \
  --db "/root/projects/yamal_brand/max_catalog.db" children
```

Search files:

```bash
python3 /root/projects/yamal_brand/scripts/query_sqlite_catalog.py \
  --db "/root/projects/yamal_brand/max_catalog.db" search --query "логотип"
```

## 3) Integration idea for MAX bot

- `/start` -> run `children --parent-id <root_id>`
- folder button -> run `children --parent-id <folder_id>`
- text search -> run `search --query "<text>"`
- file button -> run `get --id <file_id>` and send file URL/path

Root id is constant and printed by `build_sqlite_catalog.py`.
