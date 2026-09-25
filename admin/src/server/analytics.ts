import "server-only";

import { getDatabaseEnv } from "./env";
import { getMongoClient } from "./mongodb";

export type AdminAnalyticsData = {
  overview: {
    totalUsers: number;
    newUsers7d: number;
    newUsers30d: number;
    totalSubmissions: number;
    completedSubmissions: number;
    failedSubmissions: number;
    totalLearningItems: number;
    totalReviewAttempts: number;
    publishedLessons: number;
    totalLessons: number;
  };
  writingAndScore: {
    avgOverallBand: number;
    avgWordCount: number;
    task1Count: number;
    task2Count: number;
    bandDistribution: Array<{
      range: string;
      label: string;
      count: number;
      percentage: number;
    }>;
  };
  commonIssues: {
    categoryBreakdown: Array<{
      category: string;
      label: string;
      count: number;
      percentage: number;
    }>;
    topSubcategories: Array<{
      category: string;
      subcategory: string;
      count: number;
      percentage: number;
    }>;
  };
  aiPerformance: {
    successRate: number;
    avgLatencySeconds: number;
    completedCount: number;
    failedCount: number;
    queuedOrProcessingCount: number;
    modelsUsed: Array<{
      modelName: string;
      count: number;
    }>;
  };
  spacedRepetition: {
    masteryDistribution: Array<{
      status: string;
      label: string;
      count: number;
      percentage: number;
    }>;
    ratingDistribution: Array<{
      rating: string;
      label: string;
      count: number;
      percentage: number;
    }>;
  };
  dailyTrends: Array<{
    date: string;
    dayLabel: string;
    submissionCount: number;
    reviewCount: number;
    newUserCount: number;
  }>;
};

const categoryLabels: Record<string, string> = {
  GRAMMAR: "Ngữ pháp (Grammar)",
  LEXICAL: "Từ vựng (Lexical Resource)",
  TASK_RESPONSE: "Đáp ứng yêu cầu đề (Task Response)",
  COHERENCE: "Mạch lạc & Liên kết (Coherence & Cohesion)",
  SPELLING: "Chính tả (Spelling)",
  PUNCTUATION: "Dấu câu (Punctuation)",
};

const masteryLabels: Record<string, string> = {
  NEW: "Mới tạo",
  PRACTICING: "Đang luyện tập",
  FAMILIAR: "Đã quen thuộc",
  MASTERED: "Đã thành thạo",
  REVIEW: "Cần ôn tập lại",
};

const ratingLabels: Record<string, string> = {
  AGAIN: "Chưa nhớ (Again)",
  HARD: "Khó (Hard)",
  GOOD: "Tốt (Good)",
  EASY: "Rất dễ (Easy)",
};

export async function getAdminAnalyticsData(): Promise<AdminAnalyticsData> {
  const client = getMongoClient();
  const db = client.db(getDatabaseEnv().databaseName);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1. Overview counts
  const [
    totalUsers,
    newUsers7d,
    newUsers30d,
    totalSubmissions,
    submissionsByStatus,
    totalLearningItems,
    totalReviewAttempts,
    publishedLessons,
    totalLessons,
  ] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("users").countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    db.collection("users").countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    db.collection("submissions").countDocuments({ deletedAt: null }),
    db.collection("submissions").aggregate<{ _id: string; count: number }>([
      { $match: { deletedAt: null } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).toArray(),
    db.collection("learning_items").countDocuments({ deletedAt: null }),
    db.collection("review_attempts").countDocuments(),
    db.collection("lessons").countDocuments({ publicationStatus: "PUBLISHED" }),
    db.collection("lessons").countDocuments(),
  ]);

  const statusMap = new Map<string, number>();
  for (const item of submissionsByStatus) {
    statusMap.set(item._id, item.count);
  }
  const completedSubmissions = statusMap.get("COMPLETED") ?? 0;
  const failedSubmissions = statusMap.get("FAILED") ?? 0;
  const queuedOrProcessingCount = (statusMap.get("QUEUED") ?? 0) + (statusMap.get("ANALYZING") ?? 0);

  // 2. Writing & Score Statistics
  const writingAgg = await db.collection("submissions").aggregate<{
    avgOverallBand: number;
    avgWordCount: number;
    task1Count: number;
    task2Count: number;
    bandUnder5: number;
    band5To55: number;
    band6To65: number;
    band7To75: number;
    band8Plus: number;
  }>([
    { $match: { status: "COMPLETED", deletedAt: null } },
    {
      $group: {
        _id: null,
        avgOverallBand: { $avg: "$analysis.estimatedOverallBand" },
        avgWordCount: { $avg: "$wordCount" },
        task1Count: {
          $sum: { $cond: [{ $eq: ["$taskType", "TASK_1"] }, 1, 0] },
        },
        task2Count: {
          $sum: { $cond: [{ $eq: ["$taskType", "TASK_2"] }, 1, 0] },
        },
        bandUnder5: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$analysis.estimatedOverallBand", null] },
                  { $lt: ["$analysis.estimatedOverallBand", 5.0] },
                ],
              },
              1,
              0,
            ],
          },
        },
        band5To55: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$analysis.estimatedOverallBand", 5.0] },
                  { $lt: ["$analysis.estimatedOverallBand", 6.0] },
                ],
              },
              1,
              0,
            ],
          },
        },
        band6To65: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$analysis.estimatedOverallBand", 6.0] },
                  { $lt: ["$analysis.estimatedOverallBand", 7.0] },
                ],
              },
              1,
              0,
            ],
          },
        },
        band7To75: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$analysis.estimatedOverallBand", 7.0] },
                  { $lt: ["$analysis.estimatedOverallBand", 8.0] },
                ],
              },
              1,
              0,
            ],
          },
        },
        band8Plus: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$analysis.estimatedOverallBand", null] },
                  { $gte: ["$analysis.estimatedOverallBand", 8.0] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]).toArray();

  const writingStats = writingAgg[0] ?? {
    avgOverallBand: 0,
    avgWordCount: 0,
    task1Count: 0,
    task2Count: 0,
    bandUnder5: 0,
    band5To55: 0,
    band6To65: 0,
    band7To75: 0,
    band8Plus: 0,
  };

  const totalScored = completedSubmissions || 1;
  const bandDistribution = [
    {
      range: "< 5.0",
      label: "Cơ bản / Cần cải thiện",
      count: writingStats.bandUnder5,
      percentage: Math.round((writingStats.bandUnder5 / totalScored) * 100),
    },
    {
      range: "5.0 - 5.5",
      label: "Trung bình (Modest)",
      count: writingStats.band5To55,
      percentage: Math.round((writingStats.band5To55 / totalScored) * 100),
    },
    {
      range: "6.0 - 6.5",
      label: "Khá (Competent)",
      count: writingStats.band6To65,
      percentage: Math.round((writingStats.band6To65 / totalScored) * 100),
    },
    {
      range: "7.0 - 7.5",
      label: "Tốt (Good)",
      count: writingStats.band7To75,
      percentage: Math.round((writingStats.band7To75 / totalScored) * 100),
    },
    {
      range: "8.0+",
      label: "Xuất sắc (Very Good)",
      count: writingStats.band8Plus,
      percentage: Math.round((writingStats.band8Plus / totalScored) * 100),
    },
  ];

  // 3. Common Issues Aggregation
  const [issuesCategoryAgg, issuesSubcategoryAgg] = await Promise.all([
    db.collection("submissions").aggregate<{ _id: string; count: number }>([
      { $match: { status: "COMPLETED", deletedAt: null } },
      { $unwind: "$analysis.issues" },
      { $group: { _id: "$analysis.issues.category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),
    db.collection("submissions").aggregate<{
      _id: { category: string; subcategory: string };
      count: number;
    }>([
      { $match: { status: "COMPLETED", deletedAt: null } },
      { $unwind: "$analysis.issues" },
      {
        $group: {
          _id: {
            category: "$analysis.issues.category",
            subcategory: "$analysis.issues.subcategory",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]).toArray(),
  ]);

  const totalIssuesCount = issuesCategoryAgg.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const categoryBreakdown = issuesCategoryAgg.map((item) => ({
    category: item._id,
    label: categoryLabels[item._id] || item._id,
    count: item.count,
    percentage: Math.round((item.count / totalIssuesCount) * 100),
  }));

  const topSubcategories = issuesSubcategoryAgg.map((item) => ({
    category: item._id.category,
    subcategory: item._id.subcategory,
    count: item.count,
    percentage: Math.round((item.count / totalIssuesCount) * 100),
  }));

  // 4. AI Performance & Latency
  const latencyAgg = await db.collection("submissions").aggregate<{
    avgLatencyMs: number;
  }>([
    {
      $match: {
        status: "COMPLETED",
        submittedAt: { $ne: null },
        completedAt: { $ne: null },
        deletedAt: null,
      },
    },
    {
      $project: {
        latencyMs: { $subtract: ["$completedAt", "$submittedAt"] },
      },
    },
    {
      $match: {
        latencyMs: { $gte: 0, $lte: 300000 }, // filter out abnormal outliers > 5 mins
      },
    },
    {
      $group: {
        _id: null,
        avgLatencyMs: { $avg: "$latencyMs" },
      },
    },
  ]).toArray();

  const avgLatencySeconds = latencyAgg[0]?.avgLatencyMs
    ? Math.round((latencyAgg[0].avgLatencyMs / 1000) * 10) / 10
    : 0;

  const totalFinishedAttempts = completedSubmissions + failedSubmissions;
  const successRate = totalFinishedAttempts > 0
    ? Math.round((completedSubmissions / totalFinishedAttempts) * 1000) / 10
    : 100;

  const modelsAgg = await db.collection("submissions").aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { "analysis.modelName": { $ne: null }, deletedAt: null } },
    { $group: { _id: "$analysis.modelName", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();

  const modelsUsed = modelsAgg.map((m) => ({
    modelName: m._id || "Default Model",
    count: m.count,
  }));

  // 5. Spaced Repetition Analytics
  const [masteryAgg, ratingsAgg] = await Promise.all([
    db.collection("learning_items").aggregate<{ _id: string; count: number }>([
      { $match: { deletedAt: null } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).toArray(),
    db.collection("review_attempts").aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]).toArray(),
  ]);

  const totalMasteryItems = totalLearningItems || 1;
  const masteryDistribution = ["NEW", "PRACTICING", "FAMILIAR", "MASTERED", "REVIEW"].map((status) => {
    const found = masteryAgg.find((m) => m._id === status);
    const count = found?.count ?? 0;
    return {
      status,
      label: masteryLabels[status] || status,
      count,
      percentage: Math.round((count / totalMasteryItems) * 100),
    };
  });

  const totalRatingsCount = totalReviewAttempts || 1;
  const ratingDistribution = ["AGAIN", "HARD", "GOOD", "EASY"].map((rating) => {
    const found = ratingsAgg.find((r) => r._id === rating);
    const count = found?.count ?? 0;
    return {
      rating,
      label: ratingLabels[rating] || rating,
      count,
      percentage: Math.round((count / totalRatingsCount) * 100),
    };
  });

  // 6. Daily Activity Trends (Last 14 days)
  const [dailySubmissions, dailyReviews, dailyUsers] = await Promise.all([
    db.collection("submissions").aggregate<{ _id: string; count: number }>([
      {
        $match: {
          createdAt: { $gte: fourteenDaysAgo },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]).toArray(),
    db.collection("review_attempts").aggregate<{ _id: string; count: number }>([
      {
        $match: {
          reviewedAt: { $gte: fourteenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$reviewedAt" } },
          count: { $sum: 1 },
        },
      },
    ]).toArray(),
    db.collection("users").aggregate<{ _id: string; count: number }>([
      {
        $match: {
          createdAt: { $gte: fourteenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]).toArray(),
  ]);

  const subMap = new Map<string, number>();
  for (const item of dailySubmissions) subMap.set(item._id, item.count);

  const revMap = new Map<string, number>();
  for (const item of dailyReviews) revMap.set(item._id, item.count);

  const userMap = new Map<string, number>();
  for (const item of dailyUsers) userMap.set(item._id, item.count);

  const dailyTrends: AdminAnalyticsData["dailyTrends"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
    dailyTrends.push({
      date: dateStr,
      dayLabel,
      submissionCount: subMap.get(dateStr) ?? 0,
      reviewCount: revMap.get(dateStr) ?? 0,
      newUserCount: userMap.get(dateStr) ?? 0,
    });
  }

  return {
    overview: {
      totalUsers,
      newUsers7d,
      newUsers30d,
      totalSubmissions,
      completedSubmissions,
      failedSubmissions,
      totalLearningItems,
      totalReviewAttempts,
      publishedLessons,
      totalLessons,
    },
    writingAndScore: {
      avgOverallBand: Math.round(writingStats.avgOverallBand * 10) / 10,
      avgWordCount: Math.round(writingStats.avgWordCount),
      task1Count: writingStats.task1Count,
      task2Count: writingStats.task2Count,
      bandDistribution,
    },
    commonIssues: {
      categoryBreakdown,
      topSubcategories,
    },
    aiPerformance: {
      successRate,
      avgLatencySeconds,
      completedCount: completedSubmissions,
      failedCount: failedSubmissions,
      queuedOrProcessingCount,
      modelsUsed,
    },
    spacedRepetition: {
      masteryDistribution,
      ratingDistribution,
    },
    dailyTrends,
  };
}
