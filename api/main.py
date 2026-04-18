import time
import uuid
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from detectors.cross_scheme_detector import detect_cross_scheme
from detectors.data_loader import load_all
from detectors.deceased_detector import detect_deceased
from detectors.duplicate_detector import detect_duplicates
from detectors.risk_scorer import compute_risk_score
from detectors.undrawn_detector import detect_undrawn

try:
    from ai_layer.evidence_generator import generate_evidence
except Exception:  # pragma: no cover
    generate_evidence = None

try:
    from ai_layer.report_generator import generate_report
except Exception:  # pragma: no cover
    generate_report = None

app = FastAPI(title="EduGuard DBT API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_flag_store = {}


@app.on_event("startup")
async def startup():
    load_all()


@app.post("/api/run-analysis")
async def run_analysis(body: dict):
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

        enriched_flags.append(
            {
                **raw,
                "risk_score": score,
                "risk_label": label,
                "evidence": evidence,
                "recommended_action": action,
                "status": "OPEN",
            }
        )

    enriched_flags.sort(key=lambda x: x["risk_score"], reverse=True)

    _flag_store.clear()
    for idx, flag in enumerate(enriched_flags, start=1):
        flag_id = f"F-{idx:04d}"
        flag["flag_id"] = flag_id
        _flag_store[flag_id] = flag

    elapsed = time.time() - start
    data = load_all()

    return {
        "run_id": body.get("run_id", str(uuid.uuid4())),
        "total_transactions": len(data["payments"]),
        "flagged_count": len(enriched_flags),
        "processing_time_seconds": round(elapsed, 2),
        "flags": enriched_flags,
    }


@app.get("/api/flags")
async def get_flags():
    return sorted(_flag_store.values(), key=lambda x: x["risk_score"], reverse=True)


@app.get("/api/flag/{flag_id}")
async def get_flag(flag_id: str):
    if flag_id not in _flag_store:
        raise HTTPException(404, "Flag not found")
    return _flag_store[flag_id]


@app.patch("/api/flag/{flag_id}/status")
async def update_flag_status(flag_id: str, body: dict):
    if flag_id not in _flag_store:
        raise HTTPException(404, "Flag not found")

    valid_statuses = {"OPEN", "ASSIGNED", "RESOLVED"}
    new_status = body.get("status")
    if new_status not in valid_statuses:
        raise HTTPException(400, f"Status must be one of {valid_statuses}")

    _flag_store[flag_id]["status"] = new_status
    return _flag_store[flag_id]


@app.get("/api/stats")
async def get_stats():
    flags = list(_flag_store.values())
    by_type = defaultdict(int)
    by_district = defaultdict(int)
    by_scheme = defaultdict(int)
    total_at_risk = 0

    for flag in flags:
        by_type[flag["leakage_type"]] += 1
        by_district[flag["district"]] += 1
        by_scheme[flag["scheme"]] += 1
        total_at_risk += flag.get("payment_amount", 0) or 0

    return {
        "by_leakage_type": dict(by_type),
        "by_district": dict(by_district),
        "by_scheme": dict(by_scheme),
        "total_amount_at_risk": total_at_risk,
    }


@app.get("/api/report", response_class=PlainTextResponse)
async def get_report():
    flags = list(_flag_store.values())
    try:
        return generate_report(flags) if generate_report else _fallback_report(flags)
    except Exception:
        return _fallback_report(flags)


def _fallback_evidence(flag):
    leakage_type = flag["leakage_type"]
    evidence_data = flag["evidence_data"]

    if leakage_type == "DECEASED":
        return (
            f"Student received Rs {flag['payment_amount']:,} under {flag['scheme']} on "
            f"{flag['payment_date']}. Death registry shows date of death: "
            f"{evidence_data['death_date']}. Payment issued "
            f"{evidence_data['days_post_mortem']} days post-mortem."
        )

    if leakage_type == "DUPLICATE":
        return (
            "Duplicate identity detected. "
            f"Primary beneficiary: {evidence_data.get('primary_name')} "
            f"({evidence_data.get('primary_district')}). "
            f"Match method: {evidence_data.get('match_method')}."
        )

    if leakage_type == "UNDRAWN":
        return (
            f"Rs {flag['payment_amount']:,} credited on {flag['payment_date']} remains "
            f"undrawn after {evidence_data['days_pending']} days. "
            f"Threshold: {evidence_data['threshold_days']} days."
        )

    if leakage_type == "CROSS_SCHEME":
        return (
            f"Student drawing both {evidence_data['scheme_a']} (Rs {evidence_data['amount_a']:,}) and "
            f"{evidence_data['scheme_b']} (Rs {evidence_data['amount_b']:,}) simultaneously. "
            f"Total: Rs {evidence_data['total_amount']:,}. {evidence_data['rule_violated']}."
        )

    return "Anomaly detected. Manual review required."


def _fallback_report(flags):
    total = sum(flag.get("payment_amount", 0) or 0 for flag in flags)
    by_type = defaultdict(int)
    for flag in flags:
        by_type[flag["leakage_type"]] += 1

    lines = [
        "EDUGUARD DBT AUDIT REPORT",
        "=" * 50,
        f"Total Flags: {len(flags)}",
        f"Total Amount at Risk: Rs {total:,}",
        "",
        "BREAKDOWN BY LEAKAGE TYPE:",
    ]
    for leakage_type, count in by_type.items():
        lines.append(f"  {leakage_type}: {count} cases")
    return "\n".join(lines)
