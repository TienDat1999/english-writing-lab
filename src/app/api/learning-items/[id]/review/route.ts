import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { reviewLearningItemSchema } from "@/server/learning/learning.contract";
import { reviewLearningItem } from "@/server/learning/learning.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const { rating } = reviewLearningItemSchema.parse(await request.json());
    return Response.json({ data: await reviewLearningItem(user.id, id, rating) });
  } catch (error) {
    return errorResponse(error);
  }
}
