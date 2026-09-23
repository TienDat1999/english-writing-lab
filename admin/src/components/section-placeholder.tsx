import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function SectionPlaceholder({
  nextStep,
  title,
}: {
  nextStep: string;
  title: string;
}) {
  return (
    <section className="admin-panel admin-enter mt-8 overflow-hidden">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_16rem] lg:items-end">
        <div>
          <span className="inline-flex rounded-full bg-[#e5efe8] px-3 py-1 text-xs font-bold text-[#276147]">
            Shell đã sẵn sàng
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
            Khu vực này đã có route, phân quyền và navigation. Chưa hiển thị dữ liệu giả;
            chức năng thật sẽ được nối ở phase CMS tiếp theo.
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--navy)] p-5 text-white">
          <p className="admin-kicker text-[var(--amber)]">Bước tiếp theo</p>
          <p className="mt-3 text-sm font-semibold leading-6">{nextStep}</p>
          <HugeiconsIcon className="mt-4" icon={ArrowRight01Icon} strokeWidth={2} />
        </div>
      </div>
    </section>
  );
}
