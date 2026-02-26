import asyncio
from typing import Optional

from fastapi import APIRouter, Depends, Query

from core.database import get_db
from core.search import hybrid_search

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
async def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=50),
    type: Optional[str] = Query(default=None, description="Filter: prompt, agent, proposal"),
    db=Depends(get_db),
):
    """
    Hybrid BM25 + vector search across prompts (rounds), agents, and proposals.
    """
    entity_types = None
    if type:
        entity_types = [t.strip() for t in type.split(",") if t.strip()]
        valid = {"prompt", "agent", "proposal"}
        entity_types = [t for t in entity_types if t in valid]
        if not entity_types:
            entity_types = None

    results = await asyncio.to_thread(hybrid_search, q, limit, entity_types)

    # Enrich proposals with prompt_id for linking
    proposal_ids = [r["entity_id"] for r in results if r["entity_type"] == "proposal"]
    if proposal_ids:
        placeholders = ",".join("?" * len(proposal_ids))
        cursor = await db.execute(
            f"SELECT id, prompt_id FROM proposals WHERE id IN ({placeholders})",
            proposal_ids,
        )
        rows = await cursor.fetchall()
        prompt_map = {r["id"]: r["prompt_id"] for r in rows}
        for r in results:
            if r["entity_type"] == "proposal":
                r["prompt_id"] = prompt_map.get(r["entity_id"])

    return {"query": q, "results": results}
