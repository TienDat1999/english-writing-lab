"use client"

import React, { useEffect, useState } from "react"
import { Clock01Icon, Award01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import type { SpeakingSessionDomain } from "@/server/speaking/domain/speaking.types"

export interface SessionHistoryListProps {
  onSelectSession: (session: SpeakingSessionDomain) => void
}

export function SessionHistoryList({ onSelectSession }: SessionHistoryListProps) {
  const [sessions, setSessions] = useState<SpeakingSessionDomain[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/speaking/sessions?limit=10")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.sessions)) {
          setSessions(
            data.sessions.map((s: { _id: string; [k: string]: unknown }) => ({
              ...s,
              id: s._id,
              createdAt: new Date(s.createdAt as string),
              updatedAt: new Date(s.updatedAt as string),
            })),
          )
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center text-xs text-muted-foreground animate-pulse">
        Đang tải lịch sử các buổi luyện nói...
      </div>
    )
  }

  if (sessions.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <HugeiconsIcon icon={Clock01Icon} size={18} className="text-primary" />
          <span>Lịch sử các buổi luyện nói gần đây</span>
        </h2>
      </div>

      <div className="divide-y divide-border/60">
        {sessions.map((s) => {
          const hasReport = Boolean(s.evaluationReport)
          const overallScore = s.evaluationReport?.overallScore
          const dateStr = s.createdAt.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })

          return (
            <div
              key={s.id}
              className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 px-2 rounded-xl transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground text-sm truncate">{s.topicTitle}</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-primary/10 text-primary">
                    {s.mode}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>📅 {dateStr}</span>
                  <span>💬 {s.turns?.length || 0} lượt nói</span>
                  <span>⏱️ {s.totalUserDurationSeconds || 0}s</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {hasReport && overallScore !== undefined && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20">
                    <HugeiconsIcon icon={Award01Icon} size={14} />
                    <span>{overallScore}</span>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectSession(s)}
                  className="text-xs h-8 gap-1"
                >
                  <span>{hasReport ? "Xem báo cáo" : "Tiếp tục nói"}</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
