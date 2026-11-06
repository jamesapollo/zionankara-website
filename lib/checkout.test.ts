import { describe, expect, it } from "vitest";
import type { ErpBagLine } from "./erp-bag";
import {
  CHECKOUT_COUNTRIES,
  classifyOrderResponse,
  classifyQuote,
  nextIdempotencyKey,
  orderBody,
  validateBuyer,
  type BuyerFields,
} from "./checkout";

const kes = (amount: string) => ({ amount, currency: "KES" });
const line = (variantId: number, quantity = 1): ErpBagLine => ({
  variantId,
  slug: `p${variantId}`,
  title: `P${variantId}`,
  label: "M",
  image: null,
  quantity,
});
const bag = [line(11, 2), line(22)];

const fields: BuyerFields = {
  first: " Amina ",
  last: "Otieno",
  phone: "0712 345 678",
  email: "",
  address1: "12 Riverside Drive",
  address2: "",
  city: "Nairobi",
  region: "",
  postal: "",
  country: "KE",
};

const quoteLine = (variant_id: number, available = true) => ({
  variant_id,
  product_name: "P",
  variant_label: "M",
  sku: "S",
  quantity: 1,
  unit_price: kes("1000.00"),
  unit_price_paid: kes("1000.00"),
  line_total: kes("1000.00"),
  available,
});
const quote = (lines = [quoteLine(11), quoteLine(22)]) => ({
  data: {
    lines,
    subtotal: kes("3000.00"),
    delivery: { zone_name: "Nairobi", fee: kes("300.00"), pending_quote: false },
    grand_total: kes("3300.00"),
    delivery_fee_pending: false,
  },
});

describe("CHECKOUT_COUNTRIES", () => {
  it("lists Kenya first with readable names", () => {
    expect(CHECKOUT_COUNTRIES[0]).toEqual({ code: "KE", name: "Kenya" });
    expect(CHECKOUT_COUNTRIES.map((c) => c.code)).toContain("GB");
  });
});

describe("validateBuyer", () => {
  const opts = { pendingQuote: false, zoneRequired: true, zoneId: 3 };

  it("accepts a complete Kenyan buyer", () => {
    expect(validateBuyer(fields, opts)).toEqual({});
  });

  it("requires name, phone, address and city", () => {
    const errors = validateBuyer({ ...fields, first: " ", last: "", phone: "12", address1: "", city: "" }, opts);
    expect(Object.keys(errors).sort()).toEqual(["address1", "city", "first", "phone"]);
  });

  it("requires email and + phone when pending quote", () => {
    const pending = { pendingQuote: true, zoneRequired: false, zoneId: null };
    expect(Object.keys(validateBuyer(fields, pending)).sort()).toEqual(["email", "phone"]);
    expect(validateBuyer({ ...fields, phone: "+44 7700 900123", email: "a@b.co" }, pending)).toEqual({});
  });

  it("rejects a malformed email even when optional", () => {
    expect(validateBuyer({ ...fields, email: "nope" }, opts)).toHaveProperty("email");
  });

  it("requires a zone when the country has zones", () => {
    expect(validateBuyer(fields, { ...opts, zoneId: null })).toHaveProperty("zone");
  });
});

describe("orderBody", () => {
  it("joins the name and nulls empty optionals", () => {
    expect(orderBody(bag, fields, 3, "3000.00")).toEqual({
      lines: [
        { variant_id: 11, quantity: 2 },
        { variant_id: 22, quantity: 1 },
      ],
      buyer_name: "Amina Otieno",
      buyer_phone: "0712 345 678",
      buyer_email: null,
      address_line1: "12 Riverside Drive",
      address_line2: null,
      city: "Nairobi",
      region: null,
      postal_code: null,
      country: "KE",
      delivery_zone_id: 3,
      expected_subtotal: "3000.00",
    });
  });
});

describe("classifyQuote", () => {
  it("returns the quote when all lines are available", () => {
    expect(classifyQuote(200, quote(), bag)).toMatchObject({ kind: "ok", unavailable: [] });
  });

  it("classifyQuote flags unavailable and unknown lines", () => {
    expect(classifyQuote(200, quote([quoteLine(11, false), quoteLine(22)]), bag)).toMatchObject({
      kind: "ok",
      unavailable: [11],
    });
    const invalid = classifyQuote(422, { message: "x", errors: { "lines.1.variant_id": ["Gone."] } }, bag);
    expect(invalid).toMatchObject({ kind: "invalid", unavailable: [22] });
  });

  it("treats a failure as an error", () => {
    expect(classifyQuote(0, null, bag).kind).toBe("error");
    expect(classifyQuote(200, { data: {} }, bag).kind).toBe("error");
  });
});

describe("classifyOrderResponse", () => {
  it("returns the order on 201", () => {
    const order = { reference: "ZN7K-Q4M2-X9TD", status: "pending", subtotal: kes("1"), grand_total: kes("1"), delivery_fee_pending: false };
    expect(classifyOrderResponse(201, { data: order }, bag)).toEqual({ kind: "placed", order });
  });

  it("classifyOrderResponse maps prices_changed", () => {
    expect(classifyOrderResponse(409, { code: "prices_changed", message: "x" }, bag)).toEqual({ kind: "prices_changed" });
  });

  it("maps out_of_stock to variant ids", () => {
    const body = { code: "out_of_stock", lines: [{ variant_id: 11, can_buy: false }, { variant_id: 22, can_buy: true }] };
    expect(classifyOrderResponse(422, body, bag)).toEqual({ kind: "out_of_stock", unavailable: [11, 22] });
  });

  it("maps field errors", () => {
    const body = { message: "x", errors: { buyer_phone: ["Enter a valid phone number."], postal_code: ["Too long."], delivery_zone_id: ["Pick one."] } };
    expect(classifyOrderResponse(422, body, bag)).toEqual({
      kind: "invalid",
      errors: { phone: "Enter a valid phone number.", postal: "Too long.", zone: "Pick one." },
    });
  });

  it("maps a line error to unavailable lines", () => {
    const body = { message: "x", errors: { "lines.0.variant_id": ["Gone."] } };
    expect(classifyOrderResponse(422, body, bag)).toEqual({ kind: "out_of_stock", unavailable: [11] });
  });

  it("treats 503 and network failure as retry", () => {
    expect(classifyOrderResponse(503, null, bag).kind).toBe("retry");
    expect(classifyOrderResponse(0, null, bag).kind).toBe("retry");
  });

  it("maps rate limiting and idempotency conflicts", () => {
    expect(classifyOrderResponse(429, {}, bag)).toEqual({
      kind: "error",
      message: "You've placed a few orders — please try again in a little while.",
    });
    expect(classifyOrderResponse(409, { code: "idempotency_conflict" }, bag).kind).toBe("error");
  });
});

describe("nextIdempotencyKey", () => {
  it("keeps the key after a transient failure", () => {
    expect(nextIdempotencyKey("a".repeat(32), "retry")).toBe("a".repeat(32));
  });
  it("makes a new 32-char key otherwise", () => {
    const key = nextIdempotencyKey("a".repeat(32), "error");
    expect(key).toMatch(/^[A-Za-z0-9]{32}$/);
    expect(key).not.toBe("a".repeat(32));
    expect(nextIdempotencyKey(null, "retry")).toMatch(/^[A-Za-z0-9]{32}$/);
  });
});
