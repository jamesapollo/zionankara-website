import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { categories, products } from "@/lib/catalog";
import { catalogueSource } from "@/lib/catalogue-source";
import { getCategoryTree, listProducts } from "@/lib/erp/queries";
import type { ProductListItem } from "@/lib/erp/types";
import { buildSitemap, flattenCategorySlugs } from "@/lib/seo/sitemap";
import { siteUrl } from "@/lib/site-url";

const PAGE_SIZE = 100;

/** Every published product, page by page (each page is a cached, "products"-tagged ERP read). */
async function allErpProducts(): Promise<ProductListItem[]> {
  const first = await listProducts({ sort: "newest", per_page: PAGE_SIZE });
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.meta.last_page - 1) }, (_, i) =>
      listProducts({ sort: "newest", per_page: PAGE_SIZE, page: i + 2 }),
    ),
  );
  return [first, ...rest].flatMap((page) => page.data);
}

/*
 * ERP source: built at request time (never during a build), from the same cached readers as the pages,
 * so a signed /api/revalidate "product" or "category" notice refreshes it too.
 * An ERP failure throws (500) rather than serving a sitemap with every product missing; Google retries.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (catalogueSource() !== "erp") {
    return buildSitemap(siteUrl, {
      categorySlugs: categories.map((c) => c.slug),
      products: products.map((p) => ({ slug: p.slug, image: `${siteUrl}${p.image}` })),
    });
  }

  await connection();
  const [tree, items] = await Promise.all([getCategoryTree(), allErpProducts()]);
  return buildSitemap(siteUrl, {
    categorySlugs: flattenCategorySlugs(tree),
    products: items.map((p) => ({ slug: p.slug, updatedAt: p.updated_at, image: p.main_image?.url })),
  });
}
