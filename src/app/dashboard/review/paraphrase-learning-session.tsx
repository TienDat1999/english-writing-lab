"use client";

import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Idea01Icon,
  SparklesIcon,
  VolumeHighIcon,
  VolumeLowIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { LearningItemView } from "@/server/learning/learning.service";
import { playNaturalSpeech } from "@/lib/speech";

type LearningStage = "RECOGNITION" | "TRANSLATION" | "APPLICATION";

type ApplicationEvaluation = {
  feedbackVi: string;
  correctedTranslation: string;
  upgradedTranslation?: string;
  grammarScore: number;
  meaningScore: number;
  grammarIssues: Array<{
    sourceQuote: string;
    correction: string;
    explanationVi: string;
  }>;
  vocabularyUpgrades?: Array<{
    originalWord: string;
    upgradedAlternatives: string;
    reasonVi: string;
  }>;
  writingAlternatives?: Array<{
    label: string;
    sentenceEn: string;
    noteVi?: string;
  }>;
};

export type StepLearningConfig = {
  /** Label cho loại câu hỏi hiển thị trên card (e.g. "Cụm từ tiếng Anh") */
  questionLabel: string;
  /** Placeholder input bước 2 */
  translationPlaceholder: string;
  /** Text tóm tắt khi hoàn thành */
  completedSummary: string;
  /** Text "N từ" hoàn thành */
  unitLabel: string;
};

export const COLLOCATION_CONFIG: StepLearningConfig = {
  questionLabel: "Cụm từ tiếng Anh",
  translationPlaceholder: "Nhập cụm từ tiếng Anh...",
  completedSummary: "cụm từ",
  unitLabel: "cụm từ",
};

export const PARAPHRASE_CONFIG: StepLearningConfig = {
  questionLabel: "Cụm từ / diễn đạt",
  translationPlaceholder: "Nhập cụm từ tiếng Anh...",
  completedSummary: "cụm từ",
  unitLabel: "cụm từ",
};

export const TOPIC_VOCABULARY_CONFIG: StepLearningConfig = {
  questionLabel: "Từ / cụm từ tiếng Anh",
  translationPlaceholder: "Nhập từ tiếng Anh...",
  completedSummary: "từ vựng",
  unitLabel: "từ vựng",
};

function PronunciationControls({ text }: { text: string }) {
  const [playingMode, setPlayingMode] = useState<"normal" | "slow" | null>(null);

  function handlePlay(speed: number, mode: "normal" | "slow") {
    void playNaturalSpeech(text, {
      speed,
      onStart: () => setPlayingMode(mode),
      onEnd: () => setPlayingMode(null),
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        aria-label={`Nghe phát âm ${text}`}
        className="rounded-full"
        onClick={() => handlePlay(1.0, "normal")}
        size="sm"
        title="Nghe phát âm tự nhiên bằng giọng AI"
        type="button"
        variant="outline"
      >
        <HugeiconsIcon
          icon={VolumeHighIcon}
          strokeWidth={2}
          className={playingMode === "normal" ? "text-primary animate-pulse" : ""}
        />
        {playingMode === "normal" ? "Đang đọc..." : "Nghe"}
      </Button>
      <Button
        aria-label={`Nghe chậm ${text}`}
        className="rounded-full"
        onClick={() => handlePlay(0.75, "slow")}
        size="sm"
        title="Nghe phát âm chậm bằng giọng AI"
        type="button"
        variant="outline"
      >
        <HugeiconsIcon
          icon={VolumeLowIcon}
          strokeWidth={2}
          className={playingMode === "slow" ? "text-primary animate-pulse" : ""}
        />
        {playingMode === "slow" ? "Đang đọc chậm..." : "Chậm"}
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

function cleanMeaningText(value: string) {
  return value.replace(/^(Ý nghĩa|Nghĩa):\s*/i, "").trim();
}

const FALLBACK_DISTRACTOR_MEANINGS = [
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

function buildMeaningOptions(item: LearningItemView, items: LearningItemView[]) {
  const currentMeaning = cleanMeaningText(item.promptText);
  const options = [currentMeaning, ...items.map((candidate) => cleanMeaningText(candidate.promptText))]
    .filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  // Luôn đảm bảo đủ 4 options khi topic có ít hơn 4 câu hỏi
  if (options.length < 4) {
    const seed = [...item.answerText].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    for (let i = 0; i < FALLBACK_DISTRACTOR_MEANINGS.length && options.length < 4; i++) {
      const candidate = FALLBACK_DISTRACTOR_MEANINGS[(seed + i) % FALLBACK_DISTRACTOR_MEANINGS.length];
      if (!options.includes(candidate)) {
        options.push(candidate);
      }
    }
  }

  const final4 = options.slice(0, 4);
  const offset = [...item.answerText].reduce((total, character) => total + character.charCodeAt(0), 0)
    % (final4.length || 1);

  return [...final4.slice(offset), ...final4.slice(0, offset)];
}

function uniqueItems(items: LearningItemView[]) {
  return items.filter((item, index) => items.findIndex((candidate) => candidate.id === item.id) === index);
}

export function StepLearningSession({
  initialItems,
  config,
}: {
  initialItems: LearningItemView[];
  config: StepLearningConfig;
}) {
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
            Bạn đã nhận diện nghĩa, gợi nhớ từ và ứng dụng toàn bộ {initialItems.length} {config.completedSummary} vào câu.
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

      <StepQuestion
        allItems={initialItems}
        item={item}
        key={`${stage.id}:${round}:${item.id}:${currentIndex}`}
        onBack={goBack}
        canGoBack={currentIndex > 0}
        onContinue={(isCorrect) => void continueAfterAnswer(isCorrect)}
        saving={isSaving}
        stage={stage.id}
        config={config}
      />
      {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

// Keep backward-compat alias
export function ParaphraseLearningSession({ initialItems }: { initialItems: LearningItemView[] }) {
  return <StepLearningSession initialItems={initialItems} config={PARAPHRASE_CONFIG} />;
}

function StepQuestion({
  allItems,
  canGoBack,
  item,
  onBack,
  onContinue,
  saving,
  stage,
  config,
}: {
  allItems: LearningItemView[];
  canGoBack: boolean;
  item: LearningItemView;
  onBack: () => void;
  onContinue: (isCorrect: boolean) => void;
  saving: boolean;
  stage: LearningStage;
  config: StepLearningConfig;
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
  const cleanedPrompt = cleanMeaningText(item.promptText);
  const questionTitle = isRecognition ? item.answerText : isApplication ? item.answerText : cleanedPrompt;
  const questionLabel = isRecognition
    ? config.questionLabel
    : isApplication
      ? `Nghĩa: ${cleanedPrompt}`
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

  const lastCheckedAtRef = useRef<number>(0);

  async function checkAnswer(selectedAnswer = answer) {
    const trimmed = selectedAnswer.trim();
    if (!trimmed || isCorrect !== null || isChecking) return;

    if (isApplication) {
      setIsChecking(true);
      setCheckingError(null);
      setAnswer(trimmed);

      try {
        const response = await fetch(`/api/learning-items/${item.id}/application/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ learnerAnswer: trimmed }),
        });

        if (!response.ok) throw new Error("APPLICATION_EVALUATION_FAILED");
        const payload = (await response.json()) as {
          data: {
            evaluation: ApplicationEvaluation;
            isCorrect: boolean;
            usesRequiredPhrase: boolean;
          };
        };
        lastCheckedAtRef.current = Date.now();
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
      ? cleanMeaningText(trimmed) === cleanedPrompt
      : normalizeAnswer(trimmed) === normalizeAnswer(item.answerText);
    lastCheckedAtRef.current = Date.now();
    setAnswer(trimmed);
    setIsCorrect(correct);
  }

  function continueToNext() {
    if (isCorrect === null || saving || isChecking) return;
    onContinue(isCorrect);
  }

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      const isEnter = event.key === "Enter" || event.code === "Enter" || event.code === "NumpadEnter";
      if (!isEnter || event.shiftKey) return;
      if (event.isComposing || event.keyCode === 229) return;

      // When actively typing inside textarea, textarea's own onKeyDown takes precedence
      if (event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (isCorrect !== null) {
        // Prevent accidental double-action: ensure at least 400ms passed since answer check
        if (Date.now() - lastCheckedAtRef.current < 400) {
          return;
        }
        if (!saving && !isChecking) {
          event.preventDefault();
          continueToNext();
        }
        return;
      }

      const trimmed = answer.trim();
      if (!isRecognition && trimmed && !isChecking && (!isApplication || applicationPrompt)) {
        event.preventDefault();
        lastCheckedAtRef.current = Date.now();
        void checkAnswer(trimmed);
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isCorrect, saving, isChecking, onContinue, isRecognition, answer, isApplication, applicationPrompt]);

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
                        Hãy diễn đạt ý này bằng tiếng Anh và sử dụng "{item.answerText}".
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
              autoFocus
              className="min-h-24 bg-[#f8faff] text-base leading-6"
              disabled={isCorrect !== null || isChecking}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (event.nativeEvent?.isComposing || event.keyCode === 229) {
                  return;
                }
                const isEnter = event.key === "Enter" || event.code === "Enter" || event.code === "NumpadEnter";
                if (isEnter && !event.shiftKey) {
                  event.preventDefault();
                  event.stopPropagation();
                  if (isCorrect === null) {
                    const currentVal = (event.currentTarget as HTMLTextAreaElement).value.trim() || answer.trim();
                    if (currentVal && !isChecking && (!isApplication || applicationPrompt)) {
                      lastCheckedAtRef.current = Date.now();
                      void checkAnswer(currentVal);
                    }
                  } else {
                    if (Date.now() - lastCheckedAtRef.current >= 400 && !saving && !isChecking) {
                      continueToNext();
                    }
                  }
                }
              }}
              placeholder={isApplication
                ? "Viết câu tiếng Anh của bạn theo ý gợi ý..."
                : config.translationPlaceholder}
              value={answer}
            />
          </div>
        )}

        {isCorrect === null ? (
          !isRecognition ? (
            <Button
              className="w-full rounded-full"
              disabled={!answer.trim() || isChecking || (isApplication && !applicationPrompt)}
              onClick={() => {
                lastCheckedAtRef.current = Date.now();
                void checkAnswer(answer.trim());
              }}
              size="lg"
            >
              {isChecking ? "Đang kiểm tra câu..." : "Kiểm tra đáp án"}
            </Button>
          ) : null
        ) : isApplication && applicationEvaluation ? (
          <div className="space-y-3">
            <ApplicationFeedbackView
              isCorrect={isCorrect}
              evaluation={applicationEvaluation}
              requiredPhrase={item.answerText}
            />
            <div className="flex justify-end pt-1">
              <Button
                className="rounded-full px-5 font-semibold gap-2 shadow-sm"
                disabled={saving || isChecking}
                onClick={continueToNext}
                size="default"
              >
                <span>{saving ? "Đang lưu..." : "Câu tiếp theo"}</span>
                <kbd className="hidden sm:inline-block rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-mono leading-none">
                  ↵
                </kbd>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} size={15} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={isCorrect
                ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                : "rounded-xl border border-rose-200 bg-rose-50 p-4"}
            >
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={isCorrect ? CheckmarkCircle02Icon : AlertCircleIcon}
                  size={20}
                  className={isCorrect ? "text-emerald-600" : "text-rose-600"}
                />
                <p className={`font-bold text-base ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                  {isCorrect ? "Chính xác ✓" : "Chưa đúng rồi"}
                </p>
              </div>
              {!isCorrect ? (
                <>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {isRecognition ? "Nghĩa đúng" : "Đáp án đúng"}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {isRecognition ? cleanedPrompt : item.answerText}
                  </p>
                  {!isRecognition ? (
                    <div className="mt-3"><PronunciationControls text={item.answerText} /></div>
                  ) : null}
                  <p className="mt-2 text-xs font-medium text-rose-700">
                    Từ này sẽ xuất hiện lại sau khi bạn đi hết vòng hiện tại.
                  </p>
                </>
              ) : null}
            </div>
            <div className="flex justify-end pt-1">
              <Button
                className="rounded-full px-5 font-semibold gap-2 shadow-sm"
                disabled={saving || isChecking}
                onClick={continueToNext}
                size="default"
              >
                <span>{saving ? "Đang lưu..." : "Câu tiếp theo"}</span>
                <kbd className="hidden sm:inline-block rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-mono leading-none">
                  ↵
                </kbd>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} size={15} />
              </Button>
            </div>
          </div>
        )}
        {checkingError ? <p className="text-sm text-destructive" role="alert">{checkingError}</p> : null}
      </CardContent>
    </Card>
  );
}

function ApplicationFeedbackView({
  isCorrect,
  evaluation,
  requiredPhrase,
}: {
  isCorrect: boolean;
  evaluation: ApplicationEvaluation;
  requiredPhrase: string;
}) {
  const grammarIssues = evaluation.grammarIssues || [];
  const vocabularyUpgrades = evaluation.vocabularyUpgrades || [];

  return (
    <div
      className={
        isCorrect
          ? "rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4 sm:p-5 space-y-4 text-slate-900 shadow-2xs"
          : "rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 sm:p-5 space-y-4 text-slate-900 shadow-2xs"
      }
    >
      {/* Header: Status + Scores */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-0.5">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={isCorrect ? CheckmarkCircle02Icon : AlertCircleIcon}
            size={22}
            className={isCorrect ? "text-emerald-600" : "text-rose-600"}
          />
          <span
            className={`text-base font-bold tracking-tight ${
              isCorrect ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            {isCorrect ? "Chính xác ✓" : "Cần hoàn thiện thêm"}
          </span>
        </div>

        {/* Score Badges */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              evaluation.grammarScore >= 70
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            Ngữ pháp: {evaluation.grammarScore}/100
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              evaluation.meaningScore >= 70
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            Đúng ý: {evaluation.meaningScore}/100
          </span>
        </div>
      </div>

      {/* Target Phrase */}
      <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/80 rounded-xl px-3 py-2 border border-slate-200/70 shadow-2xs">
        <span className="font-medium text-slate-500">Cụm từ yêu cầu:</span>
        <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">
          {requiredPhrase}
        </span>
      </div>

      {/* Overall Feedback */}
      <div className="rounded-xl bg-white/90 border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Nhận xét chung
        </p>
        <p className="text-sm font-medium text-slate-800 leading-relaxed">
          {evaluation.feedbackVi}
        </p>
      </div>

      {/* Section 1: Grammar Feedback */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
          <HugeiconsIcon icon={AlertCircleIcon} size={15} className="text-slate-500" />
          <span>
            Nhận xét Ngữ pháp &amp; Chính tả
            {grammarIssues.length > 0 ? ` (${grammarIssues.length})` : ""}
          </span>
        </div>

        {grammarIssues.length > 0 ? (
          <div className="space-y-2">
            {grammarIssues.map((issue, idx) => (
              <div
                key={`${issue.sourceQuote}-${idx}`}
                className="rounded-xl border border-rose-200/90 bg-white p-3 text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="line-through decoration-rose-400 text-rose-700 font-semibold text-xs sm:text-sm">
                    {issue.sourceQuote}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                    {issue.correction}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  {issue.explanationVi}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2.5 text-xs flex items-center gap-2 text-emerald-800 shadow-2xs">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-emerald-600 shrink-0" />
            <span className="font-medium">
              Ngữ pháp và chính tả câu viết đạt chuẩn, không có lỗi sai cấu trúc.
            </span>
          </div>
        )}
      </div>

      {/* Section 2: Vocabulary / Word Choice Feedback */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
          <HugeiconsIcon icon={BookOpen01Icon} size={15} className="text-slate-500" />
          <span>
            Nhận xét Cách dùng từ &amp; Diễn đạt
            {vocabularyUpgrades.length > 0 ? ` (${vocabularyUpgrades.length})` : ""}
          </span>
        </div>

        {vocabularyUpgrades.length > 0 ? (
          <div className="space-y-2">
            {vocabularyUpgrades.map((upgrade, idx) => (
              <div
                key={`${upgrade.originalWord}-${idx}`}
                className="rounded-xl border border-amber-200/80 bg-white p-3 text-xs space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 font-medium text-xs">Từ hiện tại:</span>
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-900 border border-amber-200/80 text-xs sm:text-sm">
                    {upgrade.originalWord}
                  </span>
                  <span className="text-slate-400 text-xs">→ Gợi ý nâng cấp:</span>
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 border border-indigo-200/80 text-xs sm:text-sm">
                    {upgrade.upgradedAlternatives}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  {upgrade.reasonVi}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5 text-xs flex items-center gap-2 text-slate-700 shadow-2xs">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-emerald-600 shrink-0" />
            <span className="font-medium">
              Từ vựng sử dụng tự nhiên, diễn đạt rõ nghĩa và phù hợp với ngữ cảnh.
            </span>
          </div>
        )}
      </div>

      {/* Section 3: Writing Alternatives */}
      <WritingAlternativesSection evaluation={evaluation} />
    </div>
  );
}

function WritingAlternativesSection({
  evaluation,
}: {
  evaluation: ApplicationEvaluation;
}) {
  const alternatives = (evaluation.writingAlternatives && evaluation.writingAlternatives.length > 0)
    ? evaluation.writingAlternatives
    : [
        {
          label: "Bám sát cấu trúc gốc nhưng gãy gọn hơn:",
          sentenceEn: evaluation.correctedTranslation,
          noteVi: "",
        },
        ...(evaluation.upgradedTranslation && evaluation.upgradedTranslation !== evaluation.correctedTranslation
          ? [
              {
                label: "Trang trọng hơn (phù hợp với biên bản họp, văn bản quản lý):",
                sentenceEn: evaluation.upgradedTranslation,
                noteVi: "",
              },
            ]
          : []),
      ];

  if (alternatives.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center gap-2 text-slate-900">
        <HugeiconsIcon icon={SparklesIcon} size={18} className="text-amber-500 shrink-0" />
        <h4 className="font-bold text-sm sm:text-base tracking-tight text-slate-900">
          Các cách viết tự nhiên &amp; chuyên nghiệp hơn
        </h4>
      </div>

      <div className="space-y-3">
        {alternatives.map((alt, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-3 sm:p-3.5 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                {alt.label}
              </p>
            </div>
            <div className="ml-3.5 border-l-2 border-indigo-400/80 pl-3 py-1 space-y-1">
              <p className="font-medium text-xs sm:text-sm text-slate-950 leading-relaxed select-all">
                &ldquo;{alt.sentenceEn}&rdquo;
              </p>
              {alt.noteVi ? (
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  {alt.noteVi.startsWith("(") ? alt.noteVi : `(${alt.noteVi})`}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
