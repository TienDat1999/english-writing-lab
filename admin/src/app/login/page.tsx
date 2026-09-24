import { DraftwiseBrand } from "@draftwise/ui";
import {
  AlertCircleIcon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Layers01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAuthorizationSnapshot } from "@/server/authorization";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    const authorization = await getAuthorizationSnapshot(session.user.id);
    redirect(authorization.canAccessAdmin ? "/" : "/access-denied");
  }

  return (
    <main className="relative grid min-h-screen w-full bg-[#f8fafc] lg:grid-cols-[1.15fr_0.85fr] xl:grid-cols-[1.2fr_0.8fr]">
      {/* Left Column: Academic Brand & Operations Showcase */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,#071738_0%,#0c2763_45%,#133f97_100%)] p-10 text-white lg:flex xl:p-14">
        {/* Ambient glow backgrounds */}
        <div className="pointer-events-none absolute -left-40 -top-40 size-[36rem] rounded-full bg-blue-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 size-[40rem] rounded-full bg-indigo-500/15 blur-[140px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <DraftwiseBrand inverted suffix="Admin" />
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-300">Hệ thống đang hoạt động</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-200 backdrop-blur-sm">
            <HugeiconsIcon icon={Layers01Icon} size={14} strokeWidth={2.5} />
            <span>Academic Content Control Room</span>
          </div>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.18] tracking-tight text-white xl:text-5xl">
            Chất lượng bài học bắt đầu từ quy trình chuẩn hoá.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-100/80">
            Không gian làm việc tập trung: Soạn thảo nội dung IELTS Writing, thẩm định đa tầng độc lập và quản lý xuất bản bảo mật.
          </p>

          {/* Feature Highlights */}
          <div className="mt-8 grid max-w-xl gap-3">
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition-colors hover:bg-white/[0.07]">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-500/20 text-blue-300">
                <HugeiconsIcon icon={BookOpen01Icon} size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Biên tập bài học chuẩn khung IELTS</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-200/70">
                  Hỗ trợ Task 1 & 2, Outline phân tích, Vocabulary bank và bài mẫu phân tầng Band 6.0 – 8.5+.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition-colors hover:bg-white/[0.07]">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-300">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Quy trình duyệt độc lập 2 tầng</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-200/70">
                  Thẩm định khắt khe tính sư phạm và độ chính xác học thuật trước khi xuất bản tới học viên.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition-colors hover:bg-white/[0.07]">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <HugeiconsIcon icon={Shield01Icon} size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Bảo mật & Giám sát phiên bản</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-200/70">
                  Lưu trữ toàn bộ audit log, lịch sử sửa đổi và khả năng rollback tức thời khi cần thiết.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-blue-200/60">
          <span>Draftwise Academic Workspace · v2.4</span>
          <span>Bảo mật dữ liệu nội bộ</span>
        </div>
      </section>

      {/* Right Column: Staff Login Form */}
      <section className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-12 xl:px-16">
        {/* Subtle dot pattern background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
        <div className="pointer-events-none absolute -top-24 right-0 size-80 rounded-full bg-blue-100/40 blur-3xl" />

        {/* Mobile brand header (shown only when left hero is hidden) */}
        <div className="relative z-10 mb-6 lg:hidden">
          <DraftwiseBrand suffix="Admin" />
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-[430px] rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50 to-indigo-50 text-[var(--navy-bright)] shadow-xs">
              <HugeiconsIcon icon={Shield01Icon} size={22} strokeWidth={2} />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--navy-bright)]">
              <span className="size-1.5 rounded-full bg-[var(--navy-bright)]" />
              Staff Portal
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[26px]">
            Đăng nhập quản trị
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Dành riêng cho nhân sự vận hành và biên tập học thuật được cấp quyền truy cập.
          </p>

          <AdminLoginForm />

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-500">
            <HugeiconsIcon className="mt-0.5 shrink-0 text-slate-400" icon={AlertCircleIcon} size={15} strokeWidth={2} />
            <p className="leading-relaxed">
              Tự động tạm khóa 15 phút sau 5 lần nhập sai. Mọi thao tác nội dung đều được gắn với danh tính staff.
            </p>
          </div>
        </div>

        <p className="relative z-10 mt-6 text-center text-xs text-slate-400">
          Cần hỗ trợ truy cập? Liên hệ <span className="font-semibold text-slate-600">quản trị viên hệ thống</span>.
        </p>
      </section>
    </main>
  );
}
