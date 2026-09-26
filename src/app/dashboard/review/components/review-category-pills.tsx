"use client";

import {
  BookOpen01Icon,
  Clock01Icon,
  Edit02Icon,
  FilterIcon,
  RepeatIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { ReviewCategoryKey } from "@/server/learning/learning-item.service";

export type CategoryPillItem = {
  key: ReviewCategoryKey;
  label: string;
  count?: number;
  href: string;
  icon?: typeof SparklesIcon;
};

const CATEGORY_PILLS: CategoryPillItem[] = [
  {
    key: "ALL_DUE",
    label: "Tất cả đến hạn",
    href: "/dashboard/review?category=ALL_DUE",
    icon: Clock01Icon,
  },
  {
    key: "COLLOCATION",
    label: "Collocation",
    href: "/dashboard/review?category=COLLOCATION",
    icon: SparklesIcon,
  },
  {
    key: "TEMPLATE",
    label: "Writing Template",
    href: "/dashboard/review?category=TEMPLATE",
    icon: BookOpen01Icon,
  },
  {
    key: "TOPIC_VOCABULARY",
    label: "Từ vựng chuyên đề",
    href: "/dashboard/review?category=TOPIC_VOCABULARY",
    icon: BookOpen01Icon,
  },
  {
    key: "PARAPHRASE",
    label: "Paraphrase",
    href: "/dashboard/review?category=PARAPHRASE",
    icon: RepeatIcon,
  },
  {
    key: "SYNONYM",
    label: "Cặp Synonym",
    href: "/dashboard/review?category=SYNONYM",
    icon: SparklesIcon,
  },
  {
    key: "SUBMISSION",
    label: "Từ bài viết",
    href: "/dashboard/review?category=SUBMISSION",
    icon: Edit02Icon,
  },
  {
    key: "QUICK",
    label: "Luyện 5p",
    href: "/dashboard/review?mode=quick",
    icon: Clock01Icon,
  },
];

export function ReviewCategoryPills({
  activeCategory,
  categoryCounts,
}: {
  activeCategory?: string;
  categoryCounts?: Partial<Record<ReviewCategoryKey, number>>;
}) {
  const searchParams = useSearchParams();
  const currentCategoryParam = searchParams.get("category");
  const currentQuizTypeParam = searchParams.get("quizType");
  const currentModeParam = searchParams.get("mode");

  const currentActive =
    activeCategory ||
    currentCategoryParam ||
    currentQuizTypeParam ||
    (currentModeParam === "quick" ? "QUICK" : currentModeParam === "all_due" ? "ALL_DUE" : undefined);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
      <Link
        href="/dashboard/review?view=categories"
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-all shadow-2xs ${
          !currentActive || currentActive === "CATEGORIES"
            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
            : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <HugeiconsIcon icon={FilterIcon} size={13} />
        <span>Danh mục ôn tập</span>
      </Link>

      <div className="h-4 w-px bg-slate-200 shrink-0 mx-0.5" />

      {CATEGORY_PILLS.map((pill) => {
        const isActive = currentActive === pill.key;
        const count = categoryCounts?.[pill.key];
        const IconComponent = pill.icon;

        return (
          <Link
            key={pill.key}
            href={pill.href}
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all shadow-2xs ${
              isActive
                ? "border-sky-500 bg-sky-500 text-white font-bold shadow-xs shadow-sky-500/20"
                : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {IconComponent && <HugeiconsIcon icon={IconComponent} size={13} className={isActive ? "text-white" : "text-slate-500"} />}
            <span>{pill.label}</span>
            {typeof count === "number" && count > 0 && (
              <span
                className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
