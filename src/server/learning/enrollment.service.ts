import "server-only";

import { createHash } from "node:crypto";
import { type AnyBulkWriteOperation, Types } from "mongoose";

import { connectMongoose } from "@/server/db/mongoose";
import { ResourceNotFoundError } from "@/server/http/errors";
import { ContentCollection } from "@/server/content/collection.schema";
import { Exercise } from "@/server/content/exercise.schema";
import { Lesson, LessonVersion } from "@/server/content/lesson.schema";
import { ContentTopic } from "@/server/content/taxonomy.schema";
import { LearningItem } from "./learning-item.schema";
import type { UploadedQuizType } from "./learning.contract";

type LocalizationEntry = { locale: string; name: string };

function mapLessonTypeToQuizType(lessonType: string): UploadedQuizType {
  switch (lessonType) {
    case "COLLOCATION":
      return "COLLOCATION";
    case "TOPIC_VOCABULARY":
      return "TOPIC_VOCABULARY";
    case "SYNONYM":
      return "SYNONYM";
    case "PARAPHRASE":
      return "PARAPHRASE";
    case "SENTENCE_PATTERN":
    case "TEMPLATE":
      return "TEMPLATE";
    default:
      return "COLLOCATION";
  }
}

function getTopicName(localizations: LocalizationEntry[], fallback: string): string {
  return (
    localizations?.find((l) => l.locale === "vi")?.name
    || localizations?.[0]?.name
    || fallback
  );
}

function extractExerciseItem(
  ex: unknown,
  quizType: UploadedQuizType,
  topicName: string,
) {
  const typedEx = ex as {
    localizations?: Array<{
      locale: string;
      promptText?: string;
      instruction?: string;
    }>;
    targetContent?: string;
    contextText?: string;
    answerRubric?: { correctAnswer?: string | null };
  };

  const exLocalizations = typedEx.localizations ?? [];
  const locVi = exLocalizations.find((l) => l.locale === "vi") || exLocalizations[0];
  const targetContent = (typedEx.targetContent || "").trim();
  const contextText = (typedEx.contextText || "").trim();
  const answerRubric = typedEx.answerRubric;

  const rawPrompt = (locVi?.promptText || "").trim();
  const cleanedPrompt = rawPrompt.replace(/^(Ý nghĩa|Nghĩa):\s*/i, "").trim();

  let answerText = "";
  let promptText = "";

  if (quizType === "COLLOCATION") {
    // For collocations: targetContent is the full English collocation (e.g. "make a decision")
    // whereas answerRubric.correctAnswer was only the missing verb (e.g. "make")
    answerText = targetContent || answerRubric?.correctAnswer || "";
    promptText = cleanedPrompt || targetContent || `Luyện tập ${topicName}`;
  } else if (quizType === "TOPIC_VOCABULARY") {
    answerText = targetContent || answerRubric?.correctAnswer || "";
    promptText = cleanedPrompt || `Luyện tập ${topicName}`;
  } else {
    answerText = answerRubric?.correctAnswer || targetContent || "";
    promptText = cleanedPrompt || locVi?.promptText || targetContent || `Luyện tập ${topicName}`;
  }

  const hintVi = locVi?.instruction || "";
  const ctx = contextText || targetContent;

  return { promptText, answerText, hintVi, ctx };
}

export async function enrollLessonForUser(userId: string, lessonSlug: string) {
  await connectMongoose();
  const ownerId = new Types.ObjectId(userId);

  const lesson = await Lesson.findOne({
    publicationStatus: "PUBLISHED",
    slugs: { $elemMatch: { slug: lessonSlug.toLowerCase() } },
    currentPublishedVersionId: { $ne: null },
  }).lean();

  if (!lesson?.currentPublishedVersionId) {
    throw new ResourceNotFoundError();
  }

  const version = await LessonVersion.findOne({
    _id: lesson.currentPublishedVersionId,
    status: "PUBLISHED",
  }).lean();

  if (!version) {
    throw new ResourceNotFoundError();
  }

  const [topic, exercises] = await Promise.all([
    ContentTopic.findOne({ _id: version.primaryTopicId }).lean(),
    Exercise.find({ lessonVersionId: version._id }).sort({ position: 1 }).lean(),
  ]);

  const topicName = getTopicName(
    (topic?.localizations ?? []) as LocalizationEntry[],
    lesson.slugs?.[0]?.slug || "Chủ đề học",
  );

  const quizType = mapLessonTypeToQuizType(version.lessonType as string);
  const now = new Date();

  // Clean up any stale partial items for this user/topic
  await LearningItem.deleteMany({
    userId: ownerId,
    topicText: topicName,
    quizType,
    $or: [
      { promptText: { $regex: /^Ý nghĩa:/i } },
      { answerText: { $in: ["make", "take", "give", "do", "set", "put", "raise", "hold"] } },
    ],
  });

  const operations: AnyBulkWriteOperation[] = exercises.map((ex) => {
    const { promptText, answerText, hintVi, ctx } = extractExerciseItem(ex, quizType, topicName);

    const fingerprint = createHash("sha256")
      .update(`uploaded-quiz:${quizType}:${topicName.toLowerCase()}:${promptText.toLowerCase()}:${answerText.toLowerCase()}`)
      .digest("hex");

    return {
      updateOne: {
        filter: { userId: ownerId, fingerprint },
        update: {
          $setOnInsert: {
            userId: ownerId,
            sourceSubmissionId: null,
            sourceIndex: null,
            nextReviewAt: now,
          },
          $set: {
            sourceType: "UPLOADED_QUIZ",
            quizType,
            fingerprint,
            title: "Lesson Quiz",
            topicText: topicName,
            promptText,
            answerText,
            hintVi,
            contextText: ctx,
            applicationPromptVi: "",
            applicationReferenceEn: "",
            deletedAt: null,
          },
        },
        upsert: true,
      },
    };
  });

  if (operations.length > 0) {
    await LearningItem.bulkWrite(operations, { ordered: false });
  }

  return {
    success: true,
    topicText: topicName,
    quizType,
    enrolledCount: operations.length,
  };
}

export async function enrollCollectionForUser(userId: string, collectionSlug: string) {
  await connectMongoose();
  const ownerId = new Types.ObjectId(userId);

  const collection = await ContentCollection.findOne({
    slugs: { $elemMatch: { slug: collectionSlug.toLowerCase() } },
    status: "PUBLISHED",
  }).lean();

  if (!collection) {
    throw new ResourceNotFoundError();
  }

  const lessonIds = (collection.items as Array<{ lessonId: Types.ObjectId }>).map(
    (item) => item.lessonId,
  );

  const lessons = await Lesson.find({
    _id: { $in: lessonIds },
    publicationStatus: "PUBLISHED",
    currentPublishedVersionId: { $ne: null },
  }).lean();

  const versionIds = lessons
    .map((l) => (l as { currentPublishedVersionId?: Types.ObjectId }).currentPublishedVersionId)
    .filter((id): id is Types.ObjectId => Boolean(id));

  const [versions, topics, allExercises] = await Promise.all([
    LessonVersion.find({ _id: { $in: versionIds } }).lean(),
    ContentTopic.find({}).lean(),
    Exercise.find({ lessonVersionId: { $in: versionIds } }).sort({ position: 1 }).lean(),
  ]);

  const versionMap = new Map(versions.map((v) => [v._id.toString(), v]));
  const topicMap = new Map(
    topics.map((t) => [
      t._id.toString(),
      (t.localizations as LocalizationEntry[]),
    ]),
  );
  const now = new Date();

  // Clean up any stale partial items
  await LearningItem.deleteMany({
    userId: ownerId,
    quizType: "COLLOCATION",
    $or: [
      { promptText: { $regex: /^Ý nghĩa:/i } },
      { answerText: { $in: ["make", "take", "give", "do", "set", "put", "raise", "hold"] } },
    ],
  });

  const operations: AnyBulkWriteOperation[] = [];

  for (const ex of allExercises) {
    const exVersionId = (ex as { lessonVersionId: Types.ObjectId }).lessonVersionId;
    const version = versionMap.get(exVersionId.toString());
    if (!version) continue;

    const versionTyped = version as { lessonType: string; primaryTopicId: Types.ObjectId };
    const topicLocalizations = topicMap.get(versionTyped.primaryTopicId.toString()) ?? [];
    const topicName = getTopicName(topicLocalizations, "Chủ đề học");

    const quizType = mapLessonTypeToQuizType(versionTyped.lessonType);
    const { promptText, answerText, hintVi, ctx } = extractExerciseItem(ex, quizType, topicName);

    const fingerprint = createHash("sha256")
      .update(`uploaded-quiz:${quizType}:${topicName.toLowerCase()}:${promptText.toLowerCase()}:${answerText.toLowerCase()}`)
      .digest("hex");

    operations.push({
      updateOne: {
        filter: { userId: ownerId, fingerprint },
        update: {
          $setOnInsert: {
            userId: ownerId,
            sourceSubmissionId: null,
            sourceIndex: null,
            nextReviewAt: now,
          },
          $set: {
            sourceType: "UPLOADED_QUIZ",
            quizType,
            fingerprint,
            title: "Collection Quiz",
            topicText: topicName,
            promptText,
            answerText,
            hintVi,
            contextText: ctx,
            applicationPromptVi: "",
            applicationReferenceEn: "",
            deletedAt: null,
          },
        },
        upsert: true,
      },
    });
  }

  if (operations.length > 0) {
    await LearningItem.bulkWrite(operations, { ordered: false });
  }

  return {
    success: true,
    totalItems: operations.length,
    topicCount: lessons.length,
  };
}
