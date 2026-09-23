import "server-only";

import { ObjectId } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export type AdminDashboardMetrics = {
  inReviewCount: number;
  draftCount: number;
  publishedCount: number;
  archivedCount: number;
  totalLessons: number;
  activeCategoriesCount: number;
  activeTopicsCount: number;
};

export type ActionQueueItem = {
  id: string;
  lessonId: string;
  versionNumber: number;
  status: string;
  title: string;
  primarySkill: string;
  level: string;
  ownerName: string;
  ownerEmail: string;
  updatedAt: Date;
};

export type RecentAuditItem = {
  id: string;
  action: string;
  actorName: string;
  actorEmail: string;
  resourceId: string;
  resourceType: string;
  reason?: string;
  occurredAt: Date;
};

export async function getAdminDashboardData(): Promise<{
  metrics: AdminDashboardMetrics;
  actionQueue: ActionQueueItem[];
  recentAudits: RecentAuditItem[];
}> {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  // 1. Metrics from lessons & taxonomy
  const [
    lessonsGroup,
    totalLessons,
    activeCategoriesCount,
    activeTopicsCount,
  ] = await Promise.all([
    db.collection("lessons").aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$publicationStatus", count: { $sum: 1 } } },
    ]).toArray(),
    db.collection("lessons").countDocuments(),
    db.collection("content_categories").countDocuments({ status: "ACTIVE" }),
    db.collection("content_topics").countDocuments({ status: "ACTIVE" }),
  ]);

  const statusMap = new Map<string, number>();
  for (const item of lessonsGroup) {
    statusMap.set(item._id, item.count);
  }

  const metrics: AdminDashboardMetrics = {
    inReviewCount: (statusMap.get("IN_REVIEW") ?? 0) + (statusMap.get("CHANGES_REQUESTED") ?? 0),
    draftCount: statusMap.get("DRAFT") ?? 0,
    publishedCount: statusMap.get("PUBLISHED") ?? 0,
    archivedCount: statusMap.get("ARCHIVED") ?? 0,
    totalLessons,
    activeCategoriesCount,
    activeTopicsCount,
  };

  // 2. Action Queue: Lessons needing review/action (IN_REVIEW, CHANGES_REQUESTED, DRAFT)
  // prioritize IN_REVIEW, then DRAFT
  const queuePipeline = [
    {
      $match: {
        publicationStatus: { $in: ["IN_REVIEW", "CHANGES_REQUESTED", "DRAFT"] },
      },
    },
    { $sort: { updatedAt: -1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: "lesson_versions",
        localField: "currentDraftVersionId",
        foreignField: "_id",
        as: "draftVersion",
      },
    },
    { $unwind: { path: "$draftVersion", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
  ];

  type RawQueueDoc = {
    _id: ObjectId;
    publicationStatus: string;
    updatedAt: Date;
    draftVersion?: {
      _id: ObjectId;
      versionNumber: number;
      status: string;
      primarySkill: string;
      cefrLevelMin?: string;
      localizations?: Array<{ locale: string; title: string }>;
    };
    owner?: {
      name?: string;
      email?: string;
    };
  };

  const rawQueue = await db.collection("lessons").aggregate<RawQueueDoc>(queuePipeline).toArray();

  const actionQueue: ActionQueueItem[] = rawQueue.map((doc) => {
    const loc = doc.draftVersion?.localizations?.find((l) => l.locale === "vi")
      ?? doc.draftVersion?.localizations?.[0];
    return {
      id: doc.draftVersion?._id ? doc.draftVersion._id.toString() : doc._id.toString(),
      lessonId: doc._id.toString(),
      versionNumber: doc.draftVersion?.versionNumber ?? 1,
      status: doc.draftVersion?.status ?? doc.publicationStatus,
      title: loc?.title || "Bài học chưa đặt tên",
      primarySkill: doc.draftVersion?.primarySkill || "WRITING",
      level: doc.draftVersion?.cefrLevelMin || "B1",
      ownerName: doc.owner?.name || "Biên tập viên",
      ownerEmail: doc.owner?.email || "",
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    };
  });

  // 3. Recent Audit Logs
  type RawAuditDoc = {
    _id: ObjectId;
    action: string;
    actorId: ObjectId;
    resourceId: ObjectId;
    resourceType: string;
    reason?: string;
    occurredAt: Date;
  };

  const rawAudits = await db
    .collection<RawAuditDoc>("content_audit_logs")
    .find()
    .sort({ occurredAt: -1, _id: -1 })
    .limit(8)
    .toArray();

  const actorIds = [...new Set(rawAudits.map((a) => a.actorId.toString()))]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const actors = await db.collection("users").find(
    { _id: { $in: actorIds } },
    { projection: { name: 1, email: 1 } },
  ).toArray();

  const actorMap = new Map<string, { name: string; email: string }>();
  for (const actor of actors) {
    actorMap.set(actor._id.toString(), {
      name: actor.name || actor.email || "Staff",
      email: actor.email || "",
    });
  }

  const recentAudits: RecentAuditItem[] = rawAudits.map((audit) => {
    const actor = actorMap.get(audit.actorId.toString()) ?? {
      name: "Hệ thống",
      email: "",
    };
    return {
      id: audit._id.toString(),
      action: audit.action,
      actorName: actor.name,
      actorEmail: actor.email,
      resourceId: audit.resourceId ? audit.resourceId.toString() : "",
      resourceType: audit.resourceType,
      reason: audit.reason,
      occurredAt: audit.occurredAt ? new Date(audit.occurredAt) : new Date(),
    };
  });

  return {
    metrics,
    actionQueue,
    recentAudits,
  };
}
