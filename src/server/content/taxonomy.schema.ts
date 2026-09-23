import { Schema, model, models, type InferSchemaType } from "mongoose";

import { contentLocales, taxonomyStatuses } from "./content.constants";

const taxonomyLocalizationSchema = new Schema(
  {
    locale: { type: String, enum: contentLocales, required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const categorySchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    localizations: {
      type: [taxonomyLocalizationSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "Category requires at least one localization.",
      },
    },
    status: { type: String, enum: taxonomyStatuses, default: "ACTIVE" },
    sortOrder: { type: Number, min: 0, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    disabledAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "content_categories" },
);

categorySchema.index({ status: 1, sortOrder: 1 });
categorySchema.index({ "localizations.locale": 1, "localizations.slug": 1 });

const topicSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ContentCategory",
      required: true,
      index: true,
    },
    code: { type: String, required: true, trim: true, uppercase: true },
    localizations: {
      type: [taxonomyLocalizationSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "Topic requires at least one localization.",
      },
    },
    aliases: { type: [String], default: [] },
    status: { type: String, enum: taxonomyStatuses, default: "ACTIVE" },
    sortOrder: { type: Number, min: 0, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    disabledAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "content_topics" },
);

topicSchema.index({ categoryId: 1, code: 1 }, { unique: true });
topicSchema.index({ categoryId: 1, status: 1, sortOrder: 1 });
topicSchema.index({ "localizations.locale": 1, "localizations.slug": 1 });

export type ContentCategoryDocument = InferSchemaType<typeof categorySchema>;
export type ContentTopicDocument = InferSchemaType<typeof topicSchema>;

export const ContentCategory =
  models.ContentCategory ?? model("ContentCategory", categorySchema);
export const ContentTopic = models.ContentTopic ?? model("ContentTopic", topicSchema);
