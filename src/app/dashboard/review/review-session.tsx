"use client";

import { Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { TranslationResult } from "@/components/shared/evaluation";
import type { TranslationEvaluation } from "@/components/shared/evaluation";
import { PhrasePractice, PracticeInputBox, WritingTemplatePractice } from "@/components/shared/practice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UploadedQuizType } from "@/server/learning/learning.contract";
import type { LearningItemView } from "@/server/learning/learning.service";

import {
  ReviewSessionHeader,
  SessionPausedCard,
  SessionSummary,
  clearProgressStorage,
  loadProgressFromStorage,
  saveProgressToStorage,
} from "./components";
import {
  COLLOCATION_CONFIG,
  ParaphraseLearningSession,
  StepLearningSession,
  TOPIC_VOCABULARY_CONFIG,
} from "./paraphrase-learning-session";
import {
  ratingLabels,
  type Rating,
  type SessionResultRecord,
  type TopicHeaderInfo,
} from "./types";

export type { TopicHeaderInfo };

export function ReviewSession({
  initialItems,
  sessionMode = "MIXED",
  uploadedQuizType,
  topicHeader,
}: {
  initialItems: LearningItemView[];
  sessionMode?: "MIXED" | "QUICK" | "UPLOADED";
  uploadedQuizType?: UploadedQuizType;
  topicHeader?: TopicHeaderInfo;
}) {
  const storageKey = `draftwise_session_${sessionMode}_${uploadedQuizType ?? "all"}`;

  const [items, setItems] = useState<LearningItemView[]>(initialItems);
  const [totalItems, setTotalItems] = useState(initialItems.length);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState("");
  const [evaluation, setEvaluation] = useState<TranslationEvaluation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);

  // Results tracker for end-of-session summary
  const [results, setResults] = useState<SessionResultRecord[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [savedSessionNotice, setSavedSessionNotice] = useState<{
    itemsCount: number;
    completedCount: number;
  } | null>(null);
  const [activeNextAction, setActiveNextAction] = useState<(() => void) | null>(null);

  // Check LocalStorage on mount
  useEffect(() => {
    const saved = loadProgressFromStorage(storageKey);
    if (saved) {
      queueMicrotask(() => {
        setSavedSessionNotice({
          itemsCount: saved.items.length,
          completedCount: saved.totalItems - saved.items.length,
        });
      });
    }
  }, [storageKey]);

  function resumeSavedSession() {
    const saved = loadProgressFromStorage(storageKey);
    if (saved) {
      setItems(saved.items);
      setTotalItems(saved.totalItems);
      setResults(saved.results || []);
      setSavedSessionNotice(null);
      setIsPaused(false);
    } else {
      setSavedSessionNotice(null);
    }
  }

  function discardSavedSession() {
    clearProgressStorage(storageKey);
    setSavedSessionNotice(null);
  }

  // Save progress to LocalStorage
  function persistProgress(remaining: LearningItemView[], currentResults: SessionResultRecord[]) {
    saveProgressToStorage(storageKey, remaining, totalItems, currentResults);
  }

  const item = items[0];
  const completed = totalItems - items.length;
  const isTranslation = item?.sourceType === "TRANSLATION";
  const isUploadedQuiz = item?.sourceType === "UPLOADED_QUIZ";
  const isPhrase = item?.sourceType === "PHRASE" || isUploadedQuiz;
  const isTemplateQuiz = isUploadedQuiz && uploadedQuizType === "TEMPLATE";

  function addPhraseToSession(newItem: LearningItemView) {
    if (items.some((currentItem) => currentItem.id === newItem.id)) return;
    setItems((current) => [...current, newItem]);
    setTotalItems((total) => total + 1);
  }

  function goToNextItem(shouldRepeat = false, record?: { isCorrect: boolean; userDraft?: string; feedback?: string }) {
    if (item && record) {
      const updatedResults = [
        ...results,
        {
          item,
          isCorrect: record.isCorrect,
          userDraft: record.userDraft,
          feedback: record.feedback,
        },
      ];
      setResults(updatedResults);

      const nextItems = shouldRepeat
        ? [...items.slice(1), items[0]]
        : items.slice(1);

      setItems(nextItems);
      persistProgress(nextItems, updatedResults);
    } else {
      const nextItems = shouldRepeat
        ? [...items.slice(1), items[0]]
        : items.slice(1);

      setItems(nextItems);
      persistProgress(nextItems, results);
    }

    setAttemptNumber((current) => current + 1);
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
        setError("AI chưa chấm được bài dịch này. Bạn vui lòng thử lại nhé.");
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
        setError("Không thể lưu lượt ôn. Bạn vui lòng thử lại nhé.");
        return;
      }

      const isCorrect = rating === "GOOD" || rating === "EASY";
      goToNextItem(rating === "AGAIN", { isCorrect, userDraft: draft });
    } catch {
      setError("Mất kết nối khi lưu lượt ôn.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleRetryWrongOnly() {
    const wrongRecords = results.filter((r) => !r.isCorrect);
    const wrongItems = wrongRecords.map((r) => r.item);
    if (wrongItems.length === 0) return;

    setItems(wrongItems);
    setTotalItems(wrongItems.length);
    setResults([]);
    setDraft("");
    setRevealed(false);
    setEvaluation(null);
    setError(null);
    setIsPaused(false);
  }

  const isParaphraseUpload =
    sessionMode === "UPLOADED" &&
    (uploadedQuizType === "PARAPHRASE" ||
      (!uploadedQuizType && initialItems[0]?.quizType === "PARAPHRASE"));

  if (isParaphraseUpload) {
    return <ParaphraseLearningSession initialItems={initialItems} />;
  }

  const isCollocationUpload =
    sessionMode === "UPLOADED" &&
    (uploadedQuizType === "COLLOCATION" ||
      (!uploadedQuizType && initialItems[0]?.quizType === "COLLOCATION"));

  if (isCollocationUpload) {
    return <StepLearningSession initialItems={initialItems} config={COLLOCATION_CONFIG} />;
  }

  const isTopicVocabUpload =
    sessionMode === "UPLOADED" &&
    (uploadedQuizType === "TOPIC_VOCABULARY" ||
      (!uploadedQuizType && initialItems[0]?.quizType === "TOPIC_VOCABULARY"));

  if (isTopicVocabUpload) {
    return <StepLearningSession initialItems={initialItems} config={TOPIC_VOCABULARY_CONFIG} />;
  }

  // Notice: Resume previous in-progress session
  if (savedSessionNotice && items.length === initialItems.length) {
    return (
      <Card className="border-sky-200 bg-sky-50/70 p-6 sm:p-8">
        <CardContent className="space-y-4 p-0">
          <div className="flex items-center gap-3 text-sky-800">
            <HugeiconsIcon icon={Clock01Icon} size={24} />
            <h3 className="font-heading text-xl font-bold text-slate-900">
              Bạn có một phiên học đang dở dang
            </h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Bạn đã hoàn thành <strong>{savedSessionNotice.completedCount}</strong> câu và còn{" "}
            <strong>{savedSessionNotice.itemsCount}</strong> câu chưa ôn tập. Bạn có muốn tiếp tục phiên học này không?
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={resumeSavedSession} className="rounded-xl font-bold">
              Tiếp tục học dở →
            </Button>
            <Button onClick={discardSavedSession} variant="outline" className="rounded-xl">
              Bắt đầu phiên mới
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Paused state card
  if (isPaused) {
    return (
      <SessionPausedCard
        completed={completed}
        totalItems={totalItems}
        onResume={() => setIsPaused(false)}
      />
    );
  }

  // No items initially
  if (!item && completed === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-white py-12 text-center shadow-sm">
        <CardContent className="mx-auto max-w-xl">
          <Badge className="mb-4" variant="secondary">
            {sessionMode === "UPLOADED" ? "Uploaded Quiz" : "Quick Quiz"}
          </Badge>
          <CardTitle className="font-heading text-2xl font-bold">Chưa có nội dung để luyện</CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed">
            {sessionMode === "UPLOADED"
              ? "Hãy chọn một chủ đề quiz từ Thư viện học của Bạn."
              : "Lưu một cụm từ sau khi AI chấm bài dịch để bắt đầu luyện tập."}
          </CardDescription>
          <Button asChild className="mt-6 rounded-full font-bold">
            <Link href="/dashboard/learning">Về Thư viện học</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // End of Session Summary Screen
  if (!item && completed > 0) {
    return (
      <SessionSummary
        results={results}
        totalItems={totalItems}
        onRetryWrongOnly={handleRetryWrongOnly}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Unified 2-Column Header: Left = Topic info, Right = Progress & Actions */}
      <ReviewSessionHeader
        topicHeader={topicHeader}
        itemsCount={items.length}
        currentItemTopicText={item.topicText}
        completed={completed}
        totalItems={totalItems}
        onPause={() => {
          persistProgress(items, results);
          setIsPaused(true);
        }}
        activeNextAction={activeNextAction}
      />

      {/* Main Content Area */}
      {isTemplateQuiz ? (
        <WritingTemplatePractice
          item={item}
          key={`${item.id}-${attemptNumber}`}
          onNext={goToNextItem}
          setActiveNextAction={setActiveNextAction}
        />
      ) : isTranslation && evaluation ? (
        <TranslationResult
          evaluation={evaluation}
          learnerAnswer={draft}
          onNext={() => {
            const hasError =
              evaluation.score < 70 ||
              evaluation.meaningScore < 70 ||
              evaluation.grammarScore < 70 ||
              Boolean(evaluation.grammarIssues && evaluation.grammarIssues.length > 0);

            goToNextItem(hasError, {
              isCorrect: !hasError,
              userDraft: draft,
              feedback: evaluation.feedbackVi,
            });
          }}
          onPhraseSaved={addPhraseToSession}
          sourceText={item.promptText}
          sourceLearningItemId={item.id}
          setActiveNextAction={setActiveNextAction}
        />
      ) : (
        <Card className="border border-slate-200/90 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardDescription className="text-xs font-semibold text-muted-foreground">
              {isTranslation
                ? "Dịch câu trích từ bài viết của Bạn sang tiếng Anh chuẩn xác"
                : isUploadedQuiz
                  ? item.topicText
                  : isPhrase
                    ? "Hoàn thành câu bằng cụm từ Bạn đã lưu"
                    : item.title}
            </CardDescription>
            <CardTitle className="font-heading text-2xl sm:text-3xl leading-snug text-foreground">
              {item.promptText}
            </CardTitle>
            {!isTranslation && item.hintVi ? (
              <p className="pt-2 text-xs text-muted-foreground">Gợi ý: {item.hintVi}</p>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-6">
            {isPhrase ? (
              <PhrasePractice
                key={item.id}
                item={item}
                onNext={(isCorrect, userDraft) =>
                  goToNextItem(!isCorrect, { isCorrect, userDraft })
                }
                typeOnly={isUploadedQuiz}
              />
            ) : (
              <>
                {isTranslation ? (
                  <p className="text-xs font-semibold text-slate-700">Bản dịch tiếng Anh của Bạn</p>
                ) : null}

                <PracticeInputBox
                  value={draft}
                  onChange={setDraft}
                  onSubmit={isTranslation ? evaluateTranslation : undefined}
                  placeholder={
                    isTranslation
                      ? "Nhập câu dịch tiếng Anh của Bạn tại đây..."
                      : "Tự viết câu trả lời trước khi xem đáp án..."
                  }
                  disabled={isSaving}
                  minHeightClassName="min-h-36 sm:min-h-44"
                  submitShortcut={isTranslation ? "mod-enter" : "none"}
                />

                {isTranslation ? (
                  <Button
                    className="w-full rounded-xl font-bold"
                    disabled={isSaving || draft.trim().length < 2}
                    onClick={evaluateTranslation}
                    size="lg"
                  >
                    {isSaving ? "AI đang chấm bài dịch..." : "Chấm bản dịch với AI"}
                  </Button>
                ) : !revealed ? (
                  <Button
                    className="w-full rounded-xl font-bold"
                    onClick={() => setRevealed(true)}
                    size="lg"
                  >
                    Xem đáp án
                  </Button>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                      <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Đáp án gợi ý
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-base font-medium text-slate-900 leading-relaxed">
                        {item.answerText}
                      </p>
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-semibold text-foreground">Bạn nhớ được mức nào?</p>
                      <div className="grid gap-2 sm:grid-cols-4">
                        {(Object.keys(ratingLabels) as Rating[]).map((rating) => (
                          <Button
                            disabled={isSaving}
                            key={rating}
                            onClick={() => rate(rating)}
                            variant={rating === "GOOD" ? "default" : "outline"}
                            className="rounded-xl text-xs font-semibold"
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
      )}
    </div>
  );
}
