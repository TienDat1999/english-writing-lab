import assert from "node:assert"
import { TOPIC_CATALOG } from "../src/server/speaking/domain/topic-catalog.data"

console.log("Running Speaking Catalog & Evaluation Tests...")

// Test 1: Verify Topic Catalog has comprehensive entries
assert.ok(TOPIC_CATALOG.length >= 8, "Expected at least 8 preset topics in catalog")

const categories = new Set(TOPIC_CATALOG.map((t) => t.category))
assert.ok(categories.has("Daily Life"), "Missing Daily Life category")
assert.ok(categories.has("Work & Career"), "Missing Work & Career category")
assert.ok(categories.has("Debate & Society"), "Missing Debate & Society category")

// Test 2: Verify every topic has required fields
for (const topic of TOPIC_CATALOG) {
  assert.ok(topic.id.length > 0, "Topic id must not be empty")
  assert.ok(topic.title.length > 0, "Topic title must not be empty")
  assert.ok(topic.scenario.length > 0, "Topic scenario must not be empty")
  assert.ok(["A2", "B1_B2", "C1"].includes(topic.level), `Invalid level: ${topic.level}`)
  assert.ok(topic.tags.length > 0, "Topic must have tags")
}

console.log("✅ All Speaking Catalog & Evaluator domain tests passed successfully!")
