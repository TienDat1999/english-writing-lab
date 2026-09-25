"use client";

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export type CopyButtonProps = {
  text: string;
  className?: string;
};

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy error
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={handleCopy}
      className={`h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-lg gap-1 transition-colors ${className ?? ""}`}
      title="Sao chép nội dung"
    >
      <HugeiconsIcon
        icon={copied ? Tick02Icon : Copy01Icon}
        size={13}
        className={copied ? "text-emerald-600" : ""}
      />
      <span>{copied ? "Đã chép" : "Chép"}</span>
    </Button>
  );
}
