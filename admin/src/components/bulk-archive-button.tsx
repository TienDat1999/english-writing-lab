"use client";

import { Archive02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function BulkArchiveButton() {
  return (
    <button
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#8b352e] px-5 text-sm font-bold text-white"
      onClick={(event) => {
        if (!window.confirm("Archive các bài học đã chọn? Người đang học vẫn được tiếp tục theo policy hiện tại.")) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} />
      Archive đã chọn
    </button>
  );
}
