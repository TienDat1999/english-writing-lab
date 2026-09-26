"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { PronounceButton } from "@/components/shared/pronounce-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function cleanMeaningText(value: string) {
  return value.replace(/^(Ý nghĩa|Nghĩa):\s*/i, "").trim();
}

export function normalizeMeaning(value: string) {
  return cleanMeaningText(value)
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?]+$/, "")
    .replace(/\s+/g, " ");
}

export const FALLBACK_DISTRACTOR_MEANINGS = [
  "đưa ra quyết định",
  "lập kế hoạch",
  "hành động",
  "chịu trách nhiệm",
  "tạo sự khác biệt",
  "dành thời gian cho",
  "tận dụng cơ hội",
  "chăm sóc chu đáo",
  "kết bạn mới",
  "tiến bộ vượt bậc",
  "nỗ lực hết mình",
  "mắc lỗi nhỏ",
  "giữ đúng lời hứa",
  "đạt được mục tiêu",
  "thay đổi ý kiến",
  "thu hút sự chú ý",
  "tạo ấn tượng tốt",
  "tìm ra giải pháp",
  "vượt qua khó khăn",
  "tham gia hoạt động",
  "đặt lịch hẹn trước",
  "ghi chú cẩn thận",
  "thay phiên nhau",
  "chia sẻ quan điểm",
  "giải quyết vấn đề",
  "phát huy tiềm năng",
  "xây dựng lòng tin",
  "nâng cao nhận thức",
  "bảo vệ môi trường",
  "duy trì liên lạc",
];

export function buildMeaningOptions(
  item: { promptText: string; answerText: string },
  allItems: Array<{ promptText: string; answerText: string }>,
) {
  const currentMeaning = cleanMeaningText(item.promptText);
  const options = [currentMeaning, ...allItems.map((candidate) => cleanMeaningText(candidate.promptText))].filter(
    (value, index, values) =>
      Boolean(value) && values.findIndex((v) => normalizeMeaning(v) === normalizeMeaning(value)) === index,
  );

  // Luôn đảm bảo đủ 4 options khi topic có ít hơn 4 câu hỏi
  if (options.length < 4) {
    const seed = [...item.answerText].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    for (let i = 0; i < FALLBACK_DISTRACTOR_MEANINGS.length && options.length < 4; i++) {
      const candidate = FALLBACK_DISTRACTOR_MEANINGS[(seed + i) % FALLBACK_DISTRACTOR_MEANINGS.length];
      if (!options.some((o) => normalizeMeaning(o) === normalizeMeaning(candidate))) {
        options.push(candidate);
      }
    }
  }

  const final4 = options.slice(0, 4);
  const offset =
    [...item.answerText].reduce((total, character) => total + character.charCodeAt(0), 0) % (final4.length || 1);

  return [...final4.slice(offset), ...final4.slice(0, offset)];
}

export type RecognitionPracticeProps = {
  targetText: string;
  promptMeaning: string;
  options: string[];
  categoryLabel?: string;
  contextSentence?: string;
  onAnswer?: (isCorrect: boolean, selectedOption: string) => void;
  onNext: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  saving?: boolean;
};

export function RecognitionPractice({
  targetText,
  promptMeaning,
  options,
  categoryLabel = "Cụm từ tiếng Anh",
  contextSentence,
  onAnswer,
  onNext,
  onBack,
  canGoBack = false,
  saving = false,
}: RecognitionPracticeProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const lastCheckedAtRef = useRef<number>(0);
  const cleanedPrompt = cleanMeaningText(promptMeaning);

  function handleSelect(option: string) {
    if (isCorrect !== null || saving) return;

    const correct = normalizeMeaning(option) === normalizeMeaning(cleanedPrompt);
    lastCheckedAtRef.current = Date.now();
    setSelectedOption(option);
    setIsCorrect(correct);
    onAnswer?.(correct, option);
  }

  function handleContinue() {
    if (isCorrect === null || saving) return;
    onNext();
  }

  // Keyboard shortcut listener: 1-4 for options, Enter for continue
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (isCorrect !== null) {
        if (e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter") {
          // Prevent accidental double-action: ensure at least 350ms passed since answer
          if (Date.now() - lastCheckedAtRef.current < 350) return;
          e.preventDefault();
          handleContinue();
        }
        return;
      }

      const key = e.key;
      if (["1", "2", "3", "4"].includes(key)) {
        const index = parseInt(key, 10) - 1;
        if (options[index]) {
          e.preventDefault();
          handleSelect(options[index]);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCorrect, options, saving]);

  return (
    <Card className="border-t-4 border-t-primary bg-card shadow-[0_18px_40px_rgb(35_87_170/12%)] rounded-2xl overflow-hidden">
      <CardHeader className="gap-1 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {categoryLabel}
            </CardDescription>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <CardTitle className="font-heading text-2xl sm:text-3xl leading-tight text-foreground">
                {targetText}
              </CardTitle>
              <PronounceButton text={targetText} />
            </div>
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
        <p className="text-sm font-semibold text-slate-700">
          Chọn nghĩa tiếng Việt chính xác nhất:
        </p>

        {/* 4 Choices Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option, index) => {
            const isOptionCorrect = normalizeMeaning(option) === normalizeMeaning(cleanedPrompt);
            const isSelected = selectedOption === option;

            let optionStyle = "border-slate-200 bg-card hover:border-primary/60 hover:bg-slate-50/70 text-slate-800";
            let badgeStyle = "bg-slate-100 text-slate-600";
            let iconElement: React.ReactNode = null;

            if (isCorrect !== null) {
              if (isOptionCorrect) {
                optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs";
                badgeStyle = "bg-emerald-600 text-white";
                iconElement = <span className="font-bold text-emerald-600 ml-auto shrink-0 text-base">✓</span>;
              } else if (isSelected) {
                optionStyle = "border-rose-400 bg-rose-50 text-rose-950 line-through opacity-90";
                badgeStyle = "bg-rose-600 text-white";
                iconElement = <span className="font-bold text-rose-600 ml-auto shrink-0 text-base">✗</span>;
              } else {
                optionStyle = "border-slate-200 bg-card opacity-40 text-slate-400";
              }
            }

            return (
              <button
                key={`${option}-${index}`}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all cursor-pointer disabled:cursor-default ${optionStyle}`}
                disabled={isCorrect !== null || saving}
                onClick={() => handleSelect(option)}
                type="button"
              >
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${badgeStyle}`}>
                  {index + 1}
                </span>
                <span className="font-medium leading-snug flex-1">{option}</span>
                {iconElement}
              </button>
            );
          })}
        </div>

        {/* Result banner & Context */}
        {isCorrect !== null ? (
          <div
            className={`mt-4 rounded-xl border p-4 space-y-2 animate-in fade-in-50 duration-200 ${
              isCorrect
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={isCorrect ? CheckmarkCircle02Icon : AlertCircleIcon}
                size={20}
                className={isCorrect ? "text-emerald-600" : "text-rose-600"}
              />
              <p className={`font-bold text-sm sm:text-base ${isCorrect ? "text-emerald-800" : "text-rose-800"}`}>
                {isCorrect ? "Chính xác ✓" : "Chưa chính xác rồi!"}
              </p>
            </div>

            {!isCorrect ? (
              <div className="pt-1 text-xs sm:text-sm text-slate-800 space-y-1">
                <p>
                  Nghĩa đúng của <strong className="text-slate-950 font-bold">&ldquo;{targetText}&rdquo;</strong> là:{" "}
                  <strong className="text-emerald-800 font-bold underline decoration-emerald-500 underline-offset-2">
                    {cleanedPrompt}
                  </strong>
                </p>
                <p className="text-xs text-rose-700 font-medium">
                  Từ này sẽ tự động xuất hiện lại trong vòng ôn tập tiếp theo để bạn ghi nhớ.
                </p>
              </div>
            ) : null}

            {contextSentence ? (
              <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Ví dụ minh họa: </span>
                <span className="italic">{contextSentence}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
