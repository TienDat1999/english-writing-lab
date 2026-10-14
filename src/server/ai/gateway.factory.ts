import { getAiEnv } from "@/config/ai-env"
import type { AiGateway } from "./gateway"
import type {
  ITranslationReviewGateway,
  IApplicationPromptGateway,
  ITtsGateway,
  ISttGateway,
  ISpeakingCoachGateway,
} from "./interfaces"
import { OpenAiGateway } from "./openai/openai-essay.gateway"
import { OpenAiTranslationReviewGateway } from "./openai/openai-translation.gateway"
import { OpenAiApplicationPromptGateway } from "./openai/openai-application-prompt.gateway"
import { OpenAiTtsGateway } from "./openai/openai-tts.gateway"
import { OpenAiSttGateway } from "./openai/openai-stt.gateway"
import { OpenAiSpeakingCoachGateway } from "./openai/openai-speaking-coach.gateway"

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

export function createSttGateway(provider: AiProvider = "openai"): ISttGateway {
  const env = getAiEnv()
  if (provider === "openai") {
    return new OpenAiSttGateway(env.OPENAI_API_KEY)
  }
  throw new Error(`Unsupported AI provider: ${provider}`)
}

export function createSpeakingCoachGateway(provider: AiProvider = "openai"): ISpeakingCoachGateway {
  const env = getAiEnv()
  if (provider === "openai") {
    return new OpenAiSpeakingCoachGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL)
  }
  throw new Error(`Unsupported AI provider: ${provider}`)
}

export function createSpeakingEvaluatorGateway(
  provider: AiProvider = "openai",
): import("./interfaces").ISpeakingEvaluatorGateway {
  const env = getAiEnv()
  if (provider === "openai") {
    const { OpenAiSpeakingEvaluatorGateway } = require("./openai/openai-speaking-evaluator.gateway")
    return new OpenAiSpeakingEvaluatorGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL)
  }
  throw new Error(`Unsupported AI provider: ${provider}`)
}

export function createScaffoldingGateway(
  provider: AiProvider = "openai",
): import("./interfaces").IScaffoldingGateway {
  const env = getAiEnv()
  if (provider === "openai") {
    const { OpenAiScaffoldingGateway } = require("./openai/openai-scaffolding.gateway")
    return new OpenAiScaffoldingGateway(env.OPENAI_API_KEY, env.OPENAI_MODEL)
  }
  throw new Error(`Unsupported AI provider: ${provider}`)
}



