import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { AppBrand } from "@/components/app-brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getLearningStats } from "@/server/learning/learning.service";
import { listSubmissions } from "@/server/submissions/submission.service";

const statusStyles = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  QUEUED: "border-amber-300 bg-amber-50 text-amber-800",
  ANALYZING: "border-blue-300 bg-blue-50 text-blue-800",
  COMPLETED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  FAILED: "border-red-300 bg-red-50 text-red-800",
} as const;

const statusLabels = {
  DRAFT: "Draft",
  QUEUED: "Queued",
  ANALYZING: "Analyzing",
  COMPLETED: "Completed",
  FAILED: "Needs retry",
} as const;

type DashboardPageProps = {
  searchParams: Promise<{ submitted?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [submissions, learningStats, query] = await Promise.all([
    listSubmissions(session.user.id),
    getLearningStats(session.user.id),
    searchParams,
  ]);
  const justSubmitted = typeof query.submitted === "string";
  const completedCount = submissions.filter(
    (submission) => submission.status === "COMPLETED",
  ).length;
  const initials = session.user.name
    ?.split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <AppBrand />
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage alt="" src={session.user.image ?? undefined} />
              <AvatarFallback>{initials || "W"}</AvatarFallback>
            </Avatar>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="ghost">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        {justSubmitted ? (
          <div className="mb-8 flex flex-col justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-emerald-900 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold">Essay submitted successfully.</p>
              <p className="mt-1 text-sm text-emerald-800">
                It is safely stored and waiting in the analysis queue.
              </p>
            </div>
            <Badge className="border-emerald-300 bg-white/60 text-emerald-800" variant="outline">
              Queued
            </Badge>
          </div>
        ) : null}

        <section className="prep-hero prep-grid relative overflow-hidden rounded-[2.25rem] px-7 py-10 text-white shadow-[0_24px_60px_rgb(20_84_205/22%)] sm:px-10 lg:flex lg:items-end lg:justify-between lg:gap-8 lg:px-12 lg:py-12">
          <div className="absolute -right-16 -top-20 size-64 rounded-full border-[50px] border-white/8" />
          <div>
            <Badge className="mb-5 border-white/20 bg-white/12 text-white" variant="outline">
              Writing workspace
            </Badge>
            <h1 className="max-w-3xl font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Welcome back, {session.user.name?.split(" ")[0] ?? "Writer"}.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-blue-100">
              Write, understand the pattern, and carry the improvement into your next essay.
            </p>
          </div>
          <div className="relative z-10 mt-8 flex flex-wrap gap-3 lg:mt-0 lg:justify-end">
            <Button asChild className="h-12 bg-white px-6 font-bold text-primary hover:bg-blue-50" size="lg" variant="outline">
              <Link href="/dashboard/new">Write a new essay →</Link>
            </Button>
            <Button asChild className="h-12 border-white/25 bg-white/10 px-6 text-white shadow-none hover:bg-white/20 hover:text-white" size="lg" variant="outline">
              <Link href="/dashboard/learning">Learning library</Link>
            </Button>
            <Button asChild className="h-12 border-amber-300/60 bg-amber-300 px-6 font-bold text-blue-950 hover:bg-amber-200" size="lg" variant="outline">
              <Link href="/dashboard/review?mode=quick">Quick Quiz · {learningStats.quick}</Link>
            </Button>
          </div>
        </section>

        <Separator className="my-10" />

        <section className="grid gap-5 md:grid-cols-3">
          <Card className="border-t-4 border-t-primary">
            <CardHeader>
              <CardDescription>Essays submitted</CardDescription>
              <CardTitle className="font-heading text-4xl">{submissions.length}</CardTitle>
              <CardAction>
                <Badge variant="outline">Latest 30</Badge>
              </CardAction>
            </CardHeader>
          </Card>
          <Card className="border-t-4 border-t-emerald-400">
            <CardHeader>
              <CardDescription>Analyses completed</CardDescription>
              <CardTitle className="font-heading text-4xl">{completedCount}</CardTitle>
              <CardAction>
                <Badge variant="outline">All time</Badge>
              </CardAction>
            </CardHeader>
          </Card>
          <Card className="border-t-4 border-t-amber-400">
            <CardHeader>
              <CardDescription>Learning items due</CardDescription>
              <CardTitle className="font-heading text-4xl">{learningStats.due}</CardTitle>
              <CardAction>
                <Button asChild className="rounded-full" size="sm" variant="outline">
                  <Link href="/dashboard/review">Review now</Link>
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge variant="outline">Submission history</Badge>
              <h2 className="mt-4 font-heading text-4xl tracking-tight">Your recent writing</h2>
            </div>
            {submissions.length > 0 ? (
              <p className="text-sm text-muted-foreground">Newest submission first</p>
            ) : null}
          </div>

          {submissions.length === 0 ? (
            <Card className="border-dashed bg-card/60 py-12">
              <CardContent className="mx-auto flex max-w-xl flex-col items-center text-center">
                <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-secondary font-heading text-2xl">
                  01
                </div>
                <CardTitle className="font-heading text-3xl">Your first essay starts the memory</CardTitle>
                <CardDescription className="mt-3 max-w-md text-base leading-7">
                  Submit a real IELTS response. Draftwise will preserve the original version and prepare it for analysis.
                </CardDescription>
                <Button asChild className="mt-7 rounded-full" size="lg">
                  <Link href="/dashboard/new">Write your first essay</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {submissions.map((submission) => (
                <Link href={`/dashboard/submissions/${submission.id}`} key={submission.id}>
                  <Card className="bg-card/80 py-0 transition-transform hover:-translate-y-0.5 hover:ring-foreground/25">
                    <CardContent className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {submission.taskType === "TASK_1" ? "Academic Task 1" : "Task 2"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {submission.questionType}
                          </span>
                        </div>
                        <p className="font-heading text-xl font-medium">
                          {submission.wordCount} words
                          {submission.estimatedOverallBand !== null
                            ? ` · Estimated band ${submission.estimatedOverallBand}`
                            : ""}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Submitted {new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(submission.submittedAt))}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 sm:justify-end">
                        <Badge
                          className={statusStyles[submission.status]}
                          variant="outline"
                        >
                          {statusLabels[submission.status]}
                        </Badge>
                        <span aria-hidden="true" className="text-muted-foreground">→</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
