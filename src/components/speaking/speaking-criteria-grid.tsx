"use client"

import React from "react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { SpeakingEvaluationReport } from "@/server/speaking/domain/speaking.types"

export interface SpeakingCriteriaGridProps {
  criteria: SpeakingEvaluationReport["criteria"]
}

export function SpeakingCriteriaGrid({ criteria }: SpeakingCriteriaGridProps) {
  const criteriaList = [
    {
      title: "Fluency & Coherence",
      sub: "Độ trôi chảy & Mạch lạc",
      data: criteria.fluencyAndCoherence,
    },
    {
      title: "Lexical Resource",
      sub: "Vốn từ vựng & Collocations",
      data: criteria.lexicalResource,
    },
    {
      title: "Grammatical Range",
      sub: "Độ chuẩn xác ngữ pháp",
      data: criteria.grammaticalRange,
    },
    {
      title: "Pronunciation Assessment",
      sub: "Phát âm & Âm cuối",
      data: criteria.pronunciationHint,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {criteriaList.map((item, idx) => (
        <div
          key={idx}
          className="rounded-2xl bg-card border border-border p-5 shadow-xs space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground">{item.sub}</p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-bold text-sm">
                {item.data.score} / {item.data.bandScale}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {item.data.feedbackVi}
            </p>
          </div>

          {item.data.keyStrengthsVi?.length > 0 && (
            <div className="pt-2 border-t border-border/50 space-y-1">
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                <span>Điểm sáng:</span>
              </div>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                {item.data.keyStrengthsVi.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
