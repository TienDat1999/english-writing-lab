import { revokeStaffRoles, setStaffRoles } from "@/server/auth/authorization";
import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const actor = await requireUser();
    const { userId } = await params;
    return Response.json({
      data: await setStaffRoles(actor.id, userId, await request.json()),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const actor = await requireUser();
    const { userId } = await params;
    return Response.json({
      data: await revokeStaffRoles(actor.id, userId, await request.json()),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
