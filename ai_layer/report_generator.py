import os
from dotenv import load_dotenv

load_dotenv()
from collections import defaultdict
from datetime import date

GROQ_MODEL = "llama-3.3-70b-versatile"

_client = None

def _get_client():
    """Lazy initialization of Groq client — only created when first needed."""
    global _client
    if _client is None:
        from groq import Groq
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

SCHEME_NAMES = {
    "NLY": "Namo Lakshmi Yojana",
    "NSVSY": "Namo Saraswati Vigyan Sadhana Yojana",
    "MGMS": "Mukhyamantri Gyan Sadhana Merit Scholarship"
}

REPORT_SYSTEM_PROMPT = """You are a senior audit officer writing an official DBT fraud 
monitoring report for the District Finance Officer of Gujarat. Write in formal government 
report style. The report should be clear, factual, and actionable.

Structure:
1. Executive Summary (3–4 sentences)
2. Key Findings by Leakage Type (one paragraph each)
3. District-wise Risk Assessment (top 5 high-risk districts)
4. Priority Action Items (numbered list, max 8 items)
5. Recommendations for System Improvement (3–4 bullet points)

Use Indian number formatting (lakhs/crores where appropriate).
Reference U-DISE and Aadhaar as data verification sources.
Maintain formal government language throughout.
"""

def generate_report(flags: list[dict]) -> str:
    """
    Generate full DFO audit report from all flags.
    """
    # Compute statistics for the prompt
    stats = _compute_stats(flags)
    
    prompt = f"""Generate an EduGuard DBT Audit Report with the following data:

REPORT DATE: {date.today().strftime('%d %B %Y')}
SCHEMES AUDITED: Namo Lakshmi Yojana, Namo Saraswati Vigyan Sadhana Yojana, Mukhyamantri Gyan Sadhana Merit Scholarship
TOTAL TRANSACTIONS ANALYSED: {stats['total_transactions']:,}
TOTAL FLAGS RAISED: {stats['total_flags']}
TOTAL AMOUNT AT RISK: ₹{stats['total_amount']:,} ({stats['total_amount_lakhs']:.1f} Lakhs)

BREAKDOWN BY LEAKAGE TYPE:
- Deceased Beneficiary Payments: {stats['by_type'].get('DECEASED', 0)} cases
- Duplicate Identity: {stats['by_type'].get('DUPLICATE', 0)} cases  
- Undrawn Funds (>60 days): {stats['by_type'].get('UNDRAWN', 0)} cases
- Cross-Scheme Stacking: {stats['by_type'].get('CROSS_SCHEME', 0)} cases

CRITICAL FLAGS (Score 80+): {stats['critical_count']}
HIGH FLAGS (Score 60–79): {stats['high_count']}

TOP 5 HIGH-RISK DISTRICTS:
{stats['top_districts']}

TOP 3 HIGH-VALUE FLAGS:
{stats['top_flags_summary']}

Generate the complete official audit report now."""
    
    try:
        response = _get_client().chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=1500,
            messages=[
                {"role": "system", "content": REPORT_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return _fallback_report(flags, stats)

def _compute_stats(flags):
    by_type = defaultdict(int)
    by_district = defaultdict(int)
    total_amount = 0
    critical = 0
    high = 0
    
    for f in flags:
        by_type[f["leakage_type"]] += 1
        by_district[f["district"]] += 1
        total_amount += f.get("payment_amount", 0) or 0
        if f.get("risk_score", 0) >= 80:
            critical += 1
        elif f.get("risk_score", 0) >= 60:
            high += 1
    
    top_districts = sorted(by_district.items(), key=lambda x: x[1], reverse=True)[:5]
    top_districts_str = "\n".join([f"- {d}: {c} flags" for d, c in top_districts])
    
    top_flags = sorted(flags, key=lambda x: x.get("risk_score", 0), reverse=True)[:3]
    top_flags_summary = "\n".join([
        f"- {f['beneficiary_name']} ({f['leakage_type']}, ₹{f.get('payment_amount',0):,}, Score: {f.get('risk_score',0)})"
        for f in top_flags
    ])
    
    return {
        "total_transactions": 10000,
        "total_flags": len(flags),
        "total_amount": total_amount,
        "total_amount_lakhs": total_amount / 100000,
        "by_type": dict(by_type),
        "critical_count": critical,
        "high_count": high,
        "top_districts": top_districts_str,
        "top_flags_summary": top_flags_summary
    }

def _fallback_report(flags, stats):
    return f"""EDUGUARD DBT AUDIT REPORT
District Finance Officer — Gujarat Education Schemes
Date: {date.today().strftime('%d %B %Y')}
{'='*60}

EXECUTIVE SUMMARY
This audit covers {stats['total_transactions']:,} DBT transactions across Namo Lakshmi Yojana,
Namo Saraswati Vigyan Sadhana Yojana, and Mukhyamantri Gyan Sadhana Merit Scholarship.
{stats['total_flags']} anomalies were detected, with ₹{stats['total_amount_lakhs']:.1f} Lakhs at risk.
Immediate action is required on {stats['critical_count']} critical-severity cases.

FINDINGS BY LEAKAGE TYPE
Deceased Beneficiary: {stats['by_type'].get('DECEASED', 0)} cases
Duplicate Identity: {stats['by_type'].get('DUPLICATE', 0)} cases
Undrawn Funds: {stats['by_type'].get('UNDRAWN', 0)} cases
Cross-Scheme Stacking: {stats['by_type'].get('CROSS_SCHEME', 0)} cases

PRIORITY ACTIONS
1. Freeze all CRITICAL-score payments immediately
2. Initiate recovery proceedings for deceased beneficiary payments
3. Submit duplicate identity cases to UIDAI for Aadhaar verification
4. Issue field verification orders for undrawn funds cases
"""
