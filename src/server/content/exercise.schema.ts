import { Schema, model, models, type InferSchemaType } from "mongoose";

import {
  contentLocales,
  evaluationModes,
  exerciseTypes,
} from "./content.constants";

const exerciseLocalizationSchema = new Schema(
  {
    locale: { type: String, enum: contentLocales, required: true },
    instruction: { type: String, default: "", trim: true },
    promptText: { type: String, required: true, trim: true },
    hintText: { type: String, default: "", trim: true },
    explanationText: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const answerRubricSchema = new Schema(
  {
    correctAnswer: { type: String, default: null },
    acceptedAnswers: { type: [String], default: [] },
    requiredExpression: { type: String, default: null },
    grammarWeight: { type: Number, min: 0, max: 1, default: null },
    meaningWeight: { type: Number, min: 0, max: 1, default: null },
    minimumScore: { type: Number, min: 0, max: 100, default: null },
    aiRubricVersion: { type: String, default: null },
    rules: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const exerciseSchema = new Schema(
  {
    lessonVersionId: {
      type: Schema.Types.ObjectId,
      ref: "LessonVersion",
      required: true,
      index: true,
    },
    position: { type: Number, min: 0, required: true },
    exerciseType: { type: String, enum: exerciseTypes, required: true },
    evaluationMode: { type: String, enum: evaluationModes, required: true },
    localizations: {
      type: [exerciseLocalizationSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "Exercise requires at least one localization.",
      },
    },
    targetContent: { type: String, default: "", trim: true },
    contextText: { type: String, default: "", trim: true },
    choices: { type: [String], default: [] },
    answerRubric: { type: answerRubricSchema, default: () => ({}) },
    mediaAssetIds: [{ type: Schema.Types.ObjectId }],
    estimatedSeconds: { type: Number, min: 1, max: 3600, default: null },
    isOptional: { type: Boolean, default: false },
    isPreview: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    lastEditedBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true, collection: "exercises" },
);

exerciseSchema.index({ lessonVersionId: 1, position: 1 }, { unique: true });
exerciseSchema.index({ lessonVersionId: 1, exerciseType: 1 });
exerciseSchema.index({ lessonVersionId: 1, isPreview: 1, position: 1 });
exerciseSchema.index({ evaluationMode: 1, updatedAt: -1 });

export type ExerciseDocument = InferSchemaType<typeof exerciseSchema>;

export const Exercise = models.Exercise ?? model("Exercise", exerciseSchema);
