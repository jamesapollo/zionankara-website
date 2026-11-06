import type { MetadataRoute } from "next";

/** Pages that exist whatever the catalogue holds. */
export const STATIC_PATHS = ["/", "/about", "/contact", "/collections", "/collections/new-in"] as const;

export type SitemapProduct = { slug: string; updatedAt?: string; image?: string };

/** Absolute sitemap entries for the fixed pages, every collection and every product. */
export function buildSitemap(
  siteUrl: string,
  data: { categorySlugs: string[]; products: SitemapProduct[] },
): MetadataRoute.Sitemap {
  const origin = siteUrl.replace(/\/+$/, "");
  const at = (path: string) => `${origin}${path === "/" ? "" : path}`;
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];
  const add = (entry: MetadataRoute.Sitemap[number]) => {
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    entries.push(entry);
  };

  for (const path of STATIC_PATHS) add({ url: at(path) });
  for (const slug of data.categorySlugs) add({ url: at(`/collections/${encodeURIComponent(slug)}`) });
  for (const p of data.products) {
    add({
      url: at(`/products/${encodeURIComponent(p.slug)}`),
      // Only real ERP dates: a made-up "now" teaches Google to ignore lastmod.
      ...(p.updatedAt ? { lastModified: p.updatedAt } : {}),
      ...(p.image ? { images: [p.image] } : {}),
    });
  }
  return entries;
}

/** Every slug in a category tree, parents before children. */
export function flattenCategorySlugs(nodes: { slug: string; children: { slug: string; children: unknown[] }[] }[]): string[] {
  const out: string[] = [];
  const walk = (list: typeof nodes) => {
    for (const node of list) {
      out.push(node.slug);
      walk(node.children as typeof nodes);
    }
  };
  walk(nodes);
  return out;
}
