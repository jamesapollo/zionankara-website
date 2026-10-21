"use client";

import { formatPrice } from "@/lib/currency";
import { useStore } from "@/lib/store";

type PriceProps = {
  priceKes: number;
  wasKes?: number;
  size?: "md" | "lg";
};

/** Price in the visitor's chosen currency; sale prices show in accent with the old price struck through. */
export function Price({ priceKes, wasKes, size = "md" }: PriceProps) {
  const { currency } = useStore();
  const textSize = size === "lg" ? "text-[17px]" : "text-body";

  if (!wasKes) {
    return <span className={`${textSize} font-normal whitespace-nowrap`}>{formatPrice(priceKes, currency)}</span>;
  }

  return (
    <span className="flex flex-col items-end gap-0.5 whitespace-nowrap">
      <span className={`${textSize} font-medium text-accent`}>{formatPrice(priceKes, currency)}</span>
      <span className="text-small text-subtle line-through">{formatPrice(wasKes, currency)}</span>
    </span>
  );
}
