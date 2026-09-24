import type { ReviewRating } from "../learning.contract";

export function ratingFromScore(score: number): ReviewRating {
  if (score < 50) return "AGAIN";
  if (score < 70) return "HARD";
  if (score < 90) return "GOOD";
  return "EASY";
}
