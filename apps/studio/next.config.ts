import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@refinery/ui", "@refinery/core"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
