import "server-only";

import { ObjectId } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

type AuditRecord = {
  _id: ObjectId;
  action: string;
  actorId: ObjectId;
  afterSummary?: Record<string, unknown> | null;
  beforeSummary?: Record<string, unknown> | null;
  lessonVersionId?: ObjectId | null;
  occurredAt: Date;
  reason?: string;
  resourceId: ObjectId;
  resourceType: "LESSON";
};

export async function listLessonAuditHistory(input: {
  actorUserId: string;
  canViewAll: boolean;
  cursor?: string;
  lessonId: string;
  limit?: number;
}) {
  if (!ObjectId.isValid(input.lessonId)) return null;
  const client = getMongoClient();
  const database = client.db(getDatabaseEnv().databaseName);
  const lessonId = new ObjectId(input.lessonId);
  const lesson = await database.collection("lessons").findOne(
    { _id: lessonId },
    { projection: { _id: 1 } },
  );
  if (!lesson) return null;

  const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);
  const filter: Record<string, unknown> = {
    resourceId: lessonId,
    resourceType: "LESSON",
  };
  if (!input.canViewAll) filter.actorId = new ObjectId(input.actorUserId);
  if (input.cursor && ObjectId.isValid(input.cursor)) {
    filter._id = { $lt: new ObjectId(input.cursor) };
  }

  const records = await database
    .collection<AuditRecord>("content_audit_logs")
    .find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .toArray();
  const hasMore = records.length > limit;
  const page = hasMore ? records.slice(0, limit) : records;
  const actorIds = [...new Set(page.map((record) => record.actorId.toString()))]
    .map((id) => new ObjectId(id));
  const actors = await database.collection("users").find(
    { _id: { $in: actorIds } },
    { projection: { name: 1, email: 1 } },
  ).toArray();
  const actorsById = new Map(
    actors.map((actor) => [
      actor._id.toString(),
      { email: typeof actor.email === "string" ? actor.email : null, name: typeof actor.name === "string" ? actor.name : null },
    ]),
  );

  return {
    items: page.map((record) => ({
      id: record._id.toString(),
      action: record.action,
      actor: actorsById.get(record.actorId.toString()) ?? { email: null, name: null },
      actorId: record.actorId.toString(),
      afterSummary: record.afterSummary ?? null,
      beforeSummary: record.beforeSummary ?? null,
      lessonVersionId: record.lessonVersionId?.toString() ?? null,
      occurredAt: record.occurredAt,
      reason: record.reason ?? "",
    })),
    nextCursor: hasMore ? page.at(-1)?._id.toString() ?? null : null,
  };
}
