import { type ClientSession, Types } from "mongoose";

import { Lesson } from "./lesson.schema";

/**
 * Find a lesson by its ObjectId.
 */
export async function findLessonById(
  id: Types.ObjectId,
  session?: ClientSession,
) {
  const query = Lesson.findById(id);
  if (session) query.session(session);
  return query;
}

/**
 * Find a single lesson matching the given filter.
 */
export async function findOneLesson(
  filter: Parameters<typeof Lesson.findOne>[0],
  session?: ClientSession,
) {
  const query = Lesson.findOne(filter);
  if (session) query.session(session);
  return query;
}

/**
 * Count lessons whose _id is in `ids` and whose publicationStatus is not WITHDRAWN.
 * Used to validate linked lesson references.
 */
export async function countLessonsByIds(
  ids: Types.ObjectId[],
  session?: ClientSession,
) {
  const query = Lesson.countDocuments({
    _id: { $in: ids },
    publicationStatus: { $ne: "WITHDRAWN" },
  });
  if (session) query.session(session);
  return query;
}

/**
 * Create a new Lesson document and save it within the given session.
 */
export async function createLesson(
  data: ConstructorParameters<typeof Lesson>[0],
  session?: ClientSession,
) {
  const lesson = new Lesson(data);
  await lesson.save({ session });
  return lesson;
}

/**
 * Atomically increment `latestVersionNumber` on a lesson and return the updated document.
 */
export async function incrementLessonVersionNumber(
  id: Types.ObjectId,
  session?: ClientSession,
) {
  return Lesson.findByIdAndUpdate(
    id,
    { $inc: { latestVersionNumber: 1 } },
    { new: true, session },
  );
}
