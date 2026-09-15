import type { Job } from "bullmq";
import { Types } from "mongoose";

import type { AiGateway } from "@/server/ai/gateway";
import { seedLearningItems } from "@/server/learning/seed-learning-items";
import type { AnalyzeEssayJob } from "@/server/queue/analysis.queue.contract";
import { Submission } from "@/server/submissions/submission.schema";

const LEASE_DURATION_MS = 5 * 60 * 1000;
const PROMPT_BUNDLE_VERSION = "ielts-b2-peer-coach-v3";
const SCHEMA_VERSION = "essay-analysis-result-v3";

type AnalysisProviderMetadata = {
  provider: string;
  model: string;
};

function groundIssues(
  originalText: string,
  issues: Awaited<ReturnType<AiGateway["analyzeEssay"]>>["issues"],
) {
  return issues
    .map((issue) => {
      const sourceStart = originalText.indexOf(issue.sourceQuote);

      if (sourceStart === -1) {
        return null;
      }

      return {
        _id: new Types.ObjectId(),
        ...issue,
        sourceStart,
        sourceEnd: sourceStart + issue.sourceQuote.length,
        status: "ACTIVE" as const,
        recurringPatternId: null,
      };
    })
    .filter((issue): issue is NonNullable<typeof issue> => issue !== null)
    .sort((left, right) => right.impactScore - left.impactScore)
    .slice(0, 12);
}

export async function processAnalysisJob(
  job: Job<AnalyzeEssayJob>,
  gateway: AiGateway,
  metadata: AnalysisProviderMetadata,
) {
  return processAnalysis({
    data: job.data,
    attemptsMade: job.attemptsMade,
    maxAttempts: job.opts.attempts ?? 1,
  }, gateway, metadata);
}

export async function processAnalysisInline(
  data: AnalyzeEssayJob,
  gateway: AiGateway,
  metadata: AnalysisProviderMetadata,
) {
  return processAnalysis({ data, attemptsMade: 0, maxAttempts: 1 }, gateway, metadata);
}

async function processAnalysis(
  run: {
    data: AnalyzeEssayJob;
    attemptsMade: number;
    maxAttempts: number;
  },
  gateway: AiGateway,
  metadata: AnalysisProviderMetadata,
) {
  const ownerId = new Types.ObjectId(run.data.userId);
  const submissionId = new Types.ObjectId(run.data.submissionId);
  const leaseUntil = new Date(Date.now() + LEASE_DURATION_MS);
  const submission = await Submission.findOneAndUpdate(
    {
      _id: submissionId,
      userId: ownerId,
      requestedPipelineVersion: run.data.pipelineVersion,
      deletedAt: null,
      status: { $in: ["QUEUED", "FAILED", "ANALYZING"] },
    },
    {
      $set: {
        status: "ANALYZING",
        processingLeaseUntil: leaseUntil,
        failureCode: null,
      },
    },
    { new: true },
  ).lean();

  if (!submission) {
    const current = await Submission.findOne({ _id: submissionId, userId: ownerId })
      .select({ status: 1 })
      .lean();

    if (current?.status === "COMPLETED") {
      return;
    }

    throw new Error("Submission is unavailable or already being analyzed");
  }

  try {
    const result = await gateway.analyzeEssay({
      taskType: submission.taskType,
      questionType: submission.questionType,
      promptText: submission.promptText,
      originalText: submission.originalText,
      targetBand: submission.targetBandSnapshot ?? null,
    });
    const issues = groundIssues(submission.originalText, result.issues);
    const grammarCorrections = result.grammarCorrections.filter((correction) =>
      submission.originalText.includes(correction.sourceQuote),
    );
    const vocabularyUpgrades = result.vocabularyUpgrades.filter((upgrade) =>
      submission.originalText.includes(upgrade.originalExpression),
    );
    const analysisRunId = new Types.ObjectId();

    const updateResult = await Submission.updateOne(
      {
        _id: submissionId,
        userId: ownerId,
        status: "ANALYZING",
        processingLeaseUntil: leaseUntil,
      },
      {
        $set: {
          status: "COMPLETED",
          processingLeaseUntil: null,
          completedAt: new Date(),
          failureCode: null,
          analysis: {
            analysisRunId,
            pipelineVersion: run.data.pipelineVersion,
            promptBundleVersion: PROMPT_BUNDLE_VERSION,
            schemaVersion: SCHEMA_VERSION,
            modelProvider: metadata.provider,
            modelName: metadata.model,
            estimatedOverallBand: result.estimatedOverallBand,
            summaryVi: result.summaryVi,
            strengths: result.strengths,
            criteriaFeedback: result.criteriaFeedback,
            structuralWeaknesses: result.structuralWeaknesses,
            rewrittenEssay: result.rewrittenEssay,
            rewrittenEssayVi: result.rewrittenEssayVi,
            vocabularyUpgrades,
            grammarCorrections,
            translationPractice: result.translationPractice,
            priorityIssueIds: issues.slice(0, 5).map((issue) => issue._id),
            issues,
            learningItemProposals: [],
          },
        },
      },
    );

    if (updateResult.modifiedCount > 0) {
      await seedLearningItems({
        userId: ownerId,
        submissionId,
        promptText: submission.promptText,
        originalText: submission.originalText,
        analysis: result,
      });
    }
  } catch (error) {
    const isFinalAttempt = run.attemptsMade + 1 >= run.maxAttempts;

    await Submission.updateOne(
      {
        _id: submissionId,
        userId: ownerId,
        status: "ANALYZING",
        processingLeaseUntil: leaseUntil,
      },
      {
        $set: {
          status: isFinalAttempt ? "FAILED" : "QUEUED",
          failureCode: isFinalAttempt ? "ANALYSIS_FAILED" : null,
          processingLeaseUntil: null,
        },
      },
    );

    throw error;
  }
}
