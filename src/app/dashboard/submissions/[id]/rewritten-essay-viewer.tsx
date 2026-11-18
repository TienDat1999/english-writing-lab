"use client";

import { useState } from "react";
import {
  AlertCircleIcon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@/components/ui/badge";
import { CopyButton } from "./copy-button";
import { SaveLearningButton } from "./save-learning-button";

type GrammarCorrection = {
  sourceQuote: string;
  correctionText: string;
  correctionVi: string;
  explanationVi: string;
};

type VocabularyUpgrade = {
  originalExpression: string;
  upgradedExpression: string;
  meaningVi: string;
};

type IssueItem = {
  id?: string;
  scope?: string;
  category: string;
  subcategory: string;
  severity?: string;
  impactScore?: number;
  sourceQuote: string;
  explanationVi: string;
  correctionText: string;
  upgradeText?: string | null;
  confidence?: number;
};

type RewrittenEssayViewerProps = {
  submissionId: string;
  rewrittenEssay: string;
  rewrittenEssayVi: string;
  originalText?: string;
  structuralWeaknesses?: string[];
  grammarCorrections?: GrammarCorrection[];
  vocabularyUpgrades?: VocabularyUpgrade[];
  issues?: IssueItem[];
  isLetter?: boolean;
};

export function RewrittenEssayViewer({
  submissionId,
  rewrittenEssay,
  rewrittenEssayVi,
  originalText = "",
  structuralWeaknesses = [],
  grammarCorrections = [],
  vocabularyUpgrades = [],
  issues = [],
  isLetter = false,
}: RewrittenEssayViewerProps) {
  const [viewMode, setViewMode] = useState<
    "bilingual" | "english" | "vietnamese" | "detailed"
  >("bilingual");

  const englishParagraphs = rewrittenEssay
    .split(/\n+/u)
    .map((p) => p.trim())
    .filter(Boolean);

  const vietnameseParagraphs = rewrittenEssayVi
    .split(/\n+/u)
    .map((p) => p.trim())
    .filter(Boolean);

  const originalParagraphs = originalText
    .split(/\n+/u)
    .map((p) => p.trim())
    .filter(Boolean);

  const englishWordCount = rewrittenEssay
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;

  const paragraphLabels = isLetter
    ? [
        "Lời chào & Mục đích viết thư",
        "Nội dung trọng tâm 1 (Bullet 1 & 2)",
        "Nội dung trọng tâm 2 (Bullet 3 & Giải pháp)",
        "Lời kết & Ký tên chuẩn văn phong",
      ]
    : [
        "Mở bài (Introduction)",
        "Thân bài 1 (Body Paragraph 1)",
        "Thân bài 2 (Body Paragraph 2)",
        "Kết bài (Conclusion)",
      ];

  // Tổng hợp đối chiếu Before & After cho các điểm yếu
  const remediations = structuralWeaknesses.map((weakness, idx) => {
    const lowerW = weakness.toLowerCase();
    const matchedIssue = issues.find(
      (iss) =>
        (lowerW.includes("liên kết") && iss.category === "COHERENCE") ||
        (lowerW.includes("phát triển") && iss.category === "TASK_RESPONSE") ||
        (lowerW.includes("ngữ pháp") && iss.category === "GRAMMAR") ||
        iss.explanationVi?.toLowerCase().includes(lowerW.slice(0, 15)),
    );

    if (matchedIssue) {
      return {
        title: weakness,
        location:
          matchedIssue.scope === "PARAGRAPH" ? "Toàn đoạn" : "Câu trọng tâm",
        originalQuote: matchedIssue.sourceQuote,
        revisedQuote:
          matchedIssue.correctionText ||
          matchedIssue.upgradeText ||
          englishParagraphs[1] ||
          "",
        explanation: matchedIssue.explanationVi,
      };
    }

    if (lowerW.includes("liên kết") || lowerW.includes("kết nối")) {
      const origP = originalParagraphs[1] || originalParagraphs[0] || "";
      const revP = englishParagraphs[1] || englishParagraphs[0] || "";
      const revSentences = revP.split(/(?<=[.?!])\s+/);
      const linkingSentence =
        revSentences.find((s) =>
          /\b(Furthermore|Moreover|In addition|Consequently|As a result|However|On the other hand|Specifically|Not only)\b/i.test(
            s,
          ),
        ) ||
        revSentences[1] ||
        revP;

      const origSentences = origP.split(/(?<=[.?!])\s+/);
      const origSentence = origSentences[1] || origSentences[0] || origP;

      return {
        title: weakness,
        location: "Thân bài 1 & liên kết giữa các câu",
        originalQuote:
          origSentence ||
          "Các câu đơn lẻ được viết tách rời nhau mà thiếu từ nối học thuật.",
        revisedQuote: linkingSentence,
        explanation:
          "Bản sửa đã bổ sung các liên từ học thuật (cohesive devices) và mệnh đề quan hệ để kết nối các ý liền mạch, tăng điểm Coherence & Cohesion.",
      };
    }

    if (
      lowerW.includes("liệt kê") ||
      lowerW.includes("phát triển") ||
      lowerW.includes("lặp lại")
    ) {
      const origP = originalParagraphs[1] || originalParagraphs[0] || "";
      const revP = englishParagraphs[1] || englishParagraphs[0] || "";
      const revSentences = revP.split(/(?<=[.?!])\s+/);
      const developedSentence = revSentences.slice(0, 2).join(" ") || revP;
      const origSentences = origP.split(/(?<=[.?!])\s+/);
      const origSentence = origSentences.slice(0, 2).join(" ") || origP;

      return {
        title: weakness,
        location: "Thân bài (Phát triển luận điểm)",
        originalQuote:
          origSentence ||
          "Các ý tưởng chỉ mới dừng lại ở việc nêu tên/liệt kê ngắn.",
        revisedQuote: developedSentence,
        explanation:
          "Bản sửa đã áp dụng mô hình P.E.E.R (Point → Explanation → Example): Nêu rõ luận điểm chính, giải thích cơ chế 'tại sao', và đưa dẫn chứng thực tế thay vì chỉ liệt kê.",
      };
    }

    const targetIdx = idx < englishParagraphs.length ? idx : 1;
    const origP = originalParagraphs[targetIdx] || originalParagraphs[0] || "";
    const revP = englishParagraphs[targetIdx] || englishParagraphs[0] || "";
    const revFirstSentence = revP.split(/(?<=[.?!])\s+/)[0] || revP;
    const origFirstSentence = origP.split(/(?<=[.?!])\s+/)[0] || origP;

    return {
      title: weakness,
      location: targetIdx === 0 ? "Mở bài" : `Thân bài ${targetIdx}`,
      originalQuote:
        origFirstSentence ||
        "Ý tưởng diễn đạt chưa có trật tự logic rõ ràng.",
      revisedQuote: revFirstSentence,
      explanation:
        "Tái cấu trúc lại đoạn văn với câu chủ đề (Topic Sentence) chuẩn mực, định hướng rõ nội dung người đọc sẽ tiếp nhận.",
    };
  });

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-sky-300 bg-sky-50 text-sky-800 font-semibold text-xs"
          >
            {isLetter ? "Chuẩn B2 / C1 · Văn phong Thư" : "Chuẩn B2 / C1 · P.E.E.R"}
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">
            {englishWordCount} từ {isLetter ? "(Mục tiêu 130–160 từ)" : "(Mục tiêu 250–280 từ)"}
          </span>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs bao gồm tab mới: Bản sửa chi tiết */}
          <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("bilingual")}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                viewMode === "bilingual"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Song ngữ song song
            </button>
            <button
              type="button"
              onClick={() => setViewMode("english")}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                viewMode === "english"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tiếng Anh
            </button>
            <button
              type="button"
              onClick={() => setViewMode("vietnamese")}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                viewMode === "vietnamese"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bản dịch tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => setViewMode("detailed")}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "detailed"
                  ? "bg-white text-primary shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HugeiconsIcon
                icon={SparklesIcon}
                size={14}
                className={
                  viewMode === "detailed" ? "text-primary" : "text-slate-400"
                }
              />
              <span>Bản sửa chi tiết</span>
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
      <div className="p-5 sm:p-7">
        {/* TAB 1: SONG NGỮ SONG SONG */}
        {viewMode === "bilingual" ? (
          <div className="space-y-6">
            {englishParagraphs.map((enP, idx) => {
              const viP = vietnameseParagraphs[idx] || "";
              const label = paragraphLabels[idx] || `Đoạn ${idx + 1}`;

              return (
                <div
                  key={idx}
                  className="group rounded-xl border border-slate-100 bg-slate-50/40 p-4 transition-all hover:border-slate-200 hover:bg-slate-50/80"
                >
                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>{label}</span>
                    <CopyButton
                      textToCopy={enP}
                      label=""
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    />
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
          /* TAB 2: TIẾNG ANH THUẦN */
          <div className="mx-auto max-w-3xl space-y-4">
            {englishParagraphs.map((p, idx) => (
              <p
                key={idx}
                className="font-sans text-base leading-8 text-slate-900 font-medium"
              >
                {p}
              </p>
            ))}
          </div>
        ) : viewMode === "vietnamese" ? (
          /* TAB 3: BẢN DỊCH TIẾNG VIỆT */
          <div className="mx-auto max-w-3xl space-y-4">
            {vietnameseParagraphs.map((p, idx) => (
              <p
                key={idx}
                className="font-sans text-base leading-8 text-slate-700"
              >
                {p}
              </p>
            ))}
          </div>
        ) : (
          /* TAB 4: BẢN SỬA CHI TIẾT (BEFORE & AFTER / REMEDIATION BREAKDOWN) */
          <div className="space-y-8">
            {/* 1. Header Banner của Bản sửa chi tiết */}
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/50 p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700 font-bold text-xs">
                      ✦
                    </span>
                    <h3 className="font-heading text-base font-bold text-slate-900">
                      Đối chiếu trực diện: Bài gốc của Bạn vs Bản sửa tối ưu
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Chỉ rõ từng điểm cần khắc phục, trích dẫn câu gốc và đối chiếu với câu tương ứng trong Bản sửa đã khắc phục như thế nào.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-sky-300 bg-sky-50 text-sky-800 font-semibold text-xs shrink-0 self-start sm:self-center"
                >
                  Đối chiếu Before & After
                </Badge>
              </div>
            </div>

            {/* 2. KHỐI CÁC TRỌNG TÂM CẦN KHẮC PHỤC (BEFORE & AFTER REMEDIATION CARDS) */}
            {remediations.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                      <HugeiconsIcon icon={AlertCircleIcon} size={14} />
                    </div>
                    <h4 className="font-heading text-sm font-bold text-slate-900">
                      Các trọng tâm bài sửa đã khắc phục
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
                    {remediations.length} điểm cần sửa
                  </span>
                </div>

                <div className="grid gap-4">
                  {remediations.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 transition-all hover:border-slate-300 hover:shadow-xs"
                    >
                      {/* Tiêu đề điểm yếu */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-heading text-sm font-bold text-slate-900">
                            {item.title}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold border-slate-200 bg-slate-50 text-slate-600"
                        >
                          {item.location}
                        </Badge>
                      </div>

                      {/* Hộp đối chiếu Before & After */}
                      <div className="grid gap-3.5 lg:grid-cols-2">
                        {/* Before: Bài gốc của bạn */}
                        <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-rose-500" />
                              Trong bài của Bạn (Before):
                            </span>
                          </div>
                          <p className="font-sans text-sm leading-relaxed text-slate-800 italic">
                            &ldquo;{item.originalQuote}&rdquo;
                          </p>
                        </div>

                        {/* After: Trong bài sửa */}
                        <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-emerald-500" />
                              Đã sửa lại trong bài mẫu (After):
                            </span>
                          </div>
                          <p className="font-sans text-sm leading-relaxed text-slate-900 font-medium">
                            &ldquo;{item.revisedQuote}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Box giải thích cách sửa */}
                      <div className="flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 text-xs text-sky-950 leading-relaxed">
                        <span className="text-sm font-bold shrink-0">
                          💡 Cách khắc phục:
                        </span>
                        <span className="font-medium text-slate-700">
                          {item.explanation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 3. ĐỐI CHIẾU CHI TIẾT THEO TỪNG ĐOẠN VĂN (PARAGRAPH-BY-PARAGRAPH BREAKDOWN) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
                    <HugeiconsIcon icon={BookOpen01Icon} size={14} />
                  </div>
                  <h4 className="font-heading text-sm font-bold text-slate-900">
                    Đối chiếu chi tiết theo từng đoạn bài viết
                  </h4>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {englishParagraphs.length} đoạn văn
                </span>
              </div>

              <div className="space-y-6">
                {englishParagraphs.map((enP, idx) => {
                  const viP = vietnameseParagraphs[idx] || "";
                  const origP = originalParagraphs[idx] || "";
                  const label = paragraphLabels[idx] || `Đoạn ${idx + 1}`;

                  // Lọc lỗi ngữ pháp & từ vựng thuộc đoạn này
                  const paraGrammar = grammarCorrections.filter((c) =>
                    origP
                      ? origP.toLowerCase().includes(c.sourceQuote.toLowerCase())
                      : false,
                  );
                  const paraVocab = vocabularyUpgrades.filter((v) =>
                    origP
                      ? origP
                          .toLowerCase()
                          .includes(v.originalExpression.toLowerCase())
                      : false,
                  );

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4"
                    >
                      {/* Header đoạn */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-slate-300 bg-slate-50 text-slate-800 font-bold text-xs"
                          >
                            {label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {enP.split(/\s+/).filter(Boolean).length} từ
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {paraGrammar.length > 0 ? (
                            <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                              {paraGrammar.length} lỗi ngữ pháp
                            </span>
                          ) : null}
                          {paraVocab.length > 0 ? (
                            <span className="rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                              {paraVocab.length} từ nâng cấp
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* 2 Cột so sánh văn bản */}
                      <div className="grid gap-4 lg:grid-cols-2">
                        {/* Đoạn gốc */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span>Bài viết gốc của Bạn</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {origP
                                ? `${origP.split(/\s+/).filter(Boolean).length} từ`
                                : "—"}
                            </span>
                          </div>
                          <p className="font-sans text-sm leading-relaxed text-slate-700">
                            {origP || (
                              <span className="italic text-slate-400">
                                (Đoạn văn này được bài sửa bổ sung hoàn chỉnh)
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Đoạn sửa */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                              <span>✓</span>
                              <span>Bản sửa tối ưu (B2 / C1)</span>
                            </span>
                            <CopyButton
                              textToCopy={enP}
                              label=""
                              size="icon"
                              className="h-6 w-6"
                            />
                          </div>
                          <p className="font-sans text-sm sm:text-base leading-relaxed text-slate-900 font-medium">
                            {enP}
                          </p>
                          {viP ? (
                            <p className="font-sans text-xs leading-relaxed text-slate-600 italic border-t border-emerald-100/80 pt-2">
                              {viP}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Chi tiết lỗi ngữ pháp & từ vựng trong đoạn này */}
                      {(paraGrammar.length > 0 || paraVocab.length > 0) && (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2 text-xs">
                          <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                            Chi tiết các điểm đã sửa trong {label}:
                          </div>
                          <div className="space-y-1.5">
                            {paraGrammar.map((g, gIdx) => (
                              <div
                                key={gIdx}
                                className="flex flex-wrap items-center gap-1.5 text-slate-700"
                              >
                                <span className="font-semibold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded text-[11px]">
                                  Ngữ pháp
                                </span>
                                <span className="line-through text-rose-600 font-mono text-[11px]">
                                  {g.sourceQuote}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="font-bold text-emerald-700 font-mono text-[11px]">
                                  {g.correctionText}
                                </span>
                                <span className="text-slate-500 italic">
                                  ({g.explanationVi})
                                </span>
                              </div>
                            ))}
                            {paraVocab.map((v, vIdx) => (
                              <div
                                key={vIdx}
                                className="flex flex-wrap items-center gap-1.5 text-slate-700"
                              >
                                <span className="font-semibold text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded text-[11px]">
                                  Từ vựng
                                </span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                  {v.originalExpression}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="font-bold text-sky-800 font-mono text-[11px]">
                                  {v.upgradedExpression}
                                </span>
                                <span className="text-slate-500">
                                  ({v.meaningVi})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
