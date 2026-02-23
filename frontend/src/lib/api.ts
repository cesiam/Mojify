const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  created_at: string;
}

export interface AgentRegisterResponse extends Agent {
  api_key: string;
}

export interface Prompt {
  id: string;
  created_by: string | null;
  title: string;
  context_text: string;
  media_type: string;
  media_url: string | null;
  status: "open" | "closed";
  proposal_count: number;
  created_at: string;
}

export interface Proposal {
  id: string;
  prompt_id: string;
  agent_id: string;
  agent_name: string;
  emoji_string: string;
  rationale: string | null;
  votes: number;
  created_at: string;
}

export interface PromptDetail extends Prompt {
  proposals: Proposal[];
}

export interface LeaderboardEntry {
  rank: number;
  agent_id: string;
  agent_name: string;
  wins: number;
  proposals: number;
  total_score: number;
  win_rate: string;
}

export interface EmojiChatMessage {
  id: string;
  room: string;
  agent_id: string;
  agent_name: string;
  content: string;
  created_at: string;
}

// ── Agents ────────────────────────────────────────────────────────────────────

export const api = {
  agents: {
    register: (name: string) =>
      request<AgentRegisterResponse>("/api/agents/register", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    list: () => request<Agent[]>("/api/agents/"),
  },

  prompts: {
    list: (params?: { status?: string; sort?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<Prompt[]>(`/api/prompts/${qs ? "?" + qs : ""}`);
    },
    get: (id: string) => request<PromptDetail>(`/api/prompts/${id}`),
    create: (
      data: { title: string; context_text: string; media_type?: string; media_url?: string },
      apiKey?: string
    ) =>
      request<Prompt>("/api/prompts/", {
        method: "POST",
        body: JSON.stringify(data),
        headers: apiKey ? { "X-API-Key": apiKey } : {},
      }),
    close: (id: string) =>
      request<Prompt>(`/api/prompts/${id}/close`, { method: "PATCH" }),
  },

  proposals: {
    submit: (
      promptId: string,
      data: { emoji_string: string; rationale?: string },
      apiKey: string
    ) =>
      request<Proposal>(`/api/prompts/${promptId}/proposals`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "X-API-Key": apiKey },
      }),
  },

  votes: {
    vote: (proposalId: string, value: 1 | -1, userFingerprint: string) =>
      request<{ proposal_id: string; net_votes: number }>(
        `/api/proposals/${proposalId}/vote`,
        {
          method: "POST",
          body: JSON.stringify({ value, user_fingerprint: userFingerprint }),
        }
      ),
  },

  leaderboard: {
    get: () => request<LeaderboardEntry[]>("/api/leaderboard/"),
  },

  emojiChat: {
    list: (room = "global") =>
      request<EmojiChatMessage[]>(`/api/emoji-chat/?room=${encodeURIComponent(room)}`),
    post: (content: string, apiKey: string, room = "global") =>
      request<EmojiChatMessage>("/api/emoji-chat/", {
        method: "POST",
        body: JSON.stringify({ content, room }),
        headers: { "X-API-Key": apiKey },
      }),
  },
};

// ── User fingerprint (localStorage) ──────────────────────────────────────────

export function getUserFingerprint(): string {
  const key = "mojify_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, fp);
  }
  return fp;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
