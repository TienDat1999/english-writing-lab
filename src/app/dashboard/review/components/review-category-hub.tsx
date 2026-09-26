"use client";

import {
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  Edit02Icon,
  FilterIcon,
  RepeatIcon,
  SparklesIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ReviewHubOverview } from "@/server/learning/learning-item.service";

const categoryTheme = {
  sky: {
    border: "border-sky-200/90 hover:border-sky-400",
    bg: "bg-gradient-to-br from-sky-50/80 via-white to-sky-50/30",
    badge: "border-sky-300 bg-sky-100/90 text-sky-800",
    iconBg: "bg-sky-100 text-sky-600",
    button: "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20",
    accent: "text-sky-700",
  },
  indigo: {
    border: "border-indigo-200/90 hover:border-indigo-400",
    bg: "bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30",
    badge: "border-indigo-300 bg-indigo-100/90 text-indigo-800",
    iconBg: "bg-indigo-100 text-indigo-600",
    button: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20",
    accent: "text-indigo-700",
  },
  emerald: {
    border: "border-emerald-200/90 hover:border-emerald-400",
    bg: "bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30",
    badge: "border-emerald-300 bg-emerald-100/90 text-emerald-800",
    iconBg: "bg-emerald-100 text-emerald-600",
    button: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20",
    accent: "text-emerald-700",
  },
  violet: {
    border: "border-violet-200/90 hover:border-violet-400",
    bg: "bg-gradient-to-br from-violet-50/80 via-white to-violet-50/30",
    badge: "border-violet-300 bg-violet-100/90 text-violet-800",
    iconBg: "bg-violet-100 text-violet-600",
    button: "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20",
    accent: "text-violet-700",
  },
  amber: {
    border: "border-amber-200/90 hover:border-amber-400",
    bg: "bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30",
    badge: "border-amber-300 bg-amber-100/90 text-amber-800",
    iconBg: "bg-amber-100 text-amber-600",
    button: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20",
    accent: "text-amber-700",
  },
  rose: {
    border: "border-rose-200/90 hover:border-rose-400",
    bg: "bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30",
    badge: "border-rose-300 bg-rose-100/90 text-rose-800",
    iconBg: "bg-rose-100 text-rose-600",
    button: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20",
    accent: "text-rose-700",
  },
  teal: {
    border: "border-teal-200/90 hover:border-teal-400",
    bg: "bg-gradient-to-br from-teal-50/80 via-white to-teal-50/30",
    badge: "border-teal-300 bg-teal-100/90 text-teal-800",
    iconBg: "bg-teal-100 text-teal-600",
    button: "bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20",
    accent: "text-teal-700",
  },
};

const categoryIcons = {
  COLLOCATION: SparklesIcon,
  TEMPLATE: BookOpen01Icon,
  TOPIC_VOCABULARY: Target01Icon,
  PARAPHRASE: RepeatIcon,
  SYNONYM: CheckmarkBadge01Icon,
  SUBMISSION: Edit02Icon,
  QUICK: Clock01Icon,
  ALL_DUE: Clock01Icon,
};

export function ReviewCategoryHub({
  overview,
}: {
  overview: ReviewHubOverview;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* 1. Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-5 sm:p-6 text-white shadow-md border border-slate-800/80">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-400/20 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-200 border border-sky-400/30">
                <HugeiconsIcon icon={FilterIcon} size={13} />
                Trung tâm Ôn tập & Luyện phản xạ
              </span>
              <span className="text-[11px] font-medium text-sky-200/80">
                {overview.totalItems} nội dung trong kho
              </span>
            </div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
              Chọn phần bạn muốn ôn tập hôm nay
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Lựa chọn chuyên đề bạn muốn rèn luyện (Collocation, Writing Template, Từ vựng chuyên đề, Paraphrase, Synonym hoặc câu trích từ bài viết).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {overview.totalDue > 0 ? (
              <Button asChild size="sm" className="h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 text-xs px-4">
                <Link href="/dashboard/review?category=ALL_DUE" className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon icon={Clock01Icon} size={15} />
                  <span>Ôn {overview.totalDue} mục đến hạn hôm nay</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="h-9 bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-md shadow-sky-500/20 text-xs px-4">
                <Link href="/dashboard/review?category=COLLOCATION" className="inline-flex items-center gap-1.5">
                  <span>Bắt đầu ôn Collocation</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm" className="h-9 bg-white/10 hover:bg-white/15 text-white border-white/20 font-semibold text-xs px-3 backdrop-blur-xs">
              <Link href="/dashboard/learning" className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={BookOpen01Icon} size={14} />
                <span>Thư viện học</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Quick Alert if items are due */}
      {overview.totalDue > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-amber-950 text-xs sm:text-sm shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="grid size-6 place-items-center rounded-md bg-amber-200 text-amber-800 shrink-0">
              <HugeiconsIcon icon={Clock01Icon} size={14} />
            </div>
            <div>
              <span className="font-bold text-amber-900">
                Chu kỳ Spaced Repetition hôm nay:
              </span>{" "}
              <span className="text-amber-800">
                Có <strong>{overview.totalDue}</strong> nội dung cần ôn lại để đưa vào trí nhớ dài hạn.
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/review?category=ALL_DUE"
            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
          >
            <span>Ôn toàn bộ mục đến hạn</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
          </Link>
        </div>
      )}

      {/* 3. Grid of Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {overview.categories.map((cat) => {
          const theme = categoryTheme[cat.colorScheme] || categoryTheme.sky;
          const IconComponent = categoryIcons[cat.key as keyof typeof categoryIcons] || SparklesIcon;
          const isExpanded = expandedCategory === cat.key;
          const hasTopics = cat.sampleTopics && cat.sampleTopics.length > 0;

          return (
            <Card
              key={cat.key}
              className={`flex flex-col justify-between border transition-all duration-200 shadow-2xs hover:shadow-md ${theme.border} ${theme.bg}`}
            >
              <CardHeader className="p-4 pb-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className={`grid size-8 place-items-center rounded-lg ${theme.iconBg} shadow-2xs`}>
                    <HugeiconsIcon icon={IconComponent} size={17} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {cat.dueCount > 0 && (
                      <span className="rounded-md bg-amber-100 border border-amber-300 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-900">
                        {cat.dueCount} đến hạn
                      </span>
                    )}
                    <Badge variant="outline" className={`text-[10px] font-bold ${theme.badge}`}>
                      {cat.badge}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{cat.title}</span>
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {cat.subtitle}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3">
                {/* Stats row */}
                <div className="flex items-center justify-between border-t border-slate-100/90 pt-2.5 text-xs">
                  <div className="flex items-baseline gap-1">
                    <span className={`font-mono text-base font-bold ${theme.accent}`}>
                      {cat.totalCount}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">nội dung</span>
                  </div>
                  {cat.topicsCount > 0 && (
                    <span className="text-[11px] font-mono text-slate-500">
                      {cat.topicsCount} chủ đề
                    </span>
                  )}
                </div>

                {/* Subtopic list / accordion if available */}
                {hasTopics && isExpanded && (
                  <div className="space-y-1.5 rounded-lg border border-slate-200/80 bg-white/90 p-2.5 shadow-2xs animate-in fade-in-50 duration-200">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Chọn chủ đề cụ thể:
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {cat.sampleTopics.map((top) => (
                        <Link
                          key={top.topic}
                          href={`/dashboard/review?category=${cat.key}&quizType=${cat.key}&mode=upload&topic=${encodeURIComponent(top.topic)}`}
                          className="flex items-center justify-between rounded px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:text-primary transition-colors"
                        >
                          <span className="truncate pr-2">{top.topic}</span>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {top.count} câu →
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    asChild
                    size="sm"
                    className={`h-8 flex-1 rounded-lg text-xs font-bold shadow-xs ${theme.button}`}
                  >
                    <Link href={cat.href} className="inline-flex items-center justify-center gap-1.5">
                      <span>Ôn toàn bộ ({cat.totalCount})</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                    </Link>
                  </Button>

                  {hasTopics && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                      className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      title="Xem danh sách chủ đề"
                    >
                      {isExpanded ? "Thu gọn" : "Chủ đề"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
