import { z } from "zod";
import { getAiEnv } from "@/config/ai-env";
import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { TtsGateway, TTS_VOICES } from "@/server/ai/tts.gateway";

export const maxDuration = 60;

const speechRequestSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  voice: z.enum(TTS_VOICES).default("nova"),
  speed: z.number().min(0.25).max(4.0).default(1.0),
});

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    const { text, voice, speed } = speechRequestSchema.parse(body);

    const env = getAiEnv();
    const gateway = new TtsGateway(env.OPENAI_API_KEY);
    const audioBuffer = await gateway.generateSpeech({ text, voice, speed });

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
