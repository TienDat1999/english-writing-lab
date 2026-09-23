import "server-only";

import { createHash } from "node:crypto";

import {
  ContentValidationError,
  validateLessonContent,
  validateNewLessonIdentity,
} from "@draftwise/content";
import { type ClientSession, Types } from "mongoose";

import { requirePermission } from "@/server/auth/authorization";
import { ForbiddenError } from "@/server/auth/authorization.errors";
import { appendContentAudit } from "@/server/audit/audit.service";
import type { AuditSummary } from "@/server/audit/audit.constants";
import { connectMongoose } from "@/server/db/mongoose";
import { ResourceNotFoundError } from "@/server/http/errors";

import {
  approveVersionSchema,
  createLessonDraftSchema,
  lifecycleReasonSchema,
  publishVersionSchema,
  requestChangesSchema,
  scheduleVersionSchema,
  updateLessonDraftSchema,
  type CreateLessonDraftInput,
  type ExerciseDraftInput,
} from "./content.contract";
import { Exercise } from "./exercise.schema";
import { Lesson, LessonVersion } from "./lesson.schema";
import { ContentTopic } from "./taxonomy.schema";
import {
  ContentOutboxEvent,
  LessonPublicationEvent,
  LessonReviewComment,
} from "./content-workflow.schema";

export class ContentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentConflictError";
  }
}

export { ContentValidationError } from "@draftwise/content";

function toObjectId(value: string) {
  return new Types.ObjectId(value);
}

type AuthorizedActor = Awaited<ReturnType<typeof requirePermission>>;

function versionAuditSummary(
  version: {
    contentHash: string;
    revision: number;
    status: string;
    versionNumber: number;
  },
  exerciseCount?: number,
): AuditSummary {
  return {
    contentHash: version.contentHash,
    exerciseCount: exerciseCount ?? null,
    revision: version.revision,
    status: version.status,
    versionNumber: version.versionNumber,
  };
}

function requirePublishSeparation(
  actor: AuthorizedActor,
  reviewerId: Types.ObjectId,
  overrideReason: string | null,
) {
  if (overrideReason && !actor.isAdmin) throw new ForbiddenError();
  if (!reviewerId.equals(actor.objectId)) return;
  if (!actor.isAdmin) throw new ForbiddenError();
  if (!overrideReason) {
    throw new ContentValidationError([
      "Admin publish override requires a reason when publishing their own approval.",
    ]);
  }
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

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
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(content)))
    .digest("hex");
}

function versionFields(
  input: Omit<CreateLessonDraftInput, "defaultLocale" | "slugs">,
) {
  return {
    primarySkill: input.primarySkill,
    lessonType: input.lessonType,
    learningLanguage: input.learningLanguage,
    localizations: input.localizations,
    cefrLevelMin: input.cefrLevelMin,
    cefrLevelMax: input.cefrLevelMax,
    audiences: input.audiences,
    ieltsMetadata: input.ieltsMetadata,
    primaryTopicId: toObjectId(input.primaryTopicId),
    secondaryTopicIds: input.secondaryTopicIds.map(toObjectId),
    tagCodes: input.tagCodes,
    estimatedMinutes: input.estimatedMinutes,
    visibility: input.visibility,
    accessTier: input.accessTier,
    coverAssetId: input.coverAssetId ? toObjectId(input.coverAssetId) : null,
    prerequisiteLessonIds: input.prerequisiteLessonIds.map(toObjectId),
    relatedLessonIds: input.relatedLessonIds.map(toObjectId),
  };
}

function exerciseFields(
  exercise: ExerciseDraftInput,
  lessonVersionId: Types.ObjectId,
  actorId: Types.ObjectId,
) {
  return {
    lessonVersionId,
    position: exercise.position,
    exerciseType: exercise.exerciseType,
    evaluationMode: exercise.evaluationMode,
    localizations: exercise.localizations,
    targetContent: exercise.targetContent,
    contextText: exercise.contextText,
    choices: exercise.choices,
    answerRubric: exercise.answerRubric,
    mediaAssetIds: exercise.mediaAssetIds.map(toObjectId),
    estimatedSeconds: exercise.estimatedSeconds,
    isOptional: exercise.isOptional,
    isPreview: exercise.isPreview,
    createdBy: actorId,
    lastEditedBy: actorId,
  };
}

async function validateReferences(
  content: Omit<CreateLessonDraftInput, "defaultLocale" | "slugs">,
  session: ClientSession,
  lessonId?: Types.ObjectId,
) {
  const topicIds = [...new Set([content.primaryTopicId, ...content.secondaryTopicIds])];
  const topicCount = await ContentTopic.countDocuments({
    _id: { $in: topicIds.map(toObjectId) },
    status: "ACTIVE",
  }).session(session);

  if (topicCount !== topicIds.length) {
    throw new ContentValidationError(["One or more topics are missing or disabled."]);
  }

  const linkedLessonIds = [
    ...new Set([...content.prerequisiteLessonIds, ...content.relatedLessonIds]),
  ];

  if (lessonId && linkedLessonIds.includes(lessonId.toString())) {
    throw new ContentValidationError(["A lesson cannot reference itself."]);
  }

  if (linkedLessonIds.length > 0) {
    const lessonCount = await Lesson.countDocuments({
      _id: { $in: linkedLessonIds.map(toObjectId) },
      publicationStatus: { $ne: "WITHDRAWN" },
    }).session(session);

    if (lessonCount !== linkedLessonIds.length) {
      throw new ContentValidationError(["One or more linked lessons are unavailable."]);
    }
  }
}

function versionContentFromDocuments(
  version: InstanceType<typeof LessonVersion>,
  exercises: Array<InstanceType<typeof Exercise>>,
): Omit<CreateLessonDraftInput, "defaultLocale" | "slugs"> {
  return createLessonDraftSchema.omit({ defaultLocale: true, slugs: true }).parse({
    primarySkill: version.primarySkill,
    lessonType: version.lessonType,
    learningLanguage: version.learningLanguage,
    localizations: version.localizations.map(
      (localization: { toObject(): unknown }) => localization.toObject(),
    ),
    cefrLevelMin: version.cefrLevelMin,
    cefrLevelMax: version.cefrLevelMax,
    audiences: version.audiences,
    ieltsMetadata: version.ieltsMetadata?.toObject() ?? null,
    primaryTopicId: version.primaryTopicId.toString(),
    secondaryTopicIds: version.secondaryTopicIds.map(String),
    tagCodes: version.tagCodes,
    estimatedMinutes: version.estimatedMinutes,
    visibility: version.visibility,
    accessTier: version.accessTier,
    coverAssetId: version.coverAssetId?.toString() ?? null,
    prerequisiteLessonIds: version.prerequisiteLessonIds.map(String),
    relatedLessonIds: version.relatedLessonIds.map(String),
    exercises: exercises.map((exercise) => ({
      position: exercise.position,
      exerciseType: exercise.exerciseType,
      evaluationMode: exercise.evaluationMode,
      localizations: exercise.localizations.map(
        (localization: { toObject(): unknown }) => localization.toObject(),
      ),
      targetContent: exercise.targetContent,
      contextText: exercise.contextText,
      choices: exercise.choices,
      answerRubric: exercise.answerRubric.toObject(),
      mediaAssetIds: exercise.mediaAssetIds.map(String),
      estimatedSeconds: exercise.estimatedSeconds ?? null,
      isOptional: exercise.isOptional,
      isPreview: exercise.isPreview,
    })),
  });
}

async function loadVersionContent(versionId: Types.ObjectId, session: ClientSession) {
  const version = await LessonVersion.findById(versionId).session(session);
  if (!version) throw new ResourceNotFoundError();

  const exercises = await Exercise.find({ lessonVersionId: versionId })
    .sort({ position: 1 })
    .session(session);
  const content = versionContentFromDocuments(version, exercises);

  return { version, exercises, content };
}

async function addPublicationRecords(
  session: ClientSession,
  input: {
    actorId: Types.ObjectId;
    eventType: "PUBLISHED" | "ROLLED_BACK" | "ARCHIVED" | "RESTORED" | "WITHDRAWN";
    lessonId: Types.ObjectId;
    lessonVersionId: Types.ObjectId;
    previousVersionId?: Types.ObjectId | null;
    reason?: string;
  },
) {
  const occurredAt = new Date();
  await LessonPublicationEvent.create(
    [{ ...input, previousVersionId: input.previousVersionId ?? null, occurredAt }],
    { session },
  );
  await ContentOutboxEvent.create(
    [{
      aggregateType: "LESSON",
      aggregateId: input.lessonId,
      eventType: `lesson.${input.eventType.toLocaleLowerCase("en")}`,
      payload: {
        lessonId: input.lessonId.toString(),
        lessonVersionId: input.lessonVersionId.toString(),
        previousVersionId: input.previousVersionId?.toString() ?? null,
        occurredAt: occurredAt.toISOString(),
      },
    }],
    { session },
  );
}

export async function createLessonDraft(
  actorUserId: string,
  input: CreateLessonDraftInput,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_DRAFT_CREATE");
  const parsed = createLessonDraftSchema.parse(input);
  const { defaultLocale, slugs, ...content } = parsed;
  validateNewLessonIdentity(parsed);
  validateLessonContent(content, { publishReady: false });

  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();
  let result: { lessonId: string; lessonVersionId: string } | undefined;

  try {
    await session.withTransaction(async () => {
      await validateReferences(content, session);
      const lesson = new Lesson({
        defaultLocale,
        slugs,
        latestVersionNumber: 1,
        createdBy: actor.objectId,
      });
      await lesson.save({ session });

      const version = new LessonVersion({
        lessonId: lesson._id,
        versionNumber: 1,
        status: "DRAFT",
        revision: 1,
        contentHash: contentHash(content),
        ...versionFields(content),
        createdBy: actor.objectId,
        lastEditedBy: actor.objectId,
      });
      await version.save({ session });

      if (content.exercises.length > 0) {
        await Exercise.insertMany(
          content.exercises.map((exercise) =>
            exerciseFields(exercise, version._id, actor.objectId),
          ),
          { session },
        );
      }

      await appendContentAudit(session, {
        action: "LESSON_CREATED",
        actorId: actor.objectId,
        afterSummary: versionAuditSummary(version, content.exercises.length),
        lessonVersionId: version._id,
        resourceId: lesson._id,
      });

      result = {
        lessonId: lesson._id.toString(),
        lessonVersionId: version._id.toString(),
      };
    });
  } finally {
    await session.endSession();
  }

  if (!result) throw new ContentConflictError("Lesson draft was not created.");
  return result;
}

export async function updateLessonDraft(
  actorUserId: string,
  versionId: string,
  input: unknown,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_DRAFT_EDIT");
  const parsed = updateLessonDraftSchema.parse(input);
  const { expectedRevision, ...content } = parsed;
  validateLessonContent(content, { publishReady: false });

  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();
  const objectId = toObjectId(versionId);
  let nextRevision: number | undefined;

  try {
    await session.withTransaction(async () => {
      const existing = await LessonVersion.findOne({
        _id: objectId,
        status: "DRAFT",
        revision: expectedRevision,
      }).session(session);

      if (!existing) {
        const found = await LessonVersion.exists({ _id: objectId }).session(session);
        if (!found) throw new ResourceNotFoundError();
        throw new ContentConflictError("Draft revision or status has changed.");
      }

      const beforeSummary = versionAuditSummary(existing);

      await validateReferences(content, session, existing.lessonId);
      existing.set({
        ...versionFields(content),
        contentHash: contentHash(content),
        lastEditedBy: actor.objectId,
        revision: existing.revision + 1,
        approval: null,
        scheduledBy: null,
        scheduledAt: null,
      });
      await existing.save({ session });

      await Exercise.deleteMany({ lessonVersionId: objectId }).session(session);
      if (content.exercises.length > 0) {
        await Exercise.insertMany(
          content.exercises.map((exercise) =>
            exerciseFields(exercise, objectId, actor.objectId),
          ),
          { session },
        );
      }
      await appendContentAudit(session, {
        action: "DRAFT_UPDATED",
        actorId: actor.objectId,
        afterSummary: versionAuditSummary(existing, content.exercises.length),
        beforeSummary,
        lessonVersionId: existing._id,
        resourceId: existing.lessonId,
      });
      nextRevision = existing.revision;
    });
  } finally {
    await session.endSession();
  }

  if (!nextRevision) throw new ContentConflictError("Draft was not updated.");
  return { lessonVersionId: versionId, revision: nextRevision };
}

export async function resumeVersionEditing(
  actorUserId: string,
  versionId: string,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_DRAFT_EDIT");
  await connectMongoose();
  const version = await LessonVersion.findOneAndUpdate(
    { _id: toObjectId(versionId), status: "CHANGES_REQUESTED" },
    {
      $set: { status: "DRAFT", lastEditedBy: actor.objectId },
      $inc: { revision: 1 },
    },
    { new: true },
  );

  if (!version) throw new ContentConflictError("Version is not awaiting changes.");
  return { lessonVersionId: version.id, revision: version.revision };
}

export async function clonePublishedLessonVersion(
  actorUserId: string,
  lessonId: string,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_DRAFT_CREATE");
  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();
  const lessonObjectId = toObjectId(lessonId);
  let result: { lessonVersionId: string; versionNumber: number } | undefined;

  try {
    await session.withTransaction(async () => {
      const lesson = await Lesson.findById(lessonObjectId).session(session);
      if (!lesson?.currentPublishedVersionId) throw new ResourceNotFoundError();

      const source = await loadVersionContent(lesson.currentPublishedVersionId, session);
      const activeVersion = await LessonVersion.exists({
        lessonId: lessonObjectId,
        isActiveWorkflow: true,
      }).session(session);
      if (activeVersion) {
        throw new ContentConflictError("Lesson already has an active version workflow.");
      }

      const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonObjectId,
        { $inc: { latestVersionNumber: 1 } },
        { new: true, session },
      );
      if (!updatedLesson) throw new ResourceNotFoundError();

      const version = new LessonVersion({
        lessonId: lessonObjectId,
        versionNumber: updatedLesson.latestVersionNumber,
        status: "DRAFT",
        revision: 1,
        contentHash: contentHash(source.content),
        ...versionFields(source.content),
        createdBy: actor.objectId,
        lastEditedBy: actor.objectId,
      });
      await version.save({ session });
      await Exercise.insertMany(
        source.content.exercises.map((exercise) =>
          exerciseFields(exercise, version._id, actor.objectId),
        ),
        { session },
      );

      await appendContentAudit(session, {
        action: "VERSION_CLONED",
        actorId: actor.objectId,
        afterSummary: versionAuditSummary(version, source.content.exercises.length),
        beforeSummary: {
          sourceVersionId: source.version._id.toString(),
          sourceVersionNumber: source.version.versionNumber,
        },
        lessonVersionId: version._id,
        resourceId: lessonObjectId,
      });

      result = {
        lessonVersionId: version._id.toString(),
        versionNumber: version.versionNumber,
      };
    });
  } finally {
    await session.endSession();
  }

  if (!result) throw new ContentConflictError("Lesson version was not cloned.");
  return result;
}

export async function submitVersionForReview(
  actorUserId: string,
  versionId: string,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_DRAFT_EDIT");
  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();
  const objectId = toObjectId(versionId);

  try {
    await session.withTransaction(async () => {
      const { version, content } = await loadVersionContent(objectId, session);
      if (version.status !== "DRAFT") {
        throw new ContentConflictError("Only draft versions can enter review.");
      }
      const beforeSummary = versionAuditSummary(version, content.exercises.length);

      validateLessonContent(content, { publishReady: true });
      await validateReferences(content, session, version.lessonId);
      version.set({
        status: "IN_REVIEW",
        submittedBy: actor.objectId,
        submittedAt: new Date(),
        contentHash: contentHash(content),
      });
      await version.save({ session });
      await appendContentAudit(session, {
        action: "REVIEW_SUBMITTED",
        actorId: actor.objectId,
        afterSummary: versionAuditSummary(version, content.exercises.length),
        beforeSummary,
        lessonVersionId: version._id,
        resourceId: version.lessonId,
      });
    });
  } finally {
    await session.endSession();
  }

  return { lessonVersionId: versionId, status: "IN_REVIEW" as const };
}

export async function requestVersionChanges(
  actorUserId: string,
  versionId: string,
  input: unknown,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_REVIEW_COMMENT");
  const parsed = requestChangesSchema.parse(input);
  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();
  const objectId = toObjectId(versionId);

  try {
    await session.withTransaction(async () => {
      const version = await LessonVersion.findOne({
        _id: objectId,
        status: "IN_REVIEW",
      }).session(session);
      if (!version) throw new ContentConflictError("Version is not in review.");

      const beforeSummary = versionAuditSummary(version);

      const [comment] = await LessonReviewComment.create(
        [{
          lessonVersionId: objectId,
          authorId: actor.objectId,
          severity: parsed.severity,
          message: parsed.message,
        }],
        { session },
      );
      version.status = "CHANGES_REQUESTED";
      version.approval = null;
      await version.save({ session });
      await appendContentAudit(session, {
        action: "CHANGES_REQUESTED",
        actorId: actor.objectId,
        afterSummary: {
          ...versionAuditSummary(version),
          reviewCommentId: comment._id.toString(),
          severity: parsed.severity,
        },
        beforeSummary,
        lessonVersionId: version._id,
        reason: parsed.message,
        resourceId: version.lessonId,
      });
    });
  } finally {
    await session.endSession();
  }

  return { lessonVersionId: versionId, status: "CHANGES_REQUESTED" as const };
}

export async function resolveReviewComment(
  actorUserId: string,
  commentId: string,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_REVIEW_COMMENT");
  await connectMongoose();
  const comment = await LessonReviewComment.findOneAndUpdate(
    { _id: toObjectId(commentId), resolvedAt: null },
    { $set: { resolvedAt: new Date(), resolvedBy: actor.objectId } },
    { new: true },
  );
  if (!comment) throw new ResourceNotFoundError();

  return { commentId: comment.id, resolvedAt: comment.resolvedAt };
}

export async function approveLessonVersion(
  actorUserId: string,
  versionId: string,
  input: unknown,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_REVIEW_APPROVE");
  const parsed = approveVersionSchema.parse(input);
  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();
  const objectId = toObjectId(versionId);

  try {
    await session.withTransaction(async () => {
      const { version, content } = await loadVersionContent(objectId, session);
      if (version.status !== "IN_REVIEW") {
        throw new ContentConflictError("Version is not in review.");
      }
      const beforeSummary = versionAuditSummary(version, content.exercises.length);
      if (parsed.overrideReason && !actor.isAdmin) {
        throw new ForbiddenError();
      }
      if (!actor.isAdmin && version.lastEditedBy.equals(actor.objectId)) {
        throw new ForbiddenError();
      }
      if (actor.isAdmin && version.lastEditedBy.equals(actor.objectId) && !parsed.overrideReason) {
        throw new ContentValidationError([
          "Admin approval override requires a reason when approving their own edit.",
        ]);
      }

      const blockingComments = await LessonReviewComment.countDocuments({
        lessonVersionId: objectId,
        severity: "BLOCKING",
        resolvedAt: null,
      }).session(session);
      if (blockingComments > 0) {
        throw new ContentConflictError("Blocking review comments remain unresolved.");
      }

      validateLessonContent(content, { publishReady: true });
      await validateReferences(content, session, version.lessonId);
      const currentHash = contentHash(content);
      if (currentHash !== version.contentHash) {
        throw new ContentConflictError("Version content changed after review started.");
      }

      version.set({
        status: "APPROVED",
        approval: {
          reviewerId: actor.objectId,
          contentHash: currentHash,
          summary: parsed.summary,
          overrideReason: parsed.overrideReason,
          approvedAt: new Date(),
        },
      });
      await version.save({ session });
      await appendContentAudit(session, {
        action: "REVIEW_APPROVED",
        actorId: actor.objectId,
        afterSummary: versionAuditSummary(version, content.exercises.length),
        beforeSummary,
        lessonVersionId: version._id,
        reason: parsed.overrideReason ?? parsed.summary,
        resourceId: version.lessonId,
      });
    });
  } finally {
    await session.endSession();
  }

  return { lessonVersionId: versionId, status: "APPROVED" as const };
}

export async function scheduleLessonVersion(
  actorUserId: string,
  versionId: string,
  input: unknown,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_PUBLISH");
  const parsed = scheduleVersionSchema.parse(input);

  if (parsed.scheduledAt.getTime() <= Date.now()) {
    throw new ContentValidationError(["Scheduled publish time must be in the future."]);
  }

  await connectMongoose();
  const approvedVersion = await LessonVersion.findOne({
    _id: toObjectId(versionId),
    status: "APPROVED",
    approval: { $ne: null },
  });
  if (!approvedVersion?.approval) {
    throw new ContentConflictError("Only approved versions can be scheduled.");
  }
  requirePublishSeparation(
    actor,
    approvedVersion.approval.reviewerId,
    parsed.overrideReason,
  );

  const version = await LessonVersion.findOneAndUpdate(
    { _id: toObjectId(versionId), status: "APPROVED", approval: { $ne: null } },
    {
      $set: {
        status: "SCHEDULED",
        scheduledAt: parsed.scheduledAt,
        scheduledTimezone: parsed.timezone,
        scheduledOverrideReason: parsed.overrideReason,
        scheduledBy: actor.objectId,
      },
    },
    { new: true },
  );
  if (!version) throw new ContentConflictError("Only approved versions can be scheduled.");

  return {
    lessonVersionId: version.id,
    status: version.status,
    scheduledAt: version.scheduledAt,
    timezone: version.scheduledTimezone,
  };
}

export async function cancelScheduledLessonVersion(
  actorUserId: string,
  versionId: string,
) {
  await requirePermission(actorUserId, "CONTENT_PUBLISH");
  await connectMongoose();
  const version = await LessonVersion.findOneAndUpdate(
    { _id: toObjectId(versionId), status: "SCHEDULED" },
    {
      $set: {
        status: "APPROVED",
        scheduledAt: null,
        scheduledTimezone: null,
        scheduledOverrideReason: null,
        scheduledBy: null,
      },
    },
    { new: true },
  );
  if (!version) throw new ContentConflictError("Version is not scheduled.");

  return { lessonVersionId: version.id, status: version.status };
}

async function publishVersion(
  versionId: Types.ObjectId,
  actor: AuthorizedActor,
  allowedStatus: "APPROVED" | "SCHEDULED",
  overrideReason: string | null,
) {
  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();
  let result: { lessonId: string; lessonVersionId: string } | undefined;

  try {
    await session.withTransaction(async () => {
      const { version, content } = await loadVersionContent(versionId, session);
      if (allowedStatus === "SCHEDULED" && version.status === "PUBLISHED") {
        const publishedLesson = await Lesson.findOne({
          _id: version.lessonId,
          currentPublishedVersionId: version._id,
          publicationStatus: "PUBLISHED",
        }).session(session);
        if (!publishedLesson) {
          throw new ContentConflictError("Published version is no longer current.");
        }
        result = {
          lessonId: publishedLesson._id.toString(),
          lessonVersionId: version._id.toString(),
        };
        return;
      }

      if (version.status !== allowedStatus || !version.approval) {
        throw new ContentConflictError(`Version is not ${allowedStatus.toLocaleLowerCase("en")}.`);
      }
      requirePublishSeparation(actor, version.approval.reviewerId, overrideReason);

      validateLessonContent(content, { publishReady: true });
      await validateReferences(content, session, version.lessonId);
      const currentHash = contentHash(content);
      if (
        currentHash !== version.contentHash ||
        currentHash !== version.approval.contentHash
      ) {
        throw new ContentConflictError("Approval is stale and the version must be reviewed again.");
      }

      const lesson = await Lesson.findById(version.lessonId).session(session);
      if (!lesson) throw new ResourceNotFoundError();
      if (lesson.publicationStatus === "WITHDRAWN") {
        throw new ContentConflictError("Withdrawn lessons require a separate recovery review.");
      }

      const beforeSummary: AuditSummary = {
        currentPublishedVersionId: lesson.currentPublishedVersionId?.toString() ?? null,
        publicationStatus: lesson.publicationStatus,
        versionStatus: version.status,
      };

      const previousVersionId = lesson.currentPublishedVersionId;
      if (previousVersionId && !previousVersionId.equals(version._id)) {
        await LessonVersion.updateOne(
          { _id: previousVersionId, status: "PUBLISHED" },
          { $set: { status: "SUPERSEDED", supersededAt: new Date() } },
          { session },
        );
      }

      const publishedAt = new Date();
      version.set({
        status: "PUBLISHED",
        isActiveWorkflow: false,
        publishedBy: actor.objectId,
        publishedAt,
        publishedOverrideReason: overrideReason,
        supersededAt: null,
      });
      await version.save({ session });

      lesson.set({
        currentPublishedVersionId: version._id,
        publicationStatus: "PUBLISHED",
        publishedAt,
        archivedAt: null,
      });
      await lesson.save({ session });

      await addPublicationRecords(session, {
        actorId: actor.objectId,
        eventType: "PUBLISHED",
        lessonId: lesson._id,
        lessonVersionId: version._id,
        previousVersionId,
        reason: overrideReason ?? "",
      });
      await appendContentAudit(session, {
        action: "PUBLISHED",
        actorId: actor.objectId,
        afterSummary: {
          currentPublishedVersionId: version._id.toString(),
          publicationStatus: lesson.publicationStatus,
          versionStatus: version.status,
        },
        beforeSummary,
        lessonVersionId: version._id,
        reason: overrideReason ?? "",
        resourceId: lesson._id,
      });

      result = {
        lessonId: lesson._id.toString(),
        lessonVersionId: version._id.toString(),
      };
    });
  } finally {
    await session.endSession();
  }

  if (!result) throw new ContentConflictError("Lesson was not published.");
  return result;
}

export async function publishLessonVersion(
  actorUserId: string,
  versionId: string,
  input: unknown = {},
) {
  const actor = await requirePermission(actorUserId, "CONTENT_PUBLISH");
  const parsed = publishVersionSchema.parse(input);
  return publishVersion(
    toObjectId(versionId),
    actor,
    "APPROVED",
    parsed.overrideReason,
  );
}

export async function publishScheduledLessonVersion(
  versionId: string,
  now = new Date(),
) {
  await connectMongoose();
  const version = await LessonVersion.findById(toObjectId(versionId));
  if (version?.status === "PUBLISHED" && version.scheduledBy) {
    const actor = await requirePermission(version.scheduledBy.toString(), "CONTENT_PUBLISH");
    return publishVersion(
      version._id,
      actor,
      "SCHEDULED",
      version.scheduledOverrideReason ?? null,
    );
  }
  if (!version?.scheduledBy) {
    throw new ContentConflictError("Scheduled version is not ready to publish.");
  }
  if (version.status !== "SCHEDULED" || !version.scheduledAt || version.scheduledAt > now) {
    throw new ContentConflictError("Scheduled version is not ready to publish.");
  }

  const actor = await requirePermission(version.scheduledBy.toString(), "CONTENT_PUBLISH");
  return publishVersion(
    version._id,
    actor,
    "SCHEDULED",
    version.scheduledOverrideReason ?? null,
  );
}

export async function cancelLessonVersion(
  actorUserId: string,
  versionId: string,
) {
  await requirePermission(actorUserId, "CONTENT_DRAFT_EDIT");
  await connectMongoose();
  const version = await LessonVersion.findOneAndUpdate(
    {
      _id: toObjectId(versionId),
      status: { $in: ["DRAFT", "CHANGES_REQUESTED"] },
    },
    {
      $set: {
        status: "CANCELLED",
        isActiveWorkflow: false,
        cancelledAt: new Date(),
      },
    },
    { new: true },
  );
  if (!version) throw new ContentConflictError("Only editable versions can be cancelled.");

  return { lessonVersionId: version.id, status: version.status };
}

export async function archiveLesson(
  actorUserId: string,
  lessonId: string,
  input: unknown,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_ARCHIVE");
  const { reason } = lifecycleReasonSchema.parse(input);
  return changeLessonAvailability(actor.objectId, lessonId, "ARCHIVED", reason);
}

export async function restoreLesson(
  actorUserId: string,
  lessonId: string,
  input: unknown,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_ARCHIVE");
  const { reason } = lifecycleReasonSchema.parse(input);
  return changeLessonAvailability(actor.objectId, lessonId, "PUBLISHED", reason);
}

async function changeLessonAvailability(
  actorId: Types.ObjectId,
  lessonId: string,
  target: "ARCHIVED" | "PUBLISHED",
  reason: string,
) {
  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();
  const lessonObjectId = toObjectId(lessonId);

  try {
    await session.withTransaction(async () => {
      const expectedStatus = target === "ARCHIVED" ? "PUBLISHED" : "ARCHIVED";
      const lesson = await Lesson.findOne({
        _id: lessonObjectId,
        publicationStatus: expectedStatus,
        currentPublishedVersionId: { $ne: null },
      }).session(session);
      if (!lesson?.currentPublishedVersionId) {
        throw new ContentConflictError(`Lesson cannot transition to ${target}.`);
      }

      const beforeSummary: AuditSummary = {
        currentPublishedVersionId: lesson.currentPublishedVersionId.toString(),
        publicationStatus: lesson.publicationStatus,
      };

      if (target === "PUBLISHED") {
        const { content } = await loadVersionContent(
          lesson.currentPublishedVersionId,
          session,
        );
        validateLessonContent(content, { publishReady: true });
        await validateReferences(content, session, lesson._id);
      }

      lesson.set({
        publicationStatus: target,
        archivedAt: target === "ARCHIVED" ? new Date() : null,
      });
      await lesson.save({ session });
      await addPublicationRecords(session, {
        actorId,
        eventType: target === "ARCHIVED" ? "ARCHIVED" : "RESTORED",
        lessonId: lesson._id,
        lessonVersionId: lesson.currentPublishedVersionId,
        reason,
      });
      await appendContentAudit(session, {
        action: target === "ARCHIVED" ? "ARCHIVED" : "RESTORED",
        actorId,
        afterSummary: {
          currentPublishedVersionId: lesson.currentPublishedVersionId.toString(),
          publicationStatus: lesson.publicationStatus,
        },
        beforeSummary,
        lessonVersionId: lesson.currentPublishedVersionId,
        reason,
        resourceId: lesson._id,
      });
    });
  } finally {
    await session.endSession();
  }

  return { lessonId, publicationStatus: target };
}

export async function rollbackLesson(
  actorUserId: string,
  lessonId: string,
  targetVersionId: string,
  input: unknown,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_ROLLBACK");
  const { reason } = lifecycleReasonSchema.parse(input);
  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();
  const lessonObjectId = toObjectId(lessonId);
  const versionObjectId = toObjectId(targetVersionId);

  try {
    await session.withTransaction(async () => {
      const lesson = await Lesson.findOne({
        _id: lessonObjectId,
        publicationStatus: { $in: ["PUBLISHED", "ARCHIVED"] },
      }).session(session);
      if (!lesson?.currentPublishedVersionId) throw new ResourceNotFoundError();
      if (lesson.currentPublishedVersionId.equals(versionObjectId)) {
        throw new ContentConflictError("Target version is already current.");
      }

      const beforeSummary: AuditSummary = {
        currentPublishedVersionId: lesson.currentPublishedVersionId.toString(),
        publicationStatus: lesson.publicationStatus,
      };

      const { version: targetVersion, content } = await loadVersionContent(
        versionObjectId,
        session,
      );
      if (
        !targetVersion.lessonId.equals(lesson._id) ||
        !targetVersion.publishedAt ||
        targetVersion.status !== "SUPERSEDED"
      ) {
        throw new ContentConflictError("Target is not a previous published version.");
      }

      validateLessonContent(content, { publishReady: true });
      await validateReferences(content, session, lesson._id);

      const previousVersionId = lesson.currentPublishedVersionId;
      await LessonVersion.updateOne(
        { _id: previousVersionId },
        { $set: { status: "SUPERSEDED", supersededAt: new Date() } },
        { session },
      );
      targetVersion.set({ status: "PUBLISHED", supersededAt: null });
      await targetVersion.save({ session });

      lesson.set({
        currentPublishedVersionId: targetVersion._id,
        publicationStatus: "PUBLISHED",
        archivedAt: null,
        publishedAt: new Date(),
      });
      await lesson.save({ session });
      await addPublicationRecords(session, {
        actorId: actor.objectId,
        eventType: "ROLLED_BACK",
        lessonId: lesson._id,
        lessonVersionId: targetVersion._id,
        previousVersionId,
        reason,
      });
      await appendContentAudit(session, {
        action: "ROLLED_BACK",
        actorId: actor.objectId,
        afterSummary: {
          currentPublishedVersionId: targetVersion._id.toString(),
          publicationStatus: lesson.publicationStatus,
        },
        beforeSummary,
        lessonVersionId: targetVersion._id,
        reason,
        resourceId: lesson._id,
      });
    });
  } finally {
    await session.endSession();
  }

  return { lessonId, lessonVersionId: targetVersionId, publicationStatus: "PUBLISHED" as const };
}

export async function withdrawLesson(
  actorUserId: string,
  lessonId: string,
  input: unknown,
) {
  const actor = await requirePermission(actorUserId, "CONTENT_WITHDRAW");
  const { reason } = lifecycleReasonSchema.parse(input);
  const mongoose = await connectMongoose();
  const session = await mongoose.startSession();
  const lessonObjectId = toObjectId(lessonId);

  try {
    await session.withTransaction(async () => {
      const lesson = await Lesson.findOne({
        _id: lessonObjectId,
        publicationStatus: { $in: ["PUBLISHED", "ARCHIVED"] },
        currentPublishedVersionId: { $ne: null },
      }).session(session);
      if (!lesson?.currentPublishedVersionId) {
        throw new ContentConflictError("Lesson cannot be withdrawn.");
      }

      const beforeSummary: AuditSummary = {
        currentPublishedVersionId: lesson.currentPublishedVersionId.toString(),
        publicationStatus: lesson.publicationStatus,
      };

      lesson.set({ publicationStatus: "WITHDRAWN", withdrawnAt: new Date() });
      await lesson.save({ session });
      await addPublicationRecords(session, {
        actorId: actor.objectId,
        eventType: "WITHDRAWN",
        lessonId: lesson._id,
        lessonVersionId: lesson.currentPublishedVersionId,
        reason,
      });
      await appendContentAudit(session, {
        action: "WITHDRAWN",
        actorId: actor.objectId,
        afterSummary: {
          currentPublishedVersionId: lesson.currentPublishedVersionId.toString(),
          publicationStatus: lesson.publicationStatus,
        },
        beforeSummary,
        lessonVersionId: lesson.currentPublishedVersionId,
        reason,
        resourceId: lesson._id,
      });
    });
  } finally {
    await session.endSession();
  }

  return { lessonId, publicationStatus: "WITHDRAWN" as const };
}
