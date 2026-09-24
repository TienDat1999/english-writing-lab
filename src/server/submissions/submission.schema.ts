import { Schema, model, models, type InferSchemaType } from "mongoose";

export const taskTypes = ["TASK_1", "TASK_2"] as const;
export const submissionStatuses = [
  "DRAFT",
  "QUEUED",
  "ANALYZING",
  "COMPLETED",
  "FAILED",
] as const;

export type SubmissionStatus = (typeof submissionStatuses)[number];

const issueSchema = new Schema(
  {
    scope: {
      type: String,
      enum: ["ESSAY", "PARAGRAPH", "SENTENCE", "SPAN"],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "TASK_RESPONSE",
        "COHERENCE",
        "LEXICAL",
        "GRAMMAR",
        "SPELLING",
        "PUNCTUATION",
      ],
      required: true,
    },
    subcategory: { type: String, required: true },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
    },
    impactScore: { type: Number, min: 0, max: 100, required: true },
    sourceStart: { type: Number, min: 0, required: true },
    sourceEnd: { type: Number, min: 0, required: true },
    sourceQuote: { type: String, required: true },
    explanationVi: { type: String, required: true },
    correctionText: { type: String, required: true },
    upgradeText: { type: String, default: null },
    confidence: { type: Number, min: 0, max: 1, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "DISMISSED", "ACCEPTED"],
      default: "ACTIVE",
    },
    recurringPatternId: { type: Schema.Types.ObjectId, default: null },
  },
  { _id: true },
);

const criteriaFeedbackSchema = new Schema(
  {
    taskResponse: { type: String, default: "" },
    logicReasoning: { type: String, default: "" },
    realismPersuasiveness: { type: String, default: "" },
    ideaDevelopment: { type: String, default: "" },
    vocabularyGrammar: { type: String, default: "" },
    nativeLikeWriting: { type: String, default: "" },
  },
  { _id: false },
);

const vocabularyUpgradeSchema = new Schema(
  {
    originalExpression: { type: String, required: true },
    upgradedExpression: { type: String, required: true },
    meaningVi: { type: String, required: true },
  },
  { _id: false },
);

const grammarCorrectionSchema = new Schema(
  {
    sourceQuote: { type: String, required: true },
    correctionText: { type: String, required: true },
    correctionVi: { type: String, required: true },
    explanationVi: { type: String, required: true },
  },
  { _id: false },
);

const translationPracticeSchema = new Schema(
  {
    sourceVi: { type: String, required: true },
    targetEn: { type: String, required: true },
    focusPattern: { type: String, required: true },
    explanationVi: { type: String, required: true },
  },
  { _id: false },
);

const analysisSchema = new Schema(
  {
    analysisRunId: { type: Schema.Types.ObjectId, required: true },
    pipelineVersion: { type: String, required: true },
    promptBundleVersion: { type: String, required: true },
    schemaVersion: { type: String, required: true },
    modelProvider: { type: String, required: true },
    modelName: { type: String, required: true },
    estimatedOverallBand: { type: Number, min: 0, max: 9 },
    summaryVi: { type: String, required: true },
    strengths: { type: [String], default: [] },
    criteriaFeedback: { type: criteriaFeedbackSchema, default: () => ({}) },
    structuralWeaknesses: { type: [String], default: [] },
    rewrittenEssay: { type: String, default: "" },
    rewrittenEssayVi: { type: String, default: "" },
    vocabularyUpgrades: { type: [vocabularyUpgradeSchema], default: [] },
    grammarCorrections: { type: [grammarCorrectionSchema], default: [] },
    translationPractice: { type: [translationPracticeSchema], default: [] },
    priorityIssueIds: { type: [Schema.Types.ObjectId], default: [] },
    issues: { type: [issueSchema], default: [] },
    learningItemProposals: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false },
);

const submissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    taskType: { type: String, enum: taskTypes, required: true },
    questionType: { type: String, required: true },
    promptText: { type: String, default: "" },
    originalText: { type: String, required: true },
    wordCount: { type: Number, min: 1, required: true },
    targetBandSnapshot: { type: Number, min: 0, max: 9, default: null },
    contentHash: { type: String, required: true },
    requestedPipelineVersion: { type: String, required: true },
    status: {
      type: String,
      enum: submissionStatuses,
      default: "QUEUED",
      required: true,
    },
    processingLeaseUntil: { type: Date, default: null },
    analysis: { type: analysisSchema, default: null },
    failureCode: { type: String, default: null },
    failureReason: { type: String, default: null },
    submittedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "submissions" },
);

submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ status: 1, processingLeaseUntil: 1 });
submissionSchema.index({
  userId: 1,
  contentHash: 1,
  requestedPipelineVersion: 1,
});

export type SubmissionDocument = InferSchemaType<typeof submissionSchema>;

export const Submission =
  models.Submission ?? model("Submission", submissionSchema);
