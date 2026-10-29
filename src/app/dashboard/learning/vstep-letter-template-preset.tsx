"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ImportResult = {
  imported: number;
  created: number;
  existing: number;
};

export function VstepLetterTemplatePreset() {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importPreset() {
    if (isImporting) return;

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/learning-items/presets/vstep-letter", {
        method: "POST",
      });
      const payload = (await response.json()) as { data?: ImportResult };

      if (!response.ok || !payload.data) {
        setError("Chưa thể thêm bộ VSTEP Task 1 Letter Templates. Thử lại nhé.");
        return;
      }

      setResult(payload.data);
      router.refresh();
    } catch {
      setError("Mất kết nối trong lúc thêm bộ mẫu câu viết thư.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md">
      <div className="space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-md px-2.5 py-0.5 text-[11px] font-bold border bg-sky-50 text-sky-800 border-sky-200">
            Task 1 • Viết thư / Email
          </span>
          <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
            Miễn phí
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            VSTEP Task 1: Bộ mẫu câu viết thư tương tác (Letter / Email)
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-3">
            Lời chào, nêu lý do, thư phàn nàn, hỏi thông tin, xin lỗi, cảm ơn, mời hẹn và ký tên chuẩn văn phong Formal/Informal B2.
          </p>
        </div>

        {/* Stats Box */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100/80 text-xs">
          <div>
            <span className="text-[11px] text-muted-foreground block">Dạng thư</span>
            <strong className="text-foreground font-bold font-mono">
              10 Chủ đề Thư
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block">Mẫu câu</span>
            <strong className="text-foreground font-bold font-mono">
              35 Mẫu câu & Quiz
            </strong>
          </div>
        </div>

        {result ? (
          <p className="text-xs font-semibold text-emerald-700" role="status">
            ✓ Đã nạp thành công {result.created + result.existing} mẫu câu viết thư vào thư viện học.
          </p>
        ) : null}
        {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
      </div>

      {/* Footer Action */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        {result ? (
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Link href="/dashboard/review?category=TEMPLATE" className="inline-flex items-center justify-center gap-1.5">
                <span>Luyện Viết thư ngay</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full rounded-xl font-semibold text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
              <Link href="/dashboard/learning">Về Thư viện học</Link>
            </Button>
          </div>
        ) : (
          <Button
            onClick={importPreset}
            disabled={isImporting}
            className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            {isImporting ? (
              <span>Đang thêm vào thư viện...</span>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5">
                <span>Khám phá & Lấy về học</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
              </span>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
