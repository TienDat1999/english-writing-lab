"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UploadedQuizType } from "@/server/learning/learning.contract";
import type {
  LearningItemView,
  PaginatedResult,
  UploadedQuizTopicView,
} from "@/server/learning/learning.service";

const statusStyles = {
  NEW: "border-blue-200 bg-blue-50 text-blue-800",
  PRACTICING: "border-amber-200 bg-amber-50 text-amber-800",
  FAMILIAR: "border-emerald-200 bg-emerald-50 text-emerald-800",
  MASTERED: "border-green-300 bg-green-50 text-green-900",
  REVIEW: "border-red-200 bg-red-50 text-red-800",
} as const;

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
    <div className="mt-6 flex flex-col gap-3 border-t border-blue-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Hiển thị {firstItem}–{lastItem} / {totalItems} {itemLabel}
      </p>
      <nav aria-label={`Phân trang ${itemLabel}`} className="flex flex-wrap items-center gap-2">
        <Button
          disabled={disabled || currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          ← Trước
        </Button>
        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];

          return (
            <div className="contents" key={page}>
              {previousPage && page - previousPage > 1 ? (
                <span className="px-1 text-sm text-muted-foreground">…</span>
              ) : null}
              <Button
                aria-current={page === currentPage ? "page" : undefined}
                className="size-8 rounded-full p-0"
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
        >
          Sau →
        </Button>
      </nav>
    </div>
  );
}

export function LearningLibrary({
  initialItems,
  initialUploadedTopics,
}: {
  initialItems: PaginatedResult<LearningItemView>;
  initialUploadedTopics: Record<UploadedQuizType, PaginatedResult<UploadedQuizTopicView>>;
}) {
  const [items, setItems] = useState(initialItems);
  const [uploadedTopics, setUploadedTopics] = useState(initialUploadedTopics);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const uploadedQuizSections = [
    {
      quizType: "PARAPHRASE" as const,
      badge: "Paraphrase",
      title: "Paraphrase theo chủ đề",
      description: "Đọc nghĩa tiếng Việt và nhập cách diễn đạt tương đương bằng tiếng Anh.",
      accent: "border-t-amber-400",
      labelColor: "text-amber-700",
    },
    {
      quizType: "SYNONYM" as const,
      badge: "Cặp Synonym",
      title: "Luyện cặp từ đồng nghĩa",
      description: "Nhìn nghĩa tiếng Việt và nhập từ hoặc cụm từ tiếng Anh tương ứng.",
      accent: "border-t-emerald-400",
      labelColor: "text-emerald-700",
    },
  ];

  async function loadItems(page: number) {
    setLoadingSection("items");

    try {
      const response = await fetch(`/api/learning-items?page=${page}&pageSize=${items.pageSize}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { data: PaginatedResult<LearningItemView> };
      setItems(payload.data);
    } finally {
      setLoadingSection(null);
    }
  }

  async function loadTopics(quizType: UploadedQuizType, page: number) {
    setLoadingSection(quizType);

    try {
      const current = uploadedTopics[quizType];
      const response = await fetch(`/api/learning-items/import?quizType=${quizType}&page=${page}&pageSize=${current.pageSize}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { data: PaginatedResult<UploadedQuizTopicView> };
      setUploadedTopics((topics) => ({ ...topics, [quizType]: payload.data }));
    } finally {
      setLoadingSection(null);
    }
  }

  async function remove(id: string) {
    const response = await fetch(`/api/learning-items/${id}`, { method: "DELETE" });

    if (response.ok) {
      const targetPage = items.items.length === 1 && items.page > 1 ? items.page - 1 : items.page;
      await loadItems(targetPage);
    }
  }

  const totalUploadedTopics = uploadedTopics.PARAPHRASE.totalItems + uploadedTopics.SYNONYM.totalItems;

  return (
    <>
      {totalUploadedTopics > 0 ? (
        <section className="mb-12 scroll-mt-24" id="uploaded-quiz-topics">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge variant="outline">Quiz từ file upload</Badge>
              <h2 className="mt-3 font-heading text-3xl tracking-tight">Chọn loại quiz và chủ đề</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Câu hỏi hiển thị bằng tiếng Việt. Bạn tự nhập đáp án tiếng Anh.
              </p>
            </div>
            <Badge variant="secondary">{totalUploadedTopics} chủ đề</Badge>
          </div>
          <div className="space-y-10">
            {uploadedQuizSections.map((section) => {
              const topicResult = uploadedTopics[section.quizType];

              if (topicResult.totalItems === 0) return null;

              return (
                <div key={section.quizType}>
                  <div className="mb-4">
                    <Badge variant="secondary">{section.badge}</Badge>
                    <h3 className="mt-2 font-heading text-2xl tracking-tight">{section.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {topicResult.items.map((topic) => {
                      const [title, description] = topic.topic.split(" — ");

                      return (
                        <Card className={`group flex h-full flex-col border-t-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgb(35_87_170/14%)] ${topic.completed ? "border-t-emerald-500 bg-emerald-50/35" : section.accent}`} key={`${topic.quizType}:${topic.topic}`}>
                          <CardHeader className="flex-1">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">{topic.count} câu</Badge>
                                {topic.completed ? (
                                  <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800" variant="outline">
                                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
                                    Complete
                                  </Badge>
                                ) : null}
                              </div>
                              <span className={`text-xs font-semibold tracking-wider uppercase ${section.labelColor}`}>VI → EN</span>
                            </div>
                            <CardTitle className="font-heading text-2xl">{title}</CardTitle>
                            {description ? <CardDescription className="mt-2 text-base">{description}</CardDescription> : null}
                          </CardHeader>
                          <CardContent>
                            <Button asChild className={`w-full rounded-full ${topic.completed ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}>
                              <Link href={`/dashboard/review?mode=upload&quizType=${topic.quizType}&topic=${encodeURIComponent(topic.topic)}`}>
                                {topic.completed ? "Luyện lại chủ đề →" : "Luyện chủ đề này →"}
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
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
        </section>
      ) : null}

      {items.totalItems > 0 ? (
        <section>
          <div className="mb-5">
            <Badge variant="outline">Nội dung đã lưu</Badge>
            <h2 className="mt-3 font-heading text-3xl tracking-tight">Ôn tập từ bài viết</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.items.map((item) => (
              <Card
                className="group flex h-full flex-col overflow-hidden border-t-4 border-t-primary bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgb(35_87_170/14%)]"
                key={item.id}
              >
                <CardHeader className="flex-1 pb-4">
                  <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {item.sourceType === "TRANSLATION"
                            ? "VI → EN"
                            : item.sourceType === "PHRASE"
                              ? "QUICK QUIZ"
                              : item.sourceType.replaceAll("_", " ")}
                        </Badge>
                        <Badge className={statusStyles[item.status]} variant="outline">{item.status}</Badge>
                      </div>
                      <Button
                        className="-mr-2 -mt-2 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
                        onClick={() => remove(item.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Xóa
                      </Button>
                    </div>
                    <CardTitle className="font-heading text-xl leading-7">{item.promptText}</CardTitle>
                    {item.hintVi ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        Gợi ý: {item.hintVi}
                      </p>
                    ) : null}
                    <CardDescription className="mt-auto pt-5">
                      Ôn tiếp {new Intl.DateTimeFormat("vi", { dateStyle: "medium" }).format(new Date(item.nextReviewAt))}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="border-t bg-slate-50/55 pt-4">
                  {item.sourceType === "TRANSLATION" || item.sourceType === "PHRASE" ? (
                    <div className="space-y-3">
                      <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                        {item.contextText || "Chọn hoặc tự gõ đáp án còn thiếu."}
                      </p>
                      <Button asChild className="w-full rounded-full" size="sm">
                        <Link href={item.sourceType === "PHRASE" ? "/dashboard/review?mode=quick" : "/dashboard/review"}>
                          {item.sourceType === "PHRASE" ? "Làm Quick Quiz →" : "Bắt đầu ôn →"}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <details className="rounded-xl bg-secondary/45 p-4">
                      <summary className="cursor-pointer font-medium">Xem đáp án</summary>
                      <p className="mt-3 whitespace-pre-wrap leading-7">{item.answerText}</p>
                      {item.hintVi ? <p className="mt-3 text-sm text-muted-foreground">{item.hintVi}</p> : null}
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationControls
            currentPage={items.page}
            disabled={loadingSection === "items"}
            itemLabel="nội dung"
            onPageChange={(page) => void loadItems(page)}
            pageSize={items.pageSize}
            totalItems={items.totalItems}
          />
        </section>
      ) : totalUploadedTopics === 0 ? (
        <Card className="border-dashed bg-card/60 py-12 text-center">
          <CardContent className="mx-auto max-w-xl">
            <CardTitle className="font-heading text-3xl">Thư viện đang trống</CardTitle>
            <CardDescription className="mt-3 text-base leading-7">
              Upload một bộ quiz hoặc mở bài đã phân tích rồi bấm “Lưu để ôn”.
            </CardDescription>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
