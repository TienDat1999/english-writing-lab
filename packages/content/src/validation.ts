import { createLessonDraftSchema, type CreateLessonDraftInput, type ExerciseDraftInput } from "./contracts";
import type { ContentLocale, LessonType, PrimarySkill } from "./constants";

const lessonTypesBySkill: Record<PrimarySkill, ReadonlySet<LessonType>> = {
  VOCABULARY: new Set(["PARAPHRASE", "SYNONYM", "COLLOCATION", "PHRASE", "ACADEMIC_VOCABULARY", "TOPIC_VOCABULARY"]),
  WRITING: new Set(["GRAMMAR_PATTERN", "SENTENCE_PATTERN", "ESSAY_STRUCTURE", "IDEA_DEVELOPMENT", "COHESION", "TASK_STRATEGY", "ERROR_CORRECTION"]),
  SPEAKING: new Set(["PRONUNCIATION", "FLUENCY", "SPOKEN_RESPONSE", "SPEAKING_VOCABULARY"]),
  LISTENING: new Set(["LISTENING_COMPREHENSION", "DICTATION", "KEYWORD_RECOGNITION", "CONNECTED_SPEECH"]),
};

const cefrOrder = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export class ContentValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.join(" "));
    this.name = "ContentValidationError";
    this.issues = issues;
  }
}

function uniqueValues(values: string[]) {
  return new Set(values).size === values.length;
}

function validateExercise(
  exercise: ExerciseDraftInput,
  lessonLocales: ContentLocale[],
  issues: string[],
) {
  const exerciseLocales = exercise.localizations.map((localization) => localization.locale);
  const answer = exercise.answerRubric.correctAnswer;
  const acceptedAnswers = exercise.answerRubric.acceptedAnswers;

  if (!uniqueValues(exerciseLocales)) issues.push(`Exercise ${exercise.position} has duplicate locales.`);
  for (const locale of lessonLocales) {
    if (!exerciseLocales.includes(locale)) issues.push(`Exercise ${exercise.position} is missing locale ${locale}.`);
  }
  if (["EXACT", "NORMALIZED"].includes(exercise.evaluationMode) && !answer) {
    issues.push(`Exercise ${exercise.position} requires a correct answer.`);
  }
  if (exercise.evaluationMode === "MULTIPLE_ACCEPTED" && acceptedAnswers.length === 0) {
    issues.push(`Exercise ${exercise.position} requires accepted answers.`);
  }
  if (["AI_RUBRIC", "HYBRID"].includes(exercise.evaluationMode) && !exercise.answerRubric.aiRubricVersion) {
    issues.push(`Exercise ${exercise.position} requires an AI rubric version.`);
  }
  if (exercise.evaluationMode === "HYBRID" && !answer && acceptedAnswers.length === 0) {
    issues.push(`Exercise ${exercise.position} requires a deterministic fallback answer.`);
  }
  if (["MEANING_CHOICE", "LISTEN_AND_CHOOSE"].includes(exercise.exerciseType) && exercise.choices.length < 2) {
    issues.push(`Exercise ${exercise.position} requires at least two choices.`);
  }
  if (exercise.exerciseType === "READ_EXPLANATION" && exercise.evaluationMode !== "NO_SCORE") {
    issues.push(`Exercise ${exercise.position} must use NO_SCORE evaluation.`);
  }
}

export function validateLessonContent(
  content: Omit<CreateLessonDraftInput, "defaultLocale" | "slugs">,
  options: { publishReady: boolean },
) {
  const issues: string[] = [];
  const locales = content.localizations.map((localization) => localization.locale);
  const positions = content.exercises.map((exercise) => String(exercise.position));

  if (!lessonTypesBySkill[content.primarySkill].has(content.lessonType)) issues.push(`${content.lessonType} is not valid for ${content.primarySkill}.`);
  if (!uniqueValues(locales)) issues.push("Lesson localizations must use unique locales.");
  if (!uniqueValues(positions)) issues.push("Exercise positions must be unique.");
  if (cefrOrder.indexOf(content.cefrLevelMin) > cefrOrder.indexOf(content.cefrLevelMax)) issues.push("CEFR minimum level cannot be higher than maximum level.");
  if (content.secondaryTopicIds.includes(content.primaryTopicId)) issues.push("Primary topic cannot also be a secondary topic.");
  if (!uniqueValues(content.secondaryTopicIds)) issues.push("Secondary topics must be unique.");
  if (!uniqueValues(content.tagCodes.map((tag) => tag.toLocaleLowerCase("en")))) issues.push("Tag codes must be unique.");
  if (content.prerequisiteLessonIds.some((id) => content.relatedLessonIds.includes(id))) issues.push("A lesson cannot be both prerequisite and related.");

  const isIelts = content.audiences.some((audience) => audience.startsWith("IELTS_"));
  if (isIelts && !content.ieltsMetadata) issues.push("IELTS lessons require IELTS metadata.");
  if (content.ieltsMetadata?.bandMin !== null && content.ieltsMetadata?.bandMin !== undefined
    && content.ieltsMetadata.bandMax !== null && content.ieltsMetadata.bandMax !== undefined
    && content.ieltsMetadata.bandMin > content.ieltsMetadata.bandMax) {
    issues.push("IELTS minimum band cannot be higher than maximum band.");
  }
  if (options.publishReady && ["SPEAKING", "LISTENING"].includes(content.primarySkill)) issues.push(`${content.primarySkill} publishing is not enabled yet.`);
  if (options.publishReady && content.exercises.length === 0) issues.push("A publishable lesson requires at least one exercise.");

  for (const localization of content.localizations) {
    if (options.publishReady && localization.shortDescription.length === 0) issues.push(`Localization ${localization.locale} requires a short description.`);
    if (options.publishReady && localization.learningObjectives.length === 0) issues.push(`Localization ${localization.locale} requires a learning objective.`);
  }
  for (const exercise of content.exercises) validateExercise(exercise, locales, issues);
  if (issues.length > 0) throw new ContentValidationError(issues);
}

export function validateNewLessonIdentity(input: CreateLessonDraftInput) {
  const issues: string[] = [];
  const slugLocales = input.slugs.map((slug) => slug.locale);
  if (!uniqueValues(slugLocales)) issues.push("Lesson slugs must use unique locales.");
  if (!slugLocales.includes(input.defaultLocale)) issues.push("Default locale requires a matching slug.");
  if (!input.localizations.some((localization) => localization.locale === input.defaultLocale)) issues.push("Default locale requires lesson content.");
  if (issues.length > 0) throw new ContentValidationError(issues);
}

export function lessonTypesForSkill(skill: PrimarySkill) {
  return [...lessonTypesBySkill[skill]];
}

export function getLessonPublishValidationIssues(input: unknown) {
  const parsed = createLessonDraftSchema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  }

  const issues: string[] = [];
  for (const validate of [
    () => validateNewLessonIdentity(parsed.data),
    () => validateLessonContent(parsed.data, { publishReady: true }),
  ]) {
    try {
      validate();
    } catch (error) {
      if (error instanceof ContentValidationError) issues.push(...error.issues);
      else throw error;
    }
  }
  return [...new Set(issues)];
}
