import { z } from "zod";
import type { ITranslationReviewGateway } from "../interfaces";
import {
  buildTranslationEvaluationInstructions,
  buildTranslationEvaluationUserContent,
  TRANSLATION_EVALUATION_JSON_SCHEMA,
} from "../prompts/translation-evaluation.prompt";
import { readOutputText, type OpenAiResponse } from "./openai-response.helper";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export const writingAlternativeSchema = z.object({
  label: z.string(),
  sentenceEn: z.string(),
  noteVi: z.string().optional().default(""),
});

export type WritingAlternative = z.infer<typeof writingAlternativeSchema>;

export const translationEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  meaningScore: z.number().int().min(0).max(100),
  grammarScore: z.number().int().min(0).max(100),
  naturalnessScore: z.number().int().min(0).max(100),
  feedbackVi: z.string().min(1),
  correctedTranslation: z.string().min(1),
  upgradedTranslation: z.string().min(1),
  patternTipVi: z.string().min(1),
  paraphraseExampleEn: z.string().min(1),
  grammarIssues: z
    .array(
      z.object({
        sourceQuote: z.string().min(1),
        correction: z.string().min(1),
        wordClass: z.string().optional().default(""),
        issueType: z
          .enum(["GRAMMAR_ERROR", "STYLE_SUGGESTION", "SPELLING_TYPO"])
          .optional()
          .default("GRAMMAR_ERROR"),
        reasonVi: z.string().optional().default(""),
        contextAndExampleVi: z.string().optional().default(""),
        explanationVi: z.string().min(1),
      }),
    )
    .max(6),
  vocabularyUpgrades: z
    .array(
      z.object({
        originalWord: z.string().min(1),
        upgradedAlternatives: z.string().min(1),
        reasonVi: z.string().min(1),
      }),
    )
    .max(6)
    .default([]),
  writingAlternatives: z.array(writingAlternativeSchema).optional().default([]),
});

export type TranslationEvaluation = z.infer<typeof translationEvaluationSchema>;

export class OpenAiTranslationReviewGateway implements ITranslationReviewGateway {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async evaluate(input: {
    sourceVi: string;
    referenceEn: string;
    learnerAnswer: string;
    requiredPhrase?: string;
    mode?: "TRANSLATION" | "WRITING_TEMPLATE";
    writingFunctionVi?: string;
  }): Promise<TranslationEvaluation> {
    const isWritingTemplate = input.mode === "WRITING_TEMPLATE";
    const instructions = buildTranslationEvaluationInstructions(input);
    const userContent = buildTranslationEvaluationUserContent(input);

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        max_output_tokens: 1800,
        instructions,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: userContent,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "translation_evaluation",
            strict: true,
            schema: TRANSLATION_EVALUATION_JSON_SCHEMA,
          },
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const payload = (await response.json()) as OpenAiResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `OpenAI request failed with ${response.status}`);
    }

    const result = translationEvaluationSchema.parse(JSON.parse(readOutputText(payload)));
    const normalizedScore = Math.round(
      (result.meaningScore + result.grammarScore + result.naturalnessScore) / 3,
    );

    let patternTipVi = result.patternTipVi;
    if (isWritingTemplate && input.referenceEn && input.referenceEn.includes("[")) {
      if (!patternTipVi.includes("[")) {
        const cleanExplanation =
          patternTipVi
            .replace(/^Cấu trúc\s*[:\-\s]*/i, "")
            .replace(/^"?[^"]+"?\s*/, "")
            .replace(/[()]/g, "")
            .trim() || "Cấu trúc template B2";
        patternTipVi = `${input.referenceEn} (${cleanExplanation})`;
      }
    }

    return {
      ...result,
      patternTipVi,
      score: normalizedScore,
      grammarIssues: result.grammarIssues.filter((issue) =>
        input.learnerAnswer.includes(issue.sourceQuote),
      ),
      vocabularyUpgrades: (result.vocabularyUpgrades ?? []).filter((v) =>
        input.learnerAnswer.toLowerCase().includes(v.originalWord.toLowerCase()),
      ),
    };
  }
}

// Backward-compat alias
export { OpenAiTranslationReviewGateway as TranslationReviewGateway };
