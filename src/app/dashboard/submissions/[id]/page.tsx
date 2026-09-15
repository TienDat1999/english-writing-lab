import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppBrand } from "@/components/app-brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ResourceNotFoundError } from "@/server/http/errors";
import { getSubmissionDetail } from "@/server/submissions/submission.service";

import { StatusPoller } from "./status-poller";
import { SaveLearningButton } from "./save-learning-button";

const categoryLabels = {
  TASK_RESPONSE: "Task response",
  COHERENCE: "Coherence",
  LEXICAL: "Vocabulary",
  GRAMMAR: "Grammar",
  SPELLING: "Spelling",
  PUNCTUATION: "Punctuation",
} as const;

const severityStyles = {
  HIGH: "border-red-300 bg-red-50 text-red-800",
  MEDIUM: "border-amber-300 bg-amber-50 text-amber-800",
  LOW: "border-blue-300 bg-blue-50 text-blue-800",
} as const;

const criteriaLabels = {
  taskResponse: "Task Response",
  logicReasoning: "Logic & Reasoning",
  realismPersuasiveness: "Realism & Persuasiveness",
  ideaDevelopment: "Idea Development",
  vocabularyGrammar: "Vocabulary & Grammar",
  nativeLikeWriting: "Native-like Writing",
} as const;

type SubmissionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  let submission: Awaited<ReturnType<typeof getSubmissionDetail>>;

  try {
    submission = await getSubmissionDetail(session.user.id, id);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      notFound();
    }

    throw error;
  }

  const isProcessing =
    submission.status === "QUEUED" || submission.status === "ANALYZING";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StatusPoller submissionId={submission.id} status={submission.status} />

      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <AppBrand />
          <Button asChild variant="ghost">
            <Link href="/dashboard">← Dashboard</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="prep-hero prep-grid relative mb-10 flex flex-col justify-between gap-6 overflow-hidden rounded-[2.25rem] px-7 py-10 text-white shadow-[0_24px_60px_rgb(20_84_205/20%)] sm:px-10 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge className="border-white/20 bg-white/10 text-white" variant="outline">
                {submission.taskType === "TASK_1" ? "Academic Task 1" : "Task 2"}
              </Badge>
              <Badge className="border-white/20 bg-white/10 text-white" variant="outline">{submission.questionType}</Badge>
              <Badge className="border-white/20 bg-white/10 text-white" variant="outline">{submission.wordCount} words</Badge>
            </div>
            <h1 className="max-w-3xl font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {submission.analysis
                ? "Your feedback is ready."
                : "Your essay is in the writing room."}
            </h1>
          </div>
          <Button asChild className="bg-white font-bold text-primary hover:bg-blue-50" variant="outline">
            <Link href="/dashboard/new">Write another essay</Link>
          </Button>
        </div>

        {isProcessing ? (
          <Card className="border-accent/25 bg-card/90 py-12">
            <CardContent className="mx-auto max-w-2xl text-center">
              <div className="mx-auto mb-6 size-12 animate-pulse rounded-full border-[10px] border-secondary border-t-accent" />
              <CardTitle className="font-heading text-3xl">
                {submission.status === "QUEUED"
                  ? "Waiting for the analysis worker"
                  : "Reading your essay carefully"}
              </CardTitle>
              <CardDescription className="mt-3 text-base leading-7">
                This page refreshes automatically. You can leave and return from your dashboard at any time.
              </CardDescription>
            </CardContent>
          </Card>
        ) : null}

        {submission.status === "FAILED" ? (
          <Card className="border-red-200 bg-red-50/70 py-10">
            <CardContent>
              <Badge className="mb-4 border-red-300 bg-white text-red-800" variant="outline">
                Analysis failed
              </Badge>
              <CardTitle className="font-heading text-3xl">Your essay is safe.</CardTitle>
              <CardDescription className="mt-3 max-w-2xl text-base leading-7 text-red-800">
                The analysis service could not finish this attempt. Retry support is the next reliability step; no essay text was lost.
              </CardDescription>
            </CardContent>
          </Card>
        ) : null}

        {submission.analysis ? (
          <div className="space-y-8">
            <section className="grid gap-5 lg:grid-cols-[0.35fr_1fr]">
              <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                  <CardDescription className="text-primary-foreground/65">Estimated band</CardDescription>
                  <CardTitle className="font-heading text-7xl">
                    {submission.analysis.estimatedOverallBand ?? "—"}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-card/90">
                <CardHeader>
                  <Badge className="mb-3" variant="secondary">Overview</Badge>
                  <CardTitle className="font-heading text-3xl">Điểm mấu chốt</CardTitle>
                  <CardDescription className="pt-2 text-base leading-8 text-foreground/75">
                    {submission.analysis.summaryVi}
                  </CardDescription>
                </CardHeader>
              </Card>
            </section>

            {submission.analysis.strengths.length > 0 ? (
              <Card className="bg-secondary/55">
                <CardHeader>
                  <CardTitle className="font-heading text-3xl">What already works</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {submission.analysis.strengths.map((strength) => (
                    <div className="rounded-xl bg-card/70 px-4 py-3 leading-7" key={strength}>
                      {strength}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <section>
              <Badge variant="outline">Detailed assessment</Badge>
              <h2 className="mt-4 font-heading text-4xl tracking-tight">Chấm theo 6 tiêu chí</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {Object.entries(criteriaLabels).map(([key, label]) => (
                  <Card className="bg-card/90" key={key}>
                    <CardHeader>
                      <CardTitle className="font-heading text-2xl">{label}</CardTitle>
                      <CardDescription className="pt-2 text-base leading-7 text-foreground/75">
                        {submission.analysis?.criteriaFeedback[
                          key as keyof typeof criteriaLabels
                        ] || "Chưa có đánh giá cho tiêu chí này."}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </section>

            {submission.analysis.structuralWeaknesses.length > 0 ? (
              <Card className="border-amber-200 bg-amber-50/65">
                <CardHeader>
                  <Badge className="mb-3 w-fit" variant="outline">Structure first</Badge>
                  <CardTitle className="font-heading text-3xl">Điểm yếu về cấu trúc và lập luận</CardTitle>
                  <CardDescription>
                    Những chỗ đang liệt kê ý, thiếu giải thích hoặc chưa tạo được chuỗi lập luận thuyết phục.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {submission.analysis.structuralWeaknesses.map((weakness, index) => (
                    <div className="flex gap-3 rounded-xl bg-white/70 px-4 py-3 leading-7" key={weakness}>
                      <span className="font-heading text-xl text-amber-700">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p>{weakness}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {submission.analysis.rewrittenEssay ? (
              <section>
                <Badge variant="secondary">2+2 · P.E.E.R · B2</Badge>
                <h2 className="mt-4 font-heading text-4xl tracking-tight">Bài viết được tối ưu</h2>
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <Card className="bg-card/90">
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className="font-heading text-2xl">English rewrite</CardTitle>
                        <SaveLearningButton
                          label="Lưu blueprint bài"
                          sourceType="ESSAY_BLUEPRINT"
                          submissionId={submission.id}
                        />
                      </div>
                      <CardDescription>Khoảng 250–280 từ, lập luận chặt và tự nhiên ở trình độ B2.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-lg leading-8">
                        {submission.analysis.rewrittenEssay}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-secondary/45">
                    <CardHeader>
                      <CardTitle className="font-heading text-2xl">Bản dịch tiếng Việt</CardTitle>
                      <CardDescription>Dịch theo ý nghĩa của bản viết lại.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-base leading-8">
                        {submission.analysis.rewrittenEssayVi}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>
            ) : null}

            {submission.analysis.vocabularyUpgrades.length > 0 ? (
              <section>
                <Badge variant="outline">Vocabulary upgrade</Badge>
                <h2 className="mt-4 font-heading text-4xl tracking-tight">Nâng cấp cách diễn đạt</h2>
                <Card className="mt-6 overflow-hidden bg-card/90">
                  <CardContent className="overflow-x-auto p-0">
                    <table className="w-full min-w-[720px] text-left">
                      <thead className="bg-secondary/65 text-sm">
                        <tr>
                          <th className="px-5 py-4 font-semibold">Cách viết ban đầu</th>
                          <th className="px-5 py-4 font-semibold">Cách viết B2 tự nhiên hơn</th>
                          <th className="px-5 py-4 font-semibold">Nghĩa tiếng Việt</th>
                          <th className="px-5 py-4 font-semibold">Ôn tập</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {submission.analysis.vocabularyUpgrades.map((upgrade, index) => (
                          <tr key={`${upgrade.originalExpression}-${upgrade.upgradedExpression}`}>
                            <td className="px-5 py-4 align-top">{upgrade.originalExpression}</td>
                            <td className="px-5 py-4 align-top font-medium text-accent">{upgrade.upgradedExpression}</td>
                            <td className="px-5 py-4 align-top text-muted-foreground">{upgrade.meaningVi}</td>
                            <td className="px-5 py-4 align-top">
                              <SaveLearningButton
                                sourceIndex={index}
                                sourceType="VOCABULARY"
                                submissionId={submission.id}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </section>
            ) : null}

            {submission.analysis.grammarCorrections.length > 0 ? (
              <section>
                <Badge variant="outline">Major grammar fixes</Badge>
                <h2 className="mt-4 font-heading text-4xl tracking-tight">Các lỗi ngữ pháp lớn</h2>
                <Card className="mt-6 overflow-hidden bg-card/90">
                  <CardContent className="overflow-x-auto p-0">
                    <table className="w-full min-w-[920px] text-left">
                      <thead className="bg-secondary/65 text-sm">
                        <tr>
                          <th className="px-5 py-4 font-semibold">Câu lỗi</th>
                          <th className="px-5 py-4 font-semibold">Câu sửa</th>
                          <th className="px-5 py-4 font-semibold">Dịch câu sửa</th>
                          <th className="px-5 py-4 font-semibold">Giải thích</th>
                          <th className="px-5 py-4 font-semibold">Ôn tập</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {submission.analysis.grammarCorrections.map((correction, index) => (
                          <tr key={`${correction.sourceQuote}-${correction.correctionText}`}>
                            <td className="px-5 py-4 align-top text-red-700">{correction.sourceQuote}</td>
                            <td className="px-5 py-4 align-top font-medium">{correction.correctionText}</td>
                            <td className="px-5 py-4 align-top text-muted-foreground">{correction.correctionVi}</td>
                            <td className="px-5 py-4 align-top text-muted-foreground">{correction.explanationVi}</td>
                            <td className="px-5 py-4 align-top">
                              <SaveLearningButton
                                sourceIndex={index}
                                sourceType="GRAMMAR"
                                submissionId={submission.id}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </section>
            ) : null}

            <section>
              <Badge variant="outline">Priority corrections</Badge>
              <h2 className="mt-4 font-heading text-4xl tracking-tight">Fix these first</h2>
              <div className="mt-6 grid gap-5">
                {submission.analysis.issues.length === 0 ? (
                  <Card>
                    <CardContent className="py-6 text-muted-foreground">
                      No grounded correction was returned for this essay.
                    </CardContent>
                  </Card>
                ) : (
                  submission.analysis.issues.map((issue, index) => (
                    <Card className="bg-card/90" key={issue.id}>
                      <CardHeader className="border-b">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-heading text-2xl text-accent">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <Badge variant="secondary">{categoryLabels[issue.category]}</Badge>
                            <span className="text-xs text-muted-foreground">{issue.subcategory}</span>
                          </div>
                          <Badge className={severityStyles[issue.severity]} variant="outline">
                            {issue.severity.toLowerCase()} impact
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-6 pt-1 lg:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Original</p>
                          <blockquote className="mt-3 border-l-4 border-highlight pl-4 font-heading text-xl leading-8">
                            {issue.sourceQuote}
                          </blockquote>
                          <p className="mt-4 leading-7 text-muted-foreground">{issue.explanationVi}</p>
                        </div>
                        <div className="space-y-4">
                          <div className="rounded-2xl bg-secondary/60 p-4">
                            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Correction</p>
                            <p className="mt-2 font-heading text-xl leading-8">{issue.correctionText}</p>
                          </div>
                          {issue.upgradeText ? (
                            <div className="rounded-2xl bg-accent/10 p-4">
                              <p className="text-xs font-semibold tracking-wider text-accent uppercase">Optional upgrade</p>
                              <p className="mt-2 font-heading text-xl leading-8">{issue.upgradeText}</p>
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}

        <Separator className="my-10" />

        <details className="rounded-2xl bg-card/65 p-5 ring-1 ring-foreground/10">
          <summary className="cursor-pointer font-semibold">View original prompt and essay</summary>
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Prompt</p>
              <p className="mt-2 whitespace-pre-wrap leading-7">
                {submission.promptText || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Original essay</p>
              <p className="mt-2 whitespace-pre-wrap text-lg leading-8">{submission.originalText}</p>
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}
