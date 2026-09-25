"use client";

import {
  AlertCircleIcon,
  Analytics01Icon,
  BookOpen01Icon,
  DashboardSquare01Icon,
  Image01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", icon: DashboardSquare01Icon, label: "Dashboard" },
  { href: "/analytics", icon: Analytics01Icon, label: "Thống kê" },
  { href: "/lessons", icon: BookOpen01Icon, label: "Kho bài học" },
  { href: "/media", icon: Image01Icon, label: "Media" },
  { href: "/reports", icon: AlertCircleIcon, label: "Báo cáo sự cố" },
  { href: "/settings", icon: Settings01Icon, label: "Cài đặt" },
] as const;

export function AdminNavigation({ visibleHrefs }: { visibleHrefs: string[] }) {
  const pathname = usePathname();
  const visibleItems = items.filter((item) => visibleHrefs.includes(item.href));

  const links = visibleItems.map((item) => {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
          active
            ? "bg-white text-[var(--navy)] shadow-[0_12px_30px_rgb(2_14_43/22%)]"
            : "text-[#c9d8f5] hover:bg-white/9 hover:text-white"
        }`}
        href={item.href}
        key={item.href}
      >
        {active && <span className="absolute -left-1 h-6 w-1 rounded-full bg-[var(--amber)]" />}
        <HugeiconsIcon icon={item.icon} size={20} strokeWidth={2} />
        {item.label}
      </Link>
    );
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col overflow-hidden bg-[linear-gradient(165deg,#153a89_0%,#0d2863_58%,#091d4b_100%)] px-5 py-6 text-white shadow-[18px_0_50px_rgba(12,32,77,.12)]">
      <div className="pointer-events-none absolute -bottom-24 -right-28 size-72 rounded-full border-[64px] border-white/5" />
      <div className="relative flex items-center border-b border-white/12 pb-6">
          <Link className="text-lg font-extrabold tracking-[-0.04em]" href="/">
            Draftwise <span className="text-[var(--amber)]">Admin</span>
          </Link>
      </div>
      <p className="admin-kicker relative mt-7 text-[#9fb9e8]">Content operations</p>
      <nav className="relative mt-3 grid gap-1.5">{links}</nav>
      <div className="relative mt-auto rounded-2xl border border-white/12 bg-white/7 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[var(--mint)] shadow-[0_0_0_4px_rgba(102,216,177,.12)]" />
          <p className="text-xs font-bold text-[var(--mint)]">Private workspace</p>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#b9cae9]">
          Quyền truy cập được kiểm tra lại trên server ở mỗi phiên.
        </p>
      </div>
    </aside>
  );
}
