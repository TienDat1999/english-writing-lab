import {
  ArrowLeft01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  SparklesIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PronounceButton } from "@/components/shared/pronounce-button";
import { getSession } from "@/server/auth/session";
import { getPublicLessonDetail } from "@/server/content/public-content.service";

import { StartLearningButton } from "./start-learning-button";

type LessonDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const lessonTypeLabels: Record<string, string> = {
  COLLOCATION: "Collocation",
  TOPIC_VOCABULARY: "Từ vựng chuyên đề",
  SYNONYM: "Từ đồng nghĩa",
  PARAPHRASE: "Paraphrase",
  SENTENCE_PATTERN: "Mẫu câu",
};

export default async function PublicLessonDetailPage({ params }: LessonDetailPageProps) {
  const { slug } = await params;
  const sessionPromise = getSession();

  let lessonDetail: Awaited<ReturnType<typeof getPublicLessonDetail>> | null = null;
  try {
    lessonDetail = await getPublicLessonDetail(slug, { locale: "vi" });
  } catch {
    notFound();
  }

  if (!lessonDetail) {
    notFound();
  }

  const session = await sessionPromise;
  const isLoggedIn = !!session?.user;
  const collection = lessonDetail.collection;
  const backHref = collection ? `/lessons/collection/${collection.slug}` : "/lessons";
  const backLabel = collection ? `Quay lại: ${collection.title}` : "Quay lại Kho bài học";
  const typeLabel = lessonTypeLabels[lessonDetail.lessonType] || lessonDetail.primarySkill;
  const vocabularyItems = lessonDetail.vocabularyItems || [];
  const exerciseCount = lessonDetail.exerciseCount || vocabularyItems.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 space-y-4">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          <span>{backLabel}</span>
        </Link>

        <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground text-[11px]">
          <Link href="/lessons" className="hover:underline">
            Kho bài học
          </Link>
          {collection && (
            <>
              <span>/</span>
              <Link href={`/lessons/collection/${collection.slug}`} className="hover:underline max-w-[200px] truncate">
                {collection.title}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="font-semibold text-foreground truncate max-w-[200px]">
            {lessonDetail.primaryTopic.name}
          </span>
        </div>
      </div>

      {/* Main Grid Layout: Left Content (8 cols) + Right Action (4 cols) */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        {/* Left Column: Lesson Overview & Core Vocabulary / Collocations List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Lesson Header Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
            {/* Meta Tags Row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                {typeLabel}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                Trình độ {lessonDetail.cefrLevelMin}
                {lessonDetail.cefrLevelMax && lessonDetail.cefrLevelMax !== lessonDetail.cefrLevelMin
                  ? `–${lessonDetail.cefrLevelMax}`
                  : ""}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                <HugeiconsIcon icon={Clock01Icon} size={12} />
                ~{lessonDetail.estimatedMinutes} phút học
              </span>
              {exerciseCount > 0 && (
                <span className="rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 font-mono">
                  {exerciseCount} câu hỏi phản xạ
                </span>
              )}
            </div>

            {/* Title & Short Description */}
            <div>
              <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
                {lessonDetail.title}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {lessonDetail.shortDescription.replace(/^Bài học\s+/i, "")}
              </p>
            </div>

            {/* Mục tiêu học tập (Compact Learning Objectives) */}
            {lessonDetail.learningObjectives && lessonDetail.learningObjectives.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5 space-y-2 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <HugeiconsIcon icon={Target01Icon} size={15} className="text-primary" />
                  <span>Mục tiêu bài học</span>
                </div>
                <ul className="space-y-1.5">
                  {lessonDetail.learningObjectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={15}
                        className="text-emerald-600 shrink-0 mt-0.5"
                      />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Core Learning Materials: Vocabulary / Collocations List */}
          {vocabularyItems.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={BookOpen01Icon} size={18} className="text-primary" />
                  <h2 className="font-heading text-base font-bold text-slate-900">
                    Nội dung bài học
                  </h2>
                  <span className="rounded-full bg-purple-100/90 text-purple-800 text-[10px] font-bold font-mono px-2 py-0.5 border border-purple-200">
                    {vocabularyItems.length} cụm từ cốt lõi
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Đọc lướt & nghe phát âm trước khi luyện tập
                </span>
              </div>

              <div className="space-y-2.5">
                {vocabularyItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-6 place-items-center rounded-md bg-purple-50 text-purple-700 text-xs font-bold font-mono shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                          {item.term}
                        </h3>
                        <PronounceButton text={item.term} />
                      </div>
                      {item.instruction && (
                        <span className="text-[11px] text-muted-foreground bg-slate-50 border border-slate-100 px-2 py-0.5 rounded font-medium">
                          {item.instruction}
                        </span>
                      )}
                    </div>

                    {item.meaning && (
                      <p className="text-xs sm:text-sm font-medium text-slate-700 pl-8.5">
                        <span className="text-slate-400 mr-1.5 font-normal">Nghĩa:</span>
                        <span className="text-slate-900 font-semibold">{item.meaning}</span>
                      </p>
                    )}

                    {item.contextText && (
                      <div className="pl-8.5 pt-0.5">
                        <div className="rounded-lg bg-slate-50/80 border border-slate-100/90 p-2.5 sm:p-3 text-xs sm:text-[13px] text-slate-700 flex items-start justify-between gap-2">
                          <p className="italic leading-relaxed">
                            &ldquo;{item.contextText}&rdquo;
                          </p>
                          <PronounceButton text={item.contextText} className="shrink-0" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Action & Practice Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-sky-100/90 bg-gradient-to-b from-sky-50/60 via-white to-white p-4 sm:p-5 shadow-2xs space-y-4 lg:sticky lg:top-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={SparklesIcon} size={20} />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-foreground">
                  Luyện tập phản xạ
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  Luyện gõ phản xạ, AI chấm điểm ngữ pháp tức thì & hỗ trợ ghi nhớ dài hạn.
                </p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-muted-foreground">Số câu thực hành:</span>
                <span className="font-bold font-mono text-foreground">{exerciseCount} câu hỏi</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-muted-foreground">Thời gian hoàn thành:</span>
                <span className="font-bold font-mono text-foreground">~{lessonDetail.estimatedMinutes} phút</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-muted-foreground">Phương pháp:</span>
                <span className="font-semibold text-primary">Spaced Repetition & AI</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-1">
              <StartLearningButton lessonSlug={slug} isLoggedIn={isLoggedIn} />
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              💡 Bạn có thể đọc lướt các cụm từ trước khi luyện tập để đạt điểm tối đa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
