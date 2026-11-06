"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDeliveryZones } from "@/app/(checkout)/checkout/actions";
import { bagQuoteZoneId } from "@/lib/checkout";
import type { DeliveryZone } from "@/lib/erp/types";
import { removeErpLine, setErpLineQuantity, useErpBag } from "@/lib/erp-bag-store";
import { erpBagCount } from "@/lib/erp-bag";
import { useHydrated } from "@/lib/store";
import { Breadcrumbs } from "./breadcrumbs";
import { ButtonLink } from "./button-link";
import { QuantityStepper } from "./quantity-stepper";
import { formatKes, kes, useErpQuote } from "./use-erp-quote";

/** The bag for ERP products: lines from the browser, prices and availability from the ERP. */
export function ErpBagView() {
  const bag = useErpBag();
  const hydrated = useHydrated();
  const format = formatKes;
  // The ERP needs a zone to quote when Kenya has active zones; the bag shows the subtotal only.
  const [zones, setZones] = useState<DeliveryZone[] | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    getDeliveryZones("KE")
      .catch(() => null)
      .then((z) => !cancelled && setZones(z));
    return () => {
      cancelled = true;
    };
  }, []);
  const { result, loading } = useErpQuote(zones === undefined ? [] : bag, "KE", bagQuoteZoneId(zones));
  const count = erpBagCount(bag);

  const quote = result?.kind === "ok" ? result.quote : null;
  const unavailable = new Set(result && result.kind !== "error" ? result.unavailable : []);
  const priced = new Map(quote?.lines.map((l) => [l.variant_id, l]) ?? []);
  const canCheckout = count > 0 && result?.kind === "ok" && unavailable.size === 0 && !loading;

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-site flex-wrap items-end justify-between gap-6 px-(--za-gutter) py-[clamp(28px,3.5vw,48px)]">
          <div className="flex flex-col gap-4">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bag" }]} />
            <h1 className="font-display text-[clamp(44px,5vw,72px)] leading-none">
              Your <em className="text-accent">bag</em>
            </h1>
          </div>
          <span className="text-body text-copy">{count === 1 ? "1 item" : `${count} items`}</span>
        </div>
      </section>

      <div className="mx-auto flex max-w-site flex-col gap-[clamp(24px,3.5vw,64px)] px-(--za-gutter) pt-[clamp(32px,4vw,56px)] pb-[clamp(56px,7vw,96px)] lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-[2] flex-col gap-[18px]">
          {bag.map((line) => {
            const href = `/products/${encodeURIComponent(line.slug)}`;
            const price = priced.get(line.variantId);
            const gone = unavailable.has(line.variantId);
            return (
              <article
                key={line.variantId}
                className="grid grid-cols-[clamp(88px,14vw,150px)_minmax(0,1fr)] items-start gap-[clamp(16px,2.4vw,32px)] border border-line p-[clamp(14px,2vw,20px)] sm:grid-cols-[clamp(96px,14vw,150px)_minmax(0,1fr)_auto]"
              >
                <Link href={href} className="relative block aspect-product overflow-hidden bg-tint">
                  {line.image && <Image src={line.image} alt={line.title} fill sizes="150px" className="object-cover object-top" />}
                </Link>
                <div className="flex min-w-0 flex-col gap-2.5 pt-1">
                  <Link href={href} className="font-display text-[clamp(22px,2vw,28px)] leading-[1.1] font-medium hover:text-accent">
                    {line.title}
                  </Link>
                  {line.label && <span className="text-sm text-muted">{line.label}</span>}
                  {gone && (
                    <span role="alert" className="text-sm text-error">
                      No longer available in this quantity. Lower the quantity or remove it.
                    </span>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center gap-5">
                    <QuantityStepper value={line.quantity} onChange={(q) => setErpLineQuantity(line.variantId, q)} />
                    <button
                      type="button"
                      onClick={() => removeErpLine(line.variantId)}
                      className="cursor-pointer text-small text-copy underline underline-offset-[3px] hover:text-accent"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="col-span-2 flex flex-col gap-1 pt-1.5 whitespace-nowrap sm:col-span-1 sm:items-end">
                  {price ? (
                    <>
                      <span className="text-[17px] font-normal">{format(kes(price.line_total.amount))}</span>
                      {price.unit_price_paid.amount !== price.unit_price.amount && (
                        <span className="text-small text-subtle line-through">{format(kes(price.unit_price.amount) * line.quantity)}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-small text-muted">{gone ? "—" : "…"}</span>
                  )}
                </div>
              </article>
            );
          })}

          {hydrated && count === 0 && (
            <div className="flex flex-col items-center gap-5 bg-tint px-6 py-20 text-center">
              <span className="font-display text-[34px]">Your bag is empty</span>
              <span className="text-body text-copy">Discover pieces cut from authentic Ankara prints.</span>
              <ButtonLink href="/collections" pad="px-[30px] py-4">
                Shop collections
              </ButtonLink>
            </div>
          )}

          <Link href="/collections" className="mt-3 self-start text-small font-normal uppercase tracking-[0.16em] hover:text-accent">
            ← Continue shopping
          </Link>
        </div>

        <aside className="flex min-w-0 flex-1 flex-col gap-[18px] lg:sticky lg:top-24">
          <div className="flex flex-col gap-[18px] border border-panel-border bg-panel p-[clamp(24px,2.6vw,36px)]">
            <span className="text-label font-medium uppercase tracking-label">Order summary</span>
            <div className="flex justify-between gap-3 text-body">
              <span>Subtotal</span>
              <span className="font-normal">{quote ? format(kes(quote.subtotal.amount)) : "—"}</span>
            </div>
            <div className="flex justify-between gap-3 text-body text-copy">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>
            {result?.kind === "error" && (
              <span role="alert" className="text-small text-error">
                {result.message}
              </span>
            )}
            {canCheckout ? (
              <ButtonLink href="/checkout" pad="h-(--za-control-lg)">
                Proceed to checkout
              </ButtonLink>
            ) : (
              <span className="flex h-(--za-control-lg) items-center justify-center bg-line-strong text-small uppercase tracking-button text-muted">
                Proceed to checkout
              </span>
            )}
            <span className="text-center text-small text-muted">No payment online — we&rsquo;ll contact you to confirm payment and delivery.</span>
          </div>
        </aside>
      </div>
    </>
  );
}
