import "server-only";

import { type PipelineStage, Types } from "mongoose";
import { z } from "zod";

import { connectMongoose } from "@/server/db/mongoose";
import { InvalidRequestError, ResourceNotFoundError } from "@/server/http/errors";

import { ContentCollection } from "./collection.schema";
import type { ContentLocale } from "./content.constants";
import type {
  PublicCatalogQuery,
  PublicCollectionQuery,
  PublicDetailQuery,
} from "./public-content.contract";
import { Exercise } from "./exercise.schema";
import { Lesson, LessonVersion } from "./lesson.schema";
import { ContentCategory, ContentTopic } from "./taxonomy.schema";

type LocalizedLesson = {
  locale: ContentLocale;
  title: string;
  shortDescription: string;
  learningObjectives: string[];
  contentBlocks: unknown[];
};

type LocalizedTaxonomy = {
  locale: ContentLocale;
  name: string;
  slug: string;
  description: string;
};

type LocalizedCollection = {
  locale: ContentLocale;
  title: string;
  description: string;
};

type LocalizedSlug = { locale: ContentLocale; slug: string };

type PublicLessonIdentity = {
  _id: Types.ObjectId;
  defaultLocale: ContentLocale;
  slugs: LocalizedSlug[];
  publicationStatus: string;
  currentPublishedVersionId: Types.ObjectId | null;
  publishedAt: Date | null;
};

type PublicVersion = {
  _id: Types.ObjectId;
  lessonId: Types.ObjectId;
  status: string;
  primarySkill: string;
  lessonType: string;
  learningLanguage: string;
  localizations: LocalizedLesson[];
  cefrLevelMin: string;
  cefrLevelMax: string;
  audiences: string[];
  ieltsMetadata: unknown;
  primaryTopicId: Types.ObjectId;
  secondaryTopicIds: Types.ObjectId[];
  tagCodes: string[];
  estimatedMinutes: number;
  visibility: string;
  accessTier: string;
  coverAssetId: Types.ObjectId | null;
  prerequisiteLessonIds: Types.ObjectId[];
  relatedLessonIds: Types.ObjectId[];
  publishedAt: Date | null;
};

type PublicTopic = {
  _id: Types.ObjectId;
  categoryId: Types.ObjectId;
  localizations: LocalizedTaxonomy[];
};

type CatalogRecord = PublicVersion & {
  lesson: PublicLessonIdentity;
  primaryTopic: PublicTopic;
  searchScore?: number;
};

type PreviewExercise = {
  _id: Types.ObjectId;
  position: number;
  exerciseType: string;
  localizations: Array<{
    locale: ContentLocale;
    instruction: string;
    promptText: string;
    hintText: string;
    explanationText?: string;
  }>;
  targetContent?: string;
  contextText: string;
  choices: string[];
  answerRubric?: {
    correctAnswer?: string | null;
  };
  estimatedSeconds: number | null;
  isPreview?: boolean;
};

type CollectionRecord = {
  _id: Types.ObjectId;
  slugs: LocalizedSlug[];
  localizations: LocalizedCollection[];
  status: string;
  visibility: string;
  accessTier: string;
  coverAssetId: Types.ObjectId | null;
  publishedAt: Date | null;
};

const browseCursorSchema = z.object({
  mode: z.literal("BROWSE"),
  publishedAt: z.string().datetime(),
  id: z.string().regex(/^[a-f\d]{24}$/iu),
});

const searchCursorSchema = z.object({
  mode: z.literal("SEARCH"),
  score: z.number(),
  id: z.string().regex(/^[a-f\d]{24}$/iu),
});

const collectionCursorSchema = z.object({
  mode: z.literal("COLLECTION"),
  position: z.number().int().min(0),
  lessonId: z.string().regex(/^[a-f\d]{24}$/iu),
});

function encodeCursor(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeCursor<T>(cursor: string | undefined, schema: z.ZodType<T>) {
  if (!cursor) return null;

  try {
    return schema.parse(JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")));
  } catch {
    throw new InvalidRequestError("Invalid pagination cursor.");
  }
}

function selectLocalization<T extends { locale: ContentLocale }>(
  localizations: T[],
  locale: ContentLocale,
  fallbackLocale: ContentLocale = "en",
) {
  return localizations.find((item) => item.locale === locale)
    ?? localizations.find((item) => item.locale === fallbackLocale)
    ?? localizations[0];
}

function selectSlug(
  slugs: LocalizedSlug[],
  locale: ContentLocale,
  fallbackLocale: ContentLocale,
) {
  return selectLocalization(slugs, locale, fallbackLocale);
}

function lessonCard(record: CatalogRecord, locale: ContentLocale) {
  const localization = selectLocalization(
    record.localizations,
    locale,
    record.lesson.defaultLocale,
  );
  const slug = selectSlug(record.lesson.slugs, locale, record.lesson.defaultLocale);
  const topic = selectLocalization(record.primaryTopic.localizations, locale);

  if (!localization || !slug || !topic) {
    throw new ResourceNotFoundError();
  }

  return {
    lessonId: record.lesson._id.toString(),
    lessonVersionId: record._id.toString(),
    locale: localization.locale,
    slug: slug.slug,
    title: localization.title,
    shortDescription: localization.shortDescription,
    primarySkill: record.primarySkill,
    lessonType: record.lessonType,
    cefrLevelMin: record.cefrLevelMin,
    cefrLevelMax: record.cefrLevelMax,
    audiences: record.audiences,
    estimatedMinutes: record.estimatedMinutes,
    accessTier: record.accessTier,
    coverAssetId: record.coverAssetId?.toString() ?? null,
    primaryTopic: {
      id: record.primaryTopic._id.toString(),
      name: topic.name,
      slug: topic.slug,
    },
    publishedAt: record.publishedAt?.toISOString() ?? null,
  };
}

async function resolveTaxonomyFilters(query: PublicCatalogQuery) {
  let categoryId: Types.ObjectId | null = null;
  let topicId: Types.ObjectId | null = null;

  if (query.category) {
    const category = await ContentCategory.findOne({
      status: "ACTIVE",
      $or: [
        { code: query.category.toUpperCase() },
        {
          localizations: {
            $elemMatch: { locale: query.locale, slug: query.category.toLowerCase() },
          },
        },
      ],
    }).select({ _id: 1 }).lean<{ _id: Types.ObjectId }>();
    if (!category) return { noMatch: true as const };
    categoryId = category._id;
  }

  if (query.topic) {
    const topic = await ContentTopic.findOne({
      status: "ACTIVE",
      ...(categoryId ? { categoryId } : {}),
      $or: [
        { code: query.topic.toUpperCase() },
        {
          localizations: {
            $elemMatch: { locale: query.locale, slug: query.topic.toLowerCase() },
          },
        },
      ],
    }).select({ _id: 1 }).lean<{ _id: Types.ObjectId }>();
    if (!topic) return { noMatch: true as const };
    topicId = topic._id;
  }

  let categoryTopicIds: Types.ObjectId[] | null = null;
  if (categoryId && !topicId) {
    const topics = await ContentTopic.find({ categoryId, status: "ACTIVE" })
      .select({ _id: 1 })
      .lean<Array<{ _id: Types.ObjectId }>>();
    if (topics.length === 0) return { noMatch: true as const };
    categoryTopicIds = topics.map((topic) => topic._id);
  }

  return { noMatch: false as const, topicId, categoryTopicIds };
}

export async function listPublicLessons(query: PublicCatalogQuery) {
  await connectMongoose();
  const taxonomy = await resolveTaxonomyFilters(query);
  if (taxonomy.noMatch) return { items: [], nextCursor: null };

  const filter: Record<string, unknown> = {
    status: "PUBLISHED",
    visibility: "PUBLIC",
    publishedAt: { $ne: null },
    localizations: { $elemMatch: { locale: query.locale } },
  };

  if (query.q) filter.$text = { $search: query.q };
  if (query.skill) filter.primarySkill = query.skill;
  if (query.type) filter.lessonType = query.type;
  if (query.audience) filter.audiences = query.audience;
  if (query.access) filter.accessTier = query.access;
  if (taxonomy.topicId) {
    filter.$or = [
      { primaryTopicId: taxonomy.topicId },
      { secondaryTopicIds: taxonomy.topicId },
    ];
  } else if (taxonomy.categoryTopicIds) {
    filter.primaryTopicId = { $in: taxonomy.categoryTopicIds };
  }

  if (query.level) {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const levelIndex = levels.indexOf(query.level);
    filter.cefrLevelMin = { $in: levels.slice(0, levelIndex + 1) };
    filter.cefrLevelMax = { $in: levels.slice(levelIndex) };
  }

  const pipeline: PipelineStage[] = [{ $match: filter }];
  if (query.q) {
    pipeline.push({ $set: { searchScore: { $meta: "textScore" } } });
    const cursor = decodeCursor(query.cursor, searchCursorSchema);
    if (cursor) {
      pipeline.push({
        $match: {
          $or: [
            { searchScore: { $lt: cursor.score } },
            { searchScore: cursor.score, _id: { $lt: new Types.ObjectId(cursor.id) } },
          ],
        },
      });
    }
  } else {
    const cursor = decodeCursor(query.cursor, browseCursorSchema);
    if (cursor) {
      pipeline.push({
        $match: {
          $or: [
            { publishedAt: { $lt: new Date(cursor.publishedAt) } },
            {
              publishedAt: new Date(cursor.publishedAt),
              _id: { $lt: new Types.ObjectId(cursor.id) },
            },
          ],
        },
      });
    }
  }

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
    {
      $match: {
        "lesson.publicationStatus": "PUBLISHED",
        $expr: { $eq: ["$lesson.currentPublishedVersionId", "$_id"] },
      },
    },
    {
      $lookup: {
        from: "content_topics",
        localField: "primaryTopicId",
        foreignField: "_id",
        as: "primaryTopic",
      },
    },
    { $unwind: "$primaryTopic" },
    { $match: { "primaryTopic.status": "ACTIVE" } },
    query.q
      ? { $sort: { searchScore: -1, _id: -1 } }
      : { $sort: { publishedAt: -1, _id: -1 } },
    { $limit: query.pageSize + 1 },
  );

  const records = await LessonVersion.aggregate<CatalogRecord>(pipeline);
  const hasMore = records.length > query.pageSize;
  const page = records.slice(0, query.pageSize);
  const last = page.at(-1);
  const nextCursor = hasMore && last
    ? encodeCursor(query.q
      ? { mode: "SEARCH", score: last.searchScore ?? 0, id: last._id.toString() }
      : {
          mode: "BROWSE",
          publishedAt: last.publishedAt?.toISOString(),
          id: last._id.toString(),
        })
    : null;

  return { items: page.map((record) => lessonCard(record, query.locale)), nextCursor };
}

async function findPublishedLessonBySlug(slug: string) {
  const lesson = await Lesson.findOne({
    publicationStatus: "PUBLISHED",
    slugs: { $elemMatch: { slug: slug.toLowerCase() } },
    currentPublishedVersionId: { $ne: null },
  }).lean<PublicLessonIdentity>();
  if (!lesson?.currentPublishedVersionId) throw new ResourceNotFoundError();

  const version = await LessonVersion.findOne({
    _id: lesson.currentPublishedVersionId,
    lessonId: lesson._id,
    status: "PUBLISHED",
    visibility: { $in: ["PUBLIC", "UNLISTED"] },
  }).lean<PublicVersion>();
  if (!version) throw new ResourceNotFoundError();

  return { lesson, version };
}

export async function getPublicLessonDetail(slug: string, query: PublicDetailQuery) {
  await connectMongoose();
  const { lesson, version } = await findPublishedLessonBySlug(slug);
  const [topic, allExercises, parentCollection] = await Promise.all([
    ContentTopic.findOne({ _id: version.primaryTopicId, status: "ACTIVE" })
      .lean<PublicTopic>(),
    Exercise.find({ lessonVersionId: version._id })
      .sort({ position: 1 })
      .select({
        position: 1,
        exerciseType: 1,
        localizations: 1,
        targetContent: 1,
        contextText: 1,
        choices: 1,
        answerRubric: 1,
        estimatedSeconds: 1,
        isPreview: 1,
      })
      .lean<PreviewExercise[]>(),
    ContentCollection.findOne({
      "items.lessonId": lesson._id,
      status: "PUBLISHED",
    })
      .select({ slugs: 1, localizations: 1 })
      .lean<CollectionRecord>(),
  ]);
  if (!topic) throw new ResourceNotFoundError();

  const localization = selectLocalization(
    version.localizations,
    query.locale,
    lesson.defaultLocale,
  );
  const selectedSlug = selectSlug(lesson.slugs, query.locale, lesson.defaultLocale);
  const topicLocalization = selectLocalization(topic.localizations, query.locale);
  if (!localization || !selectedSlug || !topicLocalization) {
    throw new ResourceNotFoundError();
  }

  let collectionInfo: { slug: string; title: string } | null = null;
  if (parentCollection) {
    const collLoc = selectLocalization(parentCollection.localizations, query.locale, lesson.defaultLocale);
    const collSlug = selectSlug(parentCollection.slugs, query.locale, lesson.defaultLocale);
    if (collLoc && collSlug) {
      collectionInfo = { slug: collSlug.slug, title: collLoc.title };
    }
  }

  const vocabularyItems = allExercises
    .map((exercise) => {
      const exerciseLocalization = selectLocalization(exercise.localizations, query.locale);
      const rawPrompt = (exerciseLocalization?.promptText || "").trim();
      const cleanedPrompt = rawPrompt.replace(/^(Ý nghĩa|Nghĩa):\s*/i, "").trim();
      const targetContent = (exercise.targetContent || "").trim();
      const contextText = (exercise.contextText || "").trim();
      const answerText = targetContent || exercise.answerRubric?.correctAnswer || "";

      return {
        id: exercise._id.toString(),
        position: exercise.position,
        term: answerText,
        meaning: cleanedPrompt,
        contextText,
        instruction: (exerciseLocalization?.instruction || "").trim(),
      };
    })
    .filter((item) => item.term || item.meaning);

  return {
    lessonId: lesson._id.toString(),
    lessonVersionId: version._id.toString(),
    locale: localization.locale,
    slug: selectedSlug.slug,
    title: localization.title,
    shortDescription: localization.shortDescription,
    learningObjectives: localization.learningObjectives,
    contentBlocks: localization.contentBlocks,
    primarySkill: version.primarySkill,
    lessonType: version.lessonType,
    learningLanguage: version.learningLanguage,
    cefrLevelMin: version.cefrLevelMin,
    cefrLevelMax: version.cefrLevelMax,
    audiences: version.audiences,
    ieltsMetadata: version.ieltsMetadata,
    estimatedMinutes: version.estimatedMinutes,
    visibility: version.visibility,
    accessTier: version.accessTier,
    coverAssetId: version.coverAssetId?.toString() ?? null,
    exerciseCount: allExercises.length,
    vocabularyItems,
    primaryTopic: {
      id: topic._id.toString(),
      name: topicLocalization.name,
      slug: topicLocalization.slug,
    },
    collection: collectionInfo,
    previewExercises: allExercises
      .filter((exercise) => exercise.isPreview)
      .map((exercise) => {
        const exerciseLocalization = selectLocalization(exercise.localizations, query.locale);
        if (!exerciseLocalization) throw new ResourceNotFoundError();
        return {
          id: exercise._id.toString(),
          position: exercise.position,
          exerciseType: exercise.exerciseType,
          instruction: exerciseLocalization.instruction,
          promptText: exerciseLocalization.promptText,
          hintText: exerciseLocalization.hintText,
          explanationText: exerciseLocalization.explanationText ?? "",
          targetContent: exercise.targetContent || "",
          contextText: exercise.contextText || "",
          choices: exercise.choices,
          correctAnswer: exercise.answerRubric?.correctAnswer ?? null,
          estimatedSeconds: exercise.estimatedSeconds,
        };
      }),
    startAccess: {
      requiresAuthentication: true,
      requiresPremium: version.accessTier === "PREMIUM",
    },
    publishedAt: version.publishedAt?.toISOString() ?? null,
  };
}

export async function getPublicCollectionDetail(
  slug: string,
  query: PublicCollectionQuery,
) {
  await connectMongoose();
  const collection = await ContentCollection.findOne({
    status: "PUBLISHED",
    visibility: { $in: ["PUBLIC", "UNLISTED"] },
    slugs: { $elemMatch: { slug: slug.toLowerCase() } },
  })
    .select({ items: 0 })
    .lean<CollectionRecord>();
  if (!collection) throw new ResourceNotFoundError();

  const cursor = decodeCursor(query.cursor, collectionCursorSchema);
  const itemMatch: Record<string, unknown> = {};
  if (cursor) {
    itemMatch.$or = [
      { "items.position": { $gt: cursor.position } },
      {
        "items.position": cursor.position,
        "items.lessonId": { $gt: new Types.ObjectId(cursor.lessonId) },
      },
    ];
  }

  const pipeline: PipelineStage[] = [
    { $match: { _id: collection._id } },
    { $unwind: "$items" },
    ...(cursor ? [{ $match: itemMatch } as PipelineStage.Match] : []),
    {
      $lookup: {
        from: "lessons",
        localField: "items.lessonId",
        foreignField: "_id",
        as: "lesson",
      },
    },
    { $unwind: "$lesson" },
    { $match: { "lesson.publicationStatus": "PUBLISHED" } },
    {
      $lookup: {
        from: "lesson_versions",
        localField: "lesson.currentPublishedVersionId",
        foreignField: "_id",
        as: "version",
      },
    },
    { $unwind: "$version" },
    {
      $match: {
        "version.status": "PUBLISHED",
        "version.visibility": "PUBLIC",
        "version.localizations": { $elemMatch: { locale: query.locale } },
      },
    },
    {
      $lookup: {
        from: "content_topics",
        localField: "version.primaryTopicId",
        foreignField: "_id",
        as: "primaryTopic",
      },
    },
    { $unwind: "$primaryTopic" },
    { $match: { "primaryTopic.status": "ACTIVE" } },
    { $sort: { "items.position": 1, "items.lessonId": 1 } },
    { $limit: query.pageSize + 1 },
    {
      $project: {
        position: "$items.position",
        lessonId: "$items.lessonId",
        lesson: 1,
        version: 1,
        primaryTopic: 1,
      },
    },
  ];

  type CollectionItemRecord = {
    position: number;
    lessonId: Types.ObjectId;
    lesson: PublicLessonIdentity;
    version: PublicVersion;
    primaryTopic: PublicTopic;
  };

  const records = await ContentCollection.aggregate<CollectionItemRecord>(pipeline);
  const hasMore = records.length > query.pageSize;
  const page = records.slice(0, query.pageSize);
  const last = page.at(-1);
  const localization = selectLocalization(collection.localizations, query.locale);
  const selectedSlug = selectSlug(collection.slugs, query.locale, "en");
  if (!localization || !selectedSlug) throw new ResourceNotFoundError();

  return {
    id: collection._id.toString(),
    locale: localization.locale,
    slug: selectedSlug.slug,
    title: localization.title,
    description: localization.description,
    visibility: collection.visibility,
    accessTier: collection.accessTier,
    coverAssetId: collection.coverAssetId?.toString() ?? null,
    publishedAt: collection.publishedAt?.toISOString() ?? null,
    lessons: page.map((record) => lessonCard({
      ...record.version,
      lesson: record.lesson,
      primaryTopic: record.primaryTopic,
    }, query.locale)),
    nextCursor: hasMore && last
      ? encodeCursor({
          mode: "COLLECTION",
          position: last.position,
          lessonId: last.lessonId.toString(),
        })
      : null,
  };
}

export type PublicCollectionItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind?: string;
  topicCount: number;
  itemCount: number;
  accessTier: string;
  publishedAt: string | null;
};

export async function listPublicCollections(options: {
  locale?: ContentLocale;
  kind?: string;
}): Promise<PublicCollectionItem[]> {
  await connectMongoose();
  const query: Record<string, unknown> = {
    status: "PUBLISHED",
    visibility: { $in: ["PUBLIC", "UNLISTED"] },
  };
  if (options.kind && options.kind !== "ALL") {
    query.kind = options.kind.toUpperCase();
  }

  const docs = await ContentCollection.find(query).sort({ publishedAt: -1, createdAt: -1 }).lean();

  return docs.map((doc) => {
    const locale = options.locale || "vi";
    const loc = doc.localizations?.find((l: { locale: string }) => l.locale === locale) ?? doc.localizations?.[0];
    const slugObj = doc.slugs?.find((s: { locale: string }) => s.locale === locale) ?? doc.slugs?.[0];
    const items = doc.items || [];

    return {
      id: doc._id.toString(),
      slug: slugObj?.slug || doc.slugs?.[0]?.slug || doc._id.toString(),
      title: doc.title || loc?.title || "Bộ bài học",
      description: loc?.description || "Tập hợp các bài học theo lộ trình chuẩn hóa.",
      kind: doc.kind || "COLLOCATION",
      topicCount: doc.topicCount ?? items.length,
      itemCount: doc.itemCount ?? items.length * 3,
      accessTier: doc.accessTier || "FREE",
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
    };
  });
}
