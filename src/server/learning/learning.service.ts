import "server-only";

import { createHash } from "node:crypto";
import { Types } from "mongoose";

import { ApplicationPromptGateway } from "@/server/ai/application-prompt.gateway";
import { getAiEnv } from "@/config/ai-env";
import {
  TranslationReviewGateway,
  type TranslationEvaluation,
} from "@/server/ai/translation-review.gateway";
import { connectMongoose } from "@/server/db/mongoose";
import { ResourceNotFoundError } from "@/server/http/errors";
import { Submission } from "@/server/submissions/submission.schema";

import type {
  CreateLearningItemInput,
  CreatePhraseLearningItemInput,
  ImportQuickLearningItemsInput,
  ReviewRating,
  UploadedQuizType,
} from "./learning.contract";
import { LearningItem, type LearningItemDocument } from "./learning-item.schema";
import { ReviewAttempt } from "./review-attempt.schema";
import { seedLearningItems } from "./seed-learning-items";

type LearningSource = {
  title: string;
  promptText: string;
  answerText: string;
  hintVi: string;
  contextText: string;
};

export type LearningSubmissionInfo = {
  id: string;
  promptText: string;
  taskType?: string;
  submittedAt?: string;
};

export type LearningItemView = {
  id: string;
  sourceSubmissionId?: string | null;
  submission?: LearningSubmissionInfo | null;
  sourceType: "VOCABULARY" | "GRAMMAR" | "ESSAY_BLUEPRINT" | "TRANSLATION" | "PHRASE" | "UPLOADED_QUIZ";
  title: string;
  topicText: string;
  quizType: UploadedQuizType | null;
  promptText: string;
  answerText: string;
  applicationPromptVi: string;
  hintVi: string;
  contextText: string;
  status: "NEW" | "PRACTICING" | "FAMILIAR" | "MASTERED" | "REVIEW";
  repetitions: number;
  intervalDays: number;
  nextReviewAt: string;
  createdAt: string;
};

function requireObjectId(value: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new ResourceNotFoundError();
  }

  return new Types.ObjectId(value);
}

function toView(
  item: LearningItemDocument & { _id: Types.ObjectId },
  submissionMap?: Map<string, { promptText: string; taskType: string; submittedAt?: Date; createdAt?: Date }>,
): LearningItemView {
  const submissionIdStr = item.sourceSubmissionId ? item.sourceSubmissionId.toString() : null;
  const sub = submissionIdStr && submissionMap ? submissionMap.get(submissionIdStr) : null;

  return {
    id: item._id.toString(),
    sourceSubmissionId: submissionIdStr,
    submission: submissionIdStr && sub ? {
      id: submissionIdStr,
      promptText: sub.promptText || "Bài viết của bạn",
      taskType: sub.taskType,
      submittedAt: (sub.submittedAt || sub.createdAt || item.createdAt)?.toISOString(),
    } : null,
    sourceType: item.sourceType,
    title: item.title,
    topicText: item.topicText ?? "",
    quizType: item.quizType ?? null,
    promptText: item.promptText,
    answerText: item.sourceType === "TRANSLATION" ? "" : item.answerText,
    applicationPromptVi: item.applicationPromptVi ?? "",
    hintVi: item.hintVi ?? "",
    contextText: item.contextText ?? "",
    status: item.status,
    repetitions: item.repetitions,
    intervalDays: item.intervalDays,
    nextReviewAt: item.nextReviewAt.toISOString(),
    createdAt: (item.createdAt ?? new Date()).toISOString(),
  };
}

function getLegacyUploadedQuizContent(item: LearningItemDocument) {
  const paraphraseMatch = item.promptText.match(/^Paraphrase "(.+)": _____$/u);

  if (paraphraseMatch) {
    const separatorIndex = (item.hintVi ?? "").indexOf(" · ");
    const topicVi = separatorIndex >= 0 ? item.hintVi.slice(0, separatorIndex) : item.hintVi;
    const promptVi = separatorIndex >= 0 ? item.hintVi.slice(separatorIndex + 3) : item.hintVi;

    return {
      topicText: `${paraphraseMatch[1]} — ${topicVi}`,
      promptText: promptVi || topicVi,
    };
  }

  return {
    topicText: "100 cặp Synonym",
    promptText: item.hintVi || item.promptText,
  };
}

function toUploadedQuizView(item: LearningItemDocument & { _id: Types.ObjectId }): LearningItemView {
  const view = toView(item);
  const legacyContent = item.title === "Imported Quick Quiz"
    ? getLegacyUploadedQuizContent(item)
    : null;

  return {
    ...view,
    sourceType: "UPLOADED_QUIZ",
    topicText: legacyContent?.topicText || view.topicText || "Chưa phân loại",
    quizType: view.quizType
      ?? ((legacyContent?.topicText || view.topicText) === "100 cặp Synonym" ? "SYNONYM" : "PARAPHRASE"),
    promptText: legacyContent?.promptText || view.promptText,
    hintVi: "",
  };
}

export type UploadedQuizTopicView = {
  topic: string;
  count: number;
  completedCount: number;
  completed: boolean;
  quizType: UploadedQuizType;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

function getPagination(page = 1, pageSize = 6) {
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 60) : 6,
  };
}

function getSource(
  submission: Awaited<ReturnType<typeof Submission.findOne>>,
  input: CreateLearningItemInput,
): LearningSource {
  const analysis = submission?.analysis;

  if (!analysis) {
    throw new ResourceNotFoundError();
  }

  if (input.sourceType === "VOCABULARY") {
    const item = analysis.vocabularyUpgrades?.[input.sourceIndex ?? -1];

    if (!item) {
      throw new ResourceNotFoundError();
    }

    return {
      title: "Academic expression",
      promptText: `Viết lại theo cách tự nhiên và học thuật hơn: “${item.originalExpression}”`,
      answerText: item.upgradedExpression,
      hintVi: item.meaningVi,
      contextText: submission.originalText,
    };
  }

  if (input.sourceType === "GRAMMAR") {
    const item = analysis.grammarCorrections?.[input.sourceIndex ?? -1];

    if (!item) {
      throw new ResourceNotFoundError();
    }

    return {
      title: "Grammar correction",
      promptText: `Sửa câu sau: “${item.sourceQuote}”`,
      answerText: item.correctionText,
      hintVi: `${item.correctionVi} ${item.explanationVi}`.trim(),
      contextText: submission.originalText,
    };
  }

  if (input.sourceType === "TRANSLATION") {
    const item = analysis.translationPractice?.[input.sourceIndex ?? -1];

    if (!item) {
      throw new ResourceNotFoundError();
    }

    return {
      title: "Vietnamese to English",
      promptText: item.sourceVi,
      answerText: item.targetEn,
      hintVi: `${item.focusPattern} — ${item.explanationVi}`,
      contextText: submission.promptText,
    };
  }

  if (!analysis.rewrittenEssay) {
    throw new ResourceNotFoundError();
  }

  return {
    title: "Essay blueprint",
    promptText: submission.promptText
      ? `Nhớ lại bố cục và các luận điểm chính cho đề: ${submission.promptText}`
      : "Nhớ lại bố cục và các luận điểm chính của bài viết mẫu này.",
    answerText: analysis.rewrittenEssay,
    hintVi: analysis.rewrittenEssayVi ?? "",
    contextText: analysis.structuralWeaknesses?.join("\n") ?? "",
  };
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

  return { item: toView(item), created: item.createdAt.getTime() === item.updatedAt.getTime() };
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

  return { item: toView(item), created: item.createdAt.getTime() === item.updatedAt.getTime() };
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
    items: items.map((item) => toView(item, submissionMap)),
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
    .map((item) => toView(item));
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

  return items.map((item) => toView(item));
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
  const views = items.map(toUploadedQuizView);
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
  const [total, due, mastered, quick, uploaded] = await Promise.all([
    LearningItem.countDocuments({
      userId: ownerId,
      deletedAt: null,
      sourceType: { $ne: "UPLOADED_QUIZ" },
      title: { $ne: "Imported Quick Quiz" },
    }),
    LearningItem.countDocuments({
      userId: ownerId,
      deletedAt: null,
      sourceType: { $ne: "UPLOADED_QUIZ" },
      title: { $ne: "Imported Quick Quiz" },
      nextReviewAt: { $lte: new Date() },
    }),
    LearningItem.countDocuments({
      userId: ownerId,
      deletedAt: null,
      sourceType: { $ne: "UPLOADED_QUIZ" },
      title: { $ne: "Imported Quick Quiz" },
      status: "MASTERED",
    }),
    LearningItem.countDocuments({
      userId: ownerId,
      deletedAt: null,
      sourceType: "PHRASE",
      title: { $ne: "Imported Quick Quiz" },
    }),
    LearningItem.countDocuments({
      userId: ownerId,
      deletedAt: null,
      $or: [
        { sourceType: "UPLOADED_QUIZ" },
        { sourceType: "PHRASE", title: "Imported Quick Quiz" },
      ],
    }),
  ]);

  return { total, due, mastered, quick, uploaded };
}

export async function syncLearningItemsFromCompletedSubmissions(userId: string) {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const submissions = await Submission.find({
    userId: ownerId,
    deletedAt: null,
    status: "COMPLETED",
    analysis: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  for (const submission of submissions) {
    if (!submission.analysis) {
      continue;
    }

    await seedLearningItems({
      userId: ownerId,
      submissionId: submission._id,
      promptText: submission.promptText,
      originalText: submission.originalText,
      analysis: submission.analysis,
    });
  }
}

function calculateSchedule(item: LearningItemDocument, rating: ReviewRating) {
  const previousInterval = item.intervalDays;
  let repetitions = item.repetitions + 1;
  let easeFactor = item.easeFactor;
  let intervalDays: number;

  if (rating === "AGAIN") {
    repetitions = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    intervalDays = 1;
  } else if (rating === "HARD") {
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    intervalDays = Math.max(1, Math.round(Math.max(1, previousInterval) * 1.2));
  } else if (rating === "EASY") {
    easeFactor += 0.15;
    intervalDays = repetitions === 1
      ? 3
      : Math.max(4, Math.round(Math.max(1, previousInterval) * (easeFactor + 0.3)));
  } else {
    intervalDays = repetitions === 1
      ? 1
      : repetitions === 2
        ? 3
        : Math.max(4, Math.round(Math.max(1, previousInterval) * easeFactor));
  }

  const status = rating === "AGAIN"
    ? "REVIEW"
    : repetitions >= 6
      ? "MASTERED"
      : repetitions >= 3
        ? "FAMILIAR"
        : "PRACTICING";

  return { repetitions, easeFactor, intervalDays, status } as const;
}

export async function reviewLearningItem(
  userId: string,
  learningItemId: string,
  rating: ReviewRating,
  details?: {
    learnerAnswer: string;
    evaluation: TranslationEvaluation;
  },
) {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const itemId = requireObjectId(learningItemId);
  const item = await LearningItem.findOne({
    _id: itemId,
    userId: ownerId,
    deletedAt: null,
  });

  if (!item) {
    throw new ResourceNotFoundError();
  }

  const previousStatus = item.status;
  const previousIntervalDays = item.intervalDays;
  const schedule = calculateSchedule(item, rating);
  const reviewedAt = new Date();
  const nextReviewAt = new Date(
    reviewedAt.getTime() + schedule.intervalDays * 24 * 60 * 60 * 1000,
  );

  item.set({ ...schedule, lastReviewedAt: reviewedAt, nextReviewAt });
  await item.save();
  await ReviewAttempt.create({
    userId: ownerId,
    learningItemId: itemId,
    rating,
    previousStatus,
    nextStatus: schedule.status,
    previousIntervalDays,
    nextIntervalDays: schedule.intervalDays,
    learnerAnswer: details?.learnerAnswer ?? null,
    score: details?.evaluation.score ?? null,
    feedbackVi: details?.evaluation.feedbackVi ?? null,
    correctedTranslation: details?.evaluation.correctedTranslation ?? null,
    upgradedTranslation: details?.evaluation.upgradedTranslation ?? null,
    reviewedAt,
  });

  return toView(item.toObject());
}

export async function evaluateTranslationAttempt(
  userId: string,
  learningItemId: string,
  learnerAnswer: string,
) {
  await connectMongoose();
  const ownerId = requireObjectId(userId);
  const itemId = requireObjectId(learningItemId);
  const item = await LearningItem.findOne({
    _id: itemId,
    userId: ownerId,
    sourceType: "TRANSLATION",
    deletedAt: null,
  }).lean();

  if (!item) {
    throw new ResourceNotFoundError();
  }

  const env = getAiEnv();
  const gateway = new TranslationReviewGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL);
  const evaluation = await gateway.evaluate({
    sourceVi: item.promptText,
    referenceEn: item.answerText,
    learnerAnswer,
  });
  const rating: ReviewRating = evaluation.score < 50
    ? "AGAIN"
    : evaluation.score < 70
      ? "HARD"
      : evaluation.score < 90
        ? "GOOD"
        : "EASY";
  const updatedItem = await reviewLearningItem(userId, learningItemId, rating, {
    learnerAnswer,
    evaluation,
  });

  return { evaluation, item: updatedItem };
}

export async function evaluateWritingTemplateAttempt(
  userId: string,
  learningItemId: string,
  learnerAnswer: string,
) {
  await connectMongoose();
  const item = await LearningItem.findOne({
    _id: requireObjectId(learningItemId),
    userId: requireObjectId(userId),
    sourceType: "UPLOADED_QUIZ",
    quizType: "TEMPLATE",
    deletedAt: null,
  }).lean();

  if (!item || !item.applicationPromptVi) {
    throw new ResourceNotFoundError();
  }

  const env = getAiEnv();
  const gateway = new TranslationReviewGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL);
  const evaluation = await gateway.evaluate({
    sourceVi: item.applicationPromptVi,
    referenceEn: item.answerText,
    learnerAnswer,
    mode: "WRITING_TEMPLATE",
    writingFunctionVi: item.promptText,
  });
  const rating: ReviewRating = evaluation.score < 50
    ? "AGAIN"
    : evaluation.score < 70
      ? "HARD"
      : evaluation.score < 90
        ? "GOOD"
        : "EASY";
  const updatedItem = await reviewLearningItem(userId, learningItemId, rating, {
    learnerAnswer,
    evaluation,
  });

  return { evaluation, item: updatedItem };
}

export async function evaluateParaphraseApplicationAttempt(
  userId: string,
  learningItemId: string,
  learnerAnswer: string,
) {
  await connectMongoose();
  const item = await LearningItem.findOne({
    _id: requireObjectId(learningItemId),
    userId: requireObjectId(userId),
    deletedAt: null,
    $or: [
      { sourceType: "UPLOADED_QUIZ" },
      { sourceType: "PHRASE", title: "Imported Quick Quiz" },
    ],
  }).lean();

  if (!item) {
    throw new ResourceNotFoundError();
  }

  const view = toUploadedQuizView(item);

  if (view.quizType !== "PARAPHRASE") {
    throw new ResourceNotFoundError();
  }

  const applicationPrompt = await ensureApplicationPrompt(item);
  const env = getAiEnv();
  const gateway = new TranslationReviewGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL);
  const evaluation = await gateway.evaluate({
    sourceVi: applicationPrompt.promptVi,
    referenceEn: applicationPrompt.referenceEn,
    learnerAnswer,
    requiredPhrase: view.answerText,
  });
  const normalizedAnswer = learnerAnswer.toLocaleLowerCase("en");
  const normalizedPhrase = view.answerText.toLocaleLowerCase("en");
  const usesRequiredPhrase = normalizedAnswer.includes(normalizedPhrase);
  const isCorrect = usesRequiredPhrase
    && evaluation.meaningScore >= 70
    && evaluation.grammarScore >= 70;

  return { evaluation, isCorrect, usesRequiredPhrase };
}

const applicationPromptRequests = new Map<string, Promise<{
  promptVi: string;
  referenceEn: string;
}>>();

async function generateApplicationPrompt(item: LearningItemDocument & { _id: Types.ObjectId }) {
  if (item.applicationPromptVi && item.applicationReferenceEn) {
    return {
      promptVi: item.applicationPromptVi,
      referenceEn: item.applicationReferenceEn,
    };
  }

  const view = toUploadedQuizView(item);
  const avoidedItems = await LearningItem.find({
    userId: item.userId,
    _id: { $ne: item._id },
    applicationPromptVi: { $nin: [null, ""] },
    deletedAt: null,
  })
    .select("applicationPromptVi")
    .sort({ updatedAt: -1 })
    .limit(30)
    .lean();
  const env = getAiEnv();
  const gateway = new ApplicationPromptGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL);
  const avoidedPrompts = avoidedItems
    .map((candidate) => candidate.applicationPromptVi)
    .filter((prompt): prompt is string => Boolean(prompt));
  let generated = await gateway.generate({
    topic: view.topicText,
    meaningVi: view.promptText,
    phraseEn: view.answerText,
    avoidedPrompts,
  });
  const normalizedAvoidedPrompts = new Set(
    avoidedPrompts.map((prompt) => prompt.toLocaleLowerCase("vi").replace(/\s+/gu, " ").trim()),
  );

  if (normalizedAvoidedPrompts.has(generated.promptVi.toLocaleLowerCase("vi").replace(/\s+/gu, " ").trim())) {
    generated = await gateway.generate({
      topic: view.topicText,
      meaningVi: view.promptText,
      phraseEn: view.answerText,
      avoidedPrompts: [...avoidedPrompts, generated.promptVi],
    });
  }

  await LearningItem.updateOne(
    { _id: item._id, userId: item.userId },
    {
      $set: {
        applicationPromptVi: generated.promptVi,
        applicationReferenceEn: generated.referenceEn,
      },
    },
  );

  return generated;
}

async function ensureApplicationPrompt(item: LearningItemDocument & { _id: Types.ObjectId }) {
  if (item.applicationPromptVi && item.applicationReferenceEn) {
    return {
      promptVi: item.applicationPromptVi,
      referenceEn: item.applicationReferenceEn,
    };
  }

  const requestKey = item._id.toString();
  const activeRequest = applicationPromptRequests.get(requestKey);

  if (activeRequest) return activeRequest;

  const request = generateApplicationPrompt(item)
    .finally(() => applicationPromptRequests.delete(requestKey));
  applicationPromptRequests.set(requestKey, request);
  return request;
}

export async function getParaphraseApplicationPrompt(
  userId: string,
  learningItemId: string,
) {
  await connectMongoose();
  const item = await LearningItem.findOne({
    _id: requireObjectId(learningItemId),
    userId: requireObjectId(userId),
    deletedAt: null,
    $or: [
      { sourceType: "UPLOADED_QUIZ" },
      { sourceType: "PHRASE", title: "Imported Quick Quiz" },
    ],
  }).lean();

  if (!item || toUploadedQuizView(item).quizType !== "PARAPHRASE") {
    throw new ResourceNotFoundError();
  }

  const prompt = await ensureApplicationPrompt(item);
  return { promptVi: prompt.promptVi };
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
