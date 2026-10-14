import { revalidatePath } from "next/cache";

import { PageHeading } from "@/components/page-heading";
import { UserListClient } from "@/components/user-list-client";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  activateUser,
  listAdminUsers,
  suspendUser,
} from "@/server/users";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, authorization } = await requireAnyAdminPermission([
    "SUPPORT_CASE_HANDLE",
    "STAFF_ROLE_MANAGE",
  ]);

  const canManage =
    authorization.permissions.has("SUPPORT_CASE_HANDLE") ||
    authorization.permissions.has("STAFF_ROLE_MANAGE");

  const rawParams = await searchParams;
  const searchQuery = typeof rawParams.q === "string" ? rawParams.q : undefined;
  const statusParam = typeof rawParams.status === "string" ? rawParams.status : "ALL";
  const statusFilter =
    statusParam === "ACTIVE" || statusParam === "SUSPENDED" ? statusParam : "ALL";
  const pageParam = typeof rawParams.page === "string" ? parseInt(rawParams.page, 10) : 1;
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const { users, totalCount, totalPages, page } = await listAdminUsers({
    search: searchQuery,
    status: statusFilter,
    page: currentPage,
    limit: 15,
  });

  async function suspendUserAction(targetUserId: string, reason: string) {
    "use server";
    const context = await requireAnyAdminPermission(["SUPPORT_CASE_HANDLE", "STAFF_ROLE_MANAGE"]);
    await suspendUser({
      actorUserId: context.user.id,
      targetUserId,
      reason,
    });
    revalidatePath("/users");
  }

  async function activateUserAction(targetUserId: string, reason: string) {
    "use server";
    const context = await requireAnyAdminPermission(["SUPPORT_CASE_HANDLE", "STAFF_ROLE_MANAGE"]);
    await activateUser({
      actorUserId: context.user.id,
      targetUserId,
      reason,
    });
    revalidatePath("/users");
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--line)] pb-6 mb-6">
        <PageHeading
          eyebrow="Học viên & Người dùng"
          title="Quản lý Người học & Hỗ trợ Khách hàng"
          description="Tra cứu hồ sơ học viên, theo dõi lịch sử làm bài IELTS, trạng thái ghi danh ôn tập SRS và thực hiện các nghiệp vụ hỗ trợ khách hàng."
        />
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-slate-700 shadow-sm">
            {totalCount} tài khoản
          </span>
        </div>
      </div>

      <UserListClient
        users={users}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={page}
        canManage={canManage}
        onSuspendUserAction={suspendUserAction}
        onActivateUserAction={activateUserAction}
      />
    </>
  );
}
