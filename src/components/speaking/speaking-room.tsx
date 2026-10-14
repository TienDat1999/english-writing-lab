"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  Mic01Icon,
  StopIcon,
  Cancel01Icon,
  Tick02Icon,
  Loading03Icon,
  BotIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { useAudioRecorder } from "./hooks/use-audio-recorder"
import { useSpeechPlayer } from "./hooks/use-speech-player"
import { AudioVisualizer } from "./audio-visualizer"
import { QuotaBadge } from "./quota-badge"
import { SpeakingTurnItem } from "./speaking-turn-item"
import { SpeakingPaywallModal } from "./speaking-paywall-modal"
import { SpeakingReportView } from "./speaking-report-view"
import { ScaffoldingDrawer } from "./scaffolding-drawer"
import { CueCardDisplay } from "./exam/cue-card-display"
import { PreparationTimer } from "./exam/preparation-timer"
import { ExamPartStepper } from "./exam/exam-part-stepper"
import { AudioDeviceSelector } from "./audio-device-selector"
import { HelpCircleIcon } from "@hugeicons/core-free-icons"
import type {
  SpeakingSessionDomain,
  SpeakingTurn,
  SpeakingEvaluationReport,
} from "@/server/speaking/domain/speaking.types"

export interface SpeakingRoomProps {
  initialSession: SpeakingSessionDomain
  onFinishSession?: () => void
}

export function SpeakingRoom({ initialSession, onFinishSession }: SpeakingRoomProps) {
  const [session, setSession] = useState<SpeakingSessionDomain>(initialSession)
  const [evaluationReport, setEvaluationReport] = useState<SpeakingEvaluationReport | null>(
    initialSession.evaluationReport || null,
  )
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isScaffoldingOpen, setIsScaffoldingOpen] = useState(false)
  const [isPrepComplete, setIsPrepComplete] = useState(false)
  const [quotaRemaining, setQuotaRemaining] = useState<number>(300)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)
  const [pipelineState, setPipelineState] = useState<
    "IDLE" | "RECORDING" | "TRANSCRIBING" | "THINKING" | "SPEAKING"
  >("IDLE")
  const [errorToast, setErrorToast] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const { isPlaying, playBase64Audio, playSpeechText, stopAudio } = useSpeechPlayer()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [session.turns, pipelineState, scrollToBottom])

  // Fetch initial user quota
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

  const handleAudioReady = useCallback(
    async (blob: Blob, durationSec: number) => {
      if (quotaRemaining <= 0) {
        setIsPaywallOpen(true)
        setPipelineState("IDLE")
        return
      }

      setPipelineState("TRANSCRIBING")
      try {
        const ext = blob.type.includes("mp4")
          ? "mp4"
          : blob.type.includes("m4a") || blob.type.includes("aac")
          ? "m4a"
          : blob.type.includes("wav")
          ? "wav"
          : blob.type.includes("ogg")
          ? "ogg"
          : "webm"

        const formData = new FormData()
        formData.append("audio", blob, `user-recording.${ext}`)
        formData.append("durationSeconds", String(durationSec))

        setPipelineState("THINKING")
        const res = await fetch(`/api/speaking/sessions/${session.id}/turns`, {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}))
          if (errJson.error === "QUOTA_EXCEEDED") {
            setIsPaywallOpen(true)
            throw new Error("Bạn đã dùng hết hạn mức nói hôm nay.")
          }
          if (errJson.error === "AUDIO_TOO_SHORT") {
            throw new Error("Âm thanh thu được quá ngắn hoặc micro chưa bắt được tiếng. Vui lòng thử nói lại.")
          }
          if (errJson.message?.includes("EMPTY_SPEECH")) {
            throw new Error("Không nhận diện được giọng nói tiếng Anh. Vui lòng nói to và rõ hơn rồi thử lại.")
          }
          throw new Error(errJson.message || "Không thể xử lý âm thanh.")
        }

        const data = await res.json()
        const newTurn = data.turn as SpeakingTurn
        setSession((prev) => ({
          ...prev,
          turns: [...prev.turns, newTurn],
        }))

        if (data.quota?.remainingSeconds !== undefined) {
          setQuotaRemaining(data.quota.remainingSeconds)
        }

        // Auto play AI voice response
        if (newTurn.aiAudioBase64) {
          setPipelineState("SPEAKING")
          playBase64Audio(newTurn.aiAudioBase64, () => {
            setPipelineState("IDLE")
          })
        } else {
          setPipelineState("IDLE")
        }
      } catch (err) {
        setPipelineState("IDLE")
        const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra."
        setErrorToast(msg)
        setTimeout(() => setErrorToast(null), 5000)
      }
    },
    [quotaRemaining, session.id, playBase64Audio],
  )

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferred_audio_device_id")
      if (saved) setSelectedDeviceId(saved)
    }
  }, [])

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_audio_device_id", deviceId)
    }
  }

  const { state: recordState, duration, audioLevel, startRecording, stopRecording, cancelRecording } =
    useAudioRecorder({
      deviceId: selectedDeviceId || undefined,
      onAudioReady: handleAudioReady,
      onError: (err) => {
        setErrorToast(err)
        setTimeout(() => setErrorToast(null), 5000)
      },
    })

  // Synchronize recording state
  useEffect(() => {
    if (recordState === "recording") setPipelineState("RECORDING")
  }, [recordState])

  // Spacebar push-to-talk handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && pipelineState === "IDLE") {
        const activeTag = document.activeElement?.tagName.toLowerCase()
        if (activeTag === "input" || activeTag === "textarea") return
        e.preventDefault()
        if (quotaRemaining <= 0) {
          setIsPaywallOpen(true)
          return
        }
        startRecording()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && recordState === "recording") {
        e.preventDefault()
        stopRecording()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [pipelineState, recordState, quotaRemaining, startRecording, stopRecording])

  const handleFinish = async () => {
    if (session.turns.length === 0) {
      await fetch(`/api/speaking/sessions/${session.id}/finish`, { method: "POST" }).catch(() => {})
      onFinishSession?.()
      return
    }

    setIsEvaluating(true)
    try {
      const res = await fetch(`/api/speaking/sessions/${session.id}/evaluate`, {
        method: "POST",
      })
      if (!res.ok) {
        throw new Error("Không thể tạo báo cáo đánh giá.")
      }
      const data = await res.json()
      if (data?.report) {
        setEvaluationReport(data.report)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi chấm điểm."
      setErrorToast(msg)
    } finally {
      setIsEvaluating(false)
    }
  }

  if (evaluationReport) {
    return (
      <SpeakingReportView
        session={session}
        report={evaluationReport}
        onBackToDashboard={onFinishSession}
      />
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2.5 px-6 py-4 border-b border-border bg-card/60 backdrop-blur-xs shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
              <span>🎙️ {session.topicTitle}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                {session.mode}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Level: {session.targetLevel} • Voice: {session.voicePersona}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <QuotaBadge remainingSeconds={quotaRemaining} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isEvaluating}
              onClick={handleFinish}
              className="text-xs h-8 gap-1.5"
            >
              <HugeiconsIcon
                icon={isEvaluating ? Loading03Icon : Tick02Icon}
                size={14}
                className={isEvaluating ? "animate-spin text-primary" : ""}
              />
              <span>{isEvaluating ? "Đang chấm điểm..." : "Kết thúc & Chấm điểm"}</span>
            </Button>
          </div>
        </div>

        {/* Exam Part Stepper */}
        {(session.mode === "IELTS" || session.mode === "VSTEP") && (
          <ExamPartStepper currentPart={session.examPart || "PART_1"} />
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Cue Card & Preparation Timer (Part 2) */}
        {session.cueCard && (
          <div className="space-y-3 pb-2">
            <CueCardDisplay cueCard={session.cueCard} />
            {!isPrepComplete && session.turns.length === 0 && (
              <PreparationTimer onComplete={() => setIsPrepComplete(true)} />
            )}
          </div>
        )}

        {session.turns.length === 0 && !session.cueCard && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-muted-foreground py-12">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <HugeiconsIcon icon={Mic01Icon} size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Bắt đầu buổi nói chuyện</p>
              <p className="text-xs max-w-sm">
                Nhấn giữ nút Micro bên dưới (hoặc giữ phím <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">Space</kbd>) để nói câu đầu tiên!
              </p>
            </div>
          </div>
        )}

        {session.turns.map((turn, idx) => (
          <SpeakingTurnItem
            key={turn.id || idx}
            turn={turn}
            onReplayAiAudio={(t) => {
              if (t.aiAudioBase64) {
                playBase64Audio(t.aiAudioBase64)
              } else {
                playSpeechText(t.aiReplyText)
              }
            }}
            isAudioPlaying={isPlaying}
          />
        ))}

        {/* Live Pipeline State Bubble */}
        {pipelineState !== "IDLE" && pipelineState !== "RECORDING" && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground py-2 animate-in fade-in">
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={BotIcon} size={16} />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2">
              <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin text-primary" />
              <span>
                {pipelineState === "TRANSCRIBING" && "Đang nhận diện giọng nói (Whisper)..."}
                {pipelineState === "THINKING" && "AI đang suy nghĩ câu trả lời..."}
                {pipelineState === "SPEAKING" && "AI đang trả lời..."}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Toast */}
      {errorToast && (
        <div className="mx-6 mb-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between animate-in slide-in-from-bottom-2">
          <span>⚠️ {errorToast}</span>
          <button type="button" onClick={() => setErrorToast(null)} className="p-1">
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="p-4 border-t border-border bg-card/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 shrink-0">
        <AudioVisualizer
          isActive={recordState === "recording"}
          audioLevel={audioLevel}
          className="w-full max-w-xs"
        />

        <div className="flex items-center gap-3">
          {/* Audio Device Selector */}
          <AudioDeviceSelector
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={handleDeviceChange}
          />

          {/* Need Help Scaffolding Button */}
          {recordState !== "recording" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsScaffoldingOpen(true)}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 gap-1.5 rounded-full h-11 px-4"
              title="Nhận gợi ý ý tưởng & từ vựng khi bí từ"
            >
              <HugeiconsIcon icon={HelpCircleIcon} size={16} />
              <span>Need Help?</span>
            </Button>
          )}

          {recordState === "recording" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelRecording}
              className="text-xs text-rose-500 hover:text-rose-600 gap-1 rounded-full h-10 px-4"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
              <span>Hủy</span>
            </Button>
          )}

          {recordState === "recording" ? (
            <Button
              type="button"
              onClick={stopRecording}
              className="h-16 px-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-lg shadow-rose-500/20 gap-2 animate-pulse"
            >
              <HugeiconsIcon icon={StopIcon} size={24} />
              <span>Dừng & Gửi ({duration}s)</span>
            </Button>
          ) : (
            <Button
              type="button"
              disabled={pipelineState !== "IDLE" || quotaRemaining <= 0}
              onClick={() => {
                if (quotaRemaining <= 0) {
                  setIsPaywallOpen(true)
                  return
                }
                startRecording()
              }}
              className={`h-16 px-8 rounded-full font-semibold shadow-lg gap-2 text-base ${
                quotaRemaining <= 0
                  ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25"
              }`}
            >
              <HugeiconsIcon icon={Mic01Icon} size={24} />
              <span>
                {quotaRemaining <= 0
                  ? "Hết hạn mức hôm nay"
                  : pipelineState !== "IDLE"
                  ? "Đang xử lý..."
                  : "Nhấn để nói"}
              </span>
            </Button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Mẹo: Giữ phím <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">Space</kbd> để thu âm, nhả phím để gửi.
        </p>
      </div>

      {/* Scaffolding Drawer */}
      <ScaffoldingDrawer
        sessionId={session.id}
        isOpen={isScaffoldingOpen}
        onClose={() => setIsScaffoldingOpen(false)}
      />

      {/* Paywall Modal */}
      <SpeakingPaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} />
    </div>
  )
}
