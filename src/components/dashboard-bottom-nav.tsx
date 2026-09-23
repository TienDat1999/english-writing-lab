"use client";

import {
  BarChartIcon,
  BookOpen01Icon,
  DashboardCircleIcon,
  Edit02Icon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileNavItems = [
  { href: "/dashboard", label: "Tổng quan", icon: DashboardCircleIcon, exact: true },
  { href: "/dashboard/new", label: "Viết bài", icon: Edit02Icon, exact: false },
  { href: "/dashboard/learning", label: "Học", icon: BookOpen01Icon, exact: false },
  { href: "/dashboard/review", label: "Ôn tập", icon: RepeatIcon, exact: false },
];

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng di động"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-xl md:hidden"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 transition-colors ${
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
              href={item.href}
              key={item.href}
            >
              <HugeiconsIcon icon={item.icon} size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
