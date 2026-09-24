import { type ClientSession, Types } from "mongoose";

import { LessonVersion } from "./lesson.schema";

/**
 * Find a lesson version by its ObjectId.
 */
export async function findLessonVersionById(
  id: Types.ObjectId,
  session?: ClientSession,
) {
  const query = LessonVersion.findById(id);
  if (session) query.session(session);
  return query;
}

/**
 * Find a single lesson version matching the given filter.
 */
export async function findOneLessonVersion(
  filter: Parameters<typeof LessonVersion.findOne>[0],
  session?: ClientSession,
) {
  const query = LessonVersion.findOne(filter);
  if (session) query.session(session);
  return query;
}

/**
 * Find a draft version by its id and expected revision number.
 * Used for optimistic-concurrency checks in updateLessonDraft.
 */
export async function findDraftVersionByRevision(
  id: Types.ObjectId,
  revision: number,
  session?: ClientSession,
) {
  const query = LessonVersion.findOne({ _id: id, status: "DRAFT", revision });
  if (session) query.session(session);
  return query;
}

/**
 * Return whether a LessonVersion with the given id exists at all.
 */
export async function existsLessonVersionById(
  id: Types.ObjectId,
  session?: ClientSession,
) {
  const query = LessonVersion.exists({ _id: id });
  if (session) query.session(session);
  return query;
}

/**
 * Return whether any version for the given lesson currently has isActiveWorkflow = true.
 */
export async function existsActiveWorkflow(
  lessonId: Types.ObjectId,
  session?: ClientSession,
) {
  const query = LessonVersion.exists({ lessonId, isActiveWorkflow: true });
  if (session) query.session(session);
  return query;
}

/**
 * Create a new LessonVersion document and save it within the given session.
 */
export async function createLessonVersion(
  data: ConstructorParameters<typeof LessonVersion>[0],
  session?: ClientSession,
) {
  const version = new LessonVersion(data);
  await version.save({ session });
  return version;
}

/**
 * Atomically mark a version as CHANGES_REQUESTED → DRAFT, incrementing revision.
 * Returns the updated document or null if not found.
 */
export async function resumeLessonVersionEditing(
  id: Types.ObjectId,
  lastEditedBy: Types.ObjectId,
) {
  return LessonVersion.findOneAndUpdate(
    { _id: id, status: "CHANGES_REQUESTED" },
    {
      $set: { status: "DRAFT", lastEditedBy },
      $inc: { revision: 1 },
    },
    { new: true },
  );
}

/**
 * Atomically schedule an approved version.
 * Returns the updated document or null if not found / not in APPROVED status.
 */
export async function scheduleLessonVersion(
  id: Types.ObjectId,
  data: {
    scheduledAt: Date;
    scheduledTimezone: string;
    scheduledOverrideReason: string | null;
    scheduledBy: Types.ObjectId;
  },
) {
  return LessonVersion.findOneAndUpdate(
    { _id: id, status: "APPROVED", approval: { $ne: null } },
    {
      $set: {
        status: "SCHEDULED",
        scheduledAt: data.scheduledAt,
        scheduledTimezone: data.scheduledTimezone,
        scheduledOverrideReason: data.scheduledOverrideReason,
        scheduledBy: data.scheduledBy,
      },
    },
    { new: true },
  );
}

/**
 * Atomically cancel a scheduled version back to APPROVED.
 * Returns the updated document or null if not found / not SCHEDULED.
 */
export async function cancelScheduledVersion(id: Types.ObjectId) {
  return LessonVersion.findOneAndUpdate(
    { _id: id, status: "SCHEDULED" },
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
}

/**
 * Atomically cancel a version that is in DRAFT or CHANGES_REQUESTED status.
 * Returns the updated document or null if not found / wrong status.
 */
export async function cancelLessonVersionWorkflow(id: Types.ObjectId) {
  return LessonVersion.findOneAndUpdate(
    {
      _id: id,
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
}

/**
 * Mark the given version as SUPERSEDED within a transaction session.
 */
export async function supersedeLessonVersion(
  id: Types.ObjectId,
  session: ClientSession,
) {
  return LessonVersion.updateOne(
    { _id: id, status: "PUBLISHED" },
    { $set: { status: "SUPERSEDED", supersededAt: new Date() } },
    { session },
  );
}

/**
 * Mark any version as SUPERSEDED (used during rollback — does not filter on current status).
 */
export async function supersedeLessonVersionForRollback(
  id: Types.ObjectId,
  session: ClientSession,
) {
  return LessonVersion.updateOne(
    { _id: id },
    { $set: { status: "SUPERSEDED", supersededAt: new Date() } },
    { session },
  );
}
