"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export function StartLearningButton({
  lessonSlug,
  isLoggedIn,
  label,
}: {
  lessonSlug: string;
  isLoggedIn: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/lessons/${lessonSlug}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/learning-items/enroll-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonSlug }),
      });

      const payload = (await response.json()) as {
        data?: {
          topicText: string;
          quizType: string;
          enrolledCount: number;
        };
        error?: { message: string };
      };

      if (!response.ok || !payload.data) {
        setError(payload.error?.message || "Không thể chuẩn bị bài học. Thử lại nhé.");
        setIsLoading(false);
        return;
      }

      const { topicText, quizType } = payload.data;
      router.push(
        `/dashboard/review?mode=upload&quizType=${encodeURIComponent(quizType)}&topic=${encodeURIComponent(topicText)}`
      );
    } catch {
      setError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-1.5 w-full">
      <Button
        type="button"
        size="lg"
        onClick={handleStart}
        disabled={isLoading}
        className="w-full rounded-xl font-bold h-11 text-sm shadow-sm gap-2"
      >
        {isLoading ? (
          <>
            <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
            <span>Đang chuẩn bị câu hỏi...</span>
          </>
        ) : isLoggedIn ? (
          <span>{label || "Bắt đầu luyện tập ngay →"}</span>
        ) : (
          <span>Đăng nhập để luyện tập →</span>
        )}
      </Button>

      {error && (
        <p className="text-center text-[11px] font-semibold text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
