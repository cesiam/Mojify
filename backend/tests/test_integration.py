"""
Integration tests: full workflows across multiple API endpoints.
"""
import pytest


class TestFullEmojiRoundFlow:
    """Integration: complete emoji match round from creation to voting."""

    def test_create_prompt_agent_submit_vote_and_leaderboard(self, client):
        """Full flow: create prompt → register agent → submit proposal → vote → verify leaderboard."""
        # 1. Create a prompt
        prompt_resp = client.post(
            "/api/prompts/",
            json={
                "title": "When your code finally works",
                "context_text": "Friend: Did you fix the bug? Me: It works but I don't know why",
                "media_type": "text",
            },
        )
        assert prompt_resp.status_code == 201
        prompt = prompt_resp.json()
        prompt_id = prompt["id"]

        # 2. Register an agent
        agent_resp = client.post("/api/agents/register", json={"name": "MoodSummarizer"})
        assert agent_resp.status_code == 201
        agent = agent_resp.json()

        # 3. Submit a proposal
        proposal_resp = client.post(
            f"/api/prompts/{prompt_id}/proposals",
            headers={"X-API-Key": agent["api_key"]},
            json={
                "emoji_string": "😅🎉💀✨",
                "rationale": "Relief mixed with existential dread",
            },
        )
        assert proposal_resp.status_code == 201
        proposal = proposal_resp.json()
        proposal_id = proposal["id"]

        # 4. Vote on the proposal
        vote_resp = client.post(
            f"/api/proposals/{proposal_id}/vote",
            json={"value": 1, "user_fingerprint": "user-abc"},
        )
        assert vote_resp.status_code == 200
        assert vote_resp.json()["net_votes"] == 1

        # 5. Verify prompt detail shows the proposal with votes
        detail_resp = client.get(f"/api/prompts/{prompt_id}")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert len(detail["proposals"]) == 1
        assert detail["proposals"][0]["votes"] == 1
        assert detail["proposals"][0]["emoji_string"] == "😅🎉💀✨"

        # 6. Verify leaderboard reflects the agent
        lb_resp = client.get("/api/leaderboard/")
        assert lb_resp.status_code == 200
        entries = lb_resp.json()
        agent_entry = next((e for e in entries if e["agent_name"] == "MoodSummarizer"), None)
        assert agent_entry is not None
        assert agent_entry["total_score"] >= 1


class TestMultiAgentCompetition:
    """Integration: multiple agents compete on the same prompt."""

    def test_two_agents_compete_same_prompt(self, client):
        """Two agents submit proposals; votes determine winner."""
        # Create prompt
        prompt = client.post(
            "/api/prompts/",
            json={"title": "Competition", "context_text": "Happy news!", "media_type": "text"},
        ).json()

        # Register two agents
        agent_a = client.post("/api/agents/register", json={"name": "AgentA"}).json()
        agent_b = client.post("/api/agents/register", json={"name": "AgentB"}).json()

        # Both submit proposals
        prop_a = client.post(
            f"/api/prompts/{prompt['id']}/proposals",
            headers={"X-API-Key": agent_a["api_key"]},
            json={"emoji_string": "😀", "rationale": "Happy"},
        ).json()
        prop_b = client.post(
            f"/api/prompts/{prompt['id']}/proposals",
            headers={"X-API-Key": agent_b["api_key"]},
            json={"emoji_string": "🎉", "rationale": "Celebration"},
        ).json()

        # User 1 upvotes A, User 2 upvotes A, User 3 downvotes B
        client.post(
            f"/api/proposals/{prop_a['id']}/vote",
            json={"value": 1, "user_fingerprint": "u1"},
        )
        client.post(
            f"/api/proposals/{prop_a['id']}/vote",
            json={"value": 1, "user_fingerprint": "u2"},
        )
        client.post(
            f"/api/proposals/{prop_b['id']}/vote",
            json={"value": -1, "user_fingerprint": "u3"},
        )

        # Verify prompt detail: A has 2 votes, B has -1
        detail = client.get(f"/api/prompts/{prompt['id']}").json()
        votes_by_emoji = {p["emoji_string"]: p["votes"] for p in detail["proposals"]}
        assert votes_by_emoji["😀"] == 2
        assert votes_by_emoji["🎉"] == -1

        # Leaderboard: AgentA should rank higher
        lb = client.get("/api/leaderboard/").json()
        ranks = {e["agent_name"]: e["rank"] for e in lb}
        assert ranks["AgentA"] < ranks["AgentB"]


class TestPromptLifecycle:
    """Integration: prompt creation, proposals, and closing."""

    def test_close_prompt_blocks_new_proposals(self, client):
        """After closing a prompt, no new proposals can be submitted."""
        prompt = client.post(
            "/api/prompts/",
            json={"title": "To close", "context_text": "x", "media_type": "text"},
        ).json()
        agent = client.post("/api/agents/register", json={"name": "LateAgent"}).json()

        # Submit while open
        r1 = client.post(
            f"/api/prompts/{prompt['id']}/proposals",
            headers={"X-API-Key": agent["api_key"]},
            json={"emoji_string": "👍", "rationale": None},
        )
        assert r1.status_code == 201

        # Close prompt
        client.patch(f"/api/prompts/{prompt['id']}/close")

        # Try to submit again — should fail
        r2 = client.post(
            f"/api/prompts/{prompt['id']}/proposals",
            headers={"X-API-Key": agent["api_key"]},
            json={"emoji_string": "👎", "rationale": None},
        )
        assert r2.status_code == 409

        # List prompts filtered by closed
        list_resp = client.get("/api/prompts/?status=closed")
        assert list_resp.status_code == 200
        closed_prompts = [p for p in list_resp.json() if p["id"] == prompt["id"]]
        assert len(closed_prompts) == 1
        assert closed_prompts[0]["status"] == "closed"


class TestEmojiChatIntegration:
    """Integration: emoji chat with agent coordination."""

    def test_agent_posts_and_reads_emoji_chat(self, client):
        """Agent posts to emoji chat; anyone can read messages."""
        agent = client.post("/api/agents/register", json={"name": "ChattyAgent"}).json()

        # Post message
        post_resp = client.post(
            "/api/emoji-chat/",
            headers={"X-API-Key": agent["api_key"]},
            json={"content": "🫶➕✨", "room": "global"},
        )
        assert post_resp.status_code == 201
        msg = post_resp.json()
        assert msg["agent_name"] == "ChattyAgent"
        assert msg["content"] == "🫶➕✨"

        # Read without auth
        list_resp = client.get("/api/emoji-chat/?room=global")
        assert list_resp.status_code == 200
        messages = list_resp.json()
        assert len(messages) == 1
        assert messages[0]["content"] == "🫶➕✨"


class TestVoteUpsertIntegration:
    """Integration: vote change (upsert) behavior."""

    def test_user_changes_vote_from_up_to_down(self, client):
        """User upvotes, then changes to downvote; net votes update correctly."""
        agent = client.post("/api/agents/register", json={"name": "VoteTest"}).json()
        prompt = client.post(
            "/api/prompts/",
            json={"title": "Vote", "context_text": "x", "media_type": "text"},
        ).json()
        proposal = client.post(
            f"/api/prompts/{prompt['id']}/proposals",
            headers={"X-API-Key": agent["api_key"]},
            json={"emoji_string": "👍", "rationale": None},
        ).json()

        # Upvote
        r1 = client.post(
            f"/api/proposals/{proposal['id']}/vote",
            json={"value": 1, "user_fingerprint": "changer"},
        )
        assert r1.json()["net_votes"] == 1

        # Change to downvote (same user)
        r2 = client.post(
            f"/api/proposals/{proposal['id']}/vote",
            json={"value": -1, "user_fingerprint": "changer"},
        )
        assert r2.json()["net_votes"] == -1

        # Prompt detail should reflect -1
        detail = client.get(f"/api/prompts/{prompt['id']}").json()
        prop = next(p for p in detail["proposals"] if p["id"] == proposal["id"])
        assert prop["votes"] == -1
