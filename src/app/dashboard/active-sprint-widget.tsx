import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Calendar03Icon,
  FireIcon,
  SparklesIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface ActiveSprintWidgetProps {
  currentDay: number;
  completedDaysCount: number;
  streak: number;
}

export function ActiveSprintWidget({
  currentDay,
  completedDaysCount,
  streak,
}: ActiveSprintWidgetProps) {
  const percent = Math.round((completedDaysCount / 30) * 100);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/80 bg-gradient-to-r from-amber-500/15 via-amber-400/5 to-sky-500/10 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-950 bg-amber-400 px-2.5 py-0.5 rounded-md shadow-2xs">
              <HugeiconsIcon icon={ZapIcon} size={12} />
              LỘ TRÌNH ĐANG TÁC CHIẾN
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              <HugeiconsIcon icon={FireIcon} size={13} />
              Streak: {streak} ngày
            </span>
          </div>

          <h3 className="font-heading text-lg sm:text-xl font-extrabold text-slate-900">
            30 Ngày Bứt Phá VSTEP B2 — Ngày {currentDay < 10 ? `0${currentDay}` : currentDay}
          </h3>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="font-medium">Tiến độ: <strong>{completedDaysCount}/30 ngày</strong> ({percent}%)</span>
            <div className="h-2 w-32 sm:w-44 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-black px-6 shadow-md h-11"
          >
            <Link
              href={`/dashboard/sprint/day/${currentDay}`}
              className="inline-flex items-center gap-2"
            >
              <span>Vào học Ngày {currentDay < 10 ? `0${currentDay}` : currentDay}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
