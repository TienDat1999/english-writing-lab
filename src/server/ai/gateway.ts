import { z } from "zod";

export const essayAnalysisResultSchema = z.object({
  estimatedOverallBand: z.number().min(0).max(9).nullable(),
  summaryVi: z.string().min(1),
  strengths: z.array(z.string().min(1)).max(5),
  criteriaFeedback: z.object({
    taskResponse: z.string().min(1),
    logicReasoning: z.string().min(1),
    realismPersuasiveness: z.string().min(1),
    ideaDevelopment: z.string().min(1),
    vocabularyGrammar: z.string().min(1),
    nativeLikeWriting: z.string().min(1),
  }),
  structuralWeaknesses: z.array(z.string().min(1)).max(8),
  rewrittenEssay: z.string(),
  rewrittenEssayVi: z.string(),
  vocabularyUpgrades: z
    .array(
      z.object({
        originalExpression: z.string().min(1),
        upgradedExpression: z.string().min(1),
        meaningVi: z.string().min(1),
      }),
    )
    .max(12),
  grammarCorrections: z
    .array(
      z.object({
        sourceQuote: z.string().min(1),
        correctionText: z.string().min(1),
        correctionVi: z.string().min(1),
        explanationVi: z.string().min(1),
      }),
    )
    .max(12),
  translationPractice: z
    .array(
      z.object({
        sourceVi: z.string().min(1),
        targetEn: z.string().min(1),
        focusPattern: z.string().min(1),
        explanationVi: z.string().min(1),
      }),
    )
    .max(8),
  issues: z
    .array(
      z.object({
        scope: z.enum(["ESSAY", "PARAGRAPH", "SENTENCE", "SPAN"]),
        category: z.enum([
          "TASK_RESPONSE",
          "COHERENCE",
          "LEXICAL",
          "GRAMMAR",
          "SPELLING",
          "PUNCTUATION",
        ]),
        subcategory: z.string().min(1),
        severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
        impactScore: z.number().min(0).max(100),
        sourceQuote: z.string().min(1),
        explanationVi: z.string().min(1),
        correctionText: z.string().min(1),
        upgradeText: z.string().min(1).nullable(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(50),
});

export type EssayAnalysisResult = z.infer<typeof essayAnalysisResultSchema>;

export type AnalyzeEssayInput = {
  taskType: "TASK_1" | "TASK_2";
  questionType: string;
  promptText: string;
  originalText: string;
  targetBand: number | null;
};

export interface AiGateway {
  analyzeEssay(input: AnalyzeEssayInput): Promise<EssayAnalysisResult>;
}
