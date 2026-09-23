export const contentAuditActions = [
  "LESSON_CREATED",
  "DRAFT_UPDATED",
  "VERSION_CLONED",
  "REVIEW_SUBMITTED",
  "CHANGES_REQUESTED",
  "REVIEW_APPROVED",
  "PUBLISHED",
  "ARCHIVED",
  "RESTORED",
  "ROLLED_BACK",
  "WITHDRAWN",
] as const;

export type ContentAuditAction = (typeof contentAuditActions)[number];

export type AuditSummary = Record<
  string,
  boolean | null | number | string | string[]
>;
