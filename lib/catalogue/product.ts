import type { Price, ProductDetail, ProductImage, Variant } from "@/lib/erp/types";

/*
 * Pure helpers for the ERP product page (no server-only import: the client purchase area uses them).
 * A "selection" is the list of chosen option value ids, one per option type.
 */

type OptionType = ProductDetail["option_types"][number];

/** Photos for the chosen values: those tagged with a chosen value plus untagged ones; all photos if none match. */
export function galleryFor(images: ProductImage[], selection: number[]): ProductImage[] {
  if (selection.length === 0) return images;
  const chosen = new Set(selection);
  const matching = images.filter((i) => i.option_value_ids.length === 0 || i.option_value_ids.some((id) => chosen.has(id)));
  return matching.length > 0 ? matching : images;
}

/** First in-stock variant's values (else the first variant's); empty when the product has no variants. */
export function defaultSelection(variants: Variant[]): number[] {
  const v = variants.find((x) => x.in_stock) ?? variants[0];
  return v ? [...v.option_value_ids] : [];
}

/** The variant carrying exactly the selected values. */
export function selectedVariant(variants: Variant[], selection: number[]): Variant | undefined {
  const chosen = new Set(selection);
  return variants.find((v) => v.option_value_ids.length === chosen.size && v.option_value_ids.every((id) => chosen.has(id)));
}

/**
 * Selection after the shopper picks `valueId`. Keeps their other choices when that combination is sold;
 * otherwise moves to the variant with the value that shares the most other choices (preferring in-stock).
 */
export function selectValue(variants: Variant[], optionTypes: OptionType[], selection: number[], valueId: number): number[] {
  const type = optionTypes.find((t) => t.values.some((v) => v.id === valueId));
  if (!type) return selection;

  const typeIds = new Set(type.values.map((v) => v.id));
  const wanted = [...selection.filter((id) => !typeIds.has(id)), valueId];
  const exact = selectedVariant(variants, wanted);
  if (exact) return [...exact.option_value_ids];

  const others = new Set(wanted.filter((id) => id !== valueId));
  const candidates = variants.filter((v) => v.option_value_ids.includes(valueId));
  const score = (v: Variant) => v.option_value_ids.filter((id) => others.has(id)).length * 2 + (v.in_stock ? 1 : 0);
  const best = candidates.reduce<Variant | undefined>((acc, v) => (!acc || score(v) > score(acc) ? v : acc), undefined);
  return best ? [...best.option_value_ids] : selection;
}

/** True when choosing `valueId` (keeping the other selected values) lands on a variant that is sold out. */
export function soldOutValue(variants: Variant[], selection: number[], typeValueIds: number[], valueId: number): boolean {
  const wanted = [...selection.filter((id) => !typeValueIds.includes(id)), valueId];
  const v = selectedVariant(variants, wanted);
  if (v) return !v.in_stock;
  return !variants.some((x) => x.in_stock && x.option_value_ids.includes(valueId));
}

/** KES amounts to show: the live price and, on offer, the original to strike through. */
export function priceFor(price: Price): { priceKes: number; wasKes: number | undefined } {
  return { priceKes: Number(price.current.amount), wasKes: price.on_offer ? Number(price.original.amount) : undefined };
}
