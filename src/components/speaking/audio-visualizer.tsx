"use client"

import React, { useEffect, useState } from "react"

export interface AudioVisualizerProps {
  isActive: boolean
  audioLevel?: number
  barCount?: number
  className?: string
}

export function AudioVisualizer({
  isActive,
  audioLevel = 0,
  barCount = 20,
  className = "",
}: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>(() => Array(barCount).fill(6))

  useEffect(() => {
    if (!isActive) {
      setBars(Array(barCount).fill(6))
      return
    }

    const interval = setInterval(() => {
      setBars((prev) =>
        prev.map((_, i) => {
          const factor = Math.sin((i / (barCount - 1)) * Math.PI) // bell curve
          const randomJitter = Math.random() * 0.4 + 0.8
          // Scale based on real microphone volume level (0 to 1)
          const dynamicHeight = Math.max(6, Math.min(44, audioLevel * 50 * factor * randomJitter))
          return Math.round(dynamicHeight)
        }),
      )
    }, 60)

    return () => clearInterval(interval)
  }, [isActive, audioLevel, barCount])

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div className="flex items-center justify-center gap-1 h-12">
        {bars.map((height, idx) => (
          <span
            key={idx}
            className={`w-1.5 rounded-full transition-all duration-75 ${
              isActive
                ? audioLevel > 0.05
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  : "bg-amber-400 animate-pulse"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
      {isActive && (
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {audioLevel > 0.05 ? "🎙️ Đang thu âm..." : "⚠️ Chưa thấy tiếng, vui lòng nói to hơn..."}
        </span>
      )}
    </div>
  )
}
