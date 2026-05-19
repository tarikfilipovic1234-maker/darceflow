import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to this project so a stray lockfile in
  // a parent directory doesn't confuse the dev server.
  turbopack: {
    root: path.resolve(),
  },
  // Phase 7 will add Vercel Blob / video host domains to `images.remotePatterns`.
  // Phase 8 may add `serverExternalPackages: ["@prisma/client"]` if cold-start
  // bundling complains about the Prisma adapter.
};

export default nextConfig;
