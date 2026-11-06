import { describe, expect, it } from "vitest";
import { ERP_TAG, MAX_SKEW_SECONDS, signRevalidation, tagsFor, verifyRevalidation } from "./revalidate";

const secret = "test-secret";
const body = '{"type":"store"}';
const now = 1_800_000_000;
const ts = String(now);

describe("verifyRevalidation", () => {
  const signature = signRevalidation(ts, body, secret);

  it("accepts a fresh, correctly signed request", () => {
    expect(verifyRevalidation({ timestamp: ts, signature, body, secret, nowSeconds: now })).toBe(true);
  });
  it("accepts an upper-case signature", () => {
    expect(verifyRevalidation({ timestamp: ts, signature: signature.toUpperCase(), body, secret, nowSeconds: now })).toBe(true);
  });
  it("rejects a tampered body", () => {
    expect(verifyRevalidation({ timestamp: ts, signature, body: '{"type":"all"}', secret, nowSeconds: now })).toBe(false);
  });
  it("rejects the wrong secret", () => {
    expect(verifyRevalidation({ timestamp: ts, signature, body, secret: "other", nowSeconds: now })).toBe(false);
  });
  it("rejects a stale or future timestamp", () => {
    expect(verifyRevalidation({ timestamp: ts, signature, body, secret, nowSeconds: now + MAX_SKEW_SECONDS + 1 })).toBe(false);
    expect(verifyRevalidation({ timestamp: ts, signature, body, secret, nowSeconds: now - MAX_SKEW_SECONDS - 1 })).toBe(false);
  });
  it("rejects missing or malformed headers and an unset secret", () => {
    expect(verifyRevalidation({ timestamp: null, signature, body, secret, nowSeconds: now })).toBe(false);
    expect(verifyRevalidation({ timestamp: ts, signature: null, body, secret, nowSeconds: now })).toBe(false);
    expect(verifyRevalidation({ timestamp: "abc", signature, body, secret, nowSeconds: now })).toBe(false);
    expect(verifyRevalidation({ timestamp: ts, signature: "zz", body, secret, nowSeconds: now })).toBe(false);
    expect(verifyRevalidation({ timestamp: ts, signature, body, secret: "", nowSeconds: now })).toBe(false);
  });
});

describe("tagsFor", () => {
  it("maps store to the contact tag", () => {
    expect(tagsFor({ type: "store" })).toEqual({ tags: ["store"] });
  });
  it("maps category to the nav, tree and each named category", () => {
    expect(tagsFor({ type: "category", slugs: ["gowns", " dresses ", "gowns"] })).toEqual({
      tags: ["category-nav", "categories", "category:gowns", "category:dresses"],
    });
  });
  it("maps product to all listings and each named product", () => {
    expect(tagsFor({ type: "product", slugs: ["adunni-gown"] })).toEqual({ tags: ["products", "product:adunni-gown"] });
    expect(tagsFor({ type: "product" })).toEqual({ tags: ["products"] });
  });
  it("maps all to the shared ERP tag", () => {
    expect(tagsFor({ type: "all" })).toEqual({ tags: [ERP_TAG] });
  });
  it("rejects bad bodies", () => {
    expect(tagsFor(null)).toHaveProperty("error");
    expect(tagsFor({ type: "everything" })).toHaveProperty("error");
    expect(tagsFor({ type: "product", slugs: "adunni" })).toHaveProperty("error");
    expect(tagsFor({ type: "product", slugs: [""] })).toHaveProperty("error");
    expect(tagsFor({ type: "product", slugs: [1] })).toHaveProperty("error");
    expect(tagsFor({ type: "product", slugs: Array.from({ length: 101 }, (_, i) => `p${i}`) })).toHaveProperty("error");
  });
});
