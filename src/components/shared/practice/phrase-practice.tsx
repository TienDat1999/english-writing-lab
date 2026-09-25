"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LearningItemView } from "@/server/learning/learning.service";

export function normalizeQuizAnswer(value: string) {
  return value.trim().toLocaleLowerCase("en").replace(/[.!?,;:]+$/gu, "").replace(/\s+/gu, " ");
}

export function buildChoiceOptions(answer: string, context: string) {
  const answerWordCount = answer.trim().split(/\s+/u).length;
  const words = context.match(/[A-Za-z]+(?:'[A-Za-z]+)?/gu) ?? [];
  const contextPhrases = words
    .map((_, index) => words.slice(index, index + answerWordCount).join(" "))
    .filter((phrase) => phrase.split(" ").length === answerWordCount);
  const fallbacks =
    answerWordCount === 1
      ? ["however", "therefore", "although", "because", "which", "significant"]
      : ["as a result", "in addition", "on the other hand", "plays a role", "is likely to"];
  const unique = [answer, ...contextPhrases, ...fallbacks].filter(
    (item, index, list) => list.indexOf(item) === index && item.length > 0,
  );
  const offset = [...answer].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % unique.length;
  const reordered = [...unique.slice(offset), ...unique.slice(0, offset)];
  return reordered.slice(0, 4);
}

export type PhrasePracticeProps = {
  item: LearningItemView;
  onNext: (isCorrect: boolean, userDraft: string) => void;
  typeOnly?: boolean;
};

export function PhrasePractice({
  item,
  onNext,
  typeOnly = false,
}: PhrasePracticeProps) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"CORRECT" | "INCORRECT" | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = buildChoiceOptions(item.answerText, item.contextText);

  async function checkAnswer() {
    if (!answer.trim() || isChecking) return;
    setIsChecking(true);
    setError(null);

    const isCorrect = normalizeQuizAnswer(answer) === normalizeQuizAnswer(item.answerText);
    setResult(isCorrect ? "CORRECT" : "INCORRECT");

    try {
      await fetch(`/api/learning-items/${item.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: isCorrect ? "GOOD" : "AGAIN" }),
      });
    } catch {
      // Ignore network failure for background save
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="space-y-5">
      {item.contextText ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-1">
            Ngữ cảnh bài viết
          </p>
          <p className="text-sm leading-relaxed text-slate-800">{item.contextText}</p>
        </div>
      ) : null}

      {!typeOnly && options.length >= 2 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <Button
              className="h-auto min-h-12 justify-start whitespace-normal rounded-xl px-4 py-3 text-left font-medium"
              disabled={Boolean(result)}
              key={option}
              onClick={() => setAnswer(option)}
              type="button"
              variant={answer === option ? "default" : "outline"}
            >
              {option}
            </Button>
          ))}
        </div>
      ) : (
        <Textarea
          className="min-h-28 bg-slate-50/60 text-base rounded-xl"
          disabled={Boolean(result)}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder={typeOnly ? "Nhập đáp án tiếng Anh..." : "Gõ cụm từ còn thiếu..."}
          value={answer}
        />
      )}

      {result ? (
        <div
          className={
            result === "CORRECT"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4"
              : "rounded-xl border border-rose-200 bg-rose-50 p-4"
          }
        >
          <p className={`font-bold text-sm ${result === "CORRECT" ? "text-emerald-700" : "text-rose-700"}`}>
            {result === "CORRECT" ? "Chính xác ✓" : "Chưa đúng rồi"}
          </p>
          <p className="mt-2 text-xs text-slate-600">Đáp án chuẩn:</p>
          <p className="mt-0.5 text-lg font-bold text-slate-950 font-sans">{item.answerText}</p>
        </div>
      ) : (
        <Button
          className="w-full rounded-xl font-bold"
          disabled={!answer.trim() || isChecking}
          onClick={checkAnswer}
          size="lg"
        >
          {isChecking ? "Đang kiểm tra..." : "Kiểm tra đáp án"}
        </Button>
      )}

      {result ? (
        <Button
          className="w-full rounded-xl font-bold"
          onClick={() => onNext(result === "CORRECT", answer)}
          size="lg"
        >
          Câu tiếp theo →
        </Button>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
