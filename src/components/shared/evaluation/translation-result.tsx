"use client";

import {
  ArrowRight01Icon,
  PencilEdit02Icon,
  SparklesIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import type { LearningItemView } from "@/server/learning/learning.service";

import { AnswerCard } from "./answer-card";
import { DetailedGrammarIssues } from "./detailed-grammar-issues";
import { TemplatePatternSection } from "./template-pattern-section";
import type { TranslationEvaluation } from "./types";
import { getScoreTier } from "./utils";
import { VocabularyUpgradeTable } from "./vocabulary-upgrade-table";

export type TranslationResultProps = {
  evaluation: TranslationEvaluation;
  learnerAnswer: string;
  meaningLabel?: string;
  nextLabel?: string;
  onNext: () => void;
  onPhraseSaved?: (item: LearningItemView) => void;
  sourceText?: string;
  sourceLearningItemId?: string;
  setActiveNextAction?: (action: (() => void) | null) => void;
};

export function TranslationResult({
  evaluation,
  learnerAnswer,
  meaningLabel = "Đúng nghĩa",
  nextLabel = "Tiếp tục",
  onNext,
  onPhraseSaved,
  sourceText,
  sourceLearningItemId,
  setActiveNextAction,
}: TranslationResultProps) {
  const tier = getScoreTier(evaluation.score);

  // Register next action for session header
  useEffect(() => {
    if (setActiveNextAction) {
      setActiveNextAction(() => onNext);
      return () => setActiveNextAction(null);
    }
  }, [onNext, setActiveNextAction]);

  // Keyboard shortcut listener: Enter to continue
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext]);

  const hasUpgrade = Boolean(
    evaluation.upgradedTranslation &&
    evaluation.upgradedTranslation !== evaluation.correctedTranslation
  );
  const hasPattern = Boolean(evaluation.patternTipVi);

  return (
    <div className="space-y-3.5 animate-in fade-in-50 duration-300" aria-live="polite">
      {/* Top Bar: Đề bài gốc (Left) | Điểm số & 3 metrics (Right) - Frameless, no card wrapper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        {/* Left: Đề bài gốc */}
        {sourceText ? (
          <div className="min-w-0 flex-1 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Đề bài gốc
            </span>
            <p className="text-slate-900 font-semibold text-sm sm:text-base leading-snug">
              &ldquo;{sourceText}&rdquo;
            </p>
          </div>
        ) : null}

        {/* Right: Score + 3 Metric Pills with Interactive Tooltips */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
              Điểm
            </span>
            <span className={`font-mono text-2xl font-black leading-none ${tier.scoreClass}`}>
              {evaluation.score}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
          </div>

          {/* 3 Metric Pills with Hover Tooltips */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            {/* Metric 1: Functional / Meaning */}
            <div
              className="group relative flex items-center gap-1 py-1 px-1.5 rounded-lg bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-help shadow-2xs"
              title={`${meaningLabel}: ${evaluation.meaningScore}%`}
            >
              <HugeiconsIcon icon={Target01Icon} size={14} className="text-emerald-600 shrink-0" />
              <span className="font-mono text-xs font-bold text-slate-800">{evaluation.meaningScore}%</span>

              {/* Hover Tooltip */}
              <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30">
                {meaningLabel}: {evaluation.meaningScore}%
              </div>
            </div>

            {/* Metric 2: Grammar */}
            <div
              className="group relative flex items-center gap-1 py-1 px-1.5 rounded-lg bg-white border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/40 transition-all cursor-help shadow-2xs"
              title={`Ngữ pháp: ${evaluation.grammarScore}%`}
            >
              <HugeiconsIcon icon={PencilEdit02Icon} size={14} className="text-sky-600 shrink-0" />
              <span className="font-mono text-xs font-bold text-slate-800">{evaluation.grammarScore}%</span>

              {/* Hover Tooltip */}
              <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30">
                Ngữ pháp: {evaluation.grammarScore}%
              </div>
            </div>

            {/* Metric 3: Naturalness */}
            <div
              className="group relative flex items-center gap-1 py-1 px-1.5 rounded-lg bg-white border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/40 transition-all cursor-help shadow-2xs"
              title={`Độ tự nhiên: ${evaluation.naturalnessScore}%`}
            >
              <HugeiconsIcon icon={SparklesIcon} size={14} className="text-amber-500 shrink-0" />
              <span className="font-mono text-xs font-bold text-slate-800">{evaluation.naturalnessScore}%</span>

              {/* Hover Tooltip */}
              <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30">
                Độ tự nhiên: {evaluation.naturalnessScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Fallback button if setActiveNextAction not provided */}
        {!setActiveNextAction && (
          <Button
            onClick={onNext}
            size="lg"
            className="rounded-xl font-bold h-10 px-5 text-sm gap-2 shadow-sm w-full sm:w-auto"
          >
            <span>{nextLabel}</span>
            <kbd className="hidden sm:inline-block rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-mono leading-none">
              ↵
            </kbd>
            <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
          </Button>
        )}
      </div>

      {/* Main Content Area: Full width, stacked cleanly */}
      <div className="space-y-3.5">
        {/* Bản viết của bạn with direct inline strikethrough correction */}
        <AnswerCard
          label="Bản viết của bạn"
          text={learnerAnswer}
          variant="learner"
          showActions={true}
          actionText={evaluation.correctedTranslation}
          issues={evaluation.grammarIssues}
          onPhraseSaved={onPhraseSaved}
          sourceLearningItemId={sourceLearningItemId}
        />

        {/* Detailed Grammar & Vocabulary Issues Analysis */}
        {evaluation.grammarIssues && evaluation.grammarIssues.length > 0 && (
          <DetailedGrammarIssues issues={evaluation.grammarIssues} />
        )}

        {/* B2 Natural Upgrade & Template Pattern Subgrid */}
        {hasUpgrade && hasPattern ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
            <AnswerCard
              label="Gợi ý viết B2 tự nhiên hơn"
              onPhraseSaved={onPhraseSaved}
              sourceLearningItemId={sourceLearningItemId}
              text={evaluation.upgradedTranslation!}
              variant="upgrade"
            />

            <TemplatePatternSection
              patternTipVi={evaluation.patternTipVi!}
              paraphraseExampleEn={evaluation.paraphraseExampleEn}
            />
          </div>
        ) : (
          <>
            {hasUpgrade && (
              <AnswerCard
                label="Gợi ý cách viết B2 tự nhiên hơn"
                onPhraseSaved={onPhraseSaved}
                sourceLearningItemId={sourceLearningItemId}
                text={evaluation.upgradedTranslation!}
                variant="upgrade"
              />
            )}

            {hasPattern && (
              <TemplatePatternSection
                patternTipVi={evaluation.patternTipVi!}
                paraphraseExampleEn={evaluation.paraphraseExampleEn}
              />
            )}
          </>
        )}

        {/* Vocabulary Upgrades Comparison Table (For Essay/IELTS) */}
        {(() => {
          if (!evaluation.vocabularyUpgrades || evaluation.vocabularyUpgrades.length === 0) return null;
          const genuineUpgrades = evaluation.vocabularyUpgrades.filter((item) => {
            const normOrig = item.originalWord.trim().toLowerCase();
            const normUp = item.upgradedAlternatives.trim().toLowerCase();
            return !(evaluation.grammarIssues || []).some((issue) => {
              const normSrc = issue.sourceQuote.trim().toLowerCase();
              const normCorr = issue.correction.trim().toLowerCase();
              return (
                normOrig === normSrc ||
                normOrig === normCorr ||
                normUp === normCorr ||
                normSrc.includes(normOrig) ||
                normOrig.includes(normSrc)
              );
            });
          });

          if (genuineUpgrades.length === 0) return null;
          return <VocabularyUpgradeTable upgrades={genuineUpgrades} />;
        })()}
      </div>
    </div>
  );
}
