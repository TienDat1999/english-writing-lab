import { Schema, model, models, type InferSchemaType } from "mongoose";

import { staffRoles } from "./authorization.constants";

const staffRoleAssignmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    roles: {
      type: [String],
      enum: staffRoles,
      required: true,
      validate: {
        validator: (roles: string[]) => roles.length > 0,
        message: "A staff assignment requires at least one role.",
      },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED"],
      default: "ACTIVE",
      required: true,
    },
    reason: { type: String, required: true, trim: true },
    grantedBy: { type: Schema.Types.ObjectId, required: true },
    revokedBy: { type: Schema.Types.ObjectId, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "staff_role_assignments" },
);

staffRoleAssignmentSchema.index({ status: 1, roles: 1 });

const staffRoleEventSchema = new Schema(
  {
    targetUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    actorUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    eventType: {
      type: String,
      enum: ["BOOTSTRAPPED", "ASSIGNED", "UPDATED", "REVOKED"],
      required: true,
    },
    previousRoles: { type: [String], enum: staffRoles, default: [] },
    nextRoles: { type: [String], enum: staffRoles, default: [] },
    reason: { type: String, required: true, trim: true },
    occurredAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "staff_role_events" },
);

staffRoleEventSchema.index({ targetUserId: 1, occurredAt: -1 });

export type StaffRoleAssignmentDocument = InferSchemaType<
  typeof staffRoleAssignmentSchema
>;

export const StaffRoleAssignment =
  models.StaffRoleAssignment
  ?? model("StaffRoleAssignment", staffRoleAssignmentSchema);
export const StaffRoleEvent =
  models.StaffRoleEvent
  ?? model("StaffRoleEvent", staffRoleEventSchema);
