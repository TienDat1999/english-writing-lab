import { createHash } from "node:crypto";

import mongoose, { type ClientSession, Types } from "mongoose";

import { LearningItem } from "@/server/learning/learning-item.schema";

import { createLessonDraftSchema, type ExerciseDraftInput } from "./content.contract";
import { Exercise } from "./exercise.schema";
import { Lesson, LessonVersion } from "./lesson.schema";
import { ContentTopic } from "./taxonomy.schema";
import type {
  UploadedQuizMigrationGroup,
  UploadedQuizMigrationManifest,
} from "./uploaded-quiz-migration.contract";

type QuizType = "PARAPHRASE" | "SYNONYM";

type SourceItem = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sourceType: string;
  title: string;
  topicText?: string | null;
  quizType?: QuizType | null;
  promptText: string;
  answerText: string;
  hintVi?: string | null;
  contextText?: string | null;
  applicationPromptVi?: string | null;
  applicationReferenceEn?: string | null;
  fingerprint: string;
  lastReviewedAt?: Date | null;
};

type CandidateItem = {
  id: string;
  ownerUserId: string;
  quizType: QuizType;
  topicText: string;
  promptText: string;
  answerText: string;
  contextText: string;
  applicationPromptVi: string;
  applicationReferenceEn: string;
  fingerprint: string;
  completed: boolean;
  legacy: boolean;
};

type MigrationResult = {
  source: UploadedQuizMigrationGroup["source"];
  migrationKey: string;
  sourceItemCount: number;
  exerciseCount: number;
  warnings: string[];
  status: "READY" | "CREATED" | "ALREADY_MIGRATED" | "BLOCKED";
  lessonId: string | null;
  lessonVersionId: string | null;
};

function normalize(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

function normalizeKey(value: string) {
  return normalize(value).toLocaleLowerCase("en");
}

function legacyCandidate(item: SourceItem): CandidateItem | null {
  if (item.sourceType !== "PHRASE" || item.title !== "Imported Quick Quiz") {
    return null;
  }

  const paraphraseMatch = item.promptText.match(/^Paraphrase "(.+)": _____$/u);
  if (paraphraseMatch) {
    const hint = item.hintVi ?? "";
    const separatorIndex = hint.indexOf(" · ");
    const topicVi = separatorIndex >= 0 ? hint.slice(0, separatorIndex) : hint;
    const promptVi = separatorIndex >= 0 ? hint.slice(separatorIndex + 3) : hint;

    return {
      id: item._id.toString(),
      ownerUserId: item.userId.toString(),
      quizType: "PARAPHRASE",
      topicText: `${paraphraseMatch[1]} — ${topicVi}`,
      promptText: promptVi || topicVi,
      answerText: item.answerText,
      contextText: item.contextText ?? "",
      applicationPromptVi: item.applicationPromptVi ?? "",
      applicationReferenceEn: item.applicationReferenceEn ?? "",
      fingerprint: item.fingerprint,
      completed: Boolean(item.lastReviewedAt),
      legacy: true,
    };
  }

  if (/^Synonym of /u.test(item.promptText)) {
    return {
      id: item._id.toString(),
      ownerUserId: item.userId.toString(),
      quizType: "SYNONYM",
      topicText: "100 cặp Synonym",
      promptText: item.hintVi || item.promptText,
      answerText: item.answerText,
      contextText: item.contextText ?? "",
      applicationPromptVi: "",
      applicationReferenceEn: "",
      fingerprint: item.fingerprint,
      completed: Boolean(item.lastReviewedAt),
      legacy: true,
    };
  }

  return null;
}

function toCandidate(item: SourceItem): CandidateItem | null {
  if (item.sourceType === "UPLOADED_QUIZ" && item.quizType) {
    return {
      id: item._id.toString(),
      ownerUserId: item.userId.toString(),
      quizType: item.quizType,
      topicText: item.topicText || "Chưa phân loại",
      promptText: item.promptText,
      answerText: item.answerText,
      contextText: item.contextText ?? "",
      applicationPromptVi: item.applicationPromptVi ?? "",
      applicationReferenceEn: item.applicationReferenceEn ?? "",
      fingerprint: item.fingerprint,
      completed: Boolean(item.lastReviewedAt),
      legacy: false,
    };
  }

  return legacyCandidate(item);
}

function migrationKey(group: UploadedQuizMigrationGroup) {
  return createHash("sha256")
    .update([
      "uploaded-quiz-v1",
      group.source.ownerUserId,
      group.source.quizType,
      normalizeKey(group.source.topicText),
      group.lesson.slugs.map((slug) => `${slug.locale}:${slug.slug}`).sort().join("|"),
    ].join(":"))
    .digest("hex");
}

function candidateSourceHash(items: CandidateItem[]) {
  return createHash("sha256")
    .update(JSON.stringify(items
      .map((item) => ({
        fingerprint: item.fingerprint,
        quizType: item.quizType,
        topicText: normalize(item.topicText),
        promptText: normalize(item.promptText),
        answerText: normalize(item.answerText),
        contextText: normalize(item.contextText),
        applicationPromptVi: normalize(item.applicationPromptVi),
        applicationReferenceEn: normalize(item.applicationReferenceEn),
      }))
      .sort((left, right) => left.fingerprint.localeCompare(right.fingerprint))))
    .digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

function contentHash(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

function sourceExpression(item: CandidateItem) {
  const equalitySource = item.contextText.split(" = ")[0]?.trim();
  if (equalitySource && equalitySource !== item.contextText.trim()) return equalitySource;

  const synonymMatch = item.contextText.match(/^([^:=]+)\s*[:=]/u);
  return synonymMatch?.[1]?.trim() ?? "";
}

function answerRubric(overrides: Partial<ExerciseDraftInput["answerRubric"]>) {
  return {
    correctAnswer: null,
    acceptedAnswers: [],
    requiredExpression: null,
    grammarWeight: null,
    meaningWeight: null,
    minimumScore: null,
    aiRubricVersion: null,
    rules: null,
    ...overrides,
  };
}

function buildExercises(items: CandidateItem[]) {
  const exercises: ExerciseDraftInput[] = [];
  const warnings: string[] = [];
  const meanings = [...new Set(items.map((item) => normalize(item.promptText)))];

  if (meanings.length < 2) {
    return {
      exercises,
      warnings,
      blockers: ["A migrated topic requires at least two distinct meanings."],
    };
  }

  for (const [itemIndex, item] of items.entries()) {
    const meaning = normalize(item.promptText);
    const choices = [
      meaning,
      ...meanings.filter((candidate) => candidate !== meaning).slice(0, 3),
    ];
    const meaningPosition = exercises.length;
    exercises.push({
      position: meaningPosition,
      exerciseType: "MEANING_CHOICE",
      evaluationMode: "EXACT",
      localizations: [
        {
          locale: "vi",
          instruction: "Chọn nghĩa tiếng Việt đúng.",
          promptText: `Cụm “${item.answerText}” có nghĩa là gì?`,
          hintText: "",
          explanationText: "",
        },
        {
          locale: "en",
          instruction: "Choose the correct Vietnamese meaning.",
          promptText: `What does “${item.answerText}” mean?`,
          hintText: "",
          explanationText: "",
        },
      ],
      targetContent: item.answerText,
      contextText: item.contextText,
      choices,
      answerRubric: answerRubric({ correctAnswer: meaning }),
      mediaAssetIds: [],
      estimatedSeconds: 20,
      isOptional: false,
      isPreview: itemIndex === 0,
    });

    const prompt = item.quizType === "SYNONYM" && sourceExpression(item)
      ? `Viết từ hoặc cụm từ đồng nghĩa với “${sourceExpression(item)}”.`
      : meaning;
    exercises.push({
      position: exercises.length,
      exerciseType: item.quizType === "SYNONYM" ? "TYPE_ANSWER" : "TRANSLATE_TO_ENGLISH",
      evaluationMode: "NORMALIZED",
      localizations: [
        {
          locale: "vi",
          instruction: "Nhập câu trả lời bằng tiếng Anh.",
          promptText: prompt,
          hintText: "",
          explanationText: "",
        },
        {
          locale: "en",
          instruction: "Type the answer in English.",
          promptText: prompt,
          hintText: "",
          explanationText: "",
        },
      ],
      targetContent: item.answerText,
      contextText: item.contextText,
      choices: [],
      answerRubric: answerRubric({
        correctAnswer: item.answerText,
        acceptedAnswers: [item.answerText],
      }),
      mediaAssetIds: [],
      estimatedSeconds: 30,
      isOptional: false,
      isPreview: false,
    });

    if (item.quizType === "PARAPHRASE") {
      if (item.applicationPromptVi && item.applicationReferenceEn) {
        exercises.push({
          position: exercises.length,
          exerciseType: "BUILD_SENTENCE",
          evaluationMode: "HYBRID",
          localizations: [
            {
              locale: "vi",
              instruction: `Viết câu tiếng Anh và dùng “${item.answerText}”.`,
              promptText: item.applicationPromptVi,
              hintText: "",
              explanationText: "",
            },
            {
              locale: "en",
              instruction: `Write an English sentence using “${item.answerText}”.`,
              promptText: item.applicationPromptVi,
              hintText: "",
              explanationText: "",
            },
          ],
          targetContent: item.answerText,
          contextText: item.applicationReferenceEn,
          choices: [],
          answerRubric: answerRubric({
            correctAnswer: item.applicationReferenceEn,
            acceptedAnswers: [item.applicationReferenceEn],
            requiredExpression: item.answerText,
            grammarWeight: 0.4,
            meaningWeight: 0.6,
            minimumScore: 70,
            aiRubricVersion: "translation-application-v1",
          }),
          mediaAssetIds: [],
          estimatedSeconds: 90,
          isOptional: false,
          isPreview: false,
        });
      } else {
        warnings.push(
          `Source item ${item.id} needs an application prompt before the draft can follow the full three-step Paraphrase flow.`,
        );
      }
    }
  }

  return { exercises, warnings, blockers: [] };
}

function validateGeneratedLesson(
  group: UploadedQuizMigrationGroup,
  exercises: ExerciseDraftInput[],
) {
  const issues: string[] = [];
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const slugLocales = group.lesson.slugs.map((slug) => slug.locale);
  const contentLocales = group.lesson.localizations.map((localization) => localization.locale);

  if (new Set(slugLocales).size !== slugLocales.length) {
    issues.push("Lesson slugs must use unique locales.");
  }
  if (new Set(contentLocales).size !== contentLocales.length) {
    issues.push("Lesson localizations must use unique locales.");
  }
  if (!slugLocales.includes(group.lesson.defaultLocale)) {
    issues.push("Default locale requires a matching slug.");
  }
  if (!contentLocales.includes(group.lesson.defaultLocale)) {
    issues.push("Default locale requires lesson content.");
  }
  if (
    levels.indexOf(group.lesson.cefrLevelMin)
    > levels.indexOf(group.lesson.cefrLevelMax)
  ) {
    issues.push("CEFR minimum level cannot be higher than maximum level.");
  }
  if (
    group.lesson.audiences.some((audience) => audience.startsWith("IELTS_"))
    && !group.lesson.ieltsMetadata
  ) {
    issues.push("IELTS lessons require IELTS metadata.");
  }
  if (group.lesson.secondaryTopicIds.includes(group.lesson.primaryTopicId)) {
    issues.push("Primary topic cannot also be a secondary topic.");
  }
  if (new Set(group.lesson.secondaryTopicIds).size !== group.lesson.secondaryTopicIds.length) {
    issues.push("Secondary topics must be unique.");
  }
  if (
    group.lesson.prerequisiteLessonIds.some(
      (id) => group.lesson.relatedLessonIds.includes(id),
    )
  ) {
    issues.push("A lesson cannot be both prerequisite and related.");
  }
  if (exercises.length === 0) {
    issues.push("Generated lesson requires at least one exercise.");
  }

  return issues;
}

async function loadSourceItems(group: UploadedQuizMigrationGroup) {
  const cursor = LearningItem.find({
    userId: new Types.ObjectId(group.source.ownerUserId),
    deletedAt: null,
    $or: [
      { sourceType: "UPLOADED_QUIZ", quizType: group.source.quizType },
      { sourceType: "PHRASE", title: "Imported Quick Quiz" },
    ],
  }).lean<SourceItem>().cursor();
  const items: CandidateItem[] = [];

  for await (const source of cursor) {
    const candidate = toCandidate(source);
    if (
      candidate
      && candidate.quizType === group.source.quizType
      && normalizeKey(candidate.topicText) === normalizeKey(group.source.topicText)
    ) {
      items.push(candidate);
    }
  }

  return items.sort((left, right) => left.fingerprint.localeCompare(right.fingerprint));
}

async function validateReferences(
  group: UploadedQuizMigrationGroup,
  session?: ClientSession,
) {
  const topicIds = [...new Set([
    group.lesson.primaryTopicId,
    ...group.lesson.secondaryTopicIds,
  ])].map((id) => new Types.ObjectId(id));
  let topicQuery = ContentTopic.countDocuments({ _id: { $in: topicIds }, status: "ACTIVE" });
  if (session) topicQuery = topicQuery.session(session);
  if (await topicQuery !== topicIds.length) {
    return ["One or more target topics are missing or disabled."];
  }

  const lessonIds = [...new Set([
    ...group.lesson.prerequisiteLessonIds,
    ...group.lesson.relatedLessonIds,
  ])].map((id) => new Types.ObjectId(id));
  if (lessonIds.length === 0) return [];

  let lessonQuery = Lesson.countDocuments({
    _id: { $in: lessonIds },
    publicationStatus: { $ne: "WITHDRAWN" },
  });
  if (session) lessonQuery = lessonQuery.session(session);
  return await lessonQuery === lessonIds.length
    ? []
    : ["One or more linked lessons are unavailable."];
}

function versionFields(group: UploadedQuizMigrationGroup) {
  return {
    primarySkill: "VOCABULARY" as const,
    lessonType: group.source.quizType,
    learningLanguage: group.lesson.learningLanguage,
    localizations: group.lesson.localizations,
    cefrLevelMin: group.lesson.cefrLevelMin,
    cefrLevelMax: group.lesson.cefrLevelMax,
    audiences: group.lesson.audiences,
    ieltsMetadata: group.lesson.ieltsMetadata,
    primaryTopicId: new Types.ObjectId(group.lesson.primaryTopicId),
    secondaryTopicIds: group.lesson.secondaryTopicIds.map((id) => new Types.ObjectId(id)),
    tagCodes: group.lesson.tagCodes,
    estimatedMinutes: group.lesson.estimatedMinutes,
    visibility: group.lesson.visibility,
    accessTier: group.lesson.accessTier,
    coverAssetId: group.lesson.coverAssetId
      ? new Types.ObjectId(group.lesson.coverAssetId)
      : null,
    prerequisiteLessonIds: group.lesson.prerequisiteLessonIds.map(
      (id) => new Types.ObjectId(id),
    ),
    relatedLessonIds: group.lesson.relatedLessonIds.map((id) => new Types.ObjectId(id)),
  };
}

async function createDraft(
  manifest: UploadedQuizMigrationManifest,
  group: UploadedQuizMigrationGroup,
  key: string,
  items: CandidateItem[],
  exercises: ExerciseDraftInput[],
) {
  const session = await mongoose.startSession();

  try {
    const ids = await session.withTransaction(async () => {
      const existing = await Lesson.findOne({ "origin.migrationKey": key }).session(session);
      if (existing) {
        return {
          lessonId: existing._id.toString(),
          lessonVersionId: "",
        };
      }

      const referenceIssues = await validateReferences(group, session);
      if (referenceIssues.length > 0) throw new Error(referenceIssues.join(" "));

      const actorId = new Types.ObjectId(manifest.actorUserId);
      const lesson = new Lesson({
        defaultLocale: group.lesson.defaultLocale,
        slugs: group.lesson.slugs,
        latestVersionNumber: 1,
        createdBy: actorId,
        origin: {
          type: "MIGRATED_UPLOADED_QUIZ",
          migrationKey: key,
          sourceItemCount: items.length,
          migratedAt: new Date(),
        },
      });
      await lesson.save({ session });

      const content = {
        ...versionFields(group),
        exercises,
      };
      const version = new LessonVersion({
        lessonId: lesson._id,
        versionNumber: 1,
        status: "DRAFT",
        revision: 1,
        contentHash: contentHash(content),
        ...versionFields(group),
        createdBy: actorId,
        lastEditedBy: actorId,
      });
      await version.save({ session });
      await Exercise.insertMany(exercises.map((exercise) => ({
        ...exercise,
        lessonVersionId: version._id,
        mediaAssetIds: exercise.mediaAssetIds.map((id) => new Types.ObjectId(id)),
        createdBy: actorId,
        lastEditedBy: actorId,
      })), { session });
      return {
        lessonId: lesson._id.toString(),
        lessonVersionId: version._id.toString(),
      };
    });

    if (!ids) throw new Error("Migration transaction completed without a result.");
    return ids;
  } finally {
    await session.endSession();
  }
}

export async function discoverUploadedQuizGroups() {
  const groups = new Map<string, {
    ownerUserId: string;
    quizType: QuizType;
    topicText: string;
    itemCount: number;
    completedCount: number;
    legacyItemCount: number;
    missingApplicationPromptCount: number;
    sourceEntries: CandidateItem[];
  }>();
  const cursor = LearningItem.find({
    deletedAt: null,
    $or: [
      { sourceType: "UPLOADED_QUIZ", quizType: { $in: ["PARAPHRASE", "SYNONYM"] } },
      { sourceType: "PHRASE", title: "Imported Quick Quiz" },
    ],
  }).lean<SourceItem>().cursor();

  for await (const source of cursor) {
    const candidate = toCandidate(source);
    if (!candidate) continue;
    const key = [
      candidate.ownerUserId,
      candidate.quizType,
      normalizeKey(candidate.topicText),
    ].join(":");
    const group = groups.get(key) ?? {
      ownerUserId: candidate.ownerUserId,
      quizType: candidate.quizType,
      topicText: candidate.topicText,
      itemCount: 0,
      completedCount: 0,
      legacyItemCount: 0,
      missingApplicationPromptCount: 0,
      sourceEntries: [],
    };
    group.itemCount += 1;
    group.completedCount += Number(candidate.completed);
    group.legacyItemCount += Number(candidate.legacy);
    group.missingApplicationPromptCount += Number(
      candidate.quizType === "PARAPHRASE"
      && (!candidate.applicationPromptVi || !candidate.applicationReferenceEn),
    );
    group.sourceEntries.push(candidate);
    groups.set(key, group);
  }

  return [...groups.values()].map(({ sourceEntries, ...group }) => ({
    ...group,
    sourceHash: candidateSourceHash(sourceEntries),
  })).sort((left, right) => (
    left.ownerUserId.localeCompare(right.ownerUserId)
    || left.quizType.localeCompare(right.quizType)
    || left.topicText.localeCompare(right.topicText)
  ));
}

export async function migrateUploadedQuizGroups(
  manifest: UploadedQuizMigrationManifest,
  options: { dryRun: boolean },
) {
  const results: MigrationResult[] = [];
  const actorExists = await mongoose.connection.collection("users").findOne(
    { _id: new Types.ObjectId(manifest.actorUserId) },
    { projection: { _id: 1 } },
  );

  for (const group of manifest.groups) {
    const key = migrationKey(group);
    const existing = await Lesson.findOne({ "origin.migrationKey": key })
      .select({ _id: 1 })
      .lean<{ _id: Types.ObjectId }>();
    if (existing) {
      results.push({
        source: group.source,
        migrationKey: key,
        sourceItemCount: 0,
        exerciseCount: 0,
        warnings: [],
        status: "ALREADY_MIGRATED",
        lessonId: existing._id.toString(),
        lessonVersionId: null,
      });
      continue;
    }

    const items = await loadSourceItems(group);
    const { exercises, warnings, blockers } = buildExercises(items);
    const referenceIssues = await validateReferences(group);
    const slugConflict = await Lesson.exists({
      $or: group.lesson.slugs.map((slug) => ({
        slugs: { $elemMatch: { locale: slug.locale, slug: slug.slug } },
      })),
    });
    const issues = [
      ...(!actorExists ? ["Migration actor does not exist."] : []),
      ...(items.length === 0 ? ["No personal uploaded quiz items match this selector."] : []),
      ...(items.length > 0 && candidateSourceHash(items) !== group.source.expectedSourceHash
        ? ["Source quiz changed after approval; refresh the report and approve the new source hash."]
        : []),
      ...blockers,
      ...referenceIssues,
      ...validateGeneratedLesson(group, exercises),
      ...(slugConflict ? ["One or more target lesson slugs are already in use."] : []),
    ];

    try {
      createLessonDraftSchema.parse({
        ...group.lesson,
        primarySkill: "VOCABULARY",
        lessonType: group.source.quizType,
        exercises,
      });
    } catch (error) {
      issues.push(error instanceof Error ? error.message : "Generated lesson is invalid.");
    }

    if (issues.length > 0) {
      results.push({
        source: group.source,
        migrationKey: key,
        sourceItemCount: items.length,
        exerciseCount: exercises.length,
        warnings: [...warnings, ...issues],
        status: "BLOCKED",
        lessonId: null,
        lessonVersionId: null,
      });
      continue;
    }

    if (options.dryRun) {
      results.push({
        source: group.source,
        migrationKey: key,
        sourceItemCount: items.length,
        exerciseCount: exercises.length,
        warnings,
        status: "READY",
        lessonId: null,
        lessonVersionId: null,
      });
      continue;
    }

    const ids = await createDraft(manifest, group, key, items, exercises);
    results.push({
      source: group.source,
      migrationKey: key,
      sourceItemCount: items.length,
      exerciseCount: exercises.length,
      warnings,
      status: ids.lessonVersionId ? "CREATED" : "ALREADY_MIGRATED",
      lessonId: ids.lessonId,
      lessonVersionId: ids.lessonVersionId || null,
    });
  }

  return {
    dryRun: options.dryRun,
    sourceItemsMutated: 0,
    summary: {
      total: results.length,
      ready: results.filter((result) => result.status === "READY").length,
      created: results.filter((result) => result.status === "CREATED").length,
      alreadyMigrated: results.filter((result) => result.status === "ALREADY_MIGRATED").length,
      blocked: results.filter((result) => result.status === "BLOCKED").length,
    },
    results,
  };
}
