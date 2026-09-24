import "server-only"

import type { ITtsGateway } from "../interfaces"

const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech"

export const TTS_VOICES = ["nova", "alloy", "echo", "fable", "onyx", "shimmer"] as const
export type TtsVoice = (typeof TTS_VOICES)[number]

export class OpenAiTtsGateway implements ITtsGateway {
  constructor(private readonly apiKey: string) {}

  async generateSpeech(input: {
    text: string
    voice?: TtsVoice
    model?: "tts-1" | "tts-1-hd"
    speed?: number
  }): Promise<ArrayBuffer> {
    const response = await fetch(OPENAI_SPEECH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model ?? "tts-1",
        input: input.text,
        voice: input.voice ?? "nova",
        response_format: "mp3",
        speed: input.speed ?? 1.0,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(`OpenAI TTS failed (${response.status}): ${errorText}`)
    }

    return response.arrayBuffer()
  }
}

// Backward-compat alias
export { OpenAiTtsGateway as TtsGateway }
