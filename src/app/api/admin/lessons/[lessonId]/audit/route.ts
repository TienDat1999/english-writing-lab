import { listLessonAuditHistory } from "@/server/audit/audit.service";
import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const actor = await requireUser();
    const { lessonId } = await params;
    const searchParams = new URL(request.url).searchParams;
    return Response.json(
      {
        data: await listLessonAuditHistory(actor.id, lessonId, {
          cursor: searchParams.get("cursor") ?? undefined,
          limit: searchParams.get("limit") ?? undefined,
        }),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
