"use client";

import { CopyButton } from "./copy-button";
import { SaveLearningButton } from "./save-learning-button";

export type GrammarCorrectionItem = {
  sourceQuote: string;
  correctionText: string;
  correctionVi?: string;
  explanationVi?: string;
};

type GrammarCorrectionsTableProps = {
  submissionId: string;
  corrections: GrammarCorrectionItem[];
};

export function GrammarCorrectionsTable({
  submissionId,
  corrections,
}: GrammarCorrectionsTableProps) {
  if (!corrections || corrections.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="w-12 py-3.5 pl-4 text-center">#</th>
              <th className="w-[30%] min-w-[220px] py-3.5 px-3">Câu gốc của bạn</th>
              <th className="w-[33%] min-w-[240px] py-3.5 px-3">Gợi ý viết chuẩn</th>
              <th className="w-[25%] min-w-[180px] py-3.5 px-3">Giải thích quy tắc</th>
              <th className="min-w-[130px] py-3.5 pr-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {corrections.map((item, index) => (
              <tr
                key={index}
                className="transition-colors hover:bg-slate-50/70 align-top"
              >
                {/* Index */}
                <td className="py-4 pl-4 text-center">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-700 border border-rose-100">
                    {index + 1}
                  </span>
                </td>

                {/* Câu gốc */}
                <td className="py-4 px-3">
                  <div className="rounded-xl border border-rose-100/80 bg-rose-50/40 p-3 text-xs leading-relaxed text-slate-800">
                    <span className="line-through decoration-rose-400 font-medium">
                      {item.sourceQuote}
                    </span>
                  </div>
                </td>

                {/* Gợi ý chuẩn */}
                <td className="py-4 px-3">
                  <div className="rounded-xl border border-emerald-100/90 bg-emerald-50/50 p-3 space-y-1">
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm leading-relaxed">
                      {item.correctionText}
                    </p>
                    {item.correctionVi ? (
                      <p className="text-xs text-slate-500 italic">
                        &ldquo;{item.correctionVi}&rdquo;
                      </p>
                    ) : null}
                  </div>
                </td>

                {/* Giải thích quy tắc */}
                <td className="py-4 px-3">
                  {item.explanationVi ? (
                    <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 border border-slate-100">
                      <strong className="text-slate-800 font-semibold">💡 </strong>
                      <span>{item.explanationVi}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">—</span>
                  )}
                </td>

                {/* Thao tác */}
                <td className="py-4 pr-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap pt-1">
                    <CopyButton
                      textToCopy={item.correctionText}
                      label="Chép"
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                    />
                    <SaveLearningButton
                      submissionId={submissionId}
                      sourceType="GRAMMAR"
                      sourceIndex={index}
                      label="Lưu"
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                    />
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
