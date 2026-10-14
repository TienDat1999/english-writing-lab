"use client"

import React from "react"
import { VolumeHighIcon, UserIcon, BotIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { SaveToSrsButton } from "@/components/speaking/save-to-srs-button"
import type { SpeakingTurn } from "@/server/speaking/domain/speaking.types"

export interface SpeakingTurnItemProps {
  turn: SpeakingTurn
  onReplayAiAudio: (turn: SpeakingTurn) => void
  isAudioPlaying?: boolean
}

export function SpeakingTurnItem({
  turn,
  onReplayAiAudio,
  isAudioPlaying = false,
}: SpeakingTurnItemProps) {
  return (
    <div className="space-y-4 py-2">
      {/* User Bubble */}
      <div className="flex justify-end gap-3 items-start">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground text-sm shadow-sm">
          <p className="leading-relaxed">{turn.userTranscript}</p>
          <div className="mt-1 text-[11px] opacity-75 text-right">
            {turn.userAudioDurationSeconds}s
          </div>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon icon={UserIcon} size={16} />
        </div>
      </div>

      {/* AI Bubble */}
      <div className="flex justify-start gap-3 items-start">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <HugeiconsIcon icon={BotIcon} size={16} />
        </div>
        <div className="max-w-[80%] space-y-2">
          <div className="rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-100 text-sm shadow-sm">
            <p className="leading-relaxed">{turn.aiReplyText}</p>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onReplayAiAudio(turn)}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 -ml-1 rounded-md"
              >
                <HugeiconsIcon
                  icon={VolumeHighIcon}
                  size={12}
                  className={isAudioPlaying ? "animate-pulse text-emerald-500" : ""}
                />
                <span>Nghe lại</span>
              </Button>
            </div>
          </div>

          {/* Instant Vietnamese Feedback */}
          {turn.instantFeedbackVi && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              💡 <span className="font-medium">Góp ý nhanh:</span> {turn.instantFeedbackVi}
            </div>
          )}

          {/* Suggested Collocations */}
          {turn.suggestedPhrases && turn.suggestedPhrases.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {turn.suggestedPhrases.map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-300"
                >
                  <span className="font-semibold text-primary">{item.phrase}</span>: {item.meaningVi}
                  <SaveToSrsButton
                    sourceType="PHRASE"
                    quizType="COLLOCATION"
                    title={item.phrase}
                    promptText={item.meaningVi}
                    answerText={item.phrase}
                    contextText={turn.userTranscript}
                    label="+"
                    className="h-4 px-1 text-[9px]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
