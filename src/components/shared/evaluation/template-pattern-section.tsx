"use client";

import { Idea01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { CopyButton } from "@/components/shared/copy-button";
import { PronounceButton } from "@/components/shared/pronounce-button";

import { parsePatternTip } from "./utils";

export type TemplatePatternSectionProps = {
  patternTipVi: string;
  paraphraseExampleEn?: string;
};

export function TemplatePatternSection({
  patternTipVi,
  paraphraseExampleEn,
}: TemplatePatternSectionProps) {
  const patternInfo = parsePatternTip(patternTipVi);

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-3.5 sm:p-4 flex flex-col justify-between transition-all">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-amber-900">
              <HugeiconsIcon icon={Idea01Icon} size={15} className="text-amber-700 shrink-0" />
              <span className="text-[11px] font-bold tracking-wider uppercase">Cấu trúc cốt lõi</span>
            </div>
            <span className="rounded-full border border-amber-300 bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              Template B2
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CopyButton text={patternInfo.pattern} />
          </div>
        </div>

        {/* Pattern Content */}
        <div className="cursor-text select-text text-sm sm:text-base font-semibold leading-relaxed text-slate-900">
          {patternInfo.tokens.map((token, i) => {
            if (token.startsWith("[") && token.endsWith("]")) {
              return (
                <span
                  key={i}
                  className="inline-block mx-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[11px] sm:text-xs font-bold border border-amber-300/80 shadow-2xs"
                >
                  {token}
                </span>
              );
            }
            return <span key={i}>{token}</span>;
          })}
        </div>

        {/* Explanation Note */}
        {patternInfo.explanation && (
          <p className="text-xs text-amber-950/80 leading-relaxed font-normal flex items-start gap-1.5">
            <span className="shrink-0 select-none text-amber-600">💡</span>
            <span>{patternInfo.explanation}</span>
          </p>
        )}
      </div>

      {/* Practical Example */}
      {paraphraseExampleEn && (
        <div className="mt-3 pt-2.5 border-t border-amber-200/70 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/80">
              Ví dụ mở rộng (chủ đề khác)
            </span>
            <div className="flex items-center gap-1">
              <PronounceButton text={paraphraseExampleEn} />
              <CopyButton text={paraphraseExampleEn} />
            </div>
          </div>
          <p className="cursor-text select-text text-xs sm:text-sm font-medium text-slate-800 leading-relaxed italic">
            &ldquo;{paraphraseExampleEn}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
