import Link from "next/link";

import { cn } from "cn";

export function AppBrand({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link
      className={cn(
        "inline-flex items-center gap-2.5 font-heading text-xl font-extrabold tracking-[-0.04em]",
        inverted ? "text-white" : "text-foreground",
        className,
      )}
      href="/"
    >
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-[linear-gradient(145deg,#ffcc3e,#ff9f2f)] text-base font-black text-[#15326c] shadow-[0_6px_16px_rgb(255_184_46/30%)]">
        D
        <span className="absolute -right-1 -top-1 size-3 rounded-full bg-[#69e3be]" />
      </span>
      <span>Draftwise</span>
    </Link>
  );
}
