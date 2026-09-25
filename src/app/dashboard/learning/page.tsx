import {
  ArrowRight01Icon,
  BookOpen01Icon,
  Clock01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth/session";
import {
  getLearningStats,
  listLearningItems,
  listUploadedQuizTopics,
  syncLearningItemsFromCompletedSubmissions,
} from "@/server/learning/learning.service";

import { LearningLibrary } from "./learning-library";

export default async function LearningPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  after(async () => {
    try {
      await syncLearningItemsFromCompletedSubmissions(userId);
    } catch (error) {
      console.error("Unable to sync learning items after page render", error);
    }
  });

  const [items, masteredItems, uploadedTopics, stats] = await Promise.all([
    listLearningItems(userId, 1, 24),
    listLearningItems(userId, 1, 12, { status: "MASTERED" }),
    Promise.all([
      listUploadedQuizTopics(userId, "COLLOCATION", 1, 6),
      listUploadedQuizTopics(userId, "TOPIC_VOCABULARY", 1, 6),
      listUploadedQuizTopics(userId, "PARAPHRASE", 1, 6),
      listUploadedQuizTopics(userId, "SYNONYM", 1, 6),
      listUploadedQuizTopics(userId, "TEMPLATE", 1, 6),
    ]),
    getLearningStats(userId),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 space-y-5">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Thư viện cá nhân
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground">Kho kiến thức & Luyện đề</span>
          </div>
          <h1 className="mt-1 font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Thư viện học của Bạn
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            Các mẫu câu, từ vựng và chủ đề trích xuất từ bài viết để ghi nhớ dài hạn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button asChild size="sm" variant="outline" className="h-9 text-xs font-semibold bg-white">
            <Link href="/dashboard/review?mode=quick" className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={Clock01Icon} size={14} />
              <span>Luyện 5p ({stats.quick})</span>
            </Link>
          </Button>
          {stats.due > 0 && (
            <Button asChild size="sm" className="h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs">
              <Link href="/dashboard/review" className="inline-flex items-center gap-1.5">
                <span>Ôn {stats.due} mục đến hạn</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* 3 KPI Stats Cards (Tinted Pastel Palette - Đẹp mắt & Thoát dáng) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1: Đã lưu */}
        <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-sky-50/30 p-3.5 shadow-2xs hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between text-sky-800">
            <span className="text-[11px] font-semibold">Đã lưu trong bộ nhớ</span>
            <div className="grid size-6 place-items-center rounded-md bg-sky-100 text-sky-600">
              <HugeiconsIcon icon={BookOpen01Icon} size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-heading font-mono text-2xl font-bold text-sky-700">
              {stats.total}
            </span>
            <span className="rounded-md bg-sky-100/90 px-1.5 py-0.5 text-[10px] font-medium text-sky-800">
              Tổng nội dung
            </span>
          </div>
        </div>

        {/* KPI 2: Đến hạn ôn */}
        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 p-3.5 shadow-2xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-semibold">Đến hạn ôn hôm nay</span>
            <div className="grid size-6 place-items-center rounded-md bg-amber-100 text-amber-600">
              <HugeiconsIcon icon={Clock01Icon} size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-heading font-mono text-2xl font-bold text-amber-700">
              {stats.due}
            </span>
            {stats.due > 0 ? (
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

        {/* KPI 3: Đã thành thạo */}
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-3.5 shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-semibold">Đã thành thạo</span>
            <div className="grid size-6 place-items-center rounded-md bg-emerald-100 text-emerald-600">
              <HugeiconsIcon icon={SparklesIcon} size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-heading font-mono text-2xl font-bold text-emerald-700">
              {stats.mastered}
            </span>
            <span className="rounded-md bg-emerald-100/90 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
              {stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0}% mục tiêu
            </span>
          </div>
        </div>
      </section>

      {/* Main Library Component with Tabs & Topic Filtering */}
      <LearningLibrary
        initialItems={items}
        initialMasteredItems={masteredItems}
        initialUploadedTopics={{
          COLLOCATION: uploadedTopics[0],
          TOPIC_VOCABULARY: uploadedTopics[1],
          PARAPHRASE: uploadedTopics[2],
          SYNONYM: uploadedTopics[3],
          TEMPLATE: uploadedTopics[4],
        }}
      />
    </div>
  );
}
