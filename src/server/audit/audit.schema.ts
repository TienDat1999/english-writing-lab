import { Schema, model, models } from "mongoose";

import { contentAuditActions } from "./audit.constants";

const contentAuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, required: true, index: true },
    resourceType: { type: String, enum: ["LESSON"], required: true },
    resourceId: { type: Schema.Types.ObjectId, required: true, index: true },
    lessonVersionId: { type: Schema.Types.ObjectId, default: null, index: true },
    action: { type: String, enum: contentAuditActions, required: true },
    beforeSummary: { type: Schema.Types.Mixed, default: null },
    afterSummary: { type: Schema.Types.Mixed, default: null },
    reason: { type: String, default: "", trim: true, maxlength: 2_000 },
    occurredAt: { type: Date, required: true, immutable: true },
  },
  {
    collection: "content_audit_logs",
    timestamps: { createdAt: true, updatedAt: false },
  },
);

contentAuditLogSchema.index({ resourceType: 1, resourceId: 1, occurredAt: -1, _id: -1 });
contentAuditLogSchema.index({ resourceType: 1, resourceId: 1, _id: -1 });
contentAuditLogSchema.index({ actorId: 1, occurredAt: -1 });

export const ContentAuditLog =
  models.ContentAuditLog ?? model("ContentAuditLog", contentAuditLogSchema);
