"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export function EnrollCollectionButton({
  collectionSlug,
  isLoggedIn,
}: {
  collectionSlug: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/lessons/collection/${collectionSlug}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/learning-items/enroll-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionSlug }),
      });

      const payload = (await response.json()) as {
        data?: {
          totalItems: number;
          topicCount: number;
        };
        error?: { message: string };
      };

      if (!response.ok || !payload.data) {
        setError(payload.error?.message || "Không thể thêm bộ bài học. Thử lại nhé.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard/learning");
    } catch {
      setError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        size="default"
        onClick={handleEnroll}
        disabled={isLoading}
        className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 shadow-sm gap-2"
      >
        {isLoading ? (
          <>
            <HugeiconsIcon icon={Loading03Icon} size={15} className="animate-spin" />
            <span>Đang lưu vào Thư viện...</span>
          </>
        ) : isLoggedIn ? (
          <span>📥 Thêm vào Thư viện học của tôi →</span>
        ) : (
          <span>Đăng nhập để lấy bộ này về học →</span>
        )}
      </Button>

      {error && (
        <p className="text-xs font-semibold text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
