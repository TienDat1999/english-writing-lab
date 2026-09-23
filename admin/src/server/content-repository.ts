import "server-only";

import { ObjectId } from "mongodb";
import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";
import { revalidatePath } from "next/cache";

export type ContentKind =
  | "TOPIC_VOCABULARY"
  | "SYNONYM"
  | "COLLOCATION"
  | "PARAPHRASE"
  | "TEMPLATE";

export type ContentPackageItem = {
  id: string;
  title: string;
  kind: ContentKind;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  accessTier: "FREE" | "PREMIUM";
  topicCount: number;
  itemCount: number;
  lessonIds: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

export type TopicCardItem = {
  lessonId: string;
  topicId: string;
  topicName: string;
  topicCode: string;
  status: "DRAFT" | "PUBLISHED" | "IN_REVIEW" | "APPROVED" | "ARCHIVED";
  lessonTitle: string;
  exerciseCount: number;
  items: Array<{
    target: string;
    meaning: string;
    context: string;
    exerciseType: string;
  }>;
};

export type PackageDetails = {
  id: string;
  title: string;
  kind: ContentKind;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  accessTier: "FREE" | "PREMIUM";
  topicCount: number;
  itemCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  topicCards: TopicCardItem[];
};

/**
 * Lists all content packages, optionally filtered by kind.
 * Also runs an auto-repair check to ensure any imported lessons without a package
 * (like the 59 collocations) are bundled into a visible package!
 */
export async function listContentPackages(
  kind?: ContentKind,
  actorUserId?: string,
): Promise<ContentPackageItem[]> {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  // Auto-migration check: If there are collocation lessons but no collocation package
  if (actorUserId) {
    await autoBundleOrphanLessons(db, actorUserId);
  }

  const query: Record<string, unknown> = {};
  if (kind) {
    query.kind = kind;
  }

  const docs = await db
    .collection("content_collections")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) => {
    const loc = doc.localizations?.find((l: any) => l.locale === "vi") ?? doc.localizations?.[0];
    const items = (doc.items ?? []) as Array<{ lessonId: ObjectId; position: number }>;
    return {
      id: doc._id.toString(),
      title: doc.title || loc?.title || "Bộ học chưa đặt tên",
      kind: (doc.kind as ContentKind) || "COLLOCATION",
      status: (doc.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT",
      accessTier: (doc.accessTier as "FREE" | "PREMIUM") || "FREE",
      topicCount: doc.topicCount ?? items.length,
      itemCount: doc.itemCount ?? items.length * 3,
      lessonIds: items.map((i) => i.lessonId.toString()),
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
    };
  });
}

/**
 * Auto-bundles orphan lessons created by CSV importer into packages
 * so user never misses their imported content!
 */
async function autoBundleOrphanLessons(db: any, actorUserId: string) {
  const actorObjectId = ObjectId.isValid(actorUserId) ? new ObjectId(actorUserId) : new ObjectId();
  const kinds: ContentKind[] = ["COLLOCATION", "TOPIC_VOCABULARY", "SYNONYM", "PARAPHRASE", "TEMPLATE"];

  for (const kind of kinds) {
    const existingPackage = await db.collection("content_collections").findOne({ kind });
    if (!existingPackage) {
      const lessonType =
        kind === "TEMPLATE"
          ? "SENTENCE_PATTERN"
          : kind === "PARAPHRASE"
            ? "PARAPHRASE"
            : kind === "SYNONYM"
              ? "SYNONYM"
              : kind === "COLLOCATION"
                ? "COLLOCATION"
                : "TOPIC_VOCABULARY";

      const lessons = await db
        .collection("lesson_versions")
        .find({ lessonType, isActiveWorkflow: true })
        .toArray();

      if (lessons.length > 0) {
        // Count exercises
        const versionIds = lessons.map((l: any) => l._id);
        const exerciseCount = await db
          .collection("exercises")
          .countDocuments({ lessonVersionId: { $in: versionIds } });

        const now = new Date();
        const title =
          kind === "COLLOCATION"
            ? "Bộ 180 Collocations Cốt lõi (quiz-collocations-180)"
            : `Bộ dữ liệu ${kind}`;

        await db.collection("content_collections").insertOne({
          title,
          kind,
          slugs: [{ locale: "vi", slug: `package-${kind.toLowerCase()}` }],
          localizations: [
            { locale: "vi", title, description: `Tập hợp ${lessons.length} chủ đề ${kind}` },
            { locale: "en", title, description: `Collection of ${lessons.length} ${kind} topics` },
          ],
          status: "DRAFT",
          visibility: "PUBLIC",
          accessTier: "FREE",
          topicCount: lessons.length,
          itemCount: exerciseCount || lessons.length * 3,
          items: lessons.map((l: any, idx: number) => ({
            lessonId: l.lessonId,
            position: idx + 1,
          })),
          createdBy: actorObjectId,
          lastEditedBy: actorObjectId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
}

/**
 * Gets details of a package including all Topic Cards and their exercises
 */
export async function getPackageDetails(packageId: string): Promise<PackageDetails | null> {
  if (!ObjectId.isValid(packageId)) return null;

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const pkgObjectId = new ObjectId(packageId);

  const pkg = await db.collection("content_collections").findOne({ _id: pkgObjectId });
  if (!pkg) return null;

  const loc = pkg.localizations?.find((l: any) => l.locale === "vi") ?? pkg.localizations?.[0];
  const items = (pkg.items ?? []) as Array<{ lessonId: ObjectId; position: number }>;
  const lessonIds = items.map((i) => i.lessonId);

  // Fetch all lesson versions and their topics
  const versions = await db
    .collection("lesson_versions")
    .find({ lessonId: { $in: lessonIds } })
    .toArray();

  // Map latest version per lesson
  const versionMap = new Map<string, any>();
  for (const v of versions) {
    const lId = v.lessonId.toString();
    const existing = versionMap.get(lId);
    if (!existing || v.versionNumber > existing.versionNumber) {
      versionMap.set(lId, v);
    }
  }

  // Fetch topic docs
  const topicIds = Array.from(
    new Set(
      Array.from(versionMap.values())
        .map((v) => v.primaryTopicId)
        .filter(Boolean),
    ),
  );

  const topicDocs = await db
    .collection("content_topics")
    .find({ _id: { $in: topicIds } })
    .toArray();

  const topicMap = new Map<string, any>();
  for (const t of topicDocs) {
    topicMap.set(t._id.toString(), t);
  }

  // Fetch exercises for all active versions
  const activeVersionIds = Array.from(versionMap.values()).map((v) => v._id);
  const exercises = await db
    .collection("exercises")
    .find({ lessonVersionId: { $in: activeVersionIds } })
    .sort({ position: 1 })
    .toArray();

  const exerciseMap = new Map<string, any[]>();
  for (const ex of exercises) {
    const vId = ex.lessonVersionId.toString();
    if (!exerciseMap.has(vId)) exerciseMap.set(vId, []);
    exerciseMap.get(vId)!.push(ex);
  }

  // Build Topic Cards
  const topicCards: TopicCardItem[] = [];
  for (const item of items) {
    const lId = item.lessonId.toString();
    const version = versionMap.get(lId);
    if (!version) continue;

    const topicIdStr = version.primaryTopicId?.toString() ?? "";
    const topicDoc = topicMap.get(topicIdStr);
    const topicLoc = topicDoc?.localizations?.find((l: any) => l.locale === "vi") ?? topicDoc?.localizations?.[0];
    const topicName = topicLoc?.name || topicDoc?.aliases?.[0] || topicDoc?.code || "Chủ đề";

    const lessonExercises = exerciseMap.get(version._id.toString()) ?? [];
    const exerciseItems = lessonExercises.map((e: any) => {
      const viLoc = e.localizations?.find((l: any) => l.locale === "vi") ?? e.localizations?.[0];
      return {
        target: e.targetContent || "",
        meaning: viLoc?.promptText || viLoc?.instruction || "",
        context: e.contextText || "",
        exerciseType: e.exerciseType || "QUIZ",
      };
    });

    const vLoc = version.localizations?.find((l: any) => l.locale === "vi") ?? version.localizations?.[0];

    topicCards.push({
      lessonId: lId,
      topicId: topicIdStr,
      topicName,
      topicCode: topicDoc?.code || topicName,
      status: version.status as any,
      lessonTitle: vLoc?.title || topicName,
      exerciseCount: lessonExercises.length,
      items: exerciseItems,
    });
  }

  return {
    id: pkg._id.toString(),
    title: pkg.title || loc?.title || "Bộ học",
    kind: (pkg.kind as ContentKind) || "COLLOCATION",
    status: (pkg.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT",
    accessTier: (pkg.accessTier as "FREE" | "PREMIUM") || "FREE",
    topicCount: topicCards.length,
    itemCount: topicCards.reduce((acc, c) => acc + c.exerciseCount, 0),
    publishedAt: pkg.publishedAt ? new Date(pkg.publishedAt) : null,
    createdAt: pkg.createdAt ? new Date(pkg.createdAt) : new Date(),
    topicCards,
  };
}

/**
 * 1-Click Fast-Track Publish whole package and all its member lessons!
 */
export async function fastTrackPublishPackage(actorUserId: string, packageId: string) {
  if (!ObjectId.isValid(packageId)) throw new Error("ID bộ học không hợp lệ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const pkgObjectId = new ObjectId(packageId);
  const actorObjectId = ObjectId.isValid(actorUserId) ? new ObjectId(actorUserId) : new ObjectId();
  const now = new Date();

  const pkg = await db.collection("content_collections").findOne({ _id: pkgObjectId });
  if (!pkg) throw new Error("Không tìm thấy bộ học.");

  const items = (pkg.items ?? []) as Array<{ lessonId: ObjectId; position: number }>;
  const lessonIds = items.map((i) => i.lessonId);

  // 1. Update package status
  await db.collection("content_collections").updateOne(
    { _id: pkgObjectId },
    {
      $set: {
        status: "PUBLISHED",
        publishedAt: now,
        updatedAt: now,
        lastEditedBy: actorObjectId,
      },
    },
  );

  if (lessonIds.length > 0) {
    // 2. Fetch latest versions for all member lessons
    const versions = await db
      .collection("lesson_versions")
      .find({ lessonId: { $in: lessonIds } })
      .toArray();

    const versionMap = new Map<string, any>();
    for (const v of versions) {
      const lId = v.lessonId.toString();
      const existing = versionMap.get(lId);
      if (!existing || v.versionNumber > existing.versionNumber) {
        versionMap.set(lId, v);
      }
    }

    const latestVersionIds = Array.from(versionMap.values()).map((v) => v._id);

    // Update lesson_versions to PUBLISHED
    await db.collection("lesson_versions").updateMany(
      { _id: { $in: latestVersionIds } },
      {
        $set: {
          status: "PUBLISHED",
          publishedBy: actorObjectId,
          publishedAt: now,
          updatedAt: now,
        },
      },
    );

    // Update lessons to PUBLISHED and link currentPublishedVersionId
    for (const v of versionMap.values()) {
      await db.collection("lessons").updateOne(
        { _id: v.lessonId },
        {
          $set: {
            currentPublishedVersionId: v._id,
            publicationStatus: "PUBLISHED",
            publishedAt: now,
            updatedAt: now,
          },
        },
      );
    }
  }

  revalidatePath("/lessons");
  revalidatePath(`/lessons/package/${packageId}`);
  return { success: true, count: lessonIds.length };
}

/**
 * 1-Click Fast-Track Unpublish whole package and all its member lessons back to DRAFT!
 */
export async function fastTrackUnpublishPackage(actorUserId: string, packageId: string) {
  if (!ObjectId.isValid(packageId)) throw new Error("ID bộ học không hợp lệ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const pkgObjectId = new ObjectId(packageId);
  const actorObjectId = ObjectId.isValid(actorUserId) ? new ObjectId(actorUserId) : new ObjectId();
  const now = new Date();

  const pkg = await db.collection("content_collections").findOne({ _id: pkgObjectId });
  if (!pkg) throw new Error("Không tìm thấy bộ học.");

  const items = (pkg.items ?? []) as Array<{ lessonId: ObjectId; position: number }>;
  const lessonIds = items.map((i) => i.lessonId);

  await db.collection("content_collections").updateOne(
    { _id: pkgObjectId },
    {
      $set: {
        status: "DRAFT",
        publishedAt: null,
        updatedAt: now,
        lastEditedBy: actorObjectId,
      },
    },
  );

  if (lessonIds.length > 0) {
    await db.collection("lesson_versions").updateMany(
      { lessonId: { $in: lessonIds } },
      {
        $set: {
          status: "DRAFT",
          publishedAt: null,
          updatedAt: now,
        },
      },
    );

    await db.collection("lessons").updateMany(
      { _id: { $in: lessonIds } },
      {
        $set: {
          currentPublishedVersionId: null,
          publicationStatus: "NEVER_PUBLISHED",
          publishedAt: null,
          updatedAt: now,
        },
      },
    );
  }

  revalidatePath("/lessons");
  revalidatePath(`/lessons/package/${packageId}`);
  return { success: true };
}

/**
 * Fast-track toggle a single lesson between DRAFT and PUBLISHED
 */
export async function fastTrackToggleLesson(actorUserId: string, lessonId: string) {
  if (!ObjectId.isValid(lessonId)) throw new Error("ID bài học không hợp lệ.");

  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);
  const lessonObjectId = new ObjectId(lessonId);
  const actorObjectId = ObjectId.isValid(actorUserId) ? new ObjectId(actorUserId) : new ObjectId();
  const now = new Date();

  const lesson = await db.collection("lessons").findOne({ _id: lessonObjectId });
  if (!lesson) throw new Error("Không tìm thấy bài học.");

  const isCurrentlyPublished = lesson.publicationStatus === "PUBLISHED";
  const nextStatus = isCurrentlyPublished ? "DRAFT" : "PUBLISHED";
  const nextLessonPubStatus = isCurrentlyPublished ? "NEVER_PUBLISHED" : "PUBLISHED";

  await db.collection("lesson_versions").updateMany(
    { lessonId: lessonObjectId },
    {
      $set: {
        status: nextStatus,
        publishedAt: isCurrentlyPublished ? null : now,
        publishedBy: isCurrentlyPublished ? null : actorObjectId,
        updatedAt: now,
      },
    },
  );

  await db.collection("lessons").updateOne(
    { _id: lessonObjectId },
    {
      $set: {
        publicationStatus: nextLessonPubStatus,
        publishedAt: isCurrentlyPublished ? null : now,
        updatedAt: now,
      },
    },
  );

  revalidatePath("/lessons");
  return { success: true, nextStatus };
}
