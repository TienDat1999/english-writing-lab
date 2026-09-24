import type { ReviewRating } from "../learning.contract";

import type { SrsResult, SrsState } from "./srs.types";

export interface SrsAlgorithm {
  calculate(state: SrsState, rating: ReviewRating): SrsResult;
}
