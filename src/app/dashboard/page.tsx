import {
  AlertCircleIcon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  Edit02Icon,
  RepeatIcon,
  SparklesIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/server/auth/session";
import { getDashboardOverview } from "@/server/dashboard/dashboard.service";

import { DeleteSubmissionButton } from "./delete-submission-button";

const statusStyles = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  QUEUED: "border-amber-200 bg-amber-50 text-amber-800",
  ANALYZING: "border-sky-200 bg-sky-50 text-sky-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  FAILED: "border-rose-200 bg-rose-50 text-rose-800",
} as const;

const statusLabels = {
  DRAFT: "Bản nháp",
  QUEUED: "Đang chờ",
  ANALYZING: "Đang chấm",
  COMPLETED: "Đã phân tích",
  FAILED: "Lỗi",
} as const;

type DashboardPageProps = {
  searchParams: Promise<{ submitted?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const [overview, query] = await Promise.all([
    getDashboardOverview(session.user.id),
    searchParams,
  ]);

  const justSubmitted = typeof query.submitted === "string";
  const { primaryAction, submissions } = overview;
  const completedSubmissions = submissions.filter((s) => s.status === "COMPLETED");

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-4">
      {/* Thông báo nộp bài thành công */}
      {justSubmitted ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-2.5 text-emerald-950 text-xs sm:text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="text-emerald-600 shrink-0" />
            <span className="font-semibold text-emerald-900">
              Bài viết đã nộp thành công! AI đang tiến hành phân tích toàn diện.
            </span>
          </div>
          <Badge className="border-emerald-300 bg-white text-emerald-800 shrink-0 text-[10px]" variant="outline">
            Đang xử lý
          </Badge>
        </div>
      ) : null}

      {/* 1. Top Action Hero Banner (Sapphire Navy Theme - Điểm nhấn màu sắc sang trọng) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-4 sm:p-5 text-white shadow-md border border-slate-800/80">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-sky-400/20 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-200 border border-sky-400/30">
                {primaryAction.badge}
              </span>
              <span className="text-[11px] font-medium text-sky-200/80">Hôm nay nên làm gì?</span>
            </div>
            <h1 className="font-heading text-lg font-bold tracking-tight text-white sm:text-xl">
              {primaryAction.title}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
              {primaryAction.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-0.5 lg:pt-0">
            <Button asChild size="sm" className="h-9 bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-md shadow-sky-500/20 text-xs px-4">
              <Link href={primaryAction.ctaHref} className="inline-flex items-center gap-1.5">
                <span>{primaryAction.ctaLabel}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9 bg-white/10 hover:bg-white/15 text-white border-white/20 font-semibold text-xs px-3 backdrop-blur-xs">
              <Link href="/dashboard/new" className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={Edit02Icon} size={14} />
                <span>Viết bài mới</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-9 text-sky-200 hover:text-white hover:bg-white/10 text-xs px-2.5">
              <Link href="/dashboard/learning" className="inline-flex items-center gap-1">
                <HugeiconsIcon icon={BookOpen01Icon} size={14} />
                <span>Thư viện</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Dãy 4 Chỉ số KPI Tinh gọn (Tinted Color Accent Cards - Chấm dứt màu trắng đơn điệu) */}
      <div id="progress" className="scroll-mt-16 grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
        {/* KPI 1: Band điểm (Sky Palette) */}
        <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-sky-50/30 p-3 sm:p-3.5 shadow-2xs hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between text-sky-800">
            <span className="text-[11px] font-semibold">Band gần nhất</span>
            <div className="grid size-6 place-items-center rounded-md bg-sky-100 text-sky-600">
              <HugeiconsIcon icon={Target01Icon} size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-heading font-mono text-2xl font-bold text-sky-700">
              {overview.latestBand !== null ? overview.latestBand.toFixed(1) : "—"}
            </span>
            <span className="rounded-md bg-sky-100/90 px-1.5 py-0.5 text-[10px] font-medium text-sky-800">
              {overview.latestBand !== null ? "Bài mới nhất" : "Chưa có"}
            </span>
          </div>
        </div>

        {/* KPI 2: Cần ôn hôm nay (Warm Amber Palette) */}
        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 p-3 sm:p-3.5 shadow-2xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-semibold">Cần ôn hôm nay</span>
            <div className="grid size-6 place-items-center rounded-md bg-amber-100 text-amber-600">
              <HugeiconsIcon icon={Clock01Icon} size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-heading font-mono text-2xl font-bold text-amber-700">
              {overview.learningStats.due}
            </span>
            {overview.learningStats.due > 0 ? (
              <Link
                href="/dashboard/review"
                className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 hover:bg-amber-300/80 transition-colors"
              >
                Ôn ngay →
              </Link>
            ) : (
              <span className="rounded-md bg-amber-100/90 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                Đã xong
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Thành thạo (Emerald Palette) */}
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-3 sm:p-3.5 shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-semibold">Đã thành thạo</span>
            <div className="grid size-6 place-items-center rounded-md bg-emerald-100 text-emerald-600">
              <HugeiconsIcon icon={SparklesIcon} size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="font-heading font-mono text-2xl font-bold text-emerald-700">
                {overview.learningStats.mastered}
              </span>
              <span className="text-[11px] text-emerald-600/80 font-mono">
                /{overview.learningStats.total}
              </span>
            </div>
            <span className="rounded-md bg-emerald-100/90 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
              {overview.masteryRate}%
            </span>
          </div>
        </div>

        {/* KPI 4: Bài đã nộp (Indigo Palette) */}
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 p-3 sm:p-3.5 shadow-2xs hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-[11px] font-semibold">Bài viết đã nộp</span>
            <div className="grid size-6 place-items-center rounded-md bg-indigo-100 text-indigo-600">
              <HugeiconsIcon icon={Edit02Icon} size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-heading font-mono text-2xl font-bold text-indigo-800">
              {submissions.length}
            </span>
            <span className="rounded-md bg-indigo-100/90 px-1.5 py-0.5 text-[10px] font-medium text-indigo-800">
              {completedSubmissions.length} đã chấm
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bố cục 2 Cột Cân bằng (Layout 7:5 với Tight Padding chuẩn mực) */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        {/* CỘT TRÁI (7 cols): Điểm cần cải thiện + Tiến độ ghi nhớ */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card: Điểm cần chú ý & cải thiện */}
          <Card className="p-0 gap-0 border border-slate-200/90 bg-white shadow-2xs">
            <CardHeader className="p-0 px-4 pt-3.5 pb-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600">
                  <HugeiconsIcon icon={AlertCircleIcon} size={15} />
                </div>
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground truncate">
                  Điểm cần cải thiện
                </CardTitle>
                {overview.lastAnalyzedSubmission && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-700">
                    <span>{overview.lastAnalyzedSubmission.taskType === "TASK_1" ? "Task 1" : "Task 2"}</span>
                    {overview.lastAnalyzedSubmission.band !== null && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-emerald-700 font-bold">Band {overview.lastAnalyzedSubmission.band.toFixed(1)}</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              {overview.lastAnalyzedSubmission ? (
                <Link
                  href={`/dashboard/submissions/${overview.lastAnalyzedSubmission.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/90 px-3.5 text-xs font-semibold text-slate-700 hover:bg-white hover:border-slate-300 hover:text-primary transition-all shrink-0 shadow-2xs"
                >
                  <span>Mở bài chấm chi tiết</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={13} strokeWidth={2.2} />
                </Link>
              ) : null}
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4">
              {overview.focusWeaknesses.length > 0 ? (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-muted-foreground">
                    Trích xuất từ bài chấm gần nhất — Khắc phục các điểm này trong bài viết tới để cải thiện điểm số:
                  </p>
                  <div className="space-y-1.5">
                    {overview.focusWeaknesses.map((weakness, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-lg border border-rose-100 bg-rose-50/40 px-3 py-2 text-xs transition-colors hover:bg-rose-50/70"
                      >
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-rose-200/90 font-mono text-[10px] font-bold text-rose-800">
                          {idx + 1}
                        </span>
                        <p className="font-medium text-slate-800 leading-snug">
                          {weakness}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  <p>Sau khi nộp bài viết đầu tiên, AI sẽ ghi chú các lỗi cấu trúc & ngữ pháp cần khắc phục tại đây.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Chu kỳ ghi nhớ (Spaced Repetition) */}
          <Card className="p-0 gap-0 border border-slate-200/90 bg-white shadow-2xs">
            <CardHeader className="p-0 px-4 pt-3.5 pb-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 gap-3">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-lg bg-sky-50 text-sky-600">
                  <HugeiconsIcon icon={RepeatIcon} size={15} />
                </div>
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                  Chu kỳ ghi nhớ (Spaced Repetition)
                </CardTitle>
              </div>
              <span className="inline-flex h-7 items-center rounded-md bg-emerald-50 px-2.5 font-mono text-[11px] font-bold text-emerald-700 border border-emerald-100">
                {overview.masteryRate}% thành thạo
              </span>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 space-y-3">
              {/* Mini progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(overview.masteryRate, 100)}%` }}
                />
              </div>

              {/* 2 ô mini action */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground">Luyện phản xạ nhanh</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-sky-700">
                    {overview.learningStats.quick} cụm từ
                  </p>
                  <Link
                    href="/dashboard/review?mode=quick"
                    className="mt-1 inline-block text-[10px] font-bold text-primary hover:underline"
                  >
                    Luyện 5 phút →
                  </Link>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground">Bộ đề tự tải lên</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-slate-800">
                    {overview.learningStats.uploaded} nội dung
                  </p>
                  <Link
                    href="/dashboard/learning"
                    className="mt-1 inline-block text-[10px] font-bold text-primary hover:underline"
                  >
                    Mở thư viện →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CỘT PHẢI (5 cols): Danh sách Bài viết gần đây */}
        <div className="lg:col-span-5">
          <Card className="p-0 gap-0 border border-slate-200/90 bg-white shadow-2xs">
            <CardHeader className="p-0 px-4 pt-3.5 pb-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 gap-3">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <HugeiconsIcon icon={Edit02Icon} size={15} />
                </div>
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                  Bài viết gần đây
                </CardTitle>
              </div>
              <Link
                href="/dashboard/new"
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-3.5 text-xs font-semibold text-primary hover:bg-primary/10 hover:border-primary/30 transition-all shrink-0 shadow-2xs"
              >
                + Viết bài mới
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {submissions.length === 0 ? (
                <div className="py-6 px-4 text-center text-xs text-muted-foreground space-y-2">
                  <p>Bạn chưa có bài viết nào.</p>
                  <Button asChild size="sm" className="h-8 rounded-lg font-bold text-xs">
                    <Link href="/dashboard/new">Viết bài luận đầu tiên</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {submissions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/dashboard/submissions/${item.id}`}
                      className="group flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-semibold ${
                              item.taskType === "TASK_1"
                                ? "bg-sky-50 text-sky-700 border border-sky-200/70"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200/70"
                            }`}
                          >
                            {item.taskType === "TASK_1" ? "Task 1" : "Task 2"}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {item.wordCount} từ
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                          {new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(item.submittedAt))}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.estimatedOverallBand !== null ? (
                          <div className="rounded-md bg-emerald-50 px-2 py-0.5 border border-emerald-200 text-center">
                            <span className="text-[9px] text-emerald-800 font-medium block leading-none">Band</span>
                            <span className="font-mono text-sm font-bold text-emerald-700 leading-tight">
                              {item.estimatedOverallBand.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <Badge className={`${statusStyles[item.status]} text-[10px] px-1.5 py-0`} variant="outline">
                            {statusLabels[item.status]}
                          </Badge>
                        )}
                        <DeleteSubmissionButton submissionId={item.id} />
                        <span className="text-xs text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                          →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
