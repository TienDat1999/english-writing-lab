import "server-only";

import { Queue } from "bullmq";
import IORedis from "ioredis";

import { getServerEnv } from "@/config/env";
import {
  ANALYSIS_QUEUE_NAME,
  type AnalyzeEssayJob,
} from "./analysis.queue.contract";

const globalForQueue = globalThis as typeof globalThis & {
  analysisRedis?: IORedis;
  analysisQueue?: Queue<AnalyzeEssayJob>;
};

function getAnalysisQueue(): Queue<AnalyzeEssayJob> {
  const redisUrl = getServerEnv().REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is not configured");
  }

  if (!globalForQueue.analysisRedis) {
    globalForQueue.analysisRedis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  globalForQueue.analysisQueue ??= new Queue<AnalyzeEssayJob>(
    ANALYSIS_QUEUE_NAME,
    { connection: globalForQueue.analysisRedis },
  );

  return globalForQueue.analysisQueue;
}

export async function enqueueEssayAnalysis(
  job: AnalyzeEssayJob,
): Promise<void> {
  await getAnalysisQueue().add("analyze", job, {
    jobId: `analyze-${job.submissionId}-${job.pipelineVersion}`,
    attempts: 4,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: 500,
    removeOnFail: 1_000,
  });
}
