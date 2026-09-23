import { z } from "zod";

import {
  cefrLevels,
  contentAccessTiers,
  contentAudiences,
  contentLocales,
  lessonTypes,
  primarySkills,
} from "./content.constants";

function upperEnum<const Values extends readonly [string, ...string[]]>(values: Values) {
  return z.preprocess(
    (value) => typeof value === "string" ? value.trim().toUpperCase() : value,
    z.enum(values).optional(),
  );
}

export const publicCatalogQuerySchema = z.object({
  locale: z.preprocess(
    (value) => typeof value === "string" ? value.trim().toLowerCase() : value,
    z.enum(contentLocales).default("en"),
  ),
  q: z.string().trim().min(2).max(100).optional(),
  skill: upperEnum(primarySkills),
  type: upperEnum(lessonTypes),
  level: upperEnum(cefrLevels),
  audience: upperEnum(contentAudiences),
  access: upperEnum(contentAccessTiers),
  category: z.string().trim().min(1).max(120).optional(),
  topic: z.string().trim().min(1).max(120).optional(),
  cursor: z.string().trim().min(1).max(1_000).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const publicDetailQuerySchema = z.object({
  locale: z.preprocess(
    (value) => typeof value === "string" ? value.trim().toLowerCase() : value,
    z.enum(contentLocales).default("en"),
  ),
});

export const publicCollectionQuerySchema = publicDetailQuerySchema.extend({
  cursor: z.string().trim().min(1).max(1_000).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type PublicCatalogQuery = z.infer<typeof publicCatalogQuerySchema>;
export type PublicDetailQuery = z.infer<typeof publicDetailQuerySchema>;
export type PublicCollectionQuery = z.infer<typeof publicCollectionQuerySchema>;
