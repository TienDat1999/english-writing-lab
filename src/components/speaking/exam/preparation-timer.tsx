"use client"

import React, { useState, useEffect, useCallback } from "react"
import { PlayIcon, VolumeHighIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

export interface PreparationTimerProps {
  durationSeconds?: number
  onComplete: (notes: string) => void
  className?: string
}

export function PreparationTimer({
  durationSeconds = 60,
  onComplete,
  className = "",
}: PreparationTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [scratchNotes, setScratchNotes] = useState("")

  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(880, ctx.currentTime) // 880Hz beep
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.8)
    } catch {
      // AudioContext not available
    }
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsRunning(false)
          playBeep()
          onComplete(scratchNotes)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, scratchNotes, onComplete, playBeep])

  const formattedTime = `00:${String(secondsLeft).padStart(2, "0")}`

  return (
    <div className={`rounded-2xl bg-card border border-border p-5 space-y-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
            ⏱️ <span>Thời gian chuẩn bị (1 phút)</span>
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Sử dụng nháp để gạch nhanh các ý chính trước khi nói
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`font-mono font-extrabold text-xl px-3 py-1 rounded-xl ${
              secondsLeft <= 10
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse"
                : "bg-primary/10 text-primary"
            }`}
          >
            {formattedTime}
          </span>

          {!isRunning && secondsLeft === durationSeconds && (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsRunning(true)}
              className="text-xs gap-1.5 h-8"
            >
              <HugeiconsIcon icon={PlayIcon} size={14} />
              <span>Bắt đầu đếm giờ</span>
            </Button>
          )}

          {isRunning && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRunning(false)
                playBeep()
                onComplete(scratchNotes)
              }}
              className="text-xs h-8"
            >
              Tôi đã sẵn sàng nói
            </Button>
          )}
        </div>
      </div>

      {/* Quick Scratchpad */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          📝 Nháp nhanh (Quick Notes):
        </label>
        <textarea
          rows={3}
          value={scratchNotes}
          onChange={(e) => setScratchNotes(e.target.value)}
          placeholder="Ghi chú các ý quan trọng: địa điểm, thời gian, cảm xúc, từ vựng hay..."
          className="w-full p-3 rounded-xl bg-background border border-input text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40 resize-none font-mono"
        />
      </div>
    </div>
  )
}
