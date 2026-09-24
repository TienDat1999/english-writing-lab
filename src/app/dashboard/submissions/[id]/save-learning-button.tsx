"use client";

import { useState } from "react";
import { Bookmark02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

type SaveLearningButtonProps = {
  submissionId: string;
  sourceType: "VOCABULARY" | "GRAMMAR" | "ESSAY_BLUEPRINT";
  sourceIndex?: number;
  label?: string;
  variant?: "outline" | "secondary" | "ghost" | "default";
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function SaveLearningButton({
  submissionId,
  sourceType,
  sourceIndex,
  label = "Lưu để ôn",
  variant = "outline",
  size = "sm",
  className,
}: SaveLearningButtonProps) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    if (state === "saving" || state === "saved") {
      return;
    }

    setState("saving");

    try {
      const response = await fetch("/api/learning-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          sourceType,
          sourceIndex: sourceIndex ?? null,
        }),
      });

      setState(response.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <Button
      className={`rounded-full transition-all duration-200 text-xs font-semibold ${
        state === "saved"
          ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          : state === "error"
            ? "border-rose-300 bg-rose-50 text-rose-700"
            : "hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      } ${className || ""}`}
      disabled={state === "saving" || state === "saved"}
      onClick={save}
      size={size}
      type="button"
      variant={state === "saved" ? "secondary" : variant}
    >
      {state === "saving" ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Đang lưu...</span>
        </span>
      ) : state === "saved" ? (
        <span className="inline-flex items-center gap-1.5">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-emerald-600" />
          <span>Đã lưu vào sổ tay</span>
        </span>
      ) : state === "error" ? (
        <span>Thử lưu lại</span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <HugeiconsIcon icon={Bookmark02Icon} size={14} className="text-muted-foreground" />
          <span>{label}</span>
        </span>
      )}
    </Button>
  );
}
