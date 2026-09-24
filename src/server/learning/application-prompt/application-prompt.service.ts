import "server-only";

import { Types } from "mongoose";

import { ApplicationPromptGateway } from "@/server/ai/openai/openai-application-prompt.gateway";
import { getAiEnv } from "@/config/ai-env";
import { connectMongoose } from "@/server/db/mongoose";
import { ResourceNotFoundError } from "@/server/http/errors";
import { LearningItem, type LearningItemDocument } from "../learning-item.schema";
import { toUploadedQuizView } from "../legacy/uploaded-quiz.mapper";
import { applicationPromptCache } from "./application-prompt.cache";

function requireObjectId(value: string) {
  if (!Types.ObjectId.isValid(value)) throw new ResourceNotFoundError();
  return new Types.ObjectId(value);
}

function isValidVietnamesePrompt(promptVi?: string | null): boolean {
  if (!promptVi || typeof promptVi !== "string") return false;
  const trimmed = promptVi.trim();
  if (trimmed.length < 8) return false;
  if (/^(?:Vận dụng trong ngữ cảnh|Hãy đặt|Hãy viết câu này|Dịch câu)/iu.test(trimmed)) {
    return false;
  }
  return true;
}

async function generateApplicationPrompt(item: LearningItemDocument & { _id: Types.ObjectId }) {
  if (isValidVietnamesePrompt(item.applicationPromptVi) && item.applicationReferenceEn) {
    return {
      promptVi: item.applicationPromptVi,
      referenceEn: item.applicationReferenceEn,
    };
  }

  const view = toUploadedQuizView(item);
  const avoidedItems = await LearningItem.find({
    userId: item.userId,
    _id: { $ne: item._id },
    applicationPromptVi: { $nin: [null, ""] },
    deletedAt: null,
  })
    .select("applicationPromptVi")
    .sort({ updatedAt: -1 })
    .limit(30)
    .lean();

  let generated: { promptVi: string; referenceEn: string };
  try {
    const env = getAiEnv();
    const gateway = new ApplicationPromptGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL);
    const avoidedPrompts = avoidedItems
      .map((candidate) => candidate.applicationPromptVi)
      .filter((prompt): prompt is string => Boolean(prompt) && isValidVietnamesePrompt(prompt));
    generated = await gateway.generate({
      topic: view.topicText,
      meaningVi: view.promptText,
      phraseEn: view.answerText,
      avoidedPrompts,
    });
    const normalizedAvoidedPrompts = new Set(
      avoidedPrompts.map((prompt) => prompt.toLocaleLowerCase("vi").replace(/\s+/gu, " ").trim()),
    );

    if (normalizedAvoidedPrompts.has(generated.promptVi.toLocaleLowerCase("vi").replace(/\s+/gu, " ").trim())) {
      generated = await gateway.generate({
        topic: view.topicText,
        meaningVi: view.promptText,
        phraseEn: view.answerText,
        avoidedPrompts: [...avoidedPrompts, generated.promptVi],
      });
    }
  } catch (error) {
    console.error("OpenAI prompt generation error, using fallback:", error);
    const cleanMeaning = view.promptText
      .replace(/^(?:paraphrase\s*"?[^"]+"?:\s*|synonym of\s*"?[^"]+"?:\s*|nghĩa:\s*|ý nghĩa:\s*)/iu, "")
      .replace(/^[\s_—–-]+|[\s_—–-]+$/gu, "")
      .trim();
    generated = {
      promptVi: `Trước khi hoàn thành công việc, chúng ta cần phải ${cleanMeaning || "thực hiện điều này"} một cách cẩn thận.`,
      referenceEn: `Before completing the work, we need to ${view.answerText} carefully.`,
    };
  }

  await LearningItem.updateOne(
    { _id: item._id },
    {
      $set: {
        applicationPromptVi: generated.promptVi,
        applicationReferenceEn: generated.referenceEn,
      },
    },
  );

  return generated;
}

export async function ensureApplicationPrompt(item: LearningItemDocument & { _id: Types.ObjectId }) {
  if (isValidVietnamesePrompt(item.applicationPromptVi) && item.applicationReferenceEn) {
    return {
      promptVi: item.applicationPromptVi,
      referenceEn: item.applicationReferenceEn,
    };
  }

  const requestKey = item._id.toString();
  return applicationPromptCache.getOrCreate(requestKey, () => generateApplicationPrompt(item));
}

export async function getParaphraseApplicationPrompt(
  userId: string,
  learningItemId: string,
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

  const prompt = await ensureApplicationPrompt(item);
  return { promptVi: prompt.promptVi };
}
