import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { deleteLearningItem } from "@/server/learning/learning.service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    await deleteLearningItem(user.id, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
