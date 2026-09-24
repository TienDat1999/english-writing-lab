"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { CopyButton } from "./copy-button";
import { SaveLearningButton } from "./save-learning-button";

type GrammarCorrectionCardProps = {
  index: number;
  submissionId: string;
  sourceQuote: string;
  correctionText: string;
  correctionVi?: string;
  explanationVi?: string;
};

export function GrammarCorrectionCard({
  index,
  submissionId,
  sourceQuote,
  correctionText,
  correctionVi,
  explanationVi,
}: GrammarCorrectionCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
            {index + 1}
          </span>
          <span className="font-heading text-xs font-bold text-slate-900">
            Lỗi ngữ pháp #{index + 1}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <CopyButton textToCopy={correctionText} label="Chép" size="sm" />
          <SaveLearningButton
            sourceIndex={index}
            sourceType="GRAMMAR"
            submissionId={submissionId}
          />
        </div>
      </div>

      {/* Main Diff Comparison */}
      <div className="my-3.5 space-y-3">
        {/* Câu gốc */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
            Câu gốc của Bạn
          </span>
          <div className="rounded-xl bg-rose-50/40 p-3 border border-rose-100/70 text-sm leading-relaxed text-slate-800">
            <span className="line-through decoration-rose-400 decoration-1 text-slate-700 font-medium">
              {sourceQuote}
            </span>
          </div>
        </div>

        {/* Transition indicator */}
        <div className="flex items-center justify-center -my-1 text-slate-400">
          <div className="flex size-5 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
          </div>
        </div>

        {/* Câu sửa gợi ý */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Gợi ý viết chuẩn
          </span>
          <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100/80 text-sm leading-relaxed text-slate-900 font-semibold">
            {correctionText}
            {correctionVi ? (
              <p className="mt-1 text-xs text-slate-500 font-normal italic">
                &ldquo;{correctionVi}&rdquo;
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Rule explanation footer */}
      {explanationVi ? (
        <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 border border-slate-100">
          <strong className="text-slate-800 font-semibold">💡 Giải thích: </strong>
          <span>{explanationVi}</span>
        </div>
      ) : null}
    </div>
  );
}
