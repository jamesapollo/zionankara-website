import Link from "next/link";
import { listingHref, PER_PAGE, SORTS, type Listing } from "@/lib/catalogue/params";
import { pageWindow } from "@/lib/catalogue/map";
import type { CardProduct, FilterView } from "@/lib/catalogue/types";
import { FilterPanel } from "./filter-panel";
import { ProductCard } from "./product-card";
import { SortSelect } from "./sort-select";

const sortLabels: Record<(typeof SORTS)[number], string> = {
  newest: "Newest",
  price: "Price: low to high",
  "-price": "Price: high to low",
  best_offer: "Best offer",
};

const groupTitle = "text-label font-normal uppercase tracking-[0.22em]";

type CategoryResultsProps = {
  /** Path the links and the price form point at. */
  path: string;
  listing: Listing;
  products: CardProduct[];
  total: number;
  page: number;
  pageCount: number;
  /** Omit on search results, which have no filter menu. */
  filters?: FilterView[];
  priceRange?: { min: number; max: number } | null;
};

/** Server-rendered grid with option-value filters, price range, sort and pagination driven by the URL. */
export function CategoryResults({ path, listing, products, total, page, pageCount, filters, priceRange }: CategoryResultsProps) {
  const href = (overrides: Partial<Listing>) => listingHref(path, listing, { page: 1, ...overrides });
  const valueName = new Map(filters?.flatMap((f) => f.values.map((v) => [v.id, `${f.name}: ${v.value}`] as const)));

  const chips = [
    ...listing.optionValues.map((id) => ({
      label: valueName.get(id) ?? `Option ${id}`,
      href: href({ optionValues: listing.optionValues.filter((v) => v !== id) }),
    })),
    ...(listing.minPrice || listing.maxPrice
      ? [
          {
            label: `Price ${listing.minPrice ?? "0"} – ${listing.maxPrice ?? "any"}`,
            href: href({ minPrice: undefined, maxPrice: undefined }),
          },
        ]
      : []),
  ];
  const filtered = chips.length > 0;
  const start = (page - 1) * PER_PAGE;
  const clearHref = href({ optionValues: [], minPrice: undefined, maxPrice: undefined });
  const hasMenu = filters !== undefined;

  return (
    <div className="flex flex-col gap-[clamp(32px,4vw,64px)] lg:flex-row lg:items-start">
      {hasMenu && (
        <FilterPanel activeCount={chips.length}>
          <div className="flex items-baseline justify-between border-b border-ink pb-4">
            <span className="text-small font-medium uppercase tracking-[0.22em]">Filters</span>
            {filtered && (
              <Link href={clearHref} rel="nofollow" className="text-small text-muted underline underline-offset-[3px] hover:text-accent">
                Clear all
              </Link>
            )}
          </div>

          {filters.map((group) => (
            <fieldset key={group.name} className="flex flex-col gap-3.5 border-b border-line pb-7 first-of-type:pt-0">
              <legend className={`${groupTitle} float-left mb-3.5`}>{group.name}</legend>
              <ul className="clear-left flex flex-col gap-3.5">
                {group.values.map((v) => {
                  const on = listing.optionValues.includes(v.id);
                  return (
                    <li key={v.id}>
                      <Link
                        rel="nofollow"
                        href={href({
                          optionValues: on ? listing.optionValues.filter((id) => id !== v.id) : [...listing.optionValues, v.id],
                        })}
                        aria-label={`${v.value}${on ? " (selected)" : ""}`}
                        className="flex items-center justify-between gap-3 text-body"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className={`flex size-4 items-center justify-center border text-[11px] leading-none ${on ? "border-accent bg-accent text-white" : "border-line-strong"}`}
                          >
                            {on ? "✓" : ""}
                          </span>
                          {v.value}
                        </span>
                        <span aria-hidden className="text-small text-subtle">
                          {v.product_count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ))}

          {priceRange && (
            <form action={path} method="get" className="flex flex-col gap-3.5">
              <span className={groupTitle}>Price</span>
              {listing.q && <input type="hidden" name="q" value={listing.q} />}
              {listing.sort !== "newest" && <input type="hidden" name="sort" value={listing.sort} />}
              {listing.optionValues.length > 0 && <input type="hidden" name="option_values" value={listing.optionValues.join(",")} />}
              <div className="flex items-center gap-2.5">
                <input
                  type="number"
                  name="min_price"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  aria-label="Minimum price"
                  placeholder={String(Math.floor(priceRange.min))}
                  defaultValue={listing.minPrice}
                  className="h-(--za-control-sm) w-full min-w-0 border border-line-strong px-3 text-sm"
                />
                <span aria-hidden>–</span>
                <input
                  type="number"
                  name="max_price"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  aria-label="Maximum price"
                  placeholder={String(Math.ceil(priceRange.max))}
                  defaultValue={listing.maxPrice}
                  className="h-(--za-control-sm) w-full min-w-0 border border-line-strong px-3 text-sm"
                />
              </div>
              <button
                type="submit"
                className="h-(--za-control-sm) cursor-pointer border border-ink text-small uppercase tracking-button hover:bg-ink hover:text-white"
              >
                Apply
              </button>
            </form>
          )}
        </FilterPanel>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <span aria-live="polite" className="text-sm text-copy">
            {products.length ? `Showing ${start + 1}–${start + products.length} of ${total} pieces` : "0 pieces"}
          </span>
          <SortSelect
            value={listing.sort}
            options={SORTS.map((s) => ({ value: s, label: sortLabels[s], href: href({ sort: s }) }))}
          />
        </div>

        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip.label}>
                <Link
                  rel="nofollow"
                  href={chip.href}
                  aria-label={`Remove filter: ${chip.label}`}
                  className="flex items-center gap-2.5 bg-tint px-3.5 py-2 text-small hover:bg-accent-soft"
                >
                  {chip.label}
                  <span aria-hidden className="text-body leading-none">
                    ×
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(36px,3.5vw,52px)] xl:grid-cols-3">
            {products.map((product, i) => (
              <ProductCard
                key={product.slug}
                product={product}
                showNewBadge
                eager={i < 3}
                titleClassName="text-[clamp(18px,1.7vw,24px)]"
                sizes="(min-width: 1280px) 330px, 50vw"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 bg-tint px-6 py-24 text-center">
            <span className="font-display text-[32px]">{filtered || page > 1 ? "No pieces match those filters" : "No pieces found"}</span>
            {(filtered || page > 1) && (
              <Link
                rel="nofollow"
                href={clearHref}
                className="bg-ink px-[30px] py-4 text-label uppercase tracking-button text-white hover:bg-accent"
              >
                Clear filters
              </Link>
            )}
          </div>
        )}

        {pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-8">
            {page > 1 ? (
              <Link href={href({ page: page - 1 })} rel="prev nofollow" className="flex h-11 items-center px-[18px] text-label uppercase tracking-[0.2em]">
                ← Prev
              </Link>
            ) : (
              <span aria-hidden className="flex h-11 items-center px-[18px] text-label uppercase tracking-[0.2em] opacity-30">
                ← Prev
              </span>
            )}
            {pageWindow(page, pageCount).map((n, i) =>
              n === "gap" ? (
                <span key={`gap-${i}`} aria-hidden className="px-1 text-subtle">
                  …
                </span>
              ) : (
                <Link
                  key={n}
                  rel="nofollow"
                  href={href({ page: n })}
                  aria-current={n === page ? "page" : undefined}
                  aria-label={`Page ${n}`}
                  className={`flex size-11 items-center justify-center border text-sm ${n === page ? "border-ink bg-ink text-white" : "border-line-strong hover:border-ink"}`}
                >
                  {n}
                </Link>
              ),
            )}
            {page < pageCount ? (
              <Link href={href({ page: page + 1 })} rel="next nofollow" className="flex h-11 items-center px-[18px] text-label uppercase tracking-[0.2em]">
                Next →
              </Link>
            ) : (
              <span aria-hidden className="flex h-11 items-center px-[18px] text-label uppercase tracking-[0.2em] opacity-30">
                Next →
              </span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
