import { ContentValidationError } from "@draftwise/content";
import {
  Add01Icon,
  ArrowDown01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Edit02Icon,
  FileUploadIcon,
  Layers01Icon,
  PencilEdit02Icon,
  PowerServiceIcon,
  Search01Icon,
  Tag01Icon,
  TimeQuarter02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { BulkArchiveButton } from "@/components/bulk-archive-button";
import { PageHeading } from "@/components/page-heading";
import { TaxonomyStatusButton } from "@/components/taxonomy-status-button";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  fastTrackPublishPackage,
  fastTrackUnpublishPackage,
  listContentPackages,
  type ContentKind,
} from "@/server/content-repository";
import {
  bulkArchiveLessons,
  getLessonListFilterOptions,
  lessonLevels,
  lessonLocales,
  lessonSkills,
  lessonStatuses,
  listAdminLessons,
  parseLessonListQuery,
  type LessonListQuery,
} from "@/server/lessons";
import {
  changeTaxonomyStatus,
  createCategory,
  createTopic,
  listTaxonomy,
  TaxonomyConflictError,
  updateCategory,
  updateTopic,
} from "@/server/taxonomy";

const statusLabels: Record<string, string> = {
  APPROVED: "Đã duyệt",
  ARCHIVED: "Đã lưu trữ",
  CANCELLED: "Đã huỷ",
  CHANGES_REQUESTED: "Cần chỉnh sửa",
  DRAFT: "Bản nháp",
  IN_REVIEW: "Đang review",
  NEVER_PUBLISHED: "Chưa publish",
  PUBLISHED: "Đã publish",
  SCHEDULED: "Đã lên lịch",
  WITHDRAWN: "Đã gỡ",
};

const skillLabels: Record<string, string> = {
  LISTENING: "Listening",
  SPEAKING: "Speaking",
  VOCABULARY: "Vocabulary",
  WRITING: "Writing",
};

function statusTone(status: string) {
  if (status === "PUBLISHED" || status === "APPROVED") return "bg-[#e1f4e9] text-[#236143]";
  if (status === "IN_REVIEW" || status === "SCHEDULED") return "bg-[#e6edfb] text-[var(--navy)]";
  if (status === "CHANGES_REQUESTED" || status === "WITHDRAWN") return "bg-[#fae4e0] text-[#8b352e]";
  if (status === "ARCHIVED" || status === "CANCELLED") return "bg-[#ece9e1] text-[#645f55]";
  return "bg-[#fff1c8] text-[#6e4d00]";
}

function queryHref(query: LessonListQuery, page: number) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.locale) params.set("locale", query.locale);
  if (query.skill) params.set("skill", query.skill);
  if (query.level) params.set("level", query.level);
  if (query.category) params.set("category", query.category);
  if (query.owner) params.set("owner", query.owner);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `/lessons?${value}` : "/lessons";
}

const fieldClass = "h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--navy-bright)] focus:ring-2 focus:ring-[#1959c71a]";
const areaClass = "min-h-24 w-full resize-y rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-[var(--navy-bright)] focus:ring-2 focus:ring-[#1959c71a]";

type Localization = {
  description: string;
  locale: "vi" | "en";
  name: string;
  slug: string;
};

function localizationValue(localizations: Localization[], locale: "vi" | "en") {
  return localizations.find((entry) => entry.locale === locale) ?? {
    description: "",
    locale,
    name: "",
    slug: "",
  };
}

function taxonomyInput(formData: FormData) {
  return {
    localizations: (["vi", "en"] as const).map((locale) => ({
      description: String(formData.get(`${locale}Description`) ?? ""),
      locale,
      name: String(formData.get(`${locale}Name`) ?? ""),
      slug: String(formData.get(`${locale}Slug`) ?? ""),
    })),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  };
}

function aliasesInput(formData: FormData) {
  return String(formData.get("aliases") ?? "")
    .split(/[\n,]/u)
    .map((value) => value.trim())
    .filter(Boolean);
}

function resourceTypeInput(formData: FormData): "CATEGORY" | "TOPIC" {
  const value = String(formData.get("resourceType") ?? "");
  if (value !== "CATEGORY" && value !== "TOPIC") {
    throw new ContentValidationError(["Loại taxonomy không hợp lệ."]);
  }
  return value;
}

function mutationOutcome(error: unknown) {
  if (error instanceof TaxonomyConflictError) return "conflict";
  if (error instanceof ContentValidationError) {
    if (error.issues.some((issue) => issue.includes("topic đang active"))) return "active-topics";
    if (error.issues.some((issue) => issue.includes("active category") || issue.includes("category đang disabled"))) return "inactive-category";
    return "invalid";
  }
  if (error instanceof ZodError) return "invalid";
  return "error";
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  required = false,
}: {
  defaultValue?: string | number;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-xs font-bold text-[var(--ink-soft)]">
      {label}
      <input className={fieldClass} defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} />
    </label>
  );
}

function LocalizationFields({ localizations }: { localizations?: Localization[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {(["vi", "en"] as const).map((locale) => {
        const value = localizationValue(localizations ?? [], locale);
        return (
          <fieldset className="rounded-2xl border border-[var(--line)] bg-[#faf8f2] p-4" key={locale}>
            <legend className="px-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--navy-bright)]">
              {locale === "vi" ? "Tiếng Việt" : "English"}
            </legend>
            <div className="grid gap-4">
              <Field defaultValue={value.name} label="Tên hiển thị" name={`${locale}Name`} required />
              <Field defaultValue={value.slug} label="URL slug" name={`${locale}Slug`} placeholder="lowercase-kebab-case" required />
              <label className="grid gap-2 text-xs font-bold text-[var(--ink-soft)]">
                Mô tả
                <textarea className={areaClass} defaultValue={value.description} name={`${locale}Description`} />
              </label>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function StatusForm({
  id,
  label,
  resourceType,
  status,
  action,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
  resourceType: "CATEGORY" | "TOPIC";
  status: "ACTIVE" | "DISABLED";
}) {
  const nextStatus = status === "ACTIVE" ? "DISABLED" : "ACTIVE";
  const disabling = nextStatus === "DISABLED";
  return (
    <form action={action} className="mt-4 rounded-2xl border border-dashed border-[var(--line)] bg-white p-4">
      <input name="resourceId" type="hidden" value={id} />
      <input name="resourceType" type="hidden" value={resourceType} />
      <input name="status" type="hidden" value={nextStatus} />
      <label className="grid gap-2 text-xs font-bold text-[var(--ink-soft)]">
        Lý do {disabling ? "tắt" : "bật"}
        <input className={fieldClass} minLength={3} name="reason" placeholder="Bắt buộc để lưu audit" required />
      </label>
      <TaxonomyStatusButton
        className={`mt-3 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-extrabold ${
          disabling ? "bg-[#f7ded8] text-[#8b352e]" : "bg-[#dff2e7] text-[#236143]"
        }`}
        confirmation={`${disabling ? "Tắt" : "Bật"} ${label}? Thay đổi này sẽ được ghi vào lịch sử.`}
        type="submit"
      >
        <HugeiconsIcon icon={PowerServiceIcon} size={17} strokeWidth={2} />
        {disabling ? "Tắt sử dụng" : "Bật lại"}
      </TaxonomyStatusButton>
    </form>
  );
}

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { authorization, user } = await requireAnyAdminPermission(["CONTENT_DRAFT_VIEW"]);
  const rawSearchParams = await searchParams;
  const tabParam = typeof rawSearchParams.tab === "string" ? rawSearchParams.tab : "collocation";
  const activeTab = tabParam;

  const tabToKind: Record<string, ContentKind> = {
    collocation: "COLLOCATION",
    vocabulary: "TOPIC_VOCABULARY",
    synonym: "SYNONYM",
    paraphrase: "PARAPHRASE",
    template: "TEMPLATE",
  };

  const isKindTab = activeTab in tabToKind;
  const activeKind = tabToKind[activeTab];

  const [result, options, packages] = await Promise.all([
    listAdminLessons(parseLessonListQuery(rawSearchParams)),
    getLessonListFilterOptions(),
    isKindTab ? listContentPackages(activeKind, user.id) : Promise.resolve([]),
  ]);

  const query = parseLessonListQuery(rawSearchParams);
  const canArchive = authorization.permissions.has("CONTENT_ARCHIVE");
  const canCreate = authorization.permissions.has("CONTENT_DRAFT_CREATE");
  const canEdit = authorization.permissions.has("CONTENT_DRAFT_EDIT");
  const canManageTaxonomy = authorization.permissions.has("TAXONOMY_MANAGE");

  if (result.total > 0 && query.page > result.pageCount) {
    redirect(queryHref(query, result.pageCount));
  }

  const returnTo = queryHref(query, query.page);
  const rawBulkStatus = typeof rawSearchParams.bulk === "string" ? rawSearchParams.bulk : undefined;
  const bulkStatus = rawBulkStatus && ["archived", "empty", "error"].includes(rawBulkStatus)
    ? rawBulkStatus
    : undefined;

  // Taxonomy Data
  const taxonomy = activeTab === "categories" && canManageTaxonomy ? await listTaxonomy() : null;
  const activeCategories = taxonomy?.categories.filter((category) => category.status === "ACTIVE") ?? [];
  const taxonomyOutcome = typeof rawSearchParams.taxonomy === "string" ? rawSearchParams.taxonomy : undefined;

  // Server Actions for Lessons
  async function archiveSelected(formData: FormData) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_ARCHIVE"]);
    const lessonIds = formData.getAll("lessonIds").map(String);
    const reason = String(formData.get("reason") ?? "");
    const requestedReturnTo = String(formData.get("returnTo") ?? "/lessons");
    const safeReturnTo = requestedReturnTo.startsWith("/lessons") ? requestedReturnTo : "/lessons";
    let outcome = "archived";

    try {
      await bulkArchiveLessons({ actorUserId: context.user.id, lessonIds, reason });
      revalidatePath("/lessons");
    } catch {
      outcome = lessonIds.length === 0 ? "empty" : "error";
    }

    const separator = safeReturnTo.includes("?") ? "&" : "?";
    redirect(`${safeReturnTo}${separator}bulk=${outcome}`);
  }

  // Server Actions for Taxonomy
  async function createCategoryAction(formData: FormData) {
    "use server";
    const { user } = await requireAnyAdminPermission(["TAXONOMY_MANAGE"]);
    let res = "created";
    try {
      await createCategory(user.id, {
        ...taxonomyInput(formData),
        code: String(formData.get("code") ?? ""),
      });
      revalidatePath("/lessons");
    } catch (error) {
      res = mutationOutcome(error);
    }
    redirect(`/lessons?tab=categories&taxonomy=${res}`);
  }

  async function updateCategoryAction(formData: FormData) {
    "use server";
    const { user } = await requireAnyAdminPermission(["TAXONOMY_MANAGE"]);
    let res = "updated";
    try {
      await updateCategory(user.id, String(formData.get("resourceId") ?? ""), taxonomyInput(formData));
      revalidatePath("/lessons");
    } catch (error) {
      res = mutationOutcome(error);
    }
    redirect(`/lessons?tab=categories&taxonomy=${res}`);
  }

  async function createTopicAction(formData: FormData) {
    "use server";
    const { user } = await requireAnyAdminPermission(["TAXONOMY_MANAGE"]);
    let res = "created";
    try {
      await createTopic(user.id, {
        ...taxonomyInput(formData),
        aliases: aliasesInput(formData),
        categoryId: String(formData.get("categoryId") ?? ""),
        code: String(formData.get("code") ?? ""),
      });
      revalidatePath("/lessons");
    } catch (error) {
      res = mutationOutcome(error);
    }
    redirect(`/lessons?tab=categories&taxonomy=${res}`);
  }

  async function updateTopicAction(formData: FormData) {
    "use server";
    const { user } = await requireAnyAdminPermission(["TAXONOMY_MANAGE"]);
    let res = "updated";
    try {
      await updateTopic(user.id, String(formData.get("resourceId") ?? ""), {
        ...taxonomyInput(formData),
        aliases: aliasesInput(formData),
        categoryId: String(formData.get("categoryId") ?? ""),
      });
      revalidatePath("/lessons");
    } catch (error) {
      res = mutationOutcome(error);
    }
    redirect(`/lessons?tab=categories&taxonomy=${res}`);
  }

  async function statusAction(formData: FormData) {
    "use server";
    const { user } = await requireAnyAdminPermission(["TAXONOMY_MANAGE"]);
    let res = "status";
    try {
      await changeTaxonomyStatus(
        user.id,
        resourceTypeInput(formData),
        String(formData.get("resourceId") ?? ""),
        {
          reason: String(formData.get("reason") ?? ""),
          status: String(formData.get("status") ?? ""),
        },
      );
      revalidatePath("/lessons");
    } catch (error) {
      res = mutationOutcome(error);
    }
    redirect(`/lessons?tab=categories&taxonomy=${res}`);
  }

  // Package Actions
  async function publishPackageAction(formData: FormData) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_PUBLISH", "CONTENT_DRAFT_EDIT"]);
    const packageId = String(formData.get("packageId") ?? "");
    await fastTrackPublishPackage(context.user.id, packageId);
    revalidatePath("/lessons");
  }

  async function unpublishPackageAction(formData: FormData) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_PUBLISH", "CONTENT_DRAFT_EDIT"]);
    const packageId = String(formData.get("packageId") ?? "");
    await fastTrackUnpublishPackage(context.user.id, packageId);
    revalidatePath("/lessons");
  }

  const contentTabs: Array<{ id: string; label: string; kind: ContentKind }> = [
    { id: "collocation", label: "Collocation", kind: "COLLOCATION" },
    { id: "vocabulary", label: "Topic Vocabulary", kind: "TOPIC_VOCABULARY" },
    { id: "synonym", label: "Synonym (Từ đồng nghĩa)", kind: "SYNONYM" },
    { id: "paraphrase", label: "Paraphrase", kind: "PARAPHRASE" },
    { id: "template", label: "Template (Mẫu câu)", kind: "TEMPLATE" },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeading
          eyebrow="Content Repository"
          title="Kho bài học"
          description="Quản lý tập trung các bộ dữ liệu từ vựng, collocations, mẫu câu học tiếng Anh theo chủ đề."
        />

        {canCreate && (
          <div className="admin-enter flex items-center gap-3 self-end sm:self-center">
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--amber)] px-5 text-sm font-extrabold text-[#392800] shadow-[0_10px_26px_rgba(245,184,46,.22)] hover:bg-[#e49400] transition"
              href="/lessons/import"
            >
              <HugeiconsIcon icon={FileUploadIcon} size={18} strokeWidth={2} />
              + Tải lên bộ mới (CSV)
            </Link>
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--ink)] shadow-xs hover:bg-slate-50 transition"
              href="/lessons/new"
            >
              <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} />
              Soạn bài lẻ
            </Link>
          </div>
        )}
      </div>

      {/* TAB NAVIGATION HEADER */}
      <div className="mt-6 flex flex-wrap items-center gap-1 border-b border-[var(--line)]">
        {contentTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-extrabold transition ${
                isActive
                  ? "border-[var(--navy)] text-[var(--navy)]"
                  : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
              href={`/lessons?tab=${tab.id}`}
            >
              <span>{tab.label}</span>
            </Link>
          );
        })}

        <div className="ml-auto flex items-center gap-1">
          <Link
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-bold transition ${
              activeTab === "categories"
                ? "border-[var(--navy)] text-[var(--navy)]"
                : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
            href="/lessons?tab=categories"
          >
            <HugeiconsIcon icon={Tag01Icon} size={15} />
            <span>Chuyên mục & Chủ đề</span>
          </Link>

          <Link
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-bold transition ${
              activeTab === "all"
                ? "border-[var(--navy)] text-[var(--navy)]"
                : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
            href="/lessons?tab=all"
          >
            <HugeiconsIcon icon={BookOpen01Icon} size={15} />
            <span>Tất cả bài học lẻ ({result.total})</span>
          </Link>
        </div>
      </div>

      {/* CONTENT REPOSITORY TABS: PACKAGES VIEW */}
      {isKindTab && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-[var(--line)] shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-[var(--ink)]">
                Danh sách các Bộ {contentTabs.find((t) => t.id === activeTab)?.label} ({packages.length} bộ dữ liệu)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mỗi bộ dữ liệu chứa các bài học được gom theo từng Topic và nạp tự động qua file CSV.
              </p>
            </div>

            <Link
              href={`/lessons/import?kind=${activeKind}`}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 text-xs font-bold transition self-start sm:self-auto"
            >
              <HugeiconsIcon icon={FileUploadIcon} size={14} />
              <span>+ Tải lên file CSV</span>
            </Link>
          </div>

          {packages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-12 text-center">
              <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-800 mx-auto">
                <HugeiconsIcon icon={Layers01Icon} size={24} />
              </div>
              <h3 className="font-heading text-base font-bold text-[var(--ink)]">
                Chưa có bộ dữ liệu {contentTabs.find((t) => t.id === activeTab)?.label} nào
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Tải lên file CSV chứa danh sách từ vựng / cụm từ để hệ thống tự động tạo các bài học theo chủ đề chỉ trong vài giây.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Link
                  href={`/lessons/import?kind=${activeKind}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] text-white px-5 text-xs font-bold hover:bg-[var(--navy-bright)] transition"
                >
                  <HugeiconsIcon icon={FileUploadIcon} size={16} />
                  <span>Tải lên file CSV ngay</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => {
                const isPublished = pkg.status === "PUBLISHED";
                return (
                  <div
                    key={pkg.id}
                    className="admin-panel flex flex-col justify-between p-5 bg-white shadow-2xs hover:border-[var(--navy-bright)] transition rounded-2xl border border-[var(--line)]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                            isPublished
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-900 border-amber-200"
                          }`}
                        >
                          {isPublished ? "🟢 Đã xuất bản" : "🟡 Bản nháp"}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {pkg.createdAt.toLocaleDateString("vi-VN")}
                        </span>
                      </div>

                      <h3 className="font-heading text-base font-extrabold text-[var(--ink)] line-clamp-2">
                        {pkg.title}
                      </h3>

                      <div className="mt-3 rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Quy mô:</span>
                          <strong className="text-[var(--navy)]">{pkg.topicCount} Chủ đề (Topics)</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tổng số mục:</span>
                          <strong className="text-[var(--ink)]">{pkg.itemCount} Cụm từ & Quiz</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[var(--line)] flex items-center justify-between gap-2">
                      <form action={isPublished ? unpublishPackageAction : publishPackageAction}>
                        <input name="packageId" type="hidden" value={pkg.id} />
                        <button
                          type="submit"
                          className={`inline-flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-bold transition ${
                            isPublished
                              ? "border border-[var(--line)] bg-slate-50 hover:bg-slate-100 text-slate-700"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                          }`}
                        >
                          {isPublished ? (
                            <>
                              <HugeiconsIcon icon={PowerServiceIcon} size={13} />
                              <span>Hạ về nháp</span>
                            </>
                          ) : (
                            <>
                              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                              <span>Xuất bản cả bộ</span>
                            </>
                          )}
                        </button>
                      </form>

                      <Link
                        href={`/lessons/package/${pkg.id}`}
                        className="inline-flex items-center gap-1.5 h-8 rounded-lg bg-[var(--navy)] hover:bg-[var(--navy-bright)] text-white px-3 text-xs font-bold transition shadow-2xs"
                      >
                        <HugeiconsIcon icon={ViewIcon} size={13} />
                        <span>Xem các Topic →</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ALL INDIVIDUAL LESSONS TAB */}
      {activeTab === "all" && (
        <div className="mt-6">
          {bulkStatus && (
            <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${
              bulkStatus === "archived"
                ? "border-[#a9d7bb] bg-[#e7f5ec] text-[#236143]"
                : "border-[#e9c5bb] bg-[#fff0ec] text-[#8b352e]"
            }`}>
              {bulkStatus === "archived" && "Đã archive các bài học được chọn và ghi audit."}
              {bulkStatus === "empty" && "Bạn chưa chọn bài học nào."}
              {bulkStatus === "error" && "Không thể archive. Chỉ các bài đang Published mới được xử lý cùng lúc."}
            </div>
          )}

          <section className="admin-panel admin-enter p-5 sm:p-6 bg-white shadow-xs border border-[var(--line)]">
            <form className="grid gap-3 lg:grid-cols-12" method="get">
              <label className="relative lg:col-span-4">
                <span className="sr-only">Tìm bài học</span>
                <HugeiconsIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" icon={Search01Icon} strokeWidth={2} />
                <input className="h-12 w-full rounded-xl border border-[var(--line)] bg-white pl-11 pr-4 text-sm outline-none focus:border-[var(--navy-bright)]" defaultValue={query.q} name="q" placeholder="Tìm title, slug hoặc tag…" />
              </label>
              <select className="h-12 rounded-xl border border-[var(--line)] bg-white px-3 text-sm lg:col-span-2" defaultValue={query.status ?? ""} name="status">
                <option value="">Tất cả trạng thái</option>
                {lessonStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
              <select className="h-12 rounded-xl border border-[var(--line)] bg-white px-3 text-sm lg:col-span-2" defaultValue={query.skill ?? ""} name="skill">
                <option value="">Tất cả kỹ năng</option>
                {lessonSkills.map((skill) => <option key={skill} value={skill}>{skillLabels[skill]}</option>)}
              </select>
              <select className="h-12 rounded-xl border border-[var(--line)] bg-white px-3 text-sm lg:col-span-2" defaultValue={query.level ?? ""} name="level">
                <option value="">Tất cả level</option>
                {lessonLevels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
              <select className="h-12 rounded-xl border border-[var(--line)] bg-white px-3 text-sm lg:col-span-2" defaultValue={query.locale ?? ""} name="locale">
                <option value="">Tất cả locale</option>
                {lessonLocales.map((locale) => <option key={locale} value={locale}>{locale.toUpperCase()}</option>)}
              </select>
              <select className="h-12 rounded-xl border border-[var(--line)] bg-white px-3 text-sm lg:col-span-4" defaultValue={query.category ?? ""} name="category">
                <option value="">Tất cả category</option>
                {options.categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
              <select className="h-12 rounded-xl border border-[var(--line)] bg-white px-3 text-sm lg:col-span-4" defaultValue={query.owner ?? ""} name="owner">
                <option value="">Tất cả người tạo</option>
                {options.owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.label}</option>)}
              </select>
              <div className="flex gap-2 lg:col-span-4">
                <button className="h-12 flex-1 rounded-xl bg-[var(--navy)] text-sm font-bold text-white transition hover:bg-[var(--navy-bright)]" type="submit">Lọc bài học</button>
                <Link className="grid h-12 place-items-center rounded-xl border border-[var(--line)] px-4 text-sm font-bold text-[var(--ink-soft)] transition hover:text-[var(--ink)]" href="/lessons">Reset</Link>
              </div>
            </form>
          </section>

          <form action={archiveSelected} className="admin-panel admin-enter mt-6 overflow-hidden bg-white shadow-xs border border-[var(--line)]">
            <input name="returnTo" type="hidden" value={returnTo} />
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-4">
              <div>
                <p className="text-sm font-extrabold text-[var(--ink)]">Danh sách bài học</p>
                <p className="text-xs text-[var(--ink-soft)]">{result.total} bài học phù hợp với bộ lọc hiện tại</p>
              </div>
              {canArchive && <BulkArchiveButton />}
            </div>

            {result.items.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-base font-extrabold text-[var(--ink)]">Không tìm thấy bài học nào</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">Thử điều chỉnh lại từ khoá tìm kiếm hoặc các tiêu chí lọc phía trên.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#faf8f2] text-xs font-extrabold uppercase tracking-wider text-[var(--ink-soft)] border-b border-[var(--line)]">
                    <tr>
                      {canArchive && <th className="w-10 px-4 py-3"><span className="sr-only">Chọn</span></th>}
                      <th className="px-6 py-3">Bài học & Slug</th>
                      <th className="px-4 py-3">Kỹ năng</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Tác giả</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {result.items.map((item) => {
                      const titleVi = item.version.localizations.find((l) => l.locale === "vi")?.title;
                      const titleEn = item.version.localizations.find((l) => l.locale === "en")?.title;
                      const displayTitle = titleVi || titleEn || "Bài học không tên";

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          {canArchive && (
                            <td className="px-4 py-4 text-center">
                              <input className="size-4 rounded accent-[var(--navy)]" name="lessonIds" type="checkbox" value={item.id} />
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <Link className="font-bold text-[var(--ink)] hover:text-[var(--navy-bright)] transition block" href={`/lessons/${item.id}`}>
                              {displayTitle}
                            </Link>
                            <span className="text-xs font-mono text-[var(--ink-soft)] block mt-0.5">
                              {item.slugs.map((s) => s.slug).join(" / ")}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-semibold text-xs text-[var(--ink)]">
                            {item.version.primarySkill}
                          </td>
                          <td className="px-4 py-4 font-mono text-xs">
                            {item.version.cefrLevelMin}–{item.version.cefrLevelMax}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${statusTone(item.version.status)}`}>
                              {statusLabels[item.version.status] ?? item.version.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-[var(--ink-soft)]">
                            {item.owner.name || item.owner.email || "—"}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink)] hover:bg-slate-50 transition"
                                href={`/lessons/${item.id}`}
                              >
                                <HugeiconsIcon icon={ViewIcon} size={14} />
                                Chi tiết
                              </Link>
                              {canEdit && (
                                <Link
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50 transition"
                                  href={`/lessons/${item.id}/edit`}
                                >
                                  <HugeiconsIcon icon={Edit02Icon} size={14} />
                                  Sửa
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ CHUYÊN MỤC & CHỦ ĐỀ */}
      {activeTab === "categories" && (
        <div className="mt-6 space-y-6">
          {taxonomyOutcome && (
            <div className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
              ["created", "updated", "status"].includes(taxonomyOutcome)
                ? "border-[#a9d7bb] bg-[#e7f5ec] text-[#236143]"
                : "border-[#e9c5bb] bg-[#fff0ec] text-[#8b352e]"
            }`}>
              {taxonomyOutcome === "created" && "Đã tạo taxonomy thành công và ghi nhận lịch sử kiểm toán."}
              {taxonomyOutcome === "updated" && "Đã lưu thay đổi taxonomy thành công."}
              {taxonomyOutcome === "status" && "Đã cập nhật trạng thái taxonomy."}
              {taxonomyOutcome === "conflict" && "Không thể lưu vì code hoặc slug đã được sử dụng."}
              {taxonomyOutcome === "active-topics" && "Hãy tắt toàn bộ topic đang active trước khi tắt category này."}
              {taxonomyOutcome === "inactive-category" && "Topic chỉ có thể được tạo trong một category đang active."}
              {taxonomyOutcome === "invalid" && "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại."}
              {taxonomyOutcome === "error" && "Không thể cập nhật taxonomy. Vui lòng thử lại."}
            </div>
          )}

          {taxonomy && (
            <>
              {/* KPIs */}
              <section className="grid gap-4 lg:grid-cols-3">
                <article className="admin-panel p-5 bg-white shadow-xs border border-[var(--line)]">
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#e6edfb] text-[var(--navy)]">
                      <HugeiconsIcon icon={Layers01Icon} size={20} />
                    </span>
                    <span className="rounded-full bg-[#e7f5ec] px-2.5 py-1 text-xs font-bold text-[#236143]">
                      {taxonomy.categories.filter((item) => item.status === "ACTIVE").length} active
                    </span>
                  </div>
                  <p className="mt-5 text-3xl font-extrabold text-[var(--ink)]">{taxonomy.categories.length}</p>
                  <p className="mt-1 text-sm font-bold text-[var(--ink-soft)]">Categories (Chuyên mục lớn)</p>
                </article>

                <article className="admin-panel p-5 bg-white shadow-xs border border-[var(--line)]">
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#fff1c8] text-[#6e4d00]">
                      <HugeiconsIcon icon={Tag01Icon} size={20} />
                    </span>
                    <span className="rounded-full bg-[#e7f5ec] px-2.5 py-1 text-xs font-bold text-[#236143]">
                      {taxonomy.topics.filter((item) => item.status === "ACTIVE").length} active
                    </span>
                  </div>
                  <p className="mt-5 text-3xl font-extrabold text-[var(--ink)]">{taxonomy.topics.length}</p>
                  <p className="mt-1 text-sm font-bold text-[var(--ink-soft)]">Topics (Chủ đề bài học)</p>
                </article>

                <article className="admin-panel bg-[var(--navy)] p-5 text-white">
                  <p className="admin-kicker text-[var(--amber)]">Cây phân loại</p>
                  <p className="mt-4 text-sm font-bold leading-6">Category là chuyên mục Cấp 1, Topic là chủ đề Cấp 2 gắn trực tiếp với bài học.</p>
                  <p className="mt-3 text-xs leading-5 text-white/65">Taxonomy đã dùng chỉ tắt sử dụng, không xoá cứng để đảm bảo tính toàn vẹn dữ liệu.</p>
                </article>
              </section>

              {/* Lists and Create Forms */}
              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                {/* Category section */}
                <section className="admin-panel overflow-hidden bg-white shadow-xs border border-[var(--line)]">
                  <div className="border-b border-[var(--line)] px-6 py-5">
                    <p className="admin-kicker text-[var(--navy-bright)]">Cấp 1</p>
                    <h2 className="mt-2 text-xl font-extrabold">Category (Chuyên mục)</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">Nhóm chuyên mục lớn dùng để tổ chức catalog.</p>
                  </div>

                  <details className="group border-b border-[var(--line)] bg-[#fff8df]" open={taxonomy.categories.length === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-extrabold">
                      <span className="inline-flex items-center gap-2">
                        <HugeiconsIcon icon={Add01Icon} size={18} />
                        Tạo category mới
                      </span>
                      <HugeiconsIcon className="transition group-open:rotate-180" icon={ArrowDown01Icon} size={18} />
                    </summary>
                    <form action={createCategoryAction} className="grid gap-5 border-t border-[#eadca9] p-6">
                      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                        <Field label="Code ổn định" name="code" placeholder="VSTEP_WRITING" required />
                        <Field defaultValue={0} label="Thứ tự" name="sortOrder" required />
                      </div>
                      <LocalizationFields />
                      <button className="h-11 justify-self-start rounded-xl bg-[var(--amber)] px-5 text-sm font-extrabold text-[#392800]" type="submit">
                        Tạo category
                      </button>
                    </form>
                  </details>

                  {taxonomy.categories.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                      <p className="font-extrabold">Chưa có category</p>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">Tạo category đầu tiên để mở khoá topic và bài học.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--line)]">
                      {taxonomy.categories.map((category) => {
                        const vi = localizationValue(category.localizations, "vi");
                        return (
                          <details className="group bg-white/50" key={category.id}>
                            <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-5">
                              <span className={`size-2.5 shrink-0 rounded-full ${category.status === "ACTIVE" ? "bg-[#42a879]" : "bg-[#aaa395]"}`} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-extrabold">{vi.name}</span>
                                <span className="mt-1 block text-xs text-[var(--ink-soft)]">{category.code} · {category.topicCount.active}/{category.topicCount.total} topic active</span>
                              </span>
                              <HugeiconsIcon className="transition group-open:rotate-180" icon={ArrowDown01Icon} size={18} />
                            </summary>
                            <div className="border-t border-[var(--line)] bg-[#faf8f2] p-6">
                              <form action={updateCategoryAction} className="grid gap-5">
                                <input name="resourceId" type="hidden" value={category.id} />
                                <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                                  <label className="grid gap-2 text-xs font-bold text-[var(--ink-soft)]">
                                    Code ổn định
                                    <input className={`${fieldClass} cursor-not-allowed bg-[#eeebe3]`} disabled value={category.code} />
                                  </label>
                                  <Field defaultValue={category.sortOrder} label="Thứ tự" name="sortOrder" required />
                                </div>
                                <LocalizationFields localizations={category.localizations} />
                                <button className="inline-flex h-11 items-center gap-2 justify-self-start rounded-xl bg-[var(--navy)] px-5 text-sm font-bold text-white" type="submit">
                                  <HugeiconsIcon icon={PencilEdit02Icon} size={17} />
                                  Lưu category
                                </button>
                              </form>
                              <StatusForm action={statusAction} id={category.id} label={vi.name} resourceType="CATEGORY" status={category.status} />
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Topic section */}
                <section className="admin-panel overflow-hidden bg-white shadow-xs border border-[var(--line)]">
                  <div className="border-b border-[var(--line)] px-6 py-5">
                    <p className="admin-kicker text-[var(--navy-bright)]">Cấp 2</p>
                    <h2 className="mt-2 text-xl font-extrabold">Topic (Chủ đề)</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">Đơn vị phân loại trực tiếp được bài học sử dụng.</p>
                  </div>

                  {activeCategories.length > 0 ? (
                    <details className="group border-b border-[var(--line)] bg-[#fff8df]" open={taxonomy.topics.length === 0}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-extrabold">
                        <span className="inline-flex items-center gap-2">
                          <HugeiconsIcon icon={Add01Icon} size={18} />
                          Tạo topic mới
                        </span>
                        <HugeiconsIcon className="transition group-open:rotate-180" icon={ArrowDown01Icon} size={18} />
                      </summary>
                      <form action={createTopicAction} className="grid gap-5 border-t border-[#eadca9] p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="grid gap-2 text-xs font-bold text-[var(--ink-soft)]">
                            Category
                            <select className={fieldClass} name="categoryId" required>
                              {activeCategories.map((category) => (
                                <option key={category.id} value={category.id}>{localizationValue(category.localizations, "vi").name}</option>
                              ))}
                            </select>
                          </label>
                          <Field label="Code ổn định" name="code" placeholder="TASK_2_ESSAY" required />
                          <Field defaultValue={0} label="Thứ tự" name="sortOrder" required />
                          <Field label="Aliases" name="aliases" placeholder="task 2, essay templates" />
                        </div>
                        <LocalizationFields />
                        <button className="h-11 justify-self-start rounded-xl bg-[var(--amber)] px-5 text-sm font-extrabold text-[#392800]" type="submit">
                          Tạo topic
                        </button>
                      </form>
                    </details>
                  ) : (
                    <div className="border-b border-[var(--line)] bg-[#fff8df] px-6 py-5 text-sm font-semibold text-[#6e4d00]">
                      Cần ít nhất một category active trước khi tạo topic.
                    </div>
                  )}

                  {taxonomy.topics.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                      <p className="font-extrabold">Chưa có topic</p>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">Tạo topic đầu tiên để bắt đầu gán cho bài học.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--line)]">
                      {taxonomy.topics.map((topic) => {
                        const vi = localizationValue(topic.localizations, "vi");
                        const category = taxonomy.categories.find((item) => item.id === topic.categoryId);
                        return (
                          <details className="group bg-white/50" key={topic.id}>
                            <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-5">
                              <span className={`size-2.5 shrink-0 rounded-full ${topic.status === "ACTIVE" ? "bg-[#42a879]" : "bg-[#aaa395]"}`} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-extrabold">{vi.name}</span>
                                <span className="mt-1 block text-xs text-[var(--ink-soft)]">
                                  {category ? localizationValue(category.localizations, "vi").name : "Category không tồn tại"} · {topic.code}
                                </span>
                              </span>
                              <HugeiconsIcon className="transition group-open:rotate-180" icon={ArrowDown01Icon} size={18} />
                            </summary>
                            <div className="border-t border-[var(--line)] bg-[#faf8f2] p-6">
                              <form action={updateTopicAction} className="grid gap-5">
                                <input name="resourceId" type="hidden" value={topic.id} />
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <label className="grid gap-2 text-xs font-bold text-[var(--ink-soft)]">
                                    Category
                                    <select className={fieldClass} defaultValue={topic.categoryId} name="categoryId" required>
                                      {activeCategories.map((item) => (
                                        <option key={item.id} value={item.id}>{localizationValue(item.localizations, "vi").name}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="grid gap-2 text-xs font-bold text-[var(--ink-soft)]">
                                    Code ổn định
                                    <input className={`${fieldClass} cursor-not-allowed bg-[#eeebe3]`} disabled value={topic.code} />
                                  </label>
                                  <Field defaultValue={topic.sortOrder} label="Thứ tự" name="sortOrder" required />
                                  <Field defaultValue={topic.aliases.join(", ")} label="Aliases" name="aliases" />
                                </div>
                                <LocalizationFields localizations={topic.localizations} />
                                <button className="inline-flex h-11 items-center gap-2 justify-self-start rounded-xl bg-[var(--navy)] px-5 text-sm font-bold text-white" type="submit">
                                  <HugeiconsIcon icon={PencilEdit02Icon} size={17} />
                                  Lưu topic
                                </button>
                              </form>
                              <StatusForm action={statusAction} id={topic.id} label={vi.name} resourceType="TOPIC" status={topic.status} />
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
