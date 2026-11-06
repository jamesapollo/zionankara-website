import { createHmac, timingSafeEqual } from "node:crypto";

/** Every ERP-backed cached reader carries this tag, so `{"type":"all"}` clears them all. */
export const ERP_TAG = "erp";

/** How far the sender's clock may drift from ours before a signed request is refused. */
export const MAX_SKEW_SECONDS = 300;
const MAX_SLUGS = 100;
const MAX_SLUG_LENGTH = 200;

export type RevalidateType = "store" | "category" | "product" | "all";
const TYPES: readonly RevalidateType[] = ["store", "category", "product", "all"];

/** HMAC-SHA256 hex of `<timestamp>.<raw body>`; the ERP signs the same string with REVALIDATE_SECRET. */
export function signRevalidation(timestamp: string, body: string, secret: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/** True when the timestamp is fresh and the signature matches (constant-time compare). */
export function verifyRevalidation(input: {
  timestamp: string | null;
  signature: string | null;
  body: string;
  secret: string;
  nowSeconds?: number;
}): boolean {
  const { timestamp, signature, body, secret } = input;
  if (!secret || !timestamp || !signature || !/^\d{1,12}$/.test(timestamp)) return false;
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > MAX_SKEW_SECONDS) return false;
  const expected = Buffer.from(signRevalidation(timestamp, body, secret), "hex");
  const given = Buffer.from(signature.trim().toLowerCase(), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Cache tags to clear for one change notice from the ERP, or an error message for a bad body.
 *
 * - `store`: contact details (header strip, footer, Contact page).
 * - `category`: the category row, collection tiles and each named category page with its listing.
 *   Send both the old and new slug after a rename.
 * - `product`: every product listing, plus each named product page.
 * - `all`: everything read from the ERP.
 */
export function tagsFor(payload: unknown): { tags: string[] } | { error: string } {
  if (typeof payload !== "object" || payload === null) return { error: "Body must be a JSON object." };
  const { type, slugs = [] } = payload as { type?: unknown; slugs?: unknown };
  if (typeof type !== "string" || !TYPES.includes(type as RevalidateType)) {
    return { error: `"type" must be one of: ${TYPES.join(", ")}.` };
  }
  if (
    !Array.isArray(slugs) ||
    slugs.length > MAX_SLUGS ||
    !slugs.every((s) => typeof s === "string" && s.trim() !== "" && s.length <= MAX_SLUG_LENGTH)
  ) {
    return { error: `"slugs" must be an array of up to ${MAX_SLUGS} non-empty strings.` };
  }
  const unique = [...new Set((slugs as string[]).map((s) => s.trim()))];

  switch (type as RevalidateType) {
    case "store":
      return { tags: ["store"] };
    case "category":
      return { tags: ["category-nav", "categories", ...unique.map((s) => `category:${s}`)] };
    case "product":
      return { tags: ["products", ...unique.map((s) => `product:${s}`)] };
    case "all":
      return { tags: [ERP_TAG] };
  }
}
