import { Schema, model, models, type InferSchemaType } from "mongoose";

export const learningItemTypes = [
  "VOCABULARY",
  "GRAMMAR",
  "ESSAY_BLUEPRINT",
  "TRANSLATION",
  "PHRASE",
  "UPLOADED_QUIZ",
] as const;

export const masteryStatuses = [
  "NEW",
  "PRACTICING",
  "FAMILIAR",
  "MASTERED",
  "REVIEW",
] as const;

export const uploadedQuizTypes = [
  "COLLOCATION",
  "TOPIC_VOCABULARY",
  "PARAPHRASE",
  "SYNONYM",
  "TEMPLATE",
] as const;

const learningItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    sourceSubmissionId: { type: Schema.Types.ObjectId, default: null },
    sourceType: { type: String, enum: learningItemTypes, required: true },
    sourceIndex: { type: Number, default: null },
    fingerprint: { type: String, required: true },
    title: { type: String, required: true },
    topicText: { type: String, default: "" },
    quizType: { type: String, enum: uploadedQuizTypes, default: null },
    promptText: { type: String, required: true },
    answerText: { type: String, required: true },
    hintVi: { type: String, default: "" },
    contextText: { type: String, default: "" },
    applicationPromptVi: { type: String, default: "" },
    applicationReferenceEn: { type: String, default: "" },
    status: { type: String, enum: masteryStatuses, default: "NEW" },
    repetitions: { type: Number, min: 0, default: 0 },
    intervalDays: { type: Number, min: 0, default: 0 },
    easeFactor: { type: Number, min: 1.3, default: 2.5 },
    nextReviewAt: { type: Date, default: Date.now, index: true },
    lastReviewedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "learning_items" },
);

learningItemSchema.index({ userId: 1, fingerprint: 1 }, { unique: true });
learningItemSchema.index({ userId: 1, nextReviewAt: 1, deletedAt: 1 });
learningItemSchema.index({ userId: 1, deletedAt: 1, sourceType: 1, nextReviewAt: 1, createdAt: -1 });
learningItemSchema.index({ userId: 1, deletedAt: 1, sourceType: 1, quizType: 1, topicText: 1 });
learningItemSchema.index({ userId: 1, deletedAt: 1, sourceType: 1, title: 1, promptText: 1 });

export type LearningItemDocument = InferSchemaType<typeof learningItemSchema>;

export const LearningItem =
  models.LearningItem ?? model("LearningItem", learningItemSchema);
