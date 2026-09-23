import { getAuthorizationSnapshot } from "@/server/auth/authorization";
import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";

export async function GET() {
  try {
    const user = await requireUser();
    const authorization = await getAuthorizationSnapshot(user.id);
    return Response.json(
      {
        data: {
          userId: user.id,
          roles: [...authorization.roles],
          permissions: [...authorization.permissions],
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
