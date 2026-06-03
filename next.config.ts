import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to this project so a stray lockfile in
  // a parent directory doesn't confuse the dev server.
  turbopack: {
    root: path.resolve(),
  },
  images: {
    remotePatterns: [
      // YouTube thumbnails for technique cards.
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      // Vimeo thumbnails (if we ever wire up oEmbed lookups).
      { protocol: "https", hostname: "i.vimeocdn.com" },
      // Vercel Blob storage — covers the eventual upload path.
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
