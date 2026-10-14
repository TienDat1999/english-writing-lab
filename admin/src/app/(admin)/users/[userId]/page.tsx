import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { UserDetailClient } from "@/components/user-detail-client";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  activateUser,
  getAdminUserDetail,
  getEnrollmentOptions,
  manualEnrollCollection,
  manualEnrollLesson,
  resetUserProgress,
  retryUserSubmission,
  suspendUser,
} from "@/server/users";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { user, authorization } = await requireAnyAdminPermission([
    "SUPPORT_CASE_HANDLE",
    "STAFF_ROLE_MANAGE",
  ]);

  const canManage =
    authorization.permissions.has("SUPPORT_CASE_HANDLE") ||
    authorization.permissions.has("STAFF_ROLE_MANAGE");

  const { userId } = await params;
  const detail = await getAdminUserDetail(userId);

  if (!detail) {
    notFound();
  }

  const enrollmentOptions = await getEnrollmentOptions();

  async function handleSuspend(reason: string) {
    "use server";
    const context = await requireAnyAdminPermission(["SUPPORT_CASE_HANDLE", "STAFF_ROLE_MANAGE"]);
    await suspendUser({
      actorUserId: context.user.id,
      targetUserId: userId,
      reason,
    });
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");
  }

  async function handleActivate(reason: string) {
    "use server";
    const context = await requireAnyAdminPermission(["SUPPORT_CASE_HANDLE", "STAFF_ROLE_MANAGE"]);
    await activateUser({
      actorUserId: context.user.id,
      targetUserId: userId,
      reason,
    });
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");
  }

  async function handleEnrollLesson(lessonId: string, reason: string) {
    "use server";
    const context = await requireAnyAdminPermission(["SUPPORT_CASE_HANDLE", "STAFF_ROLE_MANAGE"]);
    await manualEnrollLesson({
      actorUserId: context.user.id,
      targetUserId: userId,
      lessonId,
      reason,
    });
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");
  }

  async function handleEnrollCollection(collectionId: string, reason: string) {
    "use server";
    const context = await requireAnyAdminPermission(["SUPPORT_CASE_HANDLE", "STAFF_ROLE_MANAGE"]);
    await manualEnrollCollection({
      actorUserId: context.user.id,
      targetUserId: userId,
      collectionId,
      reason,
    });
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");
  }

  async function handleResetProgress(
    topicText: string | undefined,
    mode: "FRESH_SRS" | "REMOVE",
    reason: string,
  ) {
    "use server";
    const context = await requireAnyAdminPermission(["SUPPORT_CASE_HANDLE", "STAFF_ROLE_MANAGE"]);
    await resetUserProgress({
      actorUserId: context.user.id,
      targetUserId: userId,
      topicText,
      mode,
      reason,
    });
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");
  }

  async function handleRetrySubmission(submissionId: string, reason: string) {
    "use server";
    const context = await requireAnyAdminPermission(["SUPPORT_CASE_HANDLE", "STAFF_ROLE_MANAGE"]);
    await retryUserSubmission({
      actorUserId: context.user.id,
      targetUserId: userId,
      submissionId,
      reason,
    });
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");
  }

  return (
    <UserDetailClient
      detail={detail}
      enrollmentOptions={enrollmentOptions}
      canManage={canManage}
      onSuspendAction={handleSuspend}
      onActivateAction={handleActivate}
      onEnrollLessonAction={handleEnrollLesson}
      onEnrollCollectionAction={handleEnrollCollection}
      onResetProgressAction={handleResetProgress}
      onRetrySubmissionAction={handleRetrySubmission}
    />
  );
}
