import {
  AlertCircleIcon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Edit02Icon,
  File02Icon,
  SparklesIcon,
  Target01Icon,
  TranslateIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/server/auth/session";
import { ResourceNotFoundError } from "@/server/http/errors";
import { getSubmissionDetail } from "@/server/submissions/submission.service";

import { CopyButton } from "./copy-button";
import { GrammarCorrectionCard } from "./grammar-correction-card";
import { RetryAnalysisButton } from "./retry-analysis-button";
import { RewrittenEssayViewer } from "./rewritten-essay-viewer";
import { SectionNav } from "./section-nav";
import { StatusPoller } from "./status-poller";
import { VocabularyUpgradeCard } from "./vocabulary-upgrade-card";

const criteriaConfig = {
  taskResponse: {
    title: "Mức độ trả lời đề bài",
    enTitle: "Task Response",
    icon: Target01Icon,
    accentClass: "border-sky-200 bg-sky-50/50 text-sky-800",
    badgeClass: "border-sky-300 bg-sky-50 text-sky-800",
  },
  logicReasoning: {
    title: "Tính logic & Lập luận",
    enTitle: "Logic & Reasoning",
    icon: SparklesIcon,
    accentClass: "border-indigo-200 bg-indigo-50/50 text-indigo-800",
    badgeClass: "border-indigo-300 bg-indigo-50 text-indigo-800",
  },
  realismPersuasiveness: {
    title: "Tính thuyết phục thực tế",
    enTitle: "Realism & Persuasiveness",
    icon: CheckmarkCircle02Icon,
    accentClass: "border-emerald-200 bg-emerald-50/50 text-emerald-800",
    badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
  ideaDevelopment: {
    title: "Mở rộng & Phát triển ý",
    enTitle: "Idea Development",
    icon: BookOpen01Icon,
    accentClass: "border-violet-200 bg-violet-50/50 text-violet-800",
    badgeClass: "border-violet-300 bg-violet-50 text-violet-800",
  },
  vocabularyGrammar: {
    title: "Ngữ pháp & Từ vựng",
    enTitle: "Vocabulary & Grammar",
    icon: Edit02Icon,
    accentClass: "border-amber-200 bg-amber-50/50 text-amber-800",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-800",
  },
  nativeLikeWriting: {
    title: "Văn phong tự nhiên",
    enTitle: "Native-like Writing",
    icon: TranslateIcon,
    accentClass: "border-teal-200 bg-teal-50/50 text-teal-800",
    badgeClass: "border-teal-300 bg-teal-50 text-teal-800",
  },
} as const;

function getBandLevelLabel(band: number | null): string {
  if (band === null) return "Chưa có đánh giá";
  if (band >= 8.0) return "C2 · Expert User (Xuất sắc)";
  if (band >= 7.0) return "C1 · Good User (Thành thạo)";
  if (band >= 6.0) return "B2 · Competent User (Khá)";
  if (band >= 5.0) return "B1 · Modest User (Trung bình)";
  return "A2 · Limited User (Cần cải thiện)";
}

type SubmissionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  let submission: Awaited<ReturnType<typeof getSubmissionDetail>>;

  try {
    submission = await getSubmissionDetail(session.user.id, id);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      notFound();
    }
    throw error;
  }

  const isProcessing =
    submission.status === "QUEUED" || submission.status === "ANALYZING";

  const navItems = submission.analysis
    ? [
        { id: "overview", label: "Điểm số & Tổng quan" },
        ...(submission.analysis.grammarCorrections.length > 0
          ? [
              {
                id: "grammar",
                label: "Sửa lỗi ngữ pháp",
                badge: submission.analysis.grammarCorrections.length,
              },
            ]
          : []),
        ...(submission.analysis.vocabularyUpgrades.length > 0
          ? [
              {
                id: "vocabulary",
                label: "Nâng cấp từ vựng",
                badge: submission.analysis.vocabularyUpgrades.length,
              },
            ]
          : []),
        ...(submission.analysis.rewrittenEssay
          ? [{ id: "model-essay", label: "Bài viết mẫu B2" }]
          : []),
        { id: "criteria", label: "6 Tiêu chí IELTS" },
        { id: "original", label: "Bài làm gốc" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <StatusPoller submissionId={submission.id} status={submission.status} />

      {/* 1. Header Tinh gọn */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="secondary" className="font-semibold text-xs">
              {submission.taskType === "TASK_1" ? "IELTS Academic Task 1" : "IELTS Task 2"}
            </Badge>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-600">
              {submission.questionType}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-muted-foreground font-medium">
              {new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(submission.submittedAt))}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {submission.analysis
              ? "Báo cáo phân tích bài viết"
              : "Đang xếp hàng phân tích"}
          </h1>
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="rounded-xl font-bold shadow-2xs">
            <Link href="/dashboard/new">Viết bài luận mới</Link>
          </Button>
        </div>
      </div>

      {/* Sticky Section Navigator khi đã có phân tích */}
      {submission.analysis && navItems.length > 0 ? (
        <SectionNav items={navItems} />
      ) : null}

      {/* Trạng thái Đang phân tích (QUEUED / ANALYZING) */}
      {isProcessing ? (
        <Card className="border border-sky-200 bg-sky-50/40 py-12 shadow-sm">
          <CardContent className="mx-auto max-w-2xl text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sky-100 text-primary animate-pulse">
              <HugeiconsIcon icon={SparklesIcon} size={28} />
            </div>
            <Badge variant="secondary" className="font-semibold text-xs">
              {submission.status === "QUEUED" ? "Đang chờ xếp hàng" : "AI đang đọc và chấm bài"}
            </Badge>
            <CardTitle className="font-heading text-2xl font-bold text-foreground">
              {submission.status === "QUEUED"
                ? "Bài viết đã được lưu an toàn và xếp hàng phân tích"
                : "Giám khảo AI đang đối chiếu bài viết với 4 tiêu chuẩn chấm IELTS"}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-slate-700 max-w-lg mx-auto">
              Trang này sẽ tự động làm mới ngay khi có kết quả. Bạn có thể rời trang và quay lại kiểm tra từ Trang tổng quan bất kỳ lúc nào.
            </CardDescription>
          </CardContent>
        </Card>
      ) : null}

      {/* Trạng thái Thất bại (FAILED) */}
      {submission.status === "FAILED" ? (
        <Card className="border border-rose-200 bg-rose-50/70 py-10 shadow-sm">
          <CardContent className="mx-auto max-w-xl text-center space-y-3">
            <Badge className="border-rose-300 bg-white text-rose-800" variant="outline">
              Phân tích chưa hoàn tất
            </Badge>
            <CardTitle className="font-heading text-2xl font-bold text-foreground">
              Bài làm của Bạn đã được lưu an toàn
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-rose-900">
              Hệ thống tạm thời gặp sự cố khi kết nối với mô hình AI. Nội dung bài viết vẫn được giữ nguyên bản, Bạn có thể thử lại sau.
            </CardDescription>
            {submission.failureReason ? (
              <div className="mx-auto max-w-md rounded-lg border border-rose-300 bg-rose-100/70 p-2.5 text-xs text-rose-900 font-mono text-left">
                <strong>Chi tiết:</strong> {submission.failureReason}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <RetryAnalysisButton submissionId={submission.id} />
              <Button asChild className="rounded-xl" size="sm" variant="outline">
                <Link href="/dashboard/new">Viết bài luận mới</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* KHI ĐÃ CÓ PHÂN TÍCH */}
      {submission.analysis ? (
        <div className="space-y-12">
          {/* PHẦN 1: HERO SCORE & NHẬN XÉT TỔNG QUAN */}
          <section id="overview" className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
              {/* Background decorative glows */}
              <div className="absolute -right-20 -top-20 size-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <div className="relative grid gap-8 lg:grid-cols-[280px_1fr] lg:items-center">
                {/* Cột Điểm số */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xs">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Điểm ước lượng IELTS
                  </span>
                  <div className="my-3 flex items-baseline gap-1">
                    <span className="font-heading text-6xl sm:text-7xl font-black tracking-tight text-white drop-shadow-sm">
                      {submission.analysis.estimatedOverallBand !== null
                        ? submission.analysis.estimatedOverallBand.toFixed(1)
                        : "—"}
                    </span>
                    <span className="text-xl font-bold text-slate-400">/ 9.0</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-300 border border-sky-400/20">
                    <HugeiconsIcon icon={Target01Icon} size={14} />
                    <span>{getBandLevelLabel(submission.analysis.estimatedOverallBand)}</span>
                  </div>

                  {submission.targetBand ? (
                    <div className="mt-4 w-full border-t border-white/10 pt-3 text-xs text-slate-300">
                      <div className="flex justify-between font-medium mb-1.5">
                        <span>Mục tiêu: Band {submission.targetBand.toFixed(1)}</span>
                        <span className="text-slate-400">
                          {submission.analysis.estimatedOverallBand !== null
                            ? submission.analysis.estimatedOverallBand >= submission.targetBand
                              ? "✓ Đạt mục tiêu"
                              : `Còn ${(submission.targetBand - submission.analysis.estimatedOverallBand).toFixed(1)} band`
                            : ""}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                10,
                                ((submission.analysis.estimatedOverallBand || 0) /
                                  (submission.targetBand || 9)) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Cột Nhận xét Giám khảo & Thống kê nhanh */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                    <HugeiconsIcon icon={SparklesIcon} size={16} />
                    <span>Nhận xét tổng quan từ Giám khảo AI</span>
                  </div>

                  <blockquote className="text-base sm:text-lg font-normal leading-relaxed text-slate-100 italic border-l-2 border-sky-400/60 pl-4 py-1">
                    &ldquo;{submission.analysis.summaryVi}&rdquo;
                  </blockquote>

                  {/* Stat pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                      <span className="text-slate-400">Độ dài: </span>
                      <strong className="text-white font-semibold">{submission.wordCount} từ</strong>
                      <span className="text-slate-400 ml-1">
                        {submission.wordCount >= 250 ? "(Đạt chuẩn ≥ 250)" : "(Dưới 250 từ)"}
                      </span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                      <span className="text-slate-400">Lỗi ngữ pháp: </span>
                      <strong className="text-rose-300 font-semibold">
                        {submission.analysis.grammarCorrections.length} điểm cần sửa
                      </strong>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                      <span className="text-slate-400">Nâng cấp từ vựng: </span>
                      <strong className="text-emerald-300 font-semibold">
                        {submission.analysis.vocabularyUpgrades.length} cụm học thuật
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PHẦN 2: ƯU ĐIỂM & ĐIỂM CẦN CẢI THIỆN (UNIFIED EXECUTIVE SUMMARY) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex flex-col gap-1 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700 font-bold text-xs">
                    ✦
                  </span>
                  <h3 className="font-heading text-lg font-bold text-slate-900">
                    Đánh giá tổng quan (Executive Takeaways)
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tổng hợp điểm sáng nổi bật và các trọng tâm cần ưu tiên khắc phục để bứt phá band điểm.
                </p>
              </div>

              <div className="grid gap-6 pt-5 md:grid-cols-2 md:divide-x md:divide-slate-100">
                {/* Cột 1: Điểm sáng ghi điểm */}
                <div className="space-y-3.5 md:pr-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                      </div>
                      <span className="font-heading text-sm font-bold text-emerald-950">
                        Điểm sáng ghi điểm (Strengths)
                      </span>
                    </div>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                      {submission.analysis.strengths.length} điểm
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {submission.analysis.strengths.length > 0 ? (
                      submission.analysis.strengths.map((strength, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-emerald-100/70 bg-emerald-50/30 p-3 text-sm leading-relaxed text-slate-700"
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700 mt-0.5">
                            ✓
                          </span>
                          <span className="font-medium text-slate-800">{strength}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Cần cải thiện thêm các luận điểm cơ bản.
                      </p>
                    )}
                  </div>
                </div>

                {/* Cột 2: Điểm yếu cần khắc phục */}
                <div className="space-y-3.5 md:pl-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                        <HugeiconsIcon icon={AlertCircleIcon} size={14} />
                      </div>
                      <span className="font-heading text-sm font-bold text-amber-950">
                        Trọng tâm cần khắc phục (Weaknesses)
                      </span>
                    </div>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-700">
                      {submission.analysis.structuralWeaknesses.length} điểm
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {submission.analysis.structuralWeaknesses.length > 0 ? (
                      submission.analysis.structuralWeaknesses.map((weakness, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-amber-100/70 bg-amber-50/30 p-3 text-sm leading-relaxed text-slate-700"
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-800">{weakness}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Không phát hiện điểm yếu cấu trúc nghiêm trọng.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PHẦN 3: SỬA LỖI NGỮ PHÁP (GRAMMAR CORRECTIONS) */}
          {submission.analysis.grammarCorrections.length > 0 ? (
            <section id="grammar" className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="outline" className="mb-1 text-xs border-rose-300 bg-rose-50 text-rose-800 font-semibold">
                    Độ chính xác ngữ pháp
                  </Badge>
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                    Sửa các lỗi ngữ pháp then chốt
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    So sánh câu gốc và câu chuẩn kèm giải thích ngữ pháp và nút lưu vào sổ tay ôn tập.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {submission.analysis.grammarCorrections.map((correction, index) => (
                  <GrammarCorrectionCard
                    key={index}
                    index={index}
                    submissionId={submission.id}
                    sourceQuote={correction.sourceQuote}
                    correctionText={correction.correctionText}
                    correctionVi={correction.correctionVi}
                    explanationVi={correction.explanationVi}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* PHẦN 4: NÂNG CẤP TỪ VỰNG HỌC THUẬT (VOCABULARY UPGRADES) */}
          {submission.analysis.vocabularyUpgrades.length > 0 ? (
            <section id="vocabulary" className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="outline" className="mb-1 text-xs border-sky-300 bg-sky-50 text-sky-800 font-semibold">
                    Lexical Resource · B2 / C1
                  </Badge>
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                    Nâng cấp diễn đạt học thuật
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Thay thế từ đơn giản hoặc dịch từng chữ bằng các cụm collocations tự nhiên hơn.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {submission.analysis.vocabularyUpgrades.map((upgrade, index) => (
                  <VocabularyUpgradeCard
                    key={index}
                    index={index}
                    submissionId={submission.id}
                    originalExpression={upgrade.originalExpression}
                    upgradedExpression={upgrade.upgradedExpression}
                    meaningVi={upgrade.meaningVi}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* PHẦN 5: BÀI VIẾT MẪU ĐƯỢC TỐI ƯU (OPTIMIZED REWRITE) */}
          {submission.analysis.rewrittenEssay ? (
            <section id="model-essay" className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="secondary" className="mb-1 text-xs font-semibold">
                    Bài viết mẫu B2 · Chuẩn P.E.E.R
                  </Badge>
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                    Bài viết mẫu được tối ưu hóa
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Viết lại hoàn chỉnh giữ nguyên lập trường của bạn với cách dùng từ học thuật và liên kết chặt chẽ.
                  </p>
                </div>
              </div>

              <RewrittenEssayViewer
                submissionId={submission.id}
                rewrittenEssay={submission.analysis.rewrittenEssay}
                rewrittenEssayVi={submission.analysis.rewrittenEssayVi}
              />
            </section>
          ) : null}

          {/* PHẦN 6: ĐÁNH GIÁ CHI TIẾT 6 TIÊU CHÍ */}
          <section id="criteria" className="space-y-4 pt-2">
            <div>
              <Badge variant="outline" className="mb-1 text-xs font-semibold">
                Tiêu chuẩn chấm chi tiết
              </Badge>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Đánh giá theo 6 khía cạnh chuyên sâu
              </h2>
              <p className="text-xs text-muted-foreground">
                Phân tích toàn diện mức độ hoàn thiện của bài luận theo tiêu chí khảo thí.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(criteriaConfig).map(([key, config]) => {
                const feedbackText =
                  submission.analysis?.criteriaFeedback[
                    key as keyof typeof criteriaConfig
                  ] || "Đang cập nhật đánh giá.";
                const IconComponent = config.icon;

                return (
                  <Card
                    key={key}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <HugeiconsIcon icon={IconComponent} size={18} />
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-semibold ${config.badgeClass}`}>
                          {config.enTitle}
                        </Badge>
                      </div>

                      <h3 className="font-heading text-sm font-bold text-slate-900 mb-2">
                        {config.title}
                      </h3>

                      <p className="text-xs leading-relaxed text-slate-600 font-normal">
                        {feedbackText}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* PHẦN 7: BÀI LÀM GỐC & ĐỀ BÀI */}
          <section id="original" className="pt-2">
            <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all open:pb-6">
              <summary className="flex cursor-pointer items-center justify-between text-sm sm:text-base font-bold text-foreground select-none">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={File02Icon} size={18} className="text-primary" />
                  <span>Xem lại đề bài & bài viết gốc của Bạn</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 font-mono font-semibold">
                    {submission.wordCount} từ
                  </span>
                  <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </div>
              </summary>
              <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                {submission.promptText ? (
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Đề bài:</p>
                    <p className="text-sm font-medium leading-relaxed text-slate-900">
                      {submission.promptText}
                    </p>
                  </div>
                ) : null}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Bài làm gốc:</p>
                    <CopyButton textToCopy={submission.originalText} label="Chép bài làm" />
                  </div>
                  <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-800 font-sans">
                    {submission.originalText}
                  </p>
                </div>
              </div>
            </details>
          </section>

          {/* PHẦN 8: THANH HÀNH ĐỘNG CUỐI TRANG */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50/60 to-blue-50/40 p-6 shadow-sm">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900">
                Sẵn sàng củng cố các lỗi vừa phát hiện?
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Chuyển ngay sang chế độ Ôn tập ngắt quãng để ghi nhớ từ vựng và khắc phục các lỗi ngữ pháp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-xl font-bold shadow-sm">
                <Link href="/dashboard/review" className="inline-flex items-center gap-2">
                  <span>Ôn tập các lỗi từ bài này</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl font-bold">
                <Link href="/dashboard/new">Viết bài mới</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
