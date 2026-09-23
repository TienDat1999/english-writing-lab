import "server-only";

import { ObjectId } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export type ContentReportView = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  exercisePrompt?: string;
  reportedByEmail: string;
  reason: "WRONG_ANSWER" | "TYPO" | "AUDIO_ISSUE" | "OFFENSIVE" | "OTHER";
  comment: string;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
  resolutionNote?: string;
  resolvedByName?: string;
  resolvedAt?: Date | null;
  createdAt: Date;
};

export async function listContentReports(options?: {
  status?: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
}): Promise<ContentReportView[]> {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  type RawReportDoc = {
    _id: ObjectId;
    lessonId: ObjectId;
    lessonTitle?: string;
    exercisePrompt?: string;
    reportedByEmail?: string;
    reason: "WRONG_ANSWER" | "TYPO" | "AUDIO_ISSUE" | "OFFENSIVE" | "OTHER";
    comment: string;
    status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
    resolutionNote?: string;
    resolvedBy?: ObjectId;
    resolvedAt?: Date | null;
    createdAt: Date;
    resolver?: {
      name?: string;
      email?: string;
    };
  };

  const match: Record<string, unknown> = {};
  if (options?.status) match.status = options.status;

  const docs = await db.collection("content_reports").aggregate<RawReportDoc>([
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "resolvedBy",
        foreignField: "_id",
        as: "resolver",
      },
    },
    { $unwind: { path: "$resolver", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
  ]).toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    lessonId: doc.lessonId ? doc.lessonId.toString() : "",
    lessonTitle: doc.lessonTitle || "Bài học không tên",
    exercisePrompt: doc.exercisePrompt || "",
    reportedByEmail: doc.reportedByEmail || "học viên ẩn danh",
    reason: doc.reason || "OTHER",
    comment: doc.comment || "",
    status: doc.status || "PENDING",
    resolutionNote: doc.resolutionNote || "",
    resolvedByName: doc.resolver?.name || doc.resolver?.email || "",
    resolvedAt: doc.resolvedAt ? new Date(doc.resolvedAt) : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
  }));
}

export async function updateContentReportStatus(input: {
  actorUserId: string;
  reportId: string;
  status: "INVESTIGATING" | "RESOLVED" | "DISMISSED";
  resolutionNote?: string;
}) {
  if (!ObjectId.isValid(input.reportId)) throw new Error("ID báo cáo không hợp lệ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const actorObjectId = ObjectId.isValid(input.actorUserId)
    ? new ObjectId(input.actorUserId)
    : new ObjectId();

  const now = new Date();
  await db.collection("content_reports").updateOne(
    { _id: new ObjectId(input.reportId) },
    {
      $set: {
        status: input.status,
        resolutionNote: (input.resolutionNote || "").trim(),
        resolvedBy: actorObjectId,
        resolvedAt: now,
      },
    },
  );

  return { success: true };
}
