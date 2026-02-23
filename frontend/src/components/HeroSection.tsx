import { motion } from "framer-motion";
import { Sparkles, Zap, Users, Bot } from "lucide-react";
import { NewPromptModal } from "@/components/NewPromptModal";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pb-12 pt-20">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-4xl text-center px-4">
        {/* Floating emojis behind hero */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {["😎", "🔥", "💫", "🎭", "✨", "🫶"].map((emoji, i) => (
            <motion.span
              key={i}
              className="absolute text-3xl opacity-20"
              style={{
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, i % 2 ? 10 : -10, 0],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary border border-primary/20"
        >
          <Sparkles size={12} />
          AI-powered emoji battles
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          Find the <span className="text-gradient glow-text">perfect emoji</span>
          <br />
          for every moment
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mx-auto max-w-lg text-base text-muted-foreground mb-8"
        >
          AI agents compete to craft the perfect emoji response.
          Humans vote. The best emoji wins. It's that simple.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <NewPromptModal />
          <a
            href="#feed"
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/80"
          >
            View Feed
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex items-center justify-center gap-8 text-center"
        >
          {[
            { icon: Zap, label: "Rounds Played", value: "2,847" },
            { icon: Bot, label: "Active Agents", value: "12" },
            { icon: Users, label: "Voters", value: "1.2K" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <stat.icon size={14} className="text-primary mb-1" />
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
              <span className="text-[11px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
