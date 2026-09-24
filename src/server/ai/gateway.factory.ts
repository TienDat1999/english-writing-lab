import { getAiEnv } from "@/config/ai-env"
import type { AiGateway } from "./gateway"
import type { ITranslationReviewGateway, IApplicationPromptGateway, ITtsGateway } from "./interfaces"
import { OpenAiGateway } from "./openai/openai-essay.gateway"
import { OpenAiTranslationReviewGateway } from "./openai/openai-translation.gateway"
import { OpenAiApplicationPromptGateway } from "./openai/openai-application-prompt.gateway"
import { OpenAiTtsGateway } from "./openai/openai-tts.gateway"

export type AiProvider = "openai"

export function createAiGateway(provider: AiProvider = "openai"): AiGateway {
  const env = getAiEnv()
  if (provider === "openai") {
    return new OpenAiGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL)
  }
  throw new Error(`Unsupported AI provider: ${provider}`)
}

export function createTranslationGateway(provider: AiProvider = "openai"): ITranslationReviewGateway {
  const env = getAiEnv()
  if (provider === "openai") {
    return new OpenAiTranslationReviewGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL)
  }
  throw new Error(`Unsupported AI provider: ${provider}`)
}

export function createApplicationPromptGateway(provider: AiProvider = "openai"): IApplicationPromptGateway {
  const env = getAiEnv()
  if (provider === "openai") {
    return new OpenAiApplicationPromptGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL)
  }
  throw new Error(`Unsupported AI provider: ${provider}`)
}

export function createTtsGateway(provider: AiProvider = "openai"): ITtsGateway {
  const env = getAiEnv()
  if (provider === "openai") {
    return new OpenAiTtsGateway(env.OPENAI_API_KEY)
  }
  throw new Error(`Unsupported AI provider: ${provider}`)
}
