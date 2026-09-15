import { Schema, model, models } from "mongoose";

export const reviewRatings = ["AGAIN", "HARD", "GOOD", "EASY"] as const;

const reviewAttemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    learningItemId: { type: Schema.Types.ObjectId, required: true, index: true },
    rating: { type: String, enum: reviewRatings, required: true },
    previousStatus: { type: String, required: true },
    nextStatus: { type: String, required: true },
    previousIntervalDays: { type: Number, required: true },
    nextIntervalDays: { type: Number, required: true },
    learnerAnswer: { type: String, default: null },
    score: { type: Number, min: 0, max: 100, default: null },
    feedbackVi: { type: String, default: null },
    correctedTranslation: { type: String, default: null },
    upgradedTranslation: { type: String, default: null },
    reviewedAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "review_attempts" },
);

export const ReviewAttempt =
  models.ReviewAttempt ?? model("ReviewAttempt", reviewAttemptSchema);
