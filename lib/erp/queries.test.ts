import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  permanentRedirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import { getCategory, getProduct, listProducts } from "./queries";

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.stubEnv("ERP_API_URL", "https://erp.example.test");
  vi.stubEnv("STOREFRONT_SIGNING_SECRET", "secret");
  vi.stubEnv("ERP_STOREFRONT_HOST", "shop.example.test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("catalogue readers", () => {
  it("maps a product redirect hint to a permanent redirect to the new slug", async () => {
    fetchMock.mockResolvedValue(json({ redirect: { slug: "new-gown", status: 301 } }));
    await expect(getProduct("old-gown")).rejects.toThrow("REDIRECT:/products/new-gown");
  });

  it("maps a category redirect hint to the collection route", async () => {
    fetchMock.mockResolvedValue(json({ redirect: { slug: "dresses", status: 301 } }));
    await expect(getCategory("frocks")).rejects.toThrow("REDIRECT:/collections/dresses");
  });

  it("maps a 404 to notFound()", async () => {
    fetchMock.mockResolvedValue(json({ message: "Not found." }, 404));
    await expect(getProduct("nope")).rejects.toThrow("NOT_FOUND");
  });

  it("lets 5xx errors propagate as ErpError", async () => {
    fetchMock.mockResolvedValue(json({}, 503));
    await expect(getProduct("x")).rejects.toMatchObject({ name: "ErpError", status: 503 });
  });

  it("builds a stable, sorted query string and skips empty params", async () => {
    fetchMock.mockResolvedValue(json({ data: [], links: {}, meta: {} }));
    await listProducts({ sort: "price", category: "new-in", option_values: [3, 4], featured: false, q: "" });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://erp.example.test/api/v1/storefront/products?category=new-in&option_values=3%2C4&sort=price",
    );
  });
});
