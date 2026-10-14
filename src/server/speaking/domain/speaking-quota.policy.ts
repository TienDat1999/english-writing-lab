export const FREE_TIER_MAX_AUDIO_SECONDS = 300 // 5 minutes

export function getCurrentDateKey(date: Date = new Date(), timezoneOffsetHours: number = 7): string {
  // Convert UTC date to UTC+7 (Vietnam Time)
  const targetTime = new Date(date.getTime() + timezoneOffsetHours * 60 * 60 * 1000)
  const yyyy = targetTime.getUTCFullYear()
  const mm = String(targetTime.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(targetTime.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function calculateRemainingSeconds(usedSeconds: number, maxSeconds: number = FREE_TIER_MAX_AUDIO_SECONDS): number {
  return Math.max(0, maxSeconds - usedSeconds)
}

export function canRecordAudio(
  usedSeconds: number,
  isUnlimited: boolean = false,
  maxSeconds: number = FREE_TIER_MAX_AUDIO_SECONDS,
): boolean {
  if (isUnlimited) return true
  return usedSeconds < maxSeconds
}
