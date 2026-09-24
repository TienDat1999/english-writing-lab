import type { Submission } from "@/server/submissions/submission.schema";
import type { CreateLearningItemInput } from "../learning.contract";

export type LearningSource = {
  title: string;
  promptText: string;
  answerText: string;
  hintVi: string;
  contextText: string;
};

export interface SourceExtractor {
  extract(
    submission: Awaited<ReturnType<typeof Submission.findOne>>,
    input: CreateLearningItemInput,
  ): LearningSource;
}
