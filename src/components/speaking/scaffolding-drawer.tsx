"use client"

import React, { useState } from "react"
import {
  SparklesIcon,
  Cancel01Icon,
  Copy01Icon,
  Tick02Icon,
  HelpCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import type { ScaffoldingHintResult } from "@/server/speaking/domain/speaking.types"

export interface ScaffoldingDrawerProps {
  sessionId: string
  isOpen: boolean
  onClose: () => void
}

export function ScaffoldingDrawer({ sessionId, isOpen, onClose }: ScaffoldingDrawerProps) {
  const [hint, setHint] = useState<ScaffoldingHintResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleFetchHint = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/speaking/sessions/${sessionId}/scaffolding`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Không thể lấy gợi ý.")
      const data = await res.json()
      if (data?.hint) {
        setHint(data.hint)
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (isOpen && !hint && !isLoading) {
      void handleFetchHint()
    }
  }, [isOpen, hint, isLoading])

  if (!isOpen) return null

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
              <HugeiconsIcon icon={SparklesIcon} size={18} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Gợi ý Ý tưởng & Từ vựng (Live Scaffolding)</h3>
              <p className="text-[11px] text-muted-foreground">Trợ giúp nhanh khi bạn chưa nghĩ ra cách trả lời</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        {isLoading && (
          <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <HugeiconsIcon icon={Loading03Icon} size={24} className="animate-spin text-primary" />
            <span>AI đang phân tích câu hỏi và sinh gợi ý...</span>
          </div>
        )}

        {!isLoading && hint && (
          <div className="space-y-4 text-xs">
            {/* 1. Sentence Starter */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary flex items-center gap-1">
                  🚀 Câu mồi mở đầu (Sentence Starter):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(hint.sentenceStarter, "starter")}
                  className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                >
                  <HugeiconsIcon icon={copiedKey === "starter" ? Tick02Icon : Copy01Icon} size={12} />
                  <span>{copiedKey === "starter" ? "Đã copy" : "Copy"}</span>
                </button>
              </div>
              <p className="text-foreground italic font-medium">"{hint.sentenceStarter}"</p>
            </div>

            {/* 2. Idea / Key Point */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-border p-3.5 space-y-1.5">
              <span className="font-bold text-foreground flex items-center gap-1">
                💡 Hướng triển khai ý (Key Point):
              </span>
              <p className="text-muted-foreground leading-relaxed">{hint.idea}</p>
            </div>

            {/* 3. Useful Collocations */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-border p-3.5 space-y-2">
              <span className="font-bold text-foreground flex items-center gap-1">
                📚 Cụm từ vựng ăn điểm (Collocations):
              </span>
              <div className="space-y-1.5">
                {hint.usefulCollocations.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60"
                  >
                    <div>
                      <span className="font-bold text-primary">{item.phrase}</span>
                      <span className="text-muted-foreground ml-1.5">: {item.meaningVi}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.phrase, `colloc-${idx}`)}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <HugeiconsIcon
                        icon={copiedKey === `colloc-${idx}` ? Tick02Icon : Copy01Icon}
                        size={12}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
