"use client";

import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Delete02Icon,
  FilterIcon,
  Search01Icon,
  SparklesIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UploadedQuizType } from "@/server/learning/learning.contract";
import type {
  LearningItemView,
  PaginatedResult,
  UploadedQuizTopicView,
} from "@/server/learning/learning.service";
import { VstepTemplatePreset } from "./vstep-template-preset";

const statusConfig: Record<
  LearningItemView["status"],
  { label: string; className: string }
> = {
  NEW: { label: "Chưa học", className: "border-blue-200 bg-blue-50 text-blue-800" },
  PRACTICING: { label: "Đang học", className: "border-amber-200 bg-amber-50 text-amber-800" },
  FAMILIAR: { label: "Đang ghi nhớ", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  MASTERED: { label: "Đã thành thạo", className: "border-green-300 bg-green-50 text-green-900" },
  REVIEW: { label: "Đến hạn ôn", className: "border-rose-200 bg-rose-50 text-rose-800" },
};

const sourceTypeLabels: Record<LearningItemView["sourceType"], string> = {
  VOCABULARY: "Từ vựng",
  GRAMMAR: "Ngữ pháp",
  PHRASE: "Cụm từ",
  TRANSLATION: "Bản dịch",
  ESSAY_BLUEPRINT: "Mẫu Blueprint",
  UPLOADED_QUIZ: "Quiz tải lên",
};

function PaginationControls({
  currentPage,
  disabled,
  itemLabel,
  onPageChange,
  pageSize,
  totalItems,
}: {
  currentPage: number;
  disabled?: boolean;
  itemLabel: string;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1) return null;

  const visiblePages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
      <p>
        Hiển thị {firstItem}–{lastItem} / {totalItems} {itemLabel}
      </p>
      <nav aria-label={`Phân trang ${itemLabel}`} className="flex flex-wrap items-center gap-1.5">
        <Button
          disabled={disabled || currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          size="sm"
          type="button"
          variant="outline"
          className="h-7 px-2 text-xs"
        >
          ← Trước
        </Button>
        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];

          return (
            <div className="contents" key={page}>
              {previousPage && page - previousPage > 1 ? (
                <span className="px-1 text-xs text-muted-foreground">…</span>
              ) : null}
              <Button
                aria-current={page === currentPage ? "page" : undefined}
                className="size-7 rounded-md p-0 text-xs"
                disabled={disabled}
                onClick={() => onPageChange(page)}
                size="sm"
                type="button"
                variant={page === currentPage ? "default" : "outline"}
              >
                {page}
              </Button>
            </div>
          );
        })}
        <Button
          disabled={disabled || currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          size="sm"
          type="button"
          variant="outline"
          className="h-7 px-2 text-xs"
        >
          Sau →
        </Button>
      </nav>
    </div>
  );
}

export function LearningLibrary({
  initialItems,
  initialMasteredItems,
  initialUploadedTopics,
}: {
  initialItems: PaginatedResult<LearningItemView>;
  initialMasteredItems: PaginatedResult<LearningItemView>;
  initialUploadedTopics: Record<UploadedQuizType, PaginatedResult<UploadedQuizTopicView>>;
}) {
  const [activeTab, setActiveTab] = useState<"my-topics" | "from-essays" | "mastered">("my-topics");
  const [items, setItems] = useState(initialItems);
  const [masteredItems, setMasteredItems] = useState(initialMasteredItems);
  const [uploadedTopics, setUploadedTopics] = useState(initialUploadedTopics);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);

  // Tab 1 (Chủ đề của tôi) Filter state
  const [selectedQuizCategory, setSelectedQuizCategory] = useState<"ALL" | UploadedQuizType>("ALL");
  const [topicSearchQuery, setTopicSearchQuery] = useState("");
  const [topicStatusFilter, setTopicStatusFilter] = useState<"ALL" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">("ALL");

  // Search & Filter state for from-essays tab
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Essay grouping for from-essays tab
  const essayGroups = useMemo(() => {
    const groups: Array<{
      key: string;
      submissionId: string | null;
      promptText: string;
      taskType?: string;
      submittedAt?: string;
      items: LearningItemView[];
    }> = [];
    const groupMap = new Map<string, (typeof groups)[number]>();

    for (const item of items.items) {
      const key = item.sourceSubmissionId || "standalone";
      let group = groupMap.get(key);
      if (!group) {
        group = {
          key,
          submissionId: item.sourceSubmissionId || null,
          promptText:
            item.submission?.promptText ||
            (item.sourceSubmissionId ? "Bài viết đã làm" : "Mục học tự do / Khác"),
          taskType: item.submission?.taskType,
          submittedAt: item.submission?.submittedAt || item.createdAt,
          items: [],
        };
        groupMap.set(key, group);
        groups.push(group);
      }
      group.items.push(item);
    }

    return groups;
  }, [items.items]);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  function toggleGroupCollapse(groupKey: string) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }

  function collapseAllGroups() {
    const next: Record<string, boolean> = {};
    for (const group of essayGroups) {
      next[group.key] = true;
    }
    setCollapsedGroups(next);
  }

  function expandAllGroups() {
    setCollapsedGroups({});
  }

  // Search state for mastered tab
  const [masteredSearchQuery, setMasteredSearchQuery] = useState("");

  // Delete modal state
  const [pendingDeleteItem, setPendingDeleteItem] = useState<LearningItemView | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && pendingDeleteItem) {
        setPendingDeleteItem(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingDeleteItem]);

  const uploadedQuizSections = [
    {
      quizType: "COLLOCATION" as const,
      badge: "Collocation",
      title: "Collocations theo chủ đề",
      description: "Thực hành điền từ và chọn cụm collocation tự nhiên theo ngữ cảnh.",
      tagBg: "bg-purple-50 text-purple-700 border-purple-200/80",
    },
    {
      quizType: "TOPIC_VOCABULARY" as const,
      badge: "Topic Vocabulary",
      title: "Từ vựng chuyên đề",
      description: "Học từ vựng học thuật theo ngữ cảnh và chủ đề bài thi.",
      tagBg: "bg-amber-50 text-amber-700 border-amber-200/80",
    },
    {
      quizType: "PARAPHRASE" as const,
      badge: "Paraphrase",
      title: "Paraphrase theo chủ đề",
      description: "Đọc nghĩa tiếng Việt và tự gõ cụm từ tiếng Anh tương đương.",
      tagBg: "bg-sky-50 text-sky-700 border-sky-200/80",
    },
    {
      quizType: "SYNONYM" as const,
      badge: "Cặp Synonym",
      title: "Luyện cặp từ đồng nghĩa",
      description: "Xem nghĩa tiếng Việt và phản xạ nhanh từ hoặc cụm từ đồng nghĩa.",
      tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
    {
      quizType: "TEMPLATE" as const,
      badge: "Writing Template",
      title: "VSTEP Writing Templates",
      description: "Lắp ghép từng câu mở bài, thesis, thân bài C-M-E-L và kết bài.",
      tagBg: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    },
  ];

  async function loadItems(page: number, overrideSearch?: string, overrideSource?: string, overrideStatus?: string) {
    setLoadingSection("items");
    const query = overrideSearch !== undefined ? overrideSearch : searchQuery;
    const source = overrideSource !== undefined ? overrideSource : sourceTypeFilter;
    const stat = overrideStatus !== undefined ? overrideStatus : statusFilter;

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(items.pageSize),
    });
    if (query.trim()) params.set("search", query.trim());
    if (source !== "ALL") params.set("sourceType", source);
    if (stat !== "ALL") params.set("status", stat);

    try {
      const response = await fetch(`/api/learning-items?${params.toString()}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { data: PaginatedResult<LearningItemView> };
      setItems(payload.data);
    } finally {
      setLoadingSection(null);
    }
  }

  async function loadMasteredItems(page: number, query?: string) {
    setLoadingSection("mastered");
    const search = query !== undefined ? query : masteredSearchQuery;
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(masteredItems.pageSize),
      status: "MASTERED",
    });
    if (search.trim()) params.set("search", search.trim());

    try {
      const response = await fetch(`/api/learning-items?${params.toString()}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { data: PaginatedResult<LearningItemView> };
      setMasteredItems(payload.data);
    } finally {
      setLoadingSection(null);
    }
  }

  async function loadTopics(quizType: UploadedQuizType, page: number, search?: string) {
    setLoadingSection(quizType);

    try {
      const current = uploadedTopics[quizType];
      const params = new URLSearchParams({
        quizType,
        page: String(page),
        pageSize: String(current.pageSize),
      });
      const query = search !== undefined ? search : topicSearchQuery;
      if (query.trim()) params.set("search", query.trim());

      const response = await fetch(`/api/learning-items/import?${params.toString()}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { data: PaginatedResult<UploadedQuizTopicView> };
      setUploadedTopics((topics) => ({ ...topics, [quizType]: payload.data }));
    } finally {
      setLoadingSection(null);
    }
  }

  async function handleTopicSearch(value: string) {
    setTopicSearchQuery(value);
    const typesToLoad: UploadedQuizType[] =
      selectedQuizCategory === "ALL"
        ? ["COLLOCATION", "TOPIC_VOCABULARY", "PARAPHRASE", "SYNONYM", "TEMPLATE"]
        : [selectedQuizCategory];

    await Promise.all(typesToLoad.map((t) => loadTopics(t, 1, value)));
  }

  async function confirmDelete() {
    if (!pendingDeleteItem || isDeleting) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/learning-items/${pendingDeleteItem.id}`, { method: "DELETE" });
      if (response.ok) {
        setPendingDeleteItem(null);
        await Promise.all([
          loadItems(items.page),
          loadMasteredItems(masteredItems.page),
        ]);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const totalUploadedTopics =
    (uploadedTopics.COLLOCATION?.totalItems ?? 0) +
    (uploadedTopics.TOPIC_VOCABULARY?.totalItems ?? 0) +
    uploadedTopics.PARAPHRASE.totalItems +
    uploadedTopics.SYNONYM.totalItems +
    uploadedTopics.TEMPLATE.totalItems;

  return (
    <>
      {/* Tab Navigation (Thanh lịch & Nhẹ nhàng) */}
      <div className="border-b border-slate-200">
        <nav aria-label="Tabs thư viện học tập" className="-mb-px flex flex-wrap gap-2 sm:gap-6">
          <button
            onClick={() => setActiveTab("my-topics")}
            className={`inline-flex items-center gap-2 border-b-2 py-2.5 px-1 text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "my-topics"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-slate-300 hover:text-foreground"
            }`}
            type="button"
          >
            <HugeiconsIcon icon={BookOpen01Icon} size={16} />
            <span>Chủ đề của tôi</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-mono font-bold text-slate-700">
              {totalUploadedTopics}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("from-essays")}
            className={`inline-flex items-center gap-2 border-b-2 py-2.5 px-1 text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "from-essays"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-slate-300 hover:text-foreground"
            }`}
            type="button"
          >
            <HugeiconsIcon icon={Clock01Icon} size={16} />
            <span>Từ bài viết</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-mono font-bold text-slate-700">
              {items.totalItems}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("mastered")}
            className={`inline-flex items-center gap-2 border-b-2 py-2.5 px-1 text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "mastered"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-muted-foreground hover:border-slate-300 hover:text-foreground"
            }`}
            type="button"
          >
            <HugeiconsIcon icon={SparklesIcon} size={16} />
            <span>Đã thành thạo</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-mono font-bold text-emerald-800">
              {masteredItems.totalItems}
            </span>
          </button>
        </nav>
      </div>

      {/* TAB 1: CHỦ ĐỀ CỦA TÔI */}
      {activeTab === "my-topics" && (
        <div className="space-y-5">
          {/* Banner giới thiệu VSTEP Writing Templates tinh gọn */}
          <VstepTemplatePreset />

          {/* Thanh lọc Khoa học: Danh mục Pills + Tìm kiếm chủ đề */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs md:flex-row md:items-center md:justify-between">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedQuizCategory("ALL")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedQuizCategory === "ALL"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                }`}
              >
                Tất cả ({totalUploadedTopics})
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuizCategory("COLLOCATION")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedQuizCategory === "COLLOCATION"
                    ? "bg-purple-600 text-white shadow-2xs"
                    : "bg-purple-50 text-purple-800 hover:bg-purple-100"
                }`}
              >
                Collocation ({uploadedTopics.COLLOCATION?.totalItems ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuizCategory("TOPIC_VOCABULARY")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedQuizCategory === "TOPIC_VOCABULARY"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                Topic Vocab ({uploadedTopics.TOPIC_VOCABULARY?.totalItems ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuizCategory("PARAPHRASE")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedQuizCategory === "PARAPHRASE"
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "bg-sky-50 text-sky-800 hover:bg-sky-100"
                }`}
              >
                Paraphrase ({uploadedTopics.PARAPHRASE.totalItems})
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuizCategory("SYNONYM")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedQuizCategory === "SYNONYM"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                Synonym ({uploadedTopics.SYNONYM.totalItems})
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuizCategory("TEMPLATE")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedQuizCategory === "TEMPLATE"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                }`}
              >
                Templates ({uploadedTopics.TEMPLATE.totalItems})
              </button>
            </div>

            {/* Search Input & Status Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={topicSearchQuery}
                  onChange={(e) => void handleTopicSearch(e.target.value)}
                  placeholder="Tìm chủ đề..."
                  className="pl-9 h-8 text-xs rounded-lg border-slate-200"
                />
              </div>

              {/* Status Filter */}
              <select
                value={topicStatusFilter}
                onChange={(e) => setTopicStatusFilter(e.target.value as typeof topicStatusFilter)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="IN_PROGRESS">Đang học</option>
                <option value="NOT_STARTED">Chưa học</option>
                <option value="COMPLETED">Đã hoàn thành</option>
              </select>
            </div>
          </div>

          {/* Danh sách các Section theo Danh mục đã chọn */}
          {totalUploadedTopics > 0 ? (
            <div className="space-y-6">
              {uploadedQuizSections
                .filter(
                  (section) =>
                    selectedQuizCategory === "ALL" || selectedQuizCategory === section.quizType,
                )
                .map((section) => {
                  const topicResult = uploadedTopics[section.quizType];
                  if (topicResult.totalItems === 0) return null;

                  // Filter topics by status client-side
                  const filteredTopics = topicResult.items.filter((topic) => {
                    const completedCount = topic.completedCount ?? 0;
                    const isNotStarted = completedCount === 0;
                    const isCompleted = completedCount === topic.count;

                    if (topicStatusFilter === "NOT_STARTED") return isNotStarted;
                    if (topicStatusFilter === "IN_PROGRESS") return !isNotStarted && !isCompleted;
                    if (topicStatusFilter === "COMPLETED") return isCompleted;
                    return true;
                  });

                  return (
                    <div key={section.quizType} className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
                      {/* Section Header */}
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold border ${section.tagBg}`}>
                            {section.badge}
                          </span>
                          <h3 className="font-heading text-sm sm:text-base font-bold text-foreground">
                            {section.title}
                          </h3>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {topicResult.totalItems} chủ đề
                        </span>
                      </div>

                      {/* Topic Cards Grid (Thanh lịch, Clickable, Không có nút to chói lọi) */}
                      {filteredTopics.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {filteredTopics.map((topic) => {
                            const [title, description] = topic.topic.split(" — ");
                            const completedCount = topic.completedCount ?? 0;
                            const percent = topic.count > 0 ? Math.round((completedCount / topic.count) * 100) : 0;
                            const isNotStarted = completedCount === 0;
                            const isCompleted = completedCount === topic.count;

                            return (
                              <Link
                                key={`${topic.quizType}:${topic.topic}`}
                                href={`/dashboard/review?mode=upload&quizType=${topic.quizType}&topic=${encodeURIComponent(
                                  topic.topic,
                                )}`}
                                className={`group relative flex flex-col justify-between rounded-xl border bg-white p-3 sm:p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                                  isCompleted
                                    ? "border-emerald-200/80 hover:border-emerald-400 bg-emerald-50/15"
                                    : "border-slate-200/80 hover:border-primary/50"
                                }`}
                              >
                                {/* Top Line: Status Badge + VI -> EN */}
                                <div className="flex items-center justify-between gap-2">
                                  {isCompleted ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80">
                                      <HugeiconsIcon icon={Tick02Icon} size={11} />
                                      Đã hoàn thành
                                    </span>
                                  ) : isNotStarted ? (
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                      Chưa học
                                    </span>
                                  ) : (
                                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/80">
                                      Đang học ({completedCount}/{topic.count})
                                    </span>
                                  )}

                                  <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                                    VI → EN
                                  </span>
                                </div>

                                {/* Title & Vietnamese Meaning */}
                                <div className="my-2.5 flex-1 min-h-[44px]">
                                  <h4 className="font-heading text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
                                    {title}
                                  </h4>
                                  {description ? (
                                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                      {description}
                                    </p>
                                  ) : (
                                    <p className="mt-0.5 text-xs text-muted-foreground/60 italic">
                                      Luyện phản xạ cấu trúc
                                    </p>
                                  )}
                                </div>

                                {/* Bottom Row: Progress bar & Action link */}
                                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-[10px] text-muted-foreground">
                                      Tiến độ: <strong className="font-mono text-foreground">{percent}%</strong>
                                    </span>
                                    <span
                                      className={`font-semibold text-xs transition-transform group-hover:translate-x-0.5 ${
                                        isCompleted
                                          ? "text-emerald-700"
                                          : isNotStarted
                                            ? "text-slate-600 group-hover:text-primary"
                                            : "text-primary font-bold"
                                      }`}
                                    >
                                      {isCompleted
                                        ? "Ôn lại →"
                                        : isNotStarted
                                          ? "Bắt đầu →"
                                          : `Học tiếp (${completedCount}/${topic.count}) →`}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className={`h-full transition-all duration-300 ${
                                        isCompleted ? "bg-emerald-500" : "bg-primary"
                                      }`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                          Không có chủ đề nào phù hợp với bộ lọc trạng thái hiện tại.
                        </div>
                      )}

                      <PaginationControls
                        currentPage={topicResult.page}
                        disabled={loadingSection === section.quizType}
                        itemLabel="chủ đề"
                        onPageChange={(page) => void loadTopics(section.quizType, page)}
                        pageSize={topicResult.pageSize}
                        totalItems={topicResult.totalItems}
                      />
                    </div>
                  );
                })}
            </div>
          ) : (
            <Card className="border-dashed border-slate-200 bg-white py-10 text-center">
              <CardContent className="mx-auto max-w-md">
                <div className="mb-3 grid size-10 place-items-center rounded-xl bg-sky-50 font-heading text-lg font-bold text-primary mx-auto">
                  📚
                </div>
                <CardTitle className="font-heading text-base font-bold">Chưa có bộ quiz nào</CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed">
                  Tải lên file câu hỏi hoặc sử dụng bộ VSTEP Writing Templates có sẵn ở trên để bắt đầu luyện tập.
                </CardDescription>
                <Button asChild className="mt-4 rounded-xl text-xs font-bold" size="sm">
                  <Link href="/dashboard/learning/import">Tải lên bộ quiz mới</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: TỪ BÀI VIẾT */}
      {activeTab === "from-essays" && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  void loadItems(1, e.target.value, sourceTypeFilter, statusFilter);
                }}
                placeholder="Tìm từ vựng, ngữ pháp, câu gợi ý..."
                className="pl-9 h-8 text-xs rounded-lg border-slate-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <HugeiconsIcon icon={FilterIcon} size={14} />
                <span>Lọc:</span>
              </div>

              {/* Loại nội dung */}
              <select
                value={sourceTypeFilter}
                onChange={(e) => {
                  setSourceTypeFilter(e.target.value);
                  void loadItems(1, searchQuery, e.target.value, statusFilter);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Tất cả loại</option>
                <option value="VOCABULARY">Từ vựng</option>
                <option value="GRAMMAR">Ngữ pháp</option>
                <option value="PHRASE">Cụm từ</option>
                <option value="TRANSLATION">Bản dịch</option>
                <option value="ESSAY_BLUEPRINT">Blueprint</option>
              </select>

              {/* Trạng thái */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  void loadItems(1, searchQuery, sourceTypeFilter, e.target.value);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DUE">Đến hạn ôn</option>
                <option value="NEW">Chưa học</option>
                <option value="PRACTICING">Đang học</option>
                <option value="FAMILIAR">Đang ghi nhớ</option>
                <option value="MASTERED">Đã thành thạo</option>
              </select>

              {(searchQuery || sourceTypeFilter !== "ALL" || statusFilter !== "ALL") && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSourceTypeFilter("ALL");
                    setStatusFilter("ALL");
                    void loadItems(1, "", "ALL", "ALL");
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 px-2"
                >
                  Đặt lại
                </Button>
              )}
            </div>
          </div>

          {/* Essay Groups List */}
          {items.totalItems > 0 ? (
            <div className="space-y-4">
              {/* Summary and Collapse/Expand all controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
                <p>
                  Gồm <strong className="font-mono font-bold text-foreground">{essayGroups.length}</strong> bài viết ·{" "}
                  <strong className="font-mono font-bold text-foreground">{items.totalItems}</strong> nội dung học
                </p>
                <div className="flex items-center gap-2 font-medium">
                  <button
                    type="button"
                    onClick={expandAllGroups}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Mở rộng tất cả
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={collapseAllGroups}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Thu gọn tất cả
                  </button>
                </div>
              </div>

              {/* Groups per Essay */}
              <div className="space-y-4">
                {essayGroups.map((group) => {
                  const isCollapsed = Boolean(collapsedGroups[group.key]);

                  // Count breakdown for this essay
                  const vocabCount = group.items.filter((i) => i.sourceType === "VOCABULARY").length;
                  const grammarCount = group.items.filter((i) => i.sourceType === "GRAMMAR").length;
                  const transCount = group.items.filter((i) => i.sourceType === "TRANSLATION").length;
                  const blueprintCount = group.items.filter((i) => i.sourceType === "ESSAY_BLUEPRINT").length;
                  const phraseCount = group.items.filter((i) => i.sourceType === "PHRASE").length;

                  const breakdownParts = [
                    vocabCount > 0 ? `${vocabCount} Từ vựng` : null,
                    grammarCount > 0 ? `${grammarCount} Ngữ pháp` : null,
                    transCount > 0 ? `${transCount} Bản dịch` : null,
                    phraseCount > 0 ? `${phraseCount} Cụm từ` : null,
                    blueprintCount > 0 ? `${blueprintCount} Blueprint` : null,
                  ].filter(Boolean);

                  return (
                    <div
                      key={group.key}
                      className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all"
                    >
                      {/* Essay Group Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50/75 border-b border-slate-100">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-sky-100/80 text-sky-700">
                            <HugeiconsIcon icon={BookOpen01Icon} size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              {group.taskType && (
                                <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 uppercase tracking-wide">
                                  {group.taskType === "TASK_1" ? "IELTS Task 1" : "IELTS Task 2"}
                                </span>
                              )}
                              {group.submittedAt && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                  <HugeiconsIcon icon={Clock01Icon} size={12} />
                                  {new Date(group.submittedAt).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                              <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 font-mono">
                                {group.items.length} mục
                              </span>
                              {breakdownParts.length > 0 && (
                                <span className="hidden md:inline text-[11px] text-muted-foreground">
                                  ({breakdownParts.join(" • ")})
                                </span>
                              )}
                            </div>
                            <h4
                              onClick={() => toggleGroupCollapse(group.key)}
                              className="font-heading text-sm font-bold text-slate-900 leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                              title={group.promptText}
                            >
                              {group.promptText}
                            </h4>
                          </div>
                        </div>

                        {/* Group Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {group.submissionId && (
                            <Button asChild size="sm" variant="outline" className="h-7 text-xs font-semibold px-2.5 bg-white border-slate-200 hover:bg-slate-100">
                              <Link href={`/dashboard/submissions/${group.submissionId}`} className="inline-flex items-center gap-1">
                                <span>Xem bài viết</span>
                                <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                              </Link>
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleGroupCollapse(group.key)}
                            className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                            title={isCollapsed ? "Mở rộng bài viết" : "Thu gọn bài viết"}
                          >
                            <span>{isCollapsed ? "Mở rộng" : "Thu gọn"}</span>
                            <HugeiconsIcon icon={isCollapsed ? ArrowDown01Icon : ArrowUp01Icon} size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Items Grid for this Essay */}
                      {!isCollapsed && (
                        <div className="p-3.5 sm:p-4">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {group.items.map((item) => (
                              <Card
                                key={item.id}
                                className="group flex h-full flex-col justify-between overflow-hidden border border-slate-200/90 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                              >
                                <CardHeader className="p-3.5 pb-2">
                                  <div className="flex h-full flex-col">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex flex-wrap gap-1.5">
                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                          {sourceTypeLabels[item.sourceType] || item.sourceType}
                                        </span>
                                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${statusConfig[item.status]?.className || ""}`}>
                                          {statusConfig[item.status]?.label || item.status}
                                        </span>
                                      </div>
                                      <Button
                                        className="-mr-1.5 -mt-1.5 size-7 p-0 text-muted-foreground opacity-60 transition-opacity hover:text-rose-600 group-hover:opacity-100"
                                        onClick={() => setPendingDeleteItem(item)}
                                        size="sm"
                                        variant="ghost"
                                        title="Xóa nội dung học"
                                      >
                                        <HugeiconsIcon icon={Delete02Icon} size={14} />
                                      </Button>
                                    </div>
                                    <CardTitle className="font-heading text-sm font-bold leading-snug line-clamp-2">
                                      {item.promptText}
                                    </CardTitle>
                                    {item.hintVi ? (
                                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                        {item.hintVi}
                                      </p>
                                    ) : null}
                                  </div>
                                </CardHeader>
                                <CardContent className="border-t border-slate-100 bg-slate-50/50 p-3">
                                  {item.sourceType === "TRANSLATION" || item.sourceType === "PHRASE" ? (
                                    <div className="space-y-2">
                                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                        {item.contextText || "Tự nhập hoặc chọn đáp án tiếng Anh còn thiếu."}
                                      </p>
                                      <Button asChild className="w-full h-7 rounded-lg text-xs font-bold" size="sm">
                                        <Link
                                          href={
                                            item.sourceType === "PHRASE"
                                              ? "/dashboard/review?mode=quick"
                                              : "/dashboard/review"
                                          }
                                        >
                                          {item.sourceType === "PHRASE" ? "Làm Quick Quiz →" : "Bắt đầu ôn →"}
                                        </Link>
                                      </Button>
                                    </div>
                                  ) : (
                                    <details className="rounded-lg bg-white border border-slate-200/80 p-2 text-xs">
                                      <summary className="cursor-pointer font-bold text-foreground text-[11px]">
                                        Xem đáp án gợi ý
                                      </summary>
                                      <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-slate-800 font-mono text-xs">
                                        {item.answerText}
                                      </p>
                                    </details>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <PaginationControls
                currentPage={items.page}
                disabled={loadingSection === "items"}
                itemLabel="nội dung"
                onPageChange={(page) => void loadItems(page)}
                pageSize={items.pageSize}
                totalItems={items.totalItems}
              />
            </div>
          ) : (
            <Card className="border-dashed border-slate-200 bg-white py-10 text-center">
              <CardContent className="mx-auto max-w-md">
                <div className="mb-3 grid size-10 place-items-center rounded-xl bg-sky-50 font-heading text-lg font-bold text-primary mx-auto">
                  🔍
                </div>
                <CardTitle className="font-heading text-base font-bold">Không tìm thấy nội dung phù hợp</CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed">
                  Thử xóa bớt từ khóa tìm kiếm hoặc đổi bộ lọc trạng thái để xem các nội dung khác.
                </CardDescription>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSourceTypeFilter("ALL");
                    setStatusFilter("ALL");
                    void loadItems(1, "", "ALL", "ALL");
                  }}
                  className="mt-4 rounded-xl text-xs"
                  size="sm"
                  variant="outline"
                >
                  Xóa bộ lọc
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: ĐÃ THÀNH THẠO */}
      {activeTab === "mastered" && (
        <div className="space-y-4">
          {/* Mastered Toolbar */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={masteredSearchQuery}
                onChange={(e) => {
                  setMasteredSearchQuery(e.target.value);
                  void loadMasteredItems(1, e.target.value);
                }}
                placeholder="Tìm trong danh sách nội dung đã thành thạo..."
                className="pl-9 h-8 text-xs rounded-lg border-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {masteredItems.totalItems} nội dung đã thành thạo
              </span>
            </div>
          </div>

          {/* Mastered Grid */}
          {masteredItems.totalItems > 0 ? (
            <div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {masteredItems.items.map((item) => (
                  <Card
                    key={item.id}
                    className="group flex h-full flex-col justify-between overflow-hidden border border-emerald-200/80 bg-emerald-50/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <CardHeader className="p-3.5 pb-2">
                      <div className="flex h-full flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                              {sourceTypeLabels[item.sourceType] || item.sourceType}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} />
                              Thành thạo
                            </span>
                          </div>
                          <Button
                            className="-mr-1.5 -mt-1.5 size-7 p-0 text-muted-foreground opacity-60 transition-opacity hover:text-rose-600 group-hover:opacity-100"
                            onClick={() => setPendingDeleteItem(item)}
                            size="sm"
                            variant="ghost"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} />
                          </Button>
                        </div>
                        <CardTitle className="font-heading text-sm font-bold leading-snug line-clamp-2">
                          {item.promptText}
                        </CardTitle>
                        {item.hintVi ? (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {item.hintVi}
                          </p>
                        ) : null}
                        {item.submission?.promptText ? (
                          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground/80 italic">
                            Từ bài: &ldquo;{item.submission.promptText}&rdquo;
                          </p>
                        ) : null}
                        <div className="mt-2 pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-emerald-100/60">
                          <span>Lặp lại: {item.repetitions} lần</span>
                          <span>Chu kỳ: {item.intervalDays} ngày</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="border-t border-emerald-100/80 bg-white p-3">
                      <details className="rounded-lg bg-slate-50 border border-slate-200/80 p-2 text-xs">
                        <summary className="cursor-pointer font-bold text-foreground text-[11px]">
                          Xem đáp án & mẫu câu
                        </summary>
                        <p className="mt-1.5 font-mono text-xs text-slate-800 leading-relaxed">
                          {item.answerText}
                        </p>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <PaginationControls
                currentPage={masteredItems.page}
                disabled={loadingSection === "mastered"}
                itemLabel="nội dung thành thạo"
                onPageChange={(page) => void loadMasteredItems(page)}
                pageSize={masteredItems.pageSize}
                totalItems={masteredItems.totalItems}
              />
            </div>
          ) : (
            <Card className="border-dashed border-slate-200 bg-white py-10 text-center">
              <CardContent className="mx-auto max-w-md">
                <div className="mb-3 grid size-10 place-items-center rounded-xl bg-emerald-50 font-heading text-lg font-bold text-emerald-600 mx-auto">
                  🏆
                </div>
                <CardTitle className="font-heading text-base font-bold">Chưa có nội dung thành thạo</CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed">
                  Khi Bạn ôn tập một từ vựng hoặc cấu trúc nhiều lần và trả lời chính xác, nội dung sẽ được nâng cấp lên mức thành thạo và lưu tại đây.
                </CardDescription>
                <Button
                  onClick={() => setActiveTab("from-essays")}
                  className="mt-4 rounded-xl text-xs font-bold"
                  size="sm"
                >
                  Khám phá kho học từ bài viết →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CONFIRM DELETE MODAL DIALOG */}
      {pendingDeleteItem ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600 mb-2">
              <div className="grid size-8 place-items-center rounded-lg bg-rose-100">
                <HugeiconsIcon icon={AlertCircleIcon} size={18} />
              </div>
              <h3 id="confirm-delete-title" className="font-heading text-base font-bold text-foreground">
                Xác nhận xóa nội dung
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xóa nội dung này khỏi kho học của Bạn?
            </p>
            <div className="my-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs font-semibold text-foreground">
              &ldquo;{pendingDeleteItem.promptText}&rdquo;
            </div>
            <p className="text-[11px] text-muted-foreground">
              Mục này sẽ được lưu trữ và không còn xuất hiện trong các bài ôn tập định kỳ.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                disabled={isDeleting}
                onClick={() => setPendingDeleteItem(null)}
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                className="h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs"
                size="sm"
              >
                {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
