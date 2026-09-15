"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { UploadedQuizType } from "@/server/learning/learning.contract";
import type { LearningItemView } from "@/server/learning/learning.service";

import { ParaphraseLearningSession } from "./paraphrase-learning-session";

type Rating = "AGAIN" | "HARD" | "GOOD" | "EASY";

type TranslationEvaluation = {
  score: number;
  meaningScore: number;
  grammarScore: number;
  naturalnessScore: number;
  feedbackVi: string;
  correctedTranslation: string;
  upgradedTranslation: string;
  patternTipVi: string;
  grammarIssues: Array<{
    sourceQuote: string;
    correction: string;
    explanationVi: string;
  }>;
};

const ratingLabels: Record<Rating, string> = {
  AGAIN: "Chưa nhớ · 1 ngày",
  HARD: "Khó · ôn sớm",
  GOOD: "Nhớ được",
  EASY: "Rất dễ · giãn lịch",
};

function scoreStyle(score: number) {
  if (score >= 90) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 70) return "border-blue-200 bg-blue-50 text-blue-800";
  if (score >= 50) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
}

export function ReviewSession({
  initialItems,
  sessionMode = "MIXED",
  uploadedQuizType,
}: {
  initialItems: LearningItemView[];
  sessionMode?: "MIXED" | "QUICK" | "UPLOADED";
  uploadedQuizType?: UploadedQuizType;
}) {
  const [items, setItems] = useState(initialItems);
  const [totalItems, setTotalItems] = useState(initialItems.length);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState("");
  const [evaluation, setEvaluation] = useState<TranslationEvaluation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const item = items[0];
  const completed = totalItems - items.length;
  const isTranslation = item?.sourceType === "TRANSLATION";
  const isUploadedQuiz = item?.sourceType === "UPLOADED_QUIZ";
  const isPhrase = item?.sourceType === "PHRASE" || isUploadedQuiz;

  function addPhraseToSession(newItem: LearningItemView) {
    if (items.some((currentItem) => currentItem.id === newItem.id)) return;

    setItems((current) => [...current, newItem]);
    setTotalItems((total) => total + 1);
  }

  function goToNextItem() {
    setItems((current) => current.slice(1));
    setDraft("");
    setRevealed(false);
    setEvaluation(null);
    setError(null);
  }

  async function evaluateTranslation() {
    if (!item || !isTranslation || isSaving || draft.trim().length < 2) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/learning-items/${item.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerAnswer: draft }),
      });

      if (!response.ok) {
        setError("AI chưa chấm được bài dịch này. Thử lại nhé.");
        return;
      }

      const payload = (await response.json()) as {
        data: { evaluation: TranslationEvaluation };
      };
      setEvaluation(payload.data.evaluation);
    } catch {
      setError("Mất kết nối khi AI đang chấm bài.");
    } finally {
      setIsSaving(false);
    }
  }

  async function rate(rating: Rating) {
    if (!item || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/learning-items/${item.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        setError("Không thể lưu lượt ôn. Thử lại nhé.");
        return;
      }

      goToNextItem();
    } catch {
      setError("Mất kết nối khi lưu lượt ôn.");
    } finally {
      setIsSaving(false);
    }
  }

  const isParaphraseUpload = sessionMode === "UPLOADED"
    && (uploadedQuizType === "PARAPHRASE"
      || (!uploadedQuizType && initialItems[0]?.quizType === "PARAPHRASE"));

  if (isParaphraseUpload) {
    return <ParaphraseLearningSession initialItems={initialItems} />;
  }

  if (!item) {
    if (initialItems.length === 0 && (sessionMode === "QUICK" || sessionMode === "UPLOADED")) {
      return (
        <Card className="border-dashed border-blue-200 bg-blue-50/60 py-12 text-center">
          <CardContent className="mx-auto max-w-xl">
            <Badge className="mb-5" variant="secondary">
              {sessionMode === "UPLOADED" ? "Uploaded Quiz" : "Quick Quiz"}
            </Badge>
            <CardTitle className="font-heading text-4xl">Chưa có nội dung để luyện</CardTitle>
            <CardDescription className="mt-3 text-base leading-7">
              {sessionMode === "UPLOADED"
                ? "Hãy chọn một chủ đề quiz từ Learning Library."
                : "Lưu một cụm từ sau khi AI chấm bài dịch để tạo Quick Quiz."}
            </CardDescription>
            <Button asChild className="mt-7 rounded-full">
              <Link href="/dashboard/learning">
                {sessionMode === "UPLOADED" ? "Chọn chủ đề" : "Về Learning Library"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-emerald-200 bg-emerald-50/70 py-12 text-center">
        <CardContent className="mx-auto max-w-xl">
          <Badge className="mb-5" variant="secondary">
            {sessionMode === "UPLOADED"
              ? "Uploaded Quiz complete"
              : sessionMode === "QUICK"
                ? "Quick Quiz complete"
                : "Session complete"}
          </Badge>
          <CardTitle className="font-heading text-4xl">
            {sessionMode === "UPLOADED"
              ? "Đã luyện xong chủ đề này 🎉"
              : sessionMode === "QUICK"
                ? "Đã luyện xong Quick Quiz 🎉"
                : "Ôn xong rồi 🎉"}
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-7">
            Mày đã hoàn thành {completed} nội dung đến hạn. Hệ thống đã tự xếp lịch cho lần tiếp theo.
          </CardDescription>
          <Button asChild className="mt-7 rounded-full">
            <Link href="/dashboard/learning">Về thư viện</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Badge variant="outline">
          {isTranslation ? "VI → EN" : isUploadedQuiz ? "UPLOADED QUIZ · VI → EN" : isPhrase ? "QUICK QUIZ" : item.sourceType.replaceAll("_", " ")}
        </Badge>
        <p className="text-sm text-muted-foreground">{completed + 1} / {totalItems}</p>
      </div>
      <Card className="border-t-4 border-t-primary bg-card shadow-[0_24px_60px_rgb(35_87_170/12%)]">
        <CardHeader>
          <CardDescription>
            {isTranslation
              ? "Dịch câu được trích từ bài viết của bạn"
              : isUploadedQuiz
                ? item.topicText
                : isPhrase
                  ? "Hoàn thành câu bằng cụm từ bạn đã lưu"
                : item.title}
          </CardDescription>
          <CardTitle className="font-heading text-3xl leading-tight">{item.promptText}</CardTitle>
          {!isTranslation && item.hintVi ? (
            <p className="pt-2 text-sm text-muted-foreground">Gợi ý: {item.hintVi}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {isPhrase ? (
            <PhrasePractice key={item.id} item={item} onNext={goToNextItem} typeOnly={isUploadedQuiz} />
          ) : (
            <>
          {isTranslation ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Bản dịch tiếng Anh của bạn</p>
              <Button
                disabled={isSaving || draft.length === 0}
                onClick={() => {
                  setDraft("");
                  setEvaluation(null);
                  setError(null);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                Viết lại
              </Button>
            </div>
          ) : null}
          <Textarea
            className="min-h-40 resize-y bg-[#f8faff] text-base leading-7 focus-visible:bg-white"
            disabled={Boolean(evaluation)}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isTranslation ? "Dịch câu này sang tiếng Anh..." : "Tự viết câu trả lời trước khi xem đáp án..."}
            value={draft}
          />

          {isTranslation ? (
            evaluation ? (
              <TranslationResult
                evaluation={evaluation}
                learnerAnswer={draft}
                onNext={goToNextItem}
                onPhraseSaved={addPhraseToSession}
                sourceLearningItemId={item.id}
              />
            ) : (
              <Button
                className="w-full rounded-full"
                disabled={isSaving || draft.trim().length < 2}
                onClick={evaluateTranslation}
                size="lg"
              >
                {isSaving ? "AI đang chấm..." : "AI chấm bài dịch"}
              </Button>
            )
          ) : !revealed ? (
            <Button className="w-full rounded-full" onClick={() => setRevealed(true)} size="lg">
              Xem đáp án
            </Button>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl bg-secondary/55 p-5">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Đáp án gợi ý</p>
                <p className="mt-3 whitespace-pre-wrap text-lg leading-8">{item.answerText}</p>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium">Mày nhớ được mức nào?</p>
                <div className="grid gap-2 sm:grid-cols-4">
                  {(Object.keys(ratingLabels) as Rating[]).map((rating) => (
                    <Button
                      disabled={isSaving}
                      key={rating}
                      onClick={() => rate(rating)}
                      variant={rating === "GOOD" ? "default" : "outline"}
                    >
                      {ratingLabels[rating]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

            </>
          )}

          {error ? <p aria-live="polite" className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeQuizAnswer(value: string) {
  return value.trim().toLocaleLowerCase("en").replace(/[.!?,;:]+$/gu, "").replace(/\s+/gu, " ");
}

function buildChoiceOptions(answer: string, context: string) {
  const answerWordCount = answer.trim().split(/\s+/u).length;
  const words = context.match(/[A-Za-z]+(?:'[A-Za-z]+)?/gu) ?? [];
  const contextPhrases = words
    .map((_, index) => words.slice(index, index + answerWordCount).join(" "))
    .filter((phrase) => phrase.split(" ").length === answerWordCount);
  const fallbacks = answerWordCount === 1
    ? ["however", "therefore", "although", "because", "which", "significant"]
    : ["as a result", "in addition", "on the other hand", "plays a role", "is likely to"];
  const unique = [answer, ...contextPhrases, ...fallbacks].filter(
    (phrase, index, values) => values.findIndex(
      (value) => normalizeQuizAnswer(value) === normalizeQuizAnswer(phrase),
    ) === index,
  );
  const options = [answer, ...unique.filter(
    (phrase) => normalizeQuizAnswer(phrase) !== normalizeQuizAnswer(answer),
  ).slice(0, 3)];
  const offset = [...answer].reduce((total, character) => total + character.charCodeAt(0), 0)
    % options.length;

  return [...options.slice(offset), ...options.slice(0, offset)];
}

function PhrasePractice({
  item,
  onNext,
  typeOnly = false,
}: {
  item: LearningItemView;
  onNext: () => void;
  typeOnly?: boolean;
}) {
  const [mode, setMode] = useState<"CHOICE" | "TYPE">(typeOnly ? "TYPE" : "CHOICE");
  const [answer, setAnswer] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<"CORRECT" | "INCORRECT" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const options = buildChoiceOptions(item.answerText, item.contextText);

  function changeMode(nextMode: "CHOICE" | "TYPE") {
    if (result) return;
    setMode(nextMode);
    setAnswer("");
    setError(null);
  }

  async function checkAnswer() {
    if (!answer.trim() || isChecking || result) return;

    const isCorrect = normalizeQuizAnswer(answer) === normalizeQuizAnswer(item.answerText);
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch(`/api/learning-items/${item.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: isCorrect ? "GOOD" : "AGAIN" }),
      });

      if (!response.ok) {
        setError("Không thể lưu kết quả Quick Quiz. Thử lại nhé.");
        return;
      }

      setResult(isCorrect ? "CORRECT" : "INCORRECT");
    } catch {
      setError("Mất kết nối khi kiểm tra đáp án.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="space-y-5">
      {!typeOnly ? <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 p-1">
        <Button
          className="rounded-full"
          onClick={() => changeMode("CHOICE")}
          size="sm"
          type="button"
          variant={mode === "CHOICE" ? "default" : "ghost"}
        >
          Chọn đáp án
        </Button>
        <Button
          className="rounded-full"
          onClick={() => changeMode("TYPE")}
          size="sm"
          type="button"
          variant={mode === "TYPE" ? "default" : "ghost"}
        >
          Tự gõ
        </Button>
      </div> : (
        <p className="text-sm font-semibold text-slate-700">Nhập đáp án tiếng Anh</p>
      )}

      {mode === "CHOICE" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <Button
              className="h-auto min-h-12 justify-start whitespace-normal rounded-2xl px-4 py-3 text-left"
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
          className="min-h-28 bg-[#f8faff] text-base"
          disabled={Boolean(result)}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder={typeOnly ? "Nhập đáp án tiếng Anh..." : "Gõ cụm từ còn thiếu..."}
          value={answer}
        />
      )}

      {result ? (
        <div className={result === "CORRECT"
          ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
          : "rounded-2xl border border-rose-200 bg-rose-50 p-5"}
        >
          <p className={`font-bold ${result === "CORRECT" ? "text-emerald-700" : "text-rose-700"}`}>
            {result === "CORRECT" ? "Chính xác ✓" : "Chưa đúng rồi"}
          </p>
          <p className="mt-2 text-sm text-slate-600">Đáp án đúng</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{item.answerText}</p>
          <p className="mt-3 leading-7 text-slate-700">{item.contextText}</p>
        </div>
      ) : (
        <Button
          className="w-full rounded-full"
          disabled={!answer.trim() || isChecking}
          onClick={checkAnswer}
          size="lg"
        >
          {isChecking ? "Đang kiểm tra..." : "Kiểm tra đáp án"}
        </Button>
      )}

      {result ? (
        <Button className="w-full rounded-full" onClick={onNext} size="lg">Câu tiếp theo</Button>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function TranslationResult({
  evaluation,
  learnerAnswer,
  onNext,
  onPhraseSaved,
  sourceLearningItemId,
}: {
  evaluation: TranslationEvaluation;
  learnerAnswer: string;
  onNext: () => void;
  onPhraseSaved: (item: LearningItemView) => void;
  sourceLearningItemId: string;
}) {
  const scoreCards = [
    ["Đúng nghĩa", evaluation.meaningScore],
    ["Ngữ pháp", evaluation.grammarScore],
    ["Tự nhiên", evaluation.naturalnessScore],
  ] as const;

  return (
    <div className="space-y-5" aria-live="polite">
      <div className={`rounded-2xl border p-5 ${scoreStyle(evaluation.score)}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase">Kết quả</p>
            <p className="mt-2 text-5xl font-black">{evaluation.score}<span className="text-xl">/100</span></p>
          </div>
          <p className="max-w-lg text-sm leading-6">{evaluation.feedbackVi}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {scoreCards.map(([label, score]) => (
          <div className="rounded-2xl border bg-white p-3 text-center sm:p-4" key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{score}</p>
          </div>
        ))}
      </div>

      {evaluation.grammarIssues.length > 0 ? (
        <div className="space-y-3">
          <p className="font-semibold">Lỗi cần sửa</p>
          {evaluation.grammarIssues.map((issue, index) => (
            <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4" key={`${issue.sourceQuote}-${index}`}>
              <p className="line-through decoration-red-500">{issue.sourceQuote}</p>
              <p className="mt-1 font-semibold text-emerald-700">→ {issue.correction}</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                <HighlightedQuotes text={issue.explanationVi} />
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <AnswerCard label="Câu của bạn" text={learnerAnswer} variant="learner" />
        <AnswerCard
          label="Bản sửa ít nhất"
          onPhraseSaved={onPhraseSaved}
          sourceLearningItemId={sourceLearningItemId}
          text={evaluation.correctedTranslation}
          variant="corrected"
        />
      </div>
      <AnswerCard
        label="Phiên bản B2 tốt hơn"
        onPhraseSaved={onPhraseSaved}
        sourceLearningItemId={sourceLearningItemId}
        text={evaluation.upgradedTranslation}
        variant="upgrade"
      />
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-xs font-bold tracking-wider text-amber-800 uppercase">Mẫu câu nên nhớ</p>
        <p className="mt-2 leading-7 text-amber-950">{evaluation.patternTipVi}</p>
      </div>
      <Button className="w-full rounded-full" onClick={onNext} size="lg">Câu tiếp theo</Button>
    </div>
  );
}

const answerCardStyles = {
  learner: {
    card: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50/70",
    bar: "bg-rose-500",
    label: "text-rose-700",
    badge: "bg-rose-100 text-rose-700",
    status: "Cần sửa",
  },
  corrected: {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/70",
    bar: "bg-emerald-500",
    label: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    status: "Đã sửa ✓",
  },
  upgrade: {
    card: "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50/70",
    bar: "bg-blue-600",
    label: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    status: "B2 gợi ý",
  },
} as const;

function AnswerCard({
  label,
  text,
  variant,
  onPhraseSaved,
  sourceLearningItemId,
}: {
  label: string;
  text: string;
  variant: keyof typeof answerCardStyles;
  onPhraseSaved?: (item: LearningItemView) => void;
  sourceLearningItemId?: string;
}) {
  const styles = answerCardStyles[variant];
  const [selectedPhrase, setSelectedPhrase] = useState("");
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED" | "ERROR">("IDLE");

  function captureSelection(event: React.MouseEvent<HTMLDivElement>) {
    if (!onPhraseSaved || !sourceLearningItemId) return;

    const selection = window.getSelection();
    const phrase = selection?.toString().trim() ?? "";
    const selectionIsInsideCard = selection?.anchorNode
      && selection.focusNode
      && event.currentTarget.contains(selection.anchorNode)
      && event.currentTarget.contains(selection.focusNode);

    if (!selectionIsInsideCard || phrase.length === 0 || phrase.length > 200) return;

    setSelectedPhrase(phrase);
    setSaveStatus("IDLE");
  }

  async function savePhrase() {
    if (!selectedPhrase || !sourceLearningItemId || !onPhraseSaved || saveStatus === "SAVING") return;

    setSaveStatus("SAVING");

    try {
      const response = await fetch("/api/learning-items/phrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLearningItemId,
          phrase: selectedPhrase,
          contextText: text,
        }),
      });

      if (!response.ok) {
        setSaveStatus("ERROR");
        return;
      }

      const payload = (await response.json()) as { data: LearningItemView };
      onPhraseSaved(payload.data);
      setSaveStatus("SAVED");
    } catch {
      setSaveStatus("ERROR");
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-2 p-5 pt-6 shadow-sm ${styles.card}`}
      onMouseUp={captureSelection}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 ${styles.bar}`} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-xs font-bold tracking-wider uppercase ${styles.label}`}>{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${styles.badge}`}>
          {styles.status}
        </span>
      </div>
      <p className="mt-4 cursor-text select-text whitespace-pre-wrap text-lg font-medium leading-8 text-slate-900">{text}</p>
      {selectedPhrase && onPhraseSaved ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-white/90 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-sm text-slate-700">
            Đã chọn: <strong className="break-words text-primary">“{selectedPhrase}”</strong>
          </p>
          <Button
            className="shrink-0 rounded-full"
            disabled={saveStatus === "SAVING" || saveStatus === "SAVED"}
            onClick={savePhrase}
            size="sm"
            type="button"
          >
            {saveStatus === "SAVING"
              ? "Đang lưu..."
              : saveStatus === "SAVED"
                ? "Đã thêm ✓"
                : saveStatus === "ERROR"
                  ? "Thử lưu lại"
                  : "+ Thêm flashcard"}
          </Button>
        </div>
      ) : onPhraseSaved ? (
        <p className="mt-4 text-xs font-medium text-slate-500">Bôi đen một cụm từ để thêm vào Quick Quiz.</p>
      ) : null}
    </div>
  );
}

function HighlightedQuotes({ text }: { text: string }) {
  return text.split(/("[^"]+"|“[^”]+”)/gu).map((part, index) => {
    const isQuoted = (part.startsWith('"') && part.endsWith('"'))
      || (part.startsWith("“") && part.endsWith("”"));

    if (!isQuoted) return part;

    return (
      <mark
        className="mx-0.5 rounded-md bg-amber-200 px-1.5 py-0.5 font-semibold text-amber-950 decoration-clone"
        key={`${part}-${index}`}
      >
        {part}
      </mark>
    );
  });
}
