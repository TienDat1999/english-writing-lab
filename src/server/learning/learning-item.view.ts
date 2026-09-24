import { Types } from "mongoose";

import type { LearningItemDocument } from "./learning-item.schema";
import type { UploadedQuizType } from "./learning.contract";

export type LearningSubmissionInfo = {
  id: string;
  promptText: string;
  taskType?: string;
  submittedAt?: string;
};

export type LearningItemView = {
  id: string;
  sourceSubmissionId?: string | null;
  submission?: LearningSubmissionInfo | null;
  sourceType: "VOCABULARY" | "GRAMMAR" | "ESSAY_BLUEPRINT" | "TRANSLATION" | "PHRASE" | "UPLOADED_QUIZ";
  title: string;
  topicText: string;
  quizType: UploadedQuizType | null;
  promptText: string;
  answerText: string;
  applicationPromptVi: string;
  hintVi: string;
  contextText: string;
  status: "NEW" | "PRACTICING" | "FAMILIAR" | "MASTERED" | "REVIEW";
  repetitions: number;
  intervalDays: number;
  nextReviewAt: string;
  createdAt: string;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export function toView(
  item: LearningItemDocument & { _id: Types.ObjectId },
  submissionMap?: Map<string, { promptText: string; taskType: string; submittedAt?: Date; createdAt?: Date }>,
): LearningItemView {
  const submissionIdStr = item.sourceSubmissionId ? item.sourceSubmissionId.toString() : null;
  const sub = submissionIdStr && submissionMap ? submissionMap.get(submissionIdStr) : null;

  return {
    id: item._id.toString(),
    sourceSubmissionId: submissionIdStr,
    submission: submissionIdStr && sub ? {
      id: submissionIdStr,
      promptText: sub.promptText || "Bài viết của bạn",
      taskType: sub.taskType,
      submittedAt: (sub.submittedAt || sub.createdAt || item.createdAt)?.toISOString(),
    } : null,
    sourceType: item.sourceType,
    title: item.title,
    topicText: item.topicText ?? "",
    quizType: item.quizType ?? null,
    promptText: item.promptText,
    answerText: item.sourceType === "TRANSLATION" ? "" : item.answerText,
    applicationPromptVi: item.applicationPromptVi ?? "",
    hintVi: item.hintVi ?? "",
    contextText: item.contextText ?? "",
    status: item.status,
    repetitions: item.repetitions,
    intervalDays: item.intervalDays,
    nextReviewAt: item.nextReviewAt.toISOString(),
    createdAt: (item.createdAt ?? new Date()).toISOString(),
  };
}

export function getPagination(page = 1, pageSize = 6) {
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 60) : 6,
  };
}
