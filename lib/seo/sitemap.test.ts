import { describe, expect, it } from "vitest";
import { buildSitemap, flattenCategorySlugs } from "./sitemap";

describe("buildSitemap", () => {
  it("lists fixed pages, collections and products as absolute URLs", () => {
    const entries = buildSitemap("https://www.zionankara.com/", {
      categorySlugs: ["gowns"],
      products: [
        { slug: "asa-peplum-set", updatedAt: "2026-11-01T10:00:00Z", image: "https://media.zionankara.com/a.jpg" },
        { slug: "ife-wrap-dress" },
      ],
    });
    expect(entries.map((e) => e.url)).toEqual([
      "https://www.zionankara.com",
      "https://www.zionankara.com/about",
      "https://www.zionankara.com/contact",
      "https://www.zionankara.com/collections",
      "https://www.zionankara.com/collections/new-in",
      "https://www.zionankara.com/collections/gowns",
      "https://www.zionankara.com/products/asa-peplum-set",
      "https://www.zionankara.com/products/ife-wrap-dress",
    ]);
    expect(entries[6]).toMatchObject({
      lastModified: "2026-11-01T10:00:00Z",
      images: ["https://media.zionankara.com/a.jpg"],
    });
    expect(entries[7]).not.toHaveProperty("lastModified");
    expect(entries[7]).not.toHaveProperty("images");
  });

  it("drops duplicates and encodes slugs", () => {
    const entries = buildSitemap("https://x.test", {
      categorySlugs: ["new-in", "a b"],
      products: [{ slug: "p" }, { slug: "p" }],
    });
    const urls = entries.map((e) => e.url);
    expect(urls.filter((u) => u.endsWith("/collections/new-in"))).toHaveLength(1);
    expect(urls).toContain("https://x.test/collections/a%20b");
    expect(urls.filter((u) => u.endsWith("/products/p"))).toHaveLength(1);
  });
});

describe("flattenCategorySlugs", () => {
  it("walks nested children", () => {
    expect(
      flattenCategorySlugs([
        { slug: "dresses", children: [{ slug: "midi", children: [{ slug: "wrap", children: [] }] }] },
        { slug: "tops", children: [] },
      ]),
    ).toEqual(["dresses", "midi", "wrap", "tops"]);
  });
});
