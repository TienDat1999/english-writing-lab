import {
  ArrowRight01Icon,
  Layers01Icon,
  Search01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listPublicCollections } from "@/server/content/public-content.service";
import { VstepTemplatePreset } from "@/app/dashboard/learning/vstep-template-preset";

type LessonsPageProps = {
  searchParams: Promise<{
    q?: string;
    kind?: string;
  }>;
};

const kindBadges: Record<string, { label: string; badge: string }> = {
  COLLOCATION: { label: "Collocation", badge: "bg-amber-50 text-amber-900 border-amber-200" },
  TOPIC_VOCABULARY: { label: "Từ vựng chuyên đề", badge: "bg-blue-50 text-blue-800 border-blue-200" },
  SYNONYM: { label: "Từ đồng nghĩa", badge: "bg-purple-50 text-purple-800 border-purple-200" },
  PARAPHRASE: { label: "Kỹ thuật Paraphrase", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  TEMPLATE: { label: "Mẫu câu & Dàn ý", badge: "bg-rose-50 text-rose-800 border-rose-200" },
};

export default async function PublicLessonsPage({ searchParams }: LessonsPageProps) {
  const query = await searchParams;
  const searchQuery = typeof query.q === "string" ? query.q.trim().toLowerCase() : "";
  const selectedKind = typeof query.kind === "string" ? query.kind.toUpperCase() : "ALL";

  let collections = await listPublicCollections({
    locale: "vi",
    kind: selectedKind === "ALL" ? undefined : selectedKind,
  });

  if (searchQuery) {
    collections = collections.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery) ||
        c.description.toLowerCase().includes(searchQuery),
    );
  }

  const filterTabs = [
    { id: "ALL", label: "Tất cả các Bộ" },
    { id: "COLLOCATION", label: "Collocation" },
    { id: "TOPIC_VOCABULARY", label: "Từ vựng (Vocabulary)" },
    { id: "SYNONYM", label: "Từ đồng nghĩa" },
    { id: "PARAPHRASE", label: "Paraphrase" },
    { id: "TEMPLATE", label: "Mẫu câu (Template)" },
  ];

  const showPresetCard =
    (selectedKind === "ALL" || selectedKind === "TEMPLATE") &&
    (!searchQuery ||
      "vstep writing templates: lắp ghép câu theo cấu trúc c-m-e-l".includes(searchQuery) ||
      "mẫu câu & dàn ý".includes(searchQuery) ||
      "template".includes(searchQuery) ||
      "vstep".includes(searchQuery));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-8 sm:p-10 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-200 border border-amber-400/30">
              <HugeiconsIcon icon={SparklesIcon} size={13} />
              Kho bài học Chuẩn hóa
            </span>
            <span className="text-xs text-sky-200/80 font-medium">Học miễn phí & Theo lộ trình</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Khám phá Kho bài học Draftwise
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            Các Bộ bài học Từ vựng, Collocations, Mẫu câu và Kỹ thuật Paraphrase được biên soạn theo lộ trình để bạn lấy về học và ôn tập hàng ngày.
          </p>
        </div>
      </div>

      {/* Filter Tabs / Kinds */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => {
            const isActive = selectedKind === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.id === "ALL" ? "/lessons" : `/lessons?kind=${tab.id.toLowerCase()}`}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <form className="flex items-center gap-2" method="GET">
          {selectedKind !== "ALL" && (
            <input type="hidden" name="kind" value={selectedKind.toLowerCase()} />
          )}
          <div className="relative flex-1 md:w-64">
            <HugeiconsIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
              size={15}
            />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Tìm theo tên Bộ bài học..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs outline-none focus:border-primary focus:bg-white transition"
            />
          </div>
          <Button type="submit" size="sm" className="h-10 rounded-xl px-4 text-xs font-bold">
            Tìm
          </Button>
        </form>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 && !showPresetCard ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-2xs">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <HugeiconsIcon icon={Layers01Icon} size={28} />
          </div>
          <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
            Chưa tìm thấy Bộ bài học nào
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            Thử chọn loại danh mục khác hoặc xóa từ khóa tìm kiếm để khám phá toàn bộ các Bộ bài học.
          </p>
          <div className="mt-5">
            <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
              <Link href="/lessons">Xem tất cả các Bộ</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {showPresetCard && <VstepTemplatePreset />}
          {collections.map((col) => {
            const kindInfo = kindBadges[col.kind || ""] || {
              label: "Bài học",
              badge: "bg-slate-100 text-slate-800 border-slate-200",
            };

            return (
              <Card
                key={col.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md"
              >
                <div className="space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold border ${kindInfo.badge}`}>
                      {kindInfo.label}
                    </span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                      {col.accessTier === "FREE" ? "Miễn phí" : "Hội viên VIP"}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {col.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {col.description}
                    </p>
                  </div>

                  {/* Stats Box */}
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100/80 text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Quy mô</span>
                      <strong className="text-foreground font-bold font-mono">
                        {col.topicCount} Chủ đề (Topics)
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Nội dung</span>
                      <strong className="text-foreground font-bold font-mono">
                        {col.itemCount} Cụm từ & Quiz
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button asChild className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm">
                    <Link href={`/lessons/collection/${col.slug}`} className="inline-flex items-center justify-center gap-1.5">
                      <span>Khám phá & Lấy về học</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
