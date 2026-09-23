import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bullmq", "ioredis"],
  transpilePackages: ["@draftwise/auth", "@draftwise/content", "@draftwise/ui"],
};

export default nextConfig;
