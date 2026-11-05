import type { Product } from "@/lib/catalog";
import type { CategoryKind, CategoryNode, NavItem, Price, ProductListItem } from "@/lib/erp/types";
import type { CardProduct, CollectionSectionView, CollectionTile } from "./types";

const NEW_DAYS = 30;

export function cardFromErp(item: ProductListItem, now = new Date()): CardProduct {
  const published = item.published_at ? new Date(item.published_at).getTime() : NaN;
  return {
    slug: item.slug,
    name: item.title,
    image: item.main_image
      ? {
          url: item.main_image.url,
          alt: item.main_image.alt_text || item.title,
          width: item.main_image.width,
          height: item.main_image.height,
        }
      : null,
    price: item.price,
    isNew: Number.isFinite(published) && now.getTime() - published < NEW_DAYS * 86_400_000,
    note: item.short_description ?? undefined,
  };
}

function kesPrice(priceKes: number, wasKes?: number): Price {
  const money = (n: number) => ({ amount: n.toFixed(2), currency: "KES" });
  return {
    original: money(wasKes ?? priceKes),
    current: money(priceKes),
    saving: wasKes ? money(wasKes - priceKes) : null,
    on_offer: !!wasKes,
    offer_ends_at: null,
  };
}

/** Local sample product in the shared card shape (prices are KES). */
export function cardFromLocal(product: Product): CardProduct {
  return {
    slug: product.slug,
    name: product.name,
    image: { url: product.image, alt: product.name, width: 800, height: 1000 },
    price: kesPrice(product.priceKes, product.wasKes),
    isNew: !!product.isNew,
    note: product.note,
  };
}

/** Section order on /collections: nav order first, then the remaining visible top-level categories. */
export function orderSections(nav: NavItem[], tree: CategoryNode[]): NavItem[] {
  const seen = new Set<string>();
  const out: NavItem[] = [];
  for (const c of [...nav, ...tree]) {
    if (seen.has(c.slug)) continue;
    seen.add(c.slug);
    out.push({ slug: c.slug, name: c.name, kind: c.kind });
  }
  return out;
}

/** Page heading: standard categories read "Ankara <em>gowns</em>"; special ones accent their last word. */
export function titleParts(name: string, kind: CategoryKind): { lead: string; accent: string } {
  if (kind === "standard") return { lead: "Ankara", accent: name.toLowerCase() };
  const words = name.trim().split(/\s+/);
  const accent = words.pop() ?? name;
  return { lead: words.join(" "), accent };
}

/** Page numbers to show, with "gap" where a run is elided. */
export function pageWindow(current: number, count: number): (number | "gap")[] {
  const keep = new Set([1, count, current - 1, current, current + 1].filter((n) => n >= 1 && n <= count));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    const prev = sorted[i - 1];
    if (i > 0 && n - prev === 2) out.push(prev + 1);
    else if (i > 0 && n - prev > 2) out.push("gap");
    out.push(n);
  });
  return out;
}

/** Sections for sub-categories, keeping their order and skipping any with no products (or no result). */
export function sectionsFromResults(
  categories: { slug: string; name: string }[],
  results: (ProductListItem[] | null)[],
  now = new Date(),
): CollectionSectionView[] {
  return categories.flatMap((c, i) => {
    const items = results[i] ?? [];
    return items.length ? [{ slug: c.slug, name: c.name, kind: "standard" as const, products: items.map((p) => cardFromErp(p, now)) }] : [];
  });
}

const RECOMMENDATIONS = 4;
const SIGNATURE_PIECES = 6;

/** Recommendations: the newest products of the product's category, minus the product itself. */
export function recommendationsFrom(items: ProductListItem[], excludeSlug: string, now = new Date()): CardProduct[] {
  return items
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, RECOMMENDATIONS)
    .map((p) => cardFromErp(p, now));
}

/** Home "Signature pieces": the featured six, or the newest six while fewer than six are featured. */
export function signatureFrom(featured: ProductListItem[], newest: ProductListItem[], now = new Date()): CardProduct[] {
  const source = featured.length >= SIGNATURE_PIECES ? featured : newest;
  return source.slice(0, SIGNATURE_PIECES).map((p) => cardFromErp(p, now));
}

/** Home "Best collections": standard top-level categories that have products, pictured by their newest product. */
export function collectionTiles(categories: CategoryNode[], newest: (ProductListItem | null)[]): CollectionTile[] {
  return categories.flatMap((c, i) => {
    const product = newest[i];
    if (c.kind !== "standard" || !product) return [];
    return [{ slug: c.slug, name: c.name, image: cardFromErp(product).image }];
  });
}
