import type { LearningItemView } from "@/server/learning/learning.service";

export type Rating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export const ratingLabels: Record<Rating, string> = {
  AGAIN: "Chưa nhớ · 1 ngày",
  HARD: "Khó · ôn sớm",
  GOOD: "Nhớ được",
  EASY: "Rất dễ · giãn lịch",
};

export type SessionResultRecord = {
  item: LearningItemView;
  isCorrect: boolean;
  userDraft?: string;
  feedback?: string;
};

export type TopicHeaderInfo = {
  breadcrumbLabel: string;
  itemsCount: number;
  title: string;
  description: string;
};
