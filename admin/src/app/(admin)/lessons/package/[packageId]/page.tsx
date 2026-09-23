import { notFound } from "next/navigation";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  fastTrackPublishPackage,
  fastTrackUnpublishPackage,
  getPackageDetails,
} from "@/server/content-repository";
import { PackageDetailClient } from "./package-detail-client";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const { user } = await requireAnyAdminPermission(["CONTENT_DRAFT_VIEW"]);
  const { packageId } = await params;

  const pkg = await getPackageDetails(packageId);
  if (!pkg) {
    notFound();
  }

  async function handlePublishPackage() {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_PUBLISH", "CONTENT_DRAFT_EDIT"]);
    await fastTrackPublishPackage(context.user.id, packageId);
  }

  async function handleUnpublishPackage() {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_PUBLISH", "CONTENT_DRAFT_EDIT"]);
    await fastTrackUnpublishPackage(context.user.id, packageId);
  }

  return (
    <PackageDetailClient
      pkg={pkg}
      onPublishPackage={handlePublishPackage}
      onUnpublishPackage={handleUnpublishPackage}
    />
  );
}
