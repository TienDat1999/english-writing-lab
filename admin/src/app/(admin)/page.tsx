import {
  Add01Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Edit02Icon,
  Layers01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { PageHeading } from "@/components/page-heading";
import { requireAdminContext } from "@/server/admin-access";
import { getAdminDashboardData } from "@/server/dashboard";

const actionBadgeStyles: Record<string, string> = {
  CREATE_LESSON: "bg-sky-50 text-sky-800 border-sky-200",
  CREATE_DRAFT: "bg-sky-50 text-sky-800 border-sky-200",
  UPDATE_DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  SUBMIT_REVIEW: "bg-amber-50 text-amber-800 border-amber-200",
  APPROVE_LESSON: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REJECT_LESSON: "bg-rose-50 text-rose-800 border-rose-200",
  PUBLISH_LESSON: "bg-purple-50 text-purple-800 border-purple-200",
  ARCHIVE_LESSON: "bg-slate-100 text-slate-700 border-slate-200",
  ROLLBACK_LESSON: "bg-orange-50 text-orange-800 border-orange-200",
  WITHDRAW_LESSON: "bg-rose-50 text-rose-800 border-rose-200",
};

const statusLabels: Record<string, { label: string; className: string }> = {
  IN_REVIEW: { label: "Chờ duyệt", className: "bg-amber-50 text-amber-800 border-amber-200" },
  CHANGES_REQUESTED: { label: "Cần chỉnh sửa", className: "bg-rose-50 text-rose-800 border-rose-200" },
  APPROVED: { label: "Đã duyệt", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  DRAFT: { label: "Bản nháp", className: "bg-slate-100 text-slate-700 border-slate-200" },
  PUBLISHED: { label: "Đã phát hành", className: "bg-emerald-100 text-emerald-900 border-emerald-300" },
};

function formatActionText(action: string) {
  switch (action) {
    case "CREATE_LESSON": return "Tạo bài học mới";
    case "CREATE_DRAFT": return "Tạo bản nháp mới";
    case "UPDATE_DRAFT": return "Cập nhật nội dung";
    case "SUBMIT_REVIEW": return "Gửi duyệt bài học";
    case "APPROVE_LESSON": return "Phê duyệt bài học";
    case "REJECT_LESSON": return "Yêu cầu sửa lại";
    case "PUBLISH_LESSON": return "Xuất bản bài học";
    case "ARCHIVE_LESSON": return "Lưu trữ bài học";
    case "ROLLBACK_LESSON": return "Rollback phiên bản";
    case "WITHDRAW_LESSON": return "Gỡ bài khẩn cấp";
    default: return action;
  }
}

export default async function DashboardPage() {
  const context = await requireAdminContext();
  const { metrics, actionQueue, recentAudits } = await getAdminDashboardData();

  return (
    <>
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--line)] pb-6">
        <PageHeading
          eyebrow="Trung tâm Điều hành"
          title="Quản trị Nội dung Draftwise"
          description={`Xin chào ${context.user.name || context.user.email || "Quản trị viên"}. Theo dõi tiến độ kiểm duyệt, phát hành và nhật ký vận hành.`}
        />

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/lessons/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-xs font-bold text-white shadow-xs hover:bg-[var(--navy-bright)] transition"
          >
            <HugeiconsIcon icon={Add01Icon} size={15} />
            <span>Tạo bài học mới</span>
          </Link>
          <Link
            href="/lessons"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--navy-bright)] transition"
          >
            <HugeiconsIcon icon={BookOpen01Icon} size={15} />
            <span>Kho bài học</span>
          </Link>
          <Link
            href="/settings"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--navy-bright)] transition"
          >
            <HugeiconsIcon icon={Layers01Icon} size={15} />
            <span>Taxonomy</span>
          </Link>
        </div>
      </div>

      {/* 4 Thẻ Chỉ số Điều hành (KPIs) */}
      <section className="mt-6 grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {/* KPI 1: Chờ duyệt */}
        <div className={`admin-panel p-4 transition-all ${
          metrics.inReviewCount > 0
            ? "border-amber-300 bg-amber-50/30"
            : "bg-white"
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Chờ duyệt</span>
            <div className="grid size-7 place-items-center rounded-lg bg-amber-100 text-amber-700">
              <HugeiconsIcon icon={Clock01Icon} size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-heading font-mono text-2xl font-extrabold text-amber-700">
              {metrics.inReviewCount}
            </span>
            {metrics.inReviewCount > 0 ? (
              <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                Cần xử lý
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Đã hết bài chờ</span>
            )}
          </div>
        </div>

        {/* KPI 2: Bản nháp */}
        <div className="admin-panel p-4 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Bản nháp đang soạn</span>
            <div className="grid size-7 place-items-center rounded-lg bg-sky-100 text-sky-700">
              <HugeiconsIcon icon={Edit02Icon} size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-heading font-mono text-2xl font-extrabold text-[var(--navy)]">
              {metrics.draftCount}
            </span>
            <span className="text-[11px] text-muted-foreground">Bản nháp active</span>
          </div>
        </div>

        {/* KPI 3: Đã xuất bản */}
        <div className="admin-panel p-4 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Bài đã xuất bản</span>
            <div className="grid size-7 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-heading font-mono text-2xl font-extrabold text-emerald-700">
              {metrics.publishedCount}
            </span>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Đang live
            </span>
          </div>
        </div>

        {/* KPI 4: Taxonomy */}
        <div className="admin-panel p-4 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Chủ đề / Danh mục</span>
            <div className="grid size-7 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <HugeiconsIcon icon={Layers01Icon} size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1 font-heading font-mono text-2xl font-extrabold text-[var(--navy)]">
              <span>{metrics.activeTopicsCount}</span>
              <span className="text-xs text-muted-foreground font-normal">/ {metrics.activeCategoriesCount}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">Active topics</span>
          </div>
        </div>
      </section>

      {/* Bố cục 2 Cột: Hàng đợi duyệt & Nhật ký kiểm toán */}
      <section className="mt-6 grid gap-6 lg:grid-cols-12 items-start">
        {/* CỘT TRÁI (7 cols): Hàng đợi duyệt bài học */}
        <div className="lg:col-span-7 space-y-4">
          <div className="admin-panel bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-6 place-items-center rounded-md bg-amber-100 text-amber-700">
                  <HugeiconsIcon icon={AlertCircleIcon} size={15} />
                </div>
                <h3 className="font-heading text-sm font-bold text-[var(--ink)]">
                  Hàng đợi bài học cần duyệt & xử lý
                </h3>
              </div>
              <Link
                href="/lessons?status=IN_REVIEW"
                className="text-xs font-semibold text-[var(--navy-bright)] hover:underline"
              >
                Xem tất cả ({metrics.inReviewCount}) →
              </Link>
            </div>

            {actionQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <p>Hiện không có bài học nào đang chờ duyệt hoặc cần chỉnh sửa.</p>
                <Link
                  href="/lessons/new"
                  className="mt-3 inline-flex items-center gap-1.5 font-bold text-[var(--navy-bright)] hover:underline"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} />
                  <span>Soạn bài học mới ngay</span>
                </Link>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-[var(--line)]">
                {actionQueue.map((item) => {
                  const statusInfo = statusLabels[item.status] || {
                    label: item.status,
                    className: "bg-slate-100 text-slate-700 border-slate-200",
                  };

                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between py-3 hover:bg-[#faf8f2] px-2 rounded-lg transition"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                            v{item.versionNumber}
                          </span>
                          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 border border-sky-100">
                            {item.primarySkill} · {item.level}
                          </span>
                        </div>

                        <Link
                          href={`/lessons/${item.lessonId}`}
                          className="mt-1.5 block font-heading text-sm font-bold text-[var(--ink)] group-hover:text-[var(--navy-bright)] transition truncate"
                        >
                          {item.title}
                        </Link>

                        <p className="mt-0.5 text-[11px] text-[var(--ink-soft)]">
                          Tác giả: {item.ownerName} · Cập nhật{" "}
                          {new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(item.updatedAt)}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <Link
                          href={`/lessons/${item.lessonId}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-bold text-[var(--ink)] hover:border-[var(--navy-bright)] hover:text-[var(--navy-bright)] transition"
                        >
                          <span>Xem duyệt</span>
                          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (5 cols): Dòng nhật ký kiểm toán gần đây */}
        <div className="lg:col-span-5 space-y-4">
          <div className="admin-panel bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-6 place-items-center rounded-lg bg-sky-100 text-sky-700">
                  <HugeiconsIcon icon={Shield01Icon} size={15} />
                </div>
                <h3 className="font-heading text-sm font-bold text-[var(--ink)]">
                  Nhật ký kiểm toán mới nhất
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--ink-soft)]">Audit stream</span>
            </div>

            {recentAudits.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <p>Chưa có bản ghi kiểm toán nào được ghi nhận.</p>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-[var(--line)]">
                {recentAudits.map((audit) => {
                  const badgeStyle = actionBadgeStyles[audit.action]
                    || "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <div key={audit.id} className="py-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${badgeStyle}`}>
                          {formatActionText(audit.action)}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--ink-soft)]">
                          {new Intl.DateTimeFormat("vi-VN", {
                            timeStyle: "short",
                            dateStyle: "short",
                          }).format(audit.occurredAt)}
                        </span>
                      </div>

                      <p className="mt-1 font-semibold text-[var(--ink)] truncate">
                        {audit.actorName}
                      </p>

                      {audit.reason ? (
                        <p className="mt-0.5 text-[11px] italic text-[var(--ink-soft)] line-clamp-1">
                          Lý do: &ldquo;{audit.reason}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
