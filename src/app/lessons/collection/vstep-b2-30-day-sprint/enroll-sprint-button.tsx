"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Flag02Icon, Loading03Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function EnrollSprintButton({
  isLoggedIn,
  isEnrolled,
  currentDay,
}: {
  isLoggedIn: boolean;
  isEnrolled: boolean;
  currentDay: number;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    if (!isLoggedIn) {
      router.push("/login?redirect=/lessons/collection/vstep-b2-30-day-sprint");
      return;
    }

    if (isEnrolled) {
      router.push(`/dashboard/sprint/day/${currentDay}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sprint/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Không thể kích hoạt lộ trình. Thử lại nhé.");
        setIsLoading(false);
        return;
      }

      router.push(`/dashboard/sprint/day/${data.data.currentDay || 1}`);
    } catch {
      setError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleEnroll}
        disabled={isLoading}
        size="lg"
        className="rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-8 py-6 text-sm sm:text-base shadow-lg transition-all hover:scale-102 flex items-center gap-2"
      >
        {isLoading ? (
          <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={20} />
        ) : isEnrolled ? (
          <HugeiconsIcon icon={PlayIcon} size={20} />
        ) : (
          <HugeiconsIcon icon={Flag02Icon} size={20} />
        )}
        <span>
          {isEnrolled
            ? `Tiếp tục học Ngày ${currentDay < 10 ? `0${currentDay}` : currentDay}`
            : "Nhận Lộ Trình Này & Bắt Đầu Học"}
        </span>
      </Button>

      {error ? (
        <p className="text-xs text-rose-300 font-semibold">{error}</p>
      ) : null}
    </div>
  );
}
