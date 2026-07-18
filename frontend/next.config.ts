import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@resvg/resvg-js"],
  // @ts-expect-error — disables Turbopack in dev (prevents panic on Next.js 16)
  experimental: { turbopack: false },
};

export default nextConfig;
