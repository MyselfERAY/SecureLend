import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // oracledb is a server-only native-ish package; keep it external so Next
  // doesn't try to bundle it into the server build.
  serverExternalPackages: ["oracledb"],
};

export default nextConfig;
