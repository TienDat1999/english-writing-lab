import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { createSubmissionSchema } from "@/server/submissions/submission.contract";
import {
  createSubmission,
  listSubmissions,
} from "@/server/submissions/submission.service";

export const maxDuration = 300;

export async function GET() {
  try {
    const user = await requireUser();
    return Response.json({ data: await listSubmissions(user.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = createSubmissionSchema.parse(await request.json());
    const submission = await createSubmission(user.id, input);

    return Response.json(
      {
        data: submission,
        statusUrl: `/api/submissions/${submission.id}`,
      },
      { status: 202 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
