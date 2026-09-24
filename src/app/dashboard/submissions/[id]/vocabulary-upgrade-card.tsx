"use client";

import { ArrowRight01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@/components/ui/badge";
import { CopyButton } from "./copy-button";
import { SaveLearningButton } from "./save-learning-button";

type VocabularyUpgradeCardProps = {
  index: number;
  submissionId: string;
  originalExpression: string;
  upgradedExpression: string;
  meaningVi: string;
};

export function VocabularyUpgradeCard({
  index,
  submissionId,
  originalExpression,
  upgradedExpression,
  meaningVi,
}: VocabularyUpgradeCardProps) {
  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-sky-300 hover:shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
            {index + 1}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-800">
            <HugeiconsIcon icon={SparklesIcon} size={13} className="text-sky-600" />
            Cụm diễn đạt #{index + 1}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <CopyButton textToCopy={upgradedExpression} label="Chép" size="sm" />
          <SaveLearningButton
            sourceIndex={index}
            sourceType="VOCABULARY"
            submissionId={submissionId}
          />
        </div>
      </div>

      {/* Transformation comparison */}
      <div className="my-3.5 space-y-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="line-through decoration-slate-300">{originalExpression}</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-sky-500 shrink-0" />
        </div>

        <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50/60 to-blue-50/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading text-base font-bold text-slate-900 group-hover:text-sky-950 transition-colors">
              {upgradedExpression}
            </p>
            <Badge variant="outline" className="border-sky-200 bg-sky-100/60 text-[10px] font-semibold text-sky-800">
              Collocation B2+
            </Badge>
          </div>
        </div>
      </div>

      {/* Meaning in Vietnamese */}
      <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100 leading-relaxed">
        <span className="font-semibold text-slate-800">Giải nghĩa: </span>
        <span>{meaningVi}</span>
      </div>
    </div>
  );
}
