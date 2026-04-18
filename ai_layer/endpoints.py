from fastapi import APIRouter
from .name_normalizer import is_likely_same_person, batch_find_duplicates

router = APIRouter(prefix="/api")

@router.post("/normalize-names")
async def normalize_names(body: dict):
    """
    body: { "name1": "...", "name2": "..." }
    OR
    body: { "names": [{"id": ..., "name": ...}] }  <- for batch
    """
    if "name1" in body and "name2" in body:
        return is_likely_same_person(body["name1"], body["name2"])
    elif "names" in body:
        return batch_find_duplicates(body["names"])
    return {"error": "Provide name1+name2 or names array"}
