"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

export function RetryAnalysisButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);

    try {
      const response = await fetch(`/api/submissions/${submissionId}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Không thể phân tích lại vào lúc này. Vui lòng thử lại sau.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleRetry}
        disabled={isRetrying}
        className="rounded-xl px-5 font-semibold shadow-sm"
        size="sm"
      >
        {isRetrying ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Đang chấm bài bằng AI...</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={SparklesIcon} size={16} />
            <span>Thử chấm bài lại ngay bằng AI</span>
          </span>
        )}
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
