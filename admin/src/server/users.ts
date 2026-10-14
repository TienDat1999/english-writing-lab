import "server-only";

import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export type UserListItemView = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  status: "ACTIVE" | "SUSPENDED";
  suspendedReason?: string;
  suspendedAt?: Date | null;
  createdAt: Date;
  staffRoles: string[];
  metrics: {
    submissionsCount: number;
    completedSubmissions: number;
    failedSubmissions: number;
    avgBand: number | null;
    latestBand: number | null;
    learningItemsCount: number;
    reviewAttemptsCount: number;
  };
};

export type UserDetailView = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    status: "ACTIVE" | "SUSPENDED";
    suspendedReason?: string;
    suspendedAt?: Date | null;
    suspendedByName?: string;
    createdAt: Date;
    staffRoles: string[];
  };
  metrics: {
    submissionsCount: number;
    completedSubmissions: number;
    failedSubmissions: number;
    avgBand: number | null;
    highestBand: number | null;
    latestBand: number | null;
    learningItemsCount: number;
    masteredItemsCount: number;
    practicingItemsCount: number;
    reviewAttemptsCount: number;
  };
  submissions: Array<{
    id: string;
    taskType: string;
    questionType: string;
    wordCount: number;
    status: string;
    estimatedOverallBand?: number | null;
    summaryVi?: string;
    submittedAt: Date;
    failureReason?: string;
  }>;
  topics: Array<{
    topicText: string;
    quizType: string;
    totalItems: number;
    masteredCount: number;
    practicingCount: number;
    lastReviewedAt: Date | null;
    nextReviewAt: Date | null;
  }>;
  recentReviews: Array<{
    id: string;
    learningItemId: string;
    promptText: string;
    answerText: string;
    rating: string;
    score: number | null;
    reviewedAt: Date;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    actorName: string;
    reason: string;
    details: Record<string, unknown>;
    occurredAt: Date;
  }>;
};

export type EnrollmentOption = {
  id: string;
  title: string;
  slug: string;
  type: "LESSON" | "COLLECTION";
  detail?: string;
};

// ---------------------------------------------------------------------------
// Audit logger helper for support actions
// ---------------------------------------------------------------------------
async function recordSupportAudit(input: {
  actorUserId: string;
  targetUserId: string;
  action: string;
  reason: string;
  details?: Record<string, unknown>;
}) {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  await db.collection("support_audit_logs").insertOne({
    actorId: ObjectId.isValid(input.actorUserId) ? new ObjectId(input.actorUserId) : new ObjectId(),
    targetUserId: ObjectId.isValid(input.targetUserId) ? new ObjectId(input.targetUserId) : new ObjectId(),
    action: input.action,
    reason: input.reason.trim(),
    details: input.details ?? {},
    occurredAt: new Date(),
  });
}

// ---------------------------------------------------------------------------
// 1. List Users with Pagination, Filter & Aggregate Metrics
// ---------------------------------------------------------------------------
export async function listAdminUsers(options?: {
  search?: string;
  status?: "ACTIVE" | "SUSPENDED" | "ALL";
  page?: number;
  limit?: number;
}): Promise<{
  users: UserListItemView[];
  totalCount: number;
  totalPages: number;
  page: number;
}> {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(50, Math.max(1, options?.limit ?? 15));
  const skip = (page - 1) * limit;

  const matchFilter: Record<string, unknown> = {};

  if (options?.status && options.status !== "ALL") {
    if (options.status === "SUSPENDED") {
      matchFilter.status = "SUSPENDED";
    } else {
      matchFilter.$or = [{ status: "ACTIVE" }, { status: { $exists: false } }, { status: null }];
    }
  }

  if (options?.search && options.search.trim()) {
    const s = options.search.trim();
    matchFilter.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
    ];
  }

  const [totalCount, userDocs] = await Promise.all([
    db.collection("users").countDocuments(matchFilter),
    db
      .collection("users")
      .find(matchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  if (userDocs.length === 0) {
    return { users: [], totalCount, totalPages: 0, page };
  }

  const userIds = userDocs.map((u) => u._id);

  // Aggregate submissions per user
  const submissionStats = await db
    .collection("submissions")
    .aggregate<{
      _id: ObjectId;
      total: number;
      completed: number;
      failed: number;
      avgBand: number | null;
      latestBand: number | null;
    }>([
      { $match: { userId: { $in: userIds }, deletedAt: null } },
      { $sort: { submittedAt: -1 } },
      {
        $group: {
          _id: "$userId",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] },
          },
          avgBand: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "COMPLETED"] },
                    { $ne: ["$analysis.estimatedOverallBand", null] },
                  ],
                },
                "$analysis.estimatedOverallBand",
                null,
              ],
            },
          },
          latestBand: { $first: "$analysis.estimatedOverallBand" },
        },
      },
    ])
    .toArray();
  const subStatsMap = new Map(submissionStats.map((s) => [s._id.toString(), s]));

  // Aggregate learning items per user
  const learningItemStats = await db
    .collection("learning_items")
    .aggregate<{ _id: ObjectId; count: number }>([
      { $match: { userId: { $in: userIds }, deletedAt: null } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ])
    .toArray();
  const itemStatsMap = new Map(learningItemStats.map((i) => [i._id.toString(), i.count]));

  // Aggregate review attempts per user
  const reviewStats = await db
    .collection("review_attempts")
    .aggregate<{ _id: ObjectId; count: number }>([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ])
    .toArray();
  const reviewStatsMap = new Map(reviewStats.map((r) => [r._id.toString(), r.count]));

  // Aggregate staff roles
  const staffAssignments = await db
    .collection<{ userId: ObjectId; roles: string[]; status: string }>("staff_role_assignments")
    .find({ userId: { $in: userIds }, status: "ACTIVE" })
    .toArray();
  const staffRoleMap = new Map(staffAssignments.map((s) => [s.userId.toString(), s.roles || []]));

  const users: UserListItemView[] = userDocs.map((doc) => {
    const idStr = doc._id.toString();
    const subs = subStatsMap.get(idStr);
    const itemsCount = itemStatsMap.get(idStr) ?? 0;
    const reviewsCount = reviewStatsMap.get(idStr) ?? 0;
    const roles = staffRoleMap.get(idStr) ?? [];

    return {
      id: idStr,
      name: doc.name || "Học viên",
      email: doc.email || "Chưa có email",
      image: doc.image || null,
      status: doc.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
      suspendedReason: doc.suspendedReason || undefined,
      suspendedAt: doc.suspendedAt ? new Date(doc.suspendedAt) : null,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      staffRoles: roles,
      metrics: {
        submissionsCount: subs?.total ?? 0,
        completedSubmissions: subs?.completed ?? 0,
        failedSubmissions: subs?.failed ?? 0,
        avgBand: subs?.avgBand ? Math.round(subs.avgBand * 10) / 10 : null,
        latestBand: subs?.latestBand ? Math.round(subs.latestBand * 10) / 10 : null,
        learningItemsCount: itemsCount,
        reviewAttemptsCount: reviewsCount,
      },
    };
  });

  return {
    users,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    page,
  };
}

// ---------------------------------------------------------------------------
// 2. Get User Detail with Submissions, Learning Progress & Support Audit Logs
// ---------------------------------------------------------------------------
export async function getAdminUserDetail(userId: string): Promise<UserDetailView | null> {
  if (!ObjectId.isValid(userId)) return null;

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const userObjectId = new ObjectId(userId);

  const userDoc = await db.collection("users").findOne({ _id: userObjectId });
  if (!userDoc) return null;

  // Lookup granter / suspender name if user is suspended
  let suspendedByName: string | undefined;
  if (userDoc.suspendedBy && ObjectId.isValid(userDoc.suspendedBy)) {
    const suspender = await db.collection("users").findOne(
      { _id: new ObjectId(userDoc.suspendedBy) },
      { projection: { name: 1, email: 1 } },
    );
    suspendedByName = suspender?.name || suspender?.email || "Admin";
  }

  // Lookup staff roles
  const staffDoc = await db
    .collection<{ roles: string[]; status: string }>("staff_role_assignments")
    .findOne({ userId: userObjectId, status: "ACTIVE" });
  const staffRoles = staffDoc?.roles || [];

  // Query Submissions (Recent 25)
  const submissions = await db
    .collection<{
      _id: ObjectId;
      taskType: string;
      questionType: string;
      wordCount: number;
      status: string;
      analysis?: { estimatedOverallBand?: number; summaryVi?: string };
      submittedAt: Date;
      failureReason?: string;
    }>("submissions")
    .find({ userId: userObjectId, deletedAt: null })
    .sort({ submittedAt: -1 })
    .limit(25)
    .toArray();

  // Aggregate Submissions Metric
  const subMetricAgg = await db
    .collection("submissions")
    .aggregate<{
      total: number;
      completed: number;
      failed: number;
      avgBand: number | null;
      highestBand: number | null;
      latestBand: number | null;
    }>([
      { $match: { userId: userObjectId, deletedAt: null } },
      { $sort: { submittedAt: -1 } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] },
          },
          avgBand: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "COMPLETED"] },
                    { $ne: ["$analysis.estimatedOverallBand", null] },
                  ],
                },
                "$analysis.estimatedOverallBand",
                null,
              ],
            },
          },
          highestBand: {
            $max: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "COMPLETED"] },
                    { $ne: ["$analysis.estimatedOverallBand", null] },
                  ],
                },
                "$analysis.estimatedOverallBand",
                null,
              ],
            },
          },
          latestBand: { $first: "$analysis.estimatedOverallBand" },
        },
      },
    ])
    .toArray();
  const subStats = subMetricAgg[0];

  // Aggregate Learning Items by Status
  const itemStatusAgg = await db
    .collection("learning_items")
    .aggregate<{ _id: string; count: number }>([
      { $match: { userId: userObjectId, deletedAt: null } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])
    .toArray();
  const itemStatusMap = new Map(itemStatusAgg.map((s) => [s._id, s.count]));

  // Aggregate Topics / Curriculums Enrolled
  const topicsAgg = await db
    .collection("learning_items")
    .aggregate<{
      _id: { topicText: string; quizType: string };
      total: number;
      mastered: number;
      practicing: number;
      lastReviewedAt: Date | null;
      nextReviewAt: Date | null;
    }>([
      { $match: { userId: userObjectId, deletedAt: null } },
      {
        $group: {
          _id: { topicText: "$topicText", quizType: "$quizType" },
          total: { $sum: 1 },
          mastered: {
            $sum: { $cond: [{ $eq: ["$status", "MASTERED"] }, 1, 0] },
          },
          practicing: {
            $sum: {
              $cond: [
                { $in: ["$status", ["NEW", "PRACTICING", "FAMILIAR", "REVIEW"]] },
                1,
                0,
              ],
            },
          },
          lastReviewedAt: { $max: "$lastReviewedAt" },
          nextReviewAt: { $min: "$nextReviewAt" },
        },
      },
      { $sort: { total: -1 } },
    ])
    .toArray();

  // Query Recent Review Attempts (Last 20)
  type RawReviewAttempt = {
    _id: ObjectId;
    learningItemId: ObjectId;
    rating: string;
    score: number | null;
    reviewedAt: Date;
    item?: { promptText?: string; answerText?: string };
  };

  const recentReviews = await db
    .collection("review_attempts")
    .aggregate<RawReviewAttempt>([
      { $match: { userId: userObjectId } },
      { $sort: { reviewedAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "learning_items",
          localField: "learningItemId",
          foreignField: "_id",
          as: "itemDoc",
        },
      },
      {
        $project: {
          _id: 1,
          learningItemId: 1,
          rating: 1,
          score: 1,
          reviewedAt: 1,
          item: { $arrayElemAt: ["$itemDoc", 0] },
        },
      },
    ])
    .toArray();

  const totalReviewsCount = await db
    .collection("review_attempts")
    .countDocuments({ userId: userObjectId });

  // Query Support Audit Logs for this User
  type RawSupportAudit = {
    _id: ObjectId;
    actorId: ObjectId;
    action: string;
    reason: string;
    details?: Record<string, unknown>;
    occurredAt: Date;
    actor?: { name?: string; email?: string };
  };

  const supportAudits = await db
    .collection("support_audit_logs")
    .aggregate<RawSupportAudit>([
      { $match: { targetUserId: userObjectId } },
      { $sort: { occurredAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "actorId",
          foreignField: "_id",
          as: "actorDoc",
        },
      },
      {
        $project: {
          _id: 1,
          action: 1,
          reason: 1,
          details: 1,
          occurredAt: 1,
          actor: { $arrayElemAt: ["$actorDoc", 0] },
        },
      },
    ])
    .toArray();

  return {
    user: {
      id: userDoc._id.toString(),
      name: userDoc.name || "Học viên",
      email: userDoc.email || "Chưa có email",
      image: userDoc.image || null,
      status: userDoc.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
      suspendedReason: userDoc.suspendedReason || undefined,
      suspendedAt: userDoc.suspendedAt ? new Date(userDoc.suspendedAt) : null,
      suspendedByName,
      createdAt: userDoc.createdAt ? new Date(userDoc.createdAt) : new Date(),
      staffRoles,
    },
    metrics: {
      submissionsCount: subStats?.total ?? 0,
      completedSubmissions: subStats?.completed ?? 0,
      failedSubmissions: subStats?.failed ?? 0,
      avgBand: subStats?.avgBand ? Math.round(subStats.avgBand * 10) / 10 : null,
      highestBand: subStats?.highestBand ? Math.round(subStats.highestBand * 10) / 10 : null,
      latestBand: subStats?.latestBand ? Math.round(subStats.latestBand * 10) / 10 : null,
      learningItemsCount: Array.from(itemStatusMap.values()).reduce((a, b) => a + b, 0),
      masteredItemsCount: itemStatusMap.get("MASTERED") ?? 0,
      practicingItemsCount:
        (itemStatusMap.get("NEW") ?? 0) +
        (itemStatusMap.get("PRACTICING") ?? 0) +
        (itemStatusMap.get("FAMILIAR") ?? 0) +
        (itemStatusMap.get("REVIEW") ?? 0),
      reviewAttemptsCount: totalReviewsCount,
    },
    submissions: submissions.map((s) => ({
      id: s._id.toString(),
      taskType: s.taskType,
      questionType: s.questionType,
      wordCount: s.wordCount,
      status: s.status,
      estimatedOverallBand: s.analysis?.estimatedOverallBand,
      summaryVi: s.analysis?.summaryVi,
      submittedAt: s.submittedAt ? new Date(s.submittedAt) : new Date(),
      failureReason: s.failureReason,
    })),
    topics: topicsAgg.map((t) => ({
      topicText: t._id.topicText || "Mặc định",
      quizType: t._id.quizType || "QUIZ",
      totalItems: t.total,
      masteredCount: t.mastered,
      practicingCount: t.practicing,
      lastReviewedAt: t.lastReviewedAt ? new Date(t.lastReviewedAt) : null,
      nextReviewAt: t.nextReviewAt ? new Date(t.nextReviewAt) : null,
    })),
    recentReviews: recentReviews.map((r) => ({
      id: r._id.toString(),
      learningItemId: r.learningItemId.toString(),
      promptText: r.item?.promptText || "Câu hỏi",
      answerText: r.item?.answerText || "Đáp án",
      rating: r.rating,
      score: r.score,
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : new Date(),
    })),
    auditLogs: supportAudits.map((a) => ({
      id: a._id.toString(),
      action: a.action,
      actorName: a.actor?.name || a.actor?.email || "Staff",
      reason: a.reason,
      details: a.details || {},
      occurredAt: a.occurredAt ? new Date(a.occurredAt) : new Date(),
    })),
  };
}

// ---------------------------------------------------------------------------
// 3. Support Action: Suspend User
// ---------------------------------------------------------------------------
export async function suspendUser(input: {
  actorUserId: string;
  targetUserId: string;
  reason: string;
}) {
  if (!ObjectId.isValid(input.targetUserId)) throw new Error("ID người dùng không hợp lệ.");
  if (!input.reason.trim()) throw new Error("Cần nhập lý do khóa tài khoản.");
  if (input.actorUserId === input.targetUserId) {
    throw new Error("Bạn không thể tự khóa tài khoản của chính mình.");
  }

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const targetObjectId = new ObjectId(input.targetUserId);

  const now = new Date();
  await db.collection("users").updateOne(
    { _id: targetObjectId },
    {
      $set: {
        status: "SUSPENDED",
        suspendedReason: input.reason.trim(),
        suspendedAt: now,
        suspendedBy: ObjectId.isValid(input.actorUserId)
          ? new ObjectId(input.actorUserId)
          : new ObjectId(),
        updatedAt: now,
      },
    },
  );

  await recordSupportAudit({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    action: "SUPPORT_SUSPEND_USER",
    reason: input.reason,
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// 4. Support Action: Activate User
// ---------------------------------------------------------------------------
export async function activateUser(input: {
  actorUserId: string;
  targetUserId: string;
  reason: string;
}) {
  if (!ObjectId.isValid(input.targetUserId)) throw new Error("ID người dùng không hợp lệ.");
  if (!input.reason.trim()) throw new Error("Cần nhập lý do mở khóa tài khoản.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const targetObjectId = new ObjectId(input.targetUserId);

  const now = new Date();
  await db.collection("users").updateOne(
    { _id: targetObjectId },
    {
      $set: {
        status: "ACTIVE",
        suspendedReason: null,
        suspendedAt: null,
        suspendedBy: null,
        updatedAt: now,
      },
    },
  );

  await recordSupportAudit({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    action: "SUPPORT_ACTIVATE_USER",
    reason: input.reason,
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// 5. Support Action: Manual Enroll User to Lesson
// ---------------------------------------------------------------------------
function mapLessonTypeToQuizType(lessonType: string) {
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

export async function manualEnrollLesson(input: {
  actorUserId: string;
  targetUserId: string;
  lessonId: string;
  reason: string;
}) {
  if (!ObjectId.isValid(input.targetUserId)) throw new Error("ID học viên không hợp lệ.");
  if (!ObjectId.isValid(input.lessonId)) throw new Error("ID bài học không hợp lệ.");
  if (!input.reason.trim()) throw new Error("Cần nhập lý do ghi danh.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const targetObjectId = new ObjectId(input.targetUserId);
  const lessonObjectId = new ObjectId(input.lessonId);

  type RawLessonDoc = {
    _id: ObjectId;
    publicationStatus?: string;
    currentPublishedVersion?: ObjectId | null;
    slugs?: Array<{ locale: string; slug: string }>;
  };

  const lesson = await db.collection<RawLessonDoc>("lessons").findOne({
    _id: lessonObjectId,
    publicationStatus: "PUBLISHED",
    currentPublishedVersion: { $ne: null },
  });

  if (!lesson || !lesson.currentPublishedVersion) {
    throw new Error("Bài học không tồn tại hoặc chưa được phát hành công khai.");
  }

  type RawVersionDoc = {
    _id: ObjectId;
    lessonType?: string;
    primaryTopicId?: ObjectId;
  };

  const version = await db
    .collection<RawVersionDoc>("lesson_versions")
    .findOne({ _id: lesson.currentPublishedVersion });

  if (!version) {
    throw new Error("Không tìm thấy phiên bản bài học khả dụng.");
  }

  type RawTopicDoc = {
    _id: ObjectId;
    localizations?: Array<{ locale: string; name: string }>;
  };

  const topic = version.primaryTopicId
    ? await db.collection<RawTopicDoc>("content_topics").findOne({ _id: version.primaryTopicId })
    : null;

  const topicName =
    topic?.localizations?.find((l) => l.locale === "vi")?.name ||
    topic?.localizations?.[0]?.name ||
    lesson.slugs?.[0]?.slug ||
    "Chủ đề học";

  const quizType = mapLessonTypeToQuizType(version.lessonType || "COLLOCATION");

  type RawExerciseDoc = {
    _id: ObjectId;
    localizations?: Array<{
      locale: string;
      promptText?: string;
      instruction?: string;
    }>;
    targetContent?: string;
    contextText?: string;
    answerRubric?: { correctAnswer?: string | null };
  };

  const exercises = await db
    .collection<RawExerciseDoc>("exercises")
    .find({ lessonVersionId: version._id })
    .sort({ position: 1 })
    .toArray();

  if (exercises.length === 0) {
    throw new Error("Bài học này hiện chưa có bài tập trắc nghiệm nào.");
  }

  const now = new Date();

  const bulkOps = exercises.map((ex) => {
    const locVi = ex.localizations?.find((l) => l.locale === "vi") || ex.localizations?.[0];
    const targetContent = (ex.targetContent || "").trim();
    const contextText = (ex.contextText || "").trim();
    const rawPrompt = (locVi?.promptText || "").trim();
    const cleanedPrompt = rawPrompt.replace(/^(Ý nghĩa|Nghĩa):\s*/i, "").trim();

    let answerText = "";
    let promptText = "";

    if (quizType === "COLLOCATION" || quizType === "TOPIC_VOCABULARY") {
      answerText = targetContent || ex.answerRubric?.correctAnswer || "";
      promptText = cleanedPrompt || targetContent || `Luyện tập ${topicName}`;
    } else {
      answerText = ex.answerRubric?.correctAnswer || targetContent || "";
      promptText = cleanedPrompt || locVi?.promptText || targetContent || `Luyện tập ${topicName}`;
    }

    const hintVi = locVi?.instruction || "";
    const ctx = contextText || targetContent;

    const fingerprint = createHash("sha256")
      .update(
        `uploaded-quiz:${quizType}:${topicName.toLowerCase()}:${promptText.toLowerCase()}:${answerText.toLowerCase()}`,
      )
      .digest("hex");

    return {
      updateOne: {
        filter: { userId: targetObjectId, fingerprint },
        update: {
          $setOnInsert: {
            userId: targetObjectId,
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

  await db.collection("learning_items").bulkWrite(bulkOps as any, { ordered: false });

  await recordSupportAudit({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    action: "SUPPORT_MANUAL_ENROLL_LESSON",
    reason: input.reason,
    details: {
      lessonId: input.lessonId,
      topicName,
      enrolledItems: bulkOps.length,
    },
  });

  return { success: true, enrolledCount: bulkOps.length, topicName };
}

// ---------------------------------------------------------------------------
// 6. Support Action: Manual Enroll User to Collection
// ---------------------------------------------------------------------------
export async function manualEnrollCollection(input: {
  actorUserId: string;
  targetUserId: string;
  collectionId: string;
  reason: string;
}) {
  if (!ObjectId.isValid(input.targetUserId)) throw new Error("ID học viên không hợp lệ.");
  if (!ObjectId.isValid(input.collectionId)) throw new Error("ID bộ sưu tập không hợp lệ.");
  if (!input.reason.trim()) throw new Error("Cần nhập lý do ghi danh.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const colObjectId = new ObjectId(input.collectionId);

  type RawCollectionDoc = {
    _id: ObjectId;
    status?: string;
    items?: Array<{ lessonId: ObjectId; position: number }>;
    localizations?: Array<{ locale: string; title: string }>;
  };

  const collection = await db.collection<RawCollectionDoc>("content_collections").findOne({
    _id: colObjectId,
    status: "PUBLISHED",
  });

  if (!collection) {
    throw new Error("Bộ sưu tập không tồn tại hoặc chưa phát hành.");
  }

  const items = collection.items || [];
  if (items.length === 0) {
    throw new Error("Bộ sưu tập này chưa có bài học nào.");
  }

  let totalItemsEnrolled = 0;
  for (const item of items) {
    try {
      const res = await manualEnrollLesson({
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId,
        lessonId: item.lessonId.toString(),
        reason: `${input.reason} (Ghi danh theo bộ sưu tập)`,
      });
      totalItemsEnrolled += res.enrolledCount;
    } catch {
      // Continue next lesson if one fails
    }
  }

  const collectionTitle =
    collection.localizations?.find((l) => l.locale === "vi")?.title || "Bộ sưu tập";

  await recordSupportAudit({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    action: "SUPPORT_MANUAL_ENROLL_COLLECTION",
    reason: input.reason,
    details: {
      collectionId: input.collectionId,
      collectionTitle,
      totalLessons: items.length,
      totalItemsEnrolled,
    },
  });

  return { success: true, totalLessons: items.length, totalItemsEnrolled };
}

// ---------------------------------------------------------------------------
// 7. Support Action: Reset User Progress / Topic Items
// ---------------------------------------------------------------------------
export async function resetUserProgress(input: {
  actorUserId: string;
  targetUserId: string;
  topicText?: string;
  mode: "FRESH_SRS" | "REMOVE";
  reason: string;
}) {
  if (!ObjectId.isValid(input.targetUserId)) throw new Error("ID học viên không hợp lệ.");
  if (!input.reason.trim()) throw new Error("Cần nhập lý do thiết lập lại tiến độ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const targetObjectId = new ObjectId(input.targetUserId);

  const query: Record<string, unknown> = { userId: targetObjectId, deletedAt: null };
  if (input.topicText && input.topicText.trim()) {
    query.topicText = input.topicText.trim();
  }

  const now = new Date();
  let affectedCount = 0;

  if (input.mode === "REMOVE") {
    // Soft-delete items so learner can freshly re-enroll
    const res = await db.collection("learning_items").updateMany(query, {
      $set: { deletedAt: now, updatedAt: now },
    });
    affectedCount = res.modifiedCount;
  } else {
    // Reset SRS metrics back to initial state
    const res = await db.collection("learning_items").updateMany(query, {
      $set: {
        status: "NEW",
        repetitions: 0,
        intervalDays: 0,
        easeFactor: 2.5,
        nextReviewAt: now,
        lastReviewedAt: null,
        updatedAt: now,
      },
    });
    affectedCount = res.modifiedCount;
  }

  await recordSupportAudit({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    action: "SUPPORT_RESET_PROGRESS",
    reason: input.reason,
    details: {
      topicText: input.topicText || "ALL_TOPICS",
      mode: input.mode,
      affectedItems: affectedCount,
    },
  });

  return { success: true, affectedCount };
}

// ---------------------------------------------------------------------------
// 8. Support Action: Retry Failed Submission
// ---------------------------------------------------------------------------
export async function retryUserSubmission(input: {
  actorUserId: string;
  targetUserId: string;
  submissionId: string;
  reason: string;
}) {
  if (!ObjectId.isValid(input.submissionId)) throw new Error("ID bài nộp không hợp lệ.");
  if (!input.reason.trim()) throw new Error("Cần nhập lý do kích hoạt chấm lại bài.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const subObjectId = new ObjectId(input.submissionId);

  const now = new Date();
  const result = await db.collection("submissions").updateOne(
    { _id: subObjectId },
    {
      $set: {
        status: "QUEUED",
        processingLeaseUntil: null,
        failureCode: null,
        failureReason: null,
        updatedAt: now,
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new Error("Không tìm thấy bài nộp.");
  }

  await recordSupportAudit({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    action: "SUPPORT_RETRY_SUBMISSION",
    reason: input.reason,
    details: { submissionId: input.submissionId },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// 9. Get Available Options for Manual Enrollment Modals
// ---------------------------------------------------------------------------
export async function getEnrollmentOptions(): Promise<{
  lessons: EnrollmentOption[];
  collections: EnrollmentOption[];
}> {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  type RawLessonDoc = {
    _id: ObjectId;
    slugs?: Array<{ locale: string; slug: string }>;
    version?: {
      primarySkill?: string;
      localizations?: Array<{ locale: string; title: string }>;
    };
  };

  const lessonDocs = await db
    .collection("lessons")
    .aggregate<RawLessonDoc>([
      { $match: { publicationStatus: "PUBLISHED", currentPublishedVersion: { $ne: null } } },
      {
        $lookup: {
          from: "lesson_versions",
          localField: "currentPublishedVersion",
          foreignField: "_id",
          as: "vDocs",
        },
      },
      {
        $project: {
          _id: 1,
          slugs: 1,
          version: { $arrayElemAt: ["$vDocs", 0] },
        },
      },
      { $sort: { "version.localizations.title": 1 } },
      { $limit: 100 },
    ])
    .toArray();

  const lessons: EnrollmentOption[] = lessonDocs.map((doc) => ({
    id: doc._id.toString(),
    title:
      doc.version?.localizations?.find((l) => l.locale === "vi")?.title ||
      doc.version?.localizations?.[0]?.title ||
      "Bài học không tiêu đề",
    slug: doc.slugs?.find((s) => s.locale === "vi")?.slug || doc.slugs?.[0]?.slug || "",
    type: "LESSON",
    detail: doc.version?.primarySkill || "VOCABULARY",
  }));

  type RawCollectionDoc = {
    _id: ObjectId;
    slugs?: Array<{ locale: string; slug: string }>;
    localizations?: Array<{ locale: string; title: string }>;
    items?: unknown[];
  };

  const collectionDocs = await db
    .collection<RawCollectionDoc>("content_collections")
    .find({ status: "PUBLISHED" })
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();

  const collections: EnrollmentOption[] = collectionDocs.map((doc) => ({
    id: doc._id.toString(),
    title:
      doc.localizations?.find((l) => l.locale === "vi")?.title ||
      doc.localizations?.[0]?.title ||
      "Bộ sưu tập",
    slug: doc.slugs?.find((s) => s.locale === "vi")?.slug || doc.slugs?.[0]?.slug || "",
    type: "COLLECTION",
    detail: `${doc.items?.length || 0} bài học`,
  }));

  return { lessons, collections };
}
