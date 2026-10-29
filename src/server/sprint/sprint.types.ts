export type SprintStationType = "VOCAB" | "WRITING" | "SPEAKING" | "AUDIT";

export interface VocabItem {
  term: string;
  meaningVi: string;
  exampleSentenceEn: string;
  exampleSentenceVi: string;
  collocationType?: string;
}

export interface WritingTaskData {
  taskType: "TASK_1" | "TASK_2";
  genre: "INFORMAL_LETTER" | "FORMAL_LETTER" | "PEEL_ESSAY" | "OPINION" | "DISCUSSION" | "PROS_CONS" | "PROBLEM_SOLUTION";
  timeLimitMinutes: number; // 20 hoặc 40
  title: string;
  prompt: string;
  bulletPoints?: string[];
  suggestedScaffold: string[];
}

export interface SpeakingTaskData {
  part: 1 | 2 | 3 | "FULL_MOCK";
  topic: string;
  prepTimeSeconds: number; // 0 cho Part 1, 60 cho Part 2/3
  speakTimeSeconds: number; // 120 (2p) cho Part 2, 210 (3.5p) cho Part 3
  questionsOrCueCard: string[];
  goldenTips: string;
  rescuePhrases: string[];
}

export interface SprintDayPlan {
  dayNumber: number; // 1 -> 30
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  focusBadge: string;
  dailyGoal: string;
  vocabDrill: {
    theme: string;
    items: VocabItem[];
  };
  writingTask: WritingTaskData;
  speakingTask: SpeakingTaskData;
  auditChecklist: string[];
}
