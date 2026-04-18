import re
from difflib import SequenceMatcher

# Transliteration normalization rules for Gujarati → ASCII
GUJARATI_NORMALIZATIONS = [
    # Suffix removal (honorifics often appended in records)
    (r'(ben|bhai|bhen|bha|kumari|devi)\b', ''),
    # Vowel normalization (different romanization standards)
    ('aa', 'a'), ('ee', 'i'), ('oo', 'u'),
    ('ae', 'e'), ('ai', 'e'), ('au', 'o'),
    # Consonant normalization
    ('sh', 's'), ('kh', 'k'), ('gh', 'g'),
    ('th', 't'), ('dh', 'd'), ('ph', 'f'),
    ('bh', 'b'), ('jh', 'j'), ('ch', 'c'),
    # Silent/doubled letters
    ('tt', 't'), ('pp', 'p'), ('nn', 'n'),
    ('ll', 'l'), ('mm', 'm'), ('rr', 'r'),
]

def normalize_gujarati_name(name: str) -> str:
    """
    Normalize a Gujarati transliterated name to a canonical ASCII form.
    Used for fuzzy comparison — not for display.
    """
    n = name.lower().strip()
    # Remove punctuation
    n = re.sub(r"['\-\.]", " ", n)
    # Apply suffix rules first (regex)
    n = re.sub(GUJARATI_NORMALIZATIONS[0][0], '', n)
    # Apply string substitutions
    for old, new in GUJARATI_NORMALIZATIONS[1:]:
        n = n.replace(old, new)
    # Collapse spaces
    n = re.sub(r'\s+', '', n)
    return n

def compute_similarity(name1: str, name2: str) -> float:
    """
    Returns similarity score 0–1 between two names after normalization.
    Combines:
    - SequenceMatcher on normalized forms (primary)
    - Token-level matching (handles word order differences)
    """
    n1 = normalize_gujarati_name(name1)
    n2 = normalize_gujarati_name(name2)
    
    # Exact match after normalization
    if n1 == n2:
        return 1.0
    
    # Sequence similarity on normalized strings
    seq_score = SequenceMatcher(None, n1, n2).ratio()
    
    # Token-level: sort tokens and compare (handles "Patel Riya" vs "Riya Patel")
    t1 = sorted(name1.lower().split())
    t2 = sorted(name2.lower().split())
    token_score = SequenceMatcher(None, ' '.join(t1), ' '.join(t2)).ratio()
    
    return max(seq_score, token_score)

def is_likely_same_person(name1: str, name2: str, threshold: float = 0.82) -> dict:
    """
    Returns match assessment dict.
    threshold=0.82 calibrated to minimize false positives on Gujarati names.
    """
    score = compute_similarity(name1, name2)
    n1 = normalize_gujarati_name(name1)
    n2 = normalize_gujarati_name(name2)
    
    return {
        "name1": name1,
        "name2": name2,
        "normalized_1": n1,
        "normalized_2": n2,
        "similarity_score": round(score, 3),
        "is_match": score >= threshold,
        "confidence": "HIGH" if score >= 0.95 else "MEDIUM" if score >= 0.82 else "LOW",
        "match_method": "GUJARATI_NORMALIZED_FUZZY"
    }

def batch_find_duplicates(names_with_ids: list[dict]) -> list[dict]:
    """
    Given list of {"id": ..., "name": ...}, returns all matched pairs.
    O(n²) but fast enough for 8,000 names (~64M comparisons) — use threshold early exit.
    
    For hackathon scale: only compare within same district (passed in already).
    """
    matches = []
    for i in range(len(names_with_ids)):
        for j in range(i+1, len(names_with_ids)):
            a = names_with_ids[i]
            b = names_with_ids[j]
            result = is_likely_same_person(a["name"], b["name"])
            if result["is_match"]:
                matches.append({
                    "id_a": a["id"],
                    "id_b": b["id"],
                    **result
                })
    return matches
