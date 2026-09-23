import "server-only";

import { staffRoles, type StaffRole } from "@draftwise/auth";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

import { requireAnyAdminPermission } from "./admin-access";
import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export type StaffMemberItem = {
  id: string;
  userId: string;
  email: string;
  name: string;
  roles: StaffRole[];
  status: "ACTIVE" | "REVOKED";
  reason: string;
  grantedByName: string;
  updatedAt: Date;
};

export async function listStaffMembers(): Promise<StaffMemberItem[]> {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  type RawStaffDoc = {
    _id: ObjectId;
    userId: ObjectId;
    roles: StaffRole[];
    status: "ACTIVE" | "REVOKED";
    reason: string;
    grantedBy: ObjectId;
    updatedAt: Date;
    user?: {
      name?: string;
      email?: string;
    };
    granter?: {
      name?: string;
      email?: string;
    };
  };

  const docs = await db.collection("staff_role_assignments").aggregate<RawStaffDoc>([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "grantedBy",
        foreignField: "_id",
        as: "granter",
      },
    },
    { $unwind: { path: "$granter", preserveNullAndEmptyArrays: true } },
    { $sort: { updatedAt: -1 } },
  ]).toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    email: doc.user?.email || "Chưa có email",
    name: doc.user?.name || "Nhân sự",
    roles: doc.roles || [],
    status: doc.status || "ACTIVE",
    reason: doc.reason || "",
    grantedByName: doc.granter?.name || doc.granter?.email || "Admin",
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  }));
}

export async function assignStaffRole(input: {
  actorUserId: string;
  email: string;
  roles: StaffRole[];
  reason: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Email người dùng không được để trống.");
  if (input.roles.length === 0) throw new Error("Cần chọn ít nhất một vai trò.");
  if (!input.reason.trim()) throw new Error("Cần nhập lý do phân quyền.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  // 1. Find user by email
  const user = await db.collection("users").findOne({ email });
  if (!user) {
    throw new Error(`Không tìm thấy tài khoản người dùng với email: ${email}`);
  }

  const targetUserId = user._id;
  const actorObjectId = ObjectId.isValid(input.actorUserId)
    ? new ObjectId(input.actorUserId)
    : targetUserId;

  // 2. Check if removing last admin
  const currentAssignment = await db
    .collection<{ roles: StaffRole[]; status: string }>("staff_role_assignments")
    .findOne({ userId: targetUserId });

  const previousRoles = currentAssignment?.status === "ACTIVE" ? currentAssignment.roles : [];
  if (previousRoles.includes("ADMIN") && !input.roles.includes("ADMIN")) {
    const adminCount = await db.collection("staff_role_assignments").countDocuments({
      status: "ACTIVE",
      roles: "ADMIN",
    });
    if (adminCount <= 1) {
      throw new Error("Không thể gỡ quyền Admin của tài khoản Admin duy nhất còn lại.");
    }
  }

  // 3. Upsert assignment
  const now = new Date();
  await db.collection("staff_role_assignments").updateOne(
    { userId: targetUserId },
    {
      $set: {
        roles: input.roles,
        status: "ACTIVE",
        reason: input.reason.trim(),
        grantedBy: actorObjectId,
        revokedBy: null,
        revokedAt: null,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  // 4. Record event
  await db.collection("staff_role_events").insertOne({
    targetUserId,
    actorUserId: actorObjectId,
    eventType: previousRoles.length === 0 ? "ASSIGNED" : "UPDATED",
    previousRoles,
    nextRoles: input.roles,
    reason: input.reason.trim(),
    occurredAt: now,
  });

  return { success: true };
}

export async function revokeStaffRole(input: {
  actorUserId: string;
  userId: string;
  reason: string;
}) {
  if (!ObjectId.isValid(input.userId)) throw new Error("ID người dùng không hợp lệ.");
  if (!input.reason.trim()) throw new Error("Cần nhập lý do thu hồi quyền.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const targetUserId = new ObjectId(input.userId);
  const actorObjectId = ObjectId.isValid(input.actorUserId)
    ? new ObjectId(input.actorUserId)
    : targetUserId;

  const currentAssignment = await db
    .collection<{ roles: StaffRole[]; status: string }>("staff_role_assignments")
    .findOne({ userId: targetUserId, status: "ACTIVE" });

  if (!currentAssignment) {
    throw new Error("Tài khoản này hiện không có quyền nhân sự nào đang active.");
  }

  if (currentAssignment.roles.includes("ADMIN")) {
    const adminCount = await db.collection("staff_role_assignments").countDocuments({
      status: "ACTIVE",
      roles: "ADMIN",
    });
    if (adminCount <= 1) {
      throw new Error("Không thể thu hồi quyền của tài khoản Admin duy nhất.");
    }
  }

  const now = new Date();
  await db.collection("staff_role_assignments").updateOne(
    { userId: targetUserId },
    {
      $set: {
        status: "REVOKED",
        reason: input.reason.trim(),
        revokedBy: actorObjectId,
        revokedAt: now,
        updatedAt: now,
      },
    },
  );

  await db.collection("staff_role_events").insertOne({
    targetUserId,
    actorUserId: actorObjectId,
    eventType: "REVOKED",
    previousRoles: currentAssignment.roles,
    nextRoles: [],
    reason: input.reason.trim(),
    occurredAt: now,
  });

  return { success: true };
}
