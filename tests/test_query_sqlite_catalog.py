import importlib.util
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "query_sqlite_catalog.py"
SPEC = importlib.util.spec_from_file_location("query_sqlite_catalog", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def test_query_variants_expand_everyday_terms():
    assert MODULE.query_variants("сувенирка") == [
        "сувенирка",
        "suvenirka",
        "сувенир",
        "мерч",
        "merch",
        "подарок",
    ]
    assert MODULE.query_variants("гайд") == [
        "гайд",
        "gaid",
        "брендбук",
        "гайдлайн",
        "guide",
    ]
