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
