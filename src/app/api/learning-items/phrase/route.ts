import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { createPhraseLearningItemSchema } from "@/server/learning/learning.contract";
import { createPhraseLearningItem } from "@/server/learning/learning.service";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = createPhraseLearningItemSchema.parse(await request.json());
    const result = await createPhraseLearningItem(user.id, input);
    return Response.json({ data: result.item }, { status: result.created ? 201 : 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
