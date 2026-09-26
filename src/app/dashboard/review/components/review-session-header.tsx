"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PauseIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { TopicHeaderInfo } from "../types";

export type ReviewSessionHeaderProps = {
  topicHeader?: TopicHeaderInfo;
  itemsCount: number;
  currentItemTopicText?: string;
  completed: number;
  totalItems: number;
  onPause: () => void;
  activeNextAction?: (() => void) | null;
};

export function ReviewSessionHeader({
  topicHeader,
  itemsCount,
  currentItemTopicText,
  completed,
  totalItems,
  onPause,
  activeNextAction,
}: ReviewSessionHeaderProps) {
  const progressPercent = Math.round(((completed + 1) / totalItems) * 100);

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/80">
      {/* Left Column: Topic Info */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground -ml-1 rounded-md gap-1"
          >
            <Link href="/dashboard/review?view=categories">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
              <span>Đổi phần ôn</span>
            </Link>
          </Button>
          <span className="text-slate-300">/</span>
          <Badge variant="secondary" className="font-semibold text-[11px] py-0">
            {topicHeader?.breadcrumbLabel || "Writing Template"}
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono">
            {topicHeader?.itemsCount ?? itemsCount} nội dung
          </span>
        </div>

        <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
          {topicHeader?.title || currentItemTopicText || "Luyện tập"}
        </h1>
        {topicHeader?.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {topicHeader.description}
          </p>
        )}
      </div>

      {/* Right Column: Actions & Progress bar with count */}
      <div className="w-full md:w-64 lg:w-72 shrink-0 space-y-2">
        {/* Top row: Action buttons */}
        <div className="flex items-center justify-end gap-1.5">
          <Button
            onClick={onPause}
            size="sm"
            variant="outline"
            className="rounded-xl text-xs h-7 px-2.5 gap-1 hover:bg-slate-50"
          >
            <HugeiconsIcon icon={PauseIcon} size={13} />
            <span>Tạm dừng</span>
          </Button>

          {activeNextAction && (
            <Button
              onClick={activeNextAction}
              size="sm"
              className="rounded-xl text-xs h-7 px-3 gap-1 font-bold shadow-sm"
            >
              <span>Tiếp tục</span>
              <kbd className="hidden sm:inline-block rounded bg-primary-foreground/20 px-1 py-0.2 text-[9px] font-mono leading-none">
                ↵
              </kbd>
              <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
            </Button>
          )}
        </div>

        {/* Bottom row: Progress Bar + Clean count */}
        <div className="flex items-center gap-2.5">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-primary to-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-semibold text-muted-foreground whitespace-nowrap">
            {completed + 1} / {totalItems}
          </span>
        </div>
      </div>
    </div>
  );
}
