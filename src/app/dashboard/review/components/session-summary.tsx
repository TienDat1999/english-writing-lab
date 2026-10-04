"use client";

import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { SessionResultRecord } from "../types";

export type SessionSummaryProps = {
  results: SessionResultRecord[];
  totalItems: number;
  onRetryWrongOnly?: () => void;
};

export function SessionSummary({
  results,
  totalItems,
}: SessionSummaryProps) {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const accuracy = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 100;

  return (
    <div className="space-y-6">
      <Card className="border border-emerald-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-6 sm:p-8 shadow-sm">
        <CardHeader className="p-0 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <HugeiconsIcon icon={SparklesIcon} size={28} />
          </div>
          <Badge variant="success" className="mx-auto mb-2">
            Hoàn thành phiên ôn tập
          </Badge>
          <CardTitle className="font-heading text-3xl font-extrabold text-foreground">
            Tổng kết kết quả của Bạn 🎉
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            Bạn đã hoàn thành trọn vẹn <strong>{totalItems}</strong> nội dung. Hệ thống đã tự động tính toán chu kỳ ngắt quãng kế tiếp.
          </CardDescription>
        </CardHeader>

        {/* Performance KPI */}
        <div className="my-8 grid grid-cols-3 gap-4 border-y border-slate-100 py-6 text-center">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Tổng số câu</p>
            <p className="font-mono text-3xl font-bold text-foreground mt-1">{totalItems}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Chính xác</p>
            <p className="font-mono text-3xl font-bold text-emerald-600 mt-1">{correctCount}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Tỷ lệ đúng</p>
            <p className="font-mono text-3xl font-bold text-primary mt-1">{accuracy}%</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-xl font-bold">
            <Link href="/dashboard/learning">Về Thư viện học</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/dashboard">Về Trang tổng quan</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
