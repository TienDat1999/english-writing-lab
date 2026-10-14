import { requireUser } from "@/server/auth/session"
import { errorResponse } from "@/server/http/errors"
import { SpeakingSessionService } from "@/server/speaking/application/speaking-session.service"

export const maxDuration = 60 // Extended timeout for comprehensive AI evaluation

export async function POST(
  _request: Request,
  props: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = await requireUser()
    const { sessionId } = await props.params

    const sessionService = new SpeakingSessionService()
    const result = await sessionService.evaluateSession(sessionId, user.id)

    return Response.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
