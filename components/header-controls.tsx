"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { currencies, currencyLabels, type Currency } from "@/lib/currency";
import { erpBagCount } from "@/lib/erp-bag";
import { useErpBag } from "@/lib/erp-bag-store";
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

/**
 * `searchHref` is set only when the catalogue has somewhere to search (the ERP collections page).
 * `erp` counts the ERP bag; the local bag holds bundled-catalogue lines only.
 */
export function HeaderControls({ searchHref, erp = false }: { searchHref?: string; erp?: boolean }) {
  const { bag } = useStore();
  const erpBag = useErpBag();
  const pathname = usePathname();

  return (
    <>
      <CurrencySelect className="max-nav:hidden" />
      {searchHref && (
        <Link href={searchHref} className="hover:text-accent max-nav:hidden">
          Search
        </Link>
      )}
      <Link href="/bag" aria-current={pathname === "/bag" ? "page" : undefined} className={pathname === "/bag" ? "text-accent" : "hover:text-accent"}>
        Bag ({erp ? erpBagCount(erpBag) : bagCount(bag)})
      </Link>
    </>
  );
}
