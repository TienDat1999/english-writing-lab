export type SpeakingMode = "FREE_TALK" | "IELTS" | "VSTEP"
export type TargetLevel = "A2" | "B1_B2" | "C1"
export type SpeakingSessionStatus = "IN_PROGRESS" | "COMPLETED" | "EXPIRED"

export interface SpeakingTurn {
  id: string
  turnNumber: number
  userAudioDurationSeconds: number
  userTranscript: string
  aiReplyText: string
  aiAudioBase64?: string
  instantFeedbackVi?: string
  suggestedPhrases?: Array<{
    phrase: string
    meaningVi: string
  }>
  createdAt: Date
}

export interface GrammarBreakdownItem {
  originalSentence: string
  correctedSentence: string
  nativeUpgradeSentence: string
  explanationVi: string
}

export interface VocabHighlightItem {
  wordOrPhrase: string
  cefrLevel: string // e.g. "B2", "C1"
  meaningVi: string
  contextQuote: string
}

export interface CriterionScore {
  score: number // e.g. 7.5 or 85
  bandScale: string // e.g. "9.0" or "100"
  feedbackVi: string
  keyStrengthsVi: string[]
  improvementAreasVi: string[]
}

export interface SpeakingEvaluationReport {
  overallScore: number
  bandScale: string
  summaryVi: string
  wpm: number // Words per minute
  hesitationCount: number // Count of filler words (um, ah, like)
  criteria: {
    fluencyAndCoherence: CriterionScore
    lexicalResource: CriterionScore
    grammaticalRange: CriterionScore
    pronunciationHint: CriterionScore
  }
  grammarBreakdown: GrammarBreakdownItem[]
  vocabHighlights: VocabHighlightItem[]
  generatedAt: Date
}

export type ExamPart = "PART_1" | "PART_2" | "PART_3" | "FULL_TEST"

export interface CueCardData {
  topic: string
  bulletPoints: string[]
  followUpQuestions?: string[]
}

export interface ScaffoldingHintResult {
  idea: string
  usefulCollocations: Array<{
    phrase: string
    meaningVi: string
  }>
  sentenceStarter: string
}

export interface SpeakingSessionDomain {
  id: string
  userId: string
  mode: SpeakingMode
  examPart?: ExamPart
  cueCard?: CueCardData
  hintsUsedCount: number
  topicTitle: string
  topicScenario?: string
  targetLevel: TargetLevel
  voicePersona: string
  speechRate: number
  status: SpeakingSessionStatus
  turns: SpeakingTurn[]
  totalUserDurationSeconds: number
  evaluationReport?: SpeakingEvaluationReport
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface UserDailyQuotaDomain {
  userId: string
  dateKey: string // YYYY-MM-DD
  usedAudioSeconds: number
  maxAudioSeconds: number
  isUnlimited: boolean
}


