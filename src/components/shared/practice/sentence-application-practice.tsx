"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Idea01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { TranslationResult } from "@/components/shared/evaluation";
import type { GrammarIssue, TranslationEvaluation, VocabularyUpgrade } from "@/components/shared/evaluation";
import { PracticeInputBox } from "@/components/shared/practice-input-box";
import { PronounceButton } from "@/components/shared/pronounce-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ApplicationEvaluation = {
  feedbackVi: string;
  correctedTranslation: string;
  upgradedTranslation?: string;
  grammarScore: number;
  meaningScore: number;
  grammarIssues: GrammarIssue[];
  vocabularyUpgrades?: VocabularyUpgrade[];
  writingAlternatives?: Array<{
    label: string;
    sentenceEn: string;
    noteVi?: string;
  }>;
};

export type SentenceApplicationPracticeProps = {
  itemId: string;
  targetPhrase: string;
  meaningPrompt: string;
  initialApplicationPromptVi?: string;
  onAnswer?: (isCorrect: boolean, draft: string, evaluation: ApplicationEvaluation) => void;
  onNext: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  saving?: boolean;
};

export function SentenceApplicationPractice({
  itemId,
  targetPhrase,
  meaningPrompt,
  initialApplicationPromptVi = "",
  onAnswer,
  onNext,
  onBack,
  canGoBack = false,
  saving = false,
}: SentenceApplicationPracticeProps) {
  const [draft, setDraft] = useState("");
  const [applicationPrompt, setApplicationPrompt] = useState(initialApplicationPromptVi);
  const [promptRequestKey, setPromptRequestKey] = useState(0);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const [checkingError, setCheckingError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<ApplicationEvaluation | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const lastCheckedAtRef = useRef<number>(0);

  // Auto load or regenerate application prompt if empty
  useEffect(() => {
    if (applicationPrompt && promptRequestKey === 0) return;

    let cancelled = false;
    async function loadPrompt() {
      setIsLoadingPrompt(true);
      setPromptError(null);

      try {
        const response = await fetch(`/api/learning-items/${itemId}/application/prompt`, {
          method: "POST",
        });

        if (!response.ok) throw new Error("PROMPT_FETCH_FAILED");
        const payload = (await response.json()) as { data: { promptVi: string } };
        if (!cancelled) setApplicationPrompt(payload.data.promptVi);
      } catch {
        if (!cancelled) setPromptError("Chưa tạo được ý gợi ý cho cụm từ này.");
      } finally {
        if (!cancelled) setIsLoadingPrompt(false);
      }
    }

    void loadPrompt();
    return () => {
      cancelled = true;
    };
  }, [applicationPrompt, itemId, promptRequestKey]);

  async function handleEvaluate() {
    const trimmed = draft.trim();
    if (!trimmed || isCorrect !== null || isChecking || saving) return;

    setIsChecking(true);
    setCheckingError(null);

    try {
      const response = await fetch(`/api/learning-items/${itemId}/application/evaluate`, {
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
      setEvaluation(payload.data.evaluation);
      setIsCorrect(payload.data.isCorrect);
      onAnswer?.(payload.data.isCorrect, trimmed, payload.data.evaluation);
    } catch {
      setCheckingError("Chưa thể chấm câu này. Bạn vui lòng thử lại nhé.");
    } finally {
      setIsChecking(false);
    }
  }

  function handleContinue() {
    if (isCorrect === null || isChecking || saving) return;
    onNext();
  }

  // When evaluation is ready, directly reuse the shared TranslationResult component
  if (isCorrect !== null && evaluation) {
    const overallScore = Math.round((evaluation.grammarScore + evaluation.meaningScore) / 2);
    const translationEvaluation: TranslationEvaluation = {
      score: overallScore,
      meaningScore: evaluation.meaningScore,
      grammarScore: evaluation.grammarScore,
      naturalnessScore: evaluation.meaningScore,
      feedbackVi: evaluation.feedbackVi,
      correctedTranslation: evaluation.correctedTranslation,
      upgradedTranslation: evaluation.upgradedTranslation,
      grammarIssues: evaluation.grammarIssues,
      vocabularyUpgrades: evaluation.vocabularyUpgrades,
    };

    return (
      <Card className="border-t-4 border-t-primary bg-card shadow-[0_18px_40px_rgb(35_87_170/12%)] rounded-2xl overflow-hidden">
        <CardHeader className="gap-1 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nghĩa: {meaningPrompt}
              </CardDescription>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <CardTitle className="font-heading text-2xl sm:text-3xl leading-tight text-foreground">
                  {targetPhrase}
                </CardTitle>
                <PronounceButton text={targetPhrase} />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {onBack ? (
                <Button
                  className="rounded-full"
                  disabled={!canGoBack || isChecking || saving}
                  onClick={onBack}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
                  Quay lại
                </Button>
              ) : null}

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
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <TranslationResult
            evaluation={translationEvaluation}
            learnerAnswer={draft}
            sourceText={applicationPrompt || `Hãy viết câu tiếng Anh có chứa "${targetPhrase}"`}
            onNext={handleContinue}
            setActiveNextAction={() => {}}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-t-4 border-t-primary bg-card shadow-[0_18px_40px_rgb(35_87_170/12%)] rounded-2xl overflow-hidden">
      <CardHeader className="gap-1 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nghĩa: {meaningPrompt}
            </CardDescription>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <CardTitle className="font-heading text-2xl sm:text-3xl leading-tight text-foreground">
                {targetPhrase}
              </CardTitle>
              <PronounceButton text={targetPhrase} />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {onBack ? (
              <Button
                className="rounded-full"
                disabled={!canGoBack || isChecking || saving}
                onClick={onBack}
                size="sm"
                type="button"
                variant="outline"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
                Quay lại
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5 sm:p-6">
        {/* Suggested Context / Idea Prompt */}
        <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 p-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-800">
              <HugeiconsIcon icon={Idea01Icon} size={15} />
              Ý gợi ý để viết câu:
            </span>
            <Button
              className="h-6 px-2 text-[11px] text-sky-700 hover:text-sky-900 hover:bg-sky-100/80 rounded-md font-semibold cursor-pointer"
              disabled={isLoadingPrompt || isChecking}
              onClick={() => {
                setApplicationPrompt("");
                setPromptRequestKey((k) => k + 1);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              <HugeiconsIcon icon={SparklesIcon} size={13} />
              Đổi ý khác
            </Button>
          </div>

          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            {isLoadingPrompt ? (
              <span className="text-muted-foreground animate-pulse">AI đang chuẩn bị ngữ cảnh gợi ý...</span>
            ) : promptError ? (
              <span className="text-rose-600">{promptError}</span>
            ) : (
              applicationPrompt || "Hãy đặt một câu tiếng Anh tự nhiên sử dụng cụm từ này."
            )}
          </p>
        </div>

        <div className="space-y-3">
          <label htmlFor="sentence-app-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Viết câu tiếng Anh của bạn (Bắt buộc chứa &ldquo;{targetPhrase}&rdquo;):
          </label>

          <PracticeInputBox
            id="sentence-app-input"
            value={draft}
            onChange={setDraft}
            onSubmit={() => void handleEvaluate()}
            placeholder={`Viết câu tiếng Anh hoàn chỉnh có chứa "${targetPhrase}"...`}
            disabled={isChecking || saving || isLoadingPrompt}
            autoFocus={true}
            minHeightClassName="min-h-36 sm:min-h-44"
            submitShortcut="mod-enter"
          />

          <div className="flex justify-end pt-1">
            <Button
              className="rounded-xl px-6 font-bold shadow-xs"
              disabled={!draft.trim() || isChecking || saving || isLoadingPrompt}
              onClick={() => void handleEvaluate()}
              type="button"
            >
              {isChecking ? (
                <>
                  <HugeiconsIcon icon={SparklesIcon} size={16} className="animate-spin" />
                  AI đang phân tích câu...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={SparklesIcon} size={16} />
                  Chấm câu với AI
                </>
              )}
            </Button>
          </div>
          {checkingError ? <p className="text-sm text-destructive" role="alert">{checkingError}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
