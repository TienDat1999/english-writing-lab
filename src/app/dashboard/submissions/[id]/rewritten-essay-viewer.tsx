"use client";

import { useState } from "react";
import { CopyButton } from "./copy-button";
import { SaveLearningButton } from "./save-learning-button";
import { Badge } from "@/components/ui/badge";

type RewrittenEssayViewerProps = {
  submissionId: string;
  rewrittenEssay: string;
  rewrittenEssayVi: string;
};

export function RewrittenEssayViewer({
  submissionId,
  rewrittenEssay,
  rewrittenEssayVi,
}: RewrittenEssayViewerProps) {
  const [viewMode, setViewMode] = useState<"bilingual" | "english" | "vietnamese">("bilingual");

  const englishParagraphs = rewrittenEssay
    .split(/\n+/u)
    .map((p) => p.trim())
    .filter(Boolean);

  const vietnameseParagraphs = rewrittenEssayVi
    .split(/\n+/u)
    .map((p) => p.trim())
    .filter(Boolean);

  const englishWordCount = rewrittenEssay
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-800 font-semibold text-xs">
            Chuẩn B2 / C1 · P.E.E.R
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">
            {englishWordCount} từ (Mục tiêu 250–280 từ)
          </span>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("bilingual")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                viewMode === "bilingual"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Song ngữ song song
            </button>
            <button
              type="button"
              onClick={() => setViewMode("english")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                viewMode === "english"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tiếng Anh
            </button>
            <button
              type="button"
              onClick={() => setViewMode("vietnamese")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                viewMode === "vietnamese"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bản dịch tiếng Việt
            </button>
          </div>

          <CopyButton textToCopy={rewrittenEssay} label="Chép bài mẫu" />
          <SaveLearningButton
            label="Lưu bài mẫu"
            sourceType="ESSAY_BLUEPRINT"
            submissionId={submissionId}
          />
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 sm:p-8">
        {viewMode === "bilingual" ? (
          <div className="space-y-6">
            {englishParagraphs.map((enP, idx) => {
              const viP = vietnameseParagraphs[idx] || "";
              const paragraphLabels = ["Mở bài (Introduction)", "Thân bài 1 (Body 1)", "Thân bài 2 (Body 2)", "Kết bài (Conclusion)"];
              const label = paragraphLabels[idx] || `Đoạn ${idx + 1}`;

              return (
                <div
                  key={idx}
                  className="group rounded-xl border border-slate-100 bg-slate-50/40 p-4 transition-all hover:border-slate-200 hover:bg-slate-50/80"
                >
                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>{label}</span>
                    <CopyButton textToCopy={enP} label="" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <p className="font-sans text-base leading-relaxed text-slate-900 font-medium">
                      {enP}
                    </p>
                    <p className="font-sans text-sm leading-relaxed text-slate-600 lg:border-l lg:border-slate-200 lg:pl-4">
                      {viP}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === "english" ? (
          <div className="mx-auto max-w-3xl space-y-4">
            {englishParagraphs.map((p, idx) => (
              <p key={idx} className="font-sans text-base leading-8 text-slate-900 font-medium">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {vietnameseParagraphs.map((p, idx) => (
              <p key={idx} className="font-sans text-base leading-8 text-slate-700">
                {p}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
