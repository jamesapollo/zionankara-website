import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { notFound, permanentRedirect } from "next/navigation";
import { ErpError, erpGet } from "./client";
import type {
  CategoryDetail,
  CategoryNode,
  ErpRedirect,
  NavItem,
  Paginated,
  ProductDetail,
  ProductFilters,
  ProductListItem,
} from "./types";

/*
 * The Next.js docs do not say whether notFound()/permanentRedirect() may be called inside a
 * `'use cache'` scope, so cached fetchers return a discriminated result and the exported,
 * uncached wrappers below call notFound()/permanentRedirect().
 *
 * Every cached read: ~5 minutes, client IP 0.0.0.0 (erpGet default), ERP_STOREFRONT_HOST host.
 * Errors other than 404 are thrown (and so never cached) for the nearest error boundary.
 */

type Found<T> = { kind: "found"; data: T };
type Moved = { kind: "moved"; slug: string };
type Missing = { kind: "missing" };
/** The ERP rejected the query (422), e.g. an option value of another store. Cached as a value so Next.js does not report it as a cache error. */
type Invalid = { kind: "invalid" };
type Lookup<T> = Found<T> | Moved | Missing | Invalid;

export type ListParams = {
  category?: string;
  q?: string;
  sort?: string;
  page?: number;
  per_page?: number;
  featured?: boolean;
  option_values?: number[];
  min_price?: string;
  max_price?: string;
};

export type FilterParams = Pick<ListParams, "category" | "q" | "featured">;

function isRedirect(x: unknown): x is ErpRedirect {
  return typeof x === "object" && x !== null && "redirect" in x;
}

function qs(params: Record<string, string | number | boolean | number[] | undefined>): string {
  const sp = new URLSearchParams();
  for (const key of Object.keys(params).sort()) {
    const v = params[key];
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    if (v === false && key === "featured") continue;
    sp.set(key, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** GET for endpoints that never return a redirect hint. */
async function read<T>(path: string): Promise<T> {
  const res = await erpGet<T>(path);
  if (isRedirect(res)) throw new ErpError("Unexpected redirect from ERP", 200);
  return res;
}

async function lookup<T>(path: string): Promise<Lookup<T>> {
  try {
    const res = await erpGet<{ data: T }>(path);
    if (isRedirect(res)) return { kind: "moved", slug: res.redirect.slug };
    return { kind: "found", data: res.data };
  } catch (e) {
    if (e instanceof ErpError && e.status === 404 && e.kind === "http") return { kind: "missing" };
    throw e;
  }
}

function resolve<T>(result: Lookup<T>, routeFor: (slug: string) => string): T {
  if (result.kind === "found") return result.data;
  if (result.kind === "moved") permanentRedirect(routeFor(result.slug));
  if (result.kind === "invalid") throw new ErpError("ERP rejected the query", 422);
  notFound();
}

/** Route a renamed slug redirects to. */
export const categoryHref = (slug: string) => `/collections/${encodeURIComponent(slug)}`;
export const productHref = (slug: string) => `/products/${encodeURIComponent(slug)}`;

// --- cached fetchers -------------------------------------------------------

export async function getCategoryNav(): Promise<NavItem[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("category-nav");
  return (await read<{ data: NavItem[] }>("/api/v1/storefront/category-nav")).data;
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("category-nav", "categories");
  return (await read<{ data: CategoryNode[] }>("/api/v1/storefront/categories")).data;
}

async function fetchCategory(slug: string): Promise<Lookup<CategoryDetail>> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag(`category:${slug}`);
  return lookup<CategoryDetail>(`/api/v1/storefront/categories/${encodeURIComponent(slug)}`);
}

async function fetchProducts(params: ListParams): Promise<Lookup<Paginated<ProductListItem>>> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("products", ...(params.category ? [`category:${params.category}`] : []));
  try {
    return { kind: "found", data: await read<Paginated<ProductListItem>>(`/api/v1/storefront/products${qs(params)}`) };
  } catch (e) {
    if (e instanceof ErpError && e.status === 404 && e.kind === "http") return { kind: "missing" };
    if (e instanceof ErpError && e.status === 422) return { kind: "invalid" };
    throw e;
  }
}

async function fetchFilters(params: FilterParams): Promise<Lookup<ProductFilters>> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("products", ...(params.category ? [`category:${params.category}`] : []));
  try {
    return { kind: "found", data: await read<ProductFilters>(`/api/v1/storefront/product-filters${qs(params)}`) };
  } catch (e) {
    if (e instanceof ErpError && e.status === 404 && e.kind === "http") return { kind: "missing" };
    throw e;
  }
}

async function fetchProduct(slug: string): Promise<Lookup<ProductDetail>> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag(`product:${slug}`);
  return lookup<ProductDetail>(`/api/v1/storefront/products/${encodeURIComponent(slug)}`);
}

// --- uncached wrappers: 404 -> notFound(), {redirect} -> permanentRedirect() ----------

export async function getCategory(slug: string): Promise<CategoryDetail> {
  return resolve(await fetchCategory(slug), categoryHref);
}

export async function listProducts(params: ListParams = {}): Promise<Paginated<ProductListItem>> {
  return resolve(await fetchProducts(params), categoryHref);
}

export async function getProductFilters(params: FilterParams = {}): Promise<ProductFilters> {
  return resolve(await fetchFilters(params), categoryHref);
}

export async function getProduct(slug: string): Promise<ProductDetail> {
  return resolve(await fetchProduct(slug), productHref);
}

/** Like listProducts, but a missing category yields null instead of notFound(). */
export async function listProductsOrNull(params: ListParams = {}): Promise<Paginated<ProductListItem> | null> {
  const res = await fetchProducts(params);
  if (res.kind === "invalid") throw new ErpError("ERP rejected the query", 422);
  return res.kind === "found" ? res.data : null;
}
