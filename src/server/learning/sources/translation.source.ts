import { ResourceNotFoundError } from "@/server/http/errors";
import type { LearningSource, SourceExtractor } from "./source-extractor.interface";
import type { CreateLearningItemInput } from "../learning.contract";
import type { Submission } from "@/server/submissions/submission.schema";

export class TranslationSourceExtractor implements SourceExtractor {
  extract(
    submission: Awaited<ReturnType<typeof Submission.findOne>>,
    input: CreateLearningItemInput,
  ): LearningSource {
    const analysis = submission?.analysis;

    if (!analysis) {
      throw new ResourceNotFoundError();
    }

    const item = analysis.translationPractice?.[input.sourceIndex ?? -1];

    if (!item) {
      throw new ResourceNotFoundError();
    }

    return {
      title: "Vietnamese to English",
      promptText: item.sourceVi,
      answerText: item.targetEn,
      hintVi: `${item.focusPattern} — ${item.explanationVi}`,
      contextText: submission.promptText,
    };
  }
}
