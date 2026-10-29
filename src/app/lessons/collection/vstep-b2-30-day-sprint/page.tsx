import Link from "next/link";
import {
  ArrowLeft01Icon,
  BookOpen01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  FireIcon,
  LockIcon,
  PlayIcon,
  SparklesIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSession } from "@/server/auth/session";
import { getSprintOverview } from "@/server/sprint/sprint.service";
import { EnrollSprintButton } from "./enroll-sprint-button";

export default async function VstepSprintDetailPage() {
  const session = await getSession();
  const userId = session?.user?.id || null;
  const overview = await getSprintOverview(userId);

  const weeks = [
    {
      weekNumber: 1,
      title: "Tuần 1: Xây móng Template & Phản xạ căn bản",
      focus: "Nắm vững 100% mẫu thư Task 1 & Phản xạ 10 chủ đề quen thuộc Speaking Part 1",
      days: overview.days.filter((d) => d.weekNumber === 1),
    },
    {
      weekNumber: 2,
      title: "Tuần 2: Mô hình luận PEEL & Đột phá Speaking Part 2",
      focus: "Viết đoạn văn chuẩn PEEL & Nhuần nhuyễn công thức So sánh - Bác bỏ Part 2",
      days: overview.days.filter((d) => d.weekNumber === 2),
    },
    {
      weekNumber: 3,
      title: "Tuần 3: Luận chủ đề khó & Thuyết trình Mindmap Part 3",
      focus: "Làm chủ Pros/Cons & Kỹ thuật phát triển sơ đồ tư duy kèm Own Idea Part 3",
      days: overview.days.filter((d) => d.weekNumber === 3),
    },
    {
      weekNumber: 4,
      title: "Tuần 4 & Về đích: Mock Test thời gian thực & Tinh chỉnh",
      focus: "Đưa kỹ năng vào trạng thái phản xạ vô điều kiện dưới áp lực phòng thi máy tính",
      days: overview.days.filter((d) => d.weekNumber === 4),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/lessons"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
          <span>Quay lại Kho bài học</span>
        </Link>
      </div>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 sm:p-10 text-white shadow-2xl border border-amber-500/30">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-2.5 py-1 text-xs font-black text-slate-950 shadow-xs">
              <HugeiconsIcon icon={SparklesIcon} size={13} />
              GIÁO ÁN TÁC CHIẾN ĐỘC QUYỀN
            </span>
            <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold text-amber-200 border border-white/20">
              VSTEP BẬC 4/6 (B2)
            </span>
            <span className="rounded-md bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
              Miễn phí khi học tại Draftwise
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Lịch Trình 30 Ngày Bứt Phá VSTEP B2 Chi Tiết Từng Ngày
          </h1>

          <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Chiến thuật tập trung hỏa lực 80% vào <strong>Writing & Speaking</strong> — Kéo điểm làm tròn từ <span className="text-amber-300 font-mono font-bold">≥ 5.75</span> lên <span className="text-emerald-400 font-mono font-bold">6.0 B2</span> an toàn. Mỗi ngày luyện đúng 1 dạng đề, 1 bộ từ vựng và phản xạ bấm giờ.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-amber-400" />
              <span>30 Ngày thực chiến</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <HugeiconsIcon icon={Clock01Icon} size={16} className="text-sky-400" />
              <span>90-120 phút/ngày</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <HugeiconsIcon icon={FireIcon} size={16} className="text-rose-400" />
              <span>4 Trạm học liên hoàn</span>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="pt-4">
            <EnrollSprintButton
              isLoggedIn={!!userId}
              isEnrolled={overview.isEnrolled}
              currentDay={overview.currentDay}
            />
          </div>
        </div>
      </div>

      {/* 3 Core Rules Card */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <span className="grid size-6 place-items-center rounded-full bg-amber-200 text-xs font-mono">1</span>
            Bấm Giờ Ngay Ngày 1
          </div>
          <p className="mt-2 text-xs text-amber-800 leading-relaxed">
            Viết thư đúng 20 phút, bài luận 40 phút. Nói Part 2 chuẩn bị đúng 60 giây và nói trọn vẹn 2 phút.
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
            <span className="grid size-6 place-items-center rounded-full bg-sky-200 text-xs font-mono">2</span>
            Kiểm Soát Dead Air
          </div>
          <p className="mt-2 text-xs text-sky-800 leading-relaxed">
            Tuyệt đối không để khoảng lặng quá 3 giây trên máy tính. Dùng ngay các filler phrases học thuật để câu giờ.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <span className="grid size-6 place-items-center rounded-full bg-emerald-200 text-xs font-mono">3</span>
            Đúng Form - Chuẩn Ngữ Pháp
          </div>
          <p className="mt-2 text-xs text-emerald-800 leading-relaxed">
            Không cần nói hay như người bản xứ. Chỉ cần RÕ RÀNG - ĐÚNG NGỮ PHÁP - ĐỦ Ý - ĐÚNG FORM là cầm chắc B2.
          </p>
        </div>
      </div>

      {/* Detailed Syllabus By Week */}
      <div className="space-y-8">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900">
            Đề Cương 30 Ngày Chi Tiết
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bấm vào bất kỳ ngày nào đang mở để vào Trạm học tập thực chiến.
          </p>
        </div>

        {weeks.map((week) => (
          <div key={week.weekNumber} className="space-y-4">
            <div className="rounded-2xl bg-slate-900 px-5 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
              <div>
                <h3 className="font-heading text-base font-extrabold text-amber-300">
                  {week.title}
                </h3>
                <p className="text-xs text-slate-300">{week.focus}</p>
              </div>
              <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-md self-start sm:self-auto text-slate-200">
                {week.days.length} ngày
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {week.days.map((day) => {
                const isCompleted = day.status === "COMPLETED";
                const isInProgress = day.status === "IN_PROGRESS";
                const isLocked = day.status === "LOCKED";

                return (
                  <Card
                    key={day.dayNumber}
                    className={`flex flex-col justify-between rounded-2xl p-4 transition-all ${
                      isCompleted
                        ? "border-emerald-300 bg-emerald-50/30"
                        : isInProgress
                        ? "border-2 border-amber-400 bg-amber-50/20 shadow-md ring-2 ring-amber-400/20"
                        : "border-slate-200/90 bg-white opacity-85"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          Ngày {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}
                        </span>

                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                            Đã xong
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-md animate-pulse">
                            <HugeiconsIcon icon={PlayIcon} size={12} />
                            Đang học
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            <HugeiconsIcon icon={LockIcon} size={12} />
                            Khóa
                          </span>
                        )}
                      </div>

                      <h4 className="font-heading text-sm font-bold text-slate-900 line-clamp-2">
                        {day.title}
                      </h4>

                      <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                        {day.dailyGoal}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {isLocked && !overview.isEnrolled ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl text-xs font-bold"
                        >
                          <Link href={`/dashboard/sprint/day/${day.dayNumber}`}>
                            Xem trước bài học
                          </Link>
                        </Button>
                      ) : isLocked ? (
                        <Button
                          disabled
                          variant="ghost"
                          size="sm"
                          className="w-full rounded-xl text-xs font-medium text-slate-400 cursor-not-allowed"
                        >
                          <HugeiconsIcon icon={LockIcon} size={13} className="mr-1" />
                          Hoàn thành ngày trước để mở
                        </Button>
                      ) : (
                        <Button
                          asChild
                          size="sm"
                          className={`w-full rounded-xl text-xs font-bold shadow-xs ${
                            isInProgress
                              ? "bg-amber-400 hover:bg-amber-500 text-slate-950"
                              : "bg-slate-900 hover:bg-slate-800 text-white"
                          }`}
                        >
                          <Link href={`/dashboard/sprint/day/${day.dayNumber}`}>
                            {isInProgress ? "Vào học ngay →" : "Ôn tập lại ngày này"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
