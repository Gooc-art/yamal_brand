#!/usr/bin/env python3
"""Create backup snapshot of bot databases and export analytics CSV/JSON."""

from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import sqlite3
import sys
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from report_bot_usage import collect_usage_summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Backup MAX bot data and exports")
    parser.add_argument(
        "--catalog-db",
        type=Path,
        default=Path("./max_catalog.db"),
        help="Catalog SQLite DB path (default: ./max_catalog.db)",
    )
    parser.add_argument(
        "--runtime-db",
        type=Path,
        default=Path("./max_bot_runtime.db"),
        help="Runtime SQLite DB path (default: ./max_bot_runtime.db)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("./backups"),
        help="Output directory for timestamped backups (default: ./backups)",
    )
    parser.add_argument("--top-limit", type=int, default=20, help="Rows to export in analytics CSVs")
    return parser.parse_args()


def utc_stamp(now: datetime | None = None) -> str:
    current = now or datetime.now(timezone.utc)
    return current.strftime("%Y%m%d-%H%M%S")


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def copy_if_exists(source: Path, target: Path) -> bool:
    if not source.exists():
        return False
    shutil.copy2(source, target)
    return True


def open_db(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if rows:
        fieldnames = list(rows[0].keys())
    else:
        fieldnames = []
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        if fieldnames:
            writer.writeheader()
            writer.writerows(rows)


def export_assets_csv(catalog_db: Path, output_csv: Path) -> int:
    if not catalog_db.exists():
        output_csv.write_text("", encoding="utf-8")
        return 0

    conn = open_db(catalog_db)
    try:
        rows = conn.execute(
            "SELECT * FROM assets ORDER BY depth ASC, type ASC, relative_path ASC"
        ).fetchall()
        dict_rows = [dict(row) for row in rows]
        write_csv(output_csv, dict_rows)
        return len(dict_rows)
    finally:
        conn.close()


def create_backup_snapshot(
    catalog_db: Path,
    runtime_db: Path,
    output_dir: Path,
    *,
    top_limit: int = 20,
    now: datetime | None = None,
) -> Path:
    snapshot_dir = ensure_dir(output_dir.resolve()) / f"snapshot-{utc_stamp(now)}"
    ensure_dir(snapshot_dir)

    copied_catalog = copy_if_exists(catalog_db.resolve(), snapshot_dir / catalog_db.name)
    copied_runtime = copy_if_exists(runtime_db.resolve(), snapshot_dir / runtime_db.name)

    assets_count = export_assets_csv(catalog_db.resolve(), snapshot_dir / "assets.csv")
    summary = collect_usage_summary(runtime_db.resolve(), catalog_db.resolve(), top_limit=top_limit)
    summary["backup"] = {
        "snapshot_dir": str(snapshot_dir),
        "copied_catalog_db": copied_catalog,
        "copied_runtime_db": copied_runtime,
        "assets_rows": assets_count,
    }

    (snapshot_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    write_csv(snapshot_dir / "top_searches.csv", summary["top_searches"])
    write_csv(snapshot_dir / "top_empty_searches.csv", summary["top_empty_searches"])
    write_csv(snapshot_dir / "top_items.csv", summary["top_items"])
    return snapshot_dir


def main() -> None:
    args = parse_args()
    snapshot_dir = create_backup_snapshot(
        args.catalog_db,
        args.runtime_db,
        args.output_dir,
        top_limit=max(1, args.top_limit),
    )
    print(snapshot_dir)


if __name__ == "__main__":
    main()
