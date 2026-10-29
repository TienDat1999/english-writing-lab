"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Edit02Icon,
  FireIcon,
  Mic01Icon,
  PlayIcon,
  SparklesIcon,
  StopIcon,
  Target01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SprintDayPlan } from "@/server/sprint/sprint.types";

interface DailyStationViewProps {
  dayPlan: SprintDayPlan;
  dayNumber: number;
  isLoggedIn: boolean;
  initialProgress: {
    status?: string;
    stations?: {
      vocab?: { isCompleted?: boolean };
      writing?: { isCompleted?: boolean; submissionText?: string; wordCount?: number; timeSpentSeconds?: number };
      speaking?: { isCompleted?: boolean; durationSeconds?: number; deadAirCount?: number; notes?: string };
      audit?: { isCompleted?: boolean; checkedItems?: string[]; mistakesNote?: string };
    };
  } | null;
}

export function DailyStationView({
  dayPlan,
  dayNumber,
  isLoggedIn,
  initialProgress,
}: DailyStationViewProps) {
  const router = useRouter();

  // Active Station: 1 = Vocab, 2 = Writing, 3 = Speaking, 4 = Audit
  const [currentStation, setCurrentStation] = useState<number>(1);

  // Station completion states
  const [vocabDone, setVocabDone] = useState(!!initialProgress?.stations?.vocab?.isCompleted);
  const [writingDone, setWritingDone] = useState(!!initialProgress?.stations?.writing?.isCompleted);
  const [speakingDone, setSpeakingDone] = useState(!!initialProgress?.stations?.speaking?.isCompleted);
  const [auditDone, setAuditDone] = useState(!!initialProgress?.stations?.audit?.isCompleted);

  // Station 2: Writing state
  const [writingContent, setWritingContent] = useState(
    initialProgress?.stations?.writing?.submissionText || ""
  );
  const [writingTimer, setWritingTimer] = useState(dayPlan.writingTask.timeLimitMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSavingWriting, setIsSavingWriting] = useState(false);
  const [showScaffold, setShowScaffold] = useState(false);

  // Station 3: Speaking state
  const [prepTimer, setPrepTimer] = useState(dayPlan.speakingTask.prepTimeSeconds);
  const [isPrepActive, setIsPrepActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [deadAirCount, setDeadAirCount] = useState(0);
  const [prepScratchpad, setPrepScratchpad] = useState("");
  const [isSavingSpeaking, setIsSavingSpeaking] = useState(false);

  // Station 4: Audit state
  const [checkedAudit, setCheckedAudit] = useState<string[]>(
    initialProgress?.stations?.audit?.checkedItems || []
  );
  const [mistakesNote, setMistakesNote] = useState(
    initialProgress?.stations?.audit?.mistakesNote || ""
  );
  const [isCompletingDay, setIsCompletingDay] = useState(false);

  // Calculate word count for writing
  const wordCount = writingContent.trim() ? writingContent.trim().split(/\s+/).length : 0;
  const isWordCountValid =
    dayPlan.writingTask.taskType === "TASK_1" ? wordCount >= 120 : wordCount >= 250;

  // Writing Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && writingTimer > 0) {
      interval = setInterval(() => setWritingTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, writingTimer]);

  // Speaking Prep Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPrepActive && prepTimer > 0) {
      interval = setInterval(() => setPrepTimer((prev) => prev - 1), 1000);
    } else if (prepTimer === 0 && isPrepActive) {
      setIsPrepActive(false);
    }
    return () => clearInterval(interval);
  }, [isPrepActive, prepTimer]);

  // Speaking Recording Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handlers
  const handleCompleteVocab = async () => {
    setVocabDone(true);
    if (isLoggedIn) {
      await fetch(`/api/sprint/day/${dayNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATION",
          station: "VOCAB",
          payload: { isCompleted: true },
        }),
      });
    }
    setCurrentStation(2);
  };

  const handleSaveWriting = async () => {
    setIsSavingWriting(true);
    setWritingDone(true);
    if (isLoggedIn) {
      await fetch(`/api/sprint/day/${dayNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATION",
          station: "WRITING",
          payload: {
            submissionText: writingContent,
            wordCount,
            timeSpentSeconds: dayPlan.writingTask.timeLimitMinutes * 60 - writingTimer,
          },
        }),
      });
    }
    setIsSavingWriting(false);
    setCurrentStation(3);
  };

  const handleFinishSpeaking = async () => {
    setIsRecording(false);
    setIsSavingSpeaking(true);
    setSpeakingDone(true);
    if (isLoggedIn) {
      await fetch(`/api/sprint/day/${dayNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATION",
          station: "SPEAKING",
          payload: {
            durationSeconds: recordingSeconds,
            deadAirCount,
            notes: prepScratchpad,
          },
        }),
      });
    }
    setIsSavingSpeaking(false);
    setCurrentStation(4);
  };

  const handleCompleteDay = async () => {
    setIsCompletingDay(true);
    if (isLoggedIn) {
      await fetch(`/api/sprint/day/${dayNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATION",
          station: "AUDIT",
          payload: {
            checkedItems: checkedAudit,
            mistakesNote,
          },
        }),
      });

      const res = await fetch(`/api/sprint/day/${dayNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "COMPLETE_DAY" }),
      });
      const data = await res.json();
      setAuditDone(true);

      if (data.data?.nextDay && data.data.nextDay <= 30 && data.data.nextDay !== dayNumber) {
        router.push(`/dashboard/sprint/day/${data.data.nextDay}`);
      } else {
        router.push("/lessons/collection/vstep-b2-30-day-sprint");
      }
    } else {
      setAuditDone(true);
      router.push("/lessons/collection/vstep-b2-30-day-sprint");
    }
    setIsCompletingDay(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/lessons/collection/vstep-b2-30-day-sprint"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
          <span>Về Đề cương 30 Ngày</span>
        </Link>
        <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
          Ngày {dayNumber < 10 ? `0${dayNumber}` : dayNumber} / 30
        </span>
      </div>

      {/* Day Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white shadow-md border border-amber-500/20">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
            Tuần {dayPlan.weekNumber}
          </span>
          <span className="text-xs font-semibold text-amber-200">
            {dayPlan.focusBadge}
          </span>
        </div>
        <h1 className="font-heading text-xl sm:text-2xl font-black text-white">
          {dayPlan.title}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-300">
          🎯 KPI Ngày: {dayPlan.dailyGoal}
        </p>
      </div>

      {/* 4-Station Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 1, label: "Trạm 1: Nạp Từ Vựng B2", icon: BookOpen01Icon, isDone: vocabDone },
          { id: 2, label: "Trạm 2: Writing Arena", icon: Edit02Icon, isDone: writingDone },
          { id: 3, label: "Trạm 3: Speaking Booth", icon: Mic01Icon, isDone: speakingDone },
          { id: 4, label: "Trạm 4: Thẩm Định & Hoàn Thành", icon: CheckmarkCircle02Icon, isDone: auditDone },
        ].map((station) => {
          const isActive = currentStation === station.id;
          return (
            <button
              key={station.id}
              onClick={() => setCurrentStation(station.id)}
              className={`flex items-center gap-2 rounded-xl p-3 text-left transition-all border ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : station.isDone
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div
                className={`grid size-7 shrink-0 place-items-center rounded-lg ${
                  isActive
                    ? "bg-amber-400 text-slate-950 font-bold"
                    : station.isDone
                    ? "bg-emerald-200 text-emerald-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {station.isDone ? (
                  <HugeiconsIcon icon={Tick02Icon} size={15} />
                ) : (
                  <HugeiconsIcon icon={station.icon} size={15} />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold block truncate">
                  {station.label}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {station.isDone ? "Đã xong" : isActive ? "Đang làm" : "Chờ làm"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* STATION 1: VOCAB DRILL */}
      {currentStation === 1 && (
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Chủ đề từ vựng: {dayPlan.vocabDrill.theme}
              </span>
              <h2 className="font-heading text-lg font-bold text-slate-900 mt-1">
                Nạp Collocations & Cụm Từ Chuẩn B2
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {dayPlan.vocabDrill.items.length} cụm từ mục tiêu
            </span>
          </div>

          <div className="space-y-4">
            {dayPlan.vocabDrill.items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-amber-50/30 hover:border-amber-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-heading font-black text-base text-amber-900">
                    {item.term}
                  </h3>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {item.meaningVi}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-slate-800 font-medium">
                    <span className="text-amber-700 font-bold">Ví dụ: </span>
                    {item.exampleSentenceEn}
                  </p>
                  <p className="text-muted-foreground italic">
                    → {item.exampleSentenceVi}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Đọc kỹ và nhẩm phát âm các cụm từ trên trước khi bắt đầu bài viết.
            </p>
            <Button
              onClick={handleCompleteVocab}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5"
            >
              <span>Đã thuộc từ vựng ➔ Sang Trạm Viết</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} className="ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STATION 2: WRITING ARENA */}
      {currentStation === 2 && (
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          {/* Header & Countdown Timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-900">
                  {dayPlan.writingTask.taskType === "TASK_1" ? "Writing Task 1 (Thư)" : "Writing Task 2 (Luận)"}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Thời gian: {dayPlan.writingTask.timeLimitMinutes} phút
                </span>
              </div>
              <h2 className="font-heading text-lg font-bold text-slate-900 mt-1">
                {dayPlan.writingTask.title}
              </h2>
            </div>

            {/* Timer Box */}
            <div className="flex items-center gap-3 bg-slate-950 text-white px-4 py-2 rounded-2xl shadow-inner font-mono">
              <HugeiconsIcon icon={Clock01Icon} size={18} className="text-amber-400" />
              <span className="text-xl font-black">{formatTimer(writingTimer)}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="h-7 text-xs text-amber-300 hover:bg-white/10 px-2 rounded-lg"
              >
                {isTimerRunning ? "Tạm dừng" : "Bắt đầu"}
              </Button>
            </div>
          </div>

          {/* Prompt Box */}
          <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 space-y-2">
            <h4 className="text-xs font-black uppercase text-amber-900 tracking-wide">
              Đề Bài Thực Chiến:
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {dayPlan.writingTask.prompt}
            </p>
            {dayPlan.writingTask.bulletPoints && (
              <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1 pt-1">
                {dayPlan.writingTask.bulletPoints.map((bp, i) => (
                  <li key={i}>{bp}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Scaffold Accordion */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScaffold(!showScaffold)}
              className="rounded-xl text-xs font-bold border-amber-300 bg-amber-50 text-amber-900"
            >
              <HugeiconsIcon icon={SparklesIcon} size={14} className="mr-1 text-amber-600" />
              {showScaffold ? "Ẩn gợi ý dàn ý & Template B2" : "Xem gợi ý dàn ý & Template B2"}
            </Button>

            {showScaffold && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-900">Khung câu gợi ý:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {dayPlan.writingTask.suggestedScaffold.map((s, idx) => (
                    <li key={idx} className="font-mono text-[11px]">{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Editor Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Soạn thảo bài viết:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded ${
                  isWordCountValid
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                Số từ: {wordCount} từ {dayPlan.writingTask.taskType === "TASK_1" ? "(Yêu cầu: ≥ 120 từ)" : "(Yêu cầu: ≥ 250 từ)"}
              </span>
            </div>

            <textarea
              rows={12}
              value={writingContent}
              onChange={(e) => setWritingContent(e.target.value)}
              placeholder="Bấm giờ và bắt đầu gõ bài viết của bạn tại đây..."
              className="w-full rounded-2xl border border-slate-200 p-4 text-xs sm:text-sm font-sans leading-relaxed outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStation(1)}
              className="text-xs font-semibold text-muted-foreground"
            >
              ← Xem lại từ vựng
            </Button>

            <Button
              onClick={handleSaveWriting}
              disabled={isSavingWriting}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-6"
            >
              <span>{isSavingWriting ? "Đang lưu bài..." : "Lưu bài viết ➔ Sang Trạm Nói"}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} className="ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STATION 3: SPEAKING BOOTH */}
      {currentStation === 3 && (
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-900">
                {dayPlan.speakingTask.part === "FULL_MOCK"
                  ? "Speaking Full Mock (12 phút)"
                  : `Speaking Part ${dayPlan.speakingTask.part}`}
              </span>
              <h2 className="font-heading text-lg font-bold text-slate-900 mt-1">
                Chủ đề: {dayPlan.speakingTask.topic}
              </h2>
            </div>

            {/* Prep Countdown Box (if prepTimeSeconds > 0) */}
            {dayPlan.speakingTask.prepTimeSeconds > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl font-mono text-xs">
                <span className="text-amber-900 font-bold">Chuẩn bị nháp:</span>
                <span className="text-sm font-black text-amber-950">{prepTimer}s</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPrepActive(!isPrepActive)}
                  className="h-6 text-[10px] px-2 rounded-md font-bold"
                >
                  {isPrepActive ? "Dừng" : "Bắt đầu 60s"}
                </Button>
              </div>
            )}
          </div>

          {/* Cue Card Questions */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-900 tracking-wide">
              Nội dung câu hỏi / Tình huống thảo luận:
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-800">
              {dayPlan.speakingTask.questionsOrCueCard.map((q, i) => (
                <li key={i} className="font-medium">{q}</li>
              ))}
            </ul>
          </div>

          {/* Golden Tips */}
          <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-xs text-amber-950 space-y-1">
            <span className="font-bold flex items-center gap-1 text-amber-900">
              <HugeiconsIcon icon={SparklesIcon} size={14} />
              Bí kíp ăn điểm:
            </span>
            <p className="leading-relaxed">{dayPlan.speakingTask.goldenTips}</p>
          </div>

          {/* Scratchpad (for 60s note-taking) */}
          {dayPlan.speakingTask.prepTimeSeconds > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Nháp nhanh từ khóa trong 60 giây (Chỉ ghi 4-5 từ khóa chính):
              </label>
              <textarea
                rows={3}
                value={prepScratchpad}
                onChange={(e) => setPrepScratchpad(e.target.value)}
                placeholder="Nháp nhanh từ khóa & liên từ tại đây..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-amber-400 font-mono"
              />
            </div>
          )}

          {/* Audio Recording Simulator & Dead Air Counter */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-xl font-black text-slate-900">
                {formatTimer(recordingSeconds)}
              </span>
              {isRecording && (
                <span className="flex items-center gap-1 text-xs font-bold text-rose-600 animate-pulse">
                  <span className="size-2 rounded-full bg-rose-600 inline-block" />
                  Đang ghi âm phòng thi
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              {!isRecording ? (
                <Button
                  onClick={() => setIsRecording(true)}
                  className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 h-11"
                >
                  <HugeiconsIcon icon={Mic01Icon} size={18} className="mr-1.5" />
                  Bắt đầu nói & Ghi âm
                </Button>
              ) : (
                <Button
                  onClick={() => setIsRecording(false)}
                  className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 h-11"
                >
                  <HugeiconsIcon icon={StopIcon} size={18} className="mr-1.5" />
                  Dừng ghi âm
                </Button>
              )}

              {/* Dead Air warning helper */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeadAirCount((prev) => prev + 1)}
                className="h-11 rounded-2xl text-xs font-bold border-slate-200"
              >
                Cảnh báo Dead Air: {deadAirCount} lần
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tuyệt đối không để khoảng lặng quá 3 giây. Nếu nghẽn ý, dùng ngay các cụm từ cứu nguy.
            </p>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStation(2)}
              className="text-xs font-semibold text-muted-foreground"
            >
              ← Về Trạm Viết
            </Button>

            <Button
              onClick={handleFinishSpeaking}
              disabled={isSavingSpeaking}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-6"
            >
              <span>{isSavingSpeaking ? "Đang lưu bài nói..." : "Hoàn thành nói ➔ Sang Trạm Thẩm Định"}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} className="ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STATION 4: ERROR AUDIT & SIGN-OFF */}
      {currentStation === 4 && (
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-extrabold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              Trạm cuối cùng: Đánh giá chất lượng
            </span>
            <h2 className="font-heading text-lg font-bold text-slate-900 mt-1">
              Thẩm Định Lỗi Sai & Checklist Hoàn Thành Ngày
            </h2>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Checklist tự kiểm tra trước khi hoàn tất:
            </h4>
            <div className="space-y-2">
              {dayPlan.auditChecklist.map((item, idx) => {
                const isChecked = checkedAudit.includes(item);
                return (
                  <label
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer hover:bg-slate-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCheckedAudit([...checkedAudit, item]);
                        } else {
                          setCheckedAudit(checkedAudit.filter((c) => c !== item));
                        }
                      }}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className={isChecked ? "line-through text-slate-400 font-medium" : "text-slate-800 font-medium"}>
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Personal Mistakes Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Ghi chép các lỗi sai phát hiện được hôm nay (Sẽ tự động đưa vào danh mục ôn tập):
            </label>
            <textarea
              rows={4}
              value={mistakesNote}
              onChange={(e) => setMistakesNote(e.target.value)}
              placeholder="Ví dụ: Hay quên phát âm đuôi -s; Thiếu liên từ chuyển đoạn; Quên câu loại trừ trong Speaking Part 2..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-amber-500"
            />
          </div>

          {/* Final Sign-off Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStation(3)}
              className="text-xs font-semibold text-muted-foreground"
            >
              ← Về Trạm Nói
            </Button>

            <Button
              onClick={handleCompleteDay}
              disabled={isCompletingDay}
              size="lg"
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 shadow-md"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="mr-2" />
              <span>
                {isCompletingDay
                  ? "Đang hoàn tất..."
                  : `Hoàn Thành Ngày ${dayNumber < 10 ? `0${dayNumber}` : dayNumber} ➔ Mở Khóa Ngày Tiếp Theo!`}
              </span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
