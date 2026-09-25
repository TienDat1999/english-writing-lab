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
  const targetPhrase = (typedItem.answerText || view.answerText || "").trim();

  let applicationPrompt: { promptVi: string; referenceEn: string };
  try {
    applicationPrompt = await ensureApplicationPrompt(typedItem);
  } catch (err) {
    console.error("Failed to ensure application prompt, using fallback:", err);
    applicationPrompt = {
      promptVi: typedItem.promptText || view.promptText || "Hãy viết một câu tiếng Anh áp dụng cụm từ sau:",
      referenceEn: targetPhrase,
    };
  }

  const sourceVi = applicationPrompt.promptVi || typedItem.promptText || view.promptText || "";
  const referenceEn = applicationPrompt.referenceEn || targetPhrase;

  let evaluation: import("@/server/ai/openai/openai-translation.gateway").TranslationEvaluation;
  try {
    const env = getAiEnv();
    const gateway = new OpenAiTranslationReviewGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL);
    evaluation = await gateway.evaluate({
      sourceVi,
      referenceEn,
      learnerAnswer,
      requiredPhrase: targetPhrase,
    });
  } catch (err) {
    console.error("OpenAI evaluation failed, using rule-based heuristic fallback:", err);
    const normalizedAnswer = learnerAnswer.toLocaleLowerCase("en");
    const normalizedPhrase = targetPhrase.toLocaleLowerCase("en");
    const hasPhrase = normalizedPhrase.length > 0 && normalizedAnswer.includes(normalizedPhrase);

    evaluation = {
      score: hasPhrase ? 85 : 60,
      meaningScore: hasPhrase ? 85 : 60,
      grammarScore: hasPhrase ? 85 : 70,
      naturalnessScore: hasPhrase ? 80 : 65,
      feedbackVi: hasPhrase
        ? "Câu của bạn diễn đạt tự nhiên và đã áp dụng chính xác cụm từ mục tiêu."
        : `Câu của bạn cần sử dụng cụm từ bắt buộc: "${targetPhrase}". Hãy đảm bảo sử dụng cụm từ này trong câu.`,
      correctedTranslation: hasPhrase ? learnerAnswer : referenceEn,
      upgradedTranslation: referenceEn,
      patternTipVi: `Mẫu câu gợi ý với [${targetPhrase}]: hãy dùng trong ngữ cảnh phù hợp.`,
      paraphraseExampleEn: referenceEn,
      grammarIssues: hasPhrase ? [] : [
        {
          sourceQuote: learnerAnswer.slice(0, Math.min(30, learnerAnswer.length)),
          correction: targetPhrase,
          explanationVi: `Chưa chứa cụm từ bắt buộc "${targetPhrase}".`,
        },
      ],
      vocabularyUpgrades: [],
      writingAlternatives: [
        {
          label: "Câu gợi ý chuẩn:",
          sentenceEn: referenceEn,
          noteVi: `Áp dụng cụm từ "${targetPhrase}"`,
        },
      ],
    };
  }

  const normalizedAnswer = learnerAnswer.toLocaleLowerCase("en");
  const normalizedPhrase = targetPhrase.toLocaleLowerCase("en");
  const usesRequiredPhrase = normalizedPhrase.length > 0
    ? normalizedAnswer.includes(normalizedPhrase)
    : true;

  const isCorrect =
    usesRequiredPhrase &&
    evaluation.score >= 70 &&
    evaluation.meaningScore >= 70 &&
    evaluation.grammarScore >= 70 &&
    (!evaluation.grammarIssues || evaluation.grammarIssues.length === 0);

  return { evaluation, isCorrect, usesRequiredPhrase };
}
