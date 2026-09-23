export const applicationRoles = [
  "LEARNER",
  "CONTENT_EDITOR",
  "CONTENT_REVIEWER",
  "CONTENT_PUBLISHER",
  "SUPPORT",
  "ADMIN",
] as const;

export const staffRoles = [
  "CONTENT_EDITOR",
  "CONTENT_REVIEWER",
  "CONTENT_PUBLISHER",
  "SUPPORT",
  "ADMIN",
] as const;

export const applicationPermissions = [
  "LEARNING_USE",
  "CONTENT_DRAFT_VIEW",
  "CONTENT_DRAFT_CREATE",
  "CONTENT_DRAFT_EDIT",
  "CONTENT_REVIEW_COMMENT",
  "CONTENT_REVIEW_APPROVE",
  "CONTENT_PUBLISH",
  "CONTENT_ARCHIVE",
  "CONTENT_ROLLBACK",
  "CONTENT_WITHDRAW",
  "CONTENT_REPORT_HANDLE",
  "SUPPORT_CASE_HANDLE",
  "TAXONOMY_MANAGE",
  "STAFF_ROLE_MANAGE",
  "AUDIT_VIEW_OWN",
  "AUDIT_VIEW_CONTENT",
  "AUDIT_VIEW_SUPPORT",
  "AUDIT_VIEW_ALL",
] as const;

export type ApplicationRole = (typeof applicationRoles)[number];
export type StaffRole = (typeof staffRoles)[number];
export type ApplicationPermission = (typeof applicationPermissions)[number];

const allPermissions = new Set<ApplicationPermission>(applicationPermissions);

export const permissionsByRole: Record<
  ApplicationRole,
  ReadonlySet<ApplicationPermission>
> = {
  LEARNER: new Set(["LEARNING_USE"]),
  CONTENT_EDITOR: new Set([
    "LEARNING_USE",
    "CONTENT_DRAFT_VIEW",
    "CONTENT_DRAFT_CREATE",
    "CONTENT_DRAFT_EDIT",
    "AUDIT_VIEW_OWN",
  ]),
  CONTENT_REVIEWER: new Set([
    "LEARNING_USE",
    "CONTENT_DRAFT_VIEW",
    "CONTENT_REVIEW_COMMENT",
    "CONTENT_REVIEW_APPROVE",
    "CONTENT_REPORT_HANDLE",
    "AUDIT_VIEW_CONTENT",
  ]),
  CONTENT_PUBLISHER: new Set([
    "LEARNING_USE",
    "CONTENT_DRAFT_VIEW",
    "CONTENT_PUBLISH",
    "CONTENT_ARCHIVE",
    "CONTENT_ROLLBACK",
    "AUDIT_VIEW_CONTENT",
  ]),
  SUPPORT: new Set([
    "LEARNING_USE",
    "CONTENT_REPORT_HANDLE",
    "SUPPORT_CASE_HANDLE",
    "AUDIT_VIEW_SUPPORT",
  ]),
  ADMIN: allPermissions,
};

export const adminAppPermissions = new Set<ApplicationPermission>([
  "CONTENT_DRAFT_VIEW",
  "CONTENT_REPORT_HANDLE",
  "SUPPORT_CASE_HANDLE",
  "TAXONOMY_MANAGE",
  "STAFF_ROLE_MANAGE",
  "AUDIT_VIEW_CONTENT",
  "AUDIT_VIEW_SUPPORT",
  "AUDIT_VIEW_ALL",
]);

export function permissionsForRoles(roles: Iterable<ApplicationRole>) {
  const permissions = new Set<ApplicationPermission>();
  for (const role of roles) {
    for (const permission of permissionsByRole[role]) permissions.add(permission);
  }
  return permissions;
}

export function hasAdminAppAccess(roles: Iterable<ApplicationRole>) {
  const permissions = permissionsForRoles(roles);
  return [...adminAppPermissions].some((permission) => permissions.has(permission));
}
