import { redirect } from "next/navigation";

import { getSession } from "@/server/auth/session";
import {
  getReviewCategoriesOverview,
  listDueLearningItems,
  listQuickLearningItems,
  listSubmissionLearningItems,
  listUploadedQuickLearningItems,
  type ReviewCategoryKey,
} from "@/server/learning/learning-item.service";
import type { UploadedQuizType } from "@/server/learning/learning.contract";

import { ReviewCategoryHub, ReviewCategoryPills } from "./components";
import { ReviewSession } from "./review-session";

type ReviewPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    mode?: string | string[];
    quizType?: string | string[];
    topic?: string | string[];
    view?: string | string[];
  }>;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const query = await searchParams;
  const showHub =
    query.view === "categories" ||
    (!query.category && !query.quizType && !query.mode && !query.topic);

  const overview = await getReviewCategoriesOverview(session.user.id);

  if (showHub) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <ReviewCategoryHub overview={overview} />
      </div>
    );
  }

  // Determine category
  const rawCategory = typeof query.category === "string" ? query.category : undefined;
  const rawQuizType = typeof query.quizType === "string" ? query.quizType : undefined;
  const rawMode = typeof query.mode === "string" ? query.mode : undefined;
  const topic = typeof query.topic === "string" ? query.topic : undefined;

  let categoryKey: ReviewCategoryKey = "ALL_DUE";
  if (rawCategory === "COLLOCATION" || rawQuizType === "COLLOCATION") {
    categoryKey = "COLLOCATION";
  } else if (rawCategory === "TEMPLATE" || rawQuizType === "TEMPLATE") {
    categoryKey = "TEMPLATE";
  } else if (rawCategory === "TOPIC_VOCABULARY" || rawQuizType === "TOPIC_VOCABULARY") {
    categoryKey = "TOPIC_VOCABULARY";
  } else if (rawCategory === "PARAPHRASE" || rawQuizType === "PARAPHRASE") {
    categoryKey = "PARAPHRASE";
  } else if (rawCategory === "SYNONYM" || rawQuizType === "SYNONYM") {
    categoryKey = "SYNONYM";
  } else if (rawCategory === "SUBMISSION") {
    categoryKey = "SUBMISSION";
  } else if (rawCategory === "QUICK" || rawMode === "quick") {
    categoryKey = "QUICK";
  } else if (rawCategory === "ALL_DUE" || rawMode === "all_due") {
    categoryKey = "ALL_DUE";
  } else if (rawMode === "upload") {
    categoryKey = "COLLOCATION";
  }

  const isUploadedMode =
    categoryKey === "COLLOCATION" ||
    categoryKey === "TEMPLATE" ||
    categoryKey === "TOPIC_VOCABULARY" ||
    categoryKey === "PARAPHRASE" ||
    categoryKey === "SYNONYM";

  const isQuickMode = categoryKey === "QUICK";

  const quizType: UploadedQuizType | undefined = isUploadedMode
    ? (categoryKey as UploadedQuizType)
    : undefined;

  const items = isUploadedMode
    ? await listUploadedQuickLearningItems(session.user.id, topic, quizType)
    : categoryKey === "SUBMISSION"
      ? await listSubmissionLearningItems(session.user.id, false)
      : isQuickMode
        ? await listQuickLearningItems(session.user.id)
        : await listDueLearningItems(session.user.id);

  const categoryLabels: Record<ReviewCategoryKey, string> = {
    COLLOCATION: "Collocation Quiz",
    TEMPLATE: "Writing Template",
    TOPIC_VOCABULARY: "Từ vựng chuyên đề",
    PARAPHRASE: "Paraphrase Quiz",
    SYNONYM: "Cặp Synonym",
    SUBMISSION: "Từ bài viết của Bạn",
    ALL_DUE: "Ôn tập định kỳ (SRS)",
    QUICK: "Luyện nhanh (5 phút)",
  };

  const title = topic
    ? topic.split(" — ")[0]
    : categoryKey === "COLLOCATION"
      ? "Luyện tập Collocation"
      : categoryKey === "TEMPLATE"
        ? "Luyện Writing Template B2/C1"
        : categoryKey === "TOPIC_VOCABULARY"
          ? "Từ vựng chuyên đề"
          : categoryKey === "PARAPHRASE"
            ? "Luyện Paraphrase"
            : categoryKey === "SYNONYM"
              ? "Luyện cặp từ Synonym"
              : categoryKey === "SUBMISSION"
                ? "Dịch câu & Lỗi ngữ pháp từ bài viết"
                : isQuickMode
                  ? "Luyện nhanh 5 phút"
                  : "Ôn tập ngắt quãng hôm nay";

  const description =
    categoryKey === "COLLOCATION"
      ? "Luyện tập phản xạ ghép cụm Collocation tự nhiên theo ngữ cảnh (3 bước)."
      : categoryKey === "TEMPLATE"
        ? "Nhìn chức năng tiếng Việt và tự gõ lại câu template chuẩn học thuật với AI chấm điểm."
        : categoryKey === "TOPIC_VOCABULARY"
          ? "Học và kiểm tra từ vựng chuyên đề theo ngữ cảnh bài thi (3 bước)."
          : categoryKey === "PARAPHRASE"
            ? "Học theo 3 bước: nhận diện nghĩa, gợi nhớ cụm từ và ứng dụng vào câu."
            : categoryKey === "SYNONYM"
              ? "Luyện các cặp từ đồng nghĩa kinh điển trong bài thi."
              : categoryKey === "SUBMISSION"
                ? "Ôn luyện các câu dịch và lỗi sai ngữ pháp trích xuất từ các bài viết bạn đã nộp."
                : isQuickMode
                  ? "Luyện tập tự do các cụm từ Bạn đã lưu bằng cách chọn đáp án hoặc tự gõ."
                  : "Ôn luyện các cụm từ và lỗi sai ngữ pháp đến hạn để đưa vào trí nhớ dài hạn.";

  const categoryCounts: Partial<Record<ReviewCategoryKey, number>> = {
    ALL_DUE: overview.totalDue,
  };
  for (const cat of overview.categories) {
    categoryCounts[cat.key] = cat.totalCount;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 space-y-4">
      {/* Category Switcher Pills */}
      <ReviewCategoryPills activeCategory={categoryKey} categoryCounts={categoryCounts} />

      {/* Review Session Runner */}
      <ReviewSession
        initialItems={items}
        sessionMode={isUploadedMode ? "UPLOADED" : isQuickMode ? "QUICK" : "MIXED"}
        uploadedQuizType={quizType}
        topicHeader={{
          breadcrumbLabel: categoryLabels[categoryKey],
          itemsCount: items.length,
          title,
          description,
        }}
      />
    </div>
  );
}

