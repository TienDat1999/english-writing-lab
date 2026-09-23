import { z } from "zod";

import { staffRoles } from "./authorization.constants";

export const setStaffRolesSchema = z.object({
  roles: z.array(z.enum(staffRoles)).min(1).max(staffRoles.length)
    .refine((roles) => new Set(roles).size === roles.length, "Roles must be unique"),
  reason: z.string().trim().min(3).max(2_000),
});

export const revokeStaffRolesSchema = z.object({
  reason: z.string().trim().min(3).max(2_000),
});

export type SetStaffRolesInput = z.infer<typeof setStaffRolesSchema>;
