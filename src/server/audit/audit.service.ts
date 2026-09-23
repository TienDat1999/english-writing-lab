import "server-only";

import { type ClientSession, Types } from "mongoose";

import { getAuthorizationSnapshot } from "@/server/auth/authorization";
import { ForbiddenError } from "@/server/auth/authorization.errors";
import { connectMongoose } from "@/server/db/mongoose";
import { ResourceNotFoundError } from "@/server/http/errors";
import { Lesson } from "@/server/content/lesson.schema";

import type { AuditSummary, ContentAuditAction } from "./audit.constants";
import { auditHistoryQuerySchema } from "./audit.contract";
import { ContentAuditLog } from "./audit.schema";

export async function appendContentAudit(
  session: ClientSession,
  input: {
    action: ContentAuditAction;
    actorId: Types.ObjectId;
    afterSummary?: AuditSummary | null;
    beforeSummary?: AuditSummary | null;
    lessonVersionId?: Types.ObjectId | null;
    reason?: string;
    resourceId: Types.ObjectId;
  },
) {
  await ContentAuditLog.create(
    [{
      ...input,
      afterSummary: input.afterSummary ?? null,
      beforeSummary: input.beforeSummary ?? null,
      lessonVersionId: input.lessonVersionId ?? null,
      occurredAt: new Date(),
      reason: input.reason ?? "",
      resourceType: "LESSON",
    }],
    { session },
  );
}

export async function listLessonAuditHistory(
  actorUserId: string,
  lessonId: string,
  query: unknown,
) {
  const authorization = await getAuthorizationSnapshot(actorUserId);
  const canViewAll = authorization.permissions.has("AUDIT_VIEW_ALL")
    || authorization.permissions.has("AUDIT_VIEW_CONTENT");
  const canViewOwn = authorization.permissions.has("AUDIT_VIEW_OWN");
  if (!canViewAll && !canViewOwn) throw new ForbiddenError();

  await connectMongoose();
  if (!Types.ObjectId.isValid(lessonId)) throw new ResourceNotFoundError();
  const resourceId = new Types.ObjectId(lessonId);
  if (!(await Lesson.exists({ _id: resourceId }))) throw new ResourceNotFoundError();

  const parsed = auditHistoryQuerySchema.parse(query);
  const filter: Record<string, unknown> = { resourceType: "LESSON", resourceId };
  if (!canViewAll) filter.actorId = authorization.objectId;
  if (parsed.cursor) {
    filter._id = { $lt: new Types.ObjectId(parsed.cursor) };
  }

  const records = await ContentAuditLog.find(filter)
    .sort({ _id: -1 })
    .limit(parsed.limit + 1)
    .lean();
  const hasMore = records.length > parsed.limit;
  const page = hasMore ? records.slice(0, parsed.limit) : records;

  return {
    items: page.map((record) => ({
      id: record._id.toString(),
      action: record.action,
      actorId: record.actorId.toString(),
      lessonId: record.resourceId.toString(),
      lessonVersionId: record.lessonVersionId?.toString() ?? null,
      beforeSummary: record.beforeSummary ?? null,
      afterSummary: record.afterSummary ?? null,
      reason: record.reason,
      occurredAt: record.occurredAt.toISOString(),
    })),
    nextCursor: hasMore ? page.at(-1)?._id.toString() ?? null : null,
  };
}
