import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), permanentRedirect: vi.fn() }));
const erpGet = vi.fn();
vi.mock("./client", () => ({ erpGet: (...a: unknown[]) => erpGet(...a) }));

import { categories } from "@/lib/catalog";
import { fallbackCategoryRow, getCategoryRowItems, getContactOrNull } from "./header-data";

beforeEach(() => {
  erpGet.mockReset();
  vi.unstubAllEnvs();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("getContactOrNull", () => {
  it("returns the contact block", async () => {
    erpGet.mockResolvedValue({ data: { contact: { phone: "+254700000000" } } });
    expect(await getContactOrNull()).toEqual({ phone: "+254700000000" });
  });
  it("returns null (does not throw) on any failure", async () => {
    erpGet.mockRejectedValue(new Error("boom"));
    await expect(getContactOrNull()).resolves.toBeNull();
  });
  it("returns null when the store has no contact", async () => {
    erpGet.mockResolvedValue({ data: {} });
    expect(await getContactOrNull()).toBeNull();
  });
});

describe("getCategoryRowItems", () => {
  it("under local uses local categories without calling the ERP (no Sale)", async () => {
    const items = await getCategoryRowItems();
    expect(erpGet).not.toHaveBeenCalled();
    expect(items).toHaveLength(categories.length);
    expect(items.some((i) => i.accent || /sale/i.test(i.label))).toBe(false);
    expect(items[0]).toEqual({ href: `/collections/${categories[0].slug}`, label: categories[0].name });
  });
  it("under erp maps the nav, accenting on_sale", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "erp");
    erpGet.mockResolvedValue({
      data: [
        { slug: "gowns", name: "Gowns", kind: "standard" },
        { slug: "sale", name: "Sale", kind: "on_sale" },
      ],
    });
    expect(await getCategoryRowItems()).toEqual([
      { href: "/collections/gowns", label: "Gowns", accent: false },
      { href: "/collections/sale", label: "Sale", accent: true },
    ]);
  });
  it("under erp falls back to a single Collections link on failure", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "erp");
    erpGet.mockRejectedValue(new Error("down"));
    await expect(getCategoryRowItems()).resolves.toEqual([{ href: "/collections", label: "Collections" }]);
  });
  it("under erp returns no items (row hidden) when the store has no categories", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "erp");
    erpGet.mockResolvedValue({ data: [] });
    await expect(getCategoryRowItems()).resolves.toEqual([]);
  });
});

describe("fallbackCategoryRow", () => {
  it("is local categories under local and empty under erp", () => {
    expect(fallbackCategoryRow()).toHaveLength(categories.length);
    vi.stubEnv("CATALOGUE_SOURCE", "erp");
    expect(fallbackCategoryRow()).toEqual([]);
  });
});
