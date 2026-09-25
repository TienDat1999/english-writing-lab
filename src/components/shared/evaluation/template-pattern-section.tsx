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
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3 sm:p-3.5 space-y-2.5 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-amber-900">
            <HugeiconsIcon icon={Idea01Icon} size={15} className="text-amber-700" />
            <span className="text-[11px] font-bold tracking-wider uppercase">Cấu trúc cốt lõi</span>
          </div>
          <CopyButton text={patternInfo.pattern} />
        </div>

        <div className="rounded-lg border border-amber-200/70 bg-white p-2.5 space-y-1.5">
          <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
            {patternInfo.tokens.map((token, i) => {
              if (token.startsWith("[") && token.endsWith("]")) {
                return (
                  <span
                    key={i}
                    className="inline-block mx-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[11px] font-bold border border-amber-300/80"
                  >
                    {token}
                  </span>
                );
              }
              return <span key={i}>{token}</span>;
            })}
          </div>

          {patternInfo.explanation && (
            <p className="text-[11px] text-amber-950/80 leading-relaxed border-t border-amber-100 pt-1.5">
              💡 {patternInfo.explanation}
            </p>
          )}
        </div>
      </div>

      {paraphraseExampleEn && (
        <div className="rounded-lg border border-amber-200/60 bg-white/80 p-2 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800">
              Ví dụ áp dụng thực tế
            </span>
            <div className="flex items-center gap-1">
              <PronounceButton text={paraphraseExampleEn} />
              <CopyButton text={paraphraseExampleEn} />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-800 leading-relaxed">
            {paraphraseExampleEn}
          </p>
        </div>
      )}
    </div>
  );
}
