import "server-only"

import { Types } from "mongoose"
import { connectMongoose } from "@/server/db/mongoose"
import { SpeakingQuota } from "./speaking-quota.schema"
import { FREE_TIER_MAX_AUDIO_SECONDS } from "../domain/speaking-quota.policy"

export class SpeakingQuotaRepository {
  async getOrCreateQuota(userId: string, dateKey: string) {
    await connectMongoose()
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId")
    }

    const doc = await SpeakingQuota.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), dateKey },
      {
        $setOnInsert: {
          usedAudioSeconds: 0,
          maxAudioSeconds: FREE_TIER_MAX_AUDIO_SECONDS,
          isUnlimited: false,
        },
      },
      { upsert: true, new: true },
    ).lean()

    return doc
  }

  async incrementUsedSeconds(userId: string, dateKey: string, seconds: number) {
    await connectMongoose()
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId")
    }

    return SpeakingQuota.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), dateKey },
      {
        $inc: { usedAudioSeconds: Math.max(0, seconds) },
        $setOnInsert: {
          maxAudioSeconds: FREE_TIER_MAX_AUDIO_SECONDS,
          isUnlimited: false,
        },
      },
      { upsert: true, new: true },
    ).lean()
  }
}
