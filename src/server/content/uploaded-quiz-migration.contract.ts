import { z } from "zod";

import {
  createLessonDraftSchema,
  type CreateLessonDraftInput,
} from "./content.contract";
import { uploadedQuizTypes } from "@/server/learning/learning-item.schema";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/iu, "Invalid object ID");

const migratedLessonSchema = createLessonDraftSchema.omit({
  primarySkill: true,
  lessonType: true,
  exercises: true,
});

export const uploadedQuizMigrationManifestSchema = z.object({
  actorUserId: objectIdSchema,
  groups: z.array(z.object({
    source: z.object({
      ownerUserId: objectIdSchema,
      quizType: z.enum(uploadedQuizTypes),
      topicText: z.string().trim().min(1).max(200),
      expectedSourceHash: z.string().regex(/^[a-f\d]{64}$/iu, "Invalid source hash"),
    }),
    approvedForPublicDraft: z.literal(true),
    rightsConfirmed: z.literal(true),
    lesson: migratedLessonSchema,
  })).min(1).max(500),
});

type MigratedLessonInput = Omit<
  CreateLessonDraftInput,
  "primarySkill" | "lessonType" | "exercises"
>;

export type UploadedQuizMigrationManifest = {
  actorUserId: string;
  groups: Array<{
    source: {
      ownerUserId: string;
      quizType: (typeof uploadedQuizTypes)[number];
      topicText: string;
      expectedSourceHash: string;
    };
    approvedForPublicDraft: true;
    rightsConfirmed: true;
    lesson: MigratedLessonInput;
  }>;
};
export type UploadedQuizMigrationGroup = UploadedQuizMigrationManifest["groups"][number];
