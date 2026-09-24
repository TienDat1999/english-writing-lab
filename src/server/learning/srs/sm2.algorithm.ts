import type { ReviewRating } from "../learning.contract";

import type { SrsAlgorithm } from "./srs-algorithm.interface";
import type { SrsResult, SrsState } from "./srs.types";

export class Sm2Algorithm implements SrsAlgorithm {
  calculate(state: SrsState, rating: ReviewRating): SrsResult {
    const previousInterval = state.intervalDays;
    let repetitions = state.repetitions + 1;
    let easeFactor = state.easeFactor;
    let intervalDays: number;

    if (rating === "AGAIN") {
      repetitions = 0;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      intervalDays = 1;
    } else if (rating === "HARD") {
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      intervalDays = Math.max(1, Math.round(Math.max(1, previousInterval) * 1.2));
    } else if (rating === "EASY") {
      easeFactor += 0.15;
      intervalDays = repetitions === 1
        ? 3
        : Math.max(4, Math.round(Math.max(1, previousInterval) * (easeFactor + 0.3)));
    } else {
      intervalDays = repetitions === 1
        ? 1
        : repetitions === 2
          ? 3
          : Math.max(4, Math.round(Math.max(1, previousInterval) * easeFactor));
    }

    const status = rating === "AGAIN"
      ? "REVIEW"
      : repetitions >= 6
        ? "MASTERED"
        : repetitions >= 3
          ? "FAMILIAR"
          : "PRACTICING";

    return { repetitions, easeFactor, intervalDays, status } as const;
  }
}
