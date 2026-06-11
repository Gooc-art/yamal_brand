#!/usr/bin/env python3
"""Summarize MAX bot runtime usage: users, top searches, misses, popular items."""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
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
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Rolling period in days for weekly report sections (default: 7)",
    )
    parser.add_argument("--json", action="store_true", help="Print JSON instead of text")
    return parser.parse_args()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def period_since_utc(days: int) -> str | None:
    if days <= 0:
        return None
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


def open_db(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        (table_name,),
    ).fetchone()
    return row is not None


def empty_summary(
    runtime_db: Path,
    catalog_db: Path,
    top_limit: int,
    report_days: int,
) -> dict[str, Any]:
    since_utc = period_since_utc(report_days)
    return {
        "generated_utc": utc_now(),
        "runtime_db": str(runtime_db.resolve()),
        "catalog_db": str(catalog_db.resolve()),
        "top_limit": top_limit,
        "report_days": report_days,
        "stats": {
            "total_users": 0,
            "total_interactions": 0,
            "total_searches": 0,
            "empty_searches": 0,
            "total_item_events": 0,
            "total_file_sends": 0,
        },
        "users": {
            "total_users": 0,
            "total_interactions": 0,
            "new_users_in_period": 0,
            "active_users_in_period": 0,
            "period_days": report_days,
            "since_utc": since_utc,
        },
        "top_searches": [],
        "top_empty_searches": [],
        "top_items": [],
        "period": {
            "days": report_days,
            "since_utc": since_utc,
            "top_searches": [],
            "top_empty_searches": [],
            "top_items": [],
        },
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


def fetch_top_searches(
    conn: sqlite3.Connection,
    top_limit: int,
    since_utc: str | None = None,
) -> list[dict[str, Any]]:
    where = ["query_norm <> ''"]
    params: list[Any] = []
    if since_utc:
        where.append("created_utc >= ?")
        params.append(since_utc)
    params.append(top_limit)
    rows = conn.execute(
        f"""
        SELECT query_norm,
               MIN(query_text) AS sample_query,
               COUNT(*) AS uses,
               SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS empty_uses,
               MAX(created_utc) AS last_used_utc
        FROM search_events
        WHERE {' AND '.join(where)}
        GROUP BY query_norm
        ORDER BY uses DESC, last_used_utc DESC, query_norm ASC
        LIMIT ?
        """,
        params,
    ).fetchall()
    return [dict(row) for row in rows]


def fetch_top_empty_searches(
    conn: sqlite3.Connection,
    top_limit: int,
    since_utc: str | None = None,
) -> list[dict[str, Any]]:
    where = ["query_norm <> ''", "result_count = 0"]
    params: list[Any] = []
    if since_utc:
        where.append("created_utc >= ?")
        params.append(since_utc)
    params.append(top_limit)
    rows = conn.execute(
        f"""
        SELECT query_norm,
               MIN(query_text) AS sample_query,
               COUNT(*) AS uses,
               MAX(created_utc) AS last_used_utc
        FROM search_events
        WHERE {' AND '.join(where)}
        GROUP BY query_norm
        ORDER BY uses DESC, last_used_utc DESC, query_norm ASC
        LIMIT ?
        """,
        params,
    ).fetchall()
    return [dict(row) for row in rows]


def fetch_top_items(
    conn: sqlite3.Connection,
    catalog_map: dict[str, dict[str, Any]],
    top_limit: int,
    since_utc: str | None = None,
) -> list[dict[str, Any]]:
    where = ["item_id <> ''"]
    params: list[Any] = []
    if since_utc:
        where.append("created_utc >= ?")
        params.append(since_utc)
    params.append(top_limit)
    rows = conn.execute(
        f"""
        SELECT item_id,
               COUNT(*) AS uses,
               SUM(CASE WHEN event_type = 'open_folder' THEN 1 ELSE 0 END) AS folder_opens,
               SUM(CASE WHEN event_type = 'send_file' THEN 1 ELSE 0 END) AS file_sends,
               MAX(item_name_snapshot) AS item_name_snapshot,
               MAX(relative_path_snapshot) AS relative_path_snapshot,
               MAX(created_utc) AS last_used_utc
        FROM item_events
        WHERE {' AND '.join(where)}
        GROUP BY item_id
        ORDER BY uses DESC, last_used_utc DESC, item_id ASC
        LIMIT ?
        """,
        params,
    ).fetchall()

    items: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        catalog_item = catalog_map.get(item["item_id"], {})
        items.append(
            {
                **item,
                "name": catalog_item.get("name") or item.get("item_name_snapshot") or "",
                "relative_path": catalog_item.get("relative_path")
                or item.get("relative_path_snapshot")
                or "",
                "type": catalog_item.get("type") or "",
            }
        )
    return items


def collect_usage_summary(
    runtime_db: Path,
    catalog_db: Path,
    *,
    top_limit: int = 10,
    report_days: int = 7,
) -> dict[str, Any]:
    summary = empty_summary(runtime_db, catalog_db, top_limit, report_days)
    if not runtime_db.exists():
        return summary

    catalog_map = load_catalog_map(catalog_db)
    conn = open_db(runtime_db)
    since_utc = period_since_utc(report_days)
    try:
        stats = conn.execute(
            """
            SELECT
              (SELECT COUNT(*) FROM search_events) AS total_searches,
              (SELECT COUNT(*) FROM search_events WHERE result_count = 0) AS empty_searches,
              (SELECT COUNT(*) FROM item_events) AS total_item_events,
              (SELECT COUNT(*) FROM item_events WHERE event_type = 'send_file') AS total_file_sends
            """
        ).fetchone()
        summary["stats"] = {
            "total_users": 0,
            "total_interactions": 0,
            "total_searches": int(stats["total_searches"] or 0),
            "empty_searches": int(stats["empty_searches"] or 0),
            "total_item_events": int(stats["total_item_events"] or 0),
            "total_file_sends": int(stats["total_file_sends"] or 0),
        }

        if table_exists(conn, "bot_users"):
            user_stats = conn.execute(
                """
                SELECT
                  COUNT(*) AS total_users,
                  COALESCE(SUM(interaction_count), 0) AS total_interactions,
                  SUM(CASE WHEN first_seen_utc >= ? THEN 1 ELSE 0 END) AS new_users_in_period,
                  SUM(CASE WHEN last_seen_utc >= ? THEN 1 ELSE 0 END) AS active_users_in_period
                FROM bot_users
                """,
                (since_utc, since_utc),
            ).fetchone()
            summary["stats"]["total_users"] = int(user_stats["total_users"] or 0)
            summary["stats"]["total_interactions"] = int(user_stats["total_interactions"] or 0)
            summary["users"] = {
                "total_users": int(user_stats["total_users"] or 0),
                "total_interactions": int(user_stats["total_interactions"] or 0),
                "new_users_in_period": int(user_stats["new_users_in_period"] or 0),
                "active_users_in_period": int(user_stats["active_users_in_period"] or 0),
                "period_days": report_days,
                "since_utc": since_utc,
            }

        summary["top_searches"] = fetch_top_searches(conn, top_limit)
        summary["top_empty_searches"] = fetch_top_empty_searches(conn, top_limit)
        summary["top_items"] = fetch_top_items(conn, catalog_map, top_limit)
        summary["period"] = {
            "days": report_days,
            "since_utc": since_utc,
            "top_searches": fetch_top_searches(conn, top_limit, since_utc),
            "top_empty_searches": fetch_top_empty_searches(conn, top_limit, since_utc),
            "top_items": fetch_top_items(conn, catalog_map, top_limit, since_utc),
        }
        return summary
    finally:
        conn.close()


def render_text(summary: dict[str, Any]) -> str:
    period_days = summary["period"]["days"]
    lines = [
        f"Сформировано: {summary['generated_utc']}",
        f"Runtime DB: {summary['runtime_db']}",
        f"Catalog DB: {summary['catalog_db']}",
        "",
        "Счетчики:",
        f"- Пользователей всего: {summary['users']['total_users']}",
        f"- Взаимодействий всего: {summary['users']['total_interactions']}",
        f"- Новых за последние {period_days} дней: {summary['users']['new_users_in_period']}",
        f"- Активных за последние {period_days} дней: {summary['users']['active_users_in_period']}",
        f"- Поисков: {summary['stats']['total_searches']}",
        f"- Пустых поисков: {summary['stats']['empty_searches']}",
        f"- Событий по элементам: {summary['stats']['total_item_events']}",
        f"- Скачиваний файлов: {summary['stats']['total_file_sends']}",
        "",
        f"Что чаще используют за последние {period_days} дней:",
        "Поиски:",
    ]

    if summary["period"]["top_searches"]:
        for row in summary["period"]["top_searches"]:
            lines.append(
                f"- {row['sample_query']} | uses={row['uses']} | empty={row['empty_uses']} | last={row['last_used_utc']}"
            )
    else:
        lines.append("- пока пусто")

    lines.append("")
    lines.append("Разделы и файлы:")
    if summary["period"]["top_items"]:
        for row in summary["period"]["top_items"]:
            name = row.get("name") or row.get("item_name_snapshot") or row["item_id"]
            lines.append(
                f"- {name} | uses={row['uses']} | opens={row['folder_opens']} | files={row['file_sends']} | path={row.get('relative_path', '')}"
            )
    else:
        lines.append("- пока пусто")

    lines.append("")
    lines.append("Топ поисков за все время:")
    if summary["top_searches"]:
        for row in summary["top_searches"]:
            lines.append(
                f"- {row['sample_query']} | uses={row['uses']} | empty={row['empty_uses']} | last={row['last_used_utc']}"
            )
    else:
        lines.append("- пока пусто")

    lines.append("")
    lines.append("Пустые поиски за все время:")
    if summary["top_empty_searches"]:
        for row in summary["top_empty_searches"]:
            lines.append(f"- {row['sample_query']} | uses={row['uses']} | last={row['last_used_utc']}")
    else:
        lines.append("- пока пусто")

    lines.append("")
    lines.append("Популярные элементы за все время:")
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
        report_days=max(1, args.days),
    )
    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        print(render_text(summary))


if __name__ == "__main__":
    main()
