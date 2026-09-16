import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@duckdb/node-api"],
  outputFileTracingExcludes: {
    "/*": ["./data/**"],
  },
};

export default nextConfig;
