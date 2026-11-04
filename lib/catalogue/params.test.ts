import { describe, expect, it } from "vitest";
import { PER_PAGE, listingHref, sanitizeListing, toErpParams } from "./params";

describe("sanitizeListing", () => {
  it("defaults when nothing is given", () => {
    expect(sanitizeListing({})).toEqual({ sort: "newest", page: 1, optionValues: [] });
  });

  it("drops a q shorter than 2 characters (after trimming) and keeps a valid one trimmed", () => {
    expect(sanitizeListing({ q: "a" }).q).toBeUndefined();
    expect(sanitizeListing({ q: "  a " }).q).toBeUndefined();
    expect(sanitizeListing({ q: " gown " }).q).toBe("gown");
  });

  it("drops a q longer than 100 characters", () => {
    expect(sanitizeListing({ q: "x".repeat(101) }).q).toBeUndefined();
    expect(sanitizeListing({ q: "x".repeat(100) }).q).toHaveLength(100);
  });

  it("whitelists sort and falls back to newest", () => {
    for (const sort of ["newest", "price", "-price", "best_offer"]) {
      expect(sanitizeListing({ sort }).sort).toBe(sort);
    }
    expect(sanitizeListing({ sort: "random" }).sort).toBe("newest");
    expect(sanitizeListing({ sort: "drop table" }).sort).toBe("newest");
  });

  it("clamps page to a positive integer", () => {
    expect(sanitizeListing({ page: "3" }).page).toBe(3);
    expect(sanitizeListing({ page: "0" }).page).toBe(1);
    expect(sanitizeListing({ page: "-4" }).page).toBe(1);
    expect(sanitizeListing({ page: "abc" }).page).toBe(1);
    expect(sanitizeListing({ page: "2.5" }).page).toBe(1);
    expect(sanitizeListing({ page: "99999999" }).page).toBe(1000);
  });

  it("keeps only numeric, unique option values, at most 20", () => {
    expect(sanitizeListing({ option_values: "12,15,x,,15,-3,1.5" }).optionValues).toEqual([12, 15]);
    const many = Array.from({ length: 30 }, (_, i) => i + 1).join(",");
    expect(sanitizeListing({ option_values: many }).optionValues).toHaveLength(20);
  });

  it("accepts a repeated option_values param", () => {
    expect(sanitizeListing({ option_values: ["1", "2,3"] }).optionValues).toEqual([1, 2, 3]);
  });

  it("keeps numeric prices with at most 2 decimals and drops a max below the min", () => {
    expect(sanitizeListing({ min_price: "1000", max_price: "2500.50" })).toMatchObject({ minPrice: "1000", maxPrice: "2500.50" });
    expect(sanitizeListing({ min_price: "abc", max_price: "-5" }).minPrice).toBeUndefined();
    expect(sanitizeListing({ min_price: "1.234" }).minPrice).toBeUndefined();
    expect(sanitizeListing({ min_price: "5000", max_price: "100" }).maxPrice).toBeUndefined();
  });
});

describe("toErpParams", () => {
  it("builds the ERP query with the page size", () => {
    const listing = sanitizeListing({ q: "gown", sort: "price", page: "2", option_values: "4", min_price: "10" });
    expect(toErpParams(listing, "gowns")).toEqual({
      category: "gowns",
      q: "gown",
      sort: "price",
      page: 2,
      per_page: PER_PAGE,
      option_values: [4],
      min_price: "10",
      max_price: undefined,
    });
  });

  it("never exceeds 48 per page", () => {
    expect(PER_PAGE).toBeLessThanOrEqual(48);
  });
});

describe("listingHref", () => {
  const base = sanitizeListing({ sort: "price", option_values: "4,5", page: "3" });

  it("omits defaults", () => {
    expect(listingHref("/collections/gowns", sanitizeListing({}), {})).toBe("/collections/gowns");
  });

  it("serialises the listing and applies overrides, resetting page when asked", () => {
    expect(listingHref("/collections/gowns", base, {})).toBe("/collections/gowns?sort=price&option_values=4%2C5&page=3");
    expect(listingHref("/collections/gowns", base, { page: 1, optionValues: [4] })).toBe(
      "/collections/gowns?sort=price&option_values=4",
    );
  });
});
