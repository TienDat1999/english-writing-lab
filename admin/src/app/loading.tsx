export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="flex items-center gap-4 text-sm font-semibold text-[var(--ink-soft)]">
        <span className="size-3 animate-pulse rounded-full bg-[var(--amber)]" />
        Đang mở không gian quản trị…
      </div>
    </main>
  );
}
