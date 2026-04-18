"""Test script for evidence generator — verifies template fallback for all 4 leakage types"""
import sys
sys.path.insert(0, '..')
from ai_layer.evidence_generator import generate_evidence

# Mock flags for each leakage type (matching the schema Person 2's detectors produce)
mock_flags = [
    {
        "beneficiary_id": "BEN-GJ-04-2847",
        "beneficiary_name": "Riya Sharma",
        "district": "Gandhinagar",
        "scheme": "NLY",
        "payment_amount": 25000,
        "payment_date": "2025-03-12",
        "leakage_type": "DECEASED",
        "evidence_data": {
            "death_date": "2025-01-03",
            "days_post_mortem": 68,
            "payment_date": "2025-03-12",
            "amount": 25000,
            "scheme": "NLY"
        }
    },
    {
        "beneficiary_id": "BEN-GJ-01-0042-DUP",
        "beneficiary_name": "Riyaben Patel",
        "district": "Surat",
        "scheme": "NSVSY",
        "payment_amount": 10000,
        "payment_date": "2025-02-20",
        "leakage_type": "DUPLICATE",
        "evidence_data": {
            "match_method": "AADHAAR_EXACT",
            "primary_id": "BEN-GJ-04-0042",
            "primary_name": "Riya Patel",
            "primary_district": "Gandhinagar",
            "duplicate_id": "BEN-GJ-01-0042-DUP",
            "duplicate_name": "Riyaben Patel",
            "duplicate_district": "Surat",
            "total_at_risk": 10000
        }
    },
    {
        "beneficiary_id": "BEN-GJ-08-1234",
        "beneficiary_name": "Kavya Desai",
        "district": "Rajkot",
        "scheme": "MGMS",
        "payment_amount": 20000,
        "payment_date": "2024-09-15",
        "leakage_type": "UNDRAWN",
        "evidence_data": {
            "days_pending": 215,
            "threshold_days": 60,
            "payment_status": "CREDITED",
            "school": "Shri Sarvodaya High School",
            "enrollment_status": "ACTIVE",
            "attendance_pct": 45.2
        }
    },
    {
        "beneficiary_id": "BEN-GJ-05-0789",
        "beneficiary_name": "Drashti Modi",
        "district": "Bhavnagar",
        "scheme": "NLY+NSVSY",
        "payment_amount": 35000,
        "payment_date": "2025-01-10",
        "leakage_type": "CROSS_SCHEME",
        "evidence_data": {
            "scheme_a": "NLY",
            "scheme_b": "NSVSY",
            "amount_a": 25000,
            "amount_b": 10000,
            "total_amount": 35000,
            "payment_date_a": "2025-01-10",
            "payment_date_b": "2025-01-15",
            "rule_violated": "Simultaneous drawing of NLY and NSVSY is prohibited"
        }
    }
]

print("=" * 70)
print("EduGuard DBT — Evidence Generator Test (Template Fallback)")
print("=" * 70)

for flag in mock_flags:
    evidence = generate_evidence(flag)
    print(f"\n--- {flag['leakage_type']} ---")
    print(f"Beneficiary: {flag['beneficiary_name']} | District: {flag['district']}")
    print(f"Evidence: {evidence}")
    print()

print("=" * 70)
print("All 4 leakage types generated successfully.")
