"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

export type StepCompletionCardProps = {
  totalItems: number;
  unitLabel?: string;
  topicTitle?: string;
  backHref?: string;
  backLabel?: string;
  onRetry?: () => void;
};

export function StepCompletionCard({
  totalItems,
  unitLabel = "cụm từ",
  topicTitle,
  backHref = "/dashboard/learning",
  backLabel = "Về Thư viện học",
  onRetry,
}: StepCompletionCardProps) {
  return (
    <Card className="border-emerald-200 bg-emerald-50/70 py-12 text-center shadow-xs rounded-2xl">
      <CardContent className="mx-auto max-w-xl space-y-4">
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold hover:bg-emerald-100" variant="secondary">
          Hoàn thành 3 bước
        </Badge>
        <CardTitle className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">
          Đã học xong chủ đề này 🎉
        </CardTitle>
        <CardDescription className="text-base text-slate-600 leading-relaxed max-w-md mx-auto">
          {topicTitle ? (
            <span>Bạn đã làm chủ toàn bộ <strong>{totalItems}</strong> {unitLabel} trong chủ đề <em>&ldquo;{topicTitle}&rdquo;</em> qua cả 3 bước học sâu.</span>
          ) : (
            <span>Bạn đã nhận diện nghĩa, gợi nhớ từ và ứng dụng toàn bộ <strong>{totalItems}</strong> {unitLabel} vào câu văn hoàn chỉnh.</span>
          )}
        </CardDescription>
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <Button onClick={onRetry} variant="outline" className="rounded-full font-semibold">
              Luyện lại từ đầu
            </Button>
          ) : null}
          <Button asChild className="rounded-full font-bold shadow-sm">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
