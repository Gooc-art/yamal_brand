import importlib.util
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sqlite3


ROOT = Path(__file__).resolve().parents[1]
REPORT_PATH = ROOT / 'scripts' / 'report_bot_usage.py'
BACKUP_PATH = ROOT / 'scripts' / 'backup_bot_data.py'


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    spec.loader.exec_module(module)
    return module


REPORT = load_module('report_bot_usage', REPORT_PATH)
BACKUP = load_module('backup_bot_data', BACKUP_PATH)


def create_catalog_db(path: Path) -> None:
    conn = sqlite3.connect(path)
    try:
        conn.executescript(
            """
            CREATE TABLE assets (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              relative_path TEXT NOT NULL,
              type TEXT NOT NULL,
              is_active INTEGER NOT NULL DEFAULT 1,
              depth INTEGER NOT NULL DEFAULT 0
            );
            INSERT INTO assets (id, name, relative_path, type, is_active, depth) VALUES
              ('folder1', 'Логотип', 'Логотип', 'folder', 1, 1),
              ('file1', 'Брендбук.pdf', 'Брендбук/Брендбук.pdf', 'file', 1, 2);
            """
        )
        conn.commit()
    finally:
        conn.close()


def create_runtime_db(path: Path) -> None:
    conn = sqlite3.connect(path)
    try:
        conn.executescript(
            """
            CREATE TABLE bot_users (
              user_key TEXT PRIMARY KEY,
              sender_id TEXT NOT NULL DEFAULT '',
              chat_id TEXT NOT NULL DEFAULT '',
              display_name TEXT NOT NULL DEFAULT '',
              first_seen_utc TEXT NOT NULL,
              last_seen_utc TEXT NOT NULL,
              interaction_count INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE search_events (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              query_text TEXT NOT NULL,
              query_norm TEXT NOT NULL,
              result_count INTEGER NOT NULL,
              created_utc TEXT NOT NULL
            );
            CREATE TABLE item_events (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              item_id TEXT NOT NULL,
              event_type TEXT NOT NULL,
              item_name_snapshot TEXT NOT NULL DEFAULT '',
              relative_path_snapshot TEXT NOT NULL DEFAULT '',
              created_utc TEXT NOT NULL
            );
            """
        )
        recent = datetime.now(timezone.utc).replace(microsecond=0)
        old = recent - timedelta(days=20)
        recent_iso = recent.isoformat()
        old_iso = old.isoformat()
        conn.executemany(
            """
            INSERT INTO bot_users (
              user_key, sender_id, chat_id, display_name, first_seen_utc, last_seen_utc, interaction_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                ('user:1', '1', 'chat-1', 'Old User', old_iso, old_iso, 1),
                ('user:2', '2', 'chat-2', 'Recent User', recent_iso, recent_iso, 3),
            ],
        )
        conn.executemany(
            "INSERT INTO search_events (query_text, query_norm, result_count, created_utc) VALUES (?, ?, ?, ?)",
            [
                ('Логотип', 'логотип', 4, recent_iso),
                ('логотип', 'логотип', 2, recent_iso),
                ('сувенирка', 'сувенирка', 0, old_iso),
            ],
        )
        conn.executemany(
            "INSERT INTO item_events (item_id, event_type, item_name_snapshot, relative_path_snapshot, created_utc) VALUES (?, ?, ?, ?, ?)",
            [
                ('file1', 'send_file', 'Брендбук.pdf', 'Брендбук/Брендбук.pdf', recent_iso),
                ('file1', 'send_file', 'Брендбук.pdf', 'Брендбук/Брендбук.pdf', recent_iso),
                ('folder1', 'open_folder', 'Логотип', 'Логотип', old_iso),
            ],
        )
        conn.commit()
    finally:
        conn.close()


def test_collect_usage_summary_groups_searches_and_items(tmp_path: Path):
    catalog_db = tmp_path / 'catalog.db'
    runtime_db = tmp_path / 'runtime.db'
    create_catalog_db(catalog_db)
    create_runtime_db(runtime_db)

    summary = REPORT.collect_usage_summary(runtime_db, catalog_db, top_limit=5, report_days=7)

    assert summary['stats']['total_users'] == 2
    assert summary['stats']['total_interactions'] == 4
    assert summary['stats']['total_searches'] == 3
    assert summary['stats']['empty_searches'] == 1
    assert summary['users']['total_users'] == 2
    assert summary['users']['total_interactions'] == 4
    assert summary['users']['new_users_in_period'] == 1
    assert summary['users']['active_users_in_period'] == 1
    assert summary['top_searches'][0]['query_norm'] == 'логотип'
    assert summary['top_searches'][0]['uses'] == 2
    assert summary['top_empty_searches'][0]['query_norm'] == 'сувенирка'
    assert summary['top_items'][0]['item_id'] == 'file1'
    assert summary['top_items'][0]['name'] == 'Брендбук.pdf'
    assert summary['top_items'][0]['file_sends'] == 2
    assert summary['period']['top_searches'][0]['query_norm'] == 'логотип'
    assert summary['period']['top_items'][0]['item_id'] == 'file1'
    assert summary['period']['top_searches'][0]['uses'] == 2


def test_create_backup_snapshot_exports_csv_and_json(tmp_path: Path):
    catalog_db = tmp_path / 'catalog.db'
    runtime_db = tmp_path / 'runtime.db'
    backups_dir = tmp_path / 'backups'
    create_catalog_db(catalog_db)
    create_runtime_db(runtime_db)

    snapshot_dir = BACKUP.create_backup_snapshot(
        catalog_db,
        runtime_db,
        backups_dir,
        top_limit=5,
        now=datetime(2026, 3, 7, tzinfo=timezone.utc),
    )

    assert snapshot_dir.exists()
    assert (snapshot_dir / 'catalog.db').exists()
    assert (snapshot_dir / 'runtime.db').exists()
    assert (snapshot_dir / 'assets.csv').exists()
    assert (snapshot_dir / 'top_searches.csv').exists()
    assert (snapshot_dir / 'top_empty_searches.csv').exists()
    assert (snapshot_dir / 'top_items.csv').exists()

    summary = json.loads((snapshot_dir / 'summary.json').read_text(encoding='utf-8'))
    assert summary['backup']['copied_catalog_db'] is True
    assert summary['backup']['copied_runtime_db'] is True
    assert summary['backup']['assets_rows'] == 2
    assert summary['users']['total_users'] == 2
