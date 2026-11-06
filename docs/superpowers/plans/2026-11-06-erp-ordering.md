# ERP Ordering (no online payment) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Under `CATALOGUE_SOURCE=erp`, shoppers add ERP products to the bag and place real orders in the ERP; payment and delivery are confirmed later by the owner on WhatsApp or phone.

**Architecture:** The ERP exposes each variant's `id` on the storefront product endpoint. The site keeps a separate ERP bag in localStorage (variant id + display snapshot), and three server actions call the signed ERP endpoints: delivery zones, checkout validate (live totals) and place order (with an `Idempotency-Key`). The ERP is the source of truth for prices, stock, delivery fees and totals; the browser never computes a payable total.

**Tech Stack:** Next.js 16.4 App Router (Cache Components), React 19, TypeScript, Vitest; ERP: Laravel + Pest (`/Users/jamesapollo/projects/erp/commerce-erp-api`).

**Spec:** ERP `docs/superpowers/specs/2026-10-21-stage-5-orders-design.md` (O3 buyer fields, O7 reference, O8 place order, O9 zones + validate, O15 emails), plus the decision of 2026-11-06: **option 1 — no online payment; orders go live and the owner confirms payment and delivery outside the system.**

## Global Constraints

- No payment step, no promo codes, no VAT row and no free-delivery bar in ERP mode; the local (`CATALOGUE_SOURCE=local`) bag and checkout stay exactly as they are.
- All ERP calls go through `erpPost` / signed requests from server actions; no ERP URL or secret reaches the browser.
- Prices, line totals, delivery fee and grand total shown at checkout come from the ERP's `checkout/validate` response, displayed as KES via `useFormatPrice` (amount strings parsed with `Number()`).
- ERP limits: 1–50 lines, quantity 1–99 per line (site keeps its own cap `MAX_QUANTITY = 10`); `buyer_name` ≤120, `buyer_phone` 7–15 digits with optional leading `+` (leading `+` required when delivery is pending quote), `buyer_email` optional (required when delivery is pending quote), `address_line1` ≤255 required, `address_line2` ≤255, `city` ≤120 required, `region` ≤120, `postal_code` ≤20, `country` ISO-2 required, `delivery_zone_id` required when the country has active zones and absent otherwise.
- `Idempotency-Key`: 16–64 chars of `[A-Za-z0-9_-]`.
- Confirmation copy (exact): heading `Thank you, {firstName}.`; eyebrow `Order {reference}`; body `We'll contact you on {phone} to confirm payment and delivery.` followed, only when an email was given, by ` A copy of your order has been sent to {email}.`
- Pending-quote copy (exact): `We'll contact you with the delivery cost.`
- Bag storage key for the ERP bag: `zionankara:erp-bag:v1` (separate from the local `zionankara:store:v2`).

## Review Focus

1. **A bag line whose product was unpublished, repriced or deleted in the ERP** — the bag must still render, validate must flag it, and the shopper can remove it; checkout must not submit until it is resolved. (Task 4 test `classifyQuote flags unavailable and unknown lines`.)
2. **Double click / slow network on "Place order"** — exactly one order: the button disables while pending, and a retry after a network failure or 5xx reuses the same idempotency key. (Task 4 test `nextIdempotencyKey keeps the key after a transient failure`.)
3. **A country with no delivery zones** (e.g. GB) — no zone radio, `We'll contact you with the delivery cost.`, email becomes required and the phone must start with `+`. (Task 4 test `validateBuyer requires email and + phone when pending quote`.)
4. **Prices change between bag and order** — 409 `prices_changed` refreshes the quote and shows `Prices have changed. Please review your order.`; no order is placed. (Task 4 test `classifyOrderResponse maps prices_changed`.)
5. **Leftover local bag lines from before the ERP switch** — they are never shown or sent in ERP mode, and the header count reflects the ERP bag only. (Task 2 test `parseErpBag drops malformed lines`; Task 5 header uses the ERP bag count.)

---

### Task 1: ERP — expose variant id on the storefront product

Repo: `/Users/jamesapollo/projects/erp/commerce-erp-api`.

**Files:**
- Modify: `app/Modules/Catalog/Http/Resources/Storefront/StorefrontProductResource.php:80-86` (variants map)
- Modify: `docs/api/openapi.yaml` (storefront product variant schema: add required integer `id`)
- Test: `tests/Feature/Catalog/Storefront/StorefrontProductTest.php`

**Interfaces:**
- Produces: `GET /api/v1/storefront/products/{slug}` → `data.variants[]` = `{ id: int, sku, price, option_value_ids, in_stock }`. `id` is the `variant_id` that `POST /checkout/validate` and `POST /orders` accept.

- [ ] **Step 1: Write the failing test** — in the existing product-show test (line ~100), add `->and($response->json('data.variants.0.id'))->toBe($variant->id)` using the variant the test creates (the `SCARF` variant).
- [ ] **Step 2: Run it** — `php artisan test --filter=StorefrontProductTest` → FAIL (`null` is not identical to …).
- [ ] **Step 3: Add `'id' => (int) $variant->id,` as the first key of the variant array**, and add `id` (integer, required) to the variant schema in `docs/api/openapi.yaml`.
- [ ] **Step 4: Run** `php artisan test --filter='StorefrontProductTest|OpenApiContractTest'` → PASS, then `composer test` → all pass.
- [ ] **Step 5: Commit** — `git commit -m "feat(storefront): expose variant id on the product endpoint for checkout"`.

---

### Task 2: Website — ERP types, variant id and the ERP bag store

**Files:**
- Modify: `lib/erp/types.ts` (`Variant` gains `id: number`; add checkout types below)
- Create: `lib/erp-bag.ts` (pure helpers), `lib/erp-bag-store.ts` (client store)
- Test: `lib/erp-bag.test.ts`

**Interfaces:**
- Produces (types in `lib/erp/types.ts`):
  - `DeliveryZone = { id: number; name: string; fee: Money }`
  - `QuoteLine = { variant_id: number; product_name: string; variant_label: string; sku: string; quantity: number; unit_price: Money; unit_price_paid: Money; line_total: Money; available: boolean }`
  - `CheckoutQuote = { lines: QuoteLine[]; subtotal: Money; delivery: { zone_name: string | null; fee: Money | null; pending_quote: boolean }; grand_total: Money; delivery_fee_pending: boolean }`
  - `PlacedOrder = { reference: string; status: string; subtotal: Money; grand_total: Money; delivery_fee_pending: boolean }` (other response fields ignored)
  - `OrderBody = { lines: { variant_id: number; quantity: number }[]; buyer_name: string; buyer_phone: string; buyer_email: string | null; address_line1: string; address_line2: string | null; city: string; region: string | null; postal_code: string | null; country: string; delivery_zone_id: number | null; expected_subtotal: string }`
- Produces — pure helpers in `lib/erp-bag.ts` (no React, imported by tests), store in `lib/erp-bag-store.ts` (`"use client"`):
  - `type ErpBagLine = { variantId: number; slug: string; title: string; label: string; image: string | null; quantity: number }`
  - `parseErpBag(raw: unknown): ErpBagLine[]` — keeps only well-formed lines, clamps quantity to 1..`MAX_QUANTITY`, merges duplicates by `variantId`, caps at 50 lines.
  - `addErpLine(bag: ErpBagLine[], line: ErpBagLine): ErpBagLine[]` — merges by `variantId`, quantity capped at `MAX_QUANTITY` (import from `lib/store`).
  - `useErpBag(): ErpBagLine[]`, `addToErpBag(line)`, `setErpLineQuantity(variantId, q)`, `removeErpLine(variantId)`, `clearErpBag()` — same `useSyncExternalStore` + localStorage pattern as `lib/store.ts`, key `zionankara:erp-bag:v1`, server snapshot `[]`.

- [ ] **Step 1: Write failing tests** in `lib/erp-bag.test.ts`:
  - `parseErpBag drops malformed lines` — input `[{variantId:1,slug:"a",title:"A",label:"M",image:null,quantity:2}, {slug:"b"}, "x", {variantId:"2",…}]` → only the first line; non-array input → `[]`.
  - `parseErpBag merges duplicates and clamps quantity` — two lines with `variantId: 1`, quantities 7 and 6 → one line, quantity 10; quantity 0 → dropped.
  - `addErpLine merges by variant id and caps at MAX_QUANTITY`.
- [ ] **Step 2: Run** `npx vitest run lib/erp-bag.test.ts` → FAIL (module not found).
- [ ] **Step 3: Implement** the types, `lib/erp-bag.ts` and `lib/erp-bag-store.ts`.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit` → PASS (fix any `Variant` fixtures in existing tests by adding `id`).
- [ ] **Step 5: Commit** — `feat(erp): variant id type and ERP bag store`.

---

### Task 3: Website — signed checkout server actions

**Files:**
- Modify: `lib/erp/client.ts` (`erpPost` opts gain `headers?: Record<string, string>`, merged into the request headers; signature unchanged)
- Create: `app/(checkout)/checkout/actions.ts` (`"use server"`)
- Test: `lib/erp/client.test.ts` (extra header is sent)

**Interfaces:**
- Consumes: types from Task 2; `erpPost`, `erpGet`-style signed GET, `shopperIp` from `lib/erp/client.ts`.
- Produces (server actions):
  - `getDeliveryZones(country: string): Promise<DeliveryZone[] | null>` — signed GET `/api/v1/storefront/delivery-zones?country=XX` with the shopper IP, uncached (`no-store`); `null` on any failure. Reject anything not `/^[A-Z]{2}$/` without calling the ERP.
  - `quoteCheckout(input: { lines: { variant_id: number; quantity: number }[]; country: string; delivery_zone_id: number | null }): Promise<{ status: number; data: unknown }>` — POST `/api/v1/storefront/checkout/validate`; returns raw status + body for Task 4's classifiers; throws nothing (network failure → `{ status: 0, data: null }`).
  - `submitOrder(body: OrderBody, idempotencyKey: string): Promise<{ status: number; data: unknown }>` — POST `/api/v1/storefront/orders` with header `Idempotency-Key`; same failure contract. Logs status only on unexpected statuses (never buyer fields), like `app/(shop)/contact/actions.ts`.
- `erpGet` currently uses the no-shopper IP and throws on non-2xx; add `erpGetLive<T>(path, { clientIp })` in `client.ts` that sends the real shopper IP and returns `{ status, data }` like `erpPost`.

- [ ] **Step 1: Write failing test** in `lib/erp/client.test.ts`: `erpPost sends extra headers` — stub `fetch`, call `erpPost("/x", {}, { clientIp: "1.2.3.4", headers: { "Idempotency-Key": "k".repeat(16) } })`, assert the request's `Idempotency-Key` header and that `X-Storefront-Signature` is still present. Add `erpGetLive returns status and body without throwing on 404`.
- [ ] **Step 2: Run** `npx vitest run lib/erp/client.test.ts` → FAIL.
- [ ] **Step 3: Implement** the `headers` option, `erpGetLive`, and the three actions.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit && npx eslint app lib` → PASS.
- [ ] **Step 5: Commit** — `feat(checkout): signed server actions for zones, quote and order`.

---

### Task 4: Website — checkout rules (pure, fully tested)

**Files:**
- Create: `lib/checkout.ts`
- Test: `lib/checkout.test.ts`

**Interfaces:**
- Consumes: types from Task 2.
- Produces:
  - `CHECKOUT_COUNTRIES: { code: string; name: string }[]` — `KE` first, then `UG TZ RW NG GH ZA GB US CA AE DE FR NL SE`; names via `Intl.DisplayNames(["en"], { type: "region" })`.
  - `type BuyerFields = { first: string; last: string; phone: string; email: string; address1: string; address2: string; city: string; region: string; postal: string; country: string }`
  - `type BuyerErrors = Partial<Record<keyof BuyerFields | "zone", string>>`
  - `validateBuyer(f: BuyerFields, opts: { pendingQuote: boolean; zoneRequired: boolean; zoneId: number | null }): BuyerErrors` — limits from Global Constraints; phone digits counted after stripping spaces and dashes.
  - `orderBody(bag: ErpBagLine[], f: BuyerFields, zoneId: number | null, expectedSubtotal: string): OrderBody` — `buyer_name = "${first} ${last}"` trimmed; empty optionals → `null`.
  - `classifyQuote(status: number, data: unknown, bag: ErpBagLine[]): { kind: "ok"; quote: CheckoutQuote; unavailable: number[] } | { kind: "invalid"; unavailable: number[]; message: string } | { kind: "error"; message: string }` — `unavailable` = variant ids with `available: false`, plus ids named by 422 `errors["lines.N.variant_id"]` (map N back to `bag[N]`).
  - `classifyOrderResponse(status: number, data: unknown, bag: ErpBagLine[]): { kind: "placed"; order: PlacedOrder } | { kind: "prices_changed" } | { kind: "out_of_stock"; unavailable: number[] } | { kind: "invalid"; errors: BuyerErrors; message?: string } | { kind: "retry"; message: string } | { kind: "error"; message: string }` — 201 → placed; 409 `prices_changed`; 409 `idempotency_conflict` → error with fresh-key semantics; 422 `out_of_stock` → ids with `can_buy: false`; 422 validation → map `buyer_name→first`, `buyer_phone→phone`, `buyer_email→email`, `address_line1→address1`, `address_line2→address2`, `city`, `region`, `postal_code→postal`, `country`, `delivery_zone_id→zone`; 429 → `You've placed a few orders — please try again in a little while.`; 0 or ≥500 → `retry` `We couldn't reach the shop. Please try again.`
  - `nextIdempotencyKey(previous: string | null, lastResult: string | null): string` — reuse `previous` when `lastResult === "retry"`, otherwise a new `crypto.randomUUID().replaceAll("-", "")` (32 chars).

- [ ] **Step 1: Write failing tests** — one `it` per Review Focus line plus the mappings:
  - `validateBuyer requires email and + phone when pending quote` — `pendingQuote: true`, email `""`, phone `"0712 345 678"` → errors on `email` and `phone`; with `"+254 712 345 678"` and an email → no errors.
  - `validateBuyer requires a zone when the country has zones` → `zone` error when `zoneRequired && zoneId === null`.
  - `orderBody joins the name and nulls empty optionals`.
  - `classifyQuote flags unavailable and unknown lines` — one `available: false` line, and a 422 with `errors: {"lines.1.variant_id": ["…"]}` → `unavailable` contains both ids.
  - `classifyOrderResponse maps prices_changed`, `… maps out_of_stock to variant ids`, `… maps field errors`, `… treats 503 and network failure as retry`, `… returns the order on 201`.
  - `nextIdempotencyKey keeps the key after a transient failure` and `… makes a new 32-char key otherwise`.
- [ ] **Step 2: Run** `npx vitest run lib/checkout.test.ts` → FAIL.
- [ ] **Step 3: Implement** `lib/checkout.ts`.
- [ ] **Step 4: Run** `npx vitest run` → PASS.
- [ ] **Step 5: Commit** — `feat(checkout): order rules, response classification and idempotency`.

---

### Task 5: Website — add to bag on ERP product pages, ERP bag page, header count

**Files:**
- Modify: `components/erp-product.tsx:105-111` (replace the disabled button)
- Create: `components/erp-bag-view.tsx`
- Modify: `app/(shop)/bag/page.tsx` (ERP → `<ErpBagView />` instead of `OrderingPaused`)
- Modify: `components/header-controls.tsx`, `components/site-header.tsx` (pass `erp: boolean`; count `useErpBag()` when true)
- Modify: `components/mobile-menu.tsx` if it shows a bag count (same rule)

**Interfaces:**
- Consumes: Task 2 store; Task 3 `quoteCheckout`; Task 4 `classifyQuote`.

- [ ] **Step 1: Product page.** When the selection resolves to one variant (`option_value_ids` match) that is `in_stock`, show a `QuantityStepper` and an `Add to bag` button calling `addToErpBag({ variantId, slug, title: product.title, label: chosen values joined with " / ", image: main or selected photo url, quantity })`, then show `Added to your bag` with a `View bag` link. No full selection → button disabled with label `Choose {first unchosen option type}`; sold out → disabled `Sold out`. Keep the `Ask about this piece` link.
- [ ] **Step 2: Bag page.** `ErpBagView` lists lines from the ERP bag (image, title, label, stepper, remove), then calls `quoteCheckout({ lines, country: "KE", delivery_zone_id: null })` on mount and whenever lines change (debounce 300 ms); shows ERP line totals and `Subtotal`, marks unavailable lines `No longer available` with a remove action, and shows `Delivery: calculated at checkout`. `Checkout` button disabled while any line is unavailable or the quote failed (`We couldn't load current prices. Please refresh.`). No promo, VAT, free-delivery bar or local recommendations.
- [ ] **Step 3: Header.** `SiteHeader` passes `erp={catalogueSource() === "erp"}`; `HeaderControls` shows `Bag ({n})` from the ERP bag when `erp`.
- [ ] **Step 4: Verify in the browser** against a local ERP (`CATALOGUE_SOURCE=erp`, `npm run dev`): add two variants of one product and one of another → header shows the right count, bag shows ERP prices; reload keeps the bag; with the local catalogue (`CATALOGUE_SOURCE=local`) the old bag still works.
- [ ] **Step 5: Run** `npx tsc --noEmit && npx eslint app components lib && npx vitest run` → PASS; **commit** `feat(bag): add to bag and bag page for ERP products`.

---

### Task 6: Website — ERP checkout and confirmation

**Files:**
- Create: `components/erp-checkout-form.tsx`
- Modify: `app/(checkout)/checkout/page.tsx` (ERP → `<ErpCheckoutForm />`)
- Delete: `components/ordering-paused.tsx` once nothing imports it
- Modify: `README.md` (replace "Under `erp`, the bag and checkout show 'Online ordering is coming soon'" with how ERP ordering works, the no-payment rule, and a pre-launch checklist line: delivery zones exist for KE in the ERP; a test order reaches the owner's inbox)

**Interfaces:**
- Consumes: Task 2 store; Task 3 `getDeliveryZones`, `quoteCheckout`, `submitOrder`; Task 4 everything.

- [ ] **Step 1: Form.** Fields: first, last, phone, email (label `Email (optional)` unless pending quote), address line 1, address line 2, town/city, county/region, postal code, country select from `CHECKOUT_COUNTRIES` (default `KE`). On country change call `getDeliveryZones`; zones → radio list `{name} — {fee}`; empty → `We'll contact you with the delivery cost.`; `null` → `We couldn't load delivery options. Please try again.` and Place order disabled.
- [ ] **Step 2: Summary.** Re-quote on country/zone/bag change (debounced); summary shows ERP lines, subtotal, delivery (fee or `To be confirmed`), total, and the note `No payment is taken online. We'll contact you to confirm payment and delivery.`
- [ ] **Step 3: Place order.** `validateBuyer` → errors inline; otherwise `key = nextIdempotencyKey(prevKey, lastKind)`, button disabled with `Placing order…`, `submitOrder(orderBody(...), key)`, then `classifyOrderResponse`: placed → `clearErpBag()` and confirmation (exact copy in Global Constraints); `prices_changed` → re-quote + `Prices have changed. Please review your order.`; `out_of_stock` → mark lines `No longer available in that quantity` and link back to the bag; `invalid` → inline errors; `retry`/`error` → message, keeping the form.
- [ ] **Step 4: Verify against a local ERP**: place a KE order with a zone → confirmation shows a `XXXX-XXXX-XXXX` reference, the order appears in the ERP dashboard with the right lines and fee, the owner alert email is queued; place a GB order → no zones, email required, `+` phone required, order created with pending quote; click Place order twice fast → one order; change a price in the ERP between bag and order → prices-changed message, no order.
- [ ] **Step 5: Run** `npx tsc --noEmit && npx eslint app components lib && npx vitest run && npx next build` → PASS; **commit** `feat(checkout): place ERP orders without online payment`.
