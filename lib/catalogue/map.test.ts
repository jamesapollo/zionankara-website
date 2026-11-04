import { describe, expect, it } from "vitest";
import type { ProductListItem } from "@/lib/erp/types";
import type { NavItem, CategoryNode } from "@/lib/erp/types";
import { cardFromErp, cardFromLocal, orderSections, pageWindow, titleParts } from "./map";
import { products } from "@/lib/catalog";

const money = (amount: string) => ({ amount, currency: "KES" });
const item = (over: Partial<ProductListItem> = {}): ProductListItem => ({
  slug: "gown",
  title: "Gown",
  short_description: null,
  is_featured: false,
  main_image: { url: "https://media.zionankara.co.ke/a.jpg", alt_text: null, width: 800, height: 1000 },
  price: { original: money("9000.00"), current: money("9000.00"), saving: null, on_offer: false, offer_ends_at: null },
  price_varies: false,
  in_stock: true,
  published_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-01T00:00:00Z",
  ...over,
});
const now = new Date("2026-11-05T00:00:00Z");

describe("cardFromErp", () => {
  it("maps the list item, defaulting alt text to the title", () => {
    const card = cardFromErp(item(), now);
    expect(card).toMatchObject({ slug: "gown", name: "Gown", image: { alt: "Gown", width: 800, height: 1000 } });
    expect(card.price.current.amount).toBe("9000.00");
  });

  it("flags recently published products as new", () => {
    expect(cardFromErp(item(), now).isNew).toBe(true);
    expect(cardFromErp(item({ published_at: "2026-08-01T00:00:00Z" }), now).isNew).toBe(false);
    expect(cardFromErp(item({ published_at: null }), now).isNew).toBe(false);
  });

  it("keeps a null image as null", () => {
    expect(cardFromErp(item({ main_image: null }), now).image).toBeNull();
  });
});

describe("cardFromLocal", () => {
  it("maps a local product into the same shape, with the sale price as an offer", () => {
    const sale = products.find((p) => p.wasKes)!;
    const card = cardFromLocal(sale);
    expect(card.slug).toBe(sale.slug);
    expect(card.price.on_offer).toBe(true);
    expect(Number(card.price.current.amount)).toBe(sale.priceKes);
    expect(Number(card.price.original.amount)).toBe(sale.wasKes);
    expect(card.image?.url).toBe(sale.image);
  });

  it("has no offer for a full-price product", () => {
    const full = products.find((p) => !p.wasKes)!;
    expect(cardFromLocal(full).price.on_offer).toBe(false);
  });
});

describe("orderSections", () => {
  const nav: NavItem[] = [
    { slug: "new-in", name: "New in", kind: "new_in" },
    { slug: "occasion", name: "Occasion", kind: "standard" },
  ];
  const tree: CategoryNode[] = [
    { slug: "gowns", name: "Gowns", kind: "standard", children: [] },
    { slug: "occasion", name: "Occasion", kind: "standard", children: [] },
  ];
  it("puts nav order first, then remaining top-level categories, without duplicates", () => {
    expect(orderSections(nav, tree).map((s) => s.slug)).toEqual(["new-in", "occasion", "gowns"]);
  });
});

describe("titleParts", () => {
  it("prefixes standard categories with Ankara and lowercases the name", () => {
    expect(titleParts("Midi Dresses", "standard")).toEqual({ lead: "Ankara", accent: "midi dresses" });
  });
  it("accents the last word of special categories", () => {
    expect(titleParts("New in", "new_in")).toEqual({ lead: "New", accent: "in" });
    expect(titleParts("Sale", "on_sale")).toEqual({ lead: "", accent: "Sale" });
  });
});

describe("pageWindow", () => {
  it("lists every page when few", () => {
    expect(pageWindow(1, 4)).toEqual([1, 2, 3, 4]);
  });
  it("elides the middle of long ranges", () => {
    expect(pageWindow(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(pageWindow(1, 10)).toEqual([1, 2, "gap", 10]);
  });
});
