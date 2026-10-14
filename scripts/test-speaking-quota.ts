import assert from "node:assert"
import {
  getCurrentDateKey,
  calculateRemainingSeconds,
  canRecordAudio,
  FREE_TIER_MAX_AUDIO_SECONDS,
} from "../src/server/speaking/domain/speaking-quota.policy"

console.log("Running Speaking Quota Policy Tests...")

// Test 1: Max seconds constant is 300 (5 minutes)
assert.strictEqual(FREE_TIER_MAX_AUDIO_SECONDS, 300)

// Test 2: Date key format YYYY-MM-DD
const testDate = new Date("2026-09-27T01:00:00Z")
const dateKey = getCurrentDateKey(testDate, 7) // UTC+7
assert.strictEqual(typeof dateKey, "string")
assert.match(dateKey, /^\d{4}-\d{2}-\d{2}$/)

// Test 3: Calculate remaining seconds
assert.strictEqual(calculateRemainingSeconds(0, 300), 300)
assert.strictEqual(calculateRemainingSeconds(120, 300), 180)
assert.strictEqual(calculateRemainingSeconds(300, 300), 0)
assert.strictEqual(calculateRemainingSeconds(350, 300), 0) // Cannot be negative

// Test 4: canRecordAudio checks
assert.strictEqual(canRecordAudio(0, false, 300), true)
assert.strictEqual(canRecordAudio(299, false, 300), true)
assert.strictEqual(canRecordAudio(300, false, 300), false)
assert.strictEqual(canRecordAudio(400, false, 300), false)
assert.strictEqual(canRecordAudio(500, true, 300), true) // Unlimited user always true

console.log("✅ All Speaking Quota Policy unit tests passed successfully!")
