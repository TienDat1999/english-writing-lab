"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

type ImportResult = {
  imported: number;
  created: number;
  existing: number;
};

export function VstepTemplatePreset() {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importPreset() {
    if (isImporting) return;

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/learning-items/presets/vstep-writing", { method: "POST" });
      const payload = (await response.json()) as { data?: ImportResult };

      if (!response.ok || !payload.data) {
        setError("Chưa thể thêm bộ VSTEP Writing Templates. Thử lại nhé.");
        return;
      }

      setResult(payload.data);
      router.refresh();
    } catch {
      setError("Mất kết nối trong lúc thêm bộ Quick Quiz.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/40 p-4 shadow-2xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
              <HugeiconsIcon icon={SparklesIcon} size={12} />
              Bộ đề mẫu B2
            </span>
            <span className="text-[11px] font-semibold text-sky-900">55 thẻ câu · 10 dạng luận</span>
          </div>
          <h3 className="font-heading text-sm sm:text-base font-bold text-foreground">
            VSTEP Writing Templates: Lắp ghép câu theo cấu trúc C-M-E-L
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            Mở bài, thesis, thân bài và kết bài được tách câu tiếng Việt để Bạn tự viết sang tiếng Anh và AI chấm linh hoạt.
          </p>
          {result ? (
            <p className="text-xs font-semibold text-emerald-700" role="status">
              ✓ Đã nạp thành công: {result.created} thẻ mới, {result.existing} thẻ đã có sẵn.
            </p>
          ) : null}
          {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {result ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" className="h-8 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs">
                <Link href="/dashboard/review?category=TEMPLATE">Luyện Template ngay →</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-8 px-3 rounded-lg text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                <Link href="/dashboard/learning">Về Thư viện</Link>
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="h-8 px-3.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-2xs"
              disabled={isImporting}
              onClick={importPreset}
              type="button"
            >
              <HugeiconsIcon icon={BookOpen01Icon} size={14} className="mr-1.5" />
              {isImporting ? "Đang thêm..." : "Cập nhật vào thư viện"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
