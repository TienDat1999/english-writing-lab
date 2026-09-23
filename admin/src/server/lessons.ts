import "server-only";

import { ObjectId, type Document } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export const lessonStatuses = [
  "DRAFT",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "CANCELLED",
  "ARCHIVED",
  "WITHDRAWN",
] as const;
export const lessonSkills = ["VOCABULARY", "WRITING", "SPEAKING", "LISTENING"] as const;
export const lessonLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const lessonLocales = ["vi", "en"] as const;

type LessonStatus = (typeof lessonStatuses)[number];
type LessonSkill = (typeof lessonSkills)[number];
type LessonLevel = (typeof lessonLevels)[number];
type LessonLocale = (typeof lessonLocales)[number];

export type LessonListQuery = {
  category?: string;
  level?: LessonLevel;
  locale?: LessonLocale;
  owner?: string;
  page: number;
  q?: string;
  skill?: LessonSkill;
  status?: LessonStatus;
};

type LessonListAggregateItem = {
  defaultLocale: string;
  id: string;
  owner: { email?: string; id: string; name?: string };
  publicationStatus: string;
  slugs: Array<{ locale: string; slug: string }>;
  topic?: { code?: string; id?: string; localizations?: Array<{ locale: string; name: string }> };
  version: {
    accessTier: string;
    cefrLevelMax: string;
    cefrLevelMin: string;
    estimatedMinutes: number;
    id: string;
    lessonType: string;
    localizations: Array<{ locale: string; shortDescription: string; title: string }>;
    primarySkill: string;
    revision: number;
    status: string;
    updatedAt: Date;
    versionNumber: number;
    visibility: string;
  };
};

type LessonListAggregateResult = {
  data: LessonListAggregateItem[];
  total: Array<{ value: number }>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function fromAllowed<T extends readonly string[]>(value: string | undefined, allowed: T) {
  return value && allowed.includes(value) ? value as T[number] : undefined;
}

export function parseLessonListQuery(
  searchParams: Record<string, string | string[] | undefined>,
): LessonListQuery {
  const rawPage = Number.parseInt(one(searchParams.page) ?? "1", 10);
  const q = one(searchParams.q)?.trim().slice(0, 120);
  const category = one(searchParams.category);
  const owner = one(searchParams.owner);

  return {
    category: category && ObjectId.isValid(category) ? category : undefined,
    level: fromAllowed(one(searchParams.level), lessonLevels),
    locale: fromAllowed(one(searchParams.locale), lessonLocales),
    owner: owner && ObjectId.isValid(owner) ? owner : undefined,
    page: Number.isFinite(rawPage) ? Math.min(Math.max(rawPage, 1), 100_000) : 1,
    q: q || undefined,
    skill: fromAllowed(one(searchParams.skill), lessonSkills),
    status: fromAllowed(one(searchParams.status), lessonStatuses),
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export async function listAdminLessons(query: LessonListQuery, pageSize = 20) {
  const database = getMongoClient().db(getDatabaseEnv().databaseName);
  const pipeline: Document[] = [];
  pipeline.push(
    {
      $lookup: {
        from: "lessons",
        localField: "lessonId",
        foreignField: "_id",
        as: "lesson",
      },
    },
    { $unwind: "$lesson" },
  );

  const lessonMatch: Document = {};
  if (query.owner) lessonMatch["lesson.createdBy"] = new ObjectId(query.owner);
  if (query.status === "ARCHIVED" || query.status === "WITHDRAWN") {
    lessonMatch["lesson.publicationStatus"] = query.status;
  }
  if (Object.keys(lessonMatch).length > 0) pipeline.push({ $match: lessonMatch });

  pipeline.push(
    {
      $lookup: {
        from: "content_topics",
        localField: "primaryTopicId",
        foreignField: "_id",
        as: "topic",
      },
    },
    { $unwind: { path: "$topic", preserveNullAndEmptyArrays: true } },
  );
  pipeline.push(
    {
      $addFields: {
        displayPriority: {
          $switch: {
            branches: [
              { case: "$isActiveWorkflow", then: 3 },
              { case: { $eq: ["$_id", "$lesson.currentPublishedVersionId"] }, then: 2 },
            ],
            default: 1,
          },
        },
      },
    },
    { $sort: { lessonId: 1, displayPriority: -1, versionNumber: -1 } },
    {
      $group: {
        _id: "$lessonId",
        lesson: { $first: "$lesson" },
        topic: { $first: "$topic" },
        version: { $first: "$$ROOT" },
      },
    },
  );

  const representativeMatch: Document = {};
  if (query.locale) representativeMatch["version.localizations.locale"] = query.locale;
  if (query.skill) representativeMatch["version.primarySkill"] = query.skill;
  if (query.level) {
    representativeMatch["version.cefrLevelMin"] = { $lte: query.level };
    representativeMatch["version.cefrLevelMax"] = { $gte: query.level };
  }
  if (query.category) representativeMatch["topic.categoryId"] = new ObjectId(query.category);
  if (query.status && query.status !== "ARCHIVED" && query.status !== "WITHDRAWN") {
    representativeMatch["version.status"] = query.status;
  }
  if (Object.keys(representativeMatch).length > 0) pipeline.push({ $match: representativeMatch });
  if (query.q) {
    const search = new RegExp(escapeRegex(query.q), "iu");
    pipeline.push({
      $match: {
        $or: [
          { "version.localizations.title": search },
          { "version.localizations.shortDescription": search },
          { "version.tagCodes": search },
          { "lesson.slugs.slug": search },
        ],
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "lesson.createdBy",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
    { $sort: { "version.updatedAt": -1, _id: -1 } },
    {
      $facet: {
        data: [
          { $skip: (query.page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              _id: 0,
              id: { $toString: "$_id" },
              defaultLocale: "$lesson.defaultLocale",
              slugs: "$lesson.slugs",
              publicationStatus: "$lesson.publicationStatus",
              owner: {
                id: { $toString: "$lesson.createdBy" },
                name: "$owner.name",
                email: "$owner.email",
              },
              topic: {
                id: { $toString: "$topic._id" },
                code: "$topic.code",
                localizations: "$topic.localizations",
              },
              version: {
                id: { $toString: "$version._id" },
                versionNumber: "$version.versionNumber",
                revision: "$version.revision",
                status: "$version.status",
                primarySkill: "$version.primarySkill",
                lessonType: "$version.lessonType",
                localizations: "$version.localizations",
                cefrLevelMin: "$version.cefrLevelMin",
                cefrLevelMax: "$version.cefrLevelMax",
                accessTier: "$version.accessTier",
                visibility: "$version.visibility",
                estimatedMinutes: "$version.estimatedMinutes",
                updatedAt: "$version.updatedAt",
              },
            },
          },
        ],
        total: [{ $count: "value" }],
      },
    },
  );

  const result = await database.collection("lesson_versions")
    .aggregate<LessonListAggregateResult>(pipeline, { allowDiskUse: true })
    .next();

  const total = result?.total[0]?.value ?? 0;
  return {
    items: (result?.data ?? []).map((item) => {
      const localization = item.version.localizations.find((entry) => entry.locale === query.locale)
        ?? item.version.localizations.find((entry) => entry.locale === item.defaultLocale)
        ?? item.version.localizations[0];
      const topicName = item.topic?.localizations?.find((entry) => entry.locale === query.locale)?.name
        ?? item.topic?.localizations?.find((entry) => entry.locale === item.defaultLocale)?.name
        ?? item.topic?.localizations?.[0]?.name
        ?? item.topic?.code
        ?? "—";
      return {
        ...item,
        title: localization?.title ?? "Untitled lesson",
        description: localization?.shortDescription ?? "",
        topicName,
      };
    }),
    page: query.page,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
    pageSize,
    total,
  };
}

export async function getLessonListFilterOptions() {
  const database = getMongoClient().db(getDatabaseEnv().databaseName);
  const [categories, ownerIds] = await Promise.all([
    database.collection("content_categories").find(
      { status: "ACTIVE" },
      { projection: { code: 1, localizations: 1 }, sort: { sortOrder: 1, code: 1 } },
    ).toArray(),
    database.collection("lessons").distinct("createdBy"),
  ]);
  const typedOwnerIds = ownerIds as ObjectId[];
  const owners = typedOwnerIds.length === 0
    ? []
    : await database.collection("users").find(
      { _id: { $in: typedOwnerIds } },
      { projection: { email: 1, name: 1 }, sort: { name: 1, email: 1 } },
    ).toArray();

  return {
    categories: categories.map((category) => ({
      id: category._id.toString(),
      label: category.localizations?.find((entry: { locale: string }) => entry.locale === "vi")?.name
        ?? category.localizations?.[0]?.name
        ?? category.code,
    })),
    owners: owners.map((owner) => ({
      id: owner._id.toString(),
      label: typeof owner.name === "string" && owner.name ? owner.name : owner.email ?? owner._id.toString(),
    })),
  };
}

export async function bulkArchiveLessons(input: {
  actorUserId: string;
  lessonIds: string[];
  reason: string;
}) {
  const lessonIds = [...new Set(input.lessonIds)];
  if (lessonIds.length === 0 || lessonIds.length > 100 || lessonIds.some((id) => !ObjectId.isValid(id))) {
    throw new Error("Invalid lesson selection.");
  }
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 2_000) throw new Error("Archive reason is invalid.");

  const client = getMongoClient();
  const database = client.db(getDatabaseEnv().databaseName);
  const session = client.startSession();
  const ids = lessonIds.map((id) => new ObjectId(id));
  const actorId = new ObjectId(input.actorUserId);
  const now = new Date();

  try {
    return await session.withTransaction(async () => {
      const lessons = await database.collection("lessons").find(
        {
          _id: { $in: ids },
          publicationStatus: "PUBLISHED",
          currentPublishedVersionId: { $type: "objectId" },
        },
        { session },
      ).toArray();
      if (lessons.length !== ids.length) {
        throw new Error("Only currently published lessons can be archived together.");
      }

      const updateResult = await database.collection("lessons").updateMany(
        { _id: { $in: ids }, publicationStatus: "PUBLISHED" },
        { $set: { publicationStatus: "ARCHIVED", archivedAt: now, updatedAt: now } },
        { session },
      );
      if (updateResult.modifiedCount !== lessons.length) {
        throw new Error("Lesson publication state changed during bulk archive.");
      }
      await database.collection("content_audit_logs").insertMany(
        lessons.map((lesson) => ({
          actorId,
          resourceType: "LESSON",
          resourceId: lesson._id,
          lessonVersionId: lesson.currentPublishedVersionId,
          action: "ARCHIVED",
          beforeSummary: {
            currentPublishedVersionId: lesson.currentPublishedVersionId.toString(),
            publicationStatus: "PUBLISHED",
          },
          afterSummary: {
            currentPublishedVersionId: lesson.currentPublishedVersionId.toString(),
            publicationStatus: "ARCHIVED",
          },
          reason,
          occurredAt: now,
          createdAt: now,
        })),
        { session },
      );
      await database.collection("lesson_publication_events").insertMany(
        lessons.map((lesson) => ({
          lessonId: lesson._id,
          lessonVersionId: lesson.currentPublishedVersionId,
          eventType: "ARCHIVED",
          actorId,
          reason,
          previousVersionId: null,
          occurredAt: now,
          createdAt: now,
          updatedAt: now,
        })),
        { session },
      );
      await database.collection("content_outbox_events").insertMany(
        lessons.map((lesson) => ({
          aggregateType: "LESSON",
          aggregateId: lesson._id,
          eventType: "lesson.archived",
          payload: {
            lessonId: lesson._id.toString(),
            lessonVersionId: lesson.currentPublishedVersionId.toString(),
            previousVersionId: null,
            occurredAt: now.toISOString(),
          },
          status: "PENDING",
          attempts: 0,
          availableAt: now,
          publishedAt: null,
          lastError: null,
          createdAt: now,
          updatedAt: now,
        })),
        { session },
      );

      return { archivedCount: lessons.length };
    });
  } finally {
    await session.endSession();
  }
}
