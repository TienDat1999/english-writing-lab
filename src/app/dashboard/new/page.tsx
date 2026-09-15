import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppBrand } from "@/components/app-brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { SubmissionForm } from "./submission-form";

export default async function NewSubmissionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <AppBrand />
          <Button asChild variant="ghost">
            <Link href="/dashboard">← Dashboard</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="prep-hero prep-grid relative mb-10 overflow-hidden rounded-[2.25rem] px-7 py-10 text-white shadow-[0_24px_60px_rgb(20_84_205/20%)] sm:px-10">
          <Badge className="mb-5 border-white/20 bg-white/10 text-white" variant="outline">
            New submission
          </Badge>
          <h1 className="max-w-3xl font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Give us the real essay, not the polished version.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-blue-100">
            The useful patterns live in your natural writing. You can review every suggestion before saving it to memory.
          </p>
        </section>

        <SubmissionForm />
      </div>
    </main>
  );
}
