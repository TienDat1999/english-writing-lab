import { requireUser } from "@/server/auth/session"
import { errorResponse } from "@/server/http/errors"
import { SpeakingQuotaService } from "@/server/speaking/application/speaking-quota.service"

export async function GET() {
  try {
    const user = await requireUser()
    const quotaService = new SpeakingQuotaService()
    const status = await quotaService.getUserQuotaStatus(user.id)
    return Response.json(status)
  } catch (error) {
    return errorResponse(error)
  }
}
