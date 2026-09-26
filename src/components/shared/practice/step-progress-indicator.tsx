"use client";

import { Badge } from "@/components/ui/badge";

export type StepStageInfo = {
  id: string;
  label: string;
  title: string;
  description: string;
};

export type StepProgressIndicatorProps = {
  stages: StepStageInfo[];
  currentStageIndex: number;
  currentRound?: number;
  currentIndex: number;
  totalItemsInRound: number;
  className?: string;
};

export function StepProgressIndicator({
  stages,
  currentStageIndex,
  currentRound = 1,
  currentIndex,
  totalItemsInRound,
  className,
}: StepProgressIndicatorProps) {
  const currentStage = stages[currentStageIndex] || stages[0];

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {/* 3-Step Progress Bar */}
      <div className="rounded-2xl border border-blue-100 bg-white/80 backdrop-blur-xs px-4 py-3 shadow-xs sm:flex sm:items-start sm:px-5">
        {stages.map((stage, index) => (
          <div className="contents" key={stage.id}>
            <div
              aria-current={index === currentStageIndex ? "step" : undefined}
              className="flex min-w-0 flex-1 items-start gap-3 py-1"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  index === currentStageIndex
                    ? "bg-primary text-white shadow-[0_6px_16px_rgb(20_100_244/28%)]"
                    : index < currentStageIndex
                      ? "bg-blue-50 text-primary"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {index < currentStageIndex ? "✓" : index + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={`font-semibold leading-5 ${
                    index > currentStageIndex ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {stage.title}
                </p>
                <p className="mt-0.5 text-xs leading-4 text-muted-foreground line-clamp-1 sm:line-clamp-none">
                  {stage.description}
                </p>
              </div>
            </div>
            {index < stages.length - 1 ? (
              <div
                className={`mx-3 mt-[1.125rem] hidden h-px w-10 shrink-0 lg:block lg:w-16 ${
                  index < currentStageIndex ? "bg-primary" : "bg-slate-200"
                }`}
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Subheader: Stage label & Counter */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <Badge variant="outline" className="font-semibold">
          {currentStage.label} / {stages.length}
        </Badge>
        <div className="text-right text-sm text-muted-foreground">
          <p className="font-medium">
            {currentIndex + 1} / {totalItemsInRound}
          </p>
          {currentRound > 1 ? (
            <p className="mt-0.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 inline-block">
              Vòng ôn lại {currentRound}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
