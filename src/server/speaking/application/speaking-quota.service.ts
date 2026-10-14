import "server-only"

import { SpeakingQuotaRepository } from "../infrastructure/speaking-quota.repository"
import {
  getCurrentDateKey,
  calculateRemainingSeconds,
  canRecordAudio,
  FREE_TIER_MAX_AUDIO_SECONDS,
} from "../domain/speaking-quota.policy"

export class SpeakingQuotaService {
  constructor(private readonly quotaRepo = new SpeakingQuotaRepository()) {}

  async getUserQuotaStatus(userId: string) {
    const dateKey = getCurrentDateKey()
    const quotaDoc = await this.quotaRepo.getOrCreateQuota(userId, dateKey)
    const usedSeconds = quotaDoc.usedAudioSeconds ?? 0
    const maxSeconds = quotaDoc.maxAudioSeconds ?? FREE_TIER_MAX_AUDIO_SECONDS
    const isUnlimited = Boolean(quotaDoc.isUnlimited)
    const remainingSeconds = calculateRemainingSeconds(usedSeconds, maxSeconds)
    const canRecord = canRecordAudio(usedSeconds, isUnlimited, maxSeconds)

    return {
      dateKey,
      usedSeconds,
      maxSeconds,
      remainingSeconds,
      isUnlimited,
      canRecord,
    }
  }

  async deductUserAudioSeconds(userId: string, durationSeconds: number) {
    if (durationSeconds <= 0) return this.getUserQuotaStatus(userId)
    const dateKey = getCurrentDateKey()
    await this.quotaRepo.incrementUsedSeconds(userId, dateKey, durationSeconds)
    return this.getUserQuotaStatus(userId)
  }
}
