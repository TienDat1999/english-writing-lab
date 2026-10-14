import { revalidatePath } from "next/cache";

import { CollectionListClient } from "@/components/collection-list-client";
import { PageHeading } from "@/components/page-heading";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  createAdminCollection,
  listAdminCollections,
  updateCollectionStatus,
} from "@/server/collections";

export default async function CollectionsPage() {
  const { user, authorization } = await requireAnyAdminPermission(["CONTENT_DRAFT_VIEW"]);
  const canEdit =
    authorization.permissions.has("CONTENT_DRAFT_CREATE") ||
    authorization.permissions.has("CONTENT_DRAFT_EDIT") ||
    authorization.permissions.has("CONTENT_PUBLISH");

  const collections = await listAdminCollections();

  async function createCollectionAction(formData: FormData) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_DRAFT_CREATE"]);
    const titleVi = String(formData.get("titleVi") ?? "");
    const titleEn = String(formData.get("titleEn") ?? "");
    const slugVi = String(formData.get("slugVi") ?? "");
    const slugEn = String(formData.get("slugEn") ?? "");
    const descriptionVi = String(formData.get("descriptionVi") ?? "");
    const accessTier = (String(formData.get("accessTier") ?? "FREE")) as "FREE" | "PREMIUM";
    const visibility = (String(formData.get("visibility") ?? "PUBLIC")) as "PUBLIC" | "PRIVATE" | "UNLISTED";

    await createAdminCollection({
      actorUserId: context.user.id,
      titleVi,
      titleEn,
      slugVi,
      slugEn,
      descriptionVi,
      accessTier,
      visibility,
    });

    revalidatePath("/collections");
  }

  async function updateStatusAction(
    collectionId: string,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_PUBLISH", "CONTENT_DRAFT_EDIT"]);
    await updateCollectionStatus({
      actorUserId: context.user.id,
      collectionId,
      status,
    });
    revalidatePath("/collections");
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--line)] pb-6 mb-6">
        <PageHeading
          eyebrow="Content Curriculum"
          title="Quản lý Bộ sưu tập Bài học"
          description="Gom nhóm các bài học theo chủ đề, cấp độ hoặc lộ trình đào tạo chuyên sâu (Writing Task 2, Vocabulary Themes, v.v.)."
        />
      </div>

      <CollectionListClient
        collections={collections}
        canEdit={canEdit}
        onCreateAction={createCollectionAction}
        onUpdateStatusAction={updateStatusAction}
      />
    </>
  );
}
