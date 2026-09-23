"use client";

import {
  type ContentLocale,
  type CreateLessonDraftInput,
  getLessonPublishValidationIssues,
} from "@draftwise/content";
import { LessonExperiencePreview } from "@draftwise/ui";
import {
  Cancel01Icon,
  ComputerIcon,
  SmartPhone01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState } from "react";

export function LessonPreviewDialog({
  value,
  versionLabel,
}: {
  value: CreateLessonDraftInput;
  versionLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<ContentLocale>(value.defaultLocale);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const issues = useMemo(() => getLessonPublishValidationIssues(value), [value]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <>
      <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-[var(--navy)]" onClick={() => setOpen(true)} type="button">
        <HugeiconsIcon icon={ViewIcon} size={19} strokeWidth={2} />
        Xem trước
        {issues.length > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-[#f7ded8] px-1.5 py-0.5 text-[10px] text-[#8b352e]">{issues.length}</span>}
      </button>

      {open && (
        <div aria-label="Xem trước bài học" aria-modal="true" className="fixed inset-0 z-50 grid bg-[#081631db] p-4 backdrop-blur-sm" role="dialog">
          <div className="mx-auto flex h-full w-full max-w-[96rem] flex-col overflow-hidden rounded-[24px] border border-white/15 bg-[#e9e5db] shadow-2xl">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d2ccbf] bg-[#fffdf8] px-5 py-4">
              <div>
                <p className="admin-kicker text-[var(--navy-bright)]">Learner preview</p>
                <p className="mt-1 text-sm font-extrabold">{versionLabel} · dữ liệu đang có trong editor</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl border border-[var(--line)] bg-[#f3f0e8] p-1">
                  {(["vi", "en"] as const).map((item) => <button className={`h-9 rounded-lg px-3 text-xs font-extrabold ${locale === item ? "bg-white text-[var(--navy)] shadow-sm" : "text-[var(--ink-soft)]"}`} key={item} onClick={() => setLocale(item)} type="button">{item.toUpperCase()}</button>)}
                </div>
                <div className="flex rounded-xl border border-[var(--line)] bg-[#f3f0e8] p-1">
                  <button aria-label="Desktop" className={`grid size-9 place-items-center rounded-lg ${viewport === "desktop" ? "bg-white text-[var(--navy)] shadow-sm" : "text-[var(--ink-soft)]"}`} onClick={() => setViewport("desktop")} type="button"><HugeiconsIcon icon={ComputerIcon} size={18} /></button>
                  <button aria-label="Mobile" className={`grid size-9 place-items-center rounded-lg ${viewport === "mobile" ? "bg-white text-[var(--navy)] shadow-sm" : "text-[var(--ink-soft)]"}`} onClick={() => setViewport("mobile")} type="button"><HugeiconsIcon icon={SmartPhone01Icon} size={18} /></button>
                </div>
                <button aria-label="Đóng preview" className="grid size-11 place-items-center rounded-xl bg-[var(--navy)] text-white" onClick={() => setOpen(false)} type="button"><HugeiconsIcon icon={Cancel01Icon} size={20} /></button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
              <div className="overflow-auto rounded-2xl bg-[#d7d2c7] p-4">
                <div className={`mx-auto transition-[max-width] duration-300 ${viewport === "mobile" ? "max-w-[390px]" : "max-w-[1180px]"}`}>
                  <LessonExperiencePreview locale={locale} value={value} versionLabel={versionLabel} />
                </div>
              </div>
              <aside className="overflow-auto rounded-2xl border border-[var(--line)] bg-[#fffdf8] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold">Kiểm tra trước review</p>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${issues.length === 0 ? "bg-[#dff2e7] text-[#236143]" : "bg-[#f7ded8] text-[#8b352e]"}`}>{issues.length === 0 ? "Sẵn sàng" : `${issues.length} lỗi`}</span>
                </div>
                {issues.length === 0 ? (
                  <p className="mt-4 text-xs leading-6 text-[var(--ink-soft)]">Draft đáp ứng validation publish-ready hiện tại. Review độc lập vẫn cần thực hiện trước khi publish.</p>
                ) : (
                  <ol className="mt-4 grid gap-3 text-xs leading-5 text-[#6f3c35]">
                    {issues.map((issue, index) => <li className="rounded-xl bg-[#fff0ec] p-3" key={issue}><strong className="mr-1">{index + 1}.</strong>{issue}</li>)}
                  </ol>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
