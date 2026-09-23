import "server-only";

import type { ApplicationPermission } from "@draftwise/auth";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";

import { getAuthorizationSnapshot } from "./authorization";
import { isIdentityPolicyReady } from "./env";

export const requireAdminContext = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!isIdentityPolicyReady()) redirect("/security-required");

  const authorization = await getAuthorizationSnapshot(session.user.id);
  if (!authorization.canAccessAdmin) redirect("/access-denied");

  return { authorization, user: session.user };
});

export async function requireAnyAdminPermission(permissions: ApplicationPermission[]) {
  const context = await requireAdminContext();
  if (!permissions.some((permission) => context.authorization.permissions.has(permission))) {
    redirect("/access-denied");
  }
  return context;
}
