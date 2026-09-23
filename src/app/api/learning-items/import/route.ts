import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/errors";
import {
  importQuickLearningItems,
  listUploadedQuizTopics,
} from "@/server/learning/learning.service";
import { parseQuickQuizCsv } from "@/server/learning/quick-import";
import { uploadedQuizTypes } from "@/server/learning/learning-item.schema";

const maxFileSize = 1024 * 1024;

function isUploadedQuizType(value: unknown): value is (typeof uploadedQuizTypes)[number] {
  return typeof value === "string" && (uploadedQuizTypes as readonly string[]).includes(value);
}

function getPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const quizType = url.searchParams.get("quizType");

    if (!isUploadedQuizType(quizType)) {
      return Response.json({ error: "QUIZ_TYPE_REQUIRED" }, { status: 400 });
    }

    const page = getPositiveInteger(url.searchParams.get("page"), 1);
    const pageSize = getPositiveInteger(url.searchParams.get("pageSize"), 6);
    const search = url.searchParams.get("search") || undefined;
    return Response.json({ data: await listUploadedQuizTopics(user.id, quizType, page, pageSize, search) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file");
    const quizType = formData.get("quizType");

    if (!(file instanceof File) || !file.name.toLocaleLowerCase("en").endsWith(".csv")) {
      return Response.json({ error: "CSV_FILE_REQUIRED" }, { status: 400 });
    }

    if (file.size === 0 || file.size > maxFileSize) {
      return Response.json({ error: "CSV_FILE_SIZE" }, { status: 400 });
    }

    if (!isUploadedQuizType(quizType)) {
      return Response.json({ error: "QUIZ_TYPE_REQUIRED" }, { status: 400 });
    }

    const input = parseQuickQuizCsv(
      await file.text(),
      quizType,
    );
    return Response.json({ data: await importQuickLearningItems(user.id, input) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("CSV_")) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return errorResponse(error);
  }
}
