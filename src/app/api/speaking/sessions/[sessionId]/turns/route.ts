import { requireUser } from "@/server/auth/session"
import { errorResponse } from "@/server/http/errors"
import { SpeakingSessionService } from "@/server/speaking/application/speaking-session.service"

export const maxDuration = 60 // Allow up to 60s for STT + LLM + TTS pipeline

export async function POST(
  request: Request,
  props: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = await requireUser()
    const { sessionId } = await props.params

    const formData = await request.formData()
    const file = formData.get("audio")

    if (!file || !(file instanceof Blob)) {
      return Response.json(
        { error: "INVALID_REQUEST", message: "Audio file is required." },
        { status: 400 },
      )
    }

    const mimeType = file.type || "audio/webm"
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    if (audioBuffer.length < 80) {
      return Response.json(
        { error: "AUDIO_TOO_SHORT", message: "Âm thanh thu được quá ngắn hoặc không có tiếng. Vui lòng thử lại." },
        { status: 400 },
      )
    }

    const rawDuration = formData.get("durationSeconds")
    const clientDuration = rawDuration ? Number(rawDuration) : undefined

    const sessionService = new SpeakingSessionService()
    const result = await sessionService.processAudioTurn({
      sessionId,
      userId: user.id,
      audioBuffer,
      mimeType,
      clientDurationSeconds: clientDuration,
    })

    return Response.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
