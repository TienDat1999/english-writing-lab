import "server-only"

import { z } from "zod"
import type { ISpeakingCoachGateway, SpeakingTurnContext, SpeakingTurnResponse } from "../interfaces"
import { readOutputText } from "./openai-response.helper"

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"

const speakingTurnSchema = z.object({
  replyText: z.string().min(1),
  suggestedPhrases: z
    .array(
      z.object({
        phrase: z.string(),
        meaningVi: z.string(),
      }),
    )
    .optional()
    .default([]),
  instantFeedbackVi: z.string().optional(),
  isSessionEndSuggested: z.boolean().optional().default(false),
})

export class OpenAiSpeakingCoachGateway implements ISpeakingCoachGateway {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "gpt-4o-mini",
  ) {}

  async generateTurnResponse(context: SpeakingTurnContext): Promise<SpeakingTurnResponse> {
    const systemPrompt = this.buildSystemPrompt(context)
    const messages = [
      { role: "system", content: systemPrompt },
      ...context.history.map((h) => ({
        role: h.speaker === "user" ? ("user" as const) : ("assistant" as const),
        content: h.text,
      })),
      { role: "user" as const, content: context.userTranscript },
    ]

    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error")
      throw new Error(`OpenAI Speaking Coach failed (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const rawText = readOutputText(data)
    const parsedJson = JSON.parse(rawText)
    return speakingTurnSchema.parse(parsedJson)
  }

  private buildSystemPrompt(context: SpeakingTurnContext): string {
    const levelGuide = context.targetLevel === "A2"
      ? "Target level: A2 (Elementary). Use clear, simple vocabulary, short sentences, and speak gently."
      : context.targetLevel === "C1"
      ? "Target level: C1 (Advanced). Use sophisticated expressions, idiomatic language, and thought-provoking questions."
      : "Target level: B1-B2 (Intermediate). Use natural conversational English with varied expressions."

    return `You are an interactive AI Speaking Coach & Partner.
Topic: "${context.topicTitle}"
Scenario: "${context.topicScenario || 'Free conversational English practice'}"
Mode: ${context.mode}
${levelGuide}

Instructions:
1. "replyText": Your conversational spoken response in English. Keep it concise (1 to 3 sentences, around 20-50 words) so audio TTS is fast. React to the user's answer and ask an engaging follow-up question or continue the scenario naturally.
2. "suggestedPhrases": Provide 2-3 useful collocations/phrases relevant to the topic with Vietnamese translations.
3. "instantFeedbackVi": (Optional) If the user made a noticeable grammar/pronunciation mistake in their transcript, give a brief, friendly 1-sentence tip in Vietnamese. Otherwise omit or keep empty.
4. "isSessionEndSuggested": Set to true only if the user explicitly says goodbye or the conversation naturally finishes.

Return ONLY valid JSON matching this schema:
{
  "replyText": string,
  "suggestedPhrases": [{ "phrase": string, "meaningVi": string }],
  "instantFeedbackVi": string,
  "isSessionEndSuggested": boolean
}`
  }
}
