import "server-only";

import { Types } from "mongoose";

import { getAiEnv } from "@/config/ai-env";
import { OpenAiTranslationReviewGateway } from "@/server/ai/openai/openai-translation.gateway";
import { connectMongoose } from "@/server/db/mongoose";
import { ResourceNotFoundError } from "@/server/http/errors";

import { LearningItem, type LearningItemDocument } from "../learning-item.schema";
import { toUploadedQuizView } from "../legacy/uploaded-quiz.mapper";
import { ensureApplicationPrompt } from "../application-prompt/application-prompt.service";

function requireObjectId(value: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new ResourceNotFoundError();
  }

  return new Types.ObjectId(value);
}

export async function evaluateParaphraseApplicationAttempt(
  userId: string,
  learningItemId: string,
  learnerAnswer: string,
) {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const itemId = requireObjectId(learningItemId);

  let item = await LearningItem.findOne({
    _id: itemId,
    userId: ownerId,
    deletedAt: null,
  }).lean();

  if (!item) {
    item = await LearningItem.findOne({
      _id: itemId,
      deletedAt: null,
    }).lean();
  }

  if (!item) {
    throw new ResourceNotFoundError();
  }

  const typedItem = item as unknown as LearningItemDocument & { _id: Types.ObjectId };
  const view = toUploadedQuizView(typedItem);

  const applicationPrompt = await ensureApplicationPrompt(typedItem);
  const env = getAiEnv();
  const gateway = new OpenAiTranslationReviewGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL);
  const evaluation = await gateway.evaluate({
    sourceVi: applicationPrompt.promptVi,
    referenceEn: applicationPrompt.referenceEn,
    learnerAnswer,
    requiredPhrase: view.answerText,
  });
  const normalizedAnswer = learnerAnswer.toLocaleLowerCase("en");
  const normalizedPhrase = view.answerText.toLocaleLowerCase("en");
  const usesRequiredPhrase = normalizedAnswer.includes(normalizedPhrase);
  const isCorrect = usesRequiredPhrase
    && evaluation.meaningScore >= 70
    && evaluation.grammarScore >= 70;

  return { evaluation, isCorrect, usesRequiredPhrase };
}
