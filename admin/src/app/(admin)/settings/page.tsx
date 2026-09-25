import { staffRoles, type StaffRole } from "@draftwise/auth";
import { Add01Icon, ArrowDown01Icon, Shield01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PageHeading } from "@/components/page-heading";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  assignStaffRole,
  listStaffMembers,
  revokeStaffRole,
} from "@/server/staff";

const fieldClass = "h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--navy-bright)] focus:ring-2 focus:ring-[#1959c71a]";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { authorization } = await requireAnyAdminPermission(["STAFF_ROLE_MANAGE"]);
  const canManageStaff = authorization.permissions.has("STAFF_ROLE_MANAGE");
  const rawSearchParams = await searchParams;
  const staffOutcome = typeof rawSearchParams.staff === "string" ? rawSearchParams.staff : undefined;
  const staffError = typeof rawSearchParams.staff_error === "string" ? decodeURIComponent(rawSearchParams.staff_error) : undefined;
  const staffMembers = canManageStaff ? await listStaffMembers() : [];

  async function assignStaffRoleAction(formData: FormData) {
    "use server";
    const { user } = await requireAnyAdminPermission(["STAFF_ROLE_MANAGE"]);
    const email = String(formData.get("email") ?? "");
    const roles = formData.getAll("roles").map(String) as StaffRole[];
    const reason = String(formData.get("reason") ?? "");
    const result = "assigned";
    try {
      await assignStaffRole({
        actorUserId: user.id,
        email,
        roles,
        reason,
      });
      revalidatePath("/settings");
    } catch (error) {
      const msg = error instanceof Error ? encodeURIComponent(error.message) : "failed";
      redirect(`/settings?staff_error=${msg}#staff`);
    }
    redirect(`/settings?staff=${result}#staff`);
  }

  async function revokeStaffRoleAction(formData: FormData) {
    "use server";
    const { user } = await requireAnyAdminPermission(["STAFF_ROLE_MANAGE"]);
    const userId = String(formData.get("userId") ?? "");
    const reason = String(formData.get("reason") ?? "");
    const result = "revoked";
    try {
      await revokeStaffRole({
        actorUserId: user.id,
        userId,
        reason,
      });
      revalidatePath("/settings");
    } catch (error) {
      const msg = error instanceof Error ? encodeURIComponent(error.message) : "failed";
      redirect(`/settings?staff_error=${msg}#staff`);
    }
    redirect(`/settings?staff=${result}#staff`);
  }

  return (
    <>
      <PageHeading
        eyebrow="Platform Governance"
        title="Cài đặt Hệ thống"
        description="Quản lý cấu hình bảo mật, phân quyền tài khoản nhân sự biên tập và kiểm duyệt. Mọi thay đổi đều được ghi vết kiểm toán (audit log)."
      />

      <section className="admin-enter mt-8 grid gap-4 lg:grid-cols-3">
        <article className="admin-panel p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e6edfb] text-[var(--navy)]">
              <HugeiconsIcon icon={UserIcon} size={20} />
            </span>
            <span className="rounded-full bg-[#e7f5ec] px-2.5 py-1 text-xs font-bold text-[#236143]">
              {staffMembers.filter((m) => m.status === "ACTIVE").length} active
            </span>
          </div>
          <p className="mt-5 text-3xl font-extrabold">{staffMembers.length}</p>
          <p className="mt-1 text-sm font-bold text-[var(--ink)]">Tài khoản Nhân sự (Staff)</p>
        </article>

        <article className="admin-panel p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-700">
              <HugeiconsIcon icon={Shield01Icon} size={20} />
            </span>
            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800">
              {staffRoles.length} roles
            </span>
          </div>
          <p className="mt-5 text-3xl font-extrabold">{staffRoles.length}</p>
          <p className="mt-1 text-sm font-bold text-[var(--ink)]">Vai trò nghiệp vụ</p>
        </article>

        <article className="admin-panel bg-[var(--navy)] p-5 text-white">
          <p className="admin-kicker text-[var(--amber)]">Nguyên tắc bảo mật</p>
          <p className="mt-4 text-sm font-bold leading-6">Quyền Admin yêu cầu ít nhất 1 tài khoản còn active trong hệ thống.</p>
          <p className="mt-3 text-xs leading-5 text-white/65">Mọi thao tác cấp quyền hoặc thu hồi bắt buộc phải có lý do kiểm toán rõ ràng.</p>
        </article>
      </section>

      {/* PHẦN PHÂN QUYỀN NHÂN SỰ (STAFF ROLE MANAGEMENT) */}
      <section id="staff" className="admin-panel mt-8 overflow-hidden bg-white shadow-2xs">
        <div className="border-b border-[var(--line)] p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="admin-kicker text-[var(--navy-bright)]">Nhân sự & Phân quyền</p>
              <h2 className="mt-1 font-heading text-xl sm:text-2xl font-bold text-[var(--ink)]">
                Tài khoản & Vai trò Quản trị
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-[var(--ink-soft)] max-w-2xl">
                Cấp vai trò cho đội ngũ biên tập và kiểm duyệt. Mọi thay đổi đều được ghi vết kiểm toán (audit trail).
              </p>
            </div>
            <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-800 w-fit">
              {staffMembers.length} nhân sự
            </span>
          </div>

          {/* Feedback alerts */}
          {staffOutcome === "assigned" ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
              ✓ Cập nhật vai trò nhân sự thành công. Thay đổi đã được lưu vào lịch sử kiểm toán.
            </div>
          ) : null}
          {staffOutcome === "revoked" ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              ✓ Thu hồi quyền truy cập nhân sự thành công.
            </div>
          ) : null}
          {staffError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
              ✕ Lỗi phân quyền: {staffError}
            </div>
          ) : null}
        </div>

        {canManageStaff ? (
          <div>
            {/* Form Cấp quyền / Cập nhật vai trò */}
            <details className="group border-b border-[var(--line)] bg-[#fff8df]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-extrabold text-[var(--ink)]">
                <span className="inline-flex items-center gap-2">
                  <HugeiconsIcon icon={Add01Icon} size={18} />
                  <span>Cấp hoặc Cập nhật vai trò nhân sự</span>
                </span>
                <HugeiconsIcon className="transition group-open:rotate-180" icon={ArrowDown01Icon} size={18} />
              </summary>

              <form action={assignStaffRoleAction} className="grid gap-5 border-t border-[#eadca9] p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-bold text-[var(--ink-soft)]">
                    Email tài khoản người dùng
                    <input
                      className={fieldClass}
                      name="email"
                      placeholder="ví dụ: editor@draftwise.vn"
                      required
                      type="email"
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold text-[var(--ink-soft)]">
                    Lý do phân quyền (bắt buộc kiểm toán)
                    <input
                      className={fieldClass}
                      name="reason"
                      placeholder="ví dụ: Bổ sung nhân sự đội Content Writing"
                      required
                    />
                  </label>
                </div>

                <div>
                  <p className="text-xs font-bold text-[var(--ink-soft)] mb-2">Chọn vai trò cấp cho nhân sự:</p>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="flex items-start gap-2.5 rounded-xl border border-[#eadca9] bg-white p-3 cursor-pointer hover:border-[var(--navy-bright)] transition">
                      <input className="mt-0.5" name="roles" type="checkbox" value="CONTENT_EDITOR" />
                      <div>
                        <span className="block text-xs font-bold text-[var(--ink)]">CONTENT_EDITOR</span>
                        <span className="block text-[11px] text-[var(--ink-soft)] leading-tight">
                          Soạn thảo, tạo bài học và chỉnh sửa bản nháp
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 rounded-xl border border-[#eadca9] bg-white p-3 cursor-pointer hover:border-[var(--navy-bright)] transition">
                      <input className="mt-0.5" name="roles" type="checkbox" value="CONTENT_REVIEWER" />
                      <div>
                        <span className="block text-xs font-bold text-[var(--ink)]">CONTENT_REVIEWER</span>
                        <span className="block text-[11px] text-[var(--ink-soft)] leading-tight">
                          Kiểm duyệt, ghi nhận xét và yêu cầu sửa đổi
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 rounded-xl border border-[#eadca9] bg-white p-3 cursor-pointer hover:border-[var(--navy-bright)] transition">
                      <input className="mt-0.5" name="roles" type="checkbox" value="CONTENT_PUBLISHER" />
                      <div>
                        <span className="block text-xs font-bold text-[var(--ink)]">CONTENT_PUBLISHER</span>
                        <span className="block text-[11px] text-[var(--ink-soft)] leading-tight">
                          Phê duyệt và xuất bản bài học ra công chúng
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 rounded-xl border border-[#eadca9] bg-white p-3 cursor-pointer hover:border-[var(--navy-bright)] transition">
                      <input className="mt-0.5" name="roles" type="checkbox" value="ADMIN" />
                      <div>
                        <span className="block text-xs font-bold text-[var(--ink)]">ADMIN</span>
                        <span className="block text-[11px] text-[var(--ink-soft)] leading-tight">
                          Toàn quyền quản trị nội dung, taxonomy và nhân sự
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 rounded-xl border border-[#eadca9] bg-white p-3 cursor-pointer hover:border-[var(--navy-bright)] transition">
                      <input className="mt-0.5" name="roles" type="checkbox" value="SUPPORT" />
                      <div>
                        <span className="block text-xs font-bold text-[var(--ink)]">SUPPORT</span>
                        <span className="block text-[11px] text-[var(--ink-soft)] leading-tight">
                          Tiếp nhận và xử lý báo cáo từ học viên
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  className="h-10 justify-self-start rounded-xl bg-[var(--amber)] px-5 text-xs font-extrabold text-[#392800] hover:bg-[#e49400] transition"
                  type="submit"
                >
                  Lưu phân quyền nhân sự
                </button>
              </form>
            </details>

            {/* Bảng danh sách nhân sự hiện tại */}
            <div className="divide-y divide-[var(--line)]">
              {staffMembers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <p>Chưa có tài khoản nhân sự nào được phân quyền.</p>
                </div>
              ) : (
                staffMembers.map((member) => (
                  <div key={member.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-[#faf8f2] transition">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-sm font-bold text-[var(--ink)]">
                          {member.name}
                        </span>
                        <span className="font-mono text-xs text-[var(--ink-soft)]">
                          ({member.email})
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${
                            member.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {member.status === "ACTIVE" ? "Đang hoạt động" : "Đã thu hồi"}
                        </span>
                      </div>

                      {/* Roles Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {member.roles.map((r) => {
                          const badgeColor =
                            r === "ADMIN"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : r === "CONTENT_PUBLISHER"
                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                : r === "CONTENT_REVIEWER"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : r === "CONTENT_EDITOR"
                                    ? "bg-sky-50 text-sky-800 border-sky-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200";

                          return (
                            <span
                              key={r}
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${badgeColor}`}
                            >
                              {r}
                            </span>
                          );
                        })}
                      </div>

                      {member.reason ? (
                        <p className="text-[11px] text-[var(--ink-soft)] italic">
                          Lý do: &ldquo;{member.reason}&rdquo; · Cấp bởi {member.grantedByName} vào{" "}
                          {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(member.updatedAt)}
                        </p>
                      ) : null}
                    </div>

                    {/* Action: Thu hồi quyền */}
                    {member.status === "ACTIVE" ? (
                      <details className="shrink-0 text-right">
                        <summary className="inline-flex cursor-pointer text-xs font-semibold text-rose-700 hover:underline">
                          Thu hồi quyền
                        </summary>
                        <form
                          action={revokeStaffRoleAction}
                          className="mt-2 flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-left sm:w-72"
                        >
                          <input name="userId" type="hidden" value={member.userId} />
                          <label className="text-[11px] font-bold text-rose-900">
                            Lý do thu hồi (bắt buộc):
                            <input
                              className="mt-1 h-8 w-full rounded-lg border border-rose-200 bg-white px-2 text-xs outline-none"
                              name="reason"
                              placeholder="ví dụ: Đã chuyển công tác"
                              required
                            />
                          </label>
                          <button
                            className="h-7 rounded-lg bg-rose-600 px-3 text-[11px] font-bold text-white hover:bg-rose-700 transition self-end"
                            type="submit"
                          >
                            Xác nhận thu hồi
                          </button>
                        </form>
                      </details>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-xs text-muted-foreground">
            Bạn không có quyền quản lý vai trò nhân sự (`STAFF_ROLE_MANAGE`).
          </div>
        )}
      </section>
    </>
  );
}
