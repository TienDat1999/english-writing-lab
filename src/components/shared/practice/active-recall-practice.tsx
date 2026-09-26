"use client";

import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { AnswerCard } from "@/components/shared/evaluation/answer-card";
import { PracticeInputBox } from "@/components/shared/practice-input-box";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9']+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export type ActiveRecallPracticeProps = {
  promptText: string;
  targetAnswer: string;
  topicText?: string;
  placeholder?: string;
  hint?: string;
  onAnswer?: (isCorrect: boolean, userDraft: string) => void;
  onNext: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  saving?: boolean;
};

export function ActiveRecallPractice({
  promptText,
  targetAnswer,
  topicText,
  placeholder = "Nhập cụm từ tiếng Anh tương ứng...",
  hint,
  onAnswer,
  onNext,
  onBack,
  canGoBack = false,
  saving = false,
}: ActiveRecallPracticeProps) {
  const [draft, setDraft] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const lastCheckedAtRef = useRef<number>(0);

  function handleCheck() {
    const trimmed = draft.trim();
    if (!trimmed || isCorrect !== null || saving) return;

    const correct = normalizeAnswer(trimmed) === normalizeAnswer(targetAnswer);
    lastCheckedAtRef.current = Date.now();
    setIsCorrect(correct);
    onAnswer?.(correct, trimmed);
  }

  function handleContinue() {
    if (isCorrect === null || saving) return;
    onNext();
  }

  // Keyboard shortcut listener: Enter to continue when answered
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isEnter = e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter";
      if (!isEnter || e.shiftKey) return;
      if (e.isComposing || e.keyCode === 229) return;

      if (isCorrect !== null) {
        if (Date.now() - lastCheckedAtRef.current < 350) return;
        e.preventDefault();
        handleContinue();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCorrect, saving]);

  return (
    <Card className="border-t-4 border-t-primary bg-card shadow-[0_18px_40px_rgb(35_87_170/12%)] rounded-2xl overflow-hidden">
      <CardHeader className="gap-1 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {topicText ? `Chủ đề: ${topicText}` : "Nghĩa tiếng Việt"}
            </CardDescription>
            <CardTitle className="mt-1 font-heading text-2xl sm:text-3xl leading-tight text-foreground">
              {promptText}
            </CardTitle>
            {hint ? (
              <p className="mt-1.5 text-xs text-muted-foreground font-medium">
                💡 Gợi ý: {hint}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {onBack ? (
              <Button
                className="rounded-full"
                disabled={!canGoBack || saving}
                onClick={onBack}
                size="sm"
                type="button"
                variant="outline"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
                Quay lại
              </Button>
            ) : null}

            {isCorrect !== null ? (
              <Button
                className="rounded-full font-bold shadow-xs animate-in fade-in-50"
                disabled={saving}
                onClick={handleContinue}
                size="sm"
                type="button"
              >
                {saving ? "Đang lưu..." : "Câu tiếp theo"}
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                <span className="hidden sm:inline text-[11px] opacity-75 font-normal ml-0.5">↵</span>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5 sm:p-6">
        {/* Input box when answering */}
        {isCorrect === null ? (
          <div className="space-y-3">
            <label htmlFor="active-recall-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Nhập từ / cụm từ tiếng Anh:
            </label>

            <PracticeInputBox
              id="active-recall-input"
              value={draft}
              onChange={setDraft}
              onSubmit={handleCheck}
              placeholder={placeholder}
              disabled={saving}
              autoFocus={true}
              minHeightClassName="min-h-24 sm:min-h-28"
              submitShortcut="enter"
            />

            <div className="flex justify-end pt-1">
              <Button
                className="rounded-xl px-6 font-bold shadow-xs"
                disabled={!draft.trim() || saving}
                onClick={handleCheck}
                type="button"
              >
                Kiểm tra đáp án
              </Button>
            </div>
          </div>
        ) : (
          /* Result feedback state with AnswerCard */
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className={`rounded-xl border p-3 flex items-center gap-2.5 ${
              isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
            }`}>
              <HugeiconsIcon
                icon={isCorrect ? CheckmarkCircle02Icon : AlertCircleIcon}
                size={22}
                className={isCorrect ? "text-emerald-600 shrink-0" : "text-rose-600 shrink-0"}
              />
              <div>
                <p className="font-bold text-sm sm:text-base">
                  {isCorrect ? "Chính xác tuyệt vời! ✓" : "Chưa chính xác rồi!"}
                </p>
                <p className="text-xs opacity-90">
                  {isCorrect
                    ? "Bạn đã gợi nhớ chính xác cụm từ này từ tiếng Việt sang tiếng Anh."
                    : "Từ này sẽ được đưa vào vòng ôn lại sau khi bạn hoàn thành lượt này."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {!isCorrect ? (
                <AnswerCard
                  label="Từ bạn đã nhập"
                  text={draft}
                  variant="learner"
                  badgeText="Chưa chính xác"
                />
              ) : null}

              <div className={isCorrect ? "sm:col-span-2" : ""}>
                <AnswerCard
                  label="Đáp án chuẩn"
                  text={targetAnswer}
                  variant="corrected"
                  badgeText="Chuẩn xác ✓"
                  showActions={true}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
