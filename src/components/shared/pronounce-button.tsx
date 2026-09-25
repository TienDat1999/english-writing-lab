"use client";

import { VolumeHighIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { playNaturalSpeech } from "@/lib/speech";

export type PronounceButtonProps = {
  text: string;
  className?: string;
  voice?: "nova" | "alloy" | "echo" | "fable" | "onyx" | "shimmer";
};

export function PronounceButton({
  text,
  className,
  voice = "nova",
}: PronounceButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  function handleSpeak(e: React.MouseEvent) {
    e.stopPropagation();
    void playNaturalSpeech(text, {
      voice,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={handleSpeak}
      className={`h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-lg gap-1 transition-colors ${className ?? ""}`}
      title="Nghe phát âm tự nhiên bằng giọng AI"
    >
      <HugeiconsIcon
        icon={VolumeHighIcon}
        size={13}
        className={isPlaying ? "text-primary animate-pulse" : ""}
      />
      <span>{isPlaying ? "Đang đọc..." : "Nghe"}</span>
    </Button>
  );
}
