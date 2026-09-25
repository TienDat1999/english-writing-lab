"use client";

import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { GrammarIssue } from "./types";

export type DetailedGrammarIssuesProps = {
  issues: GrammarIssue[];
};

export function DetailedGrammarIssues({ issues }: DetailedGrammarIssuesProps) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded-md bg-rose-50 text-rose-600 font-bold">
            <HugeiconsIcon icon={AlertCircleIcon} size={15} />
          </div>
          <h4 className="font-heading text-sm font-bold text-slate-900 leading-snug">
            Điểm cần sửa ({issues.length})
          </h4>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          Gợi ý sửa &amp; phân tích ngữ pháp
        </span>
      </div>

      <div className="divide-y divide-slate-100 space-y-3">
        {issues.map((issue, index) => {
          const isStyle = issue.issueType === "STYLE_SUGGESTION";
          const isTypo = issue.issueType === "SPELLING_TYPO";

          return (
            <div
              key={`${issue.sourceQuote}-${index}`}
              className={index === 0 ? "space-y-1.5" : "pt-3 space-y-1.5"}
            >
              {/* Row 1: Direct comparison + badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap text-sm sm:text-base">
                  <span className="line-through decoration-rose-400 decoration-2 text-rose-700 font-semibold bg-rose-50/80 px-1.5 py-0.5 rounded">
                    {issue.sourceQuote}
                  </span>
                  <span className="text-slate-400 font-bold text-xs">→</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                    {issue.correction}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {isStyle ? (
                    <span className="rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 text-[10px] font-bold">
                      ✨ Tùy chọn văn phong
                    </span>
                  ) : isTypo ? (
                    <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                      ✏️ Lỗi chính tả
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 text-[10px] font-bold">
                      Lỗi ngữ pháp
                    </span>
                  )}
                  {issue.wordClass && (
                    <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium">
                      {issue.wordClass}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Explanations without any nested bordered boxes */}
              <div className="space-y-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  <span className="font-semibold text-slate-900">Lý do: </span>
                  {issue.reasonVi || issue.explanationVi}
                </p>
                {issue.contextAndExampleVi && (
                  <p className="text-slate-600 text-xs">
                    <span className="font-semibold text-sky-800">Ngữ cảnh &amp; ví dụ: </span>
                    {issue.contextAndExampleVi}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
