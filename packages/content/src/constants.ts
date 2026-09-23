export const primarySkills = ["VOCABULARY", "WRITING", "SPEAKING", "LISTENING"] as const;

export const lessonTypes = [
  "PARAPHRASE",
  "SYNONYM",
  "COLLOCATION",
  "PHRASE",
  "ACADEMIC_VOCABULARY",
  "TOPIC_VOCABULARY",
  "GRAMMAR_PATTERN",
  "SENTENCE_PATTERN",
  "ESSAY_STRUCTURE",
  "IDEA_DEVELOPMENT",
  "COHESION",
  "TASK_STRATEGY",
  "ERROR_CORRECTION",
  "PRONUNCIATION",
  "FLUENCY",
  "SPOKEN_RESPONSE",
  "SPEAKING_VOCABULARY",
  "LISTENING_COMPREHENSION",
  "DICTATION",
  "KEYWORD_RECOGNITION",
  "CONNECTED_SPEECH",
] as const;

export const exerciseTypes = [
  "MEANING_CHOICE",
  "TYPE_ANSWER",
  "TRANSLATE_TO_ENGLISH",
  "TRANSLATE_TO_NATIVE",
  "COMPLETE_SENTENCE",
  "BUILD_SENTENCE",
  "REWRITE_SENTENCE",
  "CORRECT_ERROR",
  "ORDER_PARTS",
  "READ_EXPLANATION",
  "RECORD_SPEECH",
  "REPEAT_AFTER_AUDIO",
  "LISTEN_AND_CHOOSE",
  "LISTEN_AND_TYPE",
  "LISTEN_AND_SUMMARIZE",
] as const;

export const evaluationModes = [
  "NO_SCORE",
  "EXACT",
  "NORMALIZED",
  "MULTIPLE_ACCEPTED",
  "AI_RUBRIC",
  "HYBRID",
] as const;

export const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const contentAudiences = [
  "GENERAL_ENGLISH",
  "IELTS_ACADEMIC",
  "IELTS_GENERAL_TRAINING",
] as const;
export const ieltsModules = ["ACADEMIC", "GENERAL_TRAINING", "BOTH"] as const;
export const ieltsSkillAreas = ["TASK_1", "TASK_2", "GENERAL_WRITING"] as const;
export const contentLocales = ["vi", "en"] as const;
export const contentAccessTiers = ["FREE", "PREMIUM"] as const;
export const contentVisibilities = ["PUBLIC", "UNLISTED", "PRIVATE"] as const;
export const taxonomyStatuses = ["ACTIVE", "DISABLED"] as const;
export const lessonPublicationStatuses = [
  "NEVER_PUBLISHED",
  "PUBLISHED",
  "ARCHIVED",
  "WITHDRAWN",
] as const;
export const lessonVersionStatuses = [
  "DRAFT",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "SUPERSEDED",
  "CANCELLED",
] as const;
export const collectionStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const reviewCommentSeverities = ["BLOCKING", "SUGGESTION"] as const;
export const publicationEventTypes = [
  "PUBLISHED",
  "ROLLED_BACK",
  "ARCHIVED",
  "RESTORED",
  "WITHDRAWN",
] as const;
export const contentOutboxStatuses = [
  "PENDING",
  "PROCESSING",
  "PUBLISHED",
  "FAILED",
] as const;

export type PrimarySkill = (typeof primarySkills)[number];
export type LessonType = (typeof lessonTypes)[number];
export type ExerciseType = (typeof exerciseTypes)[number];
export type EvaluationMode = (typeof evaluationModes)[number];
export type CefrLevel = (typeof cefrLevels)[number];
export type ContentAudience = (typeof contentAudiences)[number];
export type ContentLocale = (typeof contentLocales)[number];
export type ContentAccessTier = (typeof contentAccessTiers)[number];
export type ContentVisibility = (typeof contentVisibilities)[number];
export type LessonPublicationStatus = (typeof lessonPublicationStatuses)[number];
export type LessonVersionStatus = (typeof lessonVersionStatuses)[number];
