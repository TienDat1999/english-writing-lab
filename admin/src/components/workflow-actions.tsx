"use client";

import {
  Alert02Icon,
  Archive02Icon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Comment01Icon,
  Copy01Icon,
  PlayIcon,
  RotateLeft01Icon,
  SentIcon,
  StopIcon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  addReviewCommentAction,
  approveVersionAction,
  archiveLessonAction,
  cancelScheduleAction,
  cancelVersionAction,
  clonePublishedVersionAction,
  publishNowAction,
  resolveCommentAction,
  restoreLessonAction,
  resumeEditingAction,
  rollbackAction,
  scheduleVersionAction,
  submitForReviewAction,
  withdrawLessonAction,
  type ActionResponse,
} from "@/app/(admin)/lessons/[lessonId]/actions";

function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#081631db] p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-[var(--navy)]">{title}</h3>
            {description && <p className="mt-1 text-xs text-[var(--ink-soft)]">{description}</p>}
          </div>
          <button
            aria-label="Đóng"
            className="grid size-8 place-items-center rounded-lg text-[var(--ink-soft)] hover:bg-[#edf0f4]"
            onClick={onClose}
            type="button"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function ErrorBanner({ response }: { response: ActionResponse | null }) {
  if (!response?.error) return null;
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
      <p className="font-bold">{response.error}</p>
      {response.issues && response.issues.length > 0 && (
        <ul className="mt-1 list-disc pl-4 space-y-0.5">
          {response.issues.map((issue, idx) => (
            <li key={idx}>{issue}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Submit for Review
// ---------------------------------------------------------------------------
export function SubmitReviewButton({
  lessonId,
  versionId,
}: {
  lessonId: string;
  versionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [res, setRes] = useState<ActionResponse | null>(null);

  const handleSubmit = () => {
    startTransition(async () => {
      const response = await submitForReviewAction(lessonId, versionId);
      if (response.success) {
        setOpen(false);
      } else {
        setRes(response);
      }
    });
  };

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-xs font-bold text-white shadow hover:opacity-95"
        onClick={() => {
          setRes(null);
          setOpen(true);
        }}
        type="button"
      >
        <HugeiconsIcon icon={SentIcon} size={16} />
        Gửi review
      </button>

      {open && (
        <Modal
          description="Khóa bản nháp và chuyển sang trạng thái In Review để Reviewer kiểm tra."
          onClose={() => setOpen(false)}
          title="Gửi bản nháp lên review"
        >
          <ErrorBanner response={res} />
          <p className="text-xs text-[var(--ink-soft)]">
            Sau khi gửi, bản nháp sẽ không thể chỉnh sửa cho đến khi Reviewer yêu cầu thay đổi
            (Changes Requested) hoặc phê duyệt (Approved).
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--ink)]"
              disabled={isPending}
              onClick={() => setOpen(false)}
              type="button"
            >
              Hủy
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-xs font-bold text-white disabled:opacity-50"
              disabled={isPending}
              onClick={handleSubmit}
              type="button"
            >
              {isPending ? "Đang gửi..." : "Xác nhận gửi review"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 2. Add Review Comment / Request Changes
// ---------------------------------------------------------------------------
export function AddReviewCommentDialog({
  lessonId,
  versionId,
}: {
  lessonId: string;
  versionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [res, setRes] = useState<ActionResponse | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const response = await addReviewCommentAction(lessonId, versionId, formData);
      if (response.success) {
        setOpen(false);
      } else {
        setRes(response);
      }
    });
  };

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-[#8b352e] hover:bg-[#fff5f3]"
        onClick={() => {
          setRes(null);
          setOpen(true);
        }}
        type="button"
      >
        <HugeiconsIcon icon={Comment01Icon} size={16} />
        Thêm nhận xét / Yêu cầu sửa
      </button>

      {open && (
        <Modal
          description="Tạo nhận xét phản hồi. Nếu chọn Blocking, version sẽ chuyển sang Changes Requested và cần được sửa trước khi approve."
          onClose={() => setOpen(false)}
          title="Yêu cầu chỉnh sửa (Review Comment)"
        >
          <ErrorBanner response={res} />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Mức độ nghiêm trọng</label>
                <div className="mt-1 flex gap-3">
                  <label className="flex items-center gap-2 text-xs">
                    <input defaultChecked name="severity" type="radio" value="BLOCKING" />
                    <span className="font-semibold text-[#8b352e]">BLOCKING (Bắt buộc sửa)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input name="severity" type="radio" value="SUGGESTION" />
                    <span className="font-semibold text-[var(--ink-soft)]">SUGGESTION (Gợi ý)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Nội dung góp ý</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-3 text-xs leading-relaxed focus:border-[var(--navy)] focus:outline-none"
                  name="message"
                  placeholder="Ghi rõ phần cần sửa hoặc bổ sung..."
                  required
                  rows={4}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--ink)]"
                disabled={isPending}
                onClick={() => setOpen(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#8b352e] px-5 text-xs font-bold text-white disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Đang gửi..." : "Gửi góp ý"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 3. Resolve Comment Button
// ---------------------------------------------------------------------------
export function ResolveCommentButton({
  lessonId,
  commentId,
}: {
  lessonId: string;
  commentId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Đánh dấu nhận xét này đã được giải quyết?")) return;
        startTransition(async () => {
          await resolveCommentAction(lessonId, commentId);
        });
      }}
      type="button"
    >
      <HugeiconsIcon icon={Tick01Icon} size={14} />
      {isPending ? "Đang lưu..." : "Giải quyết (Resolve)"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 4. Approve Version Dialog
// ---------------------------------------------------------------------------
export function ApproveDialog({
  lessonId,
  versionId,
}: {
  lessonId: string;
  versionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [res, setRes] = useState<ActionResponse | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const response = await approveVersionAction(lessonId, versionId, formData);
      if (response.success) {
        setOpen(false);
      } else {
        setRes(response);
      }
    });
  };

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow hover:bg-emerald-700"
        onClick={() => {
          setRes(null);
          setOpen(true);
        }}
        type="button"
      >
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
        Phê duyệt (Approve)
      </button>

      {open && (
        <Modal
          description="Xác nhận version này đáp ứng chất lượng và sẵn sàng để Publisher phát hành."
          onClose={() => setOpen(false)}
          title="Phê duyệt bài học (Approve)"
        >
          <ErrorBanner response={res} />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Tóm tắt đánh giá (Summary)</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-3 text-xs leading-relaxed focus:border-[var(--navy)] focus:outline-none"
                  name="summary"
                  placeholder="Ghi chú tóm tắt phê duyệt..."
                  rows={3}
                />
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <label className="text-xs font-bold text-amber-900">
                  Lý do Admin Override (Nếu bạn là người vừa chỉnh sửa bản nháp này)
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-amber-300 bg-white p-2 text-xs text-[var(--ink)] focus:outline-none"
                  name="overrideReason"
                  placeholder="Nhập lý do tự phê duyệt bài của chính mình..."
                  type="text"
                />
                <p className="mt-1 text-[11px] text-amber-700">
                  Theo quy định phân quyền, Reviewer không được tự duyệt bài do chính mình soạn thảo,
                  trừ khi có quyền Admin và cung cấp lý do override hợp lệ.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--ink)]"
                disabled={isPending}
                onClick={() => setOpen(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Đang phê duyệt..." : "Xác nhận Phê duyệt"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 5. Publish Now Dialog
// ---------------------------------------------------------------------------
export function PublishNowDialog({
  lessonId,
  versionId,
}: {
  lessonId: string;
  versionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [res, setRes] = useState<ActionResponse | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const response = await publishNowAction(lessonId, versionId, formData);
      if (response.success) {
        setOpen(false);
      } else {
        setRes(response);
      }
    });
  };

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy-bright)] px-4 text-xs font-bold text-white shadow hover:opacity-95"
        onClick={() => {
          setRes(null);
          setOpen(true);
        }}
        type="button"
      >
        <HugeiconsIcon icon={PlayIcon} size={16} />
        Phát hành ngay (Publish Now)
      </button>

      {open && (
        <Modal
          description="Phiên bản này sẽ trở thành phiên bản chính thức công khai cho học viên. Phiên bản đang phát hành trước đó (nếu có) sẽ chuyển sang SUPERSEDED."
          onClose={() => setOpen(false)}
          title="Phát hành bài học công khai"
        >
          <ErrorBanner response={res} />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <label className="text-xs font-bold text-amber-900">
                  Lý do Admin Override (Nếu bạn là người vừa phê duyệt phiên bản này)
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-amber-300 bg-white p-2 text-xs text-[var(--ink)] focus:outline-none"
                  name="overrideReason"
                  placeholder="Nhập lý do publish bài do chính mình approve..."
                  type="text"
                />
                <p className="mt-1 text-[11px] text-amber-700">
                  Theo quy tắc phân quyền, Publisher không được tự phát hành phiên bản do chính mình
                  phê duyệt, trừ khi là Admin có lý do override.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--ink)]"
                disabled={isPending}
                onClick={() => setOpen(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy-bright)] px-5 text-xs font-bold text-white disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Đang phát hành..." : "Xác nhận Phát hành"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 6. Schedule Dialog
// ---------------------------------------------------------------------------
export function ScheduleDialog({
  lessonId,
  versionId,
}: {
  lessonId: string;
  versionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [res, setRes] = useState<ActionResponse | null>(null);

  const defaultTimezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "Asia/Ho_Chi_Minh";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const response = await scheduleVersionAction(lessonId, versionId, formData);
      if (response.success) {
        setOpen(false);
      } else {
        setRes(response);
      }
    });
  };

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-[var(--navy)] hover:bg-[#edf0f4]"
        onClick={() => {
          setRes(null);
          setOpen(true);
        }}
        type="button"
      >
        <HugeiconsIcon icon={Calendar03Icon} size={16} />
        Lên lịch phát hành
      </button>

      {open && (
        <Modal
          description="Thiết lập thời điểm tự động phát hành trong tương lai."
          onClose={() => setOpen(false)}
          title="Lên lịch phát hành bài học"
        >
          <ErrorBanner response={res} />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Thời gian phát hành</label>
                <input
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-xs text-[var(--ink)] focus:border-[var(--navy)] focus:outline-none"
                  name="scheduledAt"
                  required
                  type="datetime-local"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Múi giờ</label>
                <input
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-xs text-[var(--ink)] focus:border-[var(--navy)] focus:outline-none"
                  defaultValue={defaultTimezone}
                  name="timezone"
                  required
                  type="text"
                />
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <label className="text-xs font-bold text-amber-900">
                  Lý do Admin Override (Nếu bạn là người phê duyệt)
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-amber-300 bg-white p-2 text-xs text-[var(--ink)] focus:outline-none"
                  name="overrideReason"
                  placeholder="Nhập lý do override nếu cùng người duyệt..."
                  type="text"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--ink)]"
                disabled={isPending}
                onClick={() => setOpen(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-xs font-bold text-white disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Đang lên lịch..." : "Lên lịch"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 7. Cancel Schedule Button
// ---------------------------------------------------------------------------
export function CancelScheduleButton({
  lessonId,
  versionId,
}: {
  lessonId: string;
  versionId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Hủy lịch phát hành và chuyển lại về APPROVED?")) return;
        startTransition(async () => {
          await cancelScheduleAction(lessonId, versionId);
        });
      }}
      type="button"
    >
      <HugeiconsIcon icon={StopIcon} size={16} />
      {isPending ? "Đang hủy..." : "Hủy lịch phát hành"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 8. Resume Editing Button
// ---------------------------------------------------------------------------
export function ResumeEditingButton({
  lessonId,
  versionId,
}: {
  lessonId: string;
  versionId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-xs font-bold text-white shadow hover:opacity-95 disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await resumeEditingAction(lessonId, versionId);
          if (res.redirectUrl) router.push(res.redirectUrl);
        });
      }}
      type="button"
    >
      <HugeiconsIcon icon={RotateLeft01Icon} size={16} />
      {isPending ? "Đang chuyển..." : "Mở lại bản nháp (Resume editing)"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 9. Cancel Version Dialog
// ---------------------------------------------------------------------------
export function CancelVersionDialog({
  lessonId,
  versionId,
}: {
  lessonId: string;
  versionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [res, setRes] = useState<ActionResponse | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const response = await cancelVersionAction(lessonId, versionId, formData);
      if (response.success) {
        setOpen(false);
      } else {
        setRes(response);
      }
    });
  };

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-700 hover:bg-red-50"
        onClick={() => {
          setRes(null);
          setOpen(true);
        }}
        type="button"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={16} />
        Hủy phiên bản (Cancel)
      </button>

      {open && (
        <Modal
          description="Hủy bản nháp này vĩnh viễn và không tiếp tục đưa vào quy trình phát hành."
          onClose={() => setOpen(false)}
          title="Xác nhận hủy phiên bản"
        >
          <ErrorBanner response={res} />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Lý do hủy</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-3 text-xs leading-relaxed focus:border-[var(--navy)] focus:outline-none"
                  name="reason"
                  placeholder="Ghi rõ lý do hủy bản nháp này..."
                  required
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--ink)]"
                disabled={isPending}
                onClick={() => setOpen(false)}
                type="button"
              >
                Đóng
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-5 text-xs font-bold text-white disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Đang hủy..." : "Xác nhận hủy phiên bản"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 10. Rollback Dialog
// ---------------------------------------------------------------------------
export function RollbackDialog({
  lessonId,
  supersededVersions,
}: {
  lessonId: string;
  supersededVersions: Array<{ id: string; versionNumber: number; revision: number; publishedAt: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [res, setRes] = useState<ActionResponse | null>(null);

  if (supersededVersions.length === 0) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const response = await rollbackAction(lessonId, formData);
      if (response.success) {
        setOpen(false);
      } else {
        setRes(response);
      }
    });
  };

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-bold text-[var(--navy)] hover:bg-[#edf0f4]"
        onClick={() => {
          setRes(null);
          setOpen(true);
        }}
        type="button"
      >
        <HugeiconsIcon icon={RotateLeft01Icon} size={16} />
        Rollback về phiên bản cũ
      </button>

      {open && (
        <Modal
          description="Chuyển một phiên bản đã từng phát hành trong quá khứ thành phiên bản chính thức hiện hành."
          onClose={() => setOpen(false)}
          title="Rollback phiên bản bài học"
        >
          <ErrorBanner response={res} />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Chọn phiên bản đích</label>
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-xs text-[var(--ink)] focus:border-[var(--navy)] focus:outline-none"
                  name="targetVersionId"
                  required
                >
                  {supersededVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      Version {v.versionNumber}.{v.revision} (Đã phát hành: {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString("vi-VN") : "—"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Lý do Rollback</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-3 text-xs leading-relaxed focus:border-[var(--navy)] focus:outline-none"
                  name="reason"
                  placeholder="Ghi rõ lý do rollback..."
                  required
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--ink)]"
                disabled={isPending}
                onClick={() => setOpen(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-xs font-bold text-white disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Đang xử lý..." : "Xác nhận Rollback"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 11. Archive / Restore Dialog
// ---------------------------------------------------------------------------
export function ArchiveRestoreDialog({
  lessonId,
  isArchived,
}: {
  lessonId: string;
  isArchived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [res, setRes] = useState<ActionResponse | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const response = isArchived
        ? await restoreLessonAction(lessonId, formData)
        : await archiveLessonAction(lessonId, formData);
      if (response.success) {
        setOpen(false);
      } else {
        setRes(response);
      }
    });
  };

  return (
    <>
      <button
        className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold ${
          isArchived
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
        }`}
        onClick={() => {
          setRes(null);
          setOpen(true);
        }}
        type="button"
      >
        <HugeiconsIcon icon={Archive02Icon} size={16} />
        {isArchived ? "Khôi phục bài học (Restore)" : "Lưu trữ bài học (Archive)"}
      </button>

      {open && (
        <Modal
          description={
            isArchived
              ? "Khôi phục bài học trở lại trạng thái PUBLISHED để học viên mới có thể tiếp cận."
              : "Lưu trữ bài học. Học viên đã học vẫn tiếp tục được học nhưng bài học sẽ bị gỡ khỏi mục khám phá công khai."
          }
          onClose={() => setOpen(false)}
          title={isArchived ? "Khôi phục bài học" : "Lưu trữ bài học (Archive)"}
        >
          <ErrorBanner response={res} />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Lý do</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-3 text-xs leading-relaxed focus:border-[var(--navy)] focus:outline-none"
                  name="reason"
                  placeholder="Ghi rõ lý do..."
                  required
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--ink)]"
                disabled={isPending}
                onClick={() => setOpen(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-bold text-white disabled:opacity-50 ${
                  isArchived ? "bg-emerald-600" : "bg-amber-700"
                }`}
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Đang xử lý..." : isArchived ? "Khôi phục" : "Lưu trữ"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 12. Withdraw Dialog (Emergency)
// ---------------------------------------------------------------------------
export function WithdrawDialog({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [res, setRes] = useState<ActionResponse | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const response = await withdrawLessonAction(lessonId, formData);
      if (response.success) {
        setOpen(false);
      } else {
        setRes(response);
      }
    });
  };

  return (
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 text-xs font-bold text-red-800 hover:bg-red-100"
        onClick={() => {
          setRes(null);
          setOpen(true);
        }}
        type="button"
      >
        <HugeiconsIcon icon={Alert02Icon} size={16} />
        Gỡ khẩn cấp (Emergency Withdraw)
      </button>

      {open && (
        <Modal
          description="Gỡ bài học khẩn cấp khỏi toàn bộ hệ thống ngay lập tức. Toàn bộ học viên sẽ bị chặn truy cập bài học này."
          onClose={() => setOpen(false)}
          title="Gỡ bài học khẩn cấp (Emergency Withdraw)"
        >
          <ErrorBanner response={res} />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                Hành động này chỉ dành cho Admin khi nội dung vi phạm nghiêm trọng (an toàn, bản quyền, v.v.).
                Để khôi phục sau khi gỡ khẩn cấp cần quy trình bảo mật riêng.
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Lý do gỡ khẩn cấp</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-3 text-xs leading-relaxed focus:border-[var(--navy)] focus:outline-none"
                  name="reason"
                  placeholder="Ghi rõ lý do vi phạm..."
                  required
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--ink)]"
                disabled={isPending}
                onClick={() => setOpen(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-5 text-xs font-bold text-white disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Đang xử lý..." : "Xác nhận Gỡ khẩn cấp"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 13. Clone Published Version Button
// ---------------------------------------------------------------------------
export function ClonePublishedVersionButton({ lessonId }: { lessonId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-xs font-bold text-white shadow hover:opacity-95 disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Tạo một bản nháp mới từ phiên bản đang phát hành hiện tại?")) return;
        startTransition(async () => {
          const res = await clonePublishedVersionAction(lessonId);
          if (res.redirectUrl) router.push(res.redirectUrl);
        });
      }}
      type="button"
    >
      <HugeiconsIcon icon={Copy01Icon} size={16} />
      {isPending ? "Đang tạo bản nháp..." : "Tạo bản nháp mới (Clone)"}
    </button>
  );
}
