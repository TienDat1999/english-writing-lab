import Link from "next/link";

import { AppBrand } from "@/components/app-brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  ["01", "Write", "Nộp bài IELTS thật của bạn."],
  ["02", "Understand", "Hiểu lỗi nào đang kéo band xuống."],
  ["03", "Remember", "Lưu mẫu câu vào lịch ôn cá nhân."],
  ["04", "Transfer", "Dùng lại đúng trong bài tiếp theo."],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="prep-hero prep-grid relative min-h-[760px] overflow-hidden text-white lg:min-h-[820px]">
        <div className="absolute -left-28 top-52 size-72 rounded-full border-[55px] border-white/5" />
        <div className="absolute -right-20 bottom-10 size-96 rounded-full bg-cyan-300/10 blur-2xl" />

        <header className="relative z-20 mx-auto flex h-24 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="rounded-2xl bg-white px-4 py-2.5 shadow-xl shadow-blue-950/15">
            <AppBrand />
          </div>
          <nav className="hidden items-center gap-8 rounded-full bg-white/95 px-7 py-3 text-sm font-semibold text-[#33466f] shadow-xl shadow-blue-950/15 md:flex">
            <a href="#method">Cách hoạt động</a>
            <a href="#features">Tính năng</a>
            <Link href="/dashboard/learning">Ôn tập</Link>
          </nav>
          <Button asChild className="h-11 bg-white px-6 text-primary shadow-xl hover:bg-blue-50" variant="outline">
            <Link href="/login">Bắt đầu</Link>
          </Button>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
          <div className="text-center lg:text-left">
            <Badge className="mb-7 border-white/20 bg-white/12 px-4 py-2 text-white" variant="outline">
              IELTS Writing Coach có trí nhớ
            </Badge>
            <h1 className="mx-auto max-w-[11ch] font-heading text-6xl font-extrabold leading-[0.98] tracking-[-0.065em] sm:text-7xl lg:mx-0 lg:text-[6rem]">
              Viết tốt hơn sau mỗi bài.
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-blue-100 sm:text-xl lg:mx-0">
              AI chấm bài, giải thích bằng tiếng Việt và biến chính lỗi sai của bạn thành một lộ trình ôn tập cá nhân hóa.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Button asChild className="h-14 bg-white px-8 text-base font-bold text-primary shadow-[0_14px_35px_rgb(8_35_100/28%)] hover:bg-blue-50" size="lg" variant="outline">
                <Link href="/login">Chấm bài đầu tiên →</Link>
              </Button>
              <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 text-sm text-blue-50 backdrop-blur">
                <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" />
                Feedback trong vài phút
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl pb-12 pt-8">
            <div className="absolute left-0 top-2 grid size-20 -rotate-12 place-items-center rounded-[2rem] bg-[#ffd44f] text-3xl shadow-2xl">✦</div>
            <div className="absolute right-2 top-0 grid size-16 rotate-12 place-items-center rounded-full bg-[#6ee7bd] text-2xl font-black text-[#15326c] shadow-2xl">A+</div>
            <Card className="relative ml-auto w-[92%] border-white/60 bg-white p-2 text-foreground shadow-[0_35px_80px_rgb(5_35_110/35%)] ring-8 ring-white/10 sm:w-[88%]">
              <CardContent className="space-y-5 p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-50 text-primary">Task 2 · Opinion</Badge>
                  <span className="text-sm font-bold text-emerald-600">Band 6.5 → 7.0</span>
                </div>
                <div className="rounded-2xl bg-[#f4f7ff] p-5">
                  <p className="text-sm font-semibold text-muted-foreground">Câu của bạn</p>
                  <p className="mt-2 text-lg font-semibold leading-7">Plastic waste has many harmful effects marine animals.</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary"><span className="grid size-7 place-items-center rounded-lg bg-primary text-white">✓</span> Sửa tự nhiên hơn</div>
                  <p className="mt-3 text-lg font-bold leading-7 text-[#15326c]">Plastic waste has many harmful effects on marine animals.</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Nhớ cấu trúc: <strong>have an effect on + noun</strong></p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#fff7d6] p-4"><p className="text-xs font-semibold text-amber-700">MẪU CÂU ĐÃ LƯU</p><p className="mt-1 text-3xl font-black text-amber-900">10</p></div>
                  <div className="rounded-2xl bg-[#e8fbf4] p-4"><p className="text-xs font-semibold text-emerald-700">ĐẾN HẠN ÔN</p><p className="mt-1 text-3xl font-black text-emerald-900">4</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28" id="method">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-5 bg-secondary text-primary">Lộ trình thông minh</Badge>
          <h2 className="font-heading text-4xl font-extrabold leading-tight sm:text-5xl">Một vòng học khép kín, không để feedback bị lãng quên</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">Mỗi bài viết tạo ra dữ liệu riêng để lần luyện tiếp theo đúng vào điểm bạn đang yếu.</p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(([number, title, description], index) => (
            <article className="prep-shadow relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-7" key={number}>
              <div className={`mb-10 grid size-12 place-items-center rounded-2xl text-sm font-black ${index === 0 ? "bg-blue-100 text-blue-700" : index === 1 ? "bg-amber-100 text-amber-700" : index === 2 ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`}>{number}</div>
              <h3 className="font-heading text-2xl font-extrabold">{title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8" id="features">
        <div className="prep-hero relative overflow-hidden rounded-[2.5rem] px-7 py-14 text-white shadow-[0_28px_70px_rgb(20_84_205/22%)] sm:px-12 lg:px-16">
          <div className="absolute right-8 top-8 size-36 rounded-full border-[28px] border-white/8" />
          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <Badge className="mb-5 border-white/20 bg-white/10 text-white" variant="outline">Your personal writing memory</Badge>
              <h2 className="max-w-2xl font-heading text-4xl font-extrabold leading-tight sm:text-5xl">Đừng chỉ đọc đáp án. Hãy biến nó thành kỹ năng của bạn.</h2>
            </div>
            <Button asChild className="h-14 shrink-0 bg-white px-8 font-bold text-primary hover:bg-blue-50" variant="outline"><Link href="/login">Học ngay →</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}
