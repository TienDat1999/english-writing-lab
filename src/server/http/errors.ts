import { ZodError } from "zod";

import { UnauthorizedError } from "@/server/auth/session";
import {
  AuthorizationConflictError,
  AuthorizationTargetNotFoundError,
  ForbiddenError,
} from "@/server/auth/authorization.errors";

export function errorResponse(error: unknown): Response {
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (error instanceof AuthorizationConflictError) {
    return Response.json({ error: "CONFLICT", message: error.message }, { status: 409 });
  }

  if (error instanceof ZodError) {
    return Response.json(
      { error: "INVALID_REQUEST", fields: error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (error instanceof InvalidRequestError) {
    return Response.json({ error: "INVALID_REQUEST", message: error.message }, { status: 400 });
  }

  if (
    error instanceof ResourceNotFoundError
    || error instanceof AuthorizationTargetNotFoundError
  ) {
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

export class InvalidRequestError extends Error {
  constructor(message = "Invalid request") {
    super(message);
    this.name = "InvalidRequestError";
  }
}
