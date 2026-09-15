import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppBrand } from "@/components/app-brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getLearningStats,
  listLearningItems,
  listUploadedQuizTopics,
  syncLearningItemsFromCompletedSubmissions,
} from "@/server/learning/learning.service";

import { LearningLibrary } from "./learning-library";

export default async function LearningPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  await syncLearningItemsFromCompletedSubmissions(session.user.id);

  const [items, uploadedTopics, stats] = await Promise.all([
    listLearningItems(session.user.id, 1, 6),
    Promise.all([
      listUploadedQuizTopics(session.user.id, "PARAPHRASE", 1, 6),
      listUploadedQuizTopics(session.user.id, "SYNONYM", 1, 6),
    ]),
    getLearningStats(session.user.id),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <AppBrand />
          <Button asChild variant="ghost"><Link href="/dashboard">← Dashboard</Link></Button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="prep-hero prep-grid relative overflow-hidden rounded-[2.25rem] px-7 py-10 text-white shadow-[0_24px_60px_rgb(20_84_205/20%)] sm:px-10 md:flex md:items-end md:justify-between md:gap-6">
          <div>
            <Badge className="mb-5 border-white/20 bg-white/10 text-white" variant="outline">Personal memory</Badge>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Learning library</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-blue-100">
              Những mẫu câu và lỗi đáng nhớ được lấy trực tiếp từ bài viết của mày.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3 md:mt-0 md:justify-end">
            <Button asChild className="h-12 border-white/30 bg-white/10 px-6 font-bold text-white hover:bg-white/20" size="lg" variant="outline">
              <Link href="/dashboard/learning/import">Upload bộ quiz</Link>
            </Button>
            <Button asChild className="h-12 border-amber-300 bg-amber-300 px-6 font-bold text-blue-950 hover:bg-amber-200" size="lg" variant="outline">
              <Link href="/dashboard/review?mode=quick">Quick Quiz · {stats.quick}</Link>
            </Button>
            <Button asChild className="h-12 bg-white px-6 font-bold text-primary hover:bg-blue-50" size="lg" variant="outline">
              <Link href="/dashboard/review">Ôn {stats.due} nội dung đến hạn →</Link>
            </Button>
          </div>
        </section>

        <section className="my-10 grid gap-4 sm:grid-cols-3">
          <div className="prep-shadow rounded-3xl border-t-4 border-t-primary bg-card p-6"><p className="text-sm text-muted-foreground">Đã lưu</p><p className="mt-2 font-heading text-4xl font-extrabold">{stats.total}</p></div>
          <div className="prep-shadow rounded-3xl border-t-4 border-t-amber-400 bg-card p-6"><p className="text-sm text-muted-foreground">Đến hạn hôm nay</p><p className="mt-2 font-heading text-4xl font-extrabold">{stats.due}</p></div>
          <div className="prep-shadow rounded-3xl border-t-4 border-t-emerald-400 bg-card p-6"><p className="text-sm text-muted-foreground">Đã thành thạo</p><p className="mt-2 font-heading text-4xl font-extrabold">{stats.mastered}</p></div>
        </section>

        <LearningLibrary
          initialItems={items}
          initialUploadedTopics={{
            PARAPHRASE: uploadedTopics[0],
            SYNONYM: uploadedTopics[1],
          }}
        />
      </div>
    </main>
  );
}
