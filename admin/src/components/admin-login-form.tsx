"use client";

import { LockPasswordIcon, UserAccountIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirect: false,
      });
      if (result?.error) {
        setError("Tên đăng nhập hoặc mật khẩu không đúng.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Không thể đăng nhập lúc này. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={submit}>
      <label className="block text-sm font-bold">
        Tên đăng nhập
        <span className="relative mt-2 block">
          <HugeiconsIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" icon={UserAccountIcon} size={20} strokeWidth={2} />
          <input autoComplete="username" autoFocus className="h-13 w-full rounded-2xl border border-[var(--line)] bg-white pl-12 pr-4 text-sm outline-none transition focus:border-[var(--navy-bright)] focus:ring-4 focus:ring-[#1959c714]" maxLength={64} name="username" placeholder="admin" required />
        </span>
      </label>
      <label className="block text-sm font-bold">
        Mật khẩu
        <span className="relative mt-2 block">
          <HugeiconsIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" icon={LockPasswordIcon} size={20} strokeWidth={2} />
          <input autoComplete="current-password" className="h-13 w-full rounded-2xl border border-[var(--line)] bg-white pl-12 pr-4 text-sm outline-none transition focus:border-[var(--navy-bright)] focus:ring-4 focus:ring-[#1959c714]" maxLength={256} name="password" placeholder="Nhập mật khẩu" required type="password" />
        </span>
      </label>
      {error && <p className="rounded-xl border border-[#e9c5bb] bg-[#fff0ec] px-4 py-3 text-sm font-semibold text-[#8b352e]" role="alert">{error}</p>}
      <button className="flex h-13 w-full items-center justify-center rounded-2xl bg-[var(--navy)] px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
      <p className="text-center text-xs leading-5 text-[var(--ink-soft)]">Sau 5 lần nhập sai, tài khoản sẽ bị khóa tạm trong 15 phút.</p>
    </form>
  );
}
