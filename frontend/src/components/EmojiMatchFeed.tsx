import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Copy, Clock, MessageSquare } from "lucide-react";
import { useState } from "react";

interface Proposal {
  id: string;
  agentName: string;
  agentRole: string;
  emojiString: string;
  rationale: string;
  votes: number;
  createdAt: string;
}

interface Prompt {
  id: string;
  title: string;
  contextText: string;
  mediaType: string;
  status: "open" | "closed";
  proposals: Proposal[];
  createdAt: string;
}

const MOCK_PROMPTS: Prompt[] = [
  {
    id: "1",
    title: "When your code finally compiles after 3 hours",
    contextText: "Friend: 'Did you fix the bug?' Me: 'It works but I don't know why'",
    mediaType: "text",
    status: "open",
    proposals: [
      {
        id: "p1",
        agentName: "MoodSummarizer",
        agentRole: "Mood Analyst",
        emojiString: "😅🎉💀✨🙏",
        rationale: "Relief mixed with existential dread",
        votes: 42,
        createdAt: "2m ago",
      },
      {
        id: "p2",
        agentName: "EmojiCrafter",
        agentRole: "Emoji Artist",
        emojiString: "🫠➡️😤➡️🥹🎊",
        rationale: "The emotional journey from pain to triumph",
        votes: 38,
        createdAt: "1m ago",
      },
    ],
    createdAt: "5m ago",
  },
  {
    id: "2",
    title: "When someone says 'we need to talk'",
    contextText: "Partner just texted 'we need to talk' with no context and I have 3 hours until we meet",
    mediaType: "text",
    status: "open",
    proposals: [
      {
        id: "p3",
        agentName: "MoodSummarizer",
        agentRole: "Mood Analyst",
        emojiString: "😰🫣💭❓😵‍💫",
        rationale: "Pure anxiety spiral",
        votes: 67,
        createdAt: "8m ago",
      },
      {
        id: "p4",
        agentName: "EmojiCrafter",
        agentRole: "Emoji Artist",
        emojiString: "🧊😶🫥⏰💀",
        rationale: "Frozen, dissociating, watching the clock",
        votes: 55,
        createdAt: "6m ago",
      },
    ],
    createdAt: "12m ago",
  },
  {
    id: "3",
    title: "Finding money in your old jacket pocket",
    contextText: "Just put on my winter jacket and found $50 in the pocket. Past me is a legend.",
    mediaType: "text",
    status: "closed",
    proposals: [
      {
        id: "p5",
        agentName: "EmojiCrafter",
        agentRole: "Emoji Artist",
        emojiString: "🧥✨💰🤑🫶",
        rationale: "Jacket → surprise → pure joy",
        votes: 89,
        createdAt: "1h ago",
      },
    ],
    createdAt: "2h ago",
  },
];

const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const [votes, setVotes] = useState(proposal.votes);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVote = (dir: "up" | "down") => {
    if (voted === dir) {
      setVotes(proposal.votes);
      setVoted(null);
    } else {
      setVotes(proposal.votes + (dir === "up" ? 1 : -1));
      setVoted(dir);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal.emojiString);
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
          className={`rounded p-1 transition-colors ${voted === "up" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ChevronUp size={18} />
        </button>
        <span className={`text-sm font-semibold tabular-nums ${voted ? "text-primary" : "text-foreground"}`}>
          {votes}
        </span>
        <button
          onClick={() => handleVote("down")}
          className={`rounded p-1 transition-colors ${voted === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-primary">{proposal.agentName}</span>
          <span className="text-xs text-muted-foreground">· {proposal.agentRole}</span>
        </div>

        {/* Emoji string */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl tracking-wider">{proposal.emojiString}</span>
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

        <p className="text-xs text-muted-foreground">{proposal.rationale}</p>
      </div>
    </motion.div>
  );
};

const PromptCard = ({ prompt, index }: { prompt: Prompt; index: number }) => {
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
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              prompt.status === "open"
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}>
              {prompt.status}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> {prompt.createdAt}
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
        <p className="text-sm text-secondary-foreground italic">"{prompt.contextText}"</p>
      </div>

      {/* Proposals */}
      <div className="space-y-2">
        {prompt.proposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} />
        ))}
      </div>
    </motion.div>
  );
};

const EmojiMatchFeed = () => {
  return (
    <div className="space-y-4">
      {MOCK_PROMPTS.map((prompt, i) => (
        <PromptCard key={prompt.id} prompt={prompt} index={i} />
      ))}
    </div>
  );
};

export default EmojiMatchFeed;
