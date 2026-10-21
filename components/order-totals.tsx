"use client";

import type { bagTotals } from "@/lib/pricing";
import { useFormatPrice } from "@/lib/store";

type OrderTotalsProps = {
  totals: ReturnType<typeof bagTotals>;
  promoCode: string | null;
};

/** Subtotal → total rows shared by the bag and checkout summaries. */
export function OrderTotals({ totals, promoCode }: OrderTotalsProps) {
  const format = useFormatPrice();
  const row = "flex justify-between gap-3 text-body";

  return (
    <>
      <div className={row}>
        <span>Subtotal</span>
        <span className="font-normal">{format(totals.gross)}</span>
      </div>
      {totals.savings > 0 && (
        <div className={`${row} text-accent`}>
          <span>Offer savings</span>
          <span className="font-normal">−{format(totals.savings)}</span>
        </div>
      )}
      {totals.promo > 0 && (
        <div className={`${row} text-accent`}>
          <span>Promo {promoCode}</span>
          <span className="font-normal">−{format(totals.promo)}</span>
        </div>
      )}
      <div className={`${row} text-copy`}>
        <span>Delivery</span>
        <span>{totals.count === 0 ? "—" : totals.delivery === 0 ? "Free" : format(totals.delivery)}</span>
      </div>
      <div className={`${row} text-copy`}>
        <span>VAT (16%, included)</span>
        <span>{format(totals.vat)}</span>
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-[#e8dada] pt-5">
        <span className="text-base font-medium">Total</span>
        <span className="font-display text-[32px] font-medium">{format(totals.total)}</span>
      </div>
    </>
  );
}
