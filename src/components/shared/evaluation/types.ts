export type GrammarIssue = {
  sourceQuote: string;
  correction: string;
  wordClass?: string;
  issueType?: "GRAMMAR_ERROR" | "STYLE_SUGGESTION" | "SPELLING_TYPO";
  reasonVi?: string;
  contextAndExampleVi?: string;
  explanationVi: string;
};

export type VocabularyUpgrade = {
  originalWord: string;
  upgradedAlternatives: string;
  reasonVi: string;
};

export type TranslationEvaluation = {
  score: number;
  meaningScore: number;
  grammarScore: number;
  naturalnessScore: number;
  feedbackVi: string;
  correctedTranslation: string;
  upgradedTranslation?: string;
  patternTipVi?: string;
  paraphraseExampleEn?: string;
  grammarIssues?: GrammarIssue[];
  vocabularyUpgrades?: VocabularyUpgrade[];
};

export type ScoreTier = {
  tier: string;
  badgeClass: string;
  containerClass: string;
  scoreClass: string;
  title: string;
};
