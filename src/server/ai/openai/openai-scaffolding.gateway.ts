import "server-only"

import { z } from "zod"
import type { IScaffoldingGateway, ScaffoldingInput } from "../interfaces"
import type { ScaffoldingHintResult } from "../../speaking/domain/speaking.types"
import { readOutputText } from "./openai-response.helper"

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"

const scaffoldingSchema = z.object({
  idea: z.string().min(1),
  usefulCollocations: z
    .array(
      z.object({
        phrase: z.string(),
        meaningVi: z.string(),
      }),
    )
    .min(1),
  sentenceStarter: z.string().min(1),
})

export class OpenAiScaffoldingGateway implements IScaffoldingGateway {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "gpt-4o-mini",
  ) {}

  async generateScaffoldingHint(input: ScaffoldingInput): Promise<ScaffoldingHintResult> {
    const systemPrompt = `You are an expert English Speaking Scaffolding Assistant.
A learner is struggling to formulate an answer to the following question or scenario.
Topic: "${input.topicTitle}"
Scenario: "${input.topicScenario || ''}"
Current Question / Prompt: "${input.currentAiPrompt}"
Target Level: ${input.targetLevel || 'B1-B2'}

Provide immediate, high-value speaking assistance:
1. "idea": 1 clear, realistic idea/point they can talk about (in English with brief Vietnamese summary).
2. "usefulCollocations": 2-3 high-scoring collocations with accurate Vietnamese translations.
3. "sentenceStarter": A smooth, natural sentence starter to help them begin speaking immediately (e.g. "From my perspective, one of the primary reasons is...").

Return ONLY valid JSON matching this schema:
{
  "idea": string,
  "usefulCollocations": [{ "phrase": string, "meaningVi": string }],
  "sentenceStarter": string
}`

    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Please generate scaffolding hints for this question." },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => "Unknown error")
      throw new Error(`OpenAI Scaffolding failed (${response.status}): ${err}`)
    }

    const data = await response.json()
    const rawText = readOutputText(data)
    const parsedJson = JSON.parse(rawText)
    return scaffoldingSchema.parse(parsedJson)
  }
}
