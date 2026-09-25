"use client";

import { useState } from "react";
import {
  Activity01Icon,
  AlertCircleIcon,
  BookOpen01Icon,
  CpuIcon,
  FireIcon,
  Task01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { AdminAnalyticsData } from "@/server/analytics";

type TabKey = "overview" | "scores" | "issues" | "ai_srs";

interface AnalyticsClientProps {
  data: AdminAnalyticsData;
}

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const {
    overview,
    writingAndScore,
    commonIssues,
    aiPerformance,
    spacedRepetition,
    dailyTrends,
  } = data;

  const maxTrendVal = Math.max(
    ...dailyTrends.map((d) => Math.max(d.submissionCount, d.reviewCount)),
    5
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-[var(--navy)] text-white shadow-xs"
              : "bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--navy-bright)] hover:text-[var(--ink)]"
          }`}
        >
          <HugeiconsIcon icon={Activity01Icon} size={16} />
          <span>Tổng quan & Tăng trưởng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scores")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "scores"
              ? "bg-[var(--navy)] text-white shadow-xs"
              : "bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--navy-bright)] hover:text-[var(--ink)]"
          }`}
        >
          <HugeiconsIcon icon={Task01Icon} size={16} />
          <span>Bài viết & Phổ điểm IELTS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("issues")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "issues"
              ? "bg-[var(--navy)] text-white shadow-xs"
              : "bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--navy-bright)] hover:text-[var(--ink)]"
          }`}
        >
          <HugeiconsIcon icon={AlertCircleIcon} size={16} />
          <span>Top Lỗi sai Học viên</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai_srs")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "ai_srs"
              ? "bg-[var(--navy)] text-white shadow-xs"
              : "bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--navy-bright)] hover:text-[var(--ink)]"
          }`}
        >
          <HugeiconsIcon icon={CpuIcon} size={16} />
          <span>Hiệu năng AI & Ôn tập Spaced Repetition</span>
        </button>
      </div>

      {/* TAB 1: TỔNG QUAN & TĂNG TRƯỞNG */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4 Thẻ KPI Tổng quan */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
            <div className="admin-panel bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Tổng Học viên</span>
                <div className="grid size-8 place-items-center rounded-xl bg-sky-100 text-sky-700">
                  <HugeiconsIcon icon={UserIcon} size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-heading font-mono text-2xl font-extrabold text-[var(--navy)]">
                  {overview.totalUsers.toLocaleString()}
                </span>
                <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800 border border-sky-100">
                  +{overview.newUsers7d} / 7 ngày
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--ink-soft)]">
                +{overview.newUsers30d} học viên trong 30 ngày qua
              </p>
            </div>

            <div className="admin-panel bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Bài viết đã nộp</span>
                <div className="grid size-8 place-items-center rounded-xl bg-purple-100 text-purple-700">
                  <HugeiconsIcon icon={Task01Icon} size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-heading font-mono text-2xl font-extrabold text-purple-900">
                  {overview.totalSubmissions.toLocaleString()}
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-100">
                  {overview.completedSubmissions} đã chấm
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--ink-soft)]">
                {overview.failedSubmissions > 0
                  ? `${overview.failedSubmissions} bài lỗi phân tích`
                  : "Toàn bộ bài chấm thành công"}
              </p>
            </div>

            <div className="admin-panel bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Lượt ôn Spaced Repetition</span>
                <div className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <HugeiconsIcon icon={FireIcon} size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-heading font-mono text-2xl font-extrabold text-amber-800">
                  {overview.totalReviewAttempts.toLocaleString()}
                </span>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-100">
                  {overview.totalLearningItems} thẻ từ
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--ink-soft)]">
                Ôn ngắt quãng theo thuật toán SM-2
              </p>
            </div>

            <div className="admin-panel bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Kho bài giảng Public</span>
                <div className="grid size-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <HugeiconsIcon icon={BookOpen01Icon} size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-heading font-mono text-2xl font-extrabold text-emerald-800">
                  {overview.publishedLessons}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  / {overview.totalLessons} bài học
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--ink-soft)]">
                Tỷ lệ xuất bản: {overview.totalLessons > 0 ? Math.round((overview.publishedLessons / overview.totalLessons) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Biểu đồ xu hướng hoạt động 14 ngày */}
          <div className="admin-panel bg-white p-6 shadow-2xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="font-heading text-sm font-bold text-[var(--ink)]">
                  Lưu lượng Học tập & Luyện viết 14 Ngày qua
                </h3>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  So sánh số lượng bài luận nộp vào (Submissions) và số lượt làm bài ôn tập (Reviews)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[var(--navy-bright)]">
                  <span className="size-3 rounded-sm bg-[var(--navy-bright)]" />
                  <span>Bài viết (Submissions)</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-amber-600">
                  <span className="size-3 rounded-sm bg-amber-500" />
                  <span>Lượt ôn (Reviews)</span>
                </div>
              </div>
            </div>

            {/* SVG Visualizer Chart */}
            <div className="mt-6 pt-4">
              <div className="h-56 w-full flex items-end justify-between gap-1 sm:gap-2 px-1">
                {dailyTrends.map((day) => {
                  const subHeightPercent = Math.min(
                    100,
                    Math.round((day.submissionCount / maxTrendVal) * 100)
                  );
                  const revHeightPercent = Math.min(
                    100,
                    Math.round((day.reviewCount / maxTrendVal) * 100)
                  );

                  return (
                    <div
                      key={day.date}
                      className="group relative flex-1 flex flex-col items-center h-full justify-end"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg whitespace-nowrap pointer-events-none">
                        <span className="font-bold">{day.date}</span>
                        <span>Bài viết: {day.submissionCount} · Lượt ôn: {day.reviewCount}</span>
                      </div>

                      {/* Dual Bars */}
                      <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 max-w-[28px]">
                        <div
                          style={{ height: `${Math.max(subHeightPercent, 4)}%` }}
                          className="w-1/2 rounded-t bg-[var(--navy-bright)] transition-all group-hover:brightness-110"
                        />
                        <div
                          style={{ height: `${Math.max(revHeightPercent, 4)}%` }}
                          className="w-1/2 rounded-t bg-amber-400 transition-all group-hover:brightness-110"
                        />
                      </div>

                      <span className="mt-2 text-[10px] font-mono text-[var(--ink-soft)] truncate">
                        {day.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BÀI VIẾT & PHỔ ĐIỂM IELTS */}
      {activeTab === "scores" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Cột trái: Phân bố Band điểm (7 cols) */}
            <div className="lg:col-span-7 admin-panel bg-white p-6 shadow-2xs">
              <div className="border-b border-[var(--line)] pb-4">
                <h3 className="font-heading text-sm font-bold text-[var(--ink)]">
                  Phân bố Band điểm IELTS Writing của Học viên
                </h3>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Tổng hợp từ {overview.completedSubmissions} bài viết đã được chấm điểm tổng thể
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {writingAndScore.bandDistribution.map((band) => (
                  <div key={band.range} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--ink)]">
                        Band {band.range}{" "}
                        <span className="font-normal text-[var(--ink-soft)]">
                          ({band.label})
                        </span>
                      </span>
                      <span className="font-mono font-bold text-[var(--navy)]">
                        {band.count} bài ({band.percentage}%)
                      </span>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{ width: `${band.percentage}%` }}
                        className={`h-full rounded-full transition-all ${
                          band.range.includes("8")
                            ? "bg-purple-600"
                            : band.range.includes("7")
                            ? "bg-emerald-500"
                            : band.range.includes("6")
                            ? "bg-sky-500"
                            : band.range.includes("5")
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải: Chỉ số Viết luận & Tỷ trọng Task (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="admin-panel bg-white p-6 shadow-2xs">
                <h4 className="font-heading text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                  Band điểm Trung bình Toàn hệ thống
                </h4>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-heading font-mono text-4xl font-extrabold text-[var(--navy)]">
                    {writingAndScore.avgOverallBand > 0 ? writingAndScore.avgOverallBand.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    / 9.0 IELTS Overall
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--ink-soft)] leading-relaxed">
                  Đánh giá dựa trên 4 tiêu chí chuẩn: Task Response, Coherence & Cohesion, Lexical Resource, và Grammatical Accuracy.
                </p>
              </div>

              <div className="admin-panel bg-white p-6 shadow-2xs">
                <h4 className="font-heading text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                  Cơ cấu Dạng bài & Độ dài
                </h4>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--ink-soft)]">Độ dài bài viết trung bình:</span>
                    <span className="font-mono font-bold text-[var(--ink)]">
                      {writingAndScore.avgWordCount} từ
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[var(--line)]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-sky-800">Task 1 (Report/Chart): {writingAndScore.task1Count}</span>
                      <span className="font-bold text-purple-800">Task 2 (Essay): {writingAndScore.task2Count}</span>
                    </div>

                    <div className="h-2.5 w-full flex overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{
                          width: `${
                            writingAndScore.task1Count + writingAndScore.task2Count > 0
                              ? Math.round(
                                  (writingAndScore.task1Count /
                                    (writingAndScore.task1Count + writingAndScore.task2Count)) *
                                    100
                                )
                              : 50
                          }%`,
                        }}
                        className="bg-sky-500 h-full"
                      />
                      <div
                        style={{
                          width: `${
                            writingAndScore.task1Count + writingAndScore.task2Count > 0
                              ? Math.round(
                                  (writingAndScore.task2Count /
                                    (writingAndScore.task1Count + writingAndScore.task2Count)) *
                                    100
                                )
                              : 50
                          }%`,
                        }}
                        className="bg-purple-600 h-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOP LỖI SAI HỌC VIÊN */}
      {activeTab === "issues" && (
        <div className="space-y-6">
          {/* Nhóm lỗi sai theo Category */}
          <div className="admin-panel bg-white p-6 shadow-2xs">
            <div className="border-b border-[var(--line)] pb-4">
              <h3 className="font-heading text-sm font-bold text-[var(--ink)]">
                Tỷ trọng Các nhóm Lỗi sai Chính trong Bài viết
              </h3>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                Giúp đội ngũ học thuật xác định kỹ năng học viên đang yếu nhất để ưu tiên xuất bản bài giảng phù hợp.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {commonIssues.categoryBreakdown.map((item) => (
                <div
                  key={item.category}
                  className="rounded-xl border border-[var(--line)] bg-[#faf8f2] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[var(--ink)]">{item.label}</span>
                    <span className="font-mono text-[var(--navy)]">{item.percentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full rounded-full bg-[var(--navy-bright)]"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {item.count.toLocaleString()} lượt phát hiện
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bảng Top 10 Lỗi Cụ Thể (Subcategory) */}
          <div className="admin-panel bg-white p-6 shadow-2xs">
            <h3 className="font-heading text-sm font-bold text-[var(--ink)] border-b border-[var(--line)] pb-3">
              Top 10 Vấn đề / Lỗi sai Cụ thể Phổ biến Nhất
            </h3>

            {commonIssues.topSubcategories.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Chưa có dữ liệu phân tích lỗi bài viết.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-[var(--line)]">
                {commonIssues.topSubcategories.map((sub, idx) => (
                  <div
                    key={`${sub.category}-${sub.subcategory}`}
                    className="flex items-center justify-between py-3 hover:bg-[#faf8f2] px-2 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-6 place-items-center rounded-md bg-slate-100 font-mono text-xs font-extrabold text-slate-700">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[var(--ink)]">
                          {sub.subcategory}
                        </p>
                        <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 border border-sky-100">
                          {sub.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-extrabold text-[var(--navy)]">
                        {sub.count} lượt
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {sub.percentage}% tổng lỗi
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: HIỆU NĂNG AI & SPACED REPETITION */}
      {activeTab === "ai_srs" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Phân hệ 1: AI Worker Engine (6 cols) */}
            <div className="lg:col-span-6 admin-panel bg-white p-6 shadow-2xs space-y-4">
              <div className="border-b border-[var(--line)] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-sm font-bold text-[var(--ink)]">
                    Hiệu năng AI Grading Worker
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                    Thời gian phân tích, tỷ lệ thành công và độ tin cậy
                  </p>
                </div>
                <div className="grid size-8 place-items-center rounded-xl bg-purple-100 text-purple-700">
                  <HugeiconsIcon icon={CpuIcon} size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-[var(--line)] p-4 bg-[#faf8f2]">
                  <span className="text-[11px] font-bold text-[var(--ink-soft)] uppercase">
                    Tốc độ Phân tích Trung bình
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-heading font-mono text-2xl font-extrabold text-purple-900">
                      {aiPerformance.avgLatencySeconds}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">giây / bài</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--ink-soft)]">
                    Từ khi học viên bấm nộp đến khi hoàn tất
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--line)] p-4 bg-[#faf8f2]">
                  <span className="text-[11px] font-bold text-[var(--ink-soft)] uppercase">
                    Tỷ lệ Phân tích Thành công
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-heading font-mono text-2xl font-extrabold text-emerald-700">
                      {aiPerformance.successRate}%
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--ink-soft)]">
                    {aiPerformance.completedCount} thành công · {aiPerformance.failedCount} lỗi
                  </p>
                </div>
              </div>

              {/* Models Breakdown */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-[var(--ink)] mb-2">Mô hình AI Đã sử dụng:</h4>
                {aiPerformance.modelsUsed.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Mặc định OpenAI GPT-4o / Claude 3.5 Sonnet</p>
                ) : (
                  <div className="space-y-1.5">
                    {aiPerformance.modelsUsed.map((m) => (
                      <div
                        key={m.modelName}
                        className="flex items-center justify-between text-xs rounded-lg bg-slate-50 px-3 py-2 border border-slate-100"
                      >
                        <span className="font-mono font-bold text-[var(--ink)]">{m.modelName}</span>
                        <span className="font-mono text-muted-foreground">{m.count} bài</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Phân hệ 2: Spaced Repetition Mastery & Ratings (6 cols) */}
            <div className="lg:col-span-6 admin-panel bg-white p-6 shadow-2xs space-y-4">
              <div className="border-b border-[var(--line)] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-sm font-bold text-[var(--ink)]">
                    Chỉ số Spaced Repetition (SM-2)
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                    Mức độ thành thạo và phản hồi ghi nhớ từ vựng/câu
                  </p>
                </div>
                <div className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <HugeiconsIcon icon={FireIcon} size={18} />
                </div>
              </div>

              {/* Mastery Distribution */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[var(--ink)]">
                  Phân bố Trạng thái Thành thạo ({overview.totalLearningItems} thẻ):
                </span>
                <div className="space-y-1.5">
                  {spacedRepetition.masteryDistribution.map((st) => (
                    <div key={st.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--ink-soft)]">{st.label}</span>
                        <span className="font-mono font-bold text-[var(--ink)]">
                          {st.count} ({st.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          style={{ width: `${st.percentage}%` }}
                          className={`h-full rounded-full ${
                            st.status === "MASTERED"
                              ? "bg-emerald-500"
                              : st.status === "FAMILIAR"
                              ? "bg-sky-500"
                              : st.status === "PRACTICING"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Feedback */}
              <div className="pt-3 border-t border-[var(--line)]">
                <span className="text-xs font-bold text-[var(--ink)]">
                  Phản hồi Tự đánh giá khi Ôn tập:
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {spacedRepetition.ratingDistribution.map((r) => (
                    <div
                      key={r.rating}
                      className="rounded-lg border border-[var(--line)] bg-[#faf8f2] p-2.5 text-xs"
                    >
                      <span className="font-semibold text-[var(--ink)]">{r.label}</span>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="font-mono font-extrabold text-[var(--navy)]">
                          {r.count}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {r.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
