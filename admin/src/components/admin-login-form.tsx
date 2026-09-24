"use client";

import {
  AlertCircleIcon,
  ArrowRight01Icon,
  LockPasswordIcon,
  UserAccountIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="admin-username">
          Tên đăng nhập
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <HugeiconsIcon icon={UserAccountIcon} size={19} strokeWidth={2} />
          </span>
          <input
            autoComplete="username"
            autoFocus
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-[var(--navy-bright)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10"
            id="admin-username"
            maxLength={64}
            name="username"
            placeholder="Nhập username nhân sự"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="admin-password">
          Mật khẩu
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <HugeiconsIcon icon={LockPasswordIcon} size={19} strokeWidth={2} />
          </span>
          <input
            autoComplete="current-password"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-[var(--navy-bright)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10"
            id="admin-password"
            maxLength={256}
            name="password"
            placeholder="••••••••••••"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            type="button"
          >
            <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 px-3.5 py-2.5 text-sm font-medium text-rose-800" role="alert">
          <HugeiconsIcon className="shrink-0 text-rose-600" icon={AlertCircleIcon} size={18} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      <button
        className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#102e72] via-[#143a8f] to-[#1959c7] px-5 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition-all hover:brightness-110 hover:shadow-lg hover:shadow-blue-900/30 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <>
            <svg className="size-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
            </svg>
            <span>Đang xác thực…</span>
          </>
        ) : (
          <>
            <span>Đăng nhập hệ thống</span>
            <HugeiconsIcon className="transition-transform group-hover:translate-x-0.5" icon={ArrowRight01Icon} size={18} strokeWidth={2.2} />
          </>
        )}
      </button>
    </form>
  );
}
