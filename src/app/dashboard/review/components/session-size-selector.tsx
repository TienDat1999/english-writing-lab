"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { TopicHeaderInfo } from "../types";

export type SessionSizeSelectorProps = {
  initialItemsCount: number;
  topicHeader?: TopicHeaderInfo;
  onSelectSize: (size: number) => void;
};

export function SessionSizeSelector({
  initialItemsCount,
  topicHeader,
  onSelectSize,
}: SessionSizeSelectorProps) {
  return (
    <div className="space-y-6">
      {topicHeader && (
        <div className="border-b border-border/80 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground -ml-2 rounded-lg gap-1"
            >
              <Link href="/dashboard/learning">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                <span>Thư viện</span>
              </Link>
            </Button>
            <span className="text-slate-300">/</span>
            <Badge variant="secondary" className="font-semibold text-xs">
              {topicHeader.breadcrumbLabel}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {topicHeader.itemsCount} nội dung
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            {topicHeader.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            {topicHeader.description}
          </p>
        </div>
      )}

      <Card className="border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <CardHeader className="p-0 mb-6">
          <Badge variant="secondary" className="w-fit mb-2">
            Chọn độ dài phiên ôn
          </Badge>
          <CardTitle className="font-heading text-2xl font-bold text-foreground">
            Hôm nay Bạn muốn ôn bao nhiêu câu?
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Phiên học ngắn giúp duy trì sự tập trung cao độ và ghi nhớ từ vựng sâu hơn.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <button
              onClick={() => onSelectSize(5)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-sky-50/50 hover:border-primary transition-all text-center group"
              type="button"
            >
              <span className="font-mono text-3xl font-bold text-primary group-hover:scale-105 transition-transform">
                5
              </span>
              <span className="mt-2 text-sm font-bold text-foreground">Luyện nhanh</span>
              <span className="text-xs text-muted-foreground mt-1">~3 phút tập trung</span>
            </button>

            <button
              onClick={() => onSelectSize(10)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-primary bg-sky-50/30 hover:bg-sky-50 transition-all text-center group"
              type="button"
            >
              <span className="font-mono text-3xl font-bold text-primary group-hover:scale-105 transition-transform">
                10
              </span>
              <span className="mt-2 text-sm font-bold text-foreground">Tiêu chuẩn (Khuyên dùng)</span>
              <span className="text-xs text-muted-foreground mt-1">~7 phút tối ưu</span>
            </button>

            <button
              onClick={() => onSelectSize(initialItemsCount)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-sky-50/50 hover:border-primary transition-all text-center group"
              type="button"
            >
              <span className="font-mono text-3xl font-bold text-primary group-hover:scale-105 transition-transform">
                {initialItemsCount}
              </span>
              <span className="mt-2 text-sm font-bold text-foreground">Tất cả mục đến hạn</span>
              <span className="text-xs text-muted-foreground mt-1">Toàn bộ danh sách</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
