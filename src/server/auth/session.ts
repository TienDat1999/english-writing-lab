import "server-only";

import { cache } from "react";

import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthorizedError";
  }
}

export const requireUser = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };
});

