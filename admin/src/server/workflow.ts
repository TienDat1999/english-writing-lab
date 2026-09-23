import "server-only";

import { createHash } from "node:crypto";

import {
  approveVersionSchema,
  lifecycleReasonSchema,
  publishVersionSchema,
  requestChangesSchema,
  scheduleVersionSchema,
} from "@draftwise/content";
import { ObjectId, type ClientSession, type Db } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export class WorkflowConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowConflictError";
  }
}

export class WorkflowValidationError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(issues[0] ?? "Validation failed");
    this.name = "WorkflowValidationError";
    this.issues = issues;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewComment = {
  id: string;
  severity: "BLOCKING" | "SUGGESTION";
  message: string;
  authorId: string;
  authorName: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
};

export type VersionSummary = {
  id: string;
  versionNumber: number;
  revision: number;
  status: string;
  primarySkill: string;
  lessonType: string;
  isActiveWorkflow: boolean;
  publishedAt: string | null;
  supersededAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: string;
  submittedBy: string | null;
  approval: {
    reviewerId: string;
    reviewerName: string;
    approvedAt: string;
    summary: string;
    overrideReason: string | null;
  } | null;
  scheduledAt: string | null;
  scheduledTimezone: string | null;
};

export type LessonWorkflowState = {
  lessonId: string;
  title: string;
  defaultLocale: string;
  publicationStatus: string;
  currentPublishedVersionId: string | null;
  activeVersion: VersionSummary | null;
  reviewComments: ReviewComment[];
  allVersions: VersionSummary[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function db() {
  return getMongoClient().db(getDatabaseEnv().databaseName);
}

async function resolveNames(
  database: Db,
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  // Admin users (staff) stored in admin_users; learner users in users
  const objectIds = unique.map((id) => new ObjectId(id));
  const [adminUsers, learnerUsers] = await Promise.all([
    database
      .collection("admin_users")
      .find({ _id: { $in: objectIds } }, { projection: { name: 1, email: 1 } })
      .toArray(),
    database
      .collection("users")
      .find({ _id: { $in: objectIds } }, { projection: { name: 1, email: 1 } })
      .toArray(),
  ]);

  const map = new Map<string, string>();
  for (const user of [...adminUsers, ...learnerUsers]) {
    map.set(
      user._id.toString(),
      (user.name as string | undefined) ?? (user.email as string | undefined) ?? user._id.toString(),
    );
  }
  return map;
}

function mapVersion(v: Record<string, unknown>, names: Map<string, string>): VersionSummary {
  const approval = v.approval as Record<string, unknown> | null | undefined;
  return {
    id: (v._id as ObjectId).toString(),
    versionNumber: v.versionNumber as number,
    revision: v.revision as number,
    status: v.status as string,
    primarySkill: v.primarySkill as string,
    lessonType: v.lessonType as string,
    isActiveWorkflow: Boolean(v.isActiveWorkflow),
    publishedAt: v.publishedAt ? (v.publishedAt as Date).toISOString() : null,
    supersededAt: v.supersededAt ? (v.supersededAt as Date).toISOString() : null,
    createdAt: (v.createdAt as Date).toISOString(),
    updatedAt: (v.updatedAt as Date).toISOString(),
    lastEditedBy: names.get((v.lastEditedBy as ObjectId)?.toString()) ?? (v.lastEditedBy as ObjectId)?.toString() ?? "",
    submittedBy: v.submittedBy ? (names.get((v.submittedBy as ObjectId).toString()) ?? (v.submittedBy as ObjectId).toString()) : null,
    approval: approval
      ? {
          reviewerId: (approval.reviewerId as ObjectId).toString(),
          reviewerName: names.get((approval.reviewerId as ObjectId).toString()) ?? (approval.reviewerId as ObjectId).toString(),
          approvedAt: (approval.approvedAt as Date).toISOString(),
          summary: (approval.summary as string) ?? "",
          overrideReason: (approval.overrideReason as string | null) ?? null,
        }
      : null,
    scheduledAt: v.scheduledAt ? (v.scheduledAt as Date).toISOString() : null,
    scheduledTimezone: (v.scheduledTimezone as string | null) ?? null,
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonicalize(v)]),
    );
  }
  return value;
}

function computeContentHash(versionDoc: Record<string, unknown>, exercises: Record<string, unknown>[]) {
  const content = {
    primarySkill: versionDoc.primarySkill,
    lessonType: versionDoc.lessonType,
    learningLanguage: versionDoc.learningLanguage,
    localizations: versionDoc.localizations,
    cefrLevelMin: versionDoc.cefrLevelMin,
    cefrLevelMax: versionDoc.cefrLevelMax,
    audiences: versionDoc.audiences,
    ieltsMetadata: versionDoc.ieltsMetadata ?? null,
    primaryTopicId: (versionDoc.primaryTopicId as ObjectId).toString(),
    secondaryTopicIds: ((versionDoc.secondaryTopicIds as ObjectId[]) ?? []).map(String),
    tagCodes: versionDoc.tagCodes ?? [],
    estimatedMinutes: versionDoc.estimatedMinutes,
    visibility: versionDoc.visibility,
    accessTier: versionDoc.accessTier,
    coverAssetId: versionDoc.coverAssetId ? (versionDoc.coverAssetId as ObjectId).toString() : null,
    prerequisiteLessonIds: ((versionDoc.prerequisiteLessonIds as ObjectId[]) ?? []).map(String),
    relatedLessonIds: ((versionDoc.relatedLessonIds as ObjectId[]) ?? []).map(String),
    exercises: exercises.map((e) => ({
      position: e.position,
      exerciseType: e.exerciseType,
      evaluationMode: e.evaluationMode,
      localizations: e.localizations,
      targetContent: e.targetContent ?? "",
      contextText: e.contextText ?? "",
      choices: e.choices ?? [],
      answerRubric: e.answerRubric ?? {},
      mediaAssetIds: ((e.mediaAssetIds as ObjectId[]) ?? []).map(String),
      estimatedSeconds: e.estimatedSeconds ?? null,
      isOptional: e.isOptional ?? false,
      isPreview: e.isPreview ?? false,
    })),
  };
  return createHash("sha256").update(JSON.stringify(canonicalize(content))).digest("hex");
}

async function addAuditLog(
  database: Db,
  session: ClientSession,
  input: {
    actorId: ObjectId;
    resourceId: ObjectId;
    lessonVersionId: ObjectId;
    action: string;
    beforeSummary?: Record<string, unknown> | null;
    afterSummary?: Record<string, unknown> | null;
    reason?: string;
  },
) {
  const now = new Date();
  await database.collection("content_audit_logs").insertOne(
    {
      actorId: input.actorId,
      resourceType: "LESSON",
      resourceId: input.resourceId,
      lessonVersionId: input.lessonVersionId,
      action: input.action,
      beforeSummary: input.beforeSummary ?? null,
      afterSummary: input.afterSummary ?? null,
      reason: input.reason ?? "",
      occurredAt: now,
      createdAt: now,
    },
    { session },
  );
}

async function addPublicationEvent(
  database: Db,
  session: ClientSession,
  input: {
    actorId: ObjectId;
    lessonId: ObjectId;
    lessonVersionId: ObjectId;
    eventType: string;
    previousVersionId?: ObjectId | null;
    reason?: string;
  },
) {
  const now = new Date();
  await database.collection("lesson_publication_events").insertOne(
    {
      lessonId: input.lessonId,
      lessonVersionId: input.lessonVersionId,
      eventType: input.eventType,
      actorId: input.actorId,
      reason: input.reason ?? "",
      previousVersionId: input.previousVersionId ?? null,
      occurredAt: now,
      createdAt: now,
      updatedAt: now,
    },
    { session },
  );
  await database.collection("content_outbox_events").insertOne(
    {
      aggregateType: "LESSON",
      aggregateId: input.lessonId,
      eventType: `lesson.${input.eventType.toLowerCase()}`,
      payload: {
        lessonId: input.lessonId.toString(),
        lessonVersionId: input.lessonVersionId.toString(),
        previousVersionId: input.previousVersionId?.toString() ?? null,
        occurredAt: now.toISOString(),
      },
      status: "PENDING",
      attempts: 0,
      availableAt: now,
      publishedAt: null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    },
    { session },
  );
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getLessonWorkflowState(
  lessonId: string,
): Promise<LessonWorkflowState | null> {
  if (!ObjectId.isValid(lessonId)) return null;
  const database = db();
  const lessonObjectId = new ObjectId(lessonId);

  const [lesson, versions] = await Promise.all([
    database.collection("lessons").findOne({ _id: lessonObjectId }),
    database
      .collection("lesson_versions")
      .find({ lessonId: lessonObjectId })
      .sort({ versionNumber: -1, revision: -1 })
      .toArray(),
  ]);
  if (!lesson) return null;

  const activeVersion = versions.find((v) => v.isActiveWorkflow) ?? null;
  const reviewCommentDocs = activeVersion
    ? await database
        .collection("lesson_review_comments")
        .find({ lessonVersionId: activeVersion._id })
        .sort({ createdAt: -1 })
        .toArray()
    : [];

  // Collect all actor IDs to resolve names
  const actorIds: string[] = [];
  for (const v of versions) {
    if (v.lastEditedBy) actorIds.push(v.lastEditedBy.toString());
    if (v.submittedBy) actorIds.push((v.submittedBy as ObjectId).toString());
    if (v.approval?.reviewerId) actorIds.push((v.approval.reviewerId as ObjectId).toString());
  }
  for (const c of reviewCommentDocs) {
    if (c.authorId) actorIds.push((c.authorId as ObjectId).toString());
    if (c.resolvedBy) actorIds.push((c.resolvedBy as ObjectId).toString());
  }
  const names = await resolveNames(database, actorIds);

  const localization = (lesson.localizations as Array<{ locale: string; title: string }>)
    ?.find((l) => l.locale === lesson.defaultLocale)
    ?? (lesson.localizations as Array<{ locale: string; title: string }>)?.[0];

  // Try to get title from active version localizations
  let title = "Untitled lesson";
  if (activeVersion) {
    const vLoc = (activeVersion.localizations as Array<{ locale: string; title: string }>)
      ?.find((l) => l.locale === lesson.defaultLocale)
      ?? (activeVersion.localizations as Array<{ locale: string; title: string }>)?.[0];
    if (vLoc?.title) title = vLoc.title;
  } else if (versions.length > 0) {
    const latestVLoc = (versions[0].localizations as Array<{ locale: string; title: string }>)
      ?.find((l) => l.locale === lesson.defaultLocale)
      ?? (versions[0].localizations as Array<{ locale: string; title: string }>)?.[0];
    if (latestVLoc?.title) title = latestVLoc.title;
  } else if (localization?.title) {
    title = localization.title;
  }

  const reviewComments: ReviewComment[] = reviewCommentDocs.map((c) => ({
    id: (c._id as ObjectId).toString(),
    severity: c.severity as "BLOCKING" | "SUGGESTION",
    message: c.message as string,
    authorId: (c.authorId as ObjectId).toString(),
    authorName: names.get((c.authorId as ObjectId).toString()) ?? (c.authorId as ObjectId).toString(),
    resolvedAt: c.resolvedAt ? (c.resolvedAt as Date).toISOString() : null,
    resolvedBy: c.resolvedBy ? (names.get((c.resolvedBy as ObjectId).toString()) ?? (c.resolvedBy as ObjectId).toString()) : null,
    createdAt: (c.createdAt as Date).toISOString(),
  }));

  return {
    lessonId: lesson._id.toString(),
    title,
    defaultLocale: lesson.defaultLocale as string,
    publicationStatus: lesson.publicationStatus as string,
    currentPublishedVersionId: lesson.currentPublishedVersionId?.toString() ?? null,
    activeVersion: activeVersion ? mapVersion(activeVersion as Record<string, unknown>, names) : null,
    reviewComments,
    allVersions: versions.map((v) => mapVersion(v as Record<string, unknown>, names)),
  };
}

// ---------------------------------------------------------------------------
// Workflow mutations — all call through content.service via HTTP or duplicate
// the minimal DB logic in admin style (MongoDB native, same transaction pattern)
// ---------------------------------------------------------------------------

export async function adminSubmitForReview(actorUserId: string, versionId: string) {
  if (!ObjectId.isValid(actorUserId) && !actorUserId) throw new WorkflowConflictError("Invalid actor.");
  if (!ObjectId.isValid(versionId)) throw new WorkflowConflictError("Invalid version ID.");

  const database = db();
  const client = getMongoClient();
  const session = client.startSession();
  const versionObjectId = new ObjectId(versionId);
  const actorId = new ObjectId(actorUserId);

  try {
    return await session.withTransaction(async () => {
      const version = await database.collection("lesson_versions").findOne(
        { _id: versionObjectId, status: "DRAFT", isActiveWorkflow: true },
        { session },
      );
      if (!version) throw new WorkflowConflictError("Version không ở trạng thái Draft hoặc không tồn tại.");

      const exercises = await database.collection("exercises")
        .find({ lessonVersionId: versionObjectId }, { session })
        .sort({ position: 1 })
        .toArray();

      const beforeSummary = { status: version.status, revision: version.revision };
      const now = new Date();
      await database.collection("lesson_versions").updateOne(
        { _id: versionObjectId },
        {
          $set: {
            status: "IN_REVIEW",
            submittedBy: actorId,
            submittedAt: now,
            contentHash: computeContentHash(version as Record<string, unknown>, exercises as Record<string, unknown>[]),
            updatedAt: now,
          },
        },
        { session },
      );
      await addAuditLog(database, session, {
        actorId,
        resourceId: version.lessonId as ObjectId,
        lessonVersionId: versionObjectId,
        action: "REVIEW_SUBMITTED",
        beforeSummary,
        afterSummary: { status: "IN_REVIEW", revision: version.revision },
      });
    });
  } finally {
    await session.endSession();
  }
}

export async function adminAddReviewComment(
  actorUserId: string,
  versionId: string,
  input: unknown,
) {
  if (!ObjectId.isValid(versionId)) throw new WorkflowConflictError("Invalid version ID.");
  const parsed = requestChangesSchema.parse(input);
  const database = db();
  const client = getMongoClient();
  const session = client.startSession();
  const versionObjectId = new ObjectId(versionId);
  const actorId = new ObjectId(actorUserId);

  try {
    return await session.withTransaction(async () => {
      const version = await database.collection("lesson_versions").findOne(
        { _id: versionObjectId, status: "IN_REVIEW" },
        { session },
      );
      if (!version) throw new WorkflowConflictError("Version không ở trạng thái In Review.");

      const now = new Date();
      const comment = await database.collection("lesson_review_comments").insertOne(
        {
          lessonVersionId: versionObjectId,
          authorId: actorId,
          severity: parsed.severity,
          message: parsed.message,
          resolvedBy: null,
          resolvedAt: null,
          createdAt: now,
          updatedAt: now,
        },
        { session },
      );

      const beforeSummary = { status: version.status };
      await database.collection("lesson_versions").updateOne(
        { _id: versionObjectId },
        { $set: { status: "CHANGES_REQUESTED", approval: null, updatedAt: now } },
        { session },
      );
      await addAuditLog(database, session, {
        actorId,
        resourceId: version.lessonId as ObjectId,
        lessonVersionId: versionObjectId,
        action: "CHANGES_REQUESTED",
        beforeSummary,
        afterSummary: { status: "CHANGES_REQUESTED", severity: parsed.severity },
        reason: parsed.message,
      });

      return { commentId: comment.insertedId.toString(), status: "CHANGES_REQUESTED" };
    });
  } finally {
    await session.endSession();
  }
}

export async function adminResolveComment(actorUserId: string, commentId: string) {
  if (!ObjectId.isValid(commentId)) throw new WorkflowConflictError("Invalid comment ID.");
  const database = db();
  const now = new Date();
  const result = await database.collection("lesson_review_comments").updateOne(
    { _id: new ObjectId(commentId), resolvedAt: null },
    { $set: { resolvedAt: now, resolvedBy: new ObjectId(actorUserId), updatedAt: now } },
  );
  if (result.matchedCount === 0) throw new WorkflowConflictError("Comment không tìm thấy hoặc đã được resolve.");
  return { commentId };
}

export async function adminApproveVersion(
  actorUserId: string,
  versionId: string,
  input: unknown,
) {
  if (!ObjectId.isValid(versionId)) throw new WorkflowConflictError("Invalid version ID.");
  const parsed = approveVersionSchema.parse(input);
  const database = db();
  const client = getMongoClient();
  const session = client.startSession();
  const versionObjectId = new ObjectId(versionId);
  const actorId = new ObjectId(actorUserId);

  try {
    return await session.withTransaction(async () => {
      const version = await database.collection("lesson_versions").findOne(
        { _id: versionObjectId, status: "IN_REVIEW" },
        { session },
      );
      if (!version) throw new WorkflowConflictError("Version không ở trạng thái In Review.");

      // Self-approval check (same as content.service)
      const lastEditedBy = version.lastEditedBy as ObjectId;
      if (lastEditedBy.equals(actorId) && !parsed.overrideReason) {
        throw new WorkflowValidationError(["Reviewer không thể approve version do chính mình chỉnh sửa gần nhất. Yêu cầu Admin override."]);
      }

      // Check blocking comments
      const blockingCount = await database.collection("lesson_review_comments").countDocuments(
        { lessonVersionId: versionObjectId, severity: "BLOCKING", resolvedAt: null },
        { session },
      );
      if (blockingCount > 0) {
        throw new WorkflowConflictError(`Còn ${blockingCount} comment BLOCKING chưa được resolve.`);
      }

      const exercises = await database.collection("exercises")
        .find({ lessonVersionId: versionObjectId }, { session })
        .sort({ position: 1 })
        .toArray();
      const currentHash = computeContentHash(version as Record<string, unknown>, exercises as Record<string, unknown>[]);

      const beforeSummary = { status: version.status, contentHash: version.contentHash };
      const now = new Date();
      await database.collection("lesson_versions").updateOne(
        { _id: versionObjectId },
        {
          $set: {
            status: "APPROVED",
            approval: {
              reviewerId: actorId,
              contentHash: currentHash,
              summary: parsed.summary,
              overrideReason: parsed.overrideReason ?? null,
              approvedAt: now,
            },
            updatedAt: now,
          },
        },
        { session },
      );
      await addAuditLog(database, session, {
        actorId,
        resourceId: version.lessonId as ObjectId,
        lessonVersionId: versionObjectId,
        action: "REVIEW_APPROVED",
        beforeSummary,
        afterSummary: { status: "APPROVED", contentHash: currentHash },
        reason: parsed.overrideReason ?? parsed.summary,
      });
      return { lessonVersionId: versionId, status: "APPROVED" };
    });
  } finally {
    await session.endSession();
  }
}

export async function adminPublishNow(
  actorUserId: string,
  versionId: string,
  input: unknown = {},
) {
  if (!ObjectId.isValid(versionId)) throw new WorkflowConflictError("Invalid version ID.");
  const parsed = publishVersionSchema.parse(input);
  const database = db();
  const client = getMongoClient();
  const session = client.startSession();
  const versionObjectId = new ObjectId(versionId);
  const actorId = new ObjectId(actorUserId);

  try {
    return await session.withTransaction(async () => {
      const version = await database.collection("lesson_versions").findOne(
        { _id: versionObjectId, status: "APPROVED" },
        { session },
      );
      if (!version?.approval) throw new WorkflowConflictError("Version chưa được approve.");

      // Stale-approval check
      const exercises = await database.collection("exercises")
        .find({ lessonVersionId: versionObjectId }, { session })
        .sort({ position: 1 })
        .toArray();
      const currentHash = computeContentHash(version as Record<string, unknown>, exercises as Record<string, unknown>[]);
      const approval = version.approval as Record<string, unknown>;
      if (currentHash !== version.contentHash || currentHash !== approval.contentHash) {
        throw new WorkflowConflictError("Approval đã stale do content thay đổi. Cần review lại.");
      }

      // Separation of duties
      const reviewerId = approval.reviewerId as ObjectId;
      if (reviewerId.equals(actorId) && !parsed.overrideReason) {
        throw new WorkflowValidationError(["Publisher không thể publish version do chính mình approve (cùng người). Cần Admin override."]);
      }

      const lesson = await database.collection("lessons").findOne({ _id: version.lessonId }, { session });
      if (!lesson) throw new WorkflowConflictError("Lesson không tìm thấy.");
      if (lesson.publicationStatus === "WITHDRAWN") {
        throw new WorkflowConflictError("Lesson đã bị withdrawn. Không thể publish.");
      }

      const previousVersionId = lesson.currentPublishedVersionId as ObjectId | null;
      const now = new Date();

      if (previousVersionId && !previousVersionId.equals(versionObjectId)) {
        await database.collection("lesson_versions").updateOne(
          { _id: previousVersionId, status: "PUBLISHED" },
          { $set: { status: "SUPERSEDED", supersededAt: now, updatedAt: now } },
          { session },
        );
      }

      await database.collection("lesson_versions").updateOne(
        { _id: versionObjectId },
        {
          $set: {
            status: "PUBLISHED",
            isActiveWorkflow: false,
            publishedBy: actorId,
            publishedAt: now,
            publishedOverrideReason: parsed.overrideReason ?? null,
            supersededAt: null,
            updatedAt: now,
          },
        },
        { session },
      );

      const beforeSummary = {
        currentPublishedVersionId: previousVersionId?.toString() ?? null,
        publicationStatus: lesson.publicationStatus,
        versionStatus: version.status,
      };

      await database.collection("lessons").updateOne(
        { _id: version.lessonId },
        {
          $set: {
            currentPublishedVersionId: versionObjectId,
            publicationStatus: "PUBLISHED",
            publishedAt: now,
            archivedAt: null,
            updatedAt: now,
          },
        },
        { session },
      );

      await addPublicationEvent(database, session, {
        actorId,
        lessonId: version.lessonId as ObjectId,
        lessonVersionId: versionObjectId,
        eventType: "PUBLISHED",
        previousVersionId,
        reason: parsed.overrideReason ?? "",
      });
      await addAuditLog(database, session, {
        actorId,
        resourceId: version.lessonId as ObjectId,
        lessonVersionId: versionObjectId,
        action: "PUBLISHED",
        beforeSummary,
        afterSummary: {
          currentPublishedVersionId: versionId,
          publicationStatus: "PUBLISHED",
          versionStatus: "PUBLISHED",
        },
        reason: parsed.overrideReason ?? "",
      });
      return { lessonId: (version.lessonId as ObjectId).toString(), lessonVersionId: versionId };
    });
  } finally {
    await session.endSession();
  }
}

export async function adminScheduleVersion(
  actorUserId: string,
  versionId: string,
  input: unknown,
) {
  if (!ObjectId.isValid(versionId)) throw new WorkflowConflictError("Invalid version ID.");
  const parsed = scheduleVersionSchema.parse(input);
  if (parsed.scheduledAt.getTime() <= Date.now()) {
    throw new WorkflowValidationError(["Thời điểm publish phải trong tương lai."]);
  }
  const database = db();
  const versionObjectId = new ObjectId(versionId);
  const actorId = new ObjectId(actorUserId);
  const now = new Date();

  const version = await database.collection("lesson_versions").findOne({
    _id: versionObjectId,
    status: "APPROVED",
    approval: { $ne: null },
  });
  if (!version?.approval) throw new WorkflowConflictError("Chỉ version đã approve mới có thể lên lịch publish.");

  const result = await database.collection("lesson_versions").updateOne(
    { _id: versionObjectId, status: "APPROVED" },
    {
      $set: {
        status: "SCHEDULED",
        scheduledAt: parsed.scheduledAt,
        scheduledTimezone: parsed.timezone,
        scheduledOverrideReason: parsed.overrideReason ?? null,
        scheduledBy: actorId,
        updatedAt: now,
      },
    },
  );
  if (result.modifiedCount === 0) throw new WorkflowConflictError("Không thể lên lịch publish.");

  return { lessonVersionId: versionId, status: "SCHEDULED", scheduledAt: parsed.scheduledAt.toISOString() };
}

export async function adminCancelSchedule(actorUserId: string, versionId: string) {
  if (!ObjectId.isValid(versionId)) throw new WorkflowConflictError("Invalid version ID.");
  const database = db();
  const now = new Date();
  const result = await database.collection("lesson_versions").updateOne(
    { _id: new ObjectId(versionId), status: "SCHEDULED" },
    {
      $set: {
        status: "APPROVED",
        scheduledAt: null,
        scheduledTimezone: null,
        scheduledOverrideReason: null,
        scheduledBy: null,
        updatedAt: now,
      },
    },
  );
  if (result.modifiedCount === 0) throw new WorkflowConflictError("Version không ở trạng thái Scheduled.");
  return { lessonVersionId: versionId, status: "APPROVED" };
}

export async function adminResumeEditing(actorUserId: string, versionId: string) {
  if (!ObjectId.isValid(versionId)) throw new WorkflowConflictError("Invalid version ID.");
  const database = db();
  const now = new Date();
  const result = await database.collection("lesson_versions").findOneAndUpdate(
    { _id: new ObjectId(versionId), status: "CHANGES_REQUESTED" },
    {
      $set: { status: "DRAFT", lastEditedBy: new ObjectId(actorUserId), updatedAt: now },
      $inc: { revision: 1 },
    },
    { returnDocument: "after" },
  );
  if (!result) throw new WorkflowConflictError("Version không ở trạng thái Changes Requested.");
  return { lessonVersionId: versionId, revision: result.revision as number };
}

export async function adminCancelVersion(
  actorUserId: string,
  versionId: string,
  input: unknown,
) {
  if (!ObjectId.isValid(versionId)) throw new WorkflowConflictError("Invalid version ID.");
  const { reason } = lifecycleReasonSchema.parse(input);
  const database = db();
  const client = getMongoClient();
  const session = client.startSession();
  const versionObjectId = new ObjectId(versionId);
  const actorId = new ObjectId(actorUserId);

  try {
    return await session.withTransaction(async () => {
      const version = await database.collection("lesson_versions").findOne(
        { _id: versionObjectId, status: { $in: ["DRAFT", "CHANGES_REQUESTED"] } },
        { session },
      );
      if (!version) throw new WorkflowConflictError("Chỉ version ở Draft hoặc Changes Requested mới có thể huỷ.");

      const now = new Date();
      await database.collection("lesson_versions").updateOne(
        { _id: versionObjectId },
        { $set: { status: "CANCELLED", isActiveWorkflow: false, cancelledAt: now, updatedAt: now } },
        { session },
      );
      await addAuditLog(database, session, {
        actorId,
        resourceId: version.lessonId as ObjectId,
        lessonVersionId: versionObjectId,
        action: "CANCELLED",
        beforeSummary: { status: version.status },
        afterSummary: { status: "CANCELLED" },
        reason,
      });
    });
  } finally {
    await session.endSession();
  }
}

export async function adminRollback(
  actorUserId: string,
  lessonId: string,
  targetVersionId: string,
  input: unknown,
) {
  if (!ObjectId.isValid(lessonId) || !ObjectId.isValid(targetVersionId)) {
    throw new WorkflowConflictError("Invalid IDs.");
  }
  const { reason } = lifecycleReasonSchema.parse(input);
  const database = db();
  const client = getMongoClient();
  const session = client.startSession();
  const lessonObjectId = new ObjectId(lessonId);
  const targetObjectId = new ObjectId(targetVersionId);
  const actorId = new ObjectId(actorUserId);

  try {
    return await session.withTransaction(async () => {
      const lesson = await database.collection("lessons").findOne(
        { _id: lessonObjectId, publicationStatus: { $in: ["PUBLISHED", "ARCHIVED"] } },
        { session },
      );
      if (!lesson?.currentPublishedVersionId) throw new WorkflowConflictError("Lesson không thể rollback.");

      const currentVersionId = lesson.currentPublishedVersionId as ObjectId;
      if (currentVersionId.equals(targetObjectId)) {
        throw new WorkflowConflictError("Version target đã là current published version.");
      }

      const targetVersion = await database.collection("lesson_versions").findOne(
        { _id: targetObjectId, lessonId: lessonObjectId, status: "SUPERSEDED" },
        { session },
      );
      if (!targetVersion?.publishedAt) {
        throw new WorkflowConflictError("Version target không phải là version đã từng publish trước đó.");
      }

      const now = new Date();
      await database.collection("lesson_versions").updateOne(
        { _id: currentVersionId },
        { $set: { status: "SUPERSEDED", supersededAt: now, updatedAt: now } },
        { session },
      );
      await database.collection("lesson_versions").updateOne(
        { _id: targetObjectId },
        { $set: { status: "PUBLISHED", supersededAt: null, updatedAt: now } },
        { session },
      );

      const beforeSummary = {
        currentPublishedVersionId: currentVersionId.toString(),
        publicationStatus: lesson.publicationStatus,
      };
      await database.collection("lessons").updateOne(
        { _id: lessonObjectId },
        {
          $set: {
            currentPublishedVersionId: targetObjectId,
            publicationStatus: "PUBLISHED",
            publishedAt: now,
            archivedAt: null,
            updatedAt: now,
          },
        },
        { session },
      );
      await addPublicationEvent(database, session, {
        actorId,
        lessonId: lessonObjectId,
        lessonVersionId: targetObjectId,
        eventType: "ROLLED_BACK",
        previousVersionId: currentVersionId,
        reason,
      });
      await addAuditLog(database, session, {
        actorId,
        resourceId: lessonObjectId,
        lessonVersionId: targetObjectId,
        action: "ROLLED_BACK",
        beforeSummary,
        afterSummary: { currentPublishedVersionId: targetVersionId, publicationStatus: "PUBLISHED" },
        reason,
      });
      return { lessonId, lessonVersionId: targetVersionId, publicationStatus: "PUBLISHED" };
    });
  } finally {
    await session.endSession();
  }
}

export async function adminArchiveLesson(
  actorUserId: string,
  lessonId: string,
  input: unknown,
) {
  if (!ObjectId.isValid(lessonId)) throw new WorkflowConflictError("Invalid lesson ID.");
  const { reason } = lifecycleReasonSchema.parse(input);
  const database = db();
  const client = getMongoClient();
  const session = client.startSession();
  const lessonObjectId = new ObjectId(lessonId);
  const actorId = new ObjectId(actorUserId);

  try {
    return await session.withTransaction(async () => {
      const lesson = await database.collection("lessons").findOne(
        { _id: lessonObjectId, publicationStatus: "PUBLISHED", currentPublishedVersionId: { $ne: null } },
        { session },
      );
      if (!lesson?.currentPublishedVersionId) {
        throw new WorkflowConflictError("Chỉ lesson đang Published mới có thể archive.");
      }
      const now = new Date();
      const beforeSummary = { publicationStatus: lesson.publicationStatus };
      await database.collection("lessons").updateOne(
        { _id: lessonObjectId },
        { $set: { publicationStatus: "ARCHIVED", archivedAt: now, updatedAt: now } },
        { session },
      );
      await addPublicationEvent(database, session, {
        actorId,
        lessonId: lessonObjectId,
        lessonVersionId: lesson.currentPublishedVersionId as ObjectId,
        eventType: "ARCHIVED",
        reason,
      });
      await addAuditLog(database, session, {
        actorId,
        resourceId: lessonObjectId,
        lessonVersionId: lesson.currentPublishedVersionId as ObjectId,
        action: "ARCHIVED",
        beforeSummary,
        afterSummary: { publicationStatus: "ARCHIVED" },
        reason,
      });
      return { lessonId, publicationStatus: "ARCHIVED" };
    });
  } finally {
    await session.endSession();
  }
}

export async function adminRestoreLesson(
  actorUserId: string,
  lessonId: string,
  input: unknown,
) {
  if (!ObjectId.isValid(lessonId)) throw new WorkflowConflictError("Invalid lesson ID.");
  const { reason } = lifecycleReasonSchema.parse(input);
  const database = db();
  const client = getMongoClient();
  const session = client.startSession();
  const lessonObjectId = new ObjectId(lessonId);
  const actorId = new ObjectId(actorUserId);

  try {
    return await session.withTransaction(async () => {
      const lesson = await database.collection("lessons").findOne(
        { _id: lessonObjectId, publicationStatus: "ARCHIVED", currentPublishedVersionId: { $ne: null } },
        { session },
      );
      if (!lesson?.currentPublishedVersionId) {
        throw new WorkflowConflictError("Chỉ lesson đang Archived mới có thể restore.");
      }
      const now = new Date();
      const beforeSummary = { publicationStatus: lesson.publicationStatus };
      await database.collection("lessons").updateOne(
        { _id: lessonObjectId },
        { $set: { publicationStatus: "PUBLISHED", archivedAt: null, updatedAt: now } },
        { session },
      );
      await addPublicationEvent(database, session, {
        actorId,
        lessonId: lessonObjectId,
        lessonVersionId: lesson.currentPublishedVersionId as ObjectId,
        eventType: "RESTORED",
        reason,
      });
      await addAuditLog(database, session, {
        actorId,
        resourceId: lessonObjectId,
        lessonVersionId: lesson.currentPublishedVersionId as ObjectId,
        action: "RESTORED",
        beforeSummary,
        afterSummary: { publicationStatus: "PUBLISHED" },
        reason,
      });
      return { lessonId, publicationStatus: "PUBLISHED" };
    });
  } finally {
    await session.endSession();
  }
}

export async function adminWithdrawLesson(
  actorUserId: string,
  lessonId: string,
  input: unknown,
) {
  if (!ObjectId.isValid(lessonId)) throw new WorkflowConflictError("Invalid lesson ID.");
  const { reason } = lifecycleReasonSchema.parse(input);
  const database = db();
  const client = getMongoClient();
  const session = client.startSession();
  const lessonObjectId = new ObjectId(lessonId);
  const actorId = new ObjectId(actorUserId);

  try {
    return await session.withTransaction(async () => {
      const lesson = await database.collection("lessons").findOne(
        {
          _id: lessonObjectId,
          publicationStatus: { $in: ["PUBLISHED", "ARCHIVED"] },
          currentPublishedVersionId: { $ne: null },
        },
        { session },
      );
      if (!lesson?.currentPublishedVersionId) {
        throw new WorkflowConflictError("Lesson không thể withdraw.");
      }
      const now = new Date();
      const beforeSummary = { publicationStatus: lesson.publicationStatus };
      await database.collection("lessons").updateOne(
        { _id: lessonObjectId },
        { $set: { publicationStatus: "WITHDRAWN", withdrawnAt: now, updatedAt: now } },
        { session },
      );
      await addPublicationEvent(database, session, {
        actorId,
        lessonId: lessonObjectId,
        lessonVersionId: lesson.currentPublishedVersionId as ObjectId,
        eventType: "WITHDRAWN",
        reason,
      });
      await addAuditLog(database, session, {
        actorId,
        resourceId: lessonObjectId,
        lessonVersionId: lesson.currentPublishedVersionId as ObjectId,
        action: "WITHDRAWN",
        beforeSummary,
        afterSummary: { publicationStatus: "WITHDRAWN" },
        reason,
      });
      return { lessonId, publicationStatus: "WITHDRAWN" };
    });
  } finally {
    await session.endSession();
  }
}

export async function adminClonePublishedVersion(
  actorUserId: string,
  lessonId: string,
) {
  if (!ObjectId.isValid(lessonId)) throw new WorkflowConflictError("Invalid lesson ID.");
  const database = db();
  const client = getMongoClient();
  const session = client.startSession();
  const lessonObjectId = new ObjectId(lessonId);
  const actorId = new ObjectId(actorUserId);

  try {
    return await session.withTransaction(async () => {
      const lesson = await database.collection("lessons").findOne(
        { _id: lessonObjectId, currentPublishedVersionId: { $ne: null } },
        { session },
      );
      if (!lesson?.currentPublishedVersionId) {
        throw new WorkflowConflictError("Bài học chưa có phiên bản published để clone.");
      }

      const activeVersion = await database.collection("lesson_versions").findOne(
        { lessonId: lessonObjectId, isActiveWorkflow: true },
        { session },
      );
      if (activeVersion) {
        throw new WorkflowConflictError("Bài học đã có một workflow đang hoạt động.");
      }

      const sourceVersion = await database.collection("lesson_versions").findOne(
        { _id: lesson.currentPublishedVersionId as ObjectId },
        { session },
      );
      if (!sourceVersion) throw new WorkflowConflictError("Không tìm thấy source published version.");

      const sourceExercises = await database.collection("exercises")
        .find({ lessonVersionId: sourceVersion._id }, { session })
        .sort({ position: 1 })
        .toArray();

      const nextVersionNumber = ((lesson.latestVersionNumber as number) || 1) + 1;
      await database.collection("lessons").updateOne(
        { _id: lessonObjectId },
        { $set: { latestVersionNumber: nextVersionNumber, updatedAt: new Date() } },
        { session },
      );

      const now = new Date();
      const newVersionId = new ObjectId();
      const hash = computeContentHash(sourceVersion as Record<string, unknown>, sourceExercises as Record<string, unknown>[]);

      await database.collection("lesson_versions").insertOne(
        {
          _id: newVersionId,
          lessonId: lessonObjectId,
          versionNumber: nextVersionNumber,
          status: "DRAFT",
          revision: 1,
          isActiveWorkflow: true,
          contentHash: hash,
          primarySkill: sourceVersion.primarySkill,
          lessonType: sourceVersion.lessonType,
          learningLanguage: sourceVersion.learningLanguage,
          localizations: sourceVersion.localizations,
          cefrLevelMin: sourceVersion.cefrLevelMin,
          cefrLevelMax: sourceVersion.cefrLevelMax,
          audiences: sourceVersion.audiences,
          ieltsMetadata: sourceVersion.ieltsMetadata ?? null,
          primaryTopicId: sourceVersion.primaryTopicId,
          secondaryTopicIds: sourceVersion.secondaryTopicIds ?? [],
          tagCodes: sourceVersion.tagCodes ?? [],
          estimatedMinutes: sourceVersion.estimatedMinutes,
          visibility: sourceVersion.visibility,
          accessTier: sourceVersion.accessTier,
          coverAssetId: sourceVersion.coverAssetId ?? null,
          prerequisiteLessonIds: sourceVersion.prerequisiteLessonIds ?? [],
          relatedLessonIds: sourceVersion.relatedLessonIds ?? [],
          createdBy: actorId,
          lastEditedBy: actorId,
          submittedBy: null,
          submittedAt: null,
          approval: null,
          scheduledBy: null,
          scheduledAt: null,
          scheduledTimezone: null,
          scheduledOverrideReason: null,
          publishedBy: null,
          publishedAt: null,
          publishedOverrideReason: null,
          supersededAt: null,
          cancelledAt: null,
          createdAt: now,
          updatedAt: now,
        },
        { session },
      );

      if (sourceExercises.length > 0) {
        const clonedExercises = sourceExercises.map((exercise) => {
          const { _id: _oldId, lessonVersionId: _oldVId, createdAt: _c, updatedAt: _u, ...rest } = exercise;
          return {
            ...rest,
            lessonVersionId: newVersionId,
            createdBy: actorId,
            lastEditedBy: actorId,
            createdAt: now,
            updatedAt: now,
          };
        });
        await database.collection("exercises").insertMany(clonedExercises, { session });
      }

      await addAuditLog(database, session, {
        actorId,
        resourceId: lessonObjectId,
        lessonVersionId: newVersionId,
        action: "VERSION_CLONED",
        beforeSummary: {
          sourceVersionId: (sourceVersion._id as ObjectId).toString(),
          sourceVersionNumber: sourceVersion.versionNumber,
        },
        afterSummary: {
          versionNumber: nextVersionNumber,
          revision: 1,
          status: "DRAFT",
          exerciseCount: sourceExercises.length,
        },
      });

      return { lessonId, lessonVersionId: newVersionId.toString(), versionNumber: nextVersionNumber };
    });
  } finally {
    await session.endSession();
  }
}
