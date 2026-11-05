import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/** Production product images. */
const MEDIA_HOST = new URL("https://media.zionankara.co.ke/**");
/** The local ERP's storage, allowed only under `next dev`. */
const LOCAL_ERP_MEDIA = new URL("http://localhost:8000/**");

export default function nextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    experimental: {
      agentFeedback: true,
    },
    cacheComponents: true,
    images: {
      remotePatterns: isDev ? [MEDIA_HOST, LOCAL_ERP_MEDIA] : [MEDIA_HOST],
      // localhost resolves to a private IP, which the optimizer refuses by default (SSRF guard). Dev only.
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
