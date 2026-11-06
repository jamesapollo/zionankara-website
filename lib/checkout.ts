import type { ErpBagLine } from "./erp-bag";
import type { CheckoutQuote, DeliveryZone, OrderBody, PlacedOrder } from "./erp/types";

const regionName = new Intl.DisplayNames(["en"], { type: "region" });

/** Countries offered at checkout, Kenya first. Delivery for a country without ERP zones is quoted later. */
export const CHECKOUT_COUNTRIES = ["KE", "UG", "TZ", "RW", "NG", "GH", "ZA", "GB", "US", "CA", "AE", "DE", "FR", "NL", "SE"].map(
  (code) => ({ code, name: regionName.of(code) ?? code }),
);

export type BuyerFields = {
  first: string;
  last: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postal: string;
  country: string;
};
export type BuyerErrors = Partial<Record<keyof BuyerFields | "zone", string>>;

export const PRICES_CHANGED = "Prices have changed. Please review your order.";
export const RATE_LIMITED = "You've placed a few orders — please try again in a little while.";
export const UNREACHABLE = "We couldn't reach the shop. Please try again.";
export const ORDER_FAILED = "We couldn't place your order. Please try again.";
export const PENDING_QUOTE = "We'll contact you with the delivery cost.";
export const ALREADY_PLACED =
  "It looks like your order already went through. We'll contact you to confirm payment and delivery — please don't place it again.";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const tooLong = (value: string, max: number) => value.trim().length > max;

/** Field errors for the buyer form, empty when valid. Limits mirror POST /api/v1/storefront/orders. */
export function validateBuyer(
  f: BuyerFields,
  opts: { pendingQuote: boolean; zoneRequired: boolean; zoneId: number | null },
): BuyerErrors {
  const errors: BuyerErrors = {};
  const name = `${f.first.trim()} ${f.last.trim()}`.trim();
  if (!f.first.trim() || name.length > 120) errors.first = "Please enter your name";

  const phone = f.phone.trim().replace(/[\s-]/g, "");
  const phoneOk = /^\+?\d{7,15}$/.test(phone) && (!opts.pendingQuote || phone.startsWith("+"));
  if (!phoneOk) {
    errors.phone = opts.pendingQuote
      ? "Please enter your phone number with the country code, e.g. +44 7700 900123"
      : "Please enter a valid phone number";
  }

  const email = f.email.trim();
  if (email ? !EMAIL.test(email) || email.length > 254 : opts.pendingQuote) {
    errors.email = opts.pendingQuote && !email ? "Please enter your email so we can send the delivery cost" : "Please enter a valid email";
  }

  if (!f.address1.trim() || tooLong(f.address1, 255)) errors.address1 = "Please enter your address";
  if (tooLong(f.address2, 255)) errors.address2 = "This line is too long";
  if (!f.city.trim() || tooLong(f.city, 120)) errors.city = "Please enter your town or city";
  if (tooLong(f.region, 120)) errors.region = "This is too long";
  if (tooLong(f.postal, 20)) errors.postal = "This is too long";
  if (!/^[A-Z]{2}$/.test(f.country)) errors.country = "Please choose a country";
  if (opts.zoneRequired && opts.zoneId === null) errors.zone = "Please choose a delivery option";
  return errors;
}

const orNull = (value: string) => value.trim() || null;

export function orderBody(bag: ErpBagLine[], f: BuyerFields, zoneId: number | null, expectedSubtotal: string): OrderBody {
  return {
    lines: bag.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
    buyer_name: `${f.first.trim()} ${f.last.trim()}`.trim(),
    buyer_phone: f.phone.trim(),
    buyer_email: orNull(f.email),
    address_line1: f.address1.trim(),
    address_line2: orNull(f.address2),
    city: f.city.trim(),
    region: orNull(f.region),
    postal_code: orNull(f.postal),
    country: f.country,
    delivery_zone_id: zoneId,
    expected_subtotal: expectedSubtotal,
  };
}

type Body = { data?: unknown; code?: unknown; message?: unknown; errors?: Record<string, unknown>; lines?: unknown };
const asBody = (data: unknown): Body => (typeof data === "object" && data !== null ? (data as Body) : {});

/** Variant ids of bag lines named by `lines.N.*` validation errors. */
function linesNamed(errors: Record<string, unknown> | undefined, bag: ErpBagLine[]): number[] {
  const ids = Object.keys(errors ?? {}).flatMap((key) => {
    const match = /^lines\.(\d+)\./.exec(key);
    const line = match ? bag[Number(match[1])] : undefined;
    return line ? [line.variantId] : [];
  });
  return [...new Set(ids)];
}

function isQuote(value: unknown): value is CheckoutQuote {
  const q = value as CheckoutQuote;
  return Array.isArray(q?.lines) && typeof q.subtotal?.amount === "string" && typeof q.grand_total?.amount === "string";
}

export type QuoteResult =
  | { kind: "ok"; quote: CheckoutQuote; unavailable: number[] }
  | { kind: "invalid"; unavailable: number[]; message: string }
  | { kind: "error"; message: string };

/** Reads a POST /checkout/validate answer. `unavailable` lists bag variant ids that can't be ordered as they are. */
export function classifyQuote(status: number, data: unknown, bag: ErpBagLine[]): QuoteResult {
  const body = asBody(data);
  if (status === 200 && isQuote(body.data)) {
    return { kind: "ok", quote: body.data, unavailable: body.data.lines.filter((l) => !l.available).map((l) => l.variant_id) };
  }
  if (status === 422) {
    const unavailable = linesNamed(body.errors, bag);
    if (unavailable.length > 0) return { kind: "invalid", unavailable, message: "Some items are no longer available." };
  }
  if (status === 429) return { kind: "error", message: "Too many updates — please wait a moment and refresh." };
  return { kind: "error", message: "We couldn't load current prices. Please refresh." };
}

export type OrderResult =
  | { kind: "placed"; order: PlacedOrder }
  | { kind: "prices_changed" }
  | { kind: "already_placed"; message: string }
  | { kind: "out_of_stock"; unavailable: number[] }
  | { kind: "invalid"; errors: BuyerErrors; message?: string }
  | { kind: "retry"; message: string }
  | { kind: "error"; message: string };

const FIELD_FOR: Record<string, keyof BuyerErrors> = {
  buyer_name: "first",
  buyer_phone: "phone",
  buyer_email: "email",
  address_line1: "address1",
  address_line2: "address2",
  city: "city",
  region: "region",
  postal_code: "postal",
  country: "country",
  delivery_zone_id: "zone",
};

/** Reads a POST /orders answer into what the checkout shows next. */
export function classifyOrderResponse(status: number, data: unknown, bag: ErpBagLine[]): OrderResult {
  const body = asBody(data);
  if (status === 201) {
    const order = body.data as PlacedOrder | undefined;
    return typeof order?.reference === "string" ? { kind: "placed", order } : { kind: "error", message: ORDER_FAILED };
  }
  if (status === 409) {
    if (body.code === "prices_changed") return { kind: "prices_changed" };
    // Same key, different body: an earlier attempt with this key already created the order.
    if (body.code === "idempotency_conflict") return { kind: "already_placed", message: ALREADY_PLACED };
    return { kind: "error", message: ORDER_FAILED };
  }
  if (status === 429) return { kind: "error", message: RATE_LIMITED };
  if (status === 0 || status >= 500) return { kind: "retry", message: UNREACHABLE };
  if (status === 422) {
    if (body.code === "out_of_stock" && Array.isArray(body.lines)) {
      // Every listed line is short at the requested quantity; `can_buy` only says whether fewer would work.
      const ids = (body.lines as { variant_id?: unknown }[]).map((l) => l.variant_id).filter((id): id is number => typeof id === "number");
      return { kind: "out_of_stock", unavailable: ids };
    }
    const lineIds = linesNamed(body.errors, bag);
    if (lineIds.length > 0) return { kind: "out_of_stock", unavailable: lineIds };
    const errors: BuyerErrors = {};
    for (const [key, field] of Object.entries(FIELD_FOR)) {
      const first = Array.isArray(body.errors?.[key]) ? (body.errors[key] as unknown[])[0] : undefined;
      if (typeof first === "string" && first) errors[field] = first;
    }
    if (Object.keys(errors).length > 0) return { kind: "invalid", errors };
  }
  return { kind: "error", message: ORDER_FAILED };
}

/**
 * One key per checkout attempt. A retry after a transient failure reuses it, and so does any click after
 * `already_placed`, so the ERP never creates two orders (a changed body then answers idempotency_conflict).
 */
export function nextIdempotencyKey(previous: string | null, lastResult: string | null): string {
  if (previous && (lastResult === "retry" || lastResult === "already_placed")) return previous;
  return crypto.randomUUID().replaceAll("-", "");
}

/** Zone the bag quotes with: the ERP requires one when the country has active zones (the bag shows the subtotal only). */
export function bagQuoteZoneId(zones: DeliveryZone[] | null | undefined): number | null {
  return zones && zones.length > 0 ? zones[0].id : null;
}

/** A server-action call that never rejects: a failed request from the browser becomes a retryable status 0. */
export async function settle<T extends { status: number; data: unknown }>(call: Promise<T>): Promise<T | { status: 0; data: null }> {
  try {
    return await call;
  } catch {
    return { status: 0, data: null };
  }
}

/** The stored result only when it was quoted for the current inputs; otherwise it is stale and must not be shown or used. */
export function freshResult<R>(stored: { key: string; result: R } | null, key: string): R | null {
  return stored && stored.key === key ? stored.result : null;
}
