import "server-only"

import type { ISttGateway, SttTranscriptionResult } from "../interfaces"

const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions"

export class OpenAiSttGateway implements ISttGateway {
  constructor(private readonly apiKey: string) {}

  async transcribeAudio(input: {
    audioBuffer: Buffer | ArrayBuffer
    mimeType: string
    filename?: string
    language?: string
    prompt?: string
  }): Promise<SttTranscriptionResult> {
    let ext = "webm"
    const lowerMime = (input.mimeType || "").toLowerCase()
    if (lowerMime.includes("mp4")) ext = "mp4"
    else if (lowerMime.includes("m4a") || lowerMime.includes("aac")) ext = "m4a"
    else if (lowerMime.includes("wav")) ext = "wav"
    else if (lowerMime.includes("ogg") || lowerMime.includes("opus")) ext = "ogg"
    else if (lowerMime.includes("mp3") || lowerMime.includes("mpeg")) ext = "mp3"

    const filename = input.filename ?? `audio.${ext}`
    const blob = new Blob([input.audioBuffer as unknown as BlobPart], {
      type: input.mimeType || `audio/${ext}`,
    })

    const formData = new FormData()
    formData.append("file", blob, filename)
    formData.append("model", "whisper-1")
    formData.append("response_format", "verbose_json")
    if (input.language) {
      formData.append("language", input.language)
    }
    if (input.prompt) {
      formData.append("prompt", input.prompt)
    }

    const response = await fetch(OPENAI_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(`OpenAI STT (Whisper) failed (${response.status}): ${errorText}`)
    }

    const data = (await response.json()) as {
      text?: string
      duration?: number
      language?: string
    }

    return {
      text: (data.text ?? "").trim(),
      durationSeconds: typeof data.duration === "number" ? Math.round(data.duration) : undefined,
      language: data.language,
    }
  }
}
