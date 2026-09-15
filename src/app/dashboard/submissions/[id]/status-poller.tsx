"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type StatusPollerProps = {
  submissionId: string;
  status: string;
};

export function StatusPoller({ submissionId, status }: StatusPollerProps) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "QUEUED" && status !== "ANALYZING") {
      return;
    }

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        data?: { status?: string };
      };

      if (payload.data?.status && payload.data.status !== status) {
        router.refresh();
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [router, status, submissionId]);

  return null;
}
