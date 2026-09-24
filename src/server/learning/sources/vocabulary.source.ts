import { ResourceNotFoundError } from "@/server/http/errors";
import type { LearningSource, SourceExtractor } from "./source-extractor.interface";
import type { CreateLearningItemInput } from "../learning.contract";
import type { Submission } from "@/server/submissions/submission.schema";

export class VocabularySourceExtractor implements SourceExtractor {
  extract(
    submission: Awaited<ReturnType<typeof Submission.findOne>>,
    input: CreateLearningItemInput,
  ): LearningSource {
    const analysis = submission?.analysis;

    if (!analysis) {
      throw new ResourceNotFoundError();
    }

    const item = analysis.vocabularyUpgrades?.[input.sourceIndex ?? -1];

    if (!item) {
      throw new ResourceNotFoundError();
    }

    return {
      title: "Academic expression",
      promptText: `Viết lại theo cách tự nhiên và học thuật hơn: "${item.originalExpression}"`,
      answerText: item.upgradedExpression,
      hintVi: item.meaningVi,
      contextText: submission.originalText,
    };
  }
}
