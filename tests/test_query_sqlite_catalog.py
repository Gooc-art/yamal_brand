import importlib.util
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "query_sqlite_catalog.py"
SPEC = importlib.util.spec_from_file_location("query_sqlite_catalog", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def test_query_variants_expand_everyday_terms():
    souvenir = MODULE.query_variants("сувенирка")
    assert all(
        value in souvenir
        for value in ["сувенирка", "suvenirka", "сувенир", "merch", "подарок", "podarok"]
    )

    guide = MODULE.query_variants("гайд")
    assert all(
        value in guide
        for value in ["гайд", "gaid", "брендбук", "brendbuk", "гайдлайн", "guide"]
    )

    stickers = MODULE.query_variants("наклейка")
    assert all(
        value in stickers
        for value in ["наклейка", "nakleika", "стикер", "stiker", "наклейки", "стикеры"]
    )
