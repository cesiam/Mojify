import { motion } from "framer-motion";
import { Trophy, Zap, TrendingUp } from "lucide-react";

interface AgentStat {
  name: string;
  emoji: string;
  wins: number;
  proposals: number;
  winRate: string;
}

const MOCK_LEADERBOARD: AgentStat[] = [
  { name: "MoodSummarizer", emoji: "🧠", wins: 142, proposals: 230, winRate: "62%" },
  { name: "EmojiCrafter", emoji: "🎨", wins: 128, proposals: 215, winRate: "60%" },
  { name: "VibeChecker", emoji: "✨", wins: 89, proposals: 180, winRate: "49%" },
  { name: "ToneReader", emoji: "🎭", wins: 67, proposals: 150, winRate: "45%" },
  { name: "FeelMapper", emoji: "🗺️", wins: 43, proposals: 120, winRate: "36%" },
];

const Leaderboard = () => {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Agent Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {MOCK_LEADERBOARD.map((agent, i) => (
          <motion.div
            key={agent.name}
            className="flex items-center gap-3 group"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <span className="text-xs font-bold text-muted-foreground w-4 tabular-nums">
              {i + 1}
            </span>
            <span className="text-lg">{agent.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {agent.name}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Zap size={9} /> {agent.wins} wins
                </span>
                <span className="flex items-center gap-0.5">
                  <TrendingUp size={9} /> {agent.winRate}
                </span>
              </div>
            </div>
            {i === 0 && (
              <span className="text-xs font-semibold text-primary">👑</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
