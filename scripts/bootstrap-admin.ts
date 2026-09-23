import { loadEnvConfig } from "@next/env";
import { hashAdminPassword } from "@draftwise/auth/admin-password";
import { MongoClient, ObjectId } from "mongodb";
import { z } from "zod";

loadEnvConfig(process.cwd());

const envSchema = z.object({
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(1),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1).default("english_study"),
});

function argumentValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const username = z.string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9._-]+$/u, "Username chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.")
    .parse(argumentValue("--username")?.toLocaleLowerCase("en"));
  const email = z.string().trim().email().parse(argumentValue("--email")).toLocaleLowerCase("en");
  const name = z.string().trim().min(2).max(120).parse(argumentValue("--name") ?? "Draftwise Admin");
  const reason = z.string().trim().min(3).max(2_000).parse(argumentValue("--reason"));
  if (!process.argv.includes("--confirm-bootstrap-admin")) {
    throw new Error("Bootstrap requires --confirm-bootstrap-admin.");
  }

  const env = envSchema.parse(process.env);
  const passwordHash = await hashAdminPassword(env.ADMIN_BOOTSTRAP_PASSWORD);
  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  const database = client.db(env.MONGODB_DB);
  const session = client.startSession();

  try {
    await database.collection("admin_credentials").createIndex(
      { username: 1 },
      { name: "unique_admin_username", unique: true },
    );
    await database.collection("admin_credentials").createIndex(
      { userId: 1 },
      { name: "unique_admin_credential_user", unique: true },
    );

    const result = await session.withTransaction(async () => {
      const now = new Date();
      let user = await database.collection("users").findOne(
        { email },
        { projection: { _id: 1, name: 1 }, session },
      );
      if (!user) {
        const userId = new ObjectId();
        await database.collection("users").insertOne({
          _id: userId,
          name,
          email,
          emailVerified: now,
          image: null,
          createdAt: now,
          updatedAt: now,
        }, { session });
        user = { _id: userId, name };
      }

      const activeAdmin = await database.collection("staff_role_assignments").findOne(
        { status: "ACTIVE", roles: "ADMIN" },
        { session },
      );
      if (activeAdmin && !activeAdmin.userId.equals(user._id)) {
        throw new Error("An active Admin already exists; use the protected staff management flow.");
      }

      const usernameOwner = await database.collection("admin_credentials").findOne(
        { username, userId: { $ne: user._id } },
        { projection: { _id: 1 }, session },
      );
      if (usernameOwner) throw new Error("Username is already assigned to another staff account.");

      const current = await database.collection("staff_role_assignments").findOne(
        { userId: user._id },
        { session },
      );
      const previousRoles = current?.status === "ACTIVE" && Array.isArray(current.roles)
        ? current.roles
        : [];
      const nextRoles = [...new Set([...previousRoles, "ADMIN"])] as string[];

      await database.collection("staff_role_assignments").updateOne(
        { userId: user._id },
        {
          $set: {
            roles: nextRoles,
            status: "ACTIVE",
            reason,
            grantedBy: user._id,
            revokedBy: null,
            revokedAt: null,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, session },
      );

      if (!previousRoles.includes("ADMIN")) {
        await database.collection("staff_role_events").insertOne({
          targetUserId: user._id,
          actorUserId: user._id,
          eventType: "BOOTSTRAPPED",
          previousRoles,
          nextRoles,
          reason,
          occurredAt: now,
          createdAt: now,
          updatedAt: now,
        }, { session });
      }

      const credentialResult = await database.collection("admin_credentials").updateOne(
        { userId: user._id },
        {
          $set: {
            username,
            ...passwordHash,
            status: "ACTIVE",
            failedAttempts: 0,
            lockUntil: null,
            passwordUpdatedAt: now,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
            lastLoginAt: null,
          },
        },
        { upsert: true, session },
      );

      await database.collection("admin_security_events").insertOne({
        actorUserId: user._id,
        targetUserId: user._id,
        eventType: credentialResult.upsertedCount === 1 ? "CREDENTIAL_CREATED" : "PASSWORD_RESET",
        reason,
        occurredAt: now,
        createdAt: now,
      }, { session });

      return {
        bootstrapped: !previousRoles.includes("ADMIN"),
        credentialCreated: credentialResult.upsertedCount === 1,
        email,
        roles: nextRoles,
        username,
      };
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await session.endSession();
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
