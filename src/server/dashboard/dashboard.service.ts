import "server-only";

import { Types } from "mongoose";

import { connectMongoose } from "@/server/db/mongoose";
import { getLearningStats } from "@/server/learning/learning.service";
import { Submission } from "@/server/submissions/submission.schema";
import { listSubmissions, type SubmissionListItem } from "@/server/submissions/submission.service";

export type DashboardPrimaryAction = {
  type: "REVIEW_DUE" | "FIRST_ESSAY" | "WRITE_NEW";
  badge: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline" | "success";
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export type DashboardOverview = {
  submissions: SubmissionListItem[];
  learningStats: {
    total: number;
    due: number;
    mastered: number;
    quick: number;
    uploaded: number;
  };
  latestBand: number | null;
  masteryRate: number;
  primaryAction: DashboardPrimaryAction;
  focusWeaknesses: string[];
  recentStrengths: string[];
  lastAnalyzedSubmissionId: string | null;
  lastAnalyzedSubmission: {
    id: string;
    taskType: "TASK_1" | "TASK_2";
    band: number | null;
    submittedAt: Date;
    promptText?: string;
  } | null;
};

export async function getDashboardOverview(userId: string): Promise<DashboardOverview> {
  await connectMongoose();
  const ownerId = new Types.ObjectId(userId);

  const [submissions, learningStats, latestCompletedSubmission] = await Promise.all([
    listSubmissions(userId),
    getLearningStats(userId),
    Submission.findOne({
      userId: ownerId,
      deletedAt: null,
      status: "COMPLETED",
      analysis: { $ne: null },
    })
      .sort({ createdAt: -1 })
      .select({
        taskType: 1,
        promptText: 1,
        createdAt: 1,
        "analysis.estimatedOverallBand": 1,
        "analysis.structuralWeaknesses": 1,
        "analysis.strengths": 1,
        "analysis.summaryVi": 1,
      })
      .lean(),
  ]);

  const latestBand = latestCompletedSubmission?.analysis?.estimatedOverallBand ?? null;
  const focusWeaknesses = latestCompletedSubmission?.analysis?.structuralWeaknesses ?? [];
  const recentStrengths = latestCompletedSubmission?.analysis?.strengths ?? [];
  const lastAnalyzedSubmissionId = latestCompletedSubmission?._id?.toString() ?? null;
  const lastAnalyzedSubmission = latestCompletedSubmission
    ? {
        id: latestCompletedSubmission._id.toString(),
        taskType: ((latestCompletedSubmission as { taskType?: "TASK_1" | "TASK_2" }).taskType ?? "TASK_2") as "TASK_1" | "TASK_2",
        band: latestCompletedSubmission.analysis?.estimatedOverallBand ?? null,
        submittedAt: (latestCompletedSubmission as { createdAt: Date }).createdAt,
        promptText: (latestCompletedSubmission as { promptText?: string }).promptText,
      }
    : null;

  const masteryRate =
    learningStats.total > 0
      ? Math.round((learningStats.mastered / learningStats.total) * 100)
      : 0;

  let primaryAction: DashboardPrimaryAction;

  if (learningStats.due > 0) {
    primaryAction = {
      type: "REVIEW_DUE",
      badge: "Việc cần làm hôm nay",
      badgeVariant: "destructive",
      title: `Bạn có ${learningStats.due} nội dung cần ôn tập hôm nay`,
      description:
        "Các từ vựng và cấu trúc trích xuất từ bài viết của Bạn đã đến chu kỳ ôn tập. Ôn tập đúng hạn giúp ghi nhớ sâu và tự tin áp dụng vào bài viết tới.",
      ctaLabel: `Ôn tập ngay (${learningStats.due} mục)`,
      ctaHref: "/dashboard/review",
    };
  } else if (submissions.length === 0) {
    primaryAction = {
      type: "FIRST_ESSAY",
      badge: "Khởi đầu",
      badgeVariant: "secondary",
      title: "Bắt đầu hành trình nâng band IELTS Writing của Bạn",
      description:
        "Nộp bài viết đầu tiên để AI phân tích toàn diện 4 tiêu chí chấm thi, chỉ ra điểm mạnh, lỗi cấu trúc và lưu từ vựng vào kho học cá nhân.",
      ctaLabel: "Viết bài luận đầu tiên",
      ctaHref: "/dashboard/new",
    };
  } else {
    primaryAction = {
      type: "WRITE_NEW",
      badge: "Tuyệt vời",
      badgeVariant: "success",
      title: "Bạn đã hoàn thành mọi mục ôn tập hôm nay!",
      description:
        "Không còn nội dung nào tồn đọng. Hãy viết một bài luận mới để áp dụng các điểm ngữ pháp & từ vựng vừa củng cố, tiếp tục bứt phá band điểm.",
      ctaLabel: "Viết bài luận mới",
      ctaHref: "/dashboard/new",
    };
  }

  return {
    submissions,
    learningStats,
    latestBand,
    masteryRate,
    primaryAction,
    focusWeaknesses,
    recentStrengths,
    lastAnalyzedSubmissionId,
    lastAnalyzedSubmission,
  };
}
