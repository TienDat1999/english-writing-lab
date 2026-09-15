import { ZodError } from "zod";

import { UnauthorizedError } from "@/server/auth/session";

export function errorResponse(error: unknown): Response {
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (error instanceof ZodError) {
    return Response.json(
      { error: "INVALID_REQUEST", fields: error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (error instanceof ResourceNotFoundError) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  console.error("Unhandled route error", error);
  return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}

export class ResourceNotFoundError extends Error {
  constructor() {
    super("Resource not found");
    this.name = "ResourceNotFoundError";
  }
}
