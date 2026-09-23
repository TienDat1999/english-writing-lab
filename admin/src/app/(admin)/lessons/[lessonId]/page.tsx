import {
  ArrowLeft01Icon,
  BookOpen01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Edit02Icon,
  Layers01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/page-heading";
import {
  AddReviewCommentDialog,
  ApproveDialog,
  ArchiveRestoreDialog,
  CancelScheduleButton,
  CancelVersionDialog,
  ClonePublishedVersionButton,
  PublishNowDialog,
  ResolveCommentButton,
  ResumeEditingButton,
  RollbackDialog,
  ScheduleDialog,
  SubmitReviewButton,
  WithdrawDialog,
} from "@/components/workflow-actions";
import { requireAnyAdminPermission } from "@/server/admin-access";
import { getLessonWorkflowState } from "@/server/workflow";

const statusToneMap: Record<string, string> = {
  APPROVED: "bg-[#e1f4e9] text-[#236143] border-[#b5e2c8]",
  ARCHIVED: "bg-[#ece9e1] text-[#645f55] border-[#d8d3c5]",
  CANCELLED: "bg-[#ece9e1] text-[#645f55] border-[#d8d3c5]",
  CHANGES_REQUESTED: "bg-[#fae4e0] text-[#8b352e] border-[#f0c2ba]",
  DRAFT: "bg-[#fff1c8] text-[#6e4d00] border-[#f7dd94]",
  IN_REVIEW: "bg-[#e6edfb] text-[var(--navy)] border-[#c4d7f8]",
  NEVER_PUBLISHED: "bg-[#ece9e1] text-[#645f55] border-[#d8d3c5]",
  PUBLISHED: "bg-[#e1f4e9] text-[#236143] border-[#b5e2c8]",
  SCHEDULED: "bg-[#e6edfb] text-[var(--navy)] border-[#c4d7f8]",
  SUPERSEDED: "bg-[#ece9e1] text-[#645f55] border-[#d8d3c5]",
  WITHDRAWN: "bg-[#fae4e0] text-[#8b352e] border-[#f0c2ba]",
};

const statusLabels: Record<string, string> = {
  APPROVED: "Đã duyệt",
  ARCHIVED: "Đã lưu trữ",
  CANCELLED: "Đã huỷ",
  CHANGES_REQUESTED: "Cần chỉnh sửa",
  DRAFT: "Bản nháp",
  IN_REVIEW: "Đang review",
  NEVER_PUBLISHED: "Chưa publish",
  PUBLISHED: "Đang phát hành",
  SCHEDULED: "Đã lên lịch",
  SUPERSEDED: "Đã thay thế",
  WITHDRAWN: "Đã gỡ khẩn cấp",
};

export default async function LessonWorkflowPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { authorization } = await requireAnyAdminPermission(["CONTENT_DRAFT_VIEW"]);
  const { lessonId } = await params;
  const state = await getLessonWorkflowState(lessonId);
  if (!state) notFound();

  const permissions = authorization.permissions;
  const canEdit = permissions.has("CONTENT_DRAFT_EDIT");
  const canCreate = permissions.has("CONTENT_DRAFT_CREATE");
  const canReviewComment = permissions.has("CONTENT_REVIEW_COMMENT");
  const canReviewApprove = permissions.has("CONTENT_REVIEW_APPROVE");
  const canPublish = permissions.has("CONTENT_PUBLISH");
  const canArchive = permissions.has("CONTENT_ARCHIVE");
  const canRollback = permissions.has("CONTENT_ROLLBACK");
  const canWithdraw = permissions.has("CONTENT_WITHDRAW");

  const supersededVersions = state.allVersions.filter(
    (v) => v.publishedAt !== null && v.id !== state.currentPublishedVersionId,
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--navy-bright)] hover:underline"
          href="/lessons"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
          Quay lại danh sách Bài học
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && state.activeVersion?.status === "DRAFT" && (
            <Link
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 text-xs font-bold text-[var(--ink)] hover:bg-[#edf0f4]"
              href={`/lessons/${lessonId}/edit`}
            >
              <HugeiconsIcon icon={Edit02Icon} size={15} />
              Soạn thảo
            </Link>
          )}
          <Link
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 text-xs font-bold text-[var(--navy)] hover:bg-[#edf0f4]"
            href={`/lessons/${lessonId}/preview`}
          >
            <HugeiconsIcon icon={ViewIcon} size={15} />
            Xem trước
          </Link>
          <Link
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 text-xs font-bold text-[var(--ink)] hover:bg-[#edf0f4]"
            href={`/lessons/${lessonId}/history`}
          >
            <HugeiconsIcon icon={Clock01Icon} size={15} />
            Lịch sử audit
          </Link>
        </div>
      </div>

      <PageHeading
        description={`ID: ${state.lessonId} · Ngôn ngữ mặc định: ${state.defaultLocale.toUpperCase()}`}
        eyebrow="Review & Publication Workflow"
        title={state.title}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
            statusToneMap[state.publicationStatus] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          Trạng thái phát hành: {statusLabels[state.publicationStatus] ?? state.publicationStatus}
        </span>
        {state.currentPublishedVersionId && (
          <span className="text-xs text-[var(--ink-soft)]">
            Current version ID: {state.currentPublishedVersionId}
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main Column */}
        <div className="space-y-8">
          {/* Active Version Section */}
          <section className="admin-panel admin-enter p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5">
              <div>
                <p className="admin-kicker text-[var(--navy-bright)]">Active Workflow</p>
                <h3 className="mt-1 font-heading text-xl font-bold">
                  {state.activeVersion
                    ? `Phiên bản v${state.activeVersion.versionNumber}.${state.activeVersion.revision}`
                    : "Không có quy trình active"}
                </h3>
              </div>
              {state.activeVersion && (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-extrabold ${
                    statusToneMap[state.activeVersion.status] ?? "bg-gray-100"
                  }`}
                >
                  {statusLabels[state.activeVersion.status] ?? state.activeVersion.status}
                </span>
              )}
            </div>

            {state.activeVersion ? (
              <div className="mt-5 space-y-6">
                {/* Meta details */}
                <div className="grid gap-3 sm:grid-cols-3 rounded-xl bg-[#f9f8f4] p-4 text-xs">
                  <div>
                    <span className="font-bold text-[var(--ink-soft)]">Kỹ năng:</span>{" "}
                    <span className="font-semibold text-[var(--ink)]">
                      {state.activeVersion.primarySkill}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink-soft)]">Loại bài học:</span>{" "}
                    <span className="font-semibold text-[var(--ink)]">
                      {state.activeVersion.lessonType}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink-soft)]">Người sửa gần nhất:</span>{" "}
                    <span className="font-semibold text-[var(--ink)]">
                      {state.activeVersion.lastEditedBy}
                    </span>
                  </div>
                  {state.activeVersion.submittedBy && (
                    <div>
                      <span className="font-bold text-[var(--ink-soft)]">Người gửi review:</span>{" "}
                      <span className="font-semibold text-[var(--ink)]">
                        {state.activeVersion.submittedBy}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-[var(--ink-soft)]">Cập nhật lúc:</span>{" "}
                    <span className="font-semibold text-[var(--ink)]">
                      {new Date(state.activeVersion.updatedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Approval details if APPROVED or SCHEDULED */}
                {state.activeVersion.approval && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />
                      <h4 className="font-heading text-sm font-bold">Thông tin phê duyệt (Approval)</h4>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-emerald-900">
                      <p>
                        <strong>Người phê duyệt:</strong> {state.activeVersion.approval.reviewerName} (
                        {new Date(state.activeVersion.approval.approvedAt).toLocaleString("vi-VN")})
                      </p>
                      {state.activeVersion.approval.summary && (
                        <p>
                          <strong>Tóm tắt:</strong> {state.activeVersion.approval.summary}
                        </p>
                      )}
                      {state.activeVersion.approval.overrideReason && (
                        <p className="rounded-lg bg-amber-100 p-2 text-amber-900">
                          <strong>Admin Override:</strong>{" "}
                          {state.activeVersion.approval.overrideReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Scheduled details */}
                {state.activeVersion.status === "SCHEDULED" && state.activeVersion.scheduledAt && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                    <div className="flex items-center gap-2 text-[var(--navy)]">
                      <HugeiconsIcon icon={Calendar03Icon} size={18} strokeWidth={2} />
                      <h4 className="font-heading text-sm font-bold">Lịch phát hành tự động</h4>
                    </div>
                    <p className="mt-2 text-xs text-[var(--navy)]">
                      Dự kiến phát hành vào:{" "}
                      <strong>
                        {new Date(state.activeVersion.scheduledAt).toLocaleString("vi-VN", {
                          timeZone: state.activeVersion.scheduledTimezone ?? undefined,
                        })}
                      </strong>{" "}
                      ({state.activeVersion.scheduledTimezone ?? "UTC"})
                    </p>
                  </div>
                )}

                {/* Review Comments list */}
                {(state.activeVersion.status === "IN_REVIEW" ||
                  state.activeVersion.status === "CHANGES_REQUESTED" ||
                  state.reviewComments.length > 0) && (
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
                      <div>
                        <h4 className="font-heading text-sm font-bold text-[var(--navy)]">
                          Góp ý đánh giá ({state.reviewComments.length})
                        </h4>
                        <p className="text-xs text-[var(--ink-soft)]">
                          Các nhận xét BLOCKING chưa giải quyết sẽ ngăn cản việc Approve.
                        </p>
                      </div>
                      {canReviewComment && state.activeVersion.status === "IN_REVIEW" && (
                        <AddReviewCommentDialog
                          lessonId={lessonId}
                          versionId={state.activeVersion.id}
                        />
                      )}
                    </div>

                    {state.reviewComments.length === 0 ? (
                      <p className="py-6 text-center text-xs text-[var(--ink-soft)]">
                        Chưa có góp ý nào cho phiên bản này.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {state.reviewComments.map((comment) => (
                          <div
                            className={`rounded-xl border p-4 text-xs transition-colors ${
                              comment.resolvedAt
                                ? "border-emerald-200 bg-emerald-50/30"
                                : comment.severity === "BLOCKING"
                                ? "border-red-200 bg-red-50/50"
                                : "border-[var(--line)] bg-[#fdfcf9]"
                            }`}
                            key={comment.id}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                                    comment.severity === "BLOCKING"
                                      ? "bg-red-200 text-red-900"
                                      : "bg-gray-200 text-gray-800"
                                  }`}
                                >
                                  {comment.severity}
                                </span>
                                <span className="font-bold text-[var(--ink)]">
                                  {comment.authorName}
                                </span>
                                <span className="text-[var(--ink-soft)]">
                                  {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                              <div>
                                {comment.resolvedAt ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                                    Đã giải quyết bởi {comment.resolvedBy}
                                  </span>
                                ) : (
                                  canReviewComment && (
                                    <ResolveCommentButton
                                      commentId={comment.id}
                                      lessonId={lessonId}
                                    />
                                  )
                                )}
                              </div>
                            </div>
                            <p className="mt-2.5 text-xs leading-relaxed text-[var(--ink)]">
                              {comment.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Workflow Actions toolbar */}
                <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-5">
                  {state.activeVersion.status === "DRAFT" && (
                    <>
                      {canEdit && (
                        <>
                          <SubmitReviewButton
                            lessonId={lessonId}
                            versionId={state.activeVersion.id}
                          />
                          <Link
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-[var(--ink)] hover:bg-[#edf0f4]"
                            href={`/lessons/${lessonId}/edit`}
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                            Tiếp tục soạn thảo
                          </Link>
                          <CancelVersionDialog
                            lessonId={lessonId}
                            versionId={state.activeVersion.id}
                          />
                        </>
                      )}
                    </>
                  )}

                  {state.activeVersion.status === "IN_REVIEW" && (
                    <>
                      {canReviewApprove && (
                        <ApproveDialog lessonId={lessonId} versionId={state.activeVersion.id} />
                      )}
                      <Link
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-[var(--navy)] hover:bg-[#edf0f4]"
                        href={`/lessons/${lessonId}/preview`}
                      >
                        <HugeiconsIcon icon={ViewIcon} size={16} />
                        Xem trước nội dung
                      </Link>
                    </>
                  )}

                  {state.activeVersion.status === "CHANGES_REQUESTED" && (
                    <>
                      {canEdit && (
                        <>
                          <ResumeEditingButton
                            lessonId={lessonId}
                            versionId={state.activeVersion.id}
                          />
                          <CancelVersionDialog
                            lessonId={lessonId}
                            versionId={state.activeVersion.id}
                          />
                        </>
                      )}
                    </>
                  )}

                  {state.activeVersion.status === "APPROVED" && (
                    <>
                      {canPublish && (
                        <>
                          <PublishNowDialog
                            lessonId={lessonId}
                            versionId={state.activeVersion.id}
                          />
                          <ScheduleDialog lessonId={lessonId} versionId={state.activeVersion.id} />
                        </>
                      )}
                      <Link
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-[var(--navy)] hover:bg-[#edf0f4]"
                        href={`/lessons/${lessonId}/preview`}
                      >
                        <HugeiconsIcon icon={ViewIcon} size={16} />
                        Xem trước nội dung
                      </Link>
                    </>
                  )}

                  {state.activeVersion.status === "SCHEDULED" && (
                    <>
                      {canPublish && (
                        <>
                          <PublishNowDialog
                            lessonId={lessonId}
                            versionId={state.activeVersion.id}
                          />
                          <CancelScheduleButton
                            lessonId={lessonId}
                            versionId={state.activeVersion.id}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--ink-soft)]">
                  Hiện tại bài học không có bản nháp hoặc quy trình review nào đang diễn ra.
                </p>
                {state.publicationStatus === "PUBLISHED" && canCreate && (
                  <div className="mt-5">
                    <ClonePublishedVersionButton lessonId={lessonId} />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Versions Timeline Section */}
          <section className="admin-panel admin-enter p-6 sm:p-7">
            <div className="border-b border-[var(--line)] pb-4">
              <h3 className="font-heading text-lg font-bold text-[var(--navy)]">
                Lịch sử các phiên bản ({state.allVersions.length})
              </h3>
              <p className="text-xs text-[var(--ink-soft)]">
                Danh sách tất cả các phiên bản đã được tạo cho bài học này.
              </p>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--ink-soft)]">
                    <th className="py-3 pr-4 font-bold">Version</th>
                    <th className="py-3 px-4 font-bold">Trạng thái</th>
                    <th className="py-3 px-4 font-bold">Người sửa</th>
                    <th className="py-3 px-4 font-bold">Ngày tạo</th>
                    <th className="py-3 px-4 font-bold">Ngày phát hành</th>
                    <th className="py-3 pl-4 text-right font-bold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {state.allVersions.map((v) => (
                    <tr className="hover:bg-[#fbf9f4]" key={v.id}>
                      <td className="py-3.5 pr-4 font-bold text-[var(--navy)]">
                        v{v.versionNumber}.{v.revision}
                        {v.isActiveWorkflow && (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                            Active
                          </span>
                        )}
                        {v.id === state.currentPublishedVersionId && (
                          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            Current Live
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                            statusToneMap[v.status] ?? "bg-gray-100"
                          }`}
                        >
                          {statusLabels[v.status] ?? v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--ink-soft)]">{v.lastEditedBy}</td>
                      <td className="py-3.5 px-4 text-[var(--ink-soft)]">
                        {new Date(v.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--ink-soft)]">
                        {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Link
                          className="font-bold text-[var(--navy-bright)] hover:underline"
                          href={`/lessons/${lessonId}/preview?version=${v.id}`}
                        >
                          Xem trước
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar Actions Column */}
        <div className="space-y-6">
          {/* Lifecycle & Safety Actions Panel */}
          <section className="admin-panel admin-enter p-5">
            <h4 className="font-heading text-sm font-bold text-[var(--navy)]">
              Quản lý Vòng đời & An toàn
            </h4>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Các thao tác phát hành mức bài học.
            </p>

            <div className="mt-5 space-y-3">
              {/* Rollback */}
              {canRollback && supersededVersions.length > 0 && (
                <RollbackDialog lessonId={lessonId} supersededVersions={supersededVersions} />
              )}

              {/* Archive / Restore */}
              {canArchive && state.publicationStatus === "PUBLISHED" && (
                <ArchiveRestoreDialog isArchived={false} lessonId={lessonId} />
              )}
              {canArchive && state.publicationStatus === "ARCHIVED" && (
                <ArchiveRestoreDialog isArchived={true} lessonId={lessonId} />
              )}

              {/* Emergency Withdraw */}
              {canWithdraw && state.publicationStatus !== "WITHDRAWN" && (
                <WithdrawDialog lessonId={lessonId} />
              )}

              {state.publicationStatus === "WITHDRAWN" && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <p className="font-bold">Bài học đã bị gỡ khẩn cấp</p>
                  <p className="mt-1">
                    Toàn bộ học viên đã bị chặn. Để khôi phục cần quy trình bảo mật riêng.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Quick links & summary */}
          <section className="admin-panel admin-enter p-5 text-xs text-[var(--ink-soft)] space-y-3">
            <h4 className="font-heading text-sm font-bold text-[var(--navy)]">Thông tin nhanh</h4>
            <div className="space-y-1.5 pt-1">
              <p>
                <strong>Tổng số phiên bản:</strong> {state.allVersions.length}
              </p>
              <p>
                <strong>Số nhận xét review:</strong> {state.reviewComments.length}
              </p>
              <p>
                <strong>Phiên bản đã từng phát hành:</strong> {supersededVersions.length}
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
