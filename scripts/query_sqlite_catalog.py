#!/usr/bin/env python3
"""Query SQLite catalog for MAX bot: children, search, get, stats."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sqlite3
import re
from difflib import SequenceMatcher


def safe_id(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]


_RU_TO_LAT = str.maketrans(
    {
        "а": "a",
        "б": "b",
        "в": "v",
        "г": "g",
        "д": "d",
        "е": "e",
        "ё": "e",
        "ж": "j",
        "з": "z",
        "и": "i",
        "й": "i",
        "к": "k",
        "л": "l",
        "м": "m",
        "н": "n",
        "о": "o",
        "п": "p",
        "р": "r",
        "с": "s",
        "т": "t",
        "у": "u",
        "ф": "f",
        "х": "h",
        "ц": "c",
        "ч": "ch",
        "ш": "sh",
        "щ": "sh",
        "ъ": "",
        "ы": "y",
        "ь": "",
        "э": "e",
        "ю": "yu",
        "я": "ya",
    }
)

_SYNONYMS = {
    "лого": ["логотип", "logo", "logotype"],
    "логотип": ["лого", "logo", "logotype", "brandmark", "знак", "эмблема"],
    "logo": ["логотип", "лого", "logotype", "brandmark"],
    "logotype": ["логотип", "logo", "лого"],
    "brandmark": ["логотип", "logo", "знак"],
    "знак": ["логотип", "brandmark", "эмблема", "symbol"],
    "эмблема": ["логотип", "знак", "symbol"],
    "symbol": ["знак", "эмблема", "brandmark"],
    "брендбук": ["гайдлайн", "гайд", "guide", "guideline", "brandbook"],
    "brandbook": ["брендбук", "гайдлайн", "guide", "guideline"],
    "гайдлайн": ["брендбук", "brandbook", "guide", "guideline"],
    "guideline": ["брендбук", "brandbook", "гайдлайн", "guide"],
    "гайд": ["брендбук", "гайдлайн", "guide"],
    "guide": ["брендбук", "brandbook", "гайдлайн", "guideline"],
    "шрифт": ["font", "fonts", "ttf", "otf", "гарнитура", "typeface"],
    "font": ["шрифт", "fonts", "ttf", "otf", "гарнитура", "typeface"],
    "fonts": ["шрифт", "font", "гарнитура"],
    "гарнитура": ["шрифт", "font", "typeface"],
    "typeface": ["шрифт", "font", "гарнитура"],
    "сувенир": ["мерч", "merch", "сувенирка", "подарок", "подарки"],
    "мерч": ["сувенир", "merch", "сувенирка", "подарок"],
    "merch": ["сувенир", "мерч", "сувенирка"],
    "сувенирка": ["сувенир", "мерч", "merch", "подарок"],
    "подарок": ["сувенир", "мерч", "сувенирка"],
    "подарки": ["сувенир", "мерч", "сувенирка"],
    "иллюстрация": ["иллюстрации", "svg", "вектор", "элемент", "графика"],
    "иллюстрации": ["иллюстрация", "svg", "вектор", "элементы", "графика"],
    "svg": ["иллюстрация", "иллюстрации", "вектор", "элемент"],
    "вектор": ["svg", "иллюстрация", "иллюстрации"],
    "элемент": ["svg", "иллюстрация", "паттерн"],
    "элементы": ["svg", "иллюстрации", "паттерн"],
    "иконка": ["icon", "svg", "пиктограмма"],
    "icon": ["иконка", "svg", "пиктограмма"],
    "пиктограмма": ["иконка", "icon", "svg"],
    "паттерн": ["svg", "элемент", "орнамент"],
    "орнамент": ["паттерн", "элемент"],
    "детский": ["дети", "child"],
    "дети": ["детский", "child"],
    "child": ["детский", "дети"],
    "город": ["города", "муниципалитет"],
    "города": ["город", "муниципалитет"],
    "муниципалитет": ["город", "города"],
}


def normalize_text(value: str) -> str:
    value = value.lower().replace("ё", "е")
    value = re.sub(r"[^0-9a-zа-я]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def translit_to_latin(value: str) -> str:
    out = []
    for ch in value:
        repl = _RU_TO_LAT.get(ord(ch))
        if repl is not None:
            out.append(repl)
        else:
            out.append(ch)
    return "".join(out)


def query_variants(query: str) -> list[str]:
    norm = normalize_text(query)
    if not norm:
        return []
    variants = [norm]
    norm_lat = normalize_text(translit_to_latin(norm))
    if norm_lat and norm_lat not in variants:
        variants.append(norm_lat)
    for tok in norm.split():
        for syn in _SYNONYMS.get(tok, []):
            syn_norm = normalize_text(syn)
            if syn_norm and syn_norm not in variants:
                variants.append(syn_norm)
    return variants


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Query MAX bot SQLite catalog")
    parser.add_argument(
        "--db",
        type=Path,
        default=Path("./max_catalog.db"),
        help="SQLite DB path (default: ./max_catalog.db)",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    children = sub.add_parser("children", help="List children by parent_id")
    children.add_argument(
        "--parent-id",
        default=safe_id("."),
        help="Parent item id (default: root id)",
    )
    children.add_argument("--limit", type=int, default=100, help="Max rows")

    search = sub.add_parser("search", help="Search in file/folder names and paths")
    search.add_argument("--query", required=True, help="Text query")
    search.add_argument("--limit", type=int, default=30, help="Max rows")
    search.add_argument(
        "--include-folders",
        action="store_true",
        help="Include folders in search results (default: files only)",
    )

    get_item = sub.add_parser("get", help="Get single row by id")
    get_item.add_argument("--id", required=True, help="Item id")

    sub.add_parser("stats", help="Show total counters")
    return parser.parse_args()


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict[str, object]]:
    return [dict(row) for row in rows]


def fuzzy_rank(query_norm: str, rows: list[sqlite3.Row]) -> list[dict[str, object]]:
    scored: list[tuple[float, dict[str, object]]] = []
    query_tokens = set(query_norm.split())
    for row in rows:
        item = dict(row)
        n_name = item.get("normalized_name", "") or ""
        n_path = item.get("normalized_path", "") or ""
        ratio_name = SequenceMatcher(None, query_norm, n_name).ratio()
        ratio_path = SequenceMatcher(None, query_norm, n_path).ratio()
        name_tokens = set(n_name.split())
        path_tokens = set(n_path.split())
        overlap = 0.0
        if query_tokens:
            overlap = max(
                len(query_tokens & name_tokens) / len(query_tokens),
                len(query_tokens & path_tokens) / len(query_tokens),
            )
        score = max(ratio_name, ratio_path) * 0.75 + overlap * 0.25
        if score >= 0.42:
            item["score"] = round(score, 4)
            scored.append((score, item))
    scored.sort(key=lambda it: (-it[0], it[1].get("depth", 999), it[1].get("name", "")))
    return [item for _, item in scored]


def main() -> None:
    args = parse_args()
    db_path = args.db.resolve()
    if not db_path.exists():
        raise FileNotFoundError(f"DB file not found: {db_path}")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    try:
        if args.command == "children":
            rows = conn.execute(
                """
                SELECT *
                FROM assets
                WHERE parent_id = ? AND is_active = 1
                ORDER BY sort_order ASC,
                         CASE type WHEN 'folder' THEN 0 ELSE 1 END ASC,
                         name ASC
                LIMIT ?
                """,
                (args.parent_id, args.limit),
            ).fetchall()
            print(json.dumps(rows_to_dicts(rows), ensure_ascii=False, indent=2))
            return

        if args.command == "search":
            variants = query_variants(args.query)
            if not variants:
                print("[]")
                return

            item_type_filter = "" if args.include_folders else "AND type = 'file'"
            where_parts = ["search_text LIKE ?" for _ in variants]
            sql = f"""
                SELECT *
                FROM assets
                WHERE is_active = 1
                  {item_type_filter}
                  AND ({' OR '.join(where_parts)})
                ORDER BY
                  CASE
                    WHEN normalized_name = ? THEN 0
                    WHEN normalized_name LIKE ? THEN 1
                    ELSE 2
                  END,
                  depth ASC,
                  name ASC
                LIMIT ?
                """
            params: list[object] = [f"%{v}%" for v in variants]
            q0 = variants[0]
            params.extend([q0, f"{q0}%", max(args.limit * 4, 120)])
            direct = conn.execute(sql, params).fetchall()

            # Fuzzy fallback for typos or incomplete names.
            fallback = conn.execute(
                f"""
                SELECT *
                FROM assets
                WHERE is_active = 1
                  {item_type_filter}
                ORDER BY depth ASC, name ASC
                LIMIT 2000
                """
            ).fetchall()
            fuzzy = fuzzy_rank(variants[0], fallback)

            merged: dict[str, dict[str, object]] = {}
            for row in direct:
                item = dict(row)
                item["score"] = 1.0
                merged[item["id"]] = item
            for item in fuzzy:
                if item["id"] not in merged:
                    merged[item["id"]] = item
                if len(merged) >= args.limit:
                    break

            result = list(merged.values())
            result.sort(
                key=lambda r: (
                    -float(r.get("score", 0.0)),
                    int(r.get("depth", 999)),
                    str(r.get("name", "")),
                )
            )
            print(json.dumps(result[: args.limit], ensure_ascii=False, indent=2))
            return

        if args.command == "get":
            row = conn.execute(
                "SELECT * FROM assets WHERE id = ? LIMIT 1", (args.id,)
            ).fetchone()
            print(
                json.dumps(dict(row) if row else {}, ensure_ascii=False, indent=2)
            )
            return

        if args.command == "stats":
            total = conn.execute("SELECT COUNT(*) FROM assets").fetchone()[0]
            files = conn.execute(
                "SELECT COUNT(*) FROM assets WHERE type='file'"
            ).fetchone()[0]
            folders = conn.execute(
                "SELECT COUNT(*) FROM assets WHERE type='folder'"
            ).fetchone()[0]
            print(
                json.dumps(
                    {
                        "db_path": str(db_path),
                        "total": total,
                        "files": files,
                        "folders": folders,
                        "root_id": safe_id("."),
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return
    finally:
        conn.close()


if __name__ == "__main__":
    main()
