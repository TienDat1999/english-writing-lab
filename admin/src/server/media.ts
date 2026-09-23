import "server-only";

import { ObjectId } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export type MediaAssetView = {
  id: string;
  title: string;
  url: string;
  category: "IMAGE" | "AUDIO" | "DOCUMENT";
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string;
  createdAt: Date;
};

export async function listMediaAssets(options?: {
  category?: "IMAGE" | "AUDIO" | "DOCUMENT";
  search?: string;
}): Promise<MediaAssetView[]> {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  type RawMediaDoc = {
    _id: ObjectId;
    title: string;
    url: string;
    category: "IMAGE" | "AUDIO" | "DOCUMENT";
    mimeType: string;
    sizeBytes: number;
    uploadedBy: ObjectId;
    createdAt: Date;
    uploader?: {
      name?: string;
      email?: string;
    };
  };

  const match: Record<string, unknown> = {};
  if (options?.category) match.category = options.category;
  if (options?.search && options.search.trim()) {
    match.title = { $regex: options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  const docs = await db.collection("media_assets").aggregate<RawMediaDoc>([
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "uploadedBy",
        foreignField: "_id",
        as: "uploader",
      },
    },
    { $unwind: { path: "$uploader", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
  ]).toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title || "Tài nguyên không tên",
    url: doc.url,
    category: doc.category || "IMAGE",
    mimeType: doc.mimeType || "image/jpeg",
    sizeBytes: doc.sizeBytes || 0,
    uploadedByName: doc.uploader?.name || doc.uploader?.email || "Staff",
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
  }));
}

export async function addMediaAsset(input: {
  actorUserId: string;
  title: string;
  url: string;
  category: "IMAGE" | "AUDIO" | "DOCUMENT";
  mimeType?: string;
  sizeBytes?: number;
}) {
  const url = input.url.trim();
  if (!url) throw new Error("URL tài nguyên không được để trống.");
  const title = input.title.trim();
  if (!title) throw new Error("Tên tài nguyên không được để trống.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const actorObjectId = ObjectId.isValid(input.actorUserId)
    ? new ObjectId(input.actorUserId)
    : new ObjectId();

  const now = new Date();
  const doc = {
    title,
    url,
    category: input.category,
    mimeType: input.mimeType || (input.category === "AUDIO" ? "audio/mpeg" : "image/png"),
    sizeBytes: input.sizeBytes || 0,
    uploadedBy: actorObjectId,
    createdAt: now,
  };

  const result = await db.collection("media_assets").insertOne(doc);
  return { id: result.insertedId.toString() };
}

export async function deleteMediaAsset(input: {
  actorUserId: string;
  mediaId: string;
}) {
  if (!ObjectId.isValid(input.mediaId)) throw new Error("ID tài nguyên không hợp lệ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  await db.collection("media_assets").deleteOne({
    _id: new ObjectId(input.mediaId),
  });

  return { success: true };
}
