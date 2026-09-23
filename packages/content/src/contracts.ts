import { z } from "zod";

import {
  cefrLevels,
  contentAccessTiers,
  contentAudiences,
  contentLocales,
  contentVisibilities,
  evaluationModes,
  exerciseTypes,
  ieltsModules,
  ieltsSkillAreas,
  lessonTypes,
  primarySkills,
  reviewCommentSeverities,
} from "./constants";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/iu, "Invalid object ID");

const localizedSlugSchema = z.object({
  locale: z.enum(contentLocales),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
});

const lessonLocalizationSchema = z.object({
  locale: z.enum(contentLocales),
  title: z.string().trim().min(1).max(200),
  shortDescription: z.string().trim().max(500).default(""),
  learningObjectives: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  contentBlocks: z.array(z.unknown()).max(100).default([]),
});

const exerciseLocalizationSchema = z.object({
  locale: z.enum(contentLocales),
  instruction: z.string().trim().max(500).default(""),
  promptText: z.string().trim().min(1).max(2_000),
  hintText: z.string().trim().max(1_000).default(""),
  explanationText: z.string().trim().max(4_000).default(""),
});

const answerRubricSchema = z.object({
  correctAnswer: z.string().trim().min(1).max(2_000).nullable().default(null),
  acceptedAnswers: z.array(z.string().trim().min(1).max(2_000)).max(50).default([]),
  requiredExpression: z.string().trim().min(1).max(500).nullable().default(null),
  grammarWeight: z.number().min(0).max(1).nullable().default(null),
  meaningWeight: z.number().min(0).max(1).nullable().default(null),
  minimumScore: z.number().min(0).max(100).nullable().default(null),
  aiRubricVersion: z.string().trim().min(1).max(100).nullable().default(null),
  rules: z.unknown().nullable().default(null),
});

const defaultAnswerRubric = {
  correctAnswer: null,
  acceptedAnswers: [],
  requiredExpression: null,
  grammarWeight: null,
  meaningWeight: null,
  minimumScore: null,
  aiRubricVersion: null,
  rules: null,
};

export const exerciseDraftSchema = z.object({
  position: z.number().int().min(0),
  exerciseType: z.enum(exerciseTypes),
  evaluationMode: z.enum(evaluationModes),
  localizations: z.array(exerciseLocalizationSchema).min(1).max(contentLocales.length),
  targetContent: z.string().trim().max(4_000).default(""),
  contextText: z.string().trim().max(4_000).default(""),
  choices: z.array(z.string().trim().min(1).max(1_000)).max(20).default([]),
  answerRubric: answerRubricSchema.default(defaultAnswerRubric),
  mediaAssetIds: z.array(objectIdSchema).max(20).default([]),
  estimatedSeconds: z.number().int().min(1).max(3_600).nullable().default(null),
  isOptional: z.boolean().default(false),
  isPreview: z.boolean().default(false),
});

const ieltsMetadataSchema = z.object({
  bandMin: z.number().min(0).max(9).multipleOf(0.5).nullable().default(null),
  bandMax: z.number().min(0).max(9).multipleOf(0.5).nullable().default(null),
  module: z.enum(ieltsModules).nullable().default(null),
  skillArea: z.enum(ieltsSkillAreas).nullable().default(null),
});

export const lessonVersionContentSchema = z.object({
  primarySkill: z.enum(primarySkills),
  lessonType: z.enum(lessonTypes),
  learningLanguage: z.string().trim().min(2).max(16).default("en"),
  localizations: z.array(lessonLocalizationSchema).min(1).max(contentLocales.length),
  cefrLevelMin: z.enum(cefrLevels),
  cefrLevelMax: z.enum(cefrLevels),
  audiences: z.array(z.enum(contentAudiences)).min(1),
  ieltsMetadata: ieltsMetadataSchema.nullable().default(null),
  primaryTopicId: objectIdSchema,
  secondaryTopicIds: z.array(objectIdSchema).max(20).default([]),
  tagCodes: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  estimatedMinutes: z.number().int().min(1).max(600),
  visibility: z.enum(contentVisibilities),
  accessTier: z.enum(contentAccessTiers),
  coverAssetId: objectIdSchema.nullable().default(null),
  prerequisiteLessonIds: z.array(objectIdSchema).max(20).default([]),
  relatedLessonIds: z.array(objectIdSchema).max(30).default([]),
  exercises: z.array(exerciseDraftSchema).max(500).default([]),
});

export const createLessonDraftSchema = lessonVersionContentSchema.extend({
  defaultLocale: z.enum(contentLocales).default("en"),
  slugs: z.array(localizedSlugSchema).min(1).max(contentLocales.length),
});

export const updateLessonDraftSchema = lessonVersionContentSchema.extend({
  expectedRevision: z.number().int().min(1),
});

export const requestChangesSchema = z.object({
  severity: z.enum(reviewCommentSeverities).default("BLOCKING"),
  message: z.string().trim().min(2).max(4_000),
});

export const approveVersionSchema = z.object({
  summary: z.string().trim().max(2_000).default(""),
  overrideReason: z.string().trim().min(3).max(2_000).nullable().default(null),
});

const timezoneSchema = z.string().trim().min(1).max(100).refine((timezone) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}, "Invalid IANA timezone");

export const scheduleVersionSchema = z.object({
  scheduledAt: z.coerce.date(),
  timezone: timezoneSchema,
  overrideReason: z.string().trim().min(3).max(2_000).nullable().default(null),
});

export const publishVersionSchema = z.object({
  overrideReason: z.string().trim().min(3).max(2_000).nullable().default(null),
});

export const lifecycleReasonSchema = z.object({
  reason: z.string().trim().min(3).max(2_000),
});

const taxonomyLocalizationSchema = z.object({
  locale: z.enum(contentLocales),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
  description: z.string().trim().max(500).default(""),
});

export const createCategorySchema = z.object({
  code: z.string().trim().min(2).max(80).regex(/^[A-Z0-9_]+$/u),
  localizations: z.array(taxonomyLocalizationSchema).length(contentLocales.length),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export const updateCategorySchema = createCategorySchema.omit({ code: true });

export const createTopicSchema = z.object({
  categoryId: objectIdSchema,
  code: z.string().trim().min(2).max(80).regex(/^[A-Z0-9_]+$/u),
  localizations: z.array(taxonomyLocalizationSchema).length(contentLocales.length),
  aliases: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export const updateTopicSchema = createTopicSchema.omit({ code: true });

export const taxonomyStatusChangeSchema = z.object({
  reason: z.string().trim().min(3).max(2_000),
  status: z.enum(["ACTIVE", "DISABLED"]),
});

export type CreateLessonDraftInput = z.infer<typeof createLessonDraftSchema>;
export type UpdateLessonDraftInput = z.infer<typeof updateLessonDraftSchema>;
export type ExerciseDraftInput = z.infer<typeof exerciseDraftSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
