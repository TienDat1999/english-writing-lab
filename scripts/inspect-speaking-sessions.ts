import mongoose from "mongoose"

const MONGODB_URI =
  "mongodb+srv://letiendat1999py_db_user:rHusUHpvYU7VMbPA@draftwise-cluster.fy3seei.mongodb.net/english_study?appName=draftwise-cluster"

async function checkRecentSessions() {
  await mongoose.connect(MONGODB_URI)
  const db = mongoose.connection.db
  if (!db) throw new Error("No db")
  const collection = db.collection("speaking_sessions")
  const sessions = await collection.find().sort({ createdAt: -1 }).limit(3).toArray()
  
  console.log("Found sessions:", sessions.length)
  for (const s of sessions) {
    console.log(`\n========================================`)
    console.log(`Session ID: ${s._id}, Mode: ${s.mode}, Topic: ${s.topicTitle}, Status: ${s.status}`)
    console.log(`Turns count: ${s.turns?.length || 0}`)
    for (const t of s.turns || []) {
      console.log(` - Turn ${t.turnNumber}:`)
      console.log(`   User transcript: "${t.userTranscript}"`)
      console.log(`   User duration: ${t.userAudioDurationSeconds}s`)
      console.log(`   AI reply: "${t.aiReplyText}"`)
      console.log(`   AI audio size: ${t.aiAudioBase64 ? t.aiAudioBase64.length : 0} bytes`)
    }
  }
  await mongoose.disconnect()
  process.exit(0)
}

checkRecentSessions().catch((err) => {
  console.error(err)
  process.exit(1)
})
