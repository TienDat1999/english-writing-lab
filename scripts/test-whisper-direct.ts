import Module from "module"

// Mock server-only for standalone script execution
const originalRequire = Module.prototype.require
// @ts-ignore
Module.prototype.require = function (id: string) {
  if (id === "server-only") return {}
  return originalRequire.apply(this, arguments as unknown as [string])
}

async function testDirectWhisper() {
  const { OpenAiSttGateway } = await import("../src/server/ai/openai/openai-stt.gateway")
  const apiKey = process.env.OPENAI_API_KEY || ""
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set.")
    return
  }
  const gateway = new OpenAiSttGateway(apiKey)

  console.log("Testing OpenAI STT Gateway with mock WAV sound...")

  // Generate 1-second 440Hz Sine wave in 16-bit PCM WAV format
  const sampleRate = 16000
  const numSamples = sampleRate * 1
  const buffer = Buffer.alloc(44 + numSamples * 2)

  // RIFF header
  buffer.write("RIFF", 0)
  buffer.writeUInt32LE(36 + numSamples * 2, 4)
  buffer.write("WAVE", 8)
  buffer.write("fmt ", 12)
  buffer.writeUInt32LE(16, 16) // SubChunk1Size (PCM)
  buffer.writeUInt16LE(1, 20)  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22)  // NumChannels (1)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28) // ByteRate
  buffer.writeUInt16LE(2, 32)  // BlockAlign
  buffer.writeUInt16LE(16, 34) // BitsPerSample
  buffer.write("data", 36)
  buffer.writeUInt32LE(numSamples * 2, 40)

  // Write sine wave samples
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 16000
    buffer.writeInt16LE(Math.round(sample), 44 + i * 2)
  }

  try {
    const res = await gateway.transcribeAudio({
      audioBuffer: buffer,
      mimeType: "audio/wav",
      language: "en",
    })
    console.log("Transcribe response:", res)
    console.log("✅ Whisper API call connected successfully!")
  } catch (err) {
    console.error("❌ Whisper API Error:", err)
  }
}

testDirectWhisper()
