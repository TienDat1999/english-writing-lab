import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { evaluateTranslationSchema } from "@/server/learning/learning.contract";
import { evaluateParaphraseApplicationAttempt } from "@/server/learning/learning.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const { learnerAnswer } = evaluateTranslationSchema.parse(await request.json());
    return Response.json({
      data: await evaluateParaphraseApplicationAttempt(user.id, id, learnerAnswer),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
