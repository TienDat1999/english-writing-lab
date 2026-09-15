import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { getSubmissionDetail } from "@/server/submissions/submission.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    return Response.json({ data: await getSubmissionDetail(user.id, id) });
  } catch (error) {
    return errorResponse(error);
  }
}
