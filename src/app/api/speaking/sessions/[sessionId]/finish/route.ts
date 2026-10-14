import { requireUser } from "@/server/auth/session"
import { errorResponse } from "@/server/http/errors"
import { SpeakingSessionService } from "@/server/speaking/application/speaking-session.service"

export async function POST(
  _request: Request,
  props: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = await requireUser()
    const { sessionId } = await props.params

    const sessionService = new SpeakingSessionService()
    const result = await sessionService.finishSession(sessionId, user.id)

    return Response.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
