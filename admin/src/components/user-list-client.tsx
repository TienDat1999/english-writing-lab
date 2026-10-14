"use client";

import {
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  LockIcon,
  Search01Icon,
  Shield01Icon,
  UserGroupIcon,
  UserIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import type { UserListItemView } from "@/server/users";

type Props = {
  users: UserListItemView[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  canManage: boolean;
  onSuspendUserAction: (targetUserId: string, reason: string) => Promise<void>;
  onActivateUserAction: (targetUserId: string, reason: string) => Promise<void>;
};

export function UserListClient({
  users,
  totalCount,
  totalPages,
  currentPage,
  canManage,
  onSuspendUserAction,
  onActivateUserAction,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") || "";
  const currentStatus = searchParams.get("status") || "ALL";

  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [suspendModalUser, setSuspendModalUser] = useState<UserListItemView | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  function applyFilter(params: { q?: string; status?: string; page?: number }) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (params.q !== undefined) {
      if (params.q.trim()) nextParams.set("q", params.q.trim());
      else nextParams.delete("q");
      nextParams.delete("page");
    }
    if (params.status !== undefined) {
      if (params.status !== "ALL") nextParams.set("status", params.status);
      else nextParams.delete("status");
      nextParams.delete("page");
    }
    if (params.page !== undefined) {
      if (params.page > 1) nextParams.set("page", String(params.page));
      else nextParams.delete("page");
    }
    startTransition(() => {
      router.push(`/users?${nextParams.toString()}`);
    });
  }

  async function handleSuspendSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!suspendModalUser || !suspendReason.trim()) return;

    setActionLoadingId(suspendModalUser.id);
    await onSuspendUserAction(suspendModalUser.id, suspendReason);
    setActionLoadingId(null);
    setSuspendModalUser(null);
    setSuspendReason("");
  }

  async function handleActivate(user: UserListItemView) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản của "${user.name}" (${user.email})?`)) {
      return;
    }
    setActionLoadingId(user.id);
    await onActivateUserAction(user.id, "Mở khóa theo yêu cầu hỗ trợ người dùng");
    setActionLoadingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-2">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "ACTIVE", label: "Đang hoạt động" },
            { id: "SUSPENDED", label: "Bị khóa" },
          ].map((tab) => {
            const active = currentStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => applyFilter({ status: tab.id })}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-[var(--navy)] text-white shadow-sm"
                    : "border border-[var(--line)] bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilter({ q: searchQuery });
          }}
          className="flex items-center gap-2"
        >
          <div className="relative w-80">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email học viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-white pl-9 pr-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl bg-[var(--navy)] px-4 text-xs font-bold text-white shadow-sm hover:bg-[var(--navy-bright)] transition"
          >
            Tìm
          </button>
          {currentSearch && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                applyFilter({ q: "" });
              }}
              className="h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Xóa lọc
            </button>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <HugeiconsIcon icon={UserGroupIcon} size={24} />
            </div>
            <p className="mt-4 text-sm font-bold text-[var(--ink)]">Không tìm thấy học viên nào</p>
            <p className="mt-1 text-xs text-slate-500">
              Hãy kiểm tra lại từ khóa tìm kiếm hoặc bộ lọc trạng thái.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-4">Học viên</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5 text-center">Bài nộp IELTS</th>
                  <th className="px-4 py-3.5 text-center">Band IELTS TB</th>
                  <th className="px-4 py-3.5 text-center">Kho từ vựng (SRS)</th>
                  <th className="px-4 py-3.5">Ngày tham gia</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-slate-700">
                {users.map((user) => {
                  const isSuspended = user.status === "SUSPENDED";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name}
                              width={36}
                              height={36}
                              className="size-9 rounded-full object-cover border border-[var(--line)]"
                            />
                          ) : (
                            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/users/${user.id}`}
                                className="font-bold text-sm text-[var(--ink)] hover:text-[var(--navy)] hover:underline"
                              >
                                {user.name}
                              </Link>
                              {user.staffRoles.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                                  <HugeiconsIcon icon={Shield01Icon} size={10} />
                                  {user.staffRoles.join(", ")}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isSuspended ? (
                          <div className="group/tip relative inline-block">
                            <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                              <HugeiconsIcon icon={LockIcon} size={11} />
                              Đã khóa
                            </span>
                            {user.suspendedReason && (
                              <div className="absolute left-0 bottom-full mb-1 hidden w-48 rounded-lg bg-slate-800 p-2 text-[10px] text-white shadow-lg group-hover/tip:block z-20">
                                <span className="font-bold">Lý do:</span> {user.suspendedReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} />
                            Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Submissions Count */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="font-bold text-slate-800">
                          {user.metrics.submissionsCount} bài
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {user.metrics.completedSubmissions} đạt / {user.metrics.failedSubmissions} lỗi
                        </div>
                      </td>

                      {/* Average IELTS Band */}
                      <td className="px-4 py-3.5 text-center">
                        {user.metrics.avgBand !== null ? (
                          <span className="inline-block rounded-lg bg-amber-50 px-2 py-0.5 font-bold text-amber-900 border border-amber-200">
                            Band {user.metrics.avgBand}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có</span>
                        )}
                      </td>

                      {/* Learning Items & Reviews */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="font-bold text-slate-800">
                          {user.metrics.learningItemsCount} mục
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {user.metrics.reviewAttemptsCount} lượt ôn
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManage && (
                            <>
                              {isSuspended ? (
                                <button
                                  disabled={actionLoadingId === user.id}
                                  onClick={() => handleActivate(user)}
                                  title="Mở khóa tài khoản"
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                                >
                                  Mở khóa
                                </button>
                              ) : (
                                <button
                                  disabled={actionLoadingId === user.id}
                                  onClick={() => setSuspendModalUser(user)}
                                  title="Khóa tài khoản"
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition disabled:opacity-50"
                                >
                                  <HugeiconsIcon icon={LockIcon} size={12} />
                                  Khóa
                                </button>
                              )}
                            </>
                          )}

                          <Link
                            href={`/users/${user.id}`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-slate-50 px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
                          >
                            <HugeiconsIcon icon={ViewIcon} size={12} />
                            Hồ sơ
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--line)] px-6 py-4">
            <span className="text-xs text-slate-500">
              Tổng số <span className="font-bold text-slate-800">{totalCount}</span> học viên (Trang {currentPage}/{totalPages})
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1 || isPending}
                onClick={() => applyFilter({ page: currentPage - 1 })}
                className="h-8 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  Math.abs(pageNum - currentPage) <= 1
                ) {
                  return (
                    <button
                      key={pageNum}
                      disabled={isPending}
                      onClick={() => applyFilter({ page: pageNum })}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                        pageNum === currentPage
                          ? "bg-[var(--navy)] text-white shadow-sm"
                          : "border border-[var(--line)] bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === 2 && currentPage > 3) {
                  return (
                    <span key={pageNum} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                  return (
                    <span key={pageNum} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
              <button
                disabled={currentPage >= totalPages || isPending}
                onClick={() => applyFilter({ page: currentPage + 1 })}
                className="h-8 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suspend User Modal */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="text-base font-bold text-rose-700 flex items-center gap-1.5">
                  <HugeiconsIcon icon={LockIcon} size={18} />
                  Khóa tài khoản học viên
                </h3>
                <p className="text-xs text-slate-500">
                  Học viên sẽ tạm thời không thể đăng nhập hoặc nộp bài.
                </p>
              </div>
              <button
                onClick={() => setSuspendModalUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSuspendSubmit} className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-[var(--line)]">
                <p className="font-bold text-slate-800">{suspendModalUser.name}</p>
                <p className="text-slate-500 font-mono">{suspendModalUser.email}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700">Lý do khóa tài khoản *</label>
                <textarea
                  required
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Ví dụ: Vi phạm quy định chống gian lận, spam nộp bài liên tục, v.v."
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-3 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={() => setSuspendModalUser(null)}
                  className="h-9 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
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
