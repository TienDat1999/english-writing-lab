"use client";

import { useState } from "react";
import { Copy01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

type CopyButtonProps = {
  textToCopy: string;
  label?: string;
  className?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
};

export function CopyButton({
  textToCopy,
  label = "Sao chép",
  className,
  variant = "ghost",
  size = "sm",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleCopy}
      variant={variant}
      size={size}
      className={`rounded-full transition-all text-xs font-medium ${
        copied ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-muted-foreground hover:text-foreground"
      } ${className || ""}`}
    >
      {copied ? (
        <span className="inline-flex items-center gap-1.5">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-emerald-600" />
          <span>Đã chép</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <HugeiconsIcon icon={Copy01Icon} size={14} />
          {label ? <span>{label}</span> : null}
        </span>
      )}
    </Button>
  );
}
