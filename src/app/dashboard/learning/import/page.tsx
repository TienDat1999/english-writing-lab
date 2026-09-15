import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppBrand } from "@/components/app-brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { QuickQuizImport } from "../quick-quiz-import";

export default async function ImportQuizPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8">
          <AppBrand />
          <Button asChild variant="ghost">
            <Link href="/dashboard/learning">← Learning Library</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="prep-hero prep-grid mb-8 rounded-[2.25rem] px-7 py-10 text-white shadow-[0_24px_60px_rgb(20_84_205/20%)] sm:px-10">
          <Badge className="mb-5 border-white/20 bg-white/10 text-white" variant="outline">
            Quiz importer
          </Badge>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Upload bộ quiz
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-blue-100">
            Chọn loại Paraphrase hoặc Cặp Synonym, sau đó tải file CSV lên. Quiz sẽ được đưa vào đúng nhóm trong Learning Library.
          </p>
        </section>

        <QuickQuizImport libraryHref="/dashboard/learning#uploaded-quiz-topics" />

        <Card className="border-dashed bg-card/65">
          <CardContent className="grid gap-5 p-6 sm:grid-cols-3">
            <div>
              <p className="font-heading text-xl font-bold">1. Chọn loại</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Paraphrase hoặc Cặp Synonym.</p>
            </div>
            <div>
              <p className="font-heading text-xl font-bold">2. Chọn CSV</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">File gồm topic, prompt, answer và context.</p>
            </div>
            <div>
              <p className="font-heading text-xl font-bold">3. Bắt đầu luyện</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Mở chủ đề và nhập đáp án tiếng Anh.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
