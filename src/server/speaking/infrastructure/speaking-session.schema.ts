import { Schema, model, models, type InferSchemaType } from "mongoose"

const speakingTurnSchema = new Schema(
  {
    turnNumber: { type: Number, required: true },
    userAudioDurationSeconds: { type: Number, default: 0 },
    userTranscript: { type: String, required: true },
    aiReplyText: { type: String, required: true },
    aiAudioBase64: { type: String, default: null },
    instantFeedbackVi: { type: String, default: null },
    suggestedPhrases: [
      {
        phrase: { type: String, required: true },
        meaningVi: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
)

const speakingSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    mode: {
      type: String,
      enum: ["FREE_TALK", "IELTS", "VSTEP"],
      default: "FREE_TALK",
      required: true,
    },
    topicTitle: { type: String, required: true },
    topicScenario: { type: String, default: "" },
    targetLevel: {
      type: String,
      enum: ["A2", "B1_B2", "C1"],
      default: "B1_B2",
      required: true,
    },
    voicePersona: { type: String, default: "nova" },
    speechRate: { type: Number, default: 1.0 },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "EXPIRED"],
      default: "IN_PROGRESS",
      required: true,
      index: true,
    },
    examPart: {
      type: String,
      enum: ["PART_1", "PART_2", "PART_3", "FULL_TEST"],
      default: null,
    },
    cueCard: {
      topic: { type: String, default: null },
      bulletPoints: [{ type: String }],
      followUpQuestions: [{ type: String }],
    },
    hintsUsedCount: { type: Number, default: 0 },
    turns: [speakingTurnSchema],
    totalUserDurationSeconds: { type: Number, default: 0 },
    evaluationReport: { type: Schema.Types.Mixed, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "speaking_sessions" },
)

speakingSessionSchema.index({ userId: 1, createdAt: -1 })
speakingSessionSchema.index({ userId: 1, status: 1, createdAt: -1 })

export type SpeakingSessionDocument = InferSchemaType<typeof speakingSessionSchema>

export const SpeakingSession =
  models.SpeakingSession ?? model("SpeakingSession", speakingSessionSchema)
