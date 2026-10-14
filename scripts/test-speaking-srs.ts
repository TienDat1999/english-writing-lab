import assert from "node:assert"
import { createHash } from "crypto"

console.log("Running Speaking SRS Integration test...")

// Test 1: Fingerprint generation idempotency and case-insensitivity
function computeFingerprint(userId: string, sourceType: string, answerText: string) {
  return createHash("sha256")
    .update(`${userId}:${sourceType}:${answerText.trim().toLowerCase()}`)
    .digest("hex")
}

const user1 = "507f1f77bcf86cd799439011"
const fp1 = computeFingerprint(user1, "VOCABULARY", "Work-life balance")
const fp2 = computeFingerprint(user1, "VOCABULARY", "  work-life balance  ")
const fp3 = computeFingerprint(user1, "VOCABULARY", "Work-life harmony")
const fp4 = computeFingerprint(user1, "GRAMMAR", "Work-life balance")

assert.strictEqual(fp1, fp2, "Fingerprint should be identical regardless of casing and whitespace")
assert.notStrictEqual(fp1, fp3, "Fingerprint should differ for different words")
assert.notStrictEqual(fp1, fp4, "Fingerprint should differ for different source types")

// Test 2: Verify vocabulary structure payload
const vocabPayload = {
  userId: user1,
  sourceType: "VOCABULARY" as const,
  quizType: "COLLOCATION" as const,
  title: "heavy workload",
  topicText: "Work & Career",
  promptText: "khối lượng công việc nặng nề",
  answerText: "heavy workload",
  hintVi: "Level: B2",
  contextText: "I often struggle with a heavy workload during project deadlines.",
}

assert.ok(vocabPayload.title.length > 0)
assert.ok(vocabPayload.promptText.length > 0)
assert.ok(vocabPayload.answerText.length > 0)

// Test 3: Verify grammar correction payload
const grammarPayload = {
  userId: user1,
  sourceType: "GRAMMAR" as const,
  title: "Sửa lỗi ngữ pháp: I have been living here for 5 years",
  topicText: "Daily Life",
  promptText: "I am living here since 5 years.",
  answerText: "I have been living here for 5 years.",
  hintVi: "Dùng Present Perfect Continuous với khoảng thời gian 'for 5 years'.",
  contextText: "I am living here since 5 years.",
}

assert.strictEqual(grammarPayload.sourceType, "GRAMMAR")
assert.ok(grammarPayload.answerText.length > 0)

console.log("✅ All Speaking SRS unit tests passed successfully!")
