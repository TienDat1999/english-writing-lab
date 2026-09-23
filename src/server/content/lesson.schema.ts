import { Schema, model, models, type InferSchemaType } from "mongoose";

import {
  cefrLevels,
  contentAccessTiers,
  contentAudiences,
  contentLocales,
  contentVisibilities,
  ieltsModules,
  ieltsSkillAreas,
  lessonPublicationStatuses,
  lessonTypes,
  lessonVersionStatuses,
  primarySkills,
} from "./content.constants";

const lessonSlugSchema = new Schema(
  {
    locale: { type: String, enum: contentLocales, required: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false },
);

const lessonLocalizationSchema = new Schema(
  {
    locale: { type: String, enum: contentLocales, required: true },
    title: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    learningObjectives: { type: [String], required: true },
    contentBlocks: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false },
);

const ieltsMetadataSchema = new Schema(
  {
    bandMin: { type: Number, min: 0, max: 9, default: null },
    bandMax: { type: Number, min: 0, max: 9, default: null },
    module: { type: String, enum: ieltsModules, default: null },
    skillArea: { type: String, enum: ieltsSkillAreas, default: null },
  },
  { _id: false },
);

const approvalSchema = new Schema(
  {
    reviewerId: { type: Schema.Types.ObjectId, required: true },
    contentHash: { type: String, required: true },
    summary: { type: String, default: "", trim: true },
    overrideReason: { type: String, default: null, trim: true },
    approvedAt: { type: Date, required: true },
  },
  { _id: false },
);

const lessonOriginSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["MIGRATED_UPLOADED_QUIZ"],
      required: true,
    },
    migrationKey: { type: String, required: true },
    sourceItemCount: { type: Number, min: 1, required: true },
    migratedAt: { type: Date, required: true },
  },
  { _id: false },
);

const lessonSchema = new Schema(
  {
    defaultLocale: { type: String, enum: contentLocales, default: "en" },
    slugs: {
      type: [lessonSlugSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "Lesson requires at least one localized slug.",
      },
    },
    publicationStatus: {
      type: String,
      enum: lessonPublicationStatuses,
      default: "NEVER_PUBLISHED",
      required: true,
    },
    currentPublishedVersionId: {
      type: Schema.Types.ObjectId,
      ref: "LessonVersion",
      default: null,
    },
    latestVersionNumber: { type: Number, min: 0, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, required: true, index: true },
    origin: { type: lessonOriginSchema, default: null },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "lessons" },
);

lessonSchema.index(
  { "slugs.locale": 1, "slugs.slug": 1 },
  { unique: true, name: "unique_lesson_slug_per_locale" },
);
lessonSchema.index({ publicationStatus: 1, publishedAt: -1 });
lessonSchema.index({ currentPublishedVersionId: 1 });
lessonSchema.index(
  { "origin.migrationKey": 1 },
  {
    unique: true,
    partialFilterExpression: { "origin.migrationKey": { $type: "string" } },
    name: "unique_content_migration_key",
  },
);

const lessonVersionSchema = new Schema(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    versionNumber: { type: Number, min: 1, required: true },
    status: {
      type: String,
      enum: lessonVersionStatuses,
      default: "DRAFT",
      required: true,
    },
    revision: { type: Number, min: 1, default: 1 },
    isActiveWorkflow: { type: Boolean, default: true, required: true },
    contentHash: { type: String, required: true },
    primarySkill: { type: String, enum: primarySkills, required: true },
    lessonType: { type: String, enum: lessonTypes, required: true },
    learningLanguage: { type: String, default: "en", required: true },
    localizations: {
      type: [lessonLocalizationSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "Lesson version requires at least one localization.",
      },
    },
    cefrLevelMin: { type: String, enum: cefrLevels, required: true },
    cefrLevelMax: { type: String, enum: cefrLevels, required: true },
    audiences: { type: [String], enum: contentAudiences, required: true },
    ieltsMetadata: { type: ieltsMetadataSchema, default: null },
    primaryTopicId: {
      type: Schema.Types.ObjectId,
      ref: "ContentTopic",
      required: true,
      index: true,
    },
    secondaryTopicIds: [{ type: Schema.Types.ObjectId, ref: "ContentTopic" }],
    tagCodes: { type: [String], default: [] },
    estimatedMinutes: { type: Number, min: 1, max: 600, required: true },
    visibility: { type: String, enum: contentVisibilities, required: true },
    accessTier: { type: String, enum: contentAccessTiers, required: true },
    coverAssetId: { type: Schema.Types.ObjectId, default: null },
    prerequisiteLessonIds: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    relatedLessonIds: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    createdBy: { type: Schema.Types.ObjectId, required: true },
    lastEditedBy: { type: Schema.Types.ObjectId, required: true },
    submittedBy: { type: Schema.Types.ObjectId, default: null },
    submittedAt: { type: Date, default: null },
    approval: { type: approvalSchema, default: null },
    scheduledBy: { type: Schema.Types.ObjectId, default: null },
    scheduledAt: { type: Date, default: null },
    scheduledTimezone: { type: String, default: null },
    scheduledOverrideReason: { type: String, default: null, trim: true },
    publishedBy: { type: Schema.Types.ObjectId, default: null },
    publishedAt: { type: Date, default: null },
    publishedOverrideReason: { type: String, default: null, trim: true },
    supersededAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "lesson_versions" },
);

lessonVersionSchema.index({ lessonId: 1, versionNumber: 1 }, { unique: true });
lessonVersionSchema.index(
  { lessonId: 1, isActiveWorkflow: 1 },
  {
    unique: true,
    partialFilterExpression: { isActiveWorkflow: true },
    name: "one_active_workflow_per_lesson",
  },
);
lessonVersionSchema.index({ lessonId: 1, status: 1, updatedAt: -1 });
lessonVersionSchema.index({ status: 1, scheduledAt: 1 });
lessonVersionSchema.index({ primarySkill: 1, lessonType: 1, status: 1 });
lessonVersionSchema.index({ primaryTopicId: 1, status: 1 });
lessonVersionSchema.index({ audiences: 1, status: 1 });
lessonVersionSchema.index(
  {
    "localizations.title": "text",
    "localizations.shortDescription": "text",
    tagCodes: "text",
  },
  {
    name: "public_lesson_search",
    weights: {
      "localizations.title": 10,
      tagCodes: 5,
      "localizations.shortDescription": 2,
    },
  },
);

export type LessonDocument = InferSchemaType<typeof lessonSchema>;
export type LessonVersionDocument = InferSchemaType<typeof lessonVersionSchema>;

export const Lesson = models.Lesson ?? model("Lesson", lessonSchema);
export const LessonVersion =
  models.LessonVersion ?? model("LessonVersion", lessonVersionSchema);
