import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/** Used when ERP_MEDIA_URL is unset. */
const DEFAULT_MEDIA_URL = "https://media.zionankara.com";

/** Image hosts from ERP_MEDIA_URL (comma-separated base URLs, matching the ERP's PUBLIC_DISK_URL). */
function mediaPatterns(): URL[] {
  const urls = (process.env.ERP_MEDIA_URL?.trim() || DEFAULT_MEDIA_URL)
    .split(",")
    .map((u) => u.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return urls.map((u) => new URL(`${u}/**`));
}

export default function nextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    experimental: {
      agentFeedback: true,
    },
    cacheComponents: true,
    images: {
      remotePatterns: mediaPatterns(),
      // A localhost image host resolves to a private IP, which the optimizer refuses by default (SSRF guard).
      // Allowed under `next dev` only, never in a build.
      dangerouslyAllowLocalIP: isDev,
    },
    partialPrefetching: true,
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },
  };
}
