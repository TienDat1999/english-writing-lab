import { z } from "zod";

import { taskTypes } from "./submission.schema";

export const createSubmissionSchema = z.object({
  taskType: z.enum(taskTypes),
  questionType: z.string().trim().min(2).max(80),
  promptText: z.string().trim().max(3_000).default(""),
  originalText: z.string().trim().min(50).max(10_000),
  targetBand: z.number().min(0).max(9).multipleOf(0.5).nullable().optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
