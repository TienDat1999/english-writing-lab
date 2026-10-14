import "server-only"

import { z } from "zod"
import type {
  ISpeakingEvaluatorGateway,
  SpeakingEvaluationSessionInput,
} from "../interfaces"
import type { SpeakingEvaluationReport } from "../../speaking/domain/speaking.types"
import { readOutputText } from "./openai-response.helper"

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"

const criterionSchema = z.object({
  score: z.number(),
  bandScale: z.string().default("9.0"),
  feedbackVi: z.string(),
  keyStrengthsVi: z.array(z.string()).default([]),
  improvementAreasVi: z.array(z.string()).default([]),
})

const grammarBreakdownSchema = z.object({
  originalSentence: z.string(),
  correctedSentence: z.string(),
  nativeUpgradeSentence: z.string(),
  explanationVi: z.string(),
})

const vocabHighlightSchema = z.object({
  wordOrPhrase: z.string(),
  cefrLevel: z.string().default("B2"),
  meaningVi: z.string(),
  contextQuote: z.string().default(""),
})

const evaluationResponseSchema = z.object({
  overallScore: z.number(),
  bandScale: z.string().default("9.0"),
  summaryVi: z.string(),
  wpm: z.number().default(110),
  hesitationCount: z.number().default(0),
  criteria: z.object({
    fluencyAndCoherence: criterionSchema,
    lexicalResource: criterionSchema,
    grammaticalRange: criterionSchema,
    pronunciationHint: criterionSchema,
  }),
  grammarBreakdown: z.array(grammarBreakdownSchema).default([]),
  vocabHighlights: z.array(vocabHighlightSchema).default([]),
})

export class OpenAiSpeakingEvaluatorGateway implements ISpeakingEvaluatorGateway {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "gpt-4o-mini",
  ) {}

  async evaluateSpeakingSession(
    input: SpeakingEvaluationSessionInput,
  ): Promise<SpeakingEvaluationReport> {
    const fullTranscript = input.turns
      .map((t) => `Turn ${t.turnNumber}:\n[User (${t.userAudioDurationSeconds}s)]: ${t.userTranscript}\n[AI Partner]: ${t.aiReplyText}`)
      .join("\n\n")

    const totalWords = input.turns.reduce(
      (acc, t) => acc + t.userTranscript.trim().split(/\s+/).filter(Boolean).length,
      0,
    )
    const totalDurationMin = Math.max(0.1, input.totalUserDurationSeconds / 60)
    const estimatedWpm = Math.round(totalWords / totalDurationMin)

    const systemPrompt = `You are a certified IELTS / VSTEP Senior Speaking Examiner & Language Coach.
Analyze the speaking conversation transcript and produce an objective, comprehensive evaluation report in Vietnamese.

Mode: ${input.mode}
Topic: "${input.topicTitle}"
Scenario: "${input.topicScenario || 'Free conversation'}"
Target Level: ${input.targetLevel || 'B1-B2'}
Estimated WPM: ${estimatedWpm} words/min (${totalWords} words in ${input.totalUserDurationSeconds} seconds)

Evaluation Guidelines:
1. Overall Score & Criteria:
   - If mode is IELTS, use IELTS 9.0 band scale (e.g. 5.5, 6.0, 6.5, 7.0, 7.5, 8.0).
   - If mode is VSTEP, use 10.0 scale.
   - If mode is FREE_TALK, use 100-point scale (e.g. 78/100).
   - Assess 4 criteria:
     a. Fluency & Coherence: speech rate, hesitation/pauses, logical connectors.
     b. Lexical Resource: vocabulary range, collocations, idiomatic usage.
     c. Grammatical Range & Accuracy: sentence structures, tense consistency, error frequency.
     d. Pronunciation Hint: words possibly misrecognized by STT due to unclear pronunciation or missing ending sounds (e.g. /s/, /ed/, /t/).
2. Grammar Breakdown (3-line model):
   - Extract up to 5 grammatical errors made by the user.
   - For each error, provide:
     - "originalSentence": exact sentence said by user
     - "correctedSentence": minimum correction to fix the grammatical error
     - "nativeUpgradeSentence": a more natural, idiomatic expression
     - "explanationVi": clear explanation in Vietnamese of the grammar rule violated
3. Vocabulary Highlights:
   - Identify 3-5 good words/phrases used or recommended for this topic with CEFR level and Vietnamese meaning.

Return ONLY valid JSON matching this schema:
{
  "overallScore": number,
  "bandScale": string,
  "summaryVi": string,
  "wpm": number,
  "hesitationCount": number,
  "criteria": {
    "fluencyAndCoherence": { "score": number, "bandScale": string, "feedbackVi": string, "keyStrengthsVi": [string], "improvementAreasVi": [string] },
    "lexicalResource": { "score": number, "bandScale": string, "feedbackVi": string, "keyStrengthsVi": [string], "improvementAreasVi": [string] },
    "grammaticalRange": { "score": number, "bandScale": string, "feedbackVi": string, "keyStrengthsVi": [string], "improvementAreasVi": [string] },
    "pronunciationHint": { "score": number, "bandScale": string, "feedbackVi": string, "keyStrengthsVi": [string], "improvementAreasVi": [string] }
  },
  "grammarBreakdown": [
    { "originalSentence": string, "correctedSentence": string, "nativeUpgradeSentence": string, "explanationVi": string }
  ],
  "vocabHighlights": [
    { "wordOrPhrase": string, "cefrLevel": string, "meaningVi": string, "contextQuote": string }
  ]
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
          { role: "user", content: `Here is the full conversation transcript to evaluate:\n\n${fullTranscript}` },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(45_000),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => "Unknown error")
      throw new Error(`OpenAI Speaking Evaluator failed (${response.status}): ${err}`)
    }

    const data = await response.json()
    const rawText = readOutputText(data)
    const parsedJson = JSON.parse(rawText)
    const validated = evaluationResponseSchema.parse(parsedJson)

    return {
      ...validated,
      wpm: validated.wpm || estimatedWpm,
      generatedAt: new Date(),
    }
  }
}
