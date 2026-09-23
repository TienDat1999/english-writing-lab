import "server-only";

import {
  ContentValidationError,
  createCategorySchema,
  createTopicSchema,
  taxonomyStatusChangeSchema,
  updateCategorySchema,
  updateTopicSchema,
} from "@draftwise/content";
import { ObjectId, type ClientSession, type Db } from "mongodb";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export class TaxonomyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaxonomyConflictError";
  }
}

function normalizeAliases(values: string[]) {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  return [...new Map(normalized.map((value) => [value.toLocaleLowerCase("en"), value])).values()];
}

function assertUniqueLocales(localizations: Array<{ locale: string }>) {
  if (new Set(localizations.map((entry) => entry.locale)).size !== localizations.length) {
    throw new ContentValidationError(["Taxonomy localizations must use unique locales."]);
  }
}

async function ensureIndexes(database: Db) {
  await Promise.all([
    database.collection("content_categories").createIndex(
      { code: 1 },
      { name: "unique_content_category_code", unique: true },
    ),
    database.collection("content_categories").createIndex(
      { "localizations.locale": 1, "localizations.slug": 1 },
      { name: "content_category_locale_slug" },
    ),
    database.collection("content_topics").createIndex(
      { categoryId: 1, code: 1 },
      { name: "unique_content_topic_code_per_category", unique: true },
    ),
    database.collection("content_topics").createIndex(
      { "localizations.locale": 1, "localizations.slug": 1 },
      { name: "content_topic_locale_slug" },
    ),
    database.collection("taxonomy_audit_logs").createIndex(
      { resourceType: 1, resourceId: 1, occurredAt: -1 },
      { name: "taxonomy_audit_resource_timeline" },
    ),
  ]);
}

async function assertSlugsAvailable(
  database: Db,
  session: ClientSession,
  collectionName: "content_categories" | "content_topics",
  localizations: Array<{ locale: string; slug: string }>,
  excludeId?: ObjectId,
) {
  const conflicts = await database.collection(collectionName).countDocuments(
    {
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      $or: localizations.map((entry) => ({
        localizations: { $elemMatch: { locale: entry.locale, slug: entry.slug } },
      })),
    },
    { session },
  );
  if (conflicts > 0) throw new TaxonomyConflictError("Slug đã được dùng bởi taxonomy khác.");
}

async function appendAudit(
  database: Db,
  session: ClientSession,
  input: {
    action: string;
    actorId: ObjectId;
    afterSummary?: Record<string, unknown> | null;
    beforeSummary?: Record<string, unknown> | null;
    reason?: string;
    resourceId: ObjectId;
    resourceType: "CATEGORY" | "TOPIC";
  },
) {
  const now = new Date();
  await database.collection("taxonomy_audit_logs").insertOne({
    ...input,
    afterSummary: input.afterSummary ?? null,
    beforeSummary: input.beforeSummary ?? null,
    reason: input.reason ?? "",
    occurredAt: now,
    createdAt: now,
  }, { session });
}

export async function listTaxonomy() {
  const database = getMongoClient().db(getDatabaseEnv().databaseName);
  const [categories, topics] = await Promise.all([
    database.collection("content_categories").find({}).sort({ sortOrder: 1, code: 1 }).toArray(),
    database.collection("content_topics").find({}).sort({ categoryId: 1, sortOrder: 1, code: 1 }).toArray(),
  ]);
  const topicCounts = new Map<string, { active: number; total: number }>();
  for (const topic of topics) {
    const key = topic.categoryId.toString();
    const current = topicCounts.get(key) ?? { active: 0, total: 0 };
    current.total += 1;
    if (topic.status === "ACTIVE") current.active += 1;
    topicCounts.set(key, current);
  }

  return {
    categories: categories.map((category) => ({
      id: category._id.toString(),
      code: String(category.code),
      localizations: category.localizations as Array<{ locale: "vi" | "en"; name: string; slug: string; description: string }>,
      sortOrder: Number(category.sortOrder ?? 0),
      status: category.status as "ACTIVE" | "DISABLED",
      topicCount: topicCounts.get(category._id.toString()) ?? { active: 0, total: 0 },
    })),
    topics: topics.map((topic) => ({
      id: topic._id.toString(),
      categoryId: topic.categoryId.toString(),
      code: String(topic.code),
      localizations: topic.localizations as Array<{ locale: "vi" | "en"; name: string; slug: string; description: string }>,
      aliases: (topic.aliases ?? []) as string[],
      sortOrder: Number(topic.sortOrder ?? 0),
      status: topic.status as "ACTIVE" | "DISABLED",
    })),
  };
}

export async function createCategory(actorUserId: string, input: unknown) {
  const parsed = createCategorySchema.parse(input);
  assertUniqueLocales(parsed.localizations);
  const client = getMongoClient();
  const database = client.db(getDatabaseEnv().databaseName);
  await ensureIndexes(database);
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      await assertSlugsAvailable(database, session, "content_categories", parsed.localizations);
      const now = new Date();
      const id = new ObjectId();
      const document = {
        _id: id,
        ...parsed,
        status: "ACTIVE",
        createdBy: new ObjectId(actorUserId),
        disabledAt: null,
        createdAt: now,
        updatedAt: now,
      };
      try {
        await database.collection("content_categories").insertOne(document, { session });
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === 11000) {
          throw new TaxonomyConflictError("Code hoặc slug category đã tồn tại.");
        }
        throw error;
      }
      await appendAudit(database, session, {
        action: "CATEGORY_CREATED",
        actorId: new ObjectId(actorUserId),
        afterSummary: { code: parsed.code, sortOrder: parsed.sortOrder, status: "ACTIVE" },
        resourceId: id,
        resourceType: "CATEGORY",
      });
      return { id: id.toString() };
    });
  } finally {
    await session.endSession();
  }
}

export async function updateCategory(actorUserId: string, categoryId: string, input: unknown) {
  if (!ObjectId.isValid(categoryId)) throw new TaxonomyConflictError("Category không tồn tại.");
  const parsed = updateCategorySchema.parse(input);
  assertUniqueLocales(parsed.localizations);
  const client = getMongoClient();
  const database = client.db(getDatabaseEnv().databaseName);
  const session = client.startSession();
  const id = new ObjectId(categoryId);
  try {
    return await session.withTransaction(async () => {
      const existing = await database.collection("content_categories").findOne({ _id: id }, { session });
      if (!existing) throw new TaxonomyConflictError("Category không tồn tại.");
      await assertSlugsAvailable(database, session, "content_categories", parsed.localizations, id);
      await database.collection("content_categories").updateOne(
        { _id: id },
        { $set: { ...parsed, updatedAt: new Date() } },
        { session },
      );
      await appendAudit(database, session, {
        action: "CATEGORY_UPDATED",
        actorId: new ObjectId(actorUserId),
        beforeSummary: { sortOrder: existing.sortOrder, status: existing.status },
        afterSummary: { sortOrder: parsed.sortOrder, status: existing.status },
        resourceId: id,
        resourceType: "CATEGORY",
      });
      return { id: categoryId };
    });
  } finally {
    await session.endSession();
  }
}

export async function createTopic(actorUserId: string, input: unknown) {
  const parsed = createTopicSchema.parse(input);
  assertUniqueLocales(parsed.localizations);
  const aliases = normalizeAliases(parsed.aliases);
  const client = getMongoClient();
  const database = client.db(getDatabaseEnv().databaseName);
  await ensureIndexes(database);
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const category = await database.collection("content_categories").findOne(
        { _id: new ObjectId(parsed.categoryId), status: "ACTIVE" },
        { projection: { _id: 1 }, session },
      );
      if (!category) throw new ContentValidationError(["Topic requires an active category."]);
      await assertSlugsAvailable(database, session, "content_topics", parsed.localizations);
      const now = new Date();
      const id = new ObjectId();
      try {
        await database.collection("content_topics").insertOne({
          _id: id,
          ...parsed,
          categoryId: new ObjectId(parsed.categoryId),
          aliases,
          status: "ACTIVE",
          createdBy: new ObjectId(actorUserId),
          disabledAt: null,
          createdAt: now,
          updatedAt: now,
        }, { session });
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === 11000) {
          throw new TaxonomyConflictError("Code hoặc slug topic đã tồn tại.");
        }
        throw error;
      }
      await appendAudit(database, session, {
        action: "TOPIC_CREATED",
        actorId: new ObjectId(actorUserId),
        afterSummary: { categoryId: parsed.categoryId, code: parsed.code, sortOrder: parsed.sortOrder, status: "ACTIVE" },
        resourceId: id,
        resourceType: "TOPIC",
      });
      return { id: id.toString() };
    });
  } finally {
    await session.endSession();
  }
}

export async function updateTopic(actorUserId: string, topicId: string, input: unknown) {
  if (!ObjectId.isValid(topicId)) throw new TaxonomyConflictError("Topic không tồn tại.");
  const parsed = updateTopicSchema.parse(input);
  assertUniqueLocales(parsed.localizations);
  const client = getMongoClient();
  const database = client.db(getDatabaseEnv().databaseName);
  const session = client.startSession();
  const id = new ObjectId(topicId);
  try {
    return await session.withTransaction(async () => {
      const existing = await database.collection("content_topics").findOne({ _id: id }, { session });
      if (!existing) throw new TaxonomyConflictError("Topic không tồn tại.");
      const category = await database.collection("content_categories").findOne(
        { _id: new ObjectId(parsed.categoryId), status: "ACTIVE" },
        { projection: { _id: 1 }, session },
      );
      if (!category) throw new ContentValidationError(["Topic requires an active category."]);
      await assertSlugsAvailable(database, session, "content_topics", parsed.localizations, id);
      await database.collection("content_topics").updateOne(
        { _id: id },
        {
          $set: {
            ...parsed,
            categoryId: new ObjectId(parsed.categoryId),
            aliases: normalizeAliases(parsed.aliases),
            updatedAt: new Date(),
          },
        },
        { session },
      );
      await appendAudit(database, session, {
        action: "TOPIC_UPDATED",
        actorId: new ObjectId(actorUserId),
        beforeSummary: { categoryId: existing.categoryId.toString(), sortOrder: existing.sortOrder, status: existing.status },
        afterSummary: { categoryId: parsed.categoryId, sortOrder: parsed.sortOrder, status: existing.status },
        resourceId: id,
        resourceType: "TOPIC",
      });
      return { id: topicId };
    });
  } finally {
    await session.endSession();
  }
}

export async function changeTaxonomyStatus(
  actorUserId: string,
  resourceType: "CATEGORY" | "TOPIC",
  resourceId: string,
  input: unknown,
) {
  if (!ObjectId.isValid(resourceId)) throw new TaxonomyConflictError("Taxonomy không tồn tại.");
  const parsed = taxonomyStatusChangeSchema.parse(input);
  const client = getMongoClient();
  const database = client.db(getDatabaseEnv().databaseName);
  const session = client.startSession();
  const id = new ObjectId(resourceId);
  const collectionName = resourceType === "CATEGORY" ? "content_categories" : "content_topics";
  try {
    return await session.withTransaction(async () => {
      const existing = await database.collection(collectionName).findOne({ _id: id }, { session });
      if (!existing) throw new TaxonomyConflictError("Taxonomy không tồn tại.");
      if (existing.status === parsed.status) return { id: resourceId, status: parsed.status };

      if (resourceType === "CATEGORY" && parsed.status === "DISABLED") {
        const activeTopics = await database.collection("content_topics").countDocuments(
          { categoryId: id, status: "ACTIVE" },
          { session },
        );
        if (activeTopics > 0) {
          throw new ContentValidationError(["Disable các topic đang active trước khi disable category."]);
        }
      }
      if (resourceType === "TOPIC" && parsed.status === "ACTIVE") {
        const category = await database.collection("content_categories").findOne(
          { _id: existing.categoryId, status: "ACTIVE" },
          { projection: { _id: 1 }, session },
        );
        if (!category) throw new ContentValidationError(["Không thể bật topic khi category đang disabled."]);
      }

      const now = new Date();
      await database.collection(collectionName).updateOne(
        { _id: id, status: existing.status },
        { $set: { status: parsed.status, disabledAt: parsed.status === "DISABLED" ? now : null, updatedAt: now } },
        { session },
      );
      await appendAudit(database, session, {
        action: `${resourceType}_${parsed.status === "ACTIVE" ? "ENABLED" : "DISABLED"}`,
        actorId: new ObjectId(actorUserId),
        beforeSummary: { status: existing.status },
        afterSummary: { status: parsed.status },
        reason: parsed.reason,
        resourceId: id,
        resourceType,
      });
      return { id: resourceId, status: parsed.status };
    });
  } finally {
    await session.endSession();
  }
}
