import "server-only";

import { Types } from "mongoose";

import { connectMongoose } from "@/server/db/mongoose";
import { ResourceNotFoundError } from "@/server/http/errors";
import { type TranslationEvaluation } from "@/server/ai/openai/openai-translation.gateway";

import type { ReviewRating } from "./learning.contract";
import { LearningItem } from "./learning-item.schema";
import { ReviewAttempt } from "./review-attempt.schema";
import { Sm2Algorithm } from "./srs/sm2.algorithm";
import { toView, type LearningItemView } from "./learning-item.view";

function requireObjectId(value: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new ResourceNotFoundError();
  }

  return new Types.ObjectId(value);
}

export async function reviewLearningItem(
  userId: string,
  learningItemId: string,
  rating: ReviewRating,
  details?: {
    learnerAnswer: string;
    evaluation: TranslationEvaluation;
  },
): Promise<LearningItemView> {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const itemId = requireObjectId(learningItemId);
  const item = await LearningItem.findOne({
    _id: itemId,
    userId: ownerId,
    deletedAt: null,
  });

  if (!item) {
    throw new ResourceNotFoundError();
  }

  const previousStatus = item.status;
  const previousIntervalDays = item.intervalDays;
  const schedule = new Sm2Algorithm().calculate(
    { repetitions: item.repetitions, intervalDays: item.intervalDays, easeFactor: item.easeFactor, status: item.status },
    rating,
  );
  const reviewedAt = new Date();
  const nextReviewAt = new Date(
    reviewedAt.getTime() + schedule.intervalDays * 24 * 60 * 60 * 1000,
  );

  item.set({ ...schedule, lastReviewedAt: reviewedAt, nextReviewAt });
  await item.save();
  await ReviewAttempt.create({
    userId: ownerId,
    learningItemId: itemId,
    rating,
    previousStatus,
    nextStatus: schedule.status,
    previousIntervalDays,
    nextIntervalDays: schedule.intervalDays,
    learnerAnswer: details?.learnerAnswer ?? null,
    score: details?.evaluation.score ?? null,
    feedbackVi: details?.evaluation.feedbackVi ?? null,
    correctedTranslation: details?.evaluation.correctedTranslation ?? null,
    upgradedTranslation: details?.evaluation.upgradedTranslation ?? null,
    reviewedAt,
  });

  return toView(item.toObject());
}
