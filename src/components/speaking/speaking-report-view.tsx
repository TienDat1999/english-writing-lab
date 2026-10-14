"use client"

import React from "react"
import {
  Award01Icon,
  AlertCircleIcon,
  ArrowLeft01Icon,
  RepeatIcon,
  BookOpen01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { SaveToSrsButton } from "@/components/speaking/save-to-srs-button"
import { SpeakingCriteriaGrid } from "@/components/speaking/speaking-criteria-grid"
import type {
  SpeakingEvaluationReport,
  SpeakingSessionDomain,
} from "@/server/speaking/domain/speaking.types"

export interface SpeakingReportViewProps {
  session: SpeakingSessionDomain
  report: SpeakingEvaluationReport
  onBackToDashboard?: () => void
  onRetrySession?: () => void
}

export function SpeakingReportView({
  session,
  report,
  onBackToDashboard,
  onRetrySession,
}: SpeakingReportViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBackToDashboard}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          <span>Danh sách chủ đề</span>
        </Button>

        <div className="flex items-center gap-2">
          {onRetrySession && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetrySession}
              className="text-xs gap-1.5"
            >
              <HugeiconsIcon icon={RepeatIcon} size={14} />
              <span>Luyện lại chủ đề này</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hero Scorecard */}
      <div className="relative rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <HugeiconsIcon icon={Award01Icon} size={14} />
              <span>Báo Cáo Đánh Giá Buổi Nói</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{session.topicTitle}</h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">{report.summaryVi}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 pt-1">
              <span>⏱️ Thời lượng: {session.totalUserDurationSeconds}s</span>
              <span>⚡ Tốc độ: ~{report.wpm} WPM</span>
              <span>💬 Số lượt nói: {session.turns.length} turns</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/15 min-w-[150px] shrink-0 text-center">
            <span className="text-xs uppercase tracking-widest text-slate-300 font-semibold">
              Điểm Tổng Quát
            </span>
            <span className="text-5xl sm:text-6xl font-extrabold text-amber-400 my-1">
              {report.overallScore}
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              Thang điểm {report.bandScale}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Criteria Grid */}
      <SpeakingCriteriaGrid criteria={report.criteria} />

      {/* Grammar Breakdown (3-line model) */}
      {report.grammarBreakdown?.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-rose-500" />
              <span>Sửa Lỗi Ngữ Pháp Chi Tiết (Grammar Breakdown)</span>
            </h2>
            <span className="text-xs text-muted-foreground">
              {report.grammarBreakdown.length} câu cần lưu ý
            </span>
          </div>

          <div className="space-y-4">
            {report.grammarBreakdown.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-2.5 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-rose-500">🔴 Câu gốc:</span>
                  <span className="text-rose-700 dark:text-rose-300 italic font-mono">
                    "{item.originalSentence}"
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-emerald-600 dark:text-emerald-400">
                    🟢 Chuẩn ngữ pháp:
                  </span>
                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                    "{item.correctedSentence}"
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-primary">💡 Diễn đạt tự nhiên:</span>
                  <span className="text-primary font-medium">"{item.nativeUpgradeSentence}"</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <div>
                    📖 <span className="font-medium">Giải thích:</span> {item.explanationVi}
                  </div>
                  <SaveToSrsButton
                    sourceType="GRAMMAR"
                    title={`Sửa lỗi ngữ pháp: ${item.correctedSentence.slice(0, 35)}`}
                    topicText={session.topicTitle}
                    promptText={item.originalSentence}
                    answerText={item.nativeUpgradeSentence || item.correctedSentence}
                    hintVi={item.explanationVi}
                    contextText={item.originalSentence}
                    label="Lưu vào SRS"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary Highlights */}
      {report.vocabHighlights?.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={BookOpen01Icon} size={18} className="text-primary" />
            <span>Từ Vựng & Collocations Nổi Bật</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.vocabHighlights.map((vocab, i) => (
              <div
                key={i}
                className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 text-xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{vocab.wordOrPhrase}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                      {vocab.cefrLevel}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{vocab.meaningVi}</p>
                  {vocab.contextQuote && (
                    <p className="text-[11px] italic text-slate-400 dark:text-slate-500 pt-0.5">
                      "{vocab.contextQuote}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-border/30 flex justify-end">
                  <SaveToSrsButton
                    sourceType="VOCABULARY"
                    quizType="COLLOCATION"
                    title={vocab.wordOrPhrase}
                    topicText={session.topicTitle}
                    promptText={vocab.meaningVi}
                    answerText={vocab.wordOrPhrase}
                    hintVi={`Level: ${vocab.cefrLevel}`}
                    contextText={vocab.contextQuote || ""}
                    label="Lưu từ vựng"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
