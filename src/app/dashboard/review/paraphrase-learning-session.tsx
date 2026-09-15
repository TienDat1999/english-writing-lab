"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Idea01Icon,
  VolumeHighIcon,
  VolumeLowIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { LearningItemView } from "@/server/learning/learning.service";

type LearningStage = "RECOGNITION" | "TRANSLATION" | "APPLICATION";

type ApplicationEvaluation = {
  feedbackVi: string;
  correctedTranslation: string;
  grammarScore: number;
  meaningScore: number;
  grammarIssues: Array<{
    sourceQuote: string;
    correction: string;
    explanationVi: string;
  }>;
};

function speakEnglish(text: string, rate: number) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  utterance.lang = "en-GB";
  utterance.rate = rate;
  utterance.voice = voices.find((voice) => voice.lang === "en-GB")
    ?? voices.find((voice) => voice.lang.startsWith("en"))
    ?? null;
  window.speechSynthesis.speak(utterance);
}

function PronunciationControls({ text }: { text: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        aria-label={`Nghe phát âm ${text}`}
        className="rounded-full"
        onClick={() => speakEnglish(text, 0.95)}
        size="sm"
        title="Nghe phát âm tốc độ bình thường"
        type="button"
        variant="outline"
      >
        <HugeiconsIcon icon={VolumeHighIcon} strokeWidth={2} />
        Nghe
      </Button>
      <Button
        aria-label={`Nghe chậm ${text}`}
        className="rounded-full"
        onClick={() => speakEnglish(text, 0.65)}
        size="sm"
        title="Nghe phát âm chậm"
        type="button"
        variant="outline"
      >
        <HugeiconsIcon icon={VolumeLowIcon} strokeWidth={2} />
        Chậm
      </Button>
    </div>
  );
}

const stages: Array<{
  id: LearningStage;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "RECOGNITION",
    label: "Bước 1",
    title: "Nhận diện nghĩa",
    description: "Nhìn cụm từ tiếng Anh và chọn đúng nghĩa tiếng Việt.",
  },
  {
    id: "TRANSLATION",
    label: "Bước 2",
    title: "Gợi nhớ chủ động",
    description: "Nhìn nghĩa tiếng Việt và tự nhập cụm từ tiếng Anh.",
  },
  {
    id: "APPLICATION",
    label: "Bước 3",
    title: "Ứng dụng vào câu",
    description: "Viết một câu tiếng Anh có sử dụng cụm từ vừa học.",
  },
];

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9']+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function buildMeaningOptions(item: LearningItemView, items: LearningItemView[]) {
  const options = [item.promptText, ...items.map((candidate) => candidate.promptText)]
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 4);
  const offset = [...item.answerText].reduce((total, character) => total + character.charCodeAt(0), 0)
    % options.length;

  return [...options.slice(offset), ...options.slice(0, offset)];
}

function uniqueItems(items: LearningItemView[]) {
  return items.filter((item, index) => items.findIndex((candidate) => candidate.id === item.id) === index);
}

export function ParaphraseLearningSession({ initialItems }: { initialItems: LearningItemView[] }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [roundItems, setRoundItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [retryItems, setRetryItems] = useState<LearningItemView[]>([]);
  const [round, setRound] = useState(1);
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(() => new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const stage = stages[stageIndex];
  const item = roundItems[currentIndex];

  async function saveCompletedItem(currentItem: LearningItemView) {
    const response = await fetch(`/api/learning-items/${currentItem.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: mistakeIds.has(currentItem.id) ? "HARD" : "GOOD" }),
    });

    if (!response.ok) {
      throw new Error("REVIEW_SAVE_FAILED");
    }
  }

  function moveForward(nextRetryItems: LearningItemView[]) {
    if (currentIndex + 1 < roundItems.length) {
      setRetryItems(nextRetryItems);
      setCurrentIndex((index) => index + 1);
      return;
    }

    if (nextRetryItems.length > 0) {
      setRoundItems(uniqueItems(nextRetryItems));
      setRetryItems([]);
      setCurrentIndex(0);
      setRound((current) => current + 1);
      return;
    }

    if (stageIndex < stages.length - 1) {
      setStageIndex((index) => index + 1);
      setRoundItems(initialItems);
      setRetryItems([]);
      setCurrentIndex(0);
      setRound(1);
      return;
    }

    setCompleted(true);
  }

  function goBack() {
    if (currentIndex === 0 || isSaving) return;

    const previousItem = roundItems[currentIndex - 1];
    setRetryItems((current) => current.filter((retryItem) => retryItem.id !== previousItem.id));
    setCurrentIndex((index) => index - 1);
    setError(null);
  }

  async function continueAfterAnswer(isCorrect: boolean) {
    if (!item || isSaving) return;

    setIsSaving(true);
    setError(null);
    const nextRetryItems = isCorrect ? retryItems : [...retryItems, item];

    if (!isCorrect) {
      setMistakeIds((current) => new Set(current).add(item.id));
    }

    try {
      if (stage.id === "APPLICATION" && isCorrect) {
        await saveCompletedItem(item);
      }
      moveForward(nextRetryItems);
    } catch {
      setError("Không thể lưu tiến độ. Thử lại nhé.");
    } finally {
      setIsSaving(false);
    }
  }

  if (initialItems.length === 0) {
    return (
      <Card className="border-dashed border-blue-200 bg-blue-50/60 py-12 text-center">
        <CardContent>
          <CardTitle className="font-heading text-3xl">Chủ đề này chưa có từ để học</CardTitle>
          <Button asChild className="mt-6 rounded-full">
            <Link href="/dashboard/learning">Chọn chủ đề khác</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (completed) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/70 py-12 text-center">
        <CardContent className="mx-auto max-w-xl">
          <Badge className="mb-5" variant="secondary">Hoàn thành 3 bước</Badge>
          <CardTitle className="font-heading text-4xl">Đã học xong chủ đề này 🎉</CardTitle>
          <CardDescription className="mt-3 text-base leading-7">
            Bạn đã nhận diện nghĩa, gợi nhớ từ và ứng dụng toàn bộ {initialItems.length} cụm từ vào câu.
          </CardDescription>
          <Button asChild className="mt-7 rounded-full">
            <Link href="/dashboard/learning">Về Learning Library</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-white/75 px-4 py-3 shadow-sm sm:flex sm:items-start sm:px-5">
        {stages.map((learningStage, index) => (
          <div className="contents" key={learningStage.id}>
            <div
              aria-current={index === stageIndex ? "step" : undefined}
              className="flex min-w-0 flex-1 items-start gap-3 py-1"
            >
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index === stageIndex
                ? "bg-primary text-white shadow-[0_6px_16px_rgb(20_100_244/28%)]"
                : index < stageIndex
                  ? "bg-blue-50 text-primary"
                  : "bg-slate-100 text-slate-500"}`}
              >
                {index < stageIndex ? "✓" : index + 1}
              </span>
              <div className="min-w-0">
                <p className={`font-semibold leading-5 ${index > stageIndex ? "text-muted-foreground" : "text-foreground"}`}>
                  {learningStage.title}
                </p>
                <p className="mt-1 text-xs leading-4 text-muted-foreground">{learningStage.description}</p>
              </div>
            </div>
            {index < stages.length - 1 ? (
              <div className={`mx-3 mt-[1.125rem] hidden h-px w-10 shrink-0 lg:block lg:w-16 ${index < stageIndex ? "bg-primary" : "bg-slate-200"}`} />
            ) : null}
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <Badge variant="outline">{stage.label} / 3</Badge>
        <div className="text-right text-sm text-muted-foreground">
          <p>{currentIndex + 1} / {roundItems.length}</p>
          {round > 1 ? <p className="mt-1 font-semibold text-amber-700">Vòng ôn lại {round}</p> : null}
        </div>
      </div>

      <ParaphraseQuestion
        allItems={initialItems}
        item={item}
        key={`${stage.id}:${round}:${item.id}:${currentIndex}`}
        onBack={goBack}
        canGoBack={currentIndex > 0}
        onContinue={(isCorrect) => void continueAfterAnswer(isCorrect)}
        saving={isSaving}
        stage={stage.id}
      />
      {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

function ParaphraseQuestion({
  allItems,
  canGoBack,
  item,
  onBack,
  onContinue,
  saving,
  stage,
}: {
  allItems: LearningItemView[];
  canGoBack: boolean;
  item: LearningItemView;
  onBack: () => void;
  onContinue: (isCorrect: boolean) => void;
  saving: boolean;
  stage: LearningStage;
}) {
  const [answer, setAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [applicationEvaluation, setApplicationEvaluation] = useState<ApplicationEvaluation | null>(null);
  const [applicationPrompt, setApplicationPrompt] = useState(item.applicationPromptVi);
  const [applicationPromptError, setApplicationPromptError] = useState<string | null>(null);
  const [promptRequestKey, setPromptRequestKey] = useState(0);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkingError, setCheckingError] = useState<string | null>(null);
  const meaningOptions = buildMeaningOptions(item, allItems);
  const isRecognition = stage === "RECOGNITION";
  const isApplication = stage === "APPLICATION";
  const questionTitle = isRecognition ? item.answerText : isApplication ? item.answerText : item.promptText;
  const questionLabel = isRecognition
    ? "Cụm từ tiếng Anh"
    : isApplication
      ? `Nghĩa: ${item.promptText}`
      : item.topicText;

  useEffect(() => {
    if (!isApplication || applicationPrompt) return;

    let cancelled = false;

    async function loadApplicationPrompt() {
      setIsLoadingPrompt(true);
      setApplicationPromptError(null);

      try {
        const response = await fetch(`/api/learning-items/${item.id}/application/prompt`, {
          method: "POST",
        });

        if (!response.ok) throw new Error("APPLICATION_PROMPT_FAILED");
        const payload = (await response.json()) as { data: { promptVi: string } };
        if (!cancelled) setApplicationPrompt(payload.data.promptVi);
      } catch {
        if (!cancelled) setApplicationPromptError("Chưa tạo được ý gợi ý cho cụm từ này.");
      } finally {
        if (!cancelled) setIsLoadingPrompt(false);
      }
    }

    void loadApplicationPrompt();
    return () => {
      cancelled = true;
    };
  }, [applicationPrompt, isApplication, item.id, promptRequestKey]);

  async function checkAnswer(selectedAnswer = answer) {
    if (!selectedAnswer.trim() || isCorrect !== null || isChecking) return;

    if (isApplication) {
      setIsChecking(true);
      setCheckingError(null);
      setAnswer(selectedAnswer);

      try {
        const response = await fetch(`/api/learning-items/${item.id}/application/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ learnerAnswer: selectedAnswer }),
        });

        if (!response.ok) throw new Error("APPLICATION_EVALUATION_FAILED");
        const payload = (await response.json()) as {
          data: {
            evaluation: ApplicationEvaluation;
            isCorrect: boolean;
            usesRequiredPhrase: boolean;
          };
        };
        setApplicationEvaluation(payload.data.evaluation);
        setIsCorrect(payload.data.isCorrect);
      } catch {
        setCheckingError("Chưa thể chấm câu này. Thử lại nhé.");
      } finally {
        setIsChecking(false);
      }
      return;
    }

    const correct = isRecognition
      ? selectedAnswer === item.promptText
      : normalizeAnswer(selectedAnswer) === normalizeAnswer(item.answerText);
    setAnswer(selectedAnswer);
    setIsCorrect(correct);
  }

  function continueToNext() {
    if (isCorrect === null) return;
    onContinue(isCorrect);
  }

  return (
    <Card className="border-t-4 border-t-primary bg-card shadow-[0_18px_40px_rgb(35_87_170/12%)]">
      <CardHeader className="gap-1 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardDescription>{questionLabel}</CardDescription>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <CardTitle className="font-heading text-2xl leading-tight">{questionTitle}</CardTitle>
              {isRecognition || isApplication ? <PronunciationControls text={item.answerText} /> : null}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              className="rounded-full"
              disabled={!canGoBack || saving}
              onClick={onBack}
              size="sm"
              type="button"
              variant="outline"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              Quay lại
            </Button>
            <Button
              className="rounded-full"
              disabled={isCorrect === null || saving || isChecking}
              onClick={continueToNext}
              size="sm"
              type="button"
            >
              {saving ? "Đang lưu..." : "Câu tiếp theo"}
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-4">
        {isRecognition ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {meaningOptions.map((option) => (
              <Button
                className="h-auto min-h-11 justify-start whitespace-normal rounded-xl px-4 py-2 text-left"
                disabled={isCorrect !== null || isChecking}
                key={option}
                onClick={() => void checkAnswer(option)}
                type="button"
                variant={answer === option ? "default" : "outline"}
              >
                {option}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {isApplication ? (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
                <HugeiconsIcon className="mt-0.5 size-5 shrink-0 text-amber-600" icon={Idea01Icon} strokeWidth={2} />
                <div>
                  <p className="text-sm font-semibold">Ý gợi ý để viết câu</p>
                  {isLoadingPrompt ? <p className="mt-1 text-sm">AI đang tạo một ngữ cảnh phù hợp...</p> : null}
                  {applicationPrompt ? (
                    <>
                      <p className="mt-1 text-sm leading-6">{applicationPrompt}</p>
                      <p className="mt-1 text-xs text-amber-700">
                        Hãy diễn đạt ý này bằng tiếng Anh và sử dụng “{item.answerText}”.
                      </p>
                    </>
                  ) : null}
                  {applicationPromptError ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-rose-700">{applicationPromptError}</p>
                      <Button
                        className="rounded-full"
                        onClick={() => setPromptRequestKey((key) => key + 1)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Tạo lại
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            <Textarea
              className="min-h-24 bg-[#f8faff] text-base leading-6"
              disabled={isCorrect !== null || isChecking}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={isApplication
                ? "Viết câu tiếng Anh của bạn theo ý gợi ý..."
                : "Nhập cụm từ tiếng Anh..."}
              value={answer}
            />
          </div>
        )}

        {isCorrect === null ? (
          !isRecognition ? (
            <Button
              className="w-full rounded-full"
              disabled={!answer.trim() || isChecking || (isApplication && !applicationPrompt)}
              onClick={() => void checkAnswer()}
              size="lg"
            >
              {isChecking ? "Đang kiểm tra câu..." : "Kiểm tra đáp án"}
            </Button>
          ) : null
        ) : (
          <div className={isCorrect
              ? "rounded-xl border border-emerald-200 bg-emerald-50 p-3"
              : "rounded-xl border border-rose-200 bg-rose-50 p-3"}
          >
            <p className={`font-bold ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
              {isCorrect ? "Chính xác ✓" : "Chưa đúng rồi"}
            </p>
            {!isCorrect ? (
              <>
                <p className="mt-2 text-sm text-slate-600">
                  {isRecognition ? "Nghĩa đúng" : isApplication ? "Câu cần sử dụng cụm từ" : "Đáp án đúng"}
                </p>
                <p className="mt-1 text-xl font-bold text-slate-950">
                  {isRecognition ? item.promptText : item.answerText}
                </p>
                {!isRecognition && !isApplication ? (
                  <div className="mt-3"><PronunciationControls text={item.answerText} /></div>
                ) : null}
                {isApplication && applicationEvaluation ? (
                  <p className="mt-2 leading-6 text-slate-700">{applicationEvaluation.feedbackVi}</p>
                ) : null}
                {!isApplication ? (
                  <p className="mt-2 text-sm font-medium text-rose-700">
                    Từ này sẽ xuất hiện lại sau khi bạn đi hết vòng hiện tại.
                  </p>
                ) : null}
              </>
            ) : isApplication ? (
              <p className="mt-2 leading-7 text-slate-700">{applicationEvaluation?.feedbackVi}</p>
            ) : null}
            {!isCorrect && isApplication && applicationEvaluation ? (
              <>
                {applicationEvaluation.grammarIssues.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Các lỗi cần sửa</p>
                    {applicationEvaluation.grammarIssues.map((issue) => (
                      <div className="rounded-lg border border-rose-200 bg-white/65 px-3 py-2" key={`${issue.sourceQuote}:${issue.correction}`}>
                        <p className="text-sm">
                          <span className="text-rose-700 line-through">{issue.sourceQuote}</span>
                          <span className="mx-2 text-slate-400">→</span>
                          <span className="font-semibold text-emerald-700">{issue.correction}</span>
                        </p>
                        <p className="mt-1 text-sm leading-5 text-slate-600">{issue.explanationVi}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-sm font-semibold text-slate-600">Câu sửa sát nghĩa</p>
                <p className="mt-1 leading-7 text-slate-900">{applicationEvaluation.correctedTranslation}</p>
                <p className="mt-2 text-xs text-rose-700">
                  Ngữ pháp {applicationEvaluation.grammarScore}/100 · Đúng ý {applicationEvaluation.meaningScore}/100
                </p>
              </>
            ) : null}
          </div>
        )}
        {checkingError ? <p className="text-sm text-destructive" role="alert">{checkingError}</p> : null}
      </CardContent>
    </Card>
  );
}
