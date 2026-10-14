"use client"

import React from "react"
import { SparklesIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

export interface SpeakingPaywallModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SpeakingPaywallModal({ isOpen, onClose }: SpeakingPaywallModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-lg"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
          <HugeiconsIcon icon={SparklesIcon} size={28} />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            Hết thời lượng luyện nói miễn phí hôm nay!
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bạn đã sử dụng hết <span className="font-semibold text-foreground">5 phút</span> luyện
            nói AI hôm nay. Hạn mức sẽ tự động được làm mới vào lúc 00:00 ngày mai.
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 text-xs text-left text-muted-foreground space-y-2">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            ✨ Quyền lợi gói Premium:
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>Luyện nói không giới hạn thời lượng (Unlimited Speaking).</li>
            <li>Thi thử trọn vẹn Full Mock Test IELTS / VSTEP.</li>
            <li>Đánh giá chi tiết 4 tiêu chí & sửa lỗi ngữ pháp nâng cao.</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Đóng
          </Button>
          <Button
            type="button"
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium"
            onClick={() => {
              alert("Tính năng Nâng cấp gói Premium sẽ sớm ra mắt!")
              onClose()
            }}
          >
            Nâng cấp Premium
          </Button>
        </div>
      </div>
    </div>
  )
}
