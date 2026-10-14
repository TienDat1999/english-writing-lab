"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Delete02Icon,
  Folder01Icon,
  Layers01Icon,
  PencilEdit02Icon,
  Search01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";

import type {
  AvailableLessonItem,
  CollectionDetailView,
} from "@/server/collections";

type Props = {
  collection: CollectionDetailView;
  availableLessons: AvailableLessonItem[];
  canEdit: boolean;
  onUpdateMetadataAction: (formData: FormData) => Promise<void>;
  onUpdateStatusAction: (status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => Promise<void>;
  onAddLessonAction: (lessonId: string) => Promise<void>;
  onRemoveLessonAction: (lessonId: string) => Promise<void>;
  onReorderAction: (orderedLessonIds: string[]) => Promise<void>;
};

export function CollectionDetailClient({
  collection,
  availableLessons,
  canEdit,
  onUpdateMetadataAction,
  onUpdateStatusAction,
  onAddLessonAction,
  onRemoveLessonAction,
  onReorderAction,
}: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingIds = new Set(collection.lessonIds);
  const unassignedLessons = availableLessons.filter(
    (l) =>
      !existingIds.has(l.id) &&
      (l.title.toLowerCase().includes(lessonSearch.toLowerCase()) ||
        l.slug.toLowerCase().includes(lessonSearch.toLowerCase())),
  );

  async function handleMove(index: number, direction: "UP" | "DOWN") {
    if (isSubmitting) return;
    const items = [...collection.items];
    const targetIdx = direction === "UP" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const [moved] = items.splice(index, 1);
    items.splice(targetIdx, 0, moved);

    setIsSubmitting(true);
    await onReorderAction(items.map((i) => i.lessonId));
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/collections"
            className="flex size-10 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                  collection.status === "PUBLISHED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : collection.status === "DRAFT"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {collection.status}
              </span>
              <span className="rounded-lg bg-purple-100 px-2 py-0.5 text-xs font-extrabold text-purple-800">
                {collection.accessTier}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--ink)]">
              {collection.title}
            </h1>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {collection.status === "DRAFT" && (
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  await onUpdateStatusAction("PUBLISHED");
                  setIsSubmitting(false);
                }}
                className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
              >
                Xuất bản bộ sưu tập
              </button>
            )}
            {collection.status === "PUBLISHED" && (
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  await onUpdateStatusAction("ARCHIVED");
                  setIsSubmitting(false);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Lưu trữ
              </button>
            )}
            {collection.status === "ARCHIVED" && (
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  await onUpdateStatusAction("DRAFT");
                  setIsSubmitting(false);
                }}
                className="h-10 rounded-xl border border-amber-200 bg-amber-50 px-4 text-xs font-bold text-amber-800 hover:bg-amber-100 transition disabled:opacity-50"
              >
                Khôi phục về Nháp
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Lessons in Collection */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">
                Danh sách Bài học trong Bộ sưu tập ({collection.items.length})
              </h2>
              <p className="text-xs text-slate-500">
                Sắp xếp thứ tự học theo lộ trình từ trên xuống dưới.
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--navy)] px-3.5 text-xs font-bold text-white shadow-sm hover:bg-[var(--navy-bright)] transition"
              >
                <HugeiconsIcon icon={Add01Icon} size={14} />
                Thêm bài học
              </button>
            )}
          </div>

          {collection.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] bg-slate-50/50 p-10 text-center">
              <HugeiconsIcon icon={Layers01Icon} size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-bold text-[var(--ink)]">
                Chưa có bài học nào trong bộ sưu tập
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Nhấn &quot;Thêm bài học&quot; để chọn các bài học đã phát hành đưa vào lộ trình này.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
              {collection.items.map((item, idx) => (
                <div
                  key={item.lessonId}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-600">
                      {idx + 1}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                          {item.primarySkill}
                        </span>
                        {item.levelMin && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {item.levelMin}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-0.5 text-sm font-bold text-[var(--ink)]">
                        <Link
                          href={`/lessons/${item.lessonId}`}
                          className="hover:text-[var(--navy)] hover:underline"
                        >
                          {item.title}
                        </Link>
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400">/{item.slug}</p>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0 || isSubmitting}
                        onClick={() => handleMove(idx, "UP")}
                        title="Di chuyển lên"
                        className="flex size-8 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition"
                      >
                        <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
                      </button>
                      <button
                        disabled={idx === collection.items.length - 1 || isSubmitting}
                        onClick={() => handleMove(idx, "DOWN")}
                        title="Di chuyển xuống"
                        className="flex size-8 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition"
                      >
                        <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                      </button>
                      <button
                        disabled={isSubmitting}
                        onClick={async () => {
                          if (confirm(`Bạn có chắc muốn xóa bài "${item.title}" khỏi bộ sưu tập?`)) {
                            setIsSubmitting(true);
                            await onRemoveLessonAction(item.lessonId);
                            setIsSubmitting(false);
                          }
                        }}
                        title="Xóa khỏi bộ sưu tập"
                        className="flex size-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition ml-1"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Metadata Edit Form */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[var(--ink)]">Thông tin Bộ sưu tập</h3>
            <p className="mt-0.5 text-xs text-slate-500">Chỉnh sửa thông tin và phân quyền truy cập.</p>

            <form
              action={async (formData) => {
                setIsSubmitting(true);
                await onUpdateMetadataAction(formData);
                setIsSubmitting(false);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700">Tiêu đề (Tiếng Việt) *</label>
                <input
                  required
                  name="titleVi"
                  defaultValue={collection.title}
                  className="mt-1 h-9 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Tiêu đề (Tiếng Anh)</label>
                <input
                  name="titleEn"
                  defaultValue={collection.titleEn}
                  className="mt-1 h-9 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Slug Tiếng Việt *</label>
                <input
                  required
                  name="slugVi"
                  defaultValue={collection.slug}
                  className="mt-1 h-9 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs font-mono outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Slug Tiếng Anh</label>
                <input
                  name="slugEn"
                  defaultValue={collection.slugEn}
                  className="mt-1 h-9 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs font-mono outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Mô tả tóm tắt</label>
                <textarea
                  name="descriptionVi"
                  rows={3}
                  defaultValue={collection.description}
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Phân hạng</label>
                  <select
                    name="accessTier"
                    defaultValue={collection.accessTier}
                    className="mt-1 h-9 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PREMIUM">PREMIUM</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Hiển thị</label>
                  <select
                    name="visibility"
                    defaultValue={collection.visibility}
                    className="mt-1 h-9 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="UNLISTED">UNLISTED</option>
                    <option value="PRIVATE">PRIVATE</option>
                  </select>
                </div>
              </div>

              {canEdit && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-9 w-full rounded-xl bg-[var(--navy)] text-xs font-bold text-white shadow-sm hover:bg-[var(--navy-bright)] transition disabled:opacity-50"
                >
                  Lưu thay đổi
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Modal Thêm bài học vào Collection */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Thêm Bài học vào Bộ sưu tập</h3>
                <p className="text-xs text-slate-500">
                  Chọn các bài học đã phát hành để bổ sung vào danh sách.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài học theo tiêu đề hoặc slug..."
                  value={lessonSearch}
                  onChange={(e) => setLessonSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-white pl-9 pr-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]"
                />
              </div>

              <div className="mt-4 max-h-80 divide-y divide-[var(--line)] overflow-y-auto rounded-xl border border-[var(--line)]">
                {unassignedLessons.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Không tìm thấy bài học khả dụng nào phù hợp.
                  </div>
                ) : (
                  unassignedLessons.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                            {l.primarySkill}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {l.level}
                          </span>
                        </div>
                        <h5 className="mt-1 text-xs font-bold text-[var(--ink)]">{l.title}</h5>
                        <p className="text-[10px] font-mono text-slate-400">/{l.slug}</p>
                      </div>

                      <button
                        disabled={isSubmitting}
                        onClick={async () => {
                          setIsSubmitting(true);
                          await onAddLessonAction(l.id);
                          setIsSubmitting(false);
                          setIsAddModalOpen(false);
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--navy)] px-3 text-xs font-bold text-white hover:bg-[var(--navy-bright)] transition disabled:opacity-50"
                      >
                        <HugeiconsIcon icon={Add01Icon} size={14} />
                        Thêm
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end border-t border-[var(--line)] pt-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="h-9 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
