import "server-only";

import { ObjectId } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export type CollectionItemView = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  accessTier: "FREE" | "PREMIUM";
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  itemCount: number;
  lessonIds: string[];
  publishedAt: Date | null;
  updatedAt: Date;
};

export async function listAdminCollections(): Promise<CollectionItemView[]> {
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
    updatedAt?: Date;
  };

  const docs = await db
    .collection<RawCollectionDoc>("content_collections")
    .find()
    .sort({ updatedAt: -1 })
    .toArray();

  return docs.map((doc) => {
    const loc = doc.localizations?.find((l) => l.locale === "vi") ?? doc.localizations?.[0];
    const slugObj = doc.slugs?.find((s) => s.locale === "vi") ?? doc.slugs?.[0];

    return {
      id: doc._id.toString(),
      slug: slugObj?.slug || "",
      title: loc?.title || "Bộ sưu tập chưa đặt tên",
      description: loc?.description || "",
      status: doc.status || "DRAFT",
      accessTier: doc.accessTier || "FREE",
      visibility: doc.visibility || "PUBLIC",
      itemCount: doc.items?.length || 0,
      lessonIds: (doc.items || []).map((i) => i.lessonId.toString()),
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    };
  });
}

export async function createAdminCollection(input: {
  actorUserId: string;
  titleVi: string;
  titleEn: string;
  descriptionVi?: string;
  descriptionEn?: string;
  slugVi: string;
  slugEn: string;
  accessTier: "FREE" | "PREMIUM";
}) {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const actorObjectId = ObjectId.isValid(input.actorUserId)
    ? new ObjectId(input.actorUserId)
    : new ObjectId();

  const now = new Date();
  const doc = {
    slugs: [
      { locale: "vi", slug: input.slugVi.trim().toLowerCase() },
      { locale: "en", slug: input.slugEn.trim().toLowerCase() },
    ],
    localizations: [
      {
        locale: "vi",
        title: input.titleVi.trim(),
        description: (input.descriptionVi || "").trim(),
      },
      {
        locale: "en",
        title: input.titleEn.trim(),
        description: (input.descriptionEn || "").trim(),
      },
    ],
    status: "DRAFT",
    visibility: "PUBLIC",
    accessTier: input.accessTier,
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
        updatedAt: now,
        lastEditedBy: ObjectId.isValid(input.actorUserId) ? new ObjectId(input.actorUserId) : new ObjectId(),
      },
    },
  );

  return { success: true };
}
