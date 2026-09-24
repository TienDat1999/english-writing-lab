"use client";

import { useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";

type DeleteSubmissionButtonProps = {
  submissionId: string;
};

export function DeleteSubmissionButton({
  submissionId,
}: DeleteSubmissionButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Xóa bài viết thất bại. Vui lòng thử lại!");
      }
    } catch {
      alert("Đã xảy ra sự cố kết nối khi xóa bài viết.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      title="Xóa bài viết"
      aria-label="Xóa bài viết"
      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 focus:outline-hidden group-hover:opacity-100 disabled:pointer-events-none"
    >
      {isDeleting ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
      ) : (
        <HugeiconsIcon icon={Delete02Icon} size={15} />
      )}
    </button>
  );
}
