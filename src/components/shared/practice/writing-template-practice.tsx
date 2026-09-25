"use client";

import {
  AlertCircleIcon,
  BookOpen01Icon,
  Idea01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { TranslationResult } from "@/components/shared/evaluation/translation-result";
import type { TranslationEvaluation } from "@/components/shared/evaluation/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LearningItemView } from "@/server/learning/learning.service";

export type WritingTemplatePracticeProps = {
  item: LearningItemView;
  onNext: (shouldRepeat: boolean, record?: { isCorrect: boolean; userDraft?: string }) => void;
  setActiveNextAction?: (action: (() => void) | null) => void;
};

export function WritingTemplatePractice({
  item,
  onNext,
  setActiveNextAction,
}: WritingTemplatePracticeProps) {
  const [draft, setDraft] = useState("");
  const [evaluation, setEvaluation] = useState<TranslationEvaluation | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const charCount = draft.length;

  async function evaluate() {
    if (draft.trim().length < 2 || isChecking) return;
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch(`/api/learning-items/${item.id}/template/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerAnswer: draft }),
      });
      const payload = (await response.json()) as {
        data?: { evaluation: TranslationEvaluation };
      };

      if (!response.ok || !payload.data) {
        setError("AI chưa chấm được câu này. Bạn vui lòng thử lại nhé.");
        return;
      }

      setEvaluation(payload.data.evaluation);
    } catch {
      setError("Mất kết nối khi AI đang chấm câu.");
    } finally {
      setIsChecking(false);
    }
  }

  if (evaluation) {
    const shouldRepeat =
      evaluation.score < 70 ||
      evaluation.meaningScore < 70 ||
      evaluation.grammarScore < 70 ||
      Boolean(evaluation.grammarIssues && evaluation.grammarIssues.length > 0);

    return (
      <TranslationResult
        evaluation={evaluation}
        learnerAnswer={draft}
        meaningLabel="Đúng chức năng"
        nextLabel="Tiếp tục"
        onNext={() => onNext(shouldRepeat, { isCorrect: !shouldRepeat, userDraft: draft })}
        sourceText={item.applicationPromptVi}
        setActiveNextAction={setActiveNextAction}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-800 font-semibold px-2.5 py-1 text-xs gap-1.5">
            <HugeiconsIcon icon={BookOpen01Icon} size={13} className="text-sky-600" />
            <span>Chức năng: {item.promptText}</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
          <span className="text-xs font-semibold text-slate-700">
            Viết câu tiếng Việt thành câu template tiếng Anh B2
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Target Prompt & Context (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-slate-50 via-white to-sky-50/25 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                Câu tiếng Việt cần chuyển
              </span>
              {item.hintVi && (
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium"
                >
                  <HugeiconsIcon icon={Idea01Icon} size={14} />
                  <span>{showHint ? "Ẩn gợi ý" : "Xem gợi ý"}</span>
                </button>
              )}
            </div>

            <p className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
              &ldquo;{item.applicationPromptVi}&rdquo;
            </p>

            {showHint && item.hintVi && (
              <div className="pt-3 border-t border-slate-100 text-xs text-muted-foreground bg-amber-50/70 p-3 rounded-xl border-amber-200/50">
                <span className="font-semibold text-amber-900">Gợi ý từ khóa/cấu trúc: </span>
                <span className="text-slate-800">{item.hintVi}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-bold text-slate-700">💡 Mẹo viết câu template B2:</p>
            <p className="leading-relaxed text-slate-600">
              Chú ý mạo từ, thì động từ và liên từ nối học thuật. Nhấn <kbd className="rounded bg-white px-1.5 py-0.5 border border-slate-200 text-[10px] font-mono">⌘ + Enter</kbd> để nộp bài nhanh.
            </p>
          </div>
        </div>

        {/* Right Column: Textarea & Submit Action (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Bản viết tiếng Anh B2 của bạn
              </label>
              {draft.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft("")}
                  className="text-xs text-muted-foreground hover:text-rose-600 transition-colors"
                >
                  Xóa làm lại
                </button>
              )}
            </div>

            <div className="relative rounded-xl border border-slate-200 bg-white transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 shadow-2xs overflow-hidden">
              <Textarea
                className="min-h-48 sm:min-h-56 border-0 bg-transparent p-4 text-base sm:text-lg leading-relaxed shadow-none focus-visible:ring-0 focus-visible:outline-none resize-y placeholder:text-muted-foreground/60"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    void evaluate();
                  }
                }}
                placeholder="Viết câu tiếng Việt trên bằng tiếng Anh B2..."
                value={draft}
              />
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-xs text-muted-foreground">
                <span className="font-mono">
                  {wordCount} từ · {charCount} ký tự
                </span>
                <span className="hidden sm:inline text-[11px] text-muted-foreground/80">
                  Nhấn <kbd className="rounded bg-white px-1.5 py-0.5 border border-slate-200 text-[10px] font-mono">⌘ + Enter</kbd> để chấm
                </span>
              </div>
            </div>
          </div>

          <Button
            className="w-full rounded-xl font-bold h-12 text-base gap-2 shadow-xs transition-all"
            disabled={isChecking || draft.trim().length < 2}
            onClick={evaluate}
            size="lg"
            type="button"
          >
            {isChecking ? (
              <>
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>AI đang chấm bài viết...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={SparklesIcon} size={18} />
                <span>AI chấm bài viết</span>
              </>
            )}
          </Button>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-destructive flex items-center gap-2" role="alert">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
