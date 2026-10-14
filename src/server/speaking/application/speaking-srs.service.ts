import "server-only"

import { createHash } from "crypto"
import { Types } from "mongoose"
import { connectMongoose } from "@/server/db/mongoose"
import { LearningItem } from "@/server/learning/learning-item.schema"

export interface SaveSpeakingSrsInput {
  userId: string
  sourceType: "VOCABULARY" | "GRAMMAR" | "PHRASE"
  title: string
  topicText?: string
  quizType?: "COLLOCATION" | "TOPIC_VOCABULARY" | "PARAPHRASE" | "SYNONYM" | "TEMPLATE" | null
  promptText: string
  answerText: string
  hintVi?: string
  contextText?: string
}

export class SpeakingSrsService {
  async saveItemToSrs(input: SaveSpeakingSrsInput) {
    await connectMongoose()

    if (!Types.ObjectId.isValid(input.userId)) {
      throw new Error("Invalid userId")
    }

    const normalizedAnswer = input.answerText.trim().toLowerCase()
    const fingerprint = createHash("sha256")
      .update(`${input.userId}:${input.sourceType}:${normalizedAnswer}`)
      .digest("hex")

    const item = await LearningItem.findOneAndUpdate(
      {
        userId: new Types.ObjectId(input.userId),
        fingerprint,
      },
      {
        $setOnInsert: {
          userId: new Types.ObjectId(input.userId),
          sourceSubmissionId: null,
          sourceType: input.sourceType,
          sourceIndex: null,
          fingerprint,
          title: input.title.trim(),
          topicText: input.topicText?.trim() || "Speaking Practice",
          quizType: input.quizType || null,
          promptText: input.promptText.trim(),
          answerText: input.answerText.trim(),
          hintVi: input.hintVi?.trim() || "",
          contextText: input.contextText?.trim() || "",
          applicationPromptVi: "",
          applicationReferenceEn: "",
          status: "NEW",
          repetitions: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          nextReviewAt: new Date(),
          lastReviewedAt: null,
          deletedAt: null,
        },
      },
      {
        upsert: true,
        new: true,
      },
    ).lean()

    return {
      success: true,
      item,
    }
  }
}

export const speakingSrsService = new SpeakingSrsService()
