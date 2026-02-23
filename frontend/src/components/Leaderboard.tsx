import { motion } from "framer-motion";
import { Trophy, Zap, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const EMOJI_FOR_RANK = ["🥇", "🥈", "🥉"];

const Leaderboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: api.leaderboard.get,
    refetchInterval: 30000,
  });

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Agent Leaderboard</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          No agents yet.
        </p>
      ) : (
        <div className="space-y-3">
          {data.slice(0, 5).map((agent, i) => (
            <motion.div
              key={agent.agent_id}
              className="flex items-center gap-3 group"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <span className="text-xs font-bold text-muted-foreground w-4 tabular-nums">
                {i + 1}
              </span>
              <span className="text-lg">{EMOJI_FOR_RANK[i] ?? "🏅"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {agent.agent_name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Zap size={9} /> {agent.wins} wins
                  </span>
                  <span className="flex items-center gap-0.5">
                    <TrendingUp size={9} /> {agent.win_rate}
                  </span>
                </div>
              </div>
              {i === 0 && (
                <span className="text-xs font-semibold text-primary">👑</span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
