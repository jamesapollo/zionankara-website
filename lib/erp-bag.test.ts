import { describe, expect, it } from "vitest";
import { addErpLine, parseErpBag, type ErpBagLine } from "./erp-bag";
import { MAX_QUANTITY } from "./store";

const line = (variantId: number, quantity: number): ErpBagLine => ({
  variantId,
  slug: "adunni-gown",
  title: "Adunni Gown",
  label: "Red / M",
  image: null,
  quantity,
});

describe("parseErpBag", () => {
  it("drops malformed lines", () => {
    expect(parseErpBag([line(1, 2), { slug: "b" }, "x", { ...line(2, 1), variantId: "2" }])).toEqual([line(1, 2)]);
    expect(parseErpBag({ bag: [] })).toEqual([]);
    expect(parseErpBag(null)).toEqual([]);
  });

  it("merges duplicates and clamps quantity", () => {
    expect(parseErpBag([line(1, 7), line(1, 6)])).toEqual([line(1, MAX_QUANTITY)]);
    expect(parseErpBag([line(1, 0)])).toEqual([]);
    expect(parseErpBag([line(1, 99)])).toEqual([line(1, MAX_QUANTITY)]);
  });

  it("keeps at most 50 lines", () => {
    expect(parseErpBag(Array.from({ length: 60 }, (_, i) => line(i + 1, 1)))).toHaveLength(50);
  });
});

describe("addErpLine", () => {
  it("merges by variant id and caps at MAX_QUANTITY", () => {
    expect(addErpLine([line(1, 2)], line(2, 1))).toEqual([line(1, 2), line(2, 1)]);
    expect(addErpLine([line(1, 8)], line(1, 5))).toEqual([line(1, MAX_QUANTITY)]);
  });
});
