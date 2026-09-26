"use client";

import { useState } from "react";

import { CopyButton } from "@/components/shared/copy-button";
import { PronounceButton } from "@/components/shared/pronounce-button";
import { Button } from "@/components/ui/button";
import type { LearningItemView } from "@/server/learning/learning.service";

import type { GrammarIssue } from "./types";

export function renderAnnotatedAnswer(
  text: string,
  issues?: GrammarIssue[],
) {
  if (!issues || issues.length === 0) {
    return text;
  }

  type Match = {
    start: number;
    end: number;
    sourceQuote: string;
    correction: string;
    issue: GrammarIssue;
  };

  const matches: Match[] = [];
  const lowerText = text.toLowerCase();

  for (const issue of issues) {
    const rawQuote = issue.sourceQuote?.trim();
    if (!rawQuote) continue;

    let start = text.indexOf(rawQuote);
    if (start === -1) {
      start = lowerText.indexOf(rawQuote.toLowerCase());
    }

    if (start !== -1) {
      matches.push({
        start,
        end: start + rawQuote.length,
        sourceQuote: text.slice(start, start + rawQuote.length),
        correction: issue.correction,
        issue,
      });
    }
  }

  if (matches.length === 0) {
    return text;
  }

  matches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  const nonOverlapping: Match[] = [];
  let currentEnd = -1;
  for (const m of matches) {
    if (m.start >= currentEnd) {
      nonOverlapping.push(m);
      currentEnd = m.end;
    }
  }

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  nonOverlapping.forEach((m, idx) => {
    if (m.start > lastIndex) {
      nodes.push(text.slice(lastIndex, m.start));
    }

    const isStyle = m.issue.issueType === "STYLE_SUGGESTION";
    const isTypo = m.issue.issueType === "SPELLING_TYPO";

    nodes.push(
      <span key={`annotated-match-${idx}`} className="mx-0.5 inline align-baseline">
        <del
          className={`line-through decoration-2 px-1 py-0.5 rounded font-medium text-sm sm:text-base ${
            isStyle
              ? "decoration-indigo-400 text-indigo-700 bg-indigo-50"
              : isTypo
                ? "decoration-amber-500 text-amber-800 bg-amber-50"
                : "decoration-rose-500 text-rose-700 bg-rose-50"
          }`}
          title={m.issue.reasonVi || m.issue.explanationVi}
        >
          {m.sourceQuote}
        </del>
        <ins className="no-underline text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded font-bold text-sm sm:text-base ml-1 border border-emerald-300/80 shadow-2xs">
          {m.correction}
        </ins>
      </span>,
    );

    lastIndex = m.end;
  });

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export const answerCardStyles = {
  learner: {
    card: "border-slate-200/80 bg-slate-50/70",
    label: "text-slate-600 font-bold",
    badge: "bg-slate-200/80 text-slate-700 border-slate-300",
    status: "Bản của bạn",
  },
  corrected: {
    card: "border-emerald-200/90 bg-emerald-50/40",
    label: "text-emerald-900 font-bold",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    status: "Bản sửa tối ưu ✓",
  },
  upgrade: {
    card: "border-sky-200/80 bg-sky-50/30",
    label: "text-sky-900 font-bold",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
    status: "B2 Nâng cao",
  },
} as const;

export type AnswerCardProps = {
  label: string;
  text: string;
  variant: keyof typeof answerCardStyles;
  onPhraseSaved?: (item: LearningItemView) => void;
  sourceLearningItemId?: string;
  showActions?: boolean;
  actionText?: string;
  issues?: GrammarIssue[];
  badgeText?: string;
};

export function AnswerCard({
  label,
  text,
  variant,
  onPhraseSaved,
  sourceLearningItemId,
  showActions = true,
  actionText,
  issues,
  badgeText,
}: AnswerCardProps) {
  const styles = answerCardStyles[variant];
  const [selectedPhrase, setSelectedPhrase] = useState("");
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED" | "ERROR">("IDLE");
  const [showRaw, setShowRaw] = useState(false);

  const hasIssues = Boolean(issues && issues.length > 0);
  const speechText = actionText || text;

  function captureSelection() {
    if (!onPhraseSaved || !sourceLearningItemId) return;
    const selection = window.getSelection();
    const phrase = selection?.toString().trim() ?? "";
    if (phrase.length >= 2 && phrase.length <= 80) {
      setSelectedPhrase(phrase);
    }
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
      className={`rounded-xl border p-3.5 sm:p-4 transition-all flex flex-col justify-between ${styles.card}`}
      onMouseUp={captureSelection}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${styles.label}`}>
              {label}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles.badge}`}>
              {badgeText ||
                (variant === "learner"
                  ? hasIssues
                    ? "Bản của bạn (Sửa trực tiếp)"
                    : "Bản của bạn ✓ Chuẩn ngữ pháp"
                  : styles.status)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {variant === "learner" && hasIssues && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowRaw(!showRaw)}
                className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground font-semibold"
              >
                {showRaw ? "Xem sửa trực tiếp" : "Xem câu gốc"}
              </Button>
            )}
            {showActions && (
              <div className="flex items-center gap-1">
                <PronounceButton text={speechText} />
                <CopyButton text={speechText} />
              </div>
            )}
          </div>
        </div>

        <div className="cursor-text select-text whitespace-pre-wrap text-sm sm:text-base font-medium leading-relaxed text-slate-900">
          {variant === "learner" && hasIssues && !showRaw
            ? renderAnnotatedAnswer(text, issues)
            : text}
        </div>
      </div>

      {selectedPhrase && onPhraseSaved ? (
        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-sky-200 bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between text-xs shadow-2xs">
          <p className="min-w-0 text-slate-700">
            Đã chọn: <strong className="text-primary font-medium">&ldquo;{selectedPhrase}&rdquo;</strong>
          </p>
          <Button
            className="shrink-0 rounded-lg text-xs h-7"
            disabled={saveStatus === "SAVING" || saveStatus === "SAVED"}
            onClick={savePhrase}
            size="sm"
            type="button"
          >
            {saveStatus === "SAVING"
              ? "Đang lưu..."
              : saveStatus === "SAVED"
                ? "Đã lưu ✓"
                : "+ Lưu vào Quick Quiz"}
          </Button>
        </div>
      ) : onPhraseSaved ? (
        <p className="mt-2 text-[11px] text-muted-foreground/80">
          💡 Mẹo: Bôi đen một cụm từ trong câu để lưu nhanh vào bộ từ vựng Quick Quiz.
        </p>
      ) : null}
    </div>
  );
}
