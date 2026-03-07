#!/usr/bin/env python3
"""Build SQLite catalog for MAX bot from a local folder tree."""

from __future__ import annotations

import argparse
import hashlib
import mimetypes
import os
from pathlib import Path
import sqlite3
from datetime import datetime, timezone
import re


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scan folder tree and write SQLite catalog for MAX bot."
    )
    parser.add_argument("--source", type=Path, required=True, help="Source folder")
    parser.add_argument(
        "--db",
        type=Path,
        default=Path("./max_catalog.db"),
        help="Output SQLite DB path (default: ./max_catalog.db)",
    )
    parser.add_argument(
        "--include-hidden",
        action="store_true",
        help="Include hidden files/folders (names that start with .)",
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        default=None,
        help="Max scan depth from root (0 = root only)",
    )
    parser.add_argument(
        "--merge",
        action="store_true",
        help="Keep existing rows and upsert new rows instead of full replace",
    )
    return parser.parse_args()


def safe_id(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]


def is_hidden(path: Path) -> bool:
    return any(part.startswith(".") for part in path.parts if part)


def rel_depth(rel_path: str) -> int:
    if rel_path in ("", "."):
        return 0
    return len(Path(rel_path).parts)


def as_iso_utc(ts: float) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


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
    "гарнитура": ["шрифт", "font", "typeface"],
    "сувенир": ["мерч", "merch", "сувенирка", "подарок", "подарки"],
    "мерч": ["сувенир", "merch", "сувенирка", "подарок"],
    "сувенирка": ["сувенир", "мерч", "merch", "подарок"],
    "иллюстрация": ["иллюстрации", "svg", "вектор", "элемент", "графика"],
    "иллюстрации": ["иллюстрация", "svg", "вектор", "элементы", "графика"],
    "svg": ["иллюстрация", "иллюстрации", "вектор", "элемент"],
    "паттерн": ["svg", "элемент", "орнамент"],
    "город": ["города", "муниципалитет"],
    "города": ["город", "муниципалитет"],
    "мастербренд": ["мастер бренд", "брендбук", "гайдлайн"],
    "мастер": ["мастербренд", "мастер бренд", "брендбук"],
    "юбилей": ["100", "95", "брендбук"],
    "наклейка": ["стикер", "наклейки", "стикеры"],
    "стикер": ["наклейка", "стикеры", "наклейки"],
    "одежда": ["футболка", "худи", "мерч"],
    "футболка": ["одежда", "мерч"],
    "худи": ["одежда", "мерч"],
    "баннер": ["полиграфия", "навигация"],
    "навигация": ["полиграфия", "баннер", "табличка"],
    "полиграфия": ["баннер", "навигация", "буклет"],
    "диджитал": ["презентация", "соцсети", "цифровой"],
    "презентация": ["диджитал", "цифровой"],
    "соцсети": ["диджитал", "цифровой"],
    "канцелярия": ["ручка", "блокнот", "ежедневник"],
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


def build_search_text(name: str, rel_path: str, ext: str) -> str:
    base = normalize_text(f"{name} {rel_path} {ext}")
    variants: list[str] = []
    seen: set[str] = set()

    def add_variant(value: str) -> None:
        normalized = normalize_text(value)
        if not normalized or normalized in seen:
            return
        seen.add(normalized)
        variants.append(normalized)

    add_variant(base)
    add_variant(translit_to_latin(base))

    for token in base.split():
        for synonym in _SYNONYMS.get(token, []):
            add_variant(synonym)
            add_variant(translit_to_latin(synonym))

    return " ".join(variants).strip()


def build_rows(
    root: Path, include_hidden: bool, max_depth: int | None
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    root_name = root.name or str(root)

    def make_row(path: Path, item_type: str) -> dict[str, object]:
        rel = path.relative_to(root) if path != root else Path(".")
        rel_str = "." if str(rel) == "." else rel.as_posix()
        parent_rel = "" if rel_str == "." else Path(rel_str).parent.as_posix()
        if parent_rel == ".":
            parent_rel = ""

        depth = rel_depth(rel_str)
        stat = path.stat()
        name = root_name if rel_str == "." else path.name

        extension = ""
        size_bytes: int | None = None
        mime = ""
        if item_type == "file":
            extension = path.suffix.lower().lstrip(".")
            size_bytes = int(stat.st_size)
            mime = mimetypes.guess_type(path.name)[0] or ""

        item_id = safe_id(rel_str)
        parent_id = "" if rel_str == "." else safe_id(parent_rel or ".")
        normalized_name = normalize_text(name)
        normalized_path = normalize_text(rel_str)
        search_text = build_search_text(name, rel_str, extension)

        return {
            "id": item_id,
            "parent_id": parent_id,
            "type": item_type,
            "name": name,
            "relative_path": rel_str,
            "parent_path": parent_rel,
            "depth": depth,
            "extension": extension,
            "size_bytes": size_bytes,
            "mime_type": mime,
            "modified_utc": as_iso_utc(stat.st_mtime),
            "normalized_name": normalized_name,
            "normalized_path": normalized_path,
            "search_text": search_text,
            "is_active": 1,
            "sort_order": 0,
        }

    rows.append(make_row(root, "folder"))

    for current_root, dirnames, filenames in os.walk(root):
        current = Path(current_root)
        current_rel = current.relative_to(root)

        if max_depth is not None:
            current_depth = 0 if str(current_rel) == "." else len(current_rel.parts)
            if current_depth >= max_depth:
                dirnames[:] = []

        dirnames.sort()
        filenames.sort()

        filtered_dirs: list[str] = []
        for dirname in dirnames:
            full_dir = current / dirname
            rel_dir = full_dir.relative_to(root)
            if not include_hidden and is_hidden(rel_dir):
                continue
            if max_depth is not None and len(rel_dir.parts) > max_depth:
                continue
            filtered_dirs.append(dirname)
            rows.append(make_row(full_dir, "folder"))
        dirnames[:] = filtered_dirs

        for filename in filenames:
            full_file = current / filename
            rel_file = full_file.relative_to(root)
            if not include_hidden and is_hidden(rel_file):
                continue
            if max_depth is not None and len(rel_file.parts) > max_depth:
                continue
            rows.append(make_row(full_file, "file"))

    return rows


def init_db(conn: sqlite3.Connection) -> None:
    required_columns = {
        "id",
        "parent_id",
        "type",
        "name",
        "relative_path",
        "parent_path",
        "depth",
        "extension",
        "size_bytes",
        "mime_type",
        "modified_utc",
        "normalized_name",
        "normalized_path",
        "search_text",
        "is_active",
        "sort_order",
    }
    existing = conn.execute("PRAGMA table_info(assets)").fetchall()
    if existing:
        existing_cols = {row[1] for row in existing}
        if not required_columns.issubset(existing_cols):
            conn.execute("DROP TABLE assets")

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            parent_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('folder', 'file')),
            name TEXT NOT NULL,
            relative_path TEXT NOT NULL UNIQUE,
            parent_path TEXT NOT NULL,
            depth INTEGER NOT NULL,
            extension TEXT NOT NULL,
            size_bytes INTEGER,
            mime_type TEXT NOT NULL,
            modified_utc TEXT NOT NULL,
            normalized_name TEXT NOT NULL,
            normalized_path TEXT NOT NULL,
            search_text TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            sort_order INTEGER NOT NULL DEFAULT 0
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_assets_parent ON assets(parent_id, type, is_active)"
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_assets_search ON assets(search_text)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(normalized_name)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_assets_rel ON assets(relative_path)")
    conn.commit()


def write_rows(conn: sqlite3.Connection, rows: list[dict[str, object]], merge: bool) -> None:
    if not merge:
        conn.execute("DELETE FROM assets")
    conn.executemany(
        """
        INSERT INTO assets (
            id, parent_id, type, name, relative_path, parent_path, depth, extension,
            size_bytes, mime_type, modified_utc, normalized_name, normalized_path,
            search_text, is_active, sort_order
        )
        VALUES (
            :id, :parent_id, :type, :name, :relative_path, :parent_path, :depth, :extension,
            :size_bytes, :mime_type, :modified_utc, :normalized_name, :normalized_path,
            :search_text, :is_active, :sort_order
        )
        ON CONFLICT(id) DO UPDATE SET
            parent_id=excluded.parent_id,
            type=excluded.type,
            name=excluded.name,
            relative_path=excluded.relative_path,
            parent_path=excluded.parent_path,
            depth=excluded.depth,
            extension=excluded.extension,
            size_bytes=excluded.size_bytes,
            mime_type=excluded.mime_type,
            modified_utc=excluded.modified_utc,
            normalized_name=excluded.normalized_name,
            normalized_path=excluded.normalized_path,
            search_text=excluded.search_text,
            is_active=excluded.is_active
        """,
        rows,
    )
    conn.commit()


def main() -> None:
    args = parse_args()
    source = args.source.resolve()
    if not source.exists() or not source.is_dir():
        raise FileNotFoundError(f"--source is not a directory: {source}")

    db_path = args.db.resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    rows = build_rows(
        root=source, include_hidden=args.include_hidden, max_depth=args.max_depth
    )

    conn = sqlite3.connect(db_path)
    try:
        init_db(conn)
        write_rows(conn, rows, merge=args.merge)
        total = conn.execute("SELECT COUNT(*) FROM assets").fetchone()[0]
    finally:
        conn.close()

    print(f"Scan root: {source}")
    print(f"Rows scanned: {len(rows)}")
    print(f"DB path: {db_path}")
    print(f"DB total rows: {total}")
    print(f"Root id: {safe_id('.')}")


if __name__ == "__main__":
    main()
