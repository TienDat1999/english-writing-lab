"use client";

import {
  AlertCircleIcon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  Idea01Icon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
  SparklesIcon,
  Tick02Icon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { UploadedQuizType } from "@/server/learning/learning.contract";
import type { LearningItemView } from "@/server/learning/learning.service";
import { playNaturalSpeech } from "@/lib/speech";

import {
  ParaphraseLearningSession,
  StepLearningSession,
  COLLOCATION_CONFIG,
  TOPIC_VOCABULARY_CONFIG,
} from "./paraphrase-learning-session";

type Rating = "AGAIN" | "HARD" | "GOOD" | "EASY";

type TranslationEvaluation = {
  score: number;
  meaningScore: number;
  grammarScore: number;
  naturalnessScore: number;
  feedbackVi: string;
  correctedTranslation: string;
  upgradedTranslation: string;
  patternTipVi: string;
  paraphraseExampleEn: string;
  grammarIssues: Array<{
    sourceQuote: string;
    correction: string;
    explanationVi: string;
  }>;
  vocabularyUpgrades?: Array<{
    originalWord: string;
    upgradedAlternatives: string;
    reasonVi: string;
  }>;
};

type SessionResultRecord = {
  item: LearningItemView;
  isCorrect: boolean;
  userDraft?: string;
  feedback?: string;
};

const ratingLabels: Record<Rating, string> = {
  AGAIN: "Chưa nhớ · 1 ngày",
  HARD: "Khó · ôn sớm",
  GOOD: "Nhớ được",
  EASY: "Rất dễ · giãn lịch",
};

function parsePatternTip(raw: string) {
  if (!raw) return { pattern: "", explanation: "", tokens: [] as string[] };
  const match = raw.match(/^(.*?)(?:\s*\(([^()]+)\))\s*$/);
  const pattern = match ? match[1].trim() : raw.trim();
  const explanation = match ? match[2].trim() : "";
  const tokens = pattern.split(/(\[[^\]]+\])/g).filter(Boolean);
  return { pattern, explanation, tokens };
}

function getScoreTier(score: number) {
  if (score >= 90) {
    return {
      tier: "Xuất sắc",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      containerClass: "border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 text-emerald-950",
      scoreClass: "text-emerald-600",
      title: "Xuất sắc · Đạt chuẩn B2+",
    };
  }
  if (score >= 75) {
    return {
      tier: "Đạt chuẩn",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
      containerClass: "border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-sky-50/30 text-sky-950",
      scoreClass: "text-primary",
      title: "Khá tốt · Đạt chuẩn B2",
    };
  }
  if (score >= 50) {
    return {
      tier: "Cần cải thiện",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      containerClass: "border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 text-amber-950",
      scoreClass: "text-amber-600",
      title: "Cần cải thiện ngữ pháp & từ vựng",
    };
  }
  return {
    tier: "Cần ôn lại",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    containerClass: "border-rose-200 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 text-rose-950",
    scoreClass: "text-rose-600",
    title: "Chưa đạt yêu cầu cấu trúc B2",
  };
}

function PronounceButton({
  text,
  className,
  voice = "nova",
}: {
  text: string;
  className?: string;
  voice?: "nova" | "alloy" | "echo" | "fable" | "onyx" | "shimmer";
}) {
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

function CopyButton({ text, className }: { text: string; className?: string }) {
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

function MetricRow({ label, score }: { label: string; score: number }) {
  const tierColor =
    score >= 75
      ? { text: "text-emerald-700", bar: "bg-emerald-500" }
      : score >= 50
        ? { text: "text-amber-700", bar: "bg-amber-500" }
        : { text: "text-rose-700", bar: "bg-rose-500" };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className={`font-mono font-bold text-xs ${tierColor.text}`}>{score}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${tierColor.bar}`}
          style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}

function saveProgressToStorage(
  storageKey: string,
  remaining: LearningItemView[],
  totalItems: number,
  currentResults: SessionResultRecord[],
) {
  if (typeof window === "undefined") return;
  try {
    if (remaining.length === 0) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          items: remaining,
          totalItems,
          results: currentResults,
          updatedAt: Date.now(),
        }),
      );
    }
  } catch {
    // Ignore storage error
  }
}

export function ReviewSession({
  initialItems,
  sessionMode = "MIXED",
  uploadedQuizType,
}: {
  initialItems: LearningItemView[];
  sessionMode?: "MIXED" | "QUICK" | "UPLOADED";
  uploadedQuizType?: UploadedQuizType;
}) {
  const storageKey = `draftwise_session_${sessionMode}_${uploadedQuizType ?? "all"}`;

  // Session size choice
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [items, setItems] = useState<LearningItemView[]>(initialItems);
  const [totalItems, setTotalItems] = useState(initialItems.length);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState("");
  const [evaluation, setEvaluation] = useState<TranslationEvaluation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);

  // Results tracker for end-of-session summary
  const [results, setResults] = useState<SessionResultRecord[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [savedSessionNotice, setSavedSessionNotice] = useState<{
    itemsCount: number;
    completedCount: number;
  } | null>(null);

  // Check LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        items: LearningItemView[];
        totalItems: number;
        results: SessionResultRecord[];
        updatedAt: number;
      };
      if (
        parsed.items &&
        parsed.items.length > 0 &&
        parsed.totalItems > 0 &&
        Date.now() - parsed.updatedAt < 24 * 60 * 60 * 1000
      ) {
        queueMicrotask(() => {
          setSavedSessionNotice({
            itemsCount: parsed.items.length,
            completedCount: parsed.totalItems - parsed.items.length,
          });
        });
      }
    } catch {
      // Ignore storage read error
    }
  }, [storageKey]);

  function resumeSavedSession() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        items: LearningItemView[];
        totalItems: number;
        results: SessionResultRecord[];
      };
      setItems(parsed.items);
      setTotalItems(parsed.totalItems);
      setResults(parsed.results || []);
      setSavedSessionNotice(null);
      setIsPaused(false);
    } catch {
      setSavedSessionNotice(null);
    }
  }

  function discardSavedSession() {
    localStorage.removeItem(storageKey);
    setSavedSessionNotice(null);
  }

  function handleSelectSessionSize(size: number) {
    setSelectedSize(size);
    const sliced = initialItems.slice(0, size);
    setItems(sliced);
    setTotalItems(sliced.length);
    setResults([]);
  }

  // Save progress to LocalStorage
  function persistProgress(remaining: LearningItemView[], currentResults: SessionResultRecord[]) {
    saveProgressToStorage(storageKey, remaining, totalItems, currentResults);
  }

  const item = items[0];
  const completed = totalItems - items.length;
  const isTranslation = item?.sourceType === "TRANSLATION";
  const isUploadedQuiz = item?.sourceType === "UPLOADED_QUIZ";
  const isPhrase = item?.sourceType === "PHRASE" || isUploadedQuiz;
  const isTemplateQuiz = isUploadedQuiz && uploadedQuizType === "TEMPLATE";

  function addPhraseToSession(newItem: LearningItemView) {
    if (items.some((currentItem) => currentItem.id === newItem.id)) return;
    setItems((current) => [...current, newItem]);
    setTotalItems((total) => total + 1);
  }

  function goToNextItem(shouldRepeat = false, record?: { isCorrect: boolean; userDraft?: string; feedback?: string }) {
    if (item && record) {
      const updatedResults = [
        ...results,
        {
          item,
          isCorrect: record.isCorrect,
          userDraft: record.userDraft,
          feedback: record.feedback,
        },
      ];
      setResults(updatedResults);

      const nextItems = shouldRepeat
        ? [...items.slice(1), items[0]]
        : items.slice(1);

      setItems(nextItems);
      persistProgress(nextItems, updatedResults);
    } else {
      const nextItems = shouldRepeat
        ? [...items.slice(1), items[0]]
        : items.slice(1);

      setItems(nextItems);
      persistProgress(nextItems, results);
    }

    setAttemptNumber((current) => current + 1);
    setDraft("");
    setRevealed(false);
    setEvaluation(null);
    setError(null);
  }

  async function evaluateTranslation() {
    if (!item || !isTranslation || isSaving || draft.trim().length < 2) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/learning-items/${item.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerAnswer: draft }),
      });

      if (!response.ok) {
        setError("AI chưa chấm được bài dịch này. Bạn vui lòng thử lại nhé.");
        return;
      }

      const payload = (await response.json()) as {
        data: { evaluation: TranslationEvaluation };
      };
      setEvaluation(payload.data.evaluation);
    } catch {
      setError("Mất kết nối khi AI đang chấm bài.");
    } finally {
      setIsSaving(false);
    }
  }

  async function rate(rating: Rating) {
    if (!item || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/learning-items/${item.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        setError("Không thể lưu lượt ôn. Bạn vui lòng thử lại nhé.");
        return;
      }

      const isCorrect = rating === "GOOD" || rating === "EASY";
      goToNextItem(rating === "AGAIN", { isCorrect, userDraft: draft });
    } catch {
      setError("Mất kết nối khi lưu lượt ôn.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleRetryWrongOnly() {
    const wrongRecords = results.filter((r) => !r.isCorrect);
    const wrongItems = wrongRecords.map((r) => r.item);
    if (wrongItems.length === 0) return;

    setItems(wrongItems);
    setTotalItems(wrongItems.length);
    setResults([]);
    setDraft("");
    setRevealed(false);
    setEvaluation(null);
    setError(null);
    setIsPaused(false);
  }

  const isParaphraseUpload =
    sessionMode === "UPLOADED" &&
    (uploadedQuizType === "PARAPHRASE" ||
      (!uploadedQuizType && initialItems[0]?.quizType === "PARAPHRASE"));

  if (isParaphraseUpload) {
    return <ParaphraseLearningSession initialItems={initialItems} />;
  }

  const isCollocationUpload =
    sessionMode === "UPLOADED" &&
    (uploadedQuizType === "COLLOCATION" ||
      (!uploadedQuizType && initialItems[0]?.quizType === "COLLOCATION"));

  if (isCollocationUpload) {
    return <StepLearningSession initialItems={initialItems} config={COLLOCATION_CONFIG} />;
  }

  const isTopicVocabUpload =
    sessionMode === "UPLOADED" &&
    (uploadedQuizType === "TOPIC_VOCABULARY" ||
      (!uploadedQuizType && initialItems[0]?.quizType === "TOPIC_VOCABULARY"));

  if (isTopicVocabUpload) {
    return <StepLearningSession initialItems={initialItems} config={TOPIC_VOCABULARY_CONFIG} />;
  }

  // Notice: Resume previous in-progress session
  if (savedSessionNotice && items.length === initialItems.length && !selectedSize) {
    return (
      <Card className="border-sky-200 bg-sky-50/70 p-6 sm:p-8">
        <CardContent className="space-y-4 p-0">
          <div className="flex items-center gap-3 text-sky-800">
            <HugeiconsIcon icon={Clock01Icon} size={24} />
            <h3 className="font-heading text-xl font-bold text-slate-900">
              Bạn có một phiên học đang dở dang
            </h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Bạn đã hoàn thành <strong>{savedSessionNotice.completedCount}</strong> câu và còn{" "}
            <strong>{savedSessionNotice.itemsCount}</strong> câu chưa ôn tập. Bạn có muốn tiếp tục phiên học này không?
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={resumeSavedSession} className="rounded-xl font-bold">
              Tiếp tục học dở →
            </Button>
            <Button onClick={discardSavedSession} variant="outline" className="rounded-xl">
              Bắt đầu phiên mới
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Session size selector (if not selected yet and there are more than 5 items)
  if (selectedSize === null && initialItems.length > 5) {
    return (
      <Card className="border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <CardHeader className="p-0 mb-6">
          <Badge variant="secondary" className="w-fit mb-2">
            Chọn độ dài phiên ôn
          </Badge>
          <CardTitle className="font-heading text-2xl font-bold text-foreground">
            Hôm nay Bạn muốn ôn bao nhiêu câu?
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Phiên học ngắn giúp duy trì sự tập trung cao độ và ghi nhớ từ vựng sâu hơn.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <button
              onClick={() => handleSelectSessionSize(5)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-sky-50/50 hover:border-primary transition-all text-center group"
              type="button"
            >
              <span className="font-mono text-3xl font-bold text-primary group-hover:scale-105 transition-transform">
                5
              </span>
              <span className="mt-2 text-sm font-bold text-foreground">Luyện nhanh</span>
              <span className="text-xs text-muted-foreground mt-1">~3 phút tập trung</span>
            </button>

            <button
              onClick={() => handleSelectSessionSize(10)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-primary bg-sky-50/30 hover:bg-sky-50 transition-all text-center group"
              type="button"
            >
              <span className="font-mono text-3xl font-bold text-primary group-hover:scale-105 transition-transform">
                10
              </span>
              <span className="mt-2 text-sm font-bold text-foreground">Tiêu chuẩn (Khuyên dùng)</span>
              <span className="text-xs text-muted-foreground mt-1">~7 phút tối ưu</span>
            </button>

            <button
              onClick={() => handleSelectSessionSize(initialItems.length)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-sky-50/50 hover:border-primary transition-all text-center group"
              type="button"
            >
              <span className="font-mono text-3xl font-bold text-primary group-hover:scale-105 transition-transform">
                {initialItems.length}
              </span>
              <span className="mt-2 text-sm font-bold text-foreground">Tất cả mục đến hạn</span>
              <span className="text-xs text-muted-foreground mt-1">Toàn bộ danh sách</span>
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Paused state card
  if (isPaused) {
    return (
      <Card className="border border-amber-200 bg-amber-50/50 py-10 text-center shadow-sm">
        <CardContent className="mx-auto max-w-md space-y-4">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-800 font-bold">
            <HugeiconsIcon icon={PauseIcon} size={24} />
          </div>
          <CardTitle className="font-heading text-2xl font-bold text-foreground">
            Phiên học đã được tạm dừng
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Bạn đã hoàn thành <strong>{completed}/{totalItems}</strong> câu. Tiến độ đã được lưu an toàn trong trình duyệt của Bạn.
          </CardDescription>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button onClick={() => setIsPaused(false)} className="rounded-xl font-bold">
              <HugeiconsIcon icon={PlayIcon} size={18} className="mr-1.5" />
              Tiếp tục ôn tập ngay
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/learning">Về Thư viện</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No items initially
  if (!item && completed === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-white py-12 text-center shadow-sm">
        <CardContent className="mx-auto max-w-xl">
          <Badge className="mb-4" variant="secondary">
            {sessionMode === "UPLOADED" ? "Uploaded Quiz" : "Quick Quiz"}
          </Badge>
          <CardTitle className="font-heading text-2xl font-bold">Chưa có nội dung để luyện</CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed">
            {sessionMode === "UPLOADED"
              ? "Hãy chọn một chủ đề quiz từ Thư viện học của Bạn."
              : "Lưu một cụm từ sau khi AI chấm bài dịch để bắt đầu luyện tập."}
          </CardDescription>
          <Button asChild className="mt-6 rounded-full font-bold">
            <Link href="/dashboard/learning">Về Thư viện học</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // End of Session Summary Screen
  if (!item && completed > 0) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const wrongRecords = results.filter((r) => !r.isCorrect);
    const accuracy = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 100;

    return (
      <div className="space-y-6">
        <Card className="border border-emerald-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-6 sm:p-8 shadow-sm">
          <CardHeader className="p-0 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <HugeiconsIcon icon={SparklesIcon} size={28} />
            </div>
            <Badge variant="success" className="mx-auto mb-2">
              Hoàn thành phiên ôn tập
            </Badge>
            <CardTitle className="font-heading text-3xl font-extrabold text-foreground">
              Tổng kết kết quả của Bạn 🎉
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Bạn đã hoàn thành trọn vẹn <strong>{totalItems}</strong> nội dung. Hệ thống đã tự động tính toán chu kỳ ngắt quãng kế tiếp.
            </CardDescription>
          </CardHeader>

          {/* Performance KPI */}
          <div className="my-8 grid grid-cols-3 gap-4 border-y border-slate-100 py-6 text-center">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Tổng số câu</p>
              <p className="font-mono text-3xl font-bold text-foreground mt-1">{totalItems}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Chính xác</p>
              <p className="font-mono text-3xl font-bold text-emerald-600 mt-1">{correctCount}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Tỷ lệ đúng</p>
              <p className="font-mono text-3xl font-bold text-primary mt-1">{accuracy}%</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {wrongRecords.length > 0 && (
              <Button onClick={handleRetryWrongOnly} className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white">
                <HugeiconsIcon icon={RefreshIcon} size={18} className="mr-1.5" />
                Luyện lại riêng {wrongRecords.length} câu chưa đạt
              </Button>
            )}
            <Button asChild className="rounded-xl font-bold" variant={wrongRecords.length > 0 ? "outline" : "default"}>
              <Link href="/dashboard/learning">Về Thư viện học</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard">Về Trang tổng quan</Link>
            </Button>
          </div>
        </Card>

        {/* Detailed Breakdown */}
        {wrongRecords.length > 0 && (
          <Card className="border border-rose-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-rose-700">
              <HugeiconsIcon icon={AlertCircleIcon} size={20} />
              <h4 className="font-heading text-base font-bold">Các câu cần củng cố lại:</h4>
            </div>
            <div className="space-y-3">
              {wrongRecords.map((record, index) => (
                <div key={index} className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 text-xs space-y-1.5">
                  <p className="font-bold text-foreground text-sm">{record.item.promptText}</p>
                  {record.userDraft && (
                    <p className="text-rose-700">
                      <span className="font-semibold">Bạn nhập: </span>
                      {record.userDraft}
                    </p>
                  )}
                  <p className="text-emerald-700 font-mono text-[13px]">
                    <span className="font-sans font-semibold">Đáp án đúng: </span>
                    {record.item.answerText}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-200 bg-white font-semibold text-xs">
            {isTranslation
              ? "VI → EN"
              : isTemplateQuiz
                ? "WRITING TEMPLATE · VI → EN"
                : isUploadedQuiz
                  ? "UPLOADED QUIZ · VI → EN"
                  : isPhrase
                    ? "QUICK QUIZ"
                    : item.sourceType.replaceAll("_", " ")}
          </Badge>
          <span className="text-xs font-mono font-medium text-muted-foreground">
            {completed + 1} / {totalItems} ({Math.round(((completed + 1) / totalItems) * 100)}%)
          </span>
        </div>

        <Button
          onClick={() => {
            persistProgress(items, results);
            setIsPaused(true);
          }}
          size="sm"
          variant="outline"
          className="rounded-xl text-xs h-8 gap-1.5 hover:bg-slate-50"
        >
          <HugeiconsIcon icon={PauseIcon} size={14} />
          <span>Tạm dừng</span>
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-primary to-sky-400 rounded-full transition-all duration-300"
          style={{ width: `${Math.round(((completed + 1) / totalItems) * 100)}%` }}
        />
      </div>

      {/* Main Content Area */}
      {isTemplateQuiz ? (
        <WritingTemplatePractice
          item={item}
          key={`${item.id}-${attemptNumber}`}
          onNext={goToNextItem}
        />
      ) : isTranslation && evaluation ? (
        <TranslationResult
          evaluation={evaluation}
          learnerAnswer={draft}
          onNext={() => {
            const hasError =
              evaluation.score < 70 ||
              evaluation.meaningScore < 70 ||
              evaluation.grammarScore < 70 ||
              Boolean(evaluation.grammarIssues && evaluation.grammarIssues.length > 0);

            goToNextItem(hasError, {
              isCorrect: !hasError,
              userDraft: draft,
              feedback: evaluation.feedbackVi,
            });
          }}
          onPhraseSaved={addPhraseToSession}
          sourceText={item.promptText}
          sourceLearningItemId={item.id}
        />
      ) : (
        <Card className="border border-slate-200/90 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardDescription className="text-xs font-semibold text-muted-foreground">
              {isTranslation
                ? "Dịch câu trích từ bài viết của Bạn sang tiếng Anh chuẩn xác"
                : isUploadedQuiz
                  ? item.topicText
                  : isPhrase
                    ? "Hoàn thành câu bằng cụm từ Bạn đã lưu"
                    : item.title}
            </CardDescription>
            <CardTitle className="font-heading text-2xl sm:text-3xl leading-snug text-foreground">
              {item.promptText}
            </CardTitle>
            {!isTranslation && item.hintVi ? (
              <p className="pt-2 text-xs text-muted-foreground">Gợi ý: {item.hintVi}</p>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-6">
            {isPhrase ? (
              <PhrasePractice
                key={item.id}
                item={item}
                onNext={(isCorrect, userDraft) =>
                  goToNextItem(!isCorrect, { isCorrect, userDraft })
                }
                typeOnly={isUploadedQuiz}
              />
            ) : (
              <>
                {isTranslation ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-700">Bản dịch tiếng Anh của Bạn</p>
                    {draft.length > 0 && (
                      <Button
                        disabled={isSaving}
                        onClick={() => {
                          setDraft("");
                          setError(null);
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                        className="text-xs h-8"
                      >
                        Viết lại
                      </Button>
                    )}
                  </div>
                ) : null}

                <Textarea
                  className="min-h-36 resize-y bg-slate-50/60 text-base leading-7 focus-visible:bg-white rounded-xl"
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={
                    isTranslation
                      ? "Nhập câu dịch tiếng Anh của Bạn tại đây..."
                      : "Tự viết câu trả lời trước khi xem đáp án..."
                  }
                  value={draft}
                />

                {isTranslation ? (
                  <Button
                    className="w-full rounded-xl font-bold"
                    disabled={isSaving || draft.trim().length < 2}
                    onClick={evaluateTranslation}
                    size="lg"
                  >
                    {isSaving ? "AI đang chấm bài dịch..." : "Chấm bản dịch với AI"}
                  </Button>
                ) : !revealed ? (
                  <Button
                    className="w-full rounded-xl font-bold"
                    onClick={() => setRevealed(true)}
                    size="lg"
                  >
                    Xem đáp án
                  </Button>
                ) : (
                <div className="space-y-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                    <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      Đáp án gợi ý
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-base font-medium text-slate-900 leading-relaxed">
                      {item.answerText}
                    </p>
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-semibold text-foreground">Bạn nhớ được mức nào?</p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      {(Object.keys(ratingLabels) as Rating[]).map((rating) => (
                        <Button
                          disabled={isSaving}
                          key={rating}
                          onClick={() => rate(rating)}
                          variant={rating === "GOOD" ? "default" : "outline"}
                          className="rounded-xl text-xs font-semibold"
                        >
                          {ratingLabels[rating]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {error ? <p aria-live="polite" className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
      )}
    </div>
  );
}

function WritingTemplatePractice({
  item,
  onNext,
}: {
  item: LearningItemView;
  onNext: (shouldRepeat: boolean, record?: { isCorrect: boolean; userDraft?: string }) => void;
}) {
  const [draft, setDraft] = useState("");
  const [evaluation, setEvaluation] = useState<TranslationEvaluation | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const charCount = draft.length;

  async function evaluate() {
    if (draft.trim().length < 2 || isChecking) return;
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch(`/api/learning-items/${item.id}/template/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerAnswer: draft }),
      });
      const payload = (await response.json()) as {
        data?: { evaluation: TranslationEvaluation };
      };

      if (!response.ok || !payload.data) {
        setError("AI chưa chấm được câu này. Bạn vui lòng thử lại nhé.");
        return;
      }

      setEvaluation(payload.data.evaluation);
    } catch {
      setError("Mất kết nối khi AI đang chấm câu.");
    } finally {
      setIsChecking(false);
    }
  }

  if (evaluation) {
    const shouldRepeat =
      evaluation.score < 70 ||
      evaluation.meaningScore < 70 ||
      evaluation.grammarScore < 70 ||
      Boolean(evaluation.grammarIssues && evaluation.grammarIssues.length > 0);

    return (
      <TranslationResult
        evaluation={evaluation}
        learnerAnswer={draft}
        meaningLabel="Đúng chức năng"
        nextLabel="Tiếp tục"
        onNext={() => onNext(shouldRepeat, { isCorrect: !shouldRepeat, userDraft: draft })}
        sourceText={item.applicationPromptVi}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-800 font-semibold px-2.5 py-1 text-xs gap-1.5">
            <HugeiconsIcon icon={BookOpen01Icon} size={13} className="text-sky-600" />
            <span>Chức năng: {item.promptText}</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
          <span className="text-xs font-semibold text-slate-700">
            Viết câu tiếng Việt thành câu template tiếng Anh B2
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Target Prompt & Context (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-slate-50 via-white to-sky-50/25 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                Câu tiếng Việt cần chuyển
              </span>
              {item.hintVi && (
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium"
                >
                  <HugeiconsIcon icon={Idea01Icon} size={14} />
                  <span>{showHint ? "Ẩn gợi ý" : "Xem gợi ý"}</span>
                </button>
              )}
            </div>

            <p className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
              &ldquo;{item.applicationPromptVi}&rdquo;
            </p>

            {showHint && item.hintVi && (
              <div className="pt-3 border-t border-slate-100 text-xs text-muted-foreground bg-amber-50/70 p-3 rounded-xl border-amber-200/50">
                <span className="font-semibold text-amber-900">Gợi ý từ khóa/cấu trúc: </span>
                <span className="text-slate-800">{item.hintVi}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-bold text-slate-700">💡 Mẹo viết câu template B2:</p>
            <p className="leading-relaxed text-slate-600">
              Chú ý mạo từ, thì động từ và liên từ nối học thuật. Nhấn <kbd className="rounded bg-white px-1.5 py-0.5 border border-slate-200 text-[10px] font-mono">⌘ + Enter</kbd> để nộp bài nhanh.
            </p>
          </div>
        </div>

        {/* Right Column: Textarea & Submit Action (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Bản viết tiếng Anh B2 của bạn
              </label>
              {draft.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft("")}
                  className="text-xs text-muted-foreground hover:text-rose-600 transition-colors"
                >
                  Xóa làm lại
                </button>
              )}
            </div>

            <div className="relative rounded-xl border border-slate-200 bg-white transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 shadow-2xs overflow-hidden">
              <Textarea
                className="min-h-48 sm:min-h-56 border-0 bg-transparent p-4 text-base sm:text-lg leading-relaxed shadow-none focus-visible:ring-0 focus-visible:outline-none resize-y placeholder:text-muted-foreground/60"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    void evaluate();
                  }
                }}
                placeholder="Viết câu tiếng Việt trên bằng tiếng Anh B2..."
                value={draft}
              />
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-xs text-muted-foreground">
                <span className="font-mono">
                  {wordCount} từ · {charCount} ký tự
                </span>
                <span className="hidden sm:inline text-[11px] text-muted-foreground/80">
                  Nhấn <kbd className="rounded bg-white px-1.5 py-0.5 border border-slate-200 text-[10px] font-mono">⌘ + Enter</kbd> để chấm
                </span>
              </div>
            </div>
          </div>

          <Button
            className="w-full rounded-xl font-bold h-12 text-base gap-2 shadow-xs transition-all"
            disabled={isChecking || draft.trim().length < 2}
            onClick={evaluate}
            size="lg"
            type="button"
          >
            {isChecking ? (
              <>
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>AI đang chấm bài viết...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={SparklesIcon} size={18} />
                <span>AI chấm bài viết</span>
              </>
            )}
          </Button>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-destructive flex items-center gap-2" role="alert">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function normalizeQuizAnswer(value: string) {
  return value.trim().toLocaleLowerCase("en").replace(/[.!?,;:]+$/gu, "").replace(/\s+/gu, " ");
}

function buildChoiceOptions(answer: string, context: string) {
  const answerWordCount = answer.trim().split(/\s+/u).length;
  const words = context.match(/[A-Za-z]+(?:'[A-Za-z]+)?/gu) ?? [];
  const contextPhrases = words
    .map((_, index) => words.slice(index, index + answerWordCount).join(" "))
    .filter((phrase) => phrase.split(" ").length === answerWordCount);
  const fallbacks =
    answerWordCount === 1
      ? ["however", "therefore", "although", "because", "which", "significant"]
      : ["as a result", "in addition", "on the other hand", "plays a role", "is likely to"];
  const unique = [answer, ...contextPhrases, ...fallbacks].filter(
    (item, index, list) => list.indexOf(item) === index && item.length > 0,
  );
  const offset = [...answer].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % unique.length;
  const reordered = [...unique.slice(offset), ...unique.slice(0, offset)];
  return reordered.slice(0, 4);
}

function PhrasePractice({
  item,
  onNext,
  typeOnly = false,
}: {
  item: LearningItemView;
  onNext: (isCorrect: boolean, userDraft: string) => void;
  typeOnly?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"CORRECT" | "INCORRECT" | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = buildChoiceOptions(item.answerText, item.contextText);

  async function checkAnswer() {
    if (!answer.trim() || isChecking) return;
    setIsChecking(true);
    setError(null);

    const isCorrect = normalizeQuizAnswer(answer) === normalizeQuizAnswer(item.answerText);
    setResult(isCorrect ? "CORRECT" : "INCORRECT");

    try {
      await fetch(`/api/learning-items/${item.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: isCorrect ? "GOOD" : "AGAIN" }),
      });
    } catch {
      // Ignore network failure for background save
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="space-y-5">
      {item.contextText ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-1">
            Ngữ cảnh bài viết
          </p>
          <p className="text-sm leading-relaxed text-slate-800">{item.contextText}</p>
        </div>
      ) : null}

      {!typeOnly && options.length >= 2 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <Button
              className="h-auto min-h-12 justify-start whitespace-normal rounded-xl px-4 py-3 text-left font-medium"
              disabled={Boolean(result)}
              key={option}
              onClick={() => setAnswer(option)}
              type="button"
              variant={answer === option ? "default" : "outline"}
            >
              {option}
            </Button>
          ))}
        </div>
      ) : (
        <Textarea
          className="min-h-28 bg-slate-50/60 text-base rounded-xl"
          disabled={Boolean(result)}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder={typeOnly ? "Nhập đáp án tiếng Anh..." : "Gõ cụm từ còn thiếu..."}
          value={answer}
        />
      )}

      {result ? (
        <div
          className={
            result === "CORRECT"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4"
              : "rounded-xl border border-rose-200 bg-rose-50 p-4"
          }
        >
          <p className={`font-bold text-sm ${result === "CORRECT" ? "text-emerald-700" : "text-rose-700"}`}>
            {result === "CORRECT" ? "Chính xác ✓" : "Chưa đúng rồi"}
          </p>
          <p className="mt-2 text-xs text-slate-600">Đáp án chuẩn:</p>
          <p className="mt-0.5 text-lg font-bold text-slate-950 font-sans">{item.answerText}</p>
        </div>
      ) : (
        <Button
          className="w-full rounded-xl font-bold"
          disabled={!answer.trim() || isChecking}
          onClick={checkAnswer}
          size="lg"
        >
          {isChecking ? "Đang kiểm tra..." : "Kiểm tra đáp án"}
        </Button>
      )}

      {result ? (
        <Button
          className="w-full rounded-xl font-bold"
          onClick={() => onNext(result === "CORRECT", answer)}
          size="lg"
        >
          Câu tiếp theo →
        </Button>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function VocabularyUpgradeTable({
  upgrades,
}: {
  upgrades: NonNullable<TranslationEvaluation["vocabularyUpgrades"]>;
}) {
  if (!upgrades || upgrades.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-heading text-sm sm:text-base font-bold text-slate-900 leading-snug">
          Bảng đối chiếu từ vựng nâng cấp{" "}
          <span className="text-xs sm:text-sm font-normal text-slate-500 font-sans">
            (Dành cho viết luận/IELTS)
          </span>
        </h4>
        <span className="rounded-full bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-bold shrink-0">
          {upgrades.length} từ vựng
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200/80 bg-white">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-700">
              <th className="py-2.5 px-4 font-bold w-1/3 sm:w-1/4">Từ bạn dùng</th>
              <th className="py-2.5 px-4 font-bold">Từ nâng cấp thay thế</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {upgrades.map((item, index) => (
              <tr
                key={`${item.originalWord}-${index}`}
                className="hover:bg-slate-50/40 transition-colors"
                title={item.reasonVi}
              >
                <td className="py-3 px-4 font-bold text-slate-950 align-middle">
                  <span className="inline-block bg-slate-100 text-slate-800 px-2.5 py-1 rounded font-mono text-xs sm:text-[13px] border border-slate-200/70">
                    {item.originalWord}
                  </span>
                </td>
                <td className="py-3 px-4 italic text-slate-900 align-middle">
                  <div className="flex items-center justify-between gap-3">
                    <span className="leading-relaxed font-medium text-sm sm:text-base">
                      {item.upgradedAlternatives}
                    </span>
                    <div className="flex items-center gap-1 not-italic shrink-0">
                      <PronounceButton text={item.upgradedAlternatives} />
                      <CopyButton text={item.upgradedAlternatives} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TranslationResult({
  evaluation,
  learnerAnswer,
  meaningLabel = "Đúng nghĩa",
  nextLabel = "Tiếp tục",
  onNext,
  onPhraseSaved,
  sourceText,
  sourceLearningItemId,
}: {
  evaluation: TranslationEvaluation;
  learnerAnswer: string;
  meaningLabel?: string;
  nextLabel?: string;
  onNext: () => void;
  onPhraseSaved?: (item: LearningItemView) => void;
  sourceText?: string;
  sourceLearningItemId?: string;
}) {
  const tier = getScoreTier(evaluation.score);
  const patternInfo = parsePatternTip(evaluation.patternTipVi);

  // Keyboard shortcut listener: Enter to continue
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext]);

  const scoreCards = [
    [meaningLabel, evaluation.meaningScore],
    ["Ngữ pháp", evaluation.grammarScore],
    ["Tự nhiên", evaluation.naturalnessScore],
  ] as const;

  const hasError =
    evaluation.score < 70 ||
    evaluation.meaningScore < 70 ||
    evaluation.grammarScore < 70 ||
    Boolean(evaluation.grammarIssues && evaluation.grammarIssues.length > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-start animate-in fade-in-50 duration-300" aria-live="polite">
      {/* Panel 1: Left 5 cols (Assessment & Actions, sticky on desktop) */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5 lg:sticky lg:top-4">
        {sourceText ? (
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Đề bài gốc
            </span>
            <p className="text-slate-800 font-medium text-sm leading-relaxed">
              &ldquo;{sourceText}&rdquo;
            </p>
          </div>
        ) : null}

        {/* Score Row */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 flex items-center gap-3.5">
          <div className="flex flex-col items-center justify-center rounded-xl bg-white border border-slate-200 px-3.5 py-2 min-w-[4.8rem] shadow-2xs shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Điểm số
            </span>
            <p className={`font-mono text-3xl font-black leading-none mt-1 ${tier.scoreClass}`}>
              {evaluation.score}
            </p>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">/ 100</span>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${tier.badgeClass}`}>
                {tier.tier}
              </span>
              <span className="text-xs font-semibold text-slate-600 truncate">
                {tier.title}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-700 leading-relaxed pt-0.5">
              {evaluation.feedbackVi}
            </p>
          </div>
        </div>

        {/* 3 Metric Rows */}
        <div className="space-y-2.5 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Đánh giá chi tiết
          </span>
          <div className="space-y-2">
            {scoreCards.map(([label, score]) => (
              <MetricRow key={label} label={label} score={score} />
            ))}
          </div>
        </div>

        {/* Grammar & Vocabulary Issues (if any) */}
        {evaluation.grammarIssues && evaluation.grammarIssues.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-rose-700">
              <HugeiconsIcon icon={AlertCircleIcon} size={15} />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Điểm cần sửa ({evaluation.grammarIssues.length})
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {evaluation.grammarIssues.map((issue, index) => (
                <div
                  className="rounded-lg bg-rose-50/60 p-2.5 text-xs space-y-1 border border-rose-100/80"
                  key={`${issue.sourceQuote}-${index}`}
                >
                  <div className="flex items-center gap-1.5 flex-wrap font-medium">
                    <span className="line-through decoration-rose-400 text-rose-700 text-xs">
                      {issue.sourceQuote}
                    </span>
                    <span className="text-slate-400 text-xs">→</span>
                    <span className="font-semibold text-emerald-700 text-xs">
                      {issue.correction}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {issue.explanationVi}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions: Always visible on desktop without scrolling! */}
        <div className="pt-2 space-y-2 border-t border-slate-100">
          <div className="flex gap-2">
            <Button
              onClick={onNext}
              size="lg"
              className="w-full rounded-xl font-bold h-11 text-sm gap-2 shadow-sm"
            >
              <span>{nextLabel}</span>
              <kbd className="hidden sm:inline-block rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-mono leading-none">
                ↵
              </kbd>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </Button>
          </div>

          <div className="text-center">
            {hasError ? (
              <p className="text-xs text-amber-700 flex items-center justify-center gap-1.5 font-medium">
                <HugeiconsIcon icon={RefreshIcon} size={13} />
                <span>Câu này sẽ xuất hiện lại sau khi hết vòng để bạn ôn lại</span>
              </p>
            ) : (
              <p className="text-xs text-emerald-700 flex items-center justify-center gap-1.5 font-medium">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                <span>Tuyệt vời! Đã hoàn thành câu này.</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Panel 2: Right 7 cols (Sentences & Template Material) */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        {/* Full width stacked answers: Learner Answer -> Optimal B2 Answer */}
        <AnswerCard
          label="Bản viết của bạn"
          text={learnerAnswer}
          variant="learner"
          showActions={false}
        />

        <AnswerCard
          label="Bản sửa tối ưu"
          onPhraseSaved={onPhraseSaved}
          sourceLearningItemId={sourceLearningItemId}
          text={evaluation.correctedTranslation}
          variant="corrected"
        />

        {/* B2 Natural Upgrade */}
        {evaluation.upgradedTranslation && evaluation.upgradedTranslation !== evaluation.correctedTranslation && (
          <AnswerCard
            label="Gợi ý cách viết B2 tự nhiên hơn"
            onPhraseSaved={onPhraseSaved}
            sourceLearningItemId={sourceLearningItemId}
            text={evaluation.upgradedTranslation}
            variant="upgrade"
          />
        )}

        {/* Vocabulary Upgrades Comparison Table (For Essay/IELTS) */}
        {evaluation.vocabularyUpgrades && evaluation.vocabularyUpgrades.length > 0 && (
          <VocabularyUpgradeTable upgrades={evaluation.vocabularyUpgrades} />
        )}

        {/* Template Pattern Formula & Practical Example */}
        {evaluation.patternTipVi && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-900">
                <HugeiconsIcon icon={Idea01Icon} size={16} className="text-amber-700" />
                <span className="text-xs font-bold tracking-wider uppercase">Cấu trúc template cốt lõi</span>
              </div>
              <CopyButton text={patternInfo.pattern} />
            </div>

            <div className="rounded-lg border border-amber-200/70 bg-white p-3.5 space-y-2">
              <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                {patternInfo.tokens.map((token, i) => {
                  if (token.startsWith("[") && token.endsWith("]")) {
                    return (
                      <span
                        key={i}
                        className="inline-block mx-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-xs font-bold border border-amber-300/80"
                      >
                        {token}
                      </span>
                    );
                  }
                  return <span key={i}>{token}</span>;
                })}
              </div>

              {patternInfo.explanation && (
                <p className="text-xs text-amber-950/80 leading-relaxed border-t border-amber-100 pt-2">
                  💡 {patternInfo.explanation}
                </p>
              )}
            </div>

            {evaluation.paraphraseExampleEn && (
              <div className="rounded-lg border border-amber-200/60 bg-white/80 p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Ví dụ áp dụng thực tế
                  </span>
                  <div className="flex items-center gap-1">
                    <PronounceButton text={evaluation.paraphraseExampleEn} />
                    <CopyButton text={evaluation.paraphraseExampleEn} />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {evaluation.paraphraseExampleEn}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const answerCardStyles = {
  learner: {
    card: "border-slate-200/80 bg-slate-50/70",
    label: "text-slate-600 font-bold",
    badge: "bg-slate-200/80 text-slate-700 border-slate-300",
    status: "Bản của bạn",
  },
  corrected: {
    card: "border-emerald-200/90 bg-emerald-50/40",
    label: "text-emerald-900 font-bold",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    status: "Bản sửa tối ưu ✓",
  },
  upgrade: {
    card: "border-sky-200/80 bg-sky-50/30",
    label: "text-sky-900 font-bold",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
    status: "B2 Nâng cao",
  },
} as const;

function AnswerCard({
  label,
  text,
  variant,
  onPhraseSaved,
  sourceLearningItemId,
  showActions = true,
}: {
  label: string;
  text: string;
  variant: keyof typeof answerCardStyles;
  onPhraseSaved?: (item: LearningItemView) => void;
  sourceLearningItemId?: string;
  showActions?: boolean;
}) {
  const styles = answerCardStyles[variant];
  const [selectedPhrase, setSelectedPhrase] = useState("");
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED" | "ERROR">("IDLE");

  function captureSelection() {
    if (!onPhraseSaved || !sourceLearningItemId) return;
    const selection = window.getSelection();
    const phrase = selection?.toString().trim() ?? "";
    if (phrase.length >= 2 && phrase.length <= 80) {
      setSelectedPhrase(phrase);
    }
  }

  async function savePhrase() {
    if (!selectedPhrase || !sourceLearningItemId || !onPhraseSaved || saveStatus === "SAVING") return;
    setSaveStatus("SAVING");

    try {
      const response = await fetch("/api/learning-items/phrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLearningItemId,
          phrase: selectedPhrase,
          contextText: text,
        }),
      });

      if (!response.ok) {
        setSaveStatus("ERROR");
        return;
      }

      const payload = (await response.json()) as { data: LearningItemView };
      onPhraseSaved(payload.data);
      setSaveStatus("SAVED");
    } catch {
      setSaveStatus("ERROR");
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all ${styles.card}`}
      onMouseUp={captureSelection}
    >
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold tracking-wider uppercase ${styles.label}`}>
            {label}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles.badge}`}>
            {styles.status}
          </span>
        </div>
        {showActions && (
          <div className="flex items-center gap-1">
            <PronounceButton text={text} />
            <CopyButton text={text} />
          </div>
        )}
      </div>

      <p className="cursor-text select-text whitespace-pre-wrap text-base sm:text-[17px] font-medium leading-relaxed text-slate-900">
        {text}
      </p>

      {selectedPhrase && onPhraseSaved ? (
        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-sky-200 bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between text-xs shadow-2xs">
          <p className="min-w-0 text-slate-700">
            Đã chọn: <strong className="text-primary font-medium">&ldquo;{selectedPhrase}&rdquo;</strong>
          </p>
          <Button
            className="shrink-0 rounded-lg text-xs h-7"
            disabled={saveStatus === "SAVING" || saveStatus === "SAVED"}
            onClick={savePhrase}
            size="sm"
            type="button"
          >
            {saveStatus === "SAVING"
              ? "Đang lưu..."
              : saveStatus === "SAVED"
                ? "Đã lưu ✓"
                : "+ Lưu vào Quick Quiz"}
          </Button>
        </div>
      ) : onPhraseSaved ? (
        <p className="mt-2 text-[11px] text-muted-foreground/80">
          💡 Mẹo: Bôi đen một cụm từ trong câu để lưu nhanh vào bộ từ vựng Quick Quiz.
        </p>
      ) : null}
    </div>
  );
}
