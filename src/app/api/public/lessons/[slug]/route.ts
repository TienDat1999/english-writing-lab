import { publicDetailQuerySchema } from "@/server/content/public-content.contract";
import { getPublicLessonDetail } from "@/server/content/public-content.service";
import { errorResponse } from "@/server/http/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const url = new URL(request.url);
    const query = publicDetailQuerySchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );
    const { slug } = await params;
    const data = await getPublicLessonDetail(slug, query);
    const headers = new Headers({
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
    });
    if (data.visibility === "UNLISTED") {
      headers.set("X-Robots-Tag", "noindex, nofollow");
    }

    return Response.json({ data }, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}
