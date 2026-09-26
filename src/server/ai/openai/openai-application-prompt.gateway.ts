import { z } from "zod";
import type { IApplicationPromptGateway } from "../interfaces";
import {
  APPLICATION_PROMPT_JSON_SCHEMA,
  buildApplicationPromptInstructions,
  buildApplicationPromptUserContent,
} from "../prompts/application-prompt.prompt";
import { readOutputText, type OpenAiResponse } from "./openai-response.helper";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const applicationPromptSchema = z.object({
  promptVi: z.string().min(10).max(300),
  referenceEn: z.string().min(10).max(400),
});

export type ApplicationPrompt = z.infer<typeof applicationPromptSchema>;

export class OpenAiApplicationPromptGateway implements IApplicationPromptGateway {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generate(input: {
    topic: string;
    meaningVi: string;
    phraseEn: string;
    avoidedPrompts: string[];
  }): Promise<ApplicationPrompt> {
    const instructions = buildApplicationPromptInstructions(input);
    const userContent = buildApplicationPromptUserContent(input);

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        max_output_tokens: 500,
        instructions,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: userContent,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "application_prompt",
            strict: true,
            schema: APPLICATION_PROMPT_JSON_SCHEMA,
          },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const payload = (await response.json()) as OpenAiResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `OpenAI request failed with ${response.status}`);
    }

    return applicationPromptSchema.parse(JSON.parse(readOutputText(payload)));
  }
}

// Backward-compat alias
export { OpenAiApplicationPromptGateway as ApplicationPromptGateway };

