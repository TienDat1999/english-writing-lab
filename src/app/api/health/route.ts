import { connectMongoose } from "@/server/db/mongoose";
import { getAiEnv } from "@/config/ai-env";

export const maxDuration = 30;

export async function GET() {
  let databaseReady = false;
  try {
    const mongoose = await connectMongoose();
    databaseReady = mongoose.connection.readyState === 1;
  } catch {
    databaseReady = false;
  }

  let openaiReady = false;
  let openaiError: string | null = null;
  let openaiModel: string = "unknown";

  try {
    const aiEnv = getAiEnv();
    openaiModel = aiEnv.OPENAI_MODEL;
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${aiEnv.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    openaiReady = res.ok;
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      openaiError = payload?.error?.message || `HTTP ${res.status}`;
    } else {
      // Test actual chat completion with 1 token to verify model quota & billing status
      const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${aiEnv.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(8000),
      });
      openaiReady = chatRes.ok;
      if (!chatRes.ok) {
        const payload = await chatRes.json().catch(() => ({}));
        openaiError = payload?.error?.message || `Chat HTTP ${chatRes.status}`;
      }
    }
  } catch (err) {
    openaiError = err instanceof Error ? err.message : String(err);
  }

  const allOk = databaseReady && openaiReady;

  return Response.json(
    {
      status: allOk ? "ok" : "degraded",
      services: {
        mongodb: databaseReady,
        openai: openaiReady,
      },
      diagnostics: {
        openaiModel,
        openaiError,
        analysisMode: process.env.ANALYSIS_MODE || "default(inline on vercel)",
        isVercel: !!process.env.VERCEL,
      },
    },
    { status: allOk ? 200 : 503 },
  );
}

