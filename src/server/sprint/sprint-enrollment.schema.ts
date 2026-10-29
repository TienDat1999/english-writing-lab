import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSprintEnrollmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    sprintSlug: { type: String, required: true, default: "vstep-b2-30-day-sprint" },
    status: { type: String, enum: ["ACTIVE", "PAUSED", "COMPLETED"], default: "ACTIVE" },
    currentDay: { type: Number, required: true, min: 1, max: 30, default: 1 },
    completedDays: { type: [Number], default: [] },
    streak: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "user_sprint_enrollments" }
);

userSprintEnrollmentSchema.index({ userId: 1, sprintSlug: 1 }, { unique: true });

export type UserSprintEnrollmentDoc = InferSchemaType<typeof userSprintEnrollmentSchema>;

export const UserSprintEnrollment =
  models.UserSprintEnrollment ||
  model("UserSprintEnrollment", userSprintEnrollmentSchema);
