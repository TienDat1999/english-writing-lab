import "server-only";

import { createHash } from "node:crypto";
import { Types } from "mongoose";

import { connectMongoose } from "@/server/db/mongoose";
import { ResourceNotFoundError } from "@/server/http/errors";
import {
  Submission,
  type SubmissionDocument,
} from "@/server/submissions/submission.schema";

import type {
  CreateLearningItemInput,
  CreatePhraseLearningItemInput,
  ImportQuickLearningItemsInput,
  UploadedQuizType,
} from "./learning.contract";
import { LearningItem, type LearningItemDocument } from "./learning-item.schema";
import { ReviewAttempt } from "./review-attempt.schema";
import { seedLearningItems } from "./seed-learning-items";

type ItemWithId = LearningItemDocument & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
import {
  toView,
  getPagination,
  type LearningItemView,
  type PaginatedResult,
} from "./learning-item.view";
import {
  toUploadedQuizView,
  type UploadedQuizTopicView,
} from "./legacy/uploaded-quiz.mapper";
import { getSource } from "./sources/source-extractor.registry";

function requireObjectId(value: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new ResourceNotFoundError();
  }

  return new Types.ObjectId(value);
}

export async function createLearningItem(
  userId: string,
  input: CreateLearningItemInput,
) {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const submissionId = requireObjectId(input.submissionId);
  const submission = await Submission.findOne({
    _id: submissionId,
    userId: ownerId,
    deletedAt: null,
  });

  if (!submission) {
    throw new ResourceNotFoundError();
  }

  const source = getSource(submission, input);
  const fingerprint = createHash("sha256")
    .update(`${submissionId}:${input.sourceType}:${input.sourceIndex ?? "root"}`)
    .digest("hex");
  const item = await LearningItem.findOneAndUpdate(
    { userId: ownerId, fingerprint },
    {
      $setOnInsert: {
        userId: ownerId,
        sourceSubmissionId: submissionId,
        sourceType: input.sourceType,
        sourceIndex: input.sourceIndex,
        fingerprint,
        ...source,
        nextReviewAt: new Date(),
      },
      $set: { deletedAt: null },
    },
    { new: true, upsert: true },
  ).lean();

  return { item: toView(item as unknown as ItemWithId), created: item.createdAt.getTime() === item.updatedAt.getTime() };
}

export async function createPhraseLearningItem(
  userId: string,
  input: CreatePhraseLearningItemInput,
) {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const sourceItemId = requireObjectId(input.sourceLearningItemId);
  const sourceItem = await LearningItem.findOne({
    _id: sourceItemId,
    userId: ownerId,
    sourceType: "TRANSLATION",
    deletedAt: null,
  }).lean();

  if (!sourceItem) {
    throw new ResourceNotFoundError();
  }

  const latestAttempt = await ReviewAttempt.findOne({
    userId: ownerId,
    learningItemId: sourceItemId,
  })
    .sort({ reviewedAt: -1 })
    .lean();
  const allowedContexts = [
    latestAttempt?.correctedTranslation,
    latestAttempt?.upgradedTranslation,
  ].filter((value): value is string => Boolean(value));

  if (!allowedContexts.includes(input.contextText) || !input.contextText.includes(input.phrase)) {
    throw new ResourceNotFoundError();
  }

  const normalizedPhrase = input.phrase.toLocaleLowerCase("en").replace(/\s+/gu, " ");
  const fingerprint = createHash("sha256")
    .update(`${sourceItemId}:PHRASE:${normalizedPhrase}:${input.contextText}`)
    .digest("hex");
  const item = await LearningItem.findOneAndUpdate(
    { userId: ownerId, fingerprint },
    {
      $setOnInsert: {
        userId: ownerId,
        sourceSubmissionId: sourceItem.sourceSubmissionId,
        sourceType: "PHRASE",
        sourceIndex: null,
        fingerprint,
        title: "Quick phrase",
        promptText: input.contextText.replace(input.phrase, "_____"),
        answerText: input.phrase,
        hintVi: "Chọn hoặc gõ cụm từ phù hợp để hoàn thành câu.",
        contextText: input.contextText,
        nextReviewAt: new Date(),
      },
      $set: { deletedAt: null },
    },
    { new: true, upsert: true },
  ).lean();

  return { item: toView(item as unknown as ItemWithId), created: item.createdAt.getTime() === item.updatedAt.getTime() };
}

export async function importQuickLearningItems(
  userId: string,
  input: ImportQuickLearningItemsInput,
) {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const now = new Date();
  const sources = input.items.filter((source, index, items) => {
    const key = `${source.topic.toLocaleLowerCase("en")}:${source.prompt.toLocaleLowerCase("vi")}:${source.answer.toLocaleLowerCase("en")}`;
    return items.findIndex((candidate) => (
      `${candidate.topic.toLocaleLowerCase("en")}:${candidate.prompt.toLocaleLowerCase("vi")}:${candidate.answer.toLocaleLowerCase("en")}` === key
    )) === index;
  });
  const operations = sources.map((source) => {
    const normalizedTopic = source.topic.toLocaleLowerCase("en").replace(/\s+/gu, " ");
    const normalizedPrompt = source.prompt.toLocaleLowerCase("vi").replace(/\s+/gu, " ");
    const normalizedAnswer = source.answer.toLocaleLowerCase("en").replace(/\s+/gu, " ");
    const fingerprint = createHash("sha256")
      .update(`uploaded-quiz:${input.quizType}:${normalizedTopic}:${normalizedPrompt}:${normalizedAnswer}`)
      .digest("hex");
    const topicEnglish = source.topic.split(" — ")[0];
    const sourceEnglish = source.context.split(" = ")[0];
    const legacyPrompt = source.topic === "100 cặp Synonym"
      ? `Synonym of "${sourceEnglish}": _____`
      : `Paraphrase "${topicEnglish}": _____`;
    const legacyFingerprint = createHash("sha256")
      .update(`quick-import:${legacyPrompt.toLocaleLowerCase("en")}:${normalizedAnswer}`)
      .digest("hex");

    return {
      updateOne: {
        filter: {
          userId: ownerId,
          fingerprint: { $in: [fingerprint, legacyFingerprint] },
        },
        update: {
          $setOnInsert: {
            userId: ownerId,
            sourceSubmissionId: null,
            sourceIndex: null,
            nextReviewAt: now,
          },
          $set: {
            sourceType: "UPLOADED_QUIZ",
            quizType: input.quizType,
            fingerprint,
            title: "Uploaded Quick Quiz",
            topicText: source.topic,
            promptText: source.prompt,
            answerText: source.answer,
            applicationPromptVi: source.applicationPromptVi,
            applicationReferenceEn: "",
            hintVi: "",
            contextText: source.context || `${source.prompt} ${source.answer}`,
            deletedAt: null,
          },
        },
        upsert: true,
      },
    } as const;
  });
  const result = await LearningItem.bulkWrite(operations, { ordered: false });

  return {
    imported: sources.length,
    created: result.upsertedCount,
    existing: sources.length - result.upsertedCount,
  };
}

export type ListLearningItemsOptions = {
  search?: string;
  sourceType?: string;
  status?: string;
};

export async function listLearningItems(
  userId: string,
  requestedPage = 1,
  requestedPageSize = 6,
  options?: ListLearningItemsOptions,
): Promise<PaginatedResult<LearningItemView>> {
  await connectMongoose();
  const { page, pageSize } = getPagination(requestedPage, requestedPageSize);
  const ownerId = requireObjectId(userId);

  const filter: Record<string, unknown> = {
    userId: ownerId,
    deletedAt: null,
    title: { $ne: "Imported Quick Quiz" },
  };

  if (options?.sourceType && options.sourceType !== "ALL") {
    filter.sourceType = options.sourceType;
  } else {
    filter.sourceType = { $ne: "UPLOADED_QUIZ" };
  }

  if (options?.status && options.status !== "ALL") {
    if (options.status === "DUE") {
      filter.nextReviewAt = { $lte: new Date() };
    } else {
      filter.status = options.status;
    }
  }

  if (options?.search) {
    const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { promptText: { $regex: escaped, $options: "i" } },
      { answerText: { $regex: escaped, $options: "i" } },
      { hintVi: { $regex: escaped, $options: "i" } },
      { topicText: { $regex: escaped, $options: "i" } },
      { title: { $regex: escaped, $options: "i" } },
    ];
  }

  const [totalItems, items] = await Promise.all([
    LearningItem.countDocuments(filter),
    LearningItem.find(filter)
      .sort({ createdAt: -1, nextReviewAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);

  const submissionIds = [
    ...new Set(
      items
        .map((item) => item.sourceSubmissionId)
        .filter((id): id is Types.ObjectId => Boolean(id)),
    ),
  ];

  let submissionMap = new Map<string, { promptText: string; taskType: string; submittedAt?: Date; createdAt?: Date }>();

  if (submissionIds.length > 0) {
    const submissions = await Submission.find({
      _id: { $in: submissionIds },
    })
      .select({ _id: 1, promptText: 1, taskType: 1, submittedAt: 1, createdAt: 1 })
      .lean();

    submissionMap = new Map(
      submissions.map((s) => [s._id.toString(), s]),
    );
  }

  return {
    items: items.map((item) => toView(item as unknown as ItemWithId, submissionMap)),
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

export async function listDueLearningItems(userId: string): Promise<LearningItemView[]> {
  await connectMongoose();
  const items = await LearningItem.find({
    userId: requireObjectId(userId),
    deletedAt: null,
    sourceType: { $ne: "UPLOADED_QUIZ" },
    title: { $ne: "Imported Quick Quiz" },
    nextReviewAt: { $lte: new Date() },
  })
    .sort({ nextReviewAt: 1 })
    .limit(100)
    .lean();

  return items
    .sort((left, right) => Number(right.sourceType === "TRANSLATION") - Number(left.sourceType === "TRANSLATION"))
    .slice(0, 20)
    .map((item) => toView(item as unknown as ItemWithId));
}

export async function listQuickLearningItems(userId: string): Promise<LearningItemView[]> {
  await connectMongoose();
  const items = await LearningItem.find({
    userId: requireObjectId(userId),
    sourceType: "PHRASE",
    title: { $ne: "Imported Quick Quiz" },
    deletedAt: null,
  })
    .sort({ nextReviewAt: 1, createdAt: -1 })
    .limit(50)
    .lean();

  return items.map((item) => toView(item as unknown as ItemWithId));
}

export async function listUploadedQuickLearningItems(
  userId: string,
  topic?: string,
  quizType?: UploadedQuizType,
): Promise<LearningItemView[]> {
  await connectMongoose();
  const items = await LearningItem.find({
    userId: requireObjectId(userId),
    deletedAt: null,
    $or: [
      { sourceType: "UPLOADED_QUIZ" },
      { sourceType: "PHRASE", title: "Imported Quick Quiz" },
    ],
  })
    .sort({ nextReviewAt: 1, createdAt: -1 })
    .limit(1_000)
    .lean();
  const views = items.map((item) => toUploadedQuizView(item as unknown as ItemWithId));
  const selected = views.filter((item) => (
    (!topic || item.topicText === topic)
    && (!quizType || item.quizType === quizType)
  ));

  return selected.slice(0, 50);
}

export async function listUploadedQuizTopics(
  userId: string,
  quizType: UploadedQuizType,
  requestedPage = 1,
  requestedPageSize = 6,
  search?: string,
): Promise<PaginatedResult<UploadedQuizTopicView>> {
  await connectMongoose();
  const { page, pageSize } = getPagination(requestedPage, requestedPageSize);
  const legacyPromptPattern = quizType === "SYNONYM" ? /^Synonym of /u : /^Paraphrase /u;
  const legacyMatch =
    quizType === "TEMPLATE" || quizType === "COLLOCATION" || quizType === "TOPIC_VOCABULARY"
      ? null
      : {
          sourceType: "PHRASE",
          title: "Imported Quick Quiz",
          promptText: legacyPromptPattern,
        };
  const legacyTopicExpression = quizType === "SYNONYM"
    ? "100 cặp Synonym"
    : {
        $let: {
          vars: {
            promptMatch: {
              $regexFind: {
                input: "$promptText",
                regex: /^Paraphrase "(.+)": _____$/u,
              },
            },
          },
          in: {
            $concat: [
              { $arrayElemAt: ["$$promptMatch.captures", 0] },
              " — ",
              { $arrayElemAt: [{ $split: [{ $ifNull: ["$hintVi", ""] }, " · "] }, 0] },
            ],
          },
        },
      };
  const [result] = await LearningItem.aggregate<{
    items: Array<{ _id: string; completedCount: number; count: number }>;
    total: Array<{ count: number }>;
  }>([
    {
      $match: {
        userId: requireObjectId(userId),
        deletedAt: null,
        $or: [
          { sourceType: "UPLOADED_QUIZ", quizType },
          ...(legacyMatch ? [legacyMatch] : []),
        ],
      },
    },
    {
      $project: {
        completed: { $ne: [{ $ifNull: ["$lastReviewedAt", null] }, null] },
        topic: {
          $cond: [
            { $eq: ["$sourceType", "UPLOADED_QUIZ"] },
            "$topicText",
            legacyTopicExpression,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$topic",
        count: { $sum: 1 },
        completedCount: { $sum: { $cond: ["$completed", 1, 0] } },
      },
    },
    ...(search && search.trim()
      ? [
          {
            $match: {
              _id: {
                $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                $options: "i",
              },
            },
          },
        ]
      : []),
    { $sort: { _id: 1 } },
    {
      $facet: {
        items: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);
  const totalItems = result?.total[0]?.count ?? 0;

  return {
    items: (result?.items ?? []).map((item) => ({
      topic: item._id,
      count: item.count,
      completedCount: item.completedCount,
      completed: item.completedCount === item.count,
      quizType,
    })),
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

export async function getLearningStats(userId: string) {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const now = new Date();
  const [stats] = await LearningItem.aggregate<{
    total: number;
    due: number;
    mastered: number;
    quick: number;
    uploaded: number;
  }>([
    { $match: { userId: ownerId, deletedAt: null } },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$sourceType", "UPLOADED_QUIZ"] },
                  { $ne: ["$title", "Imported Quick Quiz"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        due: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$sourceType", "UPLOADED_QUIZ"] },
                  { $ne: ["$title", "Imported Quick Quiz"] },
                  { $lte: ["$nextReviewAt", now] },
                ],
              },
              1,
              0,
            ],
          },
        },
        mastered: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$sourceType", "UPLOADED_QUIZ"] },
                  { $ne: ["$title", "Imported Quick Quiz"] },
                  { $eq: ["$status", "MASTERED"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        quick: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$sourceType", "PHRASE"] },
                  { $ne: ["$title", "Imported Quick Quiz"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        uploaded: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $eq: ["$sourceType", "UPLOADED_QUIZ"] },
                  {
                    $and: [
                      { $eq: ["$sourceType", "PHRASE"] },
                      { $eq: ["$title", "Imported Quick Quiz"] },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $project: { _id: 0, total: 1, due: 1, mastered: 1, quick: 1, uploaded: 1 } },
  ]);

  return stats ?? { total: 0, due: 0, mastered: 0, quick: 0, uploaded: 0 };
}

export async function syncLearningItemsFromCompletedSubmissions(userId: string) {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const submissions = await Submission.aggregate<{
    _id: Types.ObjectId;
    promptText: string;
    originalText: string;
    analysis: NonNullable<SubmissionDocument["analysis"]>;
  }>([
    {
      $match: {
        userId: ownerId,
        deletedAt: null,
        status: "COMPLETED",
        analysis: { $ne: null },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "learning_items",
        let: { submissionId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", ownerId] },
                  { $eq: ["$sourceSubmissionId", "$$submissionId"] },
                ],
              },
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
        as: "learningItems",
      },
    },
    { $match: { learningItems: { $eq: [] } } },
    { $limit: 5 },
    { $project: { promptText: 1, originalText: 1, analysis: 1 } },
  ]);

  await Promise.all(
    submissions.map((submission) => seedLearningItems({
      userId: ownerId,
      submissionId: submission._id,
      promptText: submission.promptText,
      originalText: submission.originalText,
      analysis: submission.analysis,
    })),
  );
}

export async function deleteLearningItem(userId: string, learningItemId: string) {
  await connectMongoose();
  const result = await LearningItem.updateOne(
    {
      _id: requireObjectId(learningItemId),
      userId: requireObjectId(userId),
      deletedAt: null,
    },
    { $set: { deletedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    throw new ResourceNotFoundError();
  }
}
