import { requireUser } from "@/server/auth/session";
import { errorResponse, InvalidRequestError } from "@/server/http/errors";
import { enrollLessonForUser } from "@/server/learning/enrollment.service";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { lessonSlug?: string };

    if (!body?.lessonSlug || typeof body.lessonSlug !== "string") {
      throw new InvalidRequestError("lessonSlug is required");
    }

    const result = await enrollLessonForUser(user.id, body.lessonSlug);

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
