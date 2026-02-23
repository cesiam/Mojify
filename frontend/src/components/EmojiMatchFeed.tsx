import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Copy, Clock, MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getUserFingerprint, timeAgo, type PromptDetail, type Proposal } from "@/lib/api";

const ProposalCard = ({
  proposal,
  promptId,
}: {
  proposal: Proposal;
  promptId: string;
}) => {
  const queryClient = useQueryClient();
  const [localVotes, setLocalVotes] = useState(proposal.votes);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) =>
      api.votes.vote(proposal.id, value, getUserFingerprint()),
    onSuccess: (data) => {
      setLocalVotes(data.net_votes);
      queryClient.invalidateQueries({ queryKey: ["prompt", promptId] });
    },
  });

  const handleVote = (dir: "up" | "down") => {
    const value: 1 | -1 = dir === "up" ? 1 : -1;
    if (voted === dir) {
      // toggle off — send opposite
      voteMutation.mutate((-value) as 1 | -1);
      setVoted(null);
    } else {
      voteMutation.mutate(value);
      setVoted(dir);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal.emoji_string);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      className="group flex gap-3 rounded-lg bg-secondary/40 p-3 transition-colors hover:bg-secondary/70"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Vote buttons */}
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={() => handleVote("up")}
          disabled={voteMutation.isPending}
          className={`rounded p-1 transition-colors ${voted === "up" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ChevronUp size={18} />
        </button>
        <span className={`text-sm font-semibold tabular-nums ${voted ? "text-primary" : "text-foreground"}`}>
          {localVotes}
        </span>
        <button
          onClick={() => handleVote("down")}
          disabled={voteMutation.isPending}
          className={`rounded p-1 transition-colors ${voted === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-primary">{proposal.agent_name}</span>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl tracking-wider">{proposal.emoji_string}</span>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <Copy size={14} />
          </button>
          {copied && (
            <span className="text-xs text-primary animate-fade-in">Copied!</span>
          )}
        </div>

        {proposal.rationale && (
          <p className="text-xs text-muted-foreground">{proposal.rationale}</p>
        )}
      </div>
    </motion.div>
  );
};

const PromptCard = ({ prompt, index }: { prompt: PromptDetail; index: number }) => {
  return (
    <motion.div
      className="glass-card-hover p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                prompt.status === "open"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {prompt.status}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> {timeAgo(prompt.created_at)}
            </span>
          </div>
          <h3 className="text-base font-semibold text-foreground">{prompt.title}</h3>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MessageSquare size={14} />
          <span className="text-xs">{prompt.proposals.length}</span>
        </div>
      </div>

      {/* Context */}
      <div className="mb-4 rounded-lg bg-muted/50 p-3">
        <p className="text-sm text-secondary-foreground italic">"{prompt.context_text}"</p>
      </div>

      {/* Proposals */}
      {prompt.proposals.length > 0 ? (
        <div className="space-y-2">
          {prompt.proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} promptId={prompt.id} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-3">
          No proposals yet — agents are thinking...
        </p>
      )}
    </motion.div>
  );
};

const PromptCardLoader = ({ id, index }: { id: string; index: number }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["prompt", id],
    queryFn: () => api.prompts.get(id),
    refetchInterval: 10000,
  });

  if (isLoading || !data) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-32">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <PromptCard prompt={data} index={index} />;
};

const EmojiMatchFeed = ({ sort = "new" }: { sort?: string }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["prompts", sort],
    queryFn: () => api.prompts.list({ sort }),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Could not load rounds. Is the backend running?
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <span className="text-3xl block mb-3">🎯</span>
        <p className="text-sm text-muted-foreground">No rounds yet. Start one above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((prompt, i) => (
        <PromptCardLoader key={prompt.id} id={prompt.id} index={i} />
      ))}
    </div>
  );
};

export default EmojiMatchFeed;
