import { requireUser } from "@/server/auth/session"
import { errorResponse } from "@/server/http/errors"
import { SpeakingSessionService } from "@/server/speaking/application/speaking-session.service"

export async function GET(
  _request: Request,
  props: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = await requireUser()
    const { sessionId } = await props.params

    const sessionService = new SpeakingSessionService()
    const session = await sessionService.getSession(sessionId, user.id)

    if (!session) {
      return Response.json({ error: "NOT_FOUND", message: "Session not found." }, { status: 404 })
    }

    return Response.json(session)
  } catch (error) {
    return errorResponse(error)
  }
}
