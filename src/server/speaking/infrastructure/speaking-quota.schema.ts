import { Schema, model, models, type InferSchemaType } from "mongoose"

const speakingQuotaSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    dateKey: { type: String, required: true }, // Format: YYYY-MM-DD (UTC+7)
    usedAudioSeconds: { type: Number, default: 0, min: 0 },
    maxAudioSeconds: { type: Number, default: 300, min: 0 }, // 300s = 5m
    isUnlimited: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "speaking_quotas" },
)

speakingQuotaSchema.index({ userId: 1, dateKey: 1 }, { unique: true })

export type SpeakingQuotaDocument = InferSchemaType<typeof speakingQuotaSchema>

export const SpeakingQuota =
  models.SpeakingQuota ?? model("SpeakingQuota", speakingQuotaSchema)
