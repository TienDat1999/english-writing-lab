import "server-only";

import { cache } from "react";

import { auth } from "@/auth";

import { requirePermission } from "./authorization";
import type { ApplicationPermission } from "./authorization.constants";

export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthorizedError";
  }
}

export const getSession = cache(async () => auth());

export const requireUser = cache(async () => {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };
});

export const requireAuthorizedUser = cache(async (
  permission: ApplicationPermission,
) => {
  const user = await requireUser();
  const authorization = await requirePermission(user.id, permission);
  return { ...user, authorization };
});
