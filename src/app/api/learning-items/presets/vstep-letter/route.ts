import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { importQuickLearningItems } from "@/server/learning/learning.service";
import { vstepLetterTemplatePreset } from "@/server/learning/vstep-letter-template-preset";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await importQuickLearningItems(user.id, vstepLetterTemplatePreset);

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
