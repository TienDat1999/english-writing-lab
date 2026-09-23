import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeading } from "@/components/page-heading";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  listContentReports,
  updateContentReportStatus,
} from "@/server/reports";

const statusBadges = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  INVESTIGATING: "bg-sky-50 text-sky-800 border-sky-200",
  RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  DISMISSED: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusLabels = {
  PENDING: "Chờ xử lý",
  INVESTIGATING: "Đang kiểm tra",
  RESOLVED: "Đã giải quyết",
  DISMISSED: "Đã đóng / Bỏ qua",
};

const reasonLabels = {
  WRONG_ANSWER: "Sai đáp án",
  TYPO: "Lỗi chính tả / ngữ pháp",
  AUDIO_ISSUE: "Lỗi âm thanh",
  OFFENSIVE: "Nội dung phản cảm",
  OTHER: "Vấn đề khác",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireAnyAdminPermission(["CONTENT_REPORT_HANDLE"]);
  const rawParams = await searchParams;
  const statusFilter = typeof rawParams.status === "string"
    ? (rawParams.status as "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED")
    : undefined;
  const outcome = typeof rawParams.outcome === "string" ? rawParams.outcome : undefined;

  const reports = await listContentReports({
    status: statusFilter,
  });

  async function updateReportAction(formData: FormData) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_REPORT_HANDLE"]);
    const reportId = String(formData.get("reportId") ?? "");
    const status = String(formData.get("status") ?? "RESOLVED") as "INVESTIGATING" | "RESOLVED" | "DISMISSED";
    const resolutionNote = String(formData.get("resolutionNote") ?? "");

    await updateContentReportStatus({
      actorUserId: context.user.id,
      reportId,
      status,
      resolutionNote,
    });

    revalidatePath("/reports");
    redirect("/reports?outcome=updated");
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--line)] pb-6">
        <PageHeading
          eyebrow="Đảm bảo chất lượng (QA)"
          title="Báo cáo & Khiếu nại nội dung"
          description="Tiếp nhận phản hồi trực tiếp từ người học về lỗi câu hỏi, sai đáp án để kiểm tra và khắc phục kịp thời."
        />
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-800">
            {reports.length} báo cáo
          </span>
        </div>
      </div>

      {outcome === "updated" && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          ✓ Đã cập nhật trạng thái xử lý báo cáo thành công.
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-1.5 border-b border-[var(--line)] pb-3">
        <Link
          href="/reports"
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
            !statusFilter
              ? "bg-slate-900 text-white shadow-2xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
          }`}
        >
          Tất cả
        </Link>
        <Link
          href="/reports?status=PENDING"
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
            statusFilter === "PENDING"
              ? "bg-amber-600 text-white shadow-2xs"
              : "bg-amber-50 text-amber-800 hover:bg-amber-100"
          }`}
        >
          Chờ xử lý
        </Link>
        <Link
          href="/reports?status=INVESTIGATING"
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
            statusFilter === "INVESTIGATING"
              ? "bg-sky-600 text-white shadow-2xs"
              : "bg-sky-50 text-sky-800 hover:bg-sky-100"
          }`}
        >
          Đang kiểm tra
        </Link>
        <Link
          href="/reports?status=RESOLVED"
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
            statusFilter === "RESOLVED"
              ? "bg-emerald-600 text-white shadow-2xs"
              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          }`}
        >
          Đã giải quyết
        </Link>
        <Link
          href="/reports?status=DISMISSED"
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
            statusFilter === "DISMISSED"
              ? "bg-slate-700 text-white shadow-2xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
          }`}
        >
          Đã đóng
        </Link>
      </div>

      {/* Reports List */}
      <section className="mt-6">
        {reports.length === 0 ? (
          <div className="admin-panel bg-white p-12 text-center">
            <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 mx-auto">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} />
            </div>
            <h3 className="font-heading text-base font-bold text-[var(--ink)]">Không có báo cáo nào</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Hàng đợi báo lỗi sạch sẽ. Mọi phản hồi từ người học sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="admin-panel bg-white p-5 shadow-2xs hover:border-[var(--navy-bright)] transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--line)] pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${statusBadges[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                      <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-100">
                        {reasonLabels[report.reason] || report.reason}
                      </span>
                    </div>

                    <Link
                      href={report.lessonId ? `/lessons/${report.lessonId}` : "#"}
                      className="font-heading text-base font-bold text-[var(--ink)] hover:text-[var(--navy-bright)] transition inline-block pt-1"
                    >
                      {report.lessonTitle}
                    </Link>

                    {report.exercisePrompt ? (
                      <p className="text-xs text-[var(--ink-soft)] font-mono">
                        Câu hỏi: &ldquo;{report.exercisePrompt}&rdquo;
                      </p>
                    ) : null}
                  </div>

                  <span className="text-[11px] font-mono text-[var(--ink-soft)] shrink-0">
                    Báo lúc:{" "}
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(report.createdAt)}
                  </span>
                </div>

                <div className="py-3">
                  <p className="text-xs font-bold text-[var(--ink)] mb-1">
                    Nội dung phản hồi của học viên ({report.reportedByEmail}):
                  </p>
                  <p className="rounded-xl border border-slate-100 bg-[#faf8f2] p-3 text-xs leading-relaxed text-slate-800">
                    &ldquo;{report.comment}&rdquo;
                  </p>

                  {report.resolutionNote ? (
                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-emerald-950">
                      <p className="font-bold text-emerald-900">
                        Ghi chú xử lý (bởi {report.resolvedByName}):
                      </p>
                      <p className="mt-0.5">{report.resolutionNote}</p>
                    </div>
                  ) : null}
                </div>

                {/* Form xử lý báo cáo */}
                <div className="border-t border-[var(--line)] pt-3">
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-bold text-[var(--navy-bright)] hover:underline inline-flex items-center gap-1">
                      <span>Cập nhật xử lý báo cáo này</span>
                    </summary>

                    <form action={updateReportAction} className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <input name="reportId" type="hidden" value={report.id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-bold text-[var(--ink-soft)]">
                          Chuyển trạng thái
                          <select
                            defaultValue={report.status === "PENDING" ? "RESOLVED" : report.status}
                            className="mt-1 h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-xs outline-none"
                            name="status"
                          >
                            <option value="INVESTIGATING">Đang kiểm tra (INVESTIGATING)</option>
                            <option value="RESOLVED">Đã giải quyết / Đã sửa bài (RESOLVED)</option>
                            <option value="DISMISSED">Đóng / Không có lỗi (DISMISSED)</option>
                          </select>
                        </label>
                        <label className="block text-xs font-bold text-[var(--ink-soft)]">
                          Ghi chú giải quyết
                          <input
                            defaultValue={report.resolutionNote}
                            className="mt-1 h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2.5 text-xs outline-none"
                            name="resolutionNote"
                            placeholder="ví dụ: Đã sửa đáp án B thành A trong exercise 2"
                            required
                          />
                        </label>
                      </div>

                      <button
                        className="h-8 justify-self-start rounded-lg bg-[var(--navy)] px-4 text-xs font-bold text-white hover:bg-[var(--navy-bright)] transition"
                        type="submit"
                      >
                        Lưu trạng thái xử lý
                      </button>
                    </form>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
