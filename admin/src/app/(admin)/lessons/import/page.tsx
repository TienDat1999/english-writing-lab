import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { CSVImporterClient } from "@/components/csv-importer-client";
import { PageHeading } from "@/components/page-heading";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  importCSVData,
  previewCSVData,
  type ContentKind,
} from "@/server/csv-importer";

export default async function ImportLessonsPage() {
  await requireAnyAdminPermission(["CONTENT_DRAFT_CREATE"]);

  async function handlePreviewAction(csvText: string, kind?: ContentKind) {
    "use server";
    await requireAnyAdminPermission(["CONTENT_DRAFT_CREATE"]);
    return await previewCSVData(csvText, kind);
  }

  async function handleImportAction(csvText: string, kind?: ContentKind) {
    "use server";
    const { user } = await requireAnyAdminPermission(["CONTENT_DRAFT_CREATE"]);
    const result = await importCSVData(user.id, csvText, kind);
    revalidatePath("/lessons");
    revalidatePath("/categories");
    return result;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeading
          eyebrow="Content Automation"
          title="Import Bài học từ File CSV"
          description="Tải lên dữ liệu bảng tính chứa danh sách Từ vựng, Từ đồng nghĩa, Collocations, Paraphrase hoặc Templates để tự động tạo hàng loạt bài học và bài tập trắc nghiệm."
        />
        <Link
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-[var(--ink)] hover:bg-slate-50 transition"
          href="/lessons"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          Quay lại danh sách
        </Link>
      </div>

      <CSVImporterClient
        onImport={handleImportAction}
        onPreview={handlePreviewAction}
      />
    </>
  );
}
