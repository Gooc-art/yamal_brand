#!/usr/bin/env python3
"""Scan a folder tree (or downloadable archive) and build a SeaTable-friendly CSV."""

from __future__ import annotations

import argparse
import csv
import hashlib
import mimetypes
import os
from pathlib import Path
import shutil
import tarfile
from datetime import datetime, timezone
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen
import zipfile


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Scan directory structure and export CSV for SeaTable. "
            "Provide either --source or --url."
        )
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--source", type=Path, help="Local directory to scan")
    group.add_argument("--url", help="External URL to download before scanning")

    parser.add_argument(
        "--workdir",
        type=Path,
        default=Path("./.scan_work"),
        help="Working directory for downloaded/extracted data (default: ./.scan_work)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("./seatable_import.csv"),
        help="Output CSV path (default: ./seatable_import.csv)",
    )
    parser.add_argument(
        "--include-hidden",
        action="store_true",
        help="Include hidden files/folders (names starting with .)",
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        default=None,
        help="Max scan depth from root (0 = root only)",
    )
    parser.add_argument(
        "--clean-workdir",
        action="store_true",
        help="Delete workdir before download/extract",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=60.0,
        help="Download timeout in seconds for --url mode (default: 60)",
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


def detect_archive(path: Path) -> str | None:
    lower = path.name.lower()
    if zipfile.is_zipfile(path):
        return "zip"
    if tarfile.is_tarfile(path):
        return "tar"
    if lower.endswith((".tgz", ".tar.gz", ".tar.bz2", ".tar.xz", ".zip", ".tar")):
        return "maybe"
    return None


def extract_archive(archive_path: Path, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)

    if zipfile.is_zipfile(archive_path):
        with zipfile.ZipFile(archive_path, "r") as zf:
            zf.extractall(out_dir)
        return out_dir

    if tarfile.is_tarfile(archive_path):
        with tarfile.open(archive_path, "r:*") as tf:
            tf.extractall(out_dir)
        return out_dir

    raise RuntimeError(f"Unsupported or corrupted archive: {archive_path}")


def filename_from_url(url: str) -> str:
    parsed = urlparse(url)
    name = Path(unquote(parsed.path)).name
    return name or "downloaded_file"


def download_file(url: str, destination: Path, timeout_sec: float) -> None:
    req = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/123.0 Safari/537.36"
            )
        },
    )
    with urlopen(req, timeout=timeout_sec) as response, destination.open("wb") as out:
        shutil.copyfileobj(response, out)


def prepare_root(args: argparse.Namespace) -> tuple[Path, str | None]:
    if args.source:
        source = args.source.resolve()
        if not source.exists() or not source.is_dir():
            raise FileNotFoundError(f"--source is not a directory: {source}")
        return source, None

    workdir = args.workdir.resolve()
    if args.clean_workdir and workdir.exists():
        shutil.rmtree(workdir)
    downloads_dir = workdir / "downloads"
    extracted_dir = workdir / "extracted"
    downloads_dir.mkdir(parents=True, exist_ok=True)
    extracted_dir.mkdir(parents=True, exist_ok=True)

    download_name = filename_from_url(args.url)
    download_path = downloads_dir / download_name

    print(f"Downloading: {args.url}")
    download_file(args.url, download_path, args.timeout)
    print(f"Saved to: {download_path}")

    if detect_archive(download_path):
        unpack_dir = extracted_dir / download_path.stem
        root = extract_archive(download_path, unpack_dir)
        print(f"Extracted to: {root}")
        return root.resolve(), args.url

    # If it's a single file, scan the containing directory for consistent tree output.
    return downloads_dir.resolve(), args.url


def build_rows(root: Path, source_url: str | None, include_hidden: bool, max_depth: int | None) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    root_name = root.name or str(root)

    def make_row(path: Path, item_type: str) -> dict[str, str]:
        rel = path.relative_to(root) if path != root else Path(".")
        rel_str = "." if str(rel) == "." else rel.as_posix()
        parent_rel = "" if rel_str == "." else Path(rel_str).parent.as_posix()
        if parent_rel == ".":
            parent_rel = ""

        depth = rel_depth(rel_str)
        stat = path.stat()
        name = root_name if rel_str == "." else path.name

        extension = ""
        size_bytes = ""
        mime = ""

        if item_type == "file":
            extension = path.suffix.lower().lstrip(".")
            size_bytes = str(stat.st_size)
            mime = mimetypes.guess_type(path.name)[0] or ""

        item_id = safe_id(rel_str)
        parent_id = "" if rel_str == "." else safe_id(parent_rel or ".")

        return {
            "id": item_id,
            "parent_id": parent_id,
            "name": name,
            "type": item_type,
            "relative_path": rel_str,
            "parent_path": parent_rel,
            "depth": str(depth),
            "extension": extension,
            "size_bytes": size_bytes,
            "mime_type": mime,
            "modified_utc": as_iso_utc(stat.st_mtime),
            "source_url": source_url or "",
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

        filtered_dirs = []
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


def write_csv(rows: list[dict[str, str]], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "id",
        "parent_id",
        "name",
        "type",
        "relative_path",
        "parent_path",
        "depth",
        "extension",
        "size_bytes",
        "mime_type",
        "modified_utc",
        "source_url",
    ]
    with out_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    args = parse_args()
    root, source_url = prepare_root(args)

    rows = build_rows(
        root=root,
        source_url=source_url,
        include_hidden=args.include_hidden,
        max_depth=args.max_depth,
    )
    write_csv(rows, args.output.resolve())

    print(f"Scan root: {root}")
    print(f"Rows exported: {len(rows)}")
    print(f"CSV path: {args.output.resolve()}")


if __name__ == "__main__":
    main()
