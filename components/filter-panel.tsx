"use client";

import { useState, type ReactNode } from "react";

/** Mobile "Filters" toggle around a server-rendered filter menu; always open from the lg breakpoint. */
export function FilterPanel({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="collection-filters"
        className="flex h-(--za-control-sm) cursor-pointer items-center justify-center border border-ink text-small uppercase tracking-button lg:hidden"
      >
        {open ? "Hide filters" : `Filters${activeCount ? ` (${activeCount})` : ""}`}
      </button>
      <aside
        id="collection-filters"
        className={`${open ? "flex" : "hidden"} flex-col gap-8 lg:sticky lg:top-24 lg:flex lg:w-[260px] lg:shrink-0`}
      >
        {children}
      </aside>
    </>
  );
}
