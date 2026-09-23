import "server-only";

import {
  hasAdminAppAccess,
  permissionsForRoles,
  type ApplicationRole,
  type StaffRole,
} from "@draftwise/auth";
import { ObjectId } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

type StaffRoleAssignment = {
  roles?: StaffRole[];
  status?: "ACTIVE" | "REVOKED";
};

export async function getAuthorizationSnapshot(userId: string) {
  const roles = new Set<ApplicationRole>(["LEARNER"]);

  if (ObjectId.isValid(userId)) {
    const client = getMongoClient();
    const { databaseName } = getDatabaseEnv();
    const assignment = await client
      .db(databaseName)
      .collection<StaffRoleAssignment>("staff_role_assignments")
      .findOne({ userId: new ObjectId(userId), status: "ACTIVE" });

    for (const role of assignment?.roles ?? []) roles.add(role);
  }

  return {
    canAccessAdmin: hasAdminAppAccess(roles),
    permissions: permissionsForRoles(roles),
    roles,
  };
}
