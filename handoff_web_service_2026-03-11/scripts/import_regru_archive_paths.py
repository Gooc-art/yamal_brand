#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path


def clean_parts(value: str) -> tuple[str, ...]:
    parts = []
    for part in Path(value).parts:
        token = part.strip()
        if token in {"", ".", ".."}:
            continue
        parts.append(token)
    return tuple(parts)


def locate_subdir(extract_root: Path, subdir: str) -> Path:
    requested_parts = clean_parts(subdir)
    if not requested_parts:
        raise ValueError("subdir must not be empty")

    direct = extract_root.joinpath(*requested_parts)
    if direct.is_dir():
        return direct.resolve()

    matches: list[Path] = []
    for candidate in extract_root.rglob(requested_parts[-1]):
        if not candidate.is_dir():
            continue
        try:
            relative_parts = candidate.relative_to(extract_root).parts
        except ValueError:
            continue
        if len(relative_parts) < len(requested_parts):
            continue
        if tuple(relative_parts[-len(requested_parts):]) != requested_parts:
            continue
        matches.append(candidate)

    if not matches:
        raise FileNotFoundError(f"subdir not found in extracted archive: {subdir}")

    matches.sort(
        key=lambda candidate: (
            len(candidate.relative_to(extract_root).parts),
            str(candidate.relative_to(extract_root)),
        )
    )
    return matches[0].resolve()


def main() -> int:
    parser = argparse.ArgumentParser(description="Helpers for REG.RU archive imports")
    subparsers = parser.add_subparsers(dest="command", required=True)

    locate = subparsers.add_parser("locate-subdir", help="Locate a directory inside extracted archive payload")
    locate.add_argument("--extract-root", required=True, type=Path)
    locate.add_argument("--subdir", required=True)

    args = parser.parse_args()

    if args.command == "locate-subdir":
        target = locate_subdir(args.extract_root, args.subdir)
        print(target)
        return 0

    parser.error(f"unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
