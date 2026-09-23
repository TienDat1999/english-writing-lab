import { Schema, model, models, type InferSchemaType } from "mongoose";

import {
  collectionStatuses,
  contentAccessTiers,
  contentLocales,
  contentVisibilities,
} from "./content.constants";

const collectionSlugSchema = new Schema(
  {
    locale: { type: String, enum: contentLocales, required: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false },
);

const collectionLocalizationSchema = new Schema(
  {
    locale: { type: String, enum: contentLocales, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const collectionItemSchema = new Schema(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
    position: { type: Number, min: 0, required: true },
  },
  { _id: false },
);

const contentCollectionSchema = new Schema(
  {
    slugs: {
      type: [collectionSlugSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "Collection requires at least one localized slug.",
      },
    },
    localizations: {
      type: [collectionLocalizationSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "Collection requires at least one localization.",
      },
    },
    status: { type: String, enum: collectionStatuses, default: "DRAFT" },
    visibility: { type: String, enum: contentVisibilities, default: "PUBLIC" },
    accessTier: { type: String, enum: contentAccessTiers, default: "FREE" },
    items: { type: [collectionItemSchema], default: [] },
    coverAssetId: { type: Schema.Types.ObjectId, default: null },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    lastEditedBy: { type: Schema.Types.ObjectId, required: true },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "content_collections" },
);

contentCollectionSchema.index(
  { "slugs.locale": 1, "slugs.slug": 1 },
  { unique: true, name: "unique_collection_slug_per_locale" },
);
contentCollectionSchema.index({ status: 1, publishedAt: -1 });
contentCollectionSchema.index({ "items.lessonId": 1 });

export type ContentCollectionDocument = InferSchemaType<
  typeof contentCollectionSchema
>;

export const ContentCollection =
  models.ContentCollection ?? model("ContentCollection", contentCollectionSchema);
