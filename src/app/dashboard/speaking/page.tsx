"use client"

import React, { useState, useEffect } from "react"
import {
  Mic01Icon,
  SparklesIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { QuotaBadge } from "@/components/speaking/quota-badge"
import { SpeakingRoom } from "@/components/speaking/speaking-room"
import { TopicCatalog } from "@/components/speaking/topic-catalog"
import { SessionHistoryList } from "@/components/speaking/session-history-list"
import type { TopicPreset } from "@/server/speaking/domain/topic-catalog.data"
import type {
  SpeakingMode,
  TargetLevel,
  SpeakingSessionDomain,
} from "@/server/speaking/domain/speaking.types"

export default function SpeakingDashboardPage() {
  const [activeSession, setActiveSession] = useState<SpeakingSessionDomain | null>(null)
  const [quotaRemaining, setQuotaRemaining] = useState<number>(300)
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("B1_B2")
  const [voicePersona, setVoicePersona] = useState<string>("nova")
  const [mode, setMode] = useState<SpeakingMode>("FREE_TALK")
  const [customTitle, setCustomTitle] = useState("")
  const [customScenario, setCustomScenario] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetch("/api/speaking/quota")
      .then((res) => res.json())
      .then((data) => {
        if (data?.remainingSeconds !== undefined) {
          setQuotaRemaining(data.remainingSeconds)
        }
      })
      .catch(() => {})
  }, [])

  const handleStartSession = async (
    topicTitle: string,
    topicScenario?: string,
    lvl?: TargetLevel,
    m?: SpeakingMode,
    examPart?: import("@/server/speaking/domain/speaking.types").ExamPart,
    cueCard?: import("@/server/speaking/domain/speaking.types").CueCardData,
  ) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/speaking/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: m || mode,
          topicTitle,
          topicScenario,
          targetLevel: lvl || targetLevel,
          voicePersona,
          speechRate: 1.0,
          examPart,
          cueCard,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.message || "Không thể khởi tạo phòng nói.")
        return
      }

      const sessionDoc = await res.json()
      setActiveSession({
        id: sessionDoc._id,
        userId: sessionDoc.userId,
        mode: sessionDoc.mode,
        examPart: sessionDoc.examPart,
        cueCard: sessionDoc.cueCard,
        hintsUsedCount: sessionDoc.hintsUsedCount || 0,
        topicTitle: sessionDoc.topicTitle,
        topicScenario: sessionDoc.topicScenario,
        targetLevel: sessionDoc.targetLevel,
        voicePersona: sessionDoc.voicePersona,
        speechRate: sessionDoc.speechRate,
        status: sessionDoc.status,
        turns: sessionDoc.turns || [],
        totalUserDurationSeconds: sessionDoc.totalUserDurationSeconds || 0,
        evaluationReport: sessionDoc.evaluationReport,
        createdAt: new Date(sessionDoc.createdAt),
        updatedAt: new Date(sessionDoc.updatedAt),
      })
    } catch {
      alert("Đã có lỗi xảy ra khi kết nối máy chủ.")
    } finally {
      setIsLoading(false)
    }
  }

  if (activeSession) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <SpeakingRoom
          initialSession={activeSession}
          onFinishSession={() => setActiveSession(null)}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={Mic01Icon} size={24} />
            </span>
            <span>AI Speaking Coach</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Luyện phản xạ giao tiếp & thi thử IELTS/VSTEP với gia sư AI thông minh
          </p>
        </div>

        <div className="flex items-center gap-3">
          <QuotaBadge remainingSeconds={quotaRemaining} />
        </div>
      </div>

      {/* Topic Catalog Component */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Chọn chủ đề luyện nói</h2>
        <TopicCatalog
          disabled={isLoading}
          onSelectTopic={(topic) =>
            handleStartSession(
              topic.title,
              topic.scenario,
              topic.level,
              topic.mode,
              topic.examPart,
              topic.cueCard,
            )
          }
        />
      </div>

      {/* Custom Scenario Builder */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <HugeiconsIcon icon={SparklesIcon} size={18} className="text-amber-500" />
          <span>Tự tạo chủ đề hội thoại theo ý muốn (Custom Scenario)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Tên chủ đề / Tình huống</label>
            <input
              type="text"
              placeholder="Ví dụ: Đóng vai trả giá mua hàng tại chợ Bến Thành"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Trình độ mong muốn (Level)</label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value as TargetLevel)}
              className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            >
              <option value="A2">A2 — Cơ bản (Elementary)</option>
              <option value="B1_B2">B1-B2 — Trung cấp (Intermediate)</option>
              <option value="C1">C1 — Nâng cao (Advanced)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Mô tả kịch bản chi tiết (Tùy chọn)</label>
          <textarea
            rows={2}
            placeholder="Mô tả bối cảnh hoặc vai trò bạn muốn AI đóng (Ví dụ: AI đóng vai người bán hàng khó tính...)"
            value={customScenario}
            onChange={(e) => setCustomScenario(e.target.value)}
            className="w-full p-3 rounded-xl bg-background border border-input text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            disabled={!customTitle.trim() || isLoading}
            onClick={() => handleStartSession(customTitle, customScenario, targetLevel)}
            className="gap-2"
          >
            <HugeiconsIcon icon={PlayIcon} size={16} />
            <span>Khởi tạo phòng nói</span>
          </Button>
        </div>
      </div>

      {/* Session History List Component */}
      <SessionHistoryList
        onSelectSession={(session) => {
          setActiveSession(session)
        }}
      />
    </div>
  )
}

