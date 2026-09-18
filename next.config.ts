import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@duckdb/node-api", "@github/copilot-sdk"],
  outputFileTracingExcludes: {
    "/*": ["./data/**"],
  },
};

export default nextConfig;
