"use client";

import { useEffect, useState } from "react";
import { quoteCheckout } from "@/app/(checkout)/checkout/actions";
import { classifyQuote, type QuoteResult } from "@/lib/checkout";
import type { ErpBagLine } from "@/lib/erp-bag";

/**
 * Live ERP prices, availability and totals for the bag, re-fetched (debounced 300 ms) when the lines,
 * country or zone change. `null` while the first answer is loading or the bag is empty.
 * Bump `refresh` to re-quote with unchanged inputs (e.g. after "prices changed").
 */
export function useErpQuote(bag: ErpBagLine[], country: string, zoneId: number | null, refresh = 0) {
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify([bag.map((l) => [l.variantId, l.quantity]), country, zoneId, refresh]);

  useEffect(() => {
    if (bag.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const reply = await quoteCheckout({
        lines: bag.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
        country,
        delivery_zone_id: zoneId,
      });
      if (cancelled) return;
      setResult(classifyQuote(reply.status, reply.data, bag));
      setLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `key` captures every input; `bag` identity changes on each store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { result: bag.length === 0 ? null : result, loading };
}

/** KES number from an ERP Money amount string. */
export const kes = (amount: string | undefined | null) => Number(amount ?? 0);
