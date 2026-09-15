"use client";

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

const questionTypes = {
  TASK_1: [
    "Line graph",
    "Bar chart",
    "Pie chart",
    "Table",
    "Map",
    "Process",
    "Mixed charts",
  ],
  TASK_2: [
    "Opinion essay",
    "Discussion essay",
    "Advantages and disadvantages",
    "Problem and solution",
    "Two-part question",
  ],
} as const;

type TaskType = keyof typeof questionTypes;

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
    return "Your session expired. Please sign in again.";
  }

  return "We could not submit your essay. Please try again.";
}

export function SubmissionForm() {
  const router = useRouter();
  const [taskType, setTaskType] = useState<TaskType>("TASK_2");
  const [questionType, setQuestionType] = useState<string>(questionTypes.TASK_2[0]);
  const [targetBand, setTargetBand] = useState("7");
  const [promptText, setPromptText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wordCount = useMemo(() => countWords(originalText), [originalText]);
  const recommendedWords = taskType === "TASK_1" ? 150 : 250;
  const canSubmit = wordCount >= 50;

  function changeTaskType(value: TaskType) {
    setTaskType(value);
    setQuestionType(questionTypes[value][0]);
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

      router.push(`/dashboard?submitted=${payload.data.id}`);
    } catch {
      setError("The connection was interrupted. Your essay was not submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="border-t-4 border-t-primary bg-card">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="font-heading text-2xl">Essay setup</CardTitle>
            <Badge variant="secondary">Saved only when submitted</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 pt-1 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="task-type">IELTS task</Label>
            <Select value={taskType} onValueChange={(value) => changeTaskType(value as TaskType)}>
              <SelectTrigger className="h-11 w-full" id="task-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TASK_1">Academic Task 1</SelectItem>
                <SelectItem value="TASK_2">Task 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-type">Question type</Label>
            <Select value={questionType} onValueChange={setQuestionType}>
              <SelectTrigger className="h-11 w-full" id="question-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionTypes[taskType].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-band">Target band</Label>
            <Select value={targetBand} onValueChange={setTargetBand}>
              <SelectTrigger className="h-11 w-full" id="target-band">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"].map(
                  (band) => (
                    <SelectItem key={band} value={band}>
                      Band {band}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-t-amber-400 bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Label htmlFor="prompt" className="font-heading text-2xl">
                Question prompt <span className="text-sm font-normal text-muted-foreground">(optional)</span>
              </Label>
              <p className="mt-2 text-sm text-muted-foreground">
                Add the IELTS question for task-specific feedback, or leave it blank.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{promptText.length}/3,000</span>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            className="bg-[#f8faff] focus-visible:bg-white"
            id="prompt"
            maxLength={3000}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder="Some people believe that... To what extent do you agree or disagree?"
            rows={5}
            value={promptText}
          />
        </CardContent>
      </Card>

      <Card className="border-t-4 border-t-emerald-400 bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Label htmlFor="essay" className="font-heading text-2xl">
                Your essay
              </Label>
              <p className="mt-2 text-sm text-muted-foreground">
                Write naturally. Draftwise keeps this version unchanged after submission.
              </p>
            </div>
            <Badge variant={wordCount >= recommendedWords ? "secondary" : "outline"}>
              {wordCount} / {recommendedWords} recommended words
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[24rem] resize-y bg-[#f8faff] text-base leading-8 focus-visible:bg-white"
            id="essay"
            maxLength={10000}
            onChange={(event) => setOriginalText(event.target.value)}
            placeholder="Begin your essay here..."
            value={originalText}
          />
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {wordCount < 50
            ? "Write at least 50 words before submitting."
            : "Ready to enter the analysis queue."}
        </p>
        <Button className="h-12 rounded-full px-7 text-base" disabled={!canSubmit || isSubmitting} size="lg" type="submit">
          {isSubmitting ? "Submitting..." : "Submit for analysis →"}
        </Button>
      </div>
    </form>
  );
}
