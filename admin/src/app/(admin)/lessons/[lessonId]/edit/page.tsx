import { ContentValidationError } from "@draftwise/content";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { ZodError } from "zod";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { LessonEditor } from "@/components/lesson-editor";
import type { LessonEditorActionState } from "@/components/lesson-editor-types";
import { PageHeading } from "@/components/page-heading";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  getLessonEditorOptions,
  LessonEditorConflictError,
  loadLessonDraftForEditor,
  updateAdminLessonDraft,
} from "@/server/lesson-editor";

function actionError(error: unknown): LessonEditorActionState {
  if (error instanceof ContentValidationError) {
    return { status: "error", message: "Bản nháp chưa hợp lệ.", issues: error.issues };
  }
  if (error instanceof LessonEditorConflictError) {
    return { status: "error", message: error.message };
  }
  if (error instanceof ZodError) {
    return {
      status: "error",
      message: "Kiểm tra lại các trường bắt buộc.",
      issues: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }
  return { status: "error", message: "Không thể lưu bản nháp. Vui lòng thử lại." };
}

export default async function EditLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAnyAdminPermission(["CONTENT_DRAFT_EDIT"]);
  const { lessonId } = await params;
  const [value, topics, query] = await Promise.all([
    loadLessonDraftForEditor(lessonId),
    getLessonEditorOptions(),
    searchParams,
  ]);
  if (!value?.versionId || !value.revision) notFound();
  const versionId = value.versionId;

  async function saveDraft(
    _state: LessonEditorActionState,
    formData: FormData,
  ): Promise<LessonEditorActionState> {
    "use server";
    const { user } = await requireAnyAdminPermission(["CONTENT_DRAFT_EDIT"]);
    try {
      const payload = JSON.parse(String(formData.get("payload") ?? "null"));
      const result = await updateAdminLessonDraft(user.id, lessonId, versionId, {
        ...payload,
        expectedRevision: payload.revision,
      });
      revalidatePath("/lessons");
      revalidatePath(`/lessons/${lessonId}`);
      revalidatePath(`/lessons/${lessonId}/edit`);
      return { status: "success", message: `Đã lưu revision ${result.revision}.`, revision: result.revision };
    } catch (error) {
      return { ...actionError(error), revision: _state.revision };
    }
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--navy-bright)] hover:underline"
          href={`/lessons/${lessonId}`}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
          Quay lại Quy trình bài học (Workflow)
        </Link>
      </div>
      <PageHeading eyebrow="Lesson editor" title="Chỉnh sửa bản nháp" description="Mỗi lần lưu tăng revision và ghi audit. Published version không bị thay đổi trực tiếp." />
      <LessonEditor
        initialValue={value}
        mode="edit"
        savedMessage={query.saved === "created" ? "Đã tạo draft và ghi audit." : undefined}
        saveAction={saveDraft}
        topics={topics}
      />
    </>
  );
}
