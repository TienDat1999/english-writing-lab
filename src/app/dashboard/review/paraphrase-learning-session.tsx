"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ActiveRecallPractice,
  RecognitionPractice,
  SentenceApplicationPractice,
  StepCompletionCard,
  StepProgressIndicator,
  buildMeaningOptions,
  cleanMeaningText,
} from "@/components/shared/practice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { LearningItemView } from "@/server/learning/learning.service";

export type LearningStage = "RECOGNITION" | "TRANSLATION" | "APPLICATION";

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

export const stages: Array<{
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
      <Card className="border-dashed border-blue-200 bg-blue-50/60 py-12 text-center rounded-2xl">
        <CardContent>
          <CardTitle className="font-heading text-3xl">Chủ đề này chưa có từ để học</CardTitle>
          <Button asChild className="mt-6 rounded-full font-bold">
            <Link href="/dashboard/learning">Chọn chủ đề khác</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (completed) {
    return (
      <StepCompletionCard
        totalItems={initialItems.length}
        unitLabel={config.unitLabel}
        topicTitle={initialItems[0]?.topicText}
        backHref="/dashboard/learning"
        backLabel="Về Thư viện học"
        onRetry={() => {
          setStageIndex(0);
          setRoundItems(initialItems);
          setCurrentIndex(0);
          setRetryItems([]);
          setRound(1);
          setMistakeIds(new Set());
          setCompleted(false);
        }}
      />
    );
  }

  const options = stage.id === "RECOGNITION" && item ? buildMeaningOptions(item, initialItems) : [];

  return (
    <div className={`mx-auto transition-all duration-300 ${stage.id === "APPLICATION" ? "max-w-6xl" : "max-w-4xl"}`}>
      {/* Shared Progress Indicator */}
      <StepProgressIndicator
        stages={stages}
        currentStageIndex={stageIndex}
        currentRound={round}
        currentIndex={currentIndex}
        totalItemsInRound={roundItems.length}
        className="mb-4"
      />

      {/* Stage Component Dispatcher */}
      {stage.id === "RECOGNITION" ? (
        <RecognitionPractice
          key={`recognition:${round}:${item.id}:${currentIndex}`}
          targetText={item.answerText}
          promptMeaning={item.promptText}
          options={options}
          categoryLabel={config.questionLabel}
          contextSentence={item.contextText}
          onNext={() => void continueAfterAnswer(true)}
          onAnswer={(correct) => {
            if (!correct) {
              setMistakeIds((current) => new Set(current).add(item.id));
            }
          }}
          onBack={goBack}
          canGoBack={currentIndex > 0}
          saving={isSaving}
        />
      ) : stage.id === "TRANSLATION" ? (
        <ActiveRecallPractice
          key={`recall:${round}:${item.id}:${currentIndex}`}
          promptText={cleanMeaningText(item.promptText)}
          targetAnswer={item.answerText}
          topicText={item.topicText}
          placeholder={config.translationPlaceholder}
          hint={item.hintVi}
          onNext={() => void continueAfterAnswer(true)}
          onAnswer={(correct) => {
            if (!correct) {
              setMistakeIds((current) => new Set(current).add(item.id));
            }
          }}
          onBack={goBack}
          canGoBack={currentIndex > 0}
          saving={isSaving}
        />
      ) : (
        <SentenceApplicationPractice
          key={`application:${round}:${item.id}:${currentIndex}`}
          itemId={item.id}
          targetPhrase={item.answerText}
          meaningPrompt={cleanMeaningText(item.promptText)}
          initialApplicationPromptVi={item.applicationPromptVi}
          onNext={() => void continueAfterAnswer(true)}
          onAnswer={(correct) => {
            if (!correct) {
              setMistakeIds((current) => new Set(current).add(item.id));
            }
          }}
          onBack={goBack}
          canGoBack={currentIndex > 0}
          saving={isSaving}
        />
      )}

      {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

// Backward-compatibility alias
export function ParaphraseLearningSession({ initialItems }: { initialItems: LearningItemView[] }) {
  return <StepLearningSession initialItems={initialItems} config={PARAPHRASE_CONFIG} />;
}
