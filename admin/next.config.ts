import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { resolve } from "node:path";

// Local monorepo development keeps shared secrets in the root app env file.
loadEnvConfig(resolve(process.cwd(), ".."), process.env.NODE_ENV !== "production", console, true);

const nextConfig: NextConfig = {
  transpilePackages: ["@draftwise/auth", "@draftwise/content", "@draftwise/ui"],
};

export default nextConfig;
