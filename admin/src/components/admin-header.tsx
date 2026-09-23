import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { signOut } from "@/auth";

export function AdminHeader({
  user,
}: {
  user: { image?: string | null; name?: string | null };
}) {
  const initials = user.name?.trim().slice(0, 1).toUpperCase() || "D";

  return (
    <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between border-b border-[var(--line)] bg-[rgb(247_244_236/92%)] px-8 backdrop-blur-xl xl:px-10">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--navy-bright)]">Draftwise operations</p>
        <p className="mt-0.5 text-sm font-semibold text-[var(--ink-soft)]">Không gian quản trị nội dung</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold">{user.name ?? "Draftwise staff"}</p>
          <p className="text-xs text-[var(--ink-soft)]">Staff account</p>
        </div>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="size-9 rounded-xl object-cover" src={user.image} />
        ) : (
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--navy)] text-sm font-bold text-white">
            {initials}
          </span>
        )}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            aria-label="Đăng xuất"
            className="grid size-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--paper)] transition-colors hover:border-[var(--danger)] hover:text-[var(--danger)]"
            type="submit"
          >
            <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
          </button>
        </form>
      </div>
    </header>
  );
}
