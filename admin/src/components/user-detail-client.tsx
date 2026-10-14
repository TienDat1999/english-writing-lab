"use client";

import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowReloadHorizontalIcon,
  BookOpen01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Layers01Icon,
  LockIcon,
  Shield01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type {
  EnrollmentOption,
  UserDetailView,
} from "@/server/users";

type Props = {
  detail: UserDetailView;
  enrollmentOptions: {
    lessons: EnrollmentOption[];
    collections: EnrollmentOption[];
  };
  canManage: boolean;
  onSuspendAction: (reason: string) => Promise<void>;
  onActivateAction: (reason: string) => Promise<void>;
  onEnrollLessonAction: (lessonId: string, reason: string) => Promise<void>;
  onEnrollCollectionAction: (collectionId: string, reason: string) => Promise<void>;
  onResetProgressAction: (topicText: string | undefined, mode: "FRESH_SRS" | "REMOVE", reason: string) => Promise<void>;
  onRetrySubmissionAction: (submissionId: string, reason: string) => Promise<void>;
};

export function UserDetailClient({
  detail,
  enrollmentOptions,
  canManage,
  onSuspendAction,
  onActivateAction,
  onEnrollLessonAction,
  onEnrollCollectionAction,
  onResetProgressAction,
  onRetrySubmissionAction,
}: Props) {
  const { user, metrics, submissions, topics, recentReviews, auditLogs } = detail;

  const [activeTab, setActiveTab] = useState<"SUBMISSIONS" | "TOPICS" | "REVIEWS" | "AUDIT">("SUBMISSIONS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollType, setEnrollType] = useState<"LESSON" | "COLLECTION">("LESSON");
  const [selectedEnrollId, setSelectedEnrollId] = useState("");
  const [enrollReason, setEnrollReason] = useState("");

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTopic, setResetTopic] = useState<string>("ALL");
  const [resetMode, setResetMode] = useState<"FRESH_SRS" | "REMOVE">("FRESH_SRS");
  const [resetReason, setResetReason] = useState("");

  async function handleSuspend(e: React.FormEvent) {
    e.preventDefault();
    if (!suspendReason.trim()) return;
    setIsSubmitting(true);
    await onSuspendAction(suspendReason);
    setIsSubmitting(false);
    setIsSuspendModalOpen(false);
    setSuspendReason("");
  }

  async function handleActivate() {
    if (!confirm(`Bạn có chắc muốn mở khóa cho tài khoản ${user.email}?`)) return;
    setIsSubmitting(true);
    await onActivateAction("Mở khóa theo yêu cầu hỗ trợ người dùng");
    setIsSubmitting(false);
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEnrollId || !enrollReason.trim()) return;
    setIsSubmitting(true);
    if (enrollType === "LESSON") {
      await onEnrollLessonAction(selectedEnrollId, enrollReason);
    } else {
      await onEnrollCollectionAction(selectedEnrollId, enrollReason);
    }
    setIsSubmitting(false);
    setIsEnrollModalOpen(false);
    setSelectedEnrollId("");
    setEnrollReason("");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetReason.trim()) return;
    setIsSubmitting(true);
    const targetTopic = resetTopic === "ALL" ? undefined : resetTopic;
    await onResetProgressAction(targetTopic, resetMode, resetReason);
    setIsSubmitting(false);
    setIsResetModalOpen(false);
    setResetReason("");
  }

  async function handleRetrySubmission(submissionId: string) {
    if (!confirm("Kích hoạt xếp hàng chấm lại bài này cho học viên?")) return;
    setIsSubmitting(true);
    await onRetrySubmissionAction(submissionId, "Hỗ trợ chấm lại bài viết do lỗi hệ thống");
    setIsSubmitting(false);
  }

  const isSuspended = user.status === "SUSPENDED";

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/users"
            className="flex size-10 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>

          <div className="flex items-center gap-3.5">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={48}
                height={48}
                className="size-12 rounded-full object-cover border border-[var(--line)]"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-[var(--ink)]">{user.name}</h1>
                {isSuspended ? (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                    <HugeiconsIcon icon={LockIcon} size={12} />
                    Đã khóa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                    Đang hoạt động
                  </span>
                )}
                {user.staffRoles.length > 0 && (
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                    Staff: {user.staffRoles.join(", ")}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Support Actions */}
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedEnrollId(enrollmentOptions.lessons[0]?.id || "");
                setIsEnrollModalOpen(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--navy)] px-3.5 text-xs font-bold text-white shadow-sm hover:bg-[var(--navy-bright)] transition"
            >
              <HugeiconsIcon icon={BookOpen01Icon} size={14} />
              Ghi danh học viên
            </button>

            <button
              onClick={() => setIsResetModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} />
              Reset tiến độ
            </button>

            {isSuspended ? (
              <button
                disabled={isSubmitting}
                onClick={handleActivate}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition disabled:opacity-50"
              >
                Mở khóa tài khoản
              </button>
            ) : (
              <button
                onClick={() => setIsSuspendModalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                <HugeiconsIcon icon={LockIcon} size={14} />
                Khóa tài khoản
              </button>
            )}
          </div>
        )}
      </div>

      {/* Suspended Alert banner */}
      {isSuspended && user.suspendedReason && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
          <HugeiconsIcon icon={AlertCircleIcon} size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Tài khoản này hiện đang bị khóa</h4>
            <p className="mt-0.5">
              <span className="font-semibold">Lý do:</span> {user.suspendedReason}
            </p>
            {user.suspendedAt && (
              <p className="mt-1 text-[11px] text-rose-600">
                Khóa vào lúc: {new Date(user.suspendedAt).toLocaleString("vi-VN")} bởi {user.suspendedByName || "Admin"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Submissions */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Bài viết IELTS đã nộp</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[var(--ink)]">
              {metrics.submissionsCount}
            </span>
            <span className="text-xs text-slate-400">bài</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold">{metrics.completedSubmissions} thành công</span>
            <span>•</span>
            <span className="text-rose-600 font-semibold">{metrics.failedSubmissions} lỗi</span>
          </div>
        </div>

        {/* IELTS Band */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Dải điểm IELTS ước tính</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-900">
              {metrics.avgBand !== null ? `Band ${metrics.avgBand}` : "—"}
            </span>
            <span className="text-xs text-slate-400">trung bình</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span>Cao nhất: <strong>{metrics.highestBand !== null ? `Band ${metrics.highestBand}` : "—"}</strong></span>
            <span>•</span>
            <span>Gần nhất: <strong>{metrics.latestBand !== null ? `Band ${metrics.latestBand}` : "—"}</strong></span>
          </div>
        </div>

        {/* Learning Items SRS */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Kho từ vựng & mẫu câu (SRS)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[var(--ink)]">
              {metrics.learningItemsCount}
            </span>
            <span className="text-xs text-slate-400">mục</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold">{metrics.masteredItemsCount} thành thạo</span>
            <span>•</span>
            <span className="text-sky-700 font-semibold">{metrics.practicingItemsCount} đang rèn luyện</span>
          </div>
        </div>

        {/* Review Attempts */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Lượt ôn tập lặp lại (Spaced)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-900">
              {metrics.reviewAttemptsCount}
            </span>
            <span className="text-xs text-slate-400">lượt</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Tham gia từ {new Date(user.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-[var(--line)] gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab("SUBMISSIONS")}
            className={`pb-3 transition ${
              activeTab === "SUBMISSIONS"
                ? "border-b-2 border-[var(--navy)] text-[var(--navy)]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Bài nộp IELTS ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab("TOPICS")}
            className={`pb-3 transition ${
              activeTab === "TOPICS"
                ? "border-b-2 border-[var(--navy)] text-[var(--navy)]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Chủ đề & Tiến độ SRS ({topics.length})
          </button>
          <button
            onClick={() => setActiveTab("REVIEWS")}
            className={`pb-3 transition ${
              activeTab === "REVIEWS"
                ? "border-b-2 border-[var(--navy)] text-[var(--navy)]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Lịch sử Ôn tập ({recentReviews.length})
          </button>
          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`pb-3 transition ${
              activeTab === "AUDIT"
                ? "border-b-2 border-[var(--navy)] text-[var(--navy)]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Nhật ký Hỗ trợ ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: Submissions */}
        {activeTab === "SUBMISSIONS" && (
          <div className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden shadow-sm">
            {submissions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Học viên này chưa nộp bài viết nào.
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {submissions.map((sub) => {
                  const isCompleted = sub.status === "COMPLETED";
                  const isFailed = sub.status === "FAILED";

                  return (
                    <div key={sub.id} className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                            {sub.taskType === "TASK_1" ? "IELTS Task 1" : "IELTS Task 2"}
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {sub.questionType}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isFailed
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {sub.status}
                          </span>
                          {sub.estimatedOverallBand !== undefined && sub.estimatedOverallBand !== null && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-900">
                              Band {sub.estimatedOverallBand}
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 text-xs text-slate-700 line-clamp-2">
                          {sub.summaryVi || "Bài viết đang chờ xử lý hoặc chưa có nhận xét tóm tắt."}
                        </p>

                        {isFailed && sub.failureReason && (
                          <p className="mt-1 text-[11px] text-rose-600 font-mono">
                            Lỗi: {sub.failureReason}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                          <span>{sub.wordCount} từ</span>
                          <span>•</span>
                          <span>Nộp lúc: {new Date(sub.submittedAt).toLocaleString("vi-VN")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isFailed && canManage && (
                          <button
                            disabled={isSubmitting}
                            onClick={() => handleRetrySubmission(sub.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 shadow-sm transition disabled:opacity-50"
                          >
                            <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={13} />
                            Chấm lại
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Topics */}
        {activeTab === "TOPICS" && (
          <div className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden shadow-sm">
            {topics.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Học viên chưa ghi danh chủ đề học tập nào.
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {topics.map((t, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                          {t.quizType}
                        </span>
                        <h4 className="text-sm font-bold text-[var(--ink)]">{t.topicText}</h4>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                        <span>Tổng số: <strong>{t.totalItems}</strong> thẻ</span>
                        <span className="text-emerald-700">Thành thạo: <strong>{t.masteredCount}</strong></span>
                        <span className="text-sky-700">Đang luyện: <strong>{t.practicingCount}</strong></span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Ôn gần nhất: {t.lastReviewedAt ? new Date(t.lastReviewedAt).toLocaleDateString("vi-VN") : "Chưa ôn"}</span>
                        <span>•</span>
                        <span>Ôn kế tiếp: {t.nextReviewAt ? new Date(t.nextReviewAt).toLocaleDateString("vi-VN") : "—"}</span>
                      </div>
                    </div>

                    {canManage && (
                      <button
                        onClick={() => {
                          setResetTopic(t.topicText);
                          setIsResetModalOpen(true);
                        }}
                        className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition"
                      >
                        Reset chủ đề
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === "REVIEWS" && (
          <div className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden shadow-sm">
            {recentReviews.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Chưa có lượt ôn tập lặp lại nào được ghi nhận.
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {recentReviews.map((r) => {
                  const ratingBadge = {
                    AGAIN: "bg-rose-50 text-rose-700 border-rose-200",
                    HARD: "bg-amber-50 text-amber-800 border-amber-200",
                    GOOD: "bg-sky-50 text-sky-700 border-sky-200",
                    EASY: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  }[r.rating] || "bg-slate-100 text-slate-700";

                  return (
                    <div key={r.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${ratingBadge}`}>
                            {r.rating}
                          </span>
                          {r.score !== null && (
                            <span className="font-bold text-slate-800">
                              Điểm: {r.score}/100
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[var(--ink)]">{r.promptText}</p>
                        <p className="text-slate-500 italic">Đáp án: {r.answerText}</p>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {new Date(r.reviewedAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Support Audit Logs */}
        {activeTab === "AUDIT" && (
          <div className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden shadow-sm">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Chưa có nhật ký can thiệp hỗ trợ nào trên tài khoản này.
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 space-y-1 text-xs hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200 font-mono">
                          {log.action}
                        </span>
                        <span className="font-semibold text-slate-700">
                          bởi <strong>{log.actorName}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.occurredAt).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    <p className="text-slate-600">
                      <span className="font-semibold">Lý do:</span> {log.reason}
                    </p>

                    {Object.keys(log.details).length > 0 && (
                      <pre className="mt-1 rounded-lg bg-slate-50 p-2 text-[10px] font-mono text-slate-600 border border-[var(--line)] overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Enroll Lesson / Collection */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Ghi danh nội dung học tập</h3>
                <p className="text-xs text-slate-500">Mở khóa và nạp bài học vào lộ trình ôn tập SRS của học viên.</p>
              </div>
              <button onClick={() => setIsEnrollModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleEnroll} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Loại nội dung ghi danh</label>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollType("LESSON");
                      setSelectedEnrollId(enrollmentOptions.lessons[0]?.id || "");
                    }}
                    className={`flex-1 rounded-xl py-2 font-bold border transition ${
                      enrollType === "LESSON"
                        ? "border-[var(--navy)] bg-slate-50 text-[var(--navy)]"
                        : "border-[var(--line)] bg-white text-slate-600"
                    }`}
                  >
                    Từng Bài học ({enrollmentOptions.lessons.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollType("COLLECTION");
                      setSelectedEnrollId(enrollmentOptions.collections[0]?.id || "");
                    }}
                    className={`flex-1 rounded-xl py-2 font-bold border transition ${
                      enrollType === "COLLECTION"
                        ? "border-[var(--navy)] bg-slate-50 text-[var(--navy)]"
                        : "border-[var(--line)] bg-white text-slate-600"
                    }`}
                  >
                    Cả Bộ sưu tập ({enrollmentOptions.collections.length})
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">
                  {enrollType === "LESSON" ? "Chọn Bài học cần ghi danh *" : "Chọn Bộ sưu tập cần ghi danh *"}
                </label>
                <select
                  required
                  value={selectedEnrollId}
                  onChange={(e) => setSelectedEnrollId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                >
                  {(enrollType === "LESSON" ? enrollmentOptions.lessons : enrollmentOptions.collections).map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.title} ({opt.detail})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Lý do hỗ trợ ghi danh *</label>
                <textarea
                  required
                  rows={2}
                  value={enrollReason}
                  onChange={(e) => setEnrollReason(e.target.value)}
                  placeholder="Ví dụ: Học viên thanh toán gói khóa học qua chuyển khoản trực tiếp, cần mở khóa thủ công."
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="h-9 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedEnrollId}
                  className="h-9 rounded-xl bg-[var(--navy)] px-5 text-xs font-bold text-white shadow-sm hover:bg-[var(--navy-bright)] transition disabled:opacity-50"
                >
                  Ghi danh ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Progress */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Thiết lập lại tiến độ học tập</h3>
                <p className="text-xs text-slate-500">Đặt lại chu kỳ SRS hoặc xóa bài học khi dữ liệu bị xung đột.</p>
              </div>
              <button onClick={() => setIsResetModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleReset} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Phạm vi áp dụng</label>
                <select
                  value={resetTopic}
                  onChange={(e) => setResetTopic(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                >
                  <option value="ALL">Toàn bộ các chủ đề học của học viên</option>
                  {topics.map((t, idx) => (
                    <option key={idx} value={t.topicText}>
                      Chỉ chủ đề: {t.topicText} ({t.totalItems} thẻ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Phương thức thiết lập lại</label>
                <div className="mt-1 space-y-2">
                  <label className="flex items-start gap-2.5 rounded-xl border border-[var(--line)] p-3 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="resetMode"
                      checked={resetMode === "FRESH_SRS"}
                      onChange={() => setResetMode("FRESH_SRS")}
                      className="mt-0.5 text-[var(--navy)]"
                    />
                    <div>
                      <p className="font-bold text-slate-800">Làm mới chu kỳ SRS (Khuyên dùng)</p>
                      <p className="text-[11px] text-slate-500">
                        Đặt trạng thái tất cả các thẻ về Mới (NEW), lượt lặp về 0 và sẵn sàng ôn tập lại ngay.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 rounded-xl border border-rose-200 p-3 cursor-pointer bg-rose-50/40 hover:bg-rose-50">
                    <input
                      type="radio"
                      name="resetMode"
                      checked={resetMode === "REMOVE"}
                      onChange={() => setResetMode("REMOVE")}
                      className="mt-0.5 text-rose-600"
                    />
                    <div>
                      <p className="font-bold text-rose-800">Xóa khỏi kho từ vựng</p>
                      <p className="text-[11px] text-rose-600">
                        Gỡ toàn bộ các thẻ đã nạp, cho phép học viên bắt đầu lại từ bước ghi danh bài học.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Lý do hỗ trợ reset tiến độ *</label>
                <textarea
                  required
                  rows={2}
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Ví dụ: Học viên yêu cầu học lại từ đầu toàn bộ lộ trình VSTEP Collocations."
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="h-9 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
                >
                  Xác nhận Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Suspend User */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="text-base font-bold text-rose-700 flex items-center gap-1.5">
                  <HugeiconsIcon icon={LockIcon} size={18} />
                  Khóa tài khoản học viên
                </h3>
                <p className="text-xs text-slate-500">Học viên sẽ tạm thời không thể truy cập hệ thống.</p>
              </div>
              <button onClick={() => setIsSuspendModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleSuspend} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Lý do khóa tài khoản *</label>
                <textarea
                  required
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể..."
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-3 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsSuspendModalOpen(false)}
                  className="h-9 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
                >
                  Xác nhận khóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
