import { type ClientSession, Types } from "mongoose";

import { Exercise } from "./exercise.schema";

/**
 * Find all exercises belonging to a lesson version, ordered by position ascending.
 */
export async function findExercisesByVersionId(
  versionId: Types.ObjectId,
  session?: ClientSession,
) {
  const query = Exercise.find({ lessonVersionId: versionId }).sort({ position: 1 });
  if (session) query.session(session);
  return query;
}

/**
 * Delete all exercises belonging to the given lesson version.
 */
export async function deleteExercisesByVersionId(
  versionId: Types.ObjectId,
  session?: ClientSession,
) {
  return Exercise.deleteMany({ lessonVersionId: versionId }).session(
    session as ClientSession,
  );
}

/**
 * Bulk-insert exercise documents within an optional session.
 */
export async function insertExercises(
  exercises: Parameters<typeof Exercise.insertMany>[0],
  session?: ClientSession,
) {
  return Exercise.insertMany(exercises, { session });
}
