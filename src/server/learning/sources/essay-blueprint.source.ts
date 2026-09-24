import { ResourceNotFoundError } from "@/server/http/errors";
import type { LearningSource, SourceExtractor } from "./source-extractor.interface";
import type { Submission } from "@/server/submissions/submission.schema";

export class EssayBlueprintSourceExtractor implements SourceExtractor {
  extract(
    submission: Awaited<ReturnType<typeof Submission.findOne>>,
  ): LearningSource {
    const analysis = submission?.analysis;

    if (!analysis) {
      throw new ResourceNotFoundError();
    }

    if (!analysis.rewrittenEssay) {
      throw new ResourceNotFoundError();
    }

    return {
      title: "Essay blueprint",
      promptText: submission.promptText
        ? `Nhớ lại bố cục và các luận điểm chính cho đề: ${submission.promptText}`
        : "Nhớ lại bố cục và các luận điểm chính của bài viết mẫu này.",
      answerText: analysis.rewrittenEssay,
      hintVi: analysis.rewrittenEssayVi ?? "",
      contextText: analysis.structuralWeaknesses?.join("\n") ?? "",
    };
  }
}
