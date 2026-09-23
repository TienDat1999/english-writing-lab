import {
  ArrowLeft01Icon,
  BookOpen01Icon,
  Clock01Icon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getPublicCollectionDetail } from "@/server/content/public-content.service";
import { EnrollCollectionButton } from "./enroll-collection-button";

export default async function PublicCollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  let collectionDetail: Awaited<ReturnType<typeof getPublicCollectionDetail>> | null = null;
  try {
    collectionDetail = await getPublicCollectionDetail(slug, {
      locale: "vi",
      pageSize: 100,
    });
  } catch {
    notFound();
  }

  if (!collectionDetail) {
    notFound();
  }

  const isLoggedIn = !!session?.user;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/lessons"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
          <span>Quay lại Kho bài học</span>
        </Link>
      </div>

      {/* Collection Header Banner - Compact & Clean */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-200 border border-amber-400/30">
              <HugeiconsIcon icon={Layers01Icon} size={12} />
              Bộ bài học chuẩn hóa
            </span>
            <span className="rounded-md bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-200 border border-emerald-400/30">
              {collectionDetail.accessTier === "FREE" ? "Miễn phí" : "Hội viên VIP"}
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {collectionDetail.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {collectionDetail.description || "Tập hợp các bài học theo lộ trình chuẩn hóa."}
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <HugeiconsIcon icon={BookOpen01Icon} size={15} className="text-amber-400" />
              <span>{collectionDetail.lessons.length} Chủ đề bài học</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <HugeiconsIcon icon={Clock01Icon} size={15} className="text-sky-400" />
              <span>Lộ trình hoàn thành: ~15-20 giờ</span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <EnrollCollectionButton collectionSlug={slug} isLoggedIn={isLoggedIn} />
          </div>
        </div>
      </div>

      {/* List of Topic Cards inside Collection - Compact & Beautiful */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="font-heading text-base sm:text-lg font-extrabold text-foreground">
              Danh sách các Chủ đề ({collectionDetail.lessons.length} bài)
            </h2>
            <p className="text-xs text-muted-foreground">
              Học lần lượt theo thứ tự để đạt kết quả tốt nhất.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-auto font-mono">
            {collectionDetail.lessons.length} topics
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collectionDetail.lessons.map((lesson, idx) => {
            const topicName = lesson.primaryTopic?.name || lesson.title.split(" - ")[0];
            return (
              <Link
                key={lesson.lessonId}
                href={`/lessons/${lesson.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-primary hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="grid size-6 place-items-center rounded-md bg-amber-50 font-mono text-[11px] font-bold text-amber-800 group-hover:bg-primary group-hover:text-white transition-colors">
                      #{idx + 1}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      Trình độ {lesson.cefrLevelMin}
                    </span>
                  </div>

                  <h3 className="font-heading text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {topicName}
                  </h3>

                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {lesson.shortDescription.replace(/^Bài học\s+/i, "")}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground flex items-center gap-1 font-mono">
                    <HugeiconsIcon icon={Clock01Icon} size={11} />
                    {lesson.estimatedMinutes}p
                  </span>
                  <span className="font-bold text-primary inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Bắt đầu học →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
