import { ArrowLeft01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/page-heading";
import { requireAnyAdminPermission } from "@/server/admin-access";
import { listLessonAuditHistory } from "@/server/audit";

const actionLabels: Record<string, string> = {
  ARCHIVED: "Đã archive bài học",
  CHANGES_REQUESTED: "Yêu cầu chỉnh sửa",
  DRAFT_UPDATED: "Cập nhật bản nháp",
  LESSON_CREATED: "Tạo bài học",
  PUBLISHED: "Publish bài học",
  RESTORED: "Khôi phục bài học",
  REVIEW_APPROVED: "Duyệt phiên bản",
  REVIEW_SUBMITTED: "Gửi review",
  ROLLED_BACK: "Rollback phiên bản",
  VERSION_CLONED: "Tạo phiên bản mới",
  WITHDRAWN: "Gỡ khẩn cấp",
};

function Summary({ value }: { value: Record<string, unknown> | null }) {
  if (!value) return <span className="text-[var(--ink-soft)]">Không có</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(value).map(([key, entry]) => (
        <span className="rounded-lg bg-[#edf0f4] px-2.5 py-1 text-xs" key={key}>
          <strong>{key}:</strong> {Array.isArray(entry) ? entry.join(", ") : String(entry ?? "—")}
        </span>
      ))}
    </div>
  );
}

export default async function LessonAuditHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { authorization, user } = await requireAnyAdminPermission([
    "AUDIT_VIEW_ALL",
    "AUDIT_VIEW_CONTENT",
    "AUDIT_VIEW_OWN",
  ]);
  const { lessonId } = await params;
  const query = await searchParams;
  const history = await listLessonAuditHistory({
    actorUserId: user.id,
    canViewAll: authorization.permissions.has("AUDIT_VIEW_ALL")
      || authorization.permissions.has("AUDIT_VIEW_CONTENT"),
    cursor: query.cursor,
    lessonId,
  });
  if (!history) notFound();

  return (
    <>
      <Link className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--navy-bright)]" href="/lessons">
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        Quay lại Bài học
      </Link>
      <PageHeading
        eyebrow="Immutable audit trail"
        title="Lịch sử bài học"
        description={`Lesson ID: ${lessonId}. Timeline này chỉ đọc và được sắp xếp từ mới nhất.`}
      />
      <section className="admin-panel admin-enter mt-8 p-5 sm:p-8">
        {history.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--ink-soft)]">Bài học chưa có audit event.</p>
        ) : (
          <ol className="grid gap-4">
            {history.items.map((item) => (
              <li className="relative rounded-2xl border border-[var(--line)] bg-white p-5" key={item.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-bold">{actionLabels[item.action] ?? item.action}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      {item.actor.name ?? item.actor.email ?? item.actorId}
                      {item.lessonVersionId ? ` · Version ${item.lessonVersionId}` : ""}
                    </p>
                  </div>
                  <time className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[var(--ink-soft)]">
                    <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
                    {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(item.occurredAt)}
                  </time>
                </div>
                {item.reason && <p className="mt-4 rounded-xl bg-[#fff5d8] px-4 py-3 text-sm leading-6">{item.reason}</p>}
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer font-bold text-[var(--navy-bright)]">Xem thay đổi</summary>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">Trước</p><Summary value={item.beforeSummary} /></div>
                    <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">Sau</p><Summary value={item.afterSummary} /></div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        )}
        {history.nextCursor && (
          <div className="mt-6 border-t border-[var(--line)] pt-6 text-center">
            <Link className="inline-flex rounded-xl bg-[var(--navy)] px-5 py-3 text-sm font-bold text-white" href={`/lessons/${lessonId}/history?cursor=${history.nextCursor}`}>
              Xem lịch sử cũ hơn
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
