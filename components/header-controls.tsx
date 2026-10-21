"use client";

import Link from "next/link";
import { currencies, currencyLabels, type Currency } from "@/lib/currency";
import { bagCount, setCurrency, useStore } from "@/lib/store";

export function CurrencySelect({ className = "" }: { className?: string }) {
  const { currency } = useStore();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as Currency)}
      aria-label="Currency"
      className={`cursor-pointer bg-transparent py-1 text-[13px] tracking-[0.14em] uppercase ${className}`}
    >
      {currencies.map((code) => (
        <option key={code} value={code}>
          {currencyLabels[code]}
        </option>
      ))}
    </select>
  );
}

export function HeaderControls() {
  const { bag } = useStore();

  return (
    <>
      <CurrencySelect className="hidden md:block" />
      <Link href="/search" className="hidden hover:text-accent md:inline">
        Search
      </Link>
      <Link href="/bag" className="hover:text-accent">
        Bag ({bagCount(bag)})
      </Link>
    </>
  );
}
