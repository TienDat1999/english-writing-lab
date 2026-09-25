"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function PageTransitionLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const prevRouteRef = useRef(`${pathname}?${searchParams.toString()}`);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop loading when route changes
  useEffect(() => {
    const currentRoute = `${pathname}?${searchParams.toString()}`;
    if (currentRoute !== prevRouteRef.current) {
      prevRouteRef.current = currentRoute;

      // Complete the progress bar
      setProgress(100);
      setIsNavigating(false);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 250);
    }
  }, [pathname, searchParams]);

  // Start progress animation
  function startTransition() {
    if (timerRef.current) clearTimeout(timerRef.current);

    setIsVisible(true);
    setIsNavigating(true);
    setProgress(20);

    // Stagger progress steps
    timerRef.current = setTimeout(() => {
      setProgress(45);
      timerRef.current = setTimeout(() => {
        setProgress(70);
        timerRef.current = setTimeout(() => {
          setProgress(85);
        }, 600);
      }, 300);
    }, 150);

    // Safety timeout: automatically reset after 8 seconds if hanging
    const safetyTimeout = setTimeout(() => {
      setIsVisible(false);
      setIsNavigating(false);
      setProgress(0);
    }, 8000);

    return () => clearTimeout(safetyTimeout);
  }

  // Intercept click on links and back/forward navigation
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external, target blank, download, or modifier keys
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        // Ignore external hosts
        if (url.origin !== window.location.origin) return;

        // If clicking the current exact URL, ignore
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }

        startTransition();
      } catch {
        // Ignore malformed URLs
      }
    }

    function handlePopState() {
      startTransition();
    }

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!isVisible && !isNavigating) {
    return null;
  }

  return (
    <>
      {/* 1. Thanh progress bar phát sáng trên đỉnh màn hình */}
      <div
        className="fixed top-0 left-0 right-0 z-[99999] h-[3px] pointer-events-none overflow-hidden transition-opacity duration-200"
        style={{ opacity: isVisible ? 1 : 0 }}
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-primary shadow-[0_0_12px_rgba(59,130,246,0.6)] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 2. Thẻ pill loading nổi bật lơ lửng ngay phía trên giao diện */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none transition-all duration-300 ease-out ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-2 scale-95"
        }`}
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-xl backdrop-blur-md ring-1 ring-slate-900/5">
          <span className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Đang chuyển trang...</span>
        </div>
      </div>

      {/* 3. Lớp phủ mờ nhẹ tinh tế không chặn nội dung bên dưới */}
      <div
        className={`fixed inset-0 z-[99998] pointer-events-none bg-slate-900/[0.04] backdrop-blur-[0.5px] transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
    </>
  );
}

export function PageTransitionLoader() {
  return (
    <Suspense fallback={null}>
      <PageTransitionLoaderInner />
    </Suspense>
  );
}
