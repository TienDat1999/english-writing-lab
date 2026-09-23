export class ForbiddenError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "ForbiddenError";
  }
}

export class AuthorizationTargetNotFoundError extends Error {
  constructor() {
    super("Authorization target not found.");
    this.name = "AuthorizationTargetNotFoundError";
  }
}

export class AuthorizationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationConflictError";
  }
}
