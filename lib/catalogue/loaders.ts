import "server-only";
import { connection } from "next/server";
import { getCategory, getCategoryNav, getCategoryTree, getProductFilters, listProducts, listProductsOrNull } from "@/lib/erp/queries";
import { cardFromErp, orderSections, sectionsFromResults } from "./map";
import { sanitizeListing, toErpParams, type Listing, type RawParams } from "./params";
import type { CategoryView, CollectionsView } from "./types";

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
