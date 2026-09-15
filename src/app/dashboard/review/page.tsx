import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppBrand } from "@/components/app-brand";
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
  const quizType: UploadedQuizType | undefined = query.quizType === "PARAPHRASE" || query.quizType === "SYNONYM"
    ? query.quizType
    : undefined;
  const uploadedQuizLabel = quizType === "SYNONYM" ? "Cặp Synonym" : "Paraphrase Quiz";
  const items = isUploadedMode
    ? await listUploadedQuickLearningItems(session.user.id, topic, quizType)
    : isQuickMode
      ? await listQuickLearningItems(session.user.id)
      : await listDueLearningItems(session.user.id);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur-xl">
        <div className={`mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8 ${isUploadedMode ? "h-14" : "h-20"}`}>
          <AppBrand />
          <Button asChild variant="ghost"><Link href="/dashboard/learning">← Learning library</Link></Button>
        </div>
      </header>
      <div className={`mx-auto max-w-6xl px-5 sm:px-8 ${isUploadedMode ? "py-3 lg:py-4" : "py-12 lg:py-16"}`}>
        <div className={`prep-hero prep-grid px-7 text-center text-white shadow-[0_24px_60px_rgb(20_84_205/20%)] ${isUploadedMode ? "mb-5 rounded-[1.75rem] py-4" : "mb-10 rounded-[2.25rem] py-10"}`}>
          <Badge className={`${isUploadedMode ? "mb-2" : "mb-5"} border-white/20 bg-white/10 text-white`} variant="outline">
            {isUploadedMode ? uploadedQuizLabel : isQuickMode ? "Phrase training" : "Active recall"}
          </Badge>
          <h1 className={`font-heading font-extrabold tracking-tight ${isUploadedMode ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"}`}>
            {isUploadedMode ? topic?.split(" — ")[0] ?? "Uploaded Quiz" : isQuickMode ? "Quick Quiz" : "Daily review"}
          </h1>
          <p className={`mx-auto max-w-2xl text-blue-100 ${isUploadedMode ? "mt-1 text-sm leading-5" : "mt-4 text-lg leading-8"}`}>
            {isUploadedMode
              ? quizType === "PARAPHRASE"
                ? "Học theo 3 bước: nhận diện nghĩa, gợi nhớ cụm từ và ứng dụng vào câu."
                : "Đọc nghĩa tiếng Việt và tự nhập cụm từ tiếng Anh tương ứng."
              : isQuickMode
              ? "Vào thẳng các cụm từ đã lưu và luyện bằng cách chọn đáp án hoặc tự gõ."
              : "Dịch cùng AI hoặc làm Quick Quiz bằng cách chọn đáp án và tự gõ cụm từ."}
          </p>
        </div>
        <ReviewSession
          initialItems={items}
          sessionMode={isUploadedMode ? "UPLOADED" : isQuickMode ? "QUICK" : "MIXED"}
          uploadedQuizType={quizType}
        />
      </div>
    </main>
  );
}
