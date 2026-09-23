import { z } from "zod";

import { reviewRatings } from "./review-attempt.schema";
import { uploadedQuizTypes } from "./learning-item.schema";

export const createLearningItemSchema = z.object({
  submissionId: z.string().min(1),
  sourceType: z.enum(["VOCABULARY", "GRAMMAR", "ESSAY_BLUEPRINT", "TRANSLATION"]),
  sourceIndex: z.number().int().min(0).nullable().default(null),
});

export const reviewLearningItemSchema = z.object({
  rating: z.enum(reviewRatings),
});

export const evaluateTranslationSchema = z.object({
  learnerAnswer: z.string().trim().min(2).max(2_000),
});

export const createPhraseLearningItemSchema = z.object({
  sourceLearningItemId: z.string().min(1),
  phrase: z.string().trim().min(1).max(200),
  contextText: z.string().trim().min(1).max(2_000),
});

export const importQuickLearningItemsSchema = z.object({
  quizType: z.enum(uploadedQuizTypes),
  items: z.array(z.object({
    topic: z.string().trim().min(1).max(200),
    prompt: z.string().trim().min(1).max(500),
    answer: z.string().trim().min(1).max(200),
    context: z.string().trim().max(2_000).default(""),
    applicationPromptVi: z.string().trim().max(1_000).default(""),
  })).min(1).max(1_000),
});

export type CreateLearningItemInput = z.infer<typeof createLearningItemSchema>;
export type CreatePhraseLearningItemInput = z.infer<typeof createPhraseLearningItemSchema>;
export type ImportQuickLearningItemsInput = z.infer<typeof importQuickLearningItemsSchema>;
export type UploadedQuizType = ImportQuickLearningItemsInput["quizType"];
export type ReviewRating = z.infer<typeof reviewLearningItemSchema>["rating"];
