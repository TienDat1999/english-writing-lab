import {
  ContentValidationError,
  type CreateLessonDraftInput,
} from "@draftwise/content";
import { ArrowLeft01Icon, PlusSignIcon, SparklesIcon, Tag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { LessonEditor } from "@/components/lesson-editor";
import type { LessonEditorActionState } from "@/components/lesson-editor-types";
import { PageHeading } from "@/components/page-heading";
import { requireAnyAdminPermission } from "@/server/admin-access";
import { createAdminLessonDraft, getLessonEditorOptions } from "@/server/lesson-editor";
import { createCategory, createTopic, listTaxonomy } from "@/server/taxonomy";

function actionError(error: unknown): LessonEditorActionState {
  if (error instanceof ContentValidationError) {
    return { status: "error", message: "Bản nháp chưa hợp lệ.", issues: error.issues };
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

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item-" + Date.now();
}

function codeify(text: string) {
  return text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "CODE_" + Date.now();
}

export default async function NewLessonPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAnyAdminPermission(["CONTENT_DRAFT_CREATE"]);
  const topics = await getLessonEditorOptions();
  const rawParams = searchParams ? await searchParams : {};
  const creationError = typeof rawParams.error === "string" ? decodeURIComponent(rawParams.error) : undefined;

  async function quickCreateTaxonomyAction(formData: FormData) {
    "use server";
    const { user } = await requireAnyAdminPermission(["CONTENT_DRAFT_CREATE", "TAXONOMY_MANAGE"]);
    const categoryName = String(formData.get("categoryName") ?? "").trim();
    const topicName = String(formData.get("topicName") ?? "").trim();
    let categoryId = String(formData.get("categoryId") ?? "").trim();

    try {
      if (!categoryId && categoryName) {
        const catCode = codeify(categoryName);
        const catSlug = slugify(categoryName);
        const newCat = await createCategory(user.id, {
          code: catCode,
          sortOrder: 0,
          localizations: [
            { locale: "vi", name: categoryName, slug: catSlug, description: "" },
            { locale: "en", name: categoryName, slug: `${catSlug}-en`, description: "" },
          ],
        });
        categoryId = newCat.id;
      }

      if (categoryId && topicName) {
        const topCode = codeify(topicName);
        const topSlug = slugify(topicName);
        await createTopic(user.id, {
          categoryId,
          code: topCode,
          sortOrder: 0,
          aliases: [],
          localizations: [
            { locale: "vi", name: topicName, slug: topSlug, description: "" },
            { locale: "en", name: topicName, slug: `${topSlug}-en`, description: "" },
          ],
        });
      }

      revalidatePath("/lessons/new");
      revalidatePath("/categories");
    } catch (err) {
      const msg = err instanceof Error ? encodeURIComponent(err.message) : "Lỗi tạo taxonomy";
      redirect(`/lessons/new?error=${msg}`);
    }

    redirect("/lessons/new");
  }

  if (topics.length === 0) {
    const taxonomyData = await listTaxonomy();
    const activeCategories = taxonomyData.categories.filter((c) => c.status === "ACTIVE");

    return (
      <>
        <PageHeading
          eyebrow="Lesson editor"
          title="Tạo bài học mới"
          description="Để bắt đầu viết bài học, hệ thống cần ít nhất một Chuyên mục và Chủ đề để phân loại."
        />

        <section className="admin-panel mt-8 max-w-2xl overflow-hidden bg-white p-6 sm:p-8 shadow-xs border border-[var(--line)]">
          <div className="flex items-center gap-3 border-b border-[var(--line)] pb-5">
            <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <HugeiconsIcon icon={SparklesIcon} size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                Khởi tạo Chuyên mục & Chủ đề trực tiếp
              </h2>
              <p className="text-xs text-[var(--ink-soft)]">
                Nhập thông tin bên dưới để tạo ngay tại chỗ và vào thẳng trình soạn thảo bài học.
              </p>
            </div>
          </div>

          {creationError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
              ✕ {creationError}
            </div>
          ) : null}

          <form action={quickCreateTaxonomyAction} className="mt-6 space-y-5">
            {activeCategories.length > 0 ? (
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  Chọn Chuyên mục có sẵn (Category Cấp 1):
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--navy-bright)] focus:ring-2 focus:ring-[#1959c71a]"
                  name="categoryId"
                >
                  <option value="">+ Tạo chuyên mục mới bên dưới...</option>
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.localizations.find((l) => l.locale === "vi")?.name ?? c.code}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                Tên Chuyên mục lớn (Category Cấp 1) <span className="text-red-500">*</span>
              </label>
              <input
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--navy-bright)] focus:ring-2 focus:ring-[#1959c71a]"
                name="categoryName"
                placeholder="Ví dụ: VSTEP Writing, IELTS Academic, Vocabulary..."
                required={activeCategories.length === 0}
              />
              <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                Mã code và slug sẽ được hệ thống tự động chuẩn hóa.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                Tên Chủ đề bài học (Topic Cấp 2) <span className="text-red-500">*</span>
              </label>
              <input
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--navy-bright)] focus:ring-2 focus:ring-[#1959c71a]"
                name="topicName"
                placeholder="Ví dụ: Task 2 Templates, Collocations B2, Environment..."
                required
              />
              <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                Chủ đề này sẽ được gắn trực tiếp vào bài học đầu tiên của bạn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--line)]">
              <button
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--amber)] px-5 text-sm font-extrabold text-[#392800] hover:bg-[#e49400] transition"
                type="submit"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={2.5} />
                Tạo & Bắt đầu viết bài ngay
              </button>
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--ink)] hover:bg-slate-50 transition"
                href="/lessons"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
                Quay lại danh sách
              </Link>
            </div>
          </form>
        </section>
      </>
    );
  }

  const initialValue: CreateLessonDraftInput = {
    defaultLocale: "en",
    slugs: [{ locale: "vi", slug: "bai-hoc-moi" }, { locale: "en", slug: "new-lesson" }],
    primarySkill: "VOCABULARY",
    lessonType: "PARAPHRASE",
    learningLanguage: "en",
    localizations: [
      { locale: "vi", title: "", shortDescription: "", learningObjectives: [], contentBlocks: [] },
      { locale: "en", title: "", shortDescription: "", learningObjectives: [], contentBlocks: [] },
    ],
    cefrLevelMin: "B1",
    cefrLevelMax: "B2",
    audiences: ["GENERAL_ENGLISH"],
    ieltsMetadata: null,
    primaryTopicId: topics[0].id,
    secondaryTopicIds: [],
    tagCodes: [],
    estimatedMinutes: 10,
    visibility: "PUBLIC",
    accessTier: "FREE",
    coverAssetId: null,
    prerequisiteLessonIds: [],
    relatedLessonIds: [],
    exercises: [],
  };

  async function saveDraft(
    _state: LessonEditorActionState,
    formData: FormData,
  ): Promise<LessonEditorActionState> {
    "use server";
    const { user } = await requireAnyAdminPermission(["CONTENT_DRAFT_CREATE"]);
    try {
      const payload = JSON.parse(String(formData.get("payload") ?? "null"));
      const result = await createAdminLessonDraft(user.id, payload);
      revalidatePath("/lessons");
      redirect(`/lessons/${result.lessonId}/edit?saved=created`);
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      return actionError(error);
    }
  }

  return (
    <>
      <PageHeading eyebrow="Lesson editor" title="Tạo bài học" description="Soạn metadata song ngữ và exercise trong một draft. Nội dung chỉ đi vào catalog sau quy trình review và publish." />
      <LessonEditor initialValue={initialValue} mode="create" saveAction={saveDraft} topics={topics} />
    </>
  );
}
