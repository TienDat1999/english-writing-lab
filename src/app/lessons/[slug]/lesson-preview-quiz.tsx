"use client";

import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  HelpCircleIcon,
  InformationCircleIcon,
  RefreshIcon,
  SparklesIcon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type PreviewExerciseData = {
  id: string;
  position: number;
  exerciseType: string;
  instruction: string;
  promptText: string;
  hintText: string;
  explanationText: string;
  targetContent: string;
  contextText: string;
  choices: string[];
  correctAnswer: string | null;
  estimatedSeconds: number | null;
};

const friendlyTypeLabels: Record<string, string> = {
  MEANING_CHOICE: "Trắc nghiệm Collocation",
  FILL_BLANK: "Điền từ vào chỗ trống",
  COLLOCATION_MATCH: "Ghép cụm từ tự nhiên",
  SYNONYM: "Từ đồng nghĩa nâng cao",
  TYPE_ANSWER: "Điền từ nâng cao",
  ORDER_PARTS: "Sắp xếp cấu trúc",
};

export function LessonPreviewQuiz({ exercise }: { exercise: PreviewExerciseData }) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const isAnswered = selectedChoice !== null;
  const isCorrect =
    exercise.correctAnswer && selectedChoice
      ? selectedChoice.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase()
      : null;

  const typeLabel = friendlyTypeLabels[exercise.exerciseType] || "Luyện tập tương tác";

  // Tạo hiển thị cụm từ có ô trống (blank)
  const displayPhrase = useMemo(() => {
    if (!exercise.targetContent) return null;
    const target = exercise.targetContent.trim();

    if (exercise.correctAnswer) {
      const correct = exercise.correctAnswer.trim();
      const regex = new RegExp(`\\b${correct}\\b`, "i");
      if (regex.test(target)) {
        if (!selectedChoice) {
          return target.replace(regex, "_______");
        }
        return target.replace(regex, selectedChoice);
      }
    }
    return target;
  }, [exercise.targetContent, exercise.correctAnswer, selectedChoice]);

  // Phân tách phần ý nghĩa tiếng Việt từ promptText
  const meaningText = useMemo(() => {
    if (!exercise.promptText) return null;
    return exercise.promptText.replace(/^Ý nghĩa:\s*/i, "").trim();
  }, [exercise.promptText]);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Quiz Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-sky-50 text-primary">
            <HugeiconsIcon icon={HelpCircleIcon} size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Câu hỏi thực hành mẫu
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[11px] font-semibold bg-sky-50 text-sky-800 border-sky-100">
            {typeLabel}
          </Badge>
          {exercise.estimatedSeconds && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-md">
              <HugeiconsIcon icon={Clock01Icon} size={11} />
              ~{exercise.estimatedSeconds}s
            </span>
          )}
        </div>
      </div>

      {/* Instruction */}
      {exercise.instruction && (
        <p className="text-xs sm:text-sm font-medium text-slate-800">
          {exercise.instruction}
        </p>
      )}

      {/* Target Phrase Box with Blank */}
      <div className="rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-50/80 to-sky-50/30 p-3.5 sm:p-4 text-center space-y-2">
        {displayPhrase ? (
          <div className="text-base sm:text-lg font-bold tracking-wide text-slate-900">
            {displayPhrase.split(" ").map((word, wIdx) => {
              const isSelectedWord =
                selectedChoice && word.toLowerCase() === selectedChoice.toLowerCase();
              const isBlank = word.includes("_______");

              if (isBlank) {
                return (
                  <span
                    key={wIdx}
                    className="inline-block mx-1 px-2.5 py-0.5 rounded-md bg-white border border-dashed border-sky-300 font-mono text-sky-700 text-sm"
                  >
                    ______
                  </span>
                );
              }

              if (isSelectedWord) {
                return (
                  <span
                    key={wIdx}
                    className={`inline-block mx-1 px-2 py-0.5 rounded-md font-bold transition-all ${
                      isCorrect
                        ? "bg-emerald-100 border border-emerald-300 text-emerald-800 scale-105"
                        : "bg-rose-100 border border-rose-300 text-rose-800"
                    }`}
                  >
                    {word}
                  </span>
                );
              }

              return <span key={wIdx} className="mx-0.5">{word}</span>;
            })}
          </div>
        ) : null}

        {meaningText && (
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-white/90 border border-slate-200/60 px-2.5 py-1 rounded-full shadow-2xs">
            <span className="font-semibold text-slate-500">Ý nghĩa:</span>
            <span className="font-medium text-slate-800">{meaningText}</span>
          </div>
        )}
      </div>

      {/* Choices Grid */}
      {exercise.choices && exercise.choices.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Bấm chọn từ đúng để hoàn thành cụm:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {exercise.choices.map((choice, cIdx) => {
              const letter = String.fromCharCode(65 + cIdx);
              const isSelected = selectedChoice === choice;
              const isOptionCorrect =
                exercise.correctAnswer &&
                choice.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase();

              let choiceStyle =
                "border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50/40";
              let badgeStyle = "bg-slate-100 text-slate-600";

              if (isAnswered) {
                if (isSelected) {
                  if (isCorrect) {
                    choiceStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 shadow-xs";
                    badgeStyle = "bg-emerald-600 text-white";
                  } else {
                    choiceStyle = "border-rose-400 bg-rose-50 text-rose-950";
                    badgeStyle = "bg-rose-500 text-white";
                  }
                } else if (isCorrect === false && isOptionCorrect) {
                  // Hiển thị mờ đáp án đúng khi người dùng chọn sai
                  choiceStyle = "border-emerald-300/80 bg-emerald-50/40 text-emerald-900";
                  badgeStyle = "bg-emerald-100 text-emerald-800";
                } else {
                  choiceStyle = "border-slate-100 bg-slate-50/50 text-slate-400 opacity-60";
                }
              }

              return (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => setSelectedChoice(choice)}
                  disabled={isCorrect === true}
                  className={`group flex items-center gap-2.5 rounded-xl border p-2.5 sm:p-3 text-xs sm:text-sm font-medium transition-all text-left ${choiceStyle}`}
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold transition-colors ${badgeStyle}`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 font-semibold">{choice}</span>
                  {isSelected && isCorrect && (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-emerald-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {isAnswered && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl p-3 text-xs transition-all ${
            isCorrect
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="space-y-0.5">
            <p className="font-bold flex items-center gap-1.5">
              {isCorrect ? "🎉 Xuất sắc! Bạn đã chọn đúng!" : "Chưa chính xác!"}
            </p>
            <p className="text-[11px] leading-relaxed text-slate-700">
              {isCorrect ? (
                <>
                  Cụm từ hoàn chỉnh là:{" "}
                  <strong className="text-emerald-950 font-bold">
                    {exercise.targetContent || exercise.explanationText}
                  </strong>{" "}
                  {meaningText ? `(${meaningText})` : ""}
                </>
              ) : (
                "Từ này không tạo thành collocation tự nhiên. Hãy bấm 'Thử lại' để chọn từ khác."
              )}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedChoice(null)}
            className="h-7 px-2 text-[11px] font-semibold hover:bg-white/80 shrink-0 gap-1"
          >
            <HugeiconsIcon icon={RefreshIcon} size={12} />
            Thử lại
          </Button>
        </div>
      )}
    </div>
  );
}
