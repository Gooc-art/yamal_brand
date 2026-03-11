from pathlib import Path

import pytest

from scripts.import_regru_archive_paths import locate_subdir


def test_locate_subdir_prefers_direct_match(tmp_path: Path) -> None:
    extract_root = tmp_path / "extract"
    direct = extract_root / "Примеры внедрения бренда территории"
    nested = extract_root / "payload" / "Примеры внедрения бренда территории"
    direct.mkdir(parents=True)
    nested.mkdir(parents=True)

    result = locate_subdir(extract_root, "Примеры внедрения бренда территории")

    assert result == direct.resolve()


def test_locate_subdir_finds_nested_match(tmp_path: Path) -> None:
    extract_root = tmp_path / "extract"
    nested = extract_root / "wrapped" / "inner" / "Примеры внедрения бренда территории"
    nested.mkdir(parents=True)

    result = locate_subdir(extract_root, "Примеры внедрения бренда территории")

    assert result == nested.resolve()


def test_locate_subdir_supports_relative_path_query(tmp_path: Path) -> None:
    extract_root = tmp_path / "extract"
    nested = extract_root / "bundle" / "Макеты1" / "Примеры внедрения бренда территории"
    nested.mkdir(parents=True)

    result = locate_subdir(extract_root, "Макеты1/Примеры внедрения бренда территории")

    assert result == nested.resolve()


def test_locate_subdir_raises_when_missing(tmp_path: Path) -> None:
    extract_root = tmp_path / "extract"
    extract_root.mkdir(parents=True)

    with pytest.raises(FileNotFoundError):
        locate_subdir(extract_root, "Примеры внедрения бренда территории")
