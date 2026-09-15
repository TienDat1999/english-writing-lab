import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { createLearningItemSchema } from "@/server/learning/learning.contract";
import {
  createLearningItem,
  listLearningItems,
} from "@/server/learning/learning.service";

function getPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const page = getPositiveInteger(url.searchParams.get("page"), 1);
    const pageSize = getPositiveInteger(url.searchParams.get("pageSize"), 6);
    return Response.json({ data: await listLearningItems(user.id, page, pageSize) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = createLearningItemSchema.parse(await request.json());
    const result = await createLearningItem(user.id, input);
    return Response.json({ data: result.item }, { status: result.created ? 201 : 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
