import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import {
  getCategory,
  getCategoryNav,
  getCategoryTree,
  getProduct,
  getProductFilters,
  listProducts,
  listProductsOrNull,
} from "@/lib/erp/queries";
import { cardFromErp, collectionTiles, orderSections, recommendationsFrom, sectionsFromResults, signatureFrom } from "./map";
import { sanitizeListing, toErpParams, type Listing, type RawParams } from "./params";
import type { CategoryView, CollectionsView, HomeView, ProductPageView } from "./types";

const SECTION_SIZE = 4;

/** The ERP rejects option values of another store with 422; a hand-edited URL should just lose its filters. */
async function listWithFallback(listing: Listing, category: string | undefined) {
  try {
    return { res: await listProducts(toErpParams(listing, category)), listing };
  } catch (e) {
    if ((e as { status?: unknown } | null)?.status === 422) {
      const plain: Listing = { ...listing, optionValues: [], minPrice: undefined, maxPrice: undefined };
      return { res: await listProducts(toErpParams(plain, category)), listing: plain };
    }
    throw e;
  }
}

/** /collections: a section per category, or a flat result list when a valid `?q=` is present. */
export async function loadCollections(rawParams: RawParams): Promise<CollectionsView> {
  await connection(); // request time only: "new" badges depend on the current date and the ERP is never read at build time
  const listing = sanitizeListing(rawParams);

  if (listing.q) {
    const { res } = await listWithFallback({ ...listing, optionValues: [], minPrice: undefined, maxPrice: undefined }, undefined);
    return {
      sections: [],
      search: {
        q: listing.q,
        products: res.data.map((p) => cardFromErp(p)),
        total: res.meta.total,
        page: res.meta.current_page,
        pageCount: Math.max(1, res.meta.last_page),
      },
    };
  }

  const [nav, tree] = await Promise.all([getCategoryNav(), getCategoryTree()]);
  const sections = await Promise.all(
    orderSections(nav, tree).map(async (c) => {
      const res = await listProductsOrNull({ category: c.slug, per_page: SECTION_SIZE });
      return { ...c, products: (res?.data ?? []).map((p) => cardFromErp(p)) };
    }),
  );
  return { sections: sections.filter((s) => s.products.length > 0), search: null };
}

/** /collections/[category]: 404s and renamed slugs are handled by the ERP readers (notFound / permanentRedirect). */
export async function loadCategoryPage(slug: string, rawParams: RawParams): Promise<{ view: CategoryView; listing: Listing }> {
  await connection();
  const listing = sanitizeListing(rawParams);
  const category = await getCategory(slug);
  const [{ res, listing: effective }, filters, subResults] = await Promise.all([
    listWithFallback(listing, category.slug),
    getProductFilters({ category: category.slug, q: listing.q }),
    Promise.all(category.children.map((c) => listProductsOrNull({ category: c.slug, per_page: SECTION_SIZE }))),
  ]);

  const range = filters.price_range;
  return {
    listing: effective,
    view: {
      category: {
        slug: category.slug,
        name: category.name,
        kind: category.kind,
        description: category.description,
        parent: category.parent,
        children: category.children,
      },
      subSections: sectionsFromResults(category.children, subResults.map((r) => r?.data ?? null)),
      products: res.data.map((p) => cardFromErp(p)),
      total: res.meta.total,
      page: res.meta.current_page,
      pageCount: Math.max(1, res.meta.last_page),
      filters: filters.data,
      priceRange: range
        ? { min: Number(range.min.amount), max: Number(range.max.amount), currency: range.min.currency }
        : null,
    },
  };
}

/** Slug limit of the ERP; longer slugs cannot exist. */
export const MAX_PRODUCT_SLUG = 120;

/**
 * /products/[slug]. A missing product 404s and a renamed slug redirects (notFound / permanentRedirect from the ERP reader).
 * Recommendations are secondary: if they cannot be read the page still renders without them.
 */
export async function loadProductPage(slug: string): Promise<ProductPageView> {
  await connection();
  const product = await getProduct(slug);
  const category = product.categories[0];
  let recommendations: ProductPageView["recommendations"] = [];
  if (category) {
    try {
      // One extra so the product itself can be dropped.
      const res = await listProductsOrNull({ category: category.slug, sort: "newest", per_page: 5 });
      recommendations = recommendationsFrom(res?.data ?? [], product.slug);
    } catch {
      recommendations = [];
    }
  }
  return { product, recommendations };
}

/** Home sections from the ERP. Deduplicated per request so each section can read it behind its own Suspense. */
export const loadHome = cache(async (): Promise<HomeView> => {
  await connection();
  const [tree, newest, featured] = await Promise.all([
    getCategoryTree(),
    listProducts({ sort: "newest", per_page: 4 }),
    listProducts({ featured: true, per_page: 6 }),
  ]);
  const standard = tree.filter((c) => c.kind === "standard");
  const [pictures, fallback] = await Promise.all([
    Promise.all(standard.map((c) => listProductsOrNull({ category: c.slug, sort: "newest", per_page: 1 }))),
    featured.data.length >= 6 ? Promise.resolve(null) : listProducts({ sort: "newest", per_page: 6 }),
  ]);
  return {
    collections: collectionTiles(
      standard,
      pictures.map((r) => r?.data[0] ?? null),
    ),
    newArrivals: newest.data.map((p) => cardFromErp(p)),
    signature: signatureFrom(featured.data, fallback?.data ?? []),
  };
});
