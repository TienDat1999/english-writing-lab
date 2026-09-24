import {
  AlertCircleIcon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Edit02Icon,
  SparklesIcon,
  Target01Icon,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/server/auth/session";
import { ResourceNotFoundError } from "@/server/http/errors";
import { getSubmissionDetail } from "@/server/submissions/submission.service";

import { SaveLearningButton } from "./save-learning-button";
import { StatusPoller } from "./status-poller";

const categoryLabels = {
  TASK_RESPONSE: "Đáp ứng yêu cầu đề (Task Response)",
  COHERENCE: "Tính mạch lạc & Liên kết (Coherence & Cohesion)",
  LEXICAL: "Vốn từ vựng (Lexical Resource)",
  GRAMMAR: "Ngữ pháp (Grammar)",
  SPELLING: "Chính tả (Spelling)",
  PUNCTUATION: "Dấu câu (Punctuation)",
} as const;

const severityStyles = {
  HIGH: "border-rose-300 bg-rose-50 text-rose-800",
  MEDIUM: "border-amber-300 bg-amber-50 text-amber-800",
  LOW: "border-blue-300 bg-blue-50 text-blue-800",
} as const;

const severityLabels = {
  HIGH: "Ảnh hưởng lớn",
  MEDIUM: "Ảnh hưởng vừa",
  LOW: "Ảnh hưởng nhẹ",
} as const;

const criteriaLabels = {
  taskResponse: "1. Mức độ trả lời đề bài (Task Response)",
  logicReasoning: "2. Tính logic & Lập luận (Logic & Reasoning)",
  realismPersuasiveness: "3. Tính thuyết phục thực tế (Realism & Persuasiveness)",
  ideaDevelopment: "4. Mở rộng & Phát triển ý (Idea Development)",
  vocabularyGrammar: "5. Ngữ pháp & Từ vựng (Vocabulary & Grammar)",
  nativeLikeWriting: "6. Văn phong tự nhiên như người bản xứ (Native-like Writing)",
} as const;

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <StatusPoller submissionId={submission.id} status={submission.status} />

      {/* 1. Header Tinh gọn (Clean Light Mode) */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary">
              {submission.taskType === "TASK_1" ? "IELTS Academic Task 1" : "IELTS Task 2"}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {submission.questionType}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {submission.wordCount} từ
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              Nộp lúc{" "}
              {new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(submission.submittedAt))}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {submission.analysis
              ? "Kết quả chấm & Phân tích chi tiết"
              : "Bài viết đang trong hàng đợi chấm"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Báo cáo chi tiết các lỗi sai, gợi ý nâng cấp từ vựng và bài mẫu viết lại theo tiêu chuẩn IELTS.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
            <Link href="/dashboard/new">Viết bài luận khác</Link>
          </Button>
        </div>
      </div>

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
            <Button asChild className="mt-4 rounded-xl" size="sm">
              <Link href="/dashboard/new">Viết bài luận mới</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* KHI ĐÃ CÓ PHÂN TÍCH (8 PHẦN HÀNH ĐỘNG KHOA HỌC) */}
      {submission.analysis ? (
        <div className="space-y-10">
          {/* PHẦN 1: ESTIMATED BAND & NHẬN XÉT MẤU CHỐT */}
          <section className="grid gap-5 lg:grid-cols-[0.38fr_1fr]">
            <Card className="border border-slate-200 bg-gradient-to-br from-white via-white to-sky-50/40 p-6 shadow-sm">
              <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                  <CardDescription className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Điểm ước lượng (Estimated Band)
                  </CardDescription>
                  <HugeiconsIcon icon={Target01Icon} size={20} className="text-primary" />
                </div>
                <div className="font-heading font-extrabold text-7xl font-mono text-primary my-3">
                  {submission.analysis.estimatedOverallBand !== null
                    ? submission.analysis.estimatedOverallBand.toFixed(1)
                    : "—"}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ước lượng dựa trên tiêu chuẩn chấm IELTS 4 tiêu chí. Điểm mang tính định hướng học tập cá nhân.
                </p>
              </CardHeader>
            </Card>

            <Card className="border border-slate-200 bg-white p-6 shadow-sm">
              <CardHeader className="p-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Đánh giá chung</Badge>
                  <span className="text-xs font-semibold text-muted-foreground">Nhận xét của Giám khảo</span>
                </div>
                <CardTitle className="font-heading text-xl font-bold text-foreground">
                  Điểm mấu chốt của bài viết
                </CardTitle>
                <CardDescription className="pt-2 text-sm leading-relaxed text-slate-800 font-normal">
                  {submission.analysis.summaryVi}
                </CardDescription>
              </CardHeader>
            </Card>
          </section>

          {/* PHẦN 2: 3 VẤN ĐỀ ẢNH HƯỞNG BAND ĐIỂM NHIỀU NHẤT */}
          {submission.analysis.structuralWeaknesses.length > 0 ? (
            <section>
              <Card className="border border-amber-200 bg-amber-50/40 p-6 shadow-sm">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center gap-2 text-amber-800 mb-1">
                    <HugeiconsIcon icon={AlertCircleIcon} size={20} />
                    <Badge variant="outline" className="border-amber-300 bg-white text-amber-800 text-xs font-bold">
                      Ưu tiên khắc phục trước
                    </Badge>
                  </div>
                  <CardTitle className="font-heading text-xl font-bold text-foreground">
                    Các điểm yếu về cấu trúc & lập luận cần chú ý
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Đây là các vị trí luận điểm còn liệt kê ý, thiếu dẫn chứng hoặc làm giảm độ thuyết phục của bài viết.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 space-y-3">
                  {submission.analysis.structuralWeaknesses.map((weakness, index) => (
                    <div
                      key={weakness}
                      className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-white p-4 shadow-2xs"
                    >
                      <span className="font-mono text-lg font-bold text-amber-600 mt-0.5">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm font-medium leading-relaxed text-slate-800">
                        {weakness}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {/* PHẦN 3: ĐIỂM MẠNH ĐÃ LÀM TỐT */}
          {submission.analysis.strengths.length > 0 ? (
            <section>
              <Card className="border border-emerald-200 bg-emerald-50/30 p-6 shadow-sm">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center gap-2 text-emerald-800 mb-1">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
                    <Badge variant="success" className="text-xs">
                      Điểm sáng ghi điểm
                    </Badge>
                  </div>
                  <CardTitle className="font-heading text-xl font-bold text-foreground">
                    Những gì Bạn đã làm rất tốt
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 grid gap-3 sm:grid-cols-2">
                  {submission.analysis.strengths.map((strength) => (
                    <div
                      key={strength}
                      className="rounded-xl border border-emerald-100 bg-white p-3.5 text-xs font-medium leading-relaxed text-slate-800 shadow-2xs"
                    >
                      ✓ {strength}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {/* PHẦN 4: BÀI VIẾT GỐC CỦA BẠN */}
          <section>
            <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all open:pb-6">
              <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-foreground">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Edit02Icon} size={18} className="text-primary" />
                  <span>Xem lại đề bài & bài viết gốc của Bạn</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {submission.wordCount} từ · Bấm để mở / đóng
                </span>
              </summary>
              <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
                {submission.promptText ? (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Đề bài:</p>
                    <p className="text-sm font-medium leading-relaxed text-slate-900">
                      {submission.promptText}
                    </p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Bài làm gốc:</p>
                  <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm leading-8 text-slate-800 font-mono">
                    {submission.originalText}
                  </p>
                </div>
              </div>
            </details>
          </section>

          {/* PHẦN 5: SỬA LỖI NGỮ PHÁP (CARD DỌC RESPONSIVE THAY VÌ BẢNG SCROLL) */}
          {submission.analysis.grammarCorrections.length > 0 ? (
            <section className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-1 text-xs">
                  Sửa lỗi chính xác
                </Badge>
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  Các lỗi ngữ pháp cần sửa
                </h2>
                <p className="text-xs text-muted-foreground">
                  Phân tích từng câu bị sai ngữ pháp kèm giải thích quy tắc và nút lưu vào bài ôn tập.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {submission.analysis.grammarCorrections.map((correction, index) => (
                  <Card key={index} className="border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="destructive" className="text-[11px]">
                          Lỗi ngữ pháp #{index + 1}
                        </Badge>
                        <SaveLearningButton
                          sourceIndex={index}
                          sourceType="GRAMMAR"
                          submissionId={submission.id}
                        />
                      </div>

                      {/* Câu lỗi */}
                      <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-100">
                        <p className="font-bold text-[10px] uppercase text-rose-600 mb-0.5">Câu lỗi ban đầu:</p>
                        <p className="line-through decoration-rose-500 font-mono text-[13px]">
                          {correction.sourceQuote}
                        </p>
                      </div>

                      {/* Câu sửa */}
                      <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-900 border border-emerald-100">
                        <p className="font-bold text-[10px] uppercase text-emerald-700 mb-0.5">Câu sửa chuẩn:</p>
                        <p className="font-mono text-[13px] font-bold text-emerald-800">
                          {correction.correctionText}
                        </p>
                        {correction.correctionVi ? (
                          <p className="mt-1 text-[11px] text-emerald-700 italic">
                            &ldquo;{correction.correctionVi}&rdquo;
                          </p>
                        ) : null}
                      </div>
                    </CardHeader>

                    {correction.explanationVi ? (
                      <CardContent className="p-5 pt-0 border-t border-slate-100 mt-2">
                        <p className="text-xs text-muted-foreground leading-relaxed pt-3">
                          <strong className="text-foreground">Giải thích: </strong>
                          {correction.explanationVi}
                        </p>
                      </CardContent>
                    ) : null}
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {/* PHẦN 6: NÂNG CẤP TỪ VỰNG HỌC THUẬT (CARD DỌC RESPONSIVE) */}
          {submission.analysis.vocabularyUpgrades.length > 0 ? (
            <section className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-1 text-xs">
                  Lexical Resource B2 / C1
                </Badge>
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  Nâng cấp cách diễn đạt học thuật
                </h2>
                <p className="text-xs text-muted-foreground">
                  Thay thế các từ đơn giản hoặc dịch từng chữ (word-by-word) bằng các cụm collocations tự nhiên hơn.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {submission.analysis.vocabularyUpgrades.map((upgrade, index) => (
                  <Card key={index} className="border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="text-[11px]">
                          Từ vựng #{index + 1}
                        </Badge>
                        <SaveLearningButton
                          sourceIndex={index}
                          sourceType="VOCABULARY"
                          submissionId={submission.id}
                        />
                      </div>

                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase font-semibold">Từ gốc của Bạn:</p>
                        <p className="text-sm line-through text-slate-500 font-mono">
                          {upgrade.originalExpression}
                        </p>
                      </div>

                      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                        <p className="text-[11px] text-primary uppercase font-bold">Cụm từ B2 tự nhiên:</p>
                        <p className="text-base font-bold font-mono text-primary mt-0.5">
                          {upgrade.upgradedExpression}
                        </p>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 border-t border-slate-100">
                      <p className="text-xs text-muted-foreground pt-2.5">
                        <strong className="text-foreground">Nghĩa tiếng Việt: </strong>
                        {upgrade.meaningVi}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {/* PHẦN 7: BÀI VIẾT ĐƯỢC TỐI ƯU (OPTIMIZED REWRITE) */}
          {submission.analysis.rewrittenEssay ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="secondary" className="mb-1 text-xs">
                    Phiên bản mẫu B2 · Chuẩn P.E.E.R
                  </Badge>
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                    Bài viết mẫu được tối ưu
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Bài viết khoảng 260–280 từ, cấu trúc chặt chẽ, liên kết tự nhiên và diễn đạt học thuật.
                  </p>
                </div>
                <SaveLearningButton
                  label="Lưu bài mẫu này"
                  sourceType="ESSAY_BLUEPRINT"
                  submissionId={submission.id}
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card className="border border-slate-200 bg-white p-6 shadow-sm">
                  <CardHeader className="p-0 pb-4 border-b border-slate-100 mb-4">
                    <CardTitle className="font-heading text-lg font-bold text-foreground">
                      Bản tiếng Anh (English Rewrite)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Bài viết hoàn chỉnh theo phong cách IELTS Academic.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="whitespace-pre-wrap text-sm leading-8 text-slate-800 font-mono">
                      {submission.analysis.rewrittenEssay}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-slate-50/60 p-6 shadow-sm">
                  <CardHeader className="p-0 pb-4 border-b border-slate-200/80 mb-4">
                    <CardTitle className="font-heading text-lg font-bold text-foreground">
                      Bản dịch tiếng Việt
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Dịch tương đương theo mạch ý của bản viết lại.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="whitespace-pre-wrap text-sm leading-8 text-slate-700">
                      {submission.analysis.rewrittenEssayVi}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          ) : null}

          {/* PHẦN 8: ĐÁNH GIÁ CHI TIẾT 6 TIÊU CHÍ */}
          <section className="space-y-4">
            <div>
              <Badge variant="outline" className="mb-1 text-xs">
                Chấm điểm chi tiết
              </Badge>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Đánh giá theo 6 tiêu chí chấm
              </h2>
              <p className="text-xs text-muted-foreground">
                Nhận xét chi tiết cho từng khía cạnh viết bài của Bạn.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(criteriaLabels).map(([key, label]) => (
                <Card key={key} className="border border-slate-200 bg-white p-5 shadow-sm">
                  <CardHeader className="p-0">
                    <CardTitle className="font-heading text-sm font-bold text-foreground">
                      {label}
                    </CardTitle>
                    <CardDescription className="pt-2 text-xs leading-relaxed text-slate-700">
                      {submission.analysis?.criteriaFeedback[
                        key as keyof typeof criteriaLabels
                      ] || "Đang cập nhật đánh giá cho tiêu chí này."}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          {/* PHẦN 9: THANH HÀNH ĐỘNG CUỐI TRANG (ACTION FOOTER) */}
          <Separator className="my-8" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-sky-200 bg-sky-50/50 p-6 shadow-sm">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900">
                Bạn đã sẵn sàng củng cố các lỗi này?
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Chuyển ngay sang chế độ Ôn tập ngắt quãng để ghi nhớ từ vựng và khắc phục các lỗi ngữ pháp vừa phát hiện.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-xl font-bold shadow-sm">
                <Link href="/dashboard/review" className="inline-flex items-center gap-2">
                  <span>Ôn các lỗi từ bài này</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl font-bold">
                <Link href="/dashboard/new">Viết bài luận mới</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
