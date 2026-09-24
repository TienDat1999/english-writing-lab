import { ResourceNotFoundError } from "@/server/http/errors";
import type { LearningSource, SourceExtractor } from "./source-extractor.interface";
import type { CreateLearningItemInput } from "../learning.contract";
import type { Submission } from "@/server/submissions/submission.schema";

export class GrammarSourceExtractor implements SourceExtractor {
  extract(
    submission: Awaited<ReturnType<typeof Submission.findOne>>,
    input: CreateLearningItemInput,
  ): LearningSource {
    const analysis = submission?.analysis;

    if (!analysis) {
      throw new ResourceNotFoundError();
    }

    const item = analysis.grammarCorrections?.[input.sourceIndex ?? -1];

    if (!item) {
      throw new ResourceNotFoundError();
    }

    return {
      title: "Grammar correction",
      promptText: `Sửa câu sau: "${item.sourceQuote}"`,
      answerText: item.correctionText,
      hintVi: `${item.correctionVi} ${item.explanationVi}`.trim(),
      contextText: submission.originalText,
    };
  }
}
