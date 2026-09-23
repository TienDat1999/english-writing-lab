import { DraftwiseBrand } from "@draftwise/ui";
import { Shield01Icon } from "@hugeicons/core-free-icons";
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
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[var(--navy)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <DraftwiseBrand inverted suffix="Admin" />
        <div className="relative z-10 max-w-2xl pb-10">
          <p className="admin-kicker text-[var(--amber)]">Content control room</p>
          <h1 className="mt-5 text-6xl font-extrabold leading-[1.05] tracking-[-0.055em]">
            Chất lượng bài học bắt đầu từ một quy trình rõ ràng.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
            Soạn nội dung, review độc lập và kiểm soát publication trong cùng một workspace.
          </p>
        </div>
        <div className="absolute -bottom-48 -right-36 size-[34rem] rounded-full border-[110px] border-white/5" />
      </section>
      <section className="grid place-items-center px-5 py-12 sm:px-10">
        <div className="admin-panel w-full max-w-lg p-7 sm:p-10">
          <DraftwiseBrand suffix="Admin" />
          <div className="mt-10 grid size-12 place-items-center rounded-2xl bg-[#e7edf8] text-[var(--navy)]">
            <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} />
          </div>
          <p className="admin-kicker mt-7 text-[var(--navy-bright)]">Staff only</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.045em]">Đăng nhập quản trị</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
            Dùng tài khoản nhân sự riêng đã được cấp quyền. Tài khoản learner không thể đăng nhập vào khu vực Admin.
          </p>
          <AdminLoginForm />
          <p className="mt-5 text-center text-xs leading-5 text-[var(--ink-soft)]">
            Không chia sẻ tài khoản. Mọi thao tác nội dung đều gắn với danh tính staff đã đăng nhập.
          </p>
        </div>
      </section>
    </main>
  );
}
