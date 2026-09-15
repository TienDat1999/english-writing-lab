"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type SaveLearningButtonProps = {
  submissionId: string;
  sourceType: "VOCABULARY" | "GRAMMAR" | "ESSAY_BLUEPRINT";
  sourceIndex?: number;
  label?: string;
};

export function SaveLearningButton({
  submissionId,
  sourceType,
  sourceIndex,
  label = "Lưu để ôn",
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
      className="rounded-full"
      disabled={state === "saving" || state === "saved"}
      onClick={save}
      size="sm"
      type="button"
      variant={state === "saved" ? "secondary" : "outline"}
    >
      {state === "saving"
        ? "Đang lưu..."
        : state === "saved"
          ? "Đã lưu ✓"
          : state === "error"
            ? "Thử lưu lại"
            : label}
    </Button>
  );
}
