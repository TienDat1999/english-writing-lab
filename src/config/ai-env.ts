import "server-only";

import { z } from "zod";

const aiEnvSchema = z.object({
  OPENAI_API_KEY: z
    .string()
    .min(1)
    .transform((val) => val.trim().replace(/^["']|["']$/g, "")),
  OPENAI_MODEL: z
    .string()
    .min(1)
    .default("gpt-4o-mini")
    .transform((val) => val.trim().replace(/^["']|["']$/g, "")),
});

export function getAiEnv() {
  return aiEnvSchema.parse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
  });
}
