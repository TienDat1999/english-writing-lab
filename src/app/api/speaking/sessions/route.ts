import { z } from "zod"
import { requireUser } from "@/server/auth/session"
import { errorResponse } from "@/server/http/errors"
import { SpeakingSessionService } from "@/server/speaking/application/speaking-session.service"

const createSessionSchema = z.object({
  mode: z.enum(["FREE_TALK", "IELTS", "VSTEP"]).default("FREE_TALK"),
  topicTitle: z.string().trim().min(1).max(200),
  topicScenario: z.string().trim().max(1000).optional(),
  targetLevel: z.enum(["A2", "B1_B2", "C1"]).default("B1_B2"),
  voicePersona: z.string().default("nova"),
  speechRate: z.number().min(0.5).max(2.0).default(1.0),
  examPart: z.enum(["PART_1", "PART_2", "PART_3", "FULL_TEST"]).optional(),
  cueCard: z
    .object({
      topic: z.string(),
      bulletPoints: z.array(z.string()),
      followUpQuestions: z.array(z.string()).optional(),
    })
    .optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)))
    const skip = Math.max(0, Number(searchParams.get("skip") || 0))

    const sessionService = new SpeakingSessionService()
    const sessions = await sessionService.listUserSessions(user.id, limit, skip)
    return Response.json({ sessions })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const input = createSessionSchema.parse(body)

    const sessionService = new SpeakingSessionService()
    const session = await sessionService.startSession({
      userId: user.id,
      ...input,
    })

    return Response.json(session, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
