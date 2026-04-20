import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    COMMIT_REF: process.env.COMMIT_REF ?? "",
  },
};

export default nextConfig;
