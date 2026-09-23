import { readFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { z } from "zod";

import {
  uploadedQuizMigrationManifestSchema,
} from "../src/server/content/uploaded-quiz-migration.contract";
import {
  discoverUploadedQuizGroups,
  migrateUploadedQuizGroups,
} from "../src/server/content/uploaded-quiz-migration";

loadEnvConfig(process.cwd());

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1).default("english_study"),
});

function argumentValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const env = envSchema.parse(process.env);
  const manifestPath = argumentValue("--manifest");
  const apply = process.argv.includes("--apply");
  const reportOnly = process.argv.includes("--report");

  if (!reportOnly && !manifestPath) {
    throw new Error("Use --report or provide --manifest <path>. Dry-run is the default.");
  }
  if (apply && !manifestPath) {
    throw new Error("--apply requires --manifest <path>.");
  }
  if (apply && !process.argv.includes("--confirm-create-drafts")) {
    throw new Error("--apply also requires --confirm-create-drafts.");
  }

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB,
    bufferCommands: false,
  });

  if (reportOnly && !manifestPath) {
    const groups = await discoverUploadedQuizGroups();
    const summary = groups.reduce((result, group) => ({
      groupCount: result.groupCount + 1,
      itemCount: result.itemCount + group.itemCount,
      completedCount: result.completedCount + group.completedCount,
      legacyItemCount: result.legacyItemCount + group.legacyItemCount,
      missingApplicationPromptCount:
        result.missingApplicationPromptCount + group.missingApplicationPromptCount,
    }), {
      groupCount: 0,
      itemCount: 0,
      completedCount: 0,
      legacyItemCount: 0,
      missingApplicationPromptCount: 0,
    });
    console.log(JSON.stringify({
      mode: "REPORT",
      summary,
      ...(process.argv.includes("--summary-only") ? {} : { groups }),
    }, null, 2));
    return;
  }

  const absoluteManifestPath = path.resolve(process.cwd(), manifestPath as string);
  const manifest = uploadedQuizMigrationManifestSchema.parse(
    JSON.parse(await readFile(absoluteManifestPath, "utf8")),
  );
  const result = await migrateUploadedQuizGroups(manifest, { dryRun: !apply });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
