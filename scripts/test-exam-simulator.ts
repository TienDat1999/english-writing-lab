import assert from "node:assert"
import { EXAM_MOCK_TESTS } from "../src/server/speaking/domain/exam-prompts.data"

console.log("Running Exam Simulator & Mock Tests validation...")

// Test 1: Verify IELTS and VSTEP mock test coverage
assert.ok(EXAM_MOCK_TESTS.length >= 3, "Expected at least 3 exam mock tests")

const ieltsTests = EXAM_MOCK_TESTS.filter((e) => e.examType === "IELTS")
const vstepTests = EXAM_MOCK_TESTS.filter((e) => e.examType === "VSTEP")

assert.ok(ieltsTests.length >= 2, "Expected at least 2 IELTS mock tests")
assert.ok(vstepTests.length >= 1, "Expected at least 1 VSTEP mock test")

// Test 2: Verify Part 2 Cue Card structure for each test
for (const exam of EXAM_MOCK_TESTS) {
  assert.ok(exam.part2CueCard, `Exam ${exam.id} missing Cue Card`)
  assert.ok(exam.part2CueCard.topic.length > 10, "Cue card topic too short")
  assert.ok(exam.part2CueCard.bulletPoints.length >= 3, "Expected at least 3 cue card bullet points")
  assert.ok(exam.part1Questions.length >= 2, "Expected at least 2 Part 1 questions")
  assert.ok(exam.part3Questions.length >= 2, "Expected at least 2 Part 3 questions")
}

console.log("✅ All Exam Simulator domain tests passed successfully!")
