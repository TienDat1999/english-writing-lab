import { redirect } from "next/navigation";

import { getSession } from "@/server/auth/session";
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
  const session = await getSession();

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
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
      <ReviewSession
        initialItems={items}
        sessionMode={isUploadedMode ? "UPLOADED" : isQuickMode ? "QUICK" : "MIXED"}
        uploadedQuizType={quizType}
        topicHeader={{
          breadcrumbLabel: isUploadedMode ? uploadedQuizLabel : isQuickMode ? "Luyện nhanh" : "Ôn tập định kỳ",
          itemsCount: items.length,
          title,
          description,
        }}
      />
    </div>
  );
}
