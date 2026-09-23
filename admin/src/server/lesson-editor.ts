import "server-only";

import { createHash } from "node:crypto";

import {
  ContentValidationError,
  createLessonDraftSchema,
  updateLessonDraftSchema,
  validateLessonContent,
  validateNewLessonIdentity,
  type CreateLessonDraftInput,
} from "@draftwise/content";
import { ObjectId, type ClientSession, type Db, type Document } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export type LessonEditorValue = CreateLessonDraftInput & {
  lessonId?: string;
  revision?: number;
  versionId?: string;
  versionNumber?: number;
};

export class LessonEditorConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LessonEditorConflictError";
  }
}

function parseLessonVersion(
  lesson: Document,
  version: Document,
  exercises: Document[],
): LessonEditorValue {
  const parsed = createLessonDraftSchema.parse({
    defaultLocale: lesson.defaultLocale,
    slugs: lesson.slugs,
    primarySkill: version.primarySkill,
    lessonType: version.lessonType,
    learningLanguage: version.learningLanguage,
    localizations: version.localizations,
    cefrLevelMin: version.cefrLevelMin,
    cefrLevelMax: version.cefrLevelMax,
    audiences: version.audiences,
    ieltsMetadata: version.ieltsMetadata ?? null,
    primaryTopicId: version.primaryTopicId.toString(),
    secondaryTopicIds: (version.secondaryTopicIds ?? []).map(String),
    tagCodes: version.tagCodes ?? [],
    estimatedMinutes: version.estimatedMinutes,
    visibility: version.visibility,
    accessTier: version.accessTier,
    coverAssetId: version.coverAssetId?.toString() ?? null,
    prerequisiteLessonIds: (version.prerequisiteLessonIds ?? []).map(String),
    relatedLessonIds: (version.relatedLessonIds ?? []).map(String),
    exercises: exercises.map((exercise) => ({
      position: exercise.position,
      exerciseType: exercise.exerciseType,
      evaluationMode: exercise.evaluationMode,
      localizations: exercise.localizations,
      targetContent: exercise.targetContent ?? "",
      contextText: exercise.contextText ?? "",
      choices: exercise.choices ?? [],
      answerRubric: exercise.answerRubric ?? {},
      mediaAssetIds: (exercise.mediaAssetIds ?? []).map(String),
      estimatedSeconds: exercise.estimatedSeconds ?? null,
      isOptional: exercise.isOptional ?? false,
      isPreview: exercise.isPreview ?? false,
    })),
  });

  return {
    ...parsed,
    lessonId: lesson._id.toString(),
    revision: version.revision,
    versionId: version._id.toString(),
    versionNumber: version.versionNumber,
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

function contentHash(content: Omit<CreateLessonDraftInput, "defaultLocale" | "slugs">) {
  return createHash("sha256").update(JSON.stringify(canonicalize(content))).digest("hex");
}

function versionFields(content: Omit<CreateLessonDraftInput, "defaultLocale" | "slugs">) {
  return {
    primarySkill: content.primarySkill,
    lessonType: content.lessonType,
    learningLanguage: content.learningLanguage,
    localizations: content.localizations,
    cefrLevelMin: content.cefrLevelMin,
    cefrLevelMax: content.cefrLevelMax,
    audiences: content.audiences,
    ieltsMetadata: content.ieltsMetadata,
    primaryTopicId: new ObjectId(content.primaryTopicId),
    secondaryTopicIds: content.secondaryTopicIds.map((id) => new ObjectId(id)),
    tagCodes: content.tagCodes,
    estimatedMinutes: content.estimatedMinutes,
    visibility: content.visibility,
    accessTier: content.accessTier,
    coverAssetId: content.coverAssetId ? new ObjectId(content.coverAssetId) : null,
    prerequisiteLessonIds: content.prerequisiteLessonIds.map((id) => new ObjectId(id)),
    relatedLessonIds: content.relatedLessonIds.map((id) => new ObjectId(id)),
  };
}

async function validateReferences(
  database: Db,
  session: ClientSession,
  content: Omit<CreateLessonDraftInput, "defaultLocale" | "slugs">,
  lessonId?: ObjectId,
) {
  const topicIds = [...new Set([content.primaryTopicId, ...content.secondaryTopicIds])];
  const topicCount = await database.collection("content_topics").countDocuments(
    { _id: { $in: topicIds.map((id) => new ObjectId(id)) }, status: "ACTIVE" },
    { session },
  );
  if (topicCount !== topicIds.length) {
    throw new ContentValidationError(["One or more topics are missing or disabled."]);
  }

  const linkedIds = [...new Set([...content.prerequisiteLessonIds, ...content.relatedLessonIds])];
  if (lessonId && linkedIds.includes(lessonId.toString())) {
    throw new ContentValidationError(["A lesson cannot reference itself."]);
  }
  if (linkedIds.length > 0) {
    const lessonCount = await database.collection("lessons").countDocuments(
      {
        _id: { $in: linkedIds.map((id) => new ObjectId(id)) },
        publicationStatus: { $ne: "WITHDRAWN" },
      },
      { session },
    );
    if (lessonCount !== linkedIds.length) {
      throw new ContentValidationError(["One or more linked lessons are unavailable."]);
    }
  }
}

function exerciseDocuments(
  content: Omit<CreateLessonDraftInput, "defaultLocale" | "slugs">,
  versionId: ObjectId,
  actorId: ObjectId,
  now: Date,
) {
  return content.exercises.map((exercise) => ({
    ...exercise,
    lessonVersionId: versionId,
    mediaAssetIds: exercise.mediaAssetIds.map((id) => new ObjectId(id)),
    createdBy: actorId,
    lastEditedBy: actorId,
    createdAt: now,
    updatedAt: now,
  }));
}

function auditSummary(input: {
  contentHash: string;
  exerciseCount: number;
  revision: number;
  status: string;
  versionNumber: number;
}) {
  return input;
}

export async function getLessonEditorOptions() {
  const database = getMongoClient().db(getDatabaseEnv().databaseName);
  const topics = await database.collection("content_topics").aggregate<{
    _id: ObjectId;
    categoryCode?: string;
    categoryLocalizations?: Array<{ locale: string; name: string }>;
    code: string;
    localizations?: Array<{ locale: string; name: string }>;
  }>([
    { $match: { status: "ACTIVE" } },
    {
      $lookup: {
        from: "content_categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    { $match: { $or: [{ "category.status": "ACTIVE" }, { category: { $exists: false } }] } },
    { $sort: { "category.sortOrder": 1, sortOrder: 1, code: 1 } },
    {
      $project: {
        code: 1,
        localizations: 1,
        categoryCode: "$category.code",
        categoryLocalizations: "$category.localizations",
      },
    },
  ]).toArray();

  return topics.map((topic) => {
    const topicName = topic.localizations?.find((entry) => entry.locale === "vi")?.name
      ?? topic.localizations?.find((entry) => entry.locale === "en")?.name
      ?? topic.code;
    const categoryName = topic.categoryLocalizations?.find((entry) => entry.locale === "vi")?.name
      ?? topic.categoryLocalizations?.find((entry) => entry.locale === "en")?.name
      ?? topic.categoryCode
      ?? "Khác";
    return { id: topic._id.toString(), label: `${categoryName} / ${topicName}` };
  });
}

export async function loadLessonDraftForEditor(lessonId: string): Promise<LessonEditorValue | null> {
  if (!ObjectId.isValid(lessonId)) return null;
  const database = getMongoClient().db(getDatabaseEnv().databaseName);
  const lessonObjectId = new ObjectId(lessonId);
  const lesson = await database.collection("lessons").findOne({ _id: lessonObjectId });
  if (!lesson) return null;
  const version = await database.collection("lesson_versions").findOne({
    lessonId: lessonObjectId,
    isActiveWorkflow: true,
    status: "DRAFT",
  });
  if (!version) return null;
  const exercises = await database.collection("exercises")
    .find({ lessonVersionId: version._id })
    .sort({ position: 1 })
    .toArray();

  return parseLessonVersion(lesson, version, exercises);
}

export async function getLessonPreviewData(lessonId: string, requestedVersionId?: string) {
  if (!ObjectId.isValid(lessonId)) return null;
  if (requestedVersionId && !ObjectId.isValid(requestedVersionId)) return null;

  const database = getMongoClient().db(getDatabaseEnv().databaseName);
  const lessonObjectId = new ObjectId(lessonId);
  const [lesson, versions] = await Promise.all([
    database.collection("lessons").findOne({ _id: lessonObjectId }),
    database.collection("lesson_versions").find({ lessonId: lessonObjectId }).sort({ versionNumber: -1 }).toArray(),
  ]);
  if (!lesson || versions.length === 0) return null;

  const selected = requestedVersionId
    ? versions.find((version) => version._id.toString() === requestedVersionId)
    : versions.find((version) => version.isActiveWorkflow)
      ?? versions.find((version) => version._id.equals(lesson.currentPublishedVersionId))
      ?? versions[0];
  if (!selected) return null;

  const exercises = await database.collection("exercises")
    .find({ lessonVersionId: selected._id })
    .sort({ position: 1 })
    .toArray();

  return {
    selectedVersionId: selected._id.toString(),
    value: parseLessonVersion(lesson, selected, exercises),
    versions: versions.map((version) => ({
      id: version._id.toString(),
      revision: Number(version.revision),
      status: String(version.status),
      updatedAt: version.updatedAt as Date,
      versionNumber: Number(version.versionNumber),
    })),
  };
}

export async function createAdminLessonDraft(actorUserId: string, input: unknown) {
  const parsed = createLessonDraftSchema.parse(input);
  validateNewLessonIdentity(parsed);
  const { defaultLocale, slugs, ...content } = parsed;
  validateLessonContent(content, { publishReady: false });

  const client = getMongoClient();
  const database = client.db(getDatabaseEnv().databaseName);
  const session = client.startSession();
  const actorId = new ObjectId(actorUserId);
  try {
    return await session.withTransaction(async () => {
      await validateReferences(database, session, content);
      const now = new Date();
      const lessonId = new ObjectId();
      const versionId = new ObjectId();
      const hash = contentHash(content);
      await database.collection("lessons").insertOne({
        _id: lessonId,
        defaultLocale,
        slugs,
        publicationStatus: "NEVER_PUBLISHED",
        currentPublishedVersionId: null,
        latestVersionNumber: 1,
        createdBy: actorId,
        origin: null,
        publishedAt: null,
        archivedAt: null,
        withdrawnAt: null,
        createdAt: now,
        updatedAt: now,
      }, { session });
      await database.collection("lesson_versions").insertOne({
        _id: versionId,
        lessonId,
        versionNumber: 1,
        status: "DRAFT",
        revision: 1,
        isActiveWorkflow: true,
        contentHash: hash,
        ...versionFields(content),
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
      }, { session });
      const exerciseDocs = exerciseDocuments(content, versionId, actorId, now);
      if (exerciseDocs.length > 0) await database.collection("exercises").insertMany(exerciseDocs, { session });
      await database.collection("content_audit_logs").insertOne({
        actorId,
        resourceType: "LESSON",
        resourceId: lessonId,
        lessonVersionId: versionId,
        action: "LESSON_CREATED",
        beforeSummary: null,
        afterSummary: auditSummary({ contentHash: hash, exerciseCount: exerciseDocs.length, revision: 1, status: "DRAFT", versionNumber: 1 }),
        reason: "",
        occurredAt: now,
        createdAt: now,
      }, { session });
      return { lessonId: lessonId.toString(), lessonVersionId: versionId.toString(), revision: 1 };
    });
  } finally {
    await session.endSession();
  }
}

export async function updateAdminLessonDraft(
  actorUserId: string,
  lessonId: string,
  versionId: string,
  input: unknown,
) {
  if (!ObjectId.isValid(lessonId) || !ObjectId.isValid(versionId)) {
    throw new LessonEditorConflictError("Draft không còn tồn tại.");
  }
  const parsed = updateLessonDraftSchema.parse(input);
  const { expectedRevision, ...content } = parsed;
  validateLessonContent(content, { publishReady: false });

  const client = getMongoClient();
  const database = client.db(getDatabaseEnv().databaseName);
  const session = client.startSession();
  const actorId = new ObjectId(actorUserId);
  const lessonObjectId = new ObjectId(lessonId);
  const versionObjectId = new ObjectId(versionId);
  try {
    return await session.withTransaction(async () => {
      const existing = await database.collection("lesson_versions").findOne(
        {
          _id: versionObjectId,
          lessonId: lessonObjectId,
          status: "DRAFT",
          isActiveWorkflow: true,
          revision: expectedRevision,
        },
        { session },
      );
      if (!existing) throw new LessonEditorConflictError("Bản nháp đã thay đổi. Tải lại trang trước khi lưu tiếp.");
      await validateReferences(database, session, content, lessonObjectId);

      const now = new Date();
      const nextRevision = expectedRevision + 1;
      const hash = contentHash(content);
      const beforeSummary = auditSummary({
        contentHash: existing.contentHash,
        exerciseCount: await database.collection("exercises").countDocuments({ lessonVersionId: versionObjectId }, { session }),
        revision: existing.revision,
        status: existing.status,
        versionNumber: existing.versionNumber,
      });
      const updateResult = await database.collection("lesson_versions").updateOne(
        { _id: versionObjectId, revision: expectedRevision, status: "DRAFT" },
        {
          $set: {
            ...versionFields(content),
            contentHash: hash,
            lastEditedBy: actorId,
            revision: nextRevision,
            approval: null,
            scheduledBy: null,
            scheduledAt: null,
            updatedAt: now,
          },
        },
        { session },
      );
      if (updateResult.modifiedCount !== 1) throw new LessonEditorConflictError("Bản nháp đã thay đổi trong lúc lưu.");
      await database.collection("exercises").deleteMany({ lessonVersionId: versionObjectId }, { session });
      const exerciseDocs = exerciseDocuments(content, versionObjectId, actorId, now);
      if (exerciseDocs.length > 0) await database.collection("exercises").insertMany(exerciseDocs, { session });
      await database.collection("content_audit_logs").insertOne({
        actorId,
        resourceType: "LESSON",
        resourceId: lessonObjectId,
        lessonVersionId: versionObjectId,
        action: "DRAFT_UPDATED",
        beforeSummary,
        afterSummary: auditSummary({ contentHash: hash, exerciseCount: exerciseDocs.length, revision: nextRevision, status: "DRAFT", versionNumber: existing.versionNumber }),
        reason: "",
        occurredAt: now,
        createdAt: now,
      }, { session });
      return { lessonId, lessonVersionId: versionId, revision: nextRevision };
    });
  } finally {
    await session.endSession();
  }
}
