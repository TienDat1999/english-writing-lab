import "server-only";

import { ObjectId } from "mongodb";
import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export type CollectionItemView = {
  id: string;
  slug: string;
  slugEn: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  accessTier: "FREE" | "PREMIUM";
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  itemCount: number;
  lessonIds: string[];
  publishedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
};

export type CollectionDetailView = CollectionItemView & {
  items: Array<{
    lessonId: string;
    position: number;
    title: string;
    slug: string;
    primarySkill: string;
    levelMin?: string;
    levelMax?: string;
    status: string;
  }>;
};

export type AvailableLessonItem = {
  id: string;
  title: string;
  slug: string;
  primarySkill: string;
  level: string;
};

export async function listAdminCollections(options?: {
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  search?: string;
}): Promise<CollectionItemView[]> {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  type RawCollectionDoc = {
    _id: ObjectId;
    slugs?: Array<{ locale: string; slug: string }>;
    localizations?: Array<{ locale: string; title: string; description: string }>;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    accessTier?: "FREE" | "PREMIUM";
    visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
    items?: Array<{ lessonId: ObjectId; position: number }>;
    publishedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  };

  const query: Record<string, unknown> = {};
  if (options?.status) {
    query.status = options.status;
  }
  if (options?.search && options.search.trim()) {
    const s = options.search.trim();
    query.$or = [
      { "localizations.title": { $regex: s, $options: "i" } },
      { "slugs.slug": { $regex: s, $options: "i" } },
    ];
  }

  const docs = await db
    .collection<RawCollectionDoc>("content_collections")
    .find(query)
    .sort({ updatedAt: -1 })
    .toArray();

  return docs.map((doc) => {
    const locVi = doc.localizations?.find((l) => l.locale === "vi");
    const locEn = doc.localizations?.find((l) => l.locale === "en");
    const slugVi = doc.slugs?.find((s) => s.locale === "vi");
    const slugEn = doc.slugs?.find((s) => s.locale === "en");

    return {
      id: doc._id.toString(),
      slug: slugVi?.slug || doc.slugs?.[0]?.slug || "",
      slugEn: slugEn?.slug || "",
      title: locVi?.title || doc.localizations?.[0]?.title || "Bộ sưu tập chưa đặt tên",
      titleEn: locEn?.title || "",
      description: locVi?.description || "",
      descriptionEn: locEn?.description || "",
      status: doc.status || "DRAFT",
      accessTier: doc.accessTier || "FREE",
      visibility: doc.visibility || "PUBLIC",
      itemCount: doc.items?.length || 0,
      lessonIds: (doc.items || []).map((i) => i.lessonId.toString()),
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    };
  });
}

export async function getAdminCollectionDetail(id: string): Promise<CollectionDetailView | null> {
  if (!ObjectId.isValid(id)) return null;

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  type RawCollectionDoc = {
    _id: ObjectId;
    slugs?: Array<{ locale: string; slug: string }>;
    localizations?: Array<{ locale: string; title: string; description: string }>;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    accessTier?: "FREE" | "PREMIUM";
    visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
    items?: Array<{ lessonId: ObjectId; position: number }>;
    publishedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  };

  const doc = await db
    .collection<RawCollectionDoc>("content_collections")
    .findOne({ _id: new ObjectId(id) });

  if (!doc) return null;

  const locVi = doc.localizations?.find((l) => l.locale === "vi");
  const locEn = doc.localizations?.find((l) => l.locale === "en");
  const slugVi = doc.slugs?.find((s) => s.locale === "vi");
  const slugEn = doc.slugs?.find((s) => s.locale === "en");

  const rawItems = doc.items || [];
  const lessonObjectIds = rawItems.map((i) => i.lessonId);

  type LessonAggregateDoc = {
    _id: ObjectId;
    slugs?: Array<{ locale: string; slug: string }>;
    currentPublishedVersion?: ObjectId;
    activeDraftVersion?: ObjectId;
    version?: {
      primarySkill?: string;
      cefrLevelMin?: string;
      cefrLevelMax?: string;
      status?: string;
      localizations?: Array<{ locale: string; title: string }>;
    };
  };

  const lessons = await db
    .collection("lessons")
    .aggregate<LessonAggregateDoc>([
      { $match: { _id: { $in: lessonObjectIds } } },
      {
        $lookup: {
          from: "lesson_versions",
          let: { vId: { $ifNull: ["$currentPublishedVersion", "$activeDraftVersion"] } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$vId"] } } }],
          as: "vDocs",
        },
      },
      {
        $project: {
          _id: 1,
          slugs: 1,
          currentPublishedVersion: 1,
          activeDraftVersion: 1,
          version: { $arrayElemAt: ["$vDocs", 0] },
        },
      },
    ])
    .toArray();

  const lessonMap = new Map(lessons.map((l) => [l._id.toString(), l]));

  const sortedItems = [...rawItems].sort((a, b) => a.position - b.position);

  const populatedItems = sortedItems.map((item) => {
    const lDoc = lessonMap.get(item.lessonId.toString());
    const viTitle =
      lDoc?.version?.localizations?.find((loc) => loc.locale === "vi")?.title ||
      lDoc?.version?.localizations?.[0]?.title ||
      "Bài học không xác định";
    const slug = lDoc?.slugs?.find((s) => s.locale === "vi")?.slug || lDoc?.slugs?.[0]?.slug || "";

    return {
      lessonId: item.lessonId.toString(),
      position: item.position,
      title: viTitle,
      slug,
      primarySkill: lDoc?.version?.primarySkill || "VOCABULARY",
      levelMin: lDoc?.version?.cefrLevelMin,
      levelMax: lDoc?.version?.cefrLevelMax,
      status: lDoc?.version?.status || "UNKNOWN",
    };
  });

  return {
    id: doc._id.toString(),
    slug: slugVi?.slug || doc.slugs?.[0]?.slug || "",
    slugEn: slugEn?.slug || "",
    title: locVi?.title || doc.localizations?.[0]?.title || "Bộ sưu tập chưa đặt tên",
    titleEn: locEn?.title || "",
    description: locVi?.description || "",
    descriptionEn: locEn?.description || "",
    status: doc.status || "DRAFT",
    accessTier: doc.accessTier || "FREE",
    visibility: doc.visibility || "PUBLIC",
    itemCount: populatedItems.length,
    lessonIds: populatedItems.map((i) => i.lessonId),
    items: populatedItems,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  };
}

export async function createAdminCollection(input: {
  actorUserId: string;
  titleVi: string;
  titleEn?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  slugVi: string;
  slugEn?: string;
  accessTier: "FREE" | "PREMIUM";
  visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
}) {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const actorObjectId = ObjectId.isValid(input.actorUserId)
    ? new ObjectId(input.actorUserId)
    : new ObjectId();

  const slugViNorm = input.slugVi.trim().toLowerCase();
  const slugEnNorm = (input.slugEn || input.slugVi).trim().toLowerCase();

  // Check unique slug
  const existing = await db.collection("content_collections").findOne({
    $or: [
      { "slugs.slug": slugViNorm, "slugs.locale": "vi" },
      { "slugs.slug": slugEnNorm, "slugs.locale": "en" },
    ],
  });

  if (existing) {
    throw new Error(`Slug "${slugViNorm}" đã tồn tại. Vui lòng chọn slug khác.`);
  }

  const now = new Date();
  const doc = {
    slugs: [
      { locale: "vi", slug: slugViNorm },
      { locale: "en", slug: slugEnNorm },
    ],
    localizations: [
      {
        locale: "vi",
        title: input.titleVi.trim(),
        description: (input.descriptionVi || "").trim(),
      },
      {
        locale: "en",
        title: (input.titleEn || input.titleVi).trim(),
        description: (input.descriptionEn || "").trim(),
      },
    ],
    status: "DRAFT",
    visibility: input.visibility || "PUBLIC",
    accessTier: input.accessTier || "FREE",
    items: [],
    coverAssetId: null,
    createdBy: actorObjectId,
    lastEditedBy: actorObjectId,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("content_collections").insertOne(doc);
  return { id: result.insertedId.toString() };
}

export async function updateAdminCollection(
  collectionId: string,
  input: {
    actorUserId: string;
    titleVi: string;
    titleEn?: string;
    descriptionVi?: string;
    descriptionEn?: string;
    slugVi: string;
    slugEn?: string;
    accessTier: "FREE" | "PREMIUM";
    visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
  },
) {
  if (!ObjectId.isValid(collectionId)) throw new Error("ID bộ sưu tập không hợp lệ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const actorObjectId = ObjectId.isValid(input.actorUserId)
    ? new ObjectId(input.actorUserId)
    : new ObjectId();

  const colObjectId = new ObjectId(collectionId);
  const slugViNorm = input.slugVi.trim().toLowerCase();
  const slugEnNorm = (input.slugEn || input.slugVi).trim().toLowerCase();

  const existing = await db.collection("content_collections").findOne({
    _id: { $ne: colObjectId },
    $or: [
      { "slugs.slug": slugViNorm, "slugs.locale": "vi" },
      { "slugs.slug": slugEnNorm, "slugs.locale": "en" },
    ],
  });

  if (existing) {
    throw new Error(`Slug "${slugViNorm}" đã bị trùng với bộ sưu tập khác.`);
  }

  const now = new Date();
  await db.collection("content_collections").updateOne(
    { _id: colObjectId },
    {
      $set: {
        slugs: [
          { locale: "vi", slug: slugViNorm },
          { locale: "en", slug: slugEnNorm },
        ],
        localizations: [
          {
            locale: "vi",
            title: input.titleVi.trim(),
            description: (input.descriptionVi || "").trim(),
          },
          {
            locale: "en",
            title: (input.titleEn || input.titleVi).trim(),
            description: (input.descriptionEn || "").trim(),
          },
        ],
        accessTier: input.accessTier,
        visibility: input.visibility || "PUBLIC",
        lastEditedBy: actorObjectId,
        updatedAt: now,
      },
    },
  );

  return { success: true };
}

export async function updateCollectionStatus(input: {
  actorUserId: string;
  collectionId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  if (!ObjectId.isValid(input.collectionId)) throw new Error("ID bộ sưu tập không hợp lệ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const now = new Date();

  await db.collection("content_collections").updateOne(
    { _id: new ObjectId(input.collectionId) },
    {
      $set: {
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? now : null,
        archivedAt: input.status === "ARCHIVED" ? now : null,
        updatedAt: now,
        lastEditedBy: ObjectId.isValid(input.actorUserId)
          ? new ObjectId(input.actorUserId)
          : new ObjectId(),
      },
    },
  );

  return { success: true };
}

export async function addLessonToCollection(input: {
  actorUserId: string;
  collectionId: string;
  lessonId: string;
}) {
  if (!ObjectId.isValid(input.collectionId)) throw new Error("ID bộ sưu tập không hợp lệ.");
  if (!ObjectId.isValid(input.lessonId)) throw new Error("ID bài học không hợp lệ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const colObjectId = new ObjectId(input.collectionId);
  const lessonObjectId = new ObjectId(input.lessonId);

  const collection = await db.collection<{ items?: Array<{ lessonId: ObjectId; position: number }> }>("content_collections").findOne({ _id: colObjectId });
  if (!collection) throw new Error("Không tìm thấy bộ sưu tập.");

  const items = collection.items || [];
  const alreadyIn = items.some((i) => i.lessonId.equals(lessonObjectId));
  if (alreadyIn) {
    throw new Error("Bài học này đã có trong bộ sưu tập.");
  }

  const nextPos = items.length;
  const now = new Date();

  await db.collection("content_collections").updateOne(
    { _id: colObjectId },
    {
      $push: { items: { lessonId: lessonObjectId, position: nextPos } } as any,
      $set: {
        updatedAt: now,
        lastEditedBy: ObjectId.isValid(input.actorUserId)
          ? new ObjectId(input.actorUserId)
          : new ObjectId(),
      },
    },
  );

  return { success: true };
}

export async function removeLessonFromCollection(input: {
  actorUserId: string;
  collectionId: string;
  lessonId: string;
}) {
  if (!ObjectId.isValid(input.collectionId)) throw new Error("ID bộ sưu tập không hợp lệ.");
  if (!ObjectId.isValid(input.lessonId)) throw new Error("ID bài học không hợp lệ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const colObjectId = new ObjectId(input.collectionId);
  const lessonObjectId = new ObjectId(input.lessonId);

  const collection = await db.collection<{ items?: Array<{ lessonId: ObjectId; position: number }> }>("content_collections").findOne({ _id: colObjectId });
  if (!collection) throw new Error("Không tìm thấy bộ sưu tập.");

  const filtered = (collection.items || []).filter((i) => !i.lessonId.equals(lessonObjectId));
  const reindexed = filtered.map((item, idx) => ({
    lessonId: item.lessonId,
    position: idx,
  }));

  const now = new Date();
  await db.collection("content_collections").updateOne(
    { _id: colObjectId },
    {
      $set: {
        items: reindexed,
        updatedAt: now,
        lastEditedBy: ObjectId.isValid(input.actorUserId)
          ? new ObjectId(input.actorUserId)
          : new ObjectId(),
      },
    },
  );

  return { success: true };
}

export async function reorderCollectionLessons(input: {
  actorUserId: string;
  collectionId: string;
  orderedLessonIds: string[];
}) {
  if (!ObjectId.isValid(input.collectionId)) throw new Error("ID bộ sưu tập không hợp lệ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const colObjectId = new ObjectId(input.collectionId);

  const validLessonIds = input.orderedLessonIds
    .filter((id) => ObjectId.isValid(id))
    .map((id, index) => ({
      lessonId: new ObjectId(id),
      position: index,
    }));

  const now = new Date();
  await db.collection("content_collections").updateOne(
    { _id: colObjectId },
    {
      $set: {
        items: validLessonIds,
        updatedAt: now,
        lastEditedBy: ObjectId.isValid(input.actorUserId)
          ? new ObjectId(input.actorUserId)
          : new ObjectId(),
      },
    },
  );

  return { success: true };
}

export async function getAvailablePublishedLessons(): Promise<AvailableLessonItem[]> {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  type RawLessonDoc = {
    _id: ObjectId;
    slugs?: Array<{ locale: string; slug: string }>;
    version?: {
      primarySkill?: string;
      cefrLevelMin?: string;
      cefrLevelMax?: string;
      localizations?: Array<{ locale: string; title: string }>;
    };
  };

  const docs = await db
    .collection("lessons")
    .aggregate<RawLessonDoc>([
      { $match: { currentPublishedVersion: { $ne: null } } },
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
    ])
    .toArray();

  return docs.map((doc) => {
    const title =
      doc.version?.localizations?.find((l) => l.locale === "vi")?.title ||
      doc.version?.localizations?.[0]?.title ||
      "Bài học không tiêu đề";
    const slug = doc.slugs?.find((s) => s.locale === "vi")?.slug || doc.slugs?.[0]?.slug || "";
    const min = doc.version?.cefrLevelMin || "B1";
    const max = doc.version?.cefrLevelMax;
    const level = max && max !== min ? `${min}-${max}` : min;

    return {
      id: doc._id.toString(),
      title,
      slug,
      primarySkill: doc.version?.primarySkill || "VOCABULARY",
      level,
    };
  });
}
