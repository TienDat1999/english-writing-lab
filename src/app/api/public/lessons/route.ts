import { errorResponse } from "@/server/http/errors";
import { publicCatalogQuerySchema } from "@/server/content/public-content.contract";
import { listPublicLessons } from "@/server/content/public-content.service";

const cacheHeaders = {
  "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=600",
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = publicCatalogQuerySchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );
    return Response.json(
      { data: await listPublicLessons(query) },
      { headers: cacheHeaders },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
