import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";

import { SubmissionForm } from "./submission-form";

export default async function NewSubmissionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Compact Page Header */}
      <div className="mb-8">
        <Badge className="mb-2" variant="secondary">
          Không gian luyện viết IELTS
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          Viết bài làm mới
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Hãy nộp bài viết tự nhiên nhất của Bạn. Draftwise sẽ phát hiện các lỗi lặp lại, gợi ý từ vựng nâng cao và đưa vào lịch ôn tập ngắt quãng.
        </p>
      </div>

      <SubmissionForm />
    </div>
  );
}
