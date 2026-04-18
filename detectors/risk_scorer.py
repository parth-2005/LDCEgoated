RISK_WEIGHTS = {
    "DECEASED": {
        "base_score": 85,
        "per_day_post_mortem": 0.1,
        "max_bonus": 10,
    },
    "DUPLICATE": {
        "AADHAAR_EXACT": 78,
        "BANK_ACCOUNT_EXACT": 72,
        "FUZZY_NAME": 55,
    },
    "UNDRAWN": {
        "base_score": 40,
        "per_day_over_threshold": 0.3,
        "max_bonus": 30,
    },
    "CROSS_SCHEME": {
        "base_score": 65,
    },
}

RECOMMENDED_ACTIONS = {
    "DECEASED": "Freeze payment immediately. Initiate recovery proceedings. Refer to District Collector.",
    "DUPLICATE": "Suspend duplicate account. Cross-verify Aadhaar with UIDAI. Field verification required.",
    "UNDRAWN": "Contact beneficiary within 7 days. If unreachable, initiate school verification visit.",
    "CROSS_SCHEME": "Suspend lower-priority scheme payment. Allow beneficiary 30 days to appeal.",
}


def compute_risk_score(flag_dict):
    lt = flag_dict["leakage_type"]
    ed = flag_dict["evidence_data"]

    if lt == "DECEASED":
        days = ed.get("days_post_mortem", 0)
        bonus = min(
            days * RISK_WEIGHTS["DECEASED"]["per_day_post_mortem"],
            RISK_WEIGHTS["DECEASED"]["max_bonus"],
        )
        score = RISK_WEIGHTS["DECEASED"]["base_score"] + bonus

    elif lt == "DUPLICATE":
        method = ed.get("match_method", "FUZZY_NAME")
        score = RISK_WEIGHTS["DUPLICATE"].get(method, 55)

    elif lt == "UNDRAWN":
        days_over = max(0, ed.get("days_pending", 60) - 60)
        bonus = min(
            days_over * RISK_WEIGHTS["UNDRAWN"]["per_day_over_threshold"],
            RISK_WEIGHTS["UNDRAWN"]["max_bonus"],
        )
        score = RISK_WEIGHTS["UNDRAWN"]["base_score"] + bonus

    elif lt == "CROSS_SCHEME":
        score = RISK_WEIGHTS["CROSS_SCHEME"]["base_score"]

    else:
        score = 50

    score = min(100, round(score))

    if score >= 80:
        label = "CRITICAL"
    elif score >= 60:
        label = "HIGH"
    elif score >= 40:
        label = "MEDIUM"
    else:
        label = "LOW"

    return score, label, RECOMMENDED_ACTIONS.get(lt, "Manual review required.")
