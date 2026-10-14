"use client";

import {
  Add01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Folder01Icon,
  Layers01Icon,
  PencilEdit02Icon,
  Search01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";

import type { CollectionItemView } from "@/server/collections";

type Props = {
  collections: CollectionItemView[];
  canEdit: boolean;
  onCreateAction: (formData: FormData) => Promise<void>;
  onUpdateStatusAction: (collectionId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => Promise<void>;
};

export function CollectionListClient({
  collections,
  canEdit,
  onCreateAction,
  onUpdateStatusAction,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Form state for auto slugify
  const [titleVi, setTitleVi] = useState("");
  const [slugVi, setSlugVi] = useState("");
  const [slugEn, setSlugEn] = useState("");

  function handleTitleChange(value: string) {
    setTitleVi(value);
    const generated = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlugVi(generated);
    setSlugEn(generated);
  }

  const filtered = collections.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    ALL: collections.length,
    PUBLISHED: collections.filter((c) => c.status === "PUBLISHED").length,
    DRAFT: collections.filter((c) => c.status === "DRAFT").length,
    ARCHIVED: collections.filter((c) => c.status === "ARCHIVED").length,
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {(["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                statusFilter === s
                  ? "bg-[var(--navy)] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-[var(--line)]"
              }`}
            >
              {s === "ALL" && "Tất cả"}
              {s === "PUBLISHED" && "Đã phát hành"}
              {s === "DRAFT" && "Bản nháp"}
              {s === "ARCHIVED" && "Lưu trữ"}
              <span className="ml-1.5 opacity-70 font-normal">({counts[s]})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm bộ sưu tập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-white pl-9 pr-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
            />
          </div>

          {canEdit && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--navy)] px-4 text-xs font-bold text-white shadow-sm hover:bg-[var(--navy-bright)] transition"
            >
              <HugeiconsIcon icon={Add01Icon} size={16} />
              Tạo bộ sưu tập
            </button>
          )}
        </div>
      </div>

      {/* Collections Grid / List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <HugeiconsIcon icon={Folder01Icon} size={24} />
          </div>
          <p className="mt-4 text-sm font-bold text-[var(--ink)]">Không tìm thấy bộ sưu tập nào</p>
          <p className="mt-1 text-xs text-slate-500">
            Hãy tạo bộ sưu tập đầu tiên để gom nhóm các bài học theo chủ đề hoặc lộ trình học tập.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isPublished = item.status === "PUBLISHED";
            const isDraft = item.status === "DRAFT";
            const isArchived = item.status === "ARCHIVED";

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm transition hover:border-[var(--navy-bright)]/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                          isPublished
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isDraft
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {isPublished && <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />}
                        {isDraft && <HugeiconsIcon icon={Clock01Icon} size={12} />}
                        {item.status}
                      </span>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                          item.accessTier === "PREMIUM"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {item.accessTier}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400">
                      {item.itemCount} bài học
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-[var(--ink)] group-hover:text-[var(--navy)] transition">
                    <Link href={`/collections/${item.id}`}>{item.title}</Link>
                  </h3>
                  {item.titleEn && (
                    <p className="mt-0.5 text-xs italic text-slate-400">{item.titleEn}</p>
                  )}

                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                    {item.description || "Chưa có mô tả cho bộ sưu tập này."}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>slug: /{item.slug}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-3">
                  <span className="text-[11px] text-slate-400">
                    Cập nhật: {new Date(item.updatedAt).toLocaleDateString("vi-VN")}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {canEdit && (
                      <>
                        {isDraft && (
                          <button
                            disabled={loadingId === item.id}
                            onClick={async () => {
                              setLoadingId(item.id);
                              await onUpdateStatusAction(item.id, "PUBLISHED");
                              setLoadingId(null);
                            }}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                          >
                            Xuất bản
                          </button>
                        )}
                        {isPublished && (
                          <button
                            disabled={loadingId === item.id}
                            onClick={async () => {
                              setLoadingId(item.id);
                              await onUpdateStatusAction(item.id, "ARCHIVED");
                              setLoadingId(null);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                          >
                            Lưu trữ
                          </button>
                        )}
                        {isArchived && (
                          <button
                            disabled={loadingId === item.id}
                            onClick={async () => {
                              setLoadingId(item.id);
                              await onUpdateStatusAction(item.id, "DRAFT");
                              setLoadingId(null);
                            }}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition disabled:opacity-50"
                          >
                            Khôi phục
                          </button>
                        )}
                      </>
                    )}

                    <Link
                      href={`/collections/${item.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <HugeiconsIcon icon={PencilEdit02Icon} size={12} />
                      Chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Bộ Sưu Tập */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Tạo Bộ sưu tập bài học mới</h3>
                <p className="text-xs text-slate-500">
                  Gom nhóm các bài học thành khóa học hoặc chủ đề liên quan.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await onCreateAction(formData);
                setIsCreateOpen(false);
                setTitleVi("");
                setSlugVi("");
                setSlugEn("");
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700">Tiêu đề Tiếng Việt *</label>
                <input
                  required
                  name="titleVi"
                  value={titleVi}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ví dụ: VSTEP Writing Task 2 Nâng Cao"
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Tiêu đề Tiếng Anh (Tùy chọn)</label>
                <input
                  name="titleEn"
                  placeholder="e.g. Advanced VSTEP Writing Task 2"
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Slug Tiếng Việt *</label>
                  <input
                    required
                    name="slugVi"
                    value={slugVi}
                    onChange={(e) => setSlugVi(e.target.value)}
                    placeholder="vstep-writing-task-2-nang-cao"
                    className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs font-mono outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Slug Tiếng Anh</label>
                  <input
                    name="slugEn"
                    value={slugEn}
                    onChange={(e) => setSlugEn(e.target.value)}
                    placeholder="advanced-vstep-writing-task-2"
                    className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs font-mono outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Mô tả tóm tắt (Tiếng Việt)</label>
                <textarea
                  name="descriptionVi"
                  rows={2}
                  placeholder="Mô tả nội dung trọng tâm của bộ sưu tập..."
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Phân hạng truy cập</label>
                  <select
                    name="accessTier"
                    defaultValue="FREE"
                    className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                  >
                    <option value="FREE">FREE (Miễn phí)</option>
                    <option value="PREMIUM">PREMIUM (Trả phí)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Hiển thị</label>
                  <select
                    name="visibility"
                    defaultValue="PUBLIC"
                    className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                  >
                    <option value="PUBLIC">PUBLIC (Công khai)</option>
                    <option value="UNLISTED">UNLISTED (Ẩn danh sách)</option>
                    <option value="PRIVATE">PRIVATE (Nội bộ)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-9 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-xl bg-[var(--navy)] px-5 text-xs font-bold text-white shadow-sm hover:bg-[var(--navy-bright)] transition"
                >
                  Lưu & Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
