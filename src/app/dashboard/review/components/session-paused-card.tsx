"use client";

import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

export type SessionPausedCardProps = {
  completed: number;
  totalItems: number;
  onResume: () => void;
};

export function SessionPausedCard({
  completed,
  totalItems,
  onResume,
}: SessionPausedCardProps) {
  return (
    <Card className="border border-amber-200 bg-amber-50/50 py-10 text-center shadow-sm">
      <CardContent className="mx-auto max-w-md space-y-4">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-800 font-bold">
          <HugeiconsIcon icon={PauseIcon} size={24} />
        </div>
        <CardTitle className="font-heading text-2xl font-bold text-foreground">
          Phiên học đã được tạm dừng
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Bạn đã hoàn thành <strong>{completed}/{totalItems}</strong> câu. Tiến độ đã được lưu an toàn trong trình duyệt của Bạn.
        </CardDescription>
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Button onClick={onResume} className="rounded-xl font-bold">
            <HugeiconsIcon icon={PlayIcon} size={18} className="mr-1.5" />
            Tiếp tục ôn tập ngay
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/dashboard/learning">Về Thư viện</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
