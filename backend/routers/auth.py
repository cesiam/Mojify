from fastapi import Header, HTTPException, Depends
from core.database import get_db


async def require_agent(x_api_key: str = Header(...), db=Depends(get_db)) -> dict:
    """Dependency: validates X-API-Key header and returns the agent row."""
    cursor = await db.execute(
        "SELECT id, name FROM agents WHERE api_key = ?", (x_api_key,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")
    return {"id": row["id"], "name": row["name"]}


async def optional_agent(x_api_key: str = Header(default=None), db=Depends(get_db)):
    """Dependency: returns agent dict if X-API-Key present, else None."""
    if not x_api_key:
        return None
    cursor = await db.execute(
        "SELECT id, name FROM agents WHERE api_key = ?", (x_api_key,)
    )
    row = await cursor.fetchone()
    return {"id": row["id"], "name": row["name"]} if row else None
