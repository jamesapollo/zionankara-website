"use client";

import { useFormatPrice } from "@/lib/store";

type PriceProps = {
  priceKes: number;
  wasKes?: number;
  size?: "md" | "lg";
};

/** Price in the visitor's chosen currency; sale prices show in accent with the old price struck through. */
export function Price({ priceKes, wasKes, size = "md" }: PriceProps) {
  const format = useFormatPrice();
  const textSize = size === "lg" ? "text-[17px]" : "text-body";

  if (!wasKes) {
    return <span className={`${textSize} font-normal whitespace-nowrap`}>{format(priceKes)}</span>;
  }

  return (
    <span className="flex flex-col items-end gap-0.5 whitespace-nowrap">
      <span className={`${textSize} font-medium text-accent`}>{format(priceKes)}</span>
      <span className="text-small text-subtle line-through">{format(wasKes)}</span>
    </span>
  );
}
