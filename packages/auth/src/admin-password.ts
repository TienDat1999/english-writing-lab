import { promisify } from "node:util";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const scryptAsync = promisify(scrypt);
const keyLength = 64;

export type AdminPasswordHash = {
  algorithm: "scrypt-v1";
  digest: string;
  salt: string;
};

export function validateAdminPassword(password: string) {
  const issues: string[] = [];
  if (password.length < 12) issues.push("Password phải có ít nhất 12 ký tự.");
  if (password.length > 256) issues.push("Password không được vượt quá 256 ký tự.");
  if (!/[a-z]/u.test(password)) issues.push("Password cần ít nhất một chữ thường.");
  if (!/[A-Z]/u.test(password)) issues.push("Password cần ít nhất một chữ hoa.");
  if (!/\d/u.test(password)) issues.push("Password cần ít nhất một chữ số.");
  if (!/[^A-Za-z0-9]/u.test(password)) issues.push("Password cần ít nhất một ký tự đặc biệt.");
  return issues;
}

export async function hashAdminPassword(password: string): Promise<AdminPasswordHash> {
  const issues = validateAdminPassword(password);
  if (issues.length > 0) throw new Error(issues.join(" "));
  const salt = randomBytes(24);
  const derivedKey = await scryptAsync(password, salt, keyLength) as Buffer;
  return {
    algorithm: "scrypt-v1",
    digest: derivedKey.toString("base64"),
    salt: salt.toString("base64"),
  };
}

export async function verifyAdminPassword(
  password: string,
  stored: AdminPasswordHash,
) {
  if (stored.algorithm !== "scrypt-v1" || password.length > 256) return false;
  const salt = Buffer.from(stored.salt, "base64");
  const expected = Buffer.from(stored.digest, "base64");
  if (expected.length !== keyLength) return false;
  const actual = await scryptAsync(password, salt, keyLength) as Buffer;
  return timingSafeEqual(actual, expected);
}
