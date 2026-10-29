import { Schema, model, models, type InferSchemaType } from "mongoose";

const userDayProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    sprintSlug: { type: String, required: true, default: "vstep-b2-30-day-sprint" },
    dayNumber: { type: Number, required: true, min: 1, max: 30 },
    status: {
      type: String,
      enum: ["LOCKED", "IN_PROGRESS", "COMPLETED"],
      default: "LOCKED",
    },
    stations: {
      vocab: {
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
      },
      writing: {
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        submissionText: { type: String, default: "" },
        wordCount: { type: Number, default: 0 },
        timeSpentSeconds: { type: Number, default: 0 },
      },
      speaking: {
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        durationSeconds: { type: Number, default: 0 },
        deadAirCount: { type: Number, default: 0 },
        notes: { type: String, default: "" },
      },
      audit: {
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        checkedItems: { type: [String], default: [] },
        mistakesNote: { type: String, default: "" },
      },
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "user_day_progress" }
);

userDayProgressSchema.index({ userId: 1, sprintSlug: 1, dayNumber: 1 }, { unique: true });

export type UserDayProgressDoc = InferSchemaType<typeof userDayProgressSchema>;

export const UserDayProgress =
  models.UserDayProgress ||
  model("UserDayProgress", userDayProgressSchema);
