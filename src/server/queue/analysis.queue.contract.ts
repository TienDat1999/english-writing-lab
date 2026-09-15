export const ANALYSIS_QUEUE_NAME = "essay-analysis";

export type AnalyzeEssayJob = {
  submissionId: string;
  userId: string;
  pipelineVersion: string;
};
