import "server-only";

import {
  verifyAdminPassword,
  type AdminPasswordHash,
} from "@draftwise/auth/admin-password";
import { ObjectId } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

const maximumFailedAttempts = 5;
const lockDurationMs = 15 * 60 * 1_000;

type AdminCredentialRecord = AdminPasswordHash & {
  _id: ObjectId;
  failedAttempts: number;
  lockUntil: Date | null;
  status: "ACTIVE" | "DISABLED";
  userId: ObjectId;
  username: string;
};

function normalizeUsername(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLocaleLowerCase("en").slice(0, 64)
    : "";
}

export async function authenticateAdminCredentials(input: {
  password?: unknown;
  username?: unknown;
}) {
  const username = normalizeUsername(input.username);
  const password = typeof input.password === "string" ? input.password : "";
  if (!username || !password || password.length > 256) return null;

  const database = getMongoClient().db(getDatabaseEnv().databaseName);
  const credentials = database.collection<AdminCredentialRecord>("admin_credentials");
  const record = await credentials.findOne({ username, status: "ACTIVE" });
  if (!record) return null;

  if (record.lockUntil && record.lockUntil > new Date()) return null;
  const valid = await verifyAdminPassword(password, record);
  if (!valid) {
    const failedAttempts = (record.failedAttempts ?? 0) + 1;
    await credentials.updateOne(
      { _id: record._id },
      {
        $set: {
          failedAttempts: failedAttempts >= maximumFailedAttempts ? 0 : failedAttempts,
          lockUntil: failedAttempts >= maximumFailedAttempts
            ? new Date(Date.now() + lockDurationMs)
            : null,
          updatedAt: new Date(),
        },
      },
    );
    return null;
  }

  const assignment = await database.collection("staff_role_assignments").findOne({
    userId: record.userId,
    status: "ACTIVE",
    roles: { $in: ["CONTENT_EDITOR", "CONTENT_REVIEWER", "CONTENT_PUBLISHER", "SUPPORT", "ADMIN"] },
  });
  if (!assignment) return null;

  const user = await database.collection("users").findOne(
    { _id: record.userId },
    { projection: { email: 1, image: 1, name: 1 } },
  );
  if (!user) return null;

  await credentials.updateOne(
    { _id: record._id },
    {
      $set: {
        failedAttempts: 0,
        lastLoginAt: new Date(),
        lockUntil: null,
        updatedAt: new Date(),
      },
    },
  );

  return {
    id: user._id.toString(),
    email: typeof user.email === "string" ? user.email : null,
    image: typeof user.image === "string" ? user.image : null,
    name: typeof user.name === "string" ? user.name : username,
  };
}
