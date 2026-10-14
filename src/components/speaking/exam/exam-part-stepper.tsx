"use client"

import React from "react"
import type { ExamPart } from "@/server/speaking/domain/speaking.types"

export interface ExamPartStepperProps {
  currentPart: ExamPart
  onSelectPart?: (part: ExamPart) => void
}

export function ExamPartStepper({ currentPart }: ExamPartStepperProps) {
  const steps: Array<{ key: ExamPart; label: string; desc: string }> = [
    { key: "PART_1", label: "Part 1", desc: "Introduction & Interview" },
    { key: "PART_2", label: "Part 2", desc: "Individual Long Turn (Cue Card)" },
    { key: "PART_3", label: "Part 3", desc: "Two-way Discussion" },
  ]

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
      {steps.map((step, idx) => {
        const isActive = currentPart === step.key
        return (
          <div
            key={step.key}
            className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
              isActive
                ? "bg-card text-foreground shadow-xs font-bold border border-border"
                : "text-muted-foreground font-medium"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {idx + 1}
            </span>
            <div className="truncate">
              <span className="block leading-tight">{step.label}</span>
              <span className="hidden sm:block text-[10px] opacity-75 truncate">{step.desc}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
