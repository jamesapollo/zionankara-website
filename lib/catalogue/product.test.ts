import { describe, expect, it } from "vitest";
import type { Price, ProductImage, Variant } from "@/lib/erp/types";
import { defaultSelection, galleryFor, priceFor, selectValue, selectedVariant, soldOutValue } from "./product";

const money = (amount: string) => ({ amount, currency: "KES" });
const price = (current: string, original = current): Price => ({
  original: money(original),
  current: money(current),
  saving: current === original ? null : money(String(Number(original) - Number(current))),
  on_offer: current !== original,
  offer_ends_at: null,
});
const image = (url: string, option_value_ids: number[] = [], is_main = false): ProductImage => ({
  url,
  alt_text: null,
  width: 800,
  height: 1000,
  is_main,
  option_value_ids,
});
let nextVariantId = 1;
const variant = (sku: string, option_value_ids: number[], over: Partial<Variant> = {}): Variant => ({
  id: nextVariantId++,
  sku,
  price: price("9000.00"),
  option_value_ids,
  in_stock: true,
  ...over,
});

// Colour: red=1 blue=2; Size: M=10 L=11
const variants = [
  variant("R-M", [1, 10], { in_stock: false }),
  variant("R-L", [1, 11]),
  variant("B-M", [2, 10], { price: price("7000.00", "9000.00") }),
  variant("B-L", [2, 11], { in_stock: false }),
];

describe("galleryFor", () => {
  const images = [image("a", [1], true), image("b", [2]), image("c", []), image("d", [1, 2])];

  it("keeps photos tagged with a selected value, plus untagged photos", () => {
    expect(galleryFor(images, [2, 10]).map((i) => i.url)).toEqual(["b", "c", "d"]);
    expect(galleryFor(images, [1]).map((i) => i.url)).toEqual(["a", "c", "d"]);
  });

  it("shows every photo when nothing is selected", () => {
    expect(galleryFor(images, []).map((i) => i.url)).toEqual(["a", "b", "c", "d"]);
  });

  it("falls back to all photos when none match", () => {
    expect(galleryFor([image("a", [1]), image("b", [2])], [3]).map((i) => i.url)).toEqual(["a", "b"]);
  });
});

describe("defaultSelection", () => {
  it("starts from the first in-stock variant", () => {
    expect(defaultSelection(variants)).toEqual([1, 11]);
  });

  it("uses the first variant when everything is sold out", () => {
    expect(defaultSelection(variants.map((v) => ({ ...v, in_stock: false })))).toEqual([1, 10]);
  });

  it("is empty with no variants", () => {
    expect(defaultSelection([])).toEqual([]);
  });
});

describe("selectedVariant", () => {
  it("finds the variant with exactly the selected values", () => {
    expect(selectedVariant(variants, [2, 10])?.sku).toBe("B-M");
    expect(selectedVariant(variants, [10, 2])?.sku).toBe("B-M");
  });

  it("is undefined when no variant matches", () => {
    expect(selectedVariant(variants, [1])).toBeUndefined();
    expect(selectedVariant([], [])).toBeUndefined();
  });
});

describe("selectValue", () => {
  const types = [
    { name: "Colour", values: [{ id: 1, value: "Red" }, { id: 2, value: "Blue" }] },
    { name: "Size", values: [{ id: 10, value: "M" }, { id: 11, value: "L" }] },
  ];

  it("swaps one value and keeps the rest when that variant exists", () => {
    expect(selectValue(variants, types, [1, 11], 10).sort((a, b) => a - b)).toEqual([1, 10]);
  });

  it("keeps a sold-out combination that exists, so the shopper sees it is sold out", () => {
    expect(selectValue(variants, types, [1, 11], 2).sort((a, b) => a - b)).toEqual([2, 11]); // Blue/L exists but is out of stock
  });

  it("moves to the nearest variant when the combination is not sold", () => {
    const noBlueL = variants.filter((v) => v.sku !== "B-L");
    expect(selectValue(noBlueL, types, [1, 11], 2).sort((a, b) => a - b)).toEqual([2, 10]);
  });

  it("never returns a combination without a variant", () => {
    const only = [variant("x", [1, 10]), variant("y", [2, 11])];
    expect(selectValue(only, types, [1, 10], 11).sort((a, b) => a - b)).toEqual([2, 11]);
  });

  it("returns the current selection for an unknown value", () => {
    expect(selectValue(variants, types, [1, 11], 99)).toEqual([1, 11]);
  });
});

describe("soldOutValue", () => {
  const sizeIds = [10, 11];
  it("flags a value with no in-stock variant alongside the other selections", () => {
    expect(soldOutValue(variants, [1, 11], sizeIds, 10)).toBe(true); // Red/M
    expect(soldOutValue(variants, [1, 10], sizeIds, 11)).toBe(false); // Red/L
  });
});

describe("priceFor", () => {
  it("uses the variant price with the original as the struck price on offer", () => {
    expect(priceFor(variants[2].price)).toEqual({ priceKes: 7000, wasKes: 9000 });
  });

  it("has no struck price off offer", () => {
    expect(priceFor(price("9000.00"))).toEqual({ priceKes: 9000, wasKes: undefined });
  });
});
