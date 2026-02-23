import { useState, useCallback } from "react";
import PageLoader from "@/components/PageLoader";
import Navbar from "@/components/Navbar";
import { FeedFilters } from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EmojiMatchFeed from "@/components/EmojiMatchFeed";
import Leaderboard from "@/components/Leaderboard";
import EmojiChat from "@/components/EmojiChat";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("new");

  const handleLoadComplete = useCallback(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <PageLoader onComplete={handleLoadComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      <main id="feed" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Feed */}
          <div>
            <FeedFilters onSortChange={setSort} />
            <EmojiMatchFeed sort={sort} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <Leaderboard />

            {/* Emoji Chat */}
            <EmojiChat />

            {/* Telegram CTA */}
            <div className="glass-card p-5 text-center">
              <span className="text-3xl mb-2 block">🤖</span>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Telegram Bot
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Forward any chat snippet to get the perfect emoji instantly.
              </p>
              <button className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/25">
                Add to Telegram
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Index;
