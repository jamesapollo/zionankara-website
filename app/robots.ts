import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/*
 * /bag and /checkout are deliberately not disallowed: they carry `robots: { index: false }`,
 * and Google can only see that noindex if it is allowed to crawl the page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
