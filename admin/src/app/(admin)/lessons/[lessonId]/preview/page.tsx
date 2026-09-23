import { getLessonPublishValidationIssues, type ContentLocale } from "@draftwise/content";
import { LessonExperiencePreview } from "@draftwise/ui";
import { ArrowLeft01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/page-heading";
import { requireAnyAdminPermission } from "@/server/admin-access";
import { getLessonPreviewData } from "@/server/lesson-editor";

function previewHref(lessonId: string, input: { locale: ContentLocale; version?: string; viewport: "desktop" | "mobile" }) {
  const query = new URLSearchParams({ locale: input.locale, viewport: input.viewport });
  if (input.version) query.set("version", input.version);
  return `/lessons/${lessonId}/preview?${query.toString()}`;
}

export default async function LessonPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ locale?: string; version?: string; viewport?: string }>;
}) {
  const { authorization } = await requireAnyAdminPermission(["CONTENT_DRAFT_VIEW"]);
  const { lessonId } = await params;
  const query = await searchParams;
  const locale: ContentLocale = query.locale === "en" ? "en" : "vi";
  const viewport = query.viewport === "mobile" ? "mobile" : "desktop";
  const data = await getLessonPreviewData(lessonId, query.version);
  if (!data) notFound();

  const issues = getLessonPublishValidationIssues(data.value);
  const selected = data.versions.find((version) => version.id === data.selectedVersionId)!;
  const versionLabel = `Version ${selected.versionNumber}.${selected.revision}`;

  return (
    <>
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="mb-5 flex items-center gap-4 text-sm font-bold text-[var(--navy-bright)]">
            <Link className="inline-flex items-center gap-1.5 hover:underline" href={`/lessons/${lessonId}`}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />Quay lại Quy trình bài học
            </Link>
            <span className="text-[var(--line)]">|</span>
            <Link className="hover:underline" href="/lessons">Danh sách bài học</Link>
          </div>
          <PageHeading eyebrow="Learner experience" title="Xem trước bài học" description="Kiểm tra nội dung bằng component learner dùng chung trước khi gửi review hoặc publish." />
        </div>
        <div className="mt-8 flex items-center gap-2">
          <Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--navy)] hover:bg-[#edf0f4]" href={`/lessons/${lessonId}`}>
            Quy trình & Phát hành
          </Link>
          {authorization.permissions.has("CONTENT_DRAFT_EDIT") && selected.status === "DRAFT" && (
            <Link className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-bold text-white" href={`/lessons/${lessonId}/edit`}>
              <HugeiconsIcon icon={Edit02Icon} size={18} />Chỉnh sửa draft
            </Link>
          )}
        </div>
      </div>

      <section className="admin-panel admin-enter mt-7 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div className="flex flex-wrap gap-2">
            {data.versions.map((version) => (
              <Link className={`rounded-xl px-3 py-2 text-xs font-extrabold ${version.id === data.selectedVersionId ? "bg-[var(--navy)] text-white" : "border border-[var(--line)] bg-white"}`} href={previewHref(lessonId, { locale, version: version.id, viewport })} key={version.id}>
                v{version.versionNumber}.{version.revision} · {version.status}
              </Link>
            ))}
          </div>
          <div className="flex gap-2">
            {(["vi", "en"] as const).map((item) => <Link className={`rounded-xl px-3 py-2 text-xs font-extrabold ${locale === item ? "bg-[#fff1c8] text-[#6e4d00]" : "border border-[var(--line)] bg-white"}`} href={previewHref(lessonId, { locale: item, version: data.selectedVersionId, viewport })} key={item}>{item.toUpperCase()}</Link>)}
            {(["desktop", "mobile"] as const).map((item) => <Link className={`rounded-xl px-3 py-2 text-xs font-extrabold ${viewport === item ? "bg-[#e6edfb] text-[var(--navy)]" : "border border-[var(--line)] bg-white"}`} href={previewHref(lessonId, { locale, version: data.selectedVersionId, viewport: item })} key={item}>{item === "desktop" ? "Desktop" : "Mobile"}</Link>)}
          </div>
        </div>

        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="overflow-auto rounded-2xl bg-[#d7d2c7] p-4">
            <div className={`mx-auto ${viewport === "mobile" ? "max-w-[390px]" : "max-w-[1180px]"}`}>
              <LessonExperiencePreview locale={locale} value={data.value} versionLabel={versionLabel} />
            </div>
          </div>
          <aside className="rounded-2xl border border-[var(--line)] bg-[#fffdf8] p-5">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-extrabold">Validation</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${issues.length === 0 ? "bg-[#dff2e7] text-[#236143]" : "bg-[#f7ded8] text-[#8b352e]"}`}>{issues.length === 0 ? "Sẵn sàng" : `${issues.length} lỗi`}</span></div>
            {issues.length === 0 ? <p className="mt-4 text-xs leading-6 text-[var(--ink-soft)]">Version này đáp ứng publish-ready validation hiện tại.</p> : <ol className="mt-4 grid gap-3 text-xs leading-5 text-[#6f3c35]">{issues.map((issue, index) => <li className="rounded-xl bg-[#fff0ec] p-3" key={issue}><strong>{index + 1}.</strong> {issue}</li>)}</ol>}
          </aside>
        </div>
      </section>
    </>
  );
}
