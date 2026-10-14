import type { ApplicationPrompt } from "./application-prompt.gateway"
import type { TranslationEvaluation } from "./translation-review.gateway"
import type { TtsVoice } from "./tts.gateway"

// Already exists in gateway.ts — re-export here for convenience
export type { AiGateway } from "./gateway"

export interface ITranslationReviewGateway {
  evaluate(input: {
    sourceVi: string
    referenceEn: string
    learnerAnswer: string
    requiredPhrase?: string
    mode?: "TRANSLATION" | "WRITING_TEMPLATE"
    writingFunctionVi?: string
  }): Promise<TranslationEvaluation>
}

export interface IApplicationPromptGateway {
  generate(input: {
    topic: string
    meaningVi: string
    phraseEn: string
    avoidedPrompts: string[]
  }): Promise<ApplicationPrompt>
}

export interface ITtsGateway {
  generateSpeech(input: {
    text: string
    voice?: TtsVoice
    model?: "tts-1" | "tts-1-hd"
    speed?: number
  }): Promise<ArrayBuffer>
}

export interface SttTranscriptionResult {
  text: string
  durationSeconds?: number
  language?: string
}

export interface ISttGateway {
  transcribeAudio(input: {
    audioBuffer: Buffer | ArrayBuffer
    mimeType: string
    filename?: string
    language?: string
    prompt?: string
  }): Promise<SttTranscriptionResult>
}

export interface SpeakingTurnContext {
  mode: "FREE_TALK" | "IELTS" | "VSTEP"
  targetLevel?: "A2" | "B1_B2" | "C1"
  topicTitle: string
  topicScenario?: string
  voicePersona?: string
  history: Array<{
    speaker: "user" | "assistant"
    text: string
  }>
  userTranscript: string
}

export interface SpeakingTurnResponse {
  replyText: string
  suggestedPhrases?: Array<{
    phrase: string
    meaningVi: string
  }>
  instantFeedbackVi?: string
  isSessionEndSuggested?: boolean
}

export interface ISpeakingCoachGateway {
  generateTurnResponse(context: SpeakingTurnContext): Promise<SpeakingTurnResponse>
}

export interface SpeakingEvaluationSessionInput {
  mode: "FREE_TALK" | "IELTS" | "VSTEP"
  topicTitle: string
  topicScenario?: string
  targetLevel?: "A2" | "B1_B2" | "C1"
  turns: Array<{
    turnNumber: number
    userTranscript: string
    aiReplyText: string
    userAudioDurationSeconds: number
  }>
  totalUserDurationSeconds: number
}

export interface ISpeakingEvaluatorGateway {
  evaluateSpeakingSession(
    input: SpeakingEvaluationSessionInput,
  ): Promise<import("../speaking/domain/speaking.types").SpeakingEvaluationReport>
}

export interface ScaffoldingInput {
  topicTitle: string
  topicScenario?: string
  currentAiPrompt: string
  targetLevel?: "A2" | "B1_B2" | "C1"
}

export interface IScaffoldingGateway {
  generateScaffoldingHint(
    input: ScaffoldingInput,
  ): Promise<import("../speaking/domain/speaking.types").ScaffoldingHintResult>
}



