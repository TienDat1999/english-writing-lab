import { requireUser } from "@/server/auth/session";
import { errorResponse, InvalidRequestError } from "@/server/http/errors";
import { enrollCollectionForUser } from "@/server/learning/enrollment.service";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { collectionSlug?: string };

    if (!body?.collectionSlug || typeof body.collectionSlug !== "string") {
      throw new InvalidRequestError("collectionSlug is required");
    }

    const result = await enrollCollectionForUser(user.id, body.collectionSlug);

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
