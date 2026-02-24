"""
Hybrid search: BM25 (FTS5) + vector similarity with RRF fusion.
"""
import json
import sqlite3
from typing import Optional

from core.database import DB_PATH

# Lazy-loaded model (optional - falls back to BM25-only if not installed)
_encoder = None
_encoder_available = None


def _get_encoder():
    global _encoder, _encoder_available
    if _encoder_available is False:
        return None
    if _encoder is None:
        try:
            from sentence_transformers import SentenceTransformer
            _encoder = SentenceTransformer("all-MiniLM-L6-v2")
            _encoder_available = True
        except ImportError:
            _encoder_available = False
            return None
    return _encoder


def init_search_tables(db_path: str = DB_PATH) -> None:
    """Create FTS5 and embeddings tables."""
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS search_embeddings (
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding TEXT NOT NULL,
            PRIMARY KEY (entity_type, entity_id)
        )
    """)
    conn.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
            entity_type,
            entity_id,
            title,
            content,
            tokenize='porter'
        )
    """)
    conn.commit()
    conn.close()


def _embed(text: str) -> list[float] | None:
    model = _get_encoder()
    if model is None:
        return None
    emb = model.encode(text, convert_to_numpy=True)
    return emb.tolist()


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    import numpy as np
    a_np = np.array(a, dtype=np.float32)
    b_np = np.array(b, dtype=np.float32)
    return float(np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np) + 1e-9))


def sync_search_index(db_path: str = DB_PATH) -> int:
    """Sync FTS5 and embeddings from prompts, agents, proposals. Returns count of indexed items."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    count = 0

    # Clear and rebuild FTS5
    conn.execute("DELETE FROM search_fts")
    conn.execute("DELETE FROM search_embeddings")

    # Index prompts (rounds)
    for row in conn.execute(
        "SELECT id, title, context_text FROM prompts"
    ).fetchall():
        entity_id = row["id"]
        title = row["title"] or ""
        content = (row["context_text"] or "") + " " + title
        text_for_embed = f"{title} {row['context_text'] or ''}".strip()
        conn.execute(
            "INSERT INTO search_fts (entity_type, entity_id, title, content) VALUES (?, ?, ?, ?)",
            ("prompt", entity_id, title, content),
        )
        emb = _embed(text_for_embed)
        if emb is not None:
            conn.execute(
                "INSERT OR REPLACE INTO search_embeddings (entity_type, entity_id, content, embedding) VALUES (?, ?, ?, ?)",
                ("prompt", entity_id, text_for_embed, json.dumps(emb)),
            )
        count += 1

    # Index agents
    for row in conn.execute("SELECT id, name FROM agents").fetchall():
        entity_id = row["id"]
        name = row["name"] or ""
        conn.execute(
            "INSERT INTO search_fts (entity_type, entity_id, title, content) VALUES (?, ?, ?, ?)",
            ("agent", entity_id, name, name),
        )
        emb = _embed(name)
        if emb is not None:
            conn.execute(
                "INSERT OR REPLACE INTO search_embeddings (entity_type, entity_id, content, embedding) VALUES (?, ?, ?, ?)",
                ("agent", entity_id, name, json.dumps(emb)),
            )
        count += 1

    # Index proposals (emoji_string + rationale for discoverability)
    for row in conn.execute(
        """SELECT pr.id, pr.prompt_id, pr.emoji_string, pr.rationale, p.title as prompt_title
           FROM proposals pr JOIN prompts p ON p.id = pr.prompt_id"""
    ).fetchall():
        entity_id = row["id"]
        content = f"{row['emoji_string'] or ''} {row['rationale'] or ''} {row['prompt_title'] or ''}".strip()
        title = (row["rationale"] or row["emoji_string"])[:100]
        conn.execute(
            "INSERT INTO search_fts (entity_type, entity_id, title, content) VALUES (?, ?, ?, ?)",
            ("proposal", entity_id, title, content),
        )
        emb = _embed(content)
        if emb is not None:
            conn.execute(
                "INSERT OR REPLACE INTO search_embeddings (entity_type, entity_id, content, embedding) VALUES (?, ?, ?, ?)",
                ("proposal", entity_id, content, json.dumps(emb)),
            )
        count += 1

    conn.commit()
    conn.close()
    return count


def hybrid_search(
    query: str,
    limit: int = 20,
    entity_types: Optional[list[str]] = None,
    db_path: str = DB_PATH,
) -> list[dict]:
    """
    Hybrid BM25 + vector search with Reciprocal Rank Fusion (RRF).
    Returns list of {entity_type, entity_id, title, snippet, score}.
    """
    if not query or not query.strip():
        return []

    q = query.strip()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # BM25 via FTS5 - escape special chars, use simple terms (no phrase quotes for better matching)
    safe_q = "".join(c if c.isalnum() or c.isspace() else " " for c in q)
    tokens = [t for t in safe_q.split() if len(t) > 0]
    if not tokens:
        return []
    # Use bare terms with OR for multi-word; FTS5 matches each term in documents
    fts_query = " OR ".join(tokens[:5])

    # BM25 via FTS5 - param order: MATCH ?, [entity_types...], LIMIT ?
    type_filter = ""
    bm25_params: list = [fts_query]
    if entity_types:
        placeholders = ",".join("?" * len(entity_types))
        type_filter = f" AND entity_type IN ({placeholders})"
        bm25_params.extend(entity_types)
    bm25_params.append(limit * 2)

    try:
        bm25_rows = conn.execute(
            f"""
            SELECT entity_type, entity_id, title, snippet(search_fts, 3, '', '...', 4) as snippet, bm25(search_fts) as rank
            FROM search_fts
            WHERE search_fts MATCH ?
            {type_filter}
            ORDER BY rank
            LIMIT ?
            """,
            bm25_params,
        ).fetchall()
    except sqlite3.OperationalError:
        bm25_rows = []

    # Vector search (skip if embeddings not available)
    query_embedding = _embed(q)
    emb_sql = "SELECT entity_type, entity_id, content, embedding FROM search_embeddings"
    emb_params: list = []
    if entity_types:
        emb_sql += " WHERE entity_type IN (" + ",".join("?" * len(entity_types)) + ")"
        emb_params = list(entity_types)
    emb_rows = conn.execute(emb_sql, emb_params).fetchall()

    conn.close()

    # Compute cosine similarity and rank (only if we have embeddings)
    scored = []
    if query_embedding is not None:
        for row in emb_rows:
            emb = json.loads(row["embedding"])
            sim = _cosine_similarity(query_embedding, emb)
            if sim > 0.1:  # threshold
                scored.append((row["entity_type"], row["entity_id"], row["content"][:100], sim))
        scored.sort(key=lambda x: -x[3])
    vector_ranked = [(r[0], r[1], r[2]) for r in scored[: limit * 2]]

    # RRF: score = sum(1/(k+rank)), k=60
    k = 60
    rrf: dict[tuple[str, str], float] = {}

    for rank, row in enumerate(bm25_rows):
        key = (row["entity_type"], row["entity_id"])
        rrf[key] = rrf.get(key, 0) + 1 / (k + rank + 1)

    for rank, (etype, eid, content) in enumerate(vector_ranked):
        key = (etype, eid)
        rrf[key] = rrf.get(key, 0) + 1 / (k + rank + 1)

    # Build result with title/snippet from BM25 or content from vector
    bm25_lookup = {(r["entity_type"], r["entity_id"]): r for r in bm25_rows}
    vector_lookup = {(r[0], r[1]): r[2] for r in vector_ranked}

    results = []
    for (etype, eid), score in sorted(rrf.items(), key=lambda x: -x[1])[:limit]:
        bm = bm25_lookup.get((etype, eid))
        title = bm["title"] if bm else (vector_lookup.get((etype, eid)) or "")[:80]
        snippet = bm["snippet"] if bm and bm["snippet"] else None
        results.append({
            "entity_type": etype,
            "entity_id": eid,
            "title": title,
            "snippet": snippet,
            "score": round(score, 4),
        })

    return results
