"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  adminAddReviewComment,
  adminApproveVersion,
  adminArchiveLesson,
  adminCancelSchedule,
  adminCancelVersion,
  adminClonePublishedVersion,
  adminPublishNow,
  adminResolveComment,
  adminRestoreLesson,
  adminResumeEditing,
  adminRollback,
  adminScheduleVersion,
  adminSubmitForReview,
  adminWithdrawLesson,
  WorkflowConflictError,
  WorkflowValidationError,
} from "@/server/workflow";

export type ActionResponse = {
  success?: boolean;
  error?: string;
  issues?: string[];
  redirectUrl?: string;
};

function formatError(error: unknown): ActionResponse {
  if (error instanceof WorkflowValidationError) {
    return { error: error.message, issues: error.issues };
  }
  if (error instanceof WorkflowConflictError) {
    return { error: error.message };
  }
  if (error instanceof ZodError) {
    return {
      error: "Dữ liệu nhập vào chưa đúng định dạng.",
      issues: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  if (error instanceof Error) {
    return { error: error.message };
  }
  return { error: "Đã xảy ra lỗi không xác định. Vui lòng thử lại." };
}

function revalidateLesson(lessonId: string) {
  revalidatePath("/lessons");
  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath(`/lessons/${lessonId}/preview`);
  revalidatePath(`/lessons/${lessonId}/edit`);
  revalidatePath(`/lessons/${lessonId}/history`);
}

export async function submitForReviewAction(
  lessonId: string,
  versionId: string,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_DRAFT_EDIT"]);
  try {
    await adminSubmitForReview(user.id, versionId);
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function addReviewCommentAction(
  lessonId: string,
  versionId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_REVIEW_COMMENT"]);
  try {
    const severity = formData.get("severity");
    const message = formData.get("message");
    await adminAddReviewComment(user.id, versionId, {
      severity,
      message,
    });
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function resolveCommentAction(
  lessonId: string,
  commentId: string,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_REVIEW_COMMENT"]);
  try {
    await adminResolveComment(user.id, commentId);
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function approveVersionAction(
  lessonId: string,
  versionId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_REVIEW_APPROVE"]);
  try {
    const summary = formData.get("summary") ?? "";
    const overrideReason = formData.get("overrideReason") || null;
    await adminApproveVersion(user.id, versionId, {
      summary,
      overrideReason,
    });
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function publishNowAction(
  lessonId: string,
  versionId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_PUBLISH"]);
  try {
    const overrideReason = formData.get("overrideReason") || null;
    await adminPublishNow(user.id, versionId, {
      overrideReason,
    });
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function scheduleVersionAction(
  lessonId: string,
  versionId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_PUBLISH"]);
  try {
    const scheduledAt = formData.get("scheduledAt");
    const timezone = formData.get("timezone");
    const overrideReason = formData.get("overrideReason") || null;
    await adminScheduleVersion(user.id, versionId, {
      scheduledAt,
      timezone,
      overrideReason,
    });
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function cancelScheduleAction(
  lessonId: string,
  versionId: string,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_PUBLISH"]);
  try {
    await adminCancelSchedule(user.id, versionId);
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function resumeEditingAction(
  lessonId: string,
  versionId: string,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_DRAFT_EDIT"]);
  try {
    await adminResumeEditing(user.id, versionId);
    revalidateLesson(lessonId);
    return { success: true, redirectUrl: `/lessons/${lessonId}/edit` };
  } catch (error) {
    return formatError(error);
  }
}

export async function cancelVersionAction(
  lessonId: string,
  versionId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_DRAFT_EDIT"]);
  try {
    const reason = formData.get("reason");
    await adminCancelVersion(user.id, versionId, { reason });
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function rollbackAction(
  lessonId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_ROLLBACK"]);
  try {
    const targetVersionId = String(formData.get("targetVersionId") ?? "");
    const reason = formData.get("reason");
    await adminRollback(user.id, lessonId, targetVersionId, { reason });
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function archiveLessonAction(
  lessonId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_ARCHIVE"]);
  try {
    const reason = formData.get("reason");
    await adminArchiveLesson(user.id, lessonId, { reason });
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function restoreLessonAction(
  lessonId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_ARCHIVE"]);
  try {
    const reason = formData.get("reason");
    await adminRestoreLesson(user.id, lessonId, { reason });
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function withdrawLessonAction(
  lessonId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_WITHDRAW"]);
  try {
    const reason = formData.get("reason");
    await adminWithdrawLesson(user.id, lessonId, { reason });
    revalidateLesson(lessonId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

export async function clonePublishedVersionAction(
  lessonId: string,
): Promise<ActionResponse> {
  const { user } = await requireAnyAdminPermission(["CONTENT_DRAFT_CREATE"]);
  try {
    const result = await adminClonePublishedVersion(user.id, lessonId);
    revalidateLesson(lessonId);
    return {
      success: true,
      redirectUrl: `/lessons/${lessonId}/edit`,
    };
  } catch (error) {
    return formatError(error);
  }
}
