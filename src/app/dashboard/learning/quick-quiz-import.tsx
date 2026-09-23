"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UploadedQuizType } from "@/server/learning/learning.contract";

type ImportResult = {
  imported: number;
  created: number;
  existing: number;
};

type QuickQuizImportProps = {
  onImported?: () => Promise<void>;
  libraryHref?: string;
};

const errorMessages: Record<string, string> = {
  QUIZ_TYPE_REQUIRED: "Hãy chọn loại quiz trước khi upload.",
  CSV_FILE_REQUIRED: "Hãy chọn một file CSV.",
  CSV_FILE_SIZE: "File phải nhỏ hơn 1 MB và không được để trống.",
  CSV_INVALID_HEADERS: "CSV cần có đúng 4 cột: topic, prompt, answer, context.",
  INVALID_REQUEST: "Một hoặc nhiều dòng chưa đúng định dạng hoặc file có quá 1.000 thẻ.",
};

export function QuickQuizImport({
  onImported,
  libraryHref = "#uploaded-quiz-topics",
}: QuickQuizImportProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [quizType, setQuizType] = useState<UploadedQuizType>("PARAPHRASE");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setError(null);
    setResult(null);
  }

  async function upload() {
    if (!file || isUploading) return;

    setIsUploading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("quizType", quizType);

    try {
      const response = await fetch("/api/learning-items/import", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string; data?: ImportResult };

      if (!response.ok || !payload.data) {
        setError(errorMessages[payload.error ?? ""] ?? "Không thể import file này. Kiểm tra lại nội dung rồi thử lại.");
        return;
      }

      setResult(payload.data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await onImported?.();
      router.refresh();
    } catch {
      setError("Mất kết nối trong lúc upload. Thử lại nhé.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="mb-8 overflow-hidden border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#fffbeb_100%)] shadow-[0_18px_50px_rgb(35_87_170/10%)]">
      <CardHeader className="border-b border-blue-100 px-5 py-6 sm:px-7">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="min-w-0">
            <Badge className="mb-3" variant="secondary">Quick Quiz import</Badge>
            <CardTitle className="font-heading text-2xl sm:text-3xl">Upload bộ câu hỏi của bạn</CardTitle>
            <CardDescription className="mt-3 max-w-2xl text-sm leading-7 sm:text-base">
              Chọn file CSV gồm bốn cột <strong>topic, prompt, answer, context</strong>. Câu hỏi hiển thị bằng tiếng Việt và câu trả lời bằng tiếng Anh.
            </CardDescription>
          </div>
          <Button asChild className="w-fit rounded-full" size="sm" variant="outline">
            <a download href="/quick-quiz-import-template.csv">Tải file mẫu</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-6 sm:px-7">
        <div className="grid gap-5 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-2">
            <Label htmlFor="quiz-type">Loại quiz</Label>
            <Select value={quizType} onValueChange={(value) => setQuizType(value as UploadedQuizType)}>
              <SelectTrigger className="h-12 w-full rounded-2xl bg-white px-4 text-base" id="quiz-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PARAPHRASE">Paraphrase</SelectItem>
                <SelectItem value="SYNONYM">Cặp Synonym</SelectItem>
                <SelectItem value="TEMPLATE">Writing Template</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiz-file">File CSV</Label>
            <Input
              accept=".csv,text/csv"
              className="sr-only"
              id="quiz-file"
              onChange={selectFile}
              ref={inputRef}
              type="file"
            />
            <label
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-input bg-white px-3 py-2 transition-colors hover:border-primary/35 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30"
              htmlFor="quiz-file"
            >
              <span className="shrink-0 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground">
                Chọn file CSV
              </span>
              <span className="min-w-0 truncate text-sm text-muted-foreground">
                {file?.name ?? "Chưa chọn file"}
              </span>
            </label>
          </div>
          <Button className="h-12 rounded-full px-6 md:col-span-2 md:justify-self-end" disabled={!file || isUploading} onClick={upload} type="button">
            {isUploading ? "Đang import..." : "Upload vào Quick Quiz"}
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
        {result ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-emerald-700" role="status">
              Đã đọc {result.imported} thẻ: tạo mới {result.created}, giữ nguyên {result.existing} thẻ đã có.
            </p>
            <Button asChild className="shrink-0 rounded-full" size="sm">
              <Link href={libraryHref}>Xem quiz đã upload →</Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
