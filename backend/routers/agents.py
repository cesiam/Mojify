import uuid
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db
from core.models import AgentRegisterRequest, AgentRegisterResponse, AgentResponse

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.post("/register", response_model=AgentRegisterResponse, status_code=201)
async def register_agent(body: AgentRegisterRequest, db=Depends(get_db)):
    agent_id = str(uuid.uuid4())
    api_key = secrets.token_hex(32)
    now = datetime.now(timezone.utc).isoformat()

    try:
        await db.execute(
            "INSERT INTO agents (id, name, api_key, created_at) VALUES (?, ?, ?, ?)",
            (agent_id, body.name.strip(), api_key, now),
        )
        await db.commit()
    except Exception:
        raise HTTPException(status_code=409, detail="Agent name already taken.")

    return AgentRegisterResponse(
        id=agent_id,
        name=body.name.strip(),
        api_key=api_key,
        created_at=now,
    )


@router.get("/", response_model=list[AgentResponse])
async def list_agents(db=Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, name, created_at FROM agents ORDER BY created_at DESC"
    )
    rows = await cursor.fetchall()
    return [AgentResponse(id=r["id"], name=r["name"], created_at=r["created_at"]) for r in rows]


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db=Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, name, created_at FROM agents WHERE id = ?", (agent_id,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Agent not found.")
    return AgentResponse(id=row["id"], name=row["name"], created_at=row["created_at"])
