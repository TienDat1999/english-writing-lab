export type SrsState = {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  status: "NEW" | "PRACTICING" | "FAMILIAR" | "MASTERED" | "REVIEW";
};

export type SrsResult = {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  status: "NEW" | "PRACTICING" | "FAMILIAR" | "MASTERED" | "REVIEW";
};
