import { z } from "zod"
import { requireUser } from "@/server/auth/session"
import { errorResponse } from "@/server/http/errors"
import { speakingSrsService } from "@/server/speaking/application/speaking-srs.service"

const saveToSrsSchema = z.object({
  sourceType: z.enum(["VOCABULARY", "GRAMMAR", "PHRASE"]),
  title: z.string().trim().min(1).max(200),
  topicText: z.string().trim().max(200).optional(),
  quizType: z
    .enum(["COLLOCATION", "TOPIC_VOCABULARY", "PARAPHRASE", "SYNONYM", "TEMPLATE"])
    .optional()
    .nullable(),
  promptText: z.string().trim().min(1).max(2000),
  answerText: z.string().trim().min(1).max(2000),
  hintVi: z.string().trim().max(2000).optional(),
  contextText: z.string().trim().max(2000).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const input = saveToSrsSchema.parse(body)

    const result = await speakingSrsService.saveItemToSrs({
      userId: user.id,
      ...input,
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
