"""Test script for name normalizer — verifies Gujarati transliteration matching"""
import sys
sys.path.insert(0, '..')
from ai_layer.name_normalizer import is_likely_same_person

test_pairs = [
    ("Riya Patel", "Riyaben Patel"),       # should match
    ("Ramesh Shah", "Rameshbhai Shah"),     # should match
    ("Jignesh Modi", "Jigneshbhai Modi"),   # should match
    ("Priya Desai", "Priya Joshi"),         # should NOT match
    ("Hetal Solanki", "Hetal Solanki"),     # should match (exact)
    ("Kinjal Patel", "Khinjal Patil"),      # borderline
]

print("=" * 70)
print("EduGuard DBT — Name Normalizer Test")
print("=" * 70)

for n1, n2 in test_pairs:
    result = is_likely_same_person(n1, n2)
    status = "MATCH" if result["is_match"] else "NO MATCH"
    print(f"  {n1:25s} | {n2:25s} -> {result['similarity_score']:.3f}  [{result['confidence']:6s}]  {status}")

print("=" * 70)
print("Test complete.")
