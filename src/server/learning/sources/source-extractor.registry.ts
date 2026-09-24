import { ResourceNotFoundError } from "@/server/http/errors";
import type { LearningSource } from "./source-extractor.interface";
import type { CreateLearningItemInput } from "../learning.contract";
import type { Submission } from "@/server/submissions/submission.schema";
import { VocabularySourceExtractor } from "./vocabulary.source";
import { GrammarSourceExtractor } from "./grammar.source";
import { TranslationSourceExtractor } from "./translation.source";
import { EssayBlueprintSourceExtractor } from "./essay-blueprint.source";

const registry = {
  VOCABULARY: new VocabularySourceExtractor(),
  GRAMMAR: new GrammarSourceExtractor(),
  TRANSLATION: new TranslationSourceExtractor(),
  ESSAY_BLUEPRINT: new EssayBlueprintSourceExtractor(),
};

export function getSource(
  submission: Awaited<ReturnType<typeof Submission.findOne>>,
  input: CreateLearningItemInput,
): LearningSource {
  const extractor = registry[input.sourceType as keyof typeof registry];
  if (!extractor) throw new ResourceNotFoundError();
  return extractor.extract(submission, input);
}
