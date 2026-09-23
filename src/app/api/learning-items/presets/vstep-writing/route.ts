import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import { importQuickLearningItems } from "@/server/learning/learning.service";
import { vstepWritingTemplatePreset } from "@/server/learning/vstep-writing-template-preset";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await importQuickLearningItems(user.id, vstepWritingTemplatePreset);

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
