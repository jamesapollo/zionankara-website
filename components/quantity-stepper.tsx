"use client";

import { MAX_QUANTITY } from "@/lib/store";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  size?: "md" | "lg";
};

export function QuantityStepper({ value, onChange, size = "md" }: QuantityStepperProps) {
  const button = `h-full cursor-pointer text-[17px] disabled:cursor-default disabled:opacity-30 ${size === "lg" ? "w-12" : "w-10"}`;

  return (
    <div className={`flex items-center border border-line-strong ${size === "lg" ? "h-(--za-control-lg)" : "h-(--za-control-sm)"}`}>
      <button type="button" aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(value - 1)} className={button}>
        −
      </button>
      <span aria-live="polite" className="w-8 text-center text-body">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= MAX_QUANTITY}
        onClick={() => onChange(value + 1)}
        className={button}
      >
        +
      </button>
    </div>
  );
}
