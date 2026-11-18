"use client";

import {
  ArrowRight01Icon,
  BookOpen01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Edit02Icon,
  SparklesIcon,
  Target01Icon,
  TranslateIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React, { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const criteriaConfig = {
  taskResponse: {
    title: "Mức độ trả lời đề bài",
    enTitle: "Task Response",
    icon: Target01Icon,
    accentClass: "border-sky-200 bg-sky-50/50 text-sky-800",
    badgeClass: "border-sky-300 bg-sky-50 text-sky-800",
    iconBg: "bg-sky-50 text-sky-700",
  },
  logicReasoning: {
    title: "Tính logic & Lập luận",
    enTitle: "Logic & Reasoning",
    icon: SparklesIcon,
    accentClass: "border-indigo-200 bg-indigo-50/50 text-indigo-800",
    badgeClass: "border-indigo-300 bg-indigo-50 text-indigo-800",
    iconBg: "bg-indigo-50 text-indigo-700",
  },
  realismPersuasiveness: {
    title: "Tính thuyết phục thực tế",
    enTitle: "Realism & Persuasiveness",
    icon: CheckmarkCircle02Icon,
    accentClass: "border-emerald-200 bg-emerald-50/50 text-emerald-800",
    badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
    iconBg: "bg-emerald-50 text-emerald-700",
  },
  ideaDevelopment: {
    title: "Mở rộng & Phát triển ý",
    enTitle: "Idea Development",
    icon: BookOpen01Icon,
    accentClass: "border-violet-200 bg-violet-50/50 text-violet-800",
    badgeClass: "border-violet-300 bg-violet-50 text-violet-800",
    iconBg: "bg-violet-50 text-violet-700",
  },
  vocabularyGrammar: {
    title: "Ngữ pháp & Từ vựng",
    enTitle: "Vocabulary & Grammar",
    icon: Edit02Icon,
    accentClass: "border-amber-200 bg-amber-50/50 text-amber-800",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-800",
    iconBg: "bg-amber-50 text-amber-700",
  },
  nativeLikeWriting: {
    title: "Văn phong tự nhiên",
    enTitle: "Native-like Writing",
    icon: TranslateIcon,
    accentClass: "border-teal-200 bg-teal-50/50 text-teal-800",
    badgeClass: "border-teal-300 bg-teal-50 text-teal-800",
    iconBg: "bg-teal-50 text-teal-700",
  },
} as const;

export type CriteriaFeedbackData = Partial<
  Record<keyof typeof criteriaConfig, string>
>;

interface CriteriaDrawerProps {
  criteriaFeedback?: CriteriaFeedbackData;
  isLetter?: boolean;
  variant?: "hero" | "compact" | "button";
  triggerLabel?: string;
  className?: string;
}

export function CriteriaDrawer({
  criteriaFeedback,
  isLetter = false,
  variant = "hero",
  triggerLabel,
  className,
}: CriteriaDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Khóa cuộn trang khi drawer đang mở & bắt phím ESC để đóng
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button tuỳ theo vị trí */}
      {variant === "hero" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs backdrop-blur-xs transition-all hover:bg-white/20 hover:border-white/30 active:scale-[0.98] cursor-pointer ${
            className || ""
          }`}
        >
          <HugeiconsIcon icon={SparklesIcon} size={15} className="text-sky-300" />
          <span>{triggerLabel || (isLetter ? "Xem 6 tiêu chí chấm Thư" : "Xem rubric 6 tiêu chí")}</span>
          <span className="text-white/60 text-xs">↗</span>
        </button>
      ) : variant === "compact" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`shrink-0 gap-1.5 rounded-xl font-bold border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs cursor-pointer ${
            className || ""
          }`}
        >
          <HugeiconsIcon icon={SparklesIcon} size={14} className="text-sky-600" />
          <span>{triggerLabel || "Xem chi tiết 6 tiêu chí"}</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`gap-1.5 rounded-xl font-semibold cursor-pointer ${
            className || ""
          }`}
        >
          <HugeiconsIcon icon={SparklesIcon} size={14} className="text-sky-600" />
          <span>{triggerLabel || "Xem 6 tiêu chí khảo thí"}</span>
        </Button>
      )}

      {/* Drawer Overlay & Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            isLetter
              ? "Đánh giá chi tiết tiêu chí Thư"
              : "Đánh giá theo 6 khía cạnh chuyên sâu"
          }
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* Backdrop mờ */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Slide-over Panel */}
          <div className="relative z-50 flex h-full w-full max-w-2xl flex-col bg-slate-50 text-slate-900 shadow-2xl transition-transform duration-300 animate-in slide-in-from-right">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <Badge
                  variant="outline"
                  className="mb-1.5 text-[11px] font-semibold border-sky-300 bg-sky-50 text-sky-800"
                >
                  Tiêu chuẩn chấm chi tiết
                </Badge>
                <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
                  {isLetter
                    ? "Đánh giá chi tiết tiêu chí Thư"
                    : "Đánh giá theo 6 khía cạnh chuyên sâu"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Phân tích toàn diện mức độ hoàn thiện của bài luận theo tiêu chí khảo thí.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Đóng bảng phân tích"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            {/* Body (Scrollable List 6 Cards) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                {Object.entries(criteriaConfig).map(([key, config]) => {
                  const feedbackText =
                    criteriaFeedback?.[key as keyof typeof criteriaConfig] ||
                    "Đang cập nhật đánh giá.";
                  const IconComponent = config.icon;

                  return (
                    <div
                      key={key}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div
                            className={`flex size-8 items-center justify-center rounded-lg ${config.iconBg}`}
                          >
                            <HugeiconsIcon icon={IconComponent} size={18} />
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${config.badgeClass}`}
                          >
                            {config.enTitle}
                          </Badge>
                        </div>

                        <h3 className="font-heading text-sm font-bold text-slate-900 mb-1.5">
                          {config.title}
                        </h3>

                        <p className="text-xs leading-relaxed text-slate-600 font-normal">
                          {feedbackText}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative Note at the bottom */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 text-xs leading-relaxed text-sky-900 flex items-start gap-2.5 mt-4">
                <span className="text-base leading-none">💡</span>
                <p>
                  <strong>Lưu ý khảo thí:</strong> 6 khía cạnh trên là cơ sở để giám khảo đối chiếu band điểm. Hãy ưu tiên khắc phục các lỗi trong phần <strong>Sửa lỗi ngữ pháp</strong> và áp dụng cụm từ trong <strong>Nâng cấp từ vựng</strong> để cải thiện nhanh nhất.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 bg-white px-6 py-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="rounded-xl font-semibold cursor-pointer"
              >
                Đã hiểu & Đóng lại
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
