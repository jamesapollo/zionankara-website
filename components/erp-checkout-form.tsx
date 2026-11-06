"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDeliveryZones, submitOrder } from "@/app/(checkout)/checkout/actions";
import {
  CHECKOUT_COUNTRIES,
  classifyOrderResponse,
  nextIdempotencyKey,
  orderBody,
  PENDING_QUOTE,
  PRICES_CHANGED,
  validateBuyer,
  type BuyerErrors,
  type BuyerFields,
} from "@/lib/checkout";
import { clearErpBag, useErpBag } from "@/lib/erp-bag-store";
import type { DeliveryZone } from "@/lib/erp/types";
import { useFormatPrice, useHydrated } from "@/lib/store";
import { ButtonLink } from "./button-link";
import { ChoiceCard, fieldLabel, input, Step, TextField } from "./checkout-form";
import { kes, useErpQuote } from "./use-erp-quote";

const EMPTY: BuyerFields = { first: "", last: "", phone: "", email: "", address1: "", address2: "", city: "", region: "", postal: "", country: "KE" };

type Confirmation = { reference: string; firstName: string; phone: string; email: string };

/** Checkout for ERP products: delivery from the ERP's zones, totals from the ERP, no online payment. */
export function ErpCheckoutForm() {
  const bag = useErpBag();
  const hydrated = useHydrated();
  const format = useFormatPrice();
  const [fields, setFields] = useState<BuyerFields>(EMPTY);
  const [zones, setZones] = useState<DeliveryZone[] | null | undefined>(undefined); // undefined: loading
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [errors, setErrors] = useState<BuyerErrors>({});
  const [message, setMessage] = useState("");
  const [unavailable, setUnavailable] = useState<number[]>([]);
  const [placing, setPlacing] = useState(false);
  const [attempt, setAttempt] = useState<{ key: string | null; last: string | null }>({ key: null, last: null });
  const [refresh, setRefresh] = useState(0);
  const [done, setDone] = useState<Confirmation | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDeliveryZones(fields.country).then((z) => {
      if (cancelled) return;
      setZones(z);
      setZoneId(z && z.length > 0 ? z[0].id : null);
    });
    return () => {
      cancelled = true;
    };
  }, [fields.country]);

  const zonesReady = zones !== undefined;
  const pendingQuote = Array.isArray(zones) && zones.length === 0;
  const { result, loading } = useErpQuote(zonesReady ? bag : [], fields.country, zoneId, refresh);
  const quote = result?.kind === "ok" ? result.quote : null;
  const blocked = new Set([...unavailable, ...(result && result.kind !== "error" ? result.unavailable : [])]);

  const set = (key: keyof BuyerFields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const place = async () => {
    if (placing || !quote) return;
    const found = validateBuyer(fields, { pendingQuote, zoneRequired: !pendingQuote, zoneId });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage("Please check the highlighted fields.");
      return;
    }
    const key = nextIdempotencyKey(attempt.key, attempt.last);
    setPlacing(true);
    setMessage("");
    const reply = await submitOrder(orderBody(bag, fields, pendingQuote ? null : zoneId, quote.subtotal.amount), key);
    const outcome = classifyOrderResponse(reply.status, reply.data, bag);
    setAttempt({ key, last: outcome.kind });
    setPlacing(false);

    switch (outcome.kind) {
      case "placed":
        setDone({ reference: outcome.order.reference, firstName: fields.first.trim(), phone: fields.phone.trim(), email: fields.email.trim() });
        clearErpBag();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      case "prices_changed":
        setMessage(PRICES_CHANGED);
        setRefresh((n) => n + 1);
        return;
      case "out_of_stock":
        setUnavailable(outcome.unavailable);
        setMessage("Some items are no longer available in that quantity. Please update your bag.");
        return;
      case "invalid":
        setErrors(outcome.errors);
        setMessage(outcome.message ?? "Please check the highlighted fields.");
        return;
      default:
        setMessage(outcome.message);
    }
  };

  if (done) {
    return (
      <section className="mx-auto flex max-w-[760px] flex-col items-center gap-[22px] px-(--za-gutter) py-[clamp(64px,8vw,120px)] text-center">
        <span aria-hidden className="flex size-16 items-center justify-center rounded-full bg-tint text-[26px] text-accent">
          ✓
        </span>
        <span className="text-label font-normal uppercase tracking-[0.28em] text-accent">Order {done.reference}</span>
        <h2 className="font-display text-[clamp(40px,4.4vw,60px)] leading-[1.05]">Thank you, {done.firstName}.</h2>
        <p className="max-w-[480px] text-base leading-[1.75] text-copy">
          We&apos;ll contact you on {done.phone} to confirm payment and delivery.
          {done.email && ` A copy of your order has been sent to ${done.email}.`}
        </p>
        <ButtonLink href="/collections" pad="mt-3 px-[34px] py-[17px]">
          Continue shopping
        </ButtonLink>
      </section>
    );
  }

  if (!hydrated) return <div className="min-h-[60vh]" />;

  if (bag.length === 0) {
    return (
      <section className="mx-auto flex max-w-[760px] flex-col items-center gap-5 px-(--za-gutter) py-[clamp(64px,8vw,120px)] text-center">
        <span className="font-display text-[34px]">Your bag is empty</span>
        <span className="text-body text-copy">Add a piece or two before checking out.</span>
        <ButtonLink href="/collections" pad="px-[30px] py-4">
          Shop collections
        </ButtonLink>
      </section>
    );
  }

  const isKenya = fields.country === "KE";
  const canPlace = Boolean(quote) && !loading && !placing && blocked.size === 0 && zones !== null;
  const priced = new Map(quote?.lines.map((l) => [l.variant_id, l]) ?? []);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void place();
      }}
      className="mx-auto flex max-w-site flex-col gap-[clamp(24px,4vw,72px)] px-(--za-gutter) pt-[clamp(32px,4vw,56px)] pb-[clamp(64px,8vw,112px)] lg:flex-row lg:items-start"
    >
      <div className="flex min-w-0 flex-[2] flex-col">
        <Step number={1} title="Contact" className="pb-9">
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
            <TextField label="First name" value={fields.first} onChange={(v) => set("first", v)} error={errors.first} placeholder="Wanjiru" autoComplete="given-name" />
            <TextField label="Last name" value={fields.last} onChange={(v) => set("last", v)} error={errors.last} placeholder="Kamau" autoComplete="family-name" />
          </div>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
            <TextField
              label="Phone"
              type="tel"
              value={fields.phone}
              onChange={(v) => set("phone", v)}
              error={errors.phone}
              placeholder={isKenya ? "0712 345 678" : "+44 7700 900123"}
              autoComplete="tel"
            />
            <TextField
              label={pendingQuote ? "Email" : "Email (optional)"}
              type="email"
              value={fields.email}
              onChange={(v) => set("email", v)}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
        </Step>

        <Step number={2} title="Delivery address" className="py-9">
          <TextField
            label="Address"
            value={fields.address1}
            onChange={(v) => set("address1", v)}
            error={errors.address1}
            placeholder="Street and building"
            autoComplete="address-line1"
          />
          <TextField
            label="Apartment, house number (optional)"
            value={fields.address2}
            onChange={(v) => set("address2", v)}
            error={errors.address2}
            autoComplete="address-line2"
          />
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-3">
            <TextField label="Town / city" value={fields.city} onChange={(v) => set("city", v)} error={errors.city} placeholder="Nairobi" autoComplete="address-level2" />
            <TextField
              label={isKenya ? "County" : "State / region"}
              value={fields.region}
              onChange={(v) => set("region", v)}
              error={errors.region}
              placeholder={isKenya ? "Nairobi County" : "Region"}
              autoComplete="address-level1"
            />
            <TextField label="Postal code" value={fields.postal} onChange={(v) => set("postal", v)} error={errors.postal} placeholder="00100" autoComplete="postal-code" />
          </div>
          <label className="flex flex-col gap-2 sm:max-w-[50%]">
            <span className={fieldLabel}>Country</span>
            <select
              value={fields.country}
              autoComplete="country"
              onChange={(e) => {
                set("country", e.target.value);
                setZones(undefined);
              }}
              className={`${input} cursor-pointer px-3.5`}
            >
              {CHECKOUT_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </Step>

        <Step number={3} title="Delivery" className="border-b-0 pt-9">
          {zones === undefined && <p className="text-sm text-muted">Loading delivery options…</p>}
          {zones === null && (
            <p role="alert" className="text-sm text-error">
              We couldn&apos;t load delivery options. Please try again.
            </p>
          )}
          {pendingQuote && <p className="border border-panel-border bg-panel px-5 py-4 text-sm text-copy">{PENDING_QUOTE}</p>}
          {zones?.map((z) => (
            <ChoiceCard key={z.id} name="zone" checked={z.id === zoneId} onChange={() => setZoneId(z.id)}>
              <span className="flex-1 text-body font-normal">{z.name}</span>
              <span className="text-body font-normal">{kes(z.fee.amount) === 0 ? "Free" : format(kes(z.fee.amount))}</span>
            </ChoiceCard>
          ))}
          {errors.zone && <span className="text-small text-error">{errors.zone}</span>}
          <p className="text-sm leading-relaxed text-copy">
            No payment is taken online. We&apos;ll contact you to confirm payment and delivery.
          </p>
        </Step>
      </div>

      <aside className="flex min-w-0 flex-1 flex-col gap-[18px] lg:sticky lg:top-6">
        <div className="flex flex-col gap-[18px] border border-panel-border bg-panel p-[clamp(24px,2.6vw,36px)]">
          <span className="text-label font-medium uppercase tracking-label">Order summary</span>
          {bag.map((line) => {
            const price = priced.get(line.variantId);
            return (
              <div key={line.variantId} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4">
                <div className="relative aspect-product w-16 overflow-hidden bg-tint">
                  {line.image && <Image src={line.image} alt="" fill sizes="64px" className="object-cover object-top" />}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-display text-[19px] leading-[1.15] font-medium">{line.title}</span>
                  <span className="text-small text-muted">
                    Qty {line.quantity}
                    {line.label && ` · ${line.label}`}
                  </span>
                  {blocked.has(line.variantId) && <span className="text-small text-error">No longer available in that quantity</span>}
                </div>
                <span className="text-body font-normal whitespace-nowrap">{price ? format(kes(price.line_total.amount)) : "…"}</span>
              </div>
            );
          })}
          <div className="flex flex-col gap-3.5 border-t border-[#e8dada] pt-[18px] text-body">
            <div className="flex justify-between gap-3">
              <span>Subtotal</span>
              <span className="font-normal">{quote ? format(kes(quote.subtotal.amount)) : "—"}</span>
            </div>
            <div className="flex justify-between gap-3 text-copy">
              <span>Delivery</span>
              <span>
                {!quote ? "—" : quote.delivery_fee_pending ? "To be confirmed" : kes(quote.delivery.fee?.amount) === 0 ? "Free" : format(kes(quote.delivery.fee?.amount))}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-[#e8dada] pt-3.5 text-[19px]">
              <span>Total</span>
              <span className="font-normal">{quote ? format(kes(quote.grand_total.amount)) : "—"}</span>
            </div>
          </div>
          {result?.kind === "error" && (
            <p role="alert" className="text-small text-error">
              {result.message}
            </p>
          )}
          {message && (
            <p role="alert" className="text-small leading-relaxed text-error">
              {message}
            </p>
          )}
          {blocked.size > 0 && (
            <Link href="/bag" className="text-small underline underline-offset-[3px] hover:text-accent">
              Update your bag
            </Link>
          )}
          <button
            type="submit"
            disabled={!canPlace}
            className="h-[58px] cursor-pointer bg-ink text-small font-normal uppercase tracking-button text-white transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-muted"
          >
            {placing ? "Placing order…" : quote ? `Place order — ${format(kes(quote.grand_total.amount))}` : "Place order"}
          </button>
        </div>
      </aside>
    </form>
  );
}
