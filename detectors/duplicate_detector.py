from collections import defaultdict
from typing import Any, Dict, List, Optional

import requests

from .data_loader import load_all

NORMALIZER_URL = "http://localhost:8000/api/normalize-names"
REQUEST_TIMEOUT_SECONDS = 1.5
FUZZY_DISTANCE_THRESHOLD = 2


def levenshtein(s1: str, s2: str) -> int:
    """Simple edit distance fallback."""
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)

    prev = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        curr = [i + 1]
        for j, c2 in enumerate(s2):
            curr.append(min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (c1 != c2)))
        prev = curr
    return prev[-1]


def normalize_name_local(name: str) -> str:
    """Local fallback normalization."""
    n = (name or "").lower().strip()
    for suffix in ["ben", "bhai", "bhen", "bha"]:
        if n.endswith(suffix):
            n = n[: -len(suffix)]
    n = n.replace("aa", "a").replace("ee", "i").replace("oo", "u")
    n = n.replace("sh", "s").replace("th", "t")
    return "".join(ch for ch in n if ch.isalnum())


def _normalize_names_remote(names: List[str]) -> Optional[Dict[str, str]]:
    """Try Person 3 name normalizer endpoint; return None on any failure."""
    try:
        response = requests.post(
            NORMALIZER_URL,
            json={"names": names},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
        if isinstance(payload, dict) and isinstance(payload.get("normalized"), dict):
            return payload["normalized"]
        if isinstance(payload, dict):
            return {k: v for k, v in payload.items() if isinstance(v, str)}
        return None
    except Exception:
        return None


def detect_duplicates() -> List[Dict[str, Any]]:
    data = load_all()
    flags: List[Dict[str, Any]] = []
    seen_pairs = set()

    beneficiaries = data["beneficiaries"]

    # Method A: exact Aadhaar collisions
    by_aadhaar: Dict[str, List[dict]] = defaultdict(list)
    for ben in beneficiaries:
        aadhaar_hash = ben.get("aadhaar_hash")
        if aadhaar_hash:
            by_aadhaar[aadhaar_hash].append(ben)

    for _, group in by_aadhaar.items():
        if len(group) <= 1:
            continue

        primary = sorted(group, key=lambda x: x.get("beneficiary_id", ""))[0]
        for dup in sorted(group, key=lambda x: x.get("beneficiary_id", ""))[1:]:
            pair_key = tuple(
                sorted([primary.get("beneficiary_id", ""), dup.get("beneficiary_id", "")])
            )
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            dup_payments = data["payments_by_id"].get(dup.get("beneficiary_id"), [])
            total_at_risk = sum((p.get("amount", 0) or 0) for p in dup_payments)

            flags.append(
                {
                    "beneficiary_id": dup.get("beneficiary_id"),
                    "beneficiary_name": dup.get("name", "Unknown"),
                    "district": dup.get("district", "Unknown"),
                    "scheme": dup_payments[0].get("scheme", "UNKNOWN") if dup_payments else "UNKNOWN",
                    "payment_id": dup_payments[0].get("payment_id") if dup_payments else None,
                    "payment_amount": total_at_risk,
                    "payment_date": dup_payments[0].get("payment_date") if dup_payments else None,
                    "leakage_type": "DUPLICATE",
                    "evidence_data": {
                        "match_method": "AADHAAR_EXACT",
                        "primary_id": primary.get("beneficiary_id"),
                        "primary_name": primary.get("name"),
                        "primary_district": primary.get("district"),
                        "duplicate_id": dup.get("beneficiary_id"),
                        "duplicate_name": dup.get("name"),
                        "duplicate_district": dup.get("district"),
                        "total_at_risk": total_at_risk,
                    },
                }
            )

    # Method B1: exact bank account match inside district
    by_district: Dict[str, List[dict]] = defaultdict(list)
    for ben in beneficiaries:
        district = ben.get("district")
        if district:
            by_district[district].append(ben)

    for district, bens in by_district.items():
        by_bank: Dict[str, List[dict]] = defaultdict(list)
        for ben in bens:
            bank_hash = ben.get("bank_account_hash")
            if bank_hash:
                by_bank[bank_hash].append(ben)

        for _, group in by_bank.items():
            if len(group) <= 1:
                continue
            base = sorted(group, key=lambda x: x.get("beneficiary_id", ""))[0]
            for dup in sorted(group, key=lambda x: x.get("beneficiary_id", ""))[1:]:
                pair_key = tuple(
                    sorted([base.get("beneficiary_id", ""), dup.get("beneficiary_id", "")])
                )
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                flags.append(
                    {
                        "beneficiary_id": dup.get("beneficiary_id"),
                        "beneficiary_name": dup.get("name", "Unknown"),
                        "district": district,
                        "scheme": "MULTI",
                        "payment_id": None,
                        "payment_amount": 0,
                        "payment_date": None,
                        "leakage_type": "DUPLICATE",
                        "evidence_data": {
                            "match_method": "BANK_ACCOUNT_EXACT",
                            "primary_name": base.get("name"),
                            "duplicate_name": dup.get("name"),
                            "shared_bank_account": True,
                        },
                    }
                )

    # Method B2: fuzzy name match inside district
    all_names = [b.get("name", "") for b in beneficiaries]
    remote_norm = _normalize_names_remote(all_names) or {}

    for district, bens in by_district.items():
        normalized_entries = []
        for ben in bens:
            original_name = ben.get("name", "")
            normalized_name = remote_norm.get(original_name) or normalize_name_local(original_name)
            normalized_entries.append((ben, normalized_name))

        # Bucket by leading character and length to reduce pairwise comparisons.
        buckets: Dict[tuple, List[tuple]] = defaultdict(list)
        for ben, norm in normalized_entries:
            if not norm:
                continue
            key = (norm[0], len(norm))
            buckets[key].append((ben, norm))

        for (first_char, base_len), items in buckets.items():
            candidate_keys = [
                (first_char, base_len - 1),
                (first_char, base_len),
                (first_char, base_len + 1),
                (first_char, base_len + 2),
                (first_char, base_len - 2),
            ]
            candidates = []
            for ckey in candidate_keys:
                candidates.extend(buckets.get(ckey, []))

            for i in range(len(items)):
                b1, n1 = items[i]
                for b2, n2 in candidates:
                    if b1.get("beneficiary_id") == b2.get("beneficiary_id"):
                        continue

                    pair_key = tuple(
                        sorted(
                            [
                                b1.get("beneficiary_id", ""),
                                b2.get("beneficiary_id", ""),
                            ]
                        )
                    )
                    if pair_key in seen_pairs:
                        continue

                    # Skip exact Aadhaar matches because Method A already handles them.
                    if b1.get("aadhaar_hash") and b1.get("aadhaar_hash") == b2.get("aadhaar_hash"):
                        continue

                    if abs(len(n1) - len(n2)) > FUZZY_DISTANCE_THRESHOLD:
                        continue

                    distance = levenshtein(n1, n2)
                    if distance > FUZZY_DISTANCE_THRESHOLD:
                        continue

                    seen_pairs.add(pair_key)

                    dup = b2
                    primary = b1
                    flags.append(
                        {
                            "beneficiary_id": dup.get("beneficiary_id"),
                            "beneficiary_name": dup.get("name", "Unknown"),
                            "district": district,
                            "scheme": "MULTI",
                            "payment_id": None,
                            "payment_amount": 0,
                            "payment_date": None,
                            "leakage_type": "DUPLICATE",
                            "evidence_data": {
                                "match_method": "FUZZY_NAME",
                                "primary_name": primary.get("name"),
                                "duplicate_name": dup.get("name"),
                                "normalized_primary": n1,
                                "normalized_duplicate": n2,
                                "distance": distance,
                            },
                        }
                    )

    return flags
