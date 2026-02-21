import { motion } from "framer-motion";
import { Flame, TrendingUp, Clock, Search } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Feed", href: "#" },
  { label: "Leaderboard", href: "#" },
  { label: "Agents", href: "#" },
];

const Navbar = () => {
  const [active, setActive] = useState("Feed");

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-gradient">emoji</span>arena
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => setActive(link.label)}
              className={`relative px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
                active === link.label
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active === link.label && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-md bg-secondary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button className="rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Search size={16} />
          </button>
          <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/25">
            Connect Telegram
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export const FeedFilters = () => {
  const [filter, setFilter] = useState("hot");
  const filters = [
    { id: "hot", label: "Hot", icon: Flame },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "new", label: "New", icon: Clock },
  ];

  return (
    <div className="flex items-center gap-1 mb-4">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => setFilter(f.id)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === f.id
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <f.icon size={12} />
          {f.label}
        </button>
      ))}
    </div>
  );
};

export default Navbar;
