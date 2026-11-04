import type { ListParams } from "@/lib/erp/queries";

/** Products per page on a category page / search (the ERP allows up to 48). */
export const PER_PAGE = 12;
export const MAX_PAGE = 1000;
const MAX_OPTION_VALUES = 20;

export const SORTS = ["newest", "price", "-price", "best_offer"] as const;
export type SortValue = (typeof SORTS)[number];

/** Shopper-controlled listing state, already safe to send to the ERP. */
export type Listing = {
  q?: string;
  sort: SortValue;
  page: number;
  optionValues: number[];
  minPrice?: string;
  maxPrice?: string;
};

export type RawParams = Record<string, string | string[] | undefined>;

const PRICE = /^\d+(\.\d{1,2})?$/;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Turns hand-editable URL params into a Listing the ERP will accept, so a bad URL never
 * becomes an ERP 422 (and so an error page). Anything invalid is dropped.
 */
export function sanitizeListing(raw: RawParams): Listing {
  const q = first(raw.q)?.trim();
  const sort = first(raw.sort);
  const pageText = first(raw.page);
  const page = pageText && /^\d+$/.test(pageText) ? Math.min(MAX_PAGE, Math.max(1, Number(pageText))) : 1;

  const ids = [raw.option_values ?? []]
    .flat()
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter((v) => /^\d{1,9}$/.test(v))
    .map(Number);
  const optionValues = [...new Set(ids)].slice(0, MAX_OPTION_VALUES);

  const min = first(raw.min_price)?.trim();
  const max = first(raw.max_price)?.trim();
  const minPrice = min && PRICE.test(min) ? min : undefined;
  const maxPrice = max && PRICE.test(max) && (minPrice === undefined || Number(max) >= Number(minPrice)) ? max : undefined;

  const listing: Listing = {
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as SortValue) : "newest",
    page,
    optionValues,
  };
  if (q && q.length >= 2 && q.length <= 100) listing.q = q;
  if (minPrice) listing.minPrice = minPrice;
  if (maxPrice) listing.maxPrice = maxPrice;
  return listing;
}

export function toErpParams(listing: Listing, category?: string, perPage = PER_PAGE): ListParams {
  return {
    category,
    q: listing.q,
    sort: listing.sort,
    page: listing.page,
    per_page: perPage,
    option_values: listing.optionValues,
    min_price: listing.minPrice,
    max_price: listing.maxPrice,
  };
}

/** Link to `path` with the listing (plus overrides) in the query string; defaults are omitted. */
export function listingHref(path: string, listing: Listing, overrides: Partial<Listing>): string {
  const l = { ...listing, ...overrides };
  const sp = new URLSearchParams();
  if (l.q) sp.set("q", l.q);
  if (l.sort !== "newest") sp.set("sort", l.sort);
  if (l.optionValues.length) sp.set("option_values", l.optionValues.join(","));
  if (l.minPrice) sp.set("min_price", l.minPrice);
  if (l.maxPrice) sp.set("max_price", l.maxPrice);
  if (l.page > 1) sp.set("page", String(l.page));
  const s = sp.toString();
  return s ? `${path}?${s}` : path;
}
