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

export async function evaluateWritingTemplateAttempt(
  userId: string,
  learningItemId: string,
  learnerAnswer: string,
) {
  await connectMongoose();
  const item = await LearningItem.findOne({
    _id: requireObjectId(learningItemId),
    userId: requireObjectId(userId),
    sourceType: "UPLOADED_QUIZ",
    quizType: "TEMPLATE",
    deletedAt: null,
  }).lean();

  if (!item || !item.applicationPromptVi) {
    throw new ResourceNotFoundError();
  }

  const env = getAiEnv();
  const gateway = new OpenAiTranslationReviewGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL);
  const evaluation = await gateway.evaluate({
    sourceVi: item.applicationPromptVi,
    referenceEn: item.answerText,
    learnerAnswer,
    mode: "WRITING_TEMPLATE",
    writingFunctionVi: item.promptText,
  });
  const rating = ratingFromScore(evaluation.score);
  const updatedItem = await reviewLearningItem(userId, learningItemId, rating, {
    learnerAnswer,
    evaluation,
  });

  return { evaluation, item: updatedItem };
}
