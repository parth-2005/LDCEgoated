import json
import os
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List

from .mock_data import (
    MOCK_BENEFICIARIES,
    MOCK_DEATH_REGISTRY,
    MOCK_PAYMENTS,
    MOCK_UDISE,
)

DATA_PATH = Path(os.getenv("DATA_PATH", "./data"))

_cache: Dict[str, Any] = {}
_lock = Lock()


def _read_json(path: Path) -> List[dict]:
    if not path.exists():
        raise FileNotFoundError(f"Missing data file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_all() -> Dict[str, Any]:
    """Load all datasets once and build O(1) lookup indexes."""
    if _cache:
        return _cache

    with _lock:
        if _cache:
            return _cache

        try:
            beneficiaries = _read_json(DATA_PATH / "beneficiaries.json")
            udise = _read_json(DATA_PATH / "udise_records.json")
            payments = _read_json(DATA_PATH / "payment_ledger.json")
            death_registry = _read_json(DATA_PATH / "death_registry.json")
        except FileNotFoundError:
            beneficiaries = MOCK_BENEFICIARIES
            udise = MOCK_UDISE
            payments = MOCK_PAYMENTS
            death_registry = MOCK_DEATH_REGISTRY

        _cache["beneficiaries"] = beneficiaries
        _cache["udise"] = udise
        _cache["payments"] = payments
        _cache["death_registry"] = death_registry

        _cache["beneficiary_by_id"] = {
            b["beneficiary_id"]: b for b in beneficiaries if "beneficiary_id" in b
        }
        _cache["udise_by_id"] = {
            u["beneficiary_id"]: u for u in udise if "beneficiary_id" in u
        }

        payments_by_id: Dict[str, List[dict]] = {}
        for payment in payments:
            beneficiary_id = payment.get("beneficiary_id")
            if beneficiary_id is None:
                continue
            payments_by_id.setdefault(beneficiary_id, []).append(payment)
        _cache["payments_by_id"] = payments_by_id

        _cache["death_by_aadhaar"] = {
            d["aadhaar_hash"]: d for d in death_registry if "aadhaar_hash" in d
        }

        return _cache


def clear_cache() -> None:
    """Clear cache for tests or explicit reloads."""
    with _lock:
        _cache.clear()
