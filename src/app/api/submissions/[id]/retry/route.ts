import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { retrySubmissionAnalysis } from "@/server/submissions/submission.service";

export const maxDuration = 300;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const result = await retrySubmissionAnalysis(user.id, id);
    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
