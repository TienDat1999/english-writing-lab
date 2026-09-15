import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { getParaphraseApplicationPrompt } from "@/server/learning/learning.service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    return Response.json({
      data: await getParaphraseApplicationPrompt(user.id, id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
