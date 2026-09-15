import { loadEnvConfig } from "@next/env";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";

import { OpenAiGateway } from "@/server/ai/openai.gateway";
import {
  ANALYSIS_QUEUE_NAME,
  type AnalyzeEssayJob,
} from "@/server/queue/analysis.queue.contract";

import { processAnalysisJob } from "./process-analysis";

loadEnvConfig(process.cwd());

const mongodbUri = process.env.MONGODB_URI;
const mongodbDb = process.env.MONGODB_DB ?? "english_study";
const redisUrl = process.env.REDIS_URL;
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

async function main() {
  if (!mongodbUri || !redisUrl || !openAiApiKey) {
    throw new Error(
      "Worker requires MONGODB_URI, REDIS_URL, and OPENAI_API_KEY in .env.local",
    );
  }

  await mongoose.connect(mongodbUri, { dbName: mongodbDb });

  const redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  const gateway = new OpenAiGateway(openAiApiKey, openAiModel);
  const worker = new Worker<AnalyzeEssayJob>(
    ANALYSIS_QUEUE_NAME,
    (job) =>
      processAnalysisJob(job, gateway, {
        provider: "openai",
        model: openAiModel,
      }),
    { connection: redis, concurrency: 2 },
  );

  worker.on("completed", (job) => {
    console.info("Essay analysis completed", { jobId: job.id });
  });

  worker.on("failed", (job, error) => {
    console.error("Essay analysis failed", {
      jobId: job?.id,
      attempt: job?.attemptsMade,
      message: error.message,
    });
  });

  console.info("Essay analysis worker is ready", {
    queue: ANALYSIS_QUEUE_NAME,
    model: openAiModel,
  });

  async function shutdown() {
    await worker.close();
    await redis.quit();
    await mongoose.disconnect();
  }

  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

void main().catch((error: unknown) => {
  console.error("Essay analysis worker failed to start", error);
  process.exitCode = 1;
});
