import type { ApplicationPermission } from "@draftwise/auth";
import { AdminHeader } from "@/components/admin-header";
import { AdminNavigation } from "@/components/admin-navigation";
import { requireAdminContext } from "@/server/admin-access";

const navigationRules: Array<{
  href: string;
  permissions?: ApplicationPermission[];
}> = [
  { href: "/" },
  { href: "/analytics" },
  { href: "/lessons", permissions: ["CONTENT_DRAFT_VIEW"] },
  { href: "/collections", permissions: ["CONTENT_DRAFT_VIEW"] },
  { href: "/media", permissions: ["CONTENT_DRAFT_VIEW"] },
  { href: "/reports", permissions: ["CONTENT_REPORT_HANDLE"] },
  { href: "/settings", permissions: ["STAFF_ROLE_MANAGE"] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authorization, user } = await requireAdminContext();

  const visibleHrefs = navigationRules
    .filter(({ permissions }) =>
      !permissions || permissions.some((permission) => authorization.permissions.has(permission)),
    )
    .map(({ href }) => href);
  return (
    <div className="min-h-screen min-w-[74rem] pl-[17rem]">
      <AdminNavigation visibleHrefs={visibleHrefs} />
      <AdminHeader user={user} />
      <main className="mx-auto w-full max-w-[96rem] px-8 py-9 xl:px-10 xl:py-10">{children}</main>
    </div>
  );
}
