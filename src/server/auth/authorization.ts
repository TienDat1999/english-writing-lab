import "server-only";

import { Types } from "mongoose";

import { connectMongoose } from "@/server/db/mongoose";

import {
  AuthorizationConflictError,
  AuthorizationTargetNotFoundError,
  ForbiddenError,
} from "./authorization.errors";
import {
  type ApplicationPermission,
  type ApplicationRole,
  permissionsForRoles,
  type StaffRole,
} from "./authorization.constants";
import {
  revokeStaffRolesSchema,
  setStaffRolesSchema,
  type SetStaffRolesInput,
} from "./authorization.contract";
import { StaffRoleAssignment, StaffRoleEvent } from "./staff-role.schema";

function objectId(value: string) {
  if (!Types.ObjectId.isValid(value)) throw new ForbiddenError();
  return new Types.ObjectId(value);
}

export async function getAuthorizationSnapshot(userId: string) {
  await connectMongoose();
  const id = objectId(userId);
  const assignment = await StaffRoleAssignment.findOne({
    userId: id,
    status: "ACTIVE",
  }).lean<{ roles: StaffRole[] }>();
  const roles = new Set<ApplicationRole>(["LEARNER", ...(assignment?.roles ?? [])]);
  const permissions = permissionsForRoles(roles);

  return {
    userId,
    objectId: id,
    roles,
    permissions,
    isAdmin: roles.has("ADMIN"),
  };
}

export async function requirePermission(
  userId: string,
  permission: ApplicationPermission,
) {
  const authorization = await getAuthorizationSnapshot(userId);
  if (!authorization.permissions.has(permission)) throw new ForbiddenError();
  return authorization;
}

export async function setStaffRoles(
  actorUserId: string,
  targetUserId: string,
  input: SetStaffRolesInput,
) {
  const actor = await requirePermission(actorUserId, "STAFF_ROLE_MANAGE");
  const parsed = setStaffRolesSchema.parse(input);
  const targetId = objectId(targetUserId);
  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const targetUser = await mongoose.connection.collection("users").findOne(
        { _id: targetId },
        { projection: { _id: 1 }, session },
      );
      if (!targetUser) throw new AuthorizationTargetNotFoundError();

      const current = await StaffRoleAssignment.findOne({ userId: targetId }).session(session);
      const previousRoles = current?.status === "ACTIVE" ? current.roles : [];
      if (previousRoles.includes("ADMIN") && !parsed.roles.includes("ADMIN")) {
        const adminCount = await StaffRoleAssignment.countDocuments({
          status: "ACTIVE",
          roles: "ADMIN",
        }).session(session);
        if (adminCount <= 1) {
          throw new AuthorizationConflictError("The last active Admin cannot be removed.");
        }
      }

      const assignment = await StaffRoleAssignment.findOneAndUpdate(
        { userId: targetId },
        {
          $set: {
            roles: parsed.roles,
            status: "ACTIVE",
            reason: parsed.reason,
            grantedBy: actor.objectId,
            revokedBy: null,
            revokedAt: null,
          },
        },
        { new: true, upsert: true, session, setDefaultsOnInsert: true },
      );
      await StaffRoleEvent.create([{
        targetUserId: targetId,
        actorUserId: actor.objectId,
        eventType: previousRoles.length === 0 ? "ASSIGNED" : "UPDATED",
        previousRoles,
        nextRoles: parsed.roles,
        reason: parsed.reason,
        occurredAt: new Date(),
      }], { session });

      return {
        userId: targetUserId,
        roles: assignment.roles,
        status: assignment.status,
      };
    });
  } finally {
    await session.endSession();
  }
}

export async function revokeStaffRoles(
  actorUserId: string,
  targetUserId: string,
  input: unknown,
) {
  const actor = await requirePermission(actorUserId, "STAFF_ROLE_MANAGE");
  const parsed = revokeStaffRolesSchema.parse(input);
  const targetId = objectId(targetUserId);
  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const assignment = await StaffRoleAssignment.findOne({
        userId: targetId,
        status: "ACTIVE",
      }).session(session);
      if (!assignment) throw new AuthorizationTargetNotFoundError();

      if (assignment.roles.includes("ADMIN")) {
        const adminCount = await StaffRoleAssignment.countDocuments({
          status: "ACTIVE",
          roles: "ADMIN",
        }).session(session);
        if (adminCount <= 1) {
          throw new AuthorizationConflictError("The last active Admin cannot be revoked.");
        }
      }

      const previousRoles = [...assignment.roles];
      assignment.set({
        status: "REVOKED",
        reason: parsed.reason,
        revokedBy: actor.objectId,
        revokedAt: new Date(),
      });
      await assignment.save({ session });
      await StaffRoleEvent.create([{
        targetUserId: targetId,
        actorUserId: actor.objectId,
        eventType: "REVOKED",
        previousRoles,
        nextRoles: [],
        reason: parsed.reason,
        occurredAt: new Date(),
      }], { session });

      return { userId: targetUserId, roles: [] as StaffRole[], status: "REVOKED" as const };
    });
  } finally {
    await session.endSession();
  }
}
