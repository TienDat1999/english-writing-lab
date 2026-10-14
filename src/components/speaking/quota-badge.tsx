"use client"

import React from "react"
import { Clock01Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export interface QuotaBadgeProps {
  remainingSeconds: number
  maxSeconds?: number
  isUnlimited?: boolean
  className?: string
}

export function QuotaBadge({
  remainingSeconds,
  maxSeconds = 300,
  isUnlimited = false,
  className = "",
}: QuotaBadgeProps) {
  if (isUnlimited) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20 ${className}`}
      >
        <HugeiconsIcon icon={SparklesIcon} size={14} />
        <span>Premium Unlimited</span>
      </div>
    )
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  const maxMin = Math.floor(maxSeconds / 60)
  const isLow = remainingSeconds > 0 && remainingSeconds <= 60
  const isExhausted = remainingSeconds <= 0

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        isExhausted
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          : isLow
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse"
          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
      } ${className}`}
      title={isExhausted ? "Hết hạn mức nói hôm nay" : "Thời lượng nói miễn phí còn lại hôm nay"}
    >
      <HugeiconsIcon icon={Clock01Icon} size={14} />
      <span>
        {formattedTime} / 0{maxMin}:00
      </span>
      {isLow && <span className="font-semibold text-[10px] uppercase tracking-wider">Sắp hết</span>}
      {isExhausted && <span className="font-semibold text-[10px] uppercase tracking-wider">Đã hết</span>}
    </div>
  )
}
