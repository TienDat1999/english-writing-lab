import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { CollectionDetailClient } from "@/components/collection-detail-client";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  addLessonToCollection,
  getAdminCollectionDetail,
  getAvailablePublishedLessons,
  removeLessonFromCollection,
  reorderCollectionLessons,
  updateAdminCollection,
  updateCollectionStatus,
} from "@/server/collections";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { user, authorization } = await requireAnyAdminPermission(["CONTENT_DRAFT_VIEW"]);
  const canEdit =
    authorization.permissions.has("CONTENT_DRAFT_EDIT") ||
    authorization.permissions.has("CONTENT_PUBLISH");

  const { collectionId } = await params;
  const collection = await getAdminCollectionDetail(collectionId);

  if (!collection) {
    notFound();
  }

  const availableLessons = await getAvailablePublishedLessons();

  async function updateMetadataAction(formData: FormData) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_DRAFT_EDIT"]);
    const titleVi = String(formData.get("titleVi") ?? "");
    const titleEn = String(formData.get("titleEn") ?? "");
    const slugVi = String(formData.get("slugVi") ?? "");
    const slugEn = String(formData.get("slugEn") ?? "");
    const descriptionVi = String(formData.get("descriptionVi") ?? "");
    const accessTier = (String(formData.get("accessTier") ?? "FREE")) as "FREE" | "PREMIUM";
    const visibility = (String(formData.get("visibility") ?? "PUBLIC")) as "PUBLIC" | "PRIVATE" | "UNLISTED";

    await updateAdminCollection(collectionId, {
      actorUserId: context.user.id,
      titleVi,
      titleEn,
      slugVi,
      slugEn,
      descriptionVi,
      accessTier,
      visibility,
    });

    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/collections");
  }

  async function updateStatusAction(status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_PUBLISH", "CONTENT_DRAFT_EDIT"]);
    await updateCollectionStatus({
      actorUserId: context.user.id,
      collectionId,
      status,
    });
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/collections");
  }

  async function addLessonAction(lessonId: string) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_DRAFT_EDIT"]);
    await addLessonToCollection({
      actorUserId: context.user.id,
      collectionId,
      lessonId,
    });
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/collections");
  }

  async function removeLessonAction(lessonId: string) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_DRAFT_EDIT"]);
    await removeLessonFromCollection({
      actorUserId: context.user.id,
      collectionId,
      lessonId,
    });
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/collections");
  }

  async function reorderAction(orderedLessonIds: string[]) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_DRAFT_EDIT"]);
    await reorderCollectionLessons({
      actorUserId: context.user.id,
      collectionId,
      orderedLessonIds,
    });
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/collections");
  }

  return (
    <CollectionDetailClient
      collection={collection}
      availableLessons={availableLessons}
      canEdit={canEdit}
      onUpdateMetadataAction={updateMetadataAction}
      onUpdateStatusAction={updateStatusAction}
      onAddLessonAction={addLessonAction}
      onRemoveLessonAction={removeLessonAction}
      onReorderAction={reorderAction}
    />
  );
}
