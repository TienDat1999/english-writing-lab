import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Calendar03Icon,
  FireIcon,
  SparklesIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function VstepSprintCard() {
  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-sky-500/10 p-6 shadow-md transition-all hover:-translate-y-1 hover:border-amber-500 hover:shadow-xl sm:p-7">
      <div className="space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1 text-xs font-black text-slate-950 shadow-xs">
            <HugeiconsIcon icon={SparklesIcon} size={13} />
            LỘ TRÌNH 30 NGÀY TÁC CHIẾN
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
            <HugeiconsIcon icon={Target01Icon} size={12} />
            Mục tiêu B2 (6.0+)
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-heading text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-800 transition-colors leading-snug">
            30 Ngày Bứt Phá VSTEP B2 (Writing & Speaking Sprint)
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Chiến thuật tập trung 80% hỏa lực vào Writing & Speaking để kéo điểm làm tròn ≥ 5.75 lên 6.0 an toàn. Giáo án bấm giờ chi tiết từng ngày, kèm công thức A.R.E, PEEL và sơ đồ tư duy.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/90 p-3.5 border border-amber-200/60 shadow-2xs text-xs">
          <div className="text-center">
            <span className="text-[11px] text-muted-foreground block font-medium">Thời lượng</span>
            <strong className="text-slate-900 font-extrabold text-sm font-mono flex items-center justify-center gap-1 mt-0.5">
              <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-amber-600" />
              30 Ngày
            </strong>
          </div>
          <div className="text-center border-x border-slate-200/80">
            <span className="text-[11px] text-muted-foreground block font-medium">Tác chiến</span>
            <strong className="text-slate-900 font-extrabold text-sm font-mono flex items-center justify-center gap-1 mt-0.5">
              <HugeiconsIcon icon={FireIcon} size={14} className="text-rose-500" />
              4 Trạm/Ngày
            </strong>
          </div>
          <div className="text-center">
            <span className="text-[11px] text-muted-foreground block font-medium">Hình thức</span>
            <strong className="text-emerald-700 font-extrabold text-sm font-mono flex items-center justify-center gap-1 mt-0.5">
              Bấm giờ thật
            </strong>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-6 pt-4 border-t border-amber-200/60">
        <Button asChild className="w-full rounded-2xl font-black text-sm bg-slate-950 hover:bg-slate-900 text-amber-300 shadow-md h-11">
          <Link
            href="/lessons/collection/vstep-b2-30-day-sprint"
            className="inline-flex items-center justify-center gap-2"
          >
            <span>Khám phá đề cương & Nhận lộ trình</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
