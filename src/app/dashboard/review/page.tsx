import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listDueLearningItems,
  listQuickLearningItems,
  listUploadedQuickLearningItems,
} from "@/server/learning/learning.service";
import type { UploadedQuizType } from "@/server/learning/learning.contract";

import { ReviewSession } from "./review-session";

type ReviewPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
    quizType?: string | string[];
    topic?: string | string[];
  }>;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const query = await searchParams;
  const isQuickMode = query.mode === "quick";
  const isUploadedMode = query.mode === "upload";
  const topic = typeof query.topic === "string" ? query.topic : undefined;
  const quizType: UploadedQuizType | undefined =
    query.quizType === "COLLOCATION" ||
    query.quizType === "TOPIC_VOCABULARY" ||
    query.quizType === "PARAPHRASE" ||
    query.quizType === "SYNONYM" ||
    query.quizType === "TEMPLATE"
      ? (query.quizType as UploadedQuizType)
      : undefined;

  const uploadedQuizLabel =
    quizType === "COLLOCATION"
      ? "Collocation Quiz"
      : quizType === "TOPIC_VOCABULARY"
        ? "Từ vựng chuyên đề"
        : quizType === "SYNONYM"
          ? "Cặp Synonym"
          : quizType === "TEMPLATE"
            ? "Writing Template"
            : "Paraphrase Quiz";

  const items = isUploadedMode
    ? await listUploadedQuickLearningItems(session.user.id, topic, quizType)
    : isQuickMode
      ? await listQuickLearningItems(session.user.id)
      : await listDueLearningItems(session.user.id);

  const title = isUploadedMode
    ? topic?.split(" — ")[0] ?? "Bộ đề tự tải lên"
    : isQuickMode
    ? "Luyện nhanh (Quick Quiz)"
    : "Ôn tập ngắt quãng hôm nay";

  const description = isUploadedMode
    ? quizType === "COLLOCATION"
      ? "Luyện tập phản xạ ghép cụm Collocation tự nhiên theo chủ đề."
      : quizType === "TOPIC_VOCABULARY"
        ? "Học và kiểm tra từ vựng chuyên đề theo ngữ cảnh bài thi."
        : quizType === "PARAPHRASE"
          ? "Học theo 3 bước: nhận diện nghĩa, gợi nhớ cụm từ và ứng dụng vào câu."
          : quizType === "TEMPLATE"
            ? "Nhìn chức năng tiếng Việt và tự gõ lại câu template B2 tương ứng."
            : "Đọc nghĩa tiếng Việt và tự nhập cụm từ tiếng Anh tương ứng."
    : isQuickMode
    ? "Luyện tập tự do các cụm từ Bạn đã lưu bằng cách chọn đáp án hoặc tự gõ."
    : "Ôn luyện các cụm từ và lỗi sai ngữ pháp đến hạn để đưa vào trí nhớ dài hạn.";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Refined Page Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground -ml-2 rounded-lg gap-1"
            >
              <Link href="/dashboard/learning">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                <span>Thư viện</span>
              </Link>
            </Button>
            <span className="text-slate-300">/</span>
            <Badge variant="secondary" className="font-semibold text-xs">
              {isUploadedMode ? uploadedQuizLabel : isQuickMode ? "Luyện nhanh" : "Ôn tập định kỳ"}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {items.length} nội dung
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            {description}
          </p>
        </div>
      </div>

      <ReviewSession
        initialItems={items}
        sessionMode={isUploadedMode ? "UPLOADED" : isQuickMode ? "QUICK" : "MIXED"}
        uploadedQuizType={quizType}
      />
    </div>
  );
}
