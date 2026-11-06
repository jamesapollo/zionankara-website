"use client";

import { useEffect, useState } from "react";
import { quoteCheckout } from "@/app/(checkout)/checkout/actions";
import { classifyQuote, freshResult, settle, type QuoteResult } from "@/lib/checkout";
import type { ErpBagLine } from "@/lib/erp-bag";
import { formatPrice } from "@/lib/currency";

/**
 * Live ERP prices, availability and totals for the bag, re-fetched (debounced 300 ms) when the lines,
 * country or zone change. A result is only returned for the inputs it was quoted for, so a stale total is
 * never shown or used; `loading` is true from the moment the inputs change until the matching answer arrives.
 * Bump `refresh` to re-quote with unchanged inputs (e.g. after "prices changed").
 */
export function useErpQuote(bag: ErpBagLine[], country: string, zoneId: number | null, refresh = 0) {
  const [stored, setStored] = useState<{ key: string; result: QuoteResult } | null>(null);
  const key = JSON.stringify([bag.map((l) => [l.variantId, l.quantity]), country, zoneId, refresh]);

  useEffect(() => {
    if (bag.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const reply = await settle(
        quoteCheckout({
          lines: bag.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
          country,
          delivery_zone_id: zoneId,
        }),
      );
      if (!cancelled) setStored({ key, result: classifyQuote(reply.status, reply.data, bag) });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `key` captures every input; `bag` identity changes on each store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (bag.length === 0) return { result: null, loading: false };
  const result = freshResult(stored, key);
  return { result, loading: result === null };
}

/** KES number from an ERP Money amount string. */
export const kes = (amount: string | undefined | null) => Number(amount ?? 0);

/** ERP orders are in KES: totals the buyer commits to are always shown in KES, whatever display currency is chosen. */
export const formatKes = (amount: number) => formatPrice(amount, "KES");
