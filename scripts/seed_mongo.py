"""
scripts/seed_mongo.py
─────────────────────────────────────────────────────
Pushes all local JSON data files into MongoDB Atlas.

Usage:
    python scripts/seed_mongo.py                    # reads MONGO_URI from .env
    python scripts/seed_mongo.py --uri "mongodb+srv://..."  # or pass directly

Collections created / replaced:
    eduguard_dbt.students           ← beneficiaries.json
    eduguard_dbt.payments           ← payment_ledger.json
    eduguard_dbt.death_registry     ← death_registry.json
    eduguard_dbt.scheme_rules       ← scheme_rules.json
    eduguard_dbt.udise              ← udise_records.json (attached to students)

Run this once after you get the Atlas URI and it will be live for the backend.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

# ─── CLI ──────────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Seed EduGuard JSON data → MongoDB Atlas")
parser.add_argument("--uri", default=None, help="MongoDB Atlas connection string (overrides .env)")
parser.add_argument("--db", default="eduguard_dbt", help="Database name (default: eduguard_dbt)")
parser.add_argument("--drop", action="store_true", default=True, help="Drop collections before inserting (default: True)")
args = parser.parse_args()

# Load .env manually if needed
if not args.uri:
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    args.uri = os.getenv("MONGO_URI")

if not args.uri:
    print("❌  No MONGO_URI found.")
    print()
    print("   Option 1: Add to your .env file:")
    print("       MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/")
    print()
    print("   Option 2: Pass directly:")
    print("       python scripts/seed_mongo.py --uri \"mongodb+srv://...\"")
    sys.exit(1)

print(f"📡  Connecting to MongoDB…")
print(f"    URI : {args.uri[:40]}…")
print(f"    DB  : {args.db}")

try:
    from pymongo import MongoClient, UpdateOne
    from pymongo.errors import ConnectionFailure, BulkWriteError
except ImportError:
    print("❌  pymongo not installed. Run:  pip install 'pymongo[srv]'")
    sys.exit(1)

try:
    client = MongoClient(
        args.uri,
        serverSelectionTimeoutMS=10_000,
        connectTimeoutMS=10_000,
    )
    client.admin.command("ping")
    print("✅  Connected!\n")
except ConnectionFailure as e:
    print(f"❌  Connection failed: {e}")
    print()
    print("   Check that:")
    print("   1. Your Atlas cluster is running")
    print("   2. Your IP is whitelisted in Atlas → Network Access")
    print("   3. The URI is correct  (mongodb+srv://user:pass@cluster.mongodb.net/)")
    sys.exit(1)

db = client[args.db]

# ─── Helper ───────────────────────────────────────────────────────────────────
def load_json(filename: str):
    path = DATA_DIR / filename
    if not path.exists():
        print(f"   ⚠️  {filename} not found — skipping")
        return None
    print(f"   📂 Loading {filename}  ({path.stat().st_size // 1024} KB)…", end="", flush=True)
    data = json.loads(path.read_text(encoding="utf-8"))
    print(f"  {len(data) if isinstance(data, list) else '1'} records")
    return data


def seed_collection(col_name: str, docs, id_field: str = None):
    """Drop + insert or upsert a collection."""
    col = db[col_name]
    if args.drop:
        col.drop()
        print(f"   🗑️  Dropped  {col_name}")

    if not docs:
        return

    if isinstance(docs, dict):
        docs = [docs]

    t0 = time.time()
    # Bulk insert in chunks of 500
    chunk_size = 500
    total = 0
    for i in range(0, len(docs), chunk_size):
        chunk = docs[i : i + chunk_size]
        try:
            col.insert_many(chunk, ordered=False)
            total += len(chunk)
        except BulkWriteError as bwe:
            # Ignore duplicate key errors, count what succeeded
            total += bwe.details.get("nInserted", 0)
    elapsed = time.time() - t0
    print(f"   ✅  {col_name}: {total} docs inserted  ({elapsed:.1f}s)")


# ─── Seed each collection ─────────────────────────────────────────────────────
print("=" * 56)
print("Seeding collections…")
print("=" * 56)

# 1. beneficiaries → students
beneficiaries = load_json("beneficiaries.json")
seed_collection("students", beneficiaries, "beneficiary_id")

# 2. payment_ledger → payments
payments = load_json("payment_ledger.json")
seed_collection("payments", payments, "payment_id")

# 3. death_registry
deaths = load_json("death_registry.json")
seed_collection("death_registry", deaths, "aadhaar_hash")

# 4. udise_records — stored as its own collection too (for fast joins)
udise = load_json("udise_records.json")
seed_collection("udise", udise, "beneficiary_id")

# 5. scheme_rules — nested config object
scheme_rules_raw = load_json("scheme_rules.json")
if isinstance(scheme_rules_raw, dict):
    # Expand the nested schemes dict into individual docs
    schemes_dict = scheme_rules_raw.get("schemes", {})
    scheme_rules = [{"scheme_code": k, **v} for k, v in schemes_dict.items()]
    # Also store one config doc with global settings
    config_doc = {
        "scheme_code": "_config",
        "undrawn_threshold_days": scheme_rules_raw.get("undrawn_threshold_days", 60),
        "cross_scheme_forbidden_pairs": scheme_rules_raw.get("cross_scheme_forbidden_pairs", []),
    }
    scheme_rules.append(config_doc)
else:
    scheme_rules = scheme_rules_raw if isinstance(scheme_rules_raw, list) else []
seed_collection("scheme_rules", scheme_rules, "scheme_code")

# ─── Create indexes ───────────────────────────────────────────────────────────
print("\nCreating indexes…")

db["students"].create_index("beneficiary_id", unique=True, background=True)
db["students"].create_index("aadhaar_hash", background=True)
db["students"].create_index("district", background=True)
print("   ✅  students indexes")

db["payments"].create_index("payment_id", unique=True, background=True)
db["payments"].create_index("beneficiary_id", background=True)
db["payments"].create_index("scheme", background=True)
print("   ✅  payments indexes")

db["death_registry"].create_index("aadhaar_hash", unique=True, background=True)
print("   ✅  death_registry indexes")

db["udise"].create_index("beneficiary_id", unique=True, background=True)
print("   ✅  udise indexes")

# ─── Summary ──────────────────────────────────────────────────────────────────
print()
print("=" * 56)
print("📊  Collection sizes:")
for col_name in ["students", "payments", "death_registry", "udise", "scheme_rules"]:
    count = db[col_name].count_documents({})
    print(f"    {col_name:<20} {count:>6} documents")

print()
print("✅  All done! Add this to your .env:")
print(f"    MONGO_URI={args.uri}")
print()
print("Next: restart uvicorn — the backend will auto-use MongoDB now.")
client.close()
