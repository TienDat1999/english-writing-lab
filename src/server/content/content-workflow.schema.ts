import { Schema, model, models, type InferSchemaType } from "mongoose";

import {
  contentOutboxStatuses,
  publicationEventTypes,
  reviewCommentSeverities,
} from "./content.constants";

const lessonReviewCommentSchema = new Schema(
  {
    lessonVersionId: {
      type: Schema.Types.ObjectId,
      ref: "LessonVersion",
      required: true,
      index: true,
    },
    authorId: { type: Schema.Types.ObjectId, required: true },
    severity: { type: String, enum: reviewCommentSeverities, required: true },
    message: { type: String, required: true, trim: true },
    resolvedBy: { type: Schema.Types.ObjectId, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "lesson_review_comments" },
);

lessonReviewCommentSchema.index({ lessonVersionId: 1, severity: 1, resolvedAt: 1 });

const lessonPublicationEventSchema = new Schema(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    lessonVersionId: {
      type: Schema.Types.ObjectId,
      ref: "LessonVersion",
      required: true,
    },
    eventType: { type: String, enum: publicationEventTypes, required: true },
    actorId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, default: "", trim: true },
    previousVersionId: { type: Schema.Types.ObjectId, default: null },
    occurredAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "lesson_publication_events" },
);

lessonPublicationEventSchema.index({ lessonId: 1, occurredAt: -1 });

const contentOutboxEventSchema = new Schema(
  {
    aggregateType: { type: String, enum: ["LESSON"], required: true },
    aggregateId: { type: Schema.Types.ObjectId, required: true, index: true },
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: contentOutboxStatuses, default: "PENDING" },
    attempts: { type: Number, min: 0, default: 0 },
    availableAt: { type: Date, default: Date.now },
    publishedAt: { type: Date, default: null },
    lastError: { type: String, default: null },
  },
  { timestamps: true, collection: "content_outbox_events" },
);

contentOutboxEventSchema.index({ status: 1, availableAt: 1, createdAt: 1 });

export type LessonReviewCommentDocument = InferSchemaType<
  typeof lessonReviewCommentSchema
>;
export type LessonPublicationEventDocument = InferSchemaType<
  typeof lessonPublicationEventSchema
>;
export type ContentOutboxEventDocument = InferSchemaType<
  typeof contentOutboxEventSchema
>;

export const LessonReviewComment =
  models.LessonReviewComment ??
  model("LessonReviewComment", lessonReviewCommentSchema);
export const LessonPublicationEvent =
  models.LessonPublicationEvent ??
  model("LessonPublicationEvent", lessonPublicationEventSchema);
export const ContentOutboxEvent =
  models.ContentOutboxEvent ?? model("ContentOutboxEvent", contentOutboxEventSchema);
