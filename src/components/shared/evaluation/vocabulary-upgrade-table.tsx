"use client";

import { CopyButton } from "@/components/shared/copy-button";
import { PronounceButton } from "@/components/shared/pronounce-button";

import type { VocabularyUpgrade } from "./types";

export type VocabularyUpgradeTableProps = {
  upgrades: VocabularyUpgrade[];
};

export function VocabularyUpgradeTable({ upgrades }: VocabularyUpgradeTableProps) {
  if (!upgrades || upgrades.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-heading text-sm font-bold text-slate-900 leading-snug">
          Gợi ý từ vựng nâng cao{" "}
          <span className="text-xs font-normal text-slate-500 font-sans">
            (B2 / C1 - Học thuật & Tự nhiên)
          </span>
        </h4>
        <span className="rounded-full bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-bold shrink-0">
          {upgrades.length} từ vựng
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200/80 bg-white">
        <table className="w-full text-left text-xs sm:text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-700">
              <th className="py-2 px-3 font-bold w-1/3 sm:w-1/4">Từ gốc trong bài</th>
              <th className="py-2 px-3 font-bold">Gợi ý từ vựng nâng cao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {upgrades.map((item, index) => (
              <tr
                key={`${item.originalWord}-${index}`}
                className="hover:bg-slate-50/40 transition-colors"
                title={item.reasonVi}
              >
                <td className="py-2 px-3 font-bold text-slate-950 align-middle">
                  <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-xs border border-slate-200/70">
                    {item.originalWord}
                  </span>
                </td>
                <td className="py-2 px-3 italic text-slate-900 align-middle">
                  <div className="flex items-center justify-between gap-2">
                    <span className="leading-relaxed font-medium text-xs sm:text-sm">
                      {item.upgradedAlternatives}
                    </span>
                    <div className="flex items-center gap-1 not-italic shrink-0">
                      <PronounceButton text={item.upgradedAlternatives} />
                      <CopyButton text={item.upgradedAlternatives} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
