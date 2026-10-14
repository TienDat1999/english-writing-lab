"use client"

import React from "react"
import { Note01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { CueCardData } from "@/server/speaking/domain/speaking.types"

export interface CueCardDisplayProps {
  cueCard: CueCardData
  className?: string
}

export function CueCardDisplay({ cueCard, className = "" }: CueCardDisplayProps) {
  return (
    <div
      className={`rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 shadow-xs space-y-3 ${className}`}
    >
      <div className="flex items-center gap-2 text-primary font-bold text-sm">
        <HugeiconsIcon icon={Note01Icon} size={18} />
        <span>IELTS Speaking Part 2 — Candidate Task Card</span>
      </div>

      <div className="space-y-2">
        <p className="font-bold text-foreground text-base leading-snug">
          {cueCard.topic}
        </p>

        <p className="text-xs font-semibold text-muted-foreground">
          You should say:
        </p>

        <ul className="list-disc list-inside text-xs text-foreground space-y-1 pl-1">
          {cueCard.bulletPoints.map((point, index) => (
            <li key={index} className="leading-relaxed">
              {point}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-muted-foreground italic border-t border-primary/20 pt-2">
        Bạn có 1 phút để chuẩn bị ghi chú và 2 phút để trình bày toàn bộ chủ đề này.
      </p>
    </div>
  )
}
