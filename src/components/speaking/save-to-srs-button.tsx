"use client"

import React, { useState } from "react"
import { Bookmark02Icon, CheckmarkCircle02Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

export interface SaveToSrsButtonProps {
  sourceType: "VOCABULARY" | "GRAMMAR" | "PHRASE"
  title: string
  topicText?: string
  quizType?: "COLLOCATION" | "TOPIC_VOCABULARY" | "PARAPHRASE" | "SYNONYM" | "TEMPLATE" | null
  promptText: string
  answerText: string
  hintVi?: string
  contextText?: string
  size?: "default" | "sm" | "icon"
  variant?: "outline" | "ghost" | "default" | "secondary"
  className?: string
  label?: string
}

export function SaveToSrsButton({
  sourceType,
  title,
  topicText,
  quizType,
  promptText,
  answerText,
  hintVi,
  contextText,
  size = "sm",
  variant = "ghost",
  className = "",
  label = "Lưu SRS",
}: SaveToSrsButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (status === "saving" || status === "saved") return

    try {
      setStatus("saving")
      const res = await fetch("/api/speaking/save-to-srs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          title,
          topicText,
          quizType,
          promptText,
          answerText,
          hintVi,
          contextText,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to save item to SRS")
      }

      setStatus("saved")
    } catch {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 2500)
    }
  }

  if (status === "saved") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 ${className}`}>
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
        <span>Đã lưu vào SRS</span>
      </span>
    )
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={status === "saving"}
      onClick={handleSave}
      className={`h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-primary transition-colors ${className}`}
      title="Lưu vào kho ôn tập Spaced Repetition"
    >
      {status === "saving" ? (
        <>
          <HugeiconsIcon icon={Loading03Icon} size={12} className="animate-spin" />
          <span>Đang lưu...</span>
        </>
      ) : (
        <>
          <HugeiconsIcon icon={Bookmark02Icon} size={12} />
          <span>{status === "error" ? "Lỗi! Thử lại" : label}</span>
        </>
      )}
    </Button>
  )
}
