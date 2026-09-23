import "server-only";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function getDatabaseEnv() {
  return {
    databaseName: process.env.MONGODB_DB ?? "english_study",
    uri: required("MONGODB_URI"),
  };
}

export function isIdentityPolicyReady() {
  return process.env.NODE_ENV !== "production"
    || process.env.ADMIN_IDENTITY_POLICY_CONFIRMED === "true";
}
