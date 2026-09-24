"use client";

import {
  BarChartIcon,
  BookOpen01Icon,
  DashboardCircleIcon,
  Edit02Icon,
  Layers01Icon,
  Logout01Icon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

import { AppBrand } from "@/components/app-brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: DashboardCircleIcon, exact: true },
  { href: "/dashboard/new", label: "Viết bài", icon: Edit02Icon, exact: false },
  { href: "/dashboard/learning", label: "Học", icon: BookOpen01Icon, exact: false },
  { href: "/dashboard/review", label: "Ôn tập", icon: RepeatIcon, exact: false },
  { href: "/lessons", label: "Kho bài học", icon: Layers01Icon, exact: false },
];

export function DashboardHeader({
  user,
  signOutAction,
}: {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  signOutAction?: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ?.split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "B";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <AppBrand />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {(user
              ? navItems
              : [
                  { href: "/lessons", label: "Kho bài học", icon: Layers01Icon, exact: false },
                  { href: "/dashboard/learning", label: "Học & Ôn tập", icon: BookOpen01Icon, exact: false },
                  { href: "/dashboard/new", label: "Viết bài", icon: Edit02Icon, exact: false },
                ]
            ).map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-slate-100/80 hover:text-foreground font-medium"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <HugeiconsIcon icon={item.icon} size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Avatar & Menu or Login Button */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              aria-expanded={dropdownOpen}
              aria-label="Menu tài khoản"
              className="flex items-center gap-2.5 rounded-full p-1 transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-primary/40"
              onClick={() => setDropdownOpen((prev) => !prev)}
              type="button"
            >
              <Avatar className="size-9 border border-border">
                <AvatarImage alt={user.name ?? ""} src={user.image ?? undefined} />
                <AvatarFallback className="bg-primary/10 font-bold text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-xs font-semibold text-foreground max-w-[120px] truncate">
                {user.name?.split(" ").slice(-1)[0] ?? "Bạn"}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-white p-2 shadow-xl animate-in fade-in-0 zoom-in-95">
                <div className="border-b border-border px-3 py-2.5">
                  <p className="text-xs font-bold text-foreground truncate">{user.name ?? "Học viên"}</p>
                  {user.email && (
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  )}
                </div>

                <div className="py-1">
                  <Link
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-slate-50 transition-colors"
                    href="/lessons"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <HugeiconsIcon icon={Layers01Icon} size={16} />
                    Kho bài học
                  </Link>
                  <Link
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-slate-50 transition-colors"
                    href="/dashboard/learning"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <HugeiconsIcon icon={BookOpen01Icon} size={16} />
                    Thư viện của tôi
                  </Link>
                  <Link
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-slate-50 transition-colors"
                    href="/dashboard#progress"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <HugeiconsIcon icon={BarChartIcon} size={16} />
                    Tiến độ học tập
                  </Link>
                </div>

                {signOutAction && (
                  <div className="border-t border-border pt-1">
                    <form action={signOutAction}>
                      <button
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        type="submit"
                      >
                        <HugeiconsIcon icon={Logout01Icon} size={16} />
                        Đăng xuất
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
