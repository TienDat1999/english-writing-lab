import { createHash } from "node:crypto";
import { Types } from "mongoose";

import { LearningItem } from "./learning-item.schema";

type SeedAnalysis = {
  rewrittenEssay?: string | null;
  rewrittenEssayVi?: string | null;
  structuralWeaknesses?: string[] | null;
  vocabularyUpgrades?: Array<{
    originalExpression: string;
    upgradedExpression: string;
    meaningVi: string;
  }> | null;
  grammarCorrections?: Array<{
    sourceQuote: string;
    correctionText: string;
    correctionVi: string;
    explanationVi: string;
  }> | null;
  translationPractice?: Array<{
    sourceVi: string;
    targetEn: string;
    focusPattern: string;
    explanationVi: string;
  }> | null;
  issues?: Array<{
    category: string;
    sourceQuote: string;
    correctionText: string;
    upgradeText?: string | null;
    explanationVi: string;
  }> | null;
};

type SeedSubmission = {
  userId: Types.ObjectId;
  submissionId: Types.ObjectId;
  promptText: string;
  originalText: string;
  analysis: SeedAnalysis;
};

type SeedItem = {
  sourceType: "VOCABULARY" | "GRAMMAR" | "ESSAY_BLUEPRINT" | "TRANSLATION";
  sourceIndex: number | null;
  title: string;
  promptText: string;
  answerText: string;
  hintVi: string;
  contextText: string;
};

function fingerprint(submissionId: Types.ObjectId, item: SeedItem) {
  return createHash("sha256")
    .update(`${submissionId}:${item.sourceType}:${item.sourceIndex ?? "root"}`)
    .digest("hex");
}

function splitSentences(text: string) {
  return (text.replace(/\s+/gu, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function buildSeedItems(input: SeedSubmission): SeedItem[] {
  const items: SeedItem[] = [];
  const { analysis } = input;

  const translationPairs = analysis.translationPractice?.length
    ? analysis.translationPractice
    : splitSentences(analysis.rewrittenEssayVi ?? "")
        .slice(0, 6)
        .map((sourceVi, index) => ({
          sourceVi,
          targetEn: splitSentences(analysis.rewrittenEssay ?? "")[index] ?? "",
          focusPattern: "Cấu trúc từ bài viết của bạn",
          explanationVi: "Tự dịch câu trước khi so sánh với phiên bản B2 gợi ý.",
        }))
        .filter((pair) => pair.targetEn);

  for (const [index, pair] of translationPairs.slice(0, 8).entries()) {
    items.push({
      sourceType: "TRANSLATION",
      sourceIndex: index,
      title: "Vietnamese to English",
      promptText: pair.sourceVi,
      answerText: pair.targetEn,
      hintVi: `${pair.focusPattern} — ${pair.explanationVi}`,
      contextText: input.promptText,
    });
  }

  if (items.length > 0) {
    return items;
  }

  if (analysis.rewrittenEssay) {
    items.push({
      sourceType: "ESSAY_BLUEPRINT",
      sourceIndex: null,
      title: "Essay blueprint",
      promptText: input.promptText
        ? `Nhớ lại bố cục và các luận điểm chính cho đề: ${input.promptText}`
        : "Nhớ lại bố cục và các luận điểm chính của bài viết mẫu này.",
      answerText: analysis.rewrittenEssay,
      hintVi: analysis.rewrittenEssayVi ?? "",
      contextText: analysis.structuralWeaknesses?.join("\n") ?? "",
    });
  }

  for (const [index, item] of (analysis.vocabularyUpgrades ?? []).slice(0, 3).entries()) {
    items.push({
      sourceType: "VOCABULARY",
      sourceIndex: index,
      title: "Academic expression",
      promptText: `Viết lại theo cách tự nhiên và học thuật hơn: “${item.originalExpression}”`,
      answerText: item.upgradedExpression,
      hintVi: item.meaningVi,
      contextText: input.originalText,
    });
  }

  for (const [index, item] of (analysis.grammarCorrections ?? []).slice(0, 3).entries()) {
    items.push({
      sourceType: "GRAMMAR",
      sourceIndex: index,
      title: "Grammar correction",
      promptText: `Sửa câu sau: “${item.sourceQuote}”`,
      answerText: item.correctionText,
      hintVi: `${item.correctionVi} ${item.explanationVi}`.trim(),
      contextText: input.originalText,
    });
  }

  if (items.length === 0) {
    for (const [index, issue] of (analysis.issues ?? []).slice(0, 5).entries()) {
      const isVocabulary = issue.category === "LEXICAL";
      items.push({
        sourceType: isVocabulary ? "VOCABULARY" : "GRAMMAR",
        sourceIndex: 1_000 + index,
        title: isVocabulary ? "Academic expression" : "Writing correction",
        promptText: isVocabulary
          ? `Viết lại tự nhiên hơn: “${issue.sourceQuote}”`
          : `Sửa phần sau: “${issue.sourceQuote}”`,
        answerText: issue.upgradeText || issue.correctionText,
        hintVi: issue.explanationVi,
        contextText: input.originalText,
      });
    }
  }

  return items;
}

export async function seedLearningItems(input: SeedSubmission) {
  const items = buildSeedItems(input);

  if (items.length === 0) {
    return 0;
  }

  const result = await LearningItem.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: {
          userId: input.userId,
          fingerprint: fingerprint(input.submissionId, item),
        },
        update: {
          $setOnInsert: {
            userId: input.userId,
            sourceSubmissionId: input.submissionId,
            sourceType: item.sourceType,
            sourceIndex: item.sourceIndex,
            fingerprint: fingerprint(input.submissionId, item),
            title: item.title,
            promptText: item.promptText,
            answerText: item.answerText,
            hintVi: item.hintVi,
            contextText: item.contextText,
            nextReviewAt: new Date(),
          },
          $set: { deletedAt: null },
        },
        upsert: true,
      },
    })),
  );

  return result.upsertedCount;
}
