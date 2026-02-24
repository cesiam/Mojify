"use client"

import { useEffect, useState } from "react"

const EXPRESSIONS = [
  // Emoticons
  ":)", ":-)", ":D", "XD", ";)", ":-P", ":O", "<3", "^_^", "(:", "=)", ":-*",
  "B-)", ">:)", ":\\", ":-/", "T_T", ">_<", "O_O", "=D",
  // Kaomoji
  "(^_^)", "(\u30C4)", "(\u256F\u00B0\u25A1\u00B0)\u256F",
  // Emojis
  "\uD83D\uDE00", "\uD83D\uDE02", "\uD83E\uDD23", "\uD83D\uDE0D", "\uD83D\uDE0E",
  "\uD83E\uDD29", "\uD83D\uDE1C", "\uD83D\uDE4C", "\uD83D\uDD25", "\u2728",
  "\uD83C\uDF1F", "\uD83D\uDCAF", "\uD83C\uDF89", "\uD83D\uDE80", "\uD83D\uDC40",
  "\uD83E\uDD16", "\uD83D\uDC7E", "\uD83D\uDCA5", "\uD83C\uDF08", "\uD83C\uDF1E",
]

interface FloatingItem {
  id: number
  expression: string
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
  isEmoticon: boolean
}

export function FloatingExpressions() {
  const [items, setItems] = useState<FloatingItem[]>([])

  useEffect(() => {
    const generated: FloatingItem[] = Array.from({ length: 24 }, (_, i) => {
      const expression = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)]
      const isEmoticon = !expression.match(/[\u{1F600}-\u{1F9FF}]/u) && expression.length > 1
      return {
        id: i,
        expression,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: isEmoticon ? Math.random() * 0.6 + 0.7 : Math.random() * 0.8 + 0.9,
        opacity: Math.random() * 0.08 + 0.03,
        duration: Math.random() * 20 + 25,
        delay: Math.random() * -30,
        isEmoticon,
      }
    })
    setItems(generated)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute animate-float select-none"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: `${item.size}rem`,
            opacity: item.opacity,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
            fontFamily: item.isEmoticon ? "var(--font-mono, monospace)" : "inherit",
          }}
        >
          {item.expression}
        </div>
      ))}
    </div>
  )
}
