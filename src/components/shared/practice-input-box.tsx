"use client";

import { useEffect, useRef } from "react";

import { Textarea } from "@/components/ui/textarea";

export type PracticeInputBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  minHeightClassName?: string;
  submitShortcut?: "enter" | "mod-enter" | "none";
  shortcutHint?: string;
  showCounter?: boolean;
  className?: string;
  id?: string;
};

export function PracticeInputBox({
  value,
  onChange,
  onSubmit,
  placeholder = "Nhập nội dung...",
  disabled = false,
  autoFocus = false,
  minHeightClassName = "min-h-32 sm:min-h-40",
  submitShortcut = "mod-enter",
  shortcutHint,
  showCounter = true,
  className = "",
  id,
}: PracticeInputBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (disabled || !onSubmit) return;

    const isEnter = e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter";

    if (submitShortcut === "enter") {
      if (isEnter && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    } else if (submitShortcut === "mod-enter") {
      if ((e.ctrlKey || e.metaKey) && isEnter) {
        e.preventDefault();
        onSubmit();
      }
    }
  }

  const defaultShortcutHint =
    shortcutHint ??
    (submitShortcut === "mod-enter" ? (
      <>
        Nhấn <kbd className="rounded bg-white px-1.5 py-0.5 border border-slate-200 text-[10px] font-mono">⌘ + Enter</kbd> để chấm
      </>
    ) : submitShortcut === "enter" ? (
      <>
        Nhấn <kbd className="rounded bg-white px-1.5 py-0.5 border border-slate-200 text-[10px] font-mono">Enter ↵</kbd> để kiểm tra
      </>
    ) : null);

  return (
    <div
      className={`relative rounded-xl border border-slate-200 bg-white transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 shadow-2xs overflow-hidden ${
        disabled ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <Textarea
        id={id}
        ref={textareaRef}
        className={`${minHeightClassName} border-0 bg-transparent p-3.5 sm:p-4 text-base leading-relaxed shadow-none focus-visible:ring-0 focus-visible:outline-none resize-y placeholder:text-muted-foreground/60`}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={value}
      />

      {(showCounter || defaultShortcutHint) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-3.5 py-2 text-xs text-muted-foreground select-none">
          {showCounter ? (
            <span className="font-mono text-[11px] sm:text-xs text-slate-500">
              {wordCount} từ · {charCount} ký tự
            </span>
          ) : <div />}

          {defaultShortcutHint && (
            <span className="hidden sm:inline text-[11px] text-muted-foreground/80">
              {defaultShortcutHint}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
