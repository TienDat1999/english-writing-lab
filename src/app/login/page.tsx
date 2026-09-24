import {
  Analytics01Icon,
  Bookmark01Icon,
  CheckmarkCircle02Icon,
  Shield01Icon,
  SparklesIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { AppBrand } from "@/components/app-brand";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative grid min-h-screen w-full overflow-hidden bg-[#f8fafc] lg:grid-cols-[1.15fr_0.85fr] xl:grid-cols-[1.2fr_0.8fr]">
      {/* Left Column: IELTS Writing Journey Showcase */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#091a3e_0%,#0f2862_45%,#0369a1_100%)] p-10 text-white lg:flex xl:p-14">
        {/* Ambient glow backgrounds */}
        <div className="pointer-events-none absolute -left-40 -top-40 size-[36rem] rounded-full bg-sky-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 size-[40rem] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <AppBrand inverted />
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-semibold text-emerald-300">IELTS Writing AI Assistant</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-200 backdrop-blur-sm">
            <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2.5} />
            <span>Personalised Writing Engine</span>
          </div>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.18] tracking-tight text-white xl:text-5xl">
            Mỗi lỗi sai hôm nay là một kỹ năng mới ngày mai.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-100/85">
            Chấm bài tức thì theo 4 tiêu chí IELTS, phân tích lỗi lặp ngữ pháp - từ vựng và tự động xây dựng sổ tay lỗi sai cho riêng bạn.
          </p>

          {/* Feature Highlights */}
          <div className="mt-8 grid max-w-xl gap-3">
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition-colors hover:bg-white/[0.07]">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/20 text-sky-300">
                <HugeiconsIcon icon={Target01Icon} size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Chấm bài chuẩn 4 tiêu chí Band Descriptors</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-200/70">
                  Phân tích chi tiết Task Achievement, Coherence & Cohesion, Lexical Resource và Grammar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition-colors hover:bg-white/[0.07]">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <HugeiconsIcon icon={Bookmark01Icon} size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sổ tay lỗi sai cá nhân hoá (Mistake Bank)</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-200/70">
                  Ghi nhớ các cấu trúc bạn hay sai để gợi ý bài tập ôn luyện có chủ đích.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition-colors hover:bg-white/[0.07]">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-300">
                <HugeiconsIcon icon={Analytics01Icon} size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Theo dõi tiến độ nâng Band theo thời gian</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-200/70">
                  Biểu đồ trực quan hoá tốc độ viết, độ đa dạng từ vựng và sự cải thiện qua từng bài luận.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-blue-200/60">
          <span>Draftwise · IELTS Writing Prep Platform</span>
          <span>Phiên bản thử nghiệm</span>
        </div>
      </section>

      {/* Right Column: Learner Login Portal */}
      <section className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-12 xl:px-16">
        {/* Subtle dot pattern background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
        <div className="pointer-events-none absolute -top-24 right-0 size-80 rounded-full bg-sky-100/40 blur-3xl" />

        {/* Mobile brand header (shown only when left hero is hidden) */}
        <div className="relative z-10 mb-6 lg:hidden">
          <AppBrand />
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-[430px] rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
              <span className="size-1.5 rounded-full bg-sky-500 animate-pulse" />
              Private Beta
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
              <HugeiconsIcon className="text-slate-400" icon={Shield01Icon} size={14} strokeWidth={2} />
              Bảo mật 100%
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[26px]">
            Tiếp tục lộ trình của bạn
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Đăng nhập để lưu trữ bài viết, theo dõi tiến độ nâng band và truy cập sổ tay lỗi sai cá nhân.
          </p>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
            className="mt-6"
          >
            <button
              className="group relative flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-[15px] font-semibold text-slate-800 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/10"
              type="submit"
            >
              <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>
          </form>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-500">
            <HugeiconsIcon className="mt-0.5 shrink-0 text-emerald-600" icon={CheckmarkCircle02Icon} size={15} strokeWidth={2.5} />
            <p className="leading-relaxed">
              Chỉ sử dụng thông tin cơ bản từ Google. Toàn bộ bài luận và lỗi sai của bạn được lưu riêng tư 100%.
            </p>
          </div>
        </div>

        <p className="relative z-10 mt-6 text-center text-xs text-slate-400">
          Bằng việc đăng nhập, bạn đồng ý với{" "}
          <span className="cursor-pointer font-medium text-slate-600 underline">Điều khoản dịch vụ</span> &{" "}
          <span className="cursor-pointer font-medium text-slate-600 underline">Chính sách bảo mật</span>.
        </p>
      </section>
    </main>
  );
}
