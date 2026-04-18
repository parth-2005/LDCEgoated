"""
Full API integration test — tests all backend endpoints end-to-end.
Requires: uvicorn running on http://localhost:8000
"""
import requests
import json
import time

BASE = "http://localhost:8000"

def test_run_analysis():
    print("=" * 70)
    print("TEST 1: POST /api/run-analysis")
    print("=" * 70)
    start = time.time()
    r = requests.post(f"{BASE}/api/run-analysis", json={"run_id": "test-001"})
    elapsed = time.time() - start
    
    assert r.status_code == 200, f"FAILED: status={r.status_code}"
    d = r.json()
    
    print(f"  Status: {r.status_code}")
    print(f"  Run ID: {d['run_id']}")
    print(f"  Total transactions: {d['total_transactions']}")
    print(f"  Flags raised: {d['flagged_count']}")
    print(f"  Processing time: {d['processing_time_seconds']}s")
    print(f"  Request wall time: {elapsed:.1f}s")
    
    # Check flag structure
    flag = d["flags"][0]
    required_keys = ["flag_id", "beneficiary_id", "beneficiary_name", "district",
                     "scheme", "payment_amount", "leakage_type", "risk_score",
                     "risk_label", "evidence", "recommended_action", "status"]
    missing = [k for k in required_keys if k not in flag]
    assert not missing, f"FAILED: Missing keys in flag: {missing}"
    
    print(f"\n  Top 5 flags:")
    for f in d["flags"][:5]:
        print(f"    {f['flag_id']} | {f['beneficiary_name']:25s} | {f['leakage_type']:13s} | Score: {f['risk_score']} | {f['risk_label']}")
    
    # Check AI evidence is present (not just fallback)
    evidence = d["flags"][0]["evidence"]
    print(f"\n  First flag evidence (truncated):")
    print(f"    {evidence[:150]}...")
    
    return d

def test_get_flags():
    print("\n" + "=" * 70)
    print("TEST 2: GET /api/flags")
    print("=" * 70)
    r = requests.get(f"{BASE}/api/flags")
    assert r.status_code == 200
    flags = r.json()
    print(f"  Status: {r.status_code}")
    print(f"  Total flags: {len(flags)}")
    print(f"  Sorted by risk score: {flags[0]['risk_score']} >= {flags[-1]['risk_score']}  {'OK' if flags[0]['risk_score'] >= flags[-1]['risk_score'] else 'FAIL'}")
    return flags

def test_get_single_flag(flag_id):
    print("\n" + "=" * 70)
    print(f"TEST 3: GET /api/flag/{flag_id}")
    print("=" * 70)
    r = requests.get(f"{BASE}/api/flag/{flag_id}")
    assert r.status_code == 200
    flag = r.json()
    print(f"  Status: {r.status_code}")
    print(f"  Flag ID: {flag['flag_id']}")
    print(f"  Name: {flag['beneficiary_name']}")
    print(f"  Type: {flag['leakage_type']}")
    print(f"  Score: {flag['risk_score']} ({flag['risk_label']})")
    print(f"  Status: {flag['status']}")

def test_update_status(flag_id):
    print("\n" + "=" * 70)
    print(f"TEST 4: PATCH /api/flag/{flag_id}/status")
    print("=" * 70)
    r = requests.patch(f"{BASE}/api/flag/{flag_id}/status", json={"status": "ASSIGNED"})
    assert r.status_code == 200
    flag = r.json()
    print(f"  Status: {r.status_code}")
    print(f"  Updated status: {flag['status']}")
    assert flag["status"] == "ASSIGNED", "FAILED: status not updated"
    
    # Change back
    r2 = requests.patch(f"{BASE}/api/flag/{flag_id}/status", json={"status": "OPEN"})
    assert r2.status_code == 200
    print(f"  Reverted to: {r2.json()['status']}")

def test_stats():
    print("\n" + "=" * 70)
    print("TEST 5: GET /api/stats")
    print("=" * 70)
    r = requests.get(f"{BASE}/api/stats")
    assert r.status_code == 200
    stats = r.json()
    print(f"  Status: {r.status_code}")
    print(f"  By leakage type: {stats['by_leakage_type']}")
    print(f"  Total amount at risk: Rs {stats['total_amount_at_risk']:,}")
    print(f"  Districts with flags: {len(stats['by_district'])}")
    print(f"  Top 3 districts: {dict(sorted(stats['by_district'].items(), key=lambda x: x[1], reverse=True)[:3])}")

def test_report():
    print("\n" + "=" * 70)
    print("TEST 6: GET /api/report")
    print("=" * 70)
    r = requests.get(f"{BASE}/api/report")
    assert r.status_code == 200
    report = r.text
    print(f"  Status: {r.status_code}")
    print(f"  Report length: {len(report)} chars")
    print(f"\n  First 500 chars:")
    print(f"  {report[:500]}...")

def test_normalize_names():
    print("\n" + "=" * 70)
    print("TEST 7: POST /api/normalize-names")
    print("=" * 70)
    r = requests.post(f"{BASE}/api/normalize-names", json={"name1": "Riya Patel", "name2": "Riyaben Patel"})
    assert r.status_code == 200
    result = r.json()
    print(f"  Status: {r.status_code}")
    print(f"  Similarity: {result['similarity_score']}")
    print(f"  Match: {result['is_match']}")
    print(f"  Confidence: {result['confidence']}")

if __name__ == "__main__":
    try:
        print("\nEduGuard DBT — Full Backend API Test")
        print("Server: http://localhost:8000\n")
        
        data = test_run_analysis()
        flags = test_get_flags()
        flag_id = flags[0]["flag_id"]
        test_get_single_flag(flag_id)
        test_update_status(flag_id)
        test_stats()
        test_report()
        test_normalize_names()
        
        print("\n" + "=" * 70)
        print("ALL 7 ENDPOINT TESTS PASSED!")
        print("=" * 70)
    except requests.ConnectionError:
        print("ERROR: Cannot connect to server. Is uvicorn running on :8000?")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
