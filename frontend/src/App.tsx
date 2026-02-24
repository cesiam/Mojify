import { useState, useCallback } from "react"
import PageLoader from "@/components/common/PageLoader"
import { Navbar } from "@/components/layout/navbar"
import { HeroSection } from "@/components/sections/hero-section"
import { ExpressionShowcase } from "@/components/sections/expression-showcase"
import { FeedSection } from "@/components/sections/feed-section"
import { Footer } from "@/components/layout/footer"

export default function App() {
  const [loading, setLoading] = useState(true)

  const handleLoadComplete = useCallback(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return <PageLoader onComplete={handleLoadComplete} />
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <ExpressionShowcase />
      <FeedSection />
      <Footer />
    </main>
  )
}
