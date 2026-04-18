"""
api/main.py — EduGuard DBT FastAPI Backend
==========================================
All routes fall back gracefully to /data JSON files when MongoDB
is unavailable or the collection is empty.
"""

import json
import os
import time
import uuid
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, date
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

# ── Detection engine ─────────────────────────────────────────────────────────
from detectors.cross_scheme_detector import detect_cross_scheme
from detectors.data_loader import load_all
from detectors.deceased_detector import detect_deceased
from detectors.duplicate_detector import detect_duplicates
from detectors.risk_scorer import compute_risk_score
from detectors.undrawn_detector import detect_undrawn

# ── AI layer (optional) ──────────────────────────────────────────────────────
try:
    from ai_layer.evidence_generator import generate_evidence
except Exception:
    generate_evidence = None

try:
    from ai_layer.report_generator import generate_report
except Exception:
    generate_report = None

try:
    from ai_layer.endpoints import router as ai_router
except Exception:
    ai_router = None

# ── Database ─────────────────────────────────────────────────────────────────
try:
    from database import (
        get_flags_collection,
        get_students_collection,
        is_mongo_available,
        get_db,
    )
    _mongo_ok: bool = False
except Exception:
    get_flags_collection = None
    get_students_collection = None
    is_mongo_available = None
    get_db = None
    _mongo_ok = False

# ── Data path ────────────────────────────────────────────────────────────────
DATA_DIR = Path(os.getenv("DATA_PATH", "./data"))

# ── In-memory stores ─────────────────────────────────────────────────────────
_flag_store: dict = {}          # flag_id → flag dict
_investigation_store: dict = {} # case_id → investigation dict
_mongo_ok: bool = False

# =============================================================================
app = FastAPI(title="EduGuard DBT API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if ai_router:
    app.include_router(ai_router)


# =============================================================================
# STARTUP
# =============================================================================

@app.on_event("startup")
async def startup():
    global _mongo_ok
    load_all()
    if is_mongo_available:
        try:
            _mongo_ok = is_mongo_available()
            print(f"  [api] MongoDB: {'connected' if _mongo_ok else 'unavailable — using JSON fallback'}")
        except Exception:
            _mongo_ok = False
            print("  [api] MongoDB unavailable — using JSON fallback")


# =============================================================================
# HELPERS — JSON Fallback Loaders
# =============================================================================

def _load_json(filename: str) -> list | dict:
    """Load a JSON file from /data directory. Returns [] on error."""
    path = DATA_DIR / filename
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _get_col(name: str):
    """Return a MongoDB collection or None if unavailable."""
    if _mongo_ok and get_db:
        try:
            return get_db()[name]
        except Exception:
            return None
    return None


def _col_has_data(col) -> bool:
    """True if the collection exists and has at least one document."""
    if col is None:
        return False
    try:
        return col.count_documents({}) > 0
    except Exception:
        return False


# =============================================================================
# FALLBACK DATA — built from /data JSON files + mock constants
# =============================================================================

# ── Investigations fallback (built from dfoMock structure) ───────────────────
_FALLBACK_INVESTIGATIONS = [
    {
        "case_id": "CASE-2026-001",
        "anomaly_type": "GHOST_BENEFICIARY",
        "target_entity": {"entity_type": "USER", "entity_id": "USR-GJ-001", "name": "Dhruti Baria"},
        "district": "Ahmedabad", "scheme": "MGMS", "amount": 25000,
        "status": "OPEN",
        "created_at": "2026-04-10T09:00:00Z",
        "workflow": {"assigned_dfo_id": "OFF-1042", "assigned_verifier_id": None, "assigned_auditor_id": None},
        "field_report": None,
    },
    {
        "case_id": "CASE-2026-002",
        "anomaly_type": "DUPLICATE_IDENTITY",
        "target_entity": {"entity_type": "USER", "entity_id": "USR-GJ-044", "name": "Riyaben Patel"},
        "district": "Ahmedabad", "scheme": "NLY", "amount": 10000,
        "status": "ASSIGNED_TO_VERIFIER",
        "created_at": "2026-04-08T11:30:00Z",
        "workflow": {"assigned_dfo_id": "OFF-1042", "assigned_verifier_id": "OFF-2091", "assigned_auditor_id": None},
        "field_report": None,
    },
    {
        "case_id": "CASE-2026-003",
        "anomaly_type": "UNDRAWN_FUNDS",
        "target_entity": {"entity_type": "USER", "entity_id": "USR-GJ-263", "name": "Nikhil Joshi"},
        "district": "Ahmedabad", "scheme": "NLY", "amount": 20000,
        "status": "VERIFICATION_SUBMITTED",
        "created_at": "2026-04-05T14:00:00Z",
        "workflow": {"assigned_dfo_id": "OFF-1042", "assigned_verifier_id": "OFF-2092", "assigned_auditor_id": None},
        "field_report": {
            "verifier_notes": "Student confirmed at address. Fund not withdrawn due to bank account issue.",
            "gps_coordinates": {"lat": 23.0225, "lng": 72.5714},
            "photo_url": None,
            "ai_verification_match": True,
            "finding_category": "LEGITIMATE",
            "beneficiary_present": True,
            "submission_timestamp": "2026-04-16T10:00:00Z",
            "ai_analysis": {"confidence_score": 87, "reason": "GPS and photo metadata consistent with beneficiary address.", "proofs": ["GPS within 200m radius", "Photo taken 2026-04-16"]},
        },
    },
    {
        "case_id": "CASE-2026-004",
        "anomaly_type": "CROSS_SCHEME",
        "target_entity": {"entity_type": "USER", "entity_id": "USR-GJ-136", "name": "Nidhi Vasava"},
        "district": "Ahmedabad", "scheme": "NLY+NSVSY", "amount": 35000,
        "status": "AUDIT_REVIEW",
        "created_at": "2026-04-01T08:00:00Z",
        "workflow": {"assigned_dfo_id": "OFF-1042", "assigned_verifier_id": "OFF-2093", "assigned_auditor_id": "OFF-3011"},
        "field_report": {
            "verifier_notes": "Confirmed simultaneous NLY + NSVSY enrollment.",
            "gps_coordinates": {"lat": 23.0300, "lng": 72.5900},
            "ai_verification_match": False,
            "finding_category": "CONFIRMED_FRAUD",
            "beneficiary_present": False,
            "submission_timestamp": "2026-04-12T15:00:00Z",
            "ai_analysis": {"confidence_score": 93, "reason": "Cross-scheme violation confirmed.", "proofs": ["Dual enrollment records", "Payments from both schemes in same AY"]},
        },
    },
    {
        "case_id": "CASE-2026-005",
        "anomaly_type": "GHOST_BENEFICIARY",
        "target_entity": {"entity_type": "USER", "entity_id": "USR-GJ-361", "name": "Mansi Damor"},
        "district": "Ahmedabad", "scheme": "MGMS", "amount": 25000,
        "status": "CLOSED_RESOLVED",
        "created_at": "2026-03-20T10:00:00Z",
        "workflow": {"assigned_dfo_id": "OFF-1042", "assigned_verifier_id": "OFF-2094", "assigned_auditor_id": "OFF-3011"},
        "field_report": {
            "verifier_notes": "Death confirmed at local civic body. Payment recovery initiated.",
            "gps_coordinates": {"lat": 22.9900, "lng": 72.5100},
            "ai_verification_match": True,
            "finding_category": "CONFIRMED_FRAUD",
            "beneficiary_present": False,
            "submission_timestamp": "2026-03-28T12:00:00Z",
            "ai_analysis": {"confidence_score": 99, "reason": "Death registry match confirmed.", "proofs": ["Death cert ref: AHDC-2026-4421", "No withdrawal post death-date"]},
        },
    },
]

_FALLBACK_INSTITUTIONS = [
    {"institution_id": "INST-240701", "name": "Saraswati Vidya Mandir", "type": "SCHOOL", "district": "Ahmedabad", "taluka": "Sanand", "financial_ledger": {"total_funds_credited": 2500000, "total_funds_debited": 2450000, "current_holding": 50000}, "risk_profile": {"is_flagged": True, "flag_reason": "High volume of undrawn funds", "risk_score": 75}, "beneficiary_count": 142},
    {"institution_id": "INST-240702", "name": "Govt. Higher Secondary School, Bavla", "type": "SCHOOL", "district": "Ahmedabad", "taluka": "Bavla", "financial_ledger": {"total_funds_credited": 1800000, "total_funds_debited": 1800000, "current_holding": 0}, "risk_profile": {"is_flagged": False, "flag_reason": None, "risk_score": 12}, "beneficiary_count": 98},
    {"institution_id": "INST-240703", "name": "Aadhyashakti High School", "type": "SCHOOL", "district": "Ahmedabad", "taluka": "Dholka", "financial_ledger": {"total_funds_credited": 3100000, "total_funds_debited": 2600000, "current_holding": 500000}, "risk_profile": {"is_flagged": True, "flag_reason": "Payments credited to deceased beneficiaries", "risk_score": 91}, "beneficiary_count": 215},
    {"institution_id": "INST-240704", "name": "Gram Panchayat — Bopal", "type": "GRAM_PANCHAYAT", "district": "Ahmedabad", "taluka": "Ghatlodiya", "financial_ledger": {"total_funds_credited": 980000, "total_funds_debited": 975000, "current_holding": 5000}, "risk_profile": {"is_flagged": False, "flag_reason": None, "risk_score": 8}, "beneficiary_count": 54},
    {"institution_id": "INST-240705", "name": "Shree Swaminarayan College", "type": "COLLEGE", "district": "Ahmedabad", "taluka": "Maninagar", "financial_ledger": {"total_funds_credited": 5200000, "total_funds_debited": 3900000, "current_holding": 1300000}, "risk_profile": {"is_flagged": True, "flag_reason": "Duplicate identities detected", "risk_score": 83}, "beneficiary_count": 380},
    {"institution_id": "INST-240706", "name": "New Era English Medium School", "type": "SCHOOL", "district": "Ahmedabad", "taluka": "Naroda", "financial_ledger": {"total_funds_credited": 1200000, "total_funds_debited": 1195000, "current_holding": 5000}, "risk_profile": {"is_flagged": False, "flag_reason": None, "risk_score": 21}, "beneficiary_count": 76},
    {"institution_id": "INST-240707", "name": "Gram Panchayat — Detroj", "type": "GRAM_PANCHAYAT", "district": "Ahmedabad", "taluka": "Detroj-Rampura", "financial_ledger": {"total_funds_credited": 760000, "total_funds_debited": 510000, "current_holding": 250000}, "risk_profile": {"is_flagged": True, "flag_reason": "Excessive holding — funds not disbursed", "risk_score": 68}, "beneficiary_count": 41},
]

_FALLBACK_VERIFIERS = [
    {"officer_id": "OFF-2091", "name": "Pooja Rathod", "district": "Ahmedabad", "active_cases": 3},
    {"officer_id": "OFF-2092", "name": "Mihir Shah",   "district": "Ahmedabad", "active_cases": 1},
    {"officer_id": "OFF-2093", "name": "Alpa Trivedi", "district": "Ahmedabad", "active_cases": 5},
    {"officer_id": "OFF-2094", "name": "Ramesh Vasava","district": "Ahmedabad", "active_cases": 0},
]

_FALLBACK_SCHEMES = [
    {"scheme_id": "SCH-NLY",  "name": "Namo Lakshmi Yojana", "department": "Education", "payout_frequency": "ANNUAL", "amount": 25000, "eligibility_rules": {"min_attendance_pct": 80, "gender_target": "F", "min_class": 9, "max_class": 12}, "mutual_exclusions": ["SCH-NSVSY", "SCH-POST_MATRIC_ST"], "status": "ACTIVE", "beneficiary_count": 4210, "total_disbursed": 105250000},
    {"scheme_id": "SCH-NSVSY","name": "Namo Saraswati Vigyan Sadhana Yojana", "department": "Education", "payout_frequency": "ANNUAL", "amount": 10000, "eligibility_rules": {"min_attendance_pct": 75, "gender_target": "F", "stream": "SCIENCE"}, "mutual_exclusions": ["SCH-NLY"], "status": "ACTIVE", "beneficiary_count": 1880, "total_disbursed": 18800000},
    {"scheme_id": "SCH-MGMS", "name": "Mukhyamantri Gyan Sadhana Merit Scholarship", "department": "Education", "payout_frequency": "ANNUAL", "amount": 20000, "eligibility_rules": {"min_attendance_pct": 85, "gender_target": "ALL", "min_merit_rank": 1, "max_merit_rank": 100}, "mutual_exclusions": [], "status": "ACTIVE", "beneficiary_count": 1997, "total_disbursed": 39940000},
    {"scheme_id": "SCH-POST_MATRIC_ST", "name": "Post Matric Scholarship (ST)", "department": "Social Justice & Empowerment", "payout_frequency": "ANNUAL", "amount": 15000, "eligibility_rules": {"min_attendance_pct": 70, "gender_target": "ALL", "caste_category": "ST"}, "mutual_exclusions": ["SCH-NLY"], "status": "ACTIVE", "beneficiary_count": 890, "total_disbursed": 13350000},
]

_FALLBACK_DISTRICT_STATS = [
    {"district": "Ahmedabad", "total_flags": 24, "deceased": 8, "duplicate": 3, "undrawn": 10, "cross_scheme": 3, "amount_at_risk": 520000, "beneficiaries": 1240},
    {"district": "Surat", "total_flags": 22, "deceased": 7, "duplicate": 4, "undrawn": 9, "cross_scheme": 2, "amount_at_risk": 490000, "beneficiaries": 1100},
    {"district": "Vadodara", "total_flags": 18, "deceased": 5, "duplicate": 2, "undrawn": 8, "cross_scheme": 3, "amount_at_risk": 380000, "beneficiaries": 920},
    {"district": "Rajkot", "total_flags": 15, "deceased": 4, "duplicate": 2, "undrawn": 7, "cross_scheme": 2, "amount_at_risk": 320000, "beneficiaries": 780},
    {"district": "Gandhinagar", "total_flags": 14, "deceased": 3, "duplicate": 2, "undrawn": 7, "cross_scheme": 2, "amount_at_risk": 295000, "beneficiaries": 710},
    {"district": "Tapi", "total_flags": 14, "deceased": 5, "duplicate": 1, "undrawn": 6, "cross_scheme": 2, "amount_at_risk": 280000, "beneficiaries": 620},
    {"district": "Navsari", "total_flags": 11, "deceased": 3, "duplicate": 2, "undrawn": 5, "cross_scheme": 1, "amount_at_risk": 230000, "beneficiaries": 560},
    {"district": "Valsad", "total_flags": 11, "deceased": 4, "duplicate": 1, "undrawn": 5, "cross_scheme": 1, "amount_at_risk": 225000, "beneficiaries": 540},
    {"district": "Dahod", "total_flags": 9, "deceased": 3, "duplicate": 1, "undrawn": 4, "cross_scheme": 1, "amount_at_risk": 185000, "beneficiaries": 490},
    {"district": "Banaskantha", "total_flags": 8, "deceased": 2, "duplicate": 1, "undrawn": 4, "cross_scheme": 1, "amount_at_risk": 165000, "beneficiaries": 430},
    {"district": "Mehsana", "total_flags": 7, "deceased": 2, "duplicate": 1, "undrawn": 3, "cross_scheme": 1, "amount_at_risk": 142000, "beneficiaries": 380},
    {"district": "Kheda", "total_flags": 7, "deceased": 2, "duplicate": 1, "undrawn": 3, "cross_scheme": 1, "amount_at_risk": 138000, "beneficiaries": 360},
    {"district": "Anand", "total_flags": 6, "deceased": 2, "duplicate": 1, "undrawn": 2, "cross_scheme": 1, "amount_at_risk": 125000, "beneficiaries": 340},
    {"district": "Patan", "total_flags": 6, "deceased": 1, "duplicate": 1, "undrawn": 3, "cross_scheme": 1, "amount_at_risk": 118000, "beneficiaries": 310},
    {"district": "Bharuch", "total_flags": 6, "deceased": 2, "duplicate": 0, "undrawn": 3, "cross_scheme": 1, "amount_at_risk": 115000, "beneficiaries": 290},
    {"district": "Narmada", "total_flags": 5, "deceased": 2, "duplicate": 0, "undrawn": 2, "cross_scheme": 1, "amount_at_risk": 100000, "beneficiaries": 260},
    {"district": "Surendranagar", "total_flags": 5, "deceased": 1, "duplicate": 1, "undrawn": 2, "cross_scheme": 1, "amount_at_risk": 98000, "beneficiaries": 250},
    {"district": "Amreli", "total_flags": 4, "deceased": 1, "duplicate": 0, "undrawn": 2, "cross_scheme": 1, "amount_at_risk": 82000, "beneficiaries": 220},
    {"district": "Bhavnagar", "total_flags": 4, "deceased": 1, "duplicate": 1, "undrawn": 2, "cross_scheme": 0, "amount_at_risk": 80000, "beneficiaries": 210},
    {"district": "Sabarkantha", "total_flags": 4, "deceased": 1, "duplicate": 0, "undrawn": 2, "cross_scheme": 1, "amount_at_risk": 78000, "beneficiaries": 200},
    {"district": "Junagadh", "total_flags": 4, "deceased": 1, "duplicate": 0, "undrawn": 2, "cross_scheme": 1, "amount_at_risk": 76000, "beneficiaries": 195},
    {"district": "Aravalli", "total_flags": 3, "deceased": 1, "duplicate": 0, "undrawn": 2, "cross_scheme": 0, "amount_at_risk": 62000, "beneficiaries": 170},
    {"district": "Mahisagar", "total_flags": 3, "deceased": 1, "duplicate": 0, "undrawn": 1, "cross_scheme": 1, "amount_at_risk": 60000, "beneficiaries": 160},
    {"district": "Panch Mahals", "total_flags": 3, "deceased": 1, "duplicate": 0, "undrawn": 2, "cross_scheme": 0, "amount_at_risk": 58000, "beneficiaries": 155},
    {"district": "Kutch", "total_flags": 3, "deceased": 1, "duplicate": 0, "undrawn": 1, "cross_scheme": 1, "amount_at_risk": 55000, "beneficiaries": 140},
    {"district": "Morbi", "total_flags": 2, "deceased": 0, "duplicate": 1, "undrawn": 1, "cross_scheme": 0, "amount_at_risk": 42000, "beneficiaries": 120},
    {"district": "Devbhoomi Dwarka", "total_flags": 2, "deceased": 1, "duplicate": 0, "undrawn": 1, "cross_scheme": 0, "amount_at_risk": 40000, "beneficiaries": 110},
    {"district": "Gir Somnath", "total_flags": 2, "deceased": 0, "duplicate": 0, "undrawn": 2, "cross_scheme": 0, "amount_at_risk": 38000, "beneficiaries": 105},
    {"district": "Porbandar", "total_flags": 2, "deceased": 1, "duplicate": 0, "undrawn": 1, "cross_scheme": 0, "amount_at_risk": 36000, "beneficiaries": 98},
    {"district": "Botad", "total_flags": 1, "deceased": 0, "duplicate": 0, "undrawn": 1, "cross_scheme": 0, "amount_at_risk": 22000, "beneficiaries": 78},
    {"district": "Chhota Udaipur", "total_flags": 1, "deceased": 0, "duplicate": 1, "undrawn": 0, "cross_scheme": 0, "amount_at_risk": 18000, "beneficiaries": 65},
    {"district": "Jamnagar", "total_flags": 1, "deceased": 0, "duplicate": 0, "undrawn": 1, "cross_scheme": 0, "amount_at_risk": 15000, "beneficiaries": 60},
    {"district": "Dang", "total_flags": 0, "deceased": 0, "duplicate": 0, "undrawn": 0, "cross_scheme": 0, "amount_at_risk": 0, "beneficiaries": 42},
]

_FALLBACK_USER = {
    "user_id": "USR-GJ-001",
    "full_name": "Karan Patel",
    "aadhaar_display": "XXXX-XXXX-4964",
    "phone": "+91 98765 43210",
    "demographics": {"district": "Ahmedabad", "taluka": "Sanand", "gender": "M", "dob": "2006-05-14", "category": "OBC"},
    "bank": {"bank": "SBI", "account_display": "XXXXXX3421", "ifsc": "SBIN0001234"},
    "kyc_profile": {
        "is_kyc_compliant": True,
        "last_kyc_date": "2026-03-01",
        "kyc_expiry_date": "2026-06-01",
        "dynamic_validity_days": 90,
        "kyc_method": "BIOMETRIC_OR_OTP",
        "days_remaining": 44,
    },
    "registered_schemes": [
        {"scheme_id": "SCH-MGMS", "name": "Mukhyamantri Gyan Sadhana Merit Scholarship", "status": "ACTIVE", "registration_date": "2025-08-15", "amount": 20000, "last_payment": "2025-11-01", "next_payment": "2026-04-01"},
        {"scheme_id": "SCH-NLY", "name": "Namo Lakshmi Yojana", "status": "PENDING_VERIFICATION", "registration_date": "2026-01-10", "amount": 25000, "last_payment": None, "next_payment": None},
    ],
}


# =============================================================================
# ANALYSIS
# =============================================================================

@app.post("/api/run-analysis")
async def run_analysis(body: dict):
    global _mongo_ok
    start = time.time()

    raw_flags = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(detect_deceased),
            executor.submit(detect_duplicates),
            executor.submit(detect_undrawn),
            executor.submit(detect_cross_scheme),
        ]
        for future in futures:
            raw_flags.extend(future.result())

    enriched_flags = []
    for raw in raw_flags:
        score, label, action = compute_risk_score(raw)
        try:
            evidence = generate_evidence(raw) if generate_evidence else _fallback_evidence(raw)
        except Exception:
            evidence = _fallback_evidence(raw)

        enriched_flags.append({
            **raw,
            "risk_score": score,
            "risk_label": label,
            "evidence": evidence,
            "recommended_action": action,
            "status": "OPEN",
        })

    enriched_flags.sort(key=lambda x: x["risk_score"], reverse=True)

    _flag_store.clear()
    for idx, flag in enumerate(enriched_flags, start=1):
        flag_id = f"F-{idx:04d}"
        flag["flag_id"] = flag_id
        _flag_store[flag_id] = flag

    # Persist to MongoDB
    col = _get_col("flags")
    if col is not None:
        try:
            col.delete_many({})
            if enriched_flags:
                docs = [{k: v for k, v in f.items() if k != "_id"} for f in enriched_flags]
                col.insert_many(docs)
        except Exception as e:
            print(f"  [api] MongoDB write error: {e}")

        # Seed investigations from flags if collection empty
        inv_col = _get_col("investigations")
        if inv_col is not None and not _col_has_data(inv_col):
            _seed_investigations_from_flags(inv_col, enriched_flags)

    elapsed = time.time() - start
    data = load_all()

    return {
        "run_id": body.get("run_id", str(uuid.uuid4())),
        "total_transactions": len(data["payments"]),
        "flagged_count": len(enriched_flags),
        "processing_time_seconds": round(elapsed, 2),
        "flags": enriched_flags,
    }


def _seed_investigations_from_flags(inv_col, flags):
    """Create investigation documents from the top flagged cases."""
    docs = []
    for i, flag in enumerate(flags[:20], start=6):  # skip IDs 1-5 used by fallback
        docs.append({
            "case_id": f"CASE-2026-{i:03d}",
            "anomaly_type": flag.get("leakage_type", "UNKNOWN"),
            "target_entity": {
                "entity_type": "USER",
                "entity_id": flag.get("beneficiary_id", ""),
                "name": flag.get("beneficiary_name", ""),
            },
            "district": flag.get("district", ""),
            "scheme": flag.get("scheme", ""),
            "amount": flag.get("payment_amount", 0),
            "status": "OPEN",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "workflow": {"assigned_dfo_id": "OFF-1042", "assigned_verifier_id": None, "assigned_auditor_id": None},
            "field_report": None,
        })
    if docs:
        try:
            inv_col.insert_many(docs)
        except Exception:
            pass


# =============================================================================
# FLAGS CRUD
# =============================================================================

@app.get("/api/flags")
async def get_flags():
    # Try MongoDB first
    col = _get_col("flags")
    if col is not None and _col_has_data(col):
        try:
            return list(col.find({}, {"_id": 0}).sort("risk_score", -1))
        except Exception:
            pass
    return sorted(_flag_store.values(), key=lambda x: x.get("risk_score", 0), reverse=True)


@app.get("/api/flag/{flag_id}")
async def get_flag(flag_id: str):
    col = _get_col("flags")
    if col is not None:
        try:
            doc = col.find_one({"flag_id": flag_id}, {"_id": 0})
            if doc:
                return doc
        except Exception:
            pass
    if flag_id not in _flag_store:
        raise HTTPException(404, "Flag not found")
    return _flag_store[flag_id]


@app.patch("/api/flag/{flag_id}/status")
async def update_flag_status(flag_id: str, body: dict):
    valid = {"OPEN", "ASSIGNED", "RESOLVED"}
    new_status = body.get("status")
    if new_status not in valid:
        raise HTTPException(400, f"Status must be one of {valid}")

    # MongoDB
    col = _get_col("flags")
    if col is not None:
        try:
            result = col.update_one({"flag_id": flag_id}, {"$set": {"status": new_status}})
            if result.matched_count == 0 and flag_id not in _flag_store:
                raise HTTPException(404, "Flag not found")
        except HTTPException:
            raise
        except Exception:
            pass

    if flag_id in _flag_store:
        _flag_store[flag_id]["status"] = new_status
        return _flag_store[flag_id]

    return {"flag_id": flag_id, "status": new_status}


# =============================================================================
# STATS
# =============================================================================

@app.get("/api/stats")
async def get_stats():
    flags = []
    col = _get_col("flags")
    if col is not None and _col_has_data(col):
        try:
            flags = list(col.find({}, {"_id": 0}))
        except Exception:
            pass
    if not flags:
        flags = list(_flag_store.values())

    by_type = defaultdict(int)
    by_district = defaultdict(int)
    by_scheme = defaultdict(int)
    total_at_risk = 0

    for flag in flags:
        by_type[flag.get("leakage_type", "UNKNOWN")] += 1
        by_district[flag.get("district", "Unknown")] += 1
        scheme = flag.get("scheme", "")
        for s in (scheme.split("+") if isinstance(scheme, str) and "+" in scheme else [scheme]):
            if s:
                by_scheme[s.strip()] += 1
        total_at_risk += flag.get("payment_amount", 0) or 0

    return {
        "by_leakage_type": dict(by_type),
        "by_district": dict(by_district),
        "by_scheme": dict(by_scheme),
        "total_amount_at_risk": total_at_risk,
    }


# =============================================================================
# DISTRICT STATS (State Admin Heatmap)
# =============================================================================

@app.get("/api/district-stats")
async def get_district_stats():
    """
    Returns per-district flag breakdown.
    If flags exist (MongoDB or in-memory), derives stats live.
    Otherwise returns static fallback data.
    """
    flags = []
    col = _get_col("flags")
    if col is not None and _col_has_data(col):
        try:
            flags = list(col.find({}, {"_id": 0}))
        except Exception:
            pass
    if not flags:
        flags = list(_flag_store.values())

    if flags:
        # Derive from real flags
        district_map: dict = {}
        for flag in flags:
            d = flag.get("district", "Unknown")
            if d not in district_map:
                district_map[d] = {"district": d, "total_flags": 0, "deceased": 0, "duplicate": 0, "undrawn": 0, "cross_scheme": 0, "amount_at_risk": 0, "beneficiaries": 0}
            district_map[d]["total_flags"] += 1
            district_map[d]["amount_at_risk"] += flag.get("payment_amount", 0) or 0
            lt = flag.get("leakage_type", "")
            if lt == "DECEASED":   district_map[d]["deceased"] += 1
            elif lt == "DUPLICATE": district_map[d]["duplicate"] += 1
            elif lt == "UNDRAWN":   district_map[d]["undrawn"] += 1
            elif lt == "CROSS_SCHEME": district_map[d]["cross_scheme"] += 1

        # Merge with fallback for districts with no flags
        existing = set(district_map.keys())
        for item in _FALLBACK_DISTRICT_STATS:
            if item["district"] not in existing:
                district_map[item["district"]] = {**item, "total_flags": 0, "amount_at_risk": 0}
            else:
                # Inherit beneficiary count from fallback
                district_map[item["district"]]["beneficiaries"] = item["beneficiaries"]

        return sorted(district_map.values(), key=lambda x: x["total_flags"], reverse=True)

    return _FALLBACK_DISTRICT_STATS


# =============================================================================
# INVESTIGATIONS (DFO / Audit)
# =============================================================================

@app.get("/api/investigations")
async def list_investigations(
    status: Optional[str] = None,
    district: Optional[str] = None,
    limit: int = Query(50, le=200),
):
    col = _get_col("investigations")
    if col is not None and _col_has_data(col):
        try:
            query = {}
            if status:
                query["status"] = status
            if district:
                query["district"] = district
            return list(col.find(query, {"_id": 0}).limit(limit))
        except Exception:
            pass

    # Fallback — combine static + flag-derived
    results = list(_FALLBACK_INVESTIGATIONS)

    # Add more from flag store
    for flag in list(_flag_store.values())[:30]:
        fid = flag.get("flag_id", "")
        results.append({
            "case_id": f"CASE-FLAG-{fid}",
            "anomaly_type": flag.get("leakage_type", ""),
            "target_entity": {"entity_type": "USER", "entity_id": flag.get("beneficiary_id", ""), "name": flag.get("beneficiary_name", "")},
            "district": flag.get("district", ""),
            "scheme": flag.get("scheme", ""),
            "amount": flag.get("payment_amount", 0),
            "status": flag.get("status", "OPEN"),
            "created_at": datetime.utcnow().isoformat() + "Z",
            "workflow": {"assigned_dfo_id": "OFF-1042", "assigned_verifier_id": None, "assigned_auditor_id": None},
            "field_report": None,
        })

    if status:
        results = [r for r in results if r.get("status") == status]
    if district:
        results = [r for r in results if r.get("district") == district]
    return results[:limit]


@app.get("/api/investigations/{case_id}")
async def get_investigation(case_id: str):
    col = _get_col("investigations")
    if col is not None:
        try:
            doc = col.find_one({"case_id": case_id}, {"_id": 0})
            if doc:
                return doc
        except Exception:
            pass

    for inv in _FALLBACK_INVESTIGATIONS:
        if inv["case_id"] == case_id:
            return inv
    raise HTTPException(404, f"Investigation {case_id} not found")


@app.patch("/api/investigations/{case_id}/assign")
async def assign_investigation(case_id: str, body: dict):
    verifier_id = body.get("verifier_id")
    if not verifier_id:
        raise HTTPException(400, "verifier_id required")

    update = {
        "status": "ASSIGNED_TO_VERIFIER",
        "workflow.assigned_verifier_id": verifier_id,
    }

    col = _get_col("investigations")
    if col is not None:
        try:
            col.update_one({"case_id": case_id}, {"$set": update}, upsert=False)
            doc = col.find_one({"case_id": case_id}, {"_id": 0})
            if doc:
                return doc
        except Exception:
            pass

    # In-memory fallback
    for inv in _FALLBACK_INVESTIGATIONS:
        if inv["case_id"] == case_id:
            inv["status"] = "ASSIGNED_TO_VERIFIER"
            inv["workflow"]["assigned_verifier_id"] = verifier_id
            return inv

    return {"case_id": case_id, "status": "ASSIGNED_TO_VERIFIER", "verifier_id": verifier_id}


# =============================================================================
# EVIDENCE SUBMISSION (Scheme Verifier)
# =============================================================================

@app.post("/api/evidence/{case_id}")
async def submit_evidence(case_id: str, body: dict):
    """Submit field evidence for a case. Updates investigation status."""
    field_report = {
        "verifier_notes": body.get("verifier_notes", ""),
        "gps_coordinates": body.get("gps_coordinates"),
        "photo_url": body.get("photo_url"),
        "finding_category": body.get("finding_category"),
        "beneficiary_present": body.get("beneficiary_present"),
        "visit_date": body.get("visit_date"),
        "verification_score": body.get("verification_score"),
        "ai_verification_match": body.get("ai_verification_match", False),
        "submission_timestamp": datetime.utcnow().isoformat() + "Z",
        "submitted_by": body.get("verifier_id"),
    }

    col = _get_col("investigations")
    if col is not None:
        try:
            col.update_one(
                {"case_id": case_id},
                {"$set": {"status": "VERIFICATION_SUBMITTED", "field_report": field_report}},
                upsert=False,
            )
            doc = col.find_one({"case_id": case_id}, {"_id": 0})
            if doc:
                return {"success": True, "case": doc}
        except Exception:
            pass

    # Fallback — update static data in memory
    for inv in _FALLBACK_INVESTIGATIONS:
        if inv["case_id"] == case_id:
            inv["status"] = "VERIFICATION_SUBMITTED"
            inv["field_report"] = field_report
            return {"success": True, "case": inv}

    return {"success": True, "case_id": case_id, "status": "VERIFICATION_SUBMITTED", "field_report": field_report}


# =============================================================================
# AUDIT OFFICER
# =============================================================================

@app.get("/api/audit/pending")
async def audit_pending():
    """Cases with status VERIFICATION_SUBMITTED awaiting audit review."""
    col = _get_col("investigations")
    if col is not None and _col_has_data(col):
        try:
            return list(col.find({"status": "VERIFICATION_SUBMITTED"}, {"_id": 0}))
        except Exception:
            pass
    return [i for i in _FALLBACK_INVESTIGATIONS if i["status"] == "VERIFICATION_SUBMITTED"]


@app.post("/api/audit/{case_id}/decide")
async def audit_decide(case_id: str, body: dict):
    decision = body.get("decision")  # LEGITIMATE or FRAUD_CONFIRMED
    notes = body.get("notes", "")
    valid = {"LEGITIMATE", "FRAUD_CONFIRMED"}
    if decision not in valid:
        raise HTTPException(400, f"decision must be one of {valid}")

    new_status = "CLOSED_RESOLVED" if decision == "LEGITIMATE" else "AUDIT_REVIEW"
    update = {
        "status": new_status,
        "audit_report": {
            "final_decision": decision,
            "auditor_notes": notes,
            "decided_at": datetime.utcnow().isoformat() + "Z",
        },
    }

    col = _get_col("investigations")
    if col is not None:
        try:
            col.update_one({"case_id": case_id}, {"$set": update})
            doc = col.find_one({"case_id": case_id}, {"_id": 0})
            if doc:
                return doc
        except Exception:
            pass

    for inv in _FALLBACK_INVESTIGATIONS:
        if inv["case_id"] == case_id:
            inv.update(update)
            return inv

    return {"case_id": case_id, **update}


# =============================================================================
# INSTITUTIONS (Middlemen) — DFO
# =============================================================================

@app.get("/api/institutions")
async def list_institutions(district: Optional[str] = None, flagged_only: bool = False):
    col = _get_col("institutions")
    if col is not None and _col_has_data(col):
        try:
            query = {}
            if district:
                query["district"] = district
            if flagged_only:
                query["risk_profile.is_flagged"] = True
            return list(col.find(query, {"_id": 0}))
        except Exception:
            pass

    results = list(_FALLBACK_INSTITUTIONS)
    if district:
        results = [r for r in results if r.get("district") == district]
    if flagged_only:
        results = [r for r in results if r.get("risk_profile", {}).get("is_flagged")]
    return results


# =============================================================================
# VERIFIERS — DFO
# =============================================================================

@app.get("/api/verifiers")
async def list_verifiers(district: Optional[str] = None):
    col = _get_col("officers")
    if col is not None and _col_has_data(col):
        try:
            query = {"role": "SCHEME_VERIFIER"}
            if district:
                query["district"] = district
            return list(col.find(query, {"_id": 0}))
        except Exception:
            pass
    results = list(_FALLBACK_VERIFIERS)
    if district:
        results = [r for r in results if r.get("district") == district]
    return results


# =============================================================================
# SCHEMES (State Admin Rules Engine)
# =============================================================================

@app.get("/api/schemes")
async def list_schemes():
    col = _get_col("schemes")
    if col is not None and _col_has_data(col):
        try:
            return list(col.find({}, {"_id": 0}))
        except Exception:
            pass
    return list(_FALLBACK_SCHEMES)


@app.patch("/api/schemes/{scheme_id}")
async def update_scheme(scheme_id: str, body: dict):
    col = _get_col("schemes")
    if col is not None:
        try:
            col.update_one({"scheme_id": scheme_id}, {"$set": body}, upsert=False)
            doc = col.find_one({"scheme_id": scheme_id}, {"_id": 0})
            if doc:
                return doc
        except Exception:
            pass

    for s in _FALLBACK_SCHEMES:
        if s["scheme_id"] == scheme_id:
            s.update(body)
            return s

    raise HTTPException(404, f"Scheme {scheme_id} not found")


# =============================================================================
# USER / BENEFICIARY
# =============================================================================

@app.get("/api/user/{user_id}")
async def get_user(user_id: str):
    col = _get_col("users")
    if col is not None:
        try:
            doc = col.find_one({"user_id": user_id}, {"_id": 0})
            if doc:
                return doc
        except Exception:
            pass

    # Try from beneficiaries.json
    data = load_all()
    ben = data.get("beneficiary_by_id", {}).get(user_id)
    if ben:
        return _build_user_profile(ben, data)

    # Default demo user
    return _FALLBACK_USER


@app.post("/api/user/{user_id}/kyc")
async def renew_kyc(user_id: str, body: dict):
    """Record a KYC renewal. Updates expiry date."""
    from datetime import timedelta
    validity_days = body.get("validity_days", 90)
    new_expiry = (datetime.utcnow() + timedelta(days=validity_days)).strftime("%Y-%m-%d")
    today = datetime.utcnow().strftime("%Y-%m-%d")

    kyc_update = {
        "kyc_profile.last_kyc_date": today,
        "kyc_profile.kyc_expiry_date": new_expiry,
        "kyc_profile.days_remaining": validity_days,
        "kyc_profile.is_kyc_compliant": True,
    }

    col = _get_col("users")
    if col is not None:
        try:
            col.update_one({"user_id": user_id}, {"$set": kyc_update}, upsert=False)
            doc = col.find_one({"user_id": user_id}, {"_id": 0})
            if doc:
                return {"success": True, "user": doc}
        except Exception:
            pass

    return {
        "success": True,
        "last_kyc_date": today,
        "kyc_expiry_date": new_expiry,
        "days_remaining": validity_days,
    }


def _build_user_profile(ben: dict, data: dict) -> dict:
    """Build a frontend-ready user profile from raw beneficiary data."""
    from models import compute_scheme_eligibility
    bid = ben.get("beneficiary_id", "")
    payments = data.get("payments_by_id", {}).get(bid, [])
    schemes_taken = sorted({p.get("scheme") for p in payments if p.get("scheme")})
    udise = data.get("udise_by_id", {}).get(bid)
    eligible = compute_scheme_eligibility(ben, udise)

    return {
        "user_id": bid,
        "full_name": ben.get("name", ""),
        "aadhaar_display": "XXXX-XXXX-" + ben.get("aadhaar_hash", "0000")[-4:],
        "phone": "+91 XXXXX XXXXX",
        "demographics": {
            "district": ben.get("district", ""),
            "taluka": ben.get("taluka", ""),
            "gender": ben.get("gender", ""),
            "dob": ben.get("dob", ""),
            "category": ben.get("caste_category", ""),
        },
        "bank": {"bank": "SBI", "account_display": "XXXXXX" + ben.get("bank_account_hash", "0000")[-4:], "ifsc": "SBIN0001234"},
        "kyc_profile": {
            "is_kyc_compliant": not ben.get("is_deceased", False),
            "last_kyc_date": "2026-03-01",
            "kyc_expiry_date": "2026-06-01",
            "dynamic_validity_days": 90,
            "kyc_method": "BIOMETRIC_OR_OTP",
            "days_remaining": 44,
        },
        "registered_schemes": [
            {"scheme_id": f"SCH-{s}", "name": s, "status": "ACTIVE", "registration_date": "2025-08-15", "amount": 20000, "last_payment": None, "next_payment": None}
            for s in schemes_taken
        ],
    }


# =============================================================================
# STUDENTS
# =============================================================================

@app.get("/api/students")
async def list_students(
    district: Optional[str] = None,
    scheme: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(50, le=200),
):
    col = _get_col("students")
    if col is not None and _col_has_data(col):
        try:
            query = {}
            if district:
                query["district"] = district
            if scheme:
                query["schemes_taken"] = scheme
            return list(col.find(query, {"_id": 0}).skip(skip).limit(limit))
        except Exception:
            pass
    return _students_from_cache(district, scheme, None, skip, limit)


@app.get("/api/student/{beneficiary_id}")
async def get_student(beneficiary_id: str):
    col = _get_col("students")
    if col is not None:
        try:
            doc = col.find_one({"beneficiary_id": beneficiary_id}, {"_id": 0})
            if doc:
                return doc
        except Exception:
            pass
    data = load_all()
    ben = data.get("beneficiary_by_id", {}).get(beneficiary_id)
    if not ben:
        raise HTTPException(404, "Student not found")
    return _enrich_student(ben, data)


# =============================================================================
# REPORT
# =============================================================================

@app.get("/api/report", response_class=PlainTextResponse)
async def get_report():
    flags = []
    col = _get_col("flags")
    if col is not None and _col_has_data(col):
        try:
            flags = list(col.find({}, {"_id": 0}))
        except Exception:
            pass
    if not flags:
        flags = list(_flag_store.values())
    try:
        return generate_report(flags) if generate_report else _fallback_report(flags)
    except Exception:
        return _fallback_report(flags)


# =============================================================================
# HEALTH
# =============================================================================

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "mongodb": _mongo_ok,
        "flags_in_memory": len(_flag_store),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# =============================================================================
# HELPERS
# =============================================================================

def _students_from_cache(district, scheme, eligible_for, skip, limit):
    from models import compute_scheme_eligibility
    data = load_all()
    results = []
    for ben in data.get("beneficiaries", []):
        if district and ben.get("district") != district:
            continue
        enriched = _enrich_student(ben, data)
        if scheme and scheme not in enriched.get("schemes_taken", []):
            continue
        if eligible_for and eligible_for not in enriched.get("schemes_eligible", []):
            continue
        results.append(enriched)
    return results[skip: skip + limit]


def _enrich_student(ben: dict, data: dict) -> dict:
    from models import compute_scheme_eligibility
    bid = ben["beneficiary_id"]
    udise = data.get("udise_by_id", {}).get(bid)
    payments = data.get("payments_by_id", {}).get(bid, [])
    taken = sorted({p.get("scheme") for p in payments if p.get("scheme")})
    eligible = sorted(compute_scheme_eligibility(ben, udise))
    not_taken = sorted(set(eligible) - set(taken))
    return {
        "beneficiary_id": bid,
        "name": ben.get("name", ""),
        "gender": ben.get("gender", ""),
        "district": ben.get("district", ""),
        "taluka": ben.get("taluka"),
        "caste_category": ben.get("caste_category"),
        "is_deceased": ben.get("is_deceased", False),
        "udise": {"school_name": udise.get("school_name", ""), "standard": udise.get("standard", 0), "stream": udise.get("stream", ""), "marks_pct": udise.get("marks_pct", 0)} if udise else None,
        "schemes_taken": taken,
        "schemes_eligible": eligible,
        "eligible_but_not_taken": not_taken,
    }


def _fallback_evidence(flag):
    lt = flag.get("leakage_type", "")
    ed = flag.get("evidence_data", {}) or {}
    if lt == "DECEASED":
        return f"Student received ₹{flag.get('payment_amount', 0):,} on {flag.get('payment_date')}. Death registry shows death: {ed.get('death_date')}. Payment {ed.get('days_post_mortem')} days post-mortem."
    if lt == "DUPLICATE":
        return f"Duplicate identity. Primary: {ed.get('primary_name')} ({ed.get('primary_district')}). Method: {ed.get('match_method')}."
    if lt == "UNDRAWN":
        return f"₹{flag.get('payment_amount', 0):,} credited {flag.get('payment_date')} — undrawn for {ed.get('days_pending')} days (threshold: {ed.get('threshold_days')} days)."
    if lt == "CROSS_SCHEME":
        return f"Drawing {ed.get('scheme_a')} (₹{ed.get('amount_a', 0):,}) and {ed.get('scheme_b')} (₹{ed.get('amount_b', 0):,}) simultaneously. Total: ₹{ed.get('total_amount', 0):,}."
    return "Anomaly detected. Manual review required."


def _fallback_report(flags):
    total = sum(f.get("payment_amount", 0) or 0 for f in flags)
    by_type = defaultdict(int)
    for flag in flags:
        by_type[flag.get("leakage_type", "UNKNOWN")] += 1
    lines = [
        "EDUGUARD DBT AUDIT REPORT",
        "=" * 50,
        f"Total Flags: {len(flags)}",
        f"Total Amount at Risk: ₹{total:,}",
        "",
        "BREAKDOWN BY LEAKAGE TYPE:",
    ]
    for lt, count in by_type.items():
        lines.append(f"  {lt}: {count} cases")
    return "\n".join(lines)
