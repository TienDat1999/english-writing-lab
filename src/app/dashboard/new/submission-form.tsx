"use client";

import {
  AlertCircleIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Edit02Icon,
  HelpCircleIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const questionTypeOptions = {
  TASK_1: [
    { value: "Line graph", label: "Biểu đồ đường (Line graph)" },
    { value: "Bar chart", label: "Biểu đồ cột (Bar chart)" },
    { value: "Pie chart", label: "Biểu đồ tròn (Pie chart)" },
    { value: "Table", label: "Bảng số liệu (Table)" },
    { value: "Map", label: "Bản đồ thay đổi (Map)" },
    { value: "Process", label: "Quy trình sản xuất / tự nhiên (Process)" },
    { value: "Mixed charts", label: "Biểu đồ kết hợp (Mixed charts)" },
  ],
  TASK_2: [
    { value: "Opinion essay", label: "Quan điểm cá nhân (Agree / Disagree)" },
    { value: "Discussion essay", label: "Thảo luận 2 mặt (Discuss both views)" },
    { value: "Advantages and disadvantages", label: "Ưu điểm & Nhược điểm (Advantages / Disadvantages)" },
    { value: "Problem and solution", label: "Nguyên nhân & Giải pháp (Causes & Solutions)" },
    { value: "Two-part question", label: "Câu hỏi 2 phần (Two-part question)" },
  ],
} as const;

type TaskType = keyof typeof questionTypeOptions;

type ApiError = {
  error?: string;
  fields?: Record<string, string[] | undefined>;
};

function countWords(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function getErrorMessage(payload: ApiError) {
  const fieldMessage = payload.fields
    ? Object.values(payload.fields).flat().find(Boolean)
    : undefined;

  if (fieldMessage) {
    return fieldMessage;
  }

  if (payload.error === "UNAUTHORIZED") {
    return "Phiên đăng nhập đã hết hạn. Bạn vui lòng đăng nhập lại.";
  }

  return "Không thể nộp bài viết lúc này. Bạn vui lòng thử lại nhé.";
}

export function SubmissionForm() {
  const router = useRouter();
  const [taskType, setTaskType] = useState<TaskType>("TASK_2");
  const [questionType, setQuestionType] = useState<string>(questionTypeOptions.TASK_2[0].value);
  const [targetBand, setTargetBand] = useState("7");
  const [promptText, setPromptText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wordCount = useMemo(() => countWords(originalText), [originalText]);
  const recommendedWords = taskType === "TASK_1" ? 150 : 250;
  const canSubmit = wordCount >= 50;
  const wordPercent = Math.min(100, Math.round((wordCount / recommendedWords) * 100));

  function changeTaskType(value: TaskType) {
    setTaskType(value);
    setQuestionType(questionTypeOptions[value][0].value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType,
          questionType,
          promptText,
          originalText,
          targetBand: Number(targetBand),
        }),
      });
      const payload = (await response.json()) as ApiError & {
        data?: { id: string };
      };

      if (!response.ok || !payload.data) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        setError(getErrorMessage(payload));
        return;
      }

      router.push(`/dashboard/submissions/${payload.data.id}`);
    } catch {
      setError("Mất kết nối với máy chủ. Bài viết của Bạn chưa được nộp thành công.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Cấu hình dạng bài & Mục tiêu */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-foreground">
              <HugeiconsIcon icon={Target01Icon} size={20} className="text-primary" />
              <CardTitle className="font-heading text-lg font-bold">
                Thông tin bài viết & Mục tiêu
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              Chỉ lưu khi Bạn bấm nộp bài
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 pt-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="task-type" className="text-xs font-semibold text-slate-700">
              Phần thi IELTS
            </Label>
            <Select value={taskType} onValueChange={(value) => changeTaskType(value as TaskType)}>
              <SelectTrigger className="h-11 w-full rounded-xl bg-slate-50/60 text-sm font-semibold shadow-none border-slate-200" id="task-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TASK_1">Academic Task 1 (Biểu đồ / Quy trình)</SelectItem>
                <SelectItem value="TASK_2">IELTS Task 2 (Bài luận văn)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-type" className="text-xs font-semibold text-slate-700">
              Dạng câu hỏi
            </Label>
            <Select value={questionType} onValueChange={setQuestionType}>
              <SelectTrigger className="h-11 w-full rounded-xl bg-slate-50/60 text-sm font-semibold shadow-none border-slate-200" id="question-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionTypeOptions[taskType].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-band" className="text-xs font-semibold text-slate-700">
              Mục tiêu Band điểm
            </Label>
            <Select value={targetBand} onValueChange={setTargetBand}>
              <SelectTrigger className="h-11 w-full rounded-xl bg-slate-50/60 text-sm font-semibold shadow-none border-slate-200" id="target-band">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map(
                  (band) => (
                    <SelectItem key={band} value={band.replace(".0", "")}>
                      Band {band}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Đề bài IELTS (Prompt) */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Label htmlFor="prompt" className="font-heading text-lg font-bold text-foreground">
                Đề bài IELTS (Prompt)
              </Label>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Nhập đầy đủ đề bài để AI đối chiếu và chấm chính xác tiêu chí <strong>Task Response</strong> (Mức độ hoàn thành đề) và tính logic của luận điểm.
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {promptText.length} / 3.000 ký tự
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            className="bg-slate-50/60 text-sm leading-relaxed focus-visible:bg-white rounded-xl border-slate-200"
            id="prompt"
            maxLength={3000}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder={
              taskType === "TASK_1"
                ? "The graph below shows the proportion of... Summarise the information by selecting and reporting the main features..."
                : "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?"
            }
            rows={4}
            value={promptText}
          />
          {!promptText.trim() && (
            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5">
              <HugeiconsIcon icon={HelpCircleIcon} size={14} />
              <span>Khuyến nghị Bạn nhập đề bài để bài làm được chấm 4 tiêu chí trọn vẹn nhất.</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Nội dung bài viết của Bạn */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Edit02Icon} size={18} className="text-primary" />
                <Label htmlFor="essay" className="font-heading text-lg font-bold text-foreground">
                  Nội dung bài làm của Bạn
                </Label>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Viết tự nhiên nhất có thể. Hệ thống sẽ lưu giữ nguyên bản bài làm này để so sánh với các bản sửa.
              </p>
            </div>

            {/* Word count status */}
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  wordCount >= recommendedWords
                    ? "success"
                    : wordCount >= 50
                      ? "secondary"
                      : "outline"
                }
                className="font-mono text-xs px-2.5 py-1"
              >
                {wordCount} / {recommendedWords} từ khuyến nghị
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all duration-300 ${
                wordCount >= recommendedWords ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${wordPercent}%` }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[22rem] resize-y bg-slate-50/60 text-base leading-8 focus-visible:bg-white rounded-xl border-slate-200"
            id="essay"
            maxLength={10000}
            onChange={(event) => setOriginalText(event.target.value)}
            placeholder={
              taskType === "TASK_1"
                ? "The given line graph illustrates...\nOverall, it is evident that...\nIn detail, the figure for..."
                : "It is widely argued that...\nOn the one hand, proponents claim that...\nOn the other hand, it is true that...\nIn conclusion, while there are valid arguments on both sides..."
            }
            value={originalText}
          />

          {/* Feedback alerts on word count */}
          {wordCount > 0 && wordCount < 50 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
              <span>Bài viết cần có tối thiểu 50 từ để thuật toán AI có đủ ngữ cảnh đánh giá chính xác.</span>
            </div>
          )}

          {wordCount >= 50 && wordCount < recommendedWords && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
              <HugeiconsIcon icon={HelpCircleIcon} size={16} className="shrink-0" />
              <span>
                Bài viết hiện có {wordCount} từ (dưới mức khuyến nghị {recommendedWords} từ). Trong kỳ thi thật, điều này có thể bị trừ điểm tiêu chí Task Response. Bạn vẫn có thể nộp bài để nhận phân tích sớm.
              </span>
            </div>
          )}

          {wordCount >= recommendedWords && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0" />
              <span>Độ dài bài viết đạt chuẩn khuyến nghị của IELTS ({wordCount} từ). Sẵn sàng gửi chấm!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {/* Form Action Footer */}
      <div className="flex flex-col-reverse items-stretch justify-between gap-4 pt-2 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {wordCount < 50
            ? "Cần tối thiểu 50 từ để bắt đầu nộp bài."
            : "Bài làm sẽ được đưa vào hàng đợi phân tích AI ngay sau khi nộp."}
        </p>
        <Button
          className="h-12 rounded-xl px-8 text-base font-bold shadow-sm"
          disabled={!canSubmit || isSubmitting}
          size="lg"
          type="submit"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Đang chấm bài bằng AI (khoảng 20-30s)...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span>Gửi bài để AI phân tích</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
