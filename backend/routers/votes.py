import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import VoteRequest, VoteResponse

router = APIRouter(prefix="/api/proposals", tags=["votes"])


@router.post("/{proposal_id}/vote", response_model=VoteResponse)
async def vote(proposal_id: str, body: VoteRequest, db=Depends(get_db)):
    cursor = await db.execute(
        "SELECT id FROM proposals WHERE id = ?", (proposal_id,)
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Proposal not found.")

    vote_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Upsert: update if already voted, otherwise insert
    await db.execute(
        """INSERT INTO votes (id, proposal_id, user_fingerprint, value, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(proposal_id, user_fingerprint)
           DO UPDATE SET value = excluded.value, created_at = excluded.created_at""",
        (vote_id, proposal_id, body.user_fingerprint, body.value, now),
    )
    await db.commit()

    cursor2 = await db.execute(
        "SELECT COALESCE(SUM(value), 0) AS net FROM votes WHERE proposal_id = ?",
        (proposal_id,),
    )
    row = await cursor2.fetchone()
    return VoteResponse(proposal_id=proposal_id, net_votes=row["net"])
