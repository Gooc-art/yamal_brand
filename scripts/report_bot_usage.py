#!/usr/bin/env python3
"""Summarize MAX bot runtime usage: top searches, misses, popular items."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sqlite3
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Show MAX bot usage analytics")
    parser.add_argument(
        "--runtime-db",
        type=Path,
        default=Path("./max_bot_runtime.db"),
        help="Runtime SQLite DB path (default: ./max_bot_runtime.db)",
    )
    parser.add_argument(
        "--catalog-db",
        type=Path,
        default=Path("./max_catalog.db"),
        help="Catalog SQLite DB path (default: ./max_catalog.db)",
    )
    parser.add_argument("--top-limit", type=int, default=10, help="Rows per section")
    parser.add_argument("--json", action="store_true", help="Print JSON instead of text")
    return parser.parse_args()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def open_db(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def empty_summary(runtime_db: Path, catalog_db: Path, top_limit: int) -> dict[str, Any]:
    return {
        "generated_utc": utc_now(),
        "runtime_db": str(runtime_db.resolve()),
        "catalog_db": str(catalog_db.resolve()),
        "top_limit": top_limit,
        "stats": {
            "total_searches": 0,
            "empty_searches": 0,
            "total_item_events": 0,
        },
        "top_searches": [],
        "top_empty_searches": [],
        "top_items": [],
    }


def load_catalog_map(catalog_db: Path) -> dict[str, dict[str, Any]]:
    if not catalog_db.exists():
        return {}

    conn = open_db(catalog_db)
    try:
        rows = conn.execute(
            "SELECT id, name, relative_path, type FROM assets WHERE is_active = 1"
        ).fetchall()
        return {row["id"]: dict(row) for row in rows}
    finally:
        conn.close()


def collect_usage_summary(
    runtime_db: Path,
    catalog_db: Path,
    *,
    top_limit: int = 10,
) -> dict[str, Any]:
    summary = empty_summary(runtime_db, catalog_db, top_limit)
    if not runtime_db.exists():
        return summary

    catalog_map = load_catalog_map(catalog_db)
    conn = open_db(runtime_db)
    try:
        stats = conn.execute(
            """
            SELECT
              (SELECT COUNT(*) FROM search_events) AS total_searches,
              (SELECT COUNT(*) FROM search_events WHERE result_count = 0) AS empty_searches,
              (SELECT COUNT(*) FROM item_events) AS total_item_events
            """
        ).fetchone()
        summary["stats"] = {
            "total_searches": int(stats["total_searches"] or 0),
            "empty_searches": int(stats["empty_searches"] or 0),
            "total_item_events": int(stats["total_item_events"] or 0),
        }

        top_searches = conn.execute(
            """
            SELECT query_norm,
                   MIN(query_text) AS sample_query,
                   COUNT(*) AS uses,
                   SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS empty_uses,
                   MAX(created_utc) AS last_used_utc
            FROM search_events
            WHERE query_norm <> ''
            GROUP BY query_norm
            ORDER BY uses DESC, last_used_utc DESC, query_norm ASC
            LIMIT ?
            """,
            (top_limit,),
        ).fetchall()
        summary["top_searches"] = [dict(row) for row in top_searches]

        top_empty = conn.execute(
            """
            SELECT query_norm,
                   MIN(query_text) AS sample_query,
                   COUNT(*) AS uses,
                   MAX(created_utc) AS last_used_utc
            FROM search_events
            WHERE query_norm <> '' AND result_count = 0
            GROUP BY query_norm
            ORDER BY uses DESC, last_used_utc DESC, query_norm ASC
            LIMIT ?
            """,
            (top_limit,),
        ).fetchall()
        summary["top_empty_searches"] = [dict(row) for row in top_empty]

        top_items = conn.execute(
            """
            SELECT item_id,
                   COUNT(*) AS uses,
                   SUM(CASE WHEN event_type = 'open_folder' THEN 1 ELSE 0 END) AS folder_opens,
                   SUM(CASE WHEN event_type = 'send_file' THEN 1 ELSE 0 END) AS file_sends,
                   MAX(item_name_snapshot) AS item_name_snapshot,
                   MAX(relative_path_snapshot) AS relative_path_snapshot,
                   MAX(created_utc) AS last_used_utc
            FROM item_events
            WHERE item_id <> ''
            GROUP BY item_id
            ORDER BY uses DESC, last_used_utc DESC, item_id ASC
            LIMIT ?
            """,
            (top_limit,),
        ).fetchall()

        formatted_items: list[dict[str, Any]] = []
        for row in top_items:
            item = dict(row)
            catalog_item = catalog_map.get(item["item_id"], {})
            formatted_items.append(
                {
                    **item,
                    "name": catalog_item.get("name") or item.get("item_name_snapshot") or "",
                    "relative_path": catalog_item.get("relative_path")
                    or item.get("relative_path_snapshot")
                    or "",
                    "type": catalog_item.get("type") or "",
                }
            )
        summary["top_items"] = formatted_items
        return summary
    finally:
        conn.close()


def render_text(summary: dict[str, Any]) -> str:
    lines = [
        f"Сформировано: {summary['generated_utc']}",
        f"Runtime DB: {summary['runtime_db']}",
        f"Catalog DB: {summary['catalog_db']}",
        "",
        "Счетчики:",
        f"- Поисков: {summary['stats']['total_searches']}",
        f"- Пустых поисков: {summary['stats']['empty_searches']}",
        f"- Событий по элементам: {summary['stats']['total_item_events']}",
        "",
        "Топ поисков:",
    ]

    if summary["top_searches"]:
        for row in summary["top_searches"]:
            lines.append(
                f"- {row['sample_query']} | uses={row['uses']} | empty={row['empty_uses']} | last={row['last_used_utc']}"
            )
    else:
        lines.append("- пока пусто")

    lines.append("")
    lines.append("Пустые поиски:")
    if summary["top_empty_searches"]:
        for row in summary["top_empty_searches"]:
            lines.append(f"- {row['sample_query']} | uses={row['uses']} | last={row['last_used_utc']}")
    else:
        lines.append("- пока пусто")

    lines.append("")
    lines.append("Популярные элементы:")
    if summary["top_items"]:
        for row in summary["top_items"]:
            name = row.get("name") or row.get("item_name_snapshot") or row["item_id"]
            lines.append(
                f"- {name} | uses={row['uses']} | opens={row['folder_opens']} | files={row['file_sends']} | path={row.get('relative_path', '')}"
            )
    else:
        lines.append("- пока пусто")

    return "\n".join(lines)


def main() -> None:
    args = parse_args()
    summary = collect_usage_summary(
        args.runtime_db.resolve(),
        args.catalog_db.resolve(),
        top_limit=max(1, args.top_limit),
    )
    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        print(render_text(summary))


if __name__ == "__main__":
    main()
