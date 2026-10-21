"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { recommendationsFor } from "@/lib/catalog";
import { discountLabel } from "@/lib/currency";
import { bagTotals, FREE_DELIVERY_OVER_KES, PROMO_CODES } from "@/lib/pricing";
import { removeLine, setLineQuantity, setPromoCode, useFormatPrice, useHydrated, useStore } from "@/lib/store";
import { Breadcrumbs } from "./breadcrumbs";
import { ButtonLink } from "./button-link";
import { OrderTotals } from "./order-totals";
import { ProductCard } from "./product-card";
import { QuantityStepper } from "./quantity-stepper";

export function BagView() {
  const { bag, promoCode } = useStore();
  const format = useFormatPrice();
  const totals = bagTotals(bag, promoCode);
  const [code, setCode] = useState("");
  const [codeMessage, setCodeMessage] = useState("");
  const hydrated = useHydrated();
  const recommendations = recommendationsFor(bag.map((line) => line.slug));

  const applyCode = () => {
    const normalised = code.trim().toUpperCase();
    if (PROMO_CODES[normalised]) {
      setPromoCode(normalised);
      setCodeMessage(`${Math.round(PROMO_CODES[normalised] * 100)}% off applied.`);
    } else {
      setCodeMessage("That code isn’t valid. Try ZION10.");
    }
  };

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
          <span className="text-body text-copy">{totals.count === 1 ? "1 item" : `${totals.count} items`}</span>
        </div>
      </section>

      <div className="mx-auto flex max-w-site flex-col gap-[clamp(24px,3.5vw,64px)] px-(--za-gutter) pt-[clamp(32px,4vw,56px)] pb-[clamp(56px,7vw,96px)] lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-[2] flex-col gap-[18px]">
          {totals.count > 0 && (
            <div className="flex flex-col gap-2.5 bg-tint px-[22px] py-[18px]">
              <span className="text-sm">
                {totals.freeDelivery
                  ? "You’ve unlocked free Nairobi delivery."
                  : `You’re ${format(FREE_DELIVERY_OVER_KES - totals.afterPromo)} away from free Nairobi delivery.`}
              </span>
              <div className="h-[3px] bg-white">
                <div
                  className="h-full bg-accent transition-[width] duration-500"
                  style={{ width: `${Math.min(100, Math.round((totals.afterPromo / FREE_DELIVERY_OVER_KES) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {totals.lines.map((line) => {
            const { product } = line;
            const href = `/products/${product.slug}`;
            return (
              <article
                key={line.id}
                className="grid grid-cols-[clamp(88px,14vw,150px)_minmax(0,1fr)] items-start gap-[clamp(16px,2.4vw,32px)] border border-line p-[clamp(14px,2vw,20px)] sm:grid-cols-[clamp(96px,14vw,150px)_minmax(0,1fr)_auto]"
              >
                <Link href={href} className="relative block aspect-product overflow-hidden bg-tint">
                  <Image src={product.image} alt={product.name} fill sizes="150px" className="object-cover object-top" />
                </Link>
                <div className="flex min-w-0 flex-col gap-2.5 pt-1">
                  <Link href={href} className="font-display text-[clamp(22px,2vw,28px)] leading-[1.1] font-medium hover:text-accent">
                    {product.name}
                  </Link>
                  <span className="text-sm text-muted">
                    Print: {line.print} · Size: UK {line.size}
                  </span>
                  {product.wasKes && (
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
                      On offer · {discountLabel(product.priceKes, product.wasKes)}
                    </span>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center gap-5">
                    <QuantityStepper value={line.quantity} onChange={(q) => setLineQuantity(line.id, q)} />
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="cursor-pointer text-small text-copy underline underline-offset-[3px] hover:text-accent"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 sm:hidden">
                    <LinePrice line={line} format={format} />
                  </div>
                </div>
                <div className="hidden flex-col items-end gap-1 pt-1.5 whitespace-nowrap sm:flex">
                  <LinePrice line={line} format={format} />
                </div>
              </article>
            );
          })}

          {hydrated && totals.count === 0 && (
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
            <OrderTotals totals={totals} promoCode={promoCode} />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyCode();
              }}
              className="mt-1.5 flex gap-2.5"
            >
              <label htmlFor="promo-code" className="sr-only">
                Promo code
              </label>
              <input
                id="promo-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Promo code"
                className="h-12 min-w-0 flex-1 border border-line-strong bg-white px-3.5 text-sm outline-none focus:border-ink"
              />
              <button
                type="submit"
                className="h-12 cursor-pointer border border-ink bg-white px-5 text-label uppercase tracking-[0.16em] hover:bg-ink hover:text-white"
              >
                Apply
              </button>
            </form>
            {codeMessage && (
              <span aria-live="polite" className="-mt-1.5 text-small text-copy">
                {codeMessage}
              </span>
            )}
            {totals.count > 0 ? (
              <ButtonLink href="/checkout" pad="h-(--za-control-lg)">
                Proceed to checkout
              </ButtonLink>
            ) : (
              <span className="flex h-(--za-control-lg) items-center justify-center bg-line-strong text-small uppercase tracking-button text-muted">
                Proceed to checkout
              </span>
            )}
            <span className="text-center text-small text-muted">M-Pesa · Visa · Mastercard · PayPal</span>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm text-copy">
            <li className="flex gap-2.5">
              <span aria-hidden className="text-accent">✓</span>Free returns within 14 days
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="text-accent">✓</span>Secure, encrypted checkout
            </li>
          </ul>
        </aside>
      </div>

      <section className="border-t border-line">
        <div className="mx-auto flex max-w-site flex-col gap-10 px-(--za-gutter) py-[clamp(56px,7vw,96px)]">
          <div className="flex flex-col gap-3.5">
            <span className="text-label font-normal uppercase tracking-[0.28em] text-accent">Complete the look</span>
            <h2 className="font-display text-h2">
              You might also <em>like</em>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-[clamp(16px,2vw,28px)] lg:grid-cols-4">
            {recommendations.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                titleClassName="text-[21px]"
                sizes="(min-width: 1024px) 25vw, 50vw"
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

type Line = ReturnType<typeof bagTotals>["lines"][number];

function LinePrice({ line, format }: { line: Line; format: (kes: number) => string }) {
  return (
    <>
      <span className="text-[17px] font-normal">{format(line.product.priceKes * line.quantity)}</span>
      {line.product.wasKes && (
        <span className="text-small text-subtle line-through">{format(line.product.wasKes * line.quantity)}</span>
      )}
    </>
  );
}
