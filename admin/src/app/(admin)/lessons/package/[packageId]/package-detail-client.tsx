"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Edit02Icon,
  PlayIcon,
  PowerServiceIcon,
  Search01Icon,
  Tag01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import type { PackageDetails } from "@/server/content-repository";

const kindLabels: Record<string, { label: string; badge: string }> = {
  TOPIC_VOCABULARY: { label: "Topic Vocabulary", badge: "bg-blue-50 text-blue-800 border-blue-200" },
  SYNONYM: { label: "Synonym (Từ đồng nghĩa)", badge: "bg-purple-50 text-purple-800 border-purple-200" },
  COLLOCATION: { label: "Collocation", badge: "bg-amber-50 text-amber-900 border-amber-200" },
  PARAPHRASE: { label: "Paraphrase", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  TEMPLATE: { label: "Template (Mẫu câu)", badge: "bg-rose-50 text-rose-800 border-rose-200" },
};

export function PackageDetailClient({
  pkg,
  onPublishPackage,
  onUnpublishPackage,
}: {
  pkg: PackageDetails;
  onPublishPackage: () => Promise<void>;
  onUnpublishPackage: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const kindInfo = kindLabels[pkg.kind] || { label: pkg.kind, badge: "bg-slate-100 text-slate-800 border-slate-200" };

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pkg.topicCards;
    return pkg.topicCards.filter((card) => {
      if (card.topicName.toLowerCase().includes(q)) return true;
      if (card.topicCode.toLowerCase().includes(q)) return true;
      if (card.items.some((item) => item.target.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q))) {
        return true;
      }
      return false;
    });
  }, [pkg.topicCards, search]);

  const handlePublishAll = () => {
    startTransition(async () => {
      await onPublishPackage();
    });
  };

  const handleUnpublishAll = () => {
    startTransition(async () => {
      await onUnpublishPackage();
    });
  };

  const isDraft = pkg.status === "DRAFT";

  return (
    <div className="space-y-6">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link
              href={`/lessons?tab=${pkg.kind.toLowerCase()}`}
              className="inline-flex items-center gap-1 hover:text-[var(--navy-bright)] transition"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
              <span>Quay lại Kho bài học</span>
            </Link>
            <span>/</span>
            <span className="text-[var(--ink)] font-bold">{kindInfo.label}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-extrabold text-[var(--ink)] tracking-tight">
              {pkg.title}
            </h1>
            <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${kindInfo.badge}`}>
              {kindInfo.label}
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                pkg.status === "PUBLISHED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-900 border-amber-200"
              }`}
            >
              {pkg.status === "PUBLISHED" ? "🟢 Đã xuất bản" : "🟡 Bản nháp"}
            </span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Quy mô: <strong className="text-[var(--ink)]">{pkg.topicCount} Chủ đề (Topics)</strong> •{" "}
            <strong className="text-[var(--ink)]">{pkg.itemCount} Cụm từ & Câu hỏi Quiz</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isDraft ? (
            <button
              onClick={handlePublishAll}
              disabled={isPending}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 text-xs font-extrabold shadow-sm transition disabled:opacity-50"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
              <span>{isPending ? "Đang xuất bản..." : `Xuất bản toàn bộ (${pkg.topicCount} Topics)`}</span>
            </button>
          ) : (
            <button
              onClick={handleUnpublishAll}
              disabled={isPending}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white hover:bg-slate-50 text-slate-700 px-4 text-xs font-bold transition disabled:opacity-50"
            >
              <HugeiconsIcon icon={PowerServiceIcon} size={16} />
              <span>{isPending ? "Đang xử lý..." : "Hạ tất cả về bản nháp"}</span>
            </button>
          )}

          <Link
            href="/lessons/import"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-[var(--ink)] hover:bg-[#edf0f4] transition"
          >
            <span>+ Tải thêm file CSV</span>
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-[var(--line)] shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <HugeiconsIcon
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            icon={Search01Icon}
            size={16}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên Topic (Environment, Education...) hoặc từ vựng..."
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-slate-50/50 pl-10 pr-3 text-xs outline-none focus:border-[var(--navy-bright)] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Hiển thị <strong className="text-[var(--ink)]">{filteredCards.length}</strong> / {pkg.topicCards.length} Topic Cards
          </span>
        </div>
      </div>

      {/* Topic Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Không tìm thấy Topic nào khớp với từ khóa &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCards.map((card, idx) => {
            return (
              <div
                key={card.lessonId}
                className="admin-panel flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-white p-5 shadow-2xs transition hover:border-[var(--navy-bright)] hover:shadow-xs"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-[var(--line)] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-800 font-mono text-[11px] font-bold">
                        #{idx + 1}
                      </span>
                      <div>
                        <h3 className="font-heading text-sm font-extrabold text-[var(--ink)] line-clamp-1">
                          {card.topicName}
                        </h3>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {card.topicCode}
                        </span>
                      </div>
                    </div>

                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                      {card.exerciseCount} mục
                    </span>
                  </div>

                  {/* Card Items List */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Nội dung bài học:</span>
                    </div>

                    <div className="space-y-1.5 rounded-xl bg-slate-50/70 p-2.5 border border-slate-100 max-h-48 overflow-y-auto">
                      {card.items.slice(0, 5).map((item, itemIdx) => (
                        <div key={itemIdx} className="text-xs flex items-baseline gap-2">
                          <span className="text-slate-400 font-mono text-[10px]">{itemIdx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-[var(--navy)]">{item.target}</span>
                            {item.meaning && (
                              <span className="text-muted-foreground text-[11px] ml-1.5 truncate block">
                                {item.meaning.replace(/Nghĩa:\s*/i, "")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {card.items.length > 5 && (
                        <div className="text-[10px] text-center text-muted-foreground pt-1 italic">
                          + còn {card.items.length - 5} mục khác...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-end gap-2">
                  <Link
                    href={`/lessons/${card.lessonId}`}
                    className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--ink)] hover:bg-slate-50 transition"
                    title="Xem chi tiết bài học"
                  >
                    <HugeiconsIcon icon={ViewIcon} size={13} />
                    <span>Chi tiết</span>
                  </Link>
                  <Link
                    href={`/lessons/${card.lessonId}/edit`}
                    className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50 transition"
                    title="Sửa bài tập"
                  >
                    <HugeiconsIcon icon={Edit02Icon} size={13} />
                    <span>Sửa bài tập</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
