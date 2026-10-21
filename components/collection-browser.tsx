"use client";

import { useRef, useState } from "react";
import { categories, occasions, printColours, products, sizes, type Occasion, type PrintColour } from "@/lib/catalog";
import { useFormatPrice } from "@/lib/store";
import { ProductCard } from "./product-card";

const PER_PAGE = 9;

type Sort = "featured" | "new" | "low" | "high";
const sortLabels: Record<Sort, string> = {
  featured: "Featured",
  new: "Newest",
  low: "Price: low to high",
  high: "Price: high to low",
};

const priceBands = [
  { id: "all", min: 0, max: Infinity },
  { id: "under", min: 0, max: 8000 },
  { id: "mid", min: 8000, max: 14000 },
  { id: "over", min: 14000, max: Infinity },
] as const;
type PriceBand = (typeof priceBands)[number]["id"];

type Filters = {
  categories: string[];
  sizes: string[];
  colours: PrintColour[];
  occasions: Occasion[];
  band: PriceBand;
};
const noFilters: Filters = { categories: [], sizes: [], colours: [], occasions: [], band: "all" };

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

const groupTitle = "text-label font-normal uppercase tracking-[0.22em]";

type CollectionBrowserProps = {
  initialCategory?: string;
  initialSort?: Sort;
};

export function CollectionBrowser({ initialCategory, initialSort = "featured" }: CollectionBrowserProps) {
  const format = useFormatPrice();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<Filters>({
    ...noFilters,
    categories: initialCategory ? [initialCategory] : [],
  });
  const [sort, setSort] = useState<Sort>(initialSort);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const updateFilters = (update: (f: Filters) => Filters) => {
    setFilters(update);
    setPage(1);
  };

  const band = priceBands.find((b) => b.id === filters.band)!;
  let results = products.filter(
    (p) =>
      (!filters.categories.length || filters.categories.includes(p.categorySlug)) &&
      (!filters.sizes.length || filters.sizes.some((size) => p.sizes.includes(size))) &&
      (!filters.colours.length || filters.colours.includes(p.colour)) &&
      (!filters.occasions.length || filters.occasions.includes(p.occasion)) &&
      p.priceKes >= band.min &&
      p.priceKes < band.max,
  );
  if (sort === "low") results = results.toSorted((a, b) => a.priceKes - b.priceKes);
  if (sort === "high") results = results.toSorted((a, b) => b.priceKes - a.priceKes);
  if (sort === "new") results = results.toSorted((a, b) => Number(!!b.isNew) - Number(!!a.isNew));

  const pageCount = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = results.slice(start, start + PER_PAGE);

  const bandLabels: Record<PriceBand, string> = {
    all: "All prices",
    under: `Under ${format(8000)}`,
    mid: `${format(8000)} – ${format(14000)}`,
    over: `Over ${format(14000)}`,
  };

  const chips = [
    ...filters.categories.map((slug) => ({
      label: categories.find((c) => c.slug === slug)?.name ?? slug,
      remove: () => updateFilters((f) => ({ ...f, categories: toggle(f.categories, slug) })),
    })),
    ...filters.sizes.map((size) => ({
      label: `UK ${size}`,
      remove: () => updateFilters((f) => ({ ...f, sizes: toggle(f.sizes, size) })),
    })),
    ...filters.colours.map((id) => ({
      label: printColours.find((c) => c.id === id)!.label,
      remove: () => updateFilters((f) => ({ ...f, colours: toggle(f.colours, id) })),
    })),
    ...filters.occasions.map((occasion) => ({
      label: occasion,
      remove: () => updateFilters((f) => ({ ...f, occasions: toggle(f.occasions, occasion) })),
    })),
    ...(filters.band === "all"
      ? []
      : [{ label: bandLabels[filters.band], remove: () => updateFilters((f) => ({ ...f, band: "all" })) }]),
  ];

  const goToPage = (n: number) => {
    setPage(n);
    const top = resultsRef.current?.getBoundingClientRect().top;
    if (top !== undefined) window.scrollTo({ top: top + window.scrollY - 96, behavior: "smooth" });
  };

  const clearAll = () => updateFilters(() => noFilters);
  const categoryOptions = categories
    .map((c) => ({ ...c, count: products.filter((p) => p.categorySlug === c.slug).length }))
    .filter((c) => c.count > 0);

  return (
    <div className="flex flex-col gap-[clamp(32px,4vw,64px)] lg:flex-row lg:items-start">
      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        aria-expanded={showFilters}
        aria-controls="collection-filters"
        className="flex h-(--za-control-sm) cursor-pointer items-center justify-center border border-ink text-small uppercase tracking-button lg:hidden"
      >
        {showFilters ? "Hide filters" : `Filters${chips.length ? ` (${chips.length})` : ""}`}
      </button>

      <aside
        id="collection-filters"
        className={`${showFilters ? "flex" : "hidden"} flex-col gap-8 lg:sticky lg:top-24 lg:flex lg:w-[260px] lg:shrink-0`}
      >
        <div className="flex items-baseline justify-between border-b border-ink pb-4">
          <span className="text-small font-medium uppercase tracking-[0.22em]">Filters</span>
          <button type="button" onClick={clearAll} className="cursor-pointer text-small text-muted underline underline-offset-[3px] hover:text-accent">
            Clear all
          </button>
        </div>

        <fieldset className="flex flex-col gap-3.5">
          <legend className={`${groupTitle} mb-3.5`}>Category</legend>
          {categoryOptions.map((c) => (
            <label key={c.slug} className="flex cursor-pointer items-center justify-between gap-3 text-body">
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(c.slug)}
                  onChange={() => updateFilters((f) => ({ ...f, categories: toggle(f.categories, c.slug) }))}
                  className="size-4 accent-accent"
                />
                {c.name}
              </span>
              <span className="text-small text-subtle">{c.count}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-3.5 border-t border-line pt-7">
          <legend className={`${groupTitle} float-left mb-3.5`}>Size (UK)</legend>
          <div className="clear-left grid grid-cols-3 gap-2">
            {sizes.map((size) => {
              const on = filters.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={on}
                  onClick={() => updateFilters((f) => ({ ...f, sizes: toggle(f.sizes, size) }))}
                  className={`h-(--za-control-sm) cursor-pointer border text-sm ${on ? "border-ink bg-ink text-white" : "border-line-strong hover:border-ink"}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3.5 border-t border-line pt-7">
          <legend className={`${groupTitle} float-left mb-3.5`}>Print colour</legend>
          <div className="clear-left flex flex-wrap gap-3">
            {printColours.map((c) => {
              const on = filters.colours.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  aria-label={c.label}
                  aria-pressed={on}
                  onClick={() => updateFilters((f) => ({ ...f, colours: toggle(f.colours, c.id) }))}
                  style={{ background: c.hex }}
                  className={`size-9 cursor-pointer rounded-full ${on ? "shadow-ring" : "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"}`}
                />
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3.5 border-t border-line pt-7">
          <legend className={`${groupTitle} float-left mb-3.5`}>Occasion</legend>
          <div className="clear-left flex flex-col gap-3.5">
            {occasions.map((occasion) => (
              <label key={occasion} className="flex cursor-pointer items-center gap-3 text-body">
                <input
                  type="checkbox"
                  checked={filters.occasions.includes(occasion)}
                  onChange={() => updateFilters((f) => ({ ...f, occasions: toggle(f.occasions, occasion) }))}
                  className="size-4 accent-accent"
                />
                {occasion}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3.5 border-t border-line pt-7">
          <legend className={`${groupTitle} float-left mb-3.5`}>Price</legend>
          <div className="clear-left flex flex-col gap-3.5">
            {priceBands.map((b) => (
              <label key={b.id} className="flex cursor-pointer items-center gap-3 text-body">
                <input
                  type="radio"
                  name="price"
                  checked={filters.band === b.id}
                  onChange={() => updateFilters((f) => ({ ...f, band: b.id }))}
                  className="size-4 accent-accent"
                />
                {bandLabels[b.id]}
              </label>
            ))}
          </div>
        </fieldset>
      </aside>

      <div ref={resultsRef} className="flex min-w-0 flex-1 flex-col gap-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <span aria-live="polite" className="text-sm text-copy">
            {results.length
              ? `Showing ${start + 1}–${start + pageItems.length} of ${results.length} pieces`
              : "0 pieces"}
          </span>
          <label className="flex items-center gap-2.5 text-label font-normal uppercase tracking-[0.2em]">
            Sort
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as Sort);
                setPage(1);
              }}
              className="cursor-pointer border border-line-strong bg-white px-3.5 py-2.5 text-sm tracking-normal normal-case"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.remove}
                aria-label={`Remove filter: ${chip.label}`}
                className="flex cursor-pointer items-center gap-2.5 bg-tint px-3.5 py-2 text-small hover:bg-accent-soft"
              >
                {chip.label}
                <span aria-hidden className="text-body leading-none">
                  ×
                </span>
              </button>
            ))}
          </div>
        )}

        {pageItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(36px,3.5vw,52px)] xl:grid-cols-3">
            {pageItems.map((product, i) => (
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
            <span className="font-display text-[32px]">No pieces match those filters</span>
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer bg-ink px-[30px] py-4 text-label uppercase tracking-button text-white hover:bg-accent"
            >
              Clear filters
            </button>
          </div>
        )}

        {pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2 border-t border-line pt-8">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              className="h-11 cursor-pointer px-[18px] text-label uppercase tracking-[0.2em] disabled:cursor-default disabled:opacity-30"
            >
              ← Prev
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === currentPage ? "page" : undefined}
                onClick={() => goToPage(n)}
                className={`size-11 cursor-pointer border text-sm ${n === currentPage ? "border-ink bg-ink text-white" : "border-line-strong hover:border-ink"}`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => goToPage(currentPage + 1)}
              className="h-11 cursor-pointer px-[18px] text-label uppercase tracking-[0.2em] disabled:cursor-default disabled:opacity-30"
            >
              Next →
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
