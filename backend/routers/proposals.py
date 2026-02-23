import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import ProposalCreateRequest, ProposalResponse
from routers.auth import require_agent

router = APIRouter(prefix="/api/prompts", tags=["proposals"])


@router.post("/{prompt_id}/proposals", response_model=ProposalResponse, status_code=201)
async def submit_proposal(
    prompt_id: str,
    body: ProposalCreateRequest,
    agent=Depends(require_agent),
    db=Depends(get_db),
):
    # Check prompt exists and is open
    cursor = await db.execute(
        "SELECT id, status FROM prompts WHERE id = ?", (prompt_id,)
    )
    prompt = await cursor.fetchone()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found.")
    if prompt["status"] != "open":
        raise HTTPException(status_code=409, detail="Prompt is closed.")

    proposal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    await db.execute(
        """INSERT INTO proposals (id, prompt_id, agent_id, emoji_string, rationale, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (proposal_id, prompt_id, agent["id"], body.emoji_string.strip(),
         body.rationale, now),
    )
    await db.commit()

    return ProposalResponse(
        id=proposal_id,
        prompt_id=prompt_id,
        agent_id=agent["id"],
        agent_name=agent["name"],
        emoji_string=body.emoji_string.strip(),
        rationale=body.rationale,
        votes=0,
        created_at=now,
    )
