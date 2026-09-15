import "server-only";

import { createHash } from "node:crypto";
import { Types } from "mongoose";

import { getAiEnv } from "@/config/ai-env";
import type { EssayAnalysisResult } from "@/server/ai/gateway";
import { OpenAiGateway } from "@/server/ai/openai.gateway";
import { connectMongoose } from "@/server/db/mongoose";
import { ResourceNotFoundError } from "@/server/http/errors";
import { enqueueEssayAnalysis } from "@/server/queue/analysis.queue";
import { processAnalysisInline } from "@/worker/process-analysis";

import type { CreateSubmissionInput } from "./submission.contract";
import { Submission, type SubmissionStatus } from "./submission.schema";

const PIPELINE_VERSION = "essay-analysis-v3";

function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

function createContentHash(input: CreateSubmissionInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        taskType: input.taskType,
        questionType: input.questionType,
        promptText: input.promptText,
        originalText: input.originalText,
      }),
    )
    .digest("hex");
}

export async function createSubmission(
  userId: string,
  input: CreateSubmissionInput,
) {
  await connectMongoose();
  const ownerId = new Types.ObjectId(userId);
  const submission = await Submission.create({
    userId: ownerId,
    taskType: input.taskType,
    questionType: input.questionType,
    promptText: input.promptText,
    originalText: input.originalText,
    wordCount: countWords(input.originalText),
    targetBandSnapshot: input.targetBand ?? null,
    contentHash: createContentHash(input),
    requestedPipelineVersion: PIPELINE_VERSION,
    status: "QUEUED",
    submittedAt: new Date(),
  });

  const job = {
    submissionId: submission.id,
    userId,
    pipelineVersion: PIPELINE_VERSION,
  };

  try {
    if (process.env.ANALYSIS_MODE === "inline") {
      const aiEnv = getAiEnv();
      await processAnalysisInline(
        job,
        new OpenAiGateway(aiEnv.OPENAI_API_KEY, aiEnv.OPENAI_MODEL),
        { provider: "openai", model: aiEnv.OPENAI_MODEL },
      );
      return { id: submission.id, status: "COMPLETED" as const };
    }

    await enqueueEssayAnalysis(job);
  } catch (error) {
    await Submission.updateOne(
      { _id: submission._id, userId: ownerId },
      { $set: { status: "FAILED", failureCode: "QUEUE_UNAVAILABLE" } },
    );
    throw error;
  }

  return { id: submission.id, status: "QUEUED" as const };
}

export type SubmissionListItem = {
  id: string;
  taskType: "TASK_1" | "TASK_2";
  questionType: string;
  wordCount: number;
  status: SubmissionStatus;
  submittedAt: Date;
  estimatedOverallBand: number | null;
};

export type SubmissionDetail = {
  id: string;
  taskType: "TASK_1" | "TASK_2";
  questionType: string;
  promptText: string;
  originalText: string;
  wordCount: number;
  targetBand: number | null;
  status: SubmissionStatus;
  failureCode: string | null;
  submittedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
  analysis: {
    estimatedOverallBand: number | null;
    summaryVi: string;
    strengths: string[];
    criteriaFeedback: {
      taskResponse: string;
      logicReasoning: string;
      realismPersuasiveness: string;
      ideaDevelopment: string;
      vocabularyGrammar: string;
      nativeLikeWriting: string;
    };
    structuralWeaknesses: string[];
    rewrittenEssay: string;
    rewrittenEssayVi: string;
    vocabularyUpgrades: Array<{
      originalExpression: string;
      upgradedExpression: string;
      meaningVi: string;
    }>;
    grammarCorrections: Array<{
      sourceQuote: string;
      correctionText: string;
      correctionVi: string;
      explanationVi: string;
    }>;
    issues: Array<EssayAnalysisResult["issues"][number] & { id: string }>;
  } | null;
};

export async function listSubmissions(
  userId: string,
): Promise<SubmissionListItem[]> {
  await connectMongoose();

  const submissions = await Submission.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .select({
      taskType: 1,
      questionType: 1,
      wordCount: 1,
      status: 1,
      submittedAt: 1,
      "analysis.estimatedOverallBand": 1,
    })
    .lean();

  return submissions.map((submission) => ({
    id: submission._id.toString(),
    taskType: submission.taskType,
    questionType: submission.questionType,
    wordCount: submission.wordCount,
    status: submission.status as SubmissionStatus,
    submittedAt: submission.submittedAt,
    estimatedOverallBand:
      submission.analysis?.estimatedOverallBand ?? null,
  }));
}

export async function getSubmissionDetail(
  userId: string,
  submissionId: string,
): Promise<SubmissionDetail> {
  if (!Types.ObjectId.isValid(submissionId)) {
    throw new ResourceNotFoundError();
  }

  await connectMongoose();
  const submission = await Submission.findOne({
    _id: new Types.ObjectId(submissionId),
    userId: new Types.ObjectId(userId),
    deletedAt: null,
  })
    .lean();

  if (!submission) {
    throw new ResourceNotFoundError();
  }

  return {
    id: submission._id.toString(),
    taskType: submission.taskType as "TASK_1" | "TASK_2",
    questionType: submission.questionType,
    promptText: submission.promptText,
    originalText: submission.originalText,
    wordCount: submission.wordCount,
    targetBand: submission.targetBandSnapshot ?? null,
    status: submission.status as SubmissionStatus,
    failureCode: submission.failureCode ?? null,
    submittedAt: submission.submittedAt,
    completedAt: submission.completedAt ?? null,
    updatedAt: submission.updatedAt,
    analysis: submission.analysis
      ? {
          estimatedOverallBand:
            submission.analysis.estimatedOverallBand ?? null,
          summaryVi: submission.analysis.summaryVi,
          strengths: submission.analysis.strengths ?? [],
          criteriaFeedback: {
            taskResponse: submission.analysis.criteriaFeedback?.taskResponse ?? "",
            logicReasoning: submission.analysis.criteriaFeedback?.logicReasoning ?? "",
            realismPersuasiveness:
              submission.analysis.criteriaFeedback?.realismPersuasiveness ?? "",
            ideaDevelopment:
              submission.analysis.criteriaFeedback?.ideaDevelopment ?? "",
            vocabularyGrammar:
              submission.analysis.criteriaFeedback?.vocabularyGrammar ?? "",
            nativeLikeWriting:
              submission.analysis.criteriaFeedback?.nativeLikeWriting ?? "",
          },
          structuralWeaknesses: submission.analysis.structuralWeaknesses ?? [],
          rewrittenEssay: submission.analysis.rewrittenEssay ?? "",
          rewrittenEssayVi: submission.analysis.rewrittenEssayVi ?? "",
          vocabularyUpgrades: submission.analysis.vocabularyUpgrades ?? [],
          grammarCorrections: submission.analysis.grammarCorrections ?? [],
          issues: (submission.analysis.issues ?? []).map((issue: {
            _id: Types.ObjectId;
            scope: EssayAnalysisResult["issues"][number]["scope"];
            category: EssayAnalysisResult["issues"][number]["category"];
            subcategory: string;
            severity: EssayAnalysisResult["issues"][number]["severity"];
            impactScore: number;
            sourceQuote: string;
            explanationVi: string;
            correctionText: string;
            upgradeText?: string | null;
            confidence: number;
          }) => ({
            id: issue._id.toString(),
            scope: issue.scope,
            category: issue.category,
            subcategory: issue.subcategory,
            severity: issue.severity,
            impactScore: issue.impactScore,
            sourceQuote: issue.sourceQuote,
            explanationVi: issue.explanationVi,
            correctionText: issue.correctionText,
            upgradeText: issue.upgradeText ?? null,
            confidence: issue.confidence,
          })),
        }
      : null,
  };
}
