import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { catalogueSource } from "@/lib/catalogue-source";
import { categories } from "@/lib/catalog";
import { erpGet } from "./client";
import { categoryHref } from "./queries";
import type { ContactDetails, ErpStore, NavItem } from "./types";

export type CategoryRowItem = { href: string; label: string; accent?: boolean };

const reported = new Set<string>();

/** Log each failing source once per server process; the header must never break a page. */
function reportOnce(what: string, error: unknown) {
  if (reported.has(what)) return;
  reported.add(what);
  console.warn(`[header] ${what} unavailable, rendering without it:`, error instanceof Error ? error.message : error);
}

/*
 * The header and footer must never fail a render or a build. An error thrown inside a
 * `'use cache'` function is reported by Next.js (and fails prerendering) even when the caller
 * catches it, so the failure is caught INSIDE these cached functions and returned as a value.
 * These call the ERP client directly rather than the cached readers in queries.ts, because an error
 * thrown through a nested cache is reported too. Error class identity across the cache boundary is not relied on. A failed result is cached for
 * the same ~5 minutes (a shorter lifetime makes prerender report cache misses).
 */
async function fetchContact(): Promise<ContactDetails | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("store");
  try {
    return ((await erpGet<{ data: ErpStore }>("/api/v1/storefront/store")) as { data: ErpStore }).data.contact ?? null;
  } catch (error) {
    reportOnce("store contact", error);
    return null;
  }
}

/** Keeps desktop browsing alive when the ERP nav is unavailable (the store may well have categories). */
const COLLECTIONS_ONLY: CategoryRowItem[] = [{ href: "/collections", label: "Collections" }];

async function fetchNav(): Promise<CategoryRowItem[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("category-nav");
  try {
    const items = ((await erpGet<{ data: NavItem[] }>("/api/v1/storefront/category-nav")) as { data: NavItem[] }).data.map((item) => ({
      href: categoryHref(item.slug),
      label: item.name,
      accent: item.kind === "on_sale",
    }));
    // No categories set in the ERP: an empty list hides the row rather than pointing at an empty shop.
    return items;
  } catch (error) {
    reportOnce("category nav", error);
    return COLLECTIONS_ONLY;
  }
}

/** Contact details for the header and footer, or null on any ERP failure. */
export function getContactOrNull(): Promise<ContactDetails | null> {
  return fetchContact();
}

/** Local categories (Sale omitted) under `local`; ERP nav under `erp` (empty hides the row), a single Collections link if the ERP fails. */
export async function getCategoryRowItems(): Promise<CategoryRowItem[]> {
  if (catalogueSource() === "local") return localCategoryRow();
  return fetchNav();
}

export function localCategoryRow(): CategoryRowItem[] {
  return categories.map((c) => ({ href: `/collections/${c.slug}`, label: c.name }));
}

/** Row shown while the header data streams in. */
export function fallbackCategoryRow(): CategoryRowItem[] {
  return catalogueSource() === "local" ? localCategoryRow() : [];
}
