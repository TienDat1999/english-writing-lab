import "server-only";

import { Types } from "mongoose";

import { getAiEnv } from "@/config/ai-env";
import { OpenAiTranslationReviewGateway } from "@/server/ai/openai/openai-translation.gateway";
import { connectMongoose } from "@/server/db/mongoose";
import { ResourceNotFoundError } from "@/server/http/errors";

import { LearningItem } from "../learning-item.schema";
import { ratingFromScore } from "../srs/rating-from-score";
import { reviewLearningItem } from "../srs-review.service";

function requireObjectId(value: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new ResourceNotFoundError();
  }

  return new Types.ObjectId(value);
}

export async function evaluateTranslationAttempt(
  userId: string,
  learningItemId: string,
  learnerAnswer: string,
) {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const itemId = requireObjectId(learningItemId);
  const item = await LearningItem.findOne({
    _id: itemId,
    userId: ownerId,
    sourceType: "TRANSLATION",
    deletedAt: null,
  }).lean();

  if (!item) {
    throw new ResourceNotFoundError();
  }

  const env = getAiEnv();
  const gateway = new OpenAiTranslationReviewGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL);
  const evaluation = await gateway.evaluate({
    sourceVi: item.promptText,
    referenceEn: item.answerText,
    learnerAnswer,
  });
  const rating = ratingFromScore(evaluation.score);
  const updatedItem = await reviewLearningItem(userId, learningItemId, rating, {
    learnerAnswer,
    evaluation,
  });

  return { evaluation, item: updatedItem };
}
