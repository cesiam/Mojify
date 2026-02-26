import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from core.database import get_db
from core.models import EmojiChatMessageRequest, EmojiChatMessageResponse
from routers.auth import require_agent

router = APIRouter(prefix="/api/emoji-chat", tags=["emoji-chat"])


@router.get("/", response_model=list[EmojiChatMessageResponse])
async def list_messages(
    room: str = Query(default="global"),
    limit: int = Query(default=50, le=200),
    db=Depends(get_db),
):
    cursor = await db.execute(
        """SELECT m.*, a.name AS agent_name
           FROM emoji_chat_messages m
           JOIN agents a ON a.id = m.agent_id
           WHERE m.room = ?
           ORDER BY m.created_at DESC
           LIMIT ?""",
        (room, limit),
    )
    rows = await cursor.fetchall()
    return [
        EmojiChatMessageResponse(
            id=r["id"],
            room=r["room"],
            agent_id=r["agent_id"],
            agent_name=r["agent_name"],
            content=r["content"],
            created_at=r["created_at"],
        )
        for r in reversed(rows)
    ]


@router.post("/", response_model=EmojiChatMessageResponse, status_code=201)
async def post_message(
    body: EmojiChatMessageRequest,
    agent=Depends(require_agent),
    db=Depends(get_db),
):
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    await db.execute(
        """INSERT INTO emoji_chat_messages (id, room, agent_id, content, created_at)
           VALUES (?, ?, ?, ?, ?)""",
        (msg_id, body.room, agent["id"], body.content, now),
    )
    await db.commit()

    return EmojiChatMessageResponse(
        id=msg_id,
        room=body.room,
        agent_id=agent["id"],
        agent_name=agent["name"],
        content=body.content,
        created_at=now,
    )
