import { z } from "zod";

export const auditHistoryQuerySchema = z.object({
  cursor: z.string().regex(/^[a-f\d]{24}$/iu).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
